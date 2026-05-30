# PokéRogue RL Framework — Complete Limitations & Gaps Log

> Generated: 2026-02-09 by 20-agent completeness audit team
> Pipeline audited: Game Objects → state-builder.ts → state_schema.py → spaces.ts
> Scope: Observation space, action space, phase handling, reward signals, encoding gaps

---

## Table of Contents

1. [Bugs — Incorrect Data Being Produced](#1-bugs--incorrect-data-being-produced)
2. [Unhandled Phases — Game Can Hang](#2-unhandled-phases--game-can-hang)
3. [Float32 Encoding Gaps — In Schema But Not Encoded](#3-float32-encoding-gaps--in-schema-but-not-encoded)
4. [Schema/Builder Gaps — Not Captured At All](#4-schemabuilder-gaps--not-captured-at-all)
5. [Information Asymmetry — Human vs Agent](#5-information-asymmetry--human-vs-agent)
6. [Action Space Limitations](#6-action-space-limitations)
7. [Reward Signal Gaps](#7-reward-signal-gaps)
8. [Edge Case Mechanics](#8-edge-case-mechanics)
9. [Recommendations — Prioritized](#9-recommendations--prioritized)

---

## 1. Bugs — Incorrect Data Being Produced

These are fields that exist in the schema and builder but produce **wrong values**.

### P0 — Critical (wrong data silently used)

| # | Bug | File | Line | Impact |
|---|-----|------|------|--------|
| B1 | **positional_tags hardcoded to `[]`** | state-builder.ts | ~798 | Future Sight, Doom Desire, and Wish are completely invisible to the RL agent. `arena.positionalTagManager.tags` is PUBLIC and accessible. Comment says "not easily accessible" — this is incorrect. |
| B2 | **challenge_type always 0** | state-builder.ts | ~913 | Builder reads `c.challengeType` but the Challenge class has `c.id` (type `Challenges` enum), not `challengeType`. Every challenge reads as type 0. |
| B3 | **biome_id always 0 in battle block encoding** | spaces.ts | ~681 | `encodeBattleFromDict()` reads `num(battle, "biome_id", num(battle, "biome_type"))` but `buildBattleState()` does NOT output `biome_id` — it's in `buildFieldState()`. Always falls through to 0. Biome IS correctly encoded in the field block, but the battle block silently has a dead 0. |

### P1 — Significant (wrong data, less critical)

| # | Bug | File | Line | Impact |
|---|-----|------|------|--------|
| B4 | **failed_run_away always false** | state-builder.ts | ~970 | Reads `pokemon.turnData.failedRunAway` (doesn't exist). Should read `globalScene.currentBattle.failedRunAway`. |
| B5 | **ignore_abilities hardcoded to false** | state-builder.ts | ~816 | Comment says "Complex to detect" but `arena.ignoreAbilities` is a direct boolean property. Should read `arena.ignoreAbilities ?? false`. |
| B6 | **challenge_name uses constructor name** | state-builder.ts | ~914 | Uses `c.constructor.name` instead of the proper display name from the Challenge class. Produces minified class names in production builds. |
| B7 | **PartyModifier type_id/stat_id/status_effect always null** | state-builder.ts | ~1003 | `buildPartyModifier()` hardcodes these to null. `EnemyAttackStatusEffectChanceModifier` has `.effect` that should populate `status_effect`. |
| B8 | **RewardOption/ShopOption description always ""** | state-builder.ts | ~1143 | Description field hardcoded to empty string. A human reads "Boosts Normal-type moves by 20%" — the agent sees nothing. |
| B9 | **RewardOption/ShopOption type_id/stat_id always null** | state-builder.ts | ~1143 | These fields were added in v5 audit but never wired to actual modifier type data. |
| B10 | **reroll_count hardcoded to 0** | state-builder.ts | ? | `BattleState.reroll_count` always 0. Reroll count is tracked on the `SelectModifierPhase` instance but not accessible from `buildBattleState()`. |

---

## 2. Unhandled Phases — Game Can Hang

Phases where the game waits for player input but the phase-router doesn't detect or handle them.

### P0 — Game Hangs

| # | Phase | File | Trigger | Impact |
|---|-------|------|---------|--------|
| PH1 | **AttemptCapturePhase** | attempt-capture-phase.ts | Player catches a wild Pokemon with a full party of 6 | Multi-step UI: CONFIRM → SUMMARY → PARTY (pick which to release). None detected by router. **Game hangs permanently.** |

### P1 — Game Blocks (may auto-resolve in headless, blocks in browser)

| # | Phase | File | Trigger | Impact |
|---|-------|------|---------|--------|
| PH2 | **EggLapsePhase** | egg-lapse-phase.ts | Eggs ready to hatch + skip preference = "ask" | UiMode.CONFIRM blocks. In headless MockText may auto-complete; in browser, hangs. |
| PH3 | **EggHatchPhase** | egg-hatch-phase.ts | Spawned by EggLapsePhase | UiMode.EGG_HATCH_SCENE requires ACTION to skip animation. |
| PH4 | **EggSummaryPhase** | egg-summary-phase.ts | After skipped egg hatches | UiMode.EGG_HATCH_SUMMARY requires ACTION to dismiss. |
| PH5 | **EndCardPhase** | end-card-phase.ts | Classic mode victory | Shows congratulations, waits for ACTION. Blocks progression to PostGameOverPhase. |
| PH6 | **UnlockPhase** | unlock-phase.ts | First Classic victory (unlocks Endless/Spliced) | Shows "unlocked X" message, waits for ACTION. Blocks progression. |

### P2 — Suboptimal but may auto-resolve

| # | Phase | File | Trigger | Impact |
|---|-------|------|---------|--------|
| PH7 | **EvolutionPhase cancel/pause dialog** | evolution-phase.ts | Evolution + "pause evolutions" confirm | UiMode.CONFIRM for pause not handled. Auto-accept works but can't cancel. |
| PH8 | **ModifierRewardPhase** | modifier-reward-phase.ts | "Obtained X" messages | showText with prompt=true. Auto-completes in headless, blocks in browser. |
| PH9 | **RibbonModifierRewardPhase** | ribbon-modifier-reward-phase.ts | Classic first clear | Same blocking pattern as ModifierRewardPhase. |
| PH10 | **GameOverModifierRewardPhase** | game-over-modifier-reward-phase.ts | Victory rewards | Same blocking pattern. |
| PH11 | **MoneyRewardPhase** | money-reward-phase.ts | "Won X money" after trainer battles | Same blocking pattern. |
| PH12 | **TrainerVictoryPhase** | trainer-victory-phase.ts | Trainer defeat dialogue | showText/showDialogue callbacks. May auto-complete in headless. |
| PH13 | **LevelCapPhase** | level-cap-phase.ts | "Level cap raised to X" | Same blocking pattern. |

### P3 — Not reachable in normal RL flow

| # | Phase | File | Trigger | Impact |
|---|-------|------|---------|--------|
| PH14 | SelectChallengePhase | select-challenge-phase.ts | Challenge mode only | RL uses Classic mode. |
| PH15 | LoginPhase | login-phase.ts | No session | RL uses bypassLogin=true. |
| PH16 | UnavailablePhase | unavailable-phase.ts | API server down | Not reachable in headless. |

---

## 3. Float32 Encoding Gaps — In Schema But Not Encoded

Fields that exist in `state_schema.py` and are correctly populated by `state-builder.ts` but are **NOT** present in the 3,583-dim Float32 observation vector (`spaces.ts`).

### 3.1 Pokemon State (per-slot, 283 dims currently)

**HIGH relevance — missing from encoding:**

| Field | Dims needed | Why it matters |
|-------|-------------|---------------|
| `move_queue` | ~8 (2 queued × 4 fields) | Encore lock, two-turn charging, Outrage commitment |
| `is_trapped` | 1 | Cannot switch — fundamentally changes decision |
| `is_grounded` | 1 | Terrain/hazard interaction |
| `attacks_received` (turn) | ~12 | Recent damage sources for threat assessment |
| `move_history` | ~8 | Recent moves used — predicting opponent |
| `held_items` detail | ~20+ | Item identity and effects (currently only count) |
| `volatile_tag` details | ~10+ | Substitute HP, Encore move, Disabled move, Stockpile count |
| `turn_data.damage_taken` | 1 | Already encoded (normalized by maxHP) |
| `battle_data.hit_count` | 1 | Rage Fist power scaling |
| `ability_suppressed` | 1 | Gastro Acid state |

**MEDIUM relevance — missing from encoding:**

| Field | Why it matters |
|-------|---------------|
| `species_id` | Species identity (indirectly captured by stats/types/ability) |
| `gender` | Attract/Rivalry interaction |
| `friendship` | Return/Frustration power |
| `wave_turn_count` | Turns active this wave |
| `stellarTypesBoosted` | Stellar tera strategy |
| `transform_species_id` | Transform disguise |
| `illusion_species_id` | Zoroark active |
| `weight` | Low Kick / Heavy Slam damage |
| `catch_rate` | Catch probability calculation |
| `exp_to_next_level` | Rare Candy / EXP Share value |
| `luck` | Shop modifier tier quality |
| `battle_data.has_eaten_berry` | Belch usability |
| `battle_data.berries_eaten` | Harvest availability |
| `berries_eaten_last` | Cud Chew re-eat |
| `endured_this_wave` | Focus Band already triggered |

### 3.2 Field State (83 dims currently)

| Field | Dims needed | Why it matters |
|-------|-------------|---------------|
| `positional_tags` | ~8 | Future Sight/Wish incoming (NOT populated — Bug B1) |
| Arena tag `turn_count` per tag | ~28 | Screen/Tailwind/Trick Room remaining turns (only binary presence encoded) |
| `player_teras_used` | 1 | Tera budget for battle |
| `ignore_abilities` | 1 | Mold Breaker active (NOT populated — Bug B5) |

### 3.3 Battle State (26 dims currently)

| Field | Dims needed | Why it matters |
|-------|-------------|---------------|
| `battle_spec` | 1 | FINAL_BOSS flag — changes boss behavior dramatically |
| `game_mode` | 1 | Classic vs Endless vs Challenge |
| `is_double` | 1 | Already in field block as `is_double_battle` — redundant but could clarify |
| `trainer` info | ~5 | Specialty type, tera mode, boss status |
| `last_move_id` | 1 | Last move used (Copycat, Mirror Move) |
| `seen_enemy_count` | 1 | Trainer party size revealed |
| `has_no_shop` | 1 | Shop availability |
| `reroll_count` | 1 | Reroll cost tracking (NOT populated — Bug B10) |
| `challenges` | ~4 | Active challenge modifiers |

### 3.4 Modifier Block (62 dims currently) — **CRITICAL GAP**

The 62-dim modifier block ONLY encodes `ShopState` (the reward/shop UI during SelectModifierPhase). **The player's actual modifier inventory is NOT encoded at all.**

| Missing | Impact |
|---------|--------|
| `held_items` per Pokemon | Agent can't see what items party members have |
| `party_modifiers` | Agent can't see EXP Share, Lucky Egg, etc. |
| `lapsing_modifiers` | Agent can't see X Attack/Max Lure remaining battles |
| `enemy_modifiers` | Agent can't see enemy stat boosts |
| Reward `modifier_id`/`modifier_class` | Agent can't distinguish items by type |
| Reward `type_id`/`stat_id` | Agent can't evaluate item value |
| Shop `tier`/`modifier_class` | Agent sees cost+affordable only |

### 3.5 Move Encoding (37 dims per move currently)

| Missing flag | Why it matters |
|-------------|---------------|
| `move.target` (MoveTarget enum) | Multi-target vs single-target — critical for doubles |
| `status_effect` | Can't distinguish Scald (30% burn) from Water Gun |
| `stat_changes` | Can't see Swords Dance → +2 ATK, Close Combat → -1 DEF/SPDEF |
| `recoil_ratio` | Can't evaluate Brave Bird recoil risk |
| `is_ohko` | Sheer Cold / Fissure — very different from normal moves |
| `is_charging` | Two-turn moves (Solar Beam, Fly) — commitment risk |
| `is_sacrifice` | Explosion / Memento — user faints |
| `crit_stage_boost` | Slash/Stone Edge high-crit moves |
| `ignores_protect` | Feint, Shadow Force bypass |
| `is_sound_based` | Soundproof interaction |
| `is_biting`/`is_punching`/`is_slicing` | Strong Jaw, Iron Fist, Sharpness ability interactions |
| `is_pulse` | Mega Launcher interaction |
| `is_dance` | Dancer ability interaction |
| `ignores_abilities` | Mold Breaker-like move effects |
| `ignores_substitute` | Can hit through substitutes |
| `fixed_damage` | Dragon Rage/Sonic Boom — ignores stats |
| `multi_hit_type` | Distinguish Bullet Seed (2-5) from Double Kick (2) |

---

## 4. Schema/Builder Gaps — Not Captured At All

Properties that exist on game objects but are missing from `state_schema.py` AND `state-builder.ts`.

### 4.1 Pokemon Properties

| Property | Source | RL Relevance |
|----------|--------|-------------|
| `hitsLeft` | `turnData.hitsLeft` | LOW — remaining hits in multi-hit (transient) |
| `singleHitDamageDealt` | `turnData.singleHitDamageDealt` | LOW — single hit damage for recoil calc |
| `fusionSpeciesForm` | `summonData.fusionSpeciesForm` | LOW — fusion transform state |
| `fusionGender` | `summonData.fusionGender` | LOW |
| `tempSummonData.turnCount` | Total turns without switching | LOW — UI cursor only |
| `MoveFlag.RECKLESS_MOVE` | MoveFlags bit | MEDIUM — Reckless ability interaction |
| `MoveFlag.WIND_MOVE` | MoveFlags bit | MEDIUM — Wind Rider/Wind Power interaction |
| `MoveFlag.TRIAGE_MOVE` | MoveFlags bit | LOW — Triage ability (+3 priority to healing) |
| `RecoilAttr.useHp` | boolean | MEDIUM — distinguishes HP-fraction recoil (Struggle) from damage-fraction recoil |
| `MultiStatusEffectAttr.effects` | StatusEffect[] | MEDIUM — Tri Attack random status (schema only captures first) |

### 4.2 Ability Properties

| Property | RL Relevance |
|----------|-------------|
| `ability.attrs` (effect list) | HIGH — 130+ AbAttr subclasses define what abilities DO |
| `ability.ignorable` | MEDIUM — whether ability can be bypassed by Mold Breaker |
| `canApplyAbility()` (computed) | HIGH — whether ability is currently active |
| `canApplyPassive()` (computed) | HIGH — whether passive ability is active |
| `passive_ability_suppressed` | HIGH — separate from `ability_suppressed` |

### 4.3 Arena Properties

| Property | RL Relevance |
|----------|-------------|
| `ArenaTag.maxDuration` | LOW — original duration vs remaining |
| `ArenaTag.sourceMove` (MoveId) | LOW — tag_type implies source move |

---

## 5. Information Asymmetry — Human vs Agent

### 5.1 Knowledge a Human Has That the Agent Must Learn

| Knowledge | In Observation? | Impact |
|-----------|----------------|--------|
| **Type effectiveness chart** (19×19 table) | NO — must learn from rewards | **CRITICAL** — single largest implicit gap |
| **Ability effects** (what does Intimidate DO?) | NO — only ability_id encoded | **CRITICAL** — 130+ effects to learn |
| **Item effects** (what does Silk Scarf DO?) | NO — only item count/tier | **HIGH** — can't evaluate shop decisions |
| **Move secondary effects** (Scald = 30% burn) | PARTIAL — effect_chance encoded, status not | **HIGH** — can't distinguish moves with same power |
| **Damage estimate ranges** | NO — must compute from stats/power/type | **HIGH** — humans quickly estimate "this OHKOs" |
| **Speed ordering** (who moves first) | NO — must compute from stats/stages/items/abilities | **HIGH** — critical for battle strategy |
| **Species identity** (Charizard vs Pidgeot) | NO — only stats/types/ability indirectly | **MEDIUM** — species implies moveset/ability pool |

### 5.2 Information the Agent Has That Humans Don't

| Information | Source |
|-------------|--------|
| Exact IVs of all Pokemon (including enemies) | `PokemonState.ivs` |
| Exact stat stages as numbers | `PokemonState.stat_stages` |
| Exact HP values (not just bar color) | `PokemonState.hp`, `hp_ratio` |
| Enemy party bench Pokemon | `enemy_2` through `enemy_5` |
| All AI type information | `PokemonState.ai_type` |
| Exact PP remaining for all moves | `MoveSlot.pp_remaining` |

### 5.3 Recommendations for Pre-Computed Derived Fields

These could be added to the observation to close the human-agent knowledge gap:

1. **Type effectiveness multiplier** per move-target pair (~8 floats per active Pokemon)
2. **Estimated damage range** (min/max/avg) per move-target pair (~24 floats)
3. **Speed ordering** (which Pokemon moves first) (~4 floats)
4. **STAB indicator** per move (does this move get Same Type Attack Bonus?) (~4 floats)
5. **Item effect category** encoding (damage boost / healing / survival / economy / utility)

---

## 6. Action Space Limitations

Current: 58 discrete actions with validity mask.

### 6.1 Covered Actions (working correctly)

| Phase | Actions | Coverage |
|-------|---------|----------|
| CommandPhase (fight) | 0-11 (move×target) | Full for singles, partial for doubles |
| CommandPhase (switch) | 12-16 | Full |
| CommandPhase (ball) | 17-21 | Full |
| CommandPhase (run) | 22 | Full |
| CommandPhase (tera) | 23-34 (tera+move×target) | Full |
| SelectModifierPhase (reward) | 35-37 | Full |
| SelectModifierPhase (reroll) | 38 | Full |
| SelectModifierPhase (skip) | 39 | Full |
| SelectModifierPhase (shop) | 40-51 | Full |
| Party target | 52-57 | Full |

### 6.2 Gaps and Limitations

| Issue | Severity | Notes |
|-------|----------|-------|
| **LearnMovePhase multi-step** | MEDIUM | First step: confirm learn (yes/no = action 39 skip vs any other). Second step: pick which of 4 moves to replace. Current action space reuses fight actions 0-3 for slot selection, but this is a two-step sequence within one "phase". |
| **MysteryEncounter options > 4** | LOW | Most encounters have 2-3 options. Action space supports up to 4 (reusing reward actions). If any encounter has >4, overflow. |
| **Evolution cancel** | LOW | Currently auto-accepted. No action to cancel evolution. |
| **CheckSwitchPhase** | LOW | Currently auto-declined. Could expose as RL decision with accept/decline. |
| **Ally targeting in doubles** | MEDIUM | Actions 8-11 target ally. But for moves targeting `USER_OR_NEAR_ALLY`, the agent can't choose between self and ally. |
| **Move target type** not in observation | HIGH | Agent can't see whether a move is ALL_NEAR_ENEMIES (no target needed) vs NEAR_ENEMY (target needed). Must infer from action mask. |

---

## 7. Reward Signal Gaps

### 7.1 Reward Bugs

| # | Bug | Severity | Impact |
|---|-----|----------|--------|
| RB1 | **HP deltas miss wave transitions** — enemy HP comparison across wave boundaries compares OLD enemies vs NEW enemies, producing incorrect damage-dealt rewards | MEDIUM | Reward spikes/dips at wave transitions |
| RB2 | **playerFaints counts current fainted, not cumulative** — revived Pokemon reduce faint count, potentially producing negative faint deltas (rewarding faints) | LOW-MEDIUM | Rare but incorrect reward signal |
| RB3 | **pokemonCaught based on party size delta** — unreliable when party is already full | LOW | Catch reward may not fire correctly |
| RB4 | **Boss wave detection off-by-one** — waveCleared only rewards once even for multi-wave skips | LOW | Rare in practice |

### 7.2 Missing Reward Signals

| Aspect | Currently Rewarded? | Importance | Notes |
|--------|-------------------|------------|-------|
| **Setup move value** (Swords Dance, Calm Mind) | NO | **HIGH** | Stat boosts produce zero immediate HP delta + turn penalty. Agent learns to never use setup moves. Classic credit assignment problem. Consider +0.1 per stat stage increased. |
| **Item acquisition value** | PARTIAL (tier bonus) | HIGH | modifierTierBonus rewards higher tiers, but agent can't distinguish WHICH item is valuable. Silk Scarf vs Lucky Egg have same tier. |
| **Status infliction** | NO (delayed via HP chip) | MEDIUM | Burn/poison chip captured over turns. Sleep/paralysis reduce enemy damage indirectly. Delayed reward signal — harder to learn. |
| **Economy management** | NO | MEDIUM | moneyGained rewards earning, but spending wisely vs wastefully isn't differentiated. |
| **Hazard control** | NO | MEDIUM | Setting Stealth Rock has delayed value. Clearing hazards prevents damage. No immediate HP change. |
| **Type advantage** | Implicit via HP delta | LOW | Super-effective moves deal more damage → larger HP delta. No separate signal needed. |
| **Speed control** | NO | LOW | Tailwind/Trick Room have delayed strategic value. Hard to reward without being prescriptive. |
| **Boss shield breaking** | Implicit via HP delta | LOW | Shield breaks enable HP damage. Multi-hit for shields implicitly rewarded. |
| **Catch success** | YES (+3.0) | LOW | Already covered. |
| **Wave progression** | YES (waveCleared bonus) | LOW | Already covered. |

### 7.3 Reward Density Assessment

The reward signal is **moderately dense** — HP deltas fire every step, turn penalties are continuous. However, several strategically important actions (setup moves, hazard setting, status infliction) have **zero or negative immediate reward** despite being optimal play. This creates a significant credit assignment challenge for RL training. Potential mitigations:

1. **Shaped rewards for stat-boosting moves** (+0.1 per stage) — highest impact
2. **Item evaluation reward** (bonus for picking items that match team needs)
3. **Temporal difference targets** that span multiple steps for delayed effects

---

## 8. Edge Case Mechanics

### 8.1 Full Mechanic Coverage Table (20-agent audit)

| # | Mechanic | Obs Coverage | Action Coverage | Impact | Critical Gaps |
|---|----------|-------------|----------------|--------|---------------|
| 1 | Mega Evolution | Partial (via FormChangePhase) | Auto-handled | LOW | form_index not in Float32 — can't distinguish mega from base |
| 2 | Z-Moves | N/A | N/A | N/A | Not in PokéRogue |
| 3 | Dynamax/Gigantamax | Partial | NO explicit action | LOW | GigantamaxAccessModifier exists; form changes auto-handled |
| 4 | **Terastallization** | **Full** | **Full** | HIGH | stellar_types_boosted missing from Float32 |
| 5 | Multi-hit moves | Partial | Full | MEDIUM | multi_hit_type in schema/not Float32 |
| 6 | Two-turn moves | Partial | Full | MEDIUM | is_charging in schema/not Float32; FLYING/UNDERGROUND tags ARE encoded |
| 7 | **Encore/Disable/Taunt** | **Full** | **Full** | HIGH | Correctly handled — is_usable reflects restrictions |
| 8 | **Choice items** | **Full** | **Full** | HIGH | GorillaTacticsTag + is_usable mask. Item identity not in Float32 |
| 9 | Focus Sash/Sturdy | Partial | N/A | MEDIUM | endured_this_wave not in Float32 |
| 10 | Destiny Bond/Perish Song | Partial | N/A | LOW | Binary tag presence; no countdown in Float32 |
| 11 | **Future Sight/Wish** | **NONE** | N/A | **MEDIUM** | **BUG: positional_tags always empty** |
| 12 | Baton Pass chains | Full | Full | LOW | Stats/tags transfer correctly post-switch |
| 13 | Transform/Imposter | Full | Full | MEDIUM | Transformed moveset reflected in getMoveset() |
| 14 | Illusion/Zoroark | Partial | N/A | LOW | illusion_species_id in schema/not Float32 |
| 15 | **Ability interactions** | **Partial** | N/A | **HIGH** | **ability_id /310 float is unusable for neural net** |
| 16 | Mold Breaker/Teravolt | Partial | N/A | MEDIUM | ignore_abilities hardcoded false (Bug B5) |
| 17 | **Doubles mechanics** | Partial | Partial | **HIGH** | FOLLOW_ME + HELPING_HAND not in curated 32 tags |
| 18 | **Boss mechanics** | Full | **Partial** | **HIGH** | **Ball mask doesn't check shield segments** |
| 19 | Fusion Pokemon | Full | N/A | LOW | Combined state correct; decomposition unavailable |
| 20 | Catch mechanics | Full | Full | MEDIUM | Ball-specific multipliers not in observation |

### 8.2 Missing Volatile Tags (not in curated 32-tag list)

These strategically significant tags are counted in `other_tag_count` but not individually detectable:

| Tag | Why It Matters |
|-----|---------------|
| `CENTER_OF_ATTENTION` (Follow Me/Rage Powder) | Redirects all moves to this target — critical in doubles |
| `HELPING_HAND` | +50% damage to ally's next move — important doubles info |
| `SLOW_START` | Regigigas: halved ATK/SPD for 5 turns |
| `UNBURDEN` | Doubled speed after item consumption |
| `RECEIVE_DOUBLE_DAMAGE` (Tar Shot) | Target takes 2x fire damage |
| `MAGNET_RISE` | Immunity to ground for 5 turns |
| `ALWAYS_CRIT` (Laser Focus) | Guaranteed crit next move |

### 8.3 Damage/Speed Computability from Observation

| Formula | Computability from Float32 | Computability from JSON | Critical Gaps |
|---------|--------------------------|------------------------|---------------|
| Damage calc | ~80% | ~95% | Float32 missing: computed stats (only base_stats), held item effects, Choice Band/Specs multiplier |
| Speed/Turn order | ~75% | ~90% | Float32 missing: computed stats, Choice Scarf, Slow Start/Unburden tags |
| Type effectiveness | ~85% | ~95% | Type chart is static knowledge agent must learn; ability immunities need ability_id interpretation |
| Accuracy | ~80% | ~90% | Stat stages present; ability/item modifiers opaque in Float32 |
| Critical hit rate | ~60% | ~80% | crit_stage_boost not in Float32; Focus Energy/Scope Lens need identification |
| Catch rate | ~85% | ~95% | Ball-specific multipliers not provided; catch formula complex |
| EXP gain | ~40% | ~60% | base_exp not in schema at all |
| Modifier reroll value | ~65% | ~80% | Pool probability distribution requires game algorithm knowledge |

**Key insight**: Encoding **computed stats** (not just base_stats) into Float32 would significantly improve damage and speed computability (~80% → ~95%).

---

## 9. Recommendations — Prioritized

### Tier 1 — Fix Now (bugs producing wrong data)

1. **Fix positional_tags** (B1) — serialize `arena.positionalTagManager.tags`
2. **Fix challenge_type** (B2) — read `c.id` not `c.challengeType`
3. **Fix failed_run_away** (B4) — read from `globalScene.currentBattle`
4. **Fix ignore_abilities** (B5) — read `arena.ignoreAbilities`
5. **Fix challenge_name** (B6) — use proper display name
6. **Handle AttemptCapturePhase** (PH1) — P0 game hang

### Tier 2 — High Impact Encoding Additions

7. **Encode player modifier inventory** — held items, party modifiers, lapsing modifiers
8. **Encode move secondary effects** — status_effect, stat_changes, recoil_ratio
9. **Encode move target type** — critical for doubles decision-making
10. **Pre-compute type effectiveness** per move-target pair
11. **Encode arena tag remaining turns** — not just binary presence
12. **Handle Egg phases** (PH2-PH4) — auto-skip hatching
13. **Handle EndCardPhase/UnlockPhase** (PH5-PH6) — auto-dismiss

### Tier 3 — Medium Impact Improvements

14. **Populate RewardOption descriptions/type_id/stat_id** (B8, B9)
15. **Encode volatile tag details** — substitute HP, encore move, disabled move
16. **Encode is_trapped, is_grounded** per Pokemon
17. **Encode move_queue** — queued/locked moves
18. **Pre-compute speed ordering**
19. **Pre-compute estimated damage ranges**
20. **Add ability semantic encoding** — at minimum, categorize abilities
21. **Add item identity encoding** — at minimum, categorize items

### Tier 4 — Nice to Have

22. Encode battle_spec (final boss flag)
23. Encode trainer specialty type
24. Encode last_move_id
25. Encode seen_enemy_count
26. Encode hit_count for Rage Fist
27. Encode friendship for Return/Frustration
28. Encode weight for Low Kick/Heavy Slam
29. Encode catch_rate for catch decisions
30. Encode stellar_types_boosted for Stellar tera

---

## Appendix A: Schema Coverage Statistics

### state_schema.py (35 TypedDicts, 364+ fields)

| TypedDict | Fields | In Builder | In Float32 |
|-----------|--------|------------|------------|
| StatChange | 4 | 4 (100%) | 0 (0%) |
| MoveSlot | 42 | 42 (100%) | 17 (40%) |
| VolatileTag | 16 | 16 (100%) | 33 (curated binary) |
| QueuedMove | 4 | 4 (100%) | 0 (0%) |
| AttackReceived | 6 | 6 (100%) | 0 (0%) |
| HeldItem | 14 | 14 (100%) | 0 (0%) |
| TurnData | 10 | 10 (100%) | 2 (~20%) |
| BattleData | 4 | 4 (100%) | 0 (0%) |
| PokemonState | 67 | 67 (100%) | ~30 (45%) |
| ArenaTagState | 5 | 5 (100%) | 1 (binary presence) |
| PositionalTag | 6 | 0 (BUG) | 0 (0%) |
| FieldState | 24 | 23 (96%) | 18 (75%) |
| PokeballCounts | 5 | 5 (100%) | 5 (100%) |
| TrainerInfo | 7 | 7 (100%) | 0 (0%) |
| MysteryEncounterOption | 4 | 4 (100%) | 0 (0%) |
| MysteryEncounterState | 3 | 3 (100%) | 0 (0%) |
| ChallengeInfo | 4 | 4 (BUG) | 0 (0%) |
| BattleState | 35 | 33 (94%) | 20 (57%) |
| PartyModifier | 7 | 4 (57% BUG) | 0 (0%) |
| LapsingModifier | 7 | 7 (100%) | 0 (0%) |
| ModifierInventory | 4 | 4 (100%) | 0 (0%) |
| RewardOption | 11 | 8 (73% BUG) | 3 (27%) |
| ShopOption | 12 | 9 (75% BUG) | 3 (25%) |
| ShopState | 5 | 5 (100%) | 4 (80%) |
| PhaseInfo | 14 | 14 (100%) | ~4 (29%) |

### Summary

- **Schema → Builder completeness**: ~95% (5 bugs producing wrong/missing data)
- **Schema → Float32 completeness**: ~35% (many fields intentionally omitted for vector size)
- **Game source → Schema completeness**: ~90% (10 missing properties, mostly LOW relevance)

### Float32 Observation Vector: 3,583 dimensions

| Block | Dims | Schema Fields Covered | Schema Fields Missing |
|-------|------|----------------------|----------------------|
| Pokemon ×12 | 3,396 (283/slot) | ~30/67 (45%) | ~37 per slot |
| Field | 83 | 18/24 (75%) | 6 |
| Battle | 26 | 20/35 (57%) | 15 |
| Modifier | 62 | 4/5 ShopState only | ALL inventory fields |
| Phase | 16 | ~4/14 (29%) | 10 |

---

## Appendix B: Audit Agent Coverage

| Agent | Scope | Status | Key Findings |
|-------|-------|--------|-------------|
| audit-1 | Pokemon core properties | Complete | 67+ properties cataloged, all HIGH items covered |
| audit-2 | Pokemon battle data | Complete | SummonData/TurnData/BattleData/WaveData fully mapped |
| audit-3 | Move system | Complete | 42 MoveSlot fields, 20 MoveFlags, 130+ MoveAttrs |
| audit-4 | Ability system | Complete | 310+ abilities, 130+ AbAttr subclasses |
| audit-5 | Arena/field state | Complete | Bug B1 (positional_tags), Bug B5 (ignore_abilities) |
| audit-6 | Battle/run state | Complete | Bug B3 (biome encoding), Bug B4 (failed_run_away) |
| audit-7 | Modifier/item system | Complete | 50+ modifier classes cataloged |
| audit-8 | Schema↔Builder Pokemon | Complete | 67/67 fields populated, 0 bugs |
| audit-9 | Schema↔Builder Moves | Complete | 50/50 fields populated, 0 bugs |
| audit-10 | Schema↔Builder Field/Battle | Complete | Bugs B1, B2, B5, B6 confirmed |
| audit-11 | Schema↔Builder Modifiers | Complete | Bug B7, B8, B9 found |
| audit-12 | Float32 Pokemon encoding | Complete | 283 dims mapped, ~37 fields not encoded |
| audit-13 | Float32 Field/Battle encoding | Complete | 109 dims mapped, major gaps in arena tag turns |
| audit-14 | Float32 Modifier/Phase encoding | Complete | **CRITICAL**: inventory not encoded at all |
| audit-15 | Action space completeness | Complete | 58 actions cover all main decisions; gaps in LearnMove multi-step, evolution cancel |
| audit-16 | Phase handler coverage | Complete | PH1-PH16 cataloged, 1 P0, 5 P1 |
| audit-17 | Edge case mechanics | Complete | 20 mechanics audited; positional_tags BUG, ability encoding gap, ball mask gap |
| audit-18 | Human vs agent info gap | Complete | Type chart + ability semantics = top gaps |
| audit-19 | Damage/speed calc inputs | Complete | Float32 ~70% computable; JSON ~90%. Key gap: computed stats not encoded |
| audit-20 | Reward signal completeness | Complete | 4 reward bugs, setup moves largest missing signal |
