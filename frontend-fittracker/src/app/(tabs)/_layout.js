import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';
import { Loading } from '../../components/ui';

// Navigasi bawah — 5 tab sesuai spesifikasi:
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

      {/* Tab 2 — Temukan (Katalog latihan) */}
      <Tabs.Screen
        name="exercises"
<<<<<<< HEAD
        options={{ title: 'Latihan', tabBarIcon: ({ color }) => <Ionicons name="barbell-outline" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Temukan',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { backgroundColor: '#D1FAE5', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 } : {}}>
              <Ionicons name="compass-outline" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{ title: 'Jadwal', tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} /> }}
=======
        options={{
          title: 'Temukan',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
>>>>>>> 8b8c4b2 (fiksss ini)
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
          href: null, // sembunyikan dari tab bar
          headerTitle: 'Jadwal',
        }}
      />
    </Tabs>
  );
}
