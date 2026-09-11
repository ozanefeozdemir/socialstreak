import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingsItemProps {
  icon: IoniconsName;
  iconColor: string;
  label: string;
  value?: string;
  onPress?: () => void;
}

function SettingsItem({ icon, iconColor, label, value, onPress }: SettingsItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsItem, pressed && onPress ? styles.settingsItemPressed : undefined]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingsIconBg, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color="#C0C0D0" /> : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      {/* Background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Settings</Text>
            <Ionicons name="settings" size={24} color="#6C5CE7" />
          </View>
          <Text style={styles.subtitle}>Manage your account</Text>
        </Animated.View>

        {/* Account section */}
        <Animated.View entering={FadeInDown.springify().damping(18).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.sectionCard}>
            <SettingsItem icon="person" iconColor="#6C5CE7" label="Edit Profile" onPress={() => { }} />
            <View style={styles.divider} />
            <SettingsItem icon="lock-closed" iconColor="#E17055" label="Change Password" onPress={() => { }} />
            <View style={styles.divider} />
            <SettingsItem icon="mail" iconColor="#00B894" label="Email" value="Connected" />
          </View>
        </Animated.View>

        {/* Preferences section */}
        <Animated.View entering={FadeInDown.springify().damping(18).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.sectionCard}>
            <SettingsItem icon="moon" iconColor="#6C5CE7" label="Dark Mode" value="Coming soon" />
            <View style={styles.divider} />
            <SettingsItem icon="notifications" iconColor="#FDCB6E" label="Notifications" value="Coming soon" />
            <View style={styles.divider} />
            <SettingsItem icon="globe" iconColor="#00B894" label="Timezone" value="Auto-detected" />
          </View>
        </Animated.View>

        {/* About section */}
        <Animated.View entering={FadeInDown.springify().damping(18).delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.sectionCard}>
            <SettingsItem icon="information-circle" iconColor="#6C5CE7" label="Version" value="1.0.0" />
            <View style={styles.divider} />
            <SettingsItem icon="document-text" iconColor="#8B8BA0" label="Terms of Service" onPress={() => { }} />
            <View style={styles.divider} />
            <SettingsItem icon="shield-checkmark" iconColor="#00B894" label="Privacy Policy" onPress={() => { }} />
          </View>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.logoutSection}>
          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed ? styles.logoutPressed : undefined]}
            onPress={logout}
          >
            <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.footer}>
          <Text style={styles.footerText}>Made with </Text>
          <Ionicons name="heart" size={14} color="#6C5CE7" />
          <Text style={styles.footerText}> by Ozan Efe Özdemir</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F0FF',
  },
  scroll: {
    paddingBottom: 40,
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
    paddingBottom: 20,
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

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B8BA0',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0EDFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5FA',
    marginLeft: 60,
  },

  // Settings item
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  settingsItemPressed: {
    backgroundColor: '#FAFAFF',
  },
  settingsIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsContent: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D3A',
  },
  settingsValue: {
    fontSize: 13,
    color: '#8B8BA0',
    marginTop: 2,
    fontWeight: '500',
  },

  // Logout
  logoutSection: {
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#FFE0E0',
  },
  logoutPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: '#FFF0F0',
  },
  logoutText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '700',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#B8B8D0',
    fontWeight: '500',
  },
});
