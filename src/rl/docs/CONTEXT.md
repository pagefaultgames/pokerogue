# RL Framework Context — Everything You Need to Know

This document is for a fresh agent spawning into this codebase. It covers the project, architecture, conventions, current state, and the next task.

---

## 1. What Is This Project?

**PokeRogue** is a browser-based Pokemon roguelike built with TypeScript and Phaser 3. We are building an **RL (Reinforcement Learning) environment** that wraps the game so an RL agent can play it.

The RL code lives in `src/rl/`. It:
1. Boots the game headlessly (no browser needed)
2. Intercepts decision points (what move to use, which Pokemon to switch to, which item to pick)
3. Serializes the full game state into a flat Float32 observation vector
4. Accepts discrete actions from an external Python agent
5. Computes rewards

The Python agent connects via WebSocket or CLI. The observation space is a fixed-size float32 array. The action space is 58 discrete actions with a validity mask.

---

## 2. The Four-File Architecture

All observation encoding flows through exactly 4 files, always in this order:

```
Game Objects (Pokemon, Move, Arena, Battle)
        ↓
   state-builder.ts    — Extracts game state → JSON dict
        ↓
   spaces.ts           — Encodes JSON dict → Float32Array
        ↓
   observation.py      — Python mirror of spaces.ts (encodes JSON → numpy float32)
        ↓
   state_schema.py     — TypedDict definitions + empty_*_slot() defaults
```

### 2a. `src/rl/state-builder.ts` (~1,500 lines)
- **Role**: Reads live game objects, produces a JSON dict
- **Key functions**: `buildGameState()`, `buildPokemonState()`, `buildMoveSlot()`, `emptyMoveSlot()`, `buildFieldState()`, `buildBattleState()`
- **Pattern**: Uses `safe(() => expr, default)` wrapper for crash-safe extraction
- **Move attrs**: Uses `move.hasAttr("ClassName")` (string-based, uses instanceof internally — catches subclasses)
- **Private fields**: Accessed via `(attr as any).fieldName` — TS-private only, works at JS runtime

### 2b. `src/rl/spaces.ts` (~1,500 lines)
- **Role**: Encodes JSON dict into a flat Float32Array
- **Key functions**: `encodeMoveFromDict()`, `encodePokemonFromDict()`, `encodeFieldFromDict()`, `encodeBattleFromDict()`, `encodeObservation()`
- **Pattern**: `buf[pos++] = value;` for every dimension. Booleans: `buf[pos++] = bool(dict, "key") ? 1.0 : 0.0;`
- **Helpers**: `bool()`, `num()`, `clamp()` are local utilities
- **Dimension constants**: `MOVE_BLOCK_DIM`, `POKEMON_BLOCK_DIM`, `OBSERVATION_DIM` etc.
- **TYPE_EFFECTIVENESS table**: 19×19 float lookup
- **STAGE_MULTIPLIERS**: stat stage → multiplier mapping

### 2c. `src/rl/observation.py` (~2,900 lines)
- **Role**: Python mirror of spaces.ts — must produce identical encoding
- **Key classes**: `ObsMove` (dataclass), `ObsPokemon`, `ObsField`, etc.
- **Key functions**: `_parse_move()`, `_encode_move()`, `_parse_pokemon()`, `_encode_pokemon()`, `encode_observation()`
- **Pattern**: `_gb(d, "key")` for booleans, `_g(d, "key")` for numbers, `float(m.field_name)` for encoding
- **Must match spaces.ts exactly**: Same field names, same order, same encoding logic
- **Also contains**: ABILITY_FEATURES table (311×40), MODIFIER_FEATURES table (109×20)

### 2d. `src/rl/state_schema.py` (~1,300 lines)
- **Role**: TypedDict definitions for type checking, plus `empty_*_slot()` functions
- **Key types**: `MoveSlot`, `PokemonState`, `FieldState`, `BattleState`, `CleanGameState`
- **Key functions**: `empty_move_slot()`, `empty_pokemon_slot()`
- **Dimension constants**: Must match spaces.ts and observation.py

---

## 3. Current Observation State (v7)

```
MOVE_BLOCK_DIM    =  132
POKEMON_BLOCK_DIM =  771
OBSERVATION_DIM   = 9,875
```

### Layout

| Block | Dims | Description |
|-------|------|-------------|
| Pokemon (×12) | 12 × 771 = 9,252 | 6 player + 6 enemy slots |
| Field state | 94 | Weather, terrain, arena tags |
| Battle meta | 40 | Wave, turn, money, game mode flags |
| Modifier phase | 225 | Reward options (3×28) + shop (6×23) + header (3) |
| Modifier inventory | 220 | Held (4×45) + party (9) + lapsing (23) + enemy (8) |
| Derived fields | 28 | Type effectiveness, speed order, HP ratios |
| Phase indicator | 16 | One-hot phase type |
| **Total** | **9,875** | |

### Per-Pokemon (771 dims)
- Non-move features: 243 (stats, types, ability 40×2, status, volatile tags 48, etc.)
- Move slots: 4 × 132 = 528 (50 base + 36 v6 semantic + 46 v7 boolean flags)

### Per-Move (132 dims)
- Base (50): move_id, type, category, power, accuracy, priority, PP, target, flags, stat changes, etc.
- v6 semantic (36): hasAttr booleans (flinch, confuse, recharge, field control, arena tags, battler tags, fixed damage, MoveFlags)
- v7 boolean flags (46): item manipulation, stat manipulation, HP/PP/revival, move-calling, ability manipulation, targeting, status/tag, transform/special, field control, damage calc overrides

---

## 4. Encoding Conventions

### Adding a new field (the pattern for every chunk)

**If the field already exists in JSON** (state-builder.ts already extracts it):
1. `spaces.ts`: Add `buf[pos++] = ...` line in the appropriate encode function
2. `observation.py`: Add field to dataclass, `_parse_*()`, and `_encode_*()`
3. `state_schema.py`: Add to TypedDict and `empty_*_slot()`
4. Update dimension constants in all 3 files

**If the field needs new extraction**:
1. `state-builder.ts`: Add extraction logic in `build*State()` or `buildMoveSlot()`
2. Then do all 4 steps above

### Encoding rules
- Booleans: `1.0` for true, `0.0` for false
- Normalized numbers: divide by max, clamp to [0,1]. E.g., `hp / max_hp`, `stat_stage / 6`
- Enums: divide by max enum value. E.g., `type_id / 18`, `status / 7`
- One-hot: array of 0s with a single 1.0 (used for phase indicator, types)
- IDs: `id / MAX_ID` (lossy but simple)

### Naming conventions
- JSON keys and Python fields: `snake_case` (e.g., `steals_item`, `has_variable_power`)
- TS local variables: `camelCase` (e.g., `stealsItem`, `hasVariablePower`)
- Constants: `UPPER_SNAKE_CASE`

---

## 5. Key Enums & Counts

```
PokemonType:    19 values (0-18: NORMAL..STELLAR), UNKNOWN=-1
StatusEffect:    8 values (0-7: NONE..FAINT)
Stat:            8 values
WeatherType:    10 values
TerrainType:     5 values
ArenaTagType:   28 values (string enum)
ArenaTagSide:    3 values (BOTH=0, PLAYER=1, ENEMY=2)
BattlerTagType: 97 values (string enum)
Nature:         25 values
MoveCategory:    3 values (PHYSICAL, SPECIAL, STATUS)
Abilities:     311 (IDs 0-310)
```

---

## 6. Other Key RL Files

### `src/rl/phase-router.ts` (~1,900 lines)
- Detects decision points in the game loop
- Auto-skips non-decision phases (eggs, evolution, endcard, etc.)
- 14 phase types handled via AUTO_SKIP_PHASES set + 50ms polling
- Key phases: CommandPhase (move/switch), SelectModifierPhase (items), CheckSwitchPhase

### `src/rl/rewards.ts` (~300 lines)
- 14 base reward components + 2 optional shaped rewards (statBoost, statusInfliction)
- Cumulative faint/catch counters (monotonically increasing)
- Wave-transition HP deltas skipped (bug fix)

### `src/rl/cli.ts` (~680 lines)
- CLI entry point for headless runs
- `--log`, `--waves=N`, `--interactive`, `--seed=X`

### `src/rl/headless-boot.ts` (~580 lines)
- Boots Phaser headlessly with mocked canvas/audio
- Sets up i18n, plugins, global scene

### `src/rl/ability-features.ts` (~500 lines)
- ABILITY_FEATURES lookup table: 311 abilities × 40 semantic features
- `encodeAbilityFeatures(abilityId)` → 40 floats

### `src/rl/modifier-features.ts` (~250 lines)
- MODIFIER_FEATURES lookup table: 109 modifier types × 20 semantic features
- `encodeModifierFeatures(modifierId)` → 20 floats
- `sortByRLPriority()` for held item ordering

### `src/rl/enums.py`
- Python-side enum constants (48 curated volatile tags, etc.)

---

## 7. Build & Run

```bash
# Headless build + run
npx vite build --config vite.headless.config.ts
node dist/rl/cli.js --log --waves=5

# Interactive (with Python agent)
node dist/rl/cli.js --interactive --seed=42 --waves=10
python3 tools/play.py

# Rendered (browser + Python agent)
npx vite --config vite.interactive.config.ts
python3 tools/play.py --rendered
```

Build typically takes 15-20s. CLI run with `--waves=3` takes ~500ms (30 steps/sec).

---

## 8. Common Gotchas

### TypeScript/Game
- `ArenaTagSide`: BOTH=0, PLAYER=1, ENEMY=2 (not the other way around)
- `arena.biomeId` (NOT biomeType)
- Pokemon imports: `import type { Pokemon }` (named export, not default)
- `moduleResolution="bundler"` — needs Vite, can't run with tsx directly
- i18n: `LocaleNamespace()` plugin MUST be in headless Vite config
- phaser3-rex-plugins: needs `global.Phaser` set before import

### State Builder
- `move.hasAttr("ClassName")` uses string → class lookup, then `instanceof` (catches subclasses)
- Private fields: `(attr as any).weatherType`, `(attr as any).terrainType` — TS-private only
- `BattlerTagType` string values: `DISABLED` (not DISABLE), `THROAT_CHOPPED`, `SALT_CURED` — always check the enum
- `getEnemyField().filter()` loses slot position — don't filter when you need indices
- Multi-target moves: don't pass explicit targets to handleCommand

### Modifier System
- SelectModifierPhase TMs: use `applyModifierDirectly()` to avoid infinite loops
- Held items sorted by RL priority (damage > survival > healing > stat > ...)

### Phase Router
- AttemptCapturePhase: auto-releases lowest-level Pokemon
- AUTO_SKIP_PHASES handles 14 phase types via 50ms polling
- Seed determinism: override `scene.setSeed()` + `resetSeed()` after creation

### Encoding
- When adding dims, update constants in ALL 3 files: spaces.ts, observation.py, state_schema.py
- `POKEMON_BLOCK_DIM = NON_MOVE_DIM + MOVE_BLOCK_DIM × 4`
- `OBSERVATION_DIM = TOTAL_POKEMON_SLOTS × POKEMON_BLOCK_DIM + FIELD + BATTLE + MODIFIER_PHASE + MODIFIER_INV + DERIVED + PHASE`
- Current: `9875 = 12×771 + 94 + 40 + 225 + 220 + 28 + 16`

---

## 9. Version History

| Version | What changed | Dims |
|---------|-------------|------|
| v1-v3 | Base encoding | 3,583 |
| v4 | Limitations fix sprint (modifiers, phases, rewards) | 4,514 |
| U1 | 40-feature ability encoding (311 abilities) | 5,450 |
| U2 | 20-feature modifier encoding (109 types) | 5,786 |
| v5 | Audit sprint (volatile tags, pokemon fields, battle fields) | 5,939 |
| v6 | Move semantic encoding (36 fields via runtime hasAttr) | 7,667 |
| v7 | MoveAttr boolean flags (46 fields via hasAttr) | 9,875 |

---

## 10. Completeness Audit & Remaining Work

A comprehensive audit found **178 total items** of missing game state info across 6 areas. After completing Chunk 1 (v7 MoveAttr boolean flags), **132 items remain** (16 HIGH + 37 MEDIUM + 79 LOW).

The remaining work is organized into **11 independent chunks** in `src/rl/docs/OBSERVATION_CHUNKS.md`. Each chunk specifies:
- Exact items covered (with IDs from OBSERVATION_BUILDING.md)
- Files to modify
- Encoding approach
- Estimated new dims
- Verification strategy

The full audit details with every individual item are in `src/rl/docs/OBSERVATION_BUILDING.md`.

### Recommended chunk order (next task first)
1. ~~Chunk 1 (v7 MoveAttrs) — COMPLETED~~
2. **Chunk 3 (Derived per-Pokemon fields)** — protect count, last move, volatile tag turns (+84 dims)
3. **Chunk 4 (Positional tags)** — Future Sight/Wish encoding (+10 dims)
4. **Chunk 2 (JSON→Float32 lift)** — 8 fields already in JSON, just need encoding (+96 dims)
5. **Chunk 6 (Battle Float32 lift)** — 10 fields already in JSON (+8-10 dims)
6. Chunk 5 (Bench held items) — +180 dims
7. Chunk 8 (Computed properties) — complex, U3-adjacent
8. Chunk 7 (Modifier improvements) — +28 dims
9. Chunk 9 (Pokemon misc state) — +144 dims
10. Chunk 10 (Fusion details) — +60 dims
11. Chunk 11 (Enemy info) — +5-10 dims
12. Chunk 12 (Low-priority cleanup) — 79 items, variable dims

---

## 11. How We Execute Chunks (Team Pattern)

Each chunk follows this workflow:

### Phase 1: Research & Schema
1. Read OBSERVATION_CHUNKS.md for the chunk spec
2. Read OBSERVATION_BUILDING.md for detailed item descriptions
3. Verify that referenced game properties/methods actually exist in source code
4. Create a frozen schema at `/tmp/<chunk>-work/schema.md` defining exact field names, types, defaults, encoding rules, and updated dim constants

### Phase 2: Implementation (4 parallel agents)
- **I1**: `state-builder.ts` — extraction logic (if needed; some chunks skip this)
- **I2**: `spaces.ts` — Float32 encoding + dim constant updates
- **I3**: `observation.py` — Python mirror (dataclass + parse + encode + dim constants)
- **I4**: `state_schema.py` — TypedDict + empty_*_slot() + dim constants

### Phase 3: Verification (5-10 parallel agents)
- **V1**: Dim counting across all files
- **V2**: TS↔Python parity (field names, order, encoding)
- **V3-V7**: Spot-check agents verifying specific game data produces expected values
- **V8**: Build + CLI run
- **V9**: Empty slot completeness
- **V10**: Schema compliance

### Key principles
- **Frozen schema**: All implementation agents work from the SAME spec document
- **Parallel implementation**: Each agent owns exactly one file, no conflicts
- **Thorough verification**: Multiple independent agents check different aspects
- **Build gate**: Nothing ships without a successful `npx vite build` + `node dist/rl/cli.js`

---

## 12. Important Source Files Outside src/rl/

### Game data (read-only reference for our work)
- `src/data/moves/move.ts` (~9,000 lines) — Move class, all MoveAttr subclasses, hasAttr/getAttrs methods
- `src/data/moves/init-move.ts` (~huge) — Every move defined with `.attr()` chains
- `src/data/abilities/ability.ts` — Ability class
- `src/data/abilities/ab-attrs.ts` (~6,000 lines) — All AbAttr subclasses
- `src/data/abilities/init-abilities.ts` (~2,200 lines) — All 311 abilities defined

### Core game objects
- `src/field/pokemon.ts` — Pokemon class (stats, moves, abilities, volatile tags, etc.)
- `src/field/arena.ts` — Arena class (weather, terrain, arena tags, positional tags)
- `src/battle.ts` — Battle class (turn commands, faint history, etc.)
- `src/global-scene.ts` — `globalScene` singleton

### Enums
- `src/enums/` — PokemonType, StatusEffect, Stat, WeatherType, TerrainType, ArenaTagType, BattlerTagType, Nature, MoveId, AbilityId, etc.
- Path alias: `#enums/stat` → `src/enums/stat`

---

## 13. What NOT to Do

- **Don't modify game code** (anything outside `src/rl/`, `test/rl/`, `tools/`, or config files)
- **Don't break the 4-file pattern** — all observation data flows through the same pipeline
- **Don't add dims without updating ALL 3 files** (spaces.ts, observation.py, state_schema.py)
- **Don't guess BattlerTagType values** — always check the enum source
- **Don't use `getEnemyField().filter()`** when you need slot positions
- **Don't import MoveAttr classes** in state-builder.ts — use string-based `hasAttr("ClassName")`
- **Don't forget `emptyMoveSlot()` / `empty_move_slot()`** — must include every new field
- **Don't skip the schema step** — ad-hoc implementation across 4 files without a shared spec causes mismatches

---

## 14. Quick Reference: Dimension Derivation

```
NON_MOVE_DIM = 243
MOVE_BLOCK_DIM = 132
POKEMON_BLOCK_DIM = NON_MOVE_DIM + MOVE_BLOCK_DIM × 4 = 243 + 528 = 771
TOTAL_POKEMON_SLOTS = 12

OBSERVATION_DIM =
  TOTAL_POKEMON_SLOTS × POKEMON_BLOCK_DIM  (9,252)
  + FIELD_STATE_DIM                        (94)
  + BATTLE_META_DIM                        (40)
  + MODIFIER_PHASE_DIM                     (225)
  + MODIFIER_INVENTORY_DIM                 (220)
  + DERIVED_FIELDS_DIM                     (28)
  + PHASE_INDICATOR_DIM                    (16)
  = 9,875
```

When adding new per-Pokemon dims (most chunks), the cascade is:
1. Add N fields → POKEMON_BLOCK_DIM += N
2. OBSERVATION_DIM += N × 12 (12 Pokemon slots)

When adding field/battle/modifier dims, OBSERVATION_DIM increases by the exact count added.
