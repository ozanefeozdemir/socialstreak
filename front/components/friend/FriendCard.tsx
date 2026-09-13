import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { FriendshipRespond } from '@/types';

interface FriendCardProps {
  friendship: FriendshipRespond;
  onRemove?: (friendId: string) => void;
  onPress?: () => void;
}

export function FriendCard({ friendship, onRemove, onPress }: FriendCardProps) {
  const { colors, isDark } = useTheme();
  const { friend } = friendship;
  const initials = `${(friend.name?.[0] || '').toUpperCase()}${(friend.surname?.[0] || '').toUpperCase()}` || (friend.username?.[0] || '?').toUpperCase();
  const fullName = [friend.name, friend.surname].filter(Boolean).join(' ') || friend.username;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000000' : '#6C5CE7' },
        pressed && onPress && { backgroundColor: isDark ? colors.border : '#F8F6FF' },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.avatar, { backgroundColor: isDark ? colors.border : '#EDE8FF' }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
      </View>

      <View style={styles.info}>
        <Text style={[styles.fullName, { color: colors.text }]} numberOfLines={1}>
          {fullName}
        </Text>
        <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
          @{friend.username}
        </Text>
      </View>

      {onRemove ? (
        <Pressable
          style={({ pressed }) => [
            styles.removeButton,
            { backgroundColor: isDark ? colors.border : '#F3F0FF' },
            pressed && styles.btnPressed,
          ]}
          onPress={() => onRemove(friend.id)}
        >
          <Ionicons name="person-remove-outline" size={16} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </Pressable>
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
  cardPressed: {
    backgroundColor: '#F8F6FF',
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
  info: {
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
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5F5FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.8,
  },
});
