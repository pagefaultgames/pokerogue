# Epic 5: Status Effects & Environmental Systems

## Epic Goal
Migrate status conditions, terrain effects, weather systems, and all environmental battle modifiers to AO handlers, enabling complex battlefield conditions that affect battle outcomes.

## Story 5.1: Pokémon Status Conditions
As a **status effect specialist**,
I want **to implement all status conditions (sleep, poison, paralysis, burn, freeze) with proper mechanics**,
so that **status effects function identically to current game with correct damage, duration, and interaction rules**.

### Acceptance Criteria
1. Sleep status prevents move usage with proper wake-up chance calculations
2. Poison status deals 1/8 max HP damage each turn with badly poisoned escalation
3. Paralysis status causes 25% move failure and 50% speed reduction
4. Burn status deals 1/16 max HP damage and reduces physical attack by 50%
5. Freeze status prevents moves with 20% thaw chance (higher with fire moves)
6. Status condition interactions (can't sleep while poisoned, etc.) enforced
7. Status condition curing through moves, abilities, and items works correctly
8. Status condition immunities based on type and ability function properly

## Story 5.2: Weather System Implementation
As a **environmental effects developer**,
I want **to implement all weather conditions with proper battle effects**,
so that **weather changes battlefield conditions and affects move power, accuracy, and Pokémon abilities**.

### Acceptance Criteria
1. Sun weather boosts fire move power by 50% and reduces water move power by 50%
2. Rain weather boosts water move power by 50% and reduces fire move power by 50%
3. Sandstorm weather damages non-Rock/Ground/Steel types for 1/16 max HP per turn
4. Hail weather damages non-Ice types for 1/16 max HP per turn
5. Weather duration tracking with proper turn countdown and renewal
6. Weather-related ability activations (Solar Power, Rain Dish, etc.) work correctly
7. Weather-dependent moves (Thunder, Solar Beam) have modified accuracy/power
8. Weather interactions with terrain and other field effects handled properly

## Story 5.3: Terrain Effects System  
As a **battlefield mechanics developer**,
I want **to implement terrain effects that modify the battlefield environment**,
so that **terrain-setting moves create persistent field effects that influence battle outcomes**.

### Acceptance Criteria
1. Electric Terrain boosts Electric-type move power by 30% for grounded Pokémon
2. Grassy Terrain boosts Grass-type moves and provides 1/16 HP healing per turn
3. Misty Terrain reduces Dragon-type move damage and prevents status conditions
4. Psychic Terrain boosts Psychic moves and prevents priority move usage
5. Terrain duration tracking with 5-turn default duration
6. Terrain interactions with abilities (Surge Surfer, etc.) function correctly
7. Terrain effects only apply to grounded Pokémon (not Flying types or Levitate)
8. Multiple terrain effects conflict resolution (newest terrain replaces previous)

## Story 5.4: Complex Environmental Interactions
As a **advanced mechanics engineer**,
I want **to handle complex interactions between weather, terrain, status effects, and abilities**,
so that **battlefield conditions create strategic depth with proper interaction precedence**.

### Acceptance Criteria
1. Weather and terrain effect stacking follows proper priority rules
2. Ability-weather interactions (Cloud Nine, Air Lock) suppress weather correctly
3. Move-environment interactions (Hurricane in rain, Solar Beam in sun) work properly
4. Status-environment healing (Rain Dish, Ice Body) activates at correct times
5. Environmental damage (sandstorm, hail) calculated after other end-of-turn effects
6. Field effect removal moves (Defog) clear appropriate conditions
7. Environmental effect notifications display at correct timing
8. Multiple environmental effects resolve in proper game-accurate sequence

---
