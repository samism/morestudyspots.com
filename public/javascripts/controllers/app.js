var morestudyspots = angular.module('morestudyspots', ['ngRoute', 'ngMap']);

morestudyspots.config(['$routeProvider', function($routeProvider){
    $routeProvider.
        when('/', {
            templateUrl: '../partials/main.html',
            controller: 'MainController'
        }).
        when('/spots', {
            templateUrl: '../partials/spots.html',
            controller: 'AppController'
        }).
        otherwise({
            redirectTo: '/'
        });
}]);

morestudyspots.filter('range', function() {
    return function(val, range) {
        range = parseInt(range);
        for (var i = 0; i < range; i++)
            val.push(i);
        return val;
    };
});

morestudyspots.filter('orderObjectBy', function(){
    return function(input, attribute) {
        if (!angular.isObject(input)) return input;

        var array = [];
        for(var objectKey in input) {
            if(input.hasOwnProperty(objectKey))
                array.push(input[objectKey]);
        }

        array.sort(function(a, b){
            a = parseInt(a[attribute]);
            b = parseInt(b[attribute]);
            return a - b;
        });
        return array;
    }
});

morestudyspots.controller('AppController', ['$scope', '$http', function ($scope, $http) {
    $http.get('spot-file.json').success(function (data) {
        $scope.spots = data;
    });

    $scope.iterateObject = function (obj, stack) {
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (typeof obj[property] == "object") {
                    $scope.iterateObject(obj[property], stack + '.' + property);
                } else {
                    console.log(property + "   " + obj[property]);
                }
            }
        }
    };

    //probably decouple this so theres only 1 method for setting userLocation
    $scope.locateBrowser = function() {
        if (navigator.geolocation) {
            window.navigator.geolocation.getCurrentPosition(function (pos) {
                $http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng='
                    + pos.coords.latitude
                    + ','
                    + pos.coords.longitude
                    + '&sensor=true').then(function (res) {
                    $scope.userLocation = res.data;
                    console.log($scope.userLocation);
                    $scope.addrQuery = $scope.userLocation.results[0].formatted_address;
                });
            });
        }
    };

    //gets shortest diagonal path
    //not realistic because streets are not diagonal
    //for just chicago, probably undershoots by 0.5 mile?
    $scope.haversine = function(lat1, lng1, lat2, lng2) {
        var r = 3956; //miles
        var dLat = (lat2 - lat1) * (Math.PI / 180);
        var dLng = (lng2 - lng1) * (Math.PI / 180);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180))
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = (r * c).toFixed(2); //round to 2 decimal places
        return d;
    };

    //depends on userLocation to be defined
    $scope.evaluateDistance = function () {
        for (var i in $scope.spots) {
            if ($scope.spots.hasOwnProperty(i)) {
                var spot = $scope.spots[i];
                console.log("Distance from user to: " + spot.name);
                $scope.spots[spot].distanceFromUser = $scope.haversine(
                    $scope.userLocation.results[0].geometry.location.lat,
                    $scope.userLocation.results[0].geometry.location.lng,
                    spot.address.lat,
                    spot.address.long
                );

                console.log($scope.distanceFromUser[spot] + " miles.");
            }
        }
    };

    //attempt to get lat/long from HTML5
    $scope.locateBrowser();

    //onChange
    $scope.$watch('addrQuery', function(value){
        //this can really be any form of an address...not just zip
        //...but zip is the most accurate for the amount of characters user will type
        if(value.length === 5) {
            $http.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + $scope.addrQuery).
                then(function(res){
                    $scope.userLocation = res.data;
                });
        }
        $scope.evaluateDistance();
        //use promise feature for this becuase evaluateDistance needs userLocation to be defined
        //and it takes a few seconds for the http request to return data
        //http://stackoverflow.com/questions/18421830/how-to-wait-till-the-response-comes-from-the-http-request-in-angularjs
    });

    $scope.map = $("map").css("height", $(window).height() - 95 + "px");
}]);