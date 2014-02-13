/**
 */
function FeatureSync( dataSync, mapId, mapBuilder, geoJsonSerializer ) {
  this.mapRef = dataSync.child( mapId );
  this.mapBuilder = mapBuilder;
  this.geoJsonSerializer = geoJsonSerializer;

  this.mapRef.on( 'child_added', this._featureAdded, this );
  this.mapBuilder.addLayerListener( 'beforefeatureadded', this._handleFeatureAddRequest, this );
}

FeatureSync.prototype._featureAdded = function( snapshot ) {
  var added = snapshot.val();
  this.mapBuilder.addFeature( added );
};

FeatureSync.prototype._handleFeatureAddRequest = function( ev ) {

  var self = this;

  var inDataSync = false;
  this.mapRef.transaction( function( features ) {
    inDataSync = self._addFeatureToDataSync( features, ev.feature, ev.object.name )
  }, function( err, committed, snapshot ) {
    if ( err ) {
      console.log('Transaction failed abnormally!', err);
    }
    // TODO: can we hook the adding in here?
  } );

  // Add via Firebase and not via this mechanism.
  console.log( 'returning' );
  return inDataSync;
};

FeatureSync.prototype._addFeatureToDataSync = function ( features, feature, layerName ) {
  console.log( '_addFeatureToDataSync' );
  var featureMKT = feature.geometry.toString();
  console.log( 'new MKT: %s', featureMKT );

  var inSyncService = false;

  if( !features ) {
    return;
  }

  var existingFeature,
      existingMKT,
      obj;
  for( var featureId in features ) {
    existingFeature = features[ featureId ];    
    obj = this.geoJsonSerializer.read( JSON.stringify( existingFeature.feature ) )[ 0 ];
    existingMKT = obj.geometry.toString();

    if( featureMKT === existingMKT ){
      // feature already exists
      // abort
      inSyncService = true;
      return;
    }
  }

  if( !inSyncService ) {
    var added = {
      layerName: layerName,
      feature: feature
    };

    var safeJson = this.geoJsonSerializer.write( added.feature );
    added.feature = JSON.parse( safeJson );
    this.mapRef.push( added );
  }

  return inSyncService;
};