import { supabase } from './client';
import type { Owner, OwnerFormData } from '@/types';

export async function fetchOwners(): Promise<Owner[]> {
  const { data, error } = await supabase
    .from('owners')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Owner[]) ?? [];
}

export async function fetchOwner(id: string): Promise<Owner | null> {
  const { data, error } = await supabase
    .from('owners')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Owner | null;
}

export async function createOwner(
  formData: Partial<OwnerFormData>,
): Promise<Owner> {
  const payload = {
    full_name: formData.full_name || null,
    phone_primary: formData.phone_primary || null,
    email: formData.email || null,
    phone_secondary: formData.phone_secondary || null,
    street_address: formData.street_address || null,
    city: formData.city || null,
    province: formData.province || 'BC',
    postal_code: formData.postal_code || null,
    contact_type: formData.contact_type ?? [],
    notes: formData.notes || null,
  };

  const { data, error } = await supabase
    .from('owners')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as Owner;
}

export async function updateOwner(
  id: string,
  formData: Partial<OwnerFormData>,
): Promise<Owner> {
  const payload = {
    full_name: formData.full_name || null,
    phone_primary: formData.phone_primary || null,
    email: formData.email || null,
    phone_secondary: formData.phone_secondary || null,
    street_address: formData.street_address || null,
    city: formData.city || null,
    province: formData.province || 'BC',
    postal_code: formData.postal_code || null,
    contact_type: formData.contact_type ?? [],
    notes: formData.notes || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('owners')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Owner;
}

export async function deleteOwner(id: string): Promise<void> {
  const { error } = await supabase.from('owners').delete().eq('id', id);
  if (error) throw error;
}

export async function searchOwners(query: string): Promise<Owner[]> {
  const { data, error } = await supabase
    .from('owners')
    .select('*')
    .ilike('full_name', `%${query}%`)
    .order('full_name');

  if (error) throw error;
  return (data as Owner[]) ?? [];
}
