import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { fetchPet, updatePet } from '@/lib/supabase/pets';
import { fetchVaccinations, upsertVaccinations } from '@/lib/supabase/vaccinations';
import { uploadPhoto } from '@/lib/supabase/storage';
import PetForm from '@/components/PetForm';
import type { PetFormValues } from '@/components/PetForm';
import type { Pet, Vaccination } from '@/types';

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchPet(id), fetchVaccinations(id)])
      .then(([petData, vaxxData]) => {
        setPet(petData);
        setVaccinations(vaxxData);
      })
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

  if (!pet) return null;

  const initialValues: PetFormValues = {
    owner_id: pet.owner_id ?? null,
    name: pet.name,
    species: pet.species,
    species_other: pet.species_other ?? '',
    breed: pet.breed ?? '',
    age_years: pet.age_years != null ? String(pet.age_years) : '',
    age_months: pet.age_months != null ? String(pet.age_months) : '',
    sex: pet.sex ?? '',
    colour_markings: pet.colour_markings ?? '',
    weight_lbs: pet.weight_lbs != null ? String(pet.weight_lbs) : '',
    microchip_number: pet.microchip_number ?? '',
    spayed_neutered:
      pet.spayed_neutered === true
        ? 'yes'
        : pet.spayed_neutered === false
          ? 'no'
          : '',
    intake_type: pet.intake_type ?? '',
    current_status: pet.current_status,
    medical_notes: pet.medical_notes ?? '',
    behavioural_notes: pet.behavioural_notes ?? '',
    vaccinations: vaccinations.map((v) => ({
      type: v.type,
      date_given: v.date_given ?? '',
      notes: v.notes ?? '',
    })),
    photo_urls: pet.photo_urls ?? [],
  };

  async function handleSubmit(formData: PetFormValues) {
    if (!id) return;

    // Upload any new local photos
    const uploadedUrls: string[] = [];
    for (const uri of formData.photo_urls ?? []) {
      if (uri.startsWith('http')) {
        uploadedUrls.push(uri);
      } else {
        try {
          const url = await uploadPhoto(uri, id);
          uploadedUrls.push(url);
        } catch {
          uploadedUrls.push(uri);
        }
      }
    }

    await updatePet(id, { ...formData, photo_urls: uploadedUrls });
    await upsertVaccinations(id, formData.vaccinations ?? []);
    router.back();
  }

  return (
    <PetForm
      initialValues={initialValues}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
      draftKey={`pet_edit_${id}`}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
