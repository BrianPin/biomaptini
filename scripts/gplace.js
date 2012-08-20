//
// This file and the classes included in this file, are related to Google Place API
// function call, data process. 
// The key point of getting places information according the POI type specified in
// Hodala object is used here as a parameter to the input of Google Place API
//
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

// Input a location in canonical name, use geocoder API to convert it
// to LatLng object and create a circle.
// This is a utility function
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

// Reflect user changes and store it in attribute poiType of Hodala object
function setSelectedType() {
	var select = document.getElementById("poi_type");
	console.log(select.value);
	Hodala.poiType = select.value;
	console.log(Hodala.poiType);
}

// This class is responsible for creating HTTP ajax call to Google server
// But it is deprecated because Google already wrapped its AJAX call with
// a GPlaceSearch API call.
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

// This class instances are created when a direction call has made
// And this is the core part of the whole project!
// Each result of the direction service is segmented into many small
// segments. So there I use each point along the direction path
// to make a place API call.
function GoogleDirectionResult(theResult) {
	this.result = theResult;
}

GoogleDirectionResult.prototype.toString = function () {
	var repr = "";
	this.result.routes[0].overview_path.forEach(function(v, i, a) {repr += v + "\n";});
	return repr;
}

GoogleDirectionResult.prototype.getPlaceByType = function () {
	// for each of the segment
	this.result.routes[0].overview_path.forEach(function(latlng, idx, array) {
		// create a place service 
		console.log("The " + idx + "-th " + "waypoint");
		service = new google.maps.places.PlacesService(Hodala.map);
		var req = {
			location: latlng,
			radius: 500,
			types: [Hodala.poiType],
		};

		// make a api call and the results are dealt in the callback function
		service.nearbySearch(req, function(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				console.log("There are " + results.length + " result(s)");
				for (var i = 0; i < results.length; i++) {
					var place = results[i];
					if (Hodala.found.indexOf(place.id) != -1) {
						continue;
					}

					Hodala.found.push(place.id);
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
