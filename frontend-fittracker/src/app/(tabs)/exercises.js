import { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { cacheExercises, getCachedExercises } from '../../localStore';
import { Card, Chip, Badge, Field, EmptyState, Loading } from '../../components/ui';
import { colors, typography } from '../../theme';

const KATEGORI_LIST = ['Semua', 'Kardio', 'Kekuatan', 'Core', 'Peregangan', 'Full Body'];
const LEVEL_LIST = ['Semua', 'Pemula', 'Menengah', 'Lanjutan'];

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [kategori, setKategori] = useState('Semua');
  const [level, setLevel] = useState('Semua');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getExercises({});
      setExercises(res.exercises || []);
      await cacheExercises(res.exercises || []);
      setOffline(false);
    } catch (e) {
      setOffline(true);
      setExercises(await getCachedExercises());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (kategori !== 'Semua' && ex.kategori !== kategori) return false;
      if (level !== 'Semua' && ex.level_kesulitan !== level) return false;
      if (q && !ex.nama_gerakan.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [exercises, kategori, level, q]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={typography.title}>Katalog Latihan</Text>
      {offline && <Text style={[typography.muted, { color: colors.warn }]}>Menampilkan data tersimpan (offline).</Text>}

      <Text style={typography.label}>Cari gerakan</Text>
      <Field value={q} onChangeText={setQ} placeholder="cth. push up" />

      <Text style={typography.label}>Kategori</Text>
      <View style={styles.chips}>
        {KATEGORI_LIST.map((k) => (
          <Chip key={k} label={k} active={kategori === k} onPress={() => setKategori(k)} />
        ))}
      </View>

      <Text style={typography.label}>Tingkat Kesulitan</Text>
      <View style={styles.chips}>
        {LEVEL_LIST.map((l) => (
          <Chip key={l} label={l} active={level === l} onPress={() => setLevel(l)} />
        ))}
      </View>

      {loading ? (
        <Loading label="Memuat latihan..." />
      ) : filtered.length === 0 ? (
        <EmptyState title="Tidak ada latihan" subtitle="Coba ubah filter atau kata kunci pencarian." />
      ) : (
        filtered.map((ex) => (
          <Pressable key={ex.id_exercise} onPress={() => router.push(`/exercise/${ex.id_exercise}`)}>
            <Card style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{ex.nama_gerakan}</Text>
                <View style={{ flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' }}>
                  <Badge text={ex.kategori} color={colors.accent} />
                  <Badge
                    text={ex.level_kesulitan}
                    color={ex.level_kesulitan === 'Pemula' ? colors.success : ex.level_kesulitan === 'Menengah' ? colors.warn : colors.danger}
                  />
                  {ex.durasi > 0 && <Badge text={`${ex.durasi}s`} color={colors.muted} />}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, marginTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
