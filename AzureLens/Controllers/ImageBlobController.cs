// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

using AzureLens.Models;
using AzurelensBlob;
using System.IO;
using System.Threading.Tasks;
using System.Net.Http.Headers;
using AzureLens.Database;

namespace AzureLens.Controllers
{
    [Authorize]
    [RoutePrefix("services/v1/diagrams")]
    public class ImageBlobController : ApiController
    {
        // GET: services/v1/diagrams/716E9838-19AA-402F-B319-6250942A39DB/images
        //Return all images for a certain diagram for the logged in user
        [Route("{diagramid}/images")]
        public async Task<string[]> Get(string diagramid)
        {
            //Get the current authenticated user
            string UserId = UserHelper.GetCurrentUserID().ToLower();
            string DiagramId = diagramid.ToLower();

            try
            {
                string[] ImagesUrls = await BlobManager.ListImagesAsync(UserId + "/" + DiagramId);
                return ImagesUrls;
                
            }
            catch (Exception Ex)
            {
                string Err = string.Format("Unable to get the list of images for the diagram id {0}", diagramid);
                var response = Request.CreateErrorResponse(HttpStatusCode.InternalServerError, Err);
                response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
                Log.LogError("ImageAPI: Unable to get the list of images for the diagram id {0}, Error: {1}", diagramid, Ex.Message);
                throw new HttpResponseException(response);
            }
        }

        // GET: services/v1/diagrams/716E9838-19AA-402F-B319-6250942A39DB/images/helloworld.png/
        //Return a certain image for a certain diagram for the logged in user
        [Route("{diagramid}/images/{imagename}")]
        public async Task<HttpResponseMessage> Get(string diagramid, string imagename)
        {
            //Get the current authenticated user
            string UserId = UserHelper.GetCurrentUserID();
            //string UserId = "dummyuser@gmail.com";
            string DiagramId = diagramid.ToLower();
            string ImageName = imagename.ToLower();

            string Blobname = UserId + "/" + DiagramId + "/" + imagename;
            try
            {
                if (BlobManager.ImageExists(Blobname))
                {
                    MemoryStream ImageStream = await BlobManager.DownloadImageAsync(Blobname);
                    var response = Request.CreateResponse(HttpStatusCode.OK);
                    response.Content = new ByteArrayContent(ImageStream.ToArray());
                    ///TO DO: implement different image types
                    response.Content.Headers.ContentType = new MediaTypeHeaderValue("image/png");
                    response.Content.Headers.ContentLength = ImageStream.Length;
                    return response;
                }
                else //Image cannot be found
                {
                    var response = Request.CreateErrorResponse(HttpStatusCode.NotFound, "'" + imagename + "' image cannot be found");
                    //response.Content = new StringContent("'" + imagename + "' image cannot be found");
                    response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
                    //response.StatusCode = HttpStatusCode.NotFound;
                    throw new HttpResponseException(response);
                }
            }
            catch (Exception Ex)
            {
                string Err = string.Format("Unable to download the image {0}", imagename);
                var response = Request.CreateErrorResponse(HttpStatusCode.InternalServerError, Err);
                response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
                Log.LogError("ImageAPI: Unable to download image {0}, Error: {1}", imagename, Ex.Message);
                throw new HttpResponseException(response);
            }
        }

        // GET: services/v1/diagrams/716E9838-19AA-402F-B319-6250942A39DB/images/helloworld.png/shared/9hf2efhd9du
        //Return a certain image for a certain shared diagram
        [AllowAnonymous]
        [Route("{diagramid}/images/{imagename}/shared/{hash}")]
        public async Task<HttpResponseMessage> Get(string diagramid, string imagename, string hash)
        {
            //Get the diagram id from the hash to match it with diagram id 
            //from the hash to authenticate the sharing credentials 
            var id = await DAL.GetIdFromHashAsync(hash);
            if (id == null)
            {
                var response = Request.CreateErrorResponse(HttpStatusCode.NotFound, "Sharing key is invalid or not authorized");
                response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
                throw new HttpResponseException(response);
            }
            
            string DiagramId = diagramid.ToLower();
            string ImageName = imagename.ToLower();

            if (id.Value.ToString().ToLower() != DiagramId)
            {
                //This means the hash is not correct (someone is trying to hack the images)
                var response = Request.CreateErrorResponse(HttpStatusCode.Unauthorized, "You are not authoried to share this resource");
                response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
                throw new HttpResponseException(response);
            }

                string Blobname =  DiagramId + "/" + imagename;
            try
            {
                MemoryStream ImageStream = await BlobManager.SearchAndDownloadImageAsync(Blobname);
                if (ImageStream != null)
                {
                    var response = Request.CreateResponse(HttpStatusCode.OK);
                    response.Content = new ByteArrayContent(ImageStream.ToArray());
                    ///TO DO: implement different image types
                    response.Content.Headers.ContentType = new MediaTypeHeaderValue("image/png");
                    response.Content.Headers.ContentLength = ImageStream.Length;
                    return response;
                }
                else //Image cannot be found
                {
                    var response = Request.CreateErrorResponse(HttpStatusCode.NotFound, "'" + imagename + "' image cannot be found");
                    response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
                    throw new HttpResponseException(response);
                }
            }
            catch (Exception Ex)
            {
                string Err = string.Format("Unable to download the image {0}", imagename);
                var response = Request.CreateErrorResponse(HttpStatusCode.InternalServerError, Err);
                response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
                Log.LogError("ImageAPI: Unable to download image {0}, Error: {1}", imagename, Ex.Message);
                throw new HttpResponseException(response);
            }
        }

        // POST: services/v1/diagrams/716E9838-19AA-402F-B319-6250942A39DB/images
        //Upload a certain image for a certain diagram for the logged in user
        [Route("{diagramid}/images")]
        public async void Post([FromBody]ImageMediaModels value, string diagramid)
        {
            string ImageName = value.FileName.ToLower();
            string UserId = UserHelper.GetCurrentUserID().ToLower();
            string DiagramId = diagramid.ToLower();

            string Blobname = UserId + "/" + DiagramId + "/" + ImageName;
            MemoryStream stream = new MemoryStream(value.Buffer);

            try
            {
                if (!BlobManager.ImageExists(Blobname))
                {
                   await BlobManager.UploadImage(stream, Blobname);
                }
            }
            catch (Exception Ex)
            {
                string Err = string.Format("Unable to upload the image {0}", value.FileName);
                var response = Request.CreateErrorResponse(HttpStatusCode.InternalServerError, Err);
                response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
                Log.LogError("ImageAPI: Unable to upload image {0}, Error: {1}", value.FileName, Ex.Message);
                throw new HttpResponseException(response);
            }
        }


        // DELETE: services/v1/diagrams/716E9838-19AA-402F-B319-6250942A39DB/images/helloworld.png/
        // Delete a certain image from a cetain diagram for a the current logged in user
        [Route("{diagramid}/images/{imagename}")]
        public HttpResponseMessage Delete(string diagramid, string imagename)
        {
            //Get the current authenticated user
            string UserId = UserHelper.GetCurrentUserID().ToLower();
            string DiagramId = diagramid.ToLower();
            string ImageName = imagename.ToLower();

            string Blobname = UserId + "/" + DiagramId + "/" + imagename;
            try
            {
                if (BlobManager.ImageExists(Blobname))
                {
                    bool ImageDeleted = BlobManager.DeleteImage(Blobname);
                    if(ImageDeleted)
                    {
                        var response = Request.CreateErrorResponse(HttpStatusCode.OK, "'" + imagename + "' has been deleted successfully");
                        response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
                        return response;
                    }
                    else
                    {
                        var response = Request.CreateErrorResponse(HttpStatusCode.InternalServerError, "'" + imagename + 
                            "' cannot be deleted, Try again and make sure the image info is correct.");
                        response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
                        return response;
                    }
                }
                else //Image cannot be found
                {
                    var response = Request.CreateErrorResponse(HttpStatusCode.NotFound, "'" + imagename + "' image cannot be found");
                    response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
                    //response.StatusCode = HttpStatusCode.NotFound;
                    throw new HttpResponseException(response);
                }
            }
            catch (Exception Ex)
            {
                string Err = string.Format("Unable to delete the image {0}", imagename);
                var response = Request.CreateErrorResponse(HttpStatusCode.InternalServerError, Err);
                response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
                Log.LogError("ImageAPI: Unable to delete the image {0}, Error: {1}", imagename, Ex.Message);
                throw new HttpResponseException(response);
            }
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
