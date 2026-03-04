import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRootNavigation } from '../hooks/useRootNavigation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = Math.max(400, SCREEN_HEIGHT * 0.55);

export default function ExploreMapView({ filtered, region }) {
  const rootNav = useRootNavigation();
  const initialRegion = {
    latitude: Number(region?.latitude) || -23.5505,
    longitude: Number(region?.longitude) || -46.6333,
    latitudeDelta: Number(region?.latitudeDelta) || 0.05,
    longitudeDelta: Number(region?.longitudeDelta) || 0.05,
  };
  const boxesWithCoords = (filtered || []).filter(
    (b) => b != null && b.latitude != null && b.longitude != null
  );
  return (
    <View style={styles.mapWrap}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        mapType="standard"
        showsUserLocation={false}
        loadingEnabled
        loadingIndicatorColor="#F5A623"
        loadingBackgroundColor="#0a0a0a"
      >
        {boxesWithCoords.map((box) => (
          <Marker
            key={box.id}
            coordinate={{
              latitude: Number(box.latitude),
              longitude: Number(box.longitude),
            }}
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
  mapWrap: {
    flex: 1,
    minHeight: MAP_HEIGHT,
    width: SCREEN_WIDTH,
    alignSelf: 'stretch',
  },
  map: {
    width: '100%',
    height: '100%',
    minHeight: MAP_HEIGHT,
  },
});
