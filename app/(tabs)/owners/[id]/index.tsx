import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Button,
  Divider,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { fetchOwner, deleteOwner } from '@/lib/supabase/owners';
import { fetchPetsByOwner } from '@/lib/supabase/pets';
import PetCard from '@/components/PetCard';
import type { Owner, Pet, ContactType } from '@/types';

const TYPE_LABELS: Record<ContactType, string> = {
  adopter: 'Adopter',
  foster: 'Foster',
  donor: 'Donor',
};

export default function OwnerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [ownerData, petsData] = await Promise.all([
        fetchOwner(id),
        fetchPetsByOwner(id),
      ]);
      setOwner(ownerData);
      setPets(petsData);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  async function handleDelete() {
    Alert.alert(
      'Delete Person',
      'This will remove the person record. Their animals will remain. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOwner(id!);
              router.back();
            } catch (e) {
              Alert.alert('Error', 'Could not delete person.');
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    );
  }

  if (!owner) {
    return (
      <View style={styles.center}>
        <Text>Person not found.</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  const address = [
    owner.street_address,
    owner.city,
    owner.province,
    owner.postal_code,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.name}>
          {owner.full_name ?? '(No name)'}
        </Text>
        {owner.contact_type && owner.contact_type.length > 0 && (
          <View style={styles.chips}>
            {owner.contact_type.map((t) => (
              <Chip key={t} style={styles.chip} compact>
                {TYPE_LABELS[t] ?? t}
              </Chip>
            ))}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          mode="outlined"
          icon="pencil"
          onPress={() => router.push(`/(tabs)/owners/${id}/edit`)}
          style={styles.actionBtn}
        >
          Edit
        </Button>
        <Button
          mode="outlined"
          icon="delete"
          onPress={handleDelete}
          style={styles.actionBtn}
          textColor="#e63946"
        >
          Delete
        </Button>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Contact Info
        </Text>
        <InfoRow label="Primary Phone" value={owner.phone_primary ?? '—'} />
        <InfoRow label="Email" value={owner.email ?? '—'} />
        <InfoRow
          label="Secondary Phone"
          value={owner.phone_secondary ?? '—'}
        />
        <InfoRow label="Address" value={address || '—'} />
      </View>

      {owner.notes ? (
        <>
          <Divider style={styles.divider} />
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Notes
            </Text>
            <Text variant="bodyMedium" style={styles.notes}>
              {owner.notes}
            </Text>
          </View>
        </>
      ) : null}

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Animals ({pets.length})
          </Text>
          <Button
            compact
            mode="text"
            icon="plus"
            onPress={() => router.push('/(tabs)/pets/new')}
          >
            New Intake
          </Button>
        </View>
        {pets.length === 0 ? (
          <Text style={styles.noData}>No animals on record</Text>
        ) : (
          pets.map((p) => <PetCard key={p.id} pet={p} />)
        )}
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text variant="bodySmall" style={infoStyles.label}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={infoStyles.value}>
        {value}
      </Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e9ecef',
  },
  label: { color: '#888', flex: 1 },
  value: { color: '#212529', flex: 2, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    gap: 8,
  },
  name: { fontWeight: '800', color: '#1b4332' },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { backgroundColor: '#d8f3dc' },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  actionBtn: { flex: 1 },
  divider: { marginVertical: 0 },
  section: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: { fontWeight: '700', color: '#1b4332', marginBottom: 8 },
  noData: { color: '#aaa', fontStyle: 'italic' },
  notes: { color: '#333', lineHeight: 22 },
});
