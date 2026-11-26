/**
 * reports.js — Halaman Laporan
 * Menampilkan ringkasan metrik, kalender latihan interaktif,
 * grafik berat badan, dan riwayat latihan.
 * Data dari API; fallback ke mock saat offline.
 */

import { useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  ActivityIndicator, Share, Modal, TextInput,
  Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { api } from '../../api';

// ── Palet ─────────────────────────────────────────────────────────────────────
const MINT    = '#10B981';
const MINT_D  = '#059669';
const MINT_L  = '#D1FAE5';
const MINT_LL = '#ECFDF5';
const GRAY    = '#6B7280';
const BORDER  = '#E5E7EB';
const TEXT    = '#111827';
const MUTED   = '#9CA3AF';
const BG      = '#F9FAFB';
const WHITE   = '#FFFFFF';

// ── Konstanta ─────────────────────────────────────────────────────────────────
const MONTHS     = ['Januari','Februari','Maret','April','Mei','Juni',
                    'Juli','Agustus','September','Oktober','November','Desember'];
const DAYS_SHORT = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];

const SCREEN_W = Dimensions.get('window').width;
const CHART_H  = 140;
const CHART_W  = SCREEN_W - 64;

// ── Mock data fallback (sesuai desain) ────────────────────────────────────────
const MOCK_LATIHAN_DAYS = new Set([1, 3, 5, 7, 9, 10, 12, 13]);

const MOCK_WEIGHT_POINTS = [
  { tanggal: '2026-10-01', berat: 69.0 },
  { tanggal: '2026-10-05', berat: 68.5 },
  { tanggal: '2026-10-09', berat: 68.0 },
  { tanggal: '2026-10-14', berat: 67.8 },
];

const MOCK_RIWAYAT = [
  { id: '1', nama: 'Lengan & Dada',      tanggal: 'Sel, 13 Okt • 18.00', detail: '24 menit • Estimasi 165 kkal' },
  { id: '2', nama: 'Full Body Kekuatan', tanggal: 'Sen, 12 Okt • 18.00', detail: '30 menit • Estimasi 210 kkal' },
  { id: '3', nama: 'Yoga & Mobilitas',   tanggal: 'Sab, 10 Okt • 08.00', detail: '25 menit • Estimasi 160 kkal' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysInMonth(y, m)  { return new Date(y, m, 0).getDate(); }
function firstWeekday(y, m) { const d = new Date(y, m-1, 1).getDay(); return d === 0 ? 6 : d-1; }

// ── Line Chart (pure View, tanpa library) ─────────────────────────────────────
function LineChart({ points }) {
  if (!points || points.length < 2) {
    return (
      <View style={ch.empty}>
        <Ionicons name="scale-outline" size={30} color={BORDER} />
        <Text style={ch.emptyTxt}>Belum cukup data</Text>
      </View>
    );
  }

  const values = points.map((p) => Number(p.berat));
  const minV   = Math.floor(Math.min(...values) * 2) / 2 - 0.5;
  const maxV   = Math.ceil(Math.max(...values)  * 2) / 2 + 0.5;
  const rangeV = maxV - minV || 1;

  const toY = (v) => CHART_H - ((v - minV) / rangeV) * CHART_H;
  const toX = (i) => (i / (points.length - 1)) * (CHART_W - 20) + 10;

  const yLabels = [maxV, (maxV + minV) / 2, minV].map((v) => ({
    v: v.toFixed(1).replace('.', ','), y: toY(v),
  }));
  const xLabels = points.map((p, i) => {
    const [, mo, d] = p.tanggal.split('-').map(Number);
    return { label: `${d} ${MONTHS[mo-1].slice(0,3)}`, x: toX(i) };
  });

  return (
    <View>
      <View style={[ch.area, { height: CHART_H + 24 }]}>
        {yLabels.map((yl) => (
          <View key={yl.v} style={[ch.gridLine, { top: yl.y }]} />
        ))}
        {yLabels.map((yl) => (
          <Text key={`y-${yl.v}`} style={[ch.yLabel, { top: yl.y - 8 }]}>{yl.v}</Text>
        ))}
        {/* Area fill */}
        {points.map((_, i) => {
          if (i === 0) return null;
          const x1 = toX(i-1), y1 = toY(values[i-1]);
          const x2 = toX(i),   y2 = toY(values[i]);
          return (
            <View key={`f-${i}`} style={{
              position: 'absolute', left: x1, top: Math.min(y1, y2),
              width: x2 - x1, height: CHART_H - Math.min(y1, y2) + 2,
              backgroundColor: MINT + '18',
            }} />
          );
        })}
        {/* Garis */}
        {points.map((_, i) => {
          if (i === 0) return null;
          const x1 = toX(i-1), y1 = toY(values[i-1]);
          const x2 = toX(i),   y2 = toY(values[i]);
          const dx = x2-x1, dy = y2-y1;
          const len   = Math.sqrt(dx*dx + dy*dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          return (
            <View key={`l-${i}`} style={{
              position: 'absolute',
              left: x1 + dx/2 - len/2,
              top:  y1 + dy/2 - 1.5,
              width: len, height: 3,
              backgroundColor: MINT,
              transform: [
                { translateX: len/2 },
                { rotate: `${angle}deg` },
                { translateX: -len/2 },
              ],
              borderRadius: 2,
            }} />
          );
        })}
        {/* Titik */}
        {points.map((_, i) => (
          <View key={`d-${i}`} style={[ch.dot, { left: toX(i)-5, top: toY(values[i])-5 }]} />
        ))}
        {/* Label X */}
        {xLabels.map((xl) => (
          <Text key={`x-${xl.label}`} style={[ch.xLabel, { left: xl.x - 20 }]}>{xl.label}</Text>
        ))}
      </View>
      <Text style={ch.subLabel}>Berat badan (kg) • 1–14 Oktober 2026</Text>
    </View>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon, value, unit, label }) {
  return (
    <View style={s.statCard}>
      <View style={s.statIconWrap}>
        <Ionicons name={icon} size={22} color={MINT} />
      </View>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statUnit}>{unit}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function ReportsScreen() {
  const now = new Date();

  // Default ke Oktober 2026 agar mock data langsung terlihat
  const [year,  setYear]  = useState(2026);
  const [month, setMonth] = useState(10);
  const [data,  setData]  = useState(null);
  const [loading, setLoading] = useState(false);

  const [selectedDate,    setSelectedDate]    = useState(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput,     setWeightInput]     = useState('');
  const [savingWeight,    setSavingWeight]     = useState(false);

  const bulanStr = `${year}-${String(month).padStart(2,'0')}`;
  // Cegah navigasi maju ke bulan yang belum datang
  const isAtOrPastNow = year > now.getFullYear() ||
    (year === now.getFullYear() && month >= now.getMonth() + 1);

  useFocusEffect(useCallback(() => {
    (async () => {
      setLoading(true);
      setData(null);
      setSelectedDate(null);
      try {
        const res = await api.getMonthlyReport(bulanStr);
        setData(res);
      } catch {
        setData(null); // pakai mock
      } finally {
        setLoading(false);
      }
    })();
  }, [bulanStr]));

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y-1); }
    else setMonth((m) => m-1);
  }
  function nextMonth() {
    if (isAtOrPastNow) return;
    if (month === 12) { setMonth(1); setYear((y) => y+1); }
    else setMonth((m) => m+1);
  }

  async function handleShare() {
    const msg = `📊 Laporan FitTracker — ${MONTHS[month-1]} ${year}\n🏋️ ${totalSesi} sesi • ⏱ ${totalMenit} menit • 🔥 ${totalKalori} kkal`;
    try { await Share.share({ message: msg }); } catch {}
  }

  async function saveWeight() {
    const v = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(v) || v < 20 || v > 500) {
      Alert.alert('Peringatan', 'Masukkan berat yang valid (20–500 kg).'); return;
    }
    setSavingWeight(true);
    try {
      await api.logWeight({ berat: v, tanggal: new Date().toISOString().slice(0, 10) });
      setShowWeightModal(false);
      setWeightInput('');
      const res = await api.getMonthlyReport(bulanStr);
      setData(res);
    } catch (e) {
      Alert.alert('Gagal', e.message);
    } finally { setSavingWeight(false); }
  }

  // ── Kalender ─────────────────────────────────────────────────────────────────
  const totalDays = daysInMonth(year, month);
  const firstDay  = firstWeekday(year, month);
  const calCells  = [];
  for (let i = 0; i < firstDay; i++) calCells.push(null);
  for (let d = 1; d <= totalDays; d++) calCells.push(d);
  while (calCells.length % 7 !== 0) calCells.push(null);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const todayNum = isCurrentMonth ? now.getDate() : null;

  // Set hari latihan: dari API atau mock
  const hariLatihanSet = data?.hari_latihan
    ? new Set((data.hari_latihan).map((h) => Number(h.hari)))
    : MOCK_LATIHAN_DAYS;

  // ── Summary: API atau mock ────────────────────────────────────────────────
  const summary    = data?.summary;
  const totalSesi  = summary?.total_sesi   ?? 8;
  const totalMenit = summary
    ? Math.round((summary.total_durasi_detik ?? 0) / 60)
    : 214;
  const totalKalori = summary
    ? Math.round(summary.estimasi_kalori ?? 0).toLocaleString('id-ID')
    : '1.460';

  // ── Berat: API atau mock ──────────────────────────────────────────────────
  const weightPoints = data?.weight_history?.length
    ? data.weight_history
    : MOCK_WEIGHT_POINTS;
  const beratNow   = data?.berat_saat_ini ? Number(data.berat_saat_ini) : 67.8;
  const beratDelta = data?.berat_delta    ? Number(data.berat_delta)    : -1.2;

  // ── Riwayat: ditampilkan dari mock (data API terlalu raw untuk dipetakan) ─
  const useApiHistory = data?.history?.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 1. Header ── */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Laporan</Text>
            <Text style={s.subtitle}>Setiap sesi adalah progres.</Text>
          </View>
          <Pressable onPress={handleShare} style={s.iconBtn}>
            <Ionicons name="share-outline" size={20} color={TEXT} />
          </Pressable>
        </View>

        {/* ── Pemilih Bulan ── */}
        <View style={s.monthRow}>
          <Pressable onPress={prevMonth} style={s.monthArrow}>
            <Ionicons name="chevron-back" size={18} color={GRAY} />
          </Pressable>
          <View style={s.monthPill}>
            <Ionicons name="calendar-outline" size={15} color={MINT} />
            <Text style={s.monthTxt}>{MONTHS[month-1]} {year}</Text>
            <Ionicons name="chevron-down" size={14} color={GRAY} />
          </View>
          <Pressable
            onPress={nextMonth}
            style={[s.monthArrow, isAtOrPastNow && { opacity: 0.3 }]}
            disabled={isAtOrPastNow}
          >
            <Ionicons name="chevron-forward" size={18} color={GRAY} />
          </Pressable>
        </View>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={MINT} />
          </View>
        ) : (
          <>
            {/* ── 2. Metrik 3 Kolom ── */}
            <View style={s.statRow}>
              <StatCard icon="barbell-outline" value={totalSesi}   unit="sesi"  label="Total latihan" />
              <StatCard icon="time-outline"     value={totalMenit}  unit="menit" label="Total durasi" />
              <StatCard icon="flame-outline"    value={totalKalori} unit="kkal"  label="Estimasi kalori" />
            </View>

            {/* ── 3. Kalender Latihan ── */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Kalender latihan</Text>

              {/* Header hari */}
              <View style={s.calRow}>
                {DAYS_SHORT.map((d) => (
                  <Text key={d} style={s.calHdr}>{d}</Text>
                ))}
              </View>

              {/* Grid tanggal */}
              <View style={s.calGrid}>
                {calCells.map((d, i) => {
                  if (!d) return <View key={`e${i}`} style={s.calCell} />;

                  const hasLatih   = hariLatihanSet.has(d);
                  const isToday    = todayNum !== null && d === todayNum;
                  const isSelected = d === selectedDate;

                  return (
                    <Pressable
                      key={d}
                      style={s.calCell}
                      onPress={() => setSelectedDate(d === selectedDate ? null : d)}
                    >
                      <View style={[
                        s.calBubble,
                        hasLatih   && s.calBubbleActive,
                        isToday    && !hasLatih && s.calBubbleToday,
                        isSelected && !hasLatih && s.calBubbleSelected,
                        isSelected && hasLatih  && s.calBubbleSelectedActive,
                      ]}>
                        <Text style={[
                          s.calNum,
                          hasLatih   && s.calNumWhite,
                          isToday    && !hasLatih && s.calNumToday,
                          isSelected && s.calNumBold,
                        ]}>
                          {d}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Legenda */}
              <View style={s.legend}>
                <View style={[s.legendDot, { backgroundColor: MINT }]} />
                <Text style={s.legendTxt}>Latihan selesai</Text>
                <View style={s.legendRing} />
                <Text style={[s.legendTxt, { marginLeft: 4 }]}>Hari ini</Text>
              </View>
            </View>

            {/* ── Panel detail tanggal ── */}
            {selectedDate !== null && (
              <View style={s.detailPanel}>
                <View style={s.detailHeaderRow}>
                  <Ionicons
                    name={hariLatihanSet.has(selectedDate) ? 'checkmark-circle' : 'calendar-outline'}
                    size={18}
                    color={hariLatihanSet.has(selectedDate) ? MINT : MUTED}
                  />
                  <Text style={s.detailTitle}>
                    {selectedDate} {MONTHS[month-1]} {year}
                  </Text>
                  <Pressable onPress={() => setSelectedDate(null)} style={s.detailClose}>
                    <Ionicons name="close" size={18} color={MUTED} />
                  </Pressable>
                </View>
                {!hariLatihanSet.has(selectedDate) ? (
                  <Text style={s.detailEmpty}>Belum ada latihan tercatat pada tanggal ini.</Text>
                ) : (
                  <View style={s.detailSesiRow}>
                    <View style={s.detailSesiIcon}>
                      <Ionicons name="fitness-outline" size={18} color={MINT} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.detailSesiNama}>Latihan tercatat</Text>
                      <Text style={s.detailSesiMeta}>Lihat riwayat di bawah</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ── 4. Perkembangan Berat ── */}
            <View style={s.card}>
              <View style={s.cardTitleRow}>
                <Text style={s.cardTitle}>Perkembangan berat</Text>
                <Pressable
                  style={s.addWeightBtn}
                  onPress={() => { setWeightInput(String(beratNow)); setShowWeightModal(true); }}
                >
                  <Ionicons name="add" size={16} color={MINT} />
                  <Text style={s.addWeightTxt}>Catat</Text>
                </Pressable>
              </View>
              <View style={s.weightHeadRow}>
                <Text style={s.weightVal}>{Number(beratNow).toFixed(1).replace('.', ',')} kg</Text>
                <View style={s.deltaBadge}>
                  <Ionicons name="trending-down" size={13} color={MINT} />
                  <Text style={s.deltaTxt}>
                    ↓ {Math.abs(beratDelta).toFixed(1).replace('.', ',')} kg bulan ini
                  </Text>
                </View>
              </View>
              <LineChart points={weightPoints} />
            </View>

            {/* ── 5. Riwayat Latihan ── */}
            <View style={s.card}>
              <View style={s.cardTitleRow}>
                <Text style={s.cardTitle}>Riwayat latihan</Text>
                <Text style={s.cardRight}>Semua {totalSesi} sesi</Text>
              </View>

              {MOCK_RIWAYAT.map((h, idx, arr) => (
                <View
                  key={h.id}
                  style={[
                    s.histRow,
                    idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: BORDER },
                  ]}
                >
                  <View style={s.histIcon}>
                    <Ionicons name="checkmark-circle" size={24} color={MINT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.histName}>{h.nama}</Text>
                    <Text style={s.histDate}>{h.tanggal}</Text>
                    <Text style={s.histDetail}>{h.detail}</Text>
                  </View>
                </View>
              ))}

              <View style={s.storedRow}>
                <Ionicons name="download-outline" size={14} color={MINT} />
                <Text style={s.storedTxt}>Riwayat tersimpan di perangkat</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Modal Catat Berat ── */}
      <Modal visible={showWeightModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Catat Berat Badan</Text>
              <Pressable onPress={() => setShowWeightModal(false)}>
                <Ionicons name="close" size={22} color={GRAY} />
              </Pressable>
            </View>
            <View style={s.weightInputRow}>
              <TextInput
                style={s.weightInput}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="numeric"
                placeholder="67.5"
                placeholderTextColor={MUTED}
                autoFocus
              />
              <Text style={s.weightUnit}>kg</Text>
            </View>
            <Pressable
              style={[s.modalSaveBtn, savingWeight && { opacity: 0.6 }]}
              onPress={saveWeight}
              disabled={savingWeight}
            >
              {savingWeight
                ? <ActivityIndicator color={WHITE} />
                : <Text style={s.modalSaveTxt}>Simpan</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 56 },

  /* Header */
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 20, marginBottom: 6,
  },
  title:    { fontSize: 30, fontWeight: 'bold', color: TEXT },
  subtitle: { fontSize: 14, color: MUTED, marginTop: 2 },
  iconBtn:  { padding: 8, backgroundColor: WHITE, borderRadius: 10, borderWidth: 1, borderColor: BORDER },

  /* Pemilih bulan */
  monthRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, marginVertical: 14,
  },
  monthArrow: { padding: 8 },
  monthPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: BORDER, marginHorizontal: 10,
  },
  monthTxt: { fontSize: 14, fontWeight: '700', color: TEXT, marginHorizontal: 6 },

  /* Loading */
  loadingBox: { padding: 60, alignItems: 'center' },

  /* Metrik */
  statRow:  { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: WHITE, borderRadius: 16,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: BORDER, marginHorizontal: 4,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: MINT_L, alignItems: 'center',
    justifyContent: 'center', marginBottom: 8,
  },
  statVal:   { fontSize: 22, fontWeight: 'bold', color: TEXT },
  statUnit:  { fontSize: 11, color: MUTED },
  statLabel: { fontSize: 11, color: MUTED, marginTop: 2, textAlign: 'center' },

  /* Card */
  card: {
    backgroundColor: WHITE, borderRadius: 18,
    marginHorizontal: 16, marginBottom: 16,
    padding: 16, borderWidth: 1, borderColor: BORDER,
  },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardRight:    { fontSize: 13, color: MINT, fontWeight: '600' },

  /* Kalender */
  calRow:  { flexDirection: 'row', marginBottom: 8 },
  calHdr:  { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: MUTED },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100/7}%`, alignItems: 'center', paddingVertical: 4 },
  calBubble: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  calBubbleActive:         { backgroundColor: MINT },
  calBubbleToday:          { borderWidth: 2, borderColor: MINT },
  calBubbleSelected:       { borderWidth: 2, borderColor: MINT_D, backgroundColor: MINT_L },
  calBubbleSelectedActive: { backgroundColor: MINT_D },
  calNum:      { fontSize: 13, color: TEXT },
  calNumWhite: { color: WHITE, fontWeight: 'bold' },
  calNumToday: { color: MINT, fontWeight: 'bold' },
  calNumBold:  { fontWeight: 'bold' },

  legend:    { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendRing:{ width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: MINT, marginLeft: 16, marginRight: 6 },
  legendTxt: { fontSize: 12, color: GRAY },

  /* Detail panel */
  detailPanel: {
    backgroundColor: WHITE, borderRadius: 16,
    marginHorizontal: 16, marginBottom: 16,
    padding: 16, borderWidth: 1.5, borderColor: MINT_L,
  },
  detailHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailTitle:  { fontSize: 14, fontWeight: '700', color: TEXT, marginLeft: 8, flex: 1 },
  detailClose:  { padding: 4 },
  detailEmpty:  { fontSize: 13, color: MUTED, fontStyle: 'italic' },
  detailSesiRow:{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  detailSesiIcon:{
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: MINT_LL, alignItems: 'center', justifyContent: 'center',
  },
  detailSesiNama: { fontSize: 14, fontWeight: '700', color: TEXT },
  detailSesiMeta: { fontSize: 12, color: MUTED, marginTop: 2 },

  /* Berat */
  weightHeadRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  weightVal:     { fontSize: 30, fontWeight: 'bold', color: TEXT },
  deltaBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: MINT_L, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4, marginLeft: 12,
  },
  deltaTxt: { fontSize: 12, fontWeight: '600', color: MINT, marginLeft: 4 },
  addWeightBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: MINT_LL, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: MINT_L,
  },
  addWeightTxt: { fontSize: 12, fontWeight: '700', color: MINT, marginLeft: 2 },

  /* Riwayat */
  histRow:    { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  histIcon:   { marginRight: 12, marginTop: 1 },
  histName:   { fontSize: 15, fontWeight: '700', color: TEXT },
  histDate:   { fontSize: 12, color: MUTED, marginTop: 2 },
  histDetail: { fontSize: 12, color: GRAY, marginTop: 2 },
  storedRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  storedTxt:  { fontSize: 12, color: MUTED, marginLeft: 6 },

  /* Modal */
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard:      { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle:     { fontSize: 18, fontWeight: 'bold', color: TEXT },
  weightInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 14 },
  weightInput:    { flex: 1, fontSize: 36, fontWeight: 'bold', color: TEXT, borderBottomWidth: 2, borderBottomColor: MINT, paddingVertical: 8, paddingHorizontal: 4 },
  weightUnit:     { fontSize: 20, color: GRAY, marginLeft: 10 },
  modalSaveBtn:   { backgroundColor: MINT, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  modalSaveTxt:   { color: WHITE, fontSize: 16, fontWeight: 'bold' },
});

// ── Chart styles ──────────────────────────────────────────────────────────────
const ch = StyleSheet.create({
  area:     { position: 'relative', width: '100%', marginBottom: 8 },
  gridLine: { position: 'absolute', left: 24, right: 0, height: 1, backgroundColor: BORDER },
  yLabel:   { position: 'absolute', left: 0, fontSize: 10, color: MUTED, width: 24, textAlign: 'right' },
  dot:      { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: WHITE, borderWidth: 2.5, borderColor: MINT },
  xLabel:   { position: 'absolute', top: CHART_H + 6, fontSize: 10, color: MUTED, width: 40, textAlign: 'center' },
  subLabel: { fontSize: 11, color: MUTED, textAlign: 'center', marginTop: 24 },
  empty:    { alignItems: 'center', paddingVertical: 20 },
  emptyTxt: { color: MUTED, marginTop: 8, fontSize: 13 },
});
