// TODO: Implement StreakCounter component
// Animated streak display (🔥 number)

import { View, Text, StyleSheet } from 'react-native';

interface StreakCounterProps {
  count: number;
}

export function StreakCounter({ count }: StreakCounterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🔥 {count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
