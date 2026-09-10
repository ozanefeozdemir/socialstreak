import { useState } from 'react';
import { StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';

import { authApi } from '@/api/endpoints/auth';
import { habitsApi } from '@/api/endpoints/habits';
import { checkInsApi } from '@/api/endpoints/checkins';
import { usersApi } from '@/api/endpoints/users';
import { friendsApi } from '@/api/endpoints/friends';
import { friendRequestsApi } from '@/api/endpoints/friendRequests';
import { saveToken } from '@/api/client';

export default function ApiTestScreen() {
  const [result, setResult] = useState<string>('Press a button to test an endpoint...');
  const [loading, setLoading] = useState(false);

  // Store these across tests so we can chain them
  const [createdHabitId, setCreatedHabitId] = useState<string | null>(null);

  const run = async (label: string, fn: () => Promise<any>) => {
    setLoading(true);
    setResult(`⏳ Running: ${label}...`);
    try {
      const data = await fn();
      const output = JSON.stringify(data, null, 2) ?? '✅ Success (no body)';
      setResult(`✅ ${label}\n\n${output}`);
      return data;
    } catch (err: any) {
      const msg = err.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : err.message;
      setResult(`❌ ${label}\n\nStatus: ${err.response?.status ?? 'N/A'}\n${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      section: '🔐 Auth',
      buttons: [
        {
          label: 'Register (test user)',
          fn: () =>
            run('POST /auth/register', () =>
              authApi.register({
                name: 'Test',
                surname: 'User',
                email: `test${Date.now()}@test.com`,
                password: 'test12345',
                username: `usr${Date.now().toString().slice(-6)}`,
                timezone: 'Europe/Istanbul',
              }),
            ),
        },
        {
          label: 'Login (test@socialstreak.dev)',
          fn: () =>
            run('POST /auth/login', () =>
              authApi.login({
                email: 'test@socialstreak.dev',
                password: 'test12345',
              }),
            ),
        },
      ],
    },
    {
      section: '📋 Habits',
      buttons: [
        {
          label: 'Get All Habits',
          fn: () => run('GET /habit', () => habitsApi.getAll()),
        },
        {
          label: 'Create Habit',
          fn: () =>
            run('POST /habit', async () => {
              const habit = await habitsApi.create({
                name: `Test Habit ${Date.now().toString().slice(-4)}`,
                frequencyType: 'DAILY',
              });
              setCreatedHabitId(habit.id);
              return habit;
            }),
        },
        {
          label: 'Archive Last Created',
          fn: () =>
            createdHabitId
              ? run('PATCH /habit/:id/archive', () => habitsApi.archive(createdHabitId))
              : run('No habit', async () => { throw new Error('Create a habit first'); }),
        },
        {
          label: 'Delete Last Created',
          fn: () =>
            createdHabitId
              ? run('DELETE /habit/:id', async () => {
                  await habitsApi.delete(createdHabitId);
                  setCreatedHabitId(null);
                  return 'Deleted';
                })
              : run('No habit', async () => { throw new Error('Create a habit first'); }),
        },
      ],
    },
    {
      section: '✅ Check-Ins',
      buttons: [
        {
          label: 'Check In (last habit)',
          fn: () =>
            createdHabitId
              ? run('POST /habit/:id/checkin', () => checkInsApi.checkIn(createdHabitId))
              : run('No habit', async () => { throw new Error('Create a habit first'); }),
        },
        {
          label: 'Get Check-Ins (last habit)',
          fn: () =>
            createdHabitId
              ? run('GET /habit/:id/checkin', () => checkInsApi.getAll(createdHabitId))
              : run('No habit', async () => { throw new Error('Create a habit first'); }),
        },
      ],
    },
    {
      section: '👤 Users',
      buttons: [
        {
          label: 'Get All Users',
          fn: () => run('GET /user', () => usersApi.getAll()),
        },
      ],
    },
    {
      section: '👥 Friends',
      buttons: [
        {
          label: 'Get My Friends',
          fn: () => run('GET /friendship', () => friendsApi.getAll()),
        },
        {
          label: 'Get Received Requests',
          fn: () => run('GET /friendreq/received', () => friendRequestsApi.getReceived()),
        },
        {
          label: 'Get Sent Requests',
          fn: () => run('GET /friendreq/sent', () => friendRequestsApi.getSent()),
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>🧪 API Test Playground</Text>
      <Text style={styles.subtitle}>Tap any button to test the endpoint</Text>

      {tests.map((section) => (
        <View key={section.section} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.section}</Text>
          <View style={styles.buttonRow}>
            {section.buttons.map((btn) => (
              <Pressable
                key={btn.label}
                style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
                onPress={btn.fn}
                disabled={loading}
              >
                <Text style={styles.btnText}>{btn.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.resultBox}>
        <Text style={styles.resultLabel}>
          Response {loading && <ActivityIndicator size="small" />}
        </Text>
        <ScrollView style={styles.resultScroll} nestedScrollEnabled>
          <Text style={styles.resultText}>{result}</Text>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#0a0a0a' },
  container: { padding: 16, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  section: { marginBottom: 16, backgroundColor: 'transparent' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#ccc', marginBottom: 8 },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: {
    backgroundColor: '#1e1e2e',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  btnPressed: { backgroundColor: '#2a2a40', borderColor: '#6c5ce7' },
  btnText: { color: '#a29bfe', fontSize: 13, fontWeight: '500' },
  resultBox: {
    marginTop: 20,
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222',
    maxHeight: 320,
  },
  resultLabel: { fontSize: 12, color: '#666', marginBottom: 8 },
  resultScroll: { maxHeight: 280 },
  resultText: { fontSize: 12, color: '#e0e0e0', fontFamily: 'SpaceMono' },
});
