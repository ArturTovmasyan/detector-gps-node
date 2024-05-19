'use strict';

angular.module("Buses",[])
    .controller("BusesController",function($scope, $http){
        $http.get('/api/gps_data')
            .success(function(data,status){
                console.log(data,status);
                $scope.gps = data;
            });

    });