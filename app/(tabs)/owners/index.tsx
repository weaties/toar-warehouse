import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Searchbar, FAB, Text, ActivityIndicator, Chip } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { fetchOwners } from '@/lib/supabase/owners';
import OwnerCard from '@/components/OwnerCard';
import type { Owner, ContactType } from '@/types';

const CONTACT_FILTERS: { value: ContactType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'adopter', label: 'Adopters' },
  { value: 'foster', label: 'Fosters' },
  { value: 'donor', label: 'Donors' },
];

export default function OwnersListScreen() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContactType | 'all'>('all');

  const load = useCallback(async () => {
    try {
      const data = await fetchOwners();
      setOwners(data);
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

  const filtered = owners.filter((o) => {
    const matchSearch =
      !search ||
      (o.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (o.email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchType =
      typeFilter === 'all' ||
      (o.contact_type ?? []).includes(typeFilter);
    return matchSearch && matchType;
  });

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search by name or email..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
        elevation={0}
      />

      <View style={styles.filterRow}>
        {CONTACT_FILTERS.map((f) => (
          <Chip
            key={f.value}
            selected={typeFilter === f.value}
            onPress={() => setTypeFilter(f.value)}
            style={styles.filterChip}
            compact
          >
            {f.label}
          </Chip>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#2d6a4f" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OwnerCard owner={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No people found.</Text>
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(tabs)/owners/new')}
        label="Add Person"
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  searchbar: {
    margin: 16,
    backgroundColor: '#fff',
    elevation: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  filterChip: {},
  list: { paddingBottom: 100, paddingTop: 4 },
  loader: { marginTop: 48 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 48 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: '#2d6a4f',
  },
});
