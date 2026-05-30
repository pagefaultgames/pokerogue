# Investigation 2: Phaser Coupling Audit

## Executive Summary

Phaser is deeply woven into the game at three critical layers:
1. **RNG** (Phaser.Math.RND) -- used by ALL seeded randomness in the game
2. **Timer/Tween system** -- gates phase transitions, damage application, faint logic
3. **GameObject inheritance** -- Pokemon extends `Phaser.GameObjects.Container`

The existing test harness mocks most of these, but gaps remain for headless RL operation.

---

## 1. Phaser.Math.RND (Seeded Randomness)

**Classification: LOGIC-CRITICAL**

All seeded randomness flows through `Phaser.Math.RND`:

### Central Hub: `src/utils/common.ts`
```
randSeedInt()      -> Phaser.Math.RND.integerInRange()     (line 99)
randSeedFloat()    -> Phaser.Math.RND.frac()                (line 126)
randSeedItem()     -> Phaser.Math.RND.pick()                (line 134)
randSeedShuffle()  -> Phaser.Math.RND.integerInRange()     (line 144)
randSeedGauss()    -> calls randSeedFloat() x2              (line 52)
```

### Seed State Management
- `BattleScene.resetSeed()` (`src/battle-scene.ts:1826`): calls `Phaser.Math.RND.sow([waveSeed])`
- `BattleScene.executeWithSeedOffset()` (`src/battle-scene.ts:1834`): saves/restores `Phaser.Math.RND.state()`
- `Battle.randSeedInt()` (`src/battle.ts:472`): saves/restores RNG state per battle turn

### Where RNG is Used (sample of ~50+ call sites across game logic):
- `src/phases/select-biome-phase.ts` -- biome selection
- `src/phases/encounter-phase.ts` -- encounter generation
- `src/game-mode.ts` -- trainer chance, boss species
- `src/data/trainers/trainer-config.ts` -- party generation
- `src/data/pokemon-species.ts` -- gender determination, species weights
- `src/utils/speed-order.ts` -- speed tie resolution
- `src/utils/i18n.ts` -- random dialogue selection

### Test Harness Status: ALREADY-MOCKED
- `GameWrapper` constructor seeds with `Phaser.Math.RND.sow(["test"])` (line 32)
- This works because even the test harness imports real Phaser and uses its RNG

### Headless Assessment
Phaser.Math.RND works fine without canvas/WebGL -- it's pure JS math. The RND object is available as long as `import Phaser from "phaser"` succeeds (it does in Node via jsdom). **No gap here** -- RNG works headless already.

---

## 2. Scene Lifecycle Methods

**Classification: RENDER-ONLY (mostly)**

### Inheritance Chain
```
Phaser.Scene -> SceneBase -> BattleScene
```

### Overridden Phaser.Scene Methods

| Method | File:Line | Purpose | Classification |
|--------|-----------|---------|---------------|
| `create()` | `battle-scene.ts:389` | Initializes pipelines, InputsController, GameData, launches battle | LOGIC-CRITICAL (partly) |
| `update()` | `battle-scene.ts:410` | Calls `this.ui?.update()` | RENDER-ONLY |
| `preload()` (inherited from SceneBase pattern) | Used via `this.scene.preload?.()` in game-wrapper | Asset loading | RENDER-ONLY |

### `create()` Breakdown
```typescript
create() {
  this.scene.remove(LoadingScene.KEY);         // RENDER-ONLY
  initGameSpeed.apply(this);                    // LOGIC-CRITICAL (patches timer/tween timing)
  this.inputController = new InputsController(); // INPUT (needed for command selection)
  this.uiInputs = new UiInputs(this.inputController); // INPUT
  this.gameData = new GameData();               // LOGIC-CRITICAL (save/load)
  addUiThemeOverrides();                        // RENDER-ONLY
  this.load.setBaseURL();                       // RENDER-ONLY
  // WebGL pipeline registration:
  this.spritePipeline = new SpritePipeline(this.game);                    // RENDER-ONLY
  (this.renderer as WebGLRenderer).pipelines.add("Sprite", ...);         // RENDER-ONLY
  this.fieldSpritePipeline = new FieldSpritePipeline(this.game);          // RENDER-ONLY
  (this.renderer as WebGLRenderer).pipelines.add("FieldSprite", ...);    // RENDER-ONLY
  this.launchBattle();                          // MIXED (creates sprites + game objects)
}
```

### `launchBattle()` (battle-scene.ts:414)
Creates all the visual containers (field, fieldUI, arena backgrounds, trainer sprites, UI elements).
All sprite/container creation. **RENDER-ONLY** but currently interleaved with game state setup.

### Test Harness Status: ALREADY-MOCKED
- `GameWrapper.injectMandatory()` replaces renderer, children, sound, cameras, tweens, time, load, sys, add, textures, input, make -- covers all Phaser.Scene subsystems
- `GameWrapper.setScene()` calls `scene.preload()` and `scene.create()` directly (bypasses normal Phaser scene lifecycle)

---

## 3. Tweens Gating Game Logic

**Classification: LOGIC-CRITICAL**

This is the **most dangerous Phaser coupling**. Many phases use `globalScene.tweens.add({ onComplete: () => ... })` where the `onComplete` callback contains critical game state transitions.

### Critical Tween-Gated Logic (would block game progress without mocks):

| Phase | File:Line | What's Gated |
|-------|-----------|-------------|
| **FaintPhase** | `faint-phase.ts:200-218` | `pokemon.doSetStatus(StatusEffect.FAINT)`, `pokemon.leaveField()`, `this.end()` all inside `onComplete` of faint animation tween |
| **DamageAnimPhase** | `damage-anim-phase.ts:35-37` | `this.applyDamage()` gated behind `time.delayedCall(1000)` for OHKOs |
| **DamageAnimPhase** | `damage-anim-phase.ts:70-84` | `this.end()` gated behind `time.addEvent` flash timer |
| **StatStageChangePhase** | `stat-stage-change-phase.ts:268-288` | `this.end()` gated behind tween + `time.delayedCall(1750)` |
| **SummonPhase** | `summon-phase.ts:86-98` | Summoning logic gated behind `time.delayedCall(562)` and `time.delayedCall(750)` |
| **SwitchSummonPhase** | `switch-summon-phase.ts:69-112` | `switchAndSummon()` gated behind `time.delayedCall(750)` |
| **EvolutionPhase** | `evolution-phase.ts:217-328` | Multiple chained tweens gate evolution completion |
| **AttemptCapturePhase** | `attempt-capture-phase.ts:97-232` | Capture success/failure gated behind pokeball animation tweens |
| **EncounterPhase** | `encounter-phase.ts:340-363` | Field visibility tweens |
| **FormChangePhase** | `form-change-phase.ts:43-174` | Form change completion |
| **QuietFormChangePhase** | `quiet-form-change-phase.ts:97-135` | Silent form changes |
| **BattleInfo.updatePokemonHp** | `battle-info.ts:548-568` | HP bar tween `onComplete` calls `resolve()` -- Pokemon.updateInfo() promise depends on this |

### Test Harness Status: ALREADY-MOCKED (but fragile)
```typescript
// game-wrapper.ts:111-129
this.scene.tweens = {
  add: data => { data.onComplete?.(); },         // Immediately fires onComplete
  chain: data => {
    data?.tweens?.forEach(tween => tween.onComplete?.());
    data.onComplete?.();
  },
  addCounter: data => { data.onComplete?.(); },
  getTweensOf: () => [],
  killTweensOf: () => [],
};
```

### GAP: `onUpdate` Callbacks Not Fired
The mock `tweens.add` fires `onComplete` but **never fires `onUpdate`**. This means any game logic in `onUpdate` is silently skipped. Example:
- `battle-info.ts:559`: `onUpdate: () => { this.onHpTweenUpdate(pokemon); }` -- HP frame color updates skipped (cosmetic only, not a logic gap)

### GAP: Tween `targets` Properties Not Modified
The mock doesn't actually modify the `targets` object properties (e.g., `alpha`, `y`, `scaleX`). Tweens that set position/alpha on sprites won't take effect. This is fine for rendering but could matter if game logic reads sprite positions.

---

## 4. Timer Events (time.delayedCall / time.addEvent)

**Classification: LOGIC-CRITICAL**

### Scope of Usage
60+ calls to `globalScene.time.delayedCall()` and `globalScene.time.addEvent()` across phases. Many gate critical state transitions:

| File | Count | Critical? |
|------|-------|-----------|
| `evolution-phase.ts` | 14 | Yes - evolution state transitions |
| `egg-hatch-phase.ts` | 14 | Yes - hatch completion |
| `switch-summon-phase.ts` | 3 | Yes - switch execution |
| `summon-phase.ts` | 5 | Yes - summoning logic |
| `damage-anim-phase.ts` | 2 | Yes - damage application |
| `stat-stage-change-phase.ts` | 1 | Yes - phase end |
| `attempt-capture-phase.ts` | 4 | Yes - capture logic |
| `form-change-phase.ts` | 2 | Yes - form change |
| `game-over-phase.ts` | 1 | Yes - game over handling |
| `party-heal-phase.ts` | 1 | Yes - heal completion |
| `shiny-sparkle-phase.ts` | 1 | Minor |
| `reload-session-phase.ts` | 1 | Yes |
| `pokemon-anim-phase.ts` | 1 | Cosmetic |
| `unlock-phase.ts` | 2 | Minor |

### Game Speed System: `src/system/game-speed.ts`
Patches `this.time.addEvent` and all `this.tweens.*` methods to scale delays by `gameSpeed`. This monkeypatching is applied in `BattleScene.create()` via `initGameSpeed.apply(this)`.

### Test Harness Status: ALREADY-MOCKED
```typescript
// mock-clock.ts
class MockClock extends Phaser.Time.Clock {
  public overrideDelay: number | null = 1;  // Overrides ALL delays to 1ms
  constructor(scene) {
    super(scene);
    setInterval(() => {
      this.preUpdate(this.systems.game.loop.time, 1);
      this.update(this.systems.game.loop.time, 1);
    }, 1);  // Pumps clock every 1ms
  }
  addEvent(config) {
    const cfg = { ...config, delay: this.overrideDelay ?? config.delay };
    return super.addEvent(cfg);
  }
}
```

This is effective but relies on `setInterval()` which requires a running event loop. For headless RL, this could be replaced with manual clock pumping.

---

## 5. Canvas/Rendering APIs

**Classification: RENDER-ONLY**

### Direct Canvas/WebGL Usage
- `src/pipelines/sprite.ts` -- WebGL shader pipeline
- `src/pipelines/field-sprite.ts` -- WebGL shader pipeline
- `src/pipelines/invert.ts` -- Post-processing FX
- `src/loading-scene.ts` -- Asset loading via Phaser loader
- `src/scene-base.ts` -- `this.load.image()`, `this.load.atlas()`, etc.

### Texture/Sprite Dependencies in Non-UI Code
- `src/field/pokemon.ts:181` -- `Pokemon extends Phaser.GameObjects.Container`
  - Pokemon IS a Phaser Container, not just HAS rendering. Stats, moves, abilities are properties on the Container.
  - `getSprite()` (line 1117), `getTintSprite()` (line 1121) return child sprites
  - `resetSprite()`, `setScale()`, `setAlpha()`, `setVisible()` are inherited Phaser methods

### Test Harness Status: ALREADY-MOCKED
- `MockTextureManager` provides `add.sprite`, `add.container`, `add.image`, etc.
- `MockSprite` wraps a real `Phaser.GameObjects.Sprite` (instantiated with the test scene)
- `MockLoader` stubs all asset loading
- Renderer is stubbed: `{ maxTextures: -1, gl: {}, deleteTexture: () => null, ... }`

### GAP: Pokemon Extends Container
Since `Pokemon extends Phaser.GameObjects.Container`, you can't create a Pokemon without a valid Phaser scene. Even in tests, MockSprite creates real `Phaser.GameObjects.Sprite` instances. This is the deepest architectural coupling.

---

## 6. Input System

**Classification: RENDER-ONLY for phases**

### Input Setup in BattleScene
- `this.inputController = new InputsController()` (battle-scene.ts:392)
- `this.uiInputs = new UiInputs(this.inputController)` (battle-scene.ts:393)
- Input handling is in `src/inputs-controller.ts` (gamepad, keyboard via Phaser.Input)

### Phase-Level Input
Phases do NOT directly access `this.input` or keyboard/gamepad APIs. Command selection goes through `CommandPhase -> UI -> processInput()` callback chain, not direct Phaser input polling.

### Test Harness Status: ALREADY-MOCKED
- `this.scene.input = this.game.input` (game-wrapper.ts:181)
- `this.scene.input.keyboard = new KeyboardPlugin(this.scene)` (game-wrapper.ts:183)
- `this.scene.input.gamepad = new GamepadPlugin(this.scene)` (game-wrapper.ts:184)
- Tests use `game.move.select()`, `game.doSelectPartyPokemon()` etc. which bypass the input system entirely

---

## 7. Sound System

**Classification: RENDER-ONLY**

### Usage in Phases
52 calls to `globalScene.playSound()` across 24 phase files. None gate game logic -- all are fire-and-forget.

### Test Harness Status: ALREADY-MOCKED
```typescript
// game-wrapper.ts:86-101
this.scene.sound = {
  play: () => null,
  pause: () => null,
  add: () => this.scene.sound,
  get: () => ({ ...this.scene.sound, totalDuration: 0 }),
  getAllPlaying: () => [],
  destroy: () => null,
  on: (_evt, callback) => callback(),  // Immediately fires callbacks
  // ...
};
```

### GAP: sound.on() Callback Pattern
`sound.on(_evt, callback) => callback()` immediately fires the callback. This is correct for `'complete'` events but could cause issues if code expects the callback to fire asynchronously.

Party heal phase (`party-heal-phase.ts:42`) uses `globalScene.time.delayedCall(fixedInt(healSong.totalDuration * 1000), ...)` which depends on `sound.get().totalDuration`. The mock returns `totalDuration: 0`, making the delay `0ms` -- this is fine.

---

## 8. Additional Phaser Dependencies in Data Files

**Classification: MOSTLY RENDER-ONLY**

Only one data file imports Phaser directly:
- `src/data/battle-anims.ts` -- `import Phaser from "phaser"` (line 15)
  - Uses Phaser types for animation frame data structures
  - Animates sprites during battle moves
  - Already mocked: `MoveAnim.prototype.getAnim = () => ({ frames: {} })` in game-wrapper.ts

### `src/data/pokemon-species.ts` (line 660)
```typescript
Math.random = randSeedFloat;  // Temporarily replaces Math.random with seeded version
```
This is an indirect Phaser dependency (randSeedFloat -> Phaser.Math.RND.frac()).

---

## Summary: Classification Matrix

| Coupling | Category | Test Mock Status | Headless Gap? |
|----------|----------|-----------------|---------------|
| `Phaser.Math.RND` (seeded RNG) | LOGIC-CRITICAL | ALREADY-MOCKED (real Phaser RND works in Node) | None -- works headless |
| `Scene lifecycle (create/update)` | MIXED | ALREADY-MOCKED (GameWrapper.setScene) | None |
| `tweens.add({ onComplete })` | LOGIC-CRITICAL | ALREADY-MOCKED (immediate onComplete) | Minor: onUpdate not fired |
| `time.delayedCall()` | LOGIC-CRITICAL | ALREADY-MOCKED (MockClock, 1ms delay) | None (relies on setInterval) |
| `time.addEvent()` | LOGIC-CRITICAL | ALREADY-MOCKED (MockClock) | None |
| `Pokemon extends Container` | LOGIC-CRITICAL | ALREADY-MOCKED (MockSprite wraps real Sprite) | **Architectural debt** |
| Sound system | RENDER-ONLY | ALREADY-MOCKED | None |
| Input system | RENDER-ONLY | ALREADY-MOCKED | None |
| Canvas/WebGL renderer | RENDER-ONLY | ALREADY-MOCKED (stub object) | None |
| Texture/sprite loading | RENDER-ONLY | ALREADY-MOCKED (MockLoader, MockTextureManager) | None |
| `initGameSpeed()` tween/timer patching | LOGIC-CRITICAL | ALREADY-MOCKED (bypassed; mocks don't need speed adjustment) | None |
| `battle-anims.ts` (MoveAnim) | RENDER-ONLY | ALREADY-MOCKED (`getAnim = () => ({frames:{}})`) | None |
| `extensions.ts` (setPositionRelative) | RENDER-ONLY | ALREADY-MOCKED (works via real Phaser import) | None |

---

## Key Risks for Headless RL Operation

### Risk 1: Pokemon as Phaser.GameObjects.Container (HIGH)
Pokemon objects cannot exist without a Phaser scene. All game logic (stats, moves, abilities, HP) is stored as properties on this Container subclass. Any headless runner MUST either:
- Keep the Phaser game instance (with mocked renderer) -- current approach
- Extract game state into a separate data layer (massive refactor)

### Risk 2: Tween-Gated State Transitions (MEDIUM)
The test harness correctly fires `onComplete` immediately, but this creates a **synchronous illusion** of what is normally async. In headless mode, if we forget to mock tweens, FaintPhase, DamageAnimPhase, SummonPhase, and many others will **hang forever** waiting for tween completion.

### Risk 3: MockClock setInterval Dependency (LOW)
MockClock uses `setInterval(() => { ... }, 1)` to pump the Phaser clock. This works in Node.js but:
- Creates real interval timers (cleanup needed)
- 1ms resolution may cause timing issues in fast iteration
- Consider replacing with synchronous clock pumping for RL

### Risk 4: Game Speed Patching (LOW)
`initGameSpeed()` monkeypatches `this.time.addEvent` and `this.tweens.*`. If GameWrapper mocks replace these AFTER `create()` calls `initGameSpeed`, the patches are overwritten. Current test setup handles this correctly (mocks are injected in `injectMandatory()` before `create()`).

---

## Recommendations for Headless RL

1. **Reuse the existing test mock infrastructure** -- it already solves 90% of Phaser decoupling
2. **Keep Phaser as a dependency** -- `Phaser.Math.RND` and `Phaser.GameObjects.Container` are too deeply embedded to remove
3. **Use the mock tween/timer approach** -- immediately fire `onComplete` callbacks for instant game progression
4. **Consider synchronous clock** -- replace MockClock's `setInterval` with manual `clock.step(delta)` for deterministic RL stepping
5. **Do NOT attempt to separate Pokemon data from Phaser Container** -- this would require rewriting 5600+ lines of pokemon.ts and every file that interacts with Pokemon

---

## Files Examined
- `src/utils/common.ts` (RNG functions)
- `src/system/game-speed.ts` (tween/timer patching)
- `src/battle-scene.ts` (scene lifecycle, RNG state management)
- `src/battle.ts` (battle-scoped RNG)
- `src/scene-base.ts` (Phaser.Scene base class)
- `src/extensions.ts` (Phaser prototype extensions)
- `src/init/init.ts` (game initialization -- no Phaser dependency)
- `src/field/pokemon.ts` (Pokemon extends Container)
- `src/data/battle-anims.ts` (only data file importing Phaser)
- `src/phases/faint-phase.ts` (tween-gated faint logic)
- `src/phases/damage-anim-phase.ts` (timer-gated damage)
- `src/phases/move-phase.ts` (no direct Phaser imports)
- `src/phases/stat-stage-change-phase.ts` (tween-gated stats)
- `src/phases/summon-phase.ts` (timer-gated summoning)
- `src/phases/switch-summon-phase.ts` (timer-gated switching)
- `src/phases/evolution-phase.ts` (heavily tween-gated)
- `src/phases/attempt-capture-phase.ts` (tween-gated capture)
- `src/ui/battle-info/battle-info.ts` (HP tween gates updateInfo promise)
- `test/test-utils/game-wrapper.ts` (primary mock infrastructure)
- `test/test-utils/mocks/mock-clock.ts` (timer mock)
- `test/test-utils/mocks/mock-texture-manager.ts` (rendering mock)
- `test/test-utils/mocks/mocks-container/mock-sprite.ts` (sprite mock)
- `src/rl/standalone-setup.ts` (headless initialization)
- All 21 phase files with tween usage
- All 30 files with input system references
