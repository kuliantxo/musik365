var projectModule = angular.module('project', []).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider.
		when('/debug', {templateUrl: 'partials/debug.html',   controller: DebugCtrl}).
		when('/stations', {templateUrl: 'partials/stations.html',   controller: StationsCtrl}).
		when('/genres', {templateUrl: 'partials/genres.html', controller: GenresCtrl}).
		when('/featured', {templateUrl: 'partials/featured.html', controller: FeaturedCtrl}).
		when('/played', {templateUrl: 'partials/played.html', controller: PlayedCtrl}).
		when('/search', {templateUrl: 'partials/search.html', controller: SearchCtrl}).
		otherwise({redirectTo: '/'});
}]);


//We already have a limitTo filter built-in to angular,
//let's make a startFrom filter
projectModule.filter('startFrom', function() {
	return function(input, start) {
		start = +start; //parse to int
		if (input !== undefined)
			return input.slice(start);
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


//
// Stations Controller
//
function StationsCtrl($scope, $http, mySharedService) {
	var url = 'http://www.live365.com/cgi-bin/directory.cgi?site=xml&access=PUBLIC&rows=100&only=P';

	$scope.currentPage = 0;
	$scope.pageSize = 5;
	$scope.pages = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

	$http.get('proxy.php?url='+encodeURIComponent(url)).success(function(data) {
		data.contents.LIVE365_STATION.forEach(function(e){
			e.status = 'paused';
		});
		$scope.stations = data.contents.LIVE365_STATION;
		mySharedService.prepForBroadcast($scope.stations[0]);

		$scope.numberOfPages = function(){
			return Math.ceil($scope.stations.length/$scope.pageSize);
		}
	});

	$scope.getClass = function(station) {
		if (station == $scope.currentStation) return $scope.currentStatus;
	}

	$scope.setCurrentPage = function(page) {
		$scope.currentPage = page;
	}

	$scope.setStation = function(station, play) {
		mySharedService.prepForBroadcast(station, play);
	}

	$scope.$on('handleStatusBroadcast', function() {
		$scope.$apply(function () {
			$scope.currentStation = mySharedService.station.STATION_BROADCASTER;
			$scope.currentStatus = mySharedService.station.status;
		});
	});
}


//
// Featured Controller
//
function FeaturedCtrl($scope, $http, mySharedService) {
	var url = 'http://doubleintegration.stop4art.com/featured.xml';

	$scope.currentPage = 0;
	$scope.pageSize = 5;
	$scope.pages = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

	$http.get('proxy.php?url='+encodeURIComponent(url)).success(function(data) {
		data.contents.LIVE365_STATION.forEach(function(e){
			e.status = 'paused';
		});
		$scope.stations = data.contents.LIVE365_STATION;

		$scope.numberOfPages = function(){
			return Math.ceil($scope.stations.length/$scope.pageSize);
		}
	});

	$scope.getClass = function(station) {
		if (station == $scope.currentStation) return $scope.currentStatus;
	}

	$scope.setCurrentPage = function(page) {
		$scope.currentPage = page;
	}

	$scope.setStation = function(station, play) {
		mySharedService.prepForBroadcast(station, play);
	}

	$scope.$on('handleStatusBroadcast', function() {
		$scope.$apply(function () {
			$scope.currentStation = mySharedService.station.STATION_BROADCASTER;
			$scope.currentStatus = mySharedService.station.status;
		});
	});
}


//
// Genres Controller
//
function GenresCtrl($scope, $http, mySharedService) {

	$scope.genres = [
			'Alternative',
			'Blues',
			'Classical',
			'Country',
			'Easy Listening',
			'Electronic/Dance',
			'Folk',
			'Freeform',
			'Hip-Hop/Rap',
			'Inspirational',
			'International',
			'Jazz',
			'Latin',
			'Metal',
			'New Age',
			'Oldies',
			'Pop',
			'R&B/Urban',
			'Reggae',
			'Rock',
			'Seasonal/Holiday',
			'Soundtracks',
			'Talk'
		];

	$scope.sel = 1;
	$scope.showSpinner = false;

	$scope.setStation = function(station, play) {
		mySharedService.prepForBroadcast(station, play);
	}

	$scope.getClass = function(station) {
		if (station == $scope.currentStation) return $scope.currentStatus;
	}

	$scope.clearData = function () {
		$scope.stations = [];
	};

	$scope.setSel = function (sel, genre) {
		$scope.showSpinner = true;
		var url = 'http://www.live365.com/cgi-bin/directory.cgi?site=xml&access=PUBLIC&rows=5&only=P&genre='+escape(genre);
		$scope.genreTitle = genre;

		$http.get('proxy.php?url='+encodeURIComponent(url)).success(function(data) {
			$scope.showSpinner = false;
			$scope.stations = data.contents.LIVE365_STATION;
		});

		$scope.sel = sel;
	};

	$scope.$on('handleStatusBroadcast', function() {
		$scope.$apply(function () {
			$scope.currentStation = mySharedService.station.STATION_BROADCASTER;
			$scope.currentStatus = mySharedService.station.status;
		});
	});
}


//
// Now Playing Controller
//
function PlayingCtrl($scope, $http, mySharedService, playedService, wikiService) {
	var pGress,
		pTosh,
		previous;

	$scope.nowPlaying = {
		stationName: 'Wava2',
		artist: 'Artist',
		title: 'Title',
		time: 321,
		progress: 0,
		album: 'Album',
		image: 'images/missing.png'
	};

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
		$http.get('proxy.php?url='+encodeURIComponent(url)).success(function(data) {
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
// Search Controller
//
function SearchCtrl($scope, $http, mySharedService) {
	$scope.message = { show: false, text: '' };

	$scope.search = function (query) {
		$scope.showSpinner = true;
		$scope.stations = [];
		var url = 'http://www.live365.com/cgi-bin/directory.cgi?s_match=all&site=xml&access=PUBLIC&rows=5&only=P&searchdesc='+$scope.query;

		$http.get('proxy.php?url='+encodeURIComponent(url)).success(function(data) {
			$scope.showSpinner = false;
			if (data.contents.LIVE365_STATION) {
				$scope.message = { show: false, text: '' };
				$scope.stations = data.contents.LIVE365_STATION;
			} else {
				$scope.message = { show: true, text: 'No result for "'+query+'".' };
				$scope.stations = [];
			}
		});
	};

	$scope.getClass = function(station) {
		if (station == $scope.currentStation) return $scope.currentStatus;
	}

	$scope.setStation = function(station, play) {
		mySharedService.prepForBroadcast(station, play);
	}

	$scope.$on('handleStatusBroadcast', function() {
		$scope.$apply(function () {
			$scope.currentStation = mySharedService.station.STATION_BROADCASTER;
			$scope.currentStatus = mySharedService.station.status;
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
}


//
// Player Controller
//
function PlayerCtrl($scope, mySharedService) {

	var station	= 'wava2',
		defaultVolume = 0.8,
		timer = 0,
		simplePlayer = document.getElementById('audio'),
		myConsole = document.getElementById('console');

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
		var entry = document.createElement("div");
		entry.innerHTML = e.type;
		console.log('on'+e.type);
//		myConsole.insertBefore(entry, myConsole.firstChild);
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
/*
	$scope.$on('handleBroadcast', function() {
//		simplePlayer.src = 'http://currentstream1.publicradio.org:80';
		simplePlayer.src = 'http://www.live365.com/play/'+mySharedService.station.STATION_BROADCASTER;
	});
*/
	$scope.$on('handlePlayBroadcast', function() {
		if (mySharedService.station.status == 'paused') {
			simplePlayer.src = 'http://www.live365.com/play/'+mySharedService.station.STATION_BROADCASTER;
			simplePlayer.play();
		} else {
			simplePlayer.pause();
		}
	});
}
