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

import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail, validatePassword } from '@/utils/validation';

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleLogin = async () => {
    const newErrors: Record<string, string> = {};
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (emailErr) newErrors.email = emailErr;
    if (passErr) newErrors.password = passErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setApiError('');
    setLoading(true);

    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      const message =
        err.response?.data?.message ?? err.response?.data?.error ?? 'Login failed. Please try again.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background decorative blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

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
              <Text style={styles.mascotEmoji}>🔥</Text>
            </View>
            <Animated.View entering={FadeInUp.duration(500).delay(600)} style={styles.speechBubble}>
              <Text style={styles.speechText}>Welcome back!</Text>
              <View style={styles.speechTail} />
            </Animated.View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInUp.duration(600).delay(300)} style={styles.titleContainer}>
            <Text style={styles.appName}>Social Streak</Text>
            <Text style={styles.tagline}>Let's keep that streak going 💪</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View entering={FadeInDown.springify().damping(18).delay(400)} style={styles.card}>
            <Input
              //icon="✉️"
              placeholder="Email address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              //icon="🔒"
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              error={errors.password}
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
                styles.loginButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Log In ✨</Text>
              )}
            </Pressable>

            <Pressable style={styles.forgotButton}>
              <Text style={styles.forgotText}>Oops, forgot password?</Text>
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

          {/* OAuth Buttons */}
          <Animated.View entering={FadeInDown.springify().damping(18).delay(600)} style={styles.oauthContainer}>
            <Pressable
              style={({ pressed }) => [styles.oauthButton, pressed && styles.oauthPressed]}
              onPress={() => {/* TODO: Google OAuth */ }}
            >
              <Text style={styles.oauthIcon}>G</Text>
              <Text style={styles.oauthLabel}>Google</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.oauthButton, styles.appleButton, pressed && styles.oauthPressed]}
              onPress={() => {/* TODO: Apple OAuth */ }}
            >
              <Text style={styles.appleIcon}></Text>
              <Text style={styles.appleLabel}>Apple</Text>
            </Pressable>
          </Animated.View>

          {/* Register Link */}
          <Animated.View entering={FadeInDown.duration(500).delay(700)} style={styles.footer}>
            <Text style={styles.footerText}>New here? </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text style={styles.registerLink}>Create an account 🌱</Text>
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
    backgroundColor: '#F2F0FF',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 50,
  },

  // Background blobs
  blobTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E8DEFF',
    opacity: 0.6,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFE8EC',
    opacity: 0.5,
  },

  // Mascot
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  mascotBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#F0EDFF',
  },
  mascotEmoji: {
    fontSize: 38,
  },
  speechBubble: {
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
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
    color: '#6C5CE7',
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
    marginBottom: 28,
    marginTop: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2D2D3A',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: '#8B8BA0',
    marginTop: 6,
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0EDFF',
    marginBottom: 24,
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

  // Login button
  loginButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#6C5CE7',
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
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotText: {
    color: '#A0A0B8',
    fontSize: 13,
    fontWeight: '500',
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
    backgroundColor: '#E4E4F0',
  },
  dividerPill: {
    backgroundColor: '#F2F0FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4E4F0',
  },
  dividerText: {
    color: '#A0A0B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // OAuth
  oauthContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  oauthButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EDEDF5',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  oauthPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: '#FAFAFF',
  },
  oauthIcon: {
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
  registerLink: {
    color: '#6C5CE7',
    fontSize: 15,
    fontWeight: '800',
  },
});
