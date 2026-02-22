import { supabase } from './client';
import type { Vaccination, VaccinationFormData } from '@/types';

export async function fetchVaccinations(petId: string): Promise<Vaccination[]> {
  const { data, error } = await supabase
    .from('vaccinations')
    .select('*')
    .eq('pet_id', petId)
    .order('date_given', { ascending: true });

  if (error) throw error;
  return (data as Vaccination[]) ?? [];
}

export async function upsertVaccinations(
  petId: string,
  vaccinations: VaccinationFormData[],
): Promise<void> {
  // Delete existing and re-insert for simplicity
  const { error: deleteError } = await supabase
    .from('vaccinations')
    .delete()
    .eq('pet_id', petId);

  if (deleteError) throw deleteError;

  if (vaccinations.length === 0) return;

  const rows = vaccinations.map((v) => ({
    pet_id: petId,
    type: v.type,
    date_given: v.date_given || null,
    notes: v.notes || null,
  }));

  const { error } = await supabase.from('vaccinations').insert(rows);
  if (error) throw error;
}
