
function getDirections(map) {
	console.log('Route button clicked ...');
	var directionService = new google.maps.DirectionsService();
	var renderOption = {
		map: map,
	}

	var directionsDisplay = new google.maps.DirectionsRenderer(renderOption);
	for (var pg = 1; pg < Hodala.places.length; ++pg) {
		var originLatLng = Hodala.places[pg-1].marker.getPosition();
		var destinLatLng = Hodala.places[pg].marker.getPosition();
		var request = {
			origin: originLatLng,
			destination: destinLatLng,
			travelMode: google.maps.DirectionsTravelMode.DRIVING,
		};

		directionService.route(request, function(response, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				directionsDisplay.setDirections(response);
			}
		})
	}
}

function getDirections2(googleMap) {
	if (Hodala.places.length < 2) {
		return;
	}
	console.log('Route button clicked ...');
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
	directionService.route(req, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(response);
		}
	});

}