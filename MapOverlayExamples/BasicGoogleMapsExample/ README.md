# Basic Google Maps Example

A simple example showing one possible way to use ClearAg tile layer with the Google Maps API.

In addition to supplying your own ClearAg credentials you will need to use your own Google developer key.
```html
<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=ADD_YOUR_OWN_GOOGLE_API_KEY"></script>
```

This example shows:
* How to [create a Google map](https://developers.google.com/maps/documentation/javascript/tutorial).
* Make a request to ClearAg weather [tile layer request](http://docs.clearag.com/documentation/Map_Overlay_API/latest#_tile_layer_index_request_v1_0)
* Create a [control on the Google map](https://developers.google.com/maps/documentation/javascript/controls).
* Add and remove weather tile layers

## Dependencies
This example  uses the [Google map API](https://developers.google.com/maps/) and uses a small amount of [JQuery](https://jquery.com/), however it is almost certainly possible to create this simple example without it.
