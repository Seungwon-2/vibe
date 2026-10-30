# Task: T03 Mode Navigation

## Status: done

## Goal

Add Title → Mode Select → Character Select → Story Stage Select navigation, with profile-driven locked character and stage cards, while preserving the Endless flow.

## Decision Summary

- Endless starts after character confirmation; Story proceeds to stage selection.
- Show all five characters and four stages, but block locked selections and explain their unlock conditions.

## Implementation

### I01. Add mode and stage navigation

- Related Files:
  - src/App.tsx :: AppScreen, App, startRun, navigation handlers; modify
  - src/app/screens/ModeSelect.tsx :: ModeSelect; new
  - src/app/screens/StageSelect.tsx :: StageSelect; new
  - src/app/screens/CharacterSelect.tsx :: profile-driven locked card props; modify
  - src/App.test.tsx :: both navigation paths; modify
  - src/app/screens/ModeSelect.test.tsx; new
  - src/app/screens/StageSelect.test.tsx; new
  - src/styles/global.css :: mode/stage card layouts; modify

#### Details

- AppScreen adds mode-select and stage-select. Transient App state holds selected mode and nullable StoryStageId.
- ModeSelect props: onSelect(mode:RunnerMode), onBack(). Title start opens it.
- Endless mode opens character selector; character confirmation starts Endless with stageId null.
- Story mode opens character selector; confirmation opens StageSelect, retaining selected character. Selecting an unlocked stage starts Story.
- StageSelect props: profile, selectedStageId, onSelect, onStart, onBack. Consume STORY_STAGES and display locked/cleared states.
- CharacterSelect receives unlockedCharacterIds and retains current passive icon/name/effect. A locked character cannot be confirmed; card explains which Story clear unlocks it.
- Back navigation returns to the previous screen while preserving chosen mode and character.
- Fit all cards and start controls without clipping at 320px viewport width. Preserve the current pastel presentation.

### I02. Verify routes and locked states

- Related Files:
  - Listed screen and App tests; modify

#### Details

- Cover Endless route, Story route, back navigation, locked stage prevention, locked character prevention, and preserved character choice.

## Acceptance Criteria

- [ ] Both modes follow the confirmed navigation.
- [ ] Locked characters/stages are visible, disabled, and show unlock requirements.
- [ ] Back navigation preserves the user's current selections.
- [ ] Existing Endless launch still works.

## Validation

- npx vitest run src/App.test.tsx src/app/screens/ModeSelect.test.tsx src/app/screens/StageSelect.test.tsx src/app/screens/CharacterSelect.test.tsx
- npm run typecheck

## Commit Message

    feat(ui): add runner mode and story stage selection

    Plan: 2026-10-30-runner-modes-progression
    Phase: P01-mode-and-profile-foundation
    Task: T03-mode-navigation

    - Add mode selection and Story stage selection flow
    - Render profile-driven character and stage unlock states

## Progress

- [x] Implementation complete
- [x] Validation passed: npm run typecheck
- commit: see task commit
