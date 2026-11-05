import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Field, Button } from '../components/ui';
import { colors, typography } from '../theme';

// Timer sesi latihan otomatis (US-08): siklus kerja & istirahat real-time.
export default function TimerScreen() {
  const { nama, durasi } = useLocalSearchParams();
  const initialWork = Number(durasi) > 0 ? Number(durasi) : 30;

  const [workSec, setWorkSec] = useState(String(initialWork));
  const [restSec, setRestSec] = useState('15');
  const [mode, setMode] = useState('work'); // 'work' | 'rest'
  const [left, setLeft] = useState(initialWork);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(1);

  // Refs agar interval membaca nilai terkini tanpa setState bersarang.
  const modeRef = useRef(mode);
  const leftRef = useRef(left);
  const workRef = useRef(workSec);
  const restRef = useRef(restSec);
  modeRef.current = mode;
  leftRef.current = left;
  workRef.current = workSec;
  restRef.current = restSec;

  // Reset saat layar difokuskan ulang dengan parameter baru.
  useFocusEffect(
    useCallback(() => {
      setMode('work');
      setLeft(initialWork);
      setRunning(false);
      setRound(1);
      return () => setRunning(false);
    }, [initialWork])
  );

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const cur = leftRef.current;
      if (cur > 1) {
        setLeft(cur - 1);
        return;
      }
      // Waktu habis -> ganti fase.
      const m = modeRef.current;
      if (m === 'work') {
        setMode('rest');
        setLeft(Number(restRef.current) || 15);
      } else {
        setMode('work');
        setRound((r) => r + 1);
        setLeft(Number(workRef.current) || 30);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  function start() {
    if (left <= 0) setLeft(mode === 'work' ? Number(workSec) || 30 : Number(restSec) || 15);
    setRunning(true);
  }
  function pause() {
    setRunning(false);
  }
  function reset() {
    setRunning(false);
    setMode('work');
    setRound(1);
    setLeft(Number(workSec) || 30);
  }
  function applyDurations() {
    setRunning(false);
    setMode('work');
    setRound(1);
    setLeft(Number(workSec) || 30);
  }

  const total = mode === 'work' ? Number(workSec) || 30 : Number(restSec) || 15;
  const progress = total > 0 ? (total - left) / total : 0;
  const isWork = mode === 'work';

  return (
    <Screen scroll={false} style={{ flex: 1 }}>
      <View style={{ paddingTop: 8 }}>
        <Text style={typography.title}>{nama ? `Latihan: ${nama}` : 'Timer Latihan'}</Text>
        <Text style={typography.subtitle}>Atur sesi kerja & istirahat secara real-time.</Text>
      </View>

      <View style={styles.timerWrap}>
        <View style={[styles.ring, { borderColor: isWork ? colors.primary : colors.accent }]}>
          <Text style={styles.modeText}>{isWork ? 'KERJA' : 'ISTIRAHAT'}</Text>
          <Text style={styles.countdown}>{formatTime(left)}</Text>
          <Text style={typography.muted}>Ronde {round}</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: isWork ? colors.primary : colors.accent }]} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
        {running ? (
          <Pressable style={styles.ctrl} onPress={pause}>
            <Ionicons name="pause" size={28} color={colors.card} />
            <Text style={styles.ctrlText}>Jeda</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.ctrl} onPress={start}>
            <Ionicons name="play" size={28} color={colors.card} />
            <Text style={styles.ctrlText}>Mulai</Text>
          </Pressable>
        )}
        <Pressable style={[styles.ctrl, { backgroundColor: colors.muted, marginLeft: 16 }]} onPress={reset}>
          <Ionicons name="refresh" size={26} color={colors.card} />
          <Text style={styles.ctrlText}>Reset</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 24 }}>
        <Text style={typography.section}>Atur Durasi</Text>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={typography.label}>Kerja (detik)</Text>
            <Field value={workSec} onChangeText={setWorkSec} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.label}>Istirahat (detik)</Text>
            <Field value={restSec} onChangeText={setRestSec} keyboardType="numeric" />
          </View>
        </View>
        <Button title="Terapkan" variant="outline" onPress={applyDurations} />
      </View>
    </Screen>
  );
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  timerWrap: { alignItems: 'center', marginTop: 20 },
  ring: { width: 220, height: 220, borderRadius: 110, borderWidth: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  modeText: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2, color: colors.muted },
  countdown: { fontSize: 52, fontWeight: 'bold', color: colors.text, marginVertical: 2 },
  barBg: { width: '100%', height: 8, borderRadius: 4, backgroundColor: colors.border, marginTop: 18, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  ctrl: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  ctrlText: { color: colors.card, fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
});
