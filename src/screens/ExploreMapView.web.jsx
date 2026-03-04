import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function getOsmEmbedUrl(region, firstBox) {
  const lat = Number(region?.latitude) || -23.5505;
  const lng = Number(region?.longitude) || -46.6333;
  const deltaLat = Number(region?.latitudeDelta) || 0.05;
  const deltaLng = Number(region?.longitudeDelta) || 0.05;
  const minLat = lat - deltaLat / 2;
  const maxLat = lat + deltaLat / 2;
  const minLng = lng - deltaLng / 2;
  const maxLng = lng + deltaLng / 2;
  const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;
  const marker = firstBox
    ? `&marker=${Number(firstBox.latitude)},${Number(firstBox.longitude)}`
    : `&marker=${lat},${lng}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik${marker}`;
}

export default function ExploreMapView({ filtered, region }) {
  const boxesWithCoords = (filtered || []).filter(
    (b) => b != null && b.latitude != null && b.longitude != null
  );
  const firstBox = boxesWithCoords[0];
  const embedUrl = getOsmEmbedUrl(region, firstBox);

  return (
    <View style={styles.mapWrap}>
      <iframe
        title="Mapa"
        src={embedUrl}
        style={styles.iframe}
      />
      {boxesWithCoords.length > 1 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{boxesWithCoords.length} boxes na área</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: { flex: 1, minHeight: 400, position: 'relative', alignSelf: 'stretch' },
  map: { width: '100%', height: '100%' },
  iframe: {
    width: '100%',
    height: '100%',
    minHeight: 400,
    border: 0,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  badge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '500' },
});
