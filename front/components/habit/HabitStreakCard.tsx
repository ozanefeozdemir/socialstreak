import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { HabitRespond } from '@/types';
import type { HabitStreakStats } from '@/utils/streak';

interface HabitStreakCardProps {
  habit: HabitRespond;
  stats?: HabitStreakStats;
  onPress?: () => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  CUSTOM: 'Custom',
};

const FREQUENCY_COLORS: Record<string, { color: string; bg: string }> = {
  DAILY: { color: '#6C5CE7', bg: '#EDE8FF' },
  WEEKLY: { color: '#00B894', bg: '#E3FAF3' },
  MONTHLY: { color: '#D97706', bg: '#FEF3C7' },
  CUSTOM: { color: '#E17055', bg: '#FFEFEA' },
};

export function HabitStreakCard({ habit, stats, onPress }: HabitStreakCardProps) {
  const highest = stats?.highestStreak ?? 0;
  const current = stats?.currentStreak ?? 0;
  const total = stats?.totalCheckIns ?? 0;

  const freqStyle = FREQUENCY_COLORS[habit.frequencyType] || {
    color: '#6C5CE7',
    bg: '#EDE8FF',
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <View style={styles.habitIconBg}>
            <Ionicons name="flame" size={20} color="#E17055" />
          </View>
          <View style={styles.habitDetails}>
            <Text style={styles.habitName} numberOfLines={1}>
              {habit.name}
            </Text>
            <View style={[styles.freqBadge, { backgroundColor: freqStyle.bg }]}>
              <Text style={[styles.freqText, { color: freqStyle.color }]}>
                {FREQUENCY_LABELS[habit.frequencyType] || habit.frequencyType}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#A0A0B5" />
      </View>

      {/* Streaks and Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.highestBadge}>
          <Ionicons name="trophy" size={13} color="#D97706" />
          <Text style={styles.highestLabel}>Best:</Text>
          <Text style={styles.highestValue}>
            {highest} {highest === 1 ? 'day' : 'days'}
          </Text>
        </View>

        <View style={styles.currentBadge}>
          <Ionicons name="flash" size={13} color="#6C5CE7" />
          <Text style={styles.currentLabel}>Current:</Text>
          <Text style={styles.currentValue}>
            {current} {current === 1 ? 'day' : 'days'}
          </Text>
        </View>

        <View style={styles.totalBadge}>
          <Ionicons name="checkmark-done" size={13} color="#059669" />
          <Text style={styles.totalValue}>{total}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0EDFF',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#FAF9FF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  habitIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFEFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitDetails: {
    flex: 1,
    gap: 4,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D2D3A',
  },
  freqBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  freqText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F3FF',
  },
  highestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  highestLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  highestValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE8FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  currentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5B21B6',
  },
  currentValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5B21B6',
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
});
