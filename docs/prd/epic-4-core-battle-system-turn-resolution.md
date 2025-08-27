# Epic 4: Core Battle System & Turn Resolution

## Epic Goal
Implement turn-based battle mechanics including damage calculation, type effectiveness, status effects, move execution, and battle state management, creating the core combat engine for all battle interactions.

## Story 4.1: Turn-Based Battle Engine
As a **core battle system developer**,
I want **to implement the fundamental turn-based battle engine with proper turn order and action resolution**,
so that **battles execute identically to current game with correct speed calculations and priority handling**.

### Acceptance Criteria
1. Turn order determined by Pokémon speed stats with priority move handling
2. Speed tie resolution uses deterministic random number generation
3. Turn phases execute in correct order (command selection → action execution → end-of-turn effects)
4. Battle state transitions handled properly (active Pokémon, fainted Pokémon, etc.)
5. Multi-turn actions (charging moves, sleep, etc.) track duration correctly
6. Battle interruptions (fainting, switching) handled at appropriate times
7. Battle end conditions (all Pokémon fainted, forfeit) detected properly
8. Battle message generation matches current game output

## Story 4.2: Damage Calculation System
As a **battle mechanics specialist**,
I want **to implement precise damage calculation formulas matching current game exactly**,
so that **all battle outcomes are identical to TypeScript implementation**.

### Acceptance Criteria
1. Base damage formula accounts for level, attack/defense stats, and move power
2. Type effectiveness multipliers (0x, 0.25x, 0.5x, 1x, 2x, 4x) applied correctly
3. STAB (Same Type Attack Bonus) provides 1.5x damage for matching types
4. Critical hit calculations use proper critical hit ratios and damage multipliers
5. Random damage variance (85%-100%) applied consistently
6. Stat stage modifications affect damage calculations correctly
7. Weather effects modify damage for appropriate move types
8. Ability and item effects modify damage calculations properly

## Story 4.3: Battle State & Switching System
As a **battle flow developer**,
I want **to manage active Pokémon, switching, and battle state transitions**,
so that **players can switch Pokémon and battle state remains consistent**.

### Acceptance Criteria
1. Active Pokémon tracking maintains current battlers for each side
2. Pokémon switching validates available party members and prevents illegal switches
3. Forced switches (fainting, moves like Roar) execute automatically
4. Switch-in effects (abilities, entry hazards) trigger in correct order
5. Battle participation tracking records which Pokémon participated for experience
6. Double battle mechanics support multiple active Pokémon per side
7. Pokémon status persistence maintained across switches and turns
8. Battle memory tracks move usage, damage taken, and other battle events

## Story 4.4: Battle Victory & Defeat Conditions
As a **battle conclusion specialist**,
I want **to properly detect and handle battle end conditions with appropriate rewards**,
so that **battles conclude correctly with proper experience, money, and item rewards**.

### Acceptance Criteria
1. Victory conditions detected when opponent has no usable Pokémon remaining
2. Defeat conditions handled when player has no usable Pokémon remaining
3. Experience point distribution calculated correctly for participating Pokémon
4. Money rewards calculated based on trainer type and Pokémon levels
5. Item drops and rewards distributed according to battle outcome
6. Battle statistics updated for participating Pokémon and player records
7. Forfeit/escape attempts processed with appropriate success rates
8. Battle cleanup resets temporary battle state and restores persistent state

---
