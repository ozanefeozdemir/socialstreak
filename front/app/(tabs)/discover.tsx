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
import { useUsers } from '@/hooks/useUsers';
import {
  useSentFriendRequests,
  useReceivedFriendRequests,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRemoveFriendRequest,
} from '@/hooks/useFriendRequests';
import { useFriends } from '@/hooks/useFriends';
import { UserSearchResult, type UserRelationStatus } from '@/components/friend/UserSearchResult';
import { FriendRequestCard } from '@/components/friend/FriendRequestCard';

type TabType = 'find' | 'requests';

export default function DiscoverScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('find');
  const [searchQuery, setSearchQuery] = useState('');

  const { user: currentUser } = useAuth();

  // Queries
  const {
    data: users = [],
    isLoading: isUsersLoading,
    refetch: refetchUsers,
    isRefetching: isRefetchingUsers,
  } = useUsers();

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

  const isRefreshing =
    isRefetchingUsers || isRefetchingSent || isRefetchingReceived || isRefetchingFriends;

  const onRefresh = () => {
    refetchUsers();
    refetchSent();
    refetchReceived();
    refetchFriends();
  };

  // Filtered users for search
  const filteredUsers = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return [];

    return users.filter((u) => {
      // Exclude self
      if (
        currentUser &&
        (u.id === currentUser.id || u.username.toLowerCase() === currentUser.username.toLowerCase())
      ) {
        return false;
      }
      const matchesUsername = u.username.toLowerCase().includes(trimmed);
      const matchesName = u.name?.toLowerCase().includes(trimmed);
      const matchesSurname = u.surname?.toLowerCase().includes(trimmed);
      const matchesFull = `${u.name || ''} ${u.surname || ''}`.toLowerCase().includes(trimmed);
      return matchesUsername || matchesName || matchesSurname || matchesFull;
    });
  }, [users, searchQuery, currentUser]);

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

  const pendingReceivedCount = receivedRequests.length;

  return (
    <View style={styles.container}>
      {/* Background decoration blobs */}
      <View style={styles.blobTopLeft} />
      <View style={styles.blobBottomRight} />

      {/* Header */}
      <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Discover</Text>
          <Ionicons name="compass" size={26} color="#6C5CE7" />
        </View>
        <Text style={styles.subtitle}>Connect with friends & explore habits</Text>
      </Animated.View>

      {/* Segmented Pill Control */}
      <Animated.View entering={FadeInDown.springify().damping(18).delay(100)} style={styles.segmentedContainer}>
        <View style={styles.segmentedControl}>
          <Pressable
            style={[styles.segmentBtn, activeTab === 'find' && styles.segmentBtnActive]}
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
            style={[styles.segmentBtn, activeTab === 'requests' && styles.segmentBtnActive]}
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
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#8B8BA0" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or @username..."
                placeholderTextColor="#B8B8D0"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
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
            {isUsersLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6C5CE7" />
              </View>
            ) : searchQuery.trim().length === 0 ? (
              // Empty search initial view
              <View style={styles.emptySearchContainer}>
                <View style={styles.mascotBubble}>
                  <Ionicons name="people" size={38} color="#27AE60" />
                </View>
                <Text style={styles.emptyTitle}>Find your streak crew</Text>
                <Text style={styles.emptySubtitle}>
                  Search for your friends by username to cheer each other on and maintain daily streaks together!
                </Text>

                {/* Coming Soon: Popular Habits Preview Card */}
                <View style={styles.teaserCard}>
                  <View style={styles.teaserHeader}>
                    <View style={styles.teaserIconWrapper}>
                      <Ionicons name="flame" size={20} color="#E17055" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teaserTitle}>Trending Habits</Text>
                      <Text style={styles.teaserBadge}>COMING SOON</Text>
                    </View>
                  </View>
                  <Text style={styles.teaserDesc}>
                    Discover popular habits like 30-day reading challenges, daily workouts, and meditation streaks.
                  </Text>
                </View>
              </View>
            ) : filteredUsers.length === 0 ? (
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
              filteredUsers.map((user) => {
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
              <View style={styles.requestsBubble}>
                <Ionicons name="mail-open-outline" size={36} color="#6C5CE7" />
              </View>
              <Text style={styles.emptyTitle}>No pending requests</Text>
              <Text style={styles.emptySubtitle}>
                You have no incoming or outgoing friend invites right now. Head over to &quot;Find Friends&quot; to connect!
              </Text>
            </View>
          ) : (
            <View>
              {/* Received Requests Section */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>RECEIVED REQUESTS</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{receivedRequests.length}</Text>
                </View>
              </View>

              {receivedRequests.length === 0 ? (
                <View style={styles.emptySectionCard}>
                  <Text style={styles.emptySectionText}>No received requests right now</Text>
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
                <Text style={styles.sectionTitle}>SENT REQUESTS</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{sentRequests.length}</Text>
                </View>
              </View>

              {sentRequests.length === 0 ? (
                <View style={styles.emptySectionCard}>
                  <Text style={styles.emptySectionText}>No sent requests waiting for response</Text>
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

  // Empty Search / Mascot
  emptySearchContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  mascotBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#D4F5DC',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D2D3A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8B8BA0',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 16,
  },

  // Coming soon card
  teaserCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 28,
    borderWidth: 1,
    borderColor: '#F0EDFF',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  teaserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  teaserIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF2EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teaserTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D3A',
  },
  teaserBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E17055',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  teaserDesc: {
    fontSize: 13,
    color: '#8B8BA0',
    lineHeight: 19,
    fontWeight: '500',
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
