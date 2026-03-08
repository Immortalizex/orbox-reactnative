import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import BoxCard from '../components/BoxCard';
import { Ionicons } from '@expo/vector-icons';
import { useRootNavigation } from '../hooks/useRootNavigation';
import ExploreMapView from './ExploreMapView';

export default function ExploreMapScreen() {
  const rootNav = useRootNavigation();
  const [view, setView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const slideAnim = useRef(new Animated.Value(view === 'list' ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: view === 'list' ? 1 : 0,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [view, slideAnim]);

  const { data: boxes = [], isLoading } = useQuery({
    queryKey: ['allBoxes'],
    queryFn: () => api.entities.Box.list('-created_date', 100),
  });

  const filtered = boxes.filter(
    (b) =>
      b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lat = boxes.length > 0 && boxes[0].latitude != null ? Number(boxes[0].latitude) : -23.5505;
  const lng = boxes.length > 0 && boxes[0].longitude != null ? Number(boxes[0].longitude) : -46.6333;
  const region = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Encontrar Box</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchTrack}>
            <Animated.View
              style={[
                styles.switchThumb,
                {
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 82],
                      }),
                    },
                  ],
                },
              ]}
            />
            <TouchableOpacity
              style={styles.switchSegment}
              onPress={() => setView('map')}
              activeOpacity={0.8}
            >
              <Ionicons name="map-outline" size={14} color={view === 'map' ? '#1a1a1a' : 'rgba(255,255,255,0.45)'} />
              <Text style={[styles.switchLabel, view === 'map' && styles.switchLabelActive]}>Mapa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.switchSegment}
              onPress={() => setView('list')}
              activeOpacity={0.8}
            >
              <Ionicons name="list-outline" size={14} color={view === 'list' ? '#1a1a1a' : 'rgba(255,255,255,0.45)'} />
              <Text style={[styles.switchLabel, view === 'list' && styles.switchLabelActive]}>Lista</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="location" size={16} color="rgba(255,255,255,0.3)" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou endereço..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {view === 'map' ? (
        <View style={styles.mapContainer}>
          <ExploreMapView filtered={filtered} region={region} />
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filtered.map((box) => (
            <BoxCard
              key={box.id}
              box={box}
              onPress={() => rootNav.navigate('BookBox', { boxId: box.id })}
            />
          ))}
          {filtered.length === 0 && (
            <Text style={styles.empty}>Nenhum box encontrado</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(10,10,10,0.95)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  switchRow: { marginLeft: 6 },
  switchTrack: {
    width: 168,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  switchThumb: {
    position: 'absolute',
    left: 2,
    top: 2,
    width: 82,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f7941d',
  },
  switchSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: '100%',
    zIndex: 1,
  },
  switchLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  switchLabelActive: { color: '#1a1a1a' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  searchIcon: { position: 'absolute', left: 28, zIndex: 1 },
  searchInput: {
    flex: 1,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
  },
  mapContainer: { flex: 1, minHeight: 300 },
  list: { flex: 1 },
  listContent: { padding: 16, gap: 16, paddingBottom: 32 },
  empty: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, paddingVertical: 48 },
});
