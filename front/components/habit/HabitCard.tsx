import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
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
  onCheckIn: (habitId: string) => void;
  onPress: (habitId: string) => void;
  checkInLoading?: boolean;
  index: number;
}

export function HabitCard({
  habit,
  streak,
  checkedInToday,
  onCheckIn,
  onPress,
  checkInLoading,
  index,
}: HabitCardProps) {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(1);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handleCheckIn = () => {
    if (checkedInToday || checkInLoading) return;
    checkScale.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    onCheckIn(habit.id);
  };

  const accentColor = FREQUENCY_COLORS[habit.frequencyType] ?? '#6C5CE7';

  return (
    <Animated.View entering={FadeIn.duration(400).delay(index * 80)}>
      <Pressable
        onPress={() => onPress(habit.id)}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          {/* Left accent bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

          <View style={styles.content}>
            {/* Top row: name + streak */}
            <View style={styles.topRow}>
              <View style={styles.nameContainer}>
                <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
                <View style={[styles.frequencyBadge, { backgroundColor: accentColor + '18' }]}>
                  <Ionicons name="repeat" size={12} color={accentColor} />
                  <Text style={[styles.frequencyText, { color: accentColor }]}>
                    {FREQUENCY_LABELS[habit.frequencyType]}
                  </Text>
                </View>
              </View>

              {streak > 0 ? (
                <View style={styles.streakContainer}>
                  <Ionicons name="flame" size={16} color="#E17055" />
                  <Text style={styles.streakCount}>{streak}</Text>
                </View>
              ) : null}
            </View>

            {/* Bottom row: status + check-in button */}
            <View style={styles.bottomRow}>
              <View style={styles.statusRow}>
                <Ionicons
                  name={checkedInToday ? 'checkmark-circle' : 'time'}
                  size={16}
                  color={checkedInToday ? '#00B894' : '#B0B0C0'}
                />
                <Text style={[styles.statusText, checkedInToday ? styles.statusDone : undefined]}>
                  {checkedInToday ? 'Done today!' : 'Waiting for check-in'}
                </Text>
              </View>

              <Pressable
                onPress={handleCheckIn}
                disabled={checkedInToday || checkInLoading}
                style={({ pressed }) => [
                  styles.checkButton,
                  checkedInToday ? styles.checkButtonDone : undefined,
                  !checkedInToday && pressed ? styles.checkButtonPressed : undefined,
                ]}
              >
                <Animated.View style={checkAnimatedStyle}>
                  {checkInLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="checkmark" size={22} color="#FFFFFF" />
                  )}
                </Animated.View>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

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
  frequencyBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
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
});
