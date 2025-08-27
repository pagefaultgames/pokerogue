# Epic 8: Item & Modifier Systems

## Epic Goal
Port inventory management, item effects, shop systems, held items, berries, consumables, and all modifier systems to AO processes, enabling the complete item ecosystem that enhances gameplay.

## Story 8.1: Core Item Database & Effects
As a **item system developer**,
I want **to migrate all items with their complete effect definitions and usage rules**,
so that **every item functions identically to current game with proper activation conditions**.

### Acceptance Criteria
1. All items (500+ including Poké Balls, healing items, berries, etc.) migrated accurately
2. Item effect definitions handle immediate use, battle use, and passive effects
3. Consumable items remove from inventory after use with proper validation
4. Item usage restrictions (battle-only, out-of-battle only) enforced correctly
5. Item stacking rules maintain proper quantity limits and grouping
6. Rare items (Master Ball, etc.) maintain scarcity and special properties
7. Item effectiveness calculations match current game formulas exactly
8. Key items maintain special status and usage restrictions

## Story 8.2: Held Item System
As a **held item specialist**,
I want **to implement held items that modify Pokémon stats and battle behavior**,
so that **held items provide strategic depth and function identically to current game**.

### Acceptance Criteria
1. Held item assignment validates one item per Pokémon with swap functionality
2. Stat-boosting items (Life Orb, Choice items) modify stats correctly
3. Type-boosting items increase move power by appropriate percentages
4. Status-related items (Leftovers, Flame Orb) trigger at correct battle timing
5. Battle-restricting items (Choice Band) prevent move selection as intended
6. Consumable held items (berries) activate under proper conditions and disappear
7. Held item interactions with abilities (Unburden, etc.) function correctly
8. Item theft moves (Thief, Switcheroo) transfer held items properly

## Story 8.3: Berry System & Effects
As a **berry mechanics developer**,
I want **to implement the complete berry system with proper activation conditions**,
so that **berries provide automatic healing and status curing with correct triggering**.

### Acceptance Criteria
1. HP-restoring berries activate at 25% or 50% HP thresholds appropriately
2. Status-curing berries activate immediately upon receiving corresponding status
3. Stat-boosting berries activate when corresponding stat is lowered
4. Damage-reducing berries halve super-effective damage once per battle
5. Berry consumption removes berry from held item slot after activation
6. Pinch berries (Petaya, Salac, etc.) activate at 25% HP with correct stat boost
7. Type-resist berries (Occa, Shuca, etc.) reduce damage by 50% once per battle
8. Berry recycling through moves and abilities functions correctly

## Story 8.4: Shop & Economic System
As a **economic system developer**,
I want **to implement item purchasing, selling, and economic balance**,
so that **players can acquire items through shops with proper pricing and availability**.

### Acceptance Criteria
1. Shop inventory maintains item availability with proper restocking mechanics
2. Item pricing follows current game economy with buy/sell price ratios
3. Money validation prevents purchases exceeding available funds
4. Item selling generates correct money amounts based on purchase price ratios
5. Shop inventory expansion unlocks based on game progression milestones
6. Rare item availability controlled through progression gates and special conditions
7. Bulk purchasing handles quantity selection and inventory limits properly
8. Transaction logging maintains purchase/sale history for economic tracking

---
