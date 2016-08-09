'use strict';

/**
 * @ngdoc overview
 * @name hackathonSiteApp
 * @description
 * # hackathonSiteApp
 *
 * Main module of the application.
 */
angular
  .module('hackathonSiteApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.router'
  ])
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/main');

    $stateProvider.state("main", {
      url: "/main",
      templateUrl: "views/main.html"
    });

    $stateProvider.state("team", {
      url: "/team",
      templateUrl: "views/team.html"
    });

    $stateProvider.state("sponsor", {
      url: "/sponsor",
      templateUrl: "views/sponsor.html"
    });

    $stateProvider.state("design", {
      url: "/design",
      templateUrl: "views/design.html"
    });
  });
