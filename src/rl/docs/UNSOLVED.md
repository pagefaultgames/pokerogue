# Unsolved Limitations in the PokeRogue RL Framework

> Analysis date: 2026-02-09
> Scope: Items from LIMITATIONS.md that CANNOT be resolved within the current RL framework
> Criteria: Requires game source modification, fundamentally different architecture,
> runtime-inaccessible information, impractical observation sizes, or training methodology changes

---

## What the Team IS Fixing

The current sprint addresses all solvable items from the LIMITATIONS.md audit:

- **Builder bugs B1-B10**: Fixing incorrect data (positional_tags, challenge_type, failed_run_away, ignore_abilities, challenge_name, PartyModifier fields, RewardOption fields, reroll_count, biome_id in battle block)
- **Unhandled phases PH1-PH13**: AttemptCapturePhase (P0 hang), egg phases, end card, unlock, evolution cancel, reward messages
- **Float32 encoding gaps**: Adding modifier inventory, move secondary effects, volatile tag details, pre-computed derived fields, expanded Pokemon/field/battle encoding
- **Reward bugs RB1-RB4**: HP deltas across wave boundaries, cumulative faint tracking, catch detection, boss wave detection
- **Missing reward signals**: Stat boost shaping, status infliction reward

These represent approximately 80% of the LIMITATIONS.md findings and are tracked in tasks #1-#11, #13-#17.

---

## Unsolved Items

### U1. Ability Semantic Encoding

**What**: 310+ abilities, each with unique game-altering effects implemented across 130+ AbAttr subclasses. Currently encoded as `ability_id / 310` -- a single float that is meaningless to a neural network.

**Why unsolvable in current framework**:
- Abilities have **compositional effects**: Intimidate = "on switch-in, lower opponent ATK by 1 stage". This requires structured semantic representation.
- The 130+ AbAttr subclasses define behavior via polymorphic method overrides (`applyPreDefend`, `applyPostAttack`, etc.). There is no single property that summarizes "what this ability does."
- A lookup table approach would need ~50 boolean/float features per ability (type immunity, stat boost, weather interaction, priority manipulation, etc.) = 50 features x 2 abilities per Pokemon x 12 slots = **1,200 extra floats** just for ability features. Feasible but requires manual curation of all 310+ abilities.
- A learned embedding approach requires a separate model component not supported by the current flat Float32 vector architecture.

**Severity**: CRITICAL. Abilities fundamentally change battle dynamics. An agent that doesn't understand Levitate (ground immunity), Intimidate (ATK drop), or Sturdy (survives OHKO) makes systematically wrong decisions. The current encoding provides zero ability semantics.

**What would need to change**:
- Option A: Hand-authored lookup table mapping each ability_id to ~30 categorical features (type immunity, stat modification trigger, weather setter, terrain setter, priority bracket, contact punishment, etc.). Estimated 2-3 person-days to build and verify. Adds ~720 dims (30 features x 2 abilities x 12 Pokemon).
- Option B: Pre-trained ability embedding model that maps ability_id to a dense vector. Requires separate training data and a non-flat observation architecture.
- Option C: Move to a transformer/attention-based observation encoder that can learn ability embeddings end-to-end. Requires architectural change from flat vector to structured input.

**Workaround**: The agent can learn ability effects implicitly through experience (millions of episodes), but convergence will be slow and the agent will never fully generalize to rare abilities it has not encountered enough times. This is the single largest implicit knowledge gap between human and agent play.

---

### U2. Item Effect Encoding

**What**: 50+ modifier subclasses (AttackTypeBoosterModifier, SurviveDamageModifier, TurnHealModifier, etc.) each with distinct gameplay effects. Currently the Float32 encoding captures only item count, tier, and cost -- no semantic information about what items DO.

**Why unsolvable in current framework**:
- Same structural problem as abilities: items have diverse, compositional effects defined by class inheritance hierarchies.
- A human reads "Silk Scarf -- Boosts Normal-type moves by 20%" and immediately understands the value. The agent sees `tier=1, cost=200, affordable=true`.
- The modifier_class string is available in the JSON state but not in Float32. Even if it were, class names are categorical with 50+ values -- one-hotting them adds massive dimensionality.
- Bug B8 (description always "") means even the JSON path lacks human-readable effect descriptions.

**Severity**: HIGH. Item selection in the shop is a significant strategic decision. Without knowing what items do, the agent can only learn "higher tier = probably better" and "affordable = valid choice." It cannot learn situational item value (e.g., type-boosting item matching your team's types, or healing item when HP is low).

**What would need to change**:
- Option A: Categorical item effect encoding -- map each modifier_class to a fixed-size feature vector (~15 dims: is_damage_boost, is_healing, is_stat_boost, boost_type, boost_amount, is_berry, etc.). Requires manual curation of all 50+ modifier subclasses.
- Option B: Fix Bug B8 to populate description strings, then use a text embedding model to encode descriptions. Requires non-flat architecture.
- Option C: Group items into ~10 functional categories (damage boost, survival, healing, economy, status, type coverage, stat boost, evolution, ball, utility) and one-hot encode. Coarse but cheap (~10 dims per item).

**Workaround**: The tier-based reward signal (`modifierTierBonus`) provides a weak proxy. The agent will learn to prefer higher-tier items but cannot distinguish between equally-tiered items with vastly different value for the current team.

---

### U3. Full Damage Calculator

**What**: Pre-computing exact damage ranges for each move-target pair. The game's damage formula involves base power, attacking stat, defending stat, level, STAB, type effectiveness, abilities (both attacker and defender), items, weather, terrain, critical hits, stat stages, burns (halves physical), screens (halves damage), and 20+ additional modifiers.

**Why unsolvable in current framework**:
- The damage formula is spread across `MovePhase.apply()`, `Pokemon.calculateDamage()`, `MoveDamageCalcAttr` subclasses, and numerous ability hooks (`applyPreDefend`, `applyPostDefend`, etc.). Replicating it requires hundreds of lines of logic that mirrors game internals.
- Many modifiers are contextual: abilities like Flash Fire (boost fire moves if hit by fire), items like Life Orb (1.3x damage but lose 10% HP), and move interactions (Acrobatics doubles power if no item) require state that is partially but not fully captured.
- Even WITH all inputs, the formula has random components (damage roll 85-100%, critical hit chance) that make exact values impossible -- only ranges are feasible.
- Calling the game's own damage calculator would require modifying game source code to expose it as a pure function (currently it has side effects and reads global state).

**Severity**: HIGH. Humans quickly estimate "this OHKOs" or "I need two hits." The agent must learn this implicitly from stats, power, type, and experience. The current observation includes base_stats (not computed stats in Float32), move power, type one-hots, stat stages, and weather/terrain -- approximately 80% of the inputs needed for a rough estimate. The missing 20% (item boosts, ability modifiers, screens) can cause 30-50% error in damage estimation.

**What would need to change**:
- Option A: Implement a simplified damage estimator as a pure function in `src/rl/` that takes observation data and produces approximate ranges. Does NOT require game source changes. Estimated 500+ lines of code, 3-5 person-days.
- Option B: Add computed stats to Float32 encoding (currently only base_stats are encoded). This alone closes the gap from ~80% to ~95% damage computability for the neural network to learn the formula. This IS being done by the team (task #9).
- Option C: Use the JSON-level data (which includes computed stats, ability names, item names) with a more sophisticated agent architecture that can process structured inputs.

**Workaround**: Encoding computed stats (in progress) is the highest-leverage partial fix. The neural network can learn a reasonable damage approximation from stats + power + type effectiveness. Full accuracy requires ability/item semantic encoding (U1, U2).

---

### U4. Opponent Moveset Prediction

**What**: Enemy Pokemon's moves are unknown until used. The agent can see the enemy's species, types, stats, and ability, but not their moveset until individual moves are revealed during battle.

**Why unsolvable in current framework**:
- This is **hidden information** by game design, not a data capture failure. A human player also doesn't know the enemy's exact moveset -- they use species knowledge to predict likely moves.
- The game does NOT expose enemy movesets before they are used. `pokemon.getMoveset()` is accessible at runtime for all Pokemon (including enemies), but providing this to the RL agent would give it information a human player doesn't have, fundamentally changing the game.
- Move history IS captured (`move_history` in PokemonState) so previously used moves are visible. But unrevealed moves remain hidden.

**Severity**: MEDIUM. Experienced human players predict enemy moves from species identity (e.g., "Gyarados probably has Dragon Dance and Waterfall"). The agent has no species identity encoding -- it sees stats, types, and ability but not the species. This makes moveset prediction harder than for humans. However, the agent does have access to exact enemy IVs, stats, and ability (information humans lack), which partially compensates.

**What would need to change**:
- Option A: Add species_id to Float32 encoding. Combined with a learned lookup, the agent could associate species with common movesets. Adds 1 dim per Pokemon (12 total). This IS feasible and is listed in Tier 4 recommendations.
- Option B: Expose enemy movesets as "cheating" information. Would improve RL training speed but creates an unrealistic policy that doesn't transfer to adversarial settings.
- Option C: Build a move prediction model (separate from the RL policy) that outputs probability distributions over likely enemy moves given species/stats/ability. Requires training data from many battles and a separate model component.

**Workaround**: The agent must learn to play conservatively against unknown movesets and adapt based on revealed moves (move_history). This is actually similar to how competitive players approach unknown opponents.

---

### U5. MysteryEncounter Option Evaluation

**What**: 100+ unique Mystery Encounters, each with 2-4 scripted options that produce different outcomes (heal, battle, item, stat change, team modification, etc.). The outcomes are defined in encounter-specific code, not in any queryable data structure.

**Why unsolvable in current framework**:
- Each encounter is a self-contained class with hardcoded outcome logic in `MysteryEncounterOption.onPreOptionPhase()` and `onPostOptionPhase()` callbacks.
- The agent sees: encounter_type (numeric ID), option labels (strings), and whether options meet requirements. It does NOT see the outcomes.
- A human reads the option text and uses game knowledge to evaluate "Option 1 heals my team, Option 2 gives a rare item but costs HP." The agent sees "Option 1" and "Option 2" with no semantic content.
- Encoding all 100+ encounter outcomes would require a manually-curated lookup table with ~50 outcome categories, or text embedding of option descriptions.

**Severity**: LOW-MEDIUM. Mystery Encounters are relatively rare (appear on some waves, not every wave). Most encounters have a "safe" default option. Suboptimal Mystery Encounter play costs efficiency but rarely causes run failure.

**What would need to change**:
- Option A: Manual lookup table mapping encounter_type + option_index to outcome categories (heal, damage, item_gain, item_loss, stat_change, battle, nothing). Requires cataloging all 100+ encounters. Estimated 2-3 person-days.
- Option B: Expose option description text and use a language model to evaluate options at inference time. Requires non-standard architecture.
- Option C: Always pick the default safe option (currently implemented as `pickDefaultAction` returns option 0).

**Workaround**: The agent will learn encounter-option associations through experience. Given the categorical encounter_type, the policy can memorize optimal choices for frequently encountered types. Rare encounters will be suboptimally handled.

---

### U6. Type Chart as Implicit Knowledge (Partial)

**What**: The 19x19 type effectiveness table (361 entries) determines damage multipliers. A human player knows this table from experience. The agent must learn it.

**Why partially unsolvable**:
- The base type chart IS static and could be hardcoded as pre-computed features. This is BEING addressed by the team (task #8: pre-compute type effectiveness per move-target pair, ~8 floats per active Pokemon).
- However, ability-based immunities and modifications make the effective type chart dynamic:
  - Levitate: immune to Ground
  - Flash Fire: immune to Fire (and gets a boost)
  - Thick Fat: halves Fire and Ice
  - Dry Skin: immune to Water (heals), weak to Fire (1.25x)
  - Sap Sipper: immune to Grass (and gets ATK boost)
  - Lightning Rod / Storm Drain: redirect and absorb
  - Scrappy: Normal/Fighting hit Ghost
  - Ring Target (item): removes immunity
  - Delta Stream: reduces super-effective hits on Flying
- These dynamic modifications depend on ability semantic encoding (U1), which is unsolved.

**Severity**: MEDIUM. The base type chart accounts for ~90% of type effectiveness interactions. The remaining ~10% (ability-based modifications) are important but affect a minority of matchups.

**What would need to change**:
- Base type chart: BEING FIXED (task #8).
- Ability-modified effectiveness: Requires U1 (ability semantic encoding) to be solved first. Then the pre-computed type effectiveness could account for known abilities.

**Workaround**: The static type chart pre-computation (in progress) handles the common case. Ability-modified effectiveness must be learned through experience.

---

### U7. Multi-Step Decision Sequences

**What**: Several game phases require two or more sequential decisions that don't map cleanly to the single-step action space:

1. **LearnMovePhase**: Step 1 = confirm learning (yes/no). Step 2 = pick which of 4 moves to replace. Currently handled by overloading actions 0-3 for slot selection and ACTION_SKIP for decline.
2. **AttemptCapturePhase with full party**: Step 1 = confirm capture. Step 2 = view summary. Step 3 = pick which Pokemon to release. Currently UNHANDLED (PH1, being fixed).
3. **Shop purchase flow**: Select item -> select target Pokemon (if Pokemon-specific) -> return to shop. Currently handled via MODIFIER_TARGET sub-phase.

**Why partially unsolvable**:
- The current 58-action flat action space works for single-step decisions but is awkward for multi-step sequences. The MODIFIER_TARGET sub-phase pattern (implemented by the team) provides a workaround but increases the number of decision steps per wave.
- A proper solution would use a hierarchical action space (macro-actions that expand to sub-sequences) or a recurrent policy that maintains state across sub-steps. Both require architectural changes to the RL training pipeline, not just the observation/action encoding.

**Severity**: LOW-MEDIUM. The workarounds (sub-phases, overloaded action indices) function correctly. They are inelegant but do not cause errors or hangs (once PH1 is fixed). The main cost is increased decision density (more steps per wave = slower training).

**What would need to change**:
- Option A: Accept the current workaround (sub-phases). Functional, already implemented.
- Option B: Implement options framework (semi-MDPs) where some actions trigger multi-step sub-routines executed without RL decisions. Requires training framework changes.
- Option C: Use a recurrent policy (LSTM/GRU) that can maintain context across sub-steps of a multi-step decision. Requires model architecture changes.

**Workaround**: Current sub-phase approach works. The phase router correctly splits multi-step decisions into sequential single-step decisions with appropriate action masks.

---

### U8. Perfect Play Optimization (Search/Planning)

**What**: Some strategic decisions require look-ahead reasoning:
- When to use setup moves (Swords Dance) vs. attacking immediately
- Optimal team composition from the initial starter set
- When to spend money vs. save for later waves
- Whether to catch a Pokemon (future value) vs. KO (immediate reward)
- Item selection that synergizes with the full team

**Why unsolvable in current framework**:
- These are **planning problems** that require multi-step reasoning about future states. A reactive policy (observe current state -> select action) cannot optimally solve them without either:
  1. Internal world model that simulates future states (model-based RL)
  2. Sufficient training to learn implicit value functions that capture long-term consequences
  3. Explicit search (Monte Carlo Tree Search, beam search) at inference time
- The current framework is designed for model-free RL (PPO, DQN, etc.) which learns reactive policies. Model-based approaches require a learned or programmatic world model.
- The game's stochastic elements (damage rolls, crit chances, encounter randomness) make perfect play theoretically unachievable even with full information.

**Severity**: MEDIUM. Model-free RL agents can learn surprisingly good heuristics for these decisions through experience. They will not achieve optimal play but can significantly outperform random play. The gap between "learned heuristic" and "optimal with search" is most significant for:
1. Setup move timing (addressed partially by shaped stat boost reward)
2. Item selection (addressed partially by tier bonus reward)
3. Team building (not addressed -- starter selection is currently hardcoded)

**What would need to change**:
- Option A: Shaped rewards (in progress) that provide intermediate signals for strategically valuable actions. Partially addresses setup moves and item selection.
- Option B: Model-based RL with learned dynamics model. Major research project.
- Option C: MCTS with the actual game as simulator (expensive but feasible for turn-based games). Requires exposing save/load state for rollbacks.

**Workaround**: Shaped rewards + sufficient training. The turn penalty encourages efficiency. The stat boost reward encourages setup. The modifier tier bonus encourages taking items. These heuristic rewards guide exploration toward better strategies without requiring explicit planning.

---

### U9. Full Party Release Decision During Capture

**What**: When the player catches a Pokemon with a full party (6 Pokemon), the game requires choosing which existing Pokemon to release. This decision requires evaluating the relative strategic value of 7 Pokemon (6 current + 1 new).

**Why unsolvable in current framework**:
- Pokemon value is a complex function of species, moves, stats, items, team synergy, remaining waves, and opponent predictions. There is no simple heuristic.
- The current action space supports selecting a party member (ACTION_PARTY_TARGET_START, 52-57), but evaluating which to release requires comparing all 7 options against future battle value.
- This is a planning problem (U8) applied to team composition.
- In practice, this decision is rare: the party fills to 6 relatively early, and subsequent captures require release decisions only in wild battles (trainer battles don't allow catching).

**Severity**: LOW. This scenario occurs infrequently. A simple heuristic (keep higher-level Pokemon, prefer type coverage) would handle most cases adequately. The bigger issue is PH1 (game hang when this occurs), which IS being fixed.

**What would need to change**:
- Phase router must handle the capture-with-full-party flow (being fixed as PH1).
- Intelligent release selection requires either a learned value function for Pokemon or a hand-crafted heuristic. A reasonable heuristic: keep the Pokemon with higher base stat total and better type coverage relative to the existing team.

**Workaround**: Once PH1 is fixed, a simple heuristic (release lowest-level/lowest-BST Pokemon) can serve as default. The RL agent can learn better policies through experience.

---

### U10. Evolution Cancel Decisions

**What**: When a Pokemon evolves, the player can cancel the evolution. This is sometimes optimal (Eviolite users get 1.5x DEF/SPDEF if not fully evolved; some pre-evolution forms have better abilities).

**Why unsolvable in current framework**:
- Currently all evolutions are auto-accepted (phase router presses ACTION on EvolutionPhase). There is no RL decision point for evolution.
- Adding evolution as a decision would require: (a) adding it to the action space, (b) providing observation data about the evolved form's stats/ability/type, (c) encoding Eviolite presence and its conditional benefit.
- Evaluating whether to cancel requires knowledge of the evolved form's properties AND the game meta (is Eviolite in inventory? will the evolved form lose a useful ability?). This is a planning problem.

**Severity**: LOW. In PokéRogue, evolution is almost always beneficial. The Eviolite strategy is niche and rarely optimal in the roguelite context where Pokemon are temporary per-run. Auto-accept is the correct default for >99% of cases.

**What would need to change**:
- Add EvolutionPhase as a real decision point in the phase router with accept/cancel actions.
- Add evolved form preview data (species_id, types, base_stats, ability) to the observation.
- Add Eviolite detection (is it in held items?) to the encoding.

**Workaround**: Auto-accept evolution. The expected value loss from always evolving is negligible in the roguelite format.

---

## Severity Summary

| ID | Item | Severity | Category |
|----|------|----------|----------|
| U1 | Ability semantic encoding | CRITICAL | Knowledge representation |
| U2 | Item effect encoding | HIGH | Knowledge representation |
| U3 | Full damage calculator | HIGH | Derived computation |
| U4 | Opponent moveset prediction | MEDIUM | Hidden information |
| U5 | MysteryEncounter option evaluation | LOW-MEDIUM | Knowledge representation |
| U6 | Type chart (ability-modified) | MEDIUM | Knowledge representation |
| U7 | Multi-step decision sequences | LOW-MEDIUM | Architecture |
| U8 | Perfect play optimization | MEDIUM | Training methodology |
| U9 | Party release during capture | LOW | Planning + architecture |
| U10 | Evolution cancel decisions | LOW | Architecture + planning |

---

## Research Directions

### Near-Term (Feasible with current architecture)

1. **Hand-authored ability feature table** (addresses U1): Map each ability_id to ~30 boolean/float features. Labor-intensive but adds massive value. Can be built incrementally starting with the 50 most common abilities.

2. **Item category encoding** (addresses U2): Group 50+ modifiers into ~10 functional categories. Add as one-hot per item slot. Low effort, moderate value.

3. **Simplified damage estimator** (addresses U3): Pure function in `src/rl/` that approximates damage from observation data. No game source changes needed. Can use the game's type chart constant and a simplified formula.

4. **Species-id encoding** (addresses U4 partially): Add species_id to Float32 as a normalized float. Combined with self-supervised pre-training on battle logs, enables implicit moveset prediction.

### Medium-Term (Requires training pipeline changes)

5. **Learned embeddings** (addresses U1, U2, U5): Replace flat Float32 vector with a model that has embedding layers for categorical features (ability_id, species_id, item_class, encounter_type). Requires switching from flat-vector RL to structured-input RL.

6. **Shaped auxiliary losses** (addresses U8): Add auxiliary prediction heads (predict enemy move, predict damage, predict KO probability) that provide gradient signal for strategic understanding without changing the action space.

7. **Curriculum learning** (addresses U8): Start training on early waves (waves 1-20) where decisions are simpler, then gradually increase difficulty. Helps the agent learn basic type effectiveness before encountering complex ability/item interactions.

### Long-Term (Research-grade)

8. **World model for planning** (addresses U8, U9): Learn a dynamics model of the battle system that can simulate future states. Enable Monte Carlo rollouts at inference time for decisions with long-term consequences (team building, item selection).

9. **Language-grounded observation** (addresses U1, U2, U5): Encode ability descriptions, item descriptions, and encounter text using a pre-trained language model. The resulting embeddings provide semantic understanding without manual feature engineering. Requires multimodal RL architecture.

10. **Self-play with opponent modeling** (addresses U4): Train a separate opponent model that predicts enemy actions given partial information. Use the opponent model's predictions as additional observation features for the policy.

---

## Conclusion

The 10 unsolved items cluster into three categories:

1. **Knowledge representation** (U1, U2, U5, U6): The agent lacks semantic understanding of game entities (abilities, items, encounters). This is the highest-impact gap. Hand-authored feature tables are the most practical near-term solution.

2. **Planning and search** (U3, U8, U9, U10): Some decisions require multi-step reasoning that reactive policies handle suboptimally. Shaped rewards provide partial mitigation. Full solutions require model-based RL or search.

3. **Hidden information** (U4): Opponent movesets are intentionally hidden. This is a feature of the game, not a framework limitation. Species encoding + experience learning provides reasonable coverage.

The team's current sprint fixes all SOLVABLE issues -- bugs, encoding gaps, phase handling, reward signals. The unsolved items above represent the theoretical ceiling of what the current flat-vector, model-free RL approach can achieve. Reaching that ceiling (through complete bug fixes + full encoding) should produce a competent agent that clears early-to-mid game waves. Pushing beyond requires the research directions outlined above.
