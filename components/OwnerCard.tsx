import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import type { Owner, ContactType } from '@/types';

interface Props {
  owner: Owner;
}

const TYPE_LABELS: Record<ContactType, string> = {
  adopter: 'Adopter',
  foster: 'Foster',
  donor: 'Donor',
};

export default function OwnerCard({ owner }: Props) {
  const displayName = owner.full_name || '(No name)';
  const contact = [owner.phone_primary, owner.email].filter(Boolean).join(' · ');

  return (
    <Card
      style={styles.card}
      onPress={() => router.push(`/(tabs)/owners/${owner.id}`)}
    >
      <Card.Content>
        <Text variant="titleMedium" style={styles.name}>
          {displayName}
        </Text>
        {contact ? (
          <Text variant="bodySmall" style={styles.contact}>
            {contact}
          </Text>
        ) : null}
        {owner.contact_type && owner.contact_type.length > 0 ? (
          <View style={styles.chips}>
            {owner.contact_type.map((t) => (
              <Chip key={t} style={styles.chip} textStyle={styles.chipText} compact>
                {TYPE_LABELS[t] ?? t}
              </Chip>
            ))}
          </View>
        ) : null}
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
  name: {
    fontWeight: '700',
    color: '#1b4332',
  },
  contact: {
    color: '#555',
    marginTop: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  chip: {
    backgroundColor: '#d8f3dc',
  },
  chipText: {
    fontSize: 11,
    color: '#1b4332',
  },
});
