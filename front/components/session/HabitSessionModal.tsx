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
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useCreateSession } from '@/hooks/useSessions';
import { useSessionStore } from '@/store/useSessionStore';
import type { HabitRespond, HabitType } from '@/types';

interface HabitSessionModalProps {
  visible: boolean;
  habit: HabitRespond | null;
  onClose: () => void;
}

const MUSCLE_GROUPS = [
  { id: 'CHEST', label: 'Chest', icon: 'barbell-outline' },
  { id: 'BACK', label: 'Back', icon: 'shield-outline' },
  { id: 'SHOULDERS', label: 'Shoulders', icon: 'fitness-outline' },
  { id: 'ARMS', label: 'Arms', icon: 'flash-outline' },
  { id: 'LEGS', label: 'Legs', icon: 'walk-outline' },
  { id: 'CORE', label: 'Core / Abs', icon: 'sparkles-outline' },
];

const SPLIT_PRESETS: { label: string; icon: string; parts: string[] }[] = [
  { label: 'Push', icon: '🔥', parts: ['CHEST', 'SHOULDERS', 'ARMS'] },
  { label: 'Pull', icon: '⚡', parts: ['BACK', 'ARMS'] },
  { label: 'Legs', icon: '🦵', parts: ['LEGS'] },
  { label: 'Full Body', icon: '🌟', parts: ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'CORE'] },
];

const MEDITATION_PRESETS = [5, 10, 15, 20]; // minutes

export function HabitSessionModal({ visible, habit, onClose }: HabitSessionModalProps) {
  const { colors, isDark } = useTheme();
  const createSession = useCreateSession();

  const store = useSessionStore();
  const session = habit ? store.sessions[habit.id] : undefined;
  
  // ── Timer State ─────────────────────────────────────
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Activity-Specific State ─────────────────────────
  // We'll initialize from sessionData if it exists, otherwise defaults.
  const sd = session?.sessionData || {};

  // Workout
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>(sd.bodyParts || []);
  const [workoutIntensity, setWorkoutIntensity] = useState<'LOW' | 'MODERATE' | 'HIGH'>(sd.intensity || 'MODERATE');

  // Running
  const [distanceKm, setDistanceKm] = useState(sd.distanceKm ? String(sd.distanceKm) : '');

  // Reading
  const configStartPage = habit?.config?.currentPage ? Number(habit.config.currentPage) : 1;
  const configBook = habit?.config?.currentBook || habit?.name || '';
  const [bookTitle, setBookTitle] = useState(sd.bookTitle || configBook);
  const [startPage, setStartPage] = useState(sd.startPage ? String(sd.startPage) : String(configStartPage));
  const [endPage, setEndPage] = useState(sd.endPage ? String(sd.endPage) : String(configStartPage));

  // Meditation
  const [meditationMood, setMeditationMood] = useState<'CALM' | 'FOCUSED' | 'ENERGIZED'>(sd.mood || 'CALM');

  // Water
  const [waterGlasses, setWaterGlasses] = useState(sd.glasses || 1);

  // General Notes
  const [notes, setNotes] = useState(session?.notes || '');
  const [error, setError] = useState('');

  // Sync state to store whenever it changes, so it persists if modal closes
  useEffect(() => {
    if (habit && session) {
      store.updateSessionData(habit.id, {
        notes,
        sessionData: {
          bodyParts: selectedBodyParts,
          intensity: workoutIntensity,
          distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
          bookTitle,
          startPage: parseInt(startPage) || 1,
          endPage: parseInt(endPage) || 1,
          mood: meditationMood,
          glasses: waterGlasses,
        }
      });
    }
  }, [notes, selectedBodyParts, workoutIntensity, distanceKm, bookTitle, startPage, endPage, meditationMood, waterGlasses]);

  // Reset state when modal opens with a NEW habit
  useEffect(() => {
    if (visible && habit) {
      setError('');
      // If a session exists, we don't overwrite local state completely because useState already picked it up during render.
      // However, if we need to ensure it's fresh when opening a different habit:
      if (!store.sessions[habit.id]) {
        // Automatically start the session if it's not running
        store.startSession(habit);
        setSelectedBodyParts([]);
        setWorkoutIntensity('MODERATE');
        setDistanceKm('');
        const initialPage = habit.config?.currentPage ? Number(habit.config.currentPage) : 1;
        setStartPage(String(initialPage));
        setEndPage(String(initialPage));
        setBookTitle(habit.config?.currentBook || habit.name || '');
        setWaterGlasses(1);
        setNotes('');
      } else {
        const existingSd = store.sessions[habit.id].sessionData || {};
        setSelectedBodyParts(existingSd.bodyParts || []);
        setWorkoutIntensity(existingSd.intensity || 'MODERATE');
        setDistanceKm(existingSd.distanceKm ? String(existingSd.distanceKm) : '');
        setStartPage(existingSd.startPage ? String(existingSd.startPage) : String(habit.config?.currentPage || 1));
        setEndPage(existingSd.endPage ? String(existingSd.endPage) : String(habit.config?.currentPage || 1));
        setBookTitle(existingSd.bookTitle || habit.config?.currentBook || habit.name || '');
        setMeditationMood(existingSd.mood || 'CALM');
        setWaterGlasses(existingSd.glasses || 1);
        setNotes(store.sessions[habit.id].notes || '');
      }
    }
  }, [visible, habit?.id]);

  // Timer engine relying on store state
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

  const toggleTimer = () => {
    if (!habit) return;
    if (session?.isRunning) {
      store.pauseSession(habit.id);
    } else {
      store.resumeSession(habit.id);
    }
  };

  const resetTimer = () => {
    if (!habit) return;
    // To reset, we can clear the session and start over
    store.finishSession(habit.id);
    store.startSession(habit);
    setSecondsElapsed(0);
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

  // Workout body parts helpers
  const toggleBodyPart = (id: string) => {
    setSelectedBodyParts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const applySplitPreset = (parts: string[]) => {
    setSelectedBodyParts(parts);
  };

  // Pace calculation for Running
  const calculatePace = () => {
    const dist = parseFloat(distanceKm);
    if (!dist || dist <= 0 || secondsElapsed <= 0) return null;
    const paceSeconds = secondsElapsed / dist;
    const paceMin = Math.floor(paceSeconds / 60);
    const paceSec = Math.round(paceSeconds % 60);
    return `${paceMin}'${paceSec.toString().padStart(2, '0')}" /km`;
  };

  // Reading pages delta
  const pagesReadDelta = Math.max(0, (parseInt(endPage) || 0) - (parseInt(startPage) || 0));

  // Submit session
  const handleFinish = async () => {
    if (!habit) return;
    setError('');

    // Stop timer
    store.finishSession(habit.id);

    const type: HabitType = habit.habitType || 'GENERAL';
    const sessionData: Record<string, any> = { type };

    if (type === 'WORKOUT') {
      if (selectedBodyParts.length === 0) {
        setError('Select at least one body part for your workout');
        return;
      }
      sessionData.bodyParts = selectedBodyParts;
      sessionData.intensity = workoutIntensity;
    } else if (type === 'RUNNING') {
      const dist = parseFloat(distanceKm);
      if (dist > 0) {
        sessionData.distanceKm = dist;
        const pace = calculatePace();
        if (pace) sessionData.avgPace = pace;
      }
    } else if (type === 'READING') {
      const start = parseInt(startPage) || 1;
      const end = parseInt(endPage) || start;
      sessionData.bookTitle = bookTitle.trim() || habit.name;
      sessionData.startPage = start;
      sessionData.endPage = end;
      sessionData.pagesRead = Math.max(0, end - start);
    } else if (type === 'MEDITATION') {
      sessionData.mood = meditationMood;
    } else if (type === 'WATER') {
      sessionData.glasses = waterGlasses;
      sessionData.volumeMl = waterGlasses * 250;
    }

    try {
      await createSession.mutateAsync({
        habitId: habit.id,
        data: {
          durationSeconds: secondsElapsed > 0 ? secondsElapsed : undefined,
          sessionData,
          notes: notes.trim() || undefined,
        },
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save session');
    }
  };

  if (!habit) return null;

  const type: HabitType = habit.habitType || 'GENERAL';

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={[styles.habitTitle, { color: colors.text }]} numberOfLines={1}>
                {habit.name}
              </Text>
              <View style={[styles.typeBadge, { backgroundColor: colors.primary + '18' }]}>
                <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                  {type} SESSION
                </Text>
              </View>
            </View>

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Timer Display (Except purely count-based like water) ── */}
            {type !== 'WATER' && (
              <Animated.View entering={FadeInDown.duration(400)} style={[styles.timerCard, { backgroundColor: isDark ? colors.background : '#F8F6FF', borderColor: colors.border }]}>
                <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>SESSION TIMER</Text>
                <Text style={[styles.timerValue, { color: colors.primary }]}>
                  {formatTimer(secondsElapsed)}
                </Text>

                <View style={styles.timerControls}>
                  <Pressable
                    style={[
                      styles.timerButton,
                      session?.isRunning ? styles.timerButtonPause : styles.timerButtonPlay,
                    ]}
                    onPress={toggleTimer}
                  >
                    <Ionicons
                      name={session?.isRunning ? 'pause' : 'play'}
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.timerButtonText}>
                      {session?.isRunning ? 'Pause' : secondsElapsed > 0 ? 'Resume' : 'Start'}
                    </Text>
                  </Pressable>

                  {secondsElapsed > 0 && !session?.isRunning ? (
                    <Pressable style={[styles.resetButton, { borderColor: colors.border }]} onPress={resetTimer}>
                      <Ionicons name="refresh" size={18} color={colors.textSecondary} />
                    </Pressable>
                  ) : null}
                </View>
              </Animated.View>
            )}

            {/* ── WORKOUT FORM ────────────────────────────── */}
            {type === 'WORKOUT' && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.section}>
                {/* 1-Tap Split Presets */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>QUICK SPLITS</Text>
                <View style={styles.presetsRow}>
                  {SPLIT_PRESETS.map((p) => (
                    <Pressable
                      key={p.label}
                      style={[
                        styles.presetPill,
                        { backgroundColor: isDark ? colors.background : '#F8F8FE', borderColor: colors.border },
                      ]}
                      onPress={() => applySplitPreset(p.parts)}
                    >
                      <Text style={styles.presetIcon}>{p.icon}</Text>
                      <Text style={[styles.presetLabel, { color: colors.text }]}>{p.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Muscle Group Pills */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 14 }]}>
                  TARGET BODY PARTS
                </Text>
                <View style={styles.chipsGrid}>
                  {MUSCLE_GROUPS.map((group) => {
                    const isSelected = selectedBodyParts.includes(group.id);
                    return (
                      <Pressable
                        key={group.id}
                        style={[
                          styles.chip,
                          { backgroundColor: isDark ? colors.background : '#F8F8FE', borderColor: colors.border },
                          isSelected && styles.chipActive,
                        ]}
                        onPress={() => toggleBodyPart(group.id)}
                      >
                        <Ionicons
                          name={group.icon as any}
                          size={16}
                          color={isSelected ? '#FFFFFF' : colors.textSecondary}
                        />
                        <Text style={[styles.chipText, { color: colors.text }, isSelected && styles.chipTextActive]}>
                          {group.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Intensity selector */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 14 }]}>
                  INTENSITY
                </Text>
                <View style={styles.intensityRow}>
                  {(['LOW', 'MODERATE', 'HIGH'] as const).map((level) => (
                    <Pressable
                      key={level}
                      style={[
                        styles.intensityPill,
                        { backgroundColor: isDark ? colors.background : '#F8F8FE', borderColor: colors.border },
                        workoutIntensity === level && styles.intensityPillActive,
                      ]}
                      onPress={() => setWorkoutIntensity(level)}
                    >
                      <Text
                        style={[
                          styles.intensityText,
                          { color: colors.textSecondary },
                          workoutIntensity === level && styles.intensityTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* ── RUNNING FORM ────────────────────────────── */}
            {type === 'RUNNING' && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DISTANCE (KM)</Text>
                <View style={[styles.inputBox, { backgroundColor: isDark ? colors.background : '#F8F8FE', borderColor: colors.border }]}>
                  <Ionicons name="navigate-outline" size={20} color={colors.primary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g. 5.2"
                    placeholderTextColor={colors.textSecondary}
                    value={distanceKm}
                    onChangeText={setDistanceKm}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>km</Text>
                </View>

                {calculatePace() && (
                  <View style={[styles.paceBadge, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="speedometer-outline" size={16} color="#16A34A" />
                    <Text style={styles.paceText}>Calculated Pace: {calculatePace()}</Text>
                  </View>
                )}
              </Animated.View>
            )}

            {/* ── READING FORM ────────────────────────────── */}
            {type === 'READING' && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BOOK TITLE</Text>
                <View style={[styles.inputBox, { backgroundColor: isDark ? colors.background : '#F8F8FE', borderColor: colors.border }]}>
                  <Ionicons name="book-outline" size={20} color={colors.primary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Book name..."
                    placeholderTextColor={colors.textSecondary}
                    value={bookTitle}
                    onChangeText={setBookTitle}
                  />
                </View>

                <View style={styles.pagesRow}>
                  <View style={styles.pageInputWrap}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>STARTED AT</Text>
                    <View style={[styles.inputBox, { backgroundColor: isDark ? colors.background : '#F8F8FE', borderColor: colors.border }]}>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={startPage}
                        onChangeText={setStartPage}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} style={{ marginTop: 24 }} />

                  <View style={styles.pageInputWrap}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ENDED AT</Text>
                    <View style={[styles.inputBox, { backgroundColor: isDark ? colors.background : '#F8F8FE', borderColor: colors.border }]}>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={endPage}
                        onChangeText={setEndPage}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>

                {pagesReadDelta > 0 && (
                  <View style={[styles.paceBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#D97706" />
                    <Text style={[styles.paceText, { color: '#B45309' }]}>
                      +{pagesReadDelta} pages read in this session!
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}

            {/* ── MEDITATION FORM ─────────────────────────── */}
            {type === 'MEDITATION' && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TARGET TIME</Text>
                <View style={styles.presetsRow}>
                  {MEDITATION_PRESETS.map((m) => (
                    <Pressable
                      key={m}
                      style={[
                        styles.presetPill,
                        { backgroundColor: isDark ? colors.background : '#F8F8FE', borderColor: colors.border },
                        secondsElapsed === m * 60 && styles.presetPillActive,
                      ]}
                      onPress={() => {
                        if (habit) {
                          store.pauseSession(habit.id);
                          store.updateSessionData(habit.id, { accumulatedTime: m * 60 });
                          setSecondsElapsed(m * 60);
                        }
                      }}
                    >
                      <Text style={[styles.presetLabel, { color: colors.text }]}>{m} min</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 14 }]}>
                  POST-MEDITATION MOOD
                </Text>
                <View style={styles.presetsRow}>
                  {(['CALM', 'FOCUSED', 'ENERGIZED'] as const).map((m) => (
                    <Pressable
                      key={m}
                      style={[
                        styles.presetPill,
                        { backgroundColor: isDark ? colors.background : '#F8F8FE', borderColor: colors.border },
                        meditationMood === m && styles.presetPillActive,
                      ]}
                      onPress={() => setMeditationMood(m)}
                    >
                      <Text style={[styles.presetLabel, { color: colors.text }]}>{m}</Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* ── WATER FORM ──────────────────────────────── */}
            {type === 'WATER' && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GLASSES LOGGED</Text>
                <View style={styles.waterCounterRow}>
                  <Pressable
                    style={[styles.waterStepBtn, { backgroundColor: isDark ? colors.background : '#F0EDFF' }]}
                    onPress={() => setWaterGlasses((g: number) => Math.max(1, g - 1))}
                  >
                    <Ionicons name="remove" size={24} color={colors.primary} />
                  </Pressable>

                  <View style={styles.waterDisplay}>
                    <Ionicons name="water" size={32} color="#00B894" />
                    <Text style={[styles.waterValue, { color: colors.text }]}>{waterGlasses}</Text>
                    <Text style={[styles.waterUnit, { color: colors.textSecondary }]}>
                      {waterGlasses * 250} ml
                    </Text>
                  </View>

                  <Pressable
                    style={[styles.waterStepBtn, { backgroundColor: isDark ? colors.background : '#F0EDFF' }]}
                    onPress={() => setWaterGlasses((g: number) => g + 1)}
                  >
                    <Ionicons name="add" size={24} color={colors.primary} />
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {/* ── SESSION NOTES (ALL HABITS) ───────────────── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                SESSION NOTES (OPTIONAL)
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  { backgroundColor: isDark ? colors.background : '#F8F8FE', borderColor: colors.border, color: colors.text },
                ]}
                placeholder="How did it feel? Any highlights or PRs?"
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* ── FINISH BUTTON ────────────────────────────── */}
            <Pressable
              style={({ pressed }) => [
                styles.finishButton,
                pressed && styles.finishButtonPressed,
                createSession.isPending && styles.finishButtonDisabled,
              ]}
              onPress={handleFinish}
              disabled={createSession.isPending}
            >
              {createSession.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.finishButtonText}>Finish & Save Session 🎉</Text>
                </>
              )}
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  habitTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Timer
  timerCard: {
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 44,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
    marginBottom: 12,
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  timerButtonPlay: {
    backgroundColor: '#6C5CE7',
  },
  timerButtonPause: {
    backgroundColor: '#E17055',
  },
  timerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },

  // Workout presets & chips
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  presetPillActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  presetIcon: {
    fontSize: 14,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  chipActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  intensityPillActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '800',
  },
  intensityTextActive: {
    color: '#FFFFFF',
  },

  // Inputs
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: '700',
  },
  paceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  paceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },

  // Reading
  pagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  pageInputWrap: {
    flex: 1,
  },

  // Water
  waterCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  waterStepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterDisplay: {
    alignItems: 'center',
    gap: 4,
  },
  waterValue: {
    fontSize: 32,
    fontWeight: '900',
  },
  waterUnit: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Notes
  notesInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontWeight: '500',
    minHeight: 70,
    textAlignVertical: 'top',
  },

  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },

  // Finish
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 6,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  finishButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  finishButtonDisabled: {
    opacity: 0.6,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
