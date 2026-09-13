import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingsItemProps {
  icon: IoniconsName;
  iconColor: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function SettingsItem({ icon, iconColor, label, value, onPress, rightElement }: SettingsItemProps) {
  const { colors } = useTheme();
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsItem, 
        pressed && onPress ? { backgroundColor: colors.background } : undefined
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingsIconBg, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsLabel, { color: colors.text }]}>{label}</Text>
        {value ? <Text style={[styles.settingsValue, { color: colors.textSecondary }]}>{value}</Text> : null}
      </View>
      {rightElement ? rightElement : onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} /> : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { logout, user } = useAuth();
  const { theme, isDark, setTheme, colors } = useTheme();
  const router = useRouter();
  const isEmailVerified = false;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
            <Ionicons name="settings" size={24} color="#6C5CE7" />
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your account</Text>
        </Animated.View>

        {/* Account section */}
        <Animated.View entering={FadeInDown.springify().damping(18).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsItem icon="person" iconColor="#6C5CE7" label="Edit Profile" onPress={() => router.push('/settings/edit-profile')} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingsItem icon="lock-closed" iconColor="#E17055" label="Change Password" onPress={() => router.push('/settings/change-password')} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingsItem 
              icon="mail" 
              iconColor={isEmailVerified ? "#00B894" : "#E74C3C"} 
              label="Email" 
              value={user?.email || "Connected"} 
              rightElement={
                !isEmailVerified ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: '#E74C3C', fontSize: 13, fontWeight: '600' }}>Verify</Text>
                    <Ionicons name="alert-circle" size={18} color="#E74C3C" />
                  </View>
                ) : undefined
              }
              onPress={!isEmailVerified ? () => {
                Alert.alert(
                  'Email Verification',
                  `A verification link has been sent to ${user?.email || 'your email'}. Please check your inbox to verify your account.`
                );
              } : undefined}
            />
          </View>
        </Animated.View>

        {/* Preferences section */}
        <Animated.View entering={FadeInDown.springify().damping(18).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsItem 
              icon="moon" 
              iconColor="#6C5CE7" 
              label="Dark Mode" 
              value={theme === 'system' ? 'System' : theme === 'dark' ? 'On' : 'Off'}
              rightElement={
                <Switch 
                  value={isDark} 
                  onValueChange={(val) => setTheme(val ? 'dark' : 'light')} 
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                />
              }
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingsItem icon="notifications" iconColor="#FDCB6E" label="Notifications" onPress={() => router.push('/settings/notifications')} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingsItem icon="globe" iconColor="#00B894" label="Timezone" value={user?.timezone || "Auto-detected"} onPress={() => router.push('/settings/timezone')} />
          </View>
        </Animated.View>

        {/* About section */}
        <Animated.View entering={FadeInDown.springify().damping(18).delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsItem icon="information-circle" iconColor="#6C5CE7" label="Version" value="1.0.0" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingsItem icon="document-text" iconColor="#8B8BA0" label="Terms of Service" onPress={() => router.push('/settings/terms')} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingsItem icon="shield-checkmark" iconColor="#00B894" label="Privacy Policy" onPress={() => router.push('/settings/privacy')} />
          </View>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.logoutSection}>
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton, 
              pressed ? styles.logoutPressed : undefined,
              { backgroundColor: isDark ? '#3A1C1C' : '#FFF5F5', borderColor: isDark ? '#4A2525' : '#FFE0E0' }
            ]}
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
