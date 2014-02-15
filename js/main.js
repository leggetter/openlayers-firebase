if( typeof window.console === 'undefined' ) {
  window.console = {
    log: function() {},
    dir: function() {},
    error: function() {}
  };
}

// Create the map
var mapEl = document.getElementById( 'map' );
var mapBuilder = new MapBuilder( OpenLayers, mapEl );

// Sync map data to Firebase
var fb = new Firebase( 'https://openlayers.firebaseio.com/test' );
var syncService = new FeatureSync( fb, mapBuilder, new OpenLayers.Format.GeoJSON() );

document.getElementById('noneToggle').checked = true;

// UI event handlers
function toggleControl(element) {
  mapBuilder.setActiveControl( element.value );
}

function allowPan(element) {
  var allowPanning = !element.checked;
  window.mapBuilder.setAllowPanning( allowPanning );
}