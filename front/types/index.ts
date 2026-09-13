// TypeScript interfaces matching backend DTOs

// ── Enums ─────────────────────────────────────────
export type FrequencyType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

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
  username: string;
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
}

export interface HabitRespond {
  id: string;
  name: string;
  frequencyType: FrequencyType;
  archived: boolean;
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
  friend: UserRespond;
  createdAt: string; // ISO 8601 Instant
}

// ── Friend Request ────────────────────────────────
export interface FriendRequestRespond {
  id: string;
  sender: UserRespond;
  receiver: UserRespond;
  createdAt: string; // ISO 8601 Instant
}

// ── Feed ──────────────────────────────────────────
export interface FeedItemRespond {
  id: string;
  checkInDate: string; // YYYY-MM-DD
  createdAt: string;   // ISO 8601 Instant
  user: UserRespond;
  habit: HabitRespond;
  streak: number;
}

// ── Error ─────────────────────────────────────────
export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fieldErrors?: Record<string, string>;
}
