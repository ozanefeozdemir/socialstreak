# Social Streak — Process Log

> Development journal tracking decisions, milestones, and work done across sessions.

---

## Session 1 — 2026-09-09 (Project Bootstrap)

### What was done
- ✅ Analyzed the entire Spring Boot backend codebase (entities, controllers, services, security config)
- ✅ Created comprehensive `CLAUDE.md` with full backend documentation (data models, API endpoints, auth flow, error formats)
- ✅ Initialized Expo SDK 57 frontend (already existed as template)
- ✅ Built the API layer:
  - `api/client.ts` — Axios instance with JWT interceptor + `expo-secure-store` integration
  - `api/endpoints/auth.ts` — login, register
  - `api/endpoints/habits.ts` — full CRUD + archive/unarchive
  - `api/endpoints/checkins.ts` — check-in, list, delete
  - `api/endpoints/friends.ts` — list, remove
  - `api/endpoints/friendRequests.ts` — send, accept, reject, sent/received lists
  - `api/endpoints/users.ts` — get, update, change password, delete
  - `api/index.ts` — barrel export
- ✅ Created `types/index.ts` — TypeScript interfaces matching all backend DTOs
- ✅ Created initial implementation plan with file architecture, development phases, and open design questions
- ✅ Installed dependencies: `axios`, `@tanstack/react-query`, `expo-secure-store`, `date-fns`, `react-native-reanimated`

### Architecture decisions
- Feature-based folder structure (not flat)
- `app/` stays thin (route files only), business logic in `hooks/`
- `api/` is a pure HTTP layer (no React, no hooks)
- React Query for all server state
- `expo-secure-store` for JWT persistence

---

## Session 2 — 2026-09-10 (Design Decisions & Planning)

### Design questions resolved
| Question | Decision |
|----------|----------|
| Auth flow | Separate stack — full login/register screens, tab bar only after auth |
| Home screen | Habits list (exact layout TBD by user) |
| Friend visibility | Public/private per habit — **deferred to future work** |
| Design direction | Minimalist + playful — "feels like a game", cute vibes |
| Primary platform | iOS-first (tentative) |

### Feature specifications added
- **5-tab navigation**: Feed, Discover, Habits (center), Profile, Settings
- **Rich habit types** with type-specific metadata:
  - Reading (book name, page number), Running (km, duration), Meditation, Workout, Water Intake, Journaling, Practice, Sleep, Diet, Custom
- **Social feed**: Friends' check-ins appear in Feed tab with habit details and streaks
- **Persistent auth**: "Stay logged in forever" like Instagram

### Backend work identified (future)
- `habitType` enum + `metadata` JSONB column on `habits` table
- `metadata` JSONB column on `check_ins` table
- `isPublic` boolean on `habits` table
- `GET /api/feed` endpoint for friend activity feed
- Token refresh mechanism for persistent sessions

### What's next
- [x] Build Phase 1: Auth foundation + 5-tab shell
- [x] Start with `AuthContext`, design tokens, then Login/Register screens

---

## Session 3 — 2026-09-11 (Auth, Navigation, Habits Screen & UI Refinement)

### What was done
- ✅ **Authentication Flow & State Persistence**:
  - Implemented `AuthContext` with persistent login session support (auto-login with stored JWT tokens).
  - Built playful, high-aesthetic login & register screens in `app/(auth)/` with pastel blob backgrounds, spring animations, and validation.
  - Configured root navigation routing between `(auth)` and `(tabs)` based on authentication status.
  - Fixed Web React Native bug in `components/ui/Input.tsx` (unsafe empty string evaluation inside `<View>`).
- ✅ **Navigation & Aesthetic Modernization**:
  - Implemented custom animated 5-tab bar in `app/(tabs)/_layout.tsx`.
  - Installed and standardized on `@expo/vector-icons` (`Ionicons`), replacing generic system emojis across the entire app.
  - Regularized all 5 tabs (Feed, Discover, Habits, Profile, Settings) to uniform sizing, removing the oversized center protrusion.
  - Built playful tab click animation: active icon scales up smoothly on top of the text, and the tab's name slides in smoothly underneath the icon.
- ✅ **Habit Management**:
  - Implemented `HabitCard` component with spring animations, streak badges, frequency indicators, and instant check-in button.
  - Implemented Habits list view (`app/(tabs)/index.tsx`) featuring daily completion progress bar and animated empty state.
  - Implemented Habit creation modal (`app/habit/create.tsx`) with frequency selector chips and custom back navigation.
  - Implemented Habit Detail screen (`app/habit/[id].tsx`) with custom back navigation button, streak statistics, check-in action, and recent check-in timeline.
  - Created React Query hooks (`useHabits`, `useCheckIns`) for optimistic and reactive cache updates.
- ✅ **User Review Feedback Handled**:
  - Added dedicated back button to Habit Detail (`app/habit/[id].tsx`) and Habit Create screens.
  - Eliminated plain default emojis in favor of playful vector icons (`Ionicons`).
  - Regularized the Habits tab icon with other tabs and implemented smooth icon scale-up and label slide-in animations when tabs are clicked.

### What's next
- [x] Discover Page: Search users, send/manage friend requests
- [ ] Profile: Friend count stat card + Friends list modal/drawer
- [ ] Habit Type & Custom Metadata: Implement specialized fields per habit type (Book: page tracking, Running: distance/time, etc.)
- [ ] Social Feed integration: Show friend habit check-in activities and streak achievements
- [ ] Settings screen polish

---

## Session 4 — 2026-09-11 (Discover Page, Friend System & Current User State Consolidation)

### What was done
- ✅ **Discover Page Planning & Architectural Design**:
  - Evaluated 3 layout formats for Discover and settled on **Option A: Top Segmented Pill Switcher** separating *Find Friends* and *Requests*.
  - Documented complete architecture in `CLAUDE.md`, including Profile friends list interaction and future trending habits.
- ✅ **Current User State Consolidation**:
  - Cleaned up `AuthState` to use a single `user: UserRespond | null` object as the single source of truth across the app (removed redundant top-level `username` field).
  - Added user persistence helpers in `api/client.ts` (`saveStoredUser`, `getStoredUser`, `clearStoredUser`) supporting both web `localStorage` and mobile `SecureStore`.
  - Automatically fetches and persists full `UserRespond` profile during login/register, restoring it on app boot.
- ✅ **React Query Hooks Built**:
  - `hooks/useUsers.ts`: Query for fetching all registered users.
  - `hooks/useFriendRequests.ts`: Queries for sent & received requests + mutations for sending, accepting, and canceling requests.
  - `hooks/useFriends.ts`: Query for friends list + mutation for unfriending.
- ✅ **Friend Components**:
  - `components/friend/UserSearchResult.tsx`: Displays avatar, full name, `@username`, and dynamic relationship button (`+ Add`, `Requested (Cancel)`, `Accept / Decline`, `Friends ✓`).
  - `components/friend/FriendRequestCard.tsx`: Reusable card for received requests (with green `Accept` and `Decline` buttons) and sent requests (with `Pending` badge and `Cancel` button).
  - `components/friend/FriendCard.tsx`: Profile friends list card ready for viewing/removing friends.
- ✅ **Discover Screen Implementation (`app/(tabs)/discover.tsx`)**:
  - Smooth animated segmented controller toggling between **Find Friends** and **Requests** (with unread received requests badge counter).
  - Live search input filtering across `@username`, first name, and surname, excluding the logged-in user.
  - $O(1)$ relationship mapping using hash sets/maps to instantly resolve user connection status.
  - Playful mascot empty state + preview card for upcoming **Trending Habits**.
  - Requests tab with pull-to-refresh, dedicated Received and Sent sections, and empty states.
- ✅ **Profile Header Integration**:
  - Connected `app/(tabs)/profile.tsx` to display active user's full name and `@username` directly from `useAuth().user`.

### What's next
- [x] Connect Friends count stat card in `app/(tabs)/profile.tsx` to open the Friends list view using `FriendCard`.
- [ ] Habit Type & Custom Metadata: Implement specialized fields per habit type.
- [ ] Social Feed integration: Connect friends' check-in activity feed.

---

## Session 5 — 2026-09-12 (Profile Screen Friends List & Stats Enhancement)

### What was done
- ✅ **Profile Stats Grid**:
  - Implemented 4-stat card layout: **Day Streak**, **Check-ins**, **Habits** (dynamic via `useHabits()`), and **Friends** (dynamic via `useFriends()`).
  - Added interactive styling and touch feedback on the **Friends** stat card to trigger the Friends modal.
- ✅ **Profile Inline Friends Preview**:
  - Added dedicated Friends section in Profile with real-time friend count badge.
  - Quick action buttons: "+ Find" navigating directly to Discover tab, and "See All" opening the modal.
  - Renders the latest 3 friends using `FriendCard` with "+N more friends" expansion prompt.
  - Playful mascot empty state encouraging user to discover friends if count is 0.
- ✅ **Friends List Modal**:
  - Built full slide-up sheet modal with count badge, close button, and "+ Add" shortcut to Discover.
  - Live search bar filtering friends dynamically by `@username` or first/last name.
  - Integrated unfriend confirmation (`Alert.alert`) hooked into `useRemoveFriend()` mutation with optimistic cache updates.
- ✅ **Verification**:
  - Clean TypeScript compilation with zero errors (`npx tsc --noEmit`).

### What's next
- [x] Social Feed integration: Show friend habit check-in activities and streak achievements
- [x] Profile Section Refactor: Habit Streaks modal with highest streaks per habit & remove bottom friends list
- [ ] Habit Type & Custom Metadata: Implement specialized fields per habit type (Book: page tracking, Running: distance/time, etc.)
- [ ] Settings screen polish

---

## Session 6 — 2026-09-12 (Social Feed Implementation & Auto-Checkin Loop)

### What was done
- ✅ **Backend Feed System**:
  - Implemented `FeedItemRespond.java` DTO carrying check-in ID, check-in date, creation timestamp, friend profile (`UserRespond`), habit details (`HabitRespond`), and computed habit streak.
  - Added `findFeedCheckInsByUserIds` JPA query in `CheckInRepository.java` to fetch friend check-ins for active habits ordered chronologically (`createdAt DESC`).
  - Built `FeedService.java` with dynamic streak computation calculating consecutive check-in day runs for friends' habits.
  - Exposed `GET /api/feed` endpoint via `FeedController.java` with user authentication.
- ✅ **Frontend Feed Integration**:
  - Defined `FeedItemRespond` in `types/index.ts`.
  - Built `api/endpoints/feed.ts` and exported `feedApi` in `api/index.ts`.
  - Created `useFeed()` React Query hook with automatic cache invalidation on check-ins and check-in deletion.
- ✅ **Gamified Feed UI**:
  - Created `components/feed/FeedSummaryBanner.tsx` with dynamic cheer summary banner based on friends' today check-in count.
  - Created `components/feed/FeedItem.tsx` with pastel avatar theming, friend metadata, relative timestamps (*Just now*, *2h ago*), habit category badges, flame streak counters, and interactive spring-animated **Cheer 🔥** reaction button.
  - Built `app/(tabs)/feed.tsx` featuring `FlatList` with `RefreshControl` pull-to-refresh, staggered card entrance animations, and playful mascot empty states (with direct "+ Find Friends" and "Go to My Habits" action buttons).
- ✅ **Verification**:
  - Backend compilation: `./gradlew compileJava` succeeded.
  - Frontend type check: `npx tsc --noEmit` passed with 0 errors.

---

## Session 7 — 2026-09-12 (Profile Section Refactor & Habit Streaks Modal)

### What was done
- ✅ **Streaks Calculation Engine**:
  - Enhanced `front/utils/streak.ts` with `calculateHighestStreak` (calculates all-time maximum consecutive daily check-ins for any habit), `calculateCurrentStreak`, and `calculateHabitStats`.
  - Added `useHabitsStreakStats` React Query hook in `front/hooks/useHabits.ts` that fetches check-ins across all user habits and aggregates per-habit metrics (current streak, highest streak, total check-ins) and user lifetime totals.
- ✅ **Habit Streak Card Component**:
  - Built `components/habit/HabitStreakCard.tsx` displaying habit title, frequency badge, all-time highest record pill (`🔥 Best: X days`), current streak pill (`⚡ Current: Y days`), and total check-ins badge.
  - Pressing a habit card navigates directly to `/habit/[id]`.
- ✅ **Profile Screen Redesign (`app/(tabs)/profile.tsx`)**:
  - **Removed inline bottom friends list**: Friends are now cleanly managed via the interactive **Friends** stat card modal.
  - **Interactive Day Streak Stat Card**: Tapping opens the **Habit Streaks Modal** with live search bar filtering, highest-to-lowest streak sorting, and empty state with "+ Create Habit" CTA.
  - **Live Aggregate Stats**: Day Streak displays overall best streak record, Check-ins shows lifetime total check-ins, Habits shows active habits count, and Friends shows friend count.
  - **Account Details & Settings**: Added user account details card (Email, Username, Timezone) and quick settings actions including Logout with confirmation dialog.
- ✅ **Verification**:
  - Frontend type check: `npx tsc --noEmit` passed with 0 errors.

### What's next
- [ ] Habit Type & Custom Metadata: Implement specialized fields per habit type (Book: page tracking, Running: distance/time, etc.)
- [ ] Add subtle timer (e.g., "3 hours left") on habit cards with green-to-red colorization
- [ ] Settings screen polish
- [ ] Profile inspection when tapping on friends in feed or profile

---

## Session 8 — 2026-09-13 (Refresh Token Architecture & Silent Auto-Renewal)

### What was done
- ✅ **Backend Refresh Token Infrastructure**:
  - Added `RefreshToken` JPA entity mapped to `refresh_tokens` table with user relationship, unique index, and expiration tracking.
  - Implemented `RefreshTokenRepository` with lookup and cleanup queries (`deleteByUser`, `deleteByToken`, `deleteByExpiresAtBefore`).
  - Added separate signing secret (`JWT_REFRESH_SECRET`) and configuration (`jwt.expiration=900000` [15 min], `jwt.refresh-expiration=2592000000` [30 days]).
  - Enhanced `JwtService` with refresh token generation, expiration checks, and username extraction.
  - Updated `AuthService` to issue token pairs (access + refresh), implement single-use token rotation on `POST /api/auth/refresh`, and server-side revocation on `POST /api/auth/logout`.
  - Added `shouldNotFilter` in `JwtAuthFilter` for `/api/auth/**` paths to prevent expired Bearer headers from blocking refresh/login/logout requests.
- ✅ **Frontend Silent Refresh & Session Persistence**:
  - Added secure storage helpers (`saveRefreshToken`, `getRefreshToken`, `clearRefreshToken`) using `SecureStore` (mobile) / `localStorage` (web).
  - Re-architected Axios response interceptor in `front/api/client.ts` with request queueing (`failedQueue`) to prevent race conditions during refresh, transparently renew access tokens, and replay pending requests.
  - Integrated `setOnAuthFailure` event listener to cleanly wipe cache and transition state to logged out if refresh fails or tokens are revoked.
  - Updated `AuthContext` to persist sessions with refresh tokens and revoke tokens server-side during logout.
- ✅ **Verification**:
  - Backend tests: `./gradlew test` passed with full unit test coverage in `AuthServiceTest`.
  - Frontend type check: `npx tsc --noEmit` passed with 0 errors.

### What's next
- [ ] Habit Type & Custom Metadata: Implement specialized fields per habit type (Book: page tracking, Running: distance/time, etc.)
- [ ] Add subtle timer (e.g., "3 hours left") on habit cards with green-to-red colorization
- [ ] Profile inspection when tapping on friends in feed or profile
- [x] Settings screen polish

---

## Session 9 — 2026-09-13 (Settings Subsections, App-Wide Dark Mode & Profile Subsections UX)

### What was done
- ✅ **Settings Screen & Subsections**:
  - Implemented complete settings sub-screens under `app/settings/`:
    - `edit-profile.tsx` — Editable username, email, and timezone connected to `usersApi.update()` and `AuthContext`.
    - `change-password.tsx` — Form for current password, new password, and confirmation with client validation connected to `usersApi.changePassword()`.
    - `notifications.tsx` — Switch toggles for push and email alerts.
    - `timezone.tsx` — Searchable list of global timezones.
    - `terms.tsx` & `privacy.tsx` — Comprehensive terms of service and privacy policy documents.
  - Implemented custom `_layout.tsx` for `app/settings/` with custom animated back button and `headerBackVisible: false`.
  - Added Email verification badge with caution alert; fixed runtime crash by statically importing `Alert`.
- ✅ **Theme System & App-Wide Dark Mode**:
  - Built persistent `ThemeContext` supporting `light`, `dark`, and `system` preferences saved in `SecureStore`.
  - Added theme toggle in Settings.
  - Adapted root layout with theme-aware `StatusBar` (`light`/`dark`) and root `contentStyle: { backgroundColor: colors.background }` preventing white flashes.
  - Fully themed all components without corrupting light mode aesthetics:
    - `Input.tsx`: Dynamic inputs, labels, and borders.
    - `HabitCard.tsx` & `HabitStreakCard.tsx`: Dark card surfaces, streak badges, and status indicators.
    - `FriendCard.tsx`, `UserSearchResult.tsx`, `FriendRequestCard.tsx`: Themed avatars, borders, and action badges.
    - `FeedItem.tsx` & `FeedSummaryBanner.tsx`: Themed feed cards, inner habit blocks, and cheer buttons.
    - `app/habit/[id].tsx` & `app/habit/create.tsx`: Themed headers, frequency chips, and stat cards.
    - `app/(tabs)/profile.tsx`, `feed.tsx`, `discover.tsx`, `index.tsx`: Modals, segmented controls, search bars, and progress tracks.
- ✅ **Profile Subsections Back Navigation**:
  - Replaced circular close buttons in Habit Streaks and Friends modals with the exact animated back button component from `habit/[id].tsx` (`chevron-back` + "Back" label + `FadeInUp` animation).
- ✅ **Habit Types & HabitSession Entity Architecture**:
  - **Backend Models & Database Schema**:
    - Created `HabitType` enum: `GENERAL`, `WORKOUT`, `RUNNING`, `READING`, `MEDITATION`, `WATER`, `CUSTOM`.
    - Added `habitType` and JSONB `config` (using `@JdbcTypeCode(SqlTypes.JSON)`) to `Habit` entity and DTOs (`HabitRequest`, `HabitRespond`).
    - Created `HabitSession` entity mapped to `habit_sessions` table with `startedAt`, `endedAt`, `durationSeconds`, JSONB `sessionData`, `notes`, and FKs to `Habit` and `CheckIn`.
    - Created `HabitSessionRequest` and `HabitSessionRespond` DTOs.
    - Created `HabitSessionRepository` with queries for habit history and batch loading for check-ins (`findByCheckInIdIn`).
    - Created `HabitSessionMapper` MapStruct mapper.
  - **Service & Business Logic**:
    - Built `HabitSessionService`:
      - Validates habit ownership.
      - Resolves user local date from timezone.
      - Automatically finds or creates today's `CheckIn` anchor, advancing streaks without duplicate conflict on multiple daily sessions.
      - Automatically advances reading state (`currentPage`, `currentBook`, `totalPages`) in `Habit.config` if habit is `READING`.
    - Updated `FeedService`: Batch-loads latest sessions for friends' check-ins without N+1 queries, enriching `FeedItemRespond` with session details.
    - Created `HabitSessionController` (`POST /api/habit/{id}/session`, `GET /api/habit/{id}/session`, `DELETE /api/habit/{id}/session/{sessionId}`).
  - **Unit Testing**:
    - Built comprehensive unit test suite `HabitSessionServiceTest` covering new check-in creation, existing check-in reuse, reading config auto-advance, ownership checks, and unauthorized deletion prevention.
  - **Frontend Architecture**:
    - Updated `front/types/index.ts` with `HabitType`, `HabitSessionRequest`, `HabitSessionRespond`, and enriched `FeedItemRespond`.
    - Created `front/api/endpoints/sessions.ts` (API client for sessions).
    - Created `front/hooks/useSessions.ts` (TanStack React Query hooks with automatic cache invalidation across sessions, check-ins, habits, and feed).
    - Updated `front/app/habit/create.tsx` with modern, themed Habit Type selector chips (`General`, `Workout`, `Running`, `Reading`, `Meditation`, `Water`, `Custom`).
    - Created `front/components/session/HabitSessionModal.tsx`:
      - Comprehensive modal tailored per habit type with built-in stopwatch timer, manual time toggle, and notes.
      - **Workout**: 1-tap split presets (`Push`, `Pull`, `Legs`, `Full Body`, `Upper`, `Core`) + toggle chips for 6 primary muscle groups (`Chest`, `Back`, `Shoulders`, `Arms`, `Legs`, `Core`) and intensity selector.
      - **Running**: Real-time timer, distance input with live pace (min/km) calculator, and surface type.
      - **Reading**: Continuity tracking showing last-read page, start/end page inputs with pages read delta, and total pages progress.
      - **Meditation**: Guided breath/mindfulness presets (5m, 10m, 15m, 20m, 30m) with timer.
      - **Water**: Rapid incremental cup/glass logger (+250ml, +500ml) with daily target progress bar.
    - Updated `front/components/habit/HabitCard.tsx`:
      - Replaced raw checkbox check-in with habit-type specific action buttons (`barbell`, `walk`, `book-outline`, etc.).
      - Added reading page badge (`p. 42`) for reading habits.
      - Tapping the action button opens `HabitSessionModal` directly.
    - Updated `front/app/(tabs)/index.tsx` to mount `HabitSessionModal` and connect habit card presses.
    - Updated `front/app/habit/[id].tsx`:
      - Replaced check-in button with habit session launcher.
      - Added "RECORDED SESSIONS" timeline displaying session durations, muscle chips, distance, reading progress, and notes.
    - Updated `front/components/feed/FeedItem.tsx` to render rich session telemetry (duration pills, workout muscle group chips, running km badges, reading progress counters, and session notes).
- ✅ **Jackson 3 / Spring Boot 4 Compatibility Fix**:
  - Replaced Jackson 2 `com.fasterxml.jackson.databind.JsonNode` with `Map<String, Object>` across DTOs (`HabitSessionRequest`, `HabitSessionRespond`, `HabitRequest`, `HabitRespond`) and Entities (`Habit.config`, `HabitSession.sessionData`).
  - Fixed `HttpMessageConversionException: Cannot construct instance of JsonNode` thrown by Spring WebMVC's Jackson 3 converter (`tools.jackson.databind`).
- ✅ **Verification**:
  - Backend: `./gradlew test --rerun` passed with 100% success (all unit tests + new `HabitSessionControllerTest` HTTP deserialization test passing).
  - Frontend type check: `npx tsc --noEmit` passed with 0 errors.

---

## Session 10 — 2026-09-16 (Persistent Sessions & Offline Mode)

### What was done
- ✅ **Offline Mode & Caching**:
  - Migrated `QueryClientProvider` to `PersistQueryClientProvider` utilizing `@tanstack/react-query-persist-client` and `@tanstack/query-async-storage-persister`.
  - Offline cache is persisted to `AsyncStorage` allowing immediate access to habits, check-ins, and friends without internet connectivity.
  - Implemented `useSyncStore.ts` (Zustand) serving as a robust offline mutation queue for `POST`, `PUT`, `DELETE` operations.
  - Updated `api/client.ts` Axios interceptors: when network is unreachable (`NetInfo`), write requests are captured, logged into the `SyncQueue`, and spoofed with optimistic HTTP 200 JSON responses.
  - Built `SyncManager.tsx` that silently flushes pending writes to the backend once connectivity is restored.
- ✅ **Persistent, Concurrent Habit Sessions**:
  - Re-architected `HabitSessionModal` timer state from React local state to a centralized Zustand store (`useSessionStore.ts`).
  - Allowed multiple independent habit sessions to be actively running in the background simultaneously.
  - Built real-time session tracking that calculates durations securely off timestamps, rendering accurate progress upon foregrounding the app or remounting components.
- ✅ **Session UX Polish**:
  - Added dynamic, frosted-glass blur overlays to active `HabitCard`s directly inside `app/(tabs)/index.tsx`, preventing duplicate inputs while providing a "Resume" action button.
  - Implemented a smooth horizontal `ActiveSessionsList` component prominently anchored below the header, broadcasting active timers and shortcuts.
- ✅ **Background Notifications**:
  - Programmed `SyncManager.tsx` to detect `AppState` transitions. Entering the background with running sessions fires a live `expo-notifications` local reminder, alerting the user to unresolved timers.
- ✅ **Verification**:
  - Frontend type check: `npx tsc --noEmit` passed with 0 errors.

---

## Backlog / Future Work
- [ ] BACKEND GET /api/users DATA LEAKAGE, OPTIMIZE QUERY AND RESPONSE DTO !!!!


- [ ] Most common / trending habits list in Discover tab (habit templates/suggestions)
- [ ] Add pagination, searchbar and filtering to habits list view
- [ ] Add subtle timer (3 Hours left) to habit cards in habits list view to remind user check in and colorize the timer green to red according to remaining time. 
- [ ] Public/private habit visibility toggle (backend + frontend)
- [ ] Delete Habit button in habit card
- [ ] Cheer post in feed (Currently it works but it is not instant. We should add it to rabbitmq)
- [ ] Streak related reward or ranking system to keep user motivated.
- [ ] Profile inspection with clicking on friends in feed or profile.
- [ ] All streaks are calculated by day, but we should implement it by habit type. For example, for the weekly habit type, the streak should be calculated by week.
- [x] Feed endpoint (`GET /api/feed`)
- [ ] Add pagination for API endpoints (Users, Feed, Habits, Check-ins).
- [x] Persistent Session State: When user starts a session, closing modal keeps timer running. Blur overlays for active habits, active sessions list.
- [ ] Notification Integration: Add live ticking clocks in notification bar (requires custom native code / `notifee`).
- [ ] Discover page enhancements: algorithmic friend recommendations and trending habits list.
- [x] Profile Day Streak modal with highest streak per habit
- [x] Habit type metadata (backend schema change)
- [x] Check-in metadata & HabitSession entity (backend schema change)
- [ ] "Custom" frequency type configuration (Days of week selection etc.) 
- [x] Token refresh flow
- [x] Settings screen and dark mode
- [ ] Add RabbitMQ implementation for push notifications and feed (When user checks-in queue job to feed and sends push notifications to friends who follows the user)
- [ ] Push notifications
- [ ] Pagination (users, feed, check-in history)
- [ ] Profile picture upload
- [ ] Streak leaderboard
- [x] Offline support (React Query persistence + Mutation Queue)
- [ ] App Store / Play Store submission
