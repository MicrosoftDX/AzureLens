﻿// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.

using System;
using System.Collections.Generic;
using System.Configuration;
using System.IdentityModel.Selectors;
using System.IdentityModel.Tokens;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Web;

namespace AzureLens
{
    public static class UserHelper
    {
        public static string GetCurrentUserID()
        {
            ///To DO: Implement logic to return the current logged in user UPN
            try
            {
                if (ClaimsPrincipal.Current.HasClaim((p) => p.Type == ClaimTypes.Name))
                    return ClaimsPrincipal.Current.FindFirst(ClaimTypes.Name).Value;

                return null;
            }
            catch (Exception e)
            {
                throw new UnauthorizedAccessException("No claims found for name/value", e);
            }
        }

        public static string GetCurrentUserID(string token)
        {
            JwtSecurityTokenHandler handler = new JwtSecurityTokenHandler();

            var canReadToken = handler.CanReadToken(token);

            if (canReadToken)
            {
                var tempToken = handler.ReadToken(token) as JwtSecurityToken;
                ///TODO: this could be used to HTTP request the metadata...
                //issuer = tt.Issuer;

                var claims = new List<Claim>();
                foreach (var claim in tempToken.Claims)
                {
                    claims.Add(claim);
                }
                var principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

                Thread.CurrentPrincipal = principal;

            }

            return GetCurrentUserID();

            ///TODO: wire up real token validate...
            ///
            /*
            TokenValidationParameters validationParameters =
               new TokenValidationParameters()
               {
                   ValidAudience = ConfigurationManager.AppSettings["ida:Audience"],
                   ValidateIssuer = false,
                   ValidateActor = false,
                   ValidateIssuerSigningKey = false,
                   CertificateValidator = X509CertificateValidator.None

               };

            SecurityToken jwtToken = null;
            var p = handler.ValidateToken(token, validationParameters, out jwtToken);
            */

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
