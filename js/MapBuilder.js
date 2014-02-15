/**
 * Build up map and controls. Also used to add and remove features,
 * and expose feature events.
 * 
 * @MapLib An object exposing mapping functionality. Assumes same API as Open Layers
 * @el {HTMLElement} An element to attach the map that is being built to.
 */
function MapBuilder( MapLib, el ) {
  this.MapLib = MapLib;

  this.map = new MapLib.Map( { div: el } );
  // TODO: make base layer configurable.
  this.baseLayer = new MapLib.Layer.WMS( "OpenLayers WMS",
      "http://vmap0.tiles.osgeo.org/wms/vmap0?", {layers: 'basic'} );
  this.drawControls = {};

  this.layers = {};
  this._buildLayers();
  this._addLayersToMap();
  this._addControls();

  this.map.setCenter(new MapLib.LonLat(0, 0), 3);
}

/**
 * @private
 *
 * Adds Vector layers to the map. Right now assumes a layer per Vector type:
 * point, line, polygon, box.
 */
MapBuilder.prototype._buildLayers = function() {
  this.layers[ 'point' ]   = new this.MapLib.Layer.Vector( 'point' );
  this.layers[ 'line' ]    = new this.MapLib.Layer.Vector( 'line' );
  this.layers[ 'polygon' ] = new this.MapLib.Layer.Vector( 'polygon' );
  this.layers[ 'box' ]     = new this.MapLib.Layer.Vector( 'box' );
};

/** @private */
MapBuilder.prototype._addLayersToMap = function() {
  var layer,
      layersToAdd = [ this.baseLayer ];
  for( var layerName in this.layers ) {
    layer = this.layers[ layerName ];
    layersToAdd.push( layer );
  }
  this.map.addLayers( layersToAdd );
};

/** @private */
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

/**
 * Sets the feature type that is being drawn: point, line, polygon or box.
 */
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

/**
 * Sets if map panning is allowed when drawing a feature.
 */
MapBuilder.prototype.setAllowPanning = function( allowPanning ) {
  for(var key in this.drawControls) {
    this.drawControls[key].handler.stopDown = allowPanning;
    this.drawControls[key].handler.stopUp = allowPanning;
  }
};

/**
 * Add the given feature to the map.
 *
 * @param add The feature to add.
 */
MapBuilder.prototype.addFeature = function( add ) {
  var layer = this.layers[ add.layerName ];

  var geoJSON = new this.MapLib.Format.GeoJSON();
  var features = geoJSON.read( JSON.stringify( add.feature ) );

  layer.addFeatures( features );

  console.log( 'added to %s', add.layerName );
};

/**
 * Add a listener to all the layers that the MapBuilder has created.
 *
 * @param {String} eventName The event name to bind to on the layers.
 * @param {Function} callback The function to call when the event is triggered.
 * @param {Object} The `this` context to use when calling the `callback`.
 */
MapBuilder.prototype.addLayerListener = function( eventName, callback, context ) {
  var layer;
  for( var layerName in this.layers ) {
    layer = this.layers[ layerName ];
    layer.events.register( eventName, context, callback );
  }
};