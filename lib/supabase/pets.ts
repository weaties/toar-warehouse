import { supabase } from './client';
import type { Pet, PetFormData, PetStatus } from '@/types';

export async function fetchPets(): Promise<Pet[]> {
  const { data, error } = await supabase
    .from('pets')
    .select('*, owner:owners(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Pet[]) ?? [];
}

export async function fetchPet(id: string): Promise<Pet | null> {
  const { data, error } = await supabase
    .from('pets')
    .select('*, owner:owners(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Pet | null;
}

export async function fetchPetsByOwner(ownerId: string): Promise<Pet[]> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Pet[]) ?? [];
}

function buildPetPayload(formData: Partial<PetFormData>) {
  return {
    owner_id: formData.owner_id ?? null,
    name: formData.name ?? '',
    species: formData.species ?? 'other',
    species_other: formData.species_other || null,
    breed: formData.breed || null,
    age_years:
      formData.age_years && formData.age_years !== ''
        ? parseInt(formData.age_years, 10)
        : null,
    age_months:
      formData.age_months && formData.age_months !== ''
        ? parseInt(formData.age_months, 10)
        : null,
    sex: formData.sex || null,
    colour_markings: formData.colour_markings || null,
    weight_lbs:
      formData.weight_lbs && formData.weight_lbs !== ''
        ? parseFloat(formData.weight_lbs)
        : null,
    microchip_number: formData.microchip_number || null,
    spayed_neutered:
      formData.spayed_neutered === 'yes'
        ? true
        : formData.spayed_neutered === 'no'
          ? false
          : null,
    intake_type: formData.intake_type || null,
    current_status: formData.current_status ?? 'intake',
    medical_notes: formData.medical_notes || null,
    behavioural_notes: formData.behavioural_notes || null,
    photo_urls: formData.photo_urls ?? [],
  };
}

export async function createPet(formData: Partial<PetFormData>): Promise<Pet> {
  const { data, error } = await supabase
    .from('pets')
    .insert(buildPetPayload(formData))
    .select('*, owner:owners(*)')
    .single();

  if (error) throw error;
  return data as Pet;
}

export async function updatePet(
  id: string,
  formData: Partial<PetFormData>,
): Promise<Pet> {
  const { data, error } = await supabase
    .from('pets')
    .update({ ...buildPetPayload(formData), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, owner:owners(*)')
    .single();

  if (error) throw error;
  return data as Pet;
}

export async function updatePetStatus(
  id: string,
  status: PetStatus,
): Promise<void> {
  const { error } = await supabase
    .from('pets')
    .update({ current_status: status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function updatePetPhotos(
  id: string,
  photoUrls: string[],
): Promise<void> {
  const { error } = await supabase
    .from('pets')
    .update({ photo_urls: photoUrls, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deletePet(id: string): Promise<void> {
  const { error } = await supabase.from('pets').delete().eq('id', id);
  if (error) throw error;
}
