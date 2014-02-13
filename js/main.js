function MapBuilder( MapLib, el ) {
  this.MapLib = MapLib;

  this.map = new MapLib.Map( { div: el } );
  this.baseLayer = new MapLib.Layer.WMS( "OpenLayers WMS",
      "http://vmap0.tiles.osgeo.org/wms/vmap0?", {layers: 'basic'} );
  this.drawControls = {};

  this.layers = {};
  this._buildLayers();
  this._addLayersToMap();
  this._addControls();

  this.map.setCenter(new MapLib.LonLat(0, 0), 3);
}

MapBuilder.prototype._buildLayers = function() {
  this.layers[ 'point' ]   = new this.MapLib.Layer.Vector( 'point' );
  this.layers[ 'line' ]    = new this.MapLib.Layer.Vector( 'line' );
  this.layers[ 'polygon' ] = new this.MapLib.Layer.Vector( 'polygon' );
  this.layers[ 'box' ]     = new this.MapLib.Layer.Vector( 'box' );
};

MapBuilder.prototype._addLayersToMap = function() {
  var layer,
      layersToAdd = [ this.baseLayer ];
  for( var layerName in this.layers ) {
    layer = this.layers[ layerName ];
    layersToAdd.push( layer );
    // layer.events.register( 'beforefeatureadded', layer, beforeFeatureAdded );
  }
  this.map.addLayers( layersToAdd );
};

MapBuilder.prototype._addControls = function() {
  this.map.addControl(new this.MapLib.Control.LayerSwitcher());
  this.map.addControl(new this.MapLib.Control.MousePosition());

  this.drawControls = {
      point: new this.MapLib.Control.DrawFeature(this.layers[ 'point' ],
          this.MapLib.Handler.Point),
      line: new this.MapLib.Control.DrawFeature(this.layers[ 'line' ],
          this.MapLib.Handler.Path),
      polygon: new this.MapLib.Control.DrawFeature(this.layers[ 'polygon' ],
          this.MapLib.Handler.Polygon),
      box: new this.MapLib.Control.DrawFeature(this.layers[ 'box' ],
          this.MapLib.Handler.RegularPolygon, {
              handlerOptions: {
                  sides: 4,
                  irregular: true
              }
          }
      )
  };

  var drawControl;
  for(var key in this.drawControls) {
    drawControl = this.drawControls[ key ];
    this.map.addControl( drawControl );
  }
};

MapBuilder.prototype.setActiveControl = function( controlName ) {
  for(var key in this.drawControls) {
    var control = this.drawControls[key];
    // if(element.value == key && element.checked) {
    if(controlName === key) {
        control.activate();
    } else {
        control.deactivate();
    }
  }
};

MapBuilder.prototype.setAllowPanning = function( allowPanning ) {
  for(var key in this.drawControls) {
    this.drawControls[key].handler.stopDown = allowPanning;
    this.drawControls[key].handler.stopUp = allowPanning;
  }
};

// var dataRef = new Firebase( 'https://openlayers.firebaseio.com' );
// var mapRef = dataRef.child( 'test' );

// mapRef.on( 'child_added', function( snapshot, prevChildName ) {
//   var added = snapshot.val();
//   var layer = layers[ added.layerName ];

//   var geoJSON = new OpenLayers.Format.GeoJSON();
//   var features = geoJSON.read( JSON.stringify( added.feature ) );

//   layer.addFeatures( features );

//   console.log( 'added to %s', added.layerName );
// } );

function init(){

  // var beforeFeatureAdded = function( ev ) {
  //   var feature = ev.feature;
  //   var featureMKT = feature.geometry.toString();
  //   var geoJSON = new OpenLayers.Format.GeoJSON();
  //   console.log( 'new MKT: %s', featureMKT );

  //   var inFirebase = false;
  //   mapRef.transaction( function( features ) {
  //     if( !features ) {
  //       return;
  //     }

  //     var existingFeature,
  //         existingMKT,
  //         obj;
  //     for( var featureId in features ) {
  //       existingFeature = features[ featureId ];
  //       obj = geoJSON.read( JSON.stringify( existingFeature.feature ) )[ 0 ];
  //       existingMKT = obj.geometry.toString();

  //       if( featureMKT === existingMKT ){
  //         // feature already exists
  //         // abort
  //         inFirebase = true;
  //         return;
  //       }
  //     }
  //   }, function( err, committed, snapshot ) {
  //     if ( err ) {
  //       console.log('Transaction failed abnormally!', err);
  //     }
  //     // TODO: can we hook the adding in here?
  //   } );

  //   if( !inFirebase ) {
  //     var added = {
  //       layerName: ev.object.name,
  //       feature: feature
  //     };

  //     var safeJson = geoJSON.write( added.feature );
  //     added.feature = JSON.parse( safeJson );
  //     mapRef.push( added );
  //   }

  //   // Add via Firebase and not via this mechanism.
  //   return inFirebase;
  // };
  
}

var mapEl = document.getElementById( 'map' );
var mapBuilder = new MapBuilder( OpenLayers, mapEl );
document.getElementById('noneToggle').checked = true;

function toggleControl(element) {
  mapBuilder.setActiveControl( element.value );
}

function allowPan(element) {
  var allowPanning = !element.checked;
  window.mapBuilder.setAllowPanning( allowPanning );
}