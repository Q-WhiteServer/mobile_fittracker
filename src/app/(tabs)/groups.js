import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Modal, Alert } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { cacheGroups, getCachedGroups } from '../../localStore';
import { Card, Button, Field, Badge, EmptyState, Loading } from '../../components/ui';
import { colors, typography } from '../../theme';

const MOCK_AKTIVITAS = [
  {
    id: '1',
    nama: 'Faiq Ahmad',
    waktu: '30 menit lalu',
    isi: 'Menyelesaikan lari 5 km bersama Tambak sumur Runners. Pagi yang produktif!',
    inisial: 'FA',
    suka: 12,
    komentar: 3,
  },
  {
    id: '2',
    nama: 'Era Zhafran',
    waktu: '1 jam lalu',
    isi: 'Siapa yang ikut latihan kekuatan sore ini? Sampai ketemu pukul 18.00!',
    inisial: 'RN',
    suka: 8,
    komentar: 5,
  },
  {
    id: '3',
    nama: 'Valentina Mesy - Kamu',
    waktu: 'Kemarin',
    isi: 'Latihan Lengan & Dada selesai. 24 menit lebih dekat ke tujuanku.',
    inisial: 'VM',
    suka: 6,
    komentar: 1,
  },
];

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
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* ── Top Header & Ikon Lonceng ── */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.mainTitle}>Komunitas</Text>
          <Text style={styles.subtitle}>Lebih semangat saat bergerak bersama.</Text>
        </View>
        <Pressable style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Status Koneksi */}
      <View style={styles.statusRow}>
        <Ionicons name="wifi" size={14} color="#059669" />
        <Text style={styles.statusText}>{offline ? 'Mode offline — data komunitas memerlukan koneksi.' : 'Online • Terhubung ke komunitas'}</Text>
      </View>

      {/* Tombol Aksi Utama (Cari Grup & Buat Grup) */}
      <View style={styles.actionButtonRow}>
        <Pressable style={styles.primaryActionBtn} onPress={() => router.push('/group/search')}>
          <Ionicons name="search-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.primaryActionText}>Cari Grup</Text>
        </Pressable>
        <Pressable style={styles.secondaryActionBtn} onPress={() => router.push('/group/create')}>
          <Ionicons name="add" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.secondaryActionText}>Buat Grup</Text>
        </Pressable>
      </View>

      {/* ── Grup yang kamu ikuti ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Grup yang kamu ikuti</Text>
        <Text style={styles.groupCountText}>{groups.length || 2} grup</Text>
      </View>

      {loading ? (
        <Loading label="Memuat komunitas..." />
      ) : groups.length === 0 ? (
        <>
          <Pressable style={styles.groupCard} onPress={() => router.push('/group/1')}>
            <View style={styles.groupAvatar}>
              <Text style={styles.groupAvatarText}>TS</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.groupName}>Tambak Sumur Runners</Text>
              <Text style={styles.groupMeta}>Lari • 128 anggota</Text>
              <Text style={styles.groupSubMeta}>2 aktivitas baru hari ini</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>

          <Pressable style={styles.groupCard} onPress={() => router.push('/group/2')}>
            <View style={[styles.groupAvatar, { backgroundColor: '#E0F2FE' }]}>
              <Text style={[styles.groupAvatarText, { color: '#0369A1' }]}>KR</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.groupName}>Kuat di Rumah</Text>
              <Text style={styles.groupMeta}>Kekuatan • 86 anggota</Text>
              <Text style={[styles.groupSubMeta, { color: colors.primary }]}>Tantangan mingguan sedang berjalan</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
        </>
      ) : (
        groups.map((g) => (
          <Pressable key={g.id_group} onPress={() => router.push(`/group/${g.id_group}`)}>
            <Card style={styles.groupCard}>
              <View style={styles.groupAvatar}>
                <Text style={styles.groupAvatarText}>{g.nama_group?.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.groupName}>{g.nama_group}</Text>
                <Text style={styles.groupMeta}>{g.jumlah_anggota} anggota</Text>
                {g.sudah_gabung && <Text style={[styles.groupSubMeta, { color: colors.primary }]}>Bergabung</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Card>
          </Pressable>
        ))
      )}

      {/* ── Banner Tantangan ── */}
      <View style={styles.challengeCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Ionicons name="trophy-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.challengeTitle}>Tantangan Kuat di Rumah</Text>
        </View>
        <View style={styles.challengeMetaRow}>
          <Text style={styles.challengeSub}>50 sesi bersama</Text>
          <Text style={styles.challengeSub}>•</Text>
          <Text style={styles.challengeSub}>12–18 Oktober</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={styles.progressBarFill} />
        </View>
        <Text style={styles.progressText}>32 / 50 sesi selesai</Text>
      </View>

      {/* ── Aktivitas Terbaru ── */}
      <View style={[styles.sectionHeaderRow, { marginTop: 10 }]}>
        <Text style={styles.sectionTitle}>Aktivitas terbaru</Text>
        <Pressable>
          <Text style={styles.linkSemua}>Semua</Text>
        </Pressable>
      </View>

      {MOCK_AKTIVITAS.map((item) => (
        <View key={item.id} style={styles.activityCard}>
          <View style={styles.activityHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.activityAvatar}>
                <Text style={styles.activityAvatarText}>{item.inisial}</Text>
              </View>
              <Text style={styles.activityName}>{item.nama}</Text>
            </View>
            <Text style={styles.activityTime}>{item.waktu}</Text>
          </View>
          <Text style={styles.activityContent}>{item.isi}</Text>
          <View style={styles.activityFooterRow}>
            <Ionicons name="heart-outline" size={14} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.activityActionText}>{item.suka} suka</Text>
            <Text style={[styles.activityActionText, { marginLeft: 12 }]}>💬 {item.komentar} komentar</Text>
          </View>
        </View>
      ))}

      {/* ── Modal Buat Grup ── */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={typography.section}>Buat Grup Baru</Text>
            <Text style={typography.label}>Nama Grup</Text>
            <Field value={nama} onChangeText={setNama} placeholder="cth. Lari Pagi Bersama" />
            <Text style={typography.label}>Deskripsi</Text>
            <Field value={deskripsi} onChangeText={setDeskripsi} placeholder="Deskripsi singkat" multiline />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 6,
    fontWeight: '500',
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  groupCountText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  groupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#047857',
  },
  groupName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  groupMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  groupSubMeta: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
    fontWeight: '500',
  },
  challengeCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#065F46',
  },
  challengeMetaRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  challengeSub: {
    fontSize: 12,
    color: '#047857',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#D1FAE5',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBarFill: {
    width: '64%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
  },
  linkSemua: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  activityAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#047857',
  },
  activityName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  activityContent: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 10,
  },
  activityFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityActionText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
  },
});