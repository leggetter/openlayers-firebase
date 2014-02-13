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

MapBuilder.prototype.addFeature = function( add ) {
  var layer = this.layers[ add.layerName ];

  var geoJSON = new this.MapLib.Format.GeoJSON();
  var features = geoJSON.read( JSON.stringify( add.feature ) );

  layer.addFeatures( features );

  console.log( 'added to %s', add.layerName );
};

MapBuilder.prototype.addLayerListener = function( eventName, callback, context ) {
  var layer;
  for( var layerName in this.layers ) {
    layer = this.layers[ layerName ];
    layer.events.register( eventName, context, callback );
  }
};