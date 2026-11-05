import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getStats, getLogs } from '../../localStore';
import { Screen, Card, SectionHeader, Button, EmptyState } from '../../components/ui';
import { colors, typography } from '../../theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setStats(await getStats());
        const logs = await getLogs();
        setRecent(logs.slice(0, 5));
      })();
    }, [])
  );

  return (
    <Screen>
      <Text style={styles.greeting}>Halo, {user?.nama_lengkap?.split(' ')[0] || 'Atlet'}! 👋</Text>
      <Text style={typography.subtitle}>Tetap konsisten hari ini.</Text>

      {!stats?.profil_lengkap && (
        <Card style={{ backgroundColor: colors.primary + '0F', borderColor: colors.primary + '33' }}>
          <Text style={[typography.body, { fontWeight: '700', color: colors.primary }]}>Lengkapi data diri Anda</Text>
          <Text style={[typography.muted, { marginTop: 4, marginBottom: 10 }]}>
            Agar program latihan dapat disesuaikan dengan kondisi & tujuan Anda.
          </Text>
          <Button title="Isi Data Diri" variant="outline" onPress={() => router.push('/profile')} />
        </Card>
      )}

      <SectionHeader title="Ringkasan Aktivitas" />
      <View style={styles.statGrid}>
        <StatCard label="Jadwal" value={stats?.total_jadwal ?? 0} icon="calendar" />
        <StatCard label="Latihan Selesai" value={stats?.total_latihan_selesai ?? 0} icon="checkmark" />
        <StatCard label="Total Set" value={stats?.total_set ?? 0} icon="barbell" />
        <StatCard label="Minggu Ini" value={stats?.latihan_minggu_ini ?? 0} icon="flame" />
      </View>

      <SectionHeader
        title="Aksi Cepat"
        right={<Pressable onPress={() => router.push('/schedule')}><Text style={styles.link}>Lihat Jadwal</Text></Pressable>}
      />
      <View style={styles.quickRow}>
        <QuickAction label="Timer" icon="timer-outline" onPress={() => router.push('/timer')} />
        <QuickAction label="Katalog" icon="barbell-outline" onPress={() => router.push('/exercises')} />
        <QuickAction label="Catat" icon="create-outline" onPress={() => router.push('/log/create')} />
        <QuickAction label="Jadwal" icon="add-circle-outline" onPress={() => router.push('/plan/create')} />
      </View>

      <SectionHeader
        title="Riwayat Terakhir"
        right={<Pressable onPress={() => router.push('/schedule')}><Text style={styles.link}>Lihat</Text></Pressable>}
      />
      {recent.length === 0 ? (
        <EmptyState title="Belum ada riwayat" subtitle="Catat latihan pertama Anda untuk memulai." action={<Button title="Catat Latihan" onPress={() => router.push('/log/create')} />} />
      ) : (
        recent.map((l) => (
          <Card key={l.id} style={styles.rowCard}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{l.nama_gerakan || 'Latihan'}</Text>
              <Text style={typography.muted}>{l.tanggal} • {l.jumlah_set} set × {l.reps} reps{l.beban ? ` • ${l.beban} kg` : ''}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          </Card>
        ))
      )}
    </Screen>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ label, icon, onPress }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <Ionicons name={icon} size={24} color={colors.primary} />
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 4 },
  link: { color: colors.primary, fontWeight: '600' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 },
  statCard: { width: '48%', backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 6 },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 2 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  quickAction: { alignItems: 'center', width: '23%', backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  quickLabel: { fontSize: 12, fontWeight: '600', color: colors.text, marginTop: 6, textAlign: 'center' },
  rowCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
