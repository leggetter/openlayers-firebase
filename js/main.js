var mapEl = document.getElementById( 'map' );
var mapBuilder = new MapBuilder( OpenLayers, mapEl );

var fb = new Firebase( 'https://openlayers.firebaseio.com' );
var syncService = new FeatureSync( fb, 'test', mapBuilder, new OpenLayers.Format.GeoJSON() );

document.getElementById('noneToggle').checked = true;

function toggleControl(element) {
  mapBuilder.setActiveControl( element.value );
}

function allowPan(element) {
  var allowPanning = !element.checked;
  window.mapBuilder.setAllowPanning( allowPanning );
}