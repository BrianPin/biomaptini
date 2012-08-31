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
	// this cleans the place search results
	clearResult(Hodala.map);
	// this uses a routing results:
	var result = Hodala.directionResult;
	if (Hodala.chkType === "show all") {
		if (result) // if there is a direction result
			result.exploreOverview();
		//result.exploreLegs();
	} else {
		if (result)
			result.getAllPlaceByType();
	}
}

function setDisplayType() {
	var select = document.getElementById("check_type");
	console.log(select.value);
	Hodala.chkType = select.value;
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

GoogleDirectionResult.prototype.exploreOverview = function () {
	var route = this.result.routes[0];
	if (this.result.routes.length > 1)
		console.log("There are " + this.result.route.length + " routes in search result");
	route.overview_path.forEach(function(latlng, idx, ar) {
		Hodala.GMapHelper.setMarker(Hodala.map, latlng);
	});
}

GoogleDirectionResult.prototype.exploreLegs = function () {
	var legs = this.result.routes[0].legs;
	if (this.result.routes.length > 1)
		console.log("There are " + this.result.route.length + " routes in search result");
	console.log("There are " + legs.length + " legs in first route");
	legs.forEach(function(leg, idx, ar) {
		var steps = leg.steps;
		console.log("There are " + steps.length + " steps in the leg");
		steps.forEach(function(step, idx, arr) {
			//if (step.steps.length != 0)
			//	console.log("There are " + step.steps.length + " substeps");
			Hodala.GMapHelper.setMarker(Hodala.map, step.start_location);
			Hodala.GMapHelper.setMarker(Hodala.map, step.end_location);
		});
	});
}

GoogleDirectionResult.prototype.seekPlace = function (pos_th, placeService, type, all, dr) {

	if (all.length == 0 || pos_th > all.length-1)
		return;

	var thisPos = all[pos_th];

	var req = {
		location: thisPos,
		radius: 150,
		types: [type],
	};

	if (Hodala.progressMarker) {
		//Hodala.progressMarker.setMap(null);
		Hodala.progressMarker.setPosition(thisPos);
	} else {
		console.log("Creating progress marker");
		Hodala.progressMarker = new google.maps.Marker({
			position: thisPos,
			map: Hodala.map,
			icon: 'styles/sportscar.png',
		});
	}

	placeService.nearbySearch(req, function(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			for (var i = 0; i < results.length; i++) {
				var place = results[i];
				if (Hodala.found.indexOf(place.id) != -1) {
					continue;
				}

				//console.log("\t" + place.name);
				Hodala.found.push(place.id);

				var marker  = Hodala.GMapHelper.setMarker(Hodala.map, place.geometry.location);
				var iconUrl = "https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=" 
								+ Hodala.found.length + "|FF0000|000000";
				marker.setIcon(new google.maps.MarkerImage(iconUrl));
				var info = new PlaceResultDomElement(marker, place.name, place.vicinity, 
					Hodala.found.length, place.geometry.location);
				info.create();
				google.maps.event.addListener(marker, 'click', function () {
					var container = document.getElementById("placeResult");
					container.scrollTop = info.elem.offsetTop - 55;
					var oldbg = info.elem.style.backgroundColor;
					info.elem.style.backgroundColor = "DarkSeaGreen";
					window.setTimeout(function() {
						info.elem.style.backgroundColor = oldbg;
					}, 1000);
				})
			}
		} else if (status == google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT){
			window.setTimeout(function() {
				dr.seekPlace(pos_th, placeService, type, all, dr);
			}, 2100);
		} else {
			console.log(status);
		}

		if (status != google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
			dr.seekPlace(pos_th+1, placeService, type, all, dr);
		}
	});
}

function PlaceResultDomElement(marker, name, addr, id, latlng) {
	this.marker = marker;
	this.placeName = name;
	this.address = addr;
	this.identity = id;
	this.latlng = latlng;
	this.text = [id+":", name].join(' ');
	this.elem = undefined;
}

PlaceResultDomElement.prototype.create = function() {
	var container = document.getElementById("placeResult");
	var owner = document.createElement('ul');
	var attr = document.createAttribute('class');
	var content1 = document.createTextNode(this.text);
	var lbr = document.createElement('br');
	var content2 = document.createTextNode(this.address);
	var prd = this;
	var marker = this.marker;
	this.elem = owner;
	attr.value = "placeInfo";
	owner.setAttributeNode(attr);
	owner.appendChild(content1);
	owner.appendChild(lbr);
	owner.appendChild(content2);
	container.appendChild(owner);
	google.maps.event.addDomListener(owner, 'click', function(event) {
		window.scrollTo(0,0);
		Hodala.map.setZoom(18);
		//console.log(prd.constructor);
		Hodala.map.panTo(prd.latlng);
		Hodala.map.setCenter(prd.latlng);
		marker.setAnimation(google.maps.Animation.BOUNCE);
		window.setTimeout(function() {
			marker.setAnimation(null);
		}, 9000);
	})
}

function RandomShuffle(someList) {
	for (var i = someList.length - 1; i >= 0; i--) {
		var pick = Math.floor(Math.random() * (i+1));
		var store = someList[pick];
		someList[pick] = someList[i];
		someList[i] = store;
	};
}

GoogleDirectionResult.prototype.getAllPlaceByType = function () {
	var allPositions = this.result.routes[0].overview_path;
	var placeService = new google.maps.places.PlacesService(Hodala.map);
	var type = Hodala.poiType;
	console.log('Seeking places');
	this.seekPlace(0, placeService, type, allPositions, this);
}



