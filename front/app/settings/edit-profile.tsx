import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!user) return;
    setError('');
    setIsLoading(true);

    try {
      await usersApi.update(user.id, { username, email, timezone });
      // Update local context
      setUser({ ...user, username, email, timezone });
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
  }
});
