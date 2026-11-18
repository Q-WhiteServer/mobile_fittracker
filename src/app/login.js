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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Peringatan', 'Email dan kata sandi wajib diisi!');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      Alert.alert('Berhasil', `Selamat datang, ${user.nama_lengkap}!`);
      router.replace('/home');
    } catch (error) {
      Alert.alert('Login Gagal', error.message);
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
          {/* ── Logo row ── */}
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Ionicons name="fitness" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>FitTracker</Text>
          </View>

          {/* ── Hero banner — foto saja, teks sudah ada di dalam gambar ── */}
          <View style={styles.heroBanner}>
            <Image
              source={require('../../assets/hero-login.jpg')}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>

            {/* Email */}
            <Text style={styles.fieldLabel}>Email atau nama pengguna</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="nama@email.com"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.muted}
                style={styles.inputIconRight}
              />
            </View>

            {/* Password */}
            <Text style={styles.fieldLabel}>Kata sandi</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPass}
              />
              <Pressable onPress={() => setShowPass((s) => !s)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPass ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </View>

            {/* Checkbox + Lupa kata sandi */}
            <View style={styles.checkRow}>
              <Pressable
                style={styles.checkboxRow}
                onPress={() => setShowPass((s) => !s)}
              >
                <View style={[styles.checkbox, showPass && styles.checkboxChecked]}>
                  {showPass && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>Tampilkan sandi</Text>
              </Pressable>
              <Pressable>
                <Text style={styles.forgotText}>Lupa kata sandi?</Text>
              </Pressable>
            </View>

            {/* Tombol Masuk */}
            <Pressable
              style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.85 }]}
              onPress={handleLogin}
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
                  <Text style={styles.loginBtnText}>Masuk</Text>
                </>
              )}
            </Pressable>

            {/* Link daftar */}
            <Pressable
              style={styles.linkButton}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.linkText}>
                Belum punya akun?{' '}
                <Text style={styles.boldText}>Daftar sekarang</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1 },

  /* ── Logo row ── */
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },

  /* ── Hero banner ── */
  heroBanner: {
    height: SCREEN_HEIGHT * 0.28,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  /* ── Form ── */
  form: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    height: 52,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
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

  /* ── Checkbox row ── */
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
    marginTop: -4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  forgotText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },

  /* ── Tombol Masuk ── */
  loginBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* ── Link daftar ── */
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: colors.muted,
  },
  boldText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
