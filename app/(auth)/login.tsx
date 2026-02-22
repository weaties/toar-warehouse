import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
} from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import PawIcon from '@/components/PawIcon';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <PawIcon size={64} color="#fff" />
          <Text variant="headlineMedium" style={styles.appName}>
            OAR Rescue
          </Text>
          <Text variant="bodyMedium" style={styles.tagline}>
            Okanagan Animal Rescue
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
            mode="outlined"
            style={styles.input}
            disabled={loading}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          {error ? (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSignIn}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Sign In
          </Button>

          <Text variant="bodySmall" style={styles.hint}>
            Contact your administrator to create an account.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2d6a4f',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    color: '#fff',
    fontWeight: '800',
    marginTop: 12,
  },
  tagline: {
    color: '#b7e4c7',
    marginTop: 4,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    gap: 8,
  },
  input: {
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  hint: {
    textAlign: 'center',
    color: '#777',
    marginTop: 8,
  },
});
