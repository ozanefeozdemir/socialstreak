import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';

export default function PrivacyScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <Text style={[styles.heading, { color: colors.text }]}>Privacy Policy</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Your privacy is important to us. It is SocialStreak's policy to respect your privacy regarding any information we may collect from you across our application.
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        We don't share any personally identifying information publicly or with third-parties, except when required to by law.
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
