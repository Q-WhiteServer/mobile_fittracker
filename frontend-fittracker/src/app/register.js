import { useState } from 'react';
import {
  Alert,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Dimensions,
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

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function RegisterScreen() {
  const { register } = useAuth();
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleRegister() {
    if (!namaLengkap || !email || !password) {
      Alert.alert('Peringatan', 'Semua kolom wajib diisi!');
      return;
    }
    setLoading(true);
    try {
      const user = await register(namaLengkap, email, password);
      Alert.alert('Berhasil', `Selamat datang, ${user.nama_lengkap}!`);
      router.replace('/home');
    } catch (error) {
      Alert.alert('Registrasi Gagal', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Hero ── */}
          <View style={styles.hero}>
            <View
              style={[
                styles.decoCircle,
                { top: -40, right: -30, width: 140, height: 140, opacity: 0.15 },
              ]}
            />
            <View
              style={[
                styles.decoCircle,
                { bottom: 18, left: -50, width: 120, height: 120, opacity: 0.1 },
              ]}
            />
            <View style={styles.heroBadge}>
              <Ionicons name="barbell" size={56} color="#FFFFFF" />
            </View>
            <Text style={styles.heroBrand}>FitTracker</Text>
            <Text style={styles.heroTagline}>Mulai perjalanan fitness Anda</Text>
          </View>

          {/* ── Form card ── */}
          <View style={styles.card}>
            <Text style={styles.welcomeTitle}>Buat Akun Baru</Text>
            <Text style={styles.welcomeSubtitle}>
              Daftar untuk melacak progres latihan Anda
            </Text>

            {/* Nama Lengkap */}
            <Text style={styles.fieldLabel}>Nama Lengkap</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={namaLengkap}
                onChangeText={setNamaLengkap}
                placeholder="Nama lengkap Anda"
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Email */}
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="nama@email.com"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password */}
            <Text style={styles.fieldLabel}>Kata Sandi</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPass}
              />
              <Pressable
                onPress={() => setShowPass((s) => !s)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </View>

            {/* Register button */}
            <Pressable
              style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.85 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Daftar</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFF"
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </Pressable>

            {/* Login link */}
            <Pressable
              style={styles.linkButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.linkText}>
                Sudah punya akun?{' '}
                <Text style={styles.boldText}>Masuk</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1 },

  /* Hero */
  hero: {
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 36,
    overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  heroBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroBrand: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
  },

  /* Form card */
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingHorizontal: 26,
    paddingTop: 30,
    paddingBottom: 30,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: colors.muted,
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 22,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
    height: 54,
  },
  inputIcon: {
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 15,
    color: colors.muted,
  },
  boldText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
