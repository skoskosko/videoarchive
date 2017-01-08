var myapp = angular.module('myapp', ["ui.router","ngAnimate", "ui.bootstrap"])
myapp.config(function($stateProvider, $urlRouterProvider){
  $urlRouterProvider.otherwise("/videos")

  $stateProvider
    .state('Video', {
        url: "/videos",
        controller: 'route2',
        templateUrl: "route2.html"
    }) .state('Upload', {
        url: "/upload",
        controller: 'route1',
        templateUrl: "route1.html"
      })

});
