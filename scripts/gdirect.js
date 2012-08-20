//
// This file is for classes and functions working on Google direction service
// To ask/create/retrieve a path from Google.
//
function logHodalaTravelAgent (gmapDirectionResult) {
	for (var i = 0; i < gmapDirectionResult.routes.length; ++i) {
		console.log('Route ' + (i+1) + ": ");
		var route = gmapDirectionResult.routes[i];
		for (var j = 0; j < route.legs.length; ++j) {
			var leg = route.legs[j];
			Hodala.GMapHelper.setMarker(Hodala.map, leg.start_location);
			Hodala.GMapHelper.setMarker(Hodala.map, leg.end_location);
			console.log('  Leg ' + (j+1));
			console.log('  arrival time ' + leg.arrival_time);
			console.log('  departure time ' + leg.departure_time);
			console.log('  distance ' + leg.distance.text);
			console.log('  duration ' + leg.duration.text);
			console.log('  start addr ' + leg.start_address);
			console.log('  end address ' + leg.end_address);
			for (var k = 0; k < leg.steps.length; ++k) {
				var step = leg.steps[k];
				console.log('    step ' + (k+1) + " " + step.distance.text);
				for (var m = 0; m < step.path.length; ++m) {
					var latlng = step.path[m];
					if (m == 0) {
						console.log('      : ' + latlng);
					} else {
						console.log('      : ' + latlng + " " +
							google.maps.geometry.spherical.computeDistanceBetween(latlng, oldLatLng));
					}
					var oldLatLng = latlng;
				}
				console.log('    duration ' + step.duration.text);
				console.log('    start loc ' + step.start_location);
				console.log('    end loc ' + step.end_location);
			}
		}
	}
}


/**
 * Call Google direction service api to make routes
 * Based on these places user has been clicked.
 *
 * @param googleMap the map object of the whole application
 * @return nothing
 */
function getDirections(googleMap) {
	if (Hodala.places.length < 2) {
		return;
	}
	console.log('Route button clicked ...');
	// If there are more than two places, the middle ones
	// are going to be way points. 
	// TODO: make algorithms to choose better origin, destination and
	// way points
	var wayLocs = [];
	for (var i = 0; i < Hodala.places.length; ++i) {
		if (i == 0) {
			var startLoc = Hodala.places[i].marker.getPosition();
			console.log("start: " + startLoc);
			continue;
		}

		if (i == Hodala.places.length - 1) {
			var endLoc = Hodala.places[i].marker.getPosition();
			console.log("end: " + endLoc);
			break;
		}

		wayLocs.push({
			location: Hodala.places[i].marker.getPosition(),
			stopover: true
		})
	}
	var directionService = new google.maps.DirectionsService();
	var directionsDisplay =  new google.maps.DirectionsRenderer();
	directionsDisplay.setMap(googleMap);
	var req = {
		origin: startLoc,
		destination: endLoc,
		waypoints: wayLocs,
		optimizeWaypoints: true,
		travelMode: google.maps.DirectionsTravelMode.DRIVING,
	};
	directionService.route(req, function(directionResult, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(directionResult);
			//logHodalaTravelAgent(directionResult);
			var result = new GoogleDirectionResult(directionResult);
			result.getPlaceByType();
		}
	});

}

function cleanRoute(googleMap) {
	console.log('clear route clicked!');
	var directionsDisplay = new google.maps.DirectionsRenderer({
		map: googleMap,
		suppressMarkers: true,
		suppressPolylines: true,
	});
	directionsDisplay.setMap(null);
}

function clearMarker(googleMap) {
	for (var i = 0; i < Hodala.places.length; ++i) {
		if (Hodala.places[i]) {
			Hodala.remove(Hodala.places[i].label);
		}
	}
	Hodala.places.length = 0;
}

