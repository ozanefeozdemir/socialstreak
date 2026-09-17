import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

import { useHabit } from '@/hooks/useHabits';
import { useCheckIns } from '@/hooks/useCheckIns';
import { useSessions } from '@/hooks/useSessions';
import { HabitSessionModal } from '@/components/session/HabitSessionModal';
import type { CheckInRespond, HabitSessionRespond } from '@/types';

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

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

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
  const { colors, isDark } = useTheme();
  const { data: habit, isLoading: habitLoading } = useHabit(id);
  const { data: checkIns, isLoading: checkInsLoading } = useCheckIns(id);
  const { data: sessions } = useSessions(id);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);

  const isLoading = habitLoading || checkInsLoading;
  const streak = checkIns ? calculateStreak(checkIns) : 0;
  const today = new Date().toISOString().slice(0, 10);
  const checkedInToday = checkIns?.some((c) => c.checkInDate === today) ?? false;
  const accentColor = habit?.config?.color || (habit ? (FREQUENCY_COLORS[habit.frequencyType] ?? '#6C5CE7') : '#6C5CE7');
  const type = habit?.habitType || 'GENERAL';
  const customIconName = habit?.config?.icon as keyof typeof Ionicons.glyphMap | undefined;
  const archetype = habit?.config?.sessionArchetype;
  const subCategory = habit?.config?.subCategory;
  const targetValue = habit?.config?.targetValue;
  const targetUnit = habit?.config?.targetUnit;
  const timeOfDay = habit?.config?.timeOfDay;

  // Recent check-ins (last 7)
  const recentCheckIns = checkIns
    ? [...checkIns].sort((a, b) => b.checkInDate.localeCompare(a.checkInDate)).slice(0, 7)
    : [];

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.blobTopRight} />
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </Pressable>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.blobTopRight} />
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </Pressable>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Habit not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <Animated.View entering={FadeInUp.duration(400)}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
          </Pressable>
        </Animated.View>

        {/* Header card */}
        <Animated.View
          entering={FadeInDown.springify().damping(18).delay(100)}
          style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000000' : accentColor }]}
        >
          <View style={styles.headerHeroRow}>
            {customIconName ? (
              <View style={[styles.heroIconWrap, { backgroundColor: accentColor + '20' }]}>
                <Ionicons name={customIconName} size={28} color={accentColor} />
              </View>
            ) : (
              <View style={[styles.accentDot, { backgroundColor: accentColor }]} />
            )}

            <View style={{ flex: 1 }}>
              <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
              {subCategory ? (
                <Text style={[styles.habitSubCategory, { color: accentColor }]}>
                  {subCategory}
                </Text>
              ) : null}
            </View>
          </View>
          
          <View style={styles.badgesRow}>
            <View style={[styles.frequencyBadge, { backgroundColor: accentColor + '18' }]}>
              <Ionicons name="repeat" size={13} color={accentColor} />
              <Text style={[styles.frequencyText, { color: accentColor }]}>
                {FREQUENCY_LABELS[habit.frequencyType]}
              </Text>
            </View>

            {targetValue ? (
              <View style={[styles.typeBadge, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                <Ionicons name="flag-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.typeText, { color: colors.text }]}>
                  {targetValue} {targetUnit || ''}
                </Text>
              </View>
            ) : null}

            {timeOfDay && timeOfDay !== 'ANYTIME' ? (
              <View style={[styles.typeBadge, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                <Ionicons
                  name={timeOfDay === 'MORNING' ? 'sunny-outline' : timeOfDay === 'EVENING' ? 'moon-outline' : 'time-outline'}
                  size={12}
                  color={colors.textSecondary}
                />
                <Text style={[styles.typeText, { color: colors.textSecondary }]}>
                  {timeOfDay.toLowerCase()}
                </Text>
              </View>
            ) : null}

            {archetype ? (
              <View style={[styles.typeBadge, { backgroundColor: accentColor + '18' }]}>
                <Text style={[styles.typeText, { color: accentColor }]}>
                  {archetype}
                </Text>
              </View>
            ) : null}

            {type === 'READING' && habit.config?.currentPage ? (
              <View style={[styles.typeBadge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.typeText, { color: '#D97706' }]}>
                  p. {habit.config.currentPage}
                </Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.springify().damping(18).delay(200)} style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000000' : '#6C5CE7' }]}>
            <Ionicons name="flame" size={24} color="#E17055" />
            <Text style={[styles.statValue, { color: colors.text }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000000' : '#6C5CE7' }]}>
            <Ionicons name="checkmark-done" size={24} color="#00B894" />
            <Text style={[styles.statValue, { color: colors.text }]}>{checkIns?.length ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000000' : '#6C5CE7' }]}>
            <Ionicons name="calendar" size={24} color={accentColor} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {habit.createdAt ? new Date(habit.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Started</Text>
          </View>
        </Animated.View>

        {/* Session / Check-in button */}
        <Animated.View entering={BounceIn.duration(600).delay(300)}>
          <Pressable
            style={({ pressed }) => [
              styles.checkInButton,
              { backgroundColor: checkedInToday ? '#00B894' : accentColor },
              checkedInToday ? styles.checkInDone : undefined,
              pressed ? styles.checkInPressed : undefined,
            ]}
            onPress={() => setSessionModalVisible(true)}
          >
            <Ionicons
              name={checkedInToday ? 'checkmark-circle' : 'play-circle'}
              size={24}
              color="#fff"
            />
            <Text style={styles.checkInText}>
              {checkedInToday ? 'Done today! Log another session' : `Start session`}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Recent sessions or check-ins */}
        {sessions && sessions.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.activitySection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECORDED SESSIONS ({sessions.length})</Text>
            <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000000' : '#6C5CE7' }]}>
              {sessions.slice(0, 10).map((session, i) => (
                <View key={session.id} style={styles.sessionItem}>
                  <View style={styles.sessionItemTop}>
                    <View style={styles.activityDot}>
                      <Ionicons name="flash" size={12} color={accentColor} />
                    </View>
                    <Text style={[styles.activityDate, { color: colors.text }]}>
                      {session.createdAt
                        ? new Date(session.createdAt).toLocaleDateString('en', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recent'}
                    </Text>
                    {session.durationSeconds ? (
                      <View style={[styles.sessionChip, { backgroundColor: isDark ? '#2E204A' : '#EDE9FE' }]}>
                        <Ionicons name="time-outline" size={11} color="#6C5CE7" />
                        <Text style={[styles.sessionChipText, { color: '#6C5CE7' }]}>
                          {formatDuration(session.durationSeconds)}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Telemetry details */}
                  <View style={styles.sessionChipsRow}>
                    {session.sessionData?.setsCount != null && session.sessionData.setsCount > 0 && (
                      <View style={[styles.sessionChip, { backgroundColor: isDark ? '#3D201A' : '#FFE8DF' }]}>
                        <Text style={[styles.sessionChipText, { color: '#E17055' }]}>
                          {session.sessionData.setsCount} sets
                        </Text>
                      </View>
                    )}

                    {Array.isArray(session.sessionData?.bodyParts) &&
                      session.sessionData.bodyParts.map((bp: string) => (
                        <View key={bp} style={[styles.sessionChip, { backgroundColor: isDark ? '#15314B' : '#E0F2FE' }]}>
                          <Text style={[styles.sessionChipText, { color: '#0284C7' }]}>
                            {bp.charAt(0).toUpperCase() + bp.slice(1).toLowerCase()}
                          </Text>
                        </View>
                      ))}

                    {session.sessionData?.distanceKm != null && (
                      <View style={[styles.sessionChip, { backgroundColor: isDark ? '#103926' : '#DCFCE7' }]}>
                        <Ionicons name="navigate-outline" size={11} color="#16A34A" />
                        <Text style={[styles.sessionChipText, { color: '#16A34A' }]}>
                          {session.sessionData.distanceKm} km
                        </Text>
                      </View>
                    )}

                    {session.sessionData?.avgPace != null && (
                      <View style={[styles.sessionChip, { backgroundColor: isDark ? '#103926' : '#DCFCE7' }]}>
                        <Text style={[styles.sessionChipText, { color: '#16A34A' }]}>
                          {session.sessionData.avgPace}
                        </Text>
                      </View>
                    )}

                    {session.sessionData?.pagesRead != null && (
                      <View style={[styles.sessionChip, { backgroundColor: isDark ? '#3D2B13' : '#FEF3C7' }]}>
                        <Ionicons name="book-outline" size={11} color="#D97706" />
                        <Text style={[styles.sessionChipText, { color: '#D97706' }]}>
                          +{session.sessionData.pagesRead} pages
                        </Text>
                      </View>
                    )}

                    {session.sessionData?.distractionsDefeated != null && session.sessionData.distractionsDefeated > 0 && (
                      <View style={[styles.sessionChip, { backgroundColor: isDark ? '#2E204A' : '#EDE9FE' }]}>
                        <Text style={[styles.sessionChipText, { color: '#6C5CE7' }]}>
                          {session.sessionData.distractionsDefeated} urges defeated 🛡️
                        </Text>
                      </View>
                    )}

                    {session.sessionData?.consumedMl != null && (
                      <View style={[styles.sessionChip, { backgroundColor: isDark ? '#15314B' : '#E0F2FE' }]}>
                        <Ionicons name="water-outline" size={11} color="#0984E3" />
                        <Text style={[styles.sessionChipText, { color: '#0984E3' }]}>
                          {session.sessionData.consumedMl} ml
                        </Text>
                      </View>
                    )}

                    {session.sessionData?.urgesResisted != null && (
                      <View style={[styles.sessionChip, { backgroundColor: isDark ? '#3D201A' : '#FFE8EC' }]}>
                        <Text style={[styles.sessionChipText, { color: '#E84393' }]}>
                          {session.sessionData.urgesResisted} cravings conquered 🛡️
                        </Text>
                      </View>
                    )}
                  </View>

                  {session.notes ? (
                    <Text style={[styles.sessionNotesText, { color: colors.textSecondary }]}>
                      "{session.notes}"
                    </Text>
                  ) : null}

                  {i < Math.min(sessions.length, 10) - 1 ? (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  ) : null}
                </View>
              ))}
            </View>
          </Animated.View>
        ) : recentCheckIns.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.activitySection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENT ACTIVITY</Text>
            <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000000' : '#6C5CE7' }]}>
              {recentCheckIns.map((ci, i) => (
                <View key={ci.id} style={styles.activityItem}>
                  <View style={styles.activityDot}>
                    <Ionicons name="checkmark" size={12} color="#00B894" />
                  </View>
                  <Text style={[styles.activityDate, { color: colors.text }]}>
                    {new Date(ci.checkInDate + 'T00:00:00').toLocaleDateString('en', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  {i < recentCheckIns.length - 1 ? (
                    <View style={[styles.activityLine, isDark && { backgroundColor: colors.border }]} />
                  ) : null}
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Habit Session Modal */}
      <HabitSessionModal
        visible={sessionModalVisible}
        habit={habit}
        onClose={() => setSessionModalVisible(false)}
      />
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
  headerHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  accentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  habitName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  habitSubCategory: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
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

  // Badges & Sessions
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sessionItem: {
    paddingVertical: 12,
  },
  sessionItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  sessionChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingLeft: 34,
    marginBottom: 4,
  },
  sessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  sessionChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sessionNotesText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingLeft: 34,
    marginTop: 2,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginTop: 12,
    opacity: 0.5,
  },
});
