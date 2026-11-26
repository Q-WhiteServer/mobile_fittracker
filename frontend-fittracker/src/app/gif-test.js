/**
 * gif-test.js — Percobaan GIF looping dengan expo-image
 * expo-image mendukung GIF di Android tanpa perlu build ulang
 * Akses: /gif-test
 */
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const SCREEN_W = Dimensions.get('window').width;
const MINT     = '#10B981';
const MINT_L   = '#D1FAE5';
const MINT_LL  = '#ECFDF5';
const TEXT     = '#111827';
const MUTED    = '#6B7280';
const BORDER   = '#E5E7EB';
const BG       = '#F9FAFB';
const WHITE    = '#FFFFFF';

// expo-image: require() untuk aset lokal GIF
const GIF_SOURCE = require('../../assets/pushup.gif');

const SIZE_OPTIONS = [
  { key: 'small',  label: 'Kecil',  w: SCREEN_W * 0.4,  h: SCREEN_W * 0.4  },
  { key: 'medium', label: 'Sedang', w: SCREEN_W * 0.75, h: SCREEN_W * 0.75 },
  { key: 'large',  label: 'Besar',  w: SCREEN_W - 40,   h: (SCREEN_W - 40) * 0.75 },
  { key: 'full',   label: 'Penuh',  w: SCREEN_W,        h: SCREEN_W * 0.65 },
];

export default function GifTestScreen() {
  const [sizeKey, setSizeKey] = useState('medium');
  const current = SIZE_OPTIONS.find((s) => s.key === sizeKey);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={TEXT} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.title}>Test GIF Loop</Text>
            <Text style={s.subtitle}>Pakai expo-image — support Android & iOS</Text>
          </View>
        </View>

        {/* Banner info */}
        <View style={s.infoBanner}>
          <Ionicons name="checkmark-circle" size={18} color={MINT} />
          <Text style={s.infoText}>
            <Text style={{ fontWeight: '700' }}>expo-image</Text> mendukung GIF animasi di Android & iOS.
            GIF otomatis loop tanpa konfigurasi tambahan.
          </Text>
        </View>

        {/* GIF display */}
        <View style={s.gifCard}>
          <Image
            source={GIF_SOURCE}
            style={{ width: current.w, height: current.h, borderRadius: 14 }}
            contentFit="contain"
            autoplay
            cachePolicy="memory-disk"
          />
        </View>

        {/* Status */}
        <View style={s.statusRow}>
          <View style={s.dot} />
          <Text style={s.statusText}>Memutar — Loop aktif ∞</Text>
        </View>

        {/* Kontrol ukuran */}
        <Text style={s.sectionTitle}>Ukuran tampilan</Text>
        <View style={s.chipRow}>
          {SIZE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              style={[s.chip, sizeKey === opt.key && s.chipActive]}
              onPress={() => setSizeKey(opt.key)}
            >
              <Text style={[s.chipText, sizeKey === opt.key && s.chipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Info teknis */}
        <Text style={s.sectionTitle}>Info teknis</Text>
        <View style={s.techCard}>
          {[
            ['Format',      'GIF (animasi)'],
            ['Library',     'expo-image (bukan RN Image)'],
            ['Loop',        'Otomatis — autoplay prop'],
            ['contentFit',  'contain / cover / fill'],
            ['Android',     '✅ Support tanpa build ulang'],
            ['iOS',         '✅ Support native'],
            ['File',        'assets/pushup.gif'],
          ].map(([label, value]) => (
            <View key={label} style={s.techRow}>
              <Text style={s.techLabel}>{label}</Text>
              <Text style={s.techValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Contoh di kartu gerakan */}
        <Text style={s.sectionTitle}>Contoh di kartu gerakan latihan</Text>
        <View style={s.exampleCard}>
          <Image
            source={GIF_SOURCE}
            style={s.exampleThumb}
            contentFit="cover"
            autoplay
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.exampleName}>1. Push Up</Text>
            <Text style={s.exampleMeta}>3 set × 10 repetisi</Text>
            <View style={s.exampleBadge}>
              <Ionicons name="play-circle" size={12} color={MINT} />
              <Text style={s.exampleBadgeText}>Animasi aktif</Text>
            </View>
          </View>
          <Ionicons name="information-circle-outline" size={22} color={MUTED} />
        </View>

        {/* contentFit demo */}
        <Text style={s.sectionTitle}>Perbedaan contentFit</Text>
        <View style={s.fitRow}>
          {(['contain', 'cover', 'fill'] ).map((fit) => (
            <View key={fit} style={s.fitCard}>
              <Image
                source={GIF_SOURCE}
                style={s.fitThumb}
                contentFit={fit}
                autoplay
              />
              <Text style={s.fitLabel}>{fit}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  header:  { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 20, fontWeight: 'bold', color: TEXT },
  subtitle:{ fontSize: 12, color: MUTED, marginTop: 2 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: MINT_LL, borderRadius: 12,
    borderWidth: 1, borderColor: MINT_L,
    padding: 12, marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, color: '#065F46', marginLeft: 8, lineHeight: 18 },

  gifCard: {
    backgroundColor: WHITE, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 24, marginBottom: 12, minHeight: 180,
  },

  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: MINT, marginRight: 6 },
  statusText:{ fontSize: 13, fontWeight: '700', color: MINT },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 10 },

  chipRow: { flexDirection: 'row', marginBottom: 24 },
  chip: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: WHITE, marginRight: 8,
  },
  chipActive:    { backgroundColor: MINT_L, borderColor: MINT },
  chipText:      { fontSize: 13, fontWeight: '600', color: MUTED },
  chipTextActive:{ color: MINT },

  techCard: { backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', marginBottom: 24 },
  techRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: BORDER },
  techLabel:{ fontSize: 13, fontWeight: '600', color: TEXT, width: 110 },
  techValue:{ flex: 1, fontSize: 12, color: MUTED },

  exampleCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    padding: 14, marginBottom: 24,
  },
  exampleThumb:    { width: 64, height: 64, borderRadius: 12 },
  exampleName:     { fontSize: 14, fontWeight: '700', color: TEXT },
  exampleMeta:     { fontSize: 12, color: MUTED, marginTop: 2 },
  exampleBadge:    { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  exampleBadgeText:{ fontSize: 11, color: MINT, fontWeight: '600', marginLeft: 4 },

  fitRow:  { flexDirection: 'row', marginBottom: 24 },
  fitCard: { flex: 1, alignItems: 'center', marginRight: 8 },
  fitThumb:{ width: '100%', height: 90, borderRadius: 10, backgroundColor: MINT_LL },
  fitLabel:{ fontSize: 11, color: MUTED, marginTop: 6, fontWeight: '600' },
});
