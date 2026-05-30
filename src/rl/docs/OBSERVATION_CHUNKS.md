# Observation Improvement Chunks

Independent work units derived from the 178-item completeness audit (OBSERVATION_BUILDING.md).
Each chunk is self-contained and can be tackled by a separate agent team.
Chunks are ordered by estimated impact (highest first).

**Estimated remaining: 16 HIGH + 37 MEDIUM + 79 LOW = 132 items, ~1,000 new dims.**

~~**Chunk 1: MoveAttr v7 — COMPLETED** (46 items, +2,208 dims, OBSERVATION_DIM: 7,667→9,875)~~

---

## Chunk 2: Per-Pokemon JSON-to-Float32 Lift

**Items:** A5-M2, A5-M3, A5-M4, A5-M5, A5-L4, A5-L5, A1-H6, A1-H11
**Total:** 8 items
**Est. dims:** +96 (8 fields x 12 Pokemon)
**Priority:** HIGH/MEDIUM mix
**Pattern:** Fields already extracted in state-builder.ts JSON — just need Float32 encoding in spaces.ts and Python mirror.

### Scope
- `spaces.ts` — `encodePokemonFromDict()`: add encoding for these fields
- `observation.py` — `_encode_pokemon()`: mirror
- `state_schema.py` — update POKEMON_BLOCK_DIM and OBSERVATION_DIM
- `state-builder.ts` — NO changes needed (fields already in JSON)

### Fields to encode

| Field | JSON key | Encoding | Source audit item |
|-------|----------|----------|-------------------|
| Switched in this turn | `switched_in_this_turn` | bool -> 1.0/0.0 | A5-M2 |
| Has eaten berry (battle) | `has_eaten_berry` | bool -> 1.0/0.0 | A5-M3 |
| Ability revealed | `ability_revealed` | bool -> 1.0/0.0 | A5-M4 |
| Total damage dealt this turn | `total_damage_dealt` | / max_hp, clamp(0,1) | A5-M5 |
| Endured this wave | `endured_this_wave` | bool -> 1.0/0.0 | A5-L4 |
| Stat stages increased this turn | `stat_stages_increased` | bool -> 1.0/0.0 | A5-L5 |
| Stat stages decreased this turn | `stat_stages_decreased` | bool -> 1.0/0.0 | A5-L5 |
| Is full HP | derived from `hp_ratio` | hp_ratio >= 1.0 -> 1.0/0.0 | A1-H6 |

### Notes
- These are the simplest changes — data already flows through JSON, just needs Float32 encoding
- Can be verified by checking JSON output contains expected keys
- A1-H11 (summonedThisTurn) overlaps with A5-M2 (switchedInThisTurn) — use switchedInThisTurn

---

## Chunk 3: Derived Per-Pokemon Fields

**Items:** A5-H1, A5-H2, A5-M1, A1-H12
**Total:** 4 items
**Est. dims:** +84 (7 fields x 12 Pokemon)
**Priority:** HIGH
**Pattern:** Requires NEW extraction logic in state-builder.ts (derive from existing data), then encode.

### Scope
- `state-builder.ts` — `buildPokemonState()`: add new derived fields
- `spaces.ts` — `encodePokemonFromDict()`: encode new fields
- `observation.py` — `_encode_pokemon()`: mirror
- `state_schema.py` — add fields to PokemonState TypedDict

### Fields to add

| Field | How to derive | Encoding | Dims/pokemon | Source |
|-------|--------------|----------|--------------|--------|
| `consecutive_protect_count` | Iterate `summonData.moveHistory` backward, count consecutive ProtectAttr moves | /3, clamp(0,1) | 1 | A5-H1 |
| `last_move_id` | `summonData.moveHistory[-1].move` or 0 | / MAX_MOVE_ID | 1 | A5-H2 |
| Volatile tag remaining turns (top 5) | Read turn_count from CONFUSED, TAUNT, ENCORE, DISABLED, TRAPPED tags | each /8, clamp(0,1) | 5 | A5-M1 |

### Notes
- `consecutive_protect_count` is the most strategically impactful — game computes it in `ProtectAttr.getCondition()` (move.ts:6648-6665)
- For volatile tag turns, already have tag presence (binary); this adds duration info for the 5 most important tags
- A1-H12 (tempSummonData.turnCount) can also be added here: `turnCount / 50`

---

## Chunk 4: Positional Tags Encoding

**Items:** A3-H1
**Total:** 1 item
**Est. dims:** +10
**Priority:** HIGH
**Pattern:** Data already in JSON `positional_tags` array — needs Float32 encoding in field state block.

### Scope
- `spaces.ts` — `encodeFieldFromDict()`: add positional tag encoding after arena tags
- `observation.py` — `_encode_field()`: mirror
- `state_schema.py` — update FIELD_DIM and OBSERVATION_DIM
- `state-builder.ts` — NO changes (positional_tags already in JSON)

### Encoding design

Per side (player + enemy):
- Wish: `[active, countdown/3, heal_hp_ratio]` = 3 dims
- Future Sight: `[active, countdown/3]` = 2 dims

Total: 5 dims x 2 sides = 10 dims.

### Notes
- `positional_tags` array in JSON has entries with: `tag_type`, `countdown`, `target_index`, `source_id`, `move_id`, `heal_hp`
- Filter by tag_type to find Wish vs Future Sight entries
- countdown is typically 1-2 turns

---

## Chunk 5: Bench Held Items

**Items:** A4-H1
**Total:** 1 item
**Est. dims:** +180 (4 bench slots x top-2 items x 22 dims + counts)
**Priority:** HIGH
**Pattern:** Extend modifier inventory encoding from active-slot only to include bench Pokemon.

### Scope
- `spaces.ts` — modifier inventory section (~line 1141): extend `ACTIVE_SLOT_KEYS` to include bench slots
- `observation.py` — modifier inventory encoding: mirror
- `state_schema.py` — update MODIFIER_INVENTORY_DIM and OBSERVATION_DIM

### Design choices
- Currently: 4 active-slot Pokemon x top-2 items = 8 items encoded (180 dims)
- Option A: Add 4 bench slots x top-2 items = +180 dims (total 360)
- Option B: Add 4 bench slots x top-1 item = +92 dims (total 272)
- Recommend Option A for parity with active slots

### Notes
- Bench Pokemon are player_2, player_3, player_4, player_5 in the JSON state
- Need to handle variable party sizes (may have < 4 bench members)
- state-builder.ts already builds held items for ALL party members — just needs encoding

---

## Chunk 6: Battle State Float32 Lift

**Items:** A3-J3..J10, A3-M5, A3-M6
**Total:** 10 items
**Est. dims:** +8-10
**Priority:** MEDIUM
**Pattern:** Fields already in JSON battle state — just need Float32 encoding.

### Scope
- `spaces.ts` — `encodeBattleFromDict()`: add encoding for these fields
- `observation.py` — `_encode_battle()`: mirror
- `state_schema.py` — update BATTLE_DIM and OBSERVATION_DIM

### Fields to encode

| Field | JSON key | Encoding | Source |
|-------|----------|----------|--------|
| Trainer is_boss | `trainer.is_boss` | bool -> 1.0/0.0 | A3-J3 |
| Trainer party_template_size | `trainer.party_template_size` | /6, clamp(0,1) | A3-J4 |
| Trainer tera_mode | `trainer.tera_mode` | /3, clamp(0,1) | A3-J5 |
| Failed run away | `failed_run_away` | bool -> 1.0/0.0 | A3-J6 |
| Enemy switch counter | `enemy_switch_counter` | /10, clamp(0,1) | A3-J7 |
| Offset gym | `offset_gym` | bool -> 1.0/0.0 | A3-J8 |
| Is spliced only | `is_spliced_only` | bool -> 1.0/0.0 | A3-J9 |
| Has trainers | `has_trainers` | bool -> 1.0/0.0 | A3-J10 |

### Notes
- All of these are already computed by state-builder.ts
- Simplest possible chunk — just add encoding lines and update dim constants

---

## Chunk 7: Modifier Encoding Improvements

**Items:** A4-M1, A4-M2, A4-M3, A4-M4
**Total:** 4 items
**Est. dims:** +28
**Priority:** MEDIUM
**Pattern:** Improve existing modifier encoding sections.

### Scope
- `spaces.ts` — modifier inventory encoding sections
- `observation.py` — modifier inventory encoding
- `state_schema.py` — update dims

### Sub-tasks

**7a. Party modifier stack counts (+5 dims)** (A4-M1)
- Currently: 8 boolean presence flags for party mods
- Change to: 8 float values (stack_count / max_stack_count) instead of booleans
- Net change: 0 new dims, but richer info (stack counts instead of presence)

**7b. Multiple lapsing modifiers (+22 dims)** (A4-M2)
- Currently: top-1 lapsing mod encoded (23 dims total: 1 count + 22 features)
- Change to: top-2 lapsing mods (1 count + 22 features x 2 = 45 dims)
- Net change: +22 dims

**7c. ENEMY_ENDURE_CHANCE (+1 dim)** (A4-M3)
- Add `"ENEMY_ENDURE_CHANCE"` to `ENEMY_MOD_IDS` array in spaces.ts
- Trivial 1-line fix: array goes from 7 to 8 entries
- Net change: +1 dim

**7d. Top-3 held items per Pokemon (+88 dims)** (A4-M4)
- Currently: top-2 items per active-slot Pokemon
- Change to: top-3 items
- Net change: +22 dims x 4 active slots = +88 dims (or +22 x 8 if bench items added in Chunk 5)

---

## Chunk 8: Pokemon Computed Properties (U3-adjacent)

**Items:** A1-H2, A1-H4, A1-H5, A1-H7, A1-M17, A1-M19
**Total:** 6 items
**Est. dims:** +72 to +120 (6-10 fields x 12 Pokemon)
**Priority:** HIGH (but complex — U3 territory)
**Pattern:** Requires calling game methods to compute derived values, then encoding.

### Scope
- `state-builder.ts` — `buildPokemonState()`: call getEffectiveStat(), getCritStage(), etc.
- `spaces.ts` — `encodePokemonFromDict()`: encode computed values
- `observation.py` — mirror
- `state_schema.py` — add fields

### Fields to compute

| Field | Method | Encoding | Complexity | Source |
|-------|--------|----------|------------|--------|
| Effective stats (6) | `getEffectiveStat(stat)` for each of 6 stats | /1000, clamp(0,1) | MEDIUM — stat calc involves stages, abilities, items, weather | A1-H2 |
| Crit stage | `getCritStage(source, move)` | /4, clamp(0,1) | HIGH — requires source+move context | A1-H4 |
| Accuracy multiplier | `getAccuracyMultiplier()` | clamp(0,2) / 2 | MEDIUM | A1-H5 |
| Can apply ability | `canApplyAbility()` | bool -> 1.0/0.0 | LOW | A1-H7 |
| Matchup score | `getMatchupScore(opponent)` | normalize | HIGH — expensive, needs opponent reference | A1-M17 |
| Move type after abilities | `getMoveType(move)` per move | one-hot or /18 | MEDIUM — Normalize/Pixilate/Refrigerate | A1-M19 |

### Notes
- This is the most complex chunk and overlaps with U3 (damage calculator pre-computation)
- `getEffectiveStat()` alone would add 6 dims per Pokemon = 72 dims — very high value
- `getCritStage()` and `getMatchupScore()` need opponent context — harder to extract
- Consider doing just `getEffectiveStat()` + `canApplyAbility()` first, defer others

---

## Chunk 9: Pokemon Misc State Fields

**Items:** A1-H1, A1-H3, A1-H8, A1-H9, A1-H10, A1-M8..M14
**Total:** 12 items
**Est. dims:** +144 (12 fields x 12 Pokemon)
**Priority:** MEDIUM
**Pattern:** Add new fields to state-builder.ts extraction, then encode.

### Scope
- `state-builder.ts` — `buildPokemonState()`: add new extractions
- `spaces.ts` — `encodePokemonFromDict()`: encode
- `observation.py` — mirror
- `state_schema.py` — add fields

### Fields to add

| Field | How to extract | Encoding | Source |
|-------|---------------|----------|--------|
| `switch_out_status` | `pokemon.switchOutStatus` | bool -> 1.0/0.0 | A1-H1 |
| `is_transformed` | `pokemon.summonData.speciesForm !== undefined` or check transform_species_id != 0 | bool -> 1.0/0.0 | A1-H3 |
| `combining_pledge` | `pokemon.turnData.combiningPledge` | /MAX_MOVE_ID or bool | A1-H8 |
| `failed_run_away` | `pokemon.turnData.failedRunAway` | bool -> 1.0/0.0 | A1-H9 |
| `pending_status` | `pokemon.turnData.pendingStatus` | /7 | A1-H10 |
| `evo_counter` | `pokemon.evoCounter` | /10, clamp(0,1) | A1-M8 |
| `pause_evolutions` | `pokemon.pauseEvolutions` | bool -> 1.0/0.0 | A1-M9 |
| `pokerus` | `pokemon.pokerus` | bool -> 1.0/0.0 | A1-M10 |
| `is_allowed_in_battle` | `pokemon.isAllowedInBattle()` | bool -> 1.0/0.0 | A1-M11 |
| `is_allowed_in_challenge` | `isAllowedInChallenge()` | bool -> 1.0/0.0 | A1-M12 |
| `joined_round` | `pokemon.turnData.joinedRound` | bool -> 1.0/0.0 | A1-M14 |
| `growth_rate` | `pokemon.species.growthRate` | /5, clamp(0,1) | A1-M15 |

### Notes
- `is_transformed` might already be derivable from `transform_species_id != 0` in existing obs
- `pending_status` requires reading turnData which resets each turn
- Some fields (evo_counter, growth_rate) are more relevant for long-run strategy than battle tactics

---

## Chunk 10: Fusion Detail Fields

**Items:** A1-M1..M5
**Total:** 5 items
**Est. dims:** +60 (5 fields x 12 Pokemon)
**Priority:** MEDIUM
**Pattern:** Add fusion partner properties to Pokemon encoding.

### Scope
- `state-builder.ts` — `buildPokemonState()`: extract fusion fields
- `spaces.ts` — `encodePokemonFromDict()`: encode
- `observation.py` — mirror
- `state_schema.py` — add fields

### Fields to add

| Field | How to extract | Encoding | Notes |
|-------|---------------|----------|-------|
| `fusion_form_index` | `pokemon.fusionFormIndex` | /50, clamp(0,1) | Form index of fusion partner |
| `fusion_ability_index` | `pokemon.fusionAbilityIndex` | /2 | Ability slot (0/1/2) |
| `fusion_gender` | `pokemon.fusionGender` | /2 (0=M, 1=F, 2=genderless) | Gender of fusion |
| `fusion_tera_type` | `pokemon.fusionTeraType` | /18 | Tera type of fusion component |
| `fusion_luck` | `pokemon.fusionLuck` | /4, clamp(0,1) | Luck of fusion component |

### Notes
- Only relevant when `is_fusion` is true (zeroed otherwise)
- PokeRogue's fusion mechanic is unique to this game — fused Pokemon combine types, stats, abilities
- These fields give the agent visibility into the fusion partner's contribution

---

## Chunk 11: Enemy-Specific Info

**Items:** A6-M1..M3, A6-L1..L3
**Total:** 6 items
**Est. dims:** +5-10
**Priority:** LOW
**Pattern:** Add enemy-specific fields not in current encoding.

### Scope
- `state-builder.ts` — `buildPokemonState()` or `buildBattleState()`: add extractions
- `spaces.ts` / `observation.py` / `state_schema.py`: encode

### Fields

| Field | How to extract | Priority | Notes |
|-------|---------------|----------|-------|
| `ai_type` | `pokemon.aiType` | LOW | Already in JSON; RANDOM=0, SMART_RANDOM=1, SMART=2 |
| `base_exp` | `pokemon.species.baseExp` | MEDIUM | EXP yield on defeat |
| `post_battle_loot` | `battle.postBattleLoot` | MEDIUM | Items dropped on defeat |
| `matchup_scores` | `trainer.getSortedPartyMemberMatchupScores()` | MEDIUM | Predicts enemy switches (expensive) |
| `trainer_slot` | `(pokemon as EnemyPokemon).trainerSlot` | LOW | Which trainer in double battles |
| `initial_team_index` | `(pokemon as EnemyPokemon).initialTeamIndex` | LOW | Original team position |

---

## Chunk 12: Low-Priority Cleanup

**Items:** All remaining LOW items (A1-L1..L19, A2-L1..L27, A3-L1..L14, A4-L1..L8, A5-L1..L8, A6-L1..L3)
**Total:** 79 items
**Est. dims:** variable
**Priority:** LOW

This chunk collects all LOW priority items. These can be cherry-picked individually or batched.
See OBSERVATION_BUILDING.md for full details on each item.

Key sub-groups:
- **A2-L (27 MoveAttr):** Mostly cosmetic/UI attrs, already-captured-by-parent, or extremely niche
- **A1-L (19 Pokemon):** Historical/cosmetic (metLevel, nickname, fusionShiny) or derivable (exp, getInverseHp)
- **A3-L (14 Battle/Field):** maxDuration, battleScore, lastUsedPokeball, etc.
- **A4-L (8 Modifier):** Berry consumed, evo tracker, boost multiplier, heal shop cost
- **A5-L (8 Temporal):** Berry count, abilities applied, combining pledge, faint history
- **A6-L (3 Enemy):** trainerSlot, initialTeamIndex, ai_type

---

## Dependency Map

All chunks are independent — no chunk requires another to be completed first.
However, dimension constants (POKEMON_BLOCK_DIM, OBSERVATION_DIM, etc.) must be updated after each chunk.

```
Chunk 1  (MoveAttr v7)        — COMPLETED (MOVE_BLOCK_DIM 86→132, POKEMON_BLOCK_DIM 587→771, OBSERVATION_DIM 7667→9875)
Chunk 2  (JSON->Float32 lift) — modifies: POKEMON_BLOCK_DIM, OBSERVATION_DIM
Chunk 3  (Derived per-Pokemon) — modifies: POKEMON_BLOCK_DIM, OBSERVATION_DIM
Chunk 4  (Positional tags)    — modifies: FIELD_DIM, OBSERVATION_DIM
Chunk 5  (Bench items)        — modifies: MODIFIER_INVENTORY_DIM, OBSERVATION_DIM
Chunk 6  (Battle Float32)     — modifies: BATTLE_DIM, OBSERVATION_DIM
Chunk 7  (Modifier improve)   — modifies: MODIFIER_INVENTORY_DIM, OBSERVATION_DIM
Chunk 8  (Computed properties) — modifies: POKEMON_BLOCK_DIM, OBSERVATION_DIM
Chunk 9  (Pokemon misc)       — modifies: POKEMON_BLOCK_DIM, OBSERVATION_DIM
Chunk 10 (Fusion detail)      — modifies: POKEMON_BLOCK_DIM, OBSERVATION_DIM
Chunk 11 (Enemy info)         — modifies: POKEMON_BLOCK_DIM or BATTLE_DIM, OBSERVATION_DIM
Chunk 12 (Low-priority)       — modifies: various
```

### Recommended Order
1. ~~Chunk 1 (v7 MoveAttrs) — COMPLETED~~
2. Chunk 3 (Derived fields) — protect count is very high value
3. Chunk 4 (Positional tags) — small, high value
4. Chunk 2 (JSON->Float32 lift) — easy wins, no new extraction
5. Chunk 6 (Battle Float32 lift) — easy wins, no new extraction
6. Chunk 5 (Bench items) — medium complexity
7. Chunk 8 (Computed properties) — complex, U3-adjacent
8. Chunk 7 (Modifier improvements) — medium value
9. Chunk 9 (Pokemon misc) — medium value
10. Chunk 10 (Fusion details) — lower value
11. Chunk 11 (Enemy info) — low value
12. Chunk 12 (Low-priority cleanup) — optional
