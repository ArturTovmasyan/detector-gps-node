'use strict';

angular.module("Buses",[])
    .controller("BusesController",function($scope, $http){
        $http.post('api/charts_data',{})
            .success(function(data,status){
                console.log(data,status);
            })

    });