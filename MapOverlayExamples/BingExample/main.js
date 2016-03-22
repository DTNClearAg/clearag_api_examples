// ***************
// *  CONSTANTS  *
// ***************
window.Constants = {
	BING_KEY: 'BING_KEY',
	MAP_EXTENTS: { // Continental U.S. of A.
		bottom: 2360903.23018326,
		left:  -14226630.9233804,
		right: -7122221.02095364,
		top:    6710219.08322074
	},
	ITERIS: {
		base_url: "http://ag.clearpathapis.com",
		app_id:   "APP_ID",
		app_key:  "APP_KEY",
        license:  "?app_id=APP_ID&app_key=APP_KEY"
	}
};

init();

function init() {
    map = new OpenLayers.Map('map');
    var osm = new OpenLayers.Layer.OSM('OpenStreetMap');
    var bing = new OpenLayers.Layer.Bing({
        name: "Bing Aerial",
        type: "AerialWithLabels",
        key: window.Constants.BING_KEY
    });

	var layerSwitcher = new OpenLayers.Control.LayerSwitcher({
			alwaysOn: true
	});
    map.addControl(layerSwitcher);

    map.addLayers([osm, bing]);
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);
    loadIterisLayers();
}

function loadIterisLayers() {
		var layerNames = [];
		var self       = this;
		var query      = location.search.substr(1);
		var args       = {};
		query.split("&").forEach(function(part) {
			var item      = part.split("=");
			args[item[0]] = decodeURIComponent(item[1]);
		});
		var ctime = '', dstart = '';

		if(typeof(args['current_time']) != 'undefined'){
			ctime = '&current_time=' + args['current_time'];
		}
		if(typeof(args['display_start']) != 'undefined'){
			dstart = '&display_start=' + args['display_start'];
		}

		$.ajax({type:"GET", url: window.Constants.ITERIS.base_url+'/v1.0/layer_index'+ window.Constants.ITERIS.license + ctime + dstart, processData: false
		})
		.always(function(data){
            console.log(JSON.stringify(data))
			for(domain_name in data.display_intervals[0].layers){
				if (domain_name != 'contigus') { continue; }
				var layers = data.display_intervals[0].layers[domain_name];

				for(layerName in layers){
                    var layer     = layers[layerName];
					var tileURL   = layer.tile_url;
					var layerType = layer.layer_type;
					var name      = layerName.replace(/_/g, ' ').replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
                    
                    // The below code block will work the same as the TMS layer definition, without the need for defining a seperate getURL function, just in case you want to compact your code.
                    
                    //var mapLayer = new OpenLayers.Layer.OSM(
                    //    layerName,
                    //    layer.tile_url + "${z}/${x}/${y}.png" + window.Constants.ITERIS.license,
                    //    {
                    //        numZoomLevels: 19,
                    //        isBaseLayer: false,
                    //        projection: new OpenLayers.Projection("EPSG:3857")
                    //    }
                    //);
                    
					var mapLayer  = new OpenLayers.Layer.TMS(
						name, tileURL, {
							getURL:        self.getIterisURL,
							layername:     layerName,
							type:          layerType,
							projection:    new OpenLayers.Projection('EPSG:3857'),
							isBaseLayer:   false
						}
					);

					mapLayer.setOpacity(0.7);

					if (layerName == 'precip_acc_last_24hr')
					{
						mapLayer.setVisibility(true);
					}
					else
					{
						mapLayer.setVisibility(false);
					}

					self.map.addLayer(mapLayer);
				}
			}
		});
}

function getIterisURL(bounds) {
		var res  = this.map.getResolution();
		var x    = Math.round ((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
		var y    = Math.round ((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
		var z    = this.map.getZoom();
        
        // This is the fix. I'm not sure why, but Bing maps always displays one zoom level lower (higher number,
        // lower scale) than it actually is. This fixes that behavior, and works, despite being a bit kludge-y.
        // :-)
        if (this.map.baseLayer.name == "Bing Aerial") {
            z += 1;
        }
        
		var path = z + "/" + x + "/" + y + ".png";
		var url  = this.url;

		if (url instanceof Array) {
			url = this.selectUrl(path, url);
		}

		return url + path + window.Constants.ITERIS.license;
}