/**
 * timer.js — Latihan Aktif: Circuit Training
 *
 * Konsep: Satu sesi = beberapa gerakan (mis. Plank, Sit Up, Bicycle)
 * diulang beberapa putaran (round). Setiap gerakan dicatat secara
 * individual, timer istirahat berjalan di antara gerakan/putaran.
 *
 * Params (dari router.push):
 *   exercises   — JSON string array: [{nama, reps, durasi}]
 *   total_round — jumlah putaran (default: 3)
 *   rest_sec    — detik istirahat antar gerakan (default: 45)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Pressable, TextInput, ScrollView,
  StyleSheet, Alert, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Palet ─────────────────────────────────────────────────────────────────────
const TEAL    = '#0F766E';
const TEAL_L  = '#99F6E4';
const GREEN   = '#10B981';
const GREEN_LL= '#ECFDF5';
const GREEN_L = '#D1FAE5';
const BORDER  = '#E5E7EB';
const TEXT    = '#111827';
const MUTED   = '#6B7280';
const WHITE   = '#FFFFFF';
const BG      = '#F9FAFB';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(s) {
  const m = Math.floor(Math.abs(s) / 60);
  const r = Math.abs(s) % 60;
  return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
}

// Circular progress ring (pure View)
function ProgressRing({ progress = 0, size = 72, stroke = 5 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke, borderColor: 'rgba(255,255,255,0.2)',
      }} />
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke,
        borderTopColor:    progress >= 0.25 ? TEAL_L : 'transparent',
        borderRightColor:  progress >= 0.50 ? TEAL_L : 'transparent',
        borderBottomColor: progress >= 0.75 ? TEAL_L : 'transparent',
        borderLeftColor:   progress >= 0.01 ? TEAL_L : 'transparent',
        transform: [{ rotate: `${-90 + progress * 360}deg` }],
      }} />
      <Ionicons name="stopwatch-outline" size={size * 0.38} color={WHITE} />
    </View>
  );
}

// ── Default gerakan jika tidak ada params ─────────────────────────────────────
const DEFAULT_EXERCISES = [
  { nama: 'Plank',         reps: 30, durasi: 30 },
  { nama: 'Sit Up',        reps: 15, durasi: 0  },
  { nama: 'Bicycle Crunch',reps: 20, durasi: 0  },
];

// ═══════════════════════════════════════════════════════════════════════════════
export default function TimerScreen() {
  const params = useLocalSearchParams();

  // Parse daftar gerakan dari params atau pakai default
  const exercises = (() => {
    try {
      const parsed = JSON.parse(params.exercises || '[]');
      return parsed.length > 0 ? parsed : DEFAULT_EXERCISES;
    } catch {
      return DEFAULT_EXERCISES;
    }
  })();

  const totalRound  = Math.max(1, Number(params.total_round) || 3);
  const restDefault = Math.max(5,  Number(params.rest_sec)   || 45);

  // ── State ─────────────────────────────────────────────────────────────────────
  const [elapsed,    setElapsed]    = useState(0);
  const [running,    setRunning]    = useState(true);
  const [isResting,  setIsResting]  = useState(false);
  const [restLeft,   setRestLeft]   = useState(restDefault);
  const [restTotal,  setRestTotal]  = useState(restDefault);

  // Posisi saat ini: putaran ke-X, gerakan ke-Y
  const [curRound,   setCurRound]   = useState(1);
  const [curExIdx,   setCurExIdx]   = useState(0);  // index dalam exercises[]

  // Catatan per [round][exIdx]: { reps: string, beban: string, saved: bool }
  const makeLog = () =>
    Array.from({ length: totalRound }, () =>
      exercises.map((ex) => ({ reps: String(ex.reps || 12), beban: '', saved: false }))
    );
  const [log, setLog] = useState(makeLog);

  // Input panel
  const [inputReps,  setInputReps]  = useState('');
  const [inputBeban, setInputBeban] = useState('');

  // Modal timer
  const [showEditTimer,  setShowEditTimer]  = useState(false);
  const [editTimerInput, setEditTimerInput] = useState('');

  // Refs
  const runningRef  = useRef(running);
  const restingRef  = useRef(isResting);
  const restLeftRef = useRef(restLeft);
  runningRef.current  = running;
  restingRef.current  = isResting;
  restLeftRef.current = restLeft;

  // ── Reset saat fokus ──────────────────────────────────────────────────────────
  useFocusEffect(useCallback(() => {
    setElapsed(0);
    setRunning(true);
    setIsResting(false);
    setRestLeft(restDefault);
    setRestTotal(restDefault);
    setCurRound(1);
    setCurExIdx(0);
    const freshLog = makeLog();
    setLog(freshLog);
    syncInput(freshLog, 0, 0);
    return () => setRunning(false);
  }, []));

  // ── Interval ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed((e) => e + 1);
      if (restingRef.current) {
        const cur = restLeftRef.current;
        if (cur > 1) {
          setRestLeft((r) => r - 1);
        } else {
          setIsResting(false);
          setRestLeft(restDefault);
          setRestTotal(restDefault);
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, restDefault]);

  // ── Sinkron input saat posisi berubah ─────────────────────────────────────────
  function syncInput(currentLog, rIdx, eIdx) {
    const entry = currentLog[rIdx]?.[eIdx];
    if (entry) {
      setInputReps(entry.reps  || String(exercises[eIdx]?.reps || 12));
      setInputBeban(entry.beban || '');
    }
  }

  useEffect(() => {
    syncInput(log, curRound - 1, curExIdx);
  }, [curRound, curExIdx]);

  // ── Navigasi gerakan ──────────────────────────────────────────────────────────
  function pindahKe(round, exIdx) {
    setCurRound(round);
    setCurExIdx(exIdx);
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  function togglePause() { setRunning((r) => !r); }

  function tambahWaktu() {
    setRestLeft((r) => r + 15);
    setRestTotal((t) => t + 15);
  }

  function lewatiIstirahat() {
    setIsResting(false);
    setRestLeft(restDefault);
    setRestTotal(restDefault);
  }

  function bukaEditTimer() {
    setEditTimerInput(String(restLeft > 0 ? restLeft : restDefault));
    setRunning(false);
    setShowEditTimer(true);
  }

  function simpanEditTimer() {
    const val = parseInt(editTimerInput, 10);
    if (isNaN(val) || val < 1) {
      Alert.alert('Peringatan', 'Masukkan detik yang valid (min 1).');
      return;
    }
    setRestLeft(val);
    setRestTotal(val);
    setIsResting(true);
    setRunning(true);
    setShowEditTimer(false);
  }

  async function simpanGerakan() {
    const rIdx = curRound - 1;
    const eIdx = curExIdx;

    const updated = log.map((roundArr, ri) =>
      roundArr.map((entry, ei) =>
        ri === rIdx && ei === eIdx
          ? { ...entry, reps: inputReps, beban: inputBeban, saved: true }
          : entry
      )
    );
    setLog(updated);

    // Simpan ke AsyncStorage
    try {
      await AsyncStorage.setItem(
        `@fittracker_circuit_${Date.now()}`,
        JSON.stringify({
          nama: exercises[eIdx]?.nama,
          round: curRound, gerakan: eIdx + 1,
          reps: inputReps, beban: inputBeban,
          savedAt: new Date().toISOString(),
        })
      );
    } catch { /* offline aman */ }

    // Cari gerakan berikutnya yang belum disimpan
    let nextRound = curRound, nextEx = eIdx + 1;
    if (nextEx >= exercises.length) { nextRound += 1; nextEx = 0; }

    if (nextRound > totalRound) {
      // Semua selesai
      Alert.alert('Selesai! 🎉', `${totalRound} putaran × ${exercises.length} gerakan tuntas!`, [
        { text: 'Kembali', onPress: () => router.back() },
      ]);
      return;
    }

    // Istirahat lalu lanjut
    setIsResting(true);
    setRestLeft(restDefault);
    setRestTotal(restDefault);
    pindahKe(nextRound, nextEx);
  }

  // ── Kalkulasi progress ────────────────────────────────────────────────────────
  const totalItems    = totalRound * exercises.length;
  const savedItems    = log.flat().filter((e) => e.saved).length;
  const overallProgress = totalItems > 0 ? savedItems / totalItems : 0;
  const restProgress    = isResting && restTotal > 0 ? (restTotal - restLeft) / restTotal : 0;

  const curEx    = exercises[curExIdx] || {};
  const curEntry = log[curRound - 1]?.[curExIdx] || {};

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── App Bar ── */}
        <View style={s.appBar}>
          <Pressable onPress={() => router.back()} style={s.appBarBack}>
            <Ionicons name="arrow-back" size={22} color={TEXT} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.appBarTitle}>Latihan Circuit</Text>
            <Text style={s.appBarSub} numberOfLines={1}>
              {curEx.nama} • {fmt(elapsed)} berjalan
            </Text>
          </View>
          <Pressable style={s.pauseBtn} onPress={togglePause}>
            <Ionicons name={running ? 'pause' : 'play'} size={18} color={TEXT} />
          </Pressable>
        </View>

        {/* ── Progress Overall ── */}
        <View style={s.progressWrap}>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>
              Putaran {curRound}/{totalRound} · Gerakan {curExIdx + 1}/{exercises.length}
            </Text>
            <Text style={s.progressCount}>{savedItems}/{totalItems} selesai</Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${Math.round(overallProgress * 100)}%` }]} />
          </View>
        </View>

        {/* ── Kartu Gerakan Aktif ── */}
        <View style={s.activeCard}>
          <View style={s.activeCardLeft}>
            <View style={s.activeIconBox}>
              <Ionicons name="fitness-outline" size={28} color={GREEN} />
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.activeName}>{curEx.nama}</Text>
            <Text style={s.activeTarget}>
              Target: {curEx.reps} {curEx.durasi > 0 ? 'detik' : 'repetisi'}
            </Text>
            <View style={s.badgeRow}>
              <View style={s.badgeRound}>
                <Text style={s.badgeRoundTxt}>Putaran {curRound}</Text>
              </View>
              {curEntry.saved && (
                <View style={s.badgeSaved}>
                  <Ionicons name="checkmark" size={11} color={GREEN} />
                  <Text style={s.badgeSavedTxt}>Tersimpan</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Daftar Gerakan (chip scroll horizontal) ── */}
        <View style={s.exListWrap}>
          <Text style={s.exListLabel}>Urutan gerakan:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {exercises.map((ex, ei) => {
              const isActive = ei === curExIdx;
              const isSaved  = log[curRound - 1]?.[ei]?.saved;
              return (
                <Pressable
                  key={ei}
                  style={[s.exChip, isActive && s.exChipActive, isSaved && s.exChipSaved]}
                  onPress={() => pindahKe(curRound, ei)}
                >
                  {isSaved && <Ionicons name="checkmark-circle" size={13} color={GREEN} style={{ marginRight: 4 }} />}
                  <Text style={[s.exChipTxt, isActive && s.exChipTxtActive]}>
                    {ei + 1}. {ex.nama}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Kartu Timer Istirahat ── */}
        <View style={s.timerCard}>
          <ProgressRing progress={isResting ? 1 - restProgress : 0} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={s.timerLabel}>
              {isResting ? `ISTIRAHAT • DARI ${restTotal} DETIK` : 'SIAP MELANJUTKAN'}
            </Text>
            <Pressable onPress={bukaEditTimer} style={s.timerCountdownBtn}>
              <Text style={s.timerCountdown}>
                {isResting ? fmt(restLeft) : '00:00'}
              </Text>
              <Ionicons name="pencil-outline" size={13} color={TEAL_L} style={{ marginLeft: 6, marginTop: 8 }} />
            </Pressable>
            <View style={s.timerActions}>
              {isResting && (
                <Pressable style={s.timerActionBtn} onPress={tambahWaktu}>
                  <Text style={s.timerActionTxt}>+15 detik</Text>
                </Pressable>
              )}
              <Pressable style={s.timerSkipBtn} onPress={lewatiIstirahat}>
                <Text style={s.timerSkipTxt}>
                  {isResting ? 'Lewati istirahat' : 'Mulai gerakan'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Panel Catat Set ── */}
        <View style={s.panel}>
          <View style={s.panelHandle} />
          <View style={s.panelHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.panelTitle}>Catat gerakan</Text>
              <Text style={s.panelSub} numberOfLines={2}>
                {curEx.nama} · Putaran {curRound} dari {totalRound}
              </Text>
            </View>
            <Pressable onPress={() => router.back()} style={s.closeBtn}>
              <Ionicons name="close" size={20} color={MUTED} />
            </Pressable>
          </View>

          {/* Tabel semua gerakan putaran ini */}
          <View style={s.tableHeader}>
            {['No','Gerakan','Rep/Durasi','Status'].map((h) => (
              <Text key={h} style={[s.tableHead, h === 'Gerakan' && { flex: 2 }]}>{h}</Text>
            ))}
          </View>
          {exercises.map((ex, ei) => {
            const entry = log[curRound - 1]?.[ei] || {};
            const isAct = ei === curExIdx;
            const st    = entry.saved ? 'saved' : isAct ? 'active' : 'next';
            return (
              <Pressable
                key={ei}
                style={[s.tableRow, isAct && s.tableRowActive]}
                onPress={() => pindahKe(curRound, ei)}
              >
                <Text style={[s.tableCell, s.tableCellNum]}>{ei + 1}</Text>
                <Text style={[s.tableCell, { flex: 2 }]} numberOfLines={1}>{ex.nama}</Text>
                <Text style={s.tableCell}>
                  {entry.reps || ex.reps} {ex.durasi > 0 ? 'dtk' : 'rep'}
                  {entry.beban ? ` · ${entry.beban}kg` : ''}
                </Text>
                <Text style={[s.tableCell,
                  st === 'saved'  && s.statusSaved,
                  st === 'active' && s.statusActive,
                  st === 'next'   && s.statusNext,
                ]}>
                  {st === 'saved' ? '✓ Simpan' : st === 'active' ? 'Dicatat' : 'Berikutnya'}
                </Text>
              </Pressable>
            );
          })}

          {/* Pemilihan putaran */}
          <View style={s.roundPickerRow}>
            <Text style={s.roundPickerLabel}>Putaran:</Text>
            {Array.from({ length: totalRound }, (_, i) => i + 1).map((r) => {
              const roundSaved = log[r - 1]?.every((e) => e.saved);
              return (
                <Pressable
                  key={r}
                  style={[s.roundChip, r === curRound && s.roundChipActive, roundSaved && s.roundChipDone]}
                  onPress={() => pindahKe(r, curExIdx)}
                >
                  {roundSaved
                    ? <Ionicons name="checkmark" size={13} color={GREEN} />
                    : <Text style={[s.roundChipTxt, r === curRound && s.roundChipTxtActive]}>{r}</Text>
                  }
                </Pressable>
              );
            })}
          </View>

          {/* Input */}
          <View style={s.inputRow}>
            <View style={s.inputWrap}>
              <TextInput
                style={s.inputField}
                value={inputReps}
                onChangeText={setInputReps}
                keyboardType="numeric"
                placeholder={String(curEx.reps || 12)}
                placeholderTextColor={MUTED}
              />
              <Text style={s.inputUnit}>{curEx.durasi > 0 ? 'dtk' : 'rep'}</Text>
              <View style={s.inputCheck}>
                <Ionicons name="checkmark" size={12} color={GREEN} />
              </View>
            </View>
            <View style={s.inputWrap}>
              <TextInput
                style={s.inputField}
                value={inputBeban}
                onChangeText={setInputBeban}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={MUTED}
              />
              <Text style={s.inputUnit}>kg</Text>
              <View style={s.inputCheck}>
                <Ionicons name="checkmark" size={12} color={GREEN} />
              </View>
            </View>
          </View>

          <Pressable style={s.saveBtn} onPress={simpanGerakan}>
            <Ionicons name="checkmark" size={18} color={WHITE} style={{ marginRight: 8 }} />
            <Text style={s.saveTxt}>
              Simpan · {curEx.nama} Putaran {curRound}
            </Text>
          </Pressable>

          <View style={s.offlineRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color={GREEN} />
            <Text style={s.offlineTxt}>Langsung tersimpan, meski tanpa internet</Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Modal Edit Timer ── */}
      <Modal visible={showEditTimer} transparent animationType="fade" onRequestClose={() => setShowEditTimer(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowEditTimer(false)} />
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>Atur Durasi Istirahat</Text>
          <Text style={s.modalSub}>Masukkan jumlah detik yang diinginkan.</Text>
          <View style={s.presetRow}>
            {[15, 30, 45, 60, 90, 120].map((sec) => (
              <Pressable
                key={sec}
                style={[s.presetBtn, editTimerInput === String(sec) && s.presetBtnActive]}
                onPress={() => setEditTimerInput(String(sec))}
              >
                <Text style={[s.presetTxt, editTimerInput === String(sec) && s.presetTxtActive]}>
                  {sec < 60 ? `${sec}d` : `${sec / 60}m`}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={s.modalInputWrap}>
            <TextInput
              style={s.modalInput}
              value={editTimerInput}
              onChangeText={setEditTimerInput}
              keyboardType="numeric"
              placeholder="45"
              placeholderTextColor={MUTED}
              autoFocus
              selectTextOnFocus
            />
            <Text style={s.modalInputUnit}>detik</Text>
          </View>
          <Pressable style={s.modalSaveBtn} onPress={simpanEditTimer}>
            <Ionicons name="checkmark" size={18} color={WHITE} style={{ marginRight: 8 }} />
            <Text style={s.modalSaveTxt}>Mulai Timer</Text>
          </Pressable>
          <Pressable style={s.modalCancelBtn} onPress={() => setShowEditTimer(false)}>
            <Text style={s.modalCancelTxt}>Batal</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 48 },

  /* App bar */
  appBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  appBarBack:  { padding: 4 },
  appBarTitle: { fontSize: 15, fontWeight: '700', color: TEXT },
  appBarSub:   { fontSize: 12, color: MUTED, marginTop: 1 },
  pauseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },

  /* Progress bar */
  progressWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  progressRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel:{ fontSize: 13, fontWeight: '600', color: TEXT },
  progressCount:{ fontSize: 12, color: GREEN, fontWeight: '700' },
  progressBg:   { height: 6, backgroundColor: BORDER, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: GREEN, borderRadius: 3 },

  /* Kartu gerakan aktif */
  activeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 16,
    marginHorizontal: 16, marginBottom: 12,
    padding: 16, borderWidth: 1, borderColor: BORDER,
  },
  activeCardLeft:{ },
  activeIconBox: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: GREEN_LL, alignItems: 'center', justifyContent: 'center',
  },
  activeName:   { fontSize: 18, fontWeight: 'bold', color: TEXT, marginBottom: 2 },
  activeTarget: { fontSize: 13, color: MUTED, marginBottom: 8 },
  badgeRow:     { flexDirection: 'row', gap: 8 },
  badgeRound: {
    backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 999,
  },
  badgeRoundTxt:  { fontSize: 12, fontWeight: '600', color: '#0369A1' },
  badgeSaved: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: GREEN_LL, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 999, gap: 3,
  },
  badgeSavedTxt:  { fontSize: 12, fontWeight: '600', color: GREEN },

  /* Chip gerakan horizontal */
  exListWrap:  { paddingHorizontal: 16, marginBottom: 12 },
  exListLabel: { fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: '500' },
  exChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: WHITE, marginRight: 8,
  },
  exChipActive:   { borderColor: GREEN, backgroundColor: GREEN_LL },
  exChipSaved:    { borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' },
  exChipTxt:      { fontSize: 12, fontWeight: '600', color: MUTED },
  exChipTxtActive:{ color: GREEN },

  /* Timer card */
  timerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: TEAL, borderRadius: 16,
    marginHorizontal: 16, marginBottom: 16, padding: 18,
  },
  timerLabel: {
    fontSize: 10, fontWeight: '700', color: TEAL_L,
    letterSpacing: 0.6, marginBottom: 4,
  },
  timerCountdownBtn: { flexDirection: 'row', alignItems: 'flex-start' },
  timerCountdown: { fontSize: 40, fontWeight: 'bold', color: WHITE, letterSpacing: 1 },
  timerActions:   { flexDirection: 'row', marginTop: 10, gap: 10 },
  timerActionBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
  },
  timerActionTxt: { fontSize: 12, color: WHITE, fontWeight: '600' },
  timerSkipBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20,
  },
  timerSkipTxt: { fontSize: 12, color: WHITE, fontWeight: '700' },

  /* Panel */
  panel: {
    backgroundColor: WHITE, borderRadius: 20,
    marginHorizontal: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  panelHandle: {
    width: 40, height: 4, backgroundColor: BORDER,
    borderRadius: 2, alignSelf: 'center', marginBottom: 14,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  panelTitle:  { fontSize: 15, fontWeight: '700', color: TEXT },
  panelSub:    { fontSize: 12, color: MUTED, marginTop: 2 },
  closeBtn:    { padding: 4 },

  /* Tabel */
  tableHeader: {
    flexDirection: 'row', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: BORDER, marginBottom: 2,
  },
  tableHead: {
    flex: 1, fontSize: 10, fontWeight: '700',
    color: MUTED, textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    borderRadius: 8,
  },
  tableRowActive: { backgroundColor: GREEN_LL, paddingHorizontal: 6 },
  tableCell:      { flex: 1, fontSize: 12, color: TEXT },
  tableCellNum:   { fontWeight: '700' },
  statusSaved:    { color: '#6B7280', fontSize: 11 },
  statusActive:   { color: GREEN,     fontSize: 11, fontWeight: '700' },
  statusNext:     { color: MUTED,     fontSize: 11 },

  /* Pemilihan putaran */
  roundPickerRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 14, marginBottom: 4, gap: 8,
  },
  roundPickerLabel: { fontSize: 12, color: MUTED, fontWeight: '600' },
  roundChip: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center',
  },
  roundChipActive:  { borderColor: GREEN, backgroundColor: GREEN_LL },
  roundChipDone:    { borderColor: GREEN_L, backgroundColor: GREEN_L },
  roundChipTxt:     { fontSize: 13, fontWeight: '700', color: MUTED },
  roundChipTxtActive:{ color: GREEN },

  /* Input */
  inputRow: { flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 14 },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 12, paddingHorizontal: 10,
    height: 52, backgroundColor: '#F9FAFB',
  },
  inputField: { flex: 1, fontSize: 20, fontWeight: 'bold', color: TEXT },
  inputUnit:  { fontSize: 13, color: MUTED, marginRight: 6 },
  inputCheck: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: GREEN,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Save */
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: GREEN, height: 52, borderRadius: 14, marginBottom: 10,
  },
  saveTxt: { color: WHITE, fontSize: 15, fontWeight: 'bold' },

  /* Offline */
  offlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  offlineTxt: { fontSize: 12, color: MUTED },

  /* Modal */
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: BORDER,
    borderRadius: 2, alignSelf: 'center', marginBottom: 18,
  },
  modalTitle:  { fontSize: 18, fontWeight: 'bold', color: TEXT, marginBottom: 4 },
  modalSub:    { fontSize: 13, color: MUTED, marginBottom: 16 },
  presetRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  presetBtn: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 999, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: '#F9FAFB',
  },
  presetBtnActive: { backgroundColor: GREEN_LL, borderColor: GREEN },
  presetTxt:       { fontSize: 13, fontWeight: '600', color: MUTED },
  presetTxtActive: { color: GREEN },
  modalInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, height: 54, marginBottom: 18,
    backgroundColor: '#F9FAFB',
  },
  modalInput:     { flex: 1, fontSize: 22, fontWeight: 'bold', color: TEXT },
  modalInputUnit: { fontSize: 15, color: MUTED, marginLeft: 8 },
  modalSaveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: GREEN, height: 52, borderRadius: 14, marginBottom: 10,
  },
  modalSaveTxt:   { color: WHITE, fontSize: 16, fontWeight: 'bold' },
  modalCancelBtn: { alignItems: 'center', paddingVertical: 8 },
  modalCancelTxt: { fontSize: 14, color: MUTED },
});
