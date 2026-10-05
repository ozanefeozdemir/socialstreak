import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from '@/components/ui/Input';
import { usersApi } from '@/api/endpoints/users';

export default function EditProfileScreen() {
  const { user, setUser } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [timezone, setTimezone] = useState(user?.timezone || '');
  const [privacySearchable, setPrivacySearchable] = useState(user?.privacySearchable ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!user) return;
    setError('');
    setIsLoading(true);

    try {
      await usersApi.update(user.id, { username, email, timezone, privacySearchable });
      // Update local context
      setUser({ ...user, username, email, timezone, privacySearchable });
      Alert.alert('Success', 'Profile updated successfully.');
      router.back();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Edit Profile' }} />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Input
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Timezone"
          value={timezone}
          onChangeText={setTimezone}
          placeholder="e.g. UTC, Europe/Istanbul"
        />

        {/* Discovery Visibility Toggle */}
        <View style={[styles.switchRow, { borderColor: colors.border }]}>
          <View style={styles.switchTextContainer}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Appear in Discovery</Text>
            <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>
              Allow other users to find you via username or name search
            </Text>
          </View>
          <Switch
            value={privacySearchable}
            onValueChange={setPrivacySearchable}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable 
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  switchDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
