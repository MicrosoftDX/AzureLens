// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.

using AzureLens.Models.DB;
using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Client;
using Microsoft.Azure.Documents.Linq;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Web;

namespace AzureLens.Database.DocumentDB
{
    internal class DocumentDBContext : IDisposable
    {
        private DocumentClient _client;
        private Microsoft.Azure.Documents.Database _database;
        private Mutex _lockMutex = new Mutex();

        private static string QueryByFilter = "QueryByFilter";

        public DocumentDBContext(string collectionName = "")
        {
            CollectionName = collectionName;
            ConnectionUrl = ConfigurationManager.AppSettings["DocumentDBURI"];
            ConnectionKey = ConfigurationManager.AppSettings["DocumentDBKey"];
            DatabaseName = ConfigurationManager.AppSettings["DocumentDBName"];
        }

        public string CollectionName { get; set; }

        private string ConnectionUrl { get; set; }
        private string ConnectionKey { get; set; }
        private string DatabaseName { get; set; }
        private bool IsConnected { get; set; }

        public void Dispose()
        {
            if (_client != null)
            {
                _client.Dispose();
                _client = null;
            }
        }

        public async Task<string> InsertOrUpdateItemAsync(string collectionName, string jsonDocument)
        {
            string diagramId = string.Empty;
            var collection = await GetCollectionAsync(collectionName);
            if (collection == null)
            {
                return null;
            }

            try
            {
                Document document;
                dynamic parsedDocument = JObject.Parse(jsonDocument);
                //parsedDocument.id = Guid.NewGuid();
                string docId = parsedDocument.id;
                dynamic dbDoc = _client.CreateDocumentQuery(collection.SelfLink).Where(d => d.Id == docId).AsEnumerable().FirstOrDefault();
                if (dbDoc == null)
                {
                    document = await _client.CreateDocumentAsync(collection.SelfLink, parsedDocument);
                }
                else
                {
                    dynamic existingItem = dbDoc;
                    existingItem = parsedDocument;
                    document = await _client.ReplaceDocumentAsync(dbDoc.SelfLink, existingItem);
                }
                diagramId = document.Id;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine(ex.ToString());
                throw ex;
                
            }
            return diagramId;
        }

        public async Task<bool> DeleteItemAsync(string collectionName, string diagramId)
        {
            var result = false;

            var collection = await GetCollectionAsync(collectionName);
            if (collection == null)
            {
                return result;
            }

            try
            {
                dynamic doc = _client.CreateDocumentQuery(collection.SelfLink).Where(d => d.Id == diagramId).AsEnumerable().FirstOrDefault();
                if (doc == null)
                {
                    result = false;
                }
                else
                {
                    var document = await _client.DeleteDocumentAsync(doc.SelfLink);
                    result = document != null;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine(ex.ToString());
            }

            return result;
        }

        public async Task<List<dynamic>> GetItemsByPropertyAsync<TItem>(string propertyName, string propertyValue)
        {
            List<dynamic> results = new List<dynamic>();
            var collection = await GetCollectionAsync(CollectionName);
            if (collection == null)
            {
                return results;
            }

            try
            {
                StoredProcedure sproc = null;
                sproc = _client.CreateStoredProcedureQuery(collection.StoredProceduresLink, String.Format("select * from root r where r.id = '{0}'", QueryByFilter)).ToList().FirstOrDefault();
                if (sproc == null)
                {
                    sproc = await RegisterQueryByFilterStoredProc(collection);
                    if (sproc == null)
                    {
                        return results;
                    }
                }
                var filterQuery = string.Format(CultureInfo.InvariantCulture, "SELECT * FROM root r where r.{0} = '{1}'", propertyName, propertyValue);
                int? continuationToken = null;

                do
                {
                    var response = await _client.ExecuteStoredProcedureAsync<FilterResult>(sproc.SelfLink, filterQuery, continuationToken);

                    continuationToken = response.Response.Continuation;
                    foreach (var doc in response.Response.Result)
                    {
                        results.Add(doc);
                    }
                } while (continuationToken != null);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine(ex.ToString());
            }

            return results;
        }

        public async Task<dynamic> GetItemAsync<TItem>(string id, string collectionId)
        {
            TItem result = default(TItem);
            var collection = await GetCollectionAsync(collectionId);
            if (collection == null)
            {
                return result;
            }

            try
            {
                dynamic dbDoc = _client.CreateDocumentQuery(collection.SelfLink).Where(d => d.Id == id).AsEnumerable().FirstOrDefault();
                if (dbDoc != null)
                {
                    result = dbDoc;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine(ex.ToString());
            }

            return result;
        }

        private async Task ConnectAsync()
        {
            _lockMutex.WaitOne();
            if (_client == null)
            {
                IsConnected = false;
                if (string.IsNullOrEmpty(ConnectionUrl))
                {
                    throw new ArgumentNullException(nameof(ConnectionUrl));
                }
                if (string.IsNullOrWhiteSpace(ConnectionKey))
                {
                    throw new ArgumentNullException(nameof(ConnectionKey));
                }
                if (string.IsNullOrWhiteSpace(DatabaseName))
                {
                    throw new ArgumentNullException(nameof(DatabaseName));
                }
                try
                {
                    _client = new DocumentClient(new Uri(ConnectionUrl), ConnectionKey);
                    _database = await GetOrCreateDatabaseAsync(DatabaseName);
                    IsConnected = true;
                }
                catch (DocumentClientException de)
                {
                    var baseException = de.GetBaseException();
                    Debug.WriteLine("{0} error occurred: {1}, Message: {2}", de.StatusCode, de.Message, baseException.Message);
                    _client = null;
                }
                catch (Exception e)
                {
                    var baseException = e.GetBaseException();
                    Debug.WriteLine("Error: {0}, Message: {1}", e.Message, baseException.Message);
                    _client = null;
                }
            }
            _lockMutex.ReleaseMutex();
        }

        private async Task<DocumentCollection> GetCollectionAsync(string collectionId)
        {
            if (string.IsNullOrWhiteSpace(collectionId))
            {
                throw new ArgumentNullException(collectionId);
            }

            await ConnectAsync();

            if (_database == null)
            {
                return null;
            }

            DocumentCollection result = null;
            result = _client.CreateDocumentCollectionQuery(_database.SelfLink)
                            .Where(c => c.Id == collectionId)
                            .AsEnumerable()
                            .FirstOrDefault();

            if (result == null)
            {
                result = await _client.CreateDocumentCollectionAsync(_database.SelfLink, new DocumentCollection { Id = collectionId });
            }

            return result;
        }

        private async Task<Microsoft.Azure.Documents.Database> GetOrCreateDatabaseAsync(string id)
        {
            var db = _client.CreateDatabaseQuery()
                            .Where(d => d.Id == id)
                            .AsEnumerable()
                            .FirstOrDefault();
            if (db == null)
            {
                db = await _client.CreateDatabaseAsync(new Microsoft.Azure.Documents.Database { Id = id });
            }

            return db;
        }

        private async Task<StoredProcedure> RegisterQueryByFilterStoredProc(DocumentCollection collection)
        {
            var assembly = System.Reflection.Assembly.GetExecutingAssembly();
            var resourceName = "AzureLens.Database.DocumentDB.js.QueryByFilter.js";

            var body = string.Empty;
            using (Stream stream = assembly.GetManifestResourceStream(resourceName))
            using (StreamReader reader = new StreamReader(stream))
            {
                body = reader.ReadToEnd();
            }

            if (string.IsNullOrWhiteSpace(body))
            {
                return null;
            }
            var sproc = new StoredProcedure
            {
                Id = QueryByFilter,
                Body = body
            };

            sproc = await _client.CreateStoredProcedureAsync(collection.SelfLink, sproc);
            return sproc;
        }
    }
}
//*********************************************************   
//   
//AzureLens.Net, https://github.com/MicrosoftDX/AzureLens 
//  
//Copyright (c) Microsoft Corporation  
//All rights reserved.   
//  
// MIT License:  
// Permission is hereby granted, free of charge, to any person obtaining  
// a copy of this software and associated documentation files (the  
// ""Software""), to deal in the Software without restriction, including  
// without limitation the rights to use, copy, modify, merge, publish,  
// distribute, sublicense, and/or sell copies of the Software, and to  
// permit persons to whom the Software is furnished to do so, subject to  
// the following conditions:  

// The above copyright notice and this permission notice shall be  
// included in all copies or substantial portions of the Software.  

// THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,  
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF  
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND  
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE  
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION  
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION  
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  
//   
//*********************************************************   
