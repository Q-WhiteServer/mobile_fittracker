import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/ui';

// Arahkan pengguna berdasarkan status sesi: ke beranda jika sudah login,
// atau ke layar masuk jika belum.
export default function Index() {
  const { token, loading } = useAuth();
  if (loading) return <Loading />;
  return token ? <Redirect href="/home" /> : <Redirect href="/login" />;
}
