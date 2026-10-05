import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { TrendingHabitRespond } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TrendingHabitCardProps {
  habit: TrendingHabitRespond;
  rank: number;
  isJoined: boolean;
  isJoining: boolean;
  onJoin: (habit: TrendingHabitRespond) => void;
  onCustomize?: (habit: TrendingHabitRespond) => void;
  index?: number;
}

export function TrendingHabitCard({
  habit,
  rank,
  isJoined,
  isJoining,
  onJoin,
  onCustomize,
  index = 0,
}: TrendingHabitCardProps) {
  const { colors, isDark } = useTheme();

  // Helper to map icon names safely
  const getIconName = (icon: string): IoniconsName => {
    const validIcons: Record<string, IoniconsName> = {
      'game-controller': 'game-controller',
      'game-controller-outline': 'game-controller-outline',
      'barbell': 'barbell',
      'barbell-outline': 'barbell-outline',
      'book': 'book',
      'book-outline': 'book-outline',
      'water': 'water',
      'water-outline': 'water-outline',
      'code-slash': 'code-slash',
      'code-slash-outline': 'code-slash-outline',
      'footsteps': 'footsteps',
      'footsteps-outline': 'footsteps-outline',
      'leaf': 'leaf',
      'leaf-outline': 'leaf-outline',
      'chatbubbles': 'chatbubbles',
      'chatbubbles-outline': 'chatbubbles-outline',
    };
    return validIcons[icon] || 'flame-outline';
  };

  const getRankBadgeStyle = (r: number) => {
    if (r === 1) return { bg: '#FFD700', text: '#7A5900', label: '#1' };
    if (r === 2) return { bg: '#E0E0E0', text: '#555555', label: '#2' };
    if (r === 3) return { bg: '#CD7F32', text: '#4E2D07', label: '#3' };
    return { bg: isDark ? '#2C2C3E' : '#F0EDFF', text: isDark ? '#A0A0B8' : '#6C5CE7', label: `#${r}` };
  };

  const rankBadge = getRankBadgeStyle(rank);

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 60)}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? '#2A2A3C' : '#EAE6FA',
          shadowColor: isDark ? '#000000' : '#6C5CE7',
        },
      ]}
    >
      {/* Top Row: Rank badge, Icon, Titles & Category */}
      <View style={styles.topRow}>
        {/* Rank Badge */}
        <View style={[styles.rankBadge, { backgroundColor: rankBadge.bg }]}>
          <Text style={[styles.rankText, { color: rankBadge.text }]}>{rankBadge.label}</Text>
        </View>

        {/* Habit Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${habit.color}18` },
          ]}
        >
          <Ionicons name={getIconName(habit.icon)} size={22} color={habit.color} />
        </View>

        {/* Habit Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.habitName, { color: colors.text }]} numberOfLines={1}>
              {habit.name}
            </Text>
          </View>

          <View style={styles.categoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: `${habit.color}15` }]}>
              <Text style={[styles.categoryText, { color: habit.color }]}>
                {habit.category.toUpperCase()}
              </Text>
            </View>
            {habit.defaultFrequency ? (
              <Text style={[styles.freqText, { color: colors.textSecondary }]}>
                • {habit.defaultFrequency.toLowerCase()}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Join / Tracking Action */}
        <View style={styles.actionContainer}>
          {isJoined ? (
            <View style={[styles.joinedBadge, { backgroundColor: isDark ? '#1C3829' : '#E8F8F0' }]}>
              <Ionicons name="checkmark-circle" size={14} color="#27AE60" />
              <Text style={styles.joinedText}>Tracking</Text>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.joinButton,
                pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
              ]}
              onPress={() => onJoin(habit)}
              disabled={isJoining}
            >
              {isJoining ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.joinButtonText}>Join</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* Description / Habit Tagline */}
      {habit.description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {habit.description}
        </Text>
      ) : null}

      {/* Stats Divider Line */}
      <View style={[styles.divider, { backgroundColor: isDark ? '#262638' : '#F4F2FC' }]} />

      {/* Bottom Row: Social Streak Aggregated Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <View style={[styles.metricIconWrap, { backgroundColor: isDark ? '#252836' : '#EFF6FF' }]}>
            <Ionicons name="people" size={14} color="#3B82F6" />
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {habit.participantCount.toLocaleString()}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            tracking now
          </Text>
        </View>

        <View style={styles.metricItem}>
          <View style={[styles.metricIconWrap, { backgroundColor: isDark ? '#3D2822' : '#FFF2EE' }]}>
            <Ionicons name="flame" size={14} color="#E17055" />
          </View>
          <Text style={[styles.metricValue, { color: '#E17055' }]}>
            {habit.activeStreakCount.toLocaleString()}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            active streaks
          </Text>
        </View>

        {onCustomize && !isJoined ? (
          <Pressable
            style={({ pressed }) => [
              styles.customizeBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => onCustomize(habit)}
            hitSlop={8}
          >
            <Ionicons name="options-outline" size={16} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  freqText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actionContainer: {
    marginLeft: 6,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  joinedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#27AE60',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 10,
    paddingHorizontal: 2,
  },
  divider: {
    height: 1,
    width: '100%',
    marginTop: 12,
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  customizeBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
});
