import React from 'react';
import { View, Text } from 'react-native';

export default function NativeMap({ location, style }) {
  return (
    <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#191c24' }]}>
      <Text style={{ color: '#00df82', fontSize: 18, fontWeight: 'bold' }}>Map Unavailable on Web Emulator</Text>
      <Text style={{ color: '#94a3b8', marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
        The real-time Socket.io logic works fine, but the native 'react-native-maps' library only compiles on iOS or Android devices!
      </Text>
      <View style={{ marginTop: 20, backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 10 }}>
        <Text style={{ color: '#aaa' }}>Simulated Latitude: {location.latitude}</Text>
        <Text style={{ color: '#aaa' }}>Simulated Longitude: {location.longitude}</Text>
      </View>
    </View>
  );
}
