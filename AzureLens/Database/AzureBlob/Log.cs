// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AzurelensBlob
{
    public static class Log
    {
        private static void LogMessage(string LogType, string MessageBody, params object[] args)
        {
            Debug.WriteLine(LogType + "(" + DateTime.UtcNow.ToShortTimeString() + "): " + MessageBody, args);
        }
        private static void LogMessage(string LogType, string MessageBody)
        {
            Debug.WriteLine(LogType + "(" + DateTime.UtcNow.ToShortTimeString() + "): " + MessageBody);
        }
        public static void LogInformation(string MessageBody, params object[] args)
        {
            LogMessage("Inf", MessageBody, args);
        }
        public static void LogInformation(string MessageBody)
        {
            LogMessage("Inf", MessageBody);
        }
        public static void LogWarning(string MessageBody, params object[] args)
        {
            LogMessage("Wrn", MessageBody, args);
        }
        public static void LogWarning(string MessageBody)
        {
            LogMessage("Wrn", MessageBody);
        }
        public static void LogError(string MessageBody, params object[] args)
        {
            LogMessage("Err", MessageBody, args);
        }
        public static void LogError(string MessageBody)
        {
            LogMessage("Err", MessageBody);
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
