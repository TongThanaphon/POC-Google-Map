let map, marker;
let startPlot = { lat: 13.7613538, lng: 100.5372073 };

const addressBoxEle = document.getElementById("address-box");
const mapContainerEle = document.getElementById("map-container");
const searchInputEle = document.getElementById("search-input");
const displayResultEle = document.getElementById("display-result");
const latEle = document.getElementById("lat");
const lngEle = document.getElementById("lng");

const googleMapApiKey = env.GOOGLE_MAP_API_KEY;
const options = {
  fields: ["formatted_address", "geometry", "name"],
  strictBounds: false,
  types: ["establishment"],
};

let currentLocation = {
  isSetLocation: false,
  lat: null,
  lng: null,
  address: null,
};

function handleClickAddressBox() {
  mapContainerEle.classList.add("map-container-enable");

  if (latEle.innerHTML && lngEle.innerHTML) {
    startPlot = {
      lat: parseFloat(latEle.innerHTML),
      lng: parseFloat(lngEle.innerHTML),
    };
  }

  initMap();
}

function handleConfirm() {
  addressBoxEle.innerHTML = currentLocation.address;
  latEle.innerHTML = currentLocation.lat;
  lngEle.innerHTML = currentLocation.lng;

  mapContainerEle.classList.remove("map-container-enable");
}

function handleSubmitSearch() {
  const value = searchInputEle.value;
  const trimValue = value.trim();

  const url =
    "https://maps.googleapis.com/maps/api/geocode/json?address=" +
    trimValue +
    "&key=" +
    googleMapApiKey;

  const encdodeUrl = encodeURI(url);
  const xhr = new XMLHttpRequest();
  xhr.open("GET", encdodeUrl);
  xhr.send();
  xhr.onload = function () {
    if (xhr.status != 200) {
      alert(`Error ${xhr.status}: ${xhr.statusText}`);
    } else {
      // // ถ้าเจอที่อยู่ extract data ตาม code block นี้ -------------------------------
      const jsonData = JSON.parse(xhr.response);
      if (jsonData.results && jsonData.results.length > 0) {
        const tmpLocation = jsonData.results[0];
        const formatted_address = tmpLocation.formatted_address;
        const geometry = tmpLocation.geometry;
        const location = geometry.location;
        const lat = location.lat;
        const lng = location.lng;

        const infowindow = new google.maps.InfoWindow({
          content: "Latitude: " + lat + "<br>Longitude:" + lng,
        });

        currentLocation.isSetLocation = true;
        currentLocation.lat = lat;
        currentLocation.lng = lng;
        currentLocation.address = formatted_address;

        startPlot = { lat: lat, lng: lng };

        map.setCenter(startPlot);
        map.setZoom(17);
        marker.setPosition(startPlot);

        infowindow.open(map, marker);

        displayResult(currentLocation);
      }
      alert(`Done, got ${xhr.response.length} bytes`);
    }
  };

  xhr.onprogress = function (event) {
    if (event.lengthComputable) {
      alert(`Received ${event.loaded} of ${event.total} bytes`);
    } else {
      alert(`Received ${event.loaded} bytes`);
    }
  };

  xhr.onerror = function () {
    alert("Request failed");
  };
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: startPlot,
    zoom: 12,
  });

  marker = new google.maps.Marker({
    position: startPlot,
    map,
    draggable: true,
    title: "Me",
  });

  google.maps.event.addListener(marker, "dragend", function (event) {
    let infowindow = new google.maps.InfoWindow({
      content:
        "Latitude: " +
        event.latLng.lat() +
        "<br>Longitude:" +
        event.latLng.lng(),
    });

    let lat = event.latLng.lat();
    let lng = event.latLng.lng();

    currentLocation.isSetLocation = true;
    currentLocation.lat = lat;
    currentLocation.lng = lng;

    getAddress(currentLocation);

    infowindow.open(map, marker);
  });

  const autocomplete = new google.maps.places.Autocomplete(
    searchInputEle,
    options
  );

  autocomplete.addListener("place_changed", () => {
    marker.setVisible(false);

    const place = autocomplete.getPlace();

    if (!place.geometry || !place.geometry.location) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("No details available for input: '" + place.name + "'");
      return;
    }

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }

    marker.setPosition(place.geometry.location);
    marker.setVisible(true);

    console.log("place", place);

    currentLocation.isSetLocation = true;
    currentLocation.address = place.formatted_address;
    currentLocation.lat = place.geometry.location.lat();
    currentLocation.lng = place.geometry.location.lng();

    displayResult(currentLocation);
  });
}

function getAddress(displayObj) {
  let latlng = new google.maps.LatLng(displayObj.lat, displayObj.lng);
  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ latLng: latlng }, function (results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      if (results[1]) {
        displayObj.address = results[1].formatted_address;
      }
    } else {
      displayObj.address = "";
    }

    displayResult(displayObj);
  });
}

function displayResult(displayObj = {}) {
  console.log("display-result", displayObj);

  displayResultEle.innerHTML = JSON.stringify({
    address: displayObj.address,
    lat: displayObj.lat,
    lng: displayObj.lng,
  });
}
