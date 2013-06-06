projectModule.directive('feedback', function() {
	return {
		templateUrl: '/partials/feedback.html',
		restrict: 'E',
		controller: FeedbackCtrl
	};
});


projectModule.directive('logout', function() {
	return {
		templateUrl: '/partials/logout.html',
		restrict: 'E',
		controller: LogoutCtrl
	};
});


projectModule.directive('login', function() {
	return {
		templateUrl: '/partials/login.html',
		restrict: 'E',
		controller: LoginCtrl
	};
});


projectModule.directive('stations', function() {
	return {
		restrict: 'E',
		template: '\
			<pagidots></pagidots>\
			\
			<ul class="stations">\
				<li ng-repeat="station in stations | startFrom:(currentPage-1)*pageSize | limitTo:pageSize" ng-class="getClass(station.STATION_BROADCASTER)" logic-option></li>\
			</ul>\
			\
			<pagination></pagination>\
		'
	};	
});


projectModule.directive('enlarge', function() {
	return {
		restrict: 'E',
		template: '<a href id="enlarge-reduce" ng-click="edit()">enlarge/reduce</a>',
	    link: function(scope, element, attrs) {
			scope.edit = function() {
				$('#now-playing').toggleClass('minimize');
				$('#enlarge-reduce').toggleClass('reduce');
			};
	    }
	};	
});


projectModule.directive('pagidots', function() {
	return {
		restrict: 'E',
		template: '\
			<div class="dots">\
				<a href ng-repeat="page in pages" ng-class="{active: page==currentPage}" ng-click="setCurrentPage(page)">{{page}}</a>\
			</div>\
		',
		controller: PaginationCtrl
	};	
});


projectModule.directive('pagination', function() {
	return {
		restrict: 'E',
		template: '\
			<div style="text-align: center" ng-show="numberOfPages > 0">\
				<button ng-disabled="currentPage == 1" ng-click="currentPage=1">First</button>\
				<button ng-disabled="currentPage == 1" ng-click="currentPage=currentPage-1">Previous</button>\
				{{currentPage}}/{{numberOfPages}}\
				<button ng-disabled="currentPage >= numberOfPages" ng-click="currentPage=currentPage+1">Next</button>\
				<button ng-disabled="currentPage >= numberOfPages" ng-click="currentPage=numberOfPages">Last</button>\
			</div>\
		',
		controller: PaginationCtrl
	};	
});


projectModule.directive('logicOption', function() {
	return {
		replace: false,
		template: '\
			<a class="bc_url" href="{{station.STATION_BROADCASTER_URL}}" title="{{station.STATION_BROADCASTER_URL}}" target="_blank"><img src="/images/home.png"></a>\
			<h3><a href ng-click="setStation(station, true)">{{station.STATION_TITLE}}<span></span></a></h3>\
			<div>{{station.STATION_DESCRIPTION}}</div>\
			<div class="station_loc"><em>{{station.STATION_LOCATION}}</em></div>\
			<div><em>{{station.STATION_GENRE}}</em></div>\
		'
	};	
});


projectModule.directive('initFocus', function() {
	var timer;

	return function(scope, elm, attr) {
		if (timer) clearTimeout(timer);
		
		timer = setTimeout(function() {
			elm.focus();
		}, 0);
	};
});


