/**
 * gif-test.js — Gallery GIF & Gambar Animasi Latihan
 * Semua aset ditampilkan penuh layar dengan carousel swipe
 */
import { useState, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  FlatList, Dimensions, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width: W, height: H } = Dimensions.get('window');

const MINT    = '#10B981';
const MINT_L  = '#D1FAE5';
const MINT_LL = '#ECFDF5';
const TEXT    = '#111827';
const MUTED   = '#6B7280';
const BORDER  = '#E5E7EB';
const BG      = '#F9FAFB';
const WHITE   = '#FFFFFF';
const DARK    = 'rgba(0,0,0,0.75)';

// ── Semua aset latihan ────────────────────────────────────────────────────────
const ASSETS = [
  { id: '1',  nama: 'Push Up',          tipe: 'gif', src: require('../../assets/pushup.gif'),         ket: 'Kekuatan • Pemula' },
  { id: '2',  nama: 'Squat',            tipe: 'gif', src: require('../../assets/squat.gif'),           ket: 'Kekuatan • Pemula' },
  { id: '3',  nama: 'Burpee',           tipe: 'gif', src: require('../../assets/burpee.gif'),          ket: 'Full Body • Lanjutan' },
  { id: '4',  nama: 'High Knee',        tipe: 'gif', src: require('../../assets/high-knee.gif'),       ket: 'Kardio • Menengah' },
  { id: '5',  nama: 'Jumping Jack',     tipe: 'gif', src: require('../../assets/jumping-jack.gif'),    ket: 'Kardio • Pemula' },
  { id: '6',  nama: 'Lunge',            tipe: 'gif', src: require('../../assets/lunge.gif'),           ket: 'Kekuatan • Menengah' },
  { id: '7',  nama: 'Mountain Climber', tipe: 'gif', src: require('../../assets/mountain-climber.gif'),ket: 'Kardio • Menengah' },
  { id: '8',  nama: 'Glute Bridge',     tipe: 'gif', src: require('../../assets/glute-bridge.gif'),    ket: 'Kekuatan • Pemula' },
  { id: '9',  nama: 'Russian Twist',    tipe: 'gif', src: require('../../assets/russian-twist.gif'),   ket: 'Core • Menengah' },
  { id: '10', nama: 'Pull Up',          tipe: 'gif', src: require('../../assets/pull-up.gif'),         ket: 'Kekuatan • Lanjutan' },
  { id: '11', nama: 'Sit Up',           tipe: 'gif', src: require('../../assets/sit-up.gif'),          ket: 'Core • Pemula' },
  { id: '12', nama: 'Plank',            tipe: 'png', src: require('../../assets/plank.png'),           ket: 'Core • Pemula' },
  { id: '13', nama: 'Side Plank',       tipe: 'png', src: require('../../assets/side-plank.png'),      ket: 'Core • Lanjutan' },
];

// ── Warna badge per kategori ──────────────────────────────────────────────────
function badgeColor(ket) {
  if (ket.includes('Kardio'))    return '#DBEAFE';
  if (ket.includes('Core'))      return '#FEF3C7';
  if (ket.includes('Full Body')) return '#FCE7F3';
  return MINT_L; // Kekuatan
}
function badgeTextColor(ket) {
  if (ket.includes('Kardio'))    return '#1D4ED8';
  if (ket.includes('Core'))      return '#B45309';
  if (ket.includes('Full Body')) return '#BE185D';
  return '#065F46';
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function GifTestScreen() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [viewMode, setViewMode]   = useState('carousel'); // 'carousel' | 'grid'
  const flatRef = useRef(null);

  const current = ASSETS[activeIdx];

  function goTo(idx) {
    const clamped = Math.max(0, Math.min(idx, ASSETS.length - 1));
    setActiveIdx(clamped);
    flatRef.current?.scrollToIndex({ index: clamped, animated: true });
  }

  // ── Mode Carousel ───────────────────────────────────────────────────────────
  if (viewMode === 'carousel') {
    return (
      <View style={cs.root}>
        {/* Gambar penuh layar */}
        <Image
          source={current.src}
          style={cs.fullImage}
          contentFit="contain"
          autoplay
          cachePolicy="memory-disk"
        />

        {/* Overlay gradien atas */}
        <SafeAreaView edges={['top']} style={cs.topOverlay}>
          <Pressable style={cs.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={WHITE} />
          </Pressable>
          <Text style={cs.topTitle}>Animasi Latihan</Text>
          <Pressable style={cs.gridBtn} onPress={() => setViewMode('grid')}>
            <Ionicons name="grid-outline" size={20} color={WHITE} />
          </Pressable>
        </SafeAreaView>

        {/* Info nama + badge di tengah bawah */}
        <View style={cs.infoBox}>
          <Text style={cs.infoNama}>{current.nama}</Text>
          <View style={[cs.infoBadge, { backgroundColor: badgeColor(current.ket) }]}>
            <Text style={[cs.infoBadgeText, { color: badgeTextColor(current.ket) }]}>
              {current.ket}
            </Text>
          </View>
          <View style={cs.infoTypeRow}>
            <Ionicons
              name={current.tipe === 'gif' ? 'play-circle' : 'image'}
              size={14}
              color="rgba(255,255,255,0.8)"
            />
            <Text style={cs.infoType}>
              {current.tipe === 'gif' ? 'GIF Animasi — Loop aktif' : 'Gambar Statis'}
            </Text>
          </View>
        </View>

        {/* Tombol prev / next */}
        <View style={cs.navRow}>
          <Pressable
            style={[cs.navBtn, activeIdx === 0 && cs.navBtnDisabled]}
            onPress={() => goTo(activeIdx - 1)}
            disabled={activeIdx === 0}
          >
            <Ionicons name="chevron-back" size={24} color={WHITE} />
          </Pressable>

          <Text style={cs.counter}>{activeIdx + 1} / {ASSETS.length}</Text>

          <Pressable
            style={[cs.navBtn, activeIdx === ASSETS.length - 1 && cs.navBtnDisabled]}
            onPress={() => goTo(activeIdx + 1)}
            disabled={activeIdx === ASSETS.length - 1}
          >
            <Ionicons name="chevron-forward" size={24} color={WHITE} />
          </Pressable>
        </View>

        {/* Thumbnail strip bawah */}
        <SafeAreaView edges={['bottom']} style={cs.stripWrap}>
          <FlatList
            ref={flatRef}
            data={ASSETS}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={cs.strip}
            getItemLayout={(_, index) => ({ length: 68, offset: 68 * index, index })}
            renderItem={({ item, index }) => (
              <Pressable onPress={() => { setActiveIdx(index); }}>
                <Image
                  source={item.src}
                  style={[
                    cs.thumb,
                    index === activeIdx && cs.thumbActive,
                  ]}
                  contentFit="cover"
                  autoplay={index === activeIdx}
                />
                {index === activeIdx && <View style={cs.thumbDot} />}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </View>
    );
  }

  // ── Mode Grid ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={gs.safe} edges={['top']}>
      {/* Header grid */}
      <View style={gs.header}>
        <Pressable style={gs.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={TEXT} />
        </Pressable>
        <Text style={gs.title}>Animasi Latihan</Text>
        <Pressable style={gs.carouselBtn} onPress={() => setViewMode('carousel')}>
          <Ionicons name="play-circle-outline" size={20} color={MINT} />
          <Text style={gs.carouselBtnText}>Carousel</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={gs.scroll} showsVerticalScrollIndicator={false}>
        {/* Info banner */}
        <View style={gs.banner}>
          <Ionicons name="information-circle-outline" size={16} color={MINT} />
          <Text style={gs.bannerText}>
            {ASSETS.filter(a => a.tipe === 'gif').length} GIF animasi •{' '}
            {ASSETS.filter(a => a.tipe === 'png').length} gambar statis •{' '}
            {ASSETS.length} total
          </Text>
        </View>

        {/* Grid 2 kolom */}
        <View style={gs.grid}>
          {ASSETS.map((item, index) => (
            <Pressable
              key={item.id}
              style={gs.card}
              onPress={() => { setActiveIdx(index); setViewMode('carousel'); }}
            >
              <Image
                source={item.src}
                style={gs.cardImage}
                contentFit="cover"
                autoplay
                cachePolicy="memory-disk"
              />
              {/* Badge tipe */}
              <View style={gs.typeBadge}>
                <Ionicons
                  name={item.tipe === 'gif' ? 'play-circle' : 'image'}
                  size={11}
                  color={item.tipe === 'gif' ? MINT : '#3B82F6'}
                />
                <Text style={[gs.typeBadgeText,
                  { color: item.tipe === 'gif' ? MINT : '#3B82F6' }
                ]}>
                  {item.tipe.toUpperCase()}
                </Text>
              </View>
              {/* Info */}
              <View style={gs.cardInfo}>
                <Text style={gs.cardName} numberOfLines={1}>{item.nama}</Text>
                <Text style={gs.cardKet} numberOfLines={1}>{item.ket}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Carousel styles ───────────────────────────────────────────────────────────
const cs = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#000' },
  fullImage: { width: W, height: H, position: 'absolute', top: 0, left: 0 },

  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backBtn:  { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 16, fontWeight: '700', color: WHITE },
  gridBtn:  { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

  infoBox: {
    position: 'absolute',
    bottom: 160,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  infoNama:     { fontSize: 26, fontWeight: 'bold', color: WHITE, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4, marginBottom: 8 },
  infoBadge:    { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 8 },
  infoBadgeText:{ fontSize: 13, fontWeight: '700' },
  infoTypeRow:  { flexDirection: 'row', alignItems: 'center' },
  infoType:     { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginLeft: 5 },

  navRow:    { position: 'absolute', bottom: 110, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  navBtn:    { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  navBtnDisabled: { opacity: 0.3 },
  counter:   { fontSize: 15, fontWeight: '700', color: WHITE },

  stripWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  strip:     { paddingHorizontal: 10, paddingVertical: 10 },
  thumb: {
    width: 56, height: 56, borderRadius: 10,
    marginHorizontal: 5, borderWidth: 2, borderColor: 'transparent',
  },
  thumbActive: { borderColor: MINT, opacity: 1 },
  thumbDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: MINT,
    alignSelf: 'center', marginTop: 4,
  },
});

// ── Grid styles ───────────────────────────────────────────────────────────────
const CARD_W = (W - 48) / 2;

const gs = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  title:   { flex: 1, fontSize: 18, fontWeight: 'bold', color: TEXT, marginLeft: 12 },
  carouselBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: MINT_LL, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: MINT_L },
  carouselBtnText: { fontSize: 13, fontWeight: '700', color: MINT, marginLeft: 4 },

  scroll: { paddingHorizontal: 16, paddingTop: 14 },

  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: MINT_LL, borderRadius: 10,
    borderWidth: 1, borderColor: MINT_L,
    padding: 10, marginBottom: 14,
  },
  bannerText: { fontSize: 13, color: '#065F46', marginLeft: 8, fontWeight: '500' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  card: {
    width: CARD_W, backgroundColor: WHITE,
    borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    overflow: 'hidden', marginBottom: 14,
  },
  cardImage: { width: '100%', height: CARD_W * 0.85 },
  typeBadge: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '800', marginLeft: 3 },
  cardInfo:  { padding: 10 },
  cardName:  { fontSize: 13, fontWeight: '700', color: TEXT },
  cardKet:   { fontSize: 11, color: MUTED, marginTop: 2 },
});
