import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, BounceIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

import { FeedItem } from '@/components/feed/FeedItem';
import { FeedSummaryBanner } from '@/components/feed/FeedSummaryBanner';
import { useFeed } from '@/hooks/useFeed';
import { useFriends } from '@/hooks/useFriends';
import type { FeedItemRespond } from '@/types';

export default function FeedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data: feedItems, isLoading: isFeedLoading, refetch: refetchFeed, isRefetching: isFeedRefetching } = useFeed();
  const { data: friends, isLoading: isFriendsLoading, refetch: refetchFriends, isRefetching: isFriendsRefetching } = useFriends();

  const isRefreshing = isFeedRefetching || isFriendsRefetching;
  const isLoading = isFeedLoading || isFriendsLoading;

  const handleRefresh = useCallback(() => {
    refetchFeed();
    refetchFriends();
  }, [refetchFeed, refetchFriends]);

  const friendCount = friends?.length ?? 0;
  const items = feedItems ?? [];

  // Count check-ins made today
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayCount = useMemo(() => {
    return items.filter((item) => item.checkInDate === todayStr).length;
  }, [items, todayStr]);

  const renderFeedItem = useCallback(
    ({ item, index }: { item: FeedItemRespond; index: number }) => {
      return <FeedItem item={item} index={index} />;
    },
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      {/* Header */}
      <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Feed</Text>
          <Ionicons name="newspaper" size={24} color="#6C5CE7" />
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>See what your friends are up to</Text>
      </Animated.View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      ) : friendCount === 0 ? (
        // Empty state 1: User has no friends yet
        <View style={styles.emptyContainer}>
          <Animated.View entering={BounceIn.duration(800)} style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.mascotBubble}>
              <Ionicons name="telescope" size={36} color="#6C5CE7" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your feed is quiet</Text>
            <Text style={styles.emptySubtitle}>
              Connect with friends to see their daily habit check-ins and celebrate streaks together!
            </Text>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.btnPressed]}
              onPress={() => router.push('/(tabs)/discover')}
            >
              <Ionicons name="person-add" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Find Friends</Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : items.length === 0 ? (
        // Empty state 2: Friends exist, but haven't checked in yet
        <View style={styles.emptyContainer}>
          <Animated.View entering={BounceIn.duration(800)} style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.mascotBubble, styles.mascotCoffee]}>
              <Ionicons name="cafe" size={36} color="#E17055" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing here yet today</Text>
            <Text style={styles.emptySubtitle}>
              When your friends complete their habits, their achievements will pop up right here.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.actionButton, styles.habitButton, pressed && styles.btnPressed]}
              onPress={() => router.push('/(tabs)')}
            >
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Go to My Habits</Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderFeedItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={Platform.OS !== 'web'}
          ListHeaderComponent={
            <FeedSummaryBanner
              todayCheckInCount={todayCount}
              friendCount={friendCount}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#6C5CE7"
              colors={['#6C5CE7']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F0FF',
  },
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2D2D3A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B8BA0',
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 4,
  },
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0EDFF',
  },
  mascotBubble: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F8F6FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#EDE8FF',
    marginBottom: 16,
  },
  mascotCoffee: {
    backgroundColor: '#FFF4EE',
    borderColor: '#FFE0D2',
    shadowColor: '#E17055',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D2D3A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8B8BA0',
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C5CE7',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  habitButton: {
    backgroundColor: '#00B894',
    shadowColor: '#00B894',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
});
