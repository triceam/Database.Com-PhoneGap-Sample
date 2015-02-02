Database.Com-PhoneGap-Sample
============================

Sample application showing how to access data from Salesforce.com/Database.com within PhoneGap applications.   

This example uses data and services from http://database.com

Dependencies:
* PhoneGap:  http://www.phonegap.com
* PhoneGap ChildBrowser Plugin: https://github.com/phonegap/phonegap-plugins

Installation:

1. install InAppBrowser

 $ cordova plugin add org.apache.cordova.inappbrowser

2. config.xml

add params showed below.

    <feature name="InAppBrowser">
      <param name="ios-package" value="CDVInAppBrowser" />
    </feature>
