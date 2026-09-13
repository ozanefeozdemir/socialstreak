import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFriends, useRemoveFriend } from '@/hooks/useFriends';
import { useHabits, useHabitsStreakStats } from '@/hooks/useHabits';
import { FriendCard } from '@/components/friend/FriendCard';
import { HabitStreakCard } from '@/components/habit/HabitStreakCard';
import type { FriendshipRespond } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface StatCardProps {
  icon: IoniconsName;
  color: string;
  bgColor: string;
  value: number | string;
  label: string;
  onPress?: () => void;
  isInteractive?: boolean;
}

function StatCard({
  icon,
  color,
  bgColor,
  value,
  label,
  onPress,
  isInteractive,
}: StatCardProps) {
  const { colors } = useTheme();

  const content = (
    <View style={styles.statCardInner}>
      <View style={[styles.statIconBg, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <View style={styles.statLabelRow}>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
        {isInteractive ? (
          <Ionicons name="chevron-forward" size={12} color="#6C5CE7" style={styles.statChevron} />
        ) : null}
      </View>
    </View>
  );

  if (isInteractive && onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.statCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          isInteractive && { borderColor: colors.primary + '30', backgroundColor: colors.primary + '05' },
          pressed ? { backgroundColor: colors.primary + '15' } : undefined,
        ]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>{content}</View>;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user: currentUser, logout } = useAuth();
  const { colors, isDark } = useTheme();

  // Modals state
  const [isFriendsModalVisible, setIsFriendsModalVisible] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  const [isStreaksModalVisible, setIsStreaksModalVisible] = useState(false);
  const [streakSearchQuery, setStreakSearchQuery] = useState('');

  // Queries
  const {
    data: friends = [],
    isLoading: isFriendsLoading,
    refetch: refetchFriends,
    isRefetching: isRefetchingFriends,
  } = useFriends();

  const {
    data: habits = [],
    isLoading: isHabitsLoading,
    refetch: refetchHabits,
    isRefetching: isRefetchingHabits,
  } = useHabits();

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  const {
    data: streakStats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
    isRefetching: isRefetchingStats,
  } = useHabitsStreakStats(activeHabits);

  // Mutations
  const removeFriendMutation = useRemoveFriend();

  const isRefreshing = isRefetchingFriends || isRefetchingHabits || isRefetchingStats;

  const onRefresh = () => {
    refetchFriends();
    refetchHabits();
    refetchStats();
  };

  const displayName =
    [currentUser?.name, currentUser?.surname].filter(Boolean).join(' ') ||
    currentUser?.username ||
    'User';
  const displayUsername = currentUser?.username ? `@${currentUser.username}` : '@user';
  const initials =
    `${(currentUser?.name?.[0] || '').toUpperCase()}${(currentUser?.surname?.[0] || '').toUpperCase()}` ||
    (currentUser?.username?.[0] || 'U').toUpperCase();

  // Filtered friends for friends modal search
  const filteredFriends = useMemo(() => {
    const query = friendSearchQuery.trim().toLowerCase();
    if (!query) return friends;

    return friends.filter((f) => {
      const u = f.friend;
      const usernameMatch = u.username.toLowerCase().includes(query);
      const nameMatch = u.name?.toLowerCase().includes(query);
      const surnameMatch = u.surname?.toLowerCase().includes(query);
      const fullMatch = `${u.name || ''} ${u.surname || ''}`.toLowerCase().includes(query);
      return usernameMatch || nameMatch || surnameMatch || fullMatch;
    });
  }, [friends, friendSearchQuery]);

  // Filtered & sorted habits for streaks modal
  const filteredHabits = useMemo(() => {
    let list = [...activeHabits];

    const query = streakSearchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((h) => h.name.toLowerCase().includes(query));
    }

    // Sort by highest streak descending
    list.sort((a, b) => {
      const highestA = streakStats?.statsMap[a.id]?.highestStreak ?? 0;
      const highestB = streakStats?.statsMap[b.id]?.highestStreak ?? 0;
      return highestB - highestA;
    });

    return list;
  }, [activeHabits, streakSearchQuery, streakStats]);

  const handleRemoveFriend = (friendship: FriendshipRespond) => {
    const friendName =
      [friendship.friend.name, friendship.friend.surname].filter(Boolean).join(' ') ||
      `@${friendship.friend.username}`;

    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFriendMutation.mutate(friendship.friend.id);
          },
        },
      ]
    );
  };

  const handleNavigateToDiscover = () => {
    setIsFriendsModalVisible(false);
    router.push('/(tabs)/discover');
  };

  const handleNavigateToCreateHabit = () => {
    setIsStreaksModalVisible(false);
    router.push('/habit/create');
  };

  const handleSelectHabit = (habitId: string) => {
    setIsStreaksModalVisible(false);
    router.push(`/habit/${habitId}`);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of SocialStreak?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const maxStreakValue = isStatsLoading ? '-' : streakStats?.maxHighestStreak ?? 0;
  const totalCheckInsValue = isStatsLoading ? '-' : streakStats?.totalCheckIns ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
            <Ionicons name="person-circle" size={26} color="#6C5CE7" />
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your stats, streaks and account</Text>
        </Animated.View>

        {/* User Avatar & Info */}
        <Animated.View entering={BounceIn.duration(800).delay(100)} style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[styles.fullNameText, { color: colors.text }]}>{displayName}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.username}>{displayUsername}</Text>
            {currentUser?.timezone ? (
              <View style={[styles.timezoneBadge, { backgroundColor: isDark ? colors.border : '#E8E5F7' }]}>
                <Ionicons name="globe-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.timezoneText, { color: colors.textSecondary }]}>{currentUser.timezone}</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        {/* 4-Card Stats Grid */}
        <Animated.View entering={FadeInDown.springify().damping(18).delay(200)} style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              icon="flame"
              color="#E17055"
              bgColor="#FFEFEA"
              value={maxStreakValue}
              label="Day Streak"
              isInteractive
              onPress={() => setIsStreaksModalVisible(true)}
            />
            <StatCard
              icon="checkmark-done"
              color="#00B894"
              bgColor="#E3FAF3"
              value={totalCheckInsValue}
              label="Check-ins"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="trophy"
              color="#FDCB6E"
              bgColor="#FFF9E6"
              value={isHabitsLoading ? '-' : activeHabits.length}
              label="Habits"
            />
            <StatCard
              icon="people"
              color="#6C5CE7"
              bgColor="#EDE8FF"
              value={isFriendsLoading ? '-' : friends.length}
              label="Friends"
              isInteractive
              onPress={() => setIsFriendsModalVisible(true)}
            />
          </View>
        </Animated.View>

        {/* Account Details Section */}
        <Animated.View entering={FadeInDown.springify().damping(18).delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>
          <View style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.accountRow}>
              <View style={styles.accountIconBg}>
                <Ionicons name="mail-outline" size={18} color="#6C5CE7" />
              </View>
              <View style={styles.accountInfo}>
                <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>Email</Text>
                <Text style={[styles.accountValue, { color: colors.text }]}>{currentUser?.email || '—'}</Text>
              </View>
            </View>

            <View style={[styles.accountDivider, { backgroundColor: colors.border }]} />

            <View style={styles.accountRow}>
              <View style={styles.accountIconBg}>
                <Ionicons name="at-outline" size={18} color="#6C5CE7" />
              </View>
              <View style={styles.accountInfo}>
                <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>Username</Text>
                <Text style={[styles.accountValue, { color: colors.text }]}>{displayUsername}</Text>
              </View>
            </View>

            <View style={[styles.accountDivider, { backgroundColor: colors.border }]} />

            <View style={styles.accountRow}>
              <View style={styles.accountIconBg}>
                <Ionicons name="time-outline" size={18} color="#6C5CE7" />
              </View>
              <View style={styles.accountInfo}>
                <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>Timezone</Text>
                <Text style={[styles.accountValue, { color: colors.text }]}>{currentUser?.timezone || 'Default'}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions & Logout */}
        <Animated.View entering={FadeInDown.springify().damping(18).delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              style={({ pressed }) => [
                styles.settingsRow,
                pressed && { backgroundColor: isDark ? colors.border : '#FAF9FF' }
              ]}
              onPress={() => setIsStreaksModalVisible(true)}
            >
              <View style={styles.settingsLeft}>
                <View style={[styles.settingsIconBg, { backgroundColor: isDark ? '#4A332C' : '#FFEFEA' }]}>
                  <Ionicons name="flame" size={18} color="#E17055" />
                </View>
                <Text style={[styles.settingsText, { color: colors.text }]}>View Habit Streaks</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>

            <View style={[styles.accountDivider, { backgroundColor: colors.border }]} />

            <Pressable
              style={({ pressed }) => [
                styles.settingsRow,
                pressed && { backgroundColor: isDark ? colors.border : '#FAF9FF' }
              ]}
              onPress={() => setIsFriendsModalVisible(true)}
            >
              <View style={styles.settingsLeft}>
                <View style={[styles.settingsIconBg, { backgroundColor: isDark ? '#3A2E5D' : '#EDE8FF' }]}>
                  <Ionicons name="people" size={18} color="#6C5CE7" />
                </View>
                <Text style={[styles.settingsText, { color: colors.text }]}>Manage Friends</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>

            <View style={[styles.accountDivider, { backgroundColor: colors.border }]} />

            <Pressable
              style={({ pressed }) => [
                styles.settingsRow,
                pressed && { backgroundColor: isDark ? '#3A1C1C' : '#FFF0F0' }
              ]}
              onPress={handleLogout}
            >
              <View style={styles.settingsLeft}>
                <View style={[styles.settingsIconBg, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                </View>
                <Text style={[styles.settingsText, { color: '#EF4444' }]}>Log Out</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FCA5A5" />
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ────────────────────────────────────────────────────────── */}
      {/* Habit Streaks Modal */}
      {/* ────────────────────────────────────────────────────────── */}
      <Modal
        visible={isStreaksModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsStreaksModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Back button */}
          <View style={styles.modalBackWrapper}>
            <Animated.View entering={FadeInUp.duration(400)}>
              <Pressable
                style={styles.backButton}
                onPress={() => {
                  setIsStreaksModalVisible(false);
                  setStreakSearchQuery('');
                }}
              >
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
                <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Habit Streaks</Text>
              <View style={[styles.modalCountBadge, { backgroundColor: '#E17055' }]}>
                <Text style={styles.modalCountText}>{activeHabits.length}</Text>
              </View>
            </View>
            <View style={styles.modalHeaderRight}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalAddBtn,
                  { backgroundColor: '#E17055' },
                  pressed && styles.btnPressed,
                ]}
                onPress={handleNavigateToCreateHabit}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.modalAddBtnText}>New</Text>
              </Pressable>
            </View>
          </View>

          {/* Search Box */}
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search habits..."
              placeholderTextColor={colors.textSecondary}
              value={streakSearchQuery}
              onChangeText={setStreakSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {streakSearchQuery.length > 0 ? (
              <Pressable onPress={() => setStreakSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          {/* Habits Streak List */}
          <ScrollView
            contentContainerStyle={styles.modalListContent}
            showsVerticalScrollIndicator={false}
          >
            {isHabitsLoading || isStatsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E17055" />
              </View>
            ) : filteredHabits.length === 0 ? (
              <View style={styles.emptyModalSearch}>
                <View style={[styles.emptySearchIconBg, { backgroundColor: isDark ? colors.border : '#FFEFEA' }]}>
                  <Ionicons
                    name={streakSearchQuery ? 'search-outline' : 'flame-outline'}
                    size={36}
                    color="#E17055"
                  />
                </View>
                <Text style={[styles.emptySearchTitle, { color: colors.text }]}>
                  {streakSearchQuery ? 'No matching habits' : 'No habits created yet'}
                </Text>
                <Text style={[styles.emptySearchSubtitle, { color: colors.textSecondary }]}>
                  {streakSearchQuery
                    ? `No habits matched "${streakSearchQuery}"`
                    : 'Start creating habits and building your daily streaks!'}
                </Text>
                {!streakSearchQuery ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.discoverBtn,
                      { backgroundColor: '#E17055' },
                      pressed && styles.btnPressed,
                    ]}
                    onPress={handleNavigateToCreateHabit}
                  >
                    <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.discoverBtnText}>Create Habit</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              filteredHabits.map((habit) => (
                <HabitStreakCard
                  key={habit.id}
                  habit={habit}
                  stats={streakStats?.statsMap[habit.id]}
                  onPress={() => handleSelectHabit(habit.id)}
                />
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────── */}
      {/* Friends Full List Modal */}
      {/* ────────────────────────────────────────────────────────── */}
      <Modal
        visible={isFriendsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsFriendsModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Back button */}
          <View style={styles.modalBackWrapper}>
            <Animated.View entering={FadeInUp.duration(400)}>
              <Pressable
                style={styles.backButton}
                onPress={() => {
                  setIsFriendsModalVisible(false);
                  setFriendSearchQuery('');
                }}
              >
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
                <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Friends</Text>
              <View style={styles.modalCountBadge}>
                <Text style={styles.modalCountText}>{friends.length}</Text>
              </View>
            </View>
            <View style={styles.modalHeaderRight}>
              <Pressable
                style={({ pressed }) => [styles.modalAddBtn, pressed && styles.btnPressed]}
                onPress={handleNavigateToDiscover}
              >
                <Ionicons name="person-add" size={16} color="#FFFFFF" />
                <Text style={styles.modalAddBtnText}>Add</Text>
              </Pressable>
            </View>
          </View>

          {/* Search Box */}
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by name or username..."
              placeholderTextColor={colors.textSecondary}
              value={friendSearchQuery}
              onChangeText={setFriendSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {friendSearchQuery.length > 0 ? (
              <Pressable onPress={() => setFriendSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          {/* Friends List */}
          <ScrollView
            contentContainerStyle={styles.modalListContent}
            showsVerticalScrollIndicator={false}
          >
            {isFriendsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6C5CE7" />
              </View>
            ) : filteredFriends.length === 0 ? (
              <View style={styles.emptyModalSearch}>
                <View style={[styles.emptySearchIconBg, { backgroundColor: isDark ? colors.border : '#EDE8FF' }]}>
                  <Ionicons
                    name={friendSearchQuery ? 'search-outline' : 'people-outline'}
                    size={36}
                    color="#6C5CE7"
                  />
                </View>
                <Text style={[styles.emptySearchTitle, { color: colors.text }]}>
                  {friendSearchQuery ? 'No matching friends found' : 'No friends yet'}
                </Text>
                <Text style={[styles.emptySearchSubtitle, { color: colors.textSecondary }]}>
                  {friendSearchQuery
                    ? `No friends matched "${friendSearchQuery}"`
                    : 'Search and connect with friends on the Discover page.'}
                </Text>
                {!friendSearchQuery ? (
                  <Pressable
                    style={({ pressed }) => [styles.discoverBtn, pressed && styles.btnPressed]}
                    onPress={handleNavigateToDiscover}
                  >
                    <Ionicons name="compass" size={16} color="#FFFFFF" />
                    <Text style={styles.discoverBtnText}>Find Friends</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              filteredFriends.map((f) => (
                <FriendCard
                  key={f.id}
                  friendship={f}
                  onRemove={() => handleRemoveFriend(f)}
                />
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F0FF',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  blobTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFE8EC',
    opacity: 0.5,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8DEFF',
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

  // Avatar
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#F0EDFF',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#6C5CE7',
    letterSpacing: 0.5,
  },
  fullNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D2D3A',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6C5CE7',
  },
  timezoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8E5F7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  timezoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#63637E',
  },

  // Stats Grid
  statsGrid: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0EDFF',
  },
  statCardInteractive: {
    borderColor: '#DED7FD',
    backgroundColor: '#FAF9FF',
  },
  statCardPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: '#F3EFFF',
  },
  statCardInner: {
    alignItems: 'center',
  },
  statIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2D2D3A',
    marginTop: 2,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B8BA0',
    letterSpacing: 0.2,
  },
  statChevron: {
    marginTop: 1,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8B8BA0',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Account Card
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EDFF',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  accountIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B8BA0',
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D3A',
    marginTop: 1,
  },
  accountDivider: {
    height: 1,
    backgroundColor: '#F3EFFF',
    marginVertical: 10,
  },

  // Settings Card
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F0EDFF',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowPressed: {
    opacity: 0.7,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D3A',
  },

  // Discover / Action Button
  discoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6C5CE7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  discoverBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F0FF',
    paddingTop: 16,
  },
  modalBackWrapper: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2D2D3A',
  },
  modalCountBadge: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  modalCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  modalAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8E5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E5F7',
    gap: 8,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D3A',
    padding: 0,
  },
  modalListContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyModalSearch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptySearchIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D2D3A',
    marginBottom: 6,
  },
  emptySearchSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B8BA0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  btnPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
});
