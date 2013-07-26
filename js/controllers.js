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
		$scope.pages = _.range(1, Math.ceil(($scope.stations.length) / $scope.pageSize + 1));
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
	
	$scope.search = function(q) {
		$location.path('/search/'+q);
	}
}


//
// Genres Controller
//
function GenresCtrl($scope, genresFactory) {
	$scope.genres = genresFactory.getGenres();
}


//
// Stations Controller
//
function StationsCtrl($scope, $http, nowPlayingFactory, $routeParams, stationsFactory, genresFactory) {
	var params = '',
		currentStation = nowPlayingFactory.getStationBroadcaster(),
		currentStatus = nowPlayingFactory.getStationStatus();

	$scope.stations = [];
	$scope.class = 'loading';

	if ($routeParams.genreID) {
		myGen = _.find(genresFactory.getGenres(), function(num) {return num.int == $routeParams.genreID});
		params = '&genre='+encodeURIComponent(myGen.ext);
		$scope.genreTitle = myGen.ext;
	}

	stationsFactory.async(params).then(function(data){
		$scope.stations = data;
		$scope.class = '';
	});

	$scope.getClass = function(station) {
		if (station == currentStation) {
			return currentStatus;
		}
	}

	$scope.setStation = function(station, play) {
		nowPlayingFactory.prepForBroadcast(station, play);
	}

	$scope.$on('handleStatusBroadcast', function() {
		$scope.$apply(function () {
			currentStation = nowPlayingFactory.getStationBroadcaster();
			currentStatus = nowPlayingFactory.getStationStatus();
		});
	});
}


//
// Search Controller
//
function SearchCtrl($scope, $http, nowPlayingFactory, stationsFactory, $routeParams) {

	var params = '&searchdesc='+$routeParams.query,
		currentStation = nowPlayingFactory.getStationBroadcaster(),
		currentStatus = nowPlayingFactory.getStationStatus();

	$scope.title = $routeParams.query;
	$scope.message = { show: false, text: '' };
	$scope.stations = [];
	$scope.class = 'loading';

	stationsFactory.async(params).then(function(data){
		if (data) {
			$scope.stations = data;
			$scope.message = { show: false, text: '' };
		} else {
			$scope.stations = [];
			$scope.message = { show: true, text: 'No result for "'+$routeParams.query+'".' };
		}
		$scope.class = '';
	});

	$scope.getClass = function(station) {
		if (station == currentStation) return currentStatus;
	}

	$scope.setStation = function(station, play) {
		nowPlayingFactory.prepForBroadcast(station, play);
	}

	$scope.$on('handleStatusBroadcast', function() {
		$scope.$apply(function () {
			currentStation = nowPlayingFactory.getStationBroadcaster();
			currentStatus = nowPlayingFactory.getStationStatus();
		});
	});
}


//
// Playing Controller
//
function PlayingCtrl($scope, $http, nowPlayingFactory, playedService, wikiService) {
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

	$http.get('/proxy.php?url='+encodeURIComponent(url)).success(function(data) {
		nowPlayingFactory.prepForBroadcast(data.contents.LIVE365_STATION);
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
		$http.get('/proxy.php?url='+encodeURIComponent(url)).success(function(data) {
			if ((data.contents.PlaylistEntry.Artist != previous) || (data.contents.PlaylistEntry.Artist == '')) {
				if($scope.nowPlaying.artist != 'Artist') {
					playedService.addPlayed($scope.nowPlaying);
				}
				previous = data.contents.PlaylistEntry.Artist;
				wikiService.setData(data.contents.PlaylistEntry.Artist);

				var image = '/images/missing.png';

				if(data.contents.PlaylistEntry.visualURL) {
					var visualURL = data.contents.PlaylistEntry.visualURL.split('|');
					var visualURLEle = [];
					var visualURLData = {};

					for(var i = 0; i < visualURL.length; i++) {
						visualURLEle = visualURL[i].split('=');
						visualURLData[visualURLEle[0]] = visualURLEle[1];
					}
					
					image = unescape(visualURLData.img);
					
					if (image && image !== 'undefined' && image.indexOf('noimage') == -1) {
						image = image.replace(/SL1[36]0/, 'SL320');
					}
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
		handlePLSData(nowPlayingFactory.getStationBroadcaster(), nowPlayingFactory.getStationTitle());
	});
}


//
// Played Controller
//
function PlayedCtrl($scope, playedService) {
	var amount = 5;

	$scope.lastPlayed = playedService.played();

    $scope.limit = amount;

    $scope.hiddenCount = function() {
	    return $scope.lastPlayed.length - $scope.limit;
	}

    $scope.showMore = function() {
   		$scope.limit += ($scope.hiddenCount() < 5) ? $scope.hiddenCount() : amount;
    };

    $scope.showHideMore = function() {
console.log($scope.limit +', '+ amount);
   		if ($scope.limit > amount)
			return true;
		else 
			return false;
    };

    $scope.hideMore = function() {
   		$scope.limit = amount;
    };
}


//
// Debug Controller
//
function DebugCtrl($scope, debugFactory) {
	$scope.$on('handleDebugBroadcast', function() {
		$scope.$apply(function () {
			$scope.debugger = debugFactory.getDebug();
		});
	});

	$scope.$on('handlePlayerEventsBroadcast', function() {
		$scope.$apply(function () {
			$scope.events = debugFactory.getEvents();
		});
	});
}


//
// Player Controller
//
function PlayerCtrl($scope, nowPlayingFactory, debugFactory) {

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
			simplePlayer.src = 'http://www.live365.com/play/'+nowPlayingFactory.getStationBroadcaster();
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
		debugFactory.setPlayerEventsAndBroadcast('on'+e.type);
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
		nowPlayingFactory.setStatusAndBroadcast('error');

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
		nowPlayingFactory.setStatusAndBroadcast('paused');
	});

	bindEvent(simplePlayer, 'play', function(e) {
		logPlayerEvents(e);
		$scope.$apply(function () {
			$scope.player.status = 'buffering';
		});
		nowPlayingFactory.setStatusAndBroadcast('buffering');
	});

	bindEvent(simplePlayer, 'playing', function(e) {
		logPlayerEvents(e);
		$scope.$apply(function () {
			$scope.player.status = 'playing';
		});
		nowPlayingFactory.setStatusAndBroadcast('playing');
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

		debugFactory.setDebugAndBroadcast($scope.debugger);

		timer += 1;
	},1000);

	simplePlayer.volume = defaultVolume;

	$scope.$on('handlePlayBroadcast', function() {
		if (nowPlayingFactory.getStationStatus() == 'paused') {
			simplePlayer.src = 'http://www.live365.com/play/'+nowPlayingFactory.getStationBroadcaster();
			simplePlayer.play();
		} else {
			simplePlayer.pause();
		}
	});
}
