import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useCreateHabit } from '@/hooks/useHabits';
import {
  HABIT_CATEGORIES,
  HABIT_PRESETS,
  searchPresets,
} from '@/constants/HabitCatalog';
import type { HabitCategory, HabitCatalogPreset } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface HabitDiscoveryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPresetToCustomize?: (preset: HabitCatalogPreset) => void;
}

export function HabitDiscoveryModal({
  visible,
  onClose,
  onSelectPresetToCustomize,
}: HabitDiscoveryModalProps) {
  const { colors, isDark } = useTheme();
  const createHabit = useCreateHabit();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'ALL'>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');
  const [selectedPresetForDetail, setSelectedPresetForDetail] = useState<HabitCatalogPreset | null>(null);
  const [addingPresetId, setAddingPresetId] = useState<string | null>(null);
  const [addedPresetIds, setAddedPresetIds] = useState<Set<string>>(new Set());

  // Available subcategories based on category
  const activeCategoryMeta = useMemo(() => {
    if (selectedCategory === 'ALL') return null;
    return HABIT_CATEGORIES.find((c) => c.id === selectedCategory);
  }, [selectedCategory]);

  const filteredPresets = useMemo(() => {
    return searchPresets(
      searchQuery,
      selectedCategory === 'ALL' ? undefined : selectedCategory,
      selectedSubCategory === 'ALL' ? undefined : selectedSubCategory
    );
  }, [searchQuery, selectedCategory, selectedSubCategory]);

  const handleQuickAdd = async (preset: HabitCatalogPreset) => {
    try {
      setAddingPresetId(preset.id);
      await createHabit.mutateAsync({
        name: preset.name,
        frequencyType: preset.frequencyType,
        habitType: preset.habitType,
        config: {
          category: preset.category,
          subCategory: preset.subCategory,
          sessionArchetype: preset.sessionArchetype,
          icon: preset.icon,
          color: preset.color,
          targetValue: preset.targetValue,
          targetUnit: preset.targetUnit,
          timeOfDay: preset.timeOfDay,
          tagline: preset.tagline,
          benefits: preset.benefits,
          quickTips: preset.quickTips,
        },
        isPublic: true,
      });
      setAddedPresetIds((prev) => new Set(prev).add(preset.id));
      if (selectedPresetForDetail?.id === preset.id) {
        setSelectedPresetForDetail(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add habit');
    } finally {
      setAddingPresetId(null);
    }
  };

  const handleCustomize = (preset: HabitCatalogPreset) => {
    if (onSelectPresetToCustomize) {
      onSelectPresetToCustomize(preset);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIconWrap, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="compass" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Habit Blueprint Library</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                38+ science-backed habits ready to adopt
              </Text>
            </View>
          </View>
          <Pressable style={[styles.closeBtn, { backgroundColor: isDark ? colors.card : '#F0EDFF' }]} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search habits, gym splits, breathing, code..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Categories Horizontal Scroll */}
        <View style={styles.categoryScrollWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContent}>
            <Pressable
              style={[
                styles.categoryChip,
                selectedCategory === 'ALL'
                  ? [styles.categoryChipActive, { backgroundColor: colors.primary }]
                  : { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => {
                setSelectedCategory('ALL');
                setSelectedSubCategory('ALL');
              }}
            >
              <Ionicons
                name="apps"
                size={14}
                color={selectedCategory === 'ALL' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  { color: selectedCategory === 'ALL' ? '#FFFFFF' : colors.text },
                ]}
              >
                All ({HABIT_PRESETS.length})
              </Text>
            </Pressable>

            {HABIT_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const count = HABIT_PRESETS.filter((p) => p.category === cat.id).length;
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isActive
                      ? [styles.categoryChipActive, { backgroundColor: cat.color }]
                      : { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSubCategory('ALL');
                  }}
                >
                  <Ionicons
                    name={cat.icon as IoniconsName}
                    size={14}
                    color={isActive ? '#FFFFFF' : cat.color}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: isActive ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {cat.label} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Subcategories (if a specific category is chosen) */}
        {activeCategoryMeta && (
          <View style={styles.subCategoryScrollWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subCategoryScrollContent}>
              <Pressable
                style={[
                  styles.subCategoryChip,
                  selectedSubCategory === 'ALL'
                    ? [styles.subCategoryChipActive, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]
                    : { borderColor: colors.border },
                ]}
                onPress={() => setSelectedSubCategory('ALL')}
              >
                <Text
                  style={[
                    styles.subCategoryChipText,
                    { color: selectedSubCategory === 'ALL' ? colors.text : colors.textSecondary },
                  ]}
                >
                  All {activeCategoryMeta.label}
                </Text>
              </Pressable>
              {activeCategoryMeta.subCategories.map((sub) => {
                const isSubActive = selectedSubCategory === sub;
                return (
                  <Pressable
                    key={sub}
                    style={[
                      styles.subCategoryChip,
                      isSubActive
                        ? [styles.subCategoryChipActive, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]
                        : { borderColor: colors.border },
                    ]}
                    onPress={() => setSelectedSubCategory(sub)}
                  >
                    <Text
                      style={[
                        styles.subCategoryChipText,
                        { color: isSubActive ? colors.text : colors.textSecondary },
                      ]}
                    >
                      {sub}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Preset Cards List */}
        <ScrollView contentContainerStyle={styles.presetsList} showsVerticalScrollIndicator={false}>
          {filteredPresets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No habits found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Try searching for different keywords or clear filters
              </Text>
            </View>
          ) : (
            filteredPresets.map((preset, idx) => {
              const isAdded = addedPresetIds.has(preset.id);
              const isAdding = addingPresetId === preset.id;

              return (
                <Animated.View key={preset.id} entering={FadeInDown.duration(300).delay(idx * 30)}>
                  <Pressable
                    style={[
                      styles.presetCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        shadowColor: isDark ? '#000000' : preset.color,
                      },
                    ]}
                    onPress={() => setSelectedPresetForDetail(preset)}
                  >
                    <View style={styles.presetTopRow}>
                      <View style={[styles.presetIconWrap, { backgroundColor: preset.color + '1E' }]}>
                        <Ionicons name={preset.icon as IoniconsName} size={22} color={preset.color} />
                      </View>

                      <View style={styles.presetMainInfo}>
                        <View style={styles.badgeRow}>
                          <View style={[styles.categoryBadge, { backgroundColor: preset.color + '1A' }]}>
                            <Text style={[styles.categoryBadgeText, { color: preset.color }]}>
                              {preset.subCategory}
                            </Text>
                          </View>
                          <View style={[styles.targetBadge, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                            <Ionicons name="flag-outline" size={10} color={colors.textSecondary} />
                            <Text style={[styles.targetBadgeText, { color: colors.textSecondary }]}>
                              {preset.targetValue} {preset.targetUnit}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.presetName, { color: colors.text }]} numberOfLines={1}>
                          {preset.name}
                        </Text>
                        <Text style={[styles.presetTagline, { color: colors.textSecondary }]} numberOfLines={2}>
                          {preset.tagline}
                        </Text>
                      </View>
                    </View>

                    {/* Footer Actions */}
                    <View style={[styles.presetCardFooter, { borderTopColor: colors.border }]}>
                      <View style={styles.timeTag}>
                        <Ionicons
                          name={
                            preset.timeOfDay === 'MORNING'
                              ? 'sunny-outline'
                              : preset.timeOfDay === 'EVENING'
                              ? 'moon-outline'
                              : 'time-outline'
                          }
                          size={12}
                          color={colors.textSecondary}
                        />
                        <Text style={[styles.timeTagText, { color: colors.textSecondary }]}>
                          {preset.timeOfDay.toLowerCase()}
                        </Text>
                      </View>

                      <View style={styles.footerButtons}>
                        <Pressable
                          style={[styles.inspectBtn, { borderColor: colors.border }]}
                          onPress={() => setSelectedPresetForDetail(preset)}
                        >
                          <Text style={[styles.inspectBtnText, { color: colors.text }]}>Details</Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.addBtn,
                            { backgroundColor: isAdded ? '#00B894' : preset.color },
                          ]}
                          onPress={() => handleQuickAdd(preset)}
                          disabled={isAdded || isAdding}
                        >
                          {isAdding ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : isAdded ? (
                            <View style={styles.addedRow}>
                              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                              <Text style={styles.addBtnText}>Added</Text>
                            </View>
                          ) : (
                            <View style={styles.addedRow}>
                              <Ionicons name="add" size={14} color="#FFFFFF" />
                              <Text style={styles.addBtnText}>Add</Text>
                            </View>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })
          )}
        </ScrollView>

        {/* Detailed Blueprint Preview In-Place Overlay (No nested modal to avoid iOS white screen) */}
        {selectedPresetForDetail && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.detailBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setSelectedPresetForDetail(null)}
            />
            <Animated.View
              entering={FadeInUp.springify().damping(18)}
              style={[
                styles.detailCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
                {/* Header */}
                <View style={styles.detailHeader}>
                  <View
                    style={[
                      styles.detailIconWrap,
                      { backgroundColor: selectedPresetForDetail.color + '22' },
                    ]}
                  >
                    <Ionicons
                      name={selectedPresetForDetail.icon as IoniconsName}
                      size={32}
                      color={selectedPresetForDetail.color}
                    />
                  </View>
                  <View style={styles.detailHeaderInfo}>
                    <View style={[styles.categoryBadge, { backgroundColor: selectedPresetForDetail.color + '1A' }]}>
                      <Text style={[styles.categoryBadgeText, { color: selectedPresetForDetail.color }]}>
                        {selectedPresetForDetail.subCategory}
                      </Text>
                    </View>
                    <Text style={[styles.detailTitle, { color: colors.text }]}>
                      {selectedPresetForDetail.name}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.detailCloseBtn}
                    onPress={() => setSelectedPresetForDetail(null)}
                  >
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>

                <Text style={[styles.detailTagline, { color: colors.textSecondary }]}>
                  "{selectedPresetForDetail.tagline}"
                </Text>

                {/* Target & Time Stats Grid */}
                <View style={[styles.detailStatsRow, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}>
                  <View style={styles.detailStatItem}>
                    <Text style={[styles.detailStatLabel, { color: colors.textSecondary }]}>TARGET GOAL</Text>
                    <Text style={[styles.detailStatValue, { color: colors.text }]}>
                      {selectedPresetForDetail.targetValue} {selectedPresetForDetail.targetUnit}
                    </Text>
                  </View>
                  <View style={styles.detailStatDivider} />
                  <View style={styles.detailStatItem}>
                    <Text style={[styles.detailStatLabel, { color: colors.textSecondary }]}>IDEAL TIME</Text>
                    <Text style={[styles.detailStatValue, { color: colors.text }]}>
                      {selectedPresetForDetail.timeOfDay}
                    </Text>
                  </View>
                  <View style={styles.detailStatDivider} />
                  <View style={styles.detailStatItem}>
                    <Text style={[styles.detailStatLabel, { color: colors.textSecondary }]}>SESSION TYPE</Text>
                    <Text style={[styles.detailStatValue, { color: selectedPresetForDetail.color }]}>
                      {selectedPresetForDetail.sessionArchetype}
                    </Text>
                  </View>
                </View>

                {/* Science-Backed Benefits */}
                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                    🔬 Proven Benefits
                  </Text>
                  {selectedPresetForDetail.benefits.map((b, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#00B894" style={styles.bulletIcon} />
                      <Text style={[styles.bulletText, { color: colors.text }]}>{b}</Text>
                    </View>
                  ))}
                </View>

                {/* Quick Pro Tips */}
                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                    💡 Pro Tips for Consistency
                  </Text>
                  {selectedPresetForDetail.quickTips.map((tip, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Ionicons name="bulb-outline" size={16} color="#FDCB6E" style={styles.bulletIcon} />
                      <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{tip}</Text>
                    </View>
                  ))}
                </View>

                {/* Bottom Actions */}
                <View style={styles.detailActionsRow}>
                  {onSelectPresetToCustomize && (
                    <Pressable
                      style={[styles.customizeBtn, { borderColor: colors.border }]}
                      onPress={() => handleCustomize(selectedPresetForDetail)}
                    >
                      <Ionicons name="options-outline" size={16} color={colors.text} />
                      <Text style={[styles.customizeBtnText, { color: colors.text }]}>Customize</Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={[
                      styles.confirmAddBtn,
                      {
                        backgroundColor: addedPresetIds.has(selectedPresetForDetail.id)
                          ? '#00B894'
                          : selectedPresetForDetail.color,
                        flex: onSelectPresetToCustomize ? 1.5 : 1,
                      },
                    ]}
                    onPress={() => handleQuickAdd(selectedPresetForDetail)}
                    disabled={
                      addedPresetIds.has(selectedPresetForDetail.id) ||
                      addingPresetId === selectedPresetForDetail.id
                    }
                  >
                    {addingPresetId === selectedPresetForDetail.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : addedPresetIds.has(selectedPresetForDetail.id) ? (
                      <Text style={styles.confirmAddBtnText}>Already Added ✓</Text>
                    ) : (
                      <Text style={styles.confirmAddBtnText}>Adopt This Habit 🎯</Text>
                    )}
                  </Pressable>
                </View>
              </Animated.View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryScrollWrap: {
    height: 46,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryChipActive: {
    borderColor: 'transparent',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subCategoryScrollWrap: {
    height: 38,
    marginTop: 4,
  },
  subCategoryScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 6,
  },
  subCategoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  subCategoryChipActive: {
    borderColor: 'transparent',
  },
  subCategoryChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  presetsList: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 12,
  },
  presetCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  presetTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  presetIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  presetMainInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  targetBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  presetName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  presetTagline: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  presetCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inspectBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  inspectBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 4,
    textAlign: 'center',
  },

  // Detail Overlay
  detailBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
  },
  detailCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailHeaderInfo: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  detailCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTagline: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  detailStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  detailStatItem: {
    alignItems: 'center',
  },
  detailStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailStatValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  detailStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  detailSection: {
    marginBottom: 14,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  detailActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  customizeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  customizeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmAddBtn: {
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
