import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const CATEGORIES = ['Untukmu', 'Kekuatan', 'Kardio', 'Yoga'];

const RECOMMENDED_PROGRAMS = [
  {
    id: '1',
    category: 'Kekuatan',
    tag: 'Kekuatan • Seluruh tubuh',
    title: 'Kuat dari Rumah',
    meta: '20 menit • Rendah',
    offline: true,
    image:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '2',
    category: 'Kardio',
    tag: 'Kardio • Seluruh tubuh',
    title: 'Kardio Tanpa Alat',
    meta: '15 menit • Menengah',
    offline: true,
    image:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
  },
];

const STRETCHING_PROGRAMS = [
  {
    id: 's1',
    tag: 'Pemanasan / Warm-up',
    title: 'Siap Bergerak',
    meta: '5 menit • Dinamis • Rendah',
    icon: 'sunny-outline',
    iconFamily: 'Ionicons',
  },
  {
    id: 's2',
    tag: 'Pendinginan / Cool-down',
    title: 'Rileks & Pulih',
    meta: '8 menit • Statis • Rendah',
    icon: 'wind',
    iconFamily: 'Feather',
  },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Untukmu');
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  const toggleBookmark = (id) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filter program berdasarkan kategori dan input pencarian
  const filteredPrograms = RECOMMENDED_PROGRAMS.filter((item) => {
    const matchCategory =
      selectedCategory === 'Untukmu' || item.category === selectedCategory;
    const matchSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Temukan</Text>
            <Text style={styles.headerSubtitle}>Gerakan baru, semangat baru.</Text>
          </View>
          <TouchableOpacity
            style={styles.headerBookmarkBtn}
            onPress={() => {
              // Nanti bisa diarahkan ke halaman bookmark, misal: router.push('/bookmarks')
            }}
          >
            <Ionicons name="bookmark-outline" size={22} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari latihan atau program"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContainer}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section: Rekomendasi program */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rekomendasi program</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Lihat semua</Text>
          </TouchableOpacity>
        </View>

        {filteredPrograms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Program tidak ditemukan untuk pencarian "{searchQuery}"
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredPrograms.map((item) => {
              const isSaved = bookmarkedIds.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.programCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    // Contoh navigasi ke detail program:
                    // router.push(`/program/${item.id}`)
                  }}
                >
                  <View style={styles.imageWrapper}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.programImage}
                    />
                    <TouchableOpacity
                      style={styles.cardBookmarkBtn}
                      onPress={() => toggleBookmark(item.id)}
                    >
                      <Ionicons
                        name={isSaved ? 'bookmark' : 'bookmark-outline'}
                        size={16}
                        color={isSaved ? '#10B981' : '#374151'}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.cardTag}>{item.tag}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMeta}>{item.meta}</Text>

                  {item.offline && (
                    <View style={styles.offlineRow}>
                      <Feather name="download" size={13} color="#10B981" />
                      <Text style={styles.offlineText}>Offline</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Section: Peregangan */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Peregangan</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Lihat semua</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionSubtitle}>
          Siapkan tubuh sebelum latihan, pulihkan setelahnya.
        </Text>

        <View style={styles.stretchList}>
          {STRETCHING_PROGRAMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.stretchCard}
              activeOpacity={0.8}
              onPress={() => {
                // Contoh navigasi ke detail peregangan:
                // router.push(`/program/${item.id}`)
              }}
            >
              <View style={styles.stretchIconBox}>
                {item.iconFamily === 'Feather' ? (
                  <Feather name={item.icon} size={24} color="#10B981" />
                ) : (
                  <Ionicons name={item.icon} size={24} color="#10B981" />
                )}
              </View>

              <View style={styles.stretchInfo}>
                <Text style={styles.cardTag}>{item.tag}</Text>
                <Text style={styles.stretchTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>{item.meta}</Text>
                <View style={styles.offlineRow}>
                  <Feather name="download" size={13} color="#10B981" />
                  <Text style={styles.offlineText}>Tersedia offline</Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  headerBookmarkBtn: {
    padding: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  chipScroll: {
    marginBottom: 22,
  },
  chipContainer: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#059669',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: -6,
    marginBottom: 14,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#6B7280',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  programCard: {
    flex: 1,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#E5E7EB',
  },
  programImage: {
    width: '100%',
    height: 155,
    resizeMode: 'cover',
  },
  cardBookmarkBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  stretchList: {
    gap: 12,
  },
  stretchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  stretchIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stretchInfo: {
    flex: 1,
  },
  stretchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
});