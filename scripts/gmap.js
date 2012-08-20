// Copy right. 2012 - 2013 Brian Pin
//
// This file contains function for basic marker creation and PlaceGroup
// creation. There are several operations for the marker and PlaceGroup
// Add/Remove/Drag. Also when user is just starting the application,
// This webapp will reload marker information that was used last time.
// In other words, it has the ability of memorization
//

/** Hodala is a global factory and aux. function helper.
 * Anything that does belong to this app and doesn't look like it belongs
 * to anything specific. Then it is here. Using this object to work
 */
var Hodala = {
	// Point of interests. There is a type of place that will be sought for.
	// This is the main parameter type for Google place API
	poiType: "cafe",

	// The unique Google Map API object
	map: undefined,

	// Internal collection to maintain a set of objects
	places : new Array(),

	// Found places by Google Place Search
	found : new Array(),

	// Add a place into places array
	add : function(placeGroup) {
		this.places.push(placeGroup);
	},

	// Remove a place from places array
	remove : function(labelElement) {
		for (var index = 0; index < this.places.length; index ++) {
			var place = this.places[index];
			// is === an overkill? isn't == enough?
			// if this is a sparse array, then we should check place validness
			if (!place) continue;
			if (place.label == labelElement) {
				place.removeFromBigTable();
				place.removeElement();
				place.marker.setMap(null);
				place.circle.setMap(null);
				delete this.places[index];
				break;
			}
		}
	},

	// Use google map marker to bind to a place group
	createPlaceGroup : function(marker, map) {
		if (Hodala.places.length >= 2) {
			console.log("Maximum waypoint exceeded");
			marker.setMap(null);
			return;
		}
		var place = new _PlaceGroup(marker, map);
		place.setup();
		this.add(place);
		place.register('dblclick', function(event) {
			Hodala.remove(event.target);
		});
		place.updatePosition();
		marker.draggable = true
		google.maps.event.addListener(marker, 'dragend', function() {
			place.updatePosition();
		});
		place.circle = PlaceCircle(map, marker.getPosition(), 100);
	},

    // Retrieve data from server side database
	onApplicationLoad : function(mapObj) {
		Hodala.map = mapObj;
        var req = new XMLHttpRequest();
        req.open("GET", "/event/update");
        req.onreadystatechange = function () {
			if (req.readyState === 4 && req.status === 200) {
				var type = req.getResponseHeader("Content-Type");
				if (type === "application/json") {
					var retObjs = JSON.parse(req.responseText);
					var count = 0;
					var minLat = 90.0;
					var maxLat = -90.0;
					var minLng = 180.0;
					var maxLng = -180.0;
					for (var i = 0; i < retObjs.length; i++) {
						var p = retObjs[i];
						if (p.latitude && p.longitude) {
							var latlng = new google.maps.LatLng(parseFloat(p.latitude), parseFloat(p.longitude));

							if (minLat > parseFloat(p.latitude))
								minLat = parseFloat(p.latitude);
							if (maxLat < parseFloat(p.latitude))
								maxLat = parseFloat(p.latitude);
							if (minLng > parseFloat(p.longitude))
								minLng = parseFloat(p.longitude);
							if (maxLng < parseFloat(p.longitude))
								maxLng = parseFloat(p.longitude);

							count += 1;

							if (!mapObj)
								console.log("mapobj is undefined");
							if (!latlng)
								console.log("latlng is undefined")
							var marker = Hodala.GMapHelper.setMarker(mapObj, latlng);
							Hodala.createPlaceGroup(marker, mapObj);
						}
					}
					if (count > 1) {
						var swLatLng = new google.maps.LatLng(minLat, minLng);
						var neLatLng = new google.maps.LatLng(maxLat, maxLng);
						var bounds = new google.maps.LatLngBounds(swLatLng, neLatLng);
						mapObj.fitBounds(bounds);
					}

					if (count == 1) {
						//mapObj.setCenter(new google.maps.LatLng({lat: retObjs[0].latitude, lng: retObjs[0].longitude}));
						mapObj.setZoom(14);
					}
					//mapObj.setZoom(14);
				}
			}
        };
        req.send(null);
	},

	// A set of helper routines that calls Google API service for 
	// some small tasks
	GMapHelper : {
		setCenter : function(address, mapObject) {
			var geo = new google.maps.Geocoder();
			geo.geocode({'address': address}, function (results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					mapObject.setCenter(results[0].geometry.location);
				}
			});
		},

		setMarker : function(mapObject, latlng) {
			return new google.maps.Marker({'position': latlng, 'map': mapObject});
		},
	},

	// Helper function for encoding objects into JSON
	// Used in AJAX call
	encodedFormData : function (data) {
		if (!data) return;
		var pairs = [];
		for (var name in data) {
			if (!data.hasOwnProperty(name)) continue;
			if (typeof data[name] === "function") continue;
			var value = data[name].toString();
			pairs.push(name + "=" + value);
		}
		return pairs.join("&");
	},

}

/**
 * The _PlaceGroup class is a wrapper to contain: Google Map Markers,
 *  decorative informations, and closely/directly linked to its HTML
 *  portion. Whether we want to make it a draggable object or not, it
 *  is useful for stroing information in this object here.
 */
function _PlaceGroup(marker, map) {
	this.marker = marker;
	// Is this the right place to init class member?
	this.label = undefined;
	this.mapHandle = map;
}

_PlaceGroup.prototype = {

	// Create DOM element and bind it with the marker
	setup : function() {
		var labelHolder = document.getElementById('marker_area');
		if (labelHolder == null) {
			console.log("No div called marker_element");
			return;
		}
		var label = document.createElement('li');
		// associating the label element with marker and placeGroup object
		this.label = label;

		var attr = document.createAttribute('class');
		attr.value = "drag-element";
		label.setAttributeNode(attr);

		attr = document.createAttribute('draggable');
		attr.value = "true";
		label.setAttributeNode(attr);

		labelHolder.appendChild(label);
	},

	register : function(eventName, func) {
		//EventHelper.register(this.label, eventName, func);
		this.label.addEventListener(eventName, func);
	},

	removeElement : function () {
		this.label.parentNode.removeChild(this.label);
	},

	updatePosition : function () {
		// make AJAX POST call to update the marker's postion in the backend
		// the request method call must follow HTTP request sequence
		var request = new XMLHttpRequest();
		var data = {
			'latitude' : this.marker.getPosition().lat(),
			'longitude' : this.marker.getPosition().lng(),
			'zoom' : this.marker.getMap().getZoom(),
		}
		request.open("POST", "/event/setplace");
		request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		request.onreadystatechange = function () {
			if (request.readyState === 4 && request.status == 200) {
//				console.log("Sent " + Hodala.encodedFormData(data));
			}
		};
		request.send(Hodala.encodedFormData(data));
	},

	removeFromBigTable : function() {
		var req = new XMLHttpRequest();
		var data = {
			'latitude' : this.marker.getPosition().lat(),
			'longitude' : this.marker.getPosition().lng(),
			'zoom' : this.marker.getMap().getZoom(),
		};
		req.open("POST", "event/deleteplace");
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.onreadystatechange = function () {
			if (req.readyState == 4 && req.status == 200) {
				console.log("deleted " + Hodala.encodedFormData(data));
			}
		};
		req.send(Hodala.encodedFormData(data));
	}
}
