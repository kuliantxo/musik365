//We already have a limitTo filter built-in to angular,
//let's make a startFrom filter
projectModule.filter('startFrom', function() {
	return function(input, start) {
		start = +start; //parse to int
		if (input !== undefined)
			return input.slice(start);
	}
});


projectModule.filter('featured', function() {
	var FEATURED = ['djmikeluv', 'pbjradio1', 'blkburban', 'mountainmanradio', 'liberated_audio', 'iradio520com'];
	
	return function(input) {
		for (var i = input.length-1; i >= 0; i--) {
			if (FEATURED.indexOf(input[i].STATION_BROADCASTER) == -1) {
				input.splice(i, 1);
			}
		}	

		return input;
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


