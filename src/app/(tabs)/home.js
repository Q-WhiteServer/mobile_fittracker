import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../theme';

export default function ProfileScreen() {
  const [usia, setUsia] = useState('24');
  const [tinggi, setTinggi] = useState('160');
  const [berat, setBerat] = useState('69');
  const [tujuan, setTujuan] = useState('menurunkan_berat_badan');
  const [loading, setLoading] = useState(false);

  const goals = [
    {
      id: 'menurunkan_berat_badan',
      title: 'Menurunkan berat badan',
      subtitle: 'Lebih aktif, lebih ringan.',
      icon: 'flame',
    },
    {
      id: 'membentuk_otot',
      title: 'Membentuk otot',
      subtitle: 'Bangun kekuatan dan massa otot.',
      icon: 'barbell',
    },
    {
      id: 'menjaga_kebugaran',
      title: 'Menjaga kebugaran',
      subtitle: 'Tubuh bugar untuk aktivitas harian.',
      icon: 'heart',
    },
  ];

  async function handleSave() {
    if (!usia || !tinggi || !berat) {
      Alert.alert('Peringatan', 'Semua data fisik wajib diisi!');
      return;
    }
    setLoading(true);
    try {
      // Simulasi simpan data profil / personalisasi
      setTimeout(() => {
        setLoading(false);
        Alert.alert('Berhasil', 'Data personalisasi berhasil disimpan!');
        router.replace('/home');
      }, 800);
    } catch (error) {
      setLoading(false);
      Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan.');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ── Progress Header ── */}
      <View style={styles.topBar}>
        <Text style={styles.progressLabel}>PERSONALISASI LATIHAN</Text>
        <Text style={styles.stepLabel}>Langkah 1 dari 1</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={styles.progressBarFill} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Judul ── */}
        <Text style={styles.title}>Kenalan dulu, yuk!</Text>
        <Text style={styles.subtitle}>
          Bantu kami menyiapkan latihan yang pas untuk tubuh dan tujuanmu.
        </Text>

        {/* ── Data Fisikmu ── */}
        <Text style={styles.sectionTitle}>Data fisikmu</Text>
        <View style={styles.rowInputs}>
          {/* Usia */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Usia</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.inputField}
                value={usia}
                onChangeText={setUsia}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>th</Text>
            </View>
          </View>

          {/* Tinggi */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Tinggi</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.inputField}
                value={tinggi}
                onChangeText={setTinggi}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>cm</Text>
            </View>
          </View>

          {/* Berat Badan */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Berat badan</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.inputField}
                value={berat}
                onChangeText={setBerat}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>kg</Text>
            </View>
          </View>
        </View>

        <Text style={styles.infoNote}>
          Data ini bisa diperbarui kapan saja di Pengaturan.
        </Text>

        {/* ── Tujuan Utama ── */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          Apa tujuan utamamu?
        </Text>

        {goals.map((item) => {
          const isSelected = tujuan === item.id;
          return (
            <Pressable
              key={item.id}
              style={[styles.goalCard, isSelected && styles.goalCardSelected]}
              onPress={() => setTujuan(item.id)}
            >
              <View
                style={[
                  styles.goalIconBox,
                  isSelected && { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={isSelected ? '#FFFFFF' : colors.primary}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.goalTitle}>{item.title}</Text>
                <Text style={styles.goalSubtitle}>{item.subtitle}</Text>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  isSelected && styles.radioCircleSelected,
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color={colors.primary} />
                )}
              </View>
            </Pressable>
          );
        })}

        {/* ── Privasi Notice ── */}
        <View style={styles.privacyBox}>
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color="#6B7280"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.privacyText}>
            Data fisik bersifat pribadi dan tidak ditampilkan di komunitas.
          </Text>
        </View>
      </ScrollView>

      {/* ── Footer Button ── */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Mulai latihan</Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color="#FFF"
                style={{ marginLeft: 8 }}
              />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  stepLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 20,
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputCard: {
    width: '31%',
  },
  inputLabel: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    height: 52,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 0,
  },
  inputSuffix: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  infoNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    marginBottom: 16,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  goalCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#ECFDF5',
  },
  goalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  goalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});