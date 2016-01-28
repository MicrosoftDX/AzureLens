// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.

using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Linq;
using System.Web;
using ARMProxy.Workers.Hubs;

namespace AzureLens.Hubs
{
    public class ResourceMonitorManager
    {
        private static ResourceMonitorManager _instance;
        private ConcurrentDictionary<string, MonitorRequest> requests;

        private ResourceMonitorManager()
        {
            requests = new ConcurrentDictionary<string, MonitorRequest>();
        }

        private static ResourceMonitorManager GetInstance()
        {
            if (_instance == null)
                _instance = new ResourceMonitorManager();
            return _instance;
        }

        public static ConcurrentDictionary<string, MonitorRequest> GetRequests()
        {
            return GetInstance().requests;
        }

        public static void AddRequest(MonitorRequest req)
        {
            var requests = GetRequests();
            requests.AddOrUpdate(req.ResourceId, req, (key, oldReq) =>
            {
                if(req.IssuedAt > oldReq.IssuedAt)
                {
                    oldReq.IssuedAt = req.IssuedAt;
                    oldReq.AccessToken = req.AccessToken;
                }
                return oldReq;
            });
        }

        public static void RemoveRequest(MonitorRequest req)
        {
            var outVar = new MonitorRequest();
            GetRequests().TryRemove(req.ResourceId, out outVar);
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
