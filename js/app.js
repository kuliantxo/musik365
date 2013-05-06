var projectModule = angular.module('project', ['ngCookies']);


projectModule.config(function($routeProvider, $locationProvider) {
	$locationProvider.html5Mode(true);
	$routeProvider
		.when('/debug', {templateUrl: '/partials/debug.html',   controller: DebugCtrl})
		.when('/stations', {templateUrl: '/partials/stations.html',   controller: StationsCtrl})
		.when('/genres', {templateUrl: '/partials/genres.html', controller: GenresCtrl})
		.when('/genres/:genreID', {templateUrl: '/partials/genres_stations.html', controller: GenresStationsCtrl})
		.when('/featured', {templateUrl: '/partials/featured.html', controller: FeaturedCtrl})
		.when('/played', {templateUrl: '/partials/played.html', controller: PlayedCtrl})
		.when('/search', {templateUrl: '/partials/search.html', controller: SearchCtrl})
//		.when('/login', {templateUrl: '/partials/login.html', controller: LoginCtrl})
		.otherwise({redirectTo: '/stations'})
});
