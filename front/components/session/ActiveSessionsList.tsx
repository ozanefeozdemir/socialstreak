import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useSessionStore } from '@/store/useSessionStore';
import type { HabitRespond } from '@/types';

export function ActiveSessionsList({ onOpenSession }: { onOpenSession: (habit: HabitRespond) => void }) {
  const { colors, isDark } = useTheme();
  const sessionsMap = useSessionStore((state) => state.sessions);
  const cancelSession = useSessionStore((state) => state.cancelSession);
  const activeSessions = Object.values(sessionsMap);

  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    if (activeSessions.length === 0) return;
    const interval = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSessions.length]);

  if (activeSessions.length === 0) return null;

  const handleQuickCancel = (habitId: string, habitName: string) => {
    Alert.alert('Cancel Session?', `Discard the active session for "${habitName}"?`, [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => cancelSession(habitId) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>ACTIVE SESSIONS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeSessions.map((session) => {
          const elapsed = session.startTime ? Math.floor((Date.now() - session.startTime) / 1000) : 0;
          const totalSecs = session.accumulatedTime + (session.isRunning ? elapsed : 0);
          
          const mins = Math.floor(totalSecs / 60);
          const secs = totalSecs % 60;
          const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

          return (
            <Pressable
              key={session.habit.id}
              style={[styles.pill, { backgroundColor: isDark ? colors.card : '#FFF', borderColor: colors.primary }]}
              onPress={() => onOpenSession(session.habit)}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={session.isRunning ? "pulse" : "pause"} size={14} color="#FFF" />
              </View>
              <Text style={[styles.habitName, { color: colors.text }]} numberOfLines={1}>
                {session.habit.name}
              </Text>
              <Text style={[styles.timeText, { color: colors.primary }]}>{timeStr}</Text>
              <Pressable
                style={styles.pillCancelBtn}
                onPress={() => handleQuickCancel(session.habit.id, session.habit.name)}
                hitSlop={6}
              >
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </Pressable>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 24,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    maxWidth: 200,
  },
  iconContainer: {
    backgroundColor: '#6C5CE7',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    flexShrink: 1,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginRight: 6,
  },
  pillCancelBtn: {
    marginLeft: 2,
    padding: 2,
  },
});
