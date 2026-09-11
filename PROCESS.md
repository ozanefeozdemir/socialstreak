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
- [ ] Connect Friends count stat card in `app/(tabs)/profile.tsx` to open the Friends list view using `FriendCard`.
- [ ] Habit Type & Custom Metadata: Implement specialized fields per habit type.
- [ ] Social Feed integration: Connect friends' check-in activity feed.

---

## Backlog / Future Work

- [ ] Most common / trending habits list in Discover tab (habit templates/suggestions)
- [ ] Public/private habit visibility toggle (backend + frontend)
- [ ] Feed endpoint (`GET /api/feed`)
- [ ] Habit type metadata (backend schema change)
- [ ] Check-in metadata (backend schema change)
- [ ] Token refresh flow
- [ ] Push notifications
- [ ] Pagination (users, feed, check-in history)
- [ ] Profile picture upload
- [ ] Streak leaderboard
- [ ] Offline support (React Query persistence)
- [ ] App Store / Play Store submission
