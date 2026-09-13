import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Notifications' }} />

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Push Notifications</Text>
          <Switch 
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>Email Notifications</Text>
          <Switch 
            value={emailEnabled}
            onValueChange={setEmailEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>
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
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  }
});
