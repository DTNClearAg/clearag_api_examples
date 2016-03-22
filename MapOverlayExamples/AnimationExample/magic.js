var license = '?app_id=YOUR_ID_HERE&app_key=YOUR_KEY_HERE';

// Leaflet map object
var map = L.map('map', {
    zoom: 4,
    center: [40.34654412118006, -98.39355468749999],
    zoomControl: false
});

// The list of layers everything else should be working from.
var allLayers = {};

// These globals keep track of the current layer being displayed.
var currLayer = '0';
var currInterval = 0;

// This keeps tracking if the layers are animated.
var isPlaying = false;

// The 'setInterval' object used in playing the layers.
var player;

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">' +
                 'OpenStreetMap</a> contributors',
    maxZoom: 15,
    zIndex: 1
}).addTo(map);

// Leaflet Controls ////////////////////////////////////////////////////////////

// The 'info' control displays information on the currently displayed layer.
var info = L.control({
    position: 'bottomleft'
});

info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    L.DomEvent.disableClickPropagation(this._div);
    return this._div;
};

info.update = function(time) {
    var t;
    var l;

    if (isValidTimeStamp(time)) {
        t = moment.unix(time).format('YYYY-M-D, H:mm:ss Z');
    } else {
        t = 'N/A';
    }

    if (!allLayers || !allLayers[currLayer]) {
        l = 'N/A';
    } else {
        l = +currInterval + 1 + '/' + allLayers[currLayer].length;
    }

    this._div.innerHTML = '<h4>Time: </h4>' + t + '<br>'
                        + '<h4>Current Interval: </h4>' + l;
};

// Layer control holds the layer selector
var layerControl = L.control({
    position: 'topright'
});

layerControl.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info');
    L.DomEvent.disableClickPropagation(this._div);
    return this._div;
};

layerControl.update = function(lOptions) {
    var x = 'No layers available.';
    if (allLayers.length !== 0) {
        x = lOptions;
    }

    this._div.innerHTML = '<h4>Layers: </h4>' + x.html;
};

info.addTo(map);
layerControl.addTo(map);
////////////////////////////////////////////////////////////////////////////////
getLayers();

function getLayers(dstart, drange, dinterval) {
    var earls = [];
    var myData = [];
    var layer;

    allLayers = {};

    // LayerOptions holds all of the information to create the layer control
    // and populate the allLayers list.
    var lOptions = {
        html: '',
        domains: {},
    };

    // If no input is given for a specific parameter none will be included in
    // the API call.
    if (dstart === undefined || dstart === '' || dstart === 0) {
        dstart = '';
    } else {
        dstart ='&display_start=' + dstart;
    }
    if (drange === undefined || drange === '') {
        drange = '';
    } else {
        drange = '&display_range=' + drange;
    }
    if (dinterval === undefined || dinterval === '') {
        dinterval = '';
    } else {
        dinterval = '&display_interval=' + dinterval;
    }

    lOptions.html = '<select id="layerPicker">'
                  + '<option value ="0"> No layer selected.</option>';

    earl = 'http://tiles.clearapis.com/v1.0/layer_index'
         + license
         + dstart
         + drange
         + dinterval;

    $.get(earl, function(data){
        for (i in data.display_intervals) {
            for (d in data.display_intervals[i].layers) {
                layers = data.display_intervals[i].layers[d];

                for (l in layers) {
                    layer = layers[l];

                    fullLayerName = d + '-' + l;

                    if (!allLayers[fullLayerName]) {
                        allLayers[fullLayerName] = [];
                    }

                    if (!lOptions.domains[d]) {
                        lOptions.domains[d] = [];
                    }

                    if (lOptions.domains[d].indexOf(fullLayerName) === -1) {
                        lOptions.domains[d].push(fullLayerName);
                    }

                    allLayers[fullLayerName].push({
                        layer: L.tileLayer(
                            layer.tile_url +
                            '{z}/{x}/{y}.' +
                            layer.layer_type +
                            license,
                            {
                                attribution: 'hail data &copy;'
                                             + '<a href="//www.iteris.com">'
                                             + 'Iteris</a>',
                                zIndex: 3,
                            }
                        ),
                        displayTime: data.display_intervals[i].display_time,
                        validTime: layer.valid_time
                    });
                }
            }
        }

        // Creating the layer dropdown menu.
        for (domain in lOptions.domains) {
            lOptions.html += '<optgroup label="' + domain + '">';

            for (layerName in lOptions.domains[domain]) {
                layer = lOptions.domains[domain][layerName];

                lOptions.html += '<option value="' + layer + '">'
                               + layer.slice(layer.lastIndexOf('-') + 1)
                               + '</option>';
            }

            lOptions.html += '</optgroup>';
        }

        lOptions.html += '</select>';

        layerControl.update(lOptions);
    }).fail(function(jqXHR) {
        alert('Status Code: ' + jqXHR.status + '\n' +
              jqXHR.responseText);
    });
}

$(document).ready(function() {
    $('#map').on('change .layerPicker', function(e) {
        if (e.target.id === 'layerPicker') {
            removeAllLayers();

            $('#intervalSlider').val(0);

            addLayer(e.target.value);

            controlControl();
        }
    });
});

// Keeps the non map div the same size regardless of the size of the window.
function resize() {
    document.getElementById('map').style.height = window.innerHeight
                                                - $('#non_map_div').height()
                                                + 'px';
    document.getElementById('map').style.visibility = 'visible';
}

// Called whenever the slider moves.
function sliderMove() {
    removeLayer();
    addLayer();
    controlControl();
}

// Step forward one layer.
function incrementInterval() {
    var slider = $('#intervalSlider');
    removeLayer();
    if (isPlaying && +slider.val() === +slider.prop('max')) {
        slider.val(0);
    } else {
        slider.val(+slider.val() + 1);
    }

    sliderMove();
}

// Step backward one layer.
function decrementInterval() {
    removeLayer();
    $('#intervalSlider').val(+$('#intervalSlider').val() - 1);
    sliderMove();
}

// Start/stop animating series of layer
function StartStop() {
    if (isPlaying) {
        clearInterval(player);
        isPlaying = false;
        $('#startStop').css('background-color', '');
        controlControl();
    } else {
        isPlaying = true;
        $('#startStop').css('background-color', 'green');
        player = setInterval(incrementInterval, 1000);
    }
}

// Called when the slider is moved.
function removeLayer() {
    if(currLayer !== '0') {
        allLayers[currLayer][currInterval].layer.setOpacity(0);
    }
}

// Called when submit button is pressed.
function removeAllLayers() {
    for (layer in allLayers) {
        for (interval in allLayers[layer]) {
            map.removeLayer(allLayers[layer][interval].layer);
        }
    }

    info.update();
}

// Called when the slider is moved.
function addLayer(newLayer) {
    currInterval = +$('#intervalSlider').val();
    if (newLayer !== undefined) {
        currLayer = newLayer;
    }

    if (currLayer !== '0') { // A valid layer
        map.addLayer(allLayers[currLayer][currInterval].layer.setOpacity(0.65));
        info.update(allLayers[currLayer][currInterval].validTime);
    } else {
        info.update();
    }
}

// Fired with the submit button.
function setParameters() {
    var dStart = moment.unix($("#displayStart").val()).unix();

    $('#intervalSlider').val(0);
    currLayer = '0';

    removeAllLayers();

    getLayers(dStart, $('#displayRange').val(), $('#intervalRange').val());
}

// Fired with the reset button.
function resetParameters() {
    $("#displayStart").val('');
    $('#displayRange').val('');
    $('#intervalRange').val('');
}

function controlControl() {
    // A valid layer with more than 1 layer
    if (currLayer !== '0' && allLayers[currLayer].length > 1) {

        $('#intervalSlider').prop('max', allLayers[currLayer].length - 1);

        // Update interval controls
        $('#startStop').prop('disabled', false);

        if (isPlaying) {
            $('#intervalSlider').prop('disabled', true);
            $('#stepForward').prop('disabled', true);
            $('#stepBack').prop('disabled', true);
        } else {
            $('#intervalSlider').prop('disabled', false);

            // we're at the last interval
            if (currInterval === allLayers[currLayer].length - 1) {
                $('#stepForward').prop('disabled', true);
            } else { // we're not at the last interval
                $('#stepForward').prop('disabled', false);
            }

            if ( currInterval === 0) {  // we're at the first interval
                $('#stepBack').prop('disabled', true);
            } else { // We're not at the first interbal
                $('#stepBack').prop('disabled', false);
            }
        }
    } else { // Not valid layer
        $('#intervalSlider').prop('disabled', true);
        $('#stepForward').prop('disabled', true);
        $('#stepBack').prop('disabled', true);
        $('#startStop').prop('disabled', true);
    }
}

// Datetime picker Functions ///////////////////////////////////////////////////

// Initialise datetime picker for display start
$('#displayStart').datetimepicker( {
    onChangeDateTime:function(ct) {
        if (ct !== null) {
            $('#displayStart').val(floorToMinute(ct.dateFormat('unixtime')));
        }
    },
    step: 15,
    format: 'unixtime',
    withoutCopyright: false
});

// Floors a number to closest 60, as in floors a unix time stamp to minute.
function floorToMinute(x) {
    return x - (x % 60);
}

// Fires when either the display start or current time input field is changed.
// Checks that input is a valid unix time and only enable submit button if valid
$('.datetimepicker').change(function() {
    var dsIsValid = timeInputValidator($('#displayStart').val())

    if (dsIsValid) {
        $('#submit_button').prop('disabled', false );
    } else {
        alert('Time must be a valid Unix time stamp or blank.');
        if (!dsIsValid) {
            $('#displayStart').val('');
        }
    }
});

$('#displayRange').change(function() {
    var drange = +$('#displayRange').val();
    if (!(drange === ''
        || (Number.isInteger(+drange) && drange >= 1 && drange <= 24))) {

        alert("Display range must be an integer between 1 and 24 or blank.");
        $('#displayRange').val('');
    }
});

$('#intervalRange').change(function() {
    var dinterval = $('#intervalRange').val();

    if (!(dinterval === ''
          || (Number.isInteger(+dinterval) && dinterval >= 300
                                           && dinterval <= 3600))){

        alert('Display interval must be an integer inclusively between 300 and '
              +'3600 or blank.');
        $('#intervalRange').val('');
    }
});

function timeInputValidator(n) {
    return n === '' || isValidTimeStamp(n);
}

// Checks the given number is a valid unix step, as in its an int between
// 0 and 2556144000 (2050-12-31)
function isValidTimeStamp(n) {
    return  +n === parseInt(n) && n < 2556144000 && n > 0;
}