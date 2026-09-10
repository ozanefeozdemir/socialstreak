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
- [ ] Build Phase 1: Auth foundation + 5-tab shell
- [ ] Start with `AuthContext`, design tokens, then Login/Register screens

---

## Backlog / Future Work

- [ ] Public/private habit visibility toggle (backend + frontend)
- [ ] Feed endpoint (`GET /api/feed`)
- [ ] Habit type metadata (backend schema change)
- [ ] Check-in metadata (backend schema change)
- [ ] Token refresh flow
- [ ] Push notifications
- [ ] Pagination (users, feed, check-in history)
- [ ] Profile picture upload
- [ ] Streak leaderboard
- [ ] Habit templates / sharing
- [ ] Offline support (React Query persistence)
- [ ] App Store / Play Store submission
