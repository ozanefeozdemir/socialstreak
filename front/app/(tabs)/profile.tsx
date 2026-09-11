import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user: currentUser } = useAuth();
  const displayName = [currentUser?.name, currentUser?.surname].filter(Boolean).join(' ') || currentUser?.username || 'User';
  const displayUsername = currentUser?.username ? `@${currentUser.username}` : '@user';

  return (
    <View style={styles.container}>
      {/* Background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      {/* Header */}
      <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Profile</Text>
          <Ionicons name="person-circle" size={24} color="#6C5CE7" />
        </View>
        <Text style={styles.subtitle}>Your stats and streaks</Text>
      </Animated.View>

      {/* Avatar */}
      <Animated.View entering={BounceIn.duration(800).delay(100)} style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#6C5CE7" />
        </View>
        <Text style={styles.fullNameText}>{displayName}</Text>
        <Text style={styles.username}>{displayUsername}</Text>
      </Animated.View>

      {/* Stats cards */}
      <Animated.View entering={FadeInDown.springify().damping(18).delay(200)} style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color="#E17055" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-done" size={24} color="#00B894" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Check-ins</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={24} color="#FDCB6E" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Habits</Text>
        </View>
      </Animated.View>

      {/* Coming soon */}
      <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.comingSoon}>
        <View style={styles.comingSoonCard}>
          <Ionicons name="construct" size={20} color="#E17055" />
          <Text style={styles.comingSoonText}>Full profile coming soon!</Text>
        </View>
      </Animated.View>
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
    marginVertical: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF',
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
  fullNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D2D3A',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C5CE7',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0EDFF',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2D2D3A',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B8BA0',
    marginTop: 4,
    letterSpacing: 0.3,
  },

  // Coming soon
  comingSoon: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE8D0',
  },
  comingSoonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E17055',
  },
});
