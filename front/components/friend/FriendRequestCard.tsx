import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FriendRequestRespond } from '@/types';

interface FriendRequestCardProps {
  request: FriendRequestRespond;
  type: 'received' | 'sent';
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  isLoading?: boolean;
}

export function FriendRequestCard({
  request,
  type,
  onAccept,
  onDecline,
  onCancel,
  isLoading = false,
}: FriendRequestCardProps) {
  const targetUser = type === 'received' ? request.sender : request.receiver;
  const initials = `${(targetUser.name?.[0] || '').toUpperCase()}${(targetUser.surname?.[0] || '').toUpperCase()}` || (targetUser.username?.[0] || '?').toUpperCase();
  const fullName = [targetUser.name, targetUser.surname].filter(Boolean).join(' ') || targetUser.username;

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.fullName} numberOfLines={1}>
          {fullName}
        </Text>
        <Text style={styles.username} numberOfLines={1}>
          @{targetUser.username}
        </Text>
      </View>

      <View style={styles.actions}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#6C5CE7" />
        ) : type === 'received' ? (
          <View style={styles.receivedRow}>
            <Pressable
              style={({ pressed }) => [styles.acceptBtn, pressed && styles.btnPressed]}
              onPress={() => onAccept?.(request.id)}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.acceptBtnText}>Accept</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.declineBtn, pressed && styles.btnPressed]}
              onPress={() => onDecline?.(request.id)}
            >
              <Ionicons name="close" size={16} color="#8B8BA0" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.sentRow}>
            <View style={styles.pendingBadge}>
              <Ionicons name="hourglass-outline" size={12} color="#E17055" />
              <Text style={styles.pendingText}>Pending</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
              onPress={() => onCancel?.(request.id)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
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
    paddingVertical: 14,
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E8DEFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F2EDFF',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.5,
  },
  content: {
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  receivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00B894',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  declineBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5F5FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF4EE',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E17055',
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E74C3C',
  },
});
