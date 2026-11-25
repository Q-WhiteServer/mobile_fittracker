import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';
import { Loading } from '../../components/ui';

// Navigasi bawah — 5 tab:
// Latihan (beranda) | Temukan | Komunitas | Laporan | Pengaturan
export default function TabsLayout() {
  const { token, loading } = useAuth();
  if (loading) return <Loading label="Memuat..." />;
  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: 'bold', color: '#111827' },
        headerShadowVisible: false,
      }}
    >
      {/* Tab 1 — Latihan (Beranda utama) */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Latihan',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 2 — Temukan */}
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Temukan',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 3 — Komunitas */}
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Komunitas',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 4 — Laporan */}
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Laporan',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 5 — Pengaturan (Profil) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Pengaturan',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Tab tersembunyi — tetap terdaftar agar routing tidak error */}
      <Tabs.Screen
        name="schedule"
        options={{
          href: null,
          headerTitle: 'Jadwal',
        }}
      />
    </Tabs>
  );
}
