import { Stack } from 'expo-router';

export default function OwnersLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2d6a4f' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'People' }} />
      <Stack.Screen name="new" options={{ title: 'New Person' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Person Details' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit Person' }} />
    </Stack>
  );
}
