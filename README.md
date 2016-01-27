# smcfluclinics

SMC Flu Clinics is a mobile application, created in Cordova for 
cross-platform compatibility, which displays mapped and timestamped 
data on free flu shot clinics within San Mateo County.

The application consumes a data feed from the San Mateo County 
Open Data Portal (data.smcgov.org)

 ===================

Required Cordova plugins (use "cordova plugin add X"):

* cordova-plugin-geolocation
* cordova-plugin-globalization
* cordova-plugin-splashscreen
* cordova-plugin-whitelist
* cordova-plugin-x-toast

To debug, get the Google Chrome plugin from http://emulate.phonegap.com/.
Beware the plugin is 1) beta; 2) a potential security hole.

Then run "cordova serve android" and point Chrome to 
localhost:8000/android/www.  Note you will see many popup dialogs; close 
those and turn on developer tools, and reload. 

If/when you change the code, kill and restart the cordova serve process, and 
reload the page.

If you make changes to the config.xml file, run cordova build android and
then re-run cordova serve.
