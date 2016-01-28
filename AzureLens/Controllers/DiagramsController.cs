// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.
using System;
using System.Collections.Generic;
using System.Web.Http;
using AzureLens.Database;
using System.Threading.Tasks;
using System.Security.Claims;
using Newtonsoft.Json.Linq;
using System.Net.Http;
using System.Net;

namespace AzureLens.Controllers
{
    [Authorize]
    [RoutePrefix("services/v1/diagrams")]    
    public class DiagramsController : ApiController
    {
        [Route("")]
        // GET api/diagrams
        public async Task<List<dynamic>> Get()
        {
            var user = UserHelper.GetCurrentUserID();
            var diagrams = await DAL.GetUserDiagramsAsync(user);
            return diagrams;
        }

        [Route("{id}")]
        // GET api/diagrams/DEFG12345
        public async Task<dynamic> Get(Guid id)
        {
            dynamic diagram;
            diagram = await DAL.LoadDiagram(id);
          
            var user = UserHelper.GetCurrentUserID();
            if (diagram.userId != user && diagram.userId != null)
            {
                var resp = new HttpResponseMessage(HttpStatusCode.Unauthorized)
                {
                    Content = new StringContent("User not authorized to open this diagram"),
                    ReasonPhrase = "User not authorized to open this diagram"
                };
                throw new HttpResponseException(resp);
            }

            if (diagram == null)
            {
                var resp = new HttpResponseMessage(HttpStatusCode.NotFound)
                {
                    Content = new StringContent(string.Format("DiagramId ({0}) was not found", id.ToString())),
                    ReasonPhrase = "Diagram was not found"
                };
                throw new HttpResponseException(resp);
            }
            return diagram;
        }

        // POST api/diagrams
        [HttpPost]
        [Route("")]
        public async Task<string> InsertDiagramAsync([FromBody]JToken diagram)
        {
            if (GetDiagramId(diagram) != null)
            {
                var resp = new HttpResponseMessage(HttpStatusCode.NotAcceptable)
                {
                    Content = new StringContent("DiagramId (id) found in diagram"),
                    ReasonPhrase = "Invalid diagram object for Insert"
                };
                throw new HttpResponseException(resp);
            }

            var user = UserHelper.GetCurrentUserID();
            if (diagram["userId"] == null || string.IsNullOrWhiteSpace(diagram["userId"].Value<string>()))
            {
                diagram["userId"] = user.ToLowerInvariant();
            }
            diagram["lastUpdated"] = System.DateTime.Now;
            var diagramStr = diagram.ToString();
            string diagramId = await DAL.InsertDiagramAsync(diagramStr);
            return diagramId;
        }

        //// PUT api/diagrams/DEFG12345
        [HttpPut]
        [Route("{id}")]
        public async Task<string> UpdateDiagramAsync([FromBody]JToken diagram)
        {
            dynamic existingDiagram;
            string id = GetDiagramId(diagram);
            if (id == null)
            {
                var resp = new HttpResponseMessage(HttpStatusCode.NotAcceptable)
                {
                    Content = new StringContent("DiagramId (id) not found in diagram"),
                    ReasonPhrase = "Invalid diagram object for Update"
                };
                throw new HttpResponseException(resp);
            }
            existingDiagram = await DAL.LoadDiagram(Guid.Parse(id));

            var x = diagram.Value<string>("userId");
            var user = UserHelper.GetCurrentUserID();
            if (existingDiagram.userId != user )
            {
                var resp = new HttpResponseMessage(HttpStatusCode.Unauthorized)
                {
                    Content = new StringContent("User not authorized to save this diagram"),
                    ReasonPhrase = "User not authorized to save this diagram"
                };
                throw new HttpResponseException(resp);
            }

            if (diagram["userId"] == null || string.IsNullOrWhiteSpace(diagram["userId"].Value<string>()))
            {
                diagram["userId"] = user.ToLowerInvariant();
            }
            diagram["lastUpdated"] = System.DateTime.Now;
            var diagramStr = diagram.ToString();
            return await DAL.UpdateDiagramAsync(diagramStr);
        }

        // DELETE api/diagrams/DEFG12345
        [HttpDelete]
        [AcceptVerbs("Delete")]
        [Route("{id}")]
        public async Task<bool> DeleteDiagramAsync(Guid id)
        {
            dynamic diagram;
            diagram = await DAL.LoadDiagram(id);
            var user = UserHelper.GetCurrentUserID();
            if (diagram.userId != user)
            {
                var resp = new HttpResponseMessage(HttpStatusCode.Unauthorized)
                {
                    Content = new StringContent("User not authorized to delete this diagram"),
                    ReasonPhrase = "User not authorized to delete this diagram"
                };
                throw new HttpResponseException(resp);
            }

            var result = false;
            result = await DAL.DeleteDiagramAsync(id.ToString());
            if (!result)
            {
                var resp = new HttpResponseMessage(HttpStatusCode.NotFound)
                {
                    Content = new StringContent(string.Format("DiagramId (id={0}) was not found", id.ToString())),
                    ReasonPhrase = "Diagram not found"
                };
                throw new HttpResponseException(resp);
            }
            return result;
        }

        private string GetDiagramId(JToken diagram)
        {
            if (diagram["id"] == null || string.IsNullOrWhiteSpace(diagram["id"].Value<string>()))
                return null;

            return diagram["id"].ToString();
        }

        // api/diagrams/DEFG12345/share
        [HttpPost]
        [Route("{id}/share")]
        public async Task<string> ShareAsync(Guid id)
        {
            dynamic diagram;
            diagram = await DAL.LoadDiagram(id);
            var user = UserHelper.GetCurrentUserID();
            if (diagram.userId != user)
            {
                var resp = new HttpResponseMessage(HttpStatusCode.Unauthorized)
                {
                    Content = new StringContent("User not authorized to share this diagram"),
                    ReasonPhrase = "User not authorized to share this diagram"
                };
                throw new HttpResponseException(resp);
            }


            var hash = await DAL.GenerateHashAsync(id);
            if (string.IsNullOrEmpty(hash))
            {
                throw new HttpResponseException(System.Net.HttpStatusCode.Gone);
            }
            var baseUrl = Request.RequestUri.GetLeftPart(UriPartial.Authority);
            var shareUrl = string.Format("{0}",  hash);
            return shareUrl;
        }

        [AllowAnonymous]
        [HttpGet]
        [Route("shared/{hash}")]
        public async Task<dynamic> LoadSharedDiagramAsync(string hash)
        {
            var id = await DAL.GetIdFromHashAsync(hash);
            if (id == null)
            {
                throw new HttpResponseException(System.Net.HttpStatusCode.NotFound);
            }
            var diagram = DAL.LoadDiagram(id.Value);
            return diagram;
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
