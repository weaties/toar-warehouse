import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Checkbox,
  HelperText,
} from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ContactType } from '@/types';

const ownerSchema = z.object({
  full_name: z.string(),
  phone_primary: z.string(),
  email: z.string(),
  phone_secondary: z.string(),
  street_address: z.string(),
  city: z.string(),
  province: z.string(),
  postal_code: z.string(),
  contact_type: z.array(z.enum(['adopter', 'foster', 'donor'])),
  notes: z.string(),
});

export type OwnerFormValues = z.infer<typeof ownerSchema>;

const DEFAULT_VALUES: OwnerFormValues = {
  full_name: '',
  phone_primary: '',
  email: '',
  phone_secondary: '',
  street_address: '',
  city: '',
  province: 'BC',
  postal_code: '',
  contact_type: [],
  notes: '',
};

interface Props {
  initialValues?: Partial<OwnerFormValues>;
  onSubmit: (data: OwnerFormValues) => Promise<void>;
  submitLabel?: string;
}

export default function OwnerForm({ initialValues, onSubmit, submitLabel = 'Save' }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: { ...DEFAULT_VALUES, ...initialValues },
  });

  const doSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Save failed.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.banner}>
        <Text variant="bodySmall" style={styles.bannerText}>
          All fields are optional — collect only what the person is comfortable sharing.
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Contact Info</Text>

        <Controller control={control} name="full_name" render={({ field }) => (
          <TextInput label="Full Name" value={field.value} onChangeText={field.onChange}
            mode="outlined" style={styles.input} autoCapitalize="words" />
        )} />
        <Controller control={control} name="phone_primary" render={({ field }) => (
          <TextInput label="Primary Phone" value={field.value} onChangeText={field.onChange}
            mode="outlined" style={styles.input} keyboardType="phone-pad" />
        )} />
        <Controller control={control} name="email" render={({ field }) => (
          <TextInput label="Email" value={field.value} onChangeText={field.onChange}
            mode="outlined" style={styles.input} keyboardType="email-address" autoCapitalize="none" />
        )} />
        <Controller control={control} name="phone_secondary" render={({ field }) => (
          <TextInput label="Secondary Phone (optional)" value={field.value} onChangeText={field.onChange}
            mode="outlined" style={styles.input} keyboardType="phone-pad" />
        )} />
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Address</Text>
        <Controller control={control} name="street_address" render={({ field }) => (
          <TextInput label="Street Address" value={field.value} onChangeText={field.onChange}
            mode="outlined" style={styles.input} autoCapitalize="words" />
        )} />
        <View style={styles.row}>
          <Controller control={control} name="city" render={({ field }) => (
            <TextInput label="City" value={field.value} onChangeText={field.onChange}
              mode="outlined" style={[styles.input, styles.flex2]} autoCapitalize="words" />
          )} />
          <Controller control={control} name="province" render={({ field }) => (
            <TextInput label="Province" value={field.value} onChangeText={field.onChange}
              mode="outlined" style={[styles.input, styles.flex1]} autoCapitalize="characters" />
          )} />
        </View>
        <Controller control={control} name="postal_code" render={({ field }) => (
          <TextInput label="Postal Code" value={field.value} onChangeText={field.onChange}
            mode="outlined" style={styles.input} autoCapitalize="characters" />
        )} />
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Contact Type</Text>
        <Controller
          control={control}
          name="contact_type"
          render={({ field }) => (
            <View style={styles.checkboxGroup}>
              {(['adopter', 'foster', 'donor'] as ContactType[]).map((t) => {
                const checked = field.value.includes(t);
                return (
                  <View key={t} style={styles.checkboxRow}>
                    <Checkbox
                      status={checked ? 'checked' : 'unchecked'}
                      onPress={() => {
                        if (checked) {
                          field.onChange(field.value.filter((v) => v !== t));
                        } else {
                          field.onChange([...field.value, t]);
                        }
                      }}
                      color="#2d6a4f"
                    />
                    <Text variant="bodyMedium" style={styles.checkboxLabel}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        />
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Notes</Text>
        <Controller control={control} name="notes" render={({ field }) => (
          <TextInput label="Notes" value={field.value} onChangeText={field.onChange}
            mode="outlined" multiline numberOfLines={3} style={styles.input} />
        )} />
      </View>

      <View style={styles.submitRow}>
        <Button mode="contained" onPress={doSubmit} loading={submitting} disabled={submitting}
          style={styles.submitBtn} contentStyle={styles.submitContent}>
          {submitLabel}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingBottom: 48 },
  banner: {
    backgroundColor: '#d8f3dc',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  bannerText: { color: '#1b4332', textAlign: 'center' },
  section: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
  },
  sectionTitle: { fontWeight: '700', color: '#1b4332' },
  input: { backgroundColor: '#fff' },
  row: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  checkboxGroup: { gap: 4 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkboxLabel: { marginLeft: 8 },
  submitRow: { padding: 16 },
  submitBtn: {},
  submitContent: { paddingVertical: 6 },
});
