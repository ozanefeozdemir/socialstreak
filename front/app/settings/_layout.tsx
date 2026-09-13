import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function SettingsLayout() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: 'bold' },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.background },
      headerLeft: () => (
        <Animated.View entering={FadeInUp.duration(400)}>
          <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingRight: 16, gap: 4 }}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Back</Text>
          </Pressable>
        </Animated.View>
      ),
    }} />
  );
}
