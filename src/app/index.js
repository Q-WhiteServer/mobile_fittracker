import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/ui';
import { KEYS } from '../storage';

// Arahkan pengguna:
// - Belum login            → /login
// - Sudah login, belum onboarding → /onboarding
// - Sudah login, sudah onboarding → /home
export default function Index() {
  const { token, loading } = useAuth();
  const [checkingOnboard, setCheckingOnboard] = useState(true);
  const [onboardDone, setOnboardDone]         = useState(false);

  useEffect(() => {
    if (!loading && token) {
      AsyncStorage.getItem(KEYS.ONBOARDING).then((val) => {
        setOnboardDone(val === 'true');
        setCheckingOnboard(false);
      });
    } else if (!loading) {
      setCheckingOnboard(false);
    }
  }, [loading, token]);

  if (loading || checkingOnboard) return <Loading />;
  if (!token) return <Redirect href="/login" />;
  if (!onboardDone) return <Redirect href="/onboarding" />;
  return <Redirect href="/home" />;
}
