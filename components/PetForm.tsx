/**
 * Shared form component used by both new intake and edit pet screens.
 * Highlights pre-filled fields from AI scan with a light blue background.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Checkbox,
  Divider,
  Menu,
  HelperText,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Controller, useForm, useFieldArray, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { searchOwners } from '@/lib/supabase/owners';
import { saveDraft, loadDraft, clearDraft } from '@/lib/drafts';
import type { Owner, PetFormData, VaccinationFormData, ScannedFormData } from '@/types';

const vaxxSchema = z.object({
  type: z.enum(['rabies', 'distemper', 'bordetella', 'other']),
  date_given: z.string(),
  notes: z.string(),
});

const petSchema = z.object({
  owner_id: z.string().nullable(),
  name: z.string().min(1, 'Pet name is required'),
  species: z.enum(['dog', 'cat', 'other']),
  species_other: z.string(),
  breed: z.string(),
  age_years: z.string(),
  age_months: z.string(),
  sex: z.enum(['male', 'female', 'unknown', '']),
  colour_markings: z.string(),
  weight_lbs: z.string(),
  microchip_number: z.string(),
  spayed_neutered: z.enum(['yes', 'no', 'unknown', '']),
  intake_type: z.enum(['surrender', 'stray', 'found', 'transfer', '']),
  current_status: z.enum(['intake', 'vet_check', 'available', 'foster', 'adopted', 'deceased']),
  medical_notes: z.string(),
  behavioural_notes: z.string(),
  vaccinations: z.array(vaxxSchema),
  photo_urls: z.array(z.string()),
});

export type PetFormValues = z.infer<typeof petSchema>;

const DEFAULT_VALUES: PetFormValues = {
  owner_id: null,
  name: '',
  species: 'dog',
  species_other: '',
  breed: '',
  age_years: '',
  age_months: '',
  sex: '',
  colour_markings: '',
  weight_lbs: '',
  microchip_number: '',
  spayed_neutered: '',
  intake_type: '',
  current_status: 'intake',
  medical_notes: '',
  behavioural_notes: '',
  vaccinations: [],
  photo_urls: [],
};

interface Props {
  initialValues?: Partial<PetFormValues>;
  scannedFields?: Set<string>;
  onSubmit: (data: PetFormValues) => Promise<void>;
  onScanForm?: () => void;
  isScanning?: boolean;
  submitLabel?: string;
  /** AsyncStorage key for draft auto-save. When provided, the form persists in-progress data. */
  draftKey?: string;
}

export default function PetForm({
  initialValues,
  scannedFields,
  onSubmit,
  onScanForm,
  isScanning,
  submitLabel = 'Save',
  draftKey,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerResults, setOwnerResults] = useState<Owner[]>([]);
  const [ownerMenuVisible, setOwnerMenuVisible] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [reviewedSections, setReviewedSections] = useState<Set<string>>(new Set());
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasScannedData = scannedFields && scannedFields.size > 0;
  const requiredSections = hasScannedData
    ? ['owner', 'basic', 'details', 'health', 'notes']
    : [];
  const allReviewed =
    !hasScannedData ||
    requiredSections.every((s) => reviewedSections.has(s));

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PetFormValues>({
    resolver: zodResolver(petSchema),
    defaultValues: { ...DEFAULT_VALUES, ...initialValues },
  });

  // Draft auto-save: restore on mount, save on change
  useEffect(() => {
    if (!draftKey) return;
    loadDraft<PetFormValues>(draftKey).then((draft) => {
      if (!draft) return;
      Alert.alert(
        'Restore draft?',
        'You have an unsaved draft for this form. Would you like to restore it?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => clearDraft(draftKey) },
          {
            text: 'Restore',
            onPress: () => {
              reset({ ...DEFAULT_VALUES, ...draft });
            },
          },
        ],
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Watch all fields and debounce-save to AsyncStorage
  const allValues = watch();
  useEffect(() => {
    if (!draftKey) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      saveDraft(draftKey, allValues);
    }, 1500);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [draftKey, allValues]);

  const { fields: vaxxFields, append: appendVaxx, remove: removeVaxx } =
    useFieldArray({ control, name: 'vaccinations' });

  const species = watch('species');
  const photoUrls = watch('photo_urls');

  const doSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
      if (draftKey) await clearDraft(draftKey);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Save failed.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  });

  const searchForOwner = useCallback(async (q: string) => {
    setOwnerSearch(q);
    if (q.length < 2) {
      setOwnerResults([]);
      setOwnerMenuVisible(false);
      return;
    }
    const results = await searchOwners(q);
    setOwnerResults(results);
    setOwnerMenuVisible(results.length > 0);
  }, []);

  const pickPhoto = async (fromCamera: boolean) => {
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsMultipleSelection: true,
        });

    if (!result.canceled) {
      const newUrls = result.assets.map((a) => a.uri);
      const current = photoUrls ?? [];
      if (current.length + newUrls.length > 5) {
        Alert.alert('Limit reached', 'Maximum 5 photos per animal.');
        return;
      }
      setValue('photo_urls', [...current, ...newUrls]);
    }
  };

  const removePhoto = (uri: string) => {
    setValue(
      'photo_urls',
      (photoUrls ?? []).filter((u) => u !== uri),
    );
  };

  const scanned = (field: string) =>
    scannedFields?.has(field) ? styles.scannedInput : {};

  const markReviewed = (section: string) => {
    setReviewedSections((prev) => new Set([...prev, section]));
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Scan banner */}
      {onScanForm && (
        <View style={styles.scanSection}>
          <Button
            mode="contained-tonal"
            icon="camera-document"
            onPress={onScanForm}
            loading={isScanning}
            disabled={isScanning}
          >
            Scan Paper Form
          </Button>
          {hasScannedData && (
            <Text variant="bodySmall" style={styles.scanHint}>
              Fields highlighted in blue were pre-filled by AI. Please review each section.
            </Text>
          )}
        </View>
      )}

      {/* ── Owner ─────────────────────────────────────── */}
      <Section
        title="Owner (optional)"
        name="owner"
        hasScanned={hasScannedData}
        reviewed={reviewedSections.has('owner')}
        onReviewed={() => markReviewed('owner')}
      >
        <Menu
          visible={ownerMenuVisible}
          onDismiss={() => setOwnerMenuVisible(false)}
          anchor={
            <TextInput
              label={
                selectedOwner
                  ? `Owner: ${selectedOwner.full_name ?? 'Selected'}`
                  : 'Search existing owner...'
              }
              value={ownerSearch}
              onChangeText={searchForOwner}
              mode="outlined"
              style={[styles.input, scanned('owner_id')]}
              right={
                selectedOwner ? (
                  <TextInput.Icon
                    icon="close"
                    onPress={() => {
                      setSelectedOwner(null);
                      setValue('owner_id', null);
                      setOwnerSearch('');
                    }}
                  />
                ) : undefined
              }
            />
          }
        >
          {ownerResults.map((o) => (
            <Menu.Item
              key={o.id}
              title={o.full_name ?? '(No name)'}
              onPress={() => {
                setSelectedOwner(o);
                setValue('owner_id', o.id);
                setOwnerSearch(o.full_name ?? '');
                setOwnerMenuVisible(false);
              }}
            />
          ))}
        </Menu>
        <Button
          mode="text"
          compact
          onPress={() => {
            setValue('owner_id', null);
            setSelectedOwner(null);
          }}
        >
          Skip — no owner info
        </Button>
      </Section>

      {/* ── Basic info ────────────────────────────────── */}
      <Section
        title="Basic Info"
        name="basic"
        hasScanned={hasScannedData}
        reviewed={reviewedSections.has('basic')}
        onReviewed={() => markReviewed('basic')}
      >
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextInput
              label="Pet Name *"
              value={field.value}
              onChangeText={field.onChange}
              mode="outlined"
              style={[styles.input, scanned('name')]}
              error={!!errors.name}
            />
          )}
        />
        {errors.name && (
          <HelperText type="error">{errors.name.message}</HelperText>
        )}

        <Text variant="bodyMedium" style={styles.label}>
          Species *
        </Text>
        <Controller
          control={control}
          name="species"
          render={({ field }) => (
            <SegmentedButtons
              value={field.value}
              onValueChange={field.onChange}
              buttons={[
                { value: 'dog', label: 'Dog' },
                { value: 'cat', label: 'Cat' },
                { value: 'other', label: 'Other' },
              ]}
              style={[styles.segmented, scanned('species')]}
            />
          )}
        />

        {species === 'other' && (
          <Controller
            control={control}
            name="species_other"
            render={({ field }) => (
              <TextInput
                label="Specify species"
                value={field.value}
                onChangeText={field.onChange}
                mode="outlined"
                style={[styles.input, scanned('species_other')]}
              />
            )}
          />
        )}

        <Controller
          control={control}
          name="breed"
          render={({ field }) => (
            <TextInput
              label="Breed (optional)"
              value={field.value}
              onChangeText={field.onChange}
              mode="outlined"
              style={[styles.input, scanned('breed')]}
            />
          )}
        />

        <View style={styles.row}>
          <Controller
            control={control}
            name="age_years"
            render={({ field }) => (
              <TextInput
                label="Age (years)"
                value={field.value}
                onChangeText={field.onChange}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, styles.halfInput, scanned('age_years')]}
              />
            )}
          />
          <Controller
            control={control}
            name="age_months"
            render={({ field }) => (
              <TextInput
                label="Age (months)"
                value={field.value}
                onChangeText={field.onChange}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, styles.halfInput, scanned('age_months')]}
              />
            )}
          />
        </View>
      </Section>

      {/* ── Physical details ──────────────────────────── */}
      <Section
        title="Physical Details"
        name="details"
        hasScanned={hasScannedData}
        reviewed={reviewedSections.has('details')}
        onReviewed={() => markReviewed('details')}
      >
        <Text variant="bodyMedium" style={styles.label}>
          Sex
        </Text>
        <Controller
          control={control}
          name="sex"
          render={({ field }) => (
            <SegmentedButtons
              value={field.value}
              onValueChange={field.onChange}
              buttons={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'unknown', label: 'Unknown' },
              ]}
              style={[styles.segmented, scanned('sex')]}
            />
          )}
        />

        <Controller
          control={control}
          name="colour_markings"
          render={({ field }) => (
            <TextInput
              label="Colour / Markings"
              value={field.value}
              onChangeText={field.onChange}
              mode="outlined"
              style={[styles.input, scanned('colour_markings')]}
            />
          )}
        />

        <Controller
          control={control}
          name="weight_lbs"
          render={({ field }) => (
            <TextInput
              label="Weight (lbs)"
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="decimal-pad"
              mode="outlined"
              style={[styles.input, scanned('weight_lbs')]}
            />
          )}
        />

        <Controller
          control={control}
          name="microchip_number"
          render={({ field }) => (
            <TextInput
              label="Microchip Number"
              value={field.value}
              onChangeText={field.onChange}
              mode="outlined"
              style={[styles.input, scanned('microchip_number')]}
            />
          )}
        />
      </Section>

      {/* ── Intake / Health ───────────────────────────── */}
      <Section
        title="Intake & Health"
        name="health"
        hasScanned={hasScannedData}
        reviewed={reviewedSections.has('health')}
        onReviewed={() => markReviewed('health')}
      >
        <Text variant="bodyMedium" style={styles.label}>
          Spayed / Neutered
        </Text>
        <Controller
          control={control}
          name="spayed_neutered"
          render={({ field }) => (
            <SegmentedButtons
              value={field.value}
              onValueChange={field.onChange}
              buttons={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'unknown', label: 'Unknown' },
              ]}
              style={[styles.segmented, scanned('spayed_neutered')]}
            />
          )}
        />

        <Text variant="bodyMedium" style={styles.label}>
          Intake Type
        </Text>
        <Controller
          control={control}
          name="intake_type"
          render={({ field }) => (
            <SegmentedButtons
              value={field.value}
              onValueChange={field.onChange}
              buttons={[
                { value: 'surrender', label: 'Surrender' },
                { value: 'stray', label: 'Stray' },
                { value: 'found', label: 'Found' },
                { value: 'transfer', label: 'Transfer' },
              ]}
              style={[styles.segmented, scanned('intake_type')]}
            />
          )}
        />

        {/* Vaccinations */}
        <View style={styles.vaxxHeader}>
          <Text variant="bodyMedium" style={styles.label}>
            Vaccinations
          </Text>
          <Button
            compact
            mode="text"
            onPress={() =>
              appendVaxx({ type: 'rabies', date_given: '', notes: '' })
            }
          >
            + Add
          </Button>
        </View>
        {vaxxFields.map((field, index) => (
          <VaccinationRow
            key={field.id}
            control={control}
            index={index}
            onRemove={() => removeVaxx(index)}
          />
        ))}
      </Section>

      {/* ── Notes ─────────────────────────────────────── */}
      <Section
        title="Notes"
        name="notes"
        hasScanned={hasScannedData}
        reviewed={reviewedSections.has('notes')}
        onReviewed={() => markReviewed('notes')}
      >
        <Controller
          control={control}
          name="medical_notes"
          render={({ field }) => (
            <TextInput
              label="Medical Notes"
              value={field.value}
              onChangeText={field.onChange}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={[styles.input, scanned('medical_notes')]}
            />
          )}
        />
        <Controller
          control={control}
          name="behavioural_notes"
          render={({ field }) => (
            <TextInput
              label="Behavioural Notes"
              value={field.value}
              onChangeText={field.onChange}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={[styles.input, scanned('behavioural_notes')]}
            />
          )}
        />
      </Section>

      {/* ── Photos ────────────────────────────────────── */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Photos
        </Text>
        <View style={styles.photoRow}>
          {(photoUrls ?? []).map((uri) => (
            <View key={uri} style={styles.photoThumb}>
              <Image source={{ uri }} style={styles.photoImg} />
              <TouchableOpacity
                style={styles.photoRemove}
                onPress={() => removePhoto(uri)}
              >
                <Text style={styles.photoRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {(photoUrls ?? []).length < 5 && (
            <View style={styles.photoButtons}>
              <Button
                mode="outlined"
                icon="camera"
                compact
                onPress={() => pickPhoto(true)}
                style={styles.photoBtn}
              >
                Camera
              </Button>
              <Button
                mode="outlined"
                icon="image"
                compact
                onPress={() => pickPhoto(false)}
                style={styles.photoBtn}
              >
                Gallery
              </Button>
            </View>
          )}
        </View>
      </View>

      {/* ── Submit ────────────────────────────────────── */}
      <View style={styles.submitRow}>
        {hasScannedData && !allReviewed && (
          <Text variant="bodySmall" style={styles.reviewWarning}>
            Please review all sections before saving.
          </Text>
        )}
        <Button
          mode="contained"
          onPress={doSubmit}
          loading={submitting}
          disabled={submitting || (hasScannedData && !allReviewed)}
          style={styles.submitBtn}
          contentStyle={styles.submitContent}
        >
          {submitLabel}
        </Button>
      </View>
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────

function Section({
  title,
  name,
  children,
  hasScanned,
  reviewed,
  onReviewed,
}: {
  title: string;
  name: string;
  children: React.ReactNode;
  hasScanned?: boolean;
  reviewed?: boolean;
  onReviewed?: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </Text>
        {hasScanned && !reviewed && (
          <Chip
            compact
            onPress={onReviewed}
            style={styles.reviewChip}
            textStyle={styles.reviewChipText}
          >
            Mark reviewed ✓
          </Chip>
        )}
        {hasScanned && reviewed && (
          <Text style={styles.reviewedText}>✓ Reviewed</Text>
        )}
      </View>
      {children}
    </View>
  );
}

function VaccinationRow({
  control,
  index,
  onRemove,
}: {
  control: Control<PetFormValues>;
  index: number;
  onRemove: () => void;
}) {
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);

  return (
    <View style={styles.vaxxRow}>
      <Controller
        control={control}
        name={`vaccinations.${index}.type`}
        render={({ field }) => (
          <Menu
            visible={typeMenuVisible}
            onDismiss={() => setTypeMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                compact
                onPress={() => setTypeMenuVisible(true)}
                style={styles.vaxxTypeBtn}
              >
                {field.value}
              </Button>
            }
          >
            {(['rabies', 'distemper', 'bordetella', 'other'] as const).map(
              (t) => (
                <Menu.Item
                  key={t}
                  title={t}
                  onPress={() => {
                    field.onChange(t);
                    setTypeMenuVisible(false);
                  }}
                />
              ),
            )}
          </Menu>
        )}
      />
      <Controller
        control={control}
        name={`vaccinations.${index}.date_given`}
        render={({ field }) => (
          <TextInput
            label="Date"
            value={field.value}
            onChangeText={field.onChange}
            placeholder="YYYY-MM-DD"
            mode="outlined"
            style={styles.vaxxDate}
            dense
          />
        )}
      />
      <Button compact mode="text" onPress={onRemove} textColor="#e63946">
        Remove
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingBottom: 48 },
  scanSection: {
    backgroundColor: '#fff',
    padding: 16,
    gap: 8,
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dee2e6',
  },
  scanHint: {
    color: '#2d6a4f',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#1b4332',
  },
  reviewChip: {
    backgroundColor: '#b7e4c7',
  },
  reviewChipText: {
    fontSize: 11,
    color: '#1b4332',
  },
  reviewedText: {
    fontSize: 12,
    color: '#40916c',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
  },
  scannedInput: {
    backgroundColor: '#e0f2fe',
  },
  label: {
    color: '#555',
    marginBottom: 4,
  },
  segmented: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  vaxxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vaxxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  vaxxTypeBtn: {
    minWidth: 100,
  },
  vaxxDate: {
    flex: 1,
    backgroundColor: '#fff',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumb: {
    position: 'relative',
  },
  photoImg: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  photoBtn: {},
  submitRow: {
    padding: 16,
    gap: 8,
  },
  reviewWarning: {
    color: '#f4a261',
    textAlign: 'center',
  },
  submitBtn: {},
  submitContent: {
    paddingVertical: 6,
  },
});
