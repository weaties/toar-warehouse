import { Stack } from 'expo-router';

export default function PetsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2d6a4f' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Pets' }} />
      <Stack.Screen name="new" options={{ title: 'New Intake' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Pet Details' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit Pet' }} />
    </Stack>
  );
}
