import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { fetchOwner, updateOwner } from '@/lib/supabase/owners';
import OwnerForm from '@/components/OwnerForm';
import type { OwnerFormValues } from '@/components/OwnerForm';
import type { Owner } from '@/types';

export default function EditOwnerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchOwner(id)
      .then(setOwner)
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    );
  }

  if (!owner) return null;

  const initialValues: OwnerFormValues = {
    full_name: owner.full_name ?? '',
    phone_primary: owner.phone_primary ?? '',
    email: owner.email ?? '',
    phone_secondary: owner.phone_secondary ?? '',
    street_address: owner.street_address ?? '',
    city: owner.city ?? '',
    province: owner.province ?? 'BC',
    postal_code: owner.postal_code ?? '',
    contact_type: owner.contact_type ?? [],
    notes: owner.notes ?? '',
  };

  async function handleSubmit(data: OwnerFormValues) {
    if (!id) return;
    await updateOwner(id, data);
    router.back();
  }

  return (
    <OwnerForm
      initialValues={initialValues}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
      draftKey={`owner_edit_${id}`}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
