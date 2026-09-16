import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HabitRespond } from '@/types';

export interface SessionState {
  habit: HabitRespond;
  startTime: number | null;
  accumulatedTime: number; // in seconds
  isRunning: boolean;
  sessionData: Record<string, any>;
  notes: string;
}

interface SessionStore {
  sessions: Record<string, SessionState>;
  startSession: (habit: HabitRespond) => void;
  pauseSession: (habitId: string) => void;
  resumeSession: (habitId: string) => void;
  updateSessionData: (habitId: string, data: Partial<SessionState>) => void;
  finishSession: (habitId: string) => void;
  getSession: (habitId: string) => SessionState | undefined;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessions: {},

      startSession: (habit) => {
        set((state) => ({
          sessions: {
            ...state.sessions,
            [habit.id]: {
              habit,
              startTime: Date.now(),
              accumulatedTime: 0,
              isRunning: true,
              sessionData: {},
              notes: '',
            },
          },
        }));
      },

      pauseSession: (habitId) => {
        set((state) => {
          const session = state.sessions[habitId];
          if (!session || !session.isRunning) return state;

          const now = Date.now();
          const elapsed = session.startTime ? Math.floor((now - session.startTime) / 1000) : 0;

          return {
            sessions: {
              ...state.sessions,
              [habitId]: {
                ...session,
                isRunning: false,
                accumulatedTime: session.accumulatedTime + elapsed,
                startTime: null,
              },
            },
          };
        });
      },

      resumeSession: (habitId) => {
        set((state) => {
          const session = state.sessions[habitId];
          if (!session || session.isRunning) return state;

          return {
            sessions: {
              ...state.sessions,
              [habitId]: {
                ...session,
                isRunning: true,
                startTime: Date.now(),
              },
            },
          };
        });
      },

      updateSessionData: (habitId, data) => {
        set((state) => {
          const session = state.sessions[habitId];
          if (!session) return state;

          return {
            sessions: {
              ...state.sessions,
              [habitId]: {
                ...session,
                ...data,
              },
            },
          };
        });
      },

      finishSession: (habitId) => {
        set((state) => {
          const newSessions = { ...state.sessions };
          delete newSessions[habitId];
          return { sessions: newSessions };
        });
      },

      getSession: (habitId) => {
        return get().sessions[habitId];
      },
    }),
    {
      name: 'socialstreak-sessions',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
