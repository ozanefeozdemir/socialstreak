import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { PublicUserRespond, UserSearchDto } from '@/types';

export type UserRelationStatus = 'none' | 'sent' | 'received' | 'friend';

interface UserSearchResultProps {
  user: PublicUserRespond | UserSearchDto;
  status: UserRelationStatus;
  sentRequestId?: string;
  receivedRequestId?: string;
  mutualFriendsCount?: number;
  onSendRequest?: (userId: string) => void;
  onCancelRequest?: (requestId: string) => void;
  onAcceptRequest?: (requestId: string) => void;
  onDeclineRequest?: (requestId: string) => void;
  isLoading?: boolean;
}

export function UserSearchResult({
  user,
  status,
  sentRequestId,
  receivedRequestId,
  mutualFriendsCount,
  onSendRequest,
  onCancelRequest,
  onAcceptRequest,
  onDeclineRequest,
  isLoading = false,
}: UserSearchResultProps) {
  const { colors, isDark } = useTheme();
  const initials = `${(user.name?.[0] || '').toUpperCase()}${(user.surname?.[0] || '').toUpperCase()}` || (user.username?.[0] || '?').toUpperCase();
  const fullName = [user.name, user.surname].filter(Boolean).join(' ') || user.username;
  const effectiveMutualFriends =
    mutualFriendsCount ?? ('mutualFriendsCount' in user ? (user.mutualFriendsCount ?? 0) : 0);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000000' : '#6C5CE7' }]}>
      <View style={[styles.avatar, { backgroundColor: isDark ? colors.border : '#EDE8FF' }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={[styles.fullName, { color: colors.text }]} numberOfLines={1}>
          {fullName}
        </Text>
        <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
          @{user.username}
        </Text>
        {effectiveMutualFriends > 0 ? (
          <View style={styles.mutualRow}>
            <Ionicons name="people" size={11} color={isDark ? '#A29BFE' : '#6C5CE7'} />
            <Text style={[styles.mutualText, { color: isDark ? '#A29BFE' : '#6C5CE7' }]}>
              {effectiveMutualFriends} mutual {effectiveMutualFriends === 1 ? 'friend' : 'friends'}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : status === 'none' ? (
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.btnPressed]}
            onPress={() => onSendRequest?.(user.id)}
          >
            <Ionicons name="person-add" size={14} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        ) : status === 'sent' ? (
          <Pressable
            style={({ pressed }) => [
              styles.sentBadge,
              isDark && { backgroundColor: '#3D201A', borderColor: '#5C2D22' },
              pressed && styles.btnPressed,
            ]}
            onPress={() => {
              if (sentRequestId && onCancelRequest) {
                onCancelRequest(sentRequestId);
              }
            }}
          >
            <Ionicons name="time-outline" size={13} color="#E17055" />
            <Text style={styles.sentBadgeText}>Requested</Text>
            <Ionicons name="close-circle" size={14} color="#E17055" />
          </Pressable>
        ) : status === 'received' ? (
          <View style={styles.receivedActions}>
            <Pressable
              style={({ pressed }) => [styles.acceptButton, pressed && styles.btnPressed]}
              onPress={() => {
                if (receivedRequestId && onAcceptRequest) {
                  onAcceptRequest(receivedRequestId);
                }
              }}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.declineButton, pressed && styles.btnPressed]}
              onPress={() => {
                if (receivedRequestId && onDeclineRequest) {
                  onDeclineRequest(receivedRequestId);
                }
              }}
            >
              <Ionicons name="close" size={16} color="#E74C3C" />
            </Pressable>
          </View>
        ) : (
          <View style={[styles.friendBadge, isDark && { backgroundColor: '#064E3B', borderColor: '#065F46' }]}>
            <Ionicons name="checkmark-circle" size={14} color="#00B894" />
            <Text style={[styles.friendBadgeText, isDark && { color: '#6EE7B7' }]}>Friends</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0EDFF',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8DEFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F2EDFF',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.5,
  },
  userInfo: {
    flex: 1,
  },
  fullName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D3A',
  },
  username: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B8BA0',
    marginTop: 2,
  },
  mutualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  mutualText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#6C5CE7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF4EE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE3D2',
  },
  sentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E17055',
  },
  receivedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#00B894',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  declineButton: {
    backgroundColor: '#FFF0F0',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDFCF5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C6F6D9',
  },
  friendBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
});
