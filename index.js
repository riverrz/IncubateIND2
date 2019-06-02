function drawGraph(source, destination) {
  // (long, lat)
  //   var truckLocation = [-83.093, 42.376];
  //   var warehouseLocation = [-83.083, 42.363];
  var truckLocation = [source.long, source.lat];
  var warehouseLocation = [];
  var lastQueryTime = 0;
  var lastAtRestaurant = 0;
  var keepTrack = [];
  var currentSchedule = [];
  var currentRoute = null;
  var pointHopper = {};
  var pause = true;
  var speedFactor = 50;

  // Add your access token
  mapboxgl.accessToken =
    "pk.eyJ1IjoiZXJ3YW5sZW50IiwiYSI6IjA4YzY2Zjg2OTBkNDY5MDEyODBmN2RkOTdjMDc0NTY0In0.NY4En8vkN8h4JvlSDlhLfw";

  // Initialize a map
  var map = new mapboxgl.Map({
    container: "map", // container id
    style: "mapbox://styles/mapbox/dark-v10", // stylesheet location
    center: truckLocation, // starting position
    zoom: 12 // starting zoom0
  });

  // Create a GeoJSON feature collection for the warehouse
  //   var warehouse = turf.featureCollection([turf.point(warehouseLocation)]);
  // Create an empty GeoJSON feature collection for drop-off locations
  var dropoffs = turf.featureCollection([]);

  // Create an empty GeoJSON feature collection, which will be used as the data source for the route before users add any new data
  var nothing = turf.featureCollection([]);

  function newDropoff(coords) {
    // Store the clicked point as a new GeoJSON feature with
    // two properties: `orderTime` and `key`
    const arr = [];
    arr.push([truckLocation[0], truckLocation[1]]);
    for (var i = 1; i < 3; i++) {
      var pt = turf.point(
        [truckLocation[0] + i * 0.0003, truckLocation[1] + i * 0.0005],
        {
          orderTime: Date.now(),
          key: Math.random()
        }
      );
      dropoffs.features.push(pt);
      pointHopper[pt.properties.key] = pt;
      arr.push([truckLocation[0] + i * 0.0003, truckLocation[1] + i * 0.0005]);
    }
    // arr = [[lng,lat], [lng,lat], []]
    var str1 = "";
    var str2 = "";
    var disti = String(1);
    var distj = 2;
    for (var i = 0; i < arr.length-1; i++) {
      if (i == arr.length - 2) {
        str1 += String(arr[i][0]) + "," + String(arr[i][1]);
        str2 += disti + "," + String(distj);
      } else {
        str1 += String(arr[i][0]) + "," + String(arr[i][1]) + ";";
        str2 += disti + "," + String(distj) + ";";
      }
      distj += 1;
    }

    // Make a request to the Optimization API
    $.ajax({
      method: "GET",
      url: `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${str1}?distributions=${str2}&overview=full&steps=true&geometries=geojson&source=first&access_token=pk.eyJ1IjoiZXJ3YW5sZW50IiwiYSI6IjA4YzY2Zjg2OTBkNDY5MDEyODBmN2RkOTdjMDc0NTY0In0.NY4En8vkN8h4JvlSDlhLfw`
    }).done(function(data) {
      // Create a GeoJSON feature collection
      var routeGeoJSON = turf.featureCollection([
        turf.feature(data.trips[0].geometry)
      ]);

      // If there is no route provided, reset
      if (!data.trips[0]) {
        routeGeoJSON = nothing;
      } else {
        // Update the `route` source by getting the route source
        // and setting the data equal to routeGeoJSON
        map.getSource("route").setData(routeGeoJSON);
      }

      if (data.waypoints.length === 12) {
        window.alert(
          "Maximum number of points reached. Read more at docs.mapbox.com/api/navigation/#optimization."
        );
      }
    });
  }

  function updateDropoffs(geojson) {
    map.getSource("dropoffs-symbol").setData(geojson);
  }

  // Here you'll specify all the parameters necessary for requesting a response from the Optimization API
  function assembleQueryURL() {
    // Store the location of the truck in a variable called coordinates
    var coordinates = [truckLocation];
    var distributions = [];
    keepTrack = [truckLocation];

    // Create an array of GeoJSON feature collections for each point
    var restJobs = objectToArray(pointHopper);

    // If there are any orders from this restaurant
    if (restJobs.length > 0) {
      // Check to see if the request was made after visiting the restaurant
      var needToPickUp =
        restJobs.filter(function(d, i) {
          return d.properties.orderTime > lastAtRestaurant;
        }).length > 0;

      // If the request was made after picking up from the restaurant,
      // Add the restaurant as an additional stop
      if (needToPickUp) {
        var restaurantIndex = coordinates.length;
        // Add the restaurant as a coordinate
        coordinates.push(warehouseLocation);
        // push the restaurant itself into the array
        keepTrack.push(pointHopper.warehouse);
      }

      restJobs.forEach(function(d, i) {
        // Add dropoff to list
        keepTrack.push(d);
        coordinates.push(d.geometry.coordinates);
        // if order not yet picked up, add a reroute
        if (needToPickUp && d.properties.orderTime > lastAtRestaurant) {
          distributions.push(restaurantIndex + "," + (coordinates.length - 1));
        }
      });
    }
    console.log(
      "https://api.mapbox.com/optimized-trips/v1/mapbox/driving/" +
        coordinates.join(";") +
        "?distributions=" +
        distributions.join(";") +
        "&overview=full&steps=true&geometries=geojson&source=first&access_token=" +
        mapboxgl.accessToken
    );
    // Set the profile to `driving`
    // Coordinates will include the current location of the truck,
    return (
      "https://api.mapbox.com/optimized-trips/v1/mapbox/driving/" +
      coordinates.join(";") +
      "?distributions=" +
      distributions.join(";") +
      "&overview=full&steps=true&geometries=geojson&source=first&access_token=" +
      mapboxgl.accessToken
    );
  }

  function objectToArray(obj) {
    var keys = Object.keys(obj);
    var routeGeoJSON = keys.map(function(key) {
      return obj[key];
    });
    return routeGeoJSON;
  }

  map.on("load", function() {
    var marker = document.createElement("div");
    marker.classList = "truck";

    // Create a new marker
    truckMarker = new mapboxgl.Marker(marker)
      .setLngLat(truckLocation)
      .addTo(map);
    // // Create a circle layer
    // map.addLayer({
    //   id: "warehouse",
    //   type: "circle",
    //   source: {
    //     data: warehouse,
    //     type: "geojson"
    //   },
    //   paint: {
    //     "circle-radius": 10,
    //     "circle-color": "white",
    //     "circle-stroke-color": "#3887be",
    //     "circle-stroke-width": 3
    //   }
    // });

    // // Create a symbol layer on top of circle layer
    // map.addLayer({
    //   id: "warehouse-symbol",
    //   type: "symbol",
    //   source: {
    //     data: warehouse,
    //     type: "geojson"
    //   },
    //   layout: {
    //     "icon-image": "grocery-15",
    //     "icon-size": 1
    //   },
    //   paint: {
    //     "text-color": "#3887be"
    //   }
    // });
    map.addSource("route", {
      type: "geojson",
      data: nothing
    });

    map.addLayer(
      {
        id: "routeline-active",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#3887be",
          "line-width": ["interpolate", ["linear"], ["zoom"], 12, 3, 22, 12]
        }
      },
      "waterway-label"
    );

    map.addLayer({
      id: "dropoffs-symbol",
      type: "symbol",
      source: {
        data: dropoffs,
        type: "geojson"
      },
      layout: {
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-image": "marker-15"
      }
    });
    // Listen for a click on the map
    var set = false;
    map.on("click", function(e) {
      if (set) {
        return;
      }
      var warehouse = document.createElement("div");
      warehouse.classList = "truck";
      warehouseLocation = map.unproject(e.point);
      new mapboxgl.Marker(warehouse).setLngLat(warehouseLocation).addTo(map);
      set = true;
      // When the map is clicked, add a new drop-off point
      // and update the `dropoffs-symbol` layer
      //   newDropoff(map.unproject(e.point));
      //   updateDropoffs(dropoffs);
      newDropoff();
    });

    map.addLayer(
      {
        id: "routearrows",
        type: "symbol",
        source: "route",
        layout: {
          "symbol-placement": "line",
          "text-field": "▶",
          "text-size": ["interpolate", ["linear"], ["zoom"], 12, 24, 22, 60],
          "symbol-spacing": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12,
            30,
            22,
            160
          ],
          "text-keep-upright": false
        },
        paint: {
          "text-color": "#3887be",
          "text-halo-color": "hsl(55, 11%, 96%)",
          "text-halo-width": 3
        }
      },
      "waterway-label"
    );
  });
}

//   var truckLocation = [-83.093, 42.376];
//   var warehouseLocation = [-83.083, 42.363];

drawGraph({ long: -83.093, lat: 42.376 }, { long: -83.083, lat: 42.363 });

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showPosition(position) {
  //   x.innerHTML =
  //     "Latitude: " +
  //     position.coords.latitude +
  //     "<br>Longitude: " +
  //     position.coords.longitude;
  drawGraph(
    { long: position.coords.longitude, lat: position.coords.latitude },
    {
      long: position.coords.longitude + 0.05,
      lat: position.coords.latitude + 0.05
    }
  );
}

getLocation();
