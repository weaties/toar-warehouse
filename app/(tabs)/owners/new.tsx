import React from 'react';
import { router } from 'expo-router';
import { createOwner } from '@/lib/supabase/owners';
import OwnerForm from '@/components/OwnerForm';
import type { OwnerFormValues } from '@/components/OwnerForm';

export default function NewOwnerScreen() {
  async function handleSubmit(data: OwnerFormValues) {
    const owner = await createOwner(data);
    router.replace(`/(tabs)/owners/${owner.id}`);
  }

  return <OwnerForm onSubmit={handleSubmit} submitLabel="Add Person" />;
}
