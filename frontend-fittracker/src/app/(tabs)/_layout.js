import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';
import { Loading } from '../../components/ui';

// Navigasi bawah untuk area aplikasi yang sudah login.
export default function TabsLayout() {
  const { token, loading } = useAuth();
  if (loading) return <Loading label="Memuat..." />;
  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { fontWeight: 'bold', color: colors.text },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Beranda', tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="exercises"
        options={{ title: 'Latihan', tabBarIcon: ({ color }) => <Ionicons name="barbell-outline" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="schedule"
        options={{ title: 'Jadwal', tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="groups"
        options={{ title: 'Komunitas', tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} /> }}
      />
    </Tabs>
  );
}
