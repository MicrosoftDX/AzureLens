///<reference path="typings/angular/angular.d.ts" />
var azureLensApp = angular.module("azureLensApp", ["ngRoute", "AdalAngular"]);
(function (app) {
    app.config([
        "$routeProvider", "$httpProvider", "adalAuthenticationServiceProvider", function ($routeProvider, $httpProvider, adalProvider) {
            $routeProvider.when("/Home", {
                controller: "mainViewModel",
                templateUrl: "/test.html",
                requireADLogin: false,
            });
            adalProvider.init({
                instance: "https://login.microsoftonline.com/",
                tenant: "AzureLens.onmicrosoft.com",
                clientId: "b160ccc5-913b-4416-8642-169c63d2dc26",
                extraQueryParameter: "nux=1",
            }, $httpProvider);
        }
    ]);
    app.controller("mainViewModel", [
        "$scope", "adalAuthenticationService", "$location",
        "$rootScope", "dataFactory",
        function ($scope, adalService, $location, $rootScope, dataFactory) {
            $scope.login = function () {
                adalService.login();
            };
            //$scope.logout = () => {
            //    adalService.logOut();
            //};
            //$scope.isActive = viewLocation => (viewLocation === $location.path());
            //$scope.notImplemented = () => {
            //    var notify = new Notification();
            //    notify.message = "This feature is not yet implemented";
            //    notify.style = NotificationStyle.warning;
            //    $rootScope.$broadcast("al:ui:notify", notify);
            //};
            //$scope.saveDiagram = function(diagram) {
            //    dataFactory.saveDiagram(diagram)
            //        .success(function() {
            //            $scope.status = "Save a digram";
            //        }).
            //        error(function(error) {
            //            $scope.status = "Unable to save a azurelen diagram: " + error.message;
            //        });
            //};
        }
    ]);
    app.factory("dataFactory", [
        "$http", function ($http) {
            var urlBase = "/services/v1/diagrams";
            var dataFactory = {
                getCustomer: function (id) { return $http.get(urlBase + "/" + id); },
                saveDiagram: function (diagram) { return $http.post(urlBase, diagram); }
            };
            return dataFactory;
        }
    ]);
})(azureLensApp);
//# sourceMappingURL=mainViewModel.js.map