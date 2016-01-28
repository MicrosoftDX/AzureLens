// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.

using Microsoft.Azure;

namespace AzurelensBlob
{
    using Microsoft.Azure;
    using Microsoft.WindowsAzure;
    using Microsoft.WindowsAzure.Storage;
    using Microsoft.WindowsAzure.Storage.Blob;
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Threading.Tasks;

    /// <summary>
    /// Azure Storage Blob Sample - Demonstrate how to use the Blob Storage service. 
    /// Blob storage stores unstructured data such as text, binary data, documents or media files. 
    /// Blobs can be accessed from anywhere in the world via HTTP or HTTPS.
    ///
    /// Note: This sample uses the .NET 4.5 asynchronous programming model to demonstrate how to call the Storage Service using the 
    /// storage client libraries asynchronous API's. When used in real applications this approach enables you to improve the 
    /// responsiveness of your application. Calls to the storage service are prefixed by the await keyword. 
    /// 
    /// Documentation References: 
    /// - What is a Storage Account - http://azure.microsoft.com/en-us/documentation/articles/storage-whatis-account/
    /// - Getting Started with Blobs - http://azure.microsoft.com/en-us/documentation/articles/storage-dotnet-how-to-use-blobs/
    /// - Blob Service Concepts - http://msdn.microsoft.com/en-us/library/dd179376.aspx 
    /// - Blob Service REST API - http://msdn.microsoft.com/en-us/library/dd135733.aspx
    /// - Blob Service C# API - http://go.microsoft.com/fwlink/?LinkID=398944
    /// - Delegating Access with Shared Access Signatures - http://azure.microsoft.com/en-us/documentation/articles/storage-dotnet-shared-access-signature-part-1/
    /// - Storage Emulator - http://msdn.microsoft.com/en-us/library/azure/hh403989.aspx
    /// - Asynchronous Programming with Async and Await  - http://msdn.microsoft.com/en-us/library/hh191443.aspx
    /// </summary>
    public static class BlobManager
    {
        #region Private constants
        private static string PRIVATE_CONTAINER_NAME = "privateuserassets";
        #endregion
        public static async Task<string> UploadImage(Stream ImageToUpload, string ImageName)
        {
            // Retrieve storage account information from connection string
            CloudStorageAccount storageAccount = CreateStorageAccountFromConnectionString(CloudConfigurationManager.GetSetting("StorageConnectionString"));

            // Create a blob client for interacting with the blob service.
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();

            // Create a container for organizing blobs within the storage account.
            Log.LogInformation("Creating Container: {0}", PRIVATE_CONTAINER_NAME);
            CloudBlobContainer container = blobClient.GetContainerReference(PRIVATE_CONTAINER_NAME);

            try
            {
                await container.CreateIfNotExistsAsync();
            }
            catch (StorageException)
            {
                Log.LogError("Error creating blob container {0}", PRIVATE_CONTAINER_NAME);
                throw;
            }

            // Upload a BlockBlob to the newly created container
            Log.LogInformation("Creating Container: {0}", PRIVATE_CONTAINER_NAME);
            CloudBlockBlob blockBlob = container.GetBlockBlobReference(ImageName);

            await blockBlob.UploadFromStreamAsync(ImageToUpload);
            return blockBlob.Uri.ToString();
        }


        public static async Task<string[]> ListImagesAsync(string Location)
        {
            // Retrieve storage account information from connection string
            CloudStorageAccount storageAccount = CreateStorageAccountFromConnectionString(CloudConfigurationManager.GetSetting("StorageConnectionString"));

            // Create a blob client for interacting with the blob service.
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();

            // get container for organizing blobs within the storage account.
            Log.LogInformation("Load container: {0}", PRIVATE_CONTAINER_NAME);
            CloudBlobContainer container = blobClient.GetContainerReference(PRIVATE_CONTAINER_NAME);

            BlobContinuationToken token = null;
            BlobListingDetails blobListingDetails = BlobListingDetails.All;
            ///TODO: add support for pagination
            BlobResultSegment resultSegment = await container.ListBlobsSegmentedAsync(Location,true, blobListingDetails, 5000, token, null,null);
            token = resultSegment.ContinuationToken;

            string[] ImagesUrls = new string[resultSegment.Results.Count()];

            int i = 0;
            foreach (IListBlobItem blob in resultSegment.Results)
            {
                ImagesUrls[i] = blob.Uri.ToString();
                i++;
            }

            return ImagesUrls;
        }
        public static async Task<MemoryStream> DownloadImageAsync(string ImageName)
        {
            // Retrieve storage account information from connection string
            CloudStorageAccount storageAccount = CreateStorageAccountFromConnectionString(CloudConfigurationManager.GetSetting("StorageConnectionString"));

            // Create a blob client for interacting with the blob service.
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();

            // get container for organizing blobs within the storage account.
            Log.LogInformation("Load container: {0}", PRIVATE_CONTAINER_NAME);
            CloudBlobContainer container = blobClient.GetContainerReference(PRIVATE_CONTAINER_NAME);

            // Get a reference to the blob block
            Log.LogInformation("Load blobblock: {0}", ImageName);
            CloudBlockBlob blockBlob = container.GetBlockBlobReference(ImageName);

            // Download the file stream
            MemoryStream FileToDownload = new MemoryStream();
            Log.LogInformation("Download blobblock: {0}", ImageName);

            await blockBlob.DownloadToStreamAsync(FileToDownload);

            return FileToDownload;
        }

        public static async Task<MemoryStream> SearchAndDownloadImageAsync(string ImageNameQuery)
        {
            // Retrieve storage account information from connection string
            CloudStorageAccount storageAccount = CreateStorageAccountFromConnectionString(CloudConfigurationManager.GetSetting("StorageConnectionString"));

            // Create a blob client for interacting with the blob service.
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();

            // get container for organizing blobs within the storage account.
            Log.LogInformation("Load container: {0}", PRIVATE_CONTAINER_NAME);
            CloudBlobContainer container = blobClient.GetContainerReference(PRIVATE_CONTAINER_NAME);

            var Blobs = container.ListBlobs(null, true).OfType<CloudBlockBlob>().Where(b=>b.Name.EndsWith(ImageNameQuery));
           
            if (Blobs.Count() > 0)
            {
                CloudBlockBlob blockBlob = Blobs.First();
                // Get a reference to the blob block
                Log.LogInformation("Load blobblock: {0}", ImageNameQuery);
                
                // Download the file stream
                MemoryStream FileToDownload = new MemoryStream();
                Log.LogInformation("Download blobblock: {0}", ImageNameQuery);

                await blockBlob.DownloadToStreamAsync(FileToDownload);

                return FileToDownload;
            }
            return null;
        }
        public static bool DeleteImage(string ImageName)
        {
            // Retrieve storage account information from connection string
            CloudStorageAccount storageAccount = CreateStorageAccountFromConnectionString(CloudConfigurationManager.GetSetting("StorageConnectionString"));

            // Create a blob client for interacting with the blob service.
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();

            // get container for organizing blobs within the storage account.
            Log.LogInformation("Load container: {0}", PRIVATE_CONTAINER_NAME);
            CloudBlobContainer container = blobClient.GetContainerReference(PRIVATE_CONTAINER_NAME);

            // Get a reference to the blob block
            Log.LogInformation("Load blobblock: {0}", ImageName);
            CloudBlockBlob blockBlob = container.GetBlockBlobReference(ImageName);

            //Delete blobblock
            Log.LogInformation("Delete blobblock: {0}", ImageName);
            blockBlob.Delete();

            return true;
        }
        public static bool ImageExists(string ImageName)
        {
            // Retrieve storage account information from connection string
            CloudStorageAccount storageAccount = CreateStorageAccountFromConnectionString(CloudConfigurationManager.GetSetting("StorageConnectionString"));

            // Create a blob client for interacting with the blob service.
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();

            // get container for organizing blobs within the storage account.
            Log.LogInformation("Load container: {0}", PRIVATE_CONTAINER_NAME);
            CloudBlobContainer container = blobClient.GetContainerReference(PRIVATE_CONTAINER_NAME);

            // Get a reference to the blob block
            Log.LogInformation("Load blobblock: {0}", ImageName);
            CloudBlockBlob blockBlob = container.GetBlockBlobReference(ImageName);

            //Check if blobblock
            return blockBlob.Exists();
        }
        /// <summary>
        /// Validates the connection string information in app.config and throws an exception if it looks like 
        /// the user hasn't updated this to valid values. 
        /// </summary>
        /// <param name="storageConnectionString">The storage connection string</param>
        /// <returns>CloudStorageAccount object</returns>
        private static CloudStorageAccount CreateStorageAccountFromConnectionString(string storageConnectionString)
        {
            CloudStorageAccount storageAccount;
            try
            {
                storageAccount = CloudStorageAccount.Parse(storageConnectionString);
            }
            catch (FormatException)
            {
                Log.LogError("Invalid storage account information provided. Please confirm the AccountName and AccountKey are valid in the app.config file - then restart the sample.");
                throw;
            }
            catch (ArgumentException)
            {
                Log.LogError("Invalid storage account information provided. Please confirm the AccountName and AccountKey are valid in the app.config file - then restart the sample.");
                throw;
            }

            return storageAccount;
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
