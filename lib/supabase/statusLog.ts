import { supabase } from './client';
import type { StatusLog, PetStatus } from '@/types';

export async function fetchStatusLog(petId: string): Promise<StatusLog[]> {
  const { data, error } = await supabase
    .from('status_log')
    .select('*')
    .eq('pet_id', petId)
    .order('changed_at', { ascending: false });

  if (error) throw error;
  return (data as StatusLog[]) ?? [];
}

export async function logStatusChange(
  petId: string,
  status: PetStatus,
  notes?: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('status_log').insert({
    pet_id: petId,
    status,
    changed_by: user?.id ?? null,
    notes: notes || null,
  });

  if (error) throw error;
}
