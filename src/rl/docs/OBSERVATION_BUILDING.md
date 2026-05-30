# Observation Space Completeness Audit

**Current state:** 9,875 float32 dims across 4 files (state-builder.ts, spaces.ts, observation.py, state_schema.py).

**Audit date:** 2026-02-09
**Audit method:** 6 parallel expert agents auditing Pokemon properties, MoveAttr subclasses, battle/field/arena state, modifiers/items, temporal/historical info, and enemy info.

---

## Current Observation Layout (v7)

| Block | Dims | Description |
|-------|------|-------------|
| Pokemon (x12) | 12 x 771 = 9,252 | 6 player + 6 enemy slots, 771 dims each |
| Field state | 94 | Weather, terrain, arena tags, positional info |
| Battle meta | 40 | Wave, turn, money, pokeballs, game mode flags |
| Modifier phase | 225 | Reward options (3x28) + shop options (6x23) + header (3) |
| Modifier inventory | 220 | Held (4x45) + party (9) + lapsing (23) + enemy (8) |
| Derived fields | 28 | Type effectiveness, speed order, HP ratios |
| Phase indicator | 16 | One-hot phase type |
| **Total** | **9,875** | |

### Per-Pokemon Breakdown (771 dims)

| Sub-block | Dims | Description |
|-----------|------|-------------|
| Non-move features | 243 | Stats, types, ability (40x2), status, volatile tags (48), etc. |
| Move slots (x4) | 4 x 132 = 528 | 132 dims per move (50 base + 36 v6 semantic + 46 v7 boolean flags) |

---

## A1: Pokemon Properties (50 items)

### A1 — HIGH (12 items)

| # | Property/Method | Type | What it provides | Why useful for RL |
|---|---|---|---|---|
| A1-H1 | `switchOutStatus` | bool | Whether Pokemon is leaving/fleeing the field | Affects target selection; predicts opponent switching |
| A1-H2 | `getEffectiveStat(stat)` | number | Final in-battle stat after stages, abilities, items, weather | U3 territory — agent needs effective stats, not just base+stages separately |
| A1-H3 | `isTransformed()` | bool | Whether Pokemon is currently using Transform | Affects what moveset/stats are real vs copied |
| A1-H4 | `getCritStage(source, move)` | number | Critical hit stage against a specific target | Affects damage expectations; high crit = more damage variance |
| A1-H5 | `getAccuracyMultiplier()` | number | Final accuracy multiplier after stages + abilities | Affects move hit probability — crucial for move selection |
| A1-H6 | `isFullHp()` | bool | Whether at max HP | Affects Sturdy, Multiscale, Focus Sash triggers (derivable from hp_ratio) |
| A1-H7 | `canApplyAbility(passive)` | bool | Whether ability is currently active/usable | Accounts for Neutralizing Gas, arena ignoreAbilities, fusions with NoFusionAbilityAbAttr |
| A1-H8 | `TurnData.combiningPledge` | MoveId? | The pledge move being combined this turn | Affects combined pledge power (150 base + field effect) in doubles |
| A1-H9 | `TurnData.failedRunAway` | bool | Whether this Pokemon failed to run this turn | Per-Pokemon run failure tracking |
| A1-H10 | `TurnData.pendingStatus` | StatusEffect | Status about to be applied (not yet set) | Prevents double-status attempts |
| A1-H11 | `TurnData.summonedThisTurn` | bool | Just switched in this turn | Affects Fake Out/First Impression usability |
| A1-H12 | `PokemonTempSummonData.turnCount` | number | Turns since summon (persists across waves) | Different from waveTurnCount; used for some ability checks |

### A1 — MEDIUM (19 items)

| # | Property/Method | Type | What it provides | Why useful for RL |
|---|---|---|---|---|
| A1-M1 | `fusionFormIndex` | number | Form index of the fusion partner | Affects fusion's stats/abilities/typing |
| A1-M2 | `fusionAbilityIndex` | number | Ability index of the fusion partner | Determines which fusion ability is active |
| A1-M3 | `fusionGender` | Gender | Gender of fusion partner | Affects Attract, Rivalry, gender-based moves |
| A1-M4 | `fusionTeraType` | PokemonType | Tera type of fusion component | Relevant for tera decision making on fusions |
| A1-M5 | `fusionLuck` | number | Luck of fusion component | Affects shiny/item drop rates |
| A1-M6 | `customPokemonData.types` | PokemonType[] | Permanently changed types from Mystery Encounters | Agent should know if types were ME-modified |
| A1-M7 | `customPokemonData.ability` | AbilityId | Permanently changed ability from ME | Already reflected in getAbility() but not explicitly flagged |
| A1-M8 | `evoCounter` | number | Evolution counter | Indicates how close to evolution |
| A1-M9 | `pauseEvolutions` | bool | Whether evolutions are paused | Affects whether Pokemon will evolve after level-up |
| A1-M10 | `pokerus` | bool | Whether Pokemon has Pokerus | Doubles EXP gain; affects leveling strategy |
| A1-M11 | `isAllowedInBattle()` | bool | Combines isFainted + challenge restrictions | More comprehensive than is_fainted alone |
| A1-M12 | `isAllowedInChallenge()` | bool | Whether valid under current challenge rules | Needed for challenge runs (e.g., mono-type) |
| A1-M13 | `formKey` (getFormKey()) | string | Current form key string | More descriptive than form_index; helps identify mega/gmax/primal forms |
| A1-M14 | `TurnData.joinedRound` | bool | Whether this Pokemon joined mid-round | Affects turn ordering |
| A1-M15 | `species.growthRate` | number | EXP growth rate | Affects how much EXP is needed per level |
| A1-M16 | `species.baseFriendship` | number | Base friendship value | Context for current friendship level |
| A1-M17 | `getMatchupScore(opponent)` | number | Computed matchup quality | Expensive but could be pre-computed for switch decisions |
| A1-M18 | `getEvolution()` | SpeciesFormEvolution? | Whether this Pokemon can currently evolve | Affects evolution accept/cancel decisions |
| A1-M19 | `getMoveType(move)` | PokemonType | Move type after ability/tag modifications | Affected by Normalize, Refrigerate, Pixilate, etc. |

### A1 — LOW (19 items)

| # | Property/Method | Type | What it provides | Why useful for RL |
|---|---|---|---|---|
| A1-L1 | `metLevel` | number | Level when caught/met | Historical context only |
| A1-L2 | `metBiome` | BiomeId | Biome where caught | Historical context only |
| A1-L3 | `metWave` | number | Wave where caught | Historical context only |
| A1-L4 | `metSpecies` | SpeciesId | Species when met (for egg moves) | Determines egg move availability |
| A1-L5 | `exp` | number | Total experience points | Derivable from level + exp_to_next_level |
| A1-L6 | `levelExp` | number | EXP within current level | Derivable |
| A1-L7 | `fusionShiny` | bool | Whether fusion partner is shiny | Cosmetic, affects luck (already captured) |
| A1-L8 | `fusionVariant` | Variant | Fusion partner's shiny variant | Cosmetic |
| A1-L9 | `nickname` | string | Custom Pokemon name | No strategic value |
| A1-L10 | `passive` (raw field) | bool | Whether passive is unlocked (before overrides) | Already have has_passive which is the resolved value |
| A1-L11 | `abilityIndex` | number | Raw ability slot index (0/1/2) | Indirectly captured by ability_id |
| A1-L12 | `usedTMs` | MoveId[] | TMs that have been taught | Only relevant for Move Relearner |
| A1-L13 | `customPokemonData.spriteScale` | number | Custom sprite rendering scale | Cosmetic only |
| A1-L14 | `customPokemonData.nature` | Nature | Permanently changed nature from ME | Already reflected in getNature() |
| A1-L15 | `isDoubleShiny()` | bool | Both base + fusion are shiny | Cosmetic |
| A1-L16 | `getLuck()` | number | Overall luck (base + fusion) | Already captured as `luck` |
| A1-L17 | `getInverseHp()` | number | HP missing = max - current | Trivially derivable |
| A1-L18 | `isFusion()` | bool | Whether this is a fused Pokemon | Already captured as `is_fusion` |
| A1-L19 | `getExpValue()` | number | EXP reward for defeating | Relevant for EXP planning but enemy-only |

---

## A2: MoveAttr Subclasses (27 remaining — 46 completed in v7)

~~A2-HIGH (22 items) — COMPLETED in v7 MoveAttr boolean flags~~
~~A2-MEDIUM (24 items) — COMPLETED in v7 MoveAttr boolean flags~~

### A2 — LOW (27 items)

| # | AttrName | What it does | ~Moves | Notes |
|---|----------|-------------|--------|-------|
| A2-L1 | MoveHeaderAttr / MessageHeaderAttr | Pre-move messages/headers | ~3 | Purely cosmetic/UI |
| A2-L2 | BeakBlastHeaderAttr / AddBattlerTagHeaderAttr | Beak Blast burn-on-contact header | 1 | Partially captured by status/contact |
| A2-L3 | PreMoveMessageAttr | Displays message before move | ~5 | No strategic impact |
| A2-L4 | PreUseInterruptAttr | Cancels move under conditions | ~2 | Edge case interruption |
| A2-L5 | RespectAttackTypeImmunityAttr | Status move respects type immunity | ~3 | Already handled by type system |
| A2-L6 | ModifiedDamageAttr / SurviveDamageAttr | Ensures target survives with 1 HP | 1 | False Swipe — catching-specific |
| A2-L7 | MessageAttr | Displays a message effect | ~2 | No strategic impact |
| A2-L8 | IgnoreWeatherTypeDebuffAttr | Ignores weather damage reduction | 1 | Very niche |
| A2-L9 | SacrificialFullRestoreAttr | User faints, fully restores ally | 2 | Lunar Dance, Healing Wish — is_sacrifice captured but heal-ally unencoded |
| A2-L10 | BypassSleepAttr | Can be used while asleep | 2 | Sleep Talk, Snore |
| A2-L11 | InstantChargeAttr / WeatherInstantChargeAttr | Skips charge turn conditionally | ~5 | Solar Beam in sun — is_charging captures base |
| A2-L12 | AwaitCombinedPledgeAttr | Pledge combination mechanic | 3 | Very rare doubles mechanic |
| A2-L13 | CombinedPledgeStabBoostAttr / CueNextRoundAttr | Pledge/Round combination bonuses | ~4 | Extremely niche doubles synergy |
| A2-L14 | CounterRedirectAttr | Redirects counter moves to correct target | 3 | Internal targeting logic |
| A2-L15 | NaturePowerAttr | Calls terrain-dependent move | 1 | Meta-move, outcome depends on terrain |
| A2-L16 | RepeatMoveAttr | Forces target to repeat their last move | 1 | Instruct — doubles support |
| A2-L17 | StatusIfBoostedAttr | Burns target if they boosted stats this turn | 1 | Burning Jealousy — niche counter |
| A2-L18 | MissEffectAttr / NoEffectAttr | Effects triggered on miss/no-effect | ~3 | Jump Kick crash — failure handling |
| A2-L19 | HitsTagAttr / HitsTagForDoubleDamageAttr | Double damage to targets with specific tag | ~5 | Earthquake vs Dig — implicit in tag system |
| A2-L20 | GulpMissileTagAttr | Cramorant form change mechanic | 1 | Species-specific gimmick |
| A2-L21 | SemiInvulnerableAttr | Makes user semi-invulnerable during charge | ~5 | Already captured by HIDE_USER/HIDE_TARGET MoveFlags |
| A2-L22 | EatBerryAttr | Forces target/self to eat berry | 2 | Teatime, Stuff Cheeks — niche |
| A2-L23 | FlameBurstAttr | Splash damage to target's ally | 1 | Minor doubles collateral |
| A2-L24 | RemoveTypeAttr / CopyTypeAttr / CopyBiomeTypeAttr / ChangeTypeAttr / AddTypeAttr / FirstMoveTypeAttr | Various type-change moves | ~8 | Type manipulation — rare |
| A2-L25 | StatChangeBeforeDmgCalcAttr | Parent class for stats-before-damage | 1 | SpectralThiefAttr is the only real subclass |
| A2-L26 | DoublePowerChanceAttr | Random chance to double power | 0-1 | Extremely niche |
| A2-L27 | MatchHpAttr / RandomLevelDamageAttr | Already captured by parent FixedDamageAttr check | 1 each | Subclass detail not needed |

---

## A3: Battle/Field/Arena State (21 items)

### A3 — HIGH (1 item)

| # | State Property | Source Object | Type | Why useful for RL |
|---|---|---|---|---|
| A3-H1 | Positional tags (Future Sight, Wish) | `arena.positionalTagManager.tags[]` | Array of {tag_type, countdown, target_index, source_id, move_id, heal_hp} | Future Sight deals massive damage in 2 turns; Wish heals in 1 turn. Agent needs countdown and target slot. Present in JSON but NOT encoded in Float32. |

### A3 — MEDIUM (6 items)

| # | State Property | Source Object | Type | Why useful for RL |
|---|---|---|---|---|
| A3-M1 | Arena tag `maxDuration` | ArenaTag.maxDuration | number | Knowing original duration vs remaining turns lets agent estimate when screens/tailwind were set |
| A3-M2 | `battle.playerParticipantIds` | Battle.playerParticipantIds | Set of pokemon IDs | Which pokemon participated in battle (for EXP/score distribution) |
| A3-M3 | `battle.turnCommands` | Battle.turnCommands | Record of TurnCommand | What commands have been issued this turn (in doubles, reveals partner/enemy intent) |
| A3-M4 | `battle.playerFaintsHistory` / `enemyFaintsHistory` | Battle.*FaintsHistory | FaintLogEntry[] | Array of {pokemon, turn} — reveals which pokemon fainted and when. Richer than count |
| A3-M5 | Trainer `is_boss` | trainer.config.isBoss | boolean | Whether current trainer is a boss. In JSON but NOT in Float32 |
| A3-M6 | Trainer `party_template_size` / `tera_mode` | trainer config | number | How many pokemon trainer has / whether AI will tera. In JSON but NOT in Float32 |

### A3 — LOW (14 items)

| # | State Property | Source Object | Type | Why useful for RL |
|---|---|---|---|---|
| A3-L1 | Weather `maxDuration` | Weather.maxDuration | number | Marginal over turnsLeft — weather is permanent (0) or finite |
| A3-L2 | Terrain `maxDuration` | Terrain.maxDuration | number | Same as above for terrain |
| A3-L3 | `arena.ignoringEffectSource` | Arena.ignoringEffectSource | BattlerIndex? | Which Pokemon is causing ability suppression (Mold Breaker source) |
| A3-L4 | Arena tag `sourceId` (per-tag) | ArenaTag.sourceId | number | Who set each hazard/screen — low value, presence matters more |
| A3-L5 | `battle.started` | Battle.started | boolean | Always true during decision phases |
| A3-L6 | `battle.battleScore` | Battle.battleScore | number | Running score accumulator — already have globalScene.score |
| A3-L7 | `battle.lastUsedPokeball` | Battle.lastUsedPokeball | PokeballType? | Which pokeball was last thrown — marginal |
| A3-L8 | `battle.lastEnemyInvolved` | Battle.lastEnemyInvolved | BattlerIndex | Last enemy that used an ability/move — marginal |
| A3-L9 | `battle.lastPlayerInvolved` | Battle.lastPlayerInvolved | BattlerIndex | Last player pokemon involved — marginal |
| A3-L10 | `battle.postBattleLoot` | Battle.postBattleLoot | PokemonHeldItemModifier[] | Items gained after battle — not actionable mid-battle |
| A3-L11 | `globalScene.waveCycleOffset` | globalScene | number | Affects time-of-day — already captured |
| A3-L12 | GameMode mystery encounter wave range | GameMode | number | minMysteryEncounterWave / maxMysteryEncounterWave — static per mode |
| A3-L13 | Trainer `is_double` | trainer.config.doubleOnly | boolean | Already inferrable from is_double battle flag |
| A3-L14 | `battle.moneyScattered` | Battle | number | In JSON, not encoded — marginal value |

### A3 — JSON Present But Not Encoded to Float32

These fields are already in `buildFieldState()`/`buildBattleState()` JSON but NOT in the Float32 observation:

| # | Field | JSON Location |
|---|-------|--------------|
| A3-J1 | `positional_tags` array | field state |
| A3-J2 | Arena tag `source_id` per tag | field state |
| A3-J3 | Trainer `is_boss` | battle state |
| A3-J4 | Trainer `party_template_size` | battle state |
| A3-J5 | Trainer `tera_mode` | battle state |
| A3-J6 | `failed_run_away` | battle state |
| A3-J7 | `enemy_switch_counter` | battle state |
| A3-J8 | `offset_gym` | battle state |
| A3-J9 | `is_spliced_only` | battle state |
| A3-J10 | `has_trainers` | battle state |

---

## A4: Modifiers/Items (13 items)

### A4 — HIGH (1 item)

| # | Missing Info | Source | Why useful for RL |
|---|---|---|---|
| A4-H1 | Bench Pokemon held items — only 4 active-slot Pokemon have items encoded; bench (player_2..5) have 0 item info in obs | spaces.ts line 1141: only ACTIVE_SLOT_KEYS | When switching, agent needs to know bench members' items (Reviver Seed = better switch target) |

### A4 — MEDIUM (4 items)

| # | Missing Info | Source | Why useful for RL |
|---|---|---|---|
| A4-M1 | Party modifier stack counts — party-wide mods encoded as 8 boolean flags, losing stack_count | spaces.ts lines 1185-1197 | EXP_SHARE stack (1-5) matters for exp distribution; AMULET_COIN stacks affect money |
| A4-M2 | Multiple lapsing modifiers — only top-1 encoded; can have X-Attack + X-Speed + Dire Hit + Lure simultaneously | spaces.ts line 1206 | Agent may have multiple temp boosts active; only seeing 1 loses context |
| A4-M3 | ENEMY_ENDURE_CHANCE not in ENEMY_MOD_IDS array | spaces.ts line 1116-1124 | Enemy endure chance (2% per stack) can prevent expected kills |
| A4-M4 | Total held item count per Pokemon — top-2 items detailed; items 3+ invisible | spaces.ts line 1154, 1159 | Pokemon can hold 5+ items; items ranked 3+ by RL priority completely invisible |

### A4 — LOW (8 items)

| # | Missing Info | Source | Why useful for RL |
|---|---|---|---|
| A4-L1 | Berry consumed state — `BerryModifier.consumed` in JSON but not encoded | state-builder.ts line 443 | Berry consumed=true means about to be removed |
| A4-L2 | EvoTrackerModifier progress — stackCount/required ratio not encoded | modifier.ts line 866-921 | Gimmighoul coin tracking — niche |
| A4-L3 | AttackTypeBoosterModifier.boostMultiplier — type_id captured but not actual % | modifier.ts line 1411 | Always 20% in standard game; lookup table encodes 0.20 |
| A4-L4 | HealShopCostModifier.shopMultiplier — Black Sludge cost multiplier not captured | modifier.ts line 3065-3100 | Affects shop healing cost — rarely relevant |
| A4-L5 | ENEMY_FUSED_CHANCE not in ENEMY_MOD_IDS | spaces.ts line 1116-1124 | Fusion chance already resolved by battle time |
| A4-L6 | ExtraModifierModifier stack count — encoded as boolean; stack (1-3) lost | spaces.ts line 1110 | Extra reward count doesn't affect combat |
| A4-L7 | Reroll cost scaling — reroll_count in state but escalating cost not pre-computed | state-builder.ts line 1202-1208 | Agent could derive from reroll_count |
| A4-L8 | Shop heal cost — total heal cost (affected by Black Sludge) not pre-computed | Game state | Rarely a direct decision |

---

## A5: Temporal/Historical Info (15 items)

### A5 — HIGH (2 items)

| # | Temporal Info | Source | How accessed | Why useful for RL |
|---|---|---|---|---|
| A5-H1 | Consecutive protect count | Derived from `summonData.moveHistory` | Count consecutive successful ProtectAttr moves backward | Directly determines Protect success rate: `1/3^N`. Game computes in ProtectAttr.getCondition() (move.ts:6648-6665). Currently invisible to agent. |
| A5-H2 | Last move used (per Pokemon) | `summonData.moveHistory[-1].move` | `getLastXMoves(1)[0].move` | Critical for Encore, Copycat, Mirror Move, Instruct, Dancer. In JSON but NOT in obs. |

### A5 — MEDIUM (5 items)

| # | Temporal Info | Source | How accessed | Why useful for RL |
|---|---|---|---|---|
| A5-M1 | Volatile tag remaining turns | `summonData.tags[i].turnCount` | Already in JSON `volatile_tags[i].turn_count` | Tags like Confusion, Taunt, Bind have limited turns. Only binary presence encoded, not remaining duration. Agent can't tell if Confusion is about to expire. |
| A5-M2 | Switched in this turn | `turnData.switchedInThisTurn` | `pokemon.turnData.switchedInThisTurn` | Affects First Impression/Fake Out eligibility. In JSON but NOT in obs. |
| A5-M3 | Has eaten berry (battle) | `battleData.hasEatenBerry` | `pokemon.battleData.hasEatenBerry` | Required for Belch usability. In JSON but NOT in obs. |
| A5-M4 | Ability revealed | `waveData.abilityRevealed` | `pokemon.waveData.abilityRevealed` | Agent knows if enemy ability is known info vs hidden. In JSON but NOT in obs. |
| A5-M5 | Total damage dealt this turn | `turnData.totalDamageDealt` | `pokemon.turnData.totalDamageDealt` | Useful for evaluating damage output. In JSON but NOT in obs. |

### A5 — LOW (8 items)

| # | Temporal Info | Source | How accessed | Why useful for RL |
|---|---|---|---|---|
| A5-L1 | Move use count per move (since summon) | Derived from `summonData.moveHistory` | Count occurrences of each moveId | Relevant for Choice locking, Torment |
| A5-L2 | Berries eaten count (battle) | `battleData.berriesEaten` | `pokemon.battleData.berriesEaten` | For Harvest ability — count would suffice |
| A5-L3 | Abilities applied this wave | `waveData.abilitiesApplied` | `pokemon.waveData.abilitiesApplied` | Once-per-battle abilities won't trigger again |
| A5-L4 | Endured this wave | `waveData.endured` | `pokemon.waveData.endured` | Endure token already used. In JSON but NOT in obs. |
| A5-L5 | Stat stages increased/decreased this turn | `turnData.statStagesIncreased/Decreased` | `pokemon.turnData.*` | Minor — derivable from stat stage values |
| A5-L6 | Combining pledge | `turnData.combiningPledge` | `pokemon.turnData.combiningPledge` | Only relevant in doubles with pledge moves — extremely niche |
| A5-L7 | Faint history with turns | `battle.*FaintsHistory` | `FaintLogEntry[].turn` | When faints happened — currently only counts |
| A5-L8 | `tempSummonData.turnCount` | `tempSummonData.turnCount` | `pokemon.tempSummonData.turnCount` | Total turns on field (not just this wave) |

---

## A6: Enemy/Opponent Info (6 items)

**Key finding: Enemies are encoded IDENTICALLY to player Pokemon (771 dims each). Perfect information.**

### A6 — MEDIUM (3 items)

| # | Info | Status | How to access | Why useful for RL |
|---|---|---|---|---|
| A6-M1 | `postBattleLoot` | ACCESSIBLE_NOT_CAPTURED | `battle.postBattleLoot` | Items dropped on enemy defeat — reward planning |
| A6-M2 | `species.baseExp` | ACCESSIBLE_NOT_CAPTURED | `pokemon.species.baseExp` | EXP yield on defeat — EXP optimization |
| A6-M3 | Trainer `partyMemberMatchupScores` | ACCESSIBLE_NOT_CAPTURED | `trainer.getSortedPartyMemberMatchupScores()` | AI's switching priority — predicts enemy switches |

### A6 — LOW (3 items)

| # | Info | Status | How to access | Why useful for RL |
|---|---|---|---|---|
| A6-L1 | `ai_type` | IN_JSON_NOT_OBS | `pokemon.aiType` (RANDOM=0/SMART_RANDOM=1/SMART=2) | Enemy AI sophistication level |
| A6-L2 | `trainerSlot` | ACCESSIBLE_NOT_CAPTURED | `(pokemon as EnemyPokemon).trainerSlot` | Which trainer owns this Pokemon in double trainer battles |
| A6-L3 | `initialTeamIndex` | ACCESSIBLE_NOT_CAPTURED | `(pokemon as EnemyPokemon).initialTeamIndex` | Original team position — low value |

---

## Summary Statistics

| Area | HIGH | MEDIUM | LOW | Total | Status |
|------|------|--------|-----|-------|--------|
| A1: Pokemon Properties | 12 | 19 | 19 | 50 | |
| A2: MoveAttr Subclasses | ~~22~~ | ~~24~~ | 27 | 27 | **46 completed (v7)** |
| A3: Battle/Field/Arena | 1 | 6 | 14 | 21 | |
| A4: Modifiers/Items | 1 | 4 | 8 | 13 | |
| A5: Temporal/Historical | 2 | 5 | 8 | 15 | |
| A6: Enemy Info | 0 | 3 | 3 | 6 | |
| **Remaining** | **16** | **37** | **79** | **132** | |

Note: Some items overlap across audits (e.g., A1-H8 combiningPledge = A5-L6, A1-H11 summonedThisTurn ~ A5-M2 switchedInThisTurn). De-duplicated unique count is ~120.

---

## Dim Budget Estimates

| Change | New Dims | Running Total |
|--------|----------|---------------|
| Current v7 (after Chunk 1) | — | 9,875 |
| A5-H1 Consecutive protect count (+1/pokemon) | +12 | 9,887 |
| A3-H1 Positional tags (Future Sight/Wish) | +10 | 9,897 |
| A4-H1 Bench Pokemon held items | +180 | 10,077 |
| A5-H2 Last move used (+1/pokemon) | +12 | 10,089 |
| A5-M1 Volatile tag remaining turns (+5/pokemon) | +60 | 10,149 |
| A1-H11 summonedThisTurn (+1/pokemon) | +12 | 10,161 |
| A5-M2 switchedInThisTurn (+1/pokemon) | +12 | 10,173 |
| A5-M3 hasEatenBerry (+1/pokemon) | +12 | 10,185 |
| A5-M4 abilityRevealed (+1/pokemon) | +12 | 10,197 |
| A5-M5 totalDamageDealt (+1/pokemon) | +12 | 10,209 |
| A4-M1 Party modifier stack counts | +5 | 10,214 |
| A4-M2 Multiple lapsing mods (top-2) | +22 | 10,236 |
| A4-M3 ENEMY_ENDURE_CHANCE | +1 | 10,237 |
| A3-M5/M6 Trainer fields in Float32 | +5 | 10,242 |
| A1-M1..M5 Fusion detail fields (+5/pokemon) | +60 | 10,302 |
| **All remaining HIGH + MEDIUM** | **~427** | **~10,302** |

---

## Confirmed Complete (No Gaps)

- **MoveAttr boolean flags**: All 46 HIGH+MEDIUM attrs captured via v7 (Chunk 1 complete)
- **Enemy info**: Perfect information — enemies encoded identically to player (771 dims each)
- **Modifier lookup table**: 109/109 modifier types covered with 20-dim semantic vectors
- **MoveFlags**: All 20 flags captured
- **Ability encoding**: All 311 abilities with 40-dim semantic vectors (U1)
- **Status effects**: All 8 status types + toxic counter + sleep turns
- **Volatile tags**: 48 curated tags with binary presence
- **Arena tags**: All 28 types with per-side presence + layer counts for hazards + turn counts for key tags
- **Weather/Terrain**: Type + turns left + permanent flag + suppressed flag
