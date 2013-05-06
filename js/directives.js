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


projectModule.directive('logicOption', function() {
	return {
		replace: false,
		template: '<a class="bc_url" href="{{station.STATION_BROADCASTER_URL}}" title="{{station.STATION_BROADCASTER_URL}}" target="_blank"><img src="/images/home.png"></a> \
			<h3><a href ng-click="setStation(station, true)">{{station.STATION_TITLE}}<span></span></a></h3> \
			<div>{{station.STATION_DESCRIPTION}}</div> \
			<div class="station_loc"><em>{{station.STATION_LOCATION}}</em></div> \
			<div><em>{{station.STATION_GENRE}}</em></div>'
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


