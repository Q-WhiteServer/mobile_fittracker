import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { Loading } from '../components/ui';

function RootStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="exercise/[id]" options={{ title: 'Detail Latihan' }} />
      <Stack.Screen name="plan/create" options={{ title: 'Buat Jadwal' }} />
      <Stack.Screen name="plan/[id]" options={{ title: 'Detail Jadwal' }} />
      <Stack.Screen name="log/create" options={{ title: 'Catat Latihan' }} />
      <Stack.Screen name="timer" options={{ title: 'Timer Latihan' }} />
      <Stack.Screen name="group/[id]" options={{ title: 'Detail Grup' }} />
      <Stack.Screen name="group/create" options={{ headerShown: false }} />
      <Stack.Screen name="group/search" options={{ headerShown: false }} />
      <Stack.Screen name="group/chat" options={{ headerShown: false }} />
    </Stack>
  );
}

function RootNavigator() {
  const { loading } = useAuth();
  if (loading) return <Loading label="Memuat sesi..." />;
  return (
    <>
      <StatusBar style="dark" />
      <RootStack />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
