// Copyright (c) Microsoft. See License.txt in the project root for license information.
/// <reference path="mainViewModel.ts" />
(function (app) {
    app.directive("alNotificationCenter", [
        function () {
            return {
                "templateUrl": "/Content/templates/notificationcenter.html",
                "restrict": "AE",
                "controllerAs": "notifyCtrl",
                "controller": [
                    "$scope", "$rootScope", function ($scope, $rootScope) {
                        $scope.items = [];
                        $rootScope.$on("al:ui:notify", function (_, notify) {
                            $scope.items.push(notify);
                        });
                        $scope.remove = function (idx) {
                            $scope.items.splice(idx, 1);
                        };
                    }
                ],
                "scope": {}
            };
        }
    ]);
    app.factory("notify", [
        "$rootScope", function ($rootScope) {
            $rootScope.notifications = $rootScope.notifications || [];
            return {
                notify: function (notify) {
                    $rootScope.$broadcast("al:ui:notify", notify);
                }
            };
        }
    ]);
})(azureLensApp);
var Notification = (function () {
    function Notification() {
    }
    Notification.prototype.getStyle = function () {
        return NotificationStyle[this.style].toLowerCase();
    };
    return Notification;
})();
var NotificationStyle;
(function (NotificationStyle) {
    NotificationStyle[NotificationStyle["warning"] = 0] = "warning";
    NotificationStyle[NotificationStyle["danger"] = 1] = "danger";
    NotificationStyle[NotificationStyle["info"] = 2] = "info";
    NotificationStyle[NotificationStyle["success"] = 3] = "success";
})(NotificationStyle || (NotificationStyle = {}));
//# sourceMappingURL=notificationcenter.js.map