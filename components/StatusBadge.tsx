import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import type { PetStatus } from '@/types';

const STATUS_COLORS: Record<PetStatus, string> = {
  intake: '#e9c46a',
  vet_check: '#f4a261',
  available: '#52b788',
  foster: '#74c69d',
  adopted: '#40916c',
  deceased: '#adb5bd',
};

export const STATUS_LABELS: Record<PetStatus, string> = {
  intake: 'Intake',
  vet_check: 'Vet Check',
  available: 'Available',
  foster: 'Foster',
  adopted: 'Adopted',
  deceased: 'Deceased',
};

interface Props {
  status: PetStatus;
  size?: 'small' | 'large';
}

export default function StatusBadge({ status, size = 'small' }: Props) {
  return (
    <Chip
      style={[styles.chip, { backgroundColor: STATUS_COLORS[status] }]}
      textStyle={[styles.text, size === 'large' && styles.textLarge]}
    >
      {STATUS_LABELS[status]}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  textLarge: {
    fontSize: 15,
  },
});
