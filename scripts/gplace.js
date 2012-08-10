
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

function setSelectedType() {
	var select = document.getElementById("poi_type");
	console.log(select.value);
	Hodala.poiType = select.value;
	console.log(Hodala.poiType);
}


function GPlaceSearchRequest(location, radius, type) {
	this.output = "json";
	this.apiKey = "AIzaSyDEQvN-Otg7HgIW4WqLoSVJarekteCE1vA";
	this.location = location;
	this.radius = radius;
	this.type = type;
	this.partialUrl = "https://maps.googleapis.com/maps/api/place/search/";
}

GPlaceSearchRequest.prototype.toString = function () {
	var url = this.partialUrl + this.output + '?' +
		'key=' + this.apiKey + '&' +
		'location=' + this.location.lat() + ',' + this.location.lng() + '&' +
		'radius=' + this.radius + '&' +
		'types=' + this.type + '&' +
		'sensor=false';
	return url;
};

GPlaceSearchRequest.prototype.execute = function(cb) {
	var request = new XMLHttpRequest();
	request.open("GET", this.toString());
	request.onreadystatechange = function () {
		if (request.readyState === this.DONE) {
			if (request.status === 200)
				cb(JSON.parse(request.responseText));
			else {
				console.log(request.status + " " + request.statusText);
			}
		}
	};
	request.send(null);
};

function GoogleDirectionResult(theResult) {
	this.result = theResult;
}

GoogleDirectionResult.prototype.toString = function () {
	var repr = "";
	this.result.routes[0].overview_path.forEach(function(v, i, a) {repr += v + "\n";});
	return repr;
}

GoogleDirectionResult.prototype.poiSearch = function () {
	this.result.routes[0].overview_path.forEach(function(latlng, idx, array) {
		service = new google.maps.places.PlacesService(Hodala.map);
		var req = {
			location: latlng,
			radius: 500,
			types: [Hodala.poiType],
		};
		service.nearbySearch(req, function(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				for (var i = 0; i < results.length; i++) {
					var place = results[i];
					var infowindow = new google.maps.InfoWindow({
						content: place.name,
					});
					var marker  = new google.maps.Marker({
						position: place.geometry.location,
						map: Hodala.map,
					});
					infowindow.open(Hodala.map, marker);
					//infowindow.setPosition(place.geometry.location);
					//Hodala.GMapHelper.setMarker(Hodala.map, place.geometry.location);
					google.maps.event.addListener(marker, 'click', function() {
						infowindow.open(Hodala.map, marker);
					});
				}
			}
		});
	});
}
