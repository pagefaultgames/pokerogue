# U2: Item Effect Semantic Encoding

> Completed: 2026-02-09
> Observation impact: 5,450 → 5,786 (+336 dims, +6.2%)
> Files: `modifier-features.ts` (new), `spaces.ts`, `observation.py`, `state_schema.py`

---

## Problem

The RL agent had **zero semantic information** about what items do. Every modifier — from Leftovers (heals 1/16 HP per turn) to Silk Scarf (+20% Normal-type damage) to Focus Sash (survives lethal damage) — was encoded identically as:

```
stack_ratio  = stack_count / max_stack_count   (1 float)
raw_stack    = stack_count / 5                 (1 float)
is_berry     = 0 or 1                          (1 float)
```

3 floats per item. No category, no effect type, no magnitude. The agent could not distinguish between a damage booster and a healing item. Shop decisions were equally blind — reward options had only `tier` (one-hot) and `is_pokemon_modifier` (bool), and shop options had only `cost_ratio` and `affordable`.

This is listed as **U2 (HIGH severity)** in UNSOLVED.md.

---

## Solution: Static Lookup Table + Dynamic Instance Parameters

Following the same architecture as U1 (ability encoding), we created a **hand-authored lookup table** mapping each `modifier_id` string to a fixed 20-dimensional semantic feature vector.

### Why modifier_id (not modifier_class)?

The game has two identity layers for items:

| Context | Key available | Example |
|---|---|---|
| Held items on Pokemon | `modifier_class` (e.g., `"AttackTypeBoosterModifier"`) | From `modifier.constructor.name` |
| Shop/reward options | `modifier_id` (e.g., `"ATTACK_TYPE_BOOSTER"`) | From `modifierType.id` |
| Party/lapsing/enemy | Both `modifier_class` and `modifier_id` | From state-builder |

The `modifier_id` is available in **all** contexts (the state-builder already extracts it for held items, party mods, lapsing, enemy, and shop/reward options), making it the natural lookup key. This avoids needing separate tables for Modifier classes vs ModifierType classes.

### Static vs Dynamic Features

Many modifiers are **parameterized** — the same class serves different instances:

- `AttackTypeBoosterModifier` with `type_id=0` (Normal) vs `type_id=10` (Fire)
- `BaseStatModifier` with `stat_id=1` (ATK) vs `stat_id=3` (SPATK)
- `BerryModifier` with `berry_type=0` (Sitrus) vs `berry_type=3` (Lum)
- `TurnStatusEffectModifier` with `status_effect=3` (Burn) vs `status_effect=5` (Toxic)

The lookup table encodes **what the class does** (static). Instance-specific parameters come from the **JSON state** at encoding time (dynamic). The neural network learns the conjunction — e.g., "this is a damage booster (static) for Fire type (dynamic), and my Pokemon has Fire-type moves (from Pokemon block)."

---

## Feature Schema (20 dimensions)

### Category Flags (indices 0-7, static)

| Idx | Feature | Description |
|-----|---------|-------------|
| 0 | `is_damage_boost` | Boosts move damage (type boosters, crit items, multi-hit) |
| 1 | `is_stat_boost` | Boosts base stats or temporary stat stages |
| 2 | `is_healing` | Restores HP (per-turn, on-hit, potions, revives) |
| 3 | `is_survival` | Prevents fainting (Focus Band, Reviver Seed, enemy endure) |
| 4 | `is_speed_priority` | Bypasses speed check (Quick Claw) |
| 5 | `is_status_effect` | Inflicts or cures status (Flame Orb, Full Heal, enemy status) |
| 6 | `is_economy` | Generates money/EXP/resources (Amulet Coin, Lucky Egg, Rare Candy) |
| 7 | `is_berry` | Is a berry item or preserves berries |

### Dynamic Target Parameters (indices 8-11, from JSON)

| Idx | Feature | Encoding | Source field |
|-----|---------|----------|-------------|
| 8 | `target_type` | `type_id / 18` | `type_id` (PokemonType 0-18) |
| 9 | `target_stat` | `stat_id / 7` | `stat_id` (Stat 0-7) |
| 10 | `status_effect_type` | `status_effect / 7` | `status_effect` (StatusEffect 0-7) |
| 11 | `berry_type` | `berry_type / 12` | `berry_type` (BerryType 0-12) |

### Static Effect Parameters (indices 12-16, static)

| Idx | Feature | Description | Examples |
|-----|---------|-------------|----------|
| 12 | `boost_magnitude` | Normalized effect strength per stack | Leftovers=0.0625, Silk Scarf=0.20, Scope Lens=0.333 |
| 13 | `proc_chance_base` | Trigger probability per stack | Focus Band=0.10, Quick Claw=0.10, King's Rock=0.10 |
| 14 | `is_per_turn` | Triggers each turn end | Leftovers, Toxic Orb, Flame Orb |
| 15 | `is_on_hit` | Triggers on dealing/receiving damage | Shell Bell, King's Rock, Multi Lens |
| 16 | `is_on_faint` | Triggers on faint/lethal | Reviver Seed, Revive, Sacred Ash |

### Dynamic Stack/Duration (indices 17-19, from JSON)

| Idx | Feature | Encoding |
|-----|---------|----------|
| 17 | `stack_count_norm` | `stack_count / max_stack_count` |
| 18 | `stack_count_raw` | `min(stack_count / 10, 1.0)` |
| 19 | `battles_remaining_norm` | `battles_remaining / 10` (lapsing only) |

---

## Lookup Table

109 modifier_ids mapped across 5 categories:

| Category | Count | Examples |
|---|---|---|
| Held items | 36 | ATTACK_TYPE_BOOSTER, LEFTOVERS, SCOPE_LENS, FOCUS_BAND, SHELL_BELL |
| Party-wide | 24 | AMULET_COIN, EXP_SHARE, HEALING_CHARM, BERRY_POUCH, MEGA_BRACELET |
| Lapsing | 6 | TEMP_STAT_STAGE_BOOSTER, DIRE_HIT, LURE, SUPER_LURE, MAX_LURE |
| Enemy | 9 | ENEMY_DAMAGE_BOOSTER, ENEMY_HEAL, ENEMY_ENDURE_CHANCE |
| Consumable | 34 | POTION, REVIVE, RARE_CANDY, POKEBALL, TM_COMMON, EVOLUTION_ITEM |

Unknown modifier_ids fall back to a **default vector** of all zeros.

### Example Entries

```
LEFTOVERS:           [0,0,1,0,0,0,0,0, _,_,_,_, 0.0625, 0,   1,0,0, _,_,_]
                      healing              mag    per_turn

ATTACK_TYPE_BOOSTER: [1,0,0,0,0,0,0,0, _,_,_,_, 0.20,   0,   0,0,0, _,_,_]
                      dmg_boost            mag

FOCUS_BAND:          [0,0,0,1,0,0,0,0, _,_,_,_, 0.10,   0.10,0,0,0, _,_,_]
                      survival             mag    proc

TOXIC_ORB:           [0,0,0,0,0,1,0,0, _,_,_,_, 1.0,    0,   1,0,0, _,_,_]
                      status               mag    per_turn

ENEMY_DAMAGE_BOOSTER:[1,0,0,0,0,0,0,0, _,_,_,_, 0.05,   0,   0,0,0, _,_,_]
                      dmg_boost            mag

(_ = dynamic, filled from JSON at encode time)
```

---

## Encoding Layout

### Held Items (180 dims, was 40)

For each of 4 active Pokemon slots, encode up to **2 held items** (sorted by RL priority):

```
Per slot (45 dims):
  held_item_count / 10                  (1)
  Item 1:
    valid                               (1)
    modifier_features[0..19]            (20)  ← from lookup + JSON
    stack_ratio                         (1)
  Item 2:
    valid                               (1)
    modifier_features[0..19]            (20)
    stack_ratio                         (1)

4 slots × 45 = 180 dims
```

Items are sorted by **RL priority** before encoding:
```
is_damage_boost > is_survival > is_healing > is_stat_boost >
is_speed_priority > is_status_effect > is_berry > is_economy
```
Ties broken by `stack_count` descending.

### Reward Options (84 dims, was 24)

For each of 3 reward slots:

```
Per slot (28 dims):
  valid                                 (1)
  tier one-hot                          (6)   COMMON..MASTER
  is_pokemon_modifier                   (1)
  modifier_features[0..19]              (20)

3 slots × 28 = 84 dims
```

### Shop Options (138 dims, was 36)

Top 6 most affordable shop options (reduced from 12 to save dims):

```
Per slot (23 dims):
  valid                                 (1)
  cost_ratio = cost / money             (1)
  affordable                            (1)
  modifier_features[0..19]              (20)

6 slots × 23 = 138 dims
```

### Party Modifiers (9 dims, was 4)

Aggregate boolean presence flags for 8 key party modifiers:

```
party_mod_count / 20                    (1)
has_healing_charm                       (1)
has_exp_share                           (1)
has_berry_pouch                         (1)
has_money_boost                         (1)   AMULET_COIN or COIN_CASE
has_lock_capsule                        (1)
has_extra_modifier                      (1)
has_mega_access                         (1)
has_tera_access                         (1)
```

### Lapsing Modifiers (23 dims, was 2)

Top 1 lapsing modifier (by battles remaining):

```
lapsing_count / 5                       (1)
valid                                   (1)
modifier_features[0..19]                (20)
battles_remaining / 10                  (1)
```

### Enemy Modifiers (8 dims, was 1)

Aggregate stack counts for 7 known enemy modifier types:

```
enemy_mod_count / 20                    (1)
enemy_damage_boost_stacks / 50          (1)
enemy_damage_reduce_stacks / 50         (1)
enemy_heal_stacks / 20                  (1)
enemy_status_attack_stacks / 20         (1)   per type (poison/paralyze/burn)
enemy_status_heal_stacks / 20           (1)
enemy_endure_stacks / 20               (1)
```

---

## Dimension Summary

| Block | Old | New | Delta |
|---|---|---|---|
| Modifier Phase (shop/rewards) | 62 | 225 | +163 |
| Modifier Inventory (held/party/lapsing/enemy) | 47 | 220 | +173 |
| **Total observation** | **5,450** | **5,786** | **+336 (+6.2%)** |

### Full Observation Breakdown

```
Pokemon:          12 × 431 = 5,172  (unchanged)
Field:                         94   (unchanged)
Battle:                        31   (unchanged)
Modifier Phase:               225   (was 62)
Modifier Inventory:           220   (was 47)
Derived:                       28   (unchanged)
Phase Indicator:               16   (unchanged)
────────────────────────────────────
Total:                      5,786
```

---

## Implementation

### New File: `src/rl/modifier-features.ts`

- `MODIFIER_FEATURES: Record<string, Float32Array>` — 109-entry lookup table
- `DEFAULT_MODIFIER_FEATURES` — 20-element zero vector for unknown IDs
- `encodeModifierFeatures(modifierId, itemDict, buf, pos)` — writes 20 floats (static from lookup + dynamic from JSON)
- `sortByRLPriority(items)` — sorts held items by category flag priority
- Helper `f()` for building 20-dim vectors from 13 static features

### Modified: `src/rl/spaces.ts`

- `encodeModifierFromDict()` — expanded to write 20-dim features for each reward/shop option
- `encodeModifierInventory()` — expanded for held items (top 2 with features), party (8 flags), lapsing (top 1 with features), enemy (7 aggregates)
- Shop options now sorted by cost (most affordable first) and limited to top 6
- New header includes `reroll_cost_ratio`

### Mirrored: `src/rl/observation.py`

- `_MODIFIER_FEATURES: Dict[str, list]` — identical 109-entry lookup
- `_encode_modifier_features()` — identical encoding logic
- All dimension constants match TypeScript exactly

### No Changes: `src/rl/state-builder.ts`

The state builder already extracts `modifier_id`, `type_id`, `stat_id`, `status_effect`, `berry_type`, `stack_count`, and `max_stack_count` for all modifier contexts. U2 only changed how the Float32 encoder **uses** this data.

---

## Verification

| Check | Result |
|---|---|
| TS build (`vite build`) | Pass (16.02s) |
| CLI run (`--waves=2`) | Pass (10 steps, 29.8 steps/sec) |
| TS entry count | 109 |
| Python entry count | 109 |
| 5 key entries spot-checked (LEFTOVERS, ATTACK_TYPE_BOOSTER, FOCUS_BAND, REVIVER_SEED, ENEMY_DAMAGE_BOOSTER) | All match |
| OBSERVATION_DIM | 5,786 in all 3 files |

---

## What the Agent Can Now Understand

**Before U2 (item selection):**
> "I see 3 reward options. Option 0 is tier 2. Option 1 is tier 1. Option 2 is tier 3. I'll pick tier 3 because bigger number = better."

**After U2:**
> "Option 0 is a damage booster for Fire-type (+20% per stack). My lead Pokemon has Flamethrower. Option 1 is Leftovers (heal 1/16 per turn). Option 2 is a Rare Candy (economy/EXP). I'm low on HP and facing a tough wave — I'll take Leftovers."

**Before U2 (battle awareness):**
> "My Pokemon has 3 held items. One is a berry."

**After U2:**
> "My Pokemon holds a Focus Band (survival, 10% proc to survive lethal), a Silk Scarf (damage boost, +20% Normal moves), and both have high stack ratios. The enemy has 5 damage booster stacks (+25% damage) and 3 endure chance stacks."

---

## Team Execution

The U2 pipeline was designed as a 4-phase, 11-task project. A single agent (modifier-class-cataloger) completed all 11 tasks:

1. **Phase 1 (Research)**: Cataloged 68 modifier classes, mapped ModifierType↔Modifier, analyzed encoding gaps, proposed features
2. **Phase 2 (Schema Design)**: Designed frozen 20-feature schema with dimension budgets
3. **Phase 3 (Mapping)**: Mapped all 109 modifier_ids to feature vectors
4. **Phase 4 (Integration)**: Created modifier-features.ts, updated spaces.ts/observation.py/state_schema.py, verified parity
