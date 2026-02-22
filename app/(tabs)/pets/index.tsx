import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Searchbar,
  FAB,
  SegmentedButtons,
  Text,
  ActivityIndicator,
  Menu,
  Button,
} from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { fetchPets } from '@/lib/supabase/pets';
import PetCard from '@/components/PetCard';
import type { Pet, PetStatus, Species } from '@/types';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'intake', label: 'Intake' },
  { value: 'vet_check', label: 'Vet' },
  { value: 'available', label: 'Available' },
  { value: 'foster', label: 'Foster' },
  { value: 'adopted', label: 'Adopted' },
];

export default function PetsListScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [speciesMenuVisible, setSpeciesMenuVisible] = useState(false);
  const [speciesFilter, setSpeciesFilter] = useState<Species | 'all'>('all');

  const load = useCallback(async () => {
    try {
      const data = await fetchPets();
      setPets(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const filtered = pets.filter((p) => {
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' || p.current_status === statusFilter;
    const matchSpecies =
      speciesFilter === 'all' || p.species === speciesFilter;
    return matchSearch && matchStatus && matchSpecies;
  });

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <Searchbar
          placeholder="Search by name..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          elevation={0}
        />
        <Menu
          visible={speciesMenuVisible}
          onDismiss={() => setSpeciesMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              compact
              onPress={() => setSpeciesMenuVisible(true)}
              style={styles.speciesBtn}
            >
              {speciesFilter === 'all' ? 'Species' : speciesFilter}
            </Button>
          }
        >
          <Menu.Item onPress={() => { setSpeciesFilter('all'); setSpeciesMenuVisible(false); }} title="All" />
          <Menu.Item onPress={() => { setSpeciesFilter('dog'); setSpeciesMenuVisible(false); }} title="Dog" />
          <Menu.Item onPress={() => { setSpeciesFilter('cat'); setSpeciesMenuVisible(false); }} title="Cat" />
          <Menu.Item onPress={() => { setSpeciesFilter('other'); setSpeciesMenuVisible(false); }} title="Other" />
        </Menu>
      </View>

      <SegmentedButtons
        value={statusFilter}
        onValueChange={setStatusFilter}
        buttons={STATUS_OPTIONS}
        style={styles.segmented}
        density="small"
      />

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#2d6a4f" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PetCard pet={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No pets found.</Text>
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(tabs)/pets/new')}
        label="New Intake"
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
    backgroundColor: '#fff',
  },
  searchbar: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    height: 44,
  },
  searchInput: {
    fontSize: 14,
  },
  speciesBtn: {
    borderColor: '#ced4da',
  },
  segmented: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  list: {
    paddingBottom: 100,
    paddingTop: 4,
  },
  loader: { marginTop: 48 },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 48,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: '#2d6a4f',
  },
});
