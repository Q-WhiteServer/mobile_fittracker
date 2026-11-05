import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPlans } from '../../localStore';
import { Screen, Card, Button, EmptyState } from '../../components/ui';
import { colors, typography } from '../../theme';

const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function namaHari(tanggal) {
  try {
    const d = new Date(tanggal);
    return `${HARI_ID[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return tanggal;
  }
}

export default function ScheduleScreen() {
  const [plans, setPlans] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => setPlans(await getPlans()))();
    }, [])
  );

  return (
    <Screen>
      <Text style={typography.title}>Jadwal Latihan</Text>
      <Text style={typography.subtitle}>Susun rencana harian/mingguan Anda.</Text>

      <Button title="+ Buat Jadwal Baru" onPress={() => router.push('/plan/create')} />

      {plans.length === 0 ? (
        <EmptyState
          title="Belum ada jadwal"
          subtitle="Buat jadwal latihan agar olahraga lebih teratur."
          action={<Button title="Buat Jadwal" onPress={() => router.push('/plan/create')} />}
        />
      ) : (
        plans.map((p) => (
          <Pressable key={p.id} onPress={() => router.push(`/plan/${p.id}`)}>
            <Card style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{p.nama_plan}</Text>
                <Text style={[typography.muted, { marginTop: 4 }]}>
                  {namaHari(p.tanggal)} • {p.exercises?.length || 0} gerakan
                </Text>
                {p.catatan ? <Text style={typography.muted}>{p.catatan}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
