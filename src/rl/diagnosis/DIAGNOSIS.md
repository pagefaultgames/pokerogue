# Dual-Mode RL Runner: Unified Diagnosis

> Synthesized from investigations 1-6. References point to source files in the PokeRogue codebase.

---

## 1. Executive Summary

Dual-mode RL runner is **FEASIBLE**. The existing test mock infrastructure already solves ~90% of Phaser decoupling. Key insight: we don't need to separate game logic from Phaser -- we keep Phaser loaded in headless mode but mock the rendering subsystems, same as the test harness does. The main new work is: (a) a Vite build config for Node.js, (b) a phase decision router that replaces PhaseInterceptor's Vitest-dependent polling, and (c) wiring it all together in a clean runner API.

**Evidence**: The test suite runs thousands of tests using `Phaser.HEADLESS` + `GameWrapper.injectMandatory()` (`test/test-utils/game-wrapper.ts:63-199`) which replaces ~20 Phaser subsystems with mocks. All battle logic -- damage, type effectiveness, stat stages, abilities, items -- runs correctly through this mock layer. The standalone runner (`src/rl/standalone-runner.ts`) already proves that `GameManager` can be instantiated without any `vi.*` calls, and `src/rl/standalone-setup.ts` replaces all `vi.mock()` module-level mocking with `Object.defineProperty` getters and filesystem-backed fetch interception.

---

## 2. Blockers for Standalone Headless Execution

### HARD BLOCKERS

1. **Module Resolution** -- Path aliases (`#app/*`, `#enums/*`, `#field/*`, `#test/*`, etc.) and `import.meta.*` expressions require Vite transforms. Cannot run with raw Node.js/tsx. The project's `tsconfig.json` uses `moduleResolution: "bundler"` and defines path aliases that only Vite (or Vitest) can resolve at runtime.
   - **Fix**: Create `vite.headless.config.ts` that bundles for Node.js target, resolving all path aliases and `import.meta.env` references at build time.
   - **Complexity**: LOW.
   - **Evidence**: `src/rl/standalone-runner.ts:7-9` documents this requirement. The existing `vite.interactive.config.ts` at project root already demonstrates a non-default Vite config for RL use.

2. **jsdom/DOM Environment** -- Phaser HEADLESS mode still references DOM APIs (`document.createElement`, `window`, `HTMLCanvasElement`, `navigator`) transitively at module load time. Even `import Phaser from "phaser"` requires these globals.
   - **Fix**: Use jsdom as a dependency in headless mode. Already proven in `src/rl/interactive-boot.ts:10-50` which installs jsdom globals (`window`, `document`, `navigator`, `HTMLCanvasElement`, `HTMLElement`, `HTMLVideoElement`, `HTMLDivElement`, `Element`, `screen`, `localStorage`, `Image`, `XMLHttpRequest`, `DOMParser`, `Blob`, `requestAnimationFrame`, `matchMedia`, `getComputedStyle`) before importing Phaser.
   - **Complexity**: LOW.
   - **Alternative**: happy-dom is lighter than jsdom and may be sufficient for the DOM surface area Phaser actually touches.

### MODERATE BLOCKERS

3. **PhaseInterceptor is Vitest-coupled** -- The `PhaseInterceptor` (`test/test-utils/phase-interceptor.ts:99-248`) uses `setInterval`-based polling to detect phase transitions and queue prompts. While the class itself does not import `vi.*`, it depends on Vitest's test lifecycle (each test creates a new `GameManager` which creates a new `PhaseInterceptor` in `beforeEach`). More importantly, the RL agent needs event-driven phase detection, not polling.
   - **Fix**: Create `phase-router.ts` using the `endBySetMode` pattern -- hook `UI.setMode()` to detect decision phases. The PhaseInterceptor already identifies the 7 key `endBySetMode` phases (`TitlePhase`, `SelectGenderPhase`, `CommandPhase`, `SelectStarterPhase`, `SelectModifierPhase`, `MysteryEncounterPhase`, `PostMysteryEncounterPhase`) at `phase-interceptor.ts:190-198`. The router would intercept `setMode()` the same way but resolve a Promise instead of pushing to a poll-checked queue.
   - **Complexity**: MODERATE.
   - **Design**: When a decision phase calls `globalScene.ui.setMode(mode, ...args)`, the router's patched `setMode` fires a callback/resolves a Promise, yielding control to the RL agent. The agent inspects game state, calls the appropriate handler (e.g., `commandPhase.handleCommand(command, cursor)` per `test/test-utils/helpers/move-helper.ts:50-60`), and the phase resumes.

4. **Tween-gated state transitions** -- `FaintPhase` (`src/phases/faint-phase.ts:200-218`), `MoveEffectPhase` (`src/phases/move-effect-phase.ts:221-311`), `StatStageChangePhase` (`src/phases/stat-stage-change-phase.ts:268-288`), and 10+ other phases gate critical logic inside `globalScene.tweens.add({ onComplete })` callbacks. Without mocking, these callbacks never fire in headless mode and phases hang forever.
   - **Fix**: ALREADY SOLVED by `GameWrapper.injectMandatory()` at `game-wrapper.ts:111-129` which replaces `scene.tweens` with a mock that immediately fires `onComplete` on `add()`, `chain()`, and `addCounter()`. Just reuse the same mock.
   - **Complexity**: TRIVIAL.
   - **Code reference**:
     ```typescript
     // game-wrapper.ts:111-129
     this.scene.tweens = {
       add: data => { data.onComplete?.(); },
       chain: data => {
         data?.tweens?.forEach(tween => tween.onComplete?.());
         data.onComplete?.();
       },
       addCounter: data => { data.onComplete?.(); },
       getTweensOf: () => [],
       killTweensOf: () => [],
     };
     ```

5. **Timer-gated phase transitions** -- 60+ `time.delayedCall()` and `time.addEvent()` calls across phases gate state transitions. `EvolutionPhase` alone has 14 timer calls; `SummonPhase` has 5; `DamageAnimPhase` has 2.
   - **Fix**: ALREADY SOLVED by `MockClock` (`test/test-utils/mocks/mock-clock.ts`) which overrides all delays to 1ms and pumps the Phaser clock via `setInterval(() => { this.preUpdate(...); this.update(...); }, 1)`. Reuse directly.
   - **Complexity**: TRIVIAL.

6. **Decision phase coverage** -- 18 decision phases identified (see Section 4). The test harness handles ~6 of them well (`CommandPhase`, `SelectTargetPhase`, `SelectModifierPhase`, `SwitchPhase`, `CheckSwitchPhase`, `TitlePhase/SelectStarterPhase` via bypass). The remaining 12 either auto-complete, are rare, or lack test helpers.
   - **Fix**: Implement handlers for the remaining phases with sensible defaults. For `LearnMovePhase`: always decline (or replace weakest move). For `EvolutionPhase`: always allow. For `SelectBiomePhase`: pick first option. For `MysteryEncounterPhase`: pick first option. For `GameOverPhase`: episode ends.
   - **Complexity**: MODERATE.

### ARCHITECTURAL (work with, don't fight)

7. **Pokemon extends Phaser.GameObjects.Container** -- `src/field/pokemon.ts:181` declares `export abstract class Pokemon extends Phaser.GameObjects.Container`. All game state (HP, stats, moves, abilities, status, tags) lives as properties on this Container subclass. Cannot create a Pokemon without a valid Phaser scene. This is fundamental and intentional -- 5600+ lines of logic in `pokemon.ts` depend on this hierarchy.
   - **Fix**: Keep Phaser loaded, use `Phaser.HEADLESS` type. No separation needed. The test harness already uses `MockContainer`/`MockSprite` (`test/test-utils/mocks/mocks-container/`) which provide real Phaser Container instances with no-op rendering methods.
   - **Non-option**: Extracting game state into a separate data layer would require rewriting `pokemon.ts` and every file that interacts with Pokemon. This is a massive refactor with no benefit since keeping Phaser loaded is cheap.

### COSMETIC

8. **vitest-canvas-mock** -- Provides `HTMLCanvasElement.getContext("2d")` for jsdom, needed because Phaser's TextureManager calls canvas APIs transitively.
   - **Fix**: Already have standalone canvas mock at `test/test-utils/mocks/mock-context-canvas.ts` and `test/test-utils/test-file-initialization.ts:71` which overrides `HTMLCanvasElement.prototype.getContext`. The `interactive-boot.ts` also has its own comprehensive canvas mock.
   - **Complexity**: TRIVIAL.

9. **console.error/warn suppression** -- Test harness uses `MockConsole` (`test/test-utils/mocks/mock-console/mock-console.ts`) to suppress noisy output and blacklist certain messages.
   - **Fix**: Optional, configure per mode. Can use MockConsole for quiet headless training, or leave console unmodified for debugging.
   - **Complexity**: TRIVIAL.

---

## 3. Rendering Boundary

### SHARED (both modes)

- **`initializeGame()`** (`src/init/init.ts`) -- all static data loading: `initModifierTypes()`, `initModifierPools()`, `initAchievements()`, `initVouchers()`, `initStatsKeys()`, `initPokemonPrevolutions()`, `initPokemonStarters()`, `initBiomes()`, `initPokemonForms()`, `initTrainerTypeDialogue()`, `initSpecies()`, `initMoves()`, `initAbilities()`, `initChallenges()`, `initMysteryEncounters()`. Zero rendering dependencies -- pure TypeScript data registration.
- **All phase logic** -- the phase queue (`PhaseManager`), phase execution, command handling. The phase system (`src/phase.ts`) is a linear queue where `start()` runs logic and `end()` advances to the next phase.
- **All battle math** -- damage calc (`pokemon.ts:getAttackDamage()`), type effectiveness (`pokemon.ts:getMoveEffectiveness()`), stat stages, critical hits, RNG via `Phaser.Math.RND`.
- **Phaser core**: `Phaser.Math.RND` (pure JS math, no rendering), `Phaser.Events.EventEmitter` (pub/sub), `Phaser.GameObjects.Container` hierarchy (structural parent of Pokemon).
- **Pokemon stats, HP, status, moves, abilities** -- all pure properties on the Pokemon class. `damage()` directly subtracts HP (`pokemon.ts:3879`), `calculateStats()` is pure arithmetic, `getTypes()`/`getAbility()`/`getMoveQueue()` are pure getters.
- **Modifier system logic** -- pool generation (`src/modifier/init-modifier-pools.ts`), `ModifierType.newModifier()` (factory), `PersistentModifier.add()` (array manipulation), cost calculation. Pool generation uses only `randSeedInt` and weight math.
- **Seeded RNG** -- all randomness flows through `Phaser.Math.RND` via `src/utils/common.ts` (`randSeedInt()`, `randSeedFloat()`, `randSeedItem()`, `randSeedShuffle()`, `randSeedGauss()`). Works in Node.js without rendering. Seed management in `BattleScene.resetSeed()` (`battle-scene.ts:1826`) and `Battle.randSeedInt()` (`battle.ts:472`).

### HEADLESS-ONLY (mocked/skipped)

- **`GameWrapper.injectMandatory()`** mocks (`game-wrapper.ts:63-199`): renderer (`gl: {}`), sound (all no-ops), cameras (no-op pipeline methods), tweens (immediate `onComplete`), loader (`MockLoader`), textures (`MockTextureManager`), time (`MockClock`), sys (massive stub), add (routed through `MockTextureManager`), make (`MockGameObjectCreator`).
- **Prototype stubs** (`game-wrapper.ts:38-53`): `MoveAnim.prototype.getAnim = () => ({ frames: {} })`, `Pokemon.prototype.enableMask = () => null`, `Pokemon.prototype.updateFusionPalette = () => null`, `Pokemon.prototype.cry = () => null`, `Pokemon.prototype.faintCry = cb => { if (cb) cb(); }`.
- **`globalScene.moveAnimations = false`** -- built-in flag checked by `BattleAnim.play()` (`src/data/battle-anims.ts:916-917`): `if (!globalScene.moveAnimations && !this.playRegardlessOfIssues) { return cleanUpAndComplete(); }`. Also checked by `StatStageChangePhase.start()` (`stat-stage-change-phase.ts:245`). Setting this to `false` skips all move/stat animations and immediately fires callbacks.
- **MockClock** for synchronous timer resolution -- overrides all delays to 1ms.
- No texture loading, no audio, no input handling.
- Pokemon sprite methods (`loadAssets`, `initSprite`, etc.) are no-ops via mocks.

### RENDERED-ONLY (real Phaser)

- Full WebGL/Canvas rendering via `Phaser.WEBGL` type.
- Real tweens and animations with actual timing.
- Real asset loading (sprites, audio, fonts) via `LoadingScene` (~200+ assets).
- Real UI handlers for human interaction.
- Same RL interface overlaid -- agent decisions injected the same way (via `handleCommand()`, `processInput()`, etc.). The difference is purely visual.

---

## 4. Decision Phase Map

| Phase | Input | Test Harness Coverage | RL Action | Injection Method | Priority |
|-------|-------|----------------------|-----------|-----------------|----------|
| **CommandPhase** (`command-phase.ts`) | FIGHT/BALL/POKEMON/RUN/TERA + cursor | Full (`MoveHelper.select()` at `move-helper.ts:50-60`) | 4 move slots + switch + ball + run + tera | `handleCommand(cmd, cursor)` directly | CRITICAL |
| **SelectTargetPhase** (`select-target-phase.ts`) | BattlerIndex | Full (auto in `MoveHelper.select()` via `game.selectTarget()`) | Target indices [0-3] | `setCursor(target)` + `processInput(Button.ACTION)` on `TargetSelectUiHandler` | CRITICAL |
| **SelectModifierPhase** (`select-modifier-phase.ts`) | Select/Skip/Reroll | Partial (always skips via `game.doSelectModifier()` at `game-manager.ts:326`) | N modifier slots + skip + reroll | `applyModifierDirectly()` / `skipPhase()` via `src/rl/modifier-api.ts` | HIGH |
| **SwitchPhase** (`switch-phase.ts`) | Party member index | Full (`game.doSwitchPokemon()`) | Party slot indices [0-5] | `SwitchSummonPhase` triggered via party handler callback at `switch-phase.ts:69` | HIGH |
| **CheckSwitchPhase** (`check-switch-phase.ts`) | Yes/No | Partial (test harness declines via `onNextPrompt`) | Binary yes/no | Confirm handler `processInput(Button.CANCEL)` | MEDIUM |
| **LearnMovePhase** (`learn-move-phase.ts`) | Keep/Replace + slot | Minimal (not well-covered in test helpers) | 5 options (keep + 4 replace) | Multi-step: `UiMode.CONFIRM` -> `UiMode.SUMMARY` with `SummaryUiMode.LEARN_MOVE` | MEDIUM |
| **EvolutionPhase** (`evolution-phase.ts`) | Accept/Cancel | Not handled (evolution just runs) | Binary: allow or cancel via B button | `evolutionHandler.cancelled = true` or let complete | MEDIUM |
| **SelectStarterPhase** (`select-starter-phase.ts`) | 3-6 starters | Partial (bypassed via overrides + `classicMode.startBattle()`) | Starter species IDs | `addToParty()` programmatically, then `initBattle()` | MEDIUM |
| **MysteryEncounterPhase** (`mystery-encounter-phases.ts`) | Option 1-4 | Minimal | Option indices | `setMode(UiMode.MYSTERY_ENCOUNTER)` callback | LOW |
| **SelectGenderPhase** (`select-gender-phase.ts`) | Male/Female | Test-only (bypassed) | Binary | `setCursor(0/1)` + `processInput(Button.ACTION)` | LOW |
| **TitlePhase** (`title-phase.ts`) | Start game | Test-only (bypassed via `onNextPrompt`) | Single action | `processInput` on title handler | LOW |
| **FormChangePhase** (`form-change-phase.ts`) | Accept/Decline | Not handled | Binary | `processInput` | LOW |
| **PostMysteryEncounterPhase** (`mystery-encounter-phases.ts`) | Continue | Minimal | Single action | `processInput` | LOW |
| **SelectBiomePhase** (`select-biome-phase.ts`) | Biome choice | Not handled (only triggers with Map item) | Biome indices | `setCursor(biomeIdx)` + `processInput(Button.ACTION)` on `UiMode.OPTION_SELECT` | LOW |
| **GameOverPhase** (`game-over-phase.ts`) | Continue/Quit | Not handled (episode ends) | Binary | `processInput` on confirm handler | LOW |
| **RibbonModifierRewardPhase** (`ribbon-modifier-reward-phase.ts`) | Select ribbon | Not handled | Modifier indices | Similar to `SelectModifierPhase` | LOW |
| **PartyExpPhase** (`party-exp-phase.ts`) | Auto | Auto | None | Auto-completes | NONE |
| **EggHatchPhase** / **EggSummaryPhase** (`egg-summary-phase.ts`) | Auto / dismiss | Auto | None | Auto-completes or auto-dismiss | NONE |

### `endBySetMode` Phases (from `phase-interceptor.ts:190-198`)

These are the phases where the PhaseInterceptor considers the phase "paused" when it calls `ui.setMode()`. They are the primary RL decision intercept points:

1. `TitlePhase` -- game start (bypassed in RL)
2. `SelectGenderPhase` -- first-time setup (bypassed in RL)
3. `CommandPhase` -- every turn (CRITICAL)
4. `SelectStarterPhase` -- team selection (bypassed via overrides)
5. `SelectModifierPhase` -- item selection (HIGH priority)
6. `MysteryEncounterPhase` -- ME options (LOW priority)
7. `PostMysteryEncounterPhase` -- ME follow-up (LOW priority)

Other decision phases (`SwitchPhase`, `CheckSwitchPhase`, `LearnMovePhase`, `SelectTargetPhase`, `RevivalBlessingPhase`, `SelectBiomePhase`, `GameOverPhase`) end via their callback calling `this.end()` directly, which the interceptor detects through the patched `Phase.prototype.end` at `phase-interceptor.ts:115`.

### Turn Lifecycle Diagram

```
NewBattlePhase -> EncounterPhase -> SummonPhase(s)
  -> TurnInitPhase -> CommandPhase(s) [DECISION]
    -> SelectTargetPhase [DECISION if doubles single-target]
  -> EnemyCommandPhase (AI) -> TurnStartPhase
  -> MovePhase(s) -> MoveEffectPhase -> DamageAnimPhase -> FaintPhase
    -> SwitchPhase [DECISION if faint]
  -> TurnEndPhase
  -> (if victory) VictoryPhase -> SelectModifierPhase [DECISION]
    -> (if level up) LearnMovePhase [DECISION] -> EvolutionPhase [DECISION]
  -> NewBattlePhase (next wave)
```

**Non-decision phases to auto-skip**: `EncounterPhase`, `SummonPhase`, `PostSummonPhase`, `TurnStartPhase`, `MovePhase`, `MoveEffectPhase`, `DamageAnimPhase`, `BerryPhase`, `TurnEndPhase`, `VictoryPhase`, `BattleEndPhase`, `ExpPhase`, `PartyExpPhase`, `LevelUpPhase`, `StatStageChangePhase`, `ShinySparklePhase`, `ShowAbilityPhase`, `NewBattlePhase`, `NextEncounterPhase`, `EnemyCommandPhase`.

---

## 5. Proposed Architecture

```
src/rl/
+-- runner.ts          -- Main entry: RLRunner class with headless/rendered modes
+-- headless-boot.ts   -- Headless init: jsdom polyfills, Phaser HEADLESS, mock injection
+-- phase-router.ts    -- Decision phase detection and action routing
+-- modifier-api.ts    -- [EXISTS] Modifier selection API (bypasses UI entirely)
+-- spaces.ts          -- [EXISTS] Observation/action space definitions (2,951 obs, 58 actions)
+-- rewards.ts         -- [EXISTS] Reward calculation
+-- environment.ts     -- [EXISTS] Environment wrapper (Gymnasium-compatible)
+-- environment.test.ts-- [EXISTS] Environment unit tests
+-- standalone-runner.ts  -- [EXISTS] Vitest-free GameManager factory
+-- standalone-setup.ts   -- [EXISTS] Vitest-free initialization (overrides, locale fetch, stubs)
+-- interactive-boot.ts   -- [EXISTS] jsdom bootstrap for interactive server
+-- interactive-server.ts -- [EXISTS] HTTP server for browser-based RL
+-- mocks/
|   +-- spy.ts         -- [EXISTS] Standalone spyOn/mockFn (replaces vi.spyOn/vi.fn)
|   +-- assert.ts      -- [EXISTS] Standalone expect/assert (replaces vitest expect)
+-- diagnosis/         -- Investigation reports (read-only reference)
+-- CHANGELOG.md       -- Living doc of all changes
```

**New files**: `runner.ts`, `headless-boot.ts`, `phase-router.ts`
**Modified files**: `environment.ts` (to use new runner)
**External files**: `vite.headless.config.ts`, `package.json` (scripts)
**Core game files**: NONE modified (all changes are additive in `src/rl/` or project root configs)

### runner.ts Design

```
RLRunner {
  mode: "headless" | "rendered"
  game: Phaser.Game
  gameManager: GameManager
  phaseRouter: PhaseRouter

  constructor(mode) -- creates Phaser game, applies mocks if headless
  reset(config) -- resets game state for new episode
  step(action) -> { obs, reward, done, info } -- advances game by one decision
  getObservation() -> Float32Array -- extracts observation vector
  getActionMask() -> boolean[] -- valid actions for current state
  close() -- cleanup
}
```

### phase-router.ts Design

The phase router replaces PhaseInterceptor's `setInterval`-based polling with event-driven detection:

1. Patch `UI.prototype.setMode` (same as `phase-interceptor.ts:114` does)
2. When a decision phase calls `setMode()`, resolve a `Promise<DecisionContext>` containing the phase name, UI mode, and available actions
3. The runner awaits this Promise, passes the context to the RL agent, receives an action, and calls the appropriate injection method
4. The phase resumes naturally via its own callback mechanism

This eliminates the `setInterval` polling loops at `phase-interceptor.ts:239` (`intervalRun`) and `phase-interceptor.ts:109` (`promptInterval`).

### headless-boot.ts Design

Combines setup from three existing sources:
- `src/rl/interactive-boot.ts` (jsdom globals, canvas mock)
- `src/rl/standalone-setup.ts` (locale fetch, overrides reset, `initTests()`)
- `test/test-utils/game-wrapper.ts` (Phaser mock injection)

Initialization sequence:
1. Set up jsdom globals (FontFace, localStorage, matchMedia, canvas, etc.)
2. Initialize i18n (filesystem-backed fetch for locale files)
3. Call `initializeGame()` -- loads all static data (called once, guarded by flag)
4. Create `Phaser.Game({ type: Phaser.HEADLESS })`
5. Create `BattleScene`, apply `injectMandatory()` mocks
6. Call `scene.create()` -- sets up game state, UI, phases
7. Set `globalScene.moveAnimations = false`
8. Set `global.fetch = MockFetch`
9. Game is ready for phase execution

---

## 6. Implementation Work Streams

| Stream | Task | Files Owned | Depends On | Parallelizable |
|--------|------|------------|------------|----------------|
| **A** | Headless bootstrap | `src/rl/headless-boot.ts` | Diagnosis | Yes (with B) |
| **B** | Phase decision router | `src/rl/phase-router.ts` | Diagnosis | Yes (with A) |
| **C** | Dual-mode runner | `src/rl/runner.ts`, `environment.ts` updates | A, B | No |
| **D** | Vite build config | `vite.headless.config.ts`, `package.json` | C | No |
| **E** | Integration test | `src/rl/dummy-agent.ts`, `src/rl/integration-test.ts` | C, D | No |

### Stream A: Headless Bootstrap

**Goal**: A single function `bootHeadless()` that sets up the entire headless environment.

**Inputs**: Configuration (seed, game mode, overrides).
**Outputs**: A ready-to-use `GameManager` instance.

**Implementation approach**:
- Merge jsdom global setup from `interactive-boot.ts:14-50`
- Merge standalone setup from `standalone-setup.ts:88-101` (`setupLocaleFetch`, `resetOverrides`, `initTests`)
- Call `GameWrapper.injectMandatory()` for Phaser mock injection
- Set `moveAnimations = false` for animation bypass

### Stream B: Phase Decision Router

**Goal**: An event-driven phase detection system that yields control to the RL agent at each decision point.

**Implementation approach**:
- Patch `UI.prototype.setMode` (following pattern at `phase-interceptor.ts:114`)
- Patch `Phase.prototype.end` (following pattern at `phase-interceptor.ts:115`)
- For `endBySetMode` phases: when `setMode` fires, capture the phase and UI mode, resolve a pending Promise
- For callback-based phases (`SwitchPhase`, `SelectTargetPhase`, etc.): intercept the callback registration, resolve Promise with the callback as an action target
- Provide `waitForDecision(): Promise<DecisionContext>` API for the runner

### Stream C: Dual-Mode Runner

**Goal**: `RLRunner` class with `step(action)` API.

**Implementation approach**:
- In headless mode: use `headless-boot.ts` for setup, `phase-router.ts` for detection
- In rendered mode: use real Phaser with the same `phase-router.ts` hooks overlaid
- `step()` translates discrete action index -> specific injection method:
  - Actions 0-3: `commandPhase.handleCommand(Command.FIGHT, moveIdx)` (4 moves)
  - Actions 4-9: `commandPhase.handleCommand(Command.POKEMON, slotIdx)` (6 party slots)
  - etc. (following `src/rl/spaces.ts` action space definition)

### Stream D: Vite Build Config

**Goal**: Bundle the RL runner for Node.js execution.

**Implementation approach**:
- Target: `node` (CommonJS or ESM)
- Resolve all `#app/*`, `#enums/*`, `#field/*`, `#test/*` path aliases
- Replace `import.meta.env` with build-time constants
- External: `phaser`, `jsdom` (keep as node_modules, don't bundle)
- Output: single file or small bundle in `dist/rl/`

### Stream E: Integration Test

**Goal**: Run a complete episode (10+ waves) in headless mode, verifying correctness.

**Implementation approach**:
- Create `dummy-agent.ts`: always picks move 0, always skips items, always switches to first available
- Run 10 waves, verify: observations are valid float32, rewards are numeric, action masks are consistent, episode terminates on faint/victory
- Compare state transitions against a known-good Vitest test run

---

## 7. File Ownership Map

| Stream | Files | Owner |
|--------|-------|-------|
| A (headless-boot) | `src/rl/headless-boot.ts` | Stream A |
| B (phase-router) | `src/rl/phase-router.ts` | Stream B |
| C (runner) | `src/rl/runner.ts`, updates to `src/rl/environment.ts` | Stream C |
| D (build) | `vite.headless.config.ts`, `package.json` | Stream D |
| E (test) | `src/rl/dummy-agent.ts`, `src/rl/integration-test.ts` | Stream E |
| Shared | `src/rl/CHANGELOG.md` (all streams update) | All |

**NO core game files are modified.** All changes are additive in `src/rl/` or project root configs. This is critical for minimizing merge conflicts with upstream PokeRogue development.

---

## 8. Risks and Unknowns

1. **jsdom performance overhead** -- jsdom is heavy (~10MB, complex DOM simulation). For RL training with millions of episodes, DOM simulation overhead may become a bottleneck. **Mitigation**: Benchmark early with 100+ episodes. Consider happy-dom as a lighter alternative (~5x faster than jsdom for common operations). If still too slow, explore a minimal custom DOM shim that only provides the APIs Phaser actually calls (estimated ~30 globals based on `interactive-boot.ts:23-50`).

2. **Memory leaks from repeated resets** -- Phaser scenes, Pokemon objects (each a `Phaser.GameObjects.Container`), modifiers, and phase queues accumulate across episodes. The `GameManager` constructor creates a new `BattleScene` or reuses `globalScene` (`game-manager.ts:115-120`), but cleanup of Phaser internal registries is uncertain. **Mitigation**: Profile memory across 100+ resets in integration test. Implement explicit cleanup in `runner.reset()`: clear phase queue, destroy Pokemon containers, reset modifier arrays.

3. **Phaser HEADLESS stability** -- Phaser's `HEADLESS` renderer type is designed for server-side use but is not extensively tested for long-running Node.js processes. May have resource leaks in the event system, timer pools, or scene manager. **Mitigation**: Monitor process memory and open handles during integration test. Set up periodic full GC (`global.gc()`) if needed.

4. **`globalScene` singleton** -- The game uses `globalScene` (`src/global-scene.ts`) as a singleton, making it impossible to run parallel environments in the same process. **Mitigation**: Accept single-env-per-process for now. Document as known limitation. Parallel training uses multiple processes (standard for RL with game environments, e.g., SubprocVecEnv in Stable Baselines).

5. **Undiscovered decision phases** -- Some phases may only trigger in rare game states (specific mystery encounters, certain items like Map modifier for `SelectBiomePhase`, Revival Blessing for `RevivalBlessingPhase`). These could cause the runner to hang if no handler is registered. **Mitigation**: Default handler in `phase-router.ts` picks the first valid option and logs a warning. The router should have a timeout that auto-selects a default action if no explicit handler matches.

6. **Upstream game updates** -- PokeRogue is actively developed (recent commits show multiple merges per week). Phase signatures, UI mode names, or modifier system internals could change. **Mitigation**: Our external-only approach (no core game file modifications) minimizes merge conflicts. Pin to a known-good commit for RL work. Re-run integration test after any rebase.

7. **RNG determinism** -- `Phaser.Math.RND` seeding must produce identical results between headless and rendered modes for reproducible experiments. The test harness seeds with `Phaser.Math.RND.sow(["test"])` (`game-wrapper.ts:32`). **Mitigation**: Verify that the same seed produces identical battle outcomes (damage values, hit/miss, critical hits, encounter species) in both modes by running a deterministic scenario and comparing logs.

8. **MockClock setInterval dependency** -- `MockClock` uses `setInterval(() => { ... }, 1)` to pump the Phaser clock, creating real Node.js interval timers. For RL, this means each episode leaves dangling timers if not properly cleaned. **Mitigation**: Replace MockClock's `setInterval` with manual `clock.step(delta)` for deterministic RL stepping, or ensure `clearInterval` is called in `runner.reset()`.

9. **`BattleInfo.updateInfo()` Promise ordering** -- `updateInfo()` returns a Promise that resolves when the HP bar tween completes (`battle-info.ts:548-568`). The mock tween fires synchronously, so the Promise resolves on the next microtask. Several callers chain `.then()` on this Promise. If the RL runner advances phases without processing the microtask queue, state could be inconsistent. **Mitigation**: Ensure `await` is used properly in the runner's step loop, and call `await new Promise(r => setTimeout(r, 0))` after phase transitions to flush the microtask queue.

---

## Appendix A: Vitest Dependency Status

| Dependency | Location | Status | Notes |
|-----------|----------|--------|-------|
| `vi.mock()` overrides | `vitest.setup.ts:14-23` | **Replaced** | `standalone-setup.ts:23-35` uses `Object.defineProperty` getters |
| `vi.mock()` i18next/MSW | `vitest.setup.ts:31-60` | **Replaced** | `standalone-setup.ts:44-82` intercepts `global.fetch` for locale files |
| `vitest-canvas-mock` | `vitest.setup.ts:1` | **Replaceable** | `mock-context-canvas.ts` + `interactive-boot.ts` canvas mock |
| `vi.spyOn`/`vi.fn` in harness | 8 test-utils files | **Replaced** | All migrated to `src/rl/mocks/spy.ts` |
| `restoreMocks: true` config | `vitest.config.ts` | **Replaced** | `restoreAllMocks()` from `src/rl/mocks/spy.ts` called in `afterEach` |
| Vitest test runner | All test files | **Not needed** | RL runner bypasses test infrastructure entirely |
| `src/rl/` Vitest leaks | -- | **Clean** | No `vi.*` imports found in `src/rl/` |

## Appendix B: Mock Coverage Matrix

| Phaser Subsystem | Mock Location | Behavior |
|-----------------|---------------|----------|
| `Phaser.Math.RND` | Real Phaser (works in Node.js) | Seeded random, no mock needed |
| `scene.tweens` | `game-wrapper.ts:111-129` | Immediately fires `onComplete` |
| `scene.time` | `mock-clock.ts` | Overrides delays to 1ms, pumps clock |
| `scene.sound` | `game-wrapper.ts:85-101` | All no-ops, `totalDuration: 0` |
| `scene.renderer` | `game-wrapper.ts:69-78` | Stub with `gl: {}` |
| `scene.load` | `mock-loader.ts` | `once(event, cb)` calls cb immediately |
| `scene.add` | `mock-texture-manager.ts` | Routes to mock sprites/containers |
| `scene.make` | `mock-game-object-creator.ts` | No-op graphics/transition |
| `scene.cameras` | `game-wrapper.ts:103-108` | No-op pipeline methods |
| `scene.input` | `game-wrapper.ts:181-184` | Real keyboard/gamepad plugins (unused in headless) |
| `scene.sys` | `game-wrapper.ts:145-174` | Massive stub object |
| `scene.cachedFetch` | `game-wrapper.ts:185-195` | Reads files from `assets/` via `fs.readFileSync` |
| `MoveAnim.getAnim` | `game-wrapper.ts:38-40` | Returns `{ frames: {} }` |
| `Pokemon.faintCry` | `game-wrapper.ts:44-48` | Immediately calls callback |
| `Pokemon.cry/enableMask/updateFusionPalette` | `game-wrapper.ts:41-43` | No-ops |

## Appendix C: Files Examined Across All Investigations

**Core game files**: `src/phase.ts`, `src/battle-scene.ts`, `src/battle.ts`, `src/global-scene.ts`, `src/scene-base.ts`, `src/extensions.ts`, `src/system/game-speed.ts`, `src/utils/common.ts`, `src/init/init.ts`, `src/field/pokemon.ts`, `src/data/battle-anims.ts`, `src/data/pokemon-species.ts`, `src/plugins/i18n.ts`, `src/main.ts`, `src/loading-scene.ts`

**Phase files**: `src/phases/command-phase.ts`, `src/phases/select-target-phase.ts`, `src/phases/select-modifier-phase.ts`, `src/phases/switch-phase.ts`, `src/phases/check-switch-phase.ts`, `src/phases/learn-move-phase.ts`, `src/phases/evolution-phase.ts`, `src/phases/mystery-encounter-phases.ts`, `src/phases/select-starter-phase.ts`, `src/phases/title-phase.ts`, `src/phases/select-biome-phase.ts`, `src/phases/select-gender-phase.ts`, `src/phases/game-over-phase.ts`, `src/phases/faint-phase.ts`, `src/phases/damage-anim-phase.ts`, `src/phases/move-phase.ts`, `src/phases/move-effect-phase.ts`, `src/phases/stat-stage-change-phase.ts`, `src/phases/summon-phase.ts`, `src/phases/switch-summon-phase.ts`, `src/phases/obtain-status-effect-phase.ts`, `src/phases/pokemon-anim-phase.ts`, `src/phases/revival-blessing-phase.ts`, `src/phases/form-change-phase.ts`, `src/phases/quiet-form-change-phase.ts`, `src/phases/attempt-capture-phase.ts`

**Modifier files**: `src/modifier/modifier-pools.ts`, `src/modifier/init-modifier-pools.ts`, `src/modifiers/modifier-type.ts`, `src/phases/select-modifier-phase.ts`, `src/ui/handlers/modifier-select-ui-handler.ts`

**Test harness files**: `test/test-utils/game-wrapper.ts`, `test/test-utils/game-manager.ts`, `test/test-utils/phase-interceptor.ts`, `test/test-utils/test-file-initialization.ts`, `test/test-utils/mocks/mock-clock.ts`, `test/test-utils/mocks/mock-texture-manager.ts`, `test/test-utils/mocks/mock-game-object-creator.ts`, `test/test-utils/mocks/mock-loader.ts`, `test/test-utils/mocks/mock-fetch.ts`, `test/test-utils/mocks/mock-context-canvas.ts`, `test/test-utils/mocks/mocks-container/mock-container.ts`, `test/test-utils/mocks/mocks-container/mock-sprite.ts`, `test/test-utils/mocks/mocks-container/mock-text.ts`, `test/test-utils/helpers/move-helper.ts`, `test/test-utils/helpers/overrides-helper.ts`, `test/test-utils/helpers/field-helper.ts`, `test/setup/vitest.setup.ts`, `test/setup/font-face.setup.ts`

**RL files**: `src/rl/standalone-runner.ts`, `src/rl/standalone-setup.ts`, `src/rl/interactive-boot.ts`, `src/rl/interactive-server.ts`, `src/rl/modifier-api.ts`, `src/rl/spaces.ts`, `src/rl/rewards.ts`, `src/rl/environment.ts`, `src/rl/mocks/spy.ts`, `src/rl/mocks/assert.ts`

**Config files**: `vitest.config.ts`, `vitest.interactive.config.ts`, `vite.interactive.config.ts`, `tsconfig.json`, `package.json`
