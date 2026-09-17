import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { FeedItemRespond } from '@/types';
import { formatTimestamp } from '@/utils/dates';

const AVATAR_COLORS = [
  { bg: '#E8DEFF', text: '#6C5CE7', border: '#D5C7FF' },
  { bg: '#FFE8EC', text: '#E84393', border: '#FFD1DC' },
  { bg: '#E3FAFC', text: '#0984E3', border: '#C5F6FA' },
  { bg: '#FFF3BF', text: '#D48806', border: '#FFE066' },
  { bg: '#E6FCF5', text: '#00B894', border: '#C3FAE8' },
  { bg: '#FFE8DF', text: '#E17055', border: '#FFD2C2' },
];

const FREQUENCY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  DAILY: { bg: '#F3E8FF', text: '#6C5CE7', icon: 'repeat' },
  WEEKLY: { bg: '#E6FCF5', text: '#00B894', icon: 'calendar-outline' },
  MONTHLY: { bg: '#FFF3BF', text: '#D48806', icon: 'calendar' },
  CUSTOM: { bg: '#FFE8DF', text: '#E17055', icon: 'options-outline' },
};

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
}

interface FeedItemProps {
  item: FeedItemRespond;
  index: number;
}

export const FeedItem = React.memo(function FeedItem({ item, index }: FeedItemProps) {
  const { colors, isDark } = useTheme();
  const [cheered, setCheered] = useState(false);
  const [cheerCount, setCheerCount] = useState(0);

  const cheerScale = useSharedValue(1);

  const { user, habit, streak, createdAt } = item;

  // Derive initials
  const initials =
    `${(user.name?.[0] || '').toUpperCase()}${(user.surname?.[0] || '').toUpperCase()}` ||
    (user.username?.[0] || '?').toUpperCase();
  const fullName = [user.name, user.surname].filter(Boolean).join(' ') || user.username;

  // Pick deterministic avatar color based on user ID or username
  const colorIndex =
    Math.abs(
      (user.id || user.username).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % AVATAR_COLORS.length;
  const avatarTheme = AVATAR_COLORS[colorIndex];

  // Frequency style
  const freqTheme = FREQUENCY_COLORS[habit.frequencyType] || FREQUENCY_COLORS.DAILY;

  const handleCheer = () => {
    cheerScale.value = withSequence(
      withSpring(1.4, { damping: 4, stiffness: 350 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    if (!cheered) {
      setCheered(true);
      setCheerCount((c) => c + 1);
    } else {
      setCheered(false);
      setCheerCount((c) => Math.max(0, c - 1));
    }
  };

  const cheerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cheerScale.value }],
  }));

  const timeAgo = createdAt ? formatTimestamp(createdAt) : 'Recently';

  return (
    <Animated.View entering={FadeInDown.duration(450).delay(index * 60)} style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000000' : '#6C5CE7' }]}>
        {/* Header: Avatar, Name, Time */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: isDark ? colors.border : avatarTheme.bg, borderColor: isDark ? colors.border : avatarTheme.border }]}>
            <Text style={[styles.avatarText, { color: isDark ? colors.primary : avatarTheme.text }]}>{initials}</Text>
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.fullName, { color: colors.text }]} numberOfLines={1}>
                {fullName}
              </Text>
              <Text style={[styles.dot, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>{timeAgo}</Text>
            </View>
            <Text style={[styles.username, { color: colors.textSecondary }]}>@{user.username}</Text>
          </View>
        </View>

        {/* Habit Card Body */}
        <View style={[styles.habitContainer, { backgroundColor: isDark ? colors.background : '#F9F8FE', borderColor: colors.border }]}>
          <View style={styles.habitMain}>
            <View
              style={[
                styles.checkIconWrap,
                { backgroundColor: (habit.config?.color || '#00B894') + '1E' },
              ]}
            >
              <Ionicons
                name={(habit.config?.icon as any) || 'checkmark-circle'}
                size={22}
                color={habit.config?.color || '#00B894'}
              />
            </View>
            <View style={styles.habitInfo}>
              <Text style={[styles.actionPrompt, { color: colors.textSecondary }]}>
                {habit.config?.subCategory ? `Crushed ${habit.config.subCategory}` : 'Completed habit'}
              </Text>
              <Text style={[styles.habitName, { color: colors.text }]} numberOfLines={1}>
                {habit.name}
              </Text>
            </View>
          </View>

          {/* Tags row: Frequency & Streak */}
          <View style={styles.tagsRow}>
            <View style={[styles.tag, { backgroundColor: isDark ? freqTheme.text + '22' : freqTheme.bg }]}>
              <Ionicons name="repeat" size={12} color={freqTheme.text} />
              <Text style={[styles.tagText, { color: freqTheme.text }]}>{habit.frequencyType}</Text>
            </View>

            <View style={[styles.streakBadge, isDark && { backgroundColor: '#3D201A', borderColor: '#5C2D22' }]}>
              <Ionicons name="flame" size={14} color="#E17055" />
              <Text style={styles.streakText}>
                {streak > 1 ? `${streak} day streak` : '1st check-in'}
              </Text>
            </View>
          </View>

          {/* Session Data (if present) */}
          {item.session ? (
            <View style={[styles.sessionBox, { borderTopColor: isDark ? colors.border : '#ECE7FF' }]}>
              <View style={styles.sessionDetails}>
                {item.session.durationSeconds ? (
                  <View style={[styles.sessionChip, { backgroundColor: isDark ? '#2E204A' : '#EDE9FE' }]}>
                    <Ionicons name="time-outline" size={12} color="#6C5CE7" />
                    <Text style={[styles.sessionChipText, { color: '#6C5CE7' }]}>
                      {formatDuration(item.session.durationSeconds)}
                    </Text>
                  </View>
                ) : null}

                {item.session.sessionData?.setsCount != null && item.session.sessionData.setsCount > 0 && (
                  <View style={[styles.sessionChip, { backgroundColor: isDark ? '#3D201A' : '#FFE8DF' }]}>
                    <Text style={[styles.sessionChipText, { color: '#E17055' }]}>
                      {item.session.sessionData.setsCount} sets
                    </Text>
                  </View>
                )}

                {Array.isArray(item.session.sessionData?.bodyParts) &&
                  item.session.sessionData.bodyParts.map((bp: string) => (
                    <View key={bp} style={[styles.sessionChip, { backgroundColor: isDark ? '#15314B' : '#E0F2FE' }]}>
                      <Text style={[styles.sessionChipText, { color: '#0284C7' }]}>
                        {bp.charAt(0).toUpperCase() + bp.slice(1).toLowerCase()}
                      </Text>
                    </View>
                  ))}

                {item.session.sessionData?.distanceKm != null && (
                  <View style={[styles.sessionChip, { backgroundColor: isDark ? '#103926' : '#DCFCE7' }]}>
                    <Ionicons name="navigate-outline" size={12} color="#16A34A" />
                    <Text style={[styles.sessionChipText, { color: '#16A34A' }]}>
                      {item.session.sessionData.distanceKm} km
                    </Text>
                  </View>
                )}

                {item.session.sessionData?.avgPace != null && (
                  <View style={[styles.sessionChip, { backgroundColor: isDark ? '#103926' : '#DCFCE7' }]}>
                    <Text style={[styles.sessionChipText, { color: '#16A34A' }]}>
                      {item.session.sessionData.avgPace}
                    </Text>
                  </View>
                )}

                {item.session.sessionData?.pagesRead != null && (
                  <View style={[styles.sessionChip, { backgroundColor: isDark ? '#3D2B13' : '#FEF3C7' }]}>
                    <Ionicons name="book-outline" size={12} color="#D97706" />
                    <Text style={[styles.sessionChipText, { color: '#D97706' }]}>
                      +{item.session.sessionData.pagesRead} pages
                    </Text>
                  </View>
                )}

                {item.session.sessionData?.distractionsDefeated != null && item.session.sessionData.distractionsDefeated > 0 && (
                  <View style={[styles.sessionChip, { backgroundColor: isDark ? '#2E204A' : '#EDE9FE' }]}>
                    <Text style={[styles.sessionChipText, { color: '#6C5CE7' }]}>
                      {item.session.sessionData.distractionsDefeated} urges resisted 🛡️
                    </Text>
                  </View>
                )}

                {item.session.sessionData?.consumedMl != null && (
                  <View style={[styles.sessionChip, { backgroundColor: isDark ? '#15314B' : '#E0F2FE' }]}>
                    <Ionicons name="water-outline" size={12} color="#0984E3" />
                    <Text style={[styles.sessionChipText, { color: '#0984E3' }]}>
                      {item.session.sessionData.consumedMl} ml
                    </Text>
                  </View>
                )}

                {item.session.sessionData?.mood != null && (
                  <View style={[styles.sessionChip, { backgroundColor: isDark ? '#103926' : '#DCFCE7' }]}>
                    <Text style={[styles.sessionChipText, { color: '#16A34A' }]}>
                      {item.session.sessionData.mood} 😌
                    </Text>
                  </View>
                )}

                {item.session.sessionData?.urgesResisted != null && (
                  <View style={[styles.sessionChip, { backgroundColor: isDark ? '#3D201A' : '#FFE8EC' }]}>
                    <Text style={[styles.sessionChipText, { color: '#E84393' }]}>
                      {item.session.sessionData.urgesResisted} cravings conquered 🛡️
                    </Text>
                  </View>
                )}
              </View>

              {item.session.sessionData?.mission ? (
                <Text style={[styles.sessionNotes, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
                  Mission: "{item.session.sessionData.mission}"
                </Text>
              ) : null}

              {item.session.notes ? (
                <Text style={[styles.sessionNotes, { color: colors.textSecondary }]} numberOfLines={2}>
                  "{item.session.notes}"
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Footer: Social Reaction Cheer Button */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleCheer}
            style={({ pressed }) => [
              styles.cheerButton,
              isDark && !cheered && { backgroundColor: '#3D1F24', borderColor: '#5C2A32' },
              cheered ? styles.cheerButtonActive : undefined,
              pressed ? styles.cheerButtonPressed : undefined,
            ]}
          >
            <Animated.View style={[styles.cheerContent, cheerAnimatedStyle]}>
              <Ionicons
                name={cheered ? 'flame' : 'flame-outline'}
                size={18}
                color={cheered ? '#FFFFFF' : '#FF7675'}
              />
              <Text style={[styles.cheerLabel, cheered ? styles.cheerLabelActive : undefined]}>
                {cheered ? 'Cheered!' : 'Cheer'}
              </Text>
              {cheerCount > 0 && (
                <View style={[styles.cheerBadge, cheered ? styles.cheerBadgeActive : undefined]}>
                  <Text style={[styles.cheerBadgeText, cheered ? styles.cheerBadgeTextActive : undefined]}>
                    {cheerCount}
                  </Text>
                </View>
              )}
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0EDFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fullName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D3A',
    flexShrink: 1,
  },
  dot: {
    fontSize: 12,
    color: '#B0B0C0',
  },
  timeAgo: {
    fontSize: 12,
    color: '#8B8BA0',
    fontWeight: '500',
  },
  username: {
    fontSize: 13,
    color: '#8B8BA0',
    fontWeight: '500',
    marginTop: 1,
  },
  habitContainer: {
    backgroundColor: '#F9F8FE',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECE7FF',
  },
  habitMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  checkIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6FCF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitInfo: {
    flex: 1,
  },
  actionPrompt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B8BA0',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D2D3A',
    letterSpacing: -0.2,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFE0D2',
  },
  streakText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E17055',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  cheerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFDDE2',
  },
  cheerButtonActive: {
    backgroundColor: '#FF7675',
    borderColor: '#FF7675',
  },
  cheerButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  cheerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cheerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF7675',
  },
  cheerLabelActive: {
    color: '#FFFFFF',
  },
  cheerBadge: {
    backgroundColor: '#FFE3E7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 2,
  },
  cheerBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  cheerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF7675',
  },
  cheerBadgeTextActive: {
    color: '#FFFFFF',
  },
  sessionBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  sessionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  sessionChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sessionNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
