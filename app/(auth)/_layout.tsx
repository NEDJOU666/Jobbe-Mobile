import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="sign-up" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="verify-otp" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="oauth-callback" options={{ animation: 'fade' }} />
    </Stack>
  );
}
