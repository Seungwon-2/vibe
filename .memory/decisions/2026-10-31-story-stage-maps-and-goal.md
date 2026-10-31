# Decisions: Story Stage Maps and Goal Finish

- Date: 2026-10-31
- Status: Confirmed

## D01. Story biome selection
- **Chosen**: Each of the four existing Story stages keeps its own biome for the entire run. Story gates remain as non-rewarding landmarks and never trigger background transitions or acceleration.
- **Rationale**: A stage-based campaign should feel like one authored course per stage. A gate should not make the selected stage unexpectedly change scenery.

## D02. Stage course layouts
- **Chosen**: Give each stage a deterministic, stage-specific obstacle sequence while preserving the existing stage lengths, movement rules, collision safety, and readable recovery gaps.
- **Rationale**: Theme art alone does not make the routes feel different; authored hazard order gives each course its own play rhythm.

## D03. Story milestones
- **Chosen**: Keep the existing Story milestone gate concept, with no time reward or speed increase. Replace any misleading reward label with a stage-distance landmark label.
- **Rationale**: Progress markers help orient the player without behaving like Endless-mode biome gates.

## D04. Goal presentation
- **Chosen**: Place a biome-themed goal arch and ground finish line at each course endpoint, with a clear `GOAL` label.
- **Rationale**: The player should see a concrete finish point and recognize the moment the course is completed.

## D05. Finish sequence
- **Chosen**: Stop course simulation at the endpoint, play the character's victory pose for about 800ms, then show the existing Story result screen.
- **Rationale**: The finish gets a short in-game celebration while the existing results and reward flow remains intact.
