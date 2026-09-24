// TypeScript interfaces matching backend DTOs

// ── Enums & Taxonomy ─────────────────────────────
export type FrequencyType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
export type HabitType = 'GENERAL' | 'WORKOUT' | 'RUNNING' | 'READING' | 'MEDITATION' | 'WATER' | 'CUSTOM';

export type HabitCategory =
  | 'FITNESS'
  | 'MINDFULNESS'
  | 'HEALTH'
  | 'PRODUCTIVITY'
  | 'LEARNING'
  | 'SLEEP'
  | 'CREATIVE'
  | 'FINANCE'
  | 'SOCIAL'
  | 'DISCIPLINE';

export type SessionArchetype =
  | 'WORKOUT'
  | 'CARDIO'
  | 'READING'
  | 'POMODORO'
  | 'BREATHWORK'
  | 'SKILL'
  | 'HYDRATION'
  | 'DISCIPLINE'
  | 'CHECKLIST';

export type TimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME';

export interface HabitConfig {
  category?: HabitCategory;
  subCategory?: string;
  sessionArchetype?: SessionArchetype;
  icon?: string;
  color?: string;
  targetValue?: number;
  targetUnit?: string;
  timeOfDay?: TimeOfDay;
  tagline?: string;
  benefits?: string[];
  quickTips?: string[];
  // Specific tracking state
  currentBook?: string;
  currentPage?: number;
  totalPages?: number;
  dailyGoalMl?: number;
  [key: string]: any;
}

export interface HabitCatalogPreset {
  id: string;
  name: string;
  category: HabitCategory;
  subCategory: string;
  habitType: HabitType;
  sessionArchetype: SessionArchetype;
  icon: string;
  color: string;
  targetValue: number;
  targetUnit: string;
  timeOfDay: TimeOfDay;
  frequencyType: FrequencyType;
  tagline: string;
  benefits: string[];
  quickTips: string[];
  searchKeywords: string[];
}

// ── Auth ──────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  surname: string;
  email: string;
  password: string;
  username: string;
  timezone: string;
}

export interface AuthRespond {
  token: string;
  refreshToken: string;
  user: UserRespond;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ── User ──────────────────────────────────────────
export interface UserRespond {
  id: string;
  email: string;
  username: string;
  name: string;
  surname: string;
  timezone: string;
}

export interface PublicUserRespond {
  id: string;
  username: string;
  name: string;
  surname: string;
  timezone: string;
}

export interface UserSearchDto {
  id: string;
  username: string;
  name: string;
  surname: string;
  mutualFriendsCount: number;
}

export interface UpdateUserRequest {
  email: string;
  username: string;
  timezone: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ── Habit ─────────────────────────────────────────
export interface HabitRequest {
  name: string;
  frequencyType: FrequencyType;
  habitType?: HabitType;
  config?: HabitConfig;
  isPublic?: boolean;
}

export interface HabitRespond {
  id: string;
  name: string;
  frequencyType: FrequencyType;
  habitType: HabitType;
  config?: HabitConfig;
  archived: boolean;
  isPublic: boolean;
  createdAt: string; // ISO 8601 Instant
}

// ── Habit Session ─────────────────────────────────
export interface HabitSessionRequest {
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  sessionData?: Record<string, any>;
  notes?: string;
}

export interface HabitSessionRespond {
  id: string;
  habitId: string;
  checkInId?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  sessionData?: Record<string, any>;
  notes?: string;
  createdAt: string; // ISO 8601 Instant
}

// ── CheckIn ───────────────────────────────────────
export interface CheckInRespond {
  id: string;
  habitId: string;
  checkInDate: string; // YYYY-MM-DD
}

// ── Friendship ────────────────────────────────────
export interface FriendshipRespond {
  id: string;
  friend: PublicUserRespond;
  createdAt: string; // ISO 8601 Instant
}

// ── Friend Request ────────────────────────────────
export interface FriendRequestRespond {
  id: string;
  sender: PublicUserRespond;
  receiver: PublicUserRespond;
  createdAt: string; // ISO 8601 Instant
}

// ── Feed ──────────────────────────────────────────
export interface FeedItemRespond {
  id: string;
  checkInDate: string; // YYYY-MM-DD
  createdAt: string;   // ISO 8601 Instant
  user: PublicUserRespond;
  habit: HabitRespond;
  streak: number;
  session?: HabitSessionRespond;
}

// ── Error ─────────────────────────────────────────
export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fieldErrors?: Record<string, string>;
}
