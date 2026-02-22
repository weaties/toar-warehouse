export type ContactType = 'adopter' | 'foster' | 'donor';

export type Species = 'dog' | 'cat' | 'other';

export type Sex = 'male' | 'female' | 'unknown';

export type IntakeType = 'surrender' | 'stray' | 'found' | 'transfer';

export type PetStatus =
  | 'intake'
  | 'vet_check'
  | 'available'
  | 'foster'
  | 'adopted'
  | 'deceased';

export type VaccinationType = 'rabies' | 'distemper' | 'bordetella' | 'other';

export interface Owner {
  id: string;
  full_name: string | null;
  phone_primary: string | null;
  email: string | null;
  phone_secondary: string | null;
  street_address: string | null;
  city: string | null;
  province: string;
  postal_code: string | null;
  contact_type: ContactType[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  owner_id: string | null;
  name: string;
  species: Species;
  species_other: string | null;
  breed: string | null;
  age_years: number | null;
  age_months: number | null;
  sex: Sex | null;
  colour_markings: string | null;
  weight_lbs: number | null;
  microchip_number: string | null;
  spayed_neutered: boolean | null;
  intake_type: IntakeType | null;
  current_status: PetStatus;
  medical_notes: string | null;
  behavioural_notes: string | null;
  photo_urls: string[];
  created_at: string;
  updated_at: string;
  // joined
  owner?: Owner | null;
}

export interface Vaccination {
  id: string;
  pet_id: string;
  type: VaccinationType;
  date_given: string | null;
  notes: string | null;
}

export interface StatusLog {
  id: string;
  pet_id: string;
  status: PetStatus;
  changed_at: string;
  changed_by: string | null;
  notes: string | null;
}

// Form types

export interface OwnerFormData {
  full_name: string;
  phone_primary: string;
  email: string;
  phone_secondary: string;
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
  contact_type: ContactType[];
  notes: string;
}

export interface VaccinationFormData {
  type: VaccinationType;
  date_given: string;
  notes: string;
}

export interface PetFormData {
  owner_id: string | null;
  name: string;
  species: Species;
  species_other: string;
  breed: string;
  age_years: string;
  age_months: string;
  sex: Sex | '';
  colour_markings: string;
  weight_lbs: string;
  microchip_number: string;
  spayed_neutered: 'yes' | 'no' | 'unknown' | '';
  intake_type: IntakeType | '';
  current_status: PetStatus;
  medical_notes: string;
  behavioural_notes: string;
  vaccinations: VaccinationFormData[];
  photo_urls: string[];
}

// Offline sync types

export type SyncOperation = 'insert' | 'update' | 'delete';

export type SyncTable = 'owners' | 'pets' | 'vaccinations' | 'status_log';

export interface SyncQueueItem {
  id: string;
  table: SyncTable;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  created_at: string;
  retries: number;
}

export type SyncStatus = 'synced' | 'pending' | 'error';

// Paper form scan result

export interface ScannedFormData {
  owner: Partial<OwnerFormData> | null;
  pet: Partial<PetFormData> | null;
}

// CSV export

export interface ContactExportRow {
  name: string;
  email: string;
  phone: string;
  address: string;
  contact_type: string;
}

export interface PetExportRow {
  name: string;
  species: string;
  breed: string;
  status: string;
  owner_name: string;
  intake_type: string;
  intake_date: string;
}
