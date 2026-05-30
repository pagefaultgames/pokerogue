# Investigation 3: Phase System Control Flow

## Executive Summary

The PokeRogue game loop is driven by a **linear phase queue** managed by `globalScene.phaseManager`. Each phase's `start()` method runs game logic and eventually calls `this.end()` (which calls `phaseManager.shiftPhase()`) to advance to the next phase. Player decisions happen when a phase sets a UI mode (e.g., `UiMode.COMMAND`) and **waits for a callback** from the UI handler before ending itself.

For the RL agent, the critical insight is: **the game pauses at specific UI mode transitions**, and an RL agent must intercept these pauses to inject actions. The PhaseInterceptor in the test framework already does exactly this, making it the template for the RL action injection system.

---

## 1. Base Phase Architecture

### File: `src/phase.ts`

```typescript
export abstract class Phase {
  start() {}                              // Override to implement phase logic
  end() { globalScene.phaseManager.shiftPhase(); }  // Advance to next phase
  public abstract readonly phaseName: PhaseString;
}
```

- `start()` is called by the phase manager when this phase is at the front of the queue.
- `end()` pops this phase and starts the next one.
- Phases that await player input call `globalScene.ui.setMode(...)` with a callback, and only call `this.end()` inside that callback after the player has made a choice.

---

## 2. All Decision Phases (Requiring Player/RL Input)

### 2.1 CommandPhase (CRITICAL - Every Turn)

**File**: `src/phases/command-phase.ts`
**Class**: `CommandPhase extends FieldPhase`
**When**: Every turn for each active player Pokemon. Queued by `TurnInitPhase`.

**Input Expected**: One of 5 commands:
- `Command.FIGHT` (cursor = move index 0-3)
- `Command.TERA` (cursor = move index, also terastallizes)
- `Command.BALL` (cursor = pokeball type 0-5)
- `Command.POKEMON` (cursor = party slot index, args = [isBatonSwitch])
- `Command.RUN` (no cursor needed)

**Await Point**: Line ~198-200 in `start()`:
```typescript
globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
// OR for mystery encounter fight-only:
globalScene.ui.setMode(UiMode.FIGHT, this.fieldIndex);
```

**How UI Processes Selection**: The `CommandUiHandler` calls `commandPhase.handleCommand(command, cursor, ...)` when the player selects an option.

**Phase Progression**: `handleCommand()` returns `true` on success, which triggers `this.end()` at line 642.

**RL Integration Strategy**: Queue a prompt on `("CommandPhase", UiMode.COMMAND)` that calls `commandPhase.handleCommand(command, cursor, ...)` directly.

---

### 2.2 SelectTargetPhase (Doubles - Target Selection)

**File**: `src/phases/select-target-phase.ts`
**Class**: `SelectTargetPhase extends PokemonPhase`
**When**: After CommandPhase when a move needs an explicit target (doubles, single-target moves).

**Input Expected**: Array of `BattlerIndex` targets.

**Await Point**: Line 21:
```typescript
globalScene.ui.setMode(UiMode.TARGET_SELECT, this.fieldIndex, move, (targets: BattlerIndex[]) => { ... });
```

**How UI Processes Selection**: The `TargetSelectUiHandler` calls the callback with the selected target indices.

**Phase Progression**: The callback sets `turnCommand.targets`, then calls `this.end()`.

**RL Integration Strategy**: Queue a prompt on `("SelectTargetPhase", UiMode.TARGET_SELECT)` that calls `handler.setCursor(targetIndex)` then `handler.processInput(Button.ACTION)`.

---

### 2.3 SelectModifierPhase (Item Selection After Wave)

**File**: `src/phases/select-modifier-phase.ts`
**Class**: `SelectModifierPhase extends BattlePhase`
**When**: After winning a battle (non-boss waves get this), between waves.

**Input Expected**: Complex multi-row selection:
- Row 0: Bottom actions (Reroll=0, Transfer=1, Check Party=2, Lock Rarities=3)
- Row 1: Reward items (cursor = item index in typeOptions)
- Row 2+: Shop items (varying cursor positions)
- Cancel (rowCursor < 0 || cursor < 0): Skip items entirely (with confirm dialog)

**Await Point**: Line 126:
```typescript
this.resetModifierSelect(this._modifierSelectCallback);
// Which calls: globalScene.ui.setMode(UiMode.MODIFIER_SELECT, ...)
```

**How UI Processes Selection**: `ModifierSelectUiHandler` calls the `modifierSelectCallback(rowCursor, cursor)`.

**Phase Progression**:
- Selecting a reward item -> `applyModifier()` -> `super.end()`
- Skipping items -> confirm dialog -> `super.end()`
- Rerolling -> creates new `SelectModifierPhase` -> `super.end()`
- Pokemon-target items open party UI first, then apply

**RL Integration Strategy**:
- For simplicity, skip items: press CANCEL then ACTION on confirm dialog.
- For full control: call `modifierSelectCallback(rowCursor, cursor)` directly.
- Custom methods already added: `applyModifierDirectly()` and `skipPhase()`.

---

### 2.4 SwitchPhase (Forced Switch on Faint)

**File**: `src/phases/switch-phase.ts`
**Class**: `SwitchPhase extends BattlePhase`
**When**: After a player Pokemon faints (isModal=true, doReturn=false), or after optional switch prompts.

**Input Expected**: Party slot index (0-5) of Pokemon to switch in.

**Await Point**: Line 69:
```typescript
globalScene.ui.setMode(UiMode.PARTY,
  this.isModal ? PartyUiMode.FAINT_SWITCH : PartyUiMode.POST_BATTLE_SWITCH,
  fieldIndex, (slotIndex, option) => { ... });
```

**How UI Processes Selection**: `PartyUiHandler` calls the callback with the selected slot and option.

**Phase Progression**: Callback creates `SwitchSummonPhase`, then calls `super.end()`.

**RL Integration Strategy**: Queue a prompt on `("SwitchPhase", UiMode.PARTY)` that selects a valid (non-fainted, not on field) party member.

---

### 2.5 CheckSwitchPhase (Optional Pre-Battle Switch)

**File**: `src/phases/check-switch-phase.ts`
**Class**: `CheckSwitchPhase extends BattlePhase`
**When**: At the start of a wild battle encounter (if battle style is "Switch").

**Input Expected**: Yes/No confirmation.

**Await Point**: Line 68-79:
```typescript
globalScene.ui.setMode(UiMode.CONFIRM,
  () => { /* Yes: queue SwitchPhase, end */ },
  () => { /* No: end */ }
);
```

**Early Exits**: Skips if Set mode, no alternate Pokemon, Pokemon is trapped, etc.

**RL Integration Strategy**: Queue a prompt on `("CheckSwitchPhase", UiMode.CONFIRM)`. Usually just decline (press CANCEL).

---

### 2.6 LearnMovePhase (Replace a Move)

**File**: `src/phases/learn-move-phase.ts`
**Class**: `LearnMovePhase extends PlayerPartyMemberPokemonPhase`
**When**: When a Pokemon levels up and tries to learn a new move while having 4 moves already.

**Input Expected**: Multi-step decision:
1. "Should a move be forgotten?" -> `UiMode.CONFIRM` (Yes/No)
2. If Yes: "Which move?" -> `UiMode.SUMMARY` with `SummaryUiMode.LEARN_MOVE` (move index 0-3, or 4 to cancel)
3. If No or Cancel: "Stop teaching?" -> `UiMode.CONFIRM` (Yes=don't learn, No=try again)

**Await Points**:
- Line 84: `UiMode.CONFIRM` for initial question
- Line 109: `UiMode.SUMMARY` for move selection
- Line 147: `UiMode.CONFIRM` for rejection confirmation

**Phase Progression**: Eventually calls `this.end()` after learning or declining.

**RL Integration Strategy**: This is complex multi-step. For simplicity, always decline to learn (or always replace the weakest move). Need to queue multiple prompts.

---

### 2.7 EvolutionPhase (Evolve or Cancel)

**File**: `src/phases/evolution-phase.ts`
**Class**: `EvolutionPhase extends Phase`
**When**: After level-up triggers an evolution.

**Input Expected**: Player can press B during the evolution animation cycle to cancel (line 262-264):
```typescript
this.evolutionHandler.canCancel = this.canCancel;
// During doCycle, if cancelled:
if (this.evolutionHandler.cancelled) { this.handleFailedEvolution(evolvedPokemon); }
```

**Decision Point**: Not a traditional UI mode pause. The `EvolutionSceneUiHandler` has a `canCancel` flag and the player can press B during the animation to set `cancelled = true`.

**Post-Cancel**: Shows "pause evolutions?" confirm dialog (line 312-331).

**RL Integration Strategy**: For RL, always let evolution proceed (don't cancel). No prompt needed unless we want to pause evolutions.

---

### 2.8 MysteryEncounterPhase (ME Option Selection)

**File**: `src/phases/mystery-encounter-phases.ts`
**Class**: `MysteryEncounterPhase extends Phase`
**When**: During mystery encounter waves.

**Input Expected**: Selection of encounter option (varies per encounter, typically 2-3 options).

**Await Point**: Line 66:
```typescript
globalScene.ui.setMode(UiMode.MYSTERY_ENCOUNTER, this.optionSelectSettings);
```

**How UI Processes Selection**: `MysteryEncounterUiHandler` calls `phase.handleOptionSelect(option, index)`.

**Phase Progression**: `handleOptionSelect()` -> `continueEncounter()` -> `MysteryEncounterOptionSelectedPhase` -> `this.end()`.

**RL Integration Strategy**: Queue a prompt on `("MysteryEncounterPhase", UiMode.MYSTERY_ENCOUNTER)`. Select option by index.

---

### 2.9 SelectStarterPhase (Team Selection - Game Start)

**File**: `src/phases/select-starter-phase.ts`
**Class**: `SelectStarterPhase extends Phase`
**When**: At game start, after title screen.

**Input Expected**: Array of `Starter` objects (species, form, ability, nature, etc.).

**Await Point**: Line 22:
```typescript
globalScene.ui.setMode(UiMode.STARTER_SELECT, (starters: Starter[]) => { ... });
```

**Phase Progression**: Callback also opens save slot selection, then calls `initBattle()` and `this.end()`.

**RL Integration Strategy**: For RL, bypass entirely by directly calling `selectStarterPhase.initBattle(starters)` with pre-chosen starters (as the test framework does).

---

### 2.10 SelectBiomePhase (Map Navigation)

**File**: `src/phases/select-biome-phase.ts`
**Class**: `SelectBiomePhase extends BattlePhase`
**When**: After every 10th wave (biome transition), IF player has a Map item.

**Input Expected**: Selection of next biome from available options.

**Await Point**: Line 71:
```typescript
globalScene.ui.setMode(UiMode.OPTION_SELECT, { options: biomeSelectItems, delay: 1000 });
```

**Condition**: Only shows selection UI if `biomes.length > 1` AND player has `MapModifier`. Otherwise auto-selects.

**RL Integration Strategy**: Queue a prompt on `("SelectBiomePhase", UiMode.OPTION_SELECT)` if map is present.

---

### 2.11 TitlePhase (Game Mode Selection)

**File**: `src/phases/title-phase.ts`
**Class**: `TitlePhase extends Phase`
**When**: At game startup.

**Input Expected**: Continue/New Game/Load Game/Settings selection, then game mode selection.

**Await Point**: Line 177:
```typescript
globalScene.ui.setMode(UiMode.TITLE, config);
```

**RL Integration Strategy**: Bypass entirely in test/RL by using `onNextPrompt` to skip directly to game initialization.

---

### 2.12 SelectChallengePhase (Challenge Configuration)

**File**: `src/phases/select-challenge-phase.ts`
**Class**: `SelectChallengePhase extends Phase`
**When**: When starting Challenge mode.

**Await Point**: Line 12:
```typescript
globalScene.ui.setMode(UiMode.CHALLENGE_SELECT);
```

**RL Integration Strategy**: Not relevant for standard RL training.

---

### 2.13 SelectGenderPhase (Player Gender)

**File**: `src/phases/select-gender-phase.ts`
**Class**: `SelectGenderPhase extends Phase`
**When**: First time setup.

**Await Point**: Line 14:
```typescript
globalScene.ui.setMode(UiMode.OPTION_SELECT, { options: [...] });
```

**RL Integration Strategy**: Bypass by pre-setting gender in game data.

---

### 2.14 RevivalBlessingPhase (Revive Target Selection)

**File**: `src/phases/revival-blessing-phase.ts`
**Class**: `RevivalBlessingPhase extends BattlePhase`
**When**: When Revival Blessing move is used successfully.

**Input Expected**: Party slot of fainted Pokemon to revive.

**Await Point**: Line 22:
```typescript
globalScene.ui.setMode(UiMode.PARTY, PartyUiMode.REVIVAL_BLESSING, ...);
```

**RL Integration Strategy**: Queue a prompt to select a fainted party member.

---

### 2.15 GameOverPhase (Retry Battle)

**File**: `src/phases/game-over-phase.ts`
**Class**: `GameOverPhase extends BattlePhase`
**When**: When player loses all Pokemon or wins the game.

**Input Expected** (loss only, if retries enabled): Yes/No to retry battle.

**Await Point**: Line 77-79:
```typescript
globalScene.ui.setMode(UiMode.CONFIRM, () => { /* retry */ }, () => { /* game over */ });
```

**RL Integration Strategy**: For RL training, game over = episode end. No input needed.

---

### 2.16 EggSummaryPhase (Egg Hatch Summary)

**File**: `src/phases/egg-summary-phase.ts`
**When**: After eggs hatch between waves.

**Await Point**: `UiMode.EGG_HATCH_SUMMARY` - player dismisses summary screen.

**RL Integration Strategy**: Auto-dismiss.

---

### 2.17 EndCardPhase (Victory Screen)

**File**: `src/phases/end-card-phase.ts`
**When**: After classic mode victory.

**Await Point**: Shows "Congratulations" text, waits for player input to dismiss.

**RL Integration Strategy**: Episode end, no input needed.

---

## 3. PhaseInterceptor Deep Dive

**File**: `test/test-utils/phase-interceptor.ts`

### 3.1 Architecture

The `PhaseInterceptor` monkey-patches two critical methods:
1. **`Phase.prototype.end`** -> Replaced with `superEndPhase()` which calls the original `end()` AND resolves the current `inProgress` promise.
2. **`UI.prototype.setMode`** -> Replaced with `setMode()` which calls the original AND, for phases in the `endBySetMode` list, resolves the `inProgress` promise early.

For each phase class in `this.PHASES`, it replaces `start()` with a wrapper that:
1. Logs the phase name
2. Pushes the phase onto `onHold` (a queue of pending phase starts)
3. Does NOT actually run the original `start()` until `run()` is called

### 3.2 How `to()` Works

```typescript
async to(phaseTo, runTarget = true): Promise<void> {
  // Polls via setInterval checking onHold queue
  // If current phase != target: run current phase and wait
  // If current phase == target: run it (if runTarget) and resolve
}
```

Polling mechanism: `setInterval` that checks `this.onHold[0]` repeatedly.

### 3.3 How `run()` Works

```typescript
private run(): Promise<void> {
  // Polls via setInterval waiting for onHold to have entries
  // Shifts the first entry off onHold
  // Stores resolve/reject in this.inProgress
  // Calls currentPhase.call() (which runs the original start())
  // Promise resolves when superEndPhase() or setMode() triggers inProgress.callback()
}
```

### 3.4 Phase Start vs End Detection

- **Start detected**: When the monkey-patched `start()` fires, pushing to `onHold`.
- **End detected**: Two mechanisms:
  1. `Phase.prototype.end` (patched as `superEndPhase`) -> calls `inProgress.callback()`
  2. For `endBySetMode` phases: `UI.prototype.setMode` (patched) -> calls `inProgress.callback()`

### 3.5 `endBySetMode` Phases

These phases are considered "ended" when they call `ui.setMode()` (because they pause for user input and don't call `this.end()` until after input):
- `TitlePhase`
- `SelectGenderPhase`
- `CommandPhase`
- `SelectStarterPhase`
- `SelectModifierPhase`
- `MysteryEncounterPhase`
- `PostMysteryEncounterPhase`

This is the key insight: **these are exactly the decision phases** where the game pauses for player input!

### 3.6 Prompt System

```typescript
startPromptHandler() {
  // Polls via setInterval checking this.prompts
  // Matches against: current UI mode, current phase, handler active status
  // If match found: shifts prompt and calls its callback
}
```

The `addToNextPrompt()` method queues callbacks that fire when:
1. `currentMode === prompt.mode`
2. `currentPhase === prompt.phaseTarget`
3. `currentHandler.active === true`
4. Optionally `handler.awaitingActionInput === true`

### 3.7 `toNextTurn()` Flow

```typescript
async toNextTurn() {
  await this.phaseInterceptor.to("TurnInitPhase");  // Run until TurnInitPhase starts and ends
  await this.phaseInterceptor.to("CommandPhase");    // Run until CommandPhase starts and ends
}
```

Since CommandPhase is in `endBySetMode`, it "ends" (from interceptor's perspective) as soon as `ui.setMode(UiMode.COMMAND)` is called, even though the phase hasn't actually ended yet.

### 3.8 `toNextWave()` Flow

```typescript
async toNextWave() {
  this.doSelectModifier();  // Queue prompts to skip item selection
  // Queue prompt to skip CheckSwitchPhase
  await this.phaseInterceptor.to("TurnInitPhase");
  await this.phaseInterceptor.to("CommandPhase");
}
```

---

## 4. GameManager Helper Analysis

**File**: `test/test-utils/game-manager.ts`

### 4.1 `game.move.select()` (MoveHelper)

**File**: `test/test-utils/helpers/move-helper.ts`

```typescript
select(move, pkmIndex, targetIndex) {
  // 1. Queue prompt: when CommandPhase is in UiMode.COMMAND, switch to FIGHT mode
  game.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
    scene.ui.setMode(UiMode.FIGHT, commandPhase.getFieldIndex());
  });

  // 2. Queue prompt: when CommandPhase is in UiMode.FIGHT, call handleCommand directly
  game.onNextPrompt("CommandPhase", UiMode.FIGHT, () => {
    commandPhase.handleCommand(Command.FIGHT, movePosition, MoveUseMode.NORMAL);
  });

  // 3. Queue target selection prompt
  game.selectTarget(movePosition, targetIndex);
}
```

This is the pattern the RL agent should follow:
1. Detect CommandPhase is waiting
2. Call `handleCommand()` directly with the chosen action
3. If target selection is needed, handle SelectTargetPhase

### 4.2 `game.doSelectModifier()`

```typescript
doSelectModifier() {
  // Press CANCEL on modifier select screen
  onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, () => {
    handler.processInput(Button.CANCEL);
  });
  // Press ACTION on confirm dialog to skip
  onNextPrompt("SelectModifierPhase", UiMode.CONFIRM, () => {
    handler.processInput(Button.ACTION);
  });
}
```

### 4.3 `game.doSwitchPokemon(pokemonIndex)`

```typescript
doSwitchPokemon(pokemonIndex) {
  // In CommandPhase, select POKEMON command (cursor=2)
  onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
    handler.setCursor(2);
    handler.processInput(Button.ACTION);
  });
  // Then select party member
  doSelectPartyPokemon(pokemonIndex, "CommandPhase");
}
```

### 4.4 `game.doThrowPokeball(ballIndex)`

```typescript
doThrowPokeball(ballIndex) {
  // In CommandPhase, select BALL command (cursor=1)
  onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
    handler.setCursor(1);
    handler.processInput(Button.ACTION);
  });
  // In ball select UI, select ball type
  onNextPrompt("CommandPhase", UiMode.BALL, () => {
    ballHandler.setCursor(ballIndex);
    ballHandler.processInput(Button.ACTION);
  });
}
```

---

## 5. Complete Turn Lifecycle

```
TurnInitPhase
  -> Queues CommandPhase for each active player Pokemon
  -> Queues EnemyCommandPhase for each active enemy Pokemon
  -> Queues TurnStartPhase

CommandPhase (for each player Pokemon)
  -> Sets UiMode.COMMAND  ** DECISION POINT **
  -> Player selects FIGHT/BALL/POKEMON/RUN/TERA
  -> If FIGHT: may queue SelectTargetPhase
  -> Fills turnCommands[fieldIndex]

SelectTargetPhase (if needed)
  -> Sets UiMode.TARGET_SELECT  ** DECISION POINT **
  -> Player selects target BattlerIndex

EnemyCommandPhase (automated, no player input)

TurnStartPhase
  -> Sorts actions by priority/speed
  -> Queues MovePhases, SwitchSummonPhases, etc.

MovePhase -> MoveEffectPhase -> DamageAnimPhase -> etc.

FaintPhase (if any Pokemon fainted)
  -> If player Pokemon fainted: queues SwitchPhase (modal)

SwitchPhase (if faint occurred)
  -> Sets UiMode.PARTY  ** DECISION POINT **
  -> Player selects replacement Pokemon

TurnEndPhase
  -> End of turn effects

--- If battle won ---
VictoryPhase
  -> Queues SelectModifierPhase (items)
  -> Queues SelectBiomePhase (if biome change)
  -> Queues NewBattlePhase

SelectModifierPhase
  -> Sets UiMode.MODIFIER_SELECT  ** DECISION POINT **
  -> Player picks/skips items

CheckSwitchPhase (at new encounter, Switch mode only)
  -> Sets UiMode.CONFIRM  ** DECISION POINT **

--- If leveled up ---
LearnMovePhase (if moveset full)
  -> Multiple UiMode transitions  ** DECISION POINT **

EvolutionPhase (if evolution triggered)
  -> Player can cancel  ** OPTIONAL DECISION POINT **
```

---

## 6. RL Action Space Mapping

### Primary Decision Points (during battle):

| Phase | UiMode | Action Space | Frequency |
|-------|--------|-------------|-----------|
| CommandPhase | COMMAND | FIGHT(4 moves), BALL(6 types), POKEMON(6 slots), RUN, TERA(4 moves) | Every turn per active Pokemon |
| SelectTargetPhase | TARGET_SELECT | BattlerIndex (0-3) | Doubles only, single-target moves |
| SwitchPhase | PARTY | Party slot (0-5) | On faint or forced switch |

### Secondary Decision Points (between waves):

| Phase | UiMode | Action Space | Frequency |
|-------|--------|-------------|-----------|
| SelectModifierPhase | MODIFIER_SELECT | Row+Cursor (skip, reroll, pick reward, buy shop item) | After each non-boss wave |
| CheckSwitchPhase | CONFIRM | Yes/No | Start of wild encounters (Switch mode) |
| SelectBiomePhase | OPTION_SELECT | Biome index | Every 10 waves (if Map item) |

### Rare Decision Points:

| Phase | UiMode | Action Space | Frequency |
|-------|--------|-------------|-----------|
| LearnMovePhase | CONFIRM+SUMMARY | Yes/No + move index (0-4) | On level-up with full moveset |
| EvolutionPhase | (none/B button) | Cancel or allow | On level-up evolution |
| MysteryEncounterPhase | MYSTERY_ENCOUNTER | Option index (0-2) | Mystery encounter waves |
| RevivalBlessingPhase | PARTY | Fainted party slot | When Revival Blessing used |
| GameOverPhase | CONFIRM | Retry Yes/No | On loss |

---

## 7. Key Architectural Insights for RL

### 7.1 Phase Detection Strategy

The RL environment should detect decision points by:
1. Checking `globalScene.phaseManager.getCurrentPhase().phaseName`
2. Checking `globalScene.ui.getMode()`
3. For `endBySetMode` phases, the phase is paused once it calls `setMode()`

### 7.2 Action Injection Strategy

Two approaches:

**Approach A: Direct method calls** (what the test framework does)
- Call `commandPhase.handleCommand(command, cursor, ...)` directly
- Call `handler.processInput(Button.ACTION)` on UI handlers
- Pros: Clean, well-tested pattern
- Cons: Must match exact phase/mode state

**Approach B: Prompt queue** (PhaseInterceptor pattern)
- Use `addToNextPrompt(phaseTarget, mode, callback)` to queue actions
- Callbacks fire automatically when conditions match
- Pros: Handles timing automatically
- Cons: More complex, requires polling

**Recommendation**: Approach A for the RL environment, with the phase interceptor's `to()` mechanism for advancing between decision points.

### 7.3 Minimal RL Decision Loop

For a basic RL agent, the minimal loop per turn is:
1. Observe game state
2. At `CommandPhase` + `UiMode.COMMAND`: choose action (move/switch/ball/run)
3. If doubles + single-target move: at `SelectTargetPhase` choose target
4. Advance game until next decision point
5. Between waves: at `SelectModifierPhase` choose item or skip
6. On faint: at `SwitchPhase` choose replacement

### 7.4 Non-Decision Phases to Auto-Skip

These appear in the phase queue but require no player input:
- `EncounterPhase`, `SummonPhase`, `PostSummonPhase` (battle setup)
- `TurnStartPhase` (action ordering)
- `MovePhase`, `MoveEffectPhase`, `DamageAnimPhase` (battle execution)
- `BerryPhase`, `TurnEndPhase` (turn cleanup)
- `VictoryPhase`, `BattleEndPhase` (battle results)
- `ExpPhase`, `PartyExpPhase`, `LevelUpPhase` (experience)
- `StatStageChangePhase` (stat changes)
- `ShinySparklePhase`, `ShowAbilityPhase` (visual effects)
- `NewBattlePhase`, `NextEncounterPhase` (wave transitions)
- `EnemyCommandPhase` (AI-controlled)

---

## 8. PhaseInterceptor Integration Notes

### Phases Registered in PhaseInterceptor

The interceptor tracks 56 phase classes (line 125-188). Any phase NOT in this list will cause an error if it calls `setMode()` during testing.

### endBySetMode List (Critical for RL)

These 7 phases are the ones where the interceptor considers the phase "paused" (waiting for input) when they call `setMode()`:
1. `TitlePhase`
2. `SelectGenderPhase`
3. `CommandPhase`
4. `SelectStarterPhase`
5. `SelectModifierPhase`
6. `MysteryEncounterPhase`
7. `PostMysteryEncounterPhase`

**This list is the RL agent's primary set of decision intercept points.**

Note: `SwitchPhase`, `CheckSwitchPhase`, `LearnMovePhase`, `SelectTargetPhase`, `RevivalBlessingPhase`, `SelectBiomePhase`, and `GameOverPhase` also pause for input but are NOT in `endBySetMode`. They end via their callback calling `this.end()` directly, which the interceptor detects through the patched `Phase.prototype.end`.

---

## 9. Summary Table: All Decision Phases

| # | Phase Class | File | UI Mode | endBySetMode? | RL Priority |
|---|-------------|------|---------|---------------|-------------|
| 1 | CommandPhase | command-phase.ts | COMMAND/FIGHT | YES | CRITICAL |
| 2 | SelectTargetPhase | select-target-phase.ts | TARGET_SELECT | no | CRITICAL (doubles) |
| 3 | SelectModifierPhase | select-modifier-phase.ts | MODIFIER_SELECT | YES | HIGH |
| 4 | SwitchPhase | switch-phase.ts | PARTY | no | HIGH |
| 5 | CheckSwitchPhase | check-switch-phase.ts | CONFIRM | no | MEDIUM |
| 6 | LearnMovePhase | learn-move-phase.ts | CONFIRM/SUMMARY | no | MEDIUM |
| 7 | EvolutionPhase | evolution-phase.ts | (B button cancel) | no | LOW |
| 8 | MysteryEncounterPhase | mystery-encounter-phases.ts | MYSTERY_ENCOUNTER | YES | LOW (disabled in RL) |
| 9 | SelectStarterPhase | select-starter-phase.ts | STARTER_SELECT | YES | SETUP ONLY |
| 10 | TitlePhase | title-phase.ts | TITLE | YES | SETUP ONLY |
| 11 | SelectBiomePhase | select-biome-phase.ts | OPTION_SELECT | no | LOW |
| 12 | SelectGenderPhase | select-gender-phase.ts | OPTION_SELECT | YES | SETUP ONLY |
| 13 | SelectChallengePhase | select-challenge-phase.ts | CHALLENGE_SELECT | no | SETUP ONLY |
| 14 | RevivalBlessingPhase | revival-blessing-phase.ts | PARTY | no | RARE |
| 15 | GameOverPhase | game-over-phase.ts | CONFIRM | no | EPISODE END |
| 16 | FormChangePhase | form-change-phase.ts | EVOLUTION_SCENE | no | AUTO |
| 17 | EggSummaryPhase | egg-summary-phase.ts | EGG_HATCH_SUMMARY | no | AUTO |
| 18 | EndCardPhase | end-card-phase.ts | (text dismiss) | no | EPISODE END |
