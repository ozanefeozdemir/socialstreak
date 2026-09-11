import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useHabit } from '@/hooks/useHabits';
import { useCheckIns, useCheckIn } from '@/hooks/useCheckIns';
import type { CheckInRespond } from '@/types';

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  CUSTOM: 'Custom',
};

const FREQUENCY_COLORS: Record<string, string> = {
  DAILY: '#6C5CE7',
  WEEKLY: '#00B894',
  MONTHLY: '#FDCB6E',
  CUSTOM: '#E17055',
};

function calculateStreak(checkIns: CheckInRespond[]): number {
  if (checkIns.length === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const dates = checkIns.map((c) => c.checkInDate).sort((a, b) => b.localeCompare(a));

  let streak = 0;
  const expected = new Date(today + 'T00:00:00');

  if (dates[0] !== today) {
    const yesterday = new Date(expected);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dates[0] !== yesterday.toISOString().slice(0, 10)) return 0;
    expected.setDate(expected.getDate() - 1);
  }

  for (const dateStr of dates) {
    const expectedStr = expected.toISOString().slice(0, 10);
    if (dateStr === expectedStr) {
      streak++;
      expected.setDate(expected.getDate() - 1);
    } else if (dateStr < expectedStr) {
      break;
    }
  }
  return streak;
}

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: habit, isLoading: habitLoading } = useHabit(id);
  const { data: checkIns, isLoading: checkInsLoading } = useCheckIns(id);
  const checkInMutation = useCheckIn();

  const isLoading = habitLoading || checkInsLoading;
  const streak = checkIns ? calculateStreak(checkIns) : 0;
  const today = new Date().toISOString().slice(0, 10);
  const checkedInToday = checkIns?.some((c) => c.checkInDate === today) ?? false;
  const accentColor = habit ? (FREQUENCY_COLORS[habit.frequencyType] ?? '#6C5CE7') : '#6C5CE7';

  const handleCheckIn = async () => {
    if (checkedInToday || !id) return;
    try {
      await checkInMutation.mutateAsync(id);
    } catch {
      // TODO: toast
    }
  };

  // Recent check-ins (last 7)
  const recentCheckIns = checkIns
    ? [...checkIns].sort((a, b) => b.checkInDate.localeCompare(a.checkInDate)).slice(0, 7)
    : [];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.blobTopRight} />
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#6C5CE7" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C5CE7" />
        </View>
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={styles.container}>
        <View style={styles.blobTopRight} />
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#6C5CE7" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Habit not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <Animated.View entering={FadeInUp.duration(400)}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#6C5CE7" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </Animated.View>

        {/* Header card */}
        <Animated.View entering={FadeInDown.springify().damping(18).delay(100)} style={styles.headerCard}>
          <View style={[styles.accentDot, { backgroundColor: accentColor }]} />
          <Text style={styles.habitName}>{habit.name}</Text>
          <View style={[styles.frequencyBadge, { backgroundColor: accentColor + '18' }]}>
            <Ionicons name="repeat" size={14} color={accentColor} />
            <Text style={[styles.frequencyText, { color: accentColor }]}>
              {FREQUENCY_LABELS[habit.frequencyType]}
            </Text>
          </View>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.springify().damping(18).delay(200)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={24} color="#E17055" />
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done" size={24} color="#00B894" />
            <Text style={styles.statValue}>{checkIns?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#6C5CE7" />
            <Text style={styles.statValue}>
              {habit.createdAt ? new Date(habit.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}
            </Text>
            <Text style={styles.statLabel}>Started</Text>
          </View>
        </Animated.View>

        {/* Check-in button */}
        <Animated.View entering={BounceIn.duration(600).delay(300)}>
          <Pressable
            style={({ pressed }) => [
              styles.checkInButton,
              checkedInToday ? styles.checkInDone : undefined,
              pressed && !checkedInToday ? styles.checkInPressed : undefined,
            ]}
            onPress={handleCheckIn}
            disabled={checkedInToday || checkInMutation.isPending}
          >
            {checkInMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name={checkedInToday ? 'checkmark-circle' : 'add-circle'}
                  size={24}
                  color="#fff"
                />
                <Text style={styles.checkInText}>
                  {checkedInToday ? 'Done for today!' : 'Check In'}
                </Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        {/* Recent activity */}
        {recentCheckIns.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.activitySection}>
            <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
            <View style={styles.activityCard}>
              {recentCheckIns.map((ci, i) => (
                <View key={ci.id} style={styles.activityItem}>
                  <View style={styles.activityDot}>
                    <Ionicons name="checkmark" size={12} color="#00B894" />
                  </View>
                  <Text style={styles.activityDate}>
                    {new Date(ci.checkInDate + 'T00:00:00').toLocaleDateString('en', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  {i < recentCheckIns.length - 1 ? <View style={styles.activityLine} /> : null}
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F0FF',
  },
  scroll: {
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
    marginBottom: 12,
    gap: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C5CE7',
  },

  // Header card
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0EDFF',
  },
  accentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  habitName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2D2D3A',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  frequencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 5,
  },
  frequencyText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0EDFF',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2D2D3A',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B8BA0',
    marginTop: 3,
    letterSpacing: 0.3,
  },

  // Check-in button
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    borderRadius: 18,
    paddingVertical: 18,
    gap: 10,
    marginBottom: 24,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  checkInDone: {
    backgroundColor: '#00B894',
    shadowColor: '#00B894',
  },
  checkInPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.2,
  },
  checkInText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Activity
  activitySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B8BA0',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0EDFF',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  activityDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D3D4E',
    flex: 1,
  },
  activityLine: {
    position: 'absolute',
    left: 11,
    top: 32,
    width: 2,
    height: 16,
    backgroundColor: '#E8F5E9',
  },

  // Loading / Error
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8B8BA0',
    fontWeight: '600',
  },
});
