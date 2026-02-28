import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRootNavigation } from '../hooks/useRootNavigation';

export default function ExploreMapView({ filtered, region }) {
  const rootNav = useRootNavigation();
  return (
    <View style={styles.mapWrap}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        mapType="mutedStandard"
      >
        {(filtered || [])
          .filter((b) => b.latitude && b.longitude)
          .map((box) => (
            <Marker
              key={box.id}
              coordinate={{ latitude: box.latitude, longitude: box.longitude }}
              title={box.name}
              description={box.address}
              onCalloutPress={() => rootNav.navigate('BookBox', { boxId: box.id })}
            />
          ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: { flex: 1, minHeight: 400 },
  map: { width: '100%', height: '100%' },
});
