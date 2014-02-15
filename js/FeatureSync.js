/**
 * Synchronises feature with a data sync service.
 * The dataSync service is assumed to have the same API as Firebase.
 * 
 * @param dataSync The data synchronisation service e.g. Firebase
 * @mapBuilder {MapBuilder}
 * @geoJsonSerializer A class implementing `read` and `write` for JSON serialisation.
 */
function FeatureSync( dataSync, mapBuilder, geoJsonSerializer ) {
  this.mapRef = dataSync;
  this.mapBuilder = mapBuilder;
  this.geoJsonSerializer = geoJsonSerializer;

  this.mapRef.on( 'child_added', this._featureAdded, this );
  this.mapBuilder.addLayerListener( 'beforefeatureadded', this._handleFeatureAddRequest, this );
}

/**
 * Data sync feature added event handler.
 *
 * @param snapshot A snapshot of the feature added. API of the object is assumed to be
                   the same as a Firebase snapshot.
*/
FeatureSync.prototype._featureAdded = function( snapshot ) {
  var added = snapshot.val();
  this.mapBuilder.addFeature( added );
};

/**
 * Handles a request to add a feature to the MapBuilder.
 *
 * @param ev The event triggered by the feature addition request.
 *           The event is assumed to have the same API as an OpenLayers
 *           event object.
 */
FeatureSync.prototype._handleFeatureAddRequest = function( ev ) {

  var self = this;

  var inDataSync = false;

  /**
   * Although this method suggests an async call, the callback is actually called
   * synchronously the contents of the mapRef.
   * This is how Firebase currently works.
   * TODO: Ensure that this functionality won't change.
   * Docs: https://www.firebase.com/docs/javascript/firebase/transaction.html
   */
  this.mapRef.transaction( function( features ) {
    inDataSync = self._addFeatureToDataSync( features, ev.feature, ev.object.name );
  }, function( err, committed, snapshot ) {
    if ( err ) {
      console.log('Transaction failed abnormally!', err);
    }
    // TODO: can we hook the adding in here?
  } );

  // Add via Firebase and not via this mechanism.
  return inDataSync;
};

FeatureSync.prototype._addFeatureToDataSync = function ( features, feature, layerName ) {
  console.log( '_addFeatureToDataSync' );
  var featureWKT = feature.geometry.toString();
  console.log( 'new WKT: %s', featureWKT );

  // Does the feature aleady exist in the data sync?
  var inSyncService = false;

  if( !features ) {
    return;
  }

  var existingFeature,
      existingWKT,
      obj;
  for( var featureId in features ) {
    existingFeature = features[ featureId ];    
    obj = this.geoJsonSerializer.read( JSON.stringify( existingFeature.feature ) )[ 0 ];
    existingWKT = obj.geometry.toString();

    /**
     * the toString() of an OpenLayers feature returns something called 
     * Well Know Text as a representation of a feature.
     * This contains feature type and geometry information.
     * We're using this to define globally unique features on the map.
     */
    if( featureWKT === existingWKT ){
      // feature already exists in the data sync.
      inSyncService = true;

      // returning aborts any transaction updates.
      return;
    }
  }

  if( !inSyncService ) {
    var added = {
      layerName: layerName,
      feature: feature
    };

    // Creates JSON stripping any OpenLayers specific properties
    var safeJson = this.geoJsonSerializer.write( added.feature );

    // Parse back to an object literal to store in the data sync.
    added.feature = JSON.parse( safeJson );
    this.mapRef.push( added );
  }

  return inSyncService;
};