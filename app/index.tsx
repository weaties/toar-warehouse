import { Redirect } from 'expo-router';

// Root index — AuthGuard in _layout.tsx will redirect to login if not signed in.
export default function Index() {
  return <Redirect href="/(tabs)/dashboard" />;
}
