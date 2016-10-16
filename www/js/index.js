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
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        
        /* var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
        */
        console.log('Received Event: ' + id);

        console.log("in onDeviceReady")
        console.log("getting locale name...");
        globalization_preferred_language_cb("en");
/*
        navigator.globalization.getLocaleName(
          function(lang) { 
            console.log("detected lang = " + lang);
            globalization_preferred_language_cb(lang.value.substring(0,2))
            },
          function() {
            console.log("couldn't get locale.") 
            globalization_error_cb
            }
          )
*/
        setAppTitle(config.appName);
//        $("#splash").hide();
        createMap();
        geoLocate();

        $("#select-date-range").change(function() {
            buildTimeframeQuery();
        })
    }
};

/*
var app = {
    // Application Constructor
    initialize: function() {
        console.log("initialize");
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        console.log("bindEvents");
        document.addEventListener('deviceready', app.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        console.log("in onDeviceReady")
        console.log("getting locale name...");
        navigator.globalization.getLocaleName(
          function(lang) { 
            console.log("detected lang = " + lang);
            globalization_preferred_language_cb(lang.value.substring(0,2))
            },
          function() {
            console.log("couldn't get locale.") 
            globalization_error_cb
            }
          )

        setAppTitle(config.appName);
        $("#splash").hide();
        createMap();
        geoLocate();

        $("#select-date-range").change(function() {
            buildTimeframeQuery();
        })
    },
};
*/

function setAppTitle(title) {
    $('#app-title').text(title);
}

function buildTimeframeQuery() {
    var startDateString = '1970-01-01T00:00:00'; 
    var endDate;

    var selectedTimeframeOption = $("#select-date-range option:selected").val();
    console.log("selectedTimeframeOption: "+selectedTimeframeOption);
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
    console.log(JSON.stringify(value, null, 4));
    var lat = value.location_1.coordinates[1];
    var lng = value.location_1.coordinates[0];
    var street = value.street1;
    var city = value.city;
    var beginDate = value.begin_date;
    var endDate = value.end_date;
    var facilityName = value.facility_name;
    var facilityId = value.facility_id;
    var eligibility = value.eligibility;
    var phoneNumber = null;
    if (value.phone_number != null)
    {
      var phoneNumber = value.phone_number.phone_number;
    }

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
            phoneNumber: phoneNumber,
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
    htmlContent += "<a href='" + mapLink + "'>"+translate_l10n("button_view_map")+"</a><br/>";

    if (clinic.phoneNumber != null) {
        htmlContent += "<br/>";
        htmlContent += "<span class='clinic-header'>"+translate_l10n("phone_number")+"</span><br/>";
        htmlContent += "<a href='tel:" + clinic.phoneNumber + "'>" + clinic.phoneNumber + "</a><br/>";
    }

    if (clinic.eligibility != null) {
        htmlContent += "<br/>";
        htmlContent += "<span class='clinic-header'>"+translate_l10n("eligibility")+"</span><br/>";
        htmlContent += clinic.eligibility + "<br/>";
    }

    htmlContent += "<br/>";
    htmlContent += "<span class='clinic-header'>"+translate_l10n("clinic_dates")+"</span><br/>";
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

// ================================================================
// Localization
// ================================================================

// Globals
var language = null
var translations = {}       // l10n translations {lang: {key: l10n}}

// Translate the given english text into the given language. Falls
// back to the global language if lang is not given.
//
// Unknown text (or unknown langauges) are returned as an error
// message wrapped in an <span class=l10n_error> to help highlight
// missing translations.
//
// globals: 
// * translations
// * language
function translate_l10n(i18n_text, lang)
{
  retval = ""
  if (arguments.length < 2)
    lang = language
  if (lang in translations) {
    if (i18n_text in translations[lang]) {
      retval = translations[lang][i18n_text]
    } else {
      // It's tempting to use a <span class="l10n_error"> here to flag the 
      // text, but some text replacement happens in HTML <option> tags,
      // which do not allow child elements like <span>.
      retval = "ERROR: '"+lang+"' translation not found for '"+i18n_text+"'"
    }
  } else {
    retval = "ERROR: Language '"+lang+"' not found in translations table"
  }
  return retval
}

// Update all the l10n spans to fill in the l10n text, or an error.
function translate_spans()
{
  $("[data-i18n-text]").each(function (i, sp) {
      i18n_text = sp.getAttribute("data-i18n-text")
      if (i18n_text == null) {
        var i18n_text = "unknown"  // flag for span with no text attr
      }
      var l10n_text = translate_l10n(i18n_text, language)
      console.log("translating("+language+") '"+i18n_text+"' --> '"+l10n_text+"'")
      sp.innerHTML = l10n_text
    })


  // for whatever reason, changes to option text does not take effect until
  // after the selection changes (???). (You can prove that by uncommenting
  // the "proveit" section below, and commenting-out "!proveit", then looking
  // at the menu at initial load.) So call .change() to "change" to force
  // a change when translation happens.
  // if(PROVIT) {
  //   console.log("sanity check: select-date-range options")
  //   $("#select-date-range option").each(function (i, el) { console.log($(el).text()) })
  //   $("#select-date-range").append("<option value='believeit'>Believe it?</option>")
  // } else { // !PROVEIT
  var curval = $("#select-date-range option:selected").val();
  $("#select-date-range").val(curval).change() // "change" to the current value to trigger option text refresh (WTF????)
  // }


}

var language_from_code = {
  'en': 'English',
  'es': 'Spanish'
  }

// Callback for getting the user's preferred language.
// Triggers load of global translations and sets gobal of
// the preferred language, for benefit of other functions.
// Last, but hardly least, triggers translation of all the l10n spans.
//
// Globals: translations,
function globalization_preferred_language_cb(lang_code)
{
  console.log("lang_code = " + lang_code);
  lang = 'English';
  if (lang_code in language_from_code)
    lang = language_from_code[lang_code];

  var ajax_request = {
    dataType: "json",
    url: "js/translations.json",
    data: {},
    success: load_translations_success_cb,
    error: load_translations_error_cb
    }
  var o = $.ajax(ajax_request)
  set_default_language(lang)

  // if translations are loaded, use them
  if (language !== null && 'English' in translations) {
    translate_spans()
  }
}

function load_translations_success_cb(data, status, xhr)
{
  translations = data
  // if language is set, translate
  if (language !== null && "English" in translations) {
    translate_spans()
  }
}

function load_translations_error_cb(xhr, status, err)
{
  console.log("error loading translations.json")
  console.log(err)
  console.log(status)
}

function globalization_error_cb()
{
  console.log("in globalization_error_cb")
  alert("ERROR: Globalization error")
}

// sets default language and registers handler if it changes
function set_default_language(lang)
{
  console.log("setting default language to "+lang)
  language = lang
  $("#select-language").val(lang).change()
  $("#select-language").on("change", selected_language)
}

function selected_language(evt) 
{
  var selected_language = $("#select-language option:selected").val();
  console.log("language "+selected_language+" from selection")  
  language = selected_language

  translate_spans()
}

// app.initialize();
 
