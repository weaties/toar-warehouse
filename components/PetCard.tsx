import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import type { Pet, PetStatus } from '@/types';

interface Props {
  pet: Pet;
}

const STATUS_COLORS: Record<PetStatus, string> = {
  intake: '#e9c46a',
  vet_check: '#f4a261',
  available: '#52b788',
  foster: '#74c69d',
  adopted: '#40916c',
  deceased: '#adb5bd',
};

const STATUS_LABELS: Record<PetStatus, string> = {
  intake: 'Intake',
  vet_check: 'Vet Check',
  available: 'Available',
  foster: 'Foster',
  adopted: 'Adopted',
  deceased: 'Deceased',
};

export default function PetCard({ pet }: Props) {
  return (
    <Card
      style={styles.card}
      onPress={() => router.push(`/(tabs)/pets/${pet.id}`)}
    >
      <Card.Content style={styles.content}>
        <View style={styles.left}>
          <Text variant="titleMedium" style={styles.name}>
            {pet.name}
          </Text>
          <Text variant="bodySmall" style={styles.species}>
            {pet.species === 'other' && pet.species_other
              ? pet.species_other
              : pet.species}{' '}
            {pet.breed ? `· ${pet.breed}` : ''}
          </Text>
          {pet.owner?.full_name ? (
            <Text variant="bodySmall" style={styles.owner}>
              Owner: {pet.owner.full_name}
            </Text>
          ) : null}
        </View>
        <Chip
          style={[
            styles.chip,
            { backgroundColor: STATUS_COLORS[pet.current_status] },
          ]}
          textStyle={styles.chipText}
        >
          {STATUS_LABELS[pet.current_status]}
        </Chip>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#fff',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontWeight: '700',
    color: '#1b4332',
  },
  species: {
    color: '#555',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  owner: {
    color: '#777',
    marginTop: 2,
  },
  chip: {
    alignSelf: 'center',
  },
  chipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
});
