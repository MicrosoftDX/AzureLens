// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using AzureLens.Database.DocumentDB;
using System.Threading;
using System.Threading.Tasks;
using AzureLens.Models;
using System.Security.Cryptography;
using System.Text;
using System.Configuration;
using Newtonsoft.Json.Linq;
using AzureLens.Models.DB;
using Newtonsoft.Json;

namespace AzureLens.Database
{
    static public class DAL
    {
        static DAL()
        {
            DiagramCollection = ConfigurationManager.AppSettings["DocumentDBDiagramCollection"];
        }
        private static string DiagramCollection { get; set; }

        /// <summary>
        /// Inserts a new diagram into the Diagrams collection
        /// NOTE: the Diagram JSON must not have the id attribute or an exception will occur
        /// </summary>
        /// <param name="doc"></param>
        /// <returns></returns>
        static public async Task<string> InsertDiagramAsync(string diagram)
        {
            string diagramId = string.Empty;
            try
            {
                using (DocumentDBContext docdb = new DocumentDBContext())
                {
                    diagramId = await docdb.InsertOrUpdateItemAsync(DiagramCollection, diagram);
                }
            }
            catch (Exception e)
            {
                // handle exception...                
            }
            return diagramId;
        }

        /// <summary>
        /// Updates an existing diagram in the Diagrams collection
        /// NOTE: the Diagram JSON must have the id attribute or an exception will occur
        /// </summary>
        /// <param name="id"></param>
        /// <param name="diagram"></param>
        /// <returns></returns>
        static public async Task<string> UpdateDiagramAsync(string diagram)
        {
            string diagramId = string.Empty;
            try
            {
                using (DocumentDBContext docdb = new DocumentDBContext())
                {
                    diagramId = await docdb.InsertOrUpdateItemAsync(DiagramCollection, diagram);
                }
            }
            catch
            {
                // handle exception...                
            }
            return diagramId;
        }

        static public async Task<bool> DeleteDiagramAsync(string diagramId)
        {
            var rtnValue = false;
            try
            {
                using (DocumentDBContext docdb = new DocumentDBContext())
                {
                    rtnValue = await docdb.DeleteItemAsync(DiagramCollection, diagramId);
                }
            }
            catch
            {
                // handle exception...                
            }
            return rtnValue;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        static public async Task<List<dynamic>> GetUserDiagramsAsync(string userId)
        {
            List<dynamic> docs = new List<dynamic>();
            using (DocumentDBContext docdb = new DocumentDBContext(DiagramCollection))
            {
                var diagrams = (await docdb.GetItemsByPropertyAsync<dynamic>("userId", userId)).ToList();
               foreach (var diagram in diagrams)
                {
                    string name;
                    string ID;

                    try
                    {
                        name = diagram.name;
                    }
                    catch
                    {
                        name = "(blank)";
                    }
                    try {
                        ID = diagram.id;
                        docs.Add(new
                        {
                            name = name,
                            id = ID
                        });

                    }
                    catch
                    {

                    }
                }

            }
            return docs;
        }

        static public async Task<dynamic> LoadDiagram(Guid diagramId)
        {
            dynamic doc = null;
            try
            {
                var id = diagramId.ToString();
                using (DocumentDBContext docdb = new DocumentDBContext())
                {
                    doc = await docdb.GetItemAsync<dynamic>(id, DiagramCollection);
                }
            }
            catch
            {
                // handle exception...                
            }
            return doc;
        }

        public static async Task<string> GenerateHashAsync(Guid diagramId)
        {
            var result = string.Empty;
            using (DocumentDBContext docdb = new DocumentDBContext())
            {
                var id = diagramId.ToString().ToUpperInvariant();
              // var doc = await docdb.GetItemAsync<dynamic>(id, DiagramCollection);

              
                    var input = string.Format("{0}{1}", Guid.NewGuid().ToString(), id.ToString());

                    var sha = new SHA256CryptoServiceProvider();
                    var buffer = Encoding.ASCII.GetBytes(input);
                    var hash = sha.ComputeHash(buffer);
                    var hashString = string.Empty;
                    foreach (var b in hash)
                    {
                        hashString += b.ToString("X2");
                    }
                    var hashResult = new SharedDocumentResult()
                    {
                        Id = hashString,
                        DiagramId = id
                    };
                    var json = JsonConvert.SerializeObject(hashResult);
                    dynamic success = await docdb.InsertOrUpdateItemAsync(DiagramCollection, json);
                   
                        result = hashResult.Id;
                    
              
            }
            return result;
        }

        public static async Task<Guid?> GetIdFromHashAsync(string hash)
        {
            Guid? id = null;

            if (!string.IsNullOrWhiteSpace(hash))
            {
                using (DocumentDBContext docdb = new DocumentDBContext())
                {
                    var doc = await docdb.GetItemAsync<dynamic>(hash, DiagramCollection);
                    if (doc != null)
                    {
                        string diagramId = doc.diagramId;
                        Guid parsedId;
                        if (Guid.TryParse(diagramId, out parsedId))
                        {
                            id = parsedId;
                        }
                    }
                }
            }

            return id;
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
