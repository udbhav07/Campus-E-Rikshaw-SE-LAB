import React from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function NativeMap({ location, style, routePolyline, activeRide, driverState }) {
  return (
    <MapView style={style} initialRegion={location} showsUserLocation={true}>
      <Marker coordinate={location} title="You (Rickshaw)" />
      {routePolyline && routePolyline.length > 0 && (
         <Polyline coordinates={routePolyline.map(c => ({latitude: c[0], longitude: c[1]}))} strokeColor="#00df82" strokeWidth={6} />
      )}
      {activeRide && driverState !== 'ONGOING' && activeRide.pickupLocation && (
         <Marker coordinate={{latitude: activeRide.pickupLocation.coordinates[1], longitude: activeRide.pickupLocation.coordinates[0]}} title="Pickup" pinColor="green" />
      )}
      {activeRide && driverState === 'ONGOING' && activeRide.dropLocation && (
         <Marker coordinate={{latitude: activeRide.dropLocation.coordinates[1], longitude: activeRide.dropLocation.coordinates[0]}} title="Dropoff" pinColor="red" />
      )}
    </MapView>
  );
}
