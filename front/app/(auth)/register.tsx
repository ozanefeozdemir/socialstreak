import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  BounceIn,
} from 'react-native-reanimated';
import * as Localization from 'expo-localization';

import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateRequired,
} from '@/utils/validation';

export default function RegisterScreen() {
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '',
    surname: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleRegister = async () => {
    const newErrors: Record<string, string> = {};

    const nameErr = validateRequired(form.name, 'Name');
    const surnameErr = validateRequired(form.surname, 'Surname');
    const emailErr = validateEmail(form.email);
    const usernameErr = validateUsername(form.username);
    const passwordErr = validatePassword(form.password);

    if (nameErr) newErrors.name = nameErr;
    if (surnameErr) newErrors.surname = surnameErr;
    if (emailErr) newErrors.email = emailErr;
    if (usernameErr) newErrors.username = usernameErr;
    if (passwordErr) newErrors.password = passwordErr;
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords don\'t match 🤔';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setApiError('');
    setLoading(true);

    try {
      const timezones = Localization.getCalendars();
      const timezone = timezones[0]?.timeZone ?? 'UTC';

      await register({
        name: form.name.trim(),
        surname: form.surname.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        timezone,
      });
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.fieldErrors) {
        setErrors(data.fieldErrors);
      } else {
        const message = data?.message ?? data?.error ?? 'Registration failed. Please try again.';
        setApiError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background blobs */}
      <View style={styles.blobTopLeft} />
      <View style={styles.blobBottomRight} />
      <View style={styles.blobMidRight} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Mascot */}
          <Animated.View entering={BounceIn.duration(800).delay(100)} style={styles.mascotContainer}>
            <View style={styles.mascotBubble}>
              <Text style={styles.mascotEmoji}>🌱</Text>
            </View>
            <Animated.View entering={FadeInUp.duration(500).delay(600)} style={styles.speechBubble}>
              <Text style={styles.speechText}>Let's grow together!</Text>
              <View style={styles.speechTail} />
            </Animated.View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInUp.duration(600).delay(300)} style={styles.titleContainer}>
            <Text style={styles.title}>Join the Streak</Text>
            <Text style={styles.subtitle}>Create your account in seconds ⚡</Text>
          </Animated.View>

          {/* OAuth first (quicker signup) */}
          <Animated.View entering={FadeInDown.springify().damping(18).delay(400)} style={styles.oauthContainer}>
            <Pressable
              style={({ pressed }) => [styles.oauthButton, pressed && styles.oauthPressed]}
              onPress={() => {/* TODO: Google OAuth */ }}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.oauthLabel}>Continue with Google</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.oauthButton, styles.appleButton, pressed && styles.oauthPressed]}
              onPress={() => {/* TODO: Apple OAuth */ }}
            >
              <Text style={styles.appleIcon}></Text>
              <Text style={styles.appleLabel}>Continue with Apple</Text>
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerPill}>
              <Text style={styles.dividerText}>OR</Text>
            </View>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* Form Card */}
          <Animated.View entering={FadeInDown.springify().damping(18).delay(600)} style={styles.card}>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Input
                  icon="👤"
                  placeholder="Name"
                  value={form.name}
                  onChangeText={(v) => updateField('name', v)}
                  error={errors.name}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.nameField}>
                <Input
                  icon="👤"
                  placeholder="Surname"
                  value={form.surname}
                  onChangeText={(v) => updateField('surname', v)}
                  error={errors.surname}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Input
              icon="🏷️"
              placeholder="Username (4-10 chars)"
              value={form.username}
              onChangeText={(v) => updateField('username', v)}
              error={errors.username}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              icon="✉️"
              placeholder="Email address"
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              icon="🔒"
              placeholder="Password (min. 8 chars)"
              value={form.password}
              onChangeText={(v) => updateField('password', v)}
              error={errors.password}
              secureTextEntry
            />

            <Input
              icon="🔐"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChangeText={(v) => updateField('confirmPassword', v)}
              error={errors.confirmPassword}
              secureTextEntry
            />

            {apiError ? (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBanner}>
                <Text style={styles.errorEmoji}>😅</Text>
                <Text style={styles.errorText}>{apiError}</Text>
              </Animated.View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Let's Go! </Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Login Link */}
          <Animated.View entering={FadeInDown.duration(500).delay(700)} style={styles.footer}>
            <Text style={styles.footerText}>Already streaking? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={styles.loginLink}>Log In 🔥</Text>
              </Pressable>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#F0FFF4',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },

  // Background blobs
  blobTopLeft: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D4F5DC',
    opacity: 0.7,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E8DEFF',
    opacity: 0.5,
  },
  blobMidRight: {
    position: 'absolute',
    top: '40%',
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF3E0',
    opacity: 0.4,
  },

  // Mascot
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  mascotBubble: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#D4F5DC',
  },
  mascotEmoji: {
    fontSize: 36,
  },
  speechBubble: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  speechText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27AE60',
  },
  speechTail: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    backgroundColor: '#FFF',
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },

  // Title
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#2D2D3A',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: '#8B8BA0',
    marginTop: 6,
    fontWeight: '500',
  },

  // OAuth
  oauthContainer: {
    gap: 10,
    marginBottom: 20,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EDEDF5',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  oauthPressed: {
    transform: [{ scale: 0.97 }],
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EA4335',
  },
  oauthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3D3D4E',
  },
  appleButton: {
    backgroundColor: '#1A1A2E',
    borderColor: '#1A1A2E',
  },
  appleIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  appleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0EC',
  },
  dividerPill: {
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0EC',
  },
  dividerText: {
    color: '#A0A0B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nameField: {
    flex: 1,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  errorEmoji: {
    fontSize: 18,
  },
  errorText: {
    color: '#D63031',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Register button
  registerButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    shadowOpacity: 0.2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#8B8BA0',
    fontSize: 15,
    fontWeight: '500',
  },
  loginLink: {
    color: '#6C5CE7',
    fontSize: 15,
    fontWeight: '800',
  },
});
