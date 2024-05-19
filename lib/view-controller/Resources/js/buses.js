'use strict';

angular.module("Buses",[])
    .controller("BusesController",function($scope, $http, $filter){
        $scope.tableFilter = {};

        $http.get('/api/gps_data')
            .success(function(data,status){
                console.log(data,status);
                $scope.gps = data;
            });


        $scope.filterByDate = function(single){
            if(!angular.isDefined($scope.tableFilter) ||
                angular.equals($scope.tableFilter,{})){
                return true;
            }

            if($filter('date')(single.timestamp,"dd/MM/yyyy") == $scope.date){
                return false;
            }
            else {
                return true;
            }
        };



    });