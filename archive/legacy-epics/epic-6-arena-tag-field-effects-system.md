# Epic 6: Arena Tag & Field Effects System

## Epic Goal
Implement battlefield-wide effects including entry hazards (spikes, stealth rocks), field conditions (trick room), side-specific effects, and positional battlefield mechanics that persist across multiple turns.

## Story 6.1: Entry Hazard System
As a **battlefield hazard specialist**,
I want **to implement entry hazards that damage or affect Pokémon when they enter battle**,
so that **strategic field control mechanics like Stealth Rock and Spikes function identically to current game**.

### Acceptance Criteria
1. Stealth Rock deals damage based on Rock-type effectiveness when Pokémon switches in
2. Spikes deals 1/8, 1/6, or 1/4 max HP damage based on layer count (1-3 layers)
3. Toxic Spikes inflicts poison or badly poisoned status on grounded switch-ins
4. Entry hazard stacking allows multiple layers where applicable
5. Entry hazard removal through moves (Rapid Spin, Defog) clears appropriate hazards
6. Flying-type and Levitate ability Pokémon avoid ground-based hazards
7. Hazard immunity abilities (Magic Guard) prevent hazard damage
8. Side-specific hazard placement affects only the targeted team

## Story 6.2: Field Condition Effects
As a **field mechanics developer**,
I want **to implement field-wide conditions that alter battle mechanics globally**,
so that **moves like Trick Room and Wonder Room create strategic battlefield modifications**.

### Acceptance Criteria
1. Trick Room reverses speed priority so slower Pokémon move first
2. Wonder Room swaps Defense and Special Defense stats for all active Pokémon
3. Magic Room prevents held items from having any effect during battle
4. Field condition duration tracking with 5-turn default length
5. Field condition interactions with abilities and moves handled properly
6. Multiple field conditions can coexist when effects don't conflict
7. Field condition removal moves end appropriate effects immediately
8. Field condition notifications display at battle start and end

## Story 6.3: Side-Specific Arena Effects
As a **team effect specialist**,
I want **to implement effects that apply to entire teams or battle sides**,
so that **moves like Light Screen and Reflect provide team-wide defensive bonuses**.

### Acceptance Criteria
1. Light Screen reduces Special damage by 50% (33% in doubles) for 5 turns
2. Reflect reduces Physical damage by 50% (33% in doubles) for 5 turns
3. Aurora Veil provides both Light Screen and Reflect effects during hail
4. Safeguard prevents status conditions for team for 5 turns
5. Mist prevents stat reductions for team for 5 turns
6. Side effect duration tracking counts down properly each turn
7. Side effect interactions with screen-breaking moves work correctly
8. Side effects apply to all team members including those not currently active

## Story 6.4: Positional Battle Mechanics
As a **positional mechanics engineer**,
I want **to implement position-dependent effects and targeting systems**,
so that **double battle positioning and area-of-effect moves function correctly**.

### Acceptance Criteria
1. Double battle position tracking maintains left/right battlefield positions
2. Move targeting system distinguishes between single-target and multi-target moves
3. Position-dependent moves (like some doubles-specific moves) target correct positions
4. Ally targeting moves can only target teammate in doubles battles
5. Spread moves affect multiple targets with appropriate damage reduction
6. Position swapping moves (Ally Switch) exchange battlefield positions correctly
7. Positional abilities (Plus/Minus) activate based on adjacent ally abilities
8. Positional tag effects track duration and application correctly per position

---
