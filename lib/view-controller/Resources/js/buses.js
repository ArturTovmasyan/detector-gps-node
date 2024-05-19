'use strict';

angular.module("Buses",[])
    .controller("BusesController",function($scope, $http, $filter){
        $scope.tableFilter = {};

        $http.get('/api/gps_data')
            .success(function(data,status){
                console.log(data,status);
                $scope.gps = data;
            });

        $scope.filterByImei = function(single){
            if(!angular.isDefined($scope.tableFilter) ||
                angular.equals($scope.tableFilter,{})){
                return true;
            }

            if(single.imei.indexOf($scope.tableFilter.imei) === -1){
                return false;
            }
            else {
                return true;
            }
        };

        $scope.filterByPlateNumber = function(single){
            if(!angular.isDefined($scope.tableFilter) ||
                angular.equals($scope.tableFilter,{})){
                return true;
            }

            if(single.plate_number.indexOf($scope.tableFilter.plate_number) === -1){
                return false;
            }
            else {
                return true;
            }
        };

        $scope.filterByLineNumber = function(single){
            if(!angular.isDefined($scope.tableFilter) ||
                angular.equals($scope.tableFilter,{})){
                return true;
            }

            if(single.line_number == $scope.tableFilter.line_number){
                return false;
            }
            else {
                return true;
            }
        };

        $scope.filterByLineNumber = function(single){
            if(!angular.isDefined($scope.tableFilter) ||
                angular.equals($scope.tableFilter,{})){
                return true;
            }

            if($filter('date')(single.timestamp,"dd/MM/yyyy") == $scope.tableFilter.date){
                return false;
            }
            else {
                return true;
            }
        };



    });