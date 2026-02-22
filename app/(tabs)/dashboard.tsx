import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { fetchPets } from '@/lib/supabase/pets';
import { useAuth } from '@/hooks/useAuth';
import PetCard from '@/components/PetCard';
import PawIcon from '@/components/PawIcon';
import type { Pet, PetStatus } from '@/types';

const STATUS_LABELS: Record<PetStatus, string> = {
  intake: 'Intake',
  vet_check: 'Vet Check',
  available: 'Available',
  foster: 'Foster',
  adopted: 'Adopted',
  deceased: 'Deceased',
};

const STATUS_COLORS: Record<PetStatus, string> = {
  intake: '#e9c46a',
  vet_check: '#f4a261',
  available: '#52b788',
  foster: '#74c69d',
  adopted: '#40916c',
  deceased: '#adb5bd',
};

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchPets();
      setPets(data);
    } catch (e) {
      console.warn('Failed to load pets', e);
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

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const statusCounts = (Object.keys(STATUS_LABELS) as PetStatus[]).reduce(
    (acc, s) => {
      acc[s] = pets.filter((p) => p.current_status === s).length;
      return acc;
    },
    {} as Record<PetStatus, number>,
  );

  const recentPets = pets.slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <PawIcon size={32} color="#fff" />
          <View style={styles.headerText}>
            <Text variant="headlineSmall" style={styles.appName}>
              OAR Rescue
            </Text>
            <Text variant="bodySmall" style={styles.userEmail}>
              {user?.email}
            </Text>
          </View>
        </View>
        <Button
          mode="text"
          onPress={signOut}
          textColor="#b7e4c7"
          compact
        >
          Sign Out
        </Button>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#2d6a4f" />
      ) : (
        <>
          {/* Status summary */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Current Animals
            </Text>
            <View style={styles.statsGrid}>
              {(Object.keys(STATUS_LABELS) as PetStatus[]).map((s) => (
                <View
                  key={s}
                  style={[
                    styles.statCard,
                    { borderTopColor: STATUS_COLORS[s] },
                  ]}
                >
                  <Text variant="headlineMedium" style={styles.statNumber}>
                    {statusCounts[s]}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    {STATUS_LABELS[s]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Quick actions */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Quick Actions
            </Text>
            <View style={styles.actions}>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => router.push('/(tabs)/pets/new')}
                style={styles.actionBtn}
              >
                New Intake
              </Button>
              <Button
                mode="outlined"
                icon="account-plus"
                onPress={() => router.push('/(tabs)/owners/new')}
                style={styles.actionBtn}
              >
                New Person
              </Button>
            </View>
          </View>

          {/* Recent pets */}
          {recentPets.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Recent Intakes
                </Text>
                <Button
                  compact
                  onPress={() => router.push('/(tabs)/pets')}
                >
                  See All
                </Button>
              </View>
              {recentPets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </View>
          )}

          {pets.length === 0 && (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <PawIcon size={48} color="#adb5bd" />
                <Text variant="bodyLarge" style={styles.emptyText}>
                  No animals yet.
                </Text>
                <Text variant="bodySmall" style={styles.emptySubtext}>
                  Tap "New Intake" to add your first animal.
                </Text>
              </Card.Content>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2d6a4f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {},
  appName: {
    color: '#fff',
    fontWeight: '800',
  },
  userEmail: {
    color: '#b7e4c7',
  },
  loader: {
    marginTop: 60,
  },
  section: {
    marginTop: 20,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#1b4332',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
    borderTopWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statNumber: {
    fontWeight: '800',
    color: '#1b4332',
  },
  statLabel: {
    color: '#555',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
  emptyCard: {
    margin: 24,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 12,
    color: '#555',
  },
  emptySubtext: {
    marginTop: 4,
    color: '#aaa',
    textAlign: 'center',
  },
});
