import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useCreateSession } from '@/hooks/useSessions';
import { useSessionStore } from '@/store/useSessionStore';
import type { HabitRespond, HabitType, SessionArchetype } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface HabitSessionModalProps {
  visible: boolean;
  habit: HabitRespond | null;
  onClose: () => void;
}

const MUSCLE_GROUPS = [
  { id: 'CHEST', label: 'Chest', icon: 'barbell-outline' },
  { id: 'BACK', label: 'Back', icon: 'shield-outline' },
  { id: 'SHOULDERS', label: 'Shoulders', icon: 'fitness-outline' },
  { id: 'BICEPS', label: 'Biceps', icon: 'flash-outline' },
  { id: 'TRICEPS', label: 'Triceps', icon: 'flash-outline' },
  { id: 'QUADS', label: 'Quads', icon: 'walk-outline' },
  { id: 'HAMSTRINGS', label: 'Hamstrings', icon: 'walk-outline' },
  { id: 'CORE', label: 'Core / Abs', icon: 'sparkles-outline' },
];

const SPLIT_PRESETS: { label: string; icon: string; parts: string[] }[] = [
  { label: 'Push', icon: '🔥', parts: ['CHEST', 'SHOULDERS', 'TRICEPS'] },
  { label: 'Pull', icon: '⚡', parts: ['BACK', 'BICEPS'] },
  { label: 'Legs', icon: '🦵', parts: ['QUADS', 'HAMSTRINGS'] },
  { label: 'Upper', icon: '💪', parts: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS'] },
  { label: 'Lower', icon: '🏃', parts: ['QUADS', 'HAMSTRINGS', 'CORE'] },
  { label: 'Full Body', icon: '🌟', parts: ['CHEST', 'BACK', 'SHOULDERS', 'QUADS', 'CORE'] },
];

const RUNNING_SURFACES = [
  { id: 'ROAD', label: 'Road', icon: 'navigate-outline' },
  { id: 'TRAIL', label: 'Trail', icon: 'trail-sign-outline' },
  { id: 'TREADMILL', label: 'Treadmill', icon: 'walk-outline' },
  { id: 'TRACK', label: 'Track', icon: 'repeat-outline' },
];

const BREATHWORK_MODES = [
  { id: 'BOX', label: 'Box 4-4-4-4', inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  { id: 'RELAX', label: 'Relax 4-7-8', inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
  { id: 'FREE', label: 'Mindful Flow', inhale: 5, hold1: 0, exhale: 5, hold2: 0 },
];

export function HabitSessionModal({ visible, habit, onClose }: HabitSessionModalProps) {
  const { colors, isDark } = useTheme();
  const createSession = useCreateSession();

  const store = useSessionStore();
  const session = habit ? store.sessions[habit.id] : undefined;

  // Resolve session archetype
  const archetype: SessionArchetype =
    habit?.config?.sessionArchetype ||
    (habit?.habitType === 'WORKOUT'
      ? 'WORKOUT'
      : habit?.habitType === 'RUNNING'
      ? 'CARDIO'
      : habit?.habitType === 'READING'
      ? 'READING'
      : habit?.habitType === 'MEDITATION'
      ? 'BREATHWORK'
      : habit?.habitType === 'WATER'
      ? 'HYDRATION'
      : habit?.habitType === 'CUSTOM'
      ? 'SKILL'
      : 'CHECKLIST');

  // ── General Timer State ──────────────────────────────
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sd = session?.sessionData || {};

  // ── 1. Workout State ──
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>(sd.bodyParts || []);
  const [workoutIntensity, setWorkoutIntensity] = useState<'WARMUP' | 'SOLID' | 'BEAST'>(sd.intensity || 'SOLID');
  const [setsCount, setSetsCount] = useState<number>(sd.setsCount || 0);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 2. Cardio State ──
  const [distanceKm, setDistanceKm] = useState(sd.distanceKm ? String(sd.distanceKm) : '');
  const [runningSurface, setRunningSurface] = useState<string>(sd.surface || 'ROAD');
  const [rpeEffort, setRpeEffort] = useState<number>(sd.rpe || 7);

  // ── 3. Reading State ──
  const configStartPage = habit?.config?.currentPage ? Number(habit.config.currentPage) : 1;
  const configBook = habit?.config?.currentBook || habit?.name || '';
  const [bookTitle, setBookTitle] = useState(sd.bookTitle || configBook);
  const [startPage, setStartPage] = useState(sd.startPage ? String(sd.startPage) : String(configStartPage));
  const [endPage, setEndPage] = useState(sd.endPage ? String(sd.endPage) : String(configStartPage));
  const [memorableQuote, setMemorableQuote] = useState(sd.quote || '');

  // ── 4. Breathwork State ──
  const [breathworkMode, setBreathworkMode] = useState<'BOX' | 'RELAX' | 'FREE'>(sd.breathMode || 'BOX');
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathCountdown, setBreathCountdown] = useState(4);
  const [postMood, setPostMood] = useState<'CALM' | 'FOCUSED' | 'ENERGIZED'>(sd.mood || 'CALM');
  const orbScale = useSharedValue(1);

  // ── 5. Skill State ──
  const [skillTask, setSkillTask] = useState(sd.skillTask || '');
  const [repsCount, setRepsCount] = useState<number>(sd.repsCount || 0);

  // ── 6. Hydration State ──
  const defaultTarget = habit?.config?.targetValue || 2500;
  const [consumedMl, setConsumedMl] = useState<number>(sd.consumedMl || 250);

  // ── Notes & Errors ──
  const [notes, setNotes] = useState(session?.notes || '');
  const [error, setError] = useState('');

  // Synchronize state with background session store
  useEffect(() => {
    if (habit && session) {
      store.updateSessionData(habit.id, {
        notes,
        sessionData: {
          archetype,
          bodyParts: selectedBodyParts,
          intensity: workoutIntensity,
          setsCount,
          distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
          surface: runningSurface,
          rpe: rpeEffort,
          bookTitle,
          startPage: parseInt(startPage) || 1,
          endPage: parseInt(endPage) || 1,
          quote: memorableQuote,
          breathMode: breathworkMode,
          mood: postMood,
          skillTask,
          repsCount,
          consumedMl,
        },
      });
    }
  }, [
    notes,
    selectedBodyParts,
    workoutIntensity,
    setsCount,
    distanceKm,
    runningSurface,
    rpeEffort,
    bookTitle,
    startPage,
    endPage,
    memorableQuote,
    breathworkMode,
    postMood,
    skillTask,
    repsCount,
    consumedMl,
  ]);

  // Initialize fresh session when modal opens
  useEffect(() => {
    if (visible && habit) {
      setError('');
      if (!store.sessions[habit.id]) {
        store.startSession(habit);
        // Defaults
        setSelectedBodyParts(habit.config?.subCategory === 'Gym & Lifting' ? ['CHEST', 'SHOULDERS', 'TRICEPS'] : []);
        setWorkoutIntensity('SOLID');
        setSetsCount(0);
        setDistanceKm('');
        const initialPage = habit.config?.currentPage ? Number(habit.config.currentPage) : 1;
        setStartPage(String(initialPage));
        setEndPage(String(initialPage));
        setBookTitle(habit.config?.currentBook || habit.name || '');
        setConsumedMl(250);
        setNotes('');
      } else {
        const esd = store.sessions[habit.id].sessionData || {};
        setSelectedBodyParts(esd.bodyParts || []);
        setWorkoutIntensity(esd.intensity || 'SOLID');
        setSetsCount(esd.setsCount || 0);
        setDistanceKm(esd.distanceKm ? String(esd.distanceKm) : '');
        setStartPage(esd.startPage ? String(esd.startPage) : String(habit.config?.currentPage || 1));
        setEndPage(esd.endPage ? String(esd.endPage) : String(habit.config?.currentPage || 1));
        setBookTitle(esd.bookTitle || habit.config?.currentBook || habit.name || '');
        setConsumedMl(esd.consumedMl || 250);
        setNotes(store.sessions[habit.id].notes || '');
      }
    }
  }, [visible, habit?.id]);

  // Main Timer engine
  useEffect(() => {
    if (session?.isRunning) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = session.startTime ? Math.floor((now - session.startTime) / 1000) : 0;
        setSecondsElapsed(session.accumulatedTime + elapsed);
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSecondsElapsed(session?.accumulatedTime || 0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.isRunning, session?.startTime, session?.accumulatedTime]);

  // Rest Timer engine (Workout)
  useEffect(() => {
    if (restSecondsRemaining !== null && restSecondsRemaining > 0) {
      restTimerRef.current = setInterval(() => {
        setRestSecondsRemaining((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
      }, 1000);
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [restSecondsRemaining]);

  // Breathwork engine (Reanimated Orb animation loop)
  useEffect(() => {
    if (archetype !== 'BREATHWORK' || !session?.isRunning) return;

    const mode = BREATHWORK_MODES.find((m) => m.id === breathworkMode) || BREATHWORK_MODES[0];
    let isCancelled = false;

    const runCycle = async () => {
      while (!isCancelled) {
        // Inhale
        setBreathPhase('Inhale');
        orbScale.value = withTiming(1.45, {
          duration: mode.inhale * 1000,
          easing: Easing.inOut(Easing.ease),
        });
        await new Promise((r) => setTimeout(r, mode.inhale * 1000));
        if (isCancelled) break;

        // Hold 1
        if (mode.hold1 > 0) {
          setBreathPhase('Hold');
          orbScale.value = withRepeat(
            withSequence(
              withTiming(1.48, { duration: 600 }),
              withTiming(1.42, { duration: 600 })
            ),
            Math.floor(mode.hold1 / 1.2),
            true
          );
          await new Promise((r) => setTimeout(r, mode.hold1 * 1000));
          if (isCancelled) break;
        }

        // Exhale
        setBreathPhase('Exhale');
        orbScale.value = withTiming(1.0, {
          duration: mode.exhale * 1000,
          easing: Easing.inOut(Easing.ease),
        });
        await new Promise((r) => setTimeout(r, mode.exhale * 1000));
        if (isCancelled) break;

        // Hold 2
        if (mode.hold2 > 0) {
          setBreathPhase('Hold');
          await new Promise((r) => setTimeout(r, mode.hold2 * 1000));
        }
      }
    };

    runCycle();

    return () => {
      isCancelled = true;
    };
  }, [archetype, breathworkMode, session?.isRunning]);

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  const toggleTimer = () => {
    if (!habit) return;
    if (session?.isRunning) {
      store.pauseSession(habit.id);
    } else {
      store.resumeSession(habit.id);
    }
  };

  const startRestTimer = (seconds: number) => {
    setRestSecondsRemaining(seconds);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pace calculation
  const calculatePace = () => {
    const dist = parseFloat(distanceKm);
    if (!dist || dist <= 0 || secondsElapsed <= 0) return null;
    const paceSeconds = secondsElapsed / dist;
    const paceMin = Math.floor(paceSeconds / 60);
    const paceSec = Math.round(paceSeconds % 60);
    return `${paceMin}'${paceSec.toString().padStart(2, '0')}" /km`;
  };

  const pagesReadDelta = Math.max(0, (parseInt(endPage) || 0) - (parseInt(startPage) || 0));

  // Finish session
  const handleFinish = async () => {
    if (!habit) return;
    setError('');

    store.finishSession(habit.id);

    const payloadSessionData: Record<string, any> = {
      archetype,
      ...sd,
    };

    if (archetype === 'WORKOUT') {
      payloadSessionData.bodyParts = selectedBodyParts;
      payloadSessionData.intensity = workoutIntensity;
      payloadSessionData.setsCount = setsCount;
    } else if (archetype === 'CARDIO') {
      const dist = parseFloat(distanceKm);
      if (dist > 0) payloadSessionData.distanceKm = dist;
      const pace = calculatePace();
      if (pace) payloadSessionData.avgPace = pace;
      payloadSessionData.surface = runningSurface;
      payloadSessionData.rpe = rpeEffort;
    } else if (archetype === 'READING') {
      const start = parseInt(startPage) || 1;
      const end = parseInt(endPage) || start;
      payloadSessionData.bookTitle = bookTitle.trim() || habit.name;
      payloadSessionData.startPage = start;
      payloadSessionData.endPage = end;
      payloadSessionData.pagesRead = Math.max(0, end - start);
      if (memorableQuote.trim()) payloadSessionData.quote = memorableQuote.trim();
    } else if (archetype === 'BREATHWORK') {
      payloadSessionData.breathMode = breathworkMode;
      payloadSessionData.mood = postMood;
    } else if (archetype === 'SKILL') {
      payloadSessionData.skillTask = skillTask.trim();
      payloadSessionData.repsCount = repsCount;
    } else if (archetype === 'HYDRATION') {
      payloadSessionData.consumedMl = consumedMl;
      payloadSessionData.glasses = Math.round(consumedMl / 250);
    }

    try {
      await createSession.mutateAsync({
        habitId: habit.id,
        data: {
          durationSeconds: secondsElapsed > 0 ? secondsElapsed : undefined,
          sessionData: payloadSessionData,
          notes: notes.trim() || undefined,
        },
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save session');
    }
  };

  const handleConfirmCancel = () => {
    Alert.alert(
      'Cancel Session?',
      'Discard this session? Your timer and any logged progress for this session will not be saved.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Discard Session',
          style: 'destructive',
          onPress: handleCancelSession,
        },
      ]
    );
  };

  const handleCancelSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    if (habit) {
      store.cancelSession(habit.id);
    }
    onClose();
  };

  if (!habit) return null;

  const habitColor = habit.config?.color || colors.primary;

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Top Bar Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={[styles.habitTitle, { color: colors.text }]} numberOfLines={1}>
                {habit.name}
              </Text>
              <View style={[styles.typeBadge, { backgroundColor: habitColor + '18' }]}>
                <Ionicons
                  name={
                    archetype === 'WORKOUT'
                      ? 'barbell'
                      : archetype === 'CARDIO'
                      ? 'walk'
                      : archetype === 'READING'
                      ? 'book'
                      : archetype === 'BREATHWORK'
                      ? 'leaf'
                      : archetype === 'HYDRATION'
                      ? 'water'
                      : archetype === 'SKILL'
                      ? 'code-slash'
                      : 'timer-outline'
                  }
                  size={12}
                  color={habitColor}
                />
                <Text style={[styles.typeBadgeText, { color: habitColor }]}>
                  {archetype === 'WORKOUT'
                    ? 'GYM / STRENGTH'
                    : archetype === 'CARDIO'
                    ? 'CARDIO / RUN'
                    : archetype === 'READING'
                    ? 'READING'
                    : archetype === 'BREATHWORK'
                    ? 'BREATHWORK'
                    : archetype === 'HYDRATION'
                    ? 'HYDRATION'
                    : archetype === 'SKILL'
                    ? 'SKILL PRACTICE'
                    : 'STANDARD TIMER'}
                </Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              <Pressable
                style={styles.cancelHeaderBtn}
                onPress={handleConfirmCancel}
                hitSlop={8}
              >
                <Text style={styles.cancelHeaderText}>Discard</Text>
              </Pressable>
              <Pressable
                style={[styles.minimizeBtn, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
                onPress={onClose}
                hitSlop={8}
              >
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── TIMER CARD (Universal for timed activities) ── */}
            {archetype !== 'HYDRATION' && archetype !== 'CHECKLIST' && (
              <Animated.View
                entering={FadeInDown.duration(400)}
                style={[
                  styles.timerCard,
                  {
                    backgroundColor: isDark ? colors.background : '#F8F6FF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
                  {session?.isRunning ? 'ACTIVE SESSION' : 'STOPWATCH'}
                </Text>
                <Text style={[styles.timerValue, { color: habitColor }]}>
                  {formatTimer(secondsElapsed)}
                </Text>

                <View style={styles.timerControls}>
                  <Pressable
                    style={[
                      styles.timerButton,
                      session?.isRunning
                        ? styles.timerButtonPause
                        : [styles.timerButtonPlay, { backgroundColor: habitColor }],
                    ]}
                    onPress={toggleTimer}
                  >
                    <Ionicons
                      name={session?.isRunning ? 'pause' : 'play'}
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.timerButtonText}>
                      {session?.isRunning ? 'Pause' : secondsElapsed > 0 ? 'Resume' : 'Start'}
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {/* ══════════════════════════════════════════════════════════
                1. WORKOUT ENGINE: Splits, Muscles, Sets & Rest Timer
               ══════════════════════════════════════════════════════════ */}
            {archetype === 'WORKOUT' && (
              <Animated.View entering={FadeInDown.duration(450)} style={styles.engineBlock}>
                {/* 1-Tap Split Presets */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  1-TAP SPLIT PRESETS
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.splitRow}>
                  {SPLIT_PRESETS.map((preset) => (
                    <Pressable
                      key={preset.label}
                      style={[
                        styles.splitChip,
                        {
                          backgroundColor: isDark ? colors.background : '#F3F4F6',
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setSelectedBodyParts(preset.parts)}
                    >
                      <Text style={styles.splitIcon}>{preset.icon}</Text>
                      <Text style={[styles.splitLabel, { color: colors.text }]}>{preset.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {/* Muscle Activation Matrix */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 14 }]}>
                  TARGET MUSCLE GROUPS
                </Text>
                <View style={styles.muscleGrid}>
                  {MUSCLE_GROUPS.map((mg) => {
                    const isSelected = selectedBodyParts.includes(mg.id);
                    return (
                      <Pressable
                        key={mg.id}
                        style={[
                          styles.muscleChip,
                          isSelected
                            ? [styles.muscleChipActive, { backgroundColor: habitColor }]
                            : {
                                backgroundColor: isDark ? colors.background : '#F9FAFB',
                                borderColor: colors.border,
                              },
                        ]}
                        onPress={() => {
                          setSelectedBodyParts((prev) =>
                            prev.includes(mg.id) ? prev.filter((p) => p !== mg.id) : [...prev, mg.id]
                          );
                        }}
                      >
                        <Ionicons
                          name={mg.icon as IoniconsName}
                          size={14}
                          color={isSelected ? '#FFFFFF' : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.muscleLabel,
                            { color: isSelected ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {mg.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Interactive Set Logger & Rest Timer */}
                <View style={[styles.workoutSetCard, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border }]}>
                  <View style={styles.workoutSetHeader}>
                    <View>
                      <Text style={[styles.workoutSetTitle, { color: colors.text }]}>Sets Completed</Text>
                      <Text style={[styles.workoutSetCount, { color: habitColor }]}>{setsCount} Sets</Text>
                    </View>

                    <Pressable
                      style={[styles.addSetBtn, { backgroundColor: habitColor }]}
                      onPress={() => setSetsCount((c) => c + 1)}
                    >
                      <Ionicons name="add" size={18} color="#FFFFFF" />
                      <Text style={styles.addSetBtnText}>+ Set</Text>
                    </Pressable>
                  </View>

                  {/* Rest Timer Toggle */}
                  <Text style={[styles.restTimerTitle, { color: colors.textSecondary }]}>REST INTERVAL TIMER</Text>
                  <View style={styles.restTimerRow}>
                    {[30, 60, 90, 120].map((sec) => (
                      <Pressable
                        key={sec}
                        style={[
                          styles.restTimerChip,
                          restSecondsRemaining === sec
                            ? [styles.restTimerChipActive, { backgroundColor: habitColor }]
                            : { borderColor: colors.border },
                        ]}
                        onPress={() => startRestTimer(sec)}
                      >
                        <Text style={[styles.restTimerChipText, { color: restSecondsRemaining === sec ? '#FFF' : colors.text }]}>
                          {sec}s
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {restSecondsRemaining !== null && (
                    <View style={styles.restCountdownBanner}>
                      <Ionicons name="timer-outline" size={18} color="#FF7675" />
                      <Text style={styles.restCountdownText}>
                        Resting: {restSecondsRemaining}s remaining
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            )}

            {/* ══════════════════════════════════════════════════════════
                2. CARDIO ENGINE: Pace, Distance, Terrain & Effort
               ══════════════════════════════════════════════════════════ */}
            {archetype === 'CARDIO' && (
              <Animated.View entering={FadeInDown.duration(450)} style={styles.engineBlock}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DISTANCE (KM)</Text>
                <View style={styles.distancePresetsRow}>
                  {['1', '3', '5', '10'].map((km) => (
                    <Pressable
                      key={km}
                      style={[
                        styles.distChip,
                        distanceKm === km
                          ? [styles.distChipActive, { backgroundColor: habitColor }]
                          : { borderColor: colors.border, backgroundColor: isDark ? colors.background : '#F3F4F6' },
                      ]}
                      onPress={() => setDistanceKm(km)}
                    >
                      <Text style={[styles.distChipText, { color: distanceKm === km ? '#FFF' : colors.text }]}>
                        {km} km
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  style={[
                    styles.customInput,
                    {
                      backgroundColor: isDark ? colors.background : '#F9FAFB',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  keyboardType="decimal-pad"
                  placeholder="Or enter custom distance (e.g. 4.2)"
                  placeholderTextColor={colors.textSecondary}
                  value={distanceKm}
                  onChangeText={setDistanceKm}
                />

                {calculatePace() && (
                  <View style={[styles.metricHighlight, { backgroundColor: habitColor + '18' }]}>
                    <Ionicons name="speedometer-outline" size={20} color={habitColor} />
                    <Text style={[styles.metricHighlightText, { color: habitColor }]}>
                      Calculated Pace: {calculatePace()}
                    </Text>
                  </View>
                )}

                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 14 }]}>SURFACE / TERRAIN</Text>
                <View style={styles.surfaceRow}>
                  {RUNNING_SURFACES.map((surf) => {
                    const isSurfActive = runningSurface === surf.id;
                    return (
                      <Pressable
                        key={surf.id}
                        style={[
                          styles.surfaceChip,
                          isSurfActive
                            ? [styles.surfaceChipActive, { backgroundColor: habitColor }]
                            : { borderColor: colors.border, backgroundColor: isDark ? colors.background : '#F9FAFB' },
                        ]}
                        onPress={() => setRunningSurface(surf.id)}
                      >
                        <Ionicons
                          name={surf.icon as IoniconsName}
                          size={15}
                          color={isSurfActive ? '#FFFFFF' : colors.textSecondary}
                        />
                        <Text style={[styles.surfaceChipText, { color: isSurfActive ? '#FFFFFF' : colors.text }]}>
                          {surf.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* ══════════════════════════════════════════════════════════
                3. READING ENGINE: Pages Delta, Book & Insight Capture
               ══════════════════════════════════════════════════════════ */}
            {archetype === 'READING' && (
              <Animated.View entering={FadeInDown.duration(450)} style={styles.engineBlock}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BOOK TITLE</Text>
                <TextInput
                  style={[
                    styles.customInput,
                    {
                      backgroundColor: isDark ? colors.background : '#F9FAFB',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. Atomic Habits, Meditations..."
                  placeholderTextColor={colors.textSecondary}
                  value={bookTitle}
                  onChangeText={setBookTitle}
                />

                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 14 }]}>PAGE TRACKER</Text>
                <View style={styles.readingPagesRow}>
                  <View style={styles.readingPageCol}>
                    <Text style={[styles.pageInputLabel, { color: colors.textSecondary }]}>Start Page</Text>
                    <TextInput
                      style={[
                        styles.pageInput,
                        {
                          backgroundColor: isDark ? colors.background : '#F9FAFB',
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      keyboardType="numeric"
                      value={startPage}
                      onChangeText={setStartPage}
                    />
                  </View>

                  <View style={styles.readingPageArrow}>
                    <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
                  </View>

                  <View style={styles.readingPageCol}>
                    <Text style={[styles.pageInputLabel, { color: colors.textSecondary }]}>End Page</Text>
                    <TextInput
                      style={[
                        styles.pageInput,
                        {
                          backgroundColor: isDark ? colors.background : '#F9FAFB',
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      keyboardType="numeric"
                      value={endPage}
                      onChangeText={setEndPage}
                    />
                  </View>
                </View>

                {pagesReadDelta > 0 && (
                  <View style={[styles.metricHighlight, { backgroundColor: '#FDCB6E22' }]}>
                    <Ionicons name="book-outline" size={20} color="#D48806" />
                    <Text style={[styles.metricHighlightText, { color: '#D48806' }]}>
                      Progress: +{pagesReadDelta} pages read!
                    </Text>
                  </View>
                )}

                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 14 }]}>
                  FAVORITE QUOTE / KEY INSIGHT
                </Text>
                <TextInput
                  style={[
                    styles.customInputMulti,
                    {
                      backgroundColor: isDark ? colors.background : '#F9FAFB',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Record an inspiring thought or mental model..."
                  placeholderTextColor={colors.textSecondary}
                  value={memorableQuote}
                  onChangeText={setMemorableQuote}
                  multiline
                />
              </Animated.View>
            )}



            {/* ══════════════════════════════════════════════════════════
                5. BREATHWORK ENGINE: Guided Pulsating Orb & Pacing
               ══════════════════════════════════════════════════════════ */}
            {archetype === 'BREATHWORK' && (
              <Animated.View entering={FadeInDown.duration(450)} style={styles.engineBlock}>
                <View style={styles.breathModeRow}>
                  {BREATHWORK_MODES.map((mode) => (
                    <Pressable
                      key={mode.id}
                      style={[
                        styles.breathModeChip,
                        breathworkMode === mode.id
                          ? [styles.breathModeChipActive, { backgroundColor: habitColor }]
                          : { borderColor: colors.border, backgroundColor: isDark ? colors.background : '#F3F4F6' },
                      ]}
                      onPress={() => setBreathworkMode(mode.id as any)}
                    >
                      <Text
                        style={[
                          styles.breathModeText,
                          { color: breathworkMode === mode.id ? '#FFF' : colors.text },
                        ]}
                      >
                        {mode.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Animated Breathing Orb */}
                <View style={styles.orbContainer}>
                  <Animated.View
                    style={[
                      styles.breathingOrb,
                      { backgroundColor: habitColor + '2E', borderColor: habitColor },
                      animatedOrbStyle,
                    ]}
                  >
                    <Text style={[styles.breathPhaseText, { color: habitColor }]}>
                      {session?.isRunning ? breathPhase : 'Ready'}
                    </Text>
                  </Animated.View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 14 }]}>
                  POST-SESSION MOOD
                </Text>
                <View style={styles.moodRow}>
                  {[
                    { id: 'CALM', label: 'Calm 😌' },
                    { id: 'FOCUSED', label: 'Focused 🎯' },
                    { id: 'ENERGIZED', label: 'Energized ⚡' },
                  ].map((m) => (
                    <Pressable
                      key={m.id}
                      style={[
                        styles.moodChip,
                        postMood === m.id
                          ? [styles.moodChipActive, { backgroundColor: habitColor }]
                          : { borderColor: colors.border, backgroundColor: isDark ? colors.background : '#F3F4F6' },
                      ]}
                      onPress={() => setPostMood(m.id as any)}
                    >
                      <Text
                        style={[
                          styles.moodChipText,
                          { color: postMood === m.id ? '#FFF' : colors.text },
                        ]}
                      >
                        {m.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* ══════════════════════════════════════════════════════════
                6. HYDRATION ENGINE: 1-Tap Rapid Logger & Cylinder
               ══════════════════════════════════════════════════════════ */}
            {archetype === 'HYDRATION' && (
              <Animated.View entering={FadeInDown.duration(450)} style={styles.engineBlock}>
                <View
                  style={[
                    styles.hydrationCylinderCard,
                    { backgroundColor: isDark ? colors.background : '#EFF6FF', borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="water" size={32} color="#0984E3" />
                  <Text style={[styles.hydrationTotal, { color: '#0984E3' }]}>
                    {consumedMl} ml
                  </Text>
                  <Text style={[styles.hydrationTarget, { color: colors.textSecondary }]}>
                    Target: {defaultTarget} ml ({Math.min(100, Math.round((consumedMl / defaultTarget) * 100))}%)
                  </Text>

                  <View style={styles.hydrationProgressTrack}>
                    <View
                      style={[
                        styles.hydrationProgressBar,
                        {
                          width: `${Math.min(100, (consumedMl / defaultTarget) * 100)}%`,
                          backgroundColor: '#0984E3',
                        },
                      ]}
                    />
                  </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 14 }]}>
                  TAP TO ADD WATER
                </Text>
                <View style={styles.waterTapRow}>
                  {[
                    { label: '+250 ml', icon: 'wine-outline', ml: 250 },
                    { label: '+500 ml', icon: 'water-outline', ml: 500 },
                    { label: '+750 ml', icon: 'flask-outline', ml: 750 },
                  ].map((btn) => (
                    <Pressable
                      key={btn.label}
                      style={[styles.waterTapBtn, { borderColor: colors.border }]}
                      onPress={() => setConsumedMl((prev) => prev + btn.ml)}
                    >
                      <Ionicons name={btn.icon as IoniconsName} size={20} color="#0984E3" />
                      <Text style={[styles.waterTapBtnText, { color: colors.text }]}>{btn.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* ══════════════════════════════════════════════════════════
                7. SKILL ENGINE: Topic & Reps Counter
               ══════════════════════════════════════════════════════════ */}
            {archetype === 'SKILL' && (
              <Animated.View entering={FadeInDown.duration(450)} style={styles.engineBlock}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SKILL TOPIC</Text>
                <TextInput
                  style={[
                    styles.customInput,
                    {
                      backgroundColor: isDark ? colors.background : '#F9FAFB',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. LeetCode Trees, Spanish Vocab, Blues Solo..."
                  placeholderTextColor={colors.textSecondary}
                  value={skillTask}
                  onChangeText={setSkillTask}
                />

                <View style={[styles.repCounterCard, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border }]}>
                  <Text style={[styles.repCounterTitle, { color: colors.text }]}>Problems / Reps Solved</Text>
                  <Text style={[styles.repCounterValue, { color: habitColor }]}>{repsCount}</Text>
                  <View style={styles.repButtonsRow}>
                    <Pressable style={[styles.repBtn, { borderColor: colors.border }]} onPress={() => setRepsCount((c) => Math.max(0, c - 1))}>
                      <Text style={[styles.repBtnText, { color: colors.text }]}>-1</Text>
                    </Pressable>
                    <Pressable style={[styles.repBtn, { backgroundColor: habitColor }]} onPress={() => setRepsCount((c) => c + 1)}>
                      <Text style={[styles.repBtnText, { color: '#FFF' }]}>+1</Text>
                    </Pressable>
                    <Pressable style={[styles.repBtn, { backgroundColor: habitColor }]} onPress={() => setRepsCount((c) => c + 5)}>
                      <Text style={[styles.repBtnText, { color: '#FFF' }]}>+5</Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            )}



            {/* ── Universal Notes Section ── */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 16 }]}>
              SESSION NOTES (OPTIONAL)
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: isDark ? colors.background : '#F9FAFB',
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="How did this session feel? What did you accomplish?"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* ── Complete Session Action Button ── */}
            <Pressable
              style={({ pressed }) => [
                styles.finishButton,
                { backgroundColor: habitColor },
                pressed ? styles.finishButtonPressed : undefined,
              ]}
              onPress={handleFinish}
              disabled={createSession.isPending}
            >
              {createSession.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.finishButtonContent}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.finishButtonText}>Complete Session 🎯</Text>
                </View>
              )}
            </Pressable>

            {/* ── Cancel & Discard Option ── */}
            <Pressable style={styles.discardFooterBtn} onPress={handleConfirmCancel}>
              <Ionicons name="trash-outline" size={15} color="#FF7675" />
              <Text style={styles.discardFooterText}>Cancel & Discard Session</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  headerInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelHeaderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelHeaderText: {
    color: '#FF7675',
    fontSize: 14,
    fontWeight: '700',
  },
  minimizeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  timerCard: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timerValue: {
    fontSize: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 6,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 10,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  timerButtonPlay: {},
  timerButtonPause: {
    backgroundColor: '#FF7675',
  },
  timerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  engineBlock: {
    marginBottom: 14,
  },
  splitRow: {
    gap: 8,
    paddingBottom: 4,
  },
  splitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  splitIcon: {
    fontSize: 14,
  },
  splitLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  muscleChipActive: {
    borderColor: 'transparent',
  },
  muscleLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  workoutSetCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  workoutSetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  workoutSetTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  workoutSetCount: {
    fontSize: 18,
    fontWeight: '800',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addSetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  restTimerTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  restTimerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  restTimerChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  restTimerChipActive: {
    borderColor: 'transparent',
  },
  restTimerChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  restCountdownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE3E3',
    padding: 8,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  restCountdownText: {
    color: '#D63031',
    fontSize: 12,
    fontWeight: '700',
  },
  distancePresetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  distChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  distChipActive: {
    borderColor: 'transparent',
  },
  distChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  customInput: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  customInputMulti: {
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '500',
  },
  metricHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 10,
  },
  metricHighlightText: {
    fontSize: 13,
    fontWeight: '800',
  },
  surfaceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  surfaceChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  surfaceChipActive: {
    borderColor: 'transparent',
  },
  surfaceChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  readingPagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  readingPageCol: {
    flex: 1,
  },
  pageInputLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  pageInput: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },
  readingPageArrow: {
    paddingTop: 16,
  },
  shieldCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  shieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  shieldTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  shieldDesc: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  shieldCount: {
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 8,
  },
  shieldTapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  shieldTapBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  breathModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  breathModeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  breathModeChipActive: {
    borderColor: 'transparent',
  },
  breathModeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    marginVertical: 10,
  },
  breathingOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathPhaseText: {
    fontSize: 15,
    fontWeight: '800',
  },
  moodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  moodChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  moodChipActive: {
    borderColor: 'transparent',
  },
  moodChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  hydrationCylinderCard: {
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  hydrationTotal: {
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 4,
  },
  hydrationTarget: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  hydrationProgressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  hydrationProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  waterTapRow: {
    flexDirection: 'row',
    gap: 8,
  },
  waterTapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  waterTapBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  repCounterCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  repCounterTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  repCounterValue: {
    fontSize: 36,
    fontWeight: '800',
    marginVertical: 6,
  },
  repButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  repBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  repBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  triggerChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  triggerChipActive: {
    borderColor: 'transparent',
  },
  triggerChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesInput: {
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
  },
  errorText: {
    color: '#FF7675',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  finishButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  finishButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  finishButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  discardFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    marginTop: 8,
  },
  discardFooterText: {
    color: '#FF7675',
    fontSize: 14,
    fontWeight: '700',
  },
});
