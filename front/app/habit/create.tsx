import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

import { Input } from '@/components/ui/Input';
import { useCreateHabit } from '@/hooks/useHabits';
import type { FrequencyType } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const FREQUENCIES: { value: FrequencyType; label: string; icon: IoniconsName }[] = [
  { value: 'DAILY', label: 'Daily', icon: 'sunny' },
  { value: 'WEEKLY', label: 'Weekly', icon: 'calendar' },
  { value: 'MONTHLY', label: 'Monthly', icon: 'calendar-number' },
  { value: 'CUSTOM', label: 'Custom', icon: 'flash' },
];

export default function CreateHabitScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const createHabit = useCreateHabit();

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('DAILY');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Give your habit a name!');
      return;
    }

    setError('');
    try {
      await createHabit.mutateAsync({ name: name.trim(), frequencyType: frequency });
      router.back();
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Failed to create habit';
      setError(message);
    }
  };

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

          {/* Mascot */}
          <Animated.View entering={BounceIn.duration(800).delay(100)} style={styles.mascotContainer}>
            <View style={[styles.mascotBubble, isDark && { backgroundColor: colors.border }]}>
              <Ionicons name="flag" size={32} color={colors.primary} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>New Habit</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>What do you want to track?</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View
            entering={FadeInDown.springify().damping(18).delay(300)}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000000' : '#6C5CE7' }]}
          >
            <Input
              icon="✏️"
              placeholder="e.g., Read 30 minutes, Run 5km..."
              value={name}
              onChangeText={(v) => { setName(v); setError(''); }}
              error={error}
            />

            {/* Frequency selector */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>HOW OFTEN?</Text>
            <View style={styles.frequencyGrid}>
              {FREQUENCIES.map((f) => (
                <Pressable
                  key={f.value}
                  style={[
                    styles.frequencyChip,
                    { backgroundColor: isDark ? colors.background : '#F8F8FE', borderColor: colors.border },
                    frequency === f.value ? styles.frequencyChipActive : undefined,
                  ]}
                  onPress={() => setFrequency(f.value)}
                >
                  <Ionicons
                    name={f.icon}
                    size={18}
                    color={frequency === f.value ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.frequencyLabel,
                      { color: colors.text },
                      frequency === f.value ? styles.frequencyLabelActive : undefined,
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Create button */}
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && styles.buttonPressed,
                createHabit.isPending && styles.buttonDisabled,
              ]}
              onPress={handleCreate}
              disabled={createHabit.isPending}
            >
              {createHabit.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.createButtonText}>Create Habit 🎉</Text>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#F2F0FF',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },

  // Blobs
  blobTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#E8DEFF',
    opacity: 0.5,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFE8EC',
    opacity: 0.4,
  },

  // Back
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingRight: 16,
    marginBottom: 8,
    gap: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C5CE7',
  },

  // Mascot
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  mascotBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#F0EDFF',
  },


  // Title
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2D2D3A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#8B8BA0',
    marginTop: 6,
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0EDFF',
  },

  // Frequency
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B8BA0',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  frequencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F8F8FE',
    borderWidth: 2,
    borderColor: '#EDEDF5',
    gap: 6,
    flex: 1,
    minWidth: '40%',
    justifyContent: 'center',
  },
  frequencyChipActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },

  frequencyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B6B80',
  },
  frequencyLabelActive: {
    color: '#FFFFFF',
  },

  // Create button
  createButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    shadowOpacity: 0.2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
