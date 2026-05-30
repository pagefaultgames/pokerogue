# PokéRogue-Specific Mechanics Research

## 1. Boss Mechanics

### Boss Wave Pattern
- Every **wave % 10 === 0** is a boss battle (wave 10, 20, 30... etc.)
- Gym leaders replace boss spawns on certain waves (see Fixed Battles below)
- In Endless mode, additional random boss spawns start at wave 251:
  - Chance = `min(max(ceil((wave - 250) / 50), 0) * 2, 30)`%
  - Wave 251-300: 2%, 301-350: 4%, ..., 951+: 30% cap

### Boss Shield Segments (from source: `getEncounterBossSegments()`)
Formula for segment count:
```
segments = 2  (base)
if level >= 100: segments++
if species.baseTotal >= 670: segments++  (pseudo-legendaries, legendaries)
segments += floor(waveIndex / 250)  (scales in Endless)
```
- **Classic Mode** (waves 1-200): Typically 2-3 segments (2 base, +1 if level>=100 or BST>=670)
- **Endless Mode**: Gets +1 every 250 waves (wave 250: +1, wave 500: +2, etc.)
- **Daily Final Boss**: Fixed 5 segments
- Sub-legendary/legendary/mythical species always count as bosses

### Shield Damage Mechanics (from source: `calculateBossSegmentDamage()`)
- HP bar is divided into N equal segments
- Damage cannot cross more than 1 segment boundary per hit normally
- To break through additional segments, excess damage must meet exponential thresholds:
  - Break 1 additional segment: excess >= segmentHp * 2^0 = 1x segment HP
  - Break 2 additional: excess >= segmentHp * 2^1 = 2x segment HP
  - Break 3 additional: excess >= segmentHp * 2^2 = 4x segment HP
  - Formula: `segmentsBypassed = floor(log2(leftoverDamage / segmentHp))`

### Stat Boosts on Shield Break
- Each broken shield triggers a random +1 stat stage boost (ATK/DEF/SPA/SPD/SPE)
- If boss has >= 3 segments AND last shield broken: +2 stages instead
- If boss has >= 5 segments AND second-to-last shield broken: +2 stages instead
- Trainer-owned bosses do NOT get stat boosts on shield break

### Boss Immunities
- Destiny Bond, Perish Song, Pain Split, Endeavor: ineffective
- OHKO moves (Fissure, Sheer Cold, etc.): deal 200 base power damage instead
- Cannot be caught until health bar is in the last segment (all shields broken)

### Final Boss: Eternatus (Wave 200)
- Phase 1: Normal Eternatus with shields
- When bossSegmentIndex < 1 and formIndex === 0: damage capped to HP-1 (can't KO)
- Transforms to Eternamax Eternatus (formIndex 1): restored HP, +1 shield, new moveset
- Eternamax moveset: Dynamax Cannon, Cross Poison, Flamethrower, Recover
- Dynamax Cannon scales with target level vs level cap: up to 2x power at 5%+ over cap

### Endless Mode Special Bosses
- Every 50 waves: Paradox Pokemon boss (uncatchable)
- Every 250 waves: Eternatus (minor boss)
- Every 1000 waves: Eternamax Eternatus (major boss, has Mini Black Hole item steal)

---

## 2. Wave Progression & Difficulty Scaling

### Classic Mode Structure (200 waves)
- **Biome changes**: Every 10 waves
- **Full party heal**: After clearing each 10-wave biome
- **Starting level**: 5
- **Level cap formula** (`getMaxExpLevel()`):
  ```
  waveIndex = ceil(currentWave / 10) * 10  // round up to nearest 10
  baseLevel = (1 + waveIndex/2 + (waveIndex/25)^2) * 1.2
  levelCap = ceil(baseLevel / 2) * 2 + 2
  ```
  Example level caps:
  - Wave 10: ~14
  - Wave 20: ~20
  - Wave 50: ~44
  - Wave 100: ~82
  - Wave 150: ~132
  - Wave 200: ~200

### Wave Types
- **Wild Pokemon**: Default waves (can catch)
- **Trainer battles**: Random on non-X1 waves based on arena trainer chance; wave 5 guaranteed (Youngster)
- **Gym Leaders**: 50% chance at wave 20 OR 30, then every 30 waves after first gym
- **Boss Pokemon**: Every 10th wave if not a gym leader
- **Mystery Encounters**: Waves 10-180, NOT on waves ending in 1

### Fixed Battles (Classic Mode)
| Wave | Encounter |
|------|-----------|
| 5 | Youngster (guaranteed trainer) |
| 8, 25, 55, 95, 145, 195 | Rival battles |
| 20 or 30 (50/50) | First Gym Leader |
| Every 30 after first | Subsequent Gym Leaders |
| 35, 62, 64, 66, 112, 114 | Evil Team Grunts |
| 115, 165 | Evil Team Leader |
| 182, 184, 186, 188 | Elite Four |
| 190 | Champion |
| 191-199 | End biome (uncatchable Pokemon) |
| 200 | Eternatus (Final Boss) |

### Endless Mode Structure
- **Biome changes**: Every 1-4 waves (random)
- **Starting level**: 5
- **Starter points**: 15 (vs 10 in Classic)
- **No wave cap**: Continues indefinitely (technical max ~5850)
- **Token system**: Every 50 waves, a persistent difficulty Token:
  - Damage Token (enemy damage up)
  - Protection Token (player damage down)
  - Recovery Token (enemies heal per turn — most dangerous)
  - Fusion Token (1% per token for enemy fusions)
  - Also: Sleep, Poison, Paralyze, Freeze, Burn tokens

### Daily Run Structure
- 50 waves total
- Starting level: 20
- Difficulty adjusted: `waveForDifficulty = wave + 30 + floor(wave/5)`
- All players get same seed
- Trainers on waves 5, 15, 20, 25, 30, 35, 40, 45
- Final boss at wave 50 (5 segments)

### Time-of-Day Cycling
- Day → Dusk → Night → Dawn cycles every 40 waves
- Starting time randomized to multiples of 5
- Affects time-dependent Pokemon and moves

---

## 3. Modifier/Item System

### Item Tier System
Items are offered after each battle (except boss/gym) with a Pokeball-based rarity indicator:

| Tier | Base Items | Examples |
|------|-----------|----------|
| **Common** (Pokeball) | Basic consumables | Poke Ball (1x catch), Potion, Ether |
| **Great** (Great Ball) | Improved items | Great Ball (1.5x), Full Heal, Revive |
| **Ultra** (Ultra Ball) | Significant boosts | Ultra Ball (2x), Vitamins, Mints |
| **Rogue** (Rogue Ball) | Powerful equipment | Rogue Ball (3x), Leftovers, Focus Band |
| **Master** (Master Ball) | Rarest items | Master Ball (100% catch), Shiny Charm |

### Item Selection Mechanics
- 3 items offered per battle, +1 per Golden Monster Ball modifier
- Items selected by **weight-based random**: higher weight = more likely
- Weights are dynamic: healing items gain weight when party is damaged, etc.
- Evolution items: weight scales with wave progression (Great: 1→8, Ultra: 4→32, every 15 waves)

### Reroll Costs
- Waves 1-10: 250 base cost
- Waves 11-20: 500 base cost
- Cost increases exponentially with each reroll in a single shop visit
- Lock Capsule item enables F5 reroll strategy for RNG manipulation

### Key Item Effects & Stacking
| Item | Tier | Effect | Stack |
|------|------|--------|-------|
| Multi-Lens | Rogue | Extra hit per attack | Max 2 |
| King's Rock | Rogue | +10% flinch per stack | Max 5 (50%) |
| Golden Punch | Rogue | 50% damage → money per stack | Max 5 (250%) |
| Amulet Coin | Rogue | +20% money per stack | Max 5 (100%) |
| Focus Band | Rogue | 10% survive KO per stack | Max 5 (50%) |
| Berry Pouch | Rogue | 33% keep berry per stack | Max 3 (~99%) |
| Leftovers | Rogue | Heal HP per turn | Stacks |
| Grip Claw | Rogue | 10% steal item per stack | Max 5 (50%) |
| Candy Jar | Ultra | +1 Rare Candy level per stack | Max 99 |
| Shell Bell | - | Heal based on damage dealt | Stacks |
| Soul Dew | Master | +10% nature effectiveness | Max 10 |
| Mini Black Hole | Master | 100% steal item per turn | 1 |
| Shiny Charm | Master | Dramatically increases shiny chance | Stacks |

### Key Differences from Mainline Pokemon
- Items don't consume; they persist across battles (like roguelite upgrades)
- Items stack (multiple of same item = stronger effect)
- No traditional held item limit per Pokemon — modifiers apply globally or per-Pokemon
- Shop appears after every non-boss battle
- Items gained through battle rewards, not found in overworld
- DNA Splicers can fuse two party Pokemon permanently

---

## 4. Mystery Encounters

### When They Occur
- Classic and Challenge Mode only
- Between waves 10 and 180
- NOT on waves ending in 1
- Each encounter max 2 times per run
- Always counts as 1 wave for egg hatching

### Encounter Tiers (from source: `MysteryEncounterTier`)
| Tier | Base Spawn Weight | Target Rate |
|------|------------------|-------------|
| COMMON | 66 | ~46.25% |
| GREAT | 40 | ~31.25% |
| ULTRA | 19 | ~18.5% |
| ROGUE | 3 | ~4% |
| MASTER | 0 | Not currently used |

### All Mystery Encounter Types (32 total)
1. MYSTERIOUS_CHALLENGERS
2. MYSTERIOUS_CHEST
3. DARK_DEAL — Transform random party member into a random Legendary (must fight it)
4. FIGHT_OR_FLIGHT
5. SLUMBERING_SNORLAX
6. TRAINING_SESSION
7. DEPARTMENT_STORE_SALE
8. SHADY_VITAMIN_DEALER
9. FIELD_TRIP
10. SAFARI_ZONE
11. LOST_AT_SEA
12. FIERY_FALLOUT
13. THE_STRONG_STUFF
14. THE_POKEMON_SALESMAN
15. AN_OFFER_YOU_CANT_REFUSE
16. DELIBIRDY
17. ABSOLUTE_AVARICE
18. A_TRAINERS_TEST
19. TRASH_TO_TREASURE
20. BERRIES_ABOUND
21. CLOWNING_AROUND
22. PART_TIMER
23. DANCING_LESSONS
24. WEIRD_DREAM
25. THE_WINSTRATE_CHALLENGE
26. TELEPORTING_HIJINKS
27. BUG_TYPE_SUPERFAN
28. FUN_AND_GAMES
29. UNCOMMON_BREED
30. GLOBAL_TRADE_SYSTEM
31. THE_EXPERT_POKEMON_BREEDER

---

## 5. Starter Selection System

### Cost System
- Each Pokemon species has a fixed starter cost (1-10 points)
- Cost can be reduced with species-specific candies
- **Classic/Challenge Mode**: 10 point limit
- **Endless/Spliced Endless Mode**: 15 point limit
- **Daily Run**: 3 random starters auto-selected (total always 10)

### Starter Customization
- **Nature**: Can be selected
- **Ability**: Can choose between available abilities
- **IVs**: Based on caught specimens
- **Egg Moves**: Unlocked through eggs, persist across runs
- **Hidden Abilities**: Unlocked through special encounters/eggs
- **Shiny**: If unlocked, contributes to Luck system

### Candy System
- Species-specific candies earned by: catching, egg hatching, battling
- Candies unlock: passive abilities, cost reduction, egg purchases (1/12 shiny odds)
- Friendship thresholds scale with starter cost:
  - 1-cost: 250 friendship points for a candy
  - Higher costs: proportionally more (up to ~500+ for 3-cost)

### Luck System
- Active shiny Pokemon contribute Luck (+1 to +3 based on rarity variant)
- Higher Luck → better shop item tier-ups, rarer wild encounter spawns
- Fused shiny Pokemon can contribute up to +6 Luck

---

## 6. Competitive Strategy & Meta

### S-Tier Strategies

#### Skill Link + Multi-Hit
- **Cloyster** (Skill Link + Water Shuriken egg move): Best for Endless
- **Cinccino** (Skill Link + Bone Rush/Icicle Spear/Population Bomb eggs)
- Multi-hit moves always hit max times, synergizes with King's Rock for near-100% flinch

#### Flinch Lock
- 3x King's Rock (30%) + 2x Multi-Lens (3 total hits) = near-100% flinch per turn
- Pair with high Speed Pokemon to always move first
- Note: Post-2024 update, Multi-Lens no longer works with multi-hit moves, capped at 2

#### Money Generation Loop
- Gholdengo (Make it Rain) + Golden Punch (5x) + Amulet Coin (5x)
- Generates massive income for rerolling shops to fish for key items
- Meowth (Technician + Pay Day) as early alternative

#### DOT/Stall (Late Endless)
- Leech Seed + Salt Cure + Protect cycling
- Garganacl + Archaludon fusion (Sturdy + Metal Burst + Salt Cure)
- Sturdy ensures survival at full HP; Metal Burst retaliates at 150%
- Nature: -Speed to ensure Metal Burst goes last

#### Stat Stage 6 Loop (Post-Wave 3000)
- Accumulate +6 SpDef via berry consumption
- Berry Pouch (3x) for ~99% berry retention
- Combined with Leftovers/Shell Bell/Healing Charm = near-infinite sustain

### Key Item Priority (Classic Mode)
1. **Early**: Amulet Coin → Golden Punch → EXP Charm
2. **Mid**: Berry Pouch → Focus Band → Multi-Lens → King's Rock
3. **Late**: Shiny Charm → Soul Dew → Master Balls

### Common Failure Points
- Multi-hit opponent moves bypass Sturdy
- Fog setters cause crippling accuracy debuffs (counter: Misty Surge)
- Unnerve ability prevents berry consumption (breaks stat stage strategy)
- Recovery Tokens in Endless become unbeatable without DOT strategies
- Final boss Eternamax transformation catches unprepared players

### Recommended Starters
- **Fuecoco**: Torch Song (Special moves scale well, self-buff)
- **Meowth**: Technician (60-power moves get 50% boost, Pay Day for money)
- **Sinistcha**: Matcha Gatcha (100% self-heal if hitting both in doubles)
- **Mudkip/Turtwig**: Solid early carries with good evolution chains

---

## 7. Game Modes

### Classic Mode
- 200 waves, 10-point starter limit
- Fixed trainer/gym/E4/champion schedule
- Final boss: Eternatus at wave 200
- Must beat to unlock other modes
- Level cap scales with wave (max ~200)

### Challenge Mode
- Same 200-wave structure as Classic
- Unlocked after beating Classic
- Available challenge modifiers:
  | Challenge | Description |
  |-----------|-------------|
  | Mono Gen | Only Pokemon from one generation |
  | Mono Type | Only Pokemon of one type |
  | Fresh Start | Only basic starter trio, no unlocks |
  | Inverse Battle | Type effectiveness reversed |
  | Flip Stat | Base stats shuffled (HP↔SPE, ATK↔SPD) |
  | Hardcore | Permafaint (nuzlocke-style) |
- Challenges can be combined (e.g., Mono Gen 3 + Mono Type Fire)
- Bosses have additional shield segments (5-7 instead of 3-4)

### Endless Mode
- Infinite waves, 15-point starter limit
- Biomes change every 1-4 waves (random)
- Token system every 50 waves (cumulative difficulty)
- Paradox bosses every 50 waves, Eternatus every 250, Eternamax every 1000
- Technical cap at wave 5850

### Spliced Endless Mode
- Same as Endless but all Pokemon are fusions
- DNA Splicers more common

### Daily Run
- 50 waves, fixed seed (same for all players)
- Starting level 20, higher difficulty curve
- No shop between battles
- Auto-selected starters (3 random, totaling 10 cost)
- Final boss at wave 50 (5 segments)

---

## 8. Other PokéRogue-Specific Mechanics

### Fusion (DNA Splicing)
- Two Pokemon permanently combine
- Primary inherits: level, IVs, nature, first type, passive ability
- Secondary inherits: second type, active ability, moves
- Base stats: average of both species
- Available primarily in Spliced Endless, but DNA Splicers can appear in any mode

### Unrestricted Mega Evolution/Gigantamax
- Multiple party members can Mega Evolve simultaneously (no reversion)
- Gigantamax alters base stats, abilities, and sometimes types

### Terastallization
- Tera Orb recharges after every wave during Elite Four
- Otherwise standard single-use per battle

### Pokerus
- 1.5x EXP multiplier
- Spreads to adjacent party members (~10% chance per wave)
- Persist across the entire run once contracted

### Double Battle Mechanics
- Wild: 1/8 chance of double battle
- Boss: 1/32 chance of double
- Lures quadruple chances multiplicatively (3 Max Lures = guaranteed doubles)
- Arena Trap ability functions similarly

### Biome Selection
- Map item allows choosing next biome from connected options
- Without Map, biome transitions are predetermined/random based on mode
