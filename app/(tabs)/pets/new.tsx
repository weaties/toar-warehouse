import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { router, useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { createPet } from '@/lib/supabase/pets';
import { upsertVaccinations } from '@/lib/supabase/vaccinations';
import { logStatusChange } from '@/lib/supabase/statusLog';
import { uploadPhoto } from '@/lib/supabase/storage';
import { supabase } from '@/lib/supabase/client';
import PetForm from '@/components/PetForm';
import type { PetFormValues } from '@/components/PetForm';
import type { ScannedFormData } from '@/types';

export default function NewPetScreen() {
  const navigation = useNavigation();
  const [scannedData, setScannedData] = useState<ScannedFormData | null>(null);
  const [scannedFields, setScannedFields] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<PetFormValues> | undefined>(undefined);

  async function handleScanForm() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (result.canceled) return;

    const imageUri = result.assets[0].uri;
    setIsScanning(true);

    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { data, error } = await supabase.functions.invoke('scan-form', {
        body: { image_base64: base64 },
      });

      if (error || !data?.success) {
        Alert.alert(
          'Scan failed',
          'Could not read the form. Please fill in the details manually.',
        );
        return;
      }

      const parsed = data.data as ScannedFormData;
      setScannedData(parsed);

      // Build pre-filled values and track which fields were populated
      const fields = new Set<string>();
      const values: Partial<PetFormValues> = {};

      if (parsed.pet) {
        const p = parsed.pet;
        if (p.name) { values.name = String(p.name); fields.add('name'); }
        if (p.species) { values.species = p.species as PetFormValues['species']; fields.add('species'); }
        if (p.breed) { values.breed = String(p.breed); fields.add('breed'); }
        if (p.age_years != null) { values.age_years = String(p.age_years); fields.add('age_years'); }
        if (p.age_months != null) { values.age_months = String(p.age_months); fields.add('age_months'); }
        if (p.sex) { values.sex = p.sex as PetFormValues['sex']; fields.add('sex'); }
        if (p.weight_lbs != null) { values.weight_lbs = String(p.weight_lbs); fields.add('weight_lbs'); }
        if (p.colour_markings) { values.colour_markings = String(p.colour_markings); fields.add('colour_markings'); }
        if (p.microchip_number) { values.microchip_number = String(p.microchip_number); fields.add('microchip_number'); }
        if (p.spayed_neutered != null) {
          const sn: unknown = p.spayed_neutered;
          values.spayed_neutered = sn === true || sn === 'true' || sn === 'yes'
            ? 'yes'
            : sn === false || sn === 'false' || sn === 'no'
              ? 'no'
              : 'unknown';
          fields.add('spayed_neutered');
        }
        if (p.intake_type) { values.intake_type = p.intake_type as PetFormValues['intake_type']; fields.add('intake_type'); }
        if (p.medical_notes) { values.medical_notes = String(p.medical_notes); fields.add('medical_notes'); }
        if (p.behavioural_notes) { values.behavioural_notes = String(p.behavioural_notes); fields.add('behavioural_notes'); }
      }

      setScannedFields(fields);
      setInitialValues(values);

      Alert.alert(
        'Form scanned',
        `${fields.size} field${fields.size !== 1 ? 's' : ''} pre-filled. Please review all highlighted fields before saving.`,
      );
    } catch (err) {
      console.warn('Scan error', err);
      Alert.alert('Scan failed', 'Please fill in the details manually.');
    } finally {
      setIsScanning(false);
    }
  }

  async function handleSubmit(formData: PetFormValues) {
    // Create the pet record
    const pet = await createPet(formData);

    // Upload any local photos
    if (formData.photo_urls && formData.photo_urls.length > 0) {
      const uploadedUrls: string[] = [];
      for (const uri of formData.photo_urls) {
        if (uri.startsWith('http')) {
          uploadedUrls.push(uri);
        } else {
          try {
            const url = await uploadPhoto(uri, pet.id);
            uploadedUrls.push(url);
          } catch {
            // Keep local URI as fallback; will be re-synced later
            uploadedUrls.push(uri);
          }
        }
      }
      if (uploadedUrls.length !== formData.photo_urls.length || uploadedUrls.some((u, i) => u !== formData.photo_urls[i])) {
        // Update with final URLs
        const { error } = await supabase
          .from('pets')
          .update({ photo_urls: uploadedUrls })
          .eq('id', pet.id);
        if (error) console.warn('Photo URL update error', error);
      }
    }

    // Save vaccinations
    if (formData.vaccinations && formData.vaccinations.length > 0) {
      await upsertVaccinations(pet.id, formData.vaccinations);
    }

    // Log initial status
    await logStatusChange(pet.id, pet.current_status);

    router.replace(`/(tabs)/pets/${pet.id}`);
  }

  return (
    <PetForm
      initialValues={initialValues}
      scannedFields={scannedFields}
      onSubmit={handleSubmit}
      onScanForm={handleScanForm}
      isScanning={isScanning}
      submitLabel="Save Record"
      draftKey="pet_new"
    />
  );
}
