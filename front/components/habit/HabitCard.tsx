import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { useSessionStore } from '@/store/useSessionStore';
import type { HabitRespond } from '@/types';

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

interface HabitCardProps {
  habit: HabitRespond;
  streak: number;
  checkedInToday: boolean;
  onCheckIn: (habit: HabitRespond) => void;
  onPress: (habitId: string) => void;
  checkInLoading?: boolean;
  index: number;
}

const HABIT_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  WORKOUT: 'barbell',
  RUNNING: 'walk',
  READING: 'book',
  MEDITATION: 'leaf',
  WATER: 'water',
  CUSTOM: 'options',
  GENERAL: 'play',
};

export const HabitCard = memo(function HabitCard({
  habit,
  streak,
  checkedInToday,
  onCheckIn,
  onPress,
  checkInLoading,
  index,
}: HabitCardProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(1);
  
  const activeSession = useSessionStore((state) => state.sessions[habit.id]);
  const isSessionActive = !!activeSession;

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handleAction = () => {
    checkScale.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    onCheckIn(habit);
  };

  const accentColor = FREQUENCY_COLORS[habit.frequencyType] ?? '#6C5CE7';
  const type = habit.habitType || 'GENERAL';
  const actionIcon = checkedInToday ? 'checkmark' : (HABIT_TYPE_ICONS[type] || 'play');
  const readingPage = habit.config?.currentPage;

  return (
    <Animated.View entering={FadeIn.duration(400).delay(index * 80)}>
      <Pressable
        onPress={() => onPress(habit.id)}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000000' : '#6C5CE7' }, cardAnimatedStyle]}>
          {/* Left accent bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

          <View style={styles.content}>
            {/* Top row: name + streak */}
            <View style={styles.topRow}>
              <View style={styles.nameContainer}>
                <Text style={[styles.habitName, { color: colors.text }]} numberOfLines={1}>{habit.name}</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.frequencyBadge, { backgroundColor: accentColor + '18' }]}>
                    <Ionicons name="repeat" size={12} color={accentColor} />
                    <Text style={[styles.frequencyText, { color: accentColor }]}>
                      {FREQUENCY_LABELS[habit.frequencyType]}
                    </Text>
                  </View>

                  {type !== 'GENERAL' && (
                    <View style={[styles.typeBadge, { backgroundColor: isDark ? '#2B2B3C' : '#F0EDFF' }]}>
                      <Text style={[styles.typeText, { color: colors.primary }]}>
                        {type.toLowerCase()}
                      </Text>
                    </View>
                  )}

                  {type === 'READING' && readingPage ? (
                    <View style={[styles.typeBadge, { backgroundColor: isDark ? '#3D2B13' : '#FEF3C7' }]}>
                      <Text style={[styles.typeText, { color: '#D97706' }]}>
                        p. {readingPage}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {streak > 0 ? (
                <View style={[styles.streakContainer, isDark && { backgroundColor: '#3D201A', borderColor: '#5C2D22' }]}>
                  <Ionicons name="flame" size={16} color="#E17055" />
                  <Text style={styles.streakCount}>{streak}</Text>
                </View>
              ) : null}
            </View>

            {/* Bottom row: status + session action button */}
            <View style={styles.bottomRow}>
              <View style={styles.statusRow}>
                <Ionicons
                  name={checkedInToday ? 'checkmark-circle' : 'play-circle-outline'}
                  size={16}
                  color={checkedInToday ? '#00B894' : colors.primary}
                />
                <Text style={[styles.statusText, { color: colors.textSecondary }, checkedInToday ? styles.statusDone : undefined]}>
                  {checkedInToday ? 'Done today! (tap for +)' : 'Start session'}
                </Text>
              </View>

              <Pressable
                onPress={handleAction}
                disabled={checkInLoading}
                style={({ pressed }) => [
                  styles.checkButton,
                  checkedInToday ? styles.checkButtonDone : undefined,
                  pressed ? styles.checkButtonPressed : undefined,
                ]}
              >
                <Animated.View style={checkAnimatedStyle}>
                  {checkInLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name={actionIcon} size={20} color="#FFFFFF" />
                  )}
                </Animated.View>
              </Pressable>
            </View>
          </View>
          
          {/* Active Session Overlay */}
          {isSessionActive && (
            <BlurView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
              <View style={styles.blurContent}>
                <Ionicons name="time" size={32} color={colors.primary} style={styles.blurIcon} />
                <Text style={[styles.blurTitle, { color: colors.text }]}>You are in session</Text>
                <Pressable style={styles.blurButton} onPress={() => onCheckIn(habit)}>
                  <Text style={styles.blurButtonText}>Resume</Text>
                </Pressable>
              </View>
            </BlurView>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0EDFF',
  },
  accentBar: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingLeft: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nameContainer: {
    flex: 1,
    marginRight: 12,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D2D3A',
    marginBottom: 5,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  frequencyBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  frequencyText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 3,
    borderWidth: 1,
    borderColor: '#FFE8D0',
  },
  streakCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E17055',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B8BA0',
  },
  statusDone: {
    color: '#00B894',
  },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkButtonDone: {
    backgroundColor: '#00B894',
    shadowColor: '#00B894',
  },
  checkButtonPressed: {
    transform: [{ scale: 0.9 }],
  },
  blurOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 10,
  },
  blurContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 16,
  },
  blurIcon: {
    marginBottom: 4,
  },
  blurTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  blurButton: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  blurButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
