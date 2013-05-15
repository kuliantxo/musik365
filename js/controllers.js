function FeedbackCtrl($scope, $http) {
    $scope.submit = function(feedback) {
console.log(feedback);
/*
		$http({
			method: 'POST',
			url: '/bin/process.php',
			data: $.param(feedback),
			headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			}).success(function(data) {
				$('#feedback .modal-body').html("<div class='modal-content'></div>");
				$('#feedback .modal-content').html("<h2>Feedback Form Submitted!</h2>")
					.append("<p>We will be in touch soon.</p>")
					.hide()
					.fadeIn(1500, function() {
						$('#feedback .modal-content').append('<img id="checkmark" src="images/checkmark.png" width="40px">');
					});
			});
*/
		var dataString = 'name='+ feedback.name + '&email=' + feedback.email + '&comment=' + feedback.comment;
		$.ajax({
			type: "POST",
			url: "/bin/process.php",
			data: dataString,
			success: function() {
				$('#feedback .modal-body').html("<div class='modal-content'></div>");
				$('#feedback .modal-content').html("<h2>Feedback Form Submitted!</h2>")
					.append("<p>We will be in touch soon.</p>")
					.hide()
					.fadeIn(1500, function() {
						$('#feedback .modal-content').append('<img id="checkmark" src="images/checkmark.png" width="40px">');
					});
			}
		});
    };
}


function LoginCtrl($rootScope, $scope, $location, Auth, Session) {
    $scope.login = function(user) {
        Auth.login({
				email: user.email,
				password: user.password
            },
            function(res) {
				if(res.contents.Code == 0) {
					Session.login(res.contents);
				} else {
					$('#login .modal-body').prepend('<div class="error_msg">Login Failed!</div>');
				}
            },
            function(err) {
				$('#login .modal-body').prepend('<div class="error_msg">Login Failed!</div>');
            });
    };

	$scope.isLoggedIn = function() {
		return Session.isLoggedIn();
	}
}


function LogoutCtrl($rootScope, $scope, $location, Session) {
    $scope.logout = function(user) {
		Session.logout();
   };

	$scope.isLoggedIn = function() {
		return Session.isLoggedIn();
	}
}


function SignupCtrl($rootScope, $scope, $location, Auth) {
    $scope.signup = function(user) {
        Auth.signup({
                email: user.email,
                password: hex_md5(user.password)
            },
            function(res) {
                $location.path('/');
            },
            function(err) {
                alert("Failed to signup"+err);
            });
    };
}


function PaginationCtrl($scope, $element, $attrs, $transclude) {
	$scope.numberOfPages = 1;
	$scope.currentPage = 1;
	$scope.pageSize = 5;
	$scope.pages = [];

	$scope.$watch('stations', function() {
		$scope.pages = _.range(1, Math.ceil($scope.stations.length / $scope.pageSize + 1));
		$scope.numberOfPages = $scope.pages.length;
	});

	$scope.setCurrentPage = function(page) {
		$scope.currentPage = page;
	}
}

//
// Header Controller
//
function HeaderCtrl($scope, Session) {
	$scope.getLoginID = function() {
		return Session.getLoginID();
	}

	$scope.isLoggedIn = function() {
		return Session.isLoggedIn();
	}
}


//
// Navigation Controller
//
function NavCtrl ($scope, $location) {
	$scope.navClass = function (page) {
		var currentRoute = $location.path().substring(1) || 'home';
		return page === currentRoute ? 'selected' : '';
	}
}


//
// Genres Controller
//
function GenresCtrl($scope, mySharedService) {
	$scope.genres = mySharedService.genres;
}


//
// Stations Controller
//
function StationsCtrl($scope, $http, mySharedService, $routeParams, stationsFactory) {
	var params = '',
		currentStation = mySharedService.station.STATION_BROADCASTER,
		currentStatus = mySharedService.station.status;

	$scope.stations = [];
	$scope.class = 'loading';

	if ($routeParams.genreID) {
		myGen = _.find(mySharedService.genres, function(num) {return num.int == $routeParams.genreID});
		params = '&genre='+encodeURIComponent(myGen.ext);
		$scope.genreTitle = myGen.ext;
	}

	stationsFactory.async(params).then(function(data){
		$scope.stations = data;
		mySharedService.stations = data;
		$scope.class = '';
	});

	$scope.getClass = function(station) {
		if (station == currentStation) {
			return currentStatus;
		}
	}

	$scope.setStation = function(station, play) {
		mySharedService.prepForBroadcast(station, play);
	}

	$scope.$on('handleStatusBroadcast', function() {
		$scope.$apply(function () {
			currentStation = mySharedService.station.STATION_BROADCASTER;
			currentStatus = mySharedService.station.status;
		});
	});
}


//
// Search Controller
//
function SearchCtrl($scope, $http, mySharedService, stationsFactory) {

	var params = '',
		currentStation = mySharedService.station.STATION_BROADCASTER,
		currentStatus = mySharedService.station.status;

	$scope.class = '';
	$scope.message = { show: false, text: '' };
	$scope.stations = [];

	$scope.search = function (query) {
		$scope.class = 'loading';
		$scope.stations = [];
		params = '&searchdesc='+query;

		stationsFactory.async(params).then(function(data){
			if (data) {
				$scope.stations = data;
				$scope.message = { show: false, text: '' };
			} else {
				$scope.stations = [];
				$scope.message = { show: true, text: 'No result for "'+query+'".' };
			}
			$scope.class = '';
		});
	};

	$scope.getClass = function(station) {
		if (station == currentStation) return currentStatus;
	}

	$scope.setStation = function(station, play) {
		mySharedService.prepForBroadcast(station, play);
	}

	$scope.$on('handleStatusBroadcast', function() {
		$scope.$apply(function () {
			currentStation = mySharedService.station.STATION_BROADCASTER;
			currentStatus = mySharedService.station.status;
		});
	});
}


//
// Playing Controller
//
function PlayingCtrl($scope, $http, mySharedService, playedService, wikiService) {
	var pGress,
		pTosh,
		previous,
		url = 'http://www.live365.com/cgi-bin/directory.cgi?site=xml&access=PUBLIC&rows=1&only=P';

	$scope.nowPlaying = {
		stationName: 'Wava2',
		artist: 'Artist',
		title: 'Title',
		time: 321,
		progress: 0,
		album: 'Album',
		image: '/images/missing.png'
	};

	$http.get('http://doubleintegration.stop4art.com/proxy.php?url='+encodeURIComponent(url)).success(function(data) {
		mySharedService.prepForBroadcast(data.contents.LIVE365_STATION);
	});

	$scope.formatTrackTime = function (seconds) {
		var s = '';
		if (isNaN(seconds))
			seconds = 0;
		if (seconds >= 60)
			s = parseInt(seconds/60);
		seconds = seconds % 60;
		s += (seconds > 9) ? ":" : ":0";
		s += seconds;
		return s;
	}

	function handlePLSData(station, title) {
		if (pTosh) clearTimeout(pTosh);
		var url = 'http://www.live365.com/pls/front?handler=playlist&cmd=view&viewType=xml&handle='+station+'&maxEntries=1&tm=1348157450841';
		$http.get('http://doubleintegration.stop4art.com/proxy.php?url='+encodeURIComponent(url)).success(function(data) {
			if ((data.contents.PlaylistEntry.Artist != previous) || (data.contents.PlaylistEntry.Artist == '')) {
				if($scope.nowPlaying.artist != 'Artist') {
					playedService.addPlayed($scope.nowPlaying);
				}
				previous = data.contents.PlaylistEntry.Artist;
				wikiService.setData(data.contents.PlaylistEntry.Artist);

				var visualURL = data.contents.PlaylistEntry.visualURL.split('|');
				var visualURLEle = [];
				var visualURLData = {};

				for(var i = 0; i < visualURL.length; i++) {
					visualURLEle = visualURL[i].split('=');
					visualURLData[visualURLEle[0]] = visualURLEle[1];
				}

				var image = unescape(visualURLData.img);

				if (image && image !== 'undefined' && image.indexOf('noimage') == -1) {
					image = image.replace(/SL1[36]0/, 'SL320');
				} else {
					image = '/images/missing.png';
				}

				$scope.nowPlaying = {
					stationName: title,
					artist: data.contents.PlaylistEntry.Artist,
					title: data.contents.PlaylistEntry.Title,
					time: data.contents.PlaylistEntry.Seconds,
					album: data.contents.PlaylistEntry.Album,
					image: image
				};

				// problems updating the image from the model
				document.getElementById('cover').src = image;

				if (pGress) clearInterval(pGress);
				var playedSoFar = Math.max(data.contents.PlaylistEntry.Seconds - data.contents.Refresh, 0);
				pGress = setInterval(function() {
					var pVal = Math.round((playedSoFar++ * 100) / data.contents.PlaylistEntry.Seconds);
					if (pVal > 100) {
						clearInterval(pGress);
					} else {
						document.getElementById('progress').style.width = pVal+'%';
					}
				},1000);
			} else {
				refresh = 5;
			}

			pTosh = setTimeout(function() {
				handlePLSData(station, title);
			}, (data.contents.Refresh*1000));
		});
	}

	$scope.$on('handleBroadcast', function() {
		handlePLSData(mySharedService.station.STATION_BROADCASTER, mySharedService.station.STATION_TITLE);
	});
}


//
// Played Controller
//
function PlayedCtrl($scope, playedService) {
	$scope.lastPlayed = playedService.played();
}


//
// Debug Controller
//
function DebugCtrl($scope, mySharedService) {
	$scope.$on('handleDebugBroadcast', function() {
		$scope.$apply(function () {
			$scope.debugger = mySharedService.debug;
		});
	});

	$scope.$on('handlePlayerEventsBroadcast', function() {

		$scope.$apply(function () {
			$scope.events = mySharedService.playerEvents;
		});
	});
}


//
// Player Controller
//
function PlayerCtrl($scope, mySharedService) {

	var station	= 'wava2',
		defaultVolume = 0.8,
		timer = 0,
		simplePlayer = document.getElementById('audio');

	$scope.player = {
		status: 'paused'		// paused, buffering, playing, error
	};

	$scope.clickPlay = function() {
		if (simplePlayer.paused) {
//			simplePlayer.load();
			simplePlayer.src = 'http://www.live365.com/play/'+mySharedService.station.STATION_BROADCASTER;
			simplePlayer.play();
		} else {
			simplePlayer.pause();
		}
	}

	function bindEvent(element, type, handler) {
		if(element.addEventListener) {
			element.addEventListener(type, handler, false);
		} else {
			element.attachEvent('on'+type, handler);
		}
	}

	function logPlayerEvents(e) {
		console.log('on'+e.type);
		mySharedService.setPlayerEventsAndBroadcast('on'+e.type);
	}

	bindEvent(simplePlayer, 'abort', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'canplay', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'canplaythrough', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'durationchange', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'ended', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'error', function(e) {
		logPlayerEvents(e);
		logPlayerEvents(simplePlayer.error);
		$scope.$apply(function () {
			$scope.player.status = 'error';
		});
		mySharedService.setStatusAndBroadcast('error');

		setTimeout(function(){
			if (!simplePlayer.paused) {
				simplePlayer.load();
				simplePlayer.play();
			} else {
				simplePlayer.pause();
			}
		}, 3000);
	});

	bindEvent(simplePlayer, 'loadeddata', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'loadedmetadata', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'loadstar', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'pause', function(e) {
		logPlayerEvents(e);
		$scope.$apply(function () {
			$scope.player.status = 'paused';
		});
		mySharedService.setStatusAndBroadcast('paused');
	});

	bindEvent(simplePlayer, 'play', function(e) {
		logPlayerEvents(e);
		$scope.$apply(function () {
			$scope.player.status = 'buffering';
		});
		mySharedService.setStatusAndBroadcast('buffering');
	});

	bindEvent(simplePlayer, 'playing', function(e) {
		logPlayerEvents(e);
		$scope.$apply(function () {
			$scope.player.status = 'playing';
		});
		mySharedService.setStatusAndBroadcast('playing');
	});

	bindEvent(simplePlayer, 'progress', function(e) {
//		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'ratechange', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'readystatechange', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'seeked', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'seeking', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'stalled', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'suspend', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'timeupdate', function(e) {
//		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'volumechange', function(e) {
		logPlayerEvents(e);
	});

	bindEvent(simplePlayer, 'waiting', function(e) {
		logPlayerEvents(e);
	});

	var myVar = setInterval(function(){
		var buffered = 0;
		if (simplePlayer.buffered != null && simplePlayer.buffered.length) {
			buffered = simplePlayer.buffered.end(simplePlayer.buffered.length -1);
		}

		$scope.debugger = {
			timer: timer,
			paused: simplePlayer.paused,
			duration: simplePlayer.duration,
			currentTime: simplePlayer.currentTime,
			buffered: buffered,
//			seekable: simplePlayer.seekable.end(0),
			readyState: simplePlayer.readyState,
			preload: simplePlayer.preload,
			currentSrc: simplePlayer.currentSrc
		};

		mySharedService.setDebugAndBroadcast($scope.debugger);

		timer += 1;
	},1000);

	simplePlayer.volume = defaultVolume;

	$scope.$on('handlePlayBroadcast', function() {
		if (mySharedService.station.status == 'paused') {
			simplePlayer.src = 'http://www.live365.com/play/'+mySharedService.station.STATION_BROADCASTER;
			simplePlayer.play();
		} else {
			simplePlayer.pause();
		}
	});
}
