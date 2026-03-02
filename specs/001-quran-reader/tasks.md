---
description: "Tasks for Quran Reader feature"
---

# Tasks: شاشة قراءة القرآن (001-quran-reader)

**Input**: Design documents from `/specs/001-quran-reader/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/interfaces.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Update `constants/theme.ts` with Quran Reader specific colors for light and dark modes
- [x] T002 [P] Create `services/quranClient.ts` as a singleton instance of `@quranjs/api`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create `hooks/useQuranReader.ts` with basic state scaffolding (`currentPage`, `isLoading`, `error`)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - قراءة القرآن وتصفح الصفحات (Priority: P1) 🎯 MVP

**Goal**: Load and display Quran pages allowing swipe navigation using Uthmani text.

**Independent Test**: User can open `/quran-reader` and see Page 1 verses in Uthmani text. Swiping left/right smoothly changes the page.

### Implementation for User Story 1

- [x] T005 [US1] Implement `findByPage` API call logic inside `hooks/useQuranReader.ts` (Done locally offline)
- [x] T006 [P] [US1] Create `components/quran-reader/QuranPage.tsx` using `FlashList` to render verses with `textUthmani`
- [x] T007 [US1] Create main screen `app/quran-reader.tsx` with a horizontal `FlashList` for page navigation (total 604 pages) linking to `QuranPage.tsx`
- [x] T008 [US1] Integrate `app/quran-reader.tsx` into the main application flow (e.g., adding an access button in `app/(tabs)/index.tsx`)

**Checkpoint**: At this point, basic page browsing should be fully functional and testable independently.

---

## Phase 4: User Story 5 - حفظ واستعادة آخر صفحة (Priority: P2)

**Goal**: Save current page to AsyncStorage and restore it automatically upon reopening the app.

**Independent Test**: App opens directly to the last viewed page instead of page 1.

### Implementation for User Story 5

- [x] T009 [US5] Implement `AsyncStorage` read/write functions for `@quran_reader_last_page` in `hooks/useQuranReader.ts`
- [x] T010 [US5] Update `app/quran-reader.tsx` to set `initialScrollIndex` in the horizontal FlashList from the saved page
- [x] T011 [US5] Trigger `savePage` upon `onViewableItemsChanged` in the `app/quran-reader.tsx` FlashList

---

## Phase 5: User Story 2 - إظهار وإخفاء أدوات التحكم (Priority: P2)

**Goal**: Tapping the screen conditionally toggles the visibility of the UI controls with smooth animations.

**Independent Test**: Single tap hides all UI overlays, second tap brings them back naturally.

### Implementation for User Story 2

- [x] T012 [P] [US2] Update `app/quran-reader.tsx` to track a `showControls` state toggled by taps on the page
- [x] T013 [US2] Implement `react-native-reanimated` wrappers for Top and Bottom sections in `app/quran-reader.tsx` to slide in/out based on `showControls`

---

## Phase 6: User Story 3 - عرض معلومات وتفاصيل الصفحة (Priority: P2)

**Goal**: Display precise metadata (Juz, time, Surah, Hizb Quarter, Page number) in Top and Bottom bars.

**Independent Test**: Correct metadata appears in the bars precisely reflecting the currently viewed page.

### Implementation for User Story 3

- [x] T014 [US3] Compute current `pageMeta` (Juz, Hizb, Surah name) inside `hooks/useQuranReader.ts` based on current viewed page
- [x] T015 [P] [US3] Create `components/quran-reader/TopBar.tsx` for Juz, Time (live updater), and Surah name
- [x] T016 [P] [US3] Create `components/quran-reader/BottomBar.tsx` for Rub El Hizb and Page number
- [x] T017 [US3] Integrate `TopBar.tsx` and `BottomBar.tsx` into the animated wrappers in `app/quran-reader.tsx`

---

## Phase 7: User Story 4 - التفاعل المتقدم مع الآيات (Priority: P3)

**Goal**: Long press on a verse to reveal advanced options: play audio, show tafsir, bookmark, or share.

**Independent Test**: Long pressing a verse opens a menu. Accessing internet-dependent features while offline displays a Toast immediately.

### Implementation for User Story 4

- [x] T018 [P] [US4] Create `components/quran-reader/AyahOptionsMenu.tsx` UI for the action menu (bottom sheet or modal)
- [x] T019 [US4] Implement NetInfo checks within `app/quran-reader.tsx` displaying Toast via `react-native-toast-message` if offline before initiating audio/tafsir
- [x] T020 [US4] Add Audio playback logic using `@quranjs/api` and `expo-audio` within a dedicated service or component
- [x] T021 [US4] Add Tafsir reading logic (offline from local JSON) and display modal in `app/quran-reader.tsx`
- [x] T022 [US4] Integrate AsyncStorage logic for saving bookmarks (`@quran_reader_bookmarks`)
- [x] T023 [US4] Implement sharing functionality using React Native `Share` API
- [x] T024 [US4] Enhance `QuranPage.tsx` to capture `onLongPress` and pass it to `app/quran-reader.tsx` to open the `AyahOptionsMenu.tsx`

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect UI polish, performance and robustness across all stories.

- [x] T025 [P] Validate dark mode compliance (`useColorScheme`) across all new components (Page, TopBar, BottomBar, Menu)
- [x] T026 Verify SafeArea (`useSafeAreaInsets` from `react-native-safe-area-context`) usage in `TopBar.tsx` and `BottomBar.tsx` to avoid notches
- [x] T027 Performance assessment - Validate memory usage limits of FlashList rendering 604 pages

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Phase 3 (US1 - MVP) is the most critical and enables US5, US2, US3, and US4.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- **T001, T002** inside Phase 1 can be done in parallel
- **T006** can be created cleanly just importing standard types without waiting for full hook logic (T005)
- UI components **T015** (TopBar), **T016** (BottomBar), **T018** (AyahMenu) can be built in completely isolated parallel workflows before integration.
