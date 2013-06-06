projectModule.service('Session', function () {
	this.user = {};

	this.logout = function () {
		this.user = {};
	}

	this.login = function (user) {
		this.user = user;
	}

	this.getLoginID = function () {
		return this.user.Login_ID;
	}

	this.isLoggedIn = function () {
		return this.user.Login_ID ? true : false;
	}
});


projectModule.factory('Auth', function($http){
    return {
        signup: function(user, success, error) {
			var url = 'http://www.live365.com/cgi-bin/api_login.cgi?org='+org+'&membername='+$scope.email+'&password='+epassword;
            $http.post('/api/signup', user).success(success).error(error);
        },
        login: function(user, success, error) {
			var now = new Date(),
				dropDead = Math.round(now.getTime()/1000) + (60*60*2),
				org = 'live365',
				epassword = hex_md5(user.password + dropDead + org + user.email) + "-" + dropDead + "-" + user.email,
				url = 'http://www.live365.com/cgi-bin/api_login.cgi?version=7&action=login&org='+org+'&membername='+user.email+'&epassword='+epassword+'&app_id=live365:R365-Andro2',
				proxy = '/proxy.php?url='+encodeURIComponent(url);

			$http.get(proxy).success(success).error(error);
        },
        logout: function(success, error) {
            $http.post('/api/logout').success(success).error(error);
        }
    };
});


projectModule.factory('playedService', function () {
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


projectModule.factory('debugFactory', function () {
	var debug = {};
	
	broadcastDebug = function() {
		$rootScope.$broadcast('debugBroadcast');
	};

	return {
		getDebug: function () {
			return debug;
		},
		setDebug: function (data) {
			debug = data;
			broadcastDebug();
		}
	};
});


projectModule.factory('genresFactory', function () {
	var genres = [
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

	return {
		getGenres: function () {
			return genres;
		}
	};
});


projectModule.factory('stationsFactory', function ($http) {
	var url = 'http://www.live365.com/cgi-bin/directory.cgi?site=xml&access=PUBLIC&rows=100&only=P';

	return myService = {
		async: function(params) {
			return promise = $http.get('/proxy.php?url='+encodeURIComponent(url+params)).then(function (response) {
				var d = response.data.contents.LIVE365_STATION;

				if( Object.prototype.toString.call( d ) === '[object Array]' ) {
					return d;
				} else if( typeof d  !== 'undefined' ) {
					return [d];
				} else {
					return;
				}
			});
		}
	};
});


projectModule.factory('debugFactory', function($rootScope) {
	var debug = {},
		playerEvents = [];

	broadcastDebug = function() {
		$rootScope.$broadcast('handleDebugBroadcast');
	};

	broadcastPlayerEvents = function() {
		$rootScope.$broadcast('handlePlayerEventsBroadcast');
	};

	return {
		setDebugAndBroadcast: function(data) {
			debug = data;
			broadcastDebug();
		},
		setPlayerEventsAndBroadcast: function(event) {
			playerEvents.unshift(event);
			broadcastPlayerEvents();
		},
		getDebug: function () {
			return debug;
		},
		getEvents: function () {
			return playerEvents;
		}
	};
});


projectModule.factory('nowPlayingFactory', function($rootScope) {
	var station = {};

	broadcastItem = function() {
		$rootScope.$broadcast('handleBroadcast');
	};

	broadcastPlay = function() {
		$rootScope.$broadcast('handlePlayBroadcast');
	};

	broadcastStatus = function() {
		$rootScope.$broadcast('handleStatusBroadcast');
	};

	return {
		prepForBroadcast: function(stn, play) {
			if ((station.STATION_BROADCASTER == stn.STATION_BROADCASTER) && (play === true)) {
				broadcastPlay();
			} else {
				station = stn;
				station.status = 'paused';
				broadcastItem();
				if (play === true)
					broadcastPlay();
			}
		},
		setStatusAndBroadcast: function(status) {
			station.status = status;
			broadcastStatus();
		},
		getStationBroadcaster: function () {
			return station.STATION_BROADCASTER;
		},
		getStationStatus: function () {
			return station.status;
		},
		getStationTitle: function () {
			return station.STATION_TITLE;
		}
	};
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


