import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import { useSessionStore } from '@/store/useSessionStore';
import { useSyncStore } from '@/store/useSyncStore';
import apiClient from '@/api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function SyncManager() {
  const syncQueue = useSyncStore((state) => state.queue);
  const removeFromQueue = useSyncStore((state) => state.removeFromQueue);
  const isProcessingRef = useRef(false);

  // ── 1. Offline Sync Queue Processing ──
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && syncQueue.length > 0 && !isProcessingRef.current) {
        processQueue();
      }
    });

    return () => unsubscribe();
  }, [syncQueue]);

  const processQueue = async () => {
    isProcessingRef.current = true;
    for (const req of syncQueue) {
      try {
        await apiClient.request({
          url: req.url,
          method: req.method,
          data: req.payload,
        });
        removeFromQueue(req.id);
      } catch (error) {
        console.warn(`Failed to sync offline request ${req.id}:`, error);
        // We could implement retry logic here based on status code
      }
    }
    isProcessingRef.current = false;
  };

  // ── 2. Background Notifications ──
  useEffect(() => {
    // Request permissions
    const requestPermissions = async () => {
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permissions not granted');
        }
      }
    };
    requestPermissions();

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'background') {
        // App went to background
        const sessionsMap = useSessionStore.getState().sessions;
        const activeSessionsCount = Object.values(sessionsMap).filter(s => s.isRunning).length;

        if (activeSessionsCount > 0) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Session is running',
              body: `You have ${activeSessionsCount} active session${activeSessionsCount > 1 ? 's' : ''} tracking your progress.`,
            },
            trigger: null, // trigger immediately
          });
        }
      } else if (nextAppState === 'active') {
        // App came to foreground
        await Notifications.dismissAllNotificationsAsync();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
