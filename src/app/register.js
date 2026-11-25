import { useState } from 'react';
import {
  Alert,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Cek sederhana apakah kata sandi kuat (minimal 8 karakter + ada huruf & angka)
  const isStrongPassword =
    password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);

  async function handleRegister() {
    if (!namaLengkap || !email || !password) {
      Alert.alert('Peringatan', 'Semua kolom wajib diisi!');
      return;
    }
    setLoading(true);
    try {
      const user = await register(namaLengkap, email, password);
      // Register selalu menuju onboarding karena user baru belum mengisi data fisik
      router.replace('/onboarding');
    } catch (error) {
      Alert.alert('Registrasi Gagal', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header logo ── */}
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Ionicons name="barbell" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>FitTracker</Text>
          </View>

          {/* ── Tombol Kembali ── */}
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#6B7280" />
            <Text style={styles.backText}>Kembali</Text>
          </Pressable>

          {/* ── Judul & Subjudul ── */}
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Mulai jadi lebih kuat.</Text>
            <Text style={styles.subtitle}>
              Buat akun dan bangun kebiasaan sehatmu bersama FitTracker.
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>
            {/* Nama pengguna */}
            <Text style={styles.fieldLabel}>Nama pengguna</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={namaLengkap}
                onChangeText={setNamaLengkap}
                placeholder="valentina mesy"
                placeholderTextColor="#9CA3AF"
              />
              <Ionicons
                name="person-outline"
                size={20}
                color="#9CA3AF"
                style={styles.inputIconRight}
              />
            </View>

            {/* Email */}
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="nama@email.com"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Ionicons
                name="mail-outline"
                size={20}
                color="#9CA3AF"
                style={styles.inputIconRight}
              />
            </View>

            {/* Kata sandi */}
            <Text style={styles.fieldLabel}>Kata sandi</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPass}
              />
              <Pressable
                onPress={() => setShowPass((s) => !s)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPass ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#9CA3AF"
                />
              </Pressable>
            </View>

            {/* Keterangan & Indikator Kata Sandi */}
            <Text style={styles.passwordHint}>
              Minimal 8 karakter, gabungkan huruf dan angka.
            </Text>
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                <Ionicons
                  name={
                    isStrongPassword
                      ? 'checkmark-circle-outline'
                      : 'information-circle-outline'
                  }
                  size={16}
                  color={isStrongPassword ? colors.primary : '#F59E0B'}
                />
                <Text
                  style={[
                    styles.strengthText,
                    { color: isStrongPassword ? colors.primary : '#F59E0B' },
                  ]}
                >
                  {isStrongPassword ? 'Kata sandi kuat' : 'Kata sandi belum kuat'}
                </Text>
              </View>
            )}

            {/* Tombol Buat akun */}
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#FFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.submitBtnText}>Buat akun</Text>
                </>
              )}
            </Pressable>

            {/* Syarat & Ketentuan */}
            <Text style={styles.termsText}>
              Dengan mendaftar, kamu menyetujui Ketentuan Layanan dan{'\n'}
              Kebijakan Privasi FitTracker.
            </Text>

            {/* Link Masuk */}
            <Pressable
              style={styles.linkButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.linkText}>
                Sudah punya akun?{' '}
                <Text style={styles.boldText}>Masuk</Text>
              </Text>
            </Pressable>

            {/* Banner Keamanan Bawah */}
            <View style={styles.privacyBanner}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={colors.primary}
                style={{ marginRight: 12 }}
              />
              <Text style={styles.privacyText}>
                Data pribadimu aman. Kamu yang menentukan perjalanan latihanmu.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, paddingBottom: 24 },

  /* ── Header Logo ── */
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },

  /* ── Tombol Kembali ── */
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },

  /* ── Judul ── */
  headerTextWrap: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  /* ── Form ── */
  form: {
    paddingHorizontal: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    height: 52,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  inputIconRight: {
    marginLeft: 8,
  },
  eyeBtn: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Password Hint & Strength ── */
  passwordHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -6,
    marginBottom: 8,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },

  /* ── Tombol Buat Akun ── */
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* ── Syarat & Link Masuk ── */
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
  },
  linkButton: {
    marginTop: 18,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#6B7280',
  },
  boldText: {
    color: colors.primary,
    fontWeight: 'bold',
  },

  /* ── Banner Keamanan ── */
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    marginTop: 22,
  },
  privacyText: {
    flex: 1,
    fontSize: 12.5,
    color: '#065F46',
    lineHeight: 18,
  },
});