import { useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { cacheGroups, getCachedGroups } from '../../localStore';
import { Screen, Card, Button, Field, Badge, EmptyState, Loading } from '../../components/ui';
import { colors, typography } from '../../theme';

export default function GroupsScreen() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getGroups();
      setGroups(res.groups || []);
      await cacheGroups(res.groups || []);
      setOffline(false);
    } catch (e) {
      setOffline(true);
      setGroups(await getCachedGroups());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleCreate() {
    if (!nama.trim()) {
      Alert.alert('Peringatan', 'Nama grup wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      await api.createGroup({ nama_group: nama.trim(), deskripsi: deskripsi.trim() });
      setNama('');
      setDeskripsi('');
      setShowCreate(false);
      await load();
    } catch (e) {
      Alert.alert('Gagal', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Text style={typography.title}>Komunitas</Text>
      <Text style={typography.subtitle}>Bergabung & berolahraga bareng.</Text>
      {offline && <Text style={[typography.muted, { color: colors.warn }]}>Mode offline — data komunitas memerlukan koneksi.</Text>}

      <Button title="+ Buat Grup Baru" onPress={() => setShowCreate(true)} />

      {loading ? (
        <Loading label="Memuat komunitas..." />
      ) : groups.length === 0 ? (
        <EmptyState title="Belum ada grup" subtitle="Buat grup olahraga dan undang teman bergabung." />
      ) : (
        groups.map((g) => (
          <Pressable key={g.id_group} onPress={() => router.push(`/group/${g.id_group}`)}>
            <Card style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{g.nama_group}</Text>
                <Text style={[typography.muted, { marginTop: 4, marginBottom: 6 }]}>Dibuat oleh {g.pembuat}</Text>
                <View style={{ flexDirection: 'row' }}>
                  <Badge text={`${g.jumlah_anggota} anggota`} color={colors.accent} />
                  {g.sudah_gabung ? <Badge text="Bergabung" color={colors.success} /> : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Card>
          </Pressable>
        ))
      )}

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={typography.section}>Buat Grup Baru</Text>
            <Text style={typography.label}>Nama Grup</Text>
            <Field value={nama} onChangeText={setNama} placeholder="cth. Lari Pagi Bersama" />
            <Text style={typography.label}>Deskripsi</Text>
            <Field value={deskripsi} onChangeText={setDeskripsi} placeholder="Deskripsi singkat" multiline />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button title="Batal" variant="outline" onPress={() => setShowCreate(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Buat" loading={saving} onPress={handleCreate} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 34 },
});
