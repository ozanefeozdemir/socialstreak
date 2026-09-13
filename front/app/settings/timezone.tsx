import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from '@/components/ui/Input';
import { Ionicons } from '@expo/vector-icons';

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Istanbul',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

export default function TimezoneScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredTimezones = TIMEZONES.filter(tz => 
    tz.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Timezone' }} />

      <View style={styles.searchContainer}>
        <Input 
          label=""
          placeholder="Search timezones..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList 
        data={filteredTimezones}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable 
            style={({ pressed }) => [
              styles.timezoneItem, 
              { borderBottomColor: colors.border },
              pressed && { backgroundColor: colors.border }
            ]}
            onPress={() => {
              // Mock selecting timezone
              router.back();
            }}
          >
            <Text style={[styles.timezoneText, { color: colors.text }]}>{item}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  timezoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  timezoneText: {
    fontSize: 16,
  }
});
