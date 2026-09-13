import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface FeedSummaryBannerProps {
  todayCheckInCount: number;
  friendCount: number;
}

export function FeedSummaryBanner({ todayCheckInCount, friendCount }: FeedSummaryBannerProps) {
  const hasActivity = todayCheckInCount > 0;

  return (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.container}>
      <View style={[styles.card, hasActivity ? styles.cardActive : styles.cardQuiet]}>
        <View style={[styles.iconBubble, hasActivity ? styles.iconBubbleActive : styles.iconBubbleQuiet]}>
          <Ionicons
            name={hasActivity ? 'flame' : 'sparkles'}
            size={22}
            color={hasActivity ? '#FF7675' : '#6C5CE7'}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {hasActivity
              ? `${todayCheckInCount} friend${todayCheckInCount > 1 ? 's' : ''} checked in today!`
              : friendCount > 0
              ? 'Your squad is waiting for the first spark ✨'
              : 'Add friends to see their daily progress!'}
          </Text>
          <Text style={styles.subtitle}>
            {hasActivity
              ? 'Cheer on your friends to keep their streaks alive 🔥'
              : friendCount > 0
              ? 'Check in your habits to inspire your friends today!'
              : 'Connect with people in Discover to build streaks together.'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 14,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardActive: {
    backgroundColor: '#FFF9F5',
    borderColor: '#FFE3D6',
    shadowColor: '#FF7675',
  },
  cardQuiet: {
    backgroundColor: '#F8F6FF',
    borderColor: '#E8DEFF',
    shadowColor: '#6C5CE7',
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleActive: {
    backgroundColor: '#FFE8DF',
  },
  iconBubbleQuiet: {
    backgroundColor: '#EDE9FE',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D2D3A',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7D7D93',
    lineHeight: 17,
  },
});
