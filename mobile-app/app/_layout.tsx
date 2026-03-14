import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#1a1a2e' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ title: 'Onboarding' }} />
        <Stack.Screen name="recovery" options={{ title: 'Recovery' }} />
        <Stack.Screen name="home" options={{ title: 'ChainGuard', headerBackVisible: false }} />
        <Stack.Screen name="recording" options={{ title: 'Recording' }} />
        <Stack.Screen name="my-evidence" options={{ title: 'My Evidence' }} />
        <Stack.Screen name="public-feed" options={{ title: 'Public Feed' }} />
      </Stack>
    </>
  );
}
