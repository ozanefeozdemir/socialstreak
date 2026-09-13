import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';

export default function TermsScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Terms of Service' }} />
      <Text style={[styles.heading, { color: colors.text }]}>Terms of Service</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Welcome to SocialStreak. By using our app, you agree to these terms.
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        1. You must be at least 13 years old to use this app.
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        2. You are responsible for any activity that occurs under your account.
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        3. You may not use the app for any illegal or unauthorized purpose.
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Please read these terms carefully. They outline your rights and responsibilities.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
});
