import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2d6a4f',
    primaryContainer: '#d8f3dc',
    secondary: '#52b788',
    secondaryContainer: '#b7e4c7',
    tertiary: '#e9c46a',
    background: '#f8f9fa',
    surface: '#ffffff',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    outline: '#adb5bd',
  },
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';

    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && inAuth) {
      router.replace('/(tabs)/dashboard');
    }
  }, [session, loading, segments, router]);

  if (loading) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <StatusBar style="light" />
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthGuard>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
