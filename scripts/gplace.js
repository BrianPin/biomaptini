
function PlaceCircle(map, center, radius) {
	// from group we can reference to other attributes
	if (typeof(radius) === 'undefined') {
		var radius = 100;
	}

	function setup(map, center, radius) {
		var placeOptions = {
			strokeColor: "#FF0000",
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: "#FF0000",
			fillOpacity: 0.3,
			map: map,
			center: center,
			radius: radius,
			visible: true,
		};
		return new google.maps.Circle(placeOptions);
	}

	var cir = setup(map, center, radius);
	console.log("make a circle at " + center);
	return cir;
}

function CircleLatLng(map, locationName) {
	var geo = new google.maps.Geocoder();
	var req = {
		'address': locationName,
	};

	geo.geocode(req, function(results, status){
		if (status == google.maps.GeocoderStatus.OK) {
			PlaceCircle(map, results[0].geometry.location, 100);
		}
	});
}
