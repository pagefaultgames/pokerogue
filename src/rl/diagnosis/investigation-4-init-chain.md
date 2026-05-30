# Investigation 4: Initialization Chain

## Executive Summary

The game has two distinct initialization chains: the **browser path** (main.ts -> LoadingScene -> BattleScene) and the **test harness path** (vitest.setup.ts -> test-file-initialization -> GameManager -> GameWrapper -> BattleScene). Both share a critical common dependency: `initializeGame()` from `src/init/init.ts`, which loads all static game data (species, moves, abilities, etc.). The test harness mocks away all rendering and asset loading while keeping the game logic intact. A headless RL runner would diverge at the Phaser game creation point, reusing the test harness's mock infrastructure but without Vitest-specific hooks.

---

## Part 1: Test Harness Initialization Chain

### Step 1: Vitest Config (`vitest.config.ts`)

**What it sets up:**
- Environment: `jsdom` (provides `window`, `document`, `navigator`, DOM APIs)
- Setup files (executed in order):
  1. `test/setup/font-face.setup.ts`
  2. `test/setup/vitest.setup.ts`
  3. `test/setup/matchers.setup.ts`
- `restoreMocks: true` (auto-restores mocks after each test -- but overridden by our custom `restoreAllMocks()`)
- `threads: false` (single-threaded execution)
- `testTimeout: 20_000`

**Vitest-specific:** Everything here. The jsdom environment, setup file ordering, mock restoration config.

**Headless divergence:** We need our own jsdom-like environment or polyfills for `window`, `document`, `localStorage`, `FontFace`, etc.

### Step 2: Font Face Setup (`test/setup/font-face.setup.ts`)

**What it sets up:**
- Defines a mock `FontFace` class on `globalThis` that returns resolved promises from `load()`
- Required because `src/plugins/i18n.ts` uses `new FontFace()` at module load time

**Vitest-specific:** None -- pure global stub.

**Headless need:** Required. `FontFace` is a browser API not available in Node.js.

### Step 3: Vitest Setup (`test/setup/vitest.setup.ts`)

**What it sets up (in order):**
1. Imports `vitest-canvas-mock` (provides `HTMLCanvasElement.getContext()` mock for jsdom)
2. Imports `#plugins/i18n` -- triggers i18next initialization with HTTP backend, language detection, font loading
3. **vi.mock of `#app/overrides`** -- replaces overrides module with default values (Vitest-specific module mocking)
4. **vi.mock of `i18next`** -- sets up MSW (Mock Service Worker) server to intercept locale HTTP requests, loading locale JSON files from `locales/en/` directory via `import.meta.glob`
5. Sets `global.testFailed = false`
6. `beforeAll`: calls `initTests()` from `test-file-initialization.ts`
7. `beforeEach`: logs test start
8. `afterEach`: calls `restoreAllMocks()` (from `src/rl/mocks/spy.ts`), logs test end
9. `afterAll`: closes MSW server, prints warnings

**Vitest-specific:**
- `vi.mock()` for module-level mocking (overrides, i18next)
- `vi.mock` hoisting behavior for i18next MSW setup
- `beforeAll`/`beforeEach`/`afterEach`/`afterAll` hooks
- `vitest-canvas-mock` package

**General setup (reusable):**
- i18n initialization
- MSW server for locale loading
- `restoreAllMocks()` (already decoupled to `src/rl/mocks/spy.ts`)

**Headless divergence:**
- Need alternative to `vi.mock` for overrides module -- could use direct property assignment
- Need alternative to MSW for i18n -- could pre-load locale files synchronously from filesystem
- Canvas mock needed but `vitest-canvas-mock` depends on Vitest -- need standalone equivalent

### Step 4: Test File Initialization (`test/test-utils/test-file-initialization.ts`)

**What `initTests()` does:**
1. Calls `setupStubs()`:
   - `globalThis.localStorage` = mock localStorage (in-memory key-value store)
   - `globalThis.console` = MockConsole (colored output, blacklisted messages)
   - `globalThis.matchMedia` = stub returning `{matches: false}`
   - `document.fonts` = stub with `.add()` no-op
   - `BBCodeText.prototype.destroy/resize` = stubs
   - `InputText.prototype.setElement/resize` = stubs
   - `Phaser.GameObjects.Image` = MockImage (completely replaces Phaser's Image class)
   - `window.URL.createObjectURL` = stub
   - `navigator.getGamepads` = returns empty array
   - Sets session cookie `fake_token`
   - `HTMLCanvasElement.prototype.getContext` = mock context (returns stub with save/scale/clearRect/etc.)
2. Calls `initializeGame()` (once, guarded by `wasInitialized` flag):
   - This is the **critical shared function** -- loads all static game data
3. Calls `manageListeners()` (cleans up Node.js `process.message` listeners between test files)

**Vitest-specific:** `manageListeners()` (manages Vitest worker message listeners)

**General setup (reusable):** Everything in `setupStubs()` and `initializeGame()`.

**Headless divergence:** All stubs are needed. `initializeGame()` is required. Listener management is Vitest-specific and can be skipped.

### Step 5: Per-Test Setup (in each test file)

```typescript
beforeAll(() => {
  phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
});
beforeEach(() => {
  game = new GameManager(phaserGame);
});
afterEach(() => {
  game.phaseInterceptor.restoreOg();
});
```

**Key:** Phaser is initialized with `type: Phaser.HEADLESS` -- no WebGL/Canvas renderer needed.

### Step 6: GameManager Constructor (`test/test-utils/game-manager.ts`)

**Constructor flow:**
1. `localStorage.clear()` -- resets storage state
2. `ErrorInterceptor.getInstance().clear()` -- resets error tracking
3. `BattleScene.prototype.randBattleSeedInt` overridden (deterministic RNG)
4. Creates `new GameWrapper(phaserGame, bypassLogin=true)`
5. Checks if `globalScene` already exists:
   - **If yes:** reuses existing scene, creates PhaseInterceptor, calls `resetScene()`
   - **If no:** creates `new BattleScene()`, creates PhaseInterceptor, calls `gameWrapper.setScene(scene)`
6. Creates TextInterceptor, OverridesHelper, MoveHelper, ClassicModeHelper, DailyModeHelper, ChallengeModeHelper, SettingsHelper, ReloadHelper, ModifierHelper, FieldHelper
7. Calls `initDefaultOverrides()` (sets mystery encounter chance to 0)
8. Sets `global.fetch` to `MockFetch`

**Vitest-specific:** None directly (mocks already decoupled).

**Headless divergence:** This is almost entirely reusable. The `MockFetch` is needed for API calls. The helpers are test-specific but some (OverridesHelper) could be useful for RL.

### Step 7: GameWrapper Constructor & `setScene()` (`test/test-utils/game-wrapper.ts`)

**Constructor:**
1. `Phaser.Math.RND.sow(["test"])` -- seeds Phaser's RNG
2. Spies on `appConstants.bypassLogin` to return `true`
3. Stubs on Pokemon/MoveAnim/BattleScene prototypes:
   - `MoveAnim.prototype.getAnim` -> returns empty frames
   - `Pokemon.prototype.enableMask` -> no-op
   - `Pokemon.prototype.updateFusionPalette` -> no-op
   - `Pokemon.prototype.cry` / `faintCry` -> no-op (with callback)
   - `BattleScene.prototype.addPokemonIcon` -> returns empty Container
   - `PokedexMonContainer.prototype.remove` -> uses MockContainer's remove

**`setScene(scene)`:**
1. Saves scene reference
2. Calls `injectMandatory()` -- the BIG mock injection
3. Calls `scene.preload?.()` (BattleScene has no preload -- LoadingScene does)
4. Calls `scene.create()` -- triggers the full BattleScene creation

**`injectMandatory()` -- THE CRITICAL MOCK INJECTION:**
This replaces nearly every Phaser subsystem with mocks:
- `game.config` -> static seed + version
- `game.renderer` -> stub (maxTextures, gl, deleteTexture, canvasToTexture, pipelines)
- `scene.renderer` = game.renderer
- `scene.children` -> `{removeAll: () => null}`
- `scene.sound` -> full audio mock (play, pause, add, get, getAllPlaying, destroy, etc.)
- `scene.cameras` -> main camera with stub post-pipeline methods
- `scene.tweens` -> mock tween manager (immediately calls onComplete callbacks)
- `scene.anims`, `scene.cache`, `scene.plugins`, `scene.registry`, `scene.scale`, `scene.textures`, `scene.events` -> from game
- `scene.manager` -> InputManager
- `scene.manager.keyboard` -> KeyboardManager
- `scene.pluginEvents` -> new EventEmitter
- `scene.domContainer` -> empty object
- `scene.spritePipeline`, `scene.fieldSpritePipeline` -> empty objects
- `scene.load` -> MockLoader (stubs all asset loading -- image, atlas, spritesheet, audio, video)
- `scene.sys` -> massive stub (queueDepthSort, anims, game, textures, cache, scale, events, settings, input)
- `scene.add` -> MockTextureManager (creates mock sprites/containers/text)
- `scene.textures` -> MockTextureManager
- `scene.sys.displayList`, `scene.sys.updateList` -> from mocks
- `scene.systems` = scene.sys
- `scene.input` -> from game (with keyboard/gamepad plugins)
- `scene.cachedFetch` -> reads files from `assets/` directory via `fs.readFileSync`
- `scene.make` -> MockGameObjectCreator
- `scene.time` -> MockClock
- `scene.remove` -> mockFn()
- `timedEventManager.disable()` -- disables timed events

### Step 8: PhaseInterceptor (`test/test-utils/phase-interceptor.ts`)

**Constructor:**
1. Saves scene reference
2. Initializes `onHold` array, `prompts` array
3. Clears logs
4. Starts prompt handler (setInterval polling for UI prompts)
5. Calls `initPhases()`:
   - Saves original `UI.prototype.setMode` and `Phase.prototype.end`
   - Replaces `UI.prototype.setMode` with interceptor version
   - Replaces `Phase.prototype.end` with interceptor version
   - For each of 50+ phase classes: saves original `start`, replaces with interceptor version
   - The interceptor version queues phase execution in `onHold` array instead of running immediately

**Vitest-specific:** None. This is pure phase control logic.

**Headless divergence:** This is the core mechanism for controlling game flow in tests. For RL, we may want a simpler approach that just runs phases to completion without the queuing/prompt system.

---

## Part 2: Browser Initialization Chain

### Step 1: HTML Page Load -> `src/main.ts`

**Top-level imports (side effects):**
1. `import "#app/polyfills"` -- Promise.withResolvers polyfill, core-js Set/Iterator/Map.groupBy/Object.groupBy
2. `import "#plugins/i18n"` -- i18next initialization with HTTP backend, language detection, font loading (uses `document.fonts`, `localStorage`, `FontFace`)

**Top-level execution:**
1. If beta/dev: modifies `document.title`
2. Sets `window.onerror` global error handler
3. Sets `window.unhandledrejection` handler
4. Loads fonts via `document.fonts.load()`
5. Fetches `/manifest.json` for cache busting
6. Calls `startGame(manifest)`

### Step 2: `startGame()` function

1. Dynamically imports `LoadingScene` and `BattleScene`
2. Creates `new Phaser.Game({...})` with:
   - `type: Phaser.WEBGL` (requires browser WebGL context)
   - `parent: "app"` (DOM element)
   - `scale: { width: 1920, height: 1080, mode: Phaser.Scale.FIT }`
   - Plugins: rexInputText, rexBBCodeText, rexTransitionImagePack, rexUI
   - Input: mouse, touch, gamepad
   - DOM: `createContainer: true`
   - Pipeline: InvertPostFX
   - **Scenes: [LoadingScene, BattleScene]** -- Phaser manages scene lifecycle
   - Version from package.json
3. `game.sound.pauseOnBlur = false`
4. `game.manifest = gameManifest`

### Step 3: LoadingScene

**Constructor:**
- Registers CacheBustedLoaderPlugin

**`preload()`:**
- Calls `localPing()` (connectivity check)
- Loads ~200+ assets: images, atlases, spritesheets, audio, video, bitmap fonts
- Locale-specific text images based on `i18next.resolvedLanguage`
- Timed event banners
- Loads external rextexteditplugin from CDN
- Sets up loading screen UI (progress bar, logo, intro video, disclaimer text)
- **Calls `initializeGame()`** -- the same function used by tests!

**`create()`:**
- Starts the "battle" scene (`this.scene.start("battle")`)
- This triggers Phaser to create BattleScene

### Step 4: BattleScene

**Constructor:**
1. Calls `super("battle")` (SceneBase -> Phaser.Scene with key "battle")
2. Creates `PhaseManager`
3. Calls `updateGameInfo()` (sets document title)
4. Calls `initGlobalScene(this)` -- sets the global singleton

**`create()` (called by Phaser scene manager):**
1. Removes LoadingScene
2. `initGameSpeed.apply(this)` -- monkey-patches Phaser's tween/timer system for game speed
3. Creates `InputsController`, `UiInputs`
4. Creates `new GameData()` (player save data manager)
5. `addUiThemeOverrides()`
6. `this.load.setBaseURL()`
7. Creates `SpritePipeline` and `FieldSpritePipeline` (WebGL shaders)
8. Adds pipelines to WebGL renderer
9. Calls `this.launchBattle()`

**`launchBattle()`:**
1. Creates arena background sprites
2. Creates field container (scaled 6x)
3. Creates fieldUI container
4. Creates transition image
5. Creates UI container
6. Creates field/shop overlays
7. Creates modifier bars (player + enemy)
8. Creates CharSprite, PokeballTrays, AbilityBar, PartyExpBar, CandyBar
9. Creates biome/wave text, money text, score text, luck text
10. Creates ArenaFlyout
11. Creates DamageNumberHandler, PokemonSpriteSparkleHandler, PokemonInfoContainer
12. Creates arena bases (player, player transition, enemy, next enemy)
13. Creates trainer sprite
14. Creates animations (prompt, tera_sparkle)
15. **Calls `this.reset(false, false, true)`** -- initializes game state
16. Creates `new UI()` and calls `ui.setup()`
17. Calls `this.phaseManager.toTitleScreen(true)` then `shiftPhase()` -- starts LoginPhase

---

## Part 3: Comparison & Divergence Analysis

### Shared Critical Path

Both paths share these essential steps:
1. **i18n initialization** (i18next with locale data)
2. **`initializeGame()`** -- loads all static game data:
   - `initModifierTypes()` / `initModifierPools()`
   - `initAchievements()` / `initVouchers()` / `initStatsKeys()`
   - `initPokemonPrevolutions()` / `initPokemonStarters()` / `initBiomes()`
   - `initPokemonForms()` / `initTrainerTypeDialogue()` / `initSpecies()`
   - `initMoves()` / `initAbilities()` / `initChallenges()` / `initMysteryEncounters()`
3. **BattleScene construction** (PhaseManager, globalScene)
4. **BattleScene.create()** (GameData, launchBattle, UI setup, phase start)

### Where Headless Diverges

| Component | Browser | Test Harness | Headless RL |
|-----------|---------|--------------|-------------|
| Environment | Real browser | jsdom (Vitest) | jsdom or polyfills |
| Phaser type | WEBGL | HEADLESS | HEADLESS |
| Asset loading | Real HTTP | MockLoader (no-ops) | MockLoader (no-ops) |
| Rendering | WebGL renderer | Mock renderer | Mock renderer |
| Audio | WebAudio/HTML5 | Mock sound | Mock sound |
| Tweens | Real Phaser tweens | Mock (instant complete) | Mock (instant complete) |
| i18n | HTTP backend + MSW | MSW mock server | Direct filesystem or pre-loaded |
| Fetch | Real fetch | MockFetch | MockFetch |
| Phase control | PhaseManager | PhaseInterceptor | Direct PhaseManager (no interceptor) |
| Canvas | Real canvas | vitest-canvas-mock + mock-context | Standalone canvas mock |
| Module mocking | N/A | vi.mock (overrides, i18next) | Direct property overrides |

### Minimal Mock Set for Headless Operation

**Global polyfills needed (without jsdom):**
1. `window`, `document`, `localStorage`, `navigator`, `HTMLCanvasElement` -- OR use jsdom
2. `FontFace` -- mock class (from font-face.setup.ts)
3. `matchMedia` -- stub
4. `document.fonts` -- stub with `.add()` no-op
5. `URL.createObjectURL` -- stub

**Phaser-related mocks (from GameWrapper.injectMandatory):**
1. `game.renderer` -- stub object
2. `scene.sound` -- mock audio system
3. `scene.cameras` -- stub
4. `scene.tweens` -- mock (instant completion)
5. `scene.load` -> MockLoader
6. `scene.sys` -> massive stub object
7. `scene.add` -> MockTextureManager
8. `scene.make` -> MockGameObjectCreator
9. `scene.time` -> MockClock
10. `scene.cachedFetch` -> filesystem-based fetch

**Prototype stubs (from GameWrapper constructor):**
1. `MoveAnim.prototype.getAnim` -> empty frames
2. `Pokemon.prototype.enableMask/updateFusionPalette/cry/faintCry` -> no-ops
3. `BattleScene.prototype.addPokemonIcon` -> empty container

**Data initialization:**
1. `initializeGame()` -- REQUIRED, no mocking
2. i18n setup -- required (many game strings are i18n keys)
3. `MockFetch` for API calls (account, savedata, etc.)

**Can we reuse the test harness mock setup without Vitest?**
YES. The key insight is that most mocks are already Vitest-independent:
- `GameWrapper` uses `spyOn`/`mockFn` from `src/rl/mocks/spy.ts` (already decoupled)
- `MockLoader`, `MockTextureManager`, `MockGameObjectCreator`, `MockClock` are pure classes
- `MockFetch` is a plain function
- `setupStubs()` in test-file-initialization uses plain `Object.defineProperty`
- `initializeGame()` is a pure function with no test dependencies

The only Vitest-specific parts are:
1. `vi.mock()` for module-level mocking (overrides, i18next) -- need alternatives
2. `vitest-canvas-mock` -- need standalone canvas mock
3. `beforeAll`/`beforeEach`/`afterEach`/`afterAll` lifecycle hooks -- replace with explicit calls
4. MSW setup inside `vi.mock` -- can be replaced with direct filesystem loading

### Data Loading Requirements

**Static data (loaded once by `initializeGame()`):**
- All pure TypeScript, no external fetches needed
- Populates global registries: `allMoves`, `allSpecies`, `modifierTypes`, etc.

**Runtime data (loaded per-session):**
- `exp-sprites.json` -- loaded via `cachedFetch` (can be pre-loaded)
- `variant/_masterlist.json` -- loaded via `cachedFetch` (can be pre-loaded)
- `starter-colors.json` -- loaded via `cachedFetch` (can be pre-loaded)
- Battle animation JSONs -- loaded via `cachedFetch` (mocked to always return tackle.json in tests)
- Locale JSON files -- loaded via i18n HTTP backend (intercepted by MSW in tests)

### i18n/Localization Setup Required

The i18n system (`src/plugins/i18n.ts`) is loaded via top-level `await` and:
1. Uses `i18next-http-backend` to fetch locale files
2. Uses `i18next-browser-languagedetector` for language detection
3. Uses `i18next-korean-postposition-processor`
4. Initializes fonts based on detected language
5. Adds custom `money` formatter

For headless: Either mock i18next entirely (keys returned as-is, like `mockI18next()` does) or pre-load English locale files from disk.

### Global Side Effects That Would Crash in Node.js

Without jsdom or polyfills, these would crash:
1. `document.title` access in `main.ts` and `BattleScene.updateGameInfo()`
2. `document.fonts.load()` / `document.fonts.add()` in i18n plugin
3. `new FontFace()` in i18n plugin
4. `window.onerror` / `window.addEventListener` in main.ts
5. `localStorage.getItem()` in i18n detection
6. `HTMLCanvasElement.prototype.getContext` used by Phaser internally
7. `navigator.getGamepads()` used by Phaser input
8. `matchMedia()` used somewhere in the codebase
9. DOM operations in various UI handlers
10. `import.meta.env` references (Vite-specific, need build tool)
11. `import.meta.glob` in vitest.setup.ts (Vite-specific)

### Recommended Headless Initialization Sequence

```
1. Set up global polyfills (FontFace, localStorage, matchMedia, canvas, etc.)
2. Initialize i18n (either mock or load from filesystem)
3. Call initializeGame() -- loads all static data
4. Create Phaser.Game({ type: Phaser.HEADLESS })
5. Create BattleScene (constructor only)
6. Create GameWrapper-equivalent, call injectMandatory()
7. Call scene.create() -- sets up game state, UI, phases
8. Set global.fetch = MockFetch
9. Game is now ready for phase execution
```

---

## Part 4: Dependency Chain Diagram

```
vitest.config.ts
  |-> jsdom environment
  |-> font-face.setup.ts        (FontFace polyfill)
  |-> vitest.setup.ts
  |     |-> vitest-canvas-mock   (canvas polyfill)
  |     |-> #plugins/i18n        (i18next init -- SHARED)
  |     |-> vi.mock(overrides)   (VITEST-SPECIFIC)
  |     |-> vi.mock(i18next)     (MSW server -- VITEST-SPECIFIC)
  |     |-> beforeAll -> initTests()
  |           |-> setupStubs()   (globals, prototypes -- REUSABLE)
  |           |-> initializeGame()  (SHARED -- static data)
  |           |-> manageListeners() (VITEST-SPECIFIC)
  |-> matchers.setup.ts

Per-test:
  beforeAll -> new Phaser.Game({ type: HEADLESS })
  beforeEach -> new GameManager(phaserGame)
    |-> new GameWrapper(phaserGame, true)
    |     |-> prototype stubs (Pokemon, MoveAnim, etc.)
    |-> new BattleScene() OR reuse globalScene
    |     |-> constructor: PhaseManager, initGlobalScene
    |-> new PhaseInterceptor(scene)
    |     |-> patches Phase.prototype.end, UI.prototype.setMode
    |     |-> patches all phase start() methods
    |-> gameWrapper.setScene(scene)
    |     |-> injectMandatory()  (ALL PHASER MOCKS -- REUSABLE)
    |     |-> scene.create()
    |           |-> initGameSpeed, InputsController, UiInputs
    |           |-> new GameData()
    |           |-> launchBattle() (UI objects, arena, reset, phases)
    |-> TextInterceptor, Helpers, MockFetch
```

---

## Part 5: Key Findings for Headless RL Runner

1. **`initializeGame()` is the single most important shared function.** It loads all game data and has zero rendering dependencies. Must be called exactly once.

2. **`GameWrapper.injectMandatory()` is the key mock injection point.** It replaces ~20 Phaser subsystems with mocks. This is already Vitest-independent and can be reused directly.

3. **The PhaseInterceptor is test-specific control flow.** For RL, we likely want phases to run naturally via PhaseManager rather than being intercepted and queued. The RL agent should observe state at specific phase boundaries (CommandPhase, SelectModifierPhase) rather than controlling every phase transition.

4. **Module resolution requires Vite.** The project uses `import.meta.env`, `import.meta.glob`, and path aliases (`#app/*`, `#field/*`, etc.) that require Vite's transform pipeline. The headless runner MUST be built/bundled with Vite, not run directly with Node.js/tsx.

5. **jsdom is effectively required.** The number of DOM APIs used (even transitively through Phaser in HEADLESS mode) is large enough that providing individual polyfills would be fragile. Using jsdom (or happy-dom) as the environment is the pragmatic choice.

6. **The test harness already demonstrates the minimal viable headless setup.** The path from `Phaser.HEADLESS` + `GameWrapper.injectMandatory()` + `initializeGame()` -> working game logic is proven by thousands of passing tests. The RL runner should follow this exact pattern.

7. **i18n can be simplified.** For RL, we can either mock i18next to return raw keys (sufficient for game logic) or pre-load English locale files from disk at startup.

8. **`Phaser.Game({ type: Phaser.HEADLESS })` is sufficient** -- Phaser has built-in headless support that skips renderer creation. Combined with the mock injections, this gives us working game logic with zero GPU/display requirements.
