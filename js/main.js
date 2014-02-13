var layers = {};

var dataRef = new Firebase( 'https://openlayers.firebaseio.com' );
var mapRef = dataRef.child( 'test' );

mapRef.on( 'child_added', function( snapshot, prevChildName ) {
  var added = snapshot.val();
  var layer = layers[ added.layerName ];

  var geoJSON = new OpenLayers.Format.GeoJSON();
  var features = geoJSON.read( JSON.stringify( added.feature ) );

  layer.addFeatures( features );

  console.log( 'added to %s', added.layerName );
} );

var map, drawControls;
function init(){

  map = new OpenLayers.Map('map');

  var wmsLayer = new OpenLayers.Layer.WMS( "OpenLayers WMS",
      "http://vmap0.tiles.osgeo.org/wms/vmap0?", {layers: 'basic'});

  layers[ 'point' ]   = new OpenLayers.Layer.Vector( 'point' );
  layers[ 'line' ]    = new OpenLayers.Layer.Vector( 'line' );
  layers[ 'polygon' ] = new OpenLayers.Layer.Vector( 'polygon' );
  layers[ 'box' ]     = new OpenLayers.Layer.Vector( 'box' );

  var beforeFeatureAdded = function( ev ) {
    var feature = ev.feature;
    var featureMKT = feature.geometry.toString();
    var geoJSON = new OpenLayers.Format.GeoJSON();
    console.log( 'new MKT: %s', featureMKT );

    var inFirebase = false;
    mapRef.transaction( function( features ) {
      if( !features ) {
        return;
      }

      var existingFeature,
          existingMKT,
          obj;
      for( var featureId in features ) {
        existingFeature = features[ featureId ];
        obj = geoJSON.read( JSON.stringify( existingFeature.feature ) )[ 0 ];
        existingMKT = obj.geometry.toString();

        if( featureMKT === existingMKT ){
          // feature already exists
          // abort
          inFirebase = true;
          return;
        }
      }
    }, function( err, committed, snapshot ) {
      if ( err ) {
        console.log('Transaction failed abnormally!', err);
      }
      // TODO: can we hook the adding in here?
    } );

    if( !inFirebase ) {
      var added = {
        layerName: ev.object.name,
        feature: feature
      };

      var safeJson = geoJSON.write( added.feature );
      added.feature = JSON.parse( safeJson );
      mapRef.push( added );
    }

    // Add via Firebase and not via this mechanism.
    return inFirebase;
  };

  var layer,
      layersToAdd = [ wmsLayer ];
  for( var layerName in layers ) {
    layer = layers[ layerName ];
    layersToAdd.push( layer );
    layer.events.register( 'beforefeatureadded', layer, beforeFeatureAdded );
  }

  map.addLayers( layersToAdd );
  map.addControl(new OpenLayers.Control.LayerSwitcher());
  map.addControl(new OpenLayers.Control.MousePosition());

  drawControls = {
      point: new OpenLayers.Control.DrawFeature(layers[ 'point' ],
          OpenLayers.Handler.Point),
      line: new OpenLayers.Control.DrawFeature(layers[ 'line' ],
          OpenLayers.Handler.Path),
      polygon: new OpenLayers.Control.DrawFeature(layers[ 'polygon' ],
          OpenLayers.Handler.Polygon),
      box: new OpenLayers.Control.DrawFeature(layers[ 'box' ],
          OpenLayers.Handler.RegularPolygon, {
              handlerOptions: {
                  sides: 4,
                  irregular: true
              }
          }
      )
  };

  var drawControl;
  for(var key in drawControls) {
    drawControl = drawControls[ key ];
    map.addControl( drawControl );
  }

  map.setCenter(new OpenLayers.LonLat(0, 0), 3);

  document.getElementById('noneToggle').checked = true;
}

function toggleControl(element) {
  for(key in drawControls) {
      var control = drawControls[key];
      if(element.value == key && element.checked) {
          control.activate();
      } else {
          control.deactivate();
      }
  }
}

function allowPan(element) {
  var stop = !element.checked;
  for(var key in drawControls) {
      drawControls[key].handler.stopDown = stop;
      drawControls[key].handler.stopUp = stop;
  }
}

init();