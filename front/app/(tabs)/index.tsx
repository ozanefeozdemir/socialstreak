import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

import { HabitCard } from '@/components/habit/HabitCard';
import { HabitSessionModal } from '@/components/session/HabitSessionModal';
import { ActiveSessionsList } from '@/components/session/ActiveSessionsList';
import { HabitDiscoveryModal } from '@/components/habit/HabitDiscoveryModal';
import { useHabits } from '@/hooks/useHabits';
import { useCheckIn } from '@/hooks/useCheckIns';
import { checkInsApi } from '@/api/endpoints/checkins';
import type { HabitRespond, CheckInRespond } from '@/types';
import { useQuery } from '@tanstack/react-query';

// Fetch today's check-ins for all habits to know which are done
function useTodayCheckIns(habits: HabitRespond[] | undefined) {
  return useQuery({
    queryKey: ['todayCheckIns', habits?.map((h) => h.id)],
    queryFn: async () => {
      if (!habits || habits.length === 0) return {};
      const today = new Date().toISOString().slice(0, 10);
      const results: Record<string, boolean> = {};

      // Fetch check-ins for each habit in parallel
      const allCheckIns = await Promise.all(
        habits.map(async (habit) => {
          try {
            const checkIns = await checkInsApi.getAll(habit.id);
            const todayCheckIn = checkIns.find((c) => c.checkInDate === today);
            return { habitId: habit.id, checkedIn: !!todayCheckIn, streak: calculateStreak(checkIns, today) };
          } catch {
            return { habitId: habit.id, checkedIn: false, streak: 0 };
          }
        })
      );

      const map: Record<string, { checkedIn: boolean; streak: number }> = {};
      for (const item of allCheckIns) {
        map[item.habitId] = { checkedIn: item.checkedIn, streak: item.streak };
      }
      return map;
    },
    enabled: !!habits && habits.length > 0,
  });
}

function calculateStreak(checkIns: CheckInRespond[], todayStr: string): number {
  if (checkIns.length === 0) return 0;

  const dates = checkIns
    .map((c) => c.checkInDate)
    .sort((a, b) => b.localeCompare(a)); // newest first

  let streak = 0;
  const today = new Date(todayStr + 'T00:00:00');
  let expected = new Date(today);

  // Allow starting from today or yesterday
  if (dates[0] !== todayStr) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (dates[0] !== yesterdayStr) return 0;
    expected = yesterday;
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

type FilterType = 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'PENDING' | 'DONE';

export default function HabitsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { data: habits, isLoading, refetch, isRefetching } = useHabits();
  const { data: checkInMap } = useTodayCheckIns(habits);
  const [sessionHabit, setSessionHabit] = useState<HabitRespond | null>(null);
  const [discoveryVisible, setDiscoveryVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const activeHabits = habits?.filter((h) => !h.archived) ?? [];
  const completedToday = activeHabits.filter((h) => checkInMap?.[h.id]?.checkedIn).length;
  const totalActive = activeHabits.length;

  const filteredHabits = useMemo(() => {
    return activeHabits.filter((h) => {
      const isDone = !!checkInMap?.[h.id]?.checkedIn;
      if (activeFilter === 'PENDING') return !isDone;
      if (activeFilter === 'DONE') return isDone;
      if (activeFilter === 'MORNING') return h.config?.timeOfDay === 'MORNING';
      if (activeFilter === 'AFTERNOON') return h.config?.timeOfDay === 'AFTERNOON';
      if (activeFilter === 'EVENING') return h.config?.timeOfDay === 'EVENING';
      return true;
    });
  }, [activeHabits, activeFilter, checkInMap]);

  const handleStartSession = useCallback((habit: HabitRespond) => {
    setSessionHabit(habit);
  }, []);

  const handleHabitPress = useCallback((habitId: string) => {
    router.push(`/habit/${habitId}`);
  }, [router]);

  const renderHabitCard = useCallback(({ item, index }: { item: HabitRespond; index: number }) => {
    const info = checkInMap?.[item.id];
    return (
      <HabitCard
        habit={item}
        streak={info?.streak ?? 0}
        checkedInToday={info?.checkedIn ?? false}
        onCheckIn={handleStartSession}
        onPress={handleHabitPress}
        index={index}
      />
    );
  }, [checkInMap, handleStartSession, handleHabitPress]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      {/* Header */}
      <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerRow}>
            <Text style={[styles.greeting, { color: colors.text }]}>My Habits</Text>
            <Ionicons name="sparkles" size={22} color="#6C5CE7" />
          </View>
          <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
            {totalActive > 0
              ? `${completedToday}/${totalActive} done today`
              : 'Start building your streak!'}
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          {totalActive > 0 ? (
            <View style={styles.progressBubble}>
              <Text style={styles.progressText}>
                {Math.round((completedToday / totalActive) * 100)}%
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[
              styles.exploreBlueprintsBtn,
              {
                backgroundColor: isDark ? '#2D204A' : '#EDE9FE',
                borderColor: isDark ? '#4C3B78' : '#D8D0FE',
              },
            ]}
            onPress={() => setDiscoveryVisible(true)}
          >
            <Ionicons name="compass" size={16} color={colors.primary} />
            <Text style={[styles.exploreBlueprintsText, { color: colors.primary }]}>Library</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Progress bar */}
      {totalActive > 0 ? (
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.progressBarContainer}>
          <View style={[styles.progressBarTrack, { backgroundColor: isDark ? colors.border : '#E8E5F7' }]}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { width: `${totalActive > 0 ? (completedToday / totalActive) * 100 : 0}%` },
              ]}
            />
          </View>
        </Animated.View>
      ) : null}

      {/* Filter Chips Bar */}
      {totalActive > 0 ? (
        <View style={styles.filterBarWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBarContent}>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'PENDING', label: '⏳ Pending' },
              { id: 'DONE', label: '✓ Done' },
              { id: 'MORNING', label: '🌅 Morning' },
              { id: 'AFTERNOON', label: '☀️ Afternoon' },
              { id: 'EVENING', label: '🌙 Evening' },
            ].map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  style={[
                    styles.filterChip,
                    isActive
                      ? [styles.filterChipActive, { backgroundColor: colors.primary }]
                      : { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => setActiveFilter(chip.id as FilterType)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isActive ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Active Sessions List */}
      <ActiveSessionsList onOpenSession={handleStartSession} />

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Loading habits...</Text>
        </View>
      ) : activeHabits.length === 0 ? (
        <Animated.View entering={BounceIn.duration(800)} style={styles.emptyContainer}>
          <View style={styles.emptyBubble}>
            <Ionicons name="compass" size={38} color="#6C5CE7" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Start Your Daily Streak!</Text>
          <Text style={styles.emptySubtitle}>
            Choose from 38+ pre-built blueprints or create your own customized habit
          </Text>
          <Pressable
            style={[styles.emptyCTA, { backgroundColor: colors.primary }]}
            onPress={() => setDiscoveryVisible(true)}
          >
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            <Text style={styles.emptyCTAText}>Browse 38+ Habit Blueprints</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <FlatList
          data={filteredHabits}
          renderItem={renderHabitCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={Platform.OS !== 'web'}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#6C5CE7"
              colors={['#6C5CE7']}
            />
          }
        />
      )}

      {/* FAB */}
      <Animated.View entering={BounceIn.duration(600).delay(400)}>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => router.push('/habit/create')}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Animated.View>

      {/* Habit Session Modal */}
      <HabitSessionModal
        visible={!!sessionHabit}
        habit={sessionHabit}
        onClose={() => setSessionHabit(null)}
      />

      {/* Habit Discovery Modal */}
      <HabitDiscoveryModal
        visible={discoveryVisible}
        onClose={() => setDiscoveryVisible(false)}
        onSelectPresetToCustomize={(preset) => {
          setDiscoveryVisible(false);
          router.push('/habit/create');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F0FF',
  },

  // Background blobs
  blobTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E8DEFF',
    opacity: 0.5,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFE8EC',
    opacity: 0.4,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2D2D3A',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B8BA0',
    marginTop: 4,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exploreBlueprintsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
  },
  exploreBlueprintsText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  progressText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Filter Bar
  filterBarWrap: {
    height: 42,
    marginBottom: 8,
  },
  filterBarContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterChipActive: {
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Progress bar
  progressBarContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8E5FF',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#6C5CE7',
  },

  // List
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#8B8BA0',
    fontWeight: '500',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#D4F5DC',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D2D3A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8B8BA0',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 20,
  },
  emptyCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyCTAText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  fabPressed: {
    transform: [{ scale: 0.9 }],
    shadowOpacity: 0.2,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 32,
  },
});
