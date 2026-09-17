import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

import { Input } from '@/components/ui/Input';
import { HabitDiscoveryModal } from '@/components/habit/HabitDiscoveryModal';
import { useCreateHabit } from '@/hooks/useHabits';
import {
  HABIT_CATEGORIES,
} from '@/constants/HabitCatalog';
import type {
  FrequencyType,
  HabitType,
  HabitCategory,
  SessionArchetype,
  TimeOfDay,
  HabitCatalogPreset,
} from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const SESSION_ARCHETYPES: {
  value: SessionArchetype;
  label: string;
  icon: IoniconsName;
  defaultHabitType: HabitType;
  description: string;
}[] = [
    {
      value: 'WORKOUT',
      label: 'Strength / Gym',
      icon: 'barbell',
      defaultHabitType: 'WORKOUT',
      description: 'Split presets, muscle checklist, sets & rest timer',
    },
    {
      value: 'CARDIO',
      label: 'Cardio / Run',
      icon: 'walk',
      defaultHabitType: 'RUNNING',
      description: 'Stopwatch, distance, pace & surface tracking',
    },
    {
      value: 'READING',
      label: 'Reading & Book',
      icon: 'book',
      defaultHabitType: 'READING',
      description: 'Page delta counter, book memory & insights',
    },
    {
      value: 'BREATHWORK',
      label: 'Breath & Calm',
      icon: 'leaf',
      defaultHabitType: 'MEDITATION',
      description: 'Animated breathing orb (Box & 4-7-8 rhythm)',
    },
    {
      value: 'HYDRATION',
      label: 'Hydration Tally',
      icon: 'water',
      defaultHabitType: 'WATER',
      description: '1-tap bottle logger & fill cylinder',
    },
    {
      value: 'SKILL',
      label: 'Skill Practice',
      icon: 'code-slash',
      defaultHabitType: 'GENERAL',
      description: 'Repetitions, exercises & focus rating',
    },
    {
      value: 'CHECKLIST',
      label: 'Standard Timer / Check',
      icon: 'timer-outline',
      defaultHabitType: 'GENERAL',
      description: 'Clean stopwatch timer or quick check-in',
    },
  ];

const CATEGORY_CONFIG: Record<
  HabitCategory,
  {
    defaultArchetype: SessionArchetype;
    defaultIcon: IoniconsName;
    defaultUnit: string;
    defaultValue: string;
    allowedArchetypes: SessionArchetype[];
  }
> = {
  FITNESS: {
    defaultArchetype: 'WORKOUT',
    defaultIcon: 'barbell',
    defaultUnit: 'mins',
    defaultValue: '50',
    allowedArchetypes: ['WORKOUT', 'CARDIO', 'CHECKLIST'],
  },
  MINDFULNESS: {
    defaultArchetype: 'BREATHWORK',
    defaultIcon: 'leaf',
    defaultUnit: 'mins',
    defaultValue: '15',
    allowedArchetypes: ['BREATHWORK', 'CHECKLIST'],
  },
  HEALTH: {
    defaultArchetype: 'HYDRATION',
    defaultIcon: 'water',
    defaultUnit: 'ml',
    defaultValue: '2500',
    allowedArchetypes: ['HYDRATION', 'CHECKLIST'],
  },
  LEARNING: {
    defaultArchetype: 'READING',
    defaultIcon: 'book',
    defaultUnit: 'pages',
    defaultValue: '20',
    allowedArchetypes: ['READING', 'SKILL', 'CHECKLIST'],
  },
  PRODUCTIVITY: {
    defaultArchetype: 'CHECKLIST',
    defaultIcon: 'hourglass',
    defaultUnit: 'mins',
    defaultValue: '45',
    allowedArchetypes: ['SKILL', 'CHECKLIST'],
  },
  CREATIVE: {
    defaultArchetype: 'SKILL',
    defaultIcon: 'musical-notes',
    defaultUnit: 'mins',
    defaultValue: '30',
    allowedArchetypes: ['SKILL', 'CHECKLIST'],
  },
  SLEEP: {
    defaultArchetype: 'CHECKLIST',
    defaultIcon: 'bed',
    defaultUnit: 'hours',
    defaultValue: '8',
    allowedArchetypes: ['CHECKLIST'],
  },
  FINANCE: {
    defaultArchetype: 'CHECKLIST',
    defaultIcon: 'wallet',
    defaultUnit: 'day',
    defaultValue: '1',
    allowedArchetypes: ['CHECKLIST'],
  },
  SOCIAL: {
    defaultArchetype: 'CHECKLIST',
    defaultIcon: 'people',
    defaultUnit: 'mins',
    defaultValue: '15',
    allowedArchetypes: ['CHECKLIST'],
  },
  DISCIPLINE: {
    defaultArchetype: 'CHECKLIST',
    defaultIcon: 'shield-checkmark',
    defaultUnit: 'day',
    defaultValue: '1',
    allowedArchetypes: ['CHECKLIST'],
  },
};

const FREQUENCIES: { value: FrequencyType; label: string; icon: IoniconsName }[] = [
  { value: 'DAILY', label: 'Daily', icon: 'sunny' },
  { value: 'WEEKLY', label: 'Weekly', icon: 'calendar' },
  { value: 'MONTHLY', label: 'Monthly', icon: 'calendar-number' },
  { value: 'CUSTOM', label: 'Custom', icon: 'flash' },
];

const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string; icon: IoniconsName }[] = [
  { value: 'MORNING', label: 'Morning', icon: 'sunny-outline' },
  { value: 'AFTERNOON', label: 'Afternoon', icon: 'partly-sunny-outline' },
  { value: 'EVENING', label: 'Evening', icon: 'moon-outline' },
  { value: 'ANYTIME', label: 'Anytime', icon: 'time-outline' },
];

const CURATED_ICONS: IoniconsName[] = [
  'barbell',
  'walk',
  'bicycle',
  'basketball',
  'leaf',
  'heart',
  'water',
  'nutrition',
  'bed',
  'book',
  'code-slash',
  'language',
  'musical-notes',
  'pencil',
  'hourglass',
  'flash',
  'wallet',
  'people',
  'shield-checkmark',
  'sunny',
  'moon',
  'trophy',
  'sparkles',
  'compass',
];

const CURATED_COLORS = [
  '#FF7675', // Coral Red
  '#E17055', // Terracotta
  '#FDCB6E', // Sun Gold
  '#00B894', // Mint Emerald
  '#00CEC9', // Persian Cyan
  '#0984E3', // Electric Blue
  '#6C5CE7', // Royal Purple
  '#E84393', // Rose Pink
];

export default function CreateHabitScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const createHabit = useCreateHabit();

  const [discoveryModalVisible, setDiscoveryModalVisible] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<HabitCategory>('FITNESS');
  const [subCategory, setSubCategory] = useState('Gym & Lifting');
  const [sessionArchetype, setSessionArchetype] = useState<SessionArchetype>('WORKOUT');
  const [targetValue, setTargetValue] = useState('50');
  const [targetUnit, setTargetUnit] = useState('mins');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('ANYTIME');
  const [selectedIcon, setSelectedIcon] = useState<IoniconsName>('barbell');
  const [selectedColor, setSelectedColor] = useState('#FF7675');
  const [frequency, setFrequency] = useState<FrequencyType>('DAILY');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');

  const availableArchetypes = useMemo(() => {
    const allowed = CATEGORY_CONFIG[category]?.allowedArchetypes || ['CHECKLIST'];
    return SESSION_ARCHETYPES.filter((a) => allowed.includes(a.value));
  }, [category]);

  // When category changes, update subcategory and default archetype
  const handleCategoryChange = (newCat: HabitCategory) => {
    setCategory(newCat);
    const meta = HABIT_CATEGORIES.find((c) => c.id === newCat);
    const cfg = CATEGORY_CONFIG[newCat];
    if (meta && meta.subCategories.length > 0) {
      setSubCategory(meta.subCategories[0]);
      setSelectedColor(meta.color);
    }
    if (cfg) {
      setSessionArchetype(cfg.defaultArchetype);
      setSelectedIcon(cfg.defaultIcon);
      setTargetUnit(cfg.defaultUnit);
      setTargetValue(cfg.defaultValue);
    }
  };

  const handleSubCategoryChange = (sub: string) => {
    setSubCategory(sub);
    const lower = sub.toLowerCase();
    if (category === 'FITNESS') {
      if (lower.includes('running') || lower.includes('jogging') || lower.includes('cycling') || lower.includes('swim')) {
        setSessionArchetype('CARDIO');
        setSelectedIcon('walk');
        setTargetUnit('km');
        setTargetValue('5');
      } else if (lower.includes('gym') || lower.includes('lifting') || lower.includes('calisthenics')) {
        setSessionArchetype('WORKOUT');
        setSelectedIcon('barbell');
        setTargetUnit('mins');
        setTargetValue('50');
      }
    } else if (category === 'MINDFULNESS') {
      if (lower.includes('breath') || lower.includes('meditat')) {
        setSessionArchetype('BREATHWORK');
        setSelectedIcon('leaf');
        setTargetUnit('mins');
        setTargetValue('15');
      } else {
        setSessionArchetype('CHECKLIST');
        setSelectedIcon('journal');
        setTargetUnit('mins');
        setTargetValue('10');
      }
    } else if (category === 'LEARNING') {
      if (lower.includes('read') || lower.includes('book')) {
        setSessionArchetype('READING');
        setSelectedIcon('book');
        setTargetUnit('pages');
        setTargetValue('20');
      } else {
        setSessionArchetype('SKILL');
        setSelectedIcon(lower.includes('code') ? 'code-slash' : 'pencil');
        setTargetUnit('mins');
        setTargetValue('30');
      }
    }
  };

  // Pre-fill from preset selected in discovery modal
  const handleSelectPresetToCustomize = (preset: HabitCatalogPreset) => {
    setName(preset.name);
    setCategory(preset.category);
    setSubCategory(preset.subCategory);
    setSessionArchetype(preset.sessionArchetype);
    setTargetValue(String(preset.targetValue));
    setTargetUnit(preset.targetUnit);
    setTimeOfDay(preset.timeOfDay);
    setSelectedIcon(preset.icon as IoniconsName);
    setSelectedColor(preset.color);
    setFrequency(preset.frequencyType);
    setError('');
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Give your habit a name!');
      return;
    }

    setError('');
    const archetypeObj = SESSION_ARCHETYPES.find((a) => a.value === sessionArchetype);
    const habitType: HabitType = archetypeObj ? archetypeObj.defaultHabitType : 'GENERAL';

    try {
      await createHabit.mutateAsync({
        name: name.trim(),
        frequencyType: frequency,
        habitType,
        config: {
          category,
          subCategory,
          sessionArchetype,
          icon: selectedIcon,
          color: selectedColor,
          targetValue: targetValue ? parseFloat(targetValue) : undefined,
          targetUnit: targetUnit.trim() || undefined,
          timeOfDay,
        },
        isPublic,
      });
      router.back();
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Failed to create habit';
      setError(message);
    }
  };

  const activeCategoryMeta = HABIT_CATEGORIES.find((c) => c.id === category);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Animated.View entering={FadeInUp.duration(400)}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
            </Pressable>
          </Animated.View>

          {/* Quick Browse Blueprint Banner */}
          <Animated.View entering={FadeInDown.duration(450)}>
            <Pressable
              style={[
                styles.blueprintBanner,
                {
                  backgroundColor: isDark ? '#2D204A' : '#EDE9FE',
                  borderColor: isDark ? '#4C3B78' : '#D8D0FE',
                },
              ]}
              onPress={() => setDiscoveryModalVisible(true)}
            >
              <View style={styles.blueprintBannerLeft}>
                <View style={[styles.blueprintBannerIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.blueprintBannerTitle, { color: colors.primary }]}>
                  Habits for you
                </Text>
              </View>
              <View style={[styles.blueprintBannerArrow, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </View>
            </Pressable>
          </Animated.View>

          {/* Splitter: or create your own */}
          <View style={styles.splitterRow}>
            <View style={[styles.splitterLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.splitterText, { color: colors.textSecondary }]}>
              or create your own
            </Text>
            <View style={[styles.splitterLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Main Configuration Card */}
          <Animated.View
            entering={FadeInDown.springify().damping(18).delay(200)}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: isDark ? '#000000' : selectedColor,
              },
            ]}
          >
            {/* Habit Name Input */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>HABIT TITLE</Text>
            <Input
              placeholder="e.g., Push Workout, 5K Run, 25 Pages..."
              value={name}
              onChangeText={(v) => {
                setName(v);
                setError('');
              }}
              error={error}
            />

            {/* 1. Category Selector (10 Top Categories) */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TOP CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {HABIT_CATEGORIES.map((cat) => {
                const isCatActive = category === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.categoryPill,
                      isCatActive
                        ? [styles.categoryPillActive, { backgroundColor: cat.color }]
                        : { backgroundColor: isDark ? colors.background : '#F8F8FE', borderColor: colors.border },
                    ]}
                    onPress={() => handleCategoryChange(cat.id)}
                  >
                    <Ionicons
                      name={cat.icon as IoniconsName}
                      size={15}
                      color={isCatActive ? '#FFFFFF' : cat.color}
                    />
                    <Text
                      style={[
                        styles.categoryPillText,
                        { color: isCatActive ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Subcategory Selector */}
            {activeCategoryMeta && (
              <View style={styles.subCategoryBlock}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  SUBCATEGORY ({activeCategoryMeta.label})
                </Text>
                <View style={styles.subCategoryChipsRow}>
                  {activeCategoryMeta.subCategories.map((sub) => {
                    const isSubActive = subCategory === sub;
                    return (
                      <Pressable
                        key={sub}
                        style={[
                          styles.subChip,
                          isSubActive
                            ? [styles.subChipActive, { backgroundColor: selectedColor }]
                            : { backgroundColor: isDark ? colors.background : '#F3F4F6', borderColor: colors.border },
                        ]}
                        onPress={() => handleSubCategoryChange(sub)}
                      >
                        <Text
                          style={[
                            styles.subChipText,
                            { color: isSubActive ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {sub}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 2. Specialized Session Archetype */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              SESSION ENGINE
            </Text>
            {availableArchetypes.length === 1 ? (
              <View
                style={[
                  styles.singleEngineCard,
                  {
                    borderColor: colors.border,
                    backgroundColor: isDark ? colors.background : '#F9FAFB',
                  },
                ]}
              >
                <View
                  style={[
                    styles.archetypeIconWrap,
                    { backgroundColor: selectedColor },
                  ]}
                >
                  <Ionicons
                    name={availableArchetypes[0].icon}
                    size={18}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.archetypeTextWrap}>
                  <Text style={[styles.archetypeTitle, { color: colors.text }]}>
                    {availableArchetypes[0].label}
                  </Text>
                  <Text style={[styles.archetypeDesc, { color: colors.textSecondary }]}>
                    {availableArchetypes[0].description}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.archetypeGrid}>
                {availableArchetypes.map((arch) => {
                  const isArchActive = sessionArchetype === arch.value;
                  return (
                    <Pressable
                      key={arch.value}
                      style={[
                        styles.archetypeCard,
                        isArchActive
                          ? [
                            styles.archetypeCardActive,
                            {
                              borderColor: selectedColor,
                              backgroundColor: selectedColor + '12',
                            },
                          ]
                          : {
                            backgroundColor: isDark ? colors.background : '#F9FAFB',
                            borderColor: colors.border,
                          },
                      ]}
                      onPress={() => setSessionArchetype(arch.value)}
                    >
                      <View
                        style={[
                          styles.archetypeIconWrap,
                          {
                            backgroundColor: isArchActive ? selectedColor : isDark ? '#374151' : '#E5E7EB',
                          },
                        ]}
                      >
                        <Ionicons
                          name={arch.icon}
                          size={18}
                          color={isArchActive ? '#FFFFFF' : colors.textSecondary}
                        />
                      </View>
                      <View style={styles.archetypeTextWrap}>
                        <Text
                          style={[
                            styles.archetypeTitle,
                            { color: isArchActive ? selectedColor : colors.text },
                          ]}
                        >
                          {arch.label}
                        </Text>
                        <Text style={[styles.archetypeDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                          {arch.description}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* 3. Target Goal & Unit */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              TARGET GOAL PER SESSION / DAY
            </Text>
            <View style={styles.targetRow}>
              <View style={styles.targetInputWrap}>
                <TextInput
                  style={[
                    styles.targetInput,
                    {
                      backgroundColor: isDark ? colors.background : '#F8F8FE',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="50"
                  placeholderTextColor={colors.textSecondary}
                  value={targetValue}
                  onChangeText={setTargetValue}
                />
              </View>

              <View style={styles.targetUnitWrap}>
                <TextInput
                  style={[
                    styles.targetInput,
                    {
                      backgroundColor: isDark ? colors.background : '#F8F8FE',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="mins, km, pages..."
                  placeholderTextColor={colors.textSecondary}
                  value={targetUnit}
                  onChangeText={setTargetUnit}
                />
              </View>
            </View>

            {/* 4. Time of Day */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              IDEAL TIME OF DAY
            </Text>
            <View style={styles.timeGrid}>
              {TIME_OF_DAY_OPTIONS.map((tod) => {
                const isTodActive = timeOfDay === tod.value;
                return (
                  <Pressable
                    key={tod.value}
                    style={[
                      styles.timeChip,
                      isTodActive
                        ? [styles.timeChipActive, { backgroundColor: selectedColor }]
                        : {
                          backgroundColor: isDark ? colors.background : '#F8F8FE',
                          borderColor: colors.border,
                        },
                    ]}
                    onPress={() => setTimeOfDay(tod.value)}
                  >
                    <Ionicons
                      name={tod.icon}
                      size={16}
                      color={isTodActive ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.timeChipText,
                        { color: isTodActive ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {tod.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 5. Custom Color & Icon Picker */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              ACCENT COLOR & ICON
            </Text>
            <View style={styles.colorRow}>
              {CURATED_COLORS.map((col) => (
                <Pressable
                  key={col}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: col },
                    selectedColor === col ? styles.colorCircleActive : undefined,
                  ]}
                  onPress={() => setSelectedColor(col)}
                >
                  {selectedColor === col && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </Pressable>
              ))}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.iconScroll}
            >
              {CURATED_ICONS.map((ic) => {
                const isIconActive = selectedIcon === ic;
                return (
                  <Pressable
                    key={ic}
                    style={[
                      styles.iconCircle,
                      isIconActive
                        ? [styles.iconCircleActive, { backgroundColor: selectedColor }]
                        : {
                          backgroundColor: isDark ? colors.background : '#F8F8FE',
                          borderColor: colors.border,
                        },
                    ]}
                    onPress={() => setSelectedIcon(ic)}
                  >
                    <Ionicons
                      name={ic}
                      size={18}
                      color={isIconActive ? '#FFFFFF' : colors.text}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 6. Frequency Selector */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              FREQUENCY
            </Text>
            <View style={styles.frequencyGrid}>
              {FREQUENCIES.map((f) => {
                const isFreqActive = frequency === f.value;
                return (
                  <Pressable
                    key={f.value}
                    style={[
                      styles.frequencyChip,
                      isFreqActive
                        ? [styles.frequencyChipActive, { backgroundColor: selectedColor }]
                        : {
                          backgroundColor: isDark ? colors.background : '#F8F8FE',
                          borderColor: colors.border,
                        },
                    ]}
                    onPress={() => setFrequency(f.value)}
                  >
                    <Ionicons
                      name={f.icon}
                      size={16}
                      color={isFreqActive ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.frequencyLabel,
                        { color: isFreqActive ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Privacy switch */}
            <View
              style={[
                styles.privacyContainer,
                {
                  backgroundColor: isDark ? colors.background : '#F8F8FE',
                  borderColor: colors.border,
                },
              ]}
            >
              <View>
                <Text style={[styles.privacyTitle, { color: colors.text }]}>Social Feed Visibility</Text>
                <Text style={[styles.privacySubtitle, { color: colors.textSecondary }]}>
                  Broadcast completed sessions to friend feed
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: isDark ? colors.border : '#E8DEFF', true: selectedColor }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Create Button */}
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                { backgroundColor: selectedColor },
                pressed ? styles.createButtonPressed : undefined,
              ]}
              onPress={handleCreate}
              disabled={createHabit.isPending}
            >
              {createHabit.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.createButtonContent}>
                  <Ionicons name={selectedIcon} size={20} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Create Habit</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Discovery Blueprint Modal */}
      <HabitDiscoveryModal
        visible={discoveryModalVisible}
        onClose={() => setDiscoveryModalVisible(false)}
        onSelectPresetToCustomize={handleSelectPresetToCustomize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 48,
  },
  blobTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFEAA7',
    opacity: 0.35,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#DFF9FB',
    opacity: 0.45,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  blueprintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  blueprintBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  blueprintBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueprintBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  blueprintBannerArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 12,
  },
  splitterLine: {
    flex: 1,
    height: 1,
  },
  splitterText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'lowercase',
    letterSpacing: 0.3,
  },
  singleEngineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 4,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  sectionHelper: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 10,
    marginTop: -4,
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  categoryPillActive: {
    borderColor: 'transparent',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subCategoryBlock: {
    marginTop: 8,
  },
  subCategoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  subChipActive: {
    borderColor: 'transparent',
  },
  subChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  archetypeGrid: {
    gap: 8,
  },
  archetypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  archetypeCardActive: {},
  archetypeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  archetypeTextWrap: {
    flex: 1,
  },
  archetypeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  archetypeDesc: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  targetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  targetInputWrap: {
    flex: 1,
  },
  targetUnitWrap: {
    flex: 2,
  },
  targetInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  timeGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  timeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  timeChipActive: {
    borderColor: 'transparent',
  },
  timeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleActive: {
    transform: [{ scale: 1.15 }],
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iconScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    borderColor: 'transparent',
  },
  frequencyGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  frequencyChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  frequencyChipActive: {
    borderColor: 'transparent',
  },
  frequencyLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 18,
    marginBottom: 18,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  privacySubtitle: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  createButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  createButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
