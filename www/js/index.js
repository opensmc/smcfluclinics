/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var map;
var markers = [];
var clinicList = {};

var myLocationMarker;

var idleUpdateHandler;

var searchTimeframe;

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', app.onDeviceReady, false);
        $(function(){
            $("#splash").hide();
            $.mobile.changePage("#map-page");
        });
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        setAppTitle(config.appName);
        createMap();
        geoLocate();
        $("#select-date-range").change(function() {
            buildTimeframeQuery();
        });
    },
};

function setAppTitle(title) {
    $('#app-title').text(title);
}

function buildTimeframeQuery() {
    var startDateString = '1970-01-01T00:00:00'; 
    var endDate;
    var selectedTimeframeOption = $("#select-date-range option:selected").val();
    console.log(selectedTimeframeOption);
    if (selectedTimeframeOption != 'alltime') {
        startDateString = moment().format("YYYY-MM-DDTHH:mm:ss");
    }
    console.log("startDateString = " + startDateString);
    if (selectedTimeframeOption == "today") {
        endDate = moment().startOf('day');
    }
    else if (selectedTimeframeOption == "next3days") {
        endDate = moment().startOf('day').add(3, 'day');
    }
    else if (selectedTimeframeOption == "nextweek") {
        endDate = moment().startOf('day').add(1, 'week');
    }
    else if (selectedTimeframeOption == "nextmonth") {
        endDate = moment().startOf('day').add(1, 'month');
    }
    else if (selectedTimeframeOption == "allfuture") {
        endDate = moment('2037-12-31T00:00:00');
    }
    else if (selectedTimeframeOption == "alltime") {
        endDate = moment('2037-12-31T00:00:00');
    }
    endDate = moment(endDate).endOf('day')
    var endDateString = moment(endDate).format("YYYY-MM-DDTHH:mm:ss");
    console.log("endDateString = " + endDateString)
    var queryURL = config.queryURLBase + config.queryURLStartDateTag + ">='" + startDateString + "'%20AND%20" + config.queryURLEndDateTag + "<='" + endDateString + "'&$order=" + config.queryURLOrderTag;
    console.log("queryURL = " + queryURL);

    fetchNewResults(queryURL);
}

function createMap() {
    var longitude = config.mapCenterLongitude;
    var latitude = config.mapCenterLatitude;
    var latLong = new google.maps.LatLng(latitude, longitude);

    var mapOptions = {
        center: latLong,
        zoom: config.mapDefaultZoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById("map"), mapOptions);

    // we only want to get the map bounds and query for data once the map
    // has been created and is ready for display.
    idleUpdateHandler = google.maps.event.addListener(map, 'idle', function() { 
        newBounds = map.getBounds();
        buildTimeframeQuery();
        google.maps.event.removeListener(idleUpdateHandler);
    } );

    // create the "blue dot" marker to show our position on the map
    myLocationMarker = new google.maps.Marker({
        clickable: false,
        icon: new google.maps.MarkerImage('img/mobileimgs2.png',
                                                        new google.maps.Size(22,22),
                                                        new google.maps.Point(0,18),
                                                        new google.maps.Point(11,11)),
        shadow: null,
        zIndex: 999,
        map: map
    });

}

function geoLocate() {
    // window.plugins.toast.showShortCenter('Getting current location');
    navigator.geolocation.getCurrentPosition(onGeoLocateSuccess, onGeoLocateError);   
}

function onGeoLocateSuccess(position) {
    var longitude = position.coords.longitude;
    var latitude = position.coords.latitude;
    var latLong = new google.maps.LatLng(latitude, longitude);
    myLocationMarker.setPosition(latLong);

    map.setZoom(config.mapMyLocationZoom);
    map.panTo(latLong);
};

function onGeoLocateError(error) {
    alert("error! code: " + error.code + "\nmessage: " + error.message);
};

function fetchNewResults(url) {
    clearMarkers();
    clinicList = {};
    $.getJSON(url, function(data) {
        $.each(data, function(index, value) {
            addClinic(value);
        });
    });
}

function addClinic(value) {
    var lat = value.location_1.latitude;
    var lng = value.location_1.longitude;
    var street = value.street1;
    var city = value.city;
    var beginDate = value.begin_date;
    var endDate = value.end_date;
    var facilityName = value.facility_name;
    var facilityId = value.facility_id;
    var eligibility = value.eligibility;

    // see if an entry already exists with the given facility id
    var existingClinic = null;
    for (var clinicKey in clinicList) {
        var clinic = clinicList[clinicKey];
        if (clinic.facilityId == facilityId) {
            existingClinic = clinic;
            break;
        }
    }

    // if this is a new clinic, create the corresponding object.
    if (existingClinic == null) {
        var newClinic = {
            facilityId: facilityId,
            facilityName: facilityName,
            streetAddress: street,
            city: city,
            latitude: lat,
            longitude: lng,
            eligibility: eligibility,
            dates: []
        };
        clinicList[facilityId] = newClinic;

        // create a new map marker for this clinic
        addMarker(newClinic);

        existingClinic = newClinic;
    }

    if (existingClinic == null) {
        console.log("unable to find or create clinic object.");
        return;
    }

    // add this entry's begin/end dates to the new or existing clinic
    var datePair = {
        beginDate: beginDate,
        endDate: endDate,
    };
    existingClinic.dates.push(datePair);
}

function addMarker(clinic) {

    var markerLatLng = new google.maps.LatLng(clinic.latitude, clinic.longitude);

    var marker = new google.maps.Marker({
        position: markerLatLng,
        map: map,
        icon: 'img/firstaid.png',
        title: clinic.facilityName
    });    

    marker.addListener('click', function() {
        showClinicDetails(clinic);
    });      

    markers.push(marker);
}

function showClinicDetails(clinic) {
    var htmlContent;
    htmlContent = "<br/>";
    htmlContent += "<span class='clinic-title'>" + clinic.facilityName + "</span><br/>";
    htmlContent += clinic.streetAddress + "<br/>";
    htmlContent += clinic.city + "<br/>";

    var fullAddress = clinic.streetAddress + " " + clinic.city;
    var mapLink = "http://maps.google.com/maps?q=" + encodeURIComponent(fullAddress);
    htmlContent += "<a href='" + mapLink + "'>View map</a><br/>";

    if (clinic.eligibility != null) {
        htmlContent += "<br/>";
        htmlContent += "<span class='clinic-header'>Eligibility</span><br/>";
        htmlContent += clinic.eligibility + "<br/>";
    }

    htmlContent += "<br/>";
    htmlContent += "<span class='clinic-header'>Clinic Dates and Times</span><br/>";
    htmlContent += "<table border='0' cellspacing='0' cellpadding='0' class='clinic-detail-table'>";
    for (var dateKey in clinic.dates) {
        var datePair = clinic.dates[dateKey];
        var dateString = moment(datePair.beginDate).format('MMMM Do YYYY');
        var startTimeString = moment(datePair.beginDate).format('h:mm a');
        var endTimeString = moment(datePair.endDate).format('h:mm a');
        htmlContent += "<tr><td style='padding-right:30px;'>" + dateString + "</td><td>" + startTimeString + " - " + endTimeString + "</td></tr>"; 
    }
    htmlContent += "</table>";
    htmlContent += "<p>&nbsp;</p>"

    $("#detailcontent").html(htmlContent);

    $("body").pagecontainer("change", "#detail-page", { });
}

function clearMarkers() {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

app.initialize();