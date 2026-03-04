import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
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
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'map' && styles.toggleBtnActive]}
            onPress={() => setView('map')}
          >
            <Ionicons name="map" size={14} color={view === 'map' ? '#000' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.toggleText, view === 'map' && styles.toggleTextActive]}>Mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
            onPress={() => setView('list')}
          >
            <Ionicons name="list" size={14} color={view === 'list' ? '#000' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.toggleText, view === 'list' && styles.toggleTextActive]}>Lista</Text>
          </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  toggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#F5A623' },
  toggleText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.5)' },
  toggleTextActive: { color: '#000' },
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
