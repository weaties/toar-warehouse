import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Divider,
  ActivityIndicator,
  Menu,
  Chip,
  Card,
} from 'react-native-paper';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { fetchPet } from '@/lib/supabase/pets';
import { fetchVaccinations } from '@/lib/supabase/vaccinations';
import { fetchStatusLog, logStatusChange } from '@/lib/supabase/statusLog';
import { updatePetStatus } from '@/lib/supabase/pets';
import PhotoStrip from '@/components/PhotoStrip';
import StatusBadge, { STATUS_LABELS } from '@/components/StatusBadge';
import type { Pet, Vaccination, StatusLog, PetStatus } from '@/types';

const ALL_STATUSES: PetStatus[] = [
  'intake',
  'vet_check',
  'available',
  'foster',
  'adopted',
  'deceased',
];

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [statusLog, setStatusLog] = useState<StatusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [petData, vaxxData, logData] = await Promise.all([
        fetchPet(id),
        fetchVaccinations(id),
        fetchStatusLog(id),
      ]);
      setPet(petData);
      setVaccinations(vaxxData);
      setStatusLog(logData);
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

  async function handleStatusChange(newStatus: PetStatus) {
    if (!pet || !id) return;
    setStatusMenuVisible(false);
    setChangingStatus(true);
    try {
      await updatePetStatus(id, newStatus);
      await logStatusChange(id, newStatus);
      await load();
    } catch (e) {
      Alert.alert('Error', 'Could not update status. Please try again.');
    } finally {
      setChangingStatus(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={styles.center}>
        <Text>Pet not found.</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  const ageStr = [
    pet.age_years ? `${pet.age_years}y` : null,
    pet.age_months ? `${pet.age_months}m` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View>
          <Text variant="headlineSmall" style={styles.petName}>
            {pet.name}
          </Text>
          <Text variant="bodyMedium" style={styles.species}>
            {pet.species === 'other' && pet.species_other
              ? pet.species_other
              : pet.species}
            {pet.breed ? ` · ${pet.breed}` : ''}
          </Text>
        </View>
        <StatusBadge status={pet.current_status} size="large" />
      </View>

      {/* Photos */}
      {pet.photo_urls && pet.photo_urls.length > 0 && (
        <PhotoStrip photoUrls={pet.photo_urls} />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          icon="pencil"
          onPress={() => router.push(`/(tabs)/pets/${id}/edit`)}
          style={styles.actionBtn}
        >
          Edit
        </Button>
        <Menu
          visible={statusMenuVisible}
          onDismiss={() => setStatusMenuVisible(false)}
          anchor={
            <Button
              mode="contained"
              icon="swap-horizontal"
              onPress={() => setStatusMenuVisible(true)}
              loading={changingStatus}
              style={styles.actionBtn}
            >
              Change Status
            </Button>
          }
        >
          {ALL_STATUSES.filter((s) => s !== pet.current_status).map((s) => (
            <Menu.Item
              key={s}
              onPress={() => handleStatusChange(s)}
              title={STATUS_LABELS[s]}
            />
          ))}
        </Menu>
      </View>

      <Divider style={styles.divider} />

      {/* Details */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Details
        </Text>
        <InfoRow label="Sex" value={pet.sex ?? '—'} />
        <InfoRow label="Age" value={ageStr || '—'} />
        <InfoRow
          label="Weight"
          value={pet.weight_lbs ? `${pet.weight_lbs} lbs` : '—'}
        />
        <InfoRow
          label="Colour / Markings"
          value={pet.colour_markings ?? '—'}
        />
        <InfoRow
          label="Microchip"
          value={pet.microchip_number ?? '—'}
        />
        <InfoRow
          label="Spayed / Neutered"
          value={
            pet.spayed_neutered === true
              ? 'Yes'
              : pet.spayed_neutered === false
                ? 'No'
                : 'Unknown'
          }
        />
        <InfoRow
          label="Intake Type"
          value={pet.intake_type ?? '—'}
        />
        <InfoRow
          label="Intake Date"
          value={format(new Date(pet.created_at), 'MMM d, yyyy')}
        />
      </View>

      <Divider style={styles.divider} />

      {/* Owner */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Owner
        </Text>
        {pet.owner ? (
          <Button
            mode="outlined"
            onPress={() => router.push(`/(tabs)/owners/${pet.owner!.id}`)}
            style={styles.ownerBtn}
          >
            {pet.owner.full_name ?? 'View Owner'}
          </Button>
        ) : (
          <Text style={styles.noData}>No owner on record</Text>
        )}
      </View>

      <Divider style={styles.divider} />

      {/* Vaccinations */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Vaccinations
        </Text>
        {vaccinations.length === 0 ? (
          <Text style={styles.noData}>None recorded</Text>
        ) : (
          vaccinations.map((v) => (
            <View key={v.id} style={styles.vaxxRow}>
              <Chip compact style={styles.vaxxChip}>
                {v.type}
              </Chip>
              {v.date_given ? (
                <Text variant="bodySmall" style={styles.vaxxDate}>
                  {format(new Date(v.date_given), 'MMM d, yyyy')}
                </Text>
              ) : null}
              {v.notes ? (
                <Text variant="bodySmall" style={styles.vaxxNotes}>
                  {v.notes}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>

      <Divider style={styles.divider} />

      {/* Medical / Behavioural Notes */}
      {pet.medical_notes ? (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Medical Notes
          </Text>
          <Text variant="bodyMedium" style={styles.notes}>
            {pet.medical_notes}
          </Text>
        </View>
      ) : null}

      {pet.behavioural_notes ? (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Behavioural Notes
          </Text>
          <Text variant="bodyMedium" style={styles.notes}>
            {pet.behavioural_notes}
          </Text>
        </View>
      ) : null}

      <Divider style={styles.divider} />

      {/* Status History */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Status History
        </Text>
        {statusLog.length === 0 ? (
          <Text style={styles.noData}>No history yet</Text>
        ) : (
          statusLog.map((entry, i) => (
            <View key={entry.id} style={styles.logEntry}>
              <View style={styles.logDot} />
              <View style={styles.logContent}>
                <Text variant="bodyMedium" style={styles.logStatus}>
                  {STATUS_LABELS[entry.status]}
                </Text>
                <Text variant="bodySmall" style={styles.logDate}>
                  {format(new Date(entry.changed_at), 'MMM d, yyyy h:mm a')}
                </Text>
                {entry.notes ? (
                  <Text variant="bodySmall" style={styles.logNotes}>
                    {entry.notes}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
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
  value: { color: '#212529', flex: 2, textAlign: 'right', textTransform: 'capitalize' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  petName: { fontWeight: '800', color: '#1b4332' },
  species: { color: '#555', textTransform: 'capitalize', marginTop: 2 },
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
  sectionTitle: {
    fontWeight: '700',
    color: '#1b4332',
    marginBottom: 8,
  },
  ownerBtn: { alignSelf: 'flex-start' },
  noData: { color: '#aaa', fontStyle: 'italic' },
  vaxxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  vaxxChip: { backgroundColor: '#d8f3dc' },
  vaxxDate: { color: '#555' },
  vaxxNotes: { color: '#888', flex: 1 },
  notes: { color: '#333', lineHeight: 22 },
  logEntry: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  logDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2d6a4f',
    marginTop: 5,
  },
  logContent: { flex: 1 },
  logStatus: { fontWeight: '600', color: '#1b4332' },
  logDate: { color: '#888', marginTop: 2 },
  logNotes: { color: '#555', marginTop: 2, fontStyle: 'italic' },
});
