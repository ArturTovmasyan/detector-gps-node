/**
 * Created by andranik on 7/14/15.
 */

angular.module("Errors",[])
    .controller("ErrorsController",function($scope, $http, $filter){
        $scope.tableFilter = {};

        $http.get('/api/forecasting_errors')
            .success(function(data,status){
                console.log(data,status);
                $scope.errors = data;
            });


        $scope.filterByDate = function(single){
            if(!angular.isDefined($scope.tableFilter) ||
                angular.equals($scope.tableFilter,{})){
                return true;
            }

            if($filter('date')(single.date,"dd/MM/yyyy") == $scope.date){
                return false;
            }
            else {
                return true;
            }
        };
    });