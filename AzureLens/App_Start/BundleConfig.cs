// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.
using System.Web;
using System.Web.Configuration;
using System.Web.Optimization;

namespace AzureLens
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/Libraries/jquery-{version}.js",
                        "~/Scripts/Libraries/jquery.multilevelpushmenu.js"));

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/Libraries/modernizr-*"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                      "~/Scripts/Libraries/bootstrap.js",
                      "~/Scripts/Libraries/respond.js"));

            bundles.Add(new ScriptBundle("~/bundles/velocity").Include(
                      "~/Scripts/Libraries/velocity.min.js",
                      "~/Scripts/Libraries/velocity.ui.js"));

            bundles.Add(new StyleBundle("~/Content/cssbundle").Include(
                      "~/Content/bootstrap.css",
                      "~/Content/site.css",
                      "~/fonts/font-awesome.css",
                      "~/Content/basecss/jquery.multilevelpushmenu.css",
                      "~/Content/basecss/main.css",
                      "~/Content/basecss/spectrum.css"));

            //bundles.Add(new ScriptBundle("~/bundles/app").Include(
            //    "~/Scripts/Libraries/adal.js",
            //    "~/Scripts/azureLensApp/app.js",
            //    "~/Scripts/azureLensApp/app3DView.js",
            //    "~/Scripts/azureLensApp/fileLoader.js"));

            bundles.Add(new ScriptBundle("~/bundles/signalr").Include(
                "~/Scripts/jquery.signalR-2.2.0.js"));

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
