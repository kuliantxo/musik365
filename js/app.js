var projectModule = angular.module('project', []);


projectModule.config(function($routeProvider, $locationProvider) {
	$locationProvider.html5Mode(true);
	$routeProvider.
	when('/debug', {templateUrl: '/partials/debug.html',   controller: DebugCtrl}).
	when('/stations', {templateUrl: '/partials/stations.html',   controller: StationsCtrl}).
	when('/genres', {templateUrl: '/partials/genres.html', controller: GenresCtrl}).
	when('/genres/:genreID', {templateUrl: '/partials/genres_stations.html', controller: GenresStationsCtrl}).
	when('/featured', {templateUrl: '/partials/featured.html', controller: FeaturedCtrl}).
	when('/played', {templateUrl: '/partials/played.html', controller: PlayedCtrl}).
	when('/search', {templateUrl: '/partials/search.html', controller: SearchCtrl}).
	otherwise({redirectTo: '/stations'})
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


//We already have a limitTo filter built-in to angular,
//let's make a startFrom filter
projectModule.filter('startFrom', function() {
	return function(input, start) {
		start = +start; //parse to int
		if (input !== undefined)
			return input.slice(start);
	}
});


projectModule.filter('genrePath', function() {
	return function(genre) {
		return encodeURIComponent(encodeURIComponent(genre));
	}
});


projectModule.filter('genreUnPath', function() {
	return function(genre) {
		return decodeURIComponent(genre);
	}
});


projectModule.service('playedService', function () {
	var data = [];

	return {
		played: function () {
			return data;
		},
		addPlayed: function (played) {
			data.unshift(played);
		}
	};
});


projectModule.factory('mySharedService', function($rootScope) {
	var sharedService = {};

	sharedService.station = {};
	sharedService.debug = {};
	sharedService.playerEvents = [];
	sharedService.genres = [
		{int: 'alternative', ext: 'Alternative'},
		{int: 'blues', ext: 'Blues'},
		{int: 'classical', ext: 'Classical'},
		{int: 'country', ext: 'Country'},
		{int: 'easy', ext: 'Easy Listening'},
		{int: 'electronic', ext: 'Electronic/Dance'},
		{int: 'folk', ext: 'Folk'},
		{int: 'freeform', ext: 'Freeform'},
		{int: 'hiphop', ext: 'Hip-Hop/Rap'},
		{int: 'inspirational', ext: 'Inspirational'},
		{int: 'international', ext: 'International'},
		{int: 'jazz', ext: 'Jazz'},
		{int: 'latin', ext: 'Latin'},
		{int: 'metal', ext: 'Metal'},
		{int: 'new_age', ext: 'New Age'},
		{int: 'oldies', ext: 'Oldies'},
		{int: 'pop', ext: 'Pop'},
		{int: 'rb', ext: 'R&B/Urban'},
		{int: 'reggae', ext: 'Reggae'},
		{int: 'rock', ext: 'Rock'},
		{int: 'holiday', ext: 'Seasonal/Holiday'},
		{int: 'soundtracks', ext: 'Soundtracks'},
		{int: 'talk', ext: 'Talk'}
	];

	sharedService.prepForBroadcast = function(station, play) {
		if ((this.station.STATION_BROADCASTER == station.STATION_BROADCASTER) && (play === true)) {
			this.broadcastPlay();
		} else {
			this.station = station;
			this.station.status = 'paused';
			this.broadcastItem();
			if (play === true)
				this.broadcastPlay();
		}
	};

	sharedService.setStatusAndBroadcast = function(status) {
		this.station.status = status;
		this.broadcastStatus();
	};

	sharedService.setDebugAndBroadcast = function(data) {
		this.debug = data;
		this.broadcastDebug();
	};

	sharedService.setPlayerEventsAndBroadcast = function(event) {
		this.playerEvents.unshift(event);
		this.broadcastPlayerEvents();
	};

	sharedService.broadcastItem = function() {
		$rootScope.$broadcast('handleBroadcast');
	};

	sharedService.broadcastPlay = function() {
		$rootScope.$broadcast('handlePlayBroadcast');
	};

	sharedService.broadcastStatus = function() {
		$rootScope.$broadcast('handleStatusBroadcast');
	};

	sharedService.broadcastDebug = function() {
		$rootScope.$broadcast('handleDebugBroadcast');
	};

	sharedService.broadcastPlayerEvents = function() {
		$rootScope.$broadcast('handlePlayerEventsBroadcast');
	};

	return sharedService;
});


projectModule.factory('wikiService', function () {
	var wikiData = {};

	$wiki_content = $('#wiki-content');

	wikiData.setData = function(artist, clean) {
		if (! artist || (typeof artist !== 'string') || (artist == 'ID/PSA')) {
			return false;
		}

		if (clean == true) {
			artist = artist.toLowerCase();
			artist = artist.replace('$', 's');
			artist = artist.replace(/ \&.*/, '');
			artist = artist.replace(/ w\/ .*/, '');
			artist = artist.replace(/ f\/ .*/, '');
			artist = artist.replace(/ and .*/, '');
			artist = artist.replace(/ with .*/, '');
			artist = artist.replace(/ fea.*/, '');
			artist = artist.replace(/ ft.*/, '');
			artist = artist.replace(/\s*[\(\/\[].*/, '');
			artist = artist.replace(/,.*/, '');
			artist = StripAccents(artist);
		}

		$.ajax({
			url: 'http://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=site:en.wikipedia.org "'+artist+'" singer OR band OR entertainer OR genres OR labels',
			dataType: 'jsonp',
			success: function(data) {
				var text = '',
					title = '',
					resultsLength = data.responseData.results.length;
				if (resultsLength > 0) {
					for (var i = 0; i < resultsLength; i++) {
						var xURL = decodeURI(data.responseData.results[i].unescapedUrl);
						var xTitle = decodeURI(data.responseData.results[i].titleNoFormatting);

						if (clean == true) {
							xTitle = StripAccents(xTitle);
						}

						if (xTitle.toLowerCase().indexOf(artist.toLowerCase()) > -1) {
							text = xURL;
							title = text.substring(text.indexOf("wiki/") + 5);
							break;
						}
					}
				}
				if (! title) {
					if (clean === undefined) {
						wikiData.setData(artist, true);
						return false;
					}
					return false;
				}

				$.ajax({
					url: 'http://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&rvprop=content&rvsection=0&rvlimit=1&callback=?&redirects',
					dataType: 'json',
					data: { titles: title },
					success: function(data) {
						for (pageid in data.query.pages) break;
						if (pageid == '-1') {
							return false;
						}
						$wiki_content.html('');
						var thistext = data.query.pages[pageid].revisions[0]['*'];
						thistext = thistext.replace(/{{.*?}}/g, '');

						$.ajax({
							url: 'http://en.wikipedia.org/w/api.php?action=parse&format=json&callback=?',
							dataType: 'json',
							data: { text: thistext },
							success: function(parsedata) {
								var pd = parsedata.parse.text['*'];
								pd = pd.replace("<p><br /></p>", '');
								var text = $('<div>' + pd + '</div>');
								$(text).find('a').removeAttr('href');
								if($(text).find('.infobox .image').parent().html()) {
									$wiki_content.append('<div style="float: right; width: 230px; margin: 0 0 5px 15px;">' + $(text).find('.infobox .image').parent().html() + '</div>');
								}
								$(text).find('table,sup,.error').remove();
								$wiki_content.append('<h3>'+data.query.pages[pageid].title+'</h3>')
									.append( $(text).find('p') )
									.append('<p><i>More from <a class="external" target="_blank" href="http://en.wikipedia.org/wiki/' + data.query.pages[pageid].title + '">Wikipedia*</a></i></p>');
								var wImage = $('.image img', $wiki_content),
									wImageWidth = wImage.attr("width"),
									wImageHeight = wImage.attr("height");
								wImage.css({
									"margin" : "5px",
									"height" : (220 * wImageHeight) / wImageWidth + "px",
									"width" : "220px"
								});
							}
						});
					}
				});
			}
		});
	};

	return wikiData;
});


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
// Genres Stations Controller
//
function GenresStationsCtrl($scope, $http, mySharedService, $routeParams) {

   	var myGen = mySharedService.genres[0],
		url = 'http://www.live365.com/cgi-bin/directory.cgi?site=xml&access=PUBLIC&rows=5&only=P&genre=',
		currentStation = mySharedService.station.STATION_BROADCASTER,
		currentStatus = mySharedService.station.status;


	for(var i = 0; i < mySharedService.genres.length; i++) {
		if (mySharedService.genres[i].int == $routeParams.genreID) {
			myGen = mySharedService.genres[i];
			break;
		}
	}

	url += encodeURIComponent(myGen.ext);
console.log( url );

	$scope.class = 'loading';

	$scope.genreTitle = myGen.ext;

	$http.get('http://doubleintegration.stop4art.com/proxy.php?url='+encodeURIComponent(url)).success(function(data) {
		$scope.stations = data.contents.LIVE365_STATION;
		$scope.class = '';
	});

	$scope.setStation = function(station, play) {
		mySharedService.prepForBroadcast(station, play);
	}

	$scope.getClass = function(station) {
		if (station == currentStation) return currentStatus;
	}

	$scope.$on('handleStatusBroadcast', function() {
		$scope.$apply(function () {
			currentStation = mySharedService.station.STATION_BROADCASTER;
			currentStatus = mySharedService.station.status;
		});
	});
}


//
// Featured Controller
//
function FeaturedCtrl($scope, $http, mySharedService) {

	var url = 'http://doubleintegration.stop4art.com/featured.xml',
		currentStation = mySharedService.station.STATION_BROADCASTER,
		currentStatus = mySharedService.station.status;

	$scope.class = 'loading';
	$scope.currentPage = 0;
	$scope.pageSize = 5;
	$scope.pages = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

	$http.get('http://doubleintegration.stop4art.com/proxy.php?url='+encodeURIComponent(url)).success(function(data) {
		data.contents.LIVE365_STATION.forEach(function(e){
			e.status = 'paused';
		});
		$scope.stations = data.contents.LIVE365_STATION;

		$scope.numberOfPages = function(){
			return Math.ceil($scope.stations.length/$scope.pageSize);
		}

		$scope.class = '';
	});

	$scope.getClass = function(station) {
		if (station == currentStation) return currentStatus;
	}

	$scope.setCurrentPage = function(page) {
		$scope.currentPage = page;
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
// Now Playing Controller
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
console.log('http://doubleintegration.stop4art.com/proxy.php?url='+encodeURIComponent(url));
console.log(data);
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
// Stations Controller
//
function StationsCtrl($scope, $http, mySharedService) {
	var url = 'http://www.live365.com/cgi-bin/directory.cgi?site=xml&access=PUBLIC&rows=100&only=P',
		currentStation = mySharedService.station.STATION_BROADCASTER,
		currentStatus = mySharedService.station.status;

	$scope.class = 'loading';
	$scope.currentPage = 0;
	$scope.pageSize = 5;
	$scope.pages = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

	$http.get('http://doubleintegration.stop4art.com/proxy.php?url='+encodeURIComponent(url)).success(function(data) {
		$scope.stations = data.contents.LIVE365_STATION;
		mySharedService.stations = data.contents.LIVE365_STATION;
		$scope.class = '';
	});

	$scope.numberOfPages = function(){
		return $scope.pages.length;
	}

	$scope.getClass = function(station) {
		if (station == currentStation) {
			return currentStatus;
		}
	}

	$scope.setCurrentPage = function(page) {
		$scope.currentPage = page;
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
function SearchCtrl($scope, $http, mySharedService) {
	
	var currentStation = mySharedService.station.STATION_BROADCASTER,
		currentStatus = mySharedService.station.status;


	$scope.class = '';
	$scope.message = { show: false, text: '' };

	$scope.search = function (query) {
		$scope.class = 'loading';
		$scope.stations = [];
		var url = 'http://www.live365.com/cgi-bin/directory.cgi?s_match=all&site=xml&access=PUBLIC&rows=5&only=P&searchdesc='+$scope.query;

		$http.get('http://doubleintegration.stop4art.com/proxy.php?url='+encodeURIComponent(url)).success(function(data) {
			if (data.contents.LIVE365_STATION) {
				$scope.message = { show: false, text: '' };
				$scope.stations = data.contents.LIVE365_STATION;
			} else {
				$scope.message = { show: true, text: 'No result for "'+query+'".' };
				$scope.stations = [];
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
// Last Played Controller
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