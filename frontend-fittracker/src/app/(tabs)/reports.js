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

// ── Palet warna ──────────────────────────────────────────────────────────────
const MINT     = '#10B981';
const MINT_D   = '#059669';
const MINT_L   = '#D1FAE5';
const MINT_LL  = '#ECFDF5';
const GRAY     = '#6B7280';
const BORDER   = '#E5E7EB';
const TEXT     = '#111827';
const MUTED    = '#9CA3AF';
const BG       = '#F9FAFB';
const WHITE    = '#FFFFFF';
const RED_L    = '#FEE2E2';
const RED      = '#EF4444';

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];
const DAYS_SHORT = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];

const SCREEN_W = Dimensions.get('window').width;
const CHART_H  = 140;
const CHART_W  = SCREEN_W - 32 - 32; // margin + padding

// ── Helpers ──────────────────────────────────────────────────────────────────
function daysInMonth(y, m)   { return new Date(y, m, 0).getDate(); }
function firstWeekday(y, m)  { const d = new Date(y, m - 1, 1).getDay(); return d === 0 ? 6 : d - 1; }
function fmtMin(sec)         { return Math.round((sec || 0) / 60); }
function fmtKal(v)           { return Math.round(v || 0).toLocaleString('id-ID'); }
function fmtDate(str) {
  // Parse YYYY-MM-DD tanpa timezone shift
  try {
    const [y, m, d] = str.slice(0, 10).split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return str; }
}
function fmtTime(str) {
  try { return new Date(str).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}
function todayStr() { return new Date().toISOString().slice(0, 10); }

// ── Line Chart (pure View, no library) ───────────────────────────────────────
function LineChart({ points, monthLabel }) {
  if (!points || points.length < 2) {
    return (
      <View style={ch.empty}>
        <Ionicons name="scale-outline" size={32} color={BORDER} />
        <Text style={ch.emptyTxt}>Belum cukup data untuk grafik</Text>
      </View>
    );
  }

  const values = points.map((p) => Number(p.berat));
  const minV   = Math.floor(Math.min(...values) * 2) / 2 - 0.5;
  const maxV   = Math.ceil(Math.max(...values)  * 2) / 2 + 0.5;
  const rangeV = maxV - minV || 1;

  // Convert value → Y pixel (0 = top)
  function toY(v) { return CHART_H - ((v - minV) / rangeV) * CHART_H; }
  // Convert index → X pixel
  function toX(i) { return (i / (points.length - 1)) * (CHART_W - 20) + 10; }

  // Build SVG-style path as a series of line segments rendered as tiny Views
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const x1 = toX(i);   const y1 = toY(values[i]);
    const x2 = toX(i+1); const y2 = toY(values[i+1]);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    segments.push({ x1, y1, len, angle, key: i });
  }

  // Y-axis labels (3 levels)
  const yLabels = [maxV, (maxV + minV) / 2, minV].map((v) => ({
    v: v.toFixed(1),
    y: toY(v),
  }));

  // X-axis labels — show up to 4
  const step = Math.ceil(points.length / 4);
  const xLabels = points
    .filter((_, i) => i % step === 0 || i === points.length - 1)
    .map((p) => {
      const idx = points.indexOf(p);
      const [, m, d] = p.tanggal.slice(0, 10).split('-').map(Number);
      return { label: `${d} ${MONTHS[m - 1].slice(0, 3)}`, x: toX(idx) };
    });

  return (
    <View>
      <View style={[ch.area, { height: CHART_H + 24 }]}>
        {/* Grid lines */}
        {yLabels.map((yl) => (
          <View key={yl.v} style={[ch.gridLine, { top: yl.y }]} />
        ))}
        {/* Y labels */}
        {yLabels.map((yl) => (
          <Text key={`yl-${yl.v}`} style={[ch.yLabel, { top: yl.y - 8 }]}>{yl.v}</Text>
        ))}
        {/* Gradient fill (approximated) */}
        {points.map((p, i) => {
          if (i === 0) return null;
          const x1 = toX(i-1); const y1 = toY(values[i-1]);
          const x2 = toX(i);   const y2 = toY(values[i]);
          const fillH = CHART_H - Math.min(y1, y2);
          return (
            <View
              key={`fill-${i}`}
              style={{
                position: 'absolute',
                left: x1,
                top: Math.min(y1, y2),
                width: x2 - x1,
                height: fillH + 2,
                backgroundColor: MINT + '15',
              }}
            />
          );
        })}
        {/* Line segments — rotasi dari center segment */}
        {segments.map((seg) => (
          <View
            key={seg.key}
            style={{
              position: 'absolute',
              left: seg.x1 + (Math.cos(seg.angle * Math.PI / 180) * seg.len / 2) - seg.len / 2,
              top:  seg.y1 + (Math.sin(seg.angle * Math.PI / 180) * seg.len / 2) - 1.25,
              width: seg.len,
              height: 2.5,
              backgroundColor: MINT,
              transform: [
                { translateX: seg.len / 2 },
                { rotate: `${seg.angle}deg` },
                { translateX: -seg.len / 2 },
              ],
              borderRadius: 2,
            }}
          />
        ))}
        {/* Dots */}
        {points.map((p, i) => (
          <View
            key={`dot-${i}`}
            style={[ch.dot, { left: toX(i) - 5, top: toY(values[i]) - 5 }]}
          />
        ))}
        {/* X labels */}
        {xLabels.map((xl) => (
          <Text key={`xl-${xl.label}`} style={[ch.xLabel, { left: xl.x - 20 }]}>{xl.label}</Text>
        ))}
      </View>
      <Text style={ch.subLabel}>Berat badan (kg) • {monthLabel}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data,  setData]  = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal catat berat
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput]         = useState('');
  const [savingWeight, setSavingWeight]       = useState(false);

  const bulanStr = `${year}-${String(month).padStart(2, '0')}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getMonthlyReport(bulanStr);
      setData(res);
    } catch { setData(null); }
    finally   { setLoading(false); }
  }, [bulanStr]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    const isNow = year === now.getFullYear() && month === now.getMonth() + 1;
    if (isNow) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }
  const isNow = year === now.getFullYear() && month === now.getMonth() + 1;

  async function handleShare() {
    if (!data) return;
    const s = data.summary;
    const msg =
      `📊 Laporan FitTracker — ${MONTHS[month-1]} ${year}\n` +
      `🏋️ ${s.total_sesi} sesi • ⏱ ${fmtMin(s.total_durasi_detik)} menit • 🔥 ${fmtKal(s.estimasi_kalori)} kkal`;
    try { await Share.share({ message: msg }); } catch { /* cancelled */ }
  }

  async function saveWeight() {
    const v = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(v) || v < 20 || v > 500) {
      Alert.alert('Peringatan', 'Masukkan berat yang valid (20–500 kg).'); return;
    }
    setSavingWeight(true);
    try {
      await api.logWeight({ berat: v, tanggal: todayStr() });
      setShowWeightModal(false);
      setWeightInput('');
      await load();
    } catch (e) {
      Alert.alert('Gagal', e.message);
    } finally { setSavingWeight(false); }
  }

  // Kalender
  const hariLatihan = new Set((data?.hari_latihan || []).map((d) => d.hari));
  const today       = now.getDate();
  const totalDays   = daysInMonth(year, month);
  const firstDay    = firstWeekday(year, month);
  const calCells    = [];
  for (let i = 0; i < firstDay; i++) calCells.push(null);
  for (let d = 1; d <= totalDays; d++) calCells.push(d);
  while (calCells.length % 7 !== 0) calCells.push(null);

  // Grafik berat
  const weightPoints = (data?.weight_history || []).map((w) => ({
    berat:   Number(w.berat),
    tanggal: w.tanggal,
  }));
  const beratNow    = data?.berat_saat_ini ? Number(data.berat_saat_ini) : null;
  const beratDelta  = data?.berat_delta    ? Number(data.berat_delta)    : null;
  const monthLabel  = `${MONTHS[month-1]} ${year}`;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Laporan</Text>
            <Text style={s.subtitle}>Setiap sesi adalah progres.</Text>
          </View>
          <Pressable onPress={handleShare} style={s.iconBtn}>
            <Ionicons name="share-outline" size={22} color={MINT} />
          </Pressable>
        </View>

        {/* ── Month picker ── */}
        <View style={s.monthRow}>
          <Pressable style={s.arrow} onPress={prevMonth}>
            <Ionicons name="chevron-back" size={18} color={MINT} />
          </Pressable>
          <View style={s.monthPill}>
            <Ionicons name="calendar-outline" size={15} color={MINT} />
            <Text style={s.monthTxt}>{MONTHS[month-1]} {year}</Text>
            <Ionicons name="chevron-down" size={14} color={GRAY} />
          </View>
          <Pressable style={s.arrow} onPress={nextMonth}>
            <Ionicons name="chevron-forward" size={18} color={isNow ? BORDER : MINT} />
          </Pressable>
        </View>

        {loading ? (
          <View style={{ padding: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={MINT} />
          </View>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <View style={s.statRow}>
              <StatCard icon="barbell-outline"  value={data?.summary?.total_sesi ?? 0}                  unit="sesi"  label="Total latihan" />
              <StatCard icon="time-outline"      value={fmtMin(data?.summary?.total_durasi_detik)}        unit="menit" label="Total durasi" />
              <StatCard icon="flame-outline"     value={fmtKal(data?.summary?.estimasi_kalori)}           unit="kkal"  label="Est. kalori" />
            </View>

            {/* ── Kalender Latihan ── */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Kalender latihan</Text>
              {/* Header hari */}
              <View style={s.calRow}>
                {DAYS_SHORT.map((d) => (
                  <Text key={d} style={s.calHdr}>{d}</Text>
                ))}
              </View>
              {/* Grid */}
              <View style={s.calGrid}>
                {calCells.map((d, i) => {
                  if (!d) return <View key={`e${i}`} style={s.calCell} />;
                  const active  = hariLatihan.has(d);
                  const isToday = isNow && d === today;
                  return (
                    <View key={d} style={s.calCell}>
                      <View style={[s.calBubble, active && s.calBubbleActive, isToday && !active && s.calBubbleToday]}>
                        <Text style={[s.calNum, active && s.calNumActive, isToday && !active && s.calNumToday]}>
                          {d}
                        </Text>
                      </View>
                    </View>
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

            {/* ── Weight Progress Chart ── */}
            <View style={s.card}>
              <View style={s.cardTitleRow}>
                <Text style={s.cardTitle}>Perkembangan berat</Text>
                <Pressable style={s.addWeightBtn} onPress={() => { setShowWeightModal(true); setWeightInput(beratNow ? String(beratNow) : ''); }}>
                  <Ionicons name="add" size={16} color={MINT} />
                  <Text style={s.addWeightTxt}>Catat</Text>
                </Pressable>
              </View>

              {beratNow ? (
                <>
                  <View style={s.weightHeadRow}>
                    <Text style={s.weightVal}>{beratNow.toFixed(1).replace('.', ',')} kg</Text>
                    {beratDelta != null && (
                      <View style={[s.deltaBadge, beratDelta > 0 ? { backgroundColor: RED_L } : { backgroundColor: MINT_L }]}>
                        <Ionicons
                          name={beratDelta > 0 ? 'trending-up' : 'trending-down'}
                          size={13}
                          color={beratDelta > 0 ? RED : MINT}
                        />
                        <Text style={[s.deltaTxt, { color: beratDelta > 0 ? RED : MINT }]}>
                          {beratDelta > 0 ? '↑' : '↓'} {Math.abs(beratDelta).toFixed(1).replace('.', ',')} kg bulan ini
                        </Text>
                      </View>
                    )}
                  </View>
                  <LineChart points={weightPoints} monthLabel={monthLabel} />
                </>
              ) : (
                <View style={s.emptyWeight}>
                  <Ionicons name="scale-outline" size={40} color={BORDER} />
                  <Text style={s.emptyWeightTxt}>Belum ada data berat untuk bulan ini.</Text>
                  <Pressable style={s.emptyWeightBtn} onPress={() => setShowWeightModal(true)}>
                    <Text style={s.emptyWeightBtnTxt}>+ Catat Berat Sekarang</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* ── Riwayat Latihan ── */}
            <View style={s.card}>
              <View style={s.cardTitleRow}>
                <Text style={s.cardTitle}>Riwayat latihan</Text>
                <Text style={s.cardRight}>Semua {data?.summary?.total_sesi ?? 0} sesi</Text>
              </View>

              {(data?.history || []).length === 0 ? (
                <View style={s.emptyHistory}>
                  <Ionicons name="fitness-outline" size={40} color={BORDER} />
                  <Text style={s.emptyHistoryTxt}>Belum ada latihan bulan ini.</Text>
                </View>
              ) : (
                (data.history || []).slice(0, 10).map((h, idx) => {
                  const menit  = fmtMin(h.durasi);
                  const kalori = Math.round((h.jumlah_set || 0) * (h.reps || 0) * 0.3);
                  const waktu  = fmtTime(h.tanggal + 'T18:00');
                  return (
                    <View
                      key={h.id_log}
                      style={[s.histRow, idx < (data.history.length - 1) && idx < 9 && { borderBottomWidth: 1, borderBottomColor: BORDER }]}
                    >
                      <View style={s.histIcon}>
                        <Ionicons name="checkmark-circle" size={24} color={MINT} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.histName}>{h.nama_gerakan || h.nama_plan || 'Latihan'}</Text>
                        <Text style={s.histDate}>{fmtDate(h.tanggal)} • {h.tanggal?.slice(0, 10)}</Text>
                        <Text style={s.histDetail}>
                          {menit > 0
                            ? `${menit} menit • Estimasi ${Math.max(kalori, 100)} kkal`
                            : `${h.jumlah_set || 0} set × ${h.reps || 0} reps`}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}

              <View style={s.storedRow}>
                <Ionicons name="download-outline" size={14} color={MUTED} />
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
            <Text style={s.modalSub}>Tanggal: {todayStr()}</Text>
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

// ── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ icon, value, unit, label }) {
  return (
    <View style={s.statCard}>
      <View style={s.statIconWrap}>
        <Ionicons name={icon} size={20} color={MINT} />
      </View>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statUnit}>{unit}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ── StyleSheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 56 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 20, marginBottom: 6 },
  title:    { fontSize: 30, fontWeight: 'bold', color: TEXT },
  subtitle: { fontSize: 14, color: MUTED, marginTop: 2 },
  iconBtn:  { padding: 8, backgroundColor: MINT_LL, borderRadius: 10 },

  // Month picker
  monthRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 14 },
  arrow:     { padding: 10 },
  monthPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WHITE, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: BORDER },
  monthTxt:  { fontSize: 15, fontWeight: '700', color: TEXT },

  // Stat cards
  statRow:  { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: WHITE, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: MINT_L, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statVal:  { fontSize: 22, fontWeight: 'bold', color: TEXT },
  statUnit: { fontSize: 11, color: MUTED },
  statLabel:{ fontSize: 11, color: MUTED, marginTop: 2, textAlign: 'center' },

  // Card
  card: { backgroundColor: WHITE, borderRadius: 18, marginHorizontal: 16, marginBottom: 16, padding: 16, borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardRight:    { fontSize: 13, color: MINT, fontWeight: '600' },

  // Calendar
  calRow:  { flexDirection: 'row', marginBottom: 8 },
  calHdr:  { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: MUTED },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  calBubble: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calBubbleActive: { backgroundColor: MINT },
  calBubbleToday:  { borderWidth: 2, borderColor: MINT },
  calNum:          { fontSize: 13, color: TEXT },
  calNumActive:    { color: WHITE, fontWeight: 'bold' },
  calNumToday:     { color: MINT, fontWeight: 'bold' },
  legend:    { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendRing:{ width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: MINT, marginLeft: 16, marginRight: 6 },
  legendTxt: { fontSize: 12, color: GRAY },

  // Weight chart
  weightHeadRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  weightVal:     { fontSize: 30, fontWeight: 'bold', color: TEXT },
  deltaBadge:    { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 12, gap: 4 },
  deltaTxt:      { fontSize: 12, fontWeight: '600' },
  addWeightBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: MINT_LL, borderRadius: 999, borderWidth: 1, borderColor: MINT_L },
  addWeightTxt:  { fontSize: 12, fontWeight: '700', color: MINT },
  emptyWeight:   { alignItems: 'center', paddingVertical: 24 },
  emptyWeightTxt:{ color: MUTED, marginTop: 8, textAlign: 'center' },
  emptyWeightBtn:{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: MINT, borderRadius: 999 },
  emptyWeightBtnTxt: { color: WHITE, fontWeight: '700', fontSize: 13 },

  // History
  histRow:    { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  histIcon:   { marginRight: 12, marginTop: 1 },
  histName:   { fontSize: 15, fontWeight: '700', color: TEXT },
  histDate:   { fontSize: 12, color: MUTED, marginTop: 2 },
  histDetail: { fontSize: 12, color: GRAY, marginTop: 2 },
  emptyHistory:   { alignItems: 'center', paddingVertical: 24 },
  emptyHistoryTxt:{ color: MUTED, marginTop: 8 },
  storedRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, gap: 6 },
  storedTxt:  { fontSize: 12, color: MUTED },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle:   { fontSize: 18, fontWeight: 'bold', color: TEXT },
  modalSub:     { fontSize: 13, color: MUTED, marginBottom: 20 },
  weightInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  weightInput:  { flex: 1, fontSize: 36, fontWeight: 'bold', color: TEXT, borderBottomWidth: 2, borderBottomColor: MINT, paddingVertical: 8, paddingHorizontal: 4 },
  weightUnit:   { fontSize: 20, color: GRAY, marginLeft: 10 },
  modalSaveBtn: { backgroundColor: MINT, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  modalSaveTxt: { color: WHITE, fontSize: 16, fontWeight: 'bold' },
});

// ── Chart styles ─────────────────────────────────────────────────────────────
const ch = StyleSheet.create({
  area:      { position: 'relative', width: '100%', marginBottom: 8 },
  gridLine:  { position: 'absolute', left: 24, right: 0, height: 1, backgroundColor: BORDER },
  yLabel:    { position: 'absolute', left: 0, fontSize: 10, color: MUTED, width: 24, textAlign: 'right' },
  dot:       { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: WHITE, borderWidth: 2.5, borderColor: MINT },
  xLabel:    { position: 'absolute', top: CHART_H + 6, fontSize: 10, color: MUTED, width: 40, textAlign: 'center' },
  subLabel:  { fontSize: 11, color: MUTED, textAlign: 'center', marginTop: 24 },
  empty:     { alignItems: 'center', paddingVertical: 20 },
  emptyTxt:  { color: MUTED, marginTop: 8, fontSize: 13 },
});
