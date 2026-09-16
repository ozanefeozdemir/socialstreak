# Social Streak — Project Context

> A mobile app where users share daily habits with friends and maintain streaks.

## Architecture Overview

```
SocialStreak/
├── back/   → Spring Boot 4.1.0 (Java 21) REST API
└── front/  → Expo SDK 57 + React Native (expo-router, TypeScript)
```

## Backend Stack

| Component         | Technology                          |
|-------------------|-------------------------------------|
| Framework         | Spring Boot 4.1.0 (Java 21)        |
| Database          | PostgreSQL 16 (Alpine)             |
| Cache             | Redis 7 (Alpine)                   |
| Search Engine     | Elasticsearch 9.4.2 (Alpine)        |
| Message Broker    | RabbitMQ 3 (Alpine, Management)    |
| Rate Limiting     | Bucket4j 8.10.1                     |
| Auth              | JWT (jjwt 0.12.6) + Spring Security|
| ORM               | Spring Data JPA / Hibernate        |
| Mapping           | MapStruct 1.6.3                    |
| Validation        | Jakarta Validation                 |
| Build             | Gradle Kotlin DSL                  |
| API Docs          | SpringDoc OpenAPI (Swagger UI)     |
| Password Hashing  | BCrypt                             |

## Infrastructure (Docker Compose)

```yaml
# back/src/docker-compose.yaml (project: socialstreak)
postgres:       localhost:5432  (db: socialstreak, user: dev, pass: dev) [Volume: src_pgdata]
redis:          localhost:6379
rabbitmq:       localhost:5672, management: 15672 (user: dev, pass: dev)
elasticsearch:  localhost:9200, 9300 (ES 9.4.2, single-node, security disabled)
```

Spring Boot runs on **localhost:8080** (default).

---

## Data Models (Entities)

### User (`users`)
| Field        | Type      | Constraints                 |
|--------------|-----------|-----------------------------|
| id           | UUID      | PK, auto-generated         |
| email        | String    | unique, not null            |
| username     | String    | unique, not null            |
| passwordHash | String    | not null                    |
| name         | String    | not null                    |
| surname      | String    | not null                    |
| timezone     | String    | nullable                    |
| createdAt    | Instant   | auto (CreationTimestamp)    |
| privacySearchable | Boolean | default true, not null (Discovery toggle) |

### UserDocument (Elasticsearch: `users` index)
| Field | Elasticsearch Type | Constraints / Purpose |
|---|---|---|
| id | Keyword | User UUID |
| username | Search_As_You_Type | Prefix / Edge N-Gram matching for live search |
| fullName | Text (analyzer: standard) | Combined name + surname with Fuzzy typo-tolerance |
| mutualFriendsCount | Integer | Dynamic relevance score boost multiplier |
| privacySearchable | Boolean | Boolean filter to exclude private profiles |

### Habit (`habits`)
| Field         | Type          | Constraints                 |
|---------------|---------------|-----------------------------|
| id            | UUID          | PK, auto-generated         |
| name          | String        | not null                    |
| user          | User (FK)     | many-to-one, not null       |
| frequencyType | FrequencyType | DAILY/WEEKLY/MONTHLY/CUSTOM |
| habitType     | HabitType     | GENERAL/WORKOUT/RUNNING/READING/MEDITATION/WATER/CUSTOM (default GENERAL) |
| config        | Map<String, Object> | JSONB, nullable (stateful config like book/page) |
| archived      | boolean             | default false               |
| createdAt     | Instant             | auto                        |

### CheckIn (`check_ins`)
| Field       | Type      | Constraints                              |
|-------------|-----------|------------------------------------------|
| id          | UUID      | PK, auto-generated                      |
| habit       | Habit (FK)| many-to-one, not null                    |
| checkInDate | LocalDate | not null, unique per (habit_id, date)    |
| createdAt   | Instant   | auto                                     |

### HabitSession (`habit_sessions`)
| Field          | Type                | Constraints                          |
|----------------|---------------------|--------------------------------------|
| id             | UUID                | PK, auto-generated                  |
| habit          | Habit (FK)          | many-to-one, not null                |
| checkIn        | CheckIn(FK)         | many-to-one, nullable (auto-linked)  |
| startedAt      | Instant             | nullable                             |
| endedAt        | Instant             | nullable                             |
| durationSeconds| Integer             | nullable                             |
| sessionData    | Map<String, Object> | JSONB, nullable (habit-specific payload) |
| notes          | String     | max length 500, nullable             |
| createdAt      | Instant    | auto (CreationTimestamp)             |
> Represents individual active activity sessions. Multiple sessions can occur in a single day, while automatically anchoring today's `CheckIn` streak.

### Friendship (`friendships`)
| Field     | Type      | Constraints                         |
|-----------|-----------|-------------------------------------|
| id        | UUID      | PK, auto-generated                 |
| user      | User (FK) | many-to-one                        |
| friend    | User (FK) | many-to-one                        |
| createdAt | Instant   | auto                               |
> Double-entry pattern: accepting a request creates TWO rows (A→B and B→A). Unique constraint on (user_id, friend_id).

### FriendRequest (`friend_requests`)
| Field    | Type      | Constraints                          |
|----------|-----------|--------------------------------------|
| id       | UUID      | PK, auto-generated                  |
| sender   | User (FK) | many-to-one                         |
| receiver | User (FK) | many-to-one                         |
| createdAt| Instant   | auto                                 |
> Unique constraint on (sender_id, receiver_id). Cross-check prevents both A→B and B→A from existing simultaneously.

### RefreshToken (`refresh_tokens`)
| Field     | Type      | Constraints                          |
|-----------|-----------|--------------------------------------|
| id        | UUID      | PK, auto-generated                  |
| token     | String    | unique, not null, indexed (len: 1024)|
| user      | User (FK) | many-to-one, not null               |
| expiresAt | Instant   | not null                             |
| createdAt | Instant   | auto (CreationTimestamp)             |
> Used for 30-day persistent session management, server-side revocation, and single-use rotation.

### FrequencyType (Enum)
```
DAILY | WEEKLY | MONTHLY | CUSTOM
```

### HabitType (Enum)
```
GENERAL | WORKOUT | RUNNING | READING | MEDITATION | WATER | CUSTOM
```

---

## Authentication

- **Method**: JWT Access Token + Database-backed Refresh Token
- **Token Location**: `Authorization: Bearer <token>` header
- **JWT Subject**: user's email
- **Access Token Expiration**: 900,000 ms (15 minutes)
- **Refresh Token Expiration**: 2,592,000,000 ms (30 days)
- **Signing**: HMAC-SHA with `jwt.secret` (access) and `jwt.refresh-secret` (refresh) loaded via `spring-dotenv` / environment
- **User Identity**: `UserPrincipal` wraps `User` entity, implements `UserDetails`
- **Lookup**: `CustomUserDetailsService` loads by email
- **Public Endpoints**: `/api/auth/**` (login, register, refresh, logout)
- **Filter Bypass**: `JwtAuthFilter` bypasses `/api/auth/**` so expired access tokens do not block refresh or logout
- **Silent Auto-Renewal**: Axios response interceptor in `client.ts` queues concurrent requests on 401, calls `/api/auth/refresh`, updates `SecureStore` (mobile) / `localStorage` (web), and replays requests transparently
- **Protected**: All other `/api/**` endpoints require valid JWT
- **Method Security**: `@PreAuthorize` on user-specific endpoints verifies `#id == principal.id`

> **Note**: SecurityConfig currently has `requestMatchers("/**").permitAll()` — JWT filter still authenticates when a token is present but technically all routes are open. This is likely a development convenience.

---

## API Endpoints

### Auth — `/api/auth` (PUBLIC)

| Method | Path                 | Request Body                                              | Response (200/201/204)                  | Notes                                    |
|--------|----------------------|-----------------------------------------------------------|-----------------------------------------|------------------------------------------|
| POST   | `/api/auth/login`    | `{ email, password }`                                     | `{ token, refreshToken, username }`     | 200 OK                                   |
| POST   | `/api/auth/register` | `{ name, surname, email, password, username, timezone }`  | `{ token, refreshToken, username }`     | 201 Created                              |
| POST   | `/api/auth/refresh`  | `{ refreshToken }`                                        | `{ token, refreshToken, username }`     | 200 OK (Rotates token & returns new pair)|
| POST   | `/api/auth/logout`   | `{ refreshToken }`                                        | 204 No Content                          | Revokes refresh token in database        |

**Validation**:
- `email`: @NotBlank @Email
- `password`: @NotBlank, @Size(min=8) for register
- `username`: @NotBlank @Size(min=4, max=10) for register
- `name`, `surname`, `timezone`: @NotBlank for register
- `refreshToken`: @NotBlank for refresh

---

### Habits — `/api/habit` (AUTHENTICATED)

| Method | Path                       | Request Body                    | Response                          | Notes        |
|--------|----------------------------|---------------------------------|-----------------------------------|--------------|
| GET    | `/api/habit`               | —                               | `HabitRespond[]`                  | User's habits|
| GET    | `/api/habit/{id}`          | —                               | `HabitRespond`                    | Ownership verified |
| POST   | `/api/habit`               | `{ name, frequencyType }`       | `HabitRespond`                    | 201 Created  |
| PUT    | `/api/habit/{id}`          | `{ name, frequencyType }`       | `HabitRespond`                    |              |
| PATCH  | `/api/habit/{id}/archive`  | —                               | `HabitRespond`                    |              |
| PATCH  | `/api/habit/{id}/unarchive`| —                               | `HabitRespond`                    |              |
| DELETE | `/api/habit/{id}`          | —                               | 204 No Content                    |              |

**HabitRespond**: `{ id, name, frequencyType, habitType, config, archived, createdAt }`
**HabitRequest**: `{ name (NotBlank), frequencyType (NotNull: DAILY|WEEKLY|MONTHLY|CUSTOM), habitType?, config? }`

---

### Habit Sessions — `/api/habit/{habitId}/session` (AUTHENTICATED)

| Method | Path                                      | Request Body                                              | Response                 | Notes                  |
|--------|-------------------------------------------|-----------------------------------------------------------|--------------------------|------------------------|
| POST   | `/api/habit/{habitId}/session`            | `{ startedAt, endedAt, durationSeconds, sessionData, notes }` | `HabitSessionRespond` | 201 Created. Auto-links or creates today's check-in |
| GET    | `/api/habit/{habitId}/session`            | —                                                         | `HabitSessionRespond[]`  | Ordered by date DESC   |
| DELETE | `/api/habit/{habitId}/session/{sessionId}`| —                                                         | 204 No Content           |                        |

**HabitSessionRespond**: `{ id, habitId, checkInId, startedAt, endedAt, durationSeconds, sessionData, notes, createdAt }`
**HabitSessionRequest**: `{ startedAt?, endedAt?, durationSeconds?, sessionData?, notes? }`

---

### Check-Ins — `/api/habit/{habitId}/checkin` (AUTHENTICATED)

| Method | Path                                      | Response                 | Notes                  |
|--------|--------------------------------------------|--------------------------|------------------------|
| POST   | `/api/habit/{habitId}/checkin`              | `CheckInRespond`         | Today's date auto-set from user timezone |
| GET    | `/api/habit/{habitId}/checkin`              | `CheckInRespond[]`       | Ordered by date DESC   |
| DELETE | `/api/habit/{habitId}/checkin/{checkInId}`  | 204 No Content           |                        |

**CheckInRespond**: `{ id, habitId, checkInDate }`
> One check-in per habit per day. Duplicates throw `DuplicateCheckInException` (409 Conflict).

---

### Friends — `/api/friendship` (AUTHENTICATED)

| Method | Path                         | Response                 | Notes            |
|--------|-------------------------------|--------------------------|------------------|
| GET    | `/api/friendship`             | `FriendshipRespond[]`    | Current user's friends |
| DELETE | `/api/friendship/{friendId}`  | 204 No Content           | Removes both directions |

**FriendshipRespond**: `{ id, friend: UserRespond, createdAt }`

---

### Friend Requests — `/api/friendreq` (AUTHENTICATED)

| Method | Path                           | Response                  | Notes               |
|--------|--------------------------------|---------------------------|----------------------|
| GET    | `/api/friendreq/sent`          | `FriendRequestRespond[]`  | Requests I sent      |
| GET    | `/api/friendreq/received`      | `FriendRequestRespond[]`  | Requests I received  |
| POST   | `/api/friendreq/send/{friendId}`| `FriendRequestRespond`   | 201 Created          |
| POST   | `/api/friendreq/accept/{reqId}`| 204 No Content            | Only receiver can accept |
| DELETE | `/api/friendreq/{reqId}`       | 204 No Content            | Sender cancels or receiver rejects |

**FriendRequestRespond**: `{ id, sender: UserRespond, receiver: UserRespond, createdAt }`

---

### Feed — `/api/feed` (AUTHENTICATED)

| Method | Path         | Response             | Notes                             |
|--------|--------------|----------------------|-----------------------------------|
| GET    | `/api/feed`  | `FeedItemRespond[]`  | Chronological check-ins of friends|

**FeedItemRespond**: `{ id, checkInDate, createdAt, user: UserRespond, habit: HabitRespond, streak: number, session?: HabitSessionRespond }`

---

### Users — `/api/user` (AUTHENTICATED)

| Method | Path                     | Request Body                         | Response            | Notes                   |
|--------|--------------------------|--------------------------------------|---------------------|-------------------------|
| GET    | `/api/user`              | —                                    | `PublicUserRespond[]` | All users (public safe projection) |
| GET    | `/api/user/me`           | —                                    | `UserRespond`       | Authenticated user's profile |
| GET    | `/api/user/{id}`         | —                                    | `UserRespond`       | PreAuthorize: own ID only |
| GET    | `/api/user/search`       | `?q={query}&page={0}&size={20}`      | `UserSearchDto[]`   | Elasticsearch fuzzy + prefix search, mutual friend boost, Bucket4j rate-limited (20 req/min, returns 429) |
| PUT    | `/api/user/{id}`         | `{ email, username, timezone, privacySearchable }` | 204 No Content | PreAuthorize: own ID only (triggers async RabbitMQ index sync) |
| PATCH  | `/api/user/{id}/password`| `{ currentPassword, newPassword }`   | 200 OK              | PreAuthorize: own ID only |
| DELETE | `/api/user/{id}`         | —                                    | 204 No Content      | PreAuthorize: own ID only |

**UserRespond**: `{ id, email, username, name, surname, timezone, privacySearchable }`
**PublicUserRespond**: `{ id, username, name, surname }`
**UserSearchDto**: `{ id, username, name, surname, mutualFriendsCount }`

---

## Error Response Format

All errors follow a consistent structure:
```json
{
  "timestamp": "2026-09-09T19:00:00Z",
  "status": 400,
  "error": "Validation Failed",
  "message": "One or more fields are invalid",
  "fieldErrors": { "email": "must not be blank" }
}
```

| Status | When                                  |
|--------|---------------------------------------|
| 400    | Validation, malformed JSON, type mismatch, missing params |
| 401    | Bad credentials, expired/invalid JWT  |
| 403    | Unauthorized action, access denied    |
| 404    | Resource not found, user not found    |
| 405    | HTTP method not supported             |
| 409    | User already exists, duplicate check-in |
| 500    | Unhandled server error                |

---

## Frontend Stack

| Component     | Technology                     |
|---------------|--------------------------------|
| Framework     | Expo SDK 57 (React Native)     |
| Router        | expo-router (file-based)       |
| Language      | TypeScript 6.x                 |
| HTTP Client   | Axios                          |
| State/Cache   | TanStack React Query 5 + Zustand|
| Storage       | expo-secure-store (JWT) + AsyncStorage |
| Animations    | react-native-reanimated 4.5    |
| Date Utils    | date-fns 4                     |
| Navigation    | Stack + Tabs (expo-router)     |

### Current Frontend Structure
```
front/
├── app/
│   ├── _layout.tsx          → Root layout (Stack, ThemeProvider)
│   ├── +not-found.tsx       → 404 page
│   ├── +html.tsx            → Web HTML wrapper
│   ├── modal.tsx            → Modal screen
│   └── (tabs)/
│       ├── _layout.tsx      → Tab navigator layout
│       ├── index.tsx        → Tab One (placeholder)
│       └── two.tsx          → Tab Two (placeholder)
├── components/              → Themed components, EditScreenInfo, etc.
├── constants/Colors.ts      → Color scheme
├── assets/                  → Fonts, images
├── app.json                 → Expo config
└── package.json
```

### API Connection Setup
```
front/
├── api/
│   ├── client.ts            → Axios instance (baseURL, JWT interceptor)
│   └── endpoints/
│       ├── auth.ts          → login, register
│       ├── habits.ts        → CRUD + archive/unarchive
│       ├── sessions.ts      → create, getAll, delete (HabitSession)
│       ├── checkins.ts      → checkIn, list, delete
│       ├── friends.ts       → list, delete
│       ├── friendRequests.ts→ sent, received, send, accept, delete
│       ├── users.ts         → get, update, changePassword, delete
│       └── feed.ts          → getFeed (friend activity feed)
├── types/
│   └── index.ts             → TypeScript interfaces matching backend DTOs
└── hooks/
    ├── useAuth.ts           → Auth context/state management
    └── useSessions.ts       → HabitSession query & mutation hooks
```

### Key Development Notes

1. **Backend runs on port 8080** — Frontend Axios base URL should be `http://localhost:8080/api` for development
2. **For physical device testing**, replace `localhost` with your machine's local IP
3. **JWT & User Profile stored in expo-secure-store (web: localStorage)** — retrieved on app launch, current user profile accessible via `useAuth().user`
4. **All IDs are UUIDs** — use `string` type in TypeScript
5. **Dates**: `createdAt` fields are ISO 8601 Instant strings, `checkInDate` is `YYYY-MM-DD` (LocalDate)
6. **Timezone-aware check-ins**: Backend uses user's timezone to determine "today"
7. **Swagger UI** available at `http://localhost:8080/swagger-ui.html` when backend is running

### Rules
- Read Expo v57 docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code
- Use `expo-secure-store` for JWT token persistence
- Use `@tanstack/react-query` for server state management
- Use `axios` for HTTP requests with a centralized client

---

## Design Direction

**Aesthetic**: Minimalist, clean, and playful. The app should feel like a game — cute vibes, micro-animations, and rewarding interactions. Think Duolingo's playfulness meets Apple's minimalism.

**Primary Platform**: iOS-first (tentative), built with Expo for cross-platform support.

**Auth UX**: Separate auth stack. Login/Register are full screens. Once authenticated, the token persists indefinitely (like Instagram). Users stay logged in forever on the same device.

---

## Navigation Architecture (5 Tabs)

| Tab | Route File | Description |
|-----|-----------|-------------|
| 1. Feed | `(tabs)/feed.tsx` | Social feed of friends' check-in activity |
| 2. Discover | `(tabs)/discover.tsx` | Segmented switcher: Find Friends (search users) & Requests (received/sent) |
| 3. **Habits** (center) | `(tabs)/index.tsx` | User's habit list + "New Habit" button — the hero tab |
| 4. Profile | `(tabs)/profile.tsx` | User stats, Day Streak modal (highest streak per habit) & Friends modal |
| 5. Settings | `(tabs)/settings.tsx` | Account management, logout |

**Routing Groups**:
- `(auth)/` — Login, Register (no tab bar)
- `(tabs)/` — Main app (tab bar visible)
- `habit/` — Habit detail `[id].tsx`, create `create.tsx` (stack screens)

---

## Discover & Friends System

### Discover Page Layout (Segmented Switcher)
The Discover screen uses a top segmented pill switcher with two primary views:

1. **Find Friends Tab**:
   - Live search bar filtering by `@username` or name (`GET /api/user`).
   - Dynamic user search result items reflecting relationship state:
     - **Not Connected**: "+ Add Friend" button (`POST /api/friendreq/send/{id}`).
     - **Request Sent**: "Requested" indicator with cancel option (`DELETE /api/friendreq/{reqId}`).
     - **Request Received**: "Accept" / "Decline" quick actions.
     - **Already Friends**: "Friends ✓" badge.
     - **Self**: Hidden from search results.
   - Clean empty state when no query is typed (future home for trending habits/recommendations).

2. **Requests Tab**:
   - Badge counter on tab indicating pending received requests (e.g. `Requests (2)`).
   - **Received Requests Section**: Incoming invites with user avatar, name, and action buttons (`Accept` / `Decline`).
   - **Sent Requests Section**: Outgoing pending requests with `Cancel` button.

---

## Profile Screen & Interactive Modals

`profile.tsx` displays user header (avatar, full name, `@username`, timezone), 4-card live statistics grid, account details, and quick settings:

1. **4-Card Stats Grid**:
   - **Day Streak** (🔥): Shows the user's best streak record across all habits. Interactive -> opens **Habit Streaks Modal**.
   - **Check-ins** (✓): Shows total lifetime check-ins across all habits.
   - **Habits** (🏆): Shows active habits count.
   - **Friends** (👥): Shows friends count. Interactive -> opens **Friends Modal**.

2. **Habit Streaks Modal**:
   - Opened by tapping the **Day Streak** card.
   - Lists all habits with their **all-time highest streak** (`🔥 Best: X days`), **current streak** (`⚡ Current: Y days`), frequency pill badge, and total check-ins count.
   - Real-time client-side search bar filtering habits by name (`useMemo`).
   - Sorted automatically by highest streak descending.
   - Tapping any habit card navigates directly to `/habit/[id]`.
   - "New" button to easily create new habits.

3. **Friends Modal**:
   - Opened by tapping the **Friends** card.
   - Full list of current friends (`GET /api/friendship`) with search filtering and friend removal action (`DELETE /api/friendship/{friendId}`).
   - Quick navigation to Discover screen.

4. **Account Details & Settings**:
   - Account info card (Email, Username, Timezone).
   - Quick action shortcuts (View Habit Streaks, Manage Friends, Log Out with confirmation).


---

## Habit Types System

Each habit has a `habitType` determining which fields and session behaviors are used. The backend implements this via `HabitType` enum + `config` JSONB column on `habits`, and polymorphic `sessionData` JSONB on `habit_sessions`.

| Type | Enum Value | Session Data / Config |
|------|-----------|------------------------|
| 📚 Reading | `READING` | `bookTitle`, `currentPage`, `startPage`, `endPage`, `pagesRead`, `totalPages` |
| 🏃 Running | `RUNNING` | `distanceKm`, `durationSeconds`, `avgPace`, `notes` |
| 💪 Workout | `WORKOUT` | `bodyParts` (Chest, Shoulders, Arms, etc.), `durationSeconds`, `notes` |
| 🧘 Meditation | `MEDITATION` | `durationSeconds`, `style`, `postMood` |
| 💧 Water | `WATER` | `glasses`, `dailyGoal` |
| ✨ General / Custom | `GENERAL` / `CUSTOM` | Flexible metric + value pairs |

> **Implementation**: `HabitType` enum and `config` JSONB on `habits` table; `HabitSession` entity with `session_data` JSONB on `habit_sessions` table. Creating a session automatically anchors or advances today's `CheckIn` calendar streak, and enriches friends' social feed cards with rich session metrics.

---

## Social Feed

When a user checks in a habit, it automatically appears in their friends' Feed tab. Feed items show:
- Friend's avatar + username + full name
- Habit name + frequency tag + completion icon
- Calculated streak count (🔥 X day streak)
- Relative timestamp (*Just now*, *2h ago*, *Yesterday*)
- Interactive **Cheer 🔥** reaction button with spring bounce animation
- Top **Activity Summary Banner** (friends checked in today count & daily squad motivation)

**API**: `GET /api/feed` returning `FeedItemRespond[]`. Automatically invalidates cache when checking in.

---

## Future Work (Deferred)

- Most common & trending habits list in Discover tab (habit suggestions/templates)
- Push notifications (daily reminders, friend activity, live session status in native notification bar)
- Pagination on user list, feed, check-in history
- Profile picture upload
- Streak leaderboard among friends

---

## Target File Architecture

```
front/
├── app/
│   ├── _layout.tsx               → Root layout (auth gate, providers)
│   ├── (auth)/
│   │   ├── _layout.tsx           → Auth stack layout (no tabs)
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx           → 5-tab navigator
│   │   ├── feed.tsx              → Friends' activity feed
│   │   ├── discover.tsx          → Search/add friends & manage requests (Segmented)
│   │   ├── index.tsx             → Habits list (center tab)
│   │   ├── profile.tsx           → User profile & stats (with Habit Streaks & Friend list modals)
│   │   └── settings.tsx          → Account settings (Dark mode toggle, Email verification)
│   ├── habit/
│   │   ├── [id].tsx              → Habit detail + history
│   │   └── create.tsx            → Create new habit
│   └── settings/
│       ├── _layout.tsx           → Settings stack layout with animated back button
│       ├── edit-profile.tsx      → Edit profile information
│       ├── change-password.tsx   → Change user password
│       ├── notifications.tsx     → Notification preferences
│       ├── timezone.tsx          → Searchable timezone selector
│       ├── terms.tsx             → Terms of service
│       └── privacy.tsx           → Privacy policy
├── api/                          → HTTP layer (DONE ✅)
├── types/                        → TypeScript interfaces (DONE ✅)
├── hooks/                        → React Query hooks (DONE ✅)
│   ├── useAuth.ts
│   ├── useHabits.ts
│   ├── useCheckIns.ts
│   ├── useFeed.ts
│   ├── useFriends.ts
│   ├── useFriendRequests.ts
│   ├── useSessions.ts
│   └── useUsers.ts
├── components/
│   ├── ui/                       → Design system (Button, Input, Card) (DONE ✅)
│   ├── habit/                    → HabitCard, HabitList, StreakCounter, HabitStreakCard (DONE ✅)
│   ├── feed/                     → FeedItem, FeedSummaryBanner (DONE ✅)
│   ├── friend/                   → FriendCard, UserSearchResult, FriendRequestCard (DONE ✅)
│   ├── session/                  → HabitSessionModal (Workout splits, Running pace, Reading pages, etc.) (DONE ✅)
│   └── common/                   → LoadingScreen, EmptyState, ErrorBoundary
├── contexts/
│   ├── AuthContext.tsx            → Auth state (token, user, isLoggedIn)
│   ├── ThemeContext.tsx           → Theme state (light, dark, system, colors)
│   └── QueryProvider.tsx          → TanStack React Query provider
├── constants/
│   ├── Colors.ts                  → Color palette
│   ├── Theme.ts                   → Design tokens (spacing, radii, shadows)
│   └── Typography.ts              → Font sizes, weights
└── utils/
    ├── dates.ts                   → Date formatting
    ├── streak.ts                  → Streak calculation
    └── validation.ts              → Form validation
```
