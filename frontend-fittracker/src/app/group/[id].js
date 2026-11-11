import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { getCachedGroups } from '../../localStore';
import { Screen, Card, Badge, Button, Loading, EmptyState, SectionHeader } from '../../components/ui';
import { colors, typography } from '../../theme';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [peranSaya, setPeranSaya] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [groupError, setGroupError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getGroup(id);
      setGroup(res.group);
      setMembers(res.members || []);
      setPeranSaya(res.peran_saya);
    } catch (e) {
      // fallback ke cache
      const cached = await getCachedGroups();
      const g = cached.find((x) => String(x.id_group) === String(id));
      setGroup(g || null);
      setMembers([]);
      setPeranSaya(g ? !!g.sudah_gabung : false);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleJoin() {
    setBusy(true);
    try {
      await api.joinGroup(id);
      await load();
    } catch (e) {
      setGroupError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    setBusy(true);
    try {
      await api.leaveGroup(id);
      await load();
    } catch (e) {
      setGroupError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Screen><Loading label="Memuat grup..." /></Screen>;
  if (!group) return <Screen><EmptyState title="Grup tidak ditemukan" /></Screen>;

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text }}>{group.nama_group}</Text>
      <Text style={[typography.muted, { marginBottom: 12 }]}>Dibuat oleh {group.pembuat}</Text>

      {group.deskripsi ? (
        <Card>
          <Text style={typography.label}>Deskripsi</Text>
          <Text style={typography.body}>{group.deskripsi}</Text>
        </Card>
      ) : null}

      {peranSaya ? (
        <Badge text={peranSaya === 'admin' ? 'Anda Admin' : 'Anda Anggota'} color={colors.success} />
      ) : null}

      {/* Tombol Chat hanya untuk anggota */}
      {peranSaya && (
        <Button
          title="💬 Buka Obrolan Grup"
          onPress={() => router.push({ pathname: '/group/chat', params: { id, nama: group.nama_group } })}
          style={{ marginTop: 8 }}
        />
      )}

      <SectionHeader title={`Anggota (${members.length})`} />
      {members.length === 0 ? (
        <EmptyState title="Belum ada anggota" subtitle="Data anggota memerlukan koneksi internet." />
      ) : (
        members.map((m) => (
          <Card key={m.id_member} style={styles.member}>
            <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{m.nama_lengkap}</Text>
              <Text style={typography.muted}>{m.peran === 'admin' ? 'Admin' : 'Anggota'}</Text>
            </View>
            {m.peran === 'admin' ? <Ionicons name="star" size={18} color={colors.warn} /> : null}
          </Card>
        ))
      )}

      {groupError ? <Text style={[typography.muted, { color: colors.danger }]}>{groupError}</Text> : null}

      {peranSaya ? (
        <Button title="Keluar dari Grup" variant="outline" loading={busy} onPress={handleLeave} />
      ) : (
        <Button title="Gabung Grup" loading={busy} onPress={handleJoin} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  member: { flexDirection: 'row', alignItems: 'center' },
});
