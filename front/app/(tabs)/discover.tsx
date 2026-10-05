import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSearchUsers } from '@/hooks/useUsers';
import { useSentFriendRequests,
  useReceivedFriendRequests,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRemoveFriendRequest,
} from '@/hooks/useFriendRequests';
import { useFriends } from '@/hooks/useFriends';
import { useTrendingHabits, useHabits, useCreateHabit } from '@/hooks/useHabits';
import { UserSearchResult, type UserRelationStatus } from '@/components/friend/UserSearchResult';
import { FriendRequestCard } from '@/components/friend/FriendRequestCard';
import { TrendingHabitCard } from '@/components/habit/TrendingHabitCard';
import { HabitDiscoveryModal } from '@/components/habit/HabitDiscoveryModal';
import { useRouter } from 'expo-router';
import type { TrendingHabitRespond } from '@/types';

type TabType = 'find' | 'requests';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface CategoryConfig {
  label: string;
  icon: IoniconsName;
  color: string;
}

const CATEGORY_META: Record<string, CategoryConfig> = {
  ALL: { label: 'All Habits', icon: 'sparkles', color: '#6C5CE7' },
  Gaming: { label: 'Gaming', icon: 'game-controller', color: '#7052FF' },
  Fitness: { label: 'Fitness', icon: 'barbell', color: '#FF7675' },
  Health: { label: 'Health', icon: 'water', color: '#00CEC9' },
  Learning: { label: 'Learning', icon: 'book', color: '#0984E3' },
  Productivity: { label: 'Productivity', icon: 'flash', color: '#FDCB6E' },
  Mindfulness: { label: 'Mindfulness', icon: 'leaf', color: '#00B894' },
};

function getCategoryMeta(cat: string): CategoryConfig {
  return (
    CATEGORY_META[cat] || {
      label: cat,
      icon: 'shapes-outline',
      color: '#6C5CE7',
    }
  );
}

export default function DiscoverScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('find');
  const [searchQuery, setSearchQuery] = useState('');
  const [discoveryModalVisible, setDiscoveryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [joiningHabitId, setJoiningHabitId] = useState<string | null>(null);
  const router = useRouter();

  const { user: currentUser } = useAuth();
  const { colors, isDark } = useTheme();

  // Queries
  const {
    data: searchResults = [],
    isLoading: isSearchLoading,
    isFetching: isSearchFetching,
    error: searchError,
    refetch: refetchSearch,
    isRefetching: isRefetchingSearch,
    isDebouncing,
    isSearchActive,
  } = useSearchUsers(searchQuery);

  const isRateLimited = (searchError as any)?.response?.status === 429;

  const {
    data: trendingHabits = [],
    isLoading: isTrendingLoading,
    refetch: refetchTrending,
    isRefetching: isRefetchingTrending,
  } = useTrendingHabits();

  const {
    data: myHabits = [],
    refetch: refetchMyHabits,
    isRefetching: isRefetchingMyHabits,
  } = useHabits();

  const {
    data: sentRequests = [],
    isLoading: isSentLoading,
    refetch: refetchSent,
    isRefetching: isRefetchingSent,
  } = useSentFriendRequests();

  const {
    data: receivedRequests = [],
    isLoading: isReceivedLoading,
    refetch: refetchReceived,
    isRefetching: isRefetchingReceived,
  } = useReceivedFriendRequests();

  const {
    data: friends = [],
    isLoading: isFriendsLoading,
    refetch: refetchFriends,
    isRefetching: isRefetchingFriends,
  } = useFriends();

  // Mutations
  const sendRequestMutation = useSendFriendRequest();
  const acceptRequestMutation = useAcceptFriendRequest();
  const removeRequestMutation = useRemoveFriendRequest();
  const createHabitMutation = useCreateHabit();

  const isRefreshing =
    (isSearchActive ? isRefetchingSearch : false) ||
    isRefetchingTrending ||
    isRefetchingMyHabits ||
    isRefetchingSent ||
    isRefetchingReceived ||
    isRefetchingFriends;

  const onRefresh = () => {
    if (isSearchActive) {
      refetchSearch();
    }
    refetchTrending();
    refetchMyHabits();
    refetchSent();
    refetchReceived();
    refetchFriends();
  };

  // Active search results (Elasticsearch handles fuzzy, typo-tolerance & ranking; we safely exclude self)
  const searchUsers = useMemo(() => {
    if (!isSearchActive) return [];
    return searchResults.filter((u) => {
      if (
        currentUser &&
        (u.id === currentUser.id || u.username.toLowerCase() === currentUser.username.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [searchResults, currentUser, isSearchActive]);

  // Fast lookup maps for user statuses
  const friendUserIds = useMemo(() => new Set(friends.map((f) => f.friend.id)), [friends]);

  const sentRequestMap = useMemo(() => {
    const map = new Map<string, string>(); // receiverId -> requestId
    sentRequests.forEach((req) => {
      map.set(req.receiver.id, req.id);
    });
    return map;
  }, [sentRequests]);

  const receivedRequestMap = useMemo(() => {
    const map = new Map<string, string>(); // senderId -> requestId
    receivedRequests.forEach((req) => {
      map.set(req.sender.id, req.id);
    });
    return map;
  }, [receivedRequests]);

  // Handlers
  const handleSendRequest = (userId: string) => {
    sendRequestMutation.mutate(userId, {
      onError: (err: any) => {
        const message = err.response?.data?.message || 'Failed to send friend request';
        Alert.alert('Error', message);
      },
    });
  };

  const handleAcceptRequest = (requestId: string) => {
    acceptRequestMutation.mutate(requestId, {
      onError: (err: any) => {
        const message = err.response?.data?.message || 'Failed to accept request';
        Alert.alert('Error', message);
      },
    });
  };

  const handleDeclineOrCancelRequest = (requestId: string) => {
    removeRequestMutation.mutate(requestId, {
      onError: (err: any) => {
        const message = err.response?.data?.message || 'Failed to cancel request';
        Alert.alert('Error', message);
      },
    });
  };

  // Trending Community Habit Logic
  const categories = useMemo(() => {
    const set = new Set<string>();
    trendingHabits.forEach((h) => {
      if (h.category) set.add(h.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [trendingHabits]);

  const filteredTrending = useMemo(() => {
    if (selectedCategory === 'ALL') return trendingHabits;
    return trendingHabits.filter(
      (h) => h.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [trendingHabits, selectedCategory]);

  const myHabitNames = useMemo(() => {
    return new Set(myHabits.filter((h) => !h.archived).map((h) => h.name.toLowerCase().trim()));
  }, [myHabits]);

  const isHabitJoined = (habit: TrendingHabitRespond) => {
    const target = habit.name.toLowerCase().trim();
    if (myHabitNames.has(target)) return true;
    for (const name of myHabitNames) {
      if (target.includes(name) || name.includes(target)) return true;
    }
    return false;
  };

  const handleJoinTrendingHabit = async (habit: TrendingHabitRespond) => {
    try {
      setJoiningHabitId(habit.id);
      await createHabitMutation.mutateAsync({
        name: habit.name,
        frequencyType: habit.defaultFrequency || 'DAILY',
        habitType: habit.habitType,
        config: habit.config,
        isPublic: true,
      });
      Alert.alert(
        'Habit Joined! 🔥',
        `"${habit.name}" has been added to your habits. Let's build your streak!`,
        [
          { text: 'View Habits', onPress: () => router.push('/(tabs)') },
          { text: 'Awesome!', style: 'cancel' },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to join habit');
    } finally {
      setJoiningHabitId(null);
    }
  };

  const pendingReceivedCount = receivedRequests.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background decoration blobs */}
      <View style={styles.blobTopLeft} />
      <View style={styles.blobBottomRight} />

      {/* Header */}
      <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Discover</Text>
          <Ionicons name="compass" size={26} color="#6C5CE7" />
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Connect with friends & explore habits</Text>
      </Animated.View>

      {/* Segmented Pill Control */}
      <Animated.View entering={FadeInDown.springify().damping(18).delay(100)} style={styles.segmentedContainer}>
        <View style={[styles.segmentedControl, { backgroundColor: isDark ? colors.border : '#EAE6FA' }]}>
          <Pressable
            style={[
              styles.segmentBtn, 
              activeTab === 'find' && [styles.segmentBtnActive, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#6C5CE7' }]
            ]}
            onPress={() => setActiveTab('find')}
          >
            <Ionicons
              name="search-outline"
              size={16}
              color={activeTab === 'find' ? '#6C5CE7' : '#8B8BA0'}
            />
            <Text style={[styles.segmentText, activeTab === 'find' && styles.segmentTextActive]}>
              Find Friends
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentBtn, 
              activeTab === 'requests' && [styles.segmentBtnActive, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#6C5CE7' }]
            ]}
            onPress={() => setActiveTab('requests')}
          >
            <Ionicons
              name="mail-outline"
              size={16}
              color={activeTab === 'requests' ? '#6C5CE7' : '#8B8BA0'}
            />
            <Text
              style={[styles.segmentText, activeTab === 'requests' && styles.segmentTextActive]}
            >
              Requests
            </Text>
            {pendingReceivedCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingReceivedCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </Animated.View>

      {/* Tab 1: Find Friends */}
      {activeTab === 'find' ? (
        <View style={styles.tabContent}>
          {/* Search bar */}
          <View style={styles.searchBoxWrapper}>
            <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000' : '#6C5CE7' }]}>
              <Ionicons name="search" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search by name or @username..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {(isDebouncing || (isSearchFetching && !isRefreshing)) ? (
                <ActivityIndicator size="small" color="#6C5CE7" style={{ marginRight: 2 }} />
              ) : null}
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#B8B8D0" />
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
            }
          >
            {isSearchLoading && searchUsers.length === 0 ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6C5CE7" />
              </View>
            ) : isRateLimited ? (
              <View style={styles.centerContainer}>
                <Ionicons name="speedometer-outline" size={44} color="#E17055" />
                <Text style={styles.noResultsTitle}>Search Limit Reached</Text>
                <Text style={styles.noResultsSubtitle}>
                  You&apos;ve reached the search rate limit (20 req/min). Please wait a moment and try again.
                </Text>
              </View>
            ) : searchQuery.trim().length === 0 ? (
              // Empty search initial view: Friend Search helper + Trending Community Habits
              <View style={styles.emptySearchContainer}>
                {/* Compact Friend Search Helper Card */}
                <View style={[styles.friendSearchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.friendSearchIconWrap}>
                    <Ionicons name="people" size={20} color="#27AE60" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.friendSearchTitle, { color: colors.text }]}>Find Friends by Username</Text>
                    <Text style={[styles.friendSearchSub, { color: colors.textSecondary }]}>
                      Type any name or @username above to find friends, view mutuals, and track streaks together!
                    </Text>
                  </View>
                </View>

                {/* Trending Community Habits Section */}
                <View style={styles.trendingHeaderSection}>
                  <View style={styles.trendingTitleRow}>
                    <View style={[styles.flameIconBadge, { backgroundColor: isDark ? '#4A2A22' : '#FFF2EE' }]}>
                      <Ionicons name="flame" size={20} color="#E17055" />
                    </View>
                    <Text style={[styles.trendingSectionTitle, { color: colors.text }]}>
                      Trending Habits
                    </Text>
                    <View style={styles.trendingLiveBadge}>
                      <View style={styles.pulseDot} />
                      <Text style={styles.trendingLiveText}>COMMUNITY</Text>
                    </View>
                  </View>

                  {/* Category Filter Chips with sleek vector icons */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                  >
                    {categories.map((cat) => {
                      const isActive = selectedCategory === cat;
                      const meta = getCategoryMeta(cat);

                      return (
                        <Pressable
                          key={cat}
                          style={[
                            styles.catChip,
                            isActive
                              ? [styles.catChipActive, { backgroundColor: '#6C5CE7', borderColor: '#6C5CE7' }]
                              : [
                                  styles.catChipInactive,
                                  {
                                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                                    borderColor: isDark ? '#2E2E42' : '#ECE8F8',
                                  },
                                ],
                          ]}
                          onPress={() => setSelectedCategory(cat)}
                        >
                          <View
                            style={[
                              styles.catIconWrap,
                              {
                                backgroundColor: isActive
                                  ? 'rgba(255, 255, 255, 0.22)'
                                  : isDark
                                  ? '#252538'
                                  : `${meta.color}15`,
                              },
                            ]}
                          >
                            <Ionicons
                              name={meta.icon}
                              size={13}
                              color={isActive ? '#FFFFFF' : meta.color}
                            />
                          </View>
                          <Text
                            style={[
                              styles.catChipText,
                              {
                                color: isActive ? '#FFFFFF' : isDark ? '#D5D5E8' : '#333346',
                                fontWeight: isActive ? '700' : '600',
                              },
                            ]}
                          >
                            {meta.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Trending Habit Cards List */}
                {isTrendingLoading && trendingHabits.length === 0 ? (
                  <View style={styles.trendingLoadingWrap}>
                    <ActivityIndicator size="small" color="#6C5CE7" />
                    <Text style={[styles.trendingLoadingText, { color: colors.textSecondary }]}>
                      Loading trending habits...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.trendingListContainer}>
                    {filteredTrending.map((habit, index) => {
                      const isJoined = isHabitJoined(habit);
                      const isJoining = joiningHabitId === habit.id;
                      return (
                        <TrendingHabitCard
                          key={habit.id}
                          habit={habit}
                          rank={index + 1}
                          index={index}
                          isJoined={isJoined}
                          isJoining={isJoining}
                          onJoin={handleJoinTrendingHabit}
                          onCustomize={() => {
                            router.push('/habit/create');
                          }}
                        />
                      );
                    })}
                  </View>
                )}

                {/* Optional Habit Catalog Modal Link */}
                <Pressable
                  style={({ pressed }) => [
                    styles.catalogTeaserCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => setDiscoveryModalVisible(true)}
                >
                  <View style={[styles.catalogIconWrap, { backgroundColor: isDark ? '#2D2845' : '#F0EDFF' }]}>
                    <Ionicons name="sparkles" size={18} color="#6C5CE7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.catalogTeaserTitle, { color: colors.text }]}>
                      Browse Blueprint Library
                    </Text>
                    <Text style={[styles.catalogTeaserSub, { color: colors.textSecondary }]}>
                      Explore 38+ ready-to-use habit blueprints & challenges
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#6C5CE7" />
                </Pressable>
              </View>
            ) : searchUsers.length === 0 ? (
              // No matching search results
              <View style={styles.centerContainer}>
                <Ionicons name="search-outline" size={44} color="#C0C0D8" />
                <Text style={styles.noResultsTitle}>No users found</Text>
                <Text style={styles.noResultsSubtitle}>
                  No user matching &quot;{searchQuery}&quot; was found. Double-check the spelling!
                </Text>
              </View>
            ) : (
              // Search Results List
              searchUsers.map((user) => {
                let status: UserRelationStatus = 'none';
                let sentId: string | undefined;
                let receivedId: string | undefined;

                if (friendUserIds.has(user.id)) {
                  status = 'friend';
                } else if (receivedRequestMap.has(user.id)) {
                  status = 'received';
                  receivedId = receivedRequestMap.get(user.id);
                } else if (sentRequestMap.has(user.id)) {
                  status = 'sent';
                  sentId = sentRequestMap.get(user.id);
                }

                return (
                  <UserSearchResult
                    key={user.id}
                    user={user}
                    status={status}
                    sentRequestId={sentId}
                    receivedRequestId={receivedId}
                    mutualFriendsCount={user.mutualFriendsCount}
                    onSendRequest={handleSendRequest}
                    onCancelRequest={handleDeclineOrCancelRequest}
                    onAcceptRequest={handleAcceptRequest}
                    onDeclineRequest={handleDeclineOrCancelRequest}
                    isLoading={
                      (sendRequestMutation.isPending && sendRequestMutation.variables === user.id) ||
                      (acceptRequestMutation.isPending && acceptRequestMutation.variables === receivedId) ||
                      (removeRequestMutation.isPending &&
                        (removeRequestMutation.variables === sentId || removeRequestMutation.variables === receivedId))
                    }
                  />
                );
              })
            )}
          </ScrollView>
        </View>
      ) : (
        /* Tab 2: Requests */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
          }
        >
          {isSentLoading || isReceivedLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#6C5CE7" />
            </View>
          ) : receivedRequests.length === 0 && sentRequests.length === 0 ? (
            <View style={styles.emptyRequestsContainer}>
              <View style={[styles.requestsBubble, isDark && { backgroundColor: colors.border }]}>
                <Ionicons name="mail-open-outline" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No pending requests</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                You have no incoming or outgoing friend invites right now. Head over to &quot;Find Friends&quot; to connect!
              </Text>
            </View>
          ) : (
            <View>
              {/* Received Requests Section */}
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECEIVED REQUESTS</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{receivedRequests.length}</Text>
                </View>
              </View>

              {receivedRequests.length === 0 ? (
                <View style={[styles.emptySectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.emptySectionText, { color: colors.textSecondary }]}>No received requests right now</Text>
                </View>
              ) : (
                receivedRequests.map((req) => (
                  <FriendRequestCard
                    key={req.id}
                    request={req}
                    type="received"
                    onAccept={handleAcceptRequest}
                    onDecline={handleDeclineOrCancelRequest}
                    isLoading={
                      (acceptRequestMutation.isPending && acceptRequestMutation.variables === req.id) ||
                      (removeRequestMutation.isPending && removeRequestMutation.variables === req.id)
                    }
                  />
                ))
              )}

              {/* Sent Requests Section */}
              <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SENT REQUESTS</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{sentRequests.length}</Text>
                </View>
              </View>

              {sentRequests.length === 0 ? (
                <View style={[styles.emptySectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.emptySectionText, { color: colors.textSecondary }]}>No sent requests waiting for response</Text>
                </View>
              ) : (
                sentRequests.map((req) => (
                  <FriendRequestCard
                    key={req.id}
                    request={req}
                    type="sent"
                    onCancel={handleDeclineOrCancelRequest}
                    isLoading={
                      removeRequestMutation.isPending && removeRequestMutation.variables === req.id
                    }
                  />
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Habit Discovery Modal */}
      <HabitDiscoveryModal
        visible={discoveryModalVisible}
        onClose={() => setDiscoveryModalVisible(false)}
        onSelectPresetToCustomize={() => {
          setDiscoveryModalVisible(false);
          router.push('/habit/create');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F0FF',
  },
  blobTopLeft: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#D4F5DC',
    opacity: 0.5,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E8DEFF',
    opacity: 0.4,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 14,
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

  // Segmented control
  segmentedContainer: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#EAE6FA',
    borderRadius: 16,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B8BA0',
  },
  segmentTextActive: {
    color: '#6C5CE7',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Tab Content & Search
  tabContent: {
    flex: 1,
  },
  searchBoxWrapper: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#EDEDF5',
    gap: 10,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2D2D3A',
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  // Empty Search / Mascot & Trending Community Habits
  emptySearchContainer: {
    paddingVertical: 12,
  },
  friendSearchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    marginBottom: 20,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  friendSearchIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendSearchTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  friendSearchSub: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },

  // Trending Section
  trendingHeaderSection: {
    marginBottom: 14,
  },
  trendingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  flameIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingSectionTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  trendingLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEAA7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D63031',
  },
  trendingLiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D63031',
    letterSpacing: 0.5,
  },

  // Category filter chips
  categoryScroll: {
    gap: 8,
    paddingVertical: 6,
    paddingRight: 10,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 7,
  },
  catChipActive: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  catChipInactive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  catIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catChipText: {
    fontSize: 13,
  },

  // Loading & List
  trendingLoadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  trendingLoadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  trendingListContainer: {
    marginTop: 8,
  },

  // Catalog Teaser Footer
  catalogTeaserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 20,
    gap: 12,
  },
  catalogIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogTeaserTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  catalogTeaserSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },

  // No results
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D3A',
    marginTop: 14,
    marginBottom: 6,
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#8B8BA0',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // Requests Tab
  emptyRequestsContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  requestsBubble: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#E8DEFF',
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8B8BA0',
    letterSpacing: 0.8,
  },
  countPill: {
    backgroundColor: '#EAE6FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C5CE7',
  },
  emptySectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0EDFF',
    marginBottom: 12,
  },
  emptySectionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A0A0B8',
  },
});
