import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncMethod = 'POST' | 'PUT' | 'DELETE';

export interface SyncRequest {
  id: string;
  url: string;
  method: SyncMethod;
  payload?: any;
  timestamp: number;
}

interface SyncStore {
  queue: SyncRequest[];
  addToQueue: (request: Omit<SyncRequest, 'id' | 'timestamp'>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set) => ({
      queue: [],

      addToQueue: (request) => {
        set((state) => ({
          queue: [
            ...state.queue,
            {
              ...request,
              id: Math.random().toString(36).substring(2, 15),
              timestamp: Date.now(),
            },
          ],
        }));
      },

      removeFromQueue: (id) => {
        set((state) => ({
          queue: state.queue.filter((req) => req.id !== id),
        }));
      },

      clearQueue: () => {
        set({ queue: [] });
      },
    }),
    {
      name: 'socialstreak-sync-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
