# CSV Translator

This Python script will accept a location, start date, end date, and unit code as command line arguments, call the [daily historical weather endpoint](https://docs.clearag.com/documentation/Field_Weather_API/latest#_daily_historical_v1_2) and create a CSV file in the current directory from the JSON object. With a little editing this script could be used to convert other endpoints into CSV files.

This examples shows the following:
* Making a call to the daily historical endpoint programmatically
* Create a CSV file from the JSON return object.


## Dependencies
* (Requests)[http://docs.python-requests.org/en/master/]