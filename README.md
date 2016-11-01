# smcfluclinics

SMC Flu Clinics is a mobile application, created in PhoneGap for 
cross-platform compatibility, which displays mapped and timestamped 
data on free flu shot clinics within San Mateo County.

The application consumes a data feed from the San Mateo County 
Open Data Portal (data.smcgov.org)

To debug, get the Google Chrome plugin from http://emulate.phonegap.com/.
Beware the plugin is 1) beta; 2) a potential security hole.

Then run "phonegap serve android" and point Chrome to 
localhost:8000/android/www/index.html.  Note you will see many 
popup dialogs; close those and turn on developer tools, and reload. 

If/when you change the code, kill and restart the phonegap serve process, and 
reload the page.

If you make changes to the config.xml file, run phonegap build android and
then re-run phonegap serve.
