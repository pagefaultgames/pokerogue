# Epic 3: Move System & Battle Actions

## Epic Goal
Migrate complete move database, move learning, TM/TR systems, move categories, accuracy calculations, and special move effects to AO handlers, providing the foundation for all battle interactions.

## Story 3.1: Move Database & Mechanics Migration
As a **battle mechanics developer**,
I want **to migrate all 900+ moves with their complete effect definitions to AO handlers**,
so that **every move functions identically to the current game with proper damage, accuracy, and effect calculations**.

### Acceptance Criteria
1. All moves migrated with accurate power, accuracy, PP, and type data
2. Move categories (Physical, Special, Status) properly classified
3. Move targets (Single, All, Allies, etc.) correctly implemented
4. Move flags (Contact, Sound, Bullet, etc.) preserved for ability interactions
5. Move effects (damage, status infliction, stat changes) function correctly
6. Multi-hit moves handle hit count variation properly
7. Priority moves execute in correct speed order
8. Critical hit calculations match current game formulas

## Story 3.2: Move Learning & TM/TR Systems
As a **Pokémon progression specialist**,
I want **to implement move learning through leveling and TM/TR systems**,
so that **Pokémon can learn new moves and expand their battle capabilities**.

### Acceptance Criteria
1. Level-up move learning follows species-specific movesets
2. TM (Technical Machine) and TR (Technical Record) compatibility preserved
3. Move relearning system maintains previously known moves
4. Egg moves inherited properly through breeding
5. Move tutoring system (if present) functions correctly
6. Move deletion and relearning maintains move history
7. Move learning notifications trigger appropriately
8. Incompatible move learning attempts properly rejected

## Story 3.3: Move Effect System Architecture
As a **game engine architect**,
I want **to create a flexible move effect system supporting all special move behaviors**,
so that **complex moves like Metronome, Transform, and weather moves function correctly**.

### Acceptance Criteria
1. Status effect application (sleep, poison, paralysis, etc.) works correctly
2. Stat stage changes (+1/-1 Attack, Defense, etc.) apply properly
3. Weather-changing moves modify battlefield conditions
4. Terrain-setting moves affect battle environment
5. Healing moves restore HP according to formulas
6. Recoil moves damage user appropriately after dealing damage
7. Multi-turn moves (Fly, Dig, etc.) handle charging and execution phases
8. Random effect moves (Metronome, Sleep Talk) select effects properly

## Story 3.4: Move Interaction & Combo System
As a **advanced battle mechanic developer**,
I want **to implement move interactions and combination effects**,
so that **complex battle scenarios involving move combinations work identically to current game**.

### Acceptance Criteria
1. Move-ability interactions function correctly (Lightning Rod, Water Absorb, etc.)
2. Type immunity interactions properly cancel moves when appropriate
3. Move-item interactions (Assault Vest, Choice items) apply restrictions correctly
4. Move protection effects (Protect, Detect) block appropriate moves
5. Move reflection effects (Magic Coat, Magic Bounce) redirect properly
6. Move copying effects (Mirror Move, Copycat) select correct moves
7. Move prevention effects (Taunt, Torment) restrict move usage appropriately
8. Substitute interactions block or allow moves according to rules

---
