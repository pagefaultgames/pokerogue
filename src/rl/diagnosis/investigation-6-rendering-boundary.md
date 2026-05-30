# Investigation 6: Rendering Boundary

## Executive Summary

The rendering boundary in PokeRogue is **deeply entangled** with game logic in several critical places. Game state changes are frequently gated behind animation callbacks (tweens, timers, sound completions). However, the existing test mock infrastructure already solves most of these problems by making all animations synchronous/immediate. A headless mode can work **by reusing the same mock approach** the test harness already uses.

---

## 1. Critical Question Answers

### Q1: When damage is dealt, does the HP value change immediately or after animation?

**HP changes IMMEDIATELY.** The `damage()` method at `src/field/pokemon.ts:3879` directly subtracts HP:
```
this.hp -= damage;
```
The `damageAndUpdate()` method at line 3921 calls `this.damage()` first (which mutates HP), then queues a `DamageAnimPhase` for the visual effect. The `DamageAnimPhase` is purely visual -- it plays sound effects, flashes the sprite, and shows damage numbers. The `DamageAnimPhase.end()` is gated behind the flash timer animation completing, but this only controls when the *next phase* can start, not when HP actually changes.

**However**: `DamageAnimPhase.applyDamage()` calls `this.getPokemon().updateInfo().then(() => this.end())`. The `updateInfo()` triggers the HP bar animation tween (`BattleInfo.updatePokemonHp`), and the phase only ends when the tween's `onComplete` fires. **In headless mode, the tween mock immediately fires `onComplete`, so this is not blocking.**

### Q2: When a Pokemon faints, does the faint state apply immediately or after animation?

**CRITICALLY: Faint state is applied INSIDE the animation callback.**

In `FaintPhase.doFaint()` (src/phases/faint-phase.ts:86-221):
```typescript
pokemon.faintCry(() => {
  // ... friendship loss, sound effects ...
  globalScene.tweens.add({
    targets: pokemon,
    duration: 500,
    y: pokemon.y + 150,
    onComplete: () => {
      pokemon.lapseTags(BattlerTagLapseType.FAINT);
      pokemon.doSetStatus(StatusEffect.FAINT);  // <-- STATUS SET HERE
      pokemon.leaveField();
      this.end();  // <-- PHASE ENDS HERE
    },
  });
});
```

The faint status (`StatusEffect.FAINT`) is only set inside the tween's `onComplete` callback. The `leaveField()` call and the phase's `end()` are also inside this callback.

**In test mocks, this works because:**
- `faintCry` is mocked to immediately call its callback (game-wrapper.ts:44-48)
- `tweens.add` is mocked to immediately call `onComplete` (game-wrapper.ts:112-115)

### Q3: Are move effects (stat changes, status application) gated behind animation callbacks?

**STAT CHANGES: Yes, partially.** In `StatStageChangePhase.start()` (src/phases/stat-stage-change-phase.ts:245-294):
- If animations are enabled (`globalScene.moveAnimations`), stat changes are applied in a `globalScene.time.delayedCall(1750, () => { ... end() })` callback
- If animations are disabled, `end()` is called immediately
- The actual stat mutation (`pokemon.setStatStage(...)`) happens in the `end()` local function, which is called either way

**STATUS EFFECTS: Yes.** In `ObtainStatusEffectPhase.start()` (src/phases/obtain-status-effect-phase.ts:51-79):
- `pokemon.doSetStatus()` is called immediately (before animation)
- But the phase's `this.end()` is gated behind `CommonBattleAnim.play(false, () => { ... this.end() })`
- Ability attrs like `PostSetStatusAbAttr` are called inside the animation callback

**MOVE EFFECTS:** In `MoveEffectPhase.start()` (src/phases/move-effect-phase.ts:221-311):
- If the move hits, `MoveAnim.play()` is called with a callback `postAnimCallback`
- ALL move effect application (damage, stat changes, ability triggers) happens inside this callback
- If the move doesn't hit, `postAnimCallback` is called directly (no animation)

### Q4: Does `triggerPokemonBattleAnim()` need to complete for the phase to progress?

**Yes.** `triggerPokemonBattleAnim()` (src/battle-scene.ts:3247-3261) creates a `PokemonAnimPhase` and unshifts/pushes it to the phase queue. `PokemonAnimPhase` (src/phases/pokemon-anim-phase.ts) is entirely animation-driven -- its `end()` is called inside nested tween `onComplete` callbacks. Since the phase system processes phases sequentially, subsequent phases won't run until the animation phase completes.

**In test mocks, this works because tweens complete immediately.**

### Q5: What happens in phases when sprites/containers are null (headless scenario)?

This would crash in many places. The code assumes sprites exist. For example:
- `DamageAnimPhase.applyDamage()` calls `this.getPokemon().getSprite().setVisible(...)`
- `FaintPhase.doFaint()` accesses `pokemon.faintCry()` which uses `this.getSprite()`
- `StatStageChangePhase` uses `pokemon.enableMask()` and `pokemon.maskSprite`
- `BattleAnim.play()` accesses `user.getSprite()` and `target.getSprite()`

**The test mocks handle this by:**
- Pokemon extends `Phaser.GameObjects.Container` which in tests uses `MockContainer`
- `getSprite()` returns a child of the container, which would be a `MockSprite`
- All mock methods are no-ops that return `this` for chaining

---

## 2. Pokemon Class: Logic vs Rendering Breakdown

### Pure Logic Methods (no rendering dependency)
These methods only manipulate data and can run without Phaser:
- `calculateStats()`, `getStats()`, `getStat()`, `getBaseStat()`
- `getTypes()`, `getTeraType()`, `getMoveType()`
- `getAbility()`, `hasAbility()`, `hasAbilityWithAttr()`
- `damage()`, `heal()` -- directly mutate `this.hp`
- `getAttackDamage()`, `getMoveEffectiveness()`, `getCriticalHitResult()`
- `isFainted()`, `isActive()`, `isOnField()`, `isPlayer()`, `isEnemy()`
- `getTag()`, `addTag()`, `removeTag()`, `lapseTag()`, `lapseTags()`
- `getMoveQueue()`, `getMoveset()`, `pushMoveHistory()`
- `setStatStage()`, `getStatStage()`, `getStatStages()`
- `doSetStatus()` -- sets status but ALSO calls `this.setFrameRate()` (rendering side effect!)
- `resetStatus()`, `resetSummonData()`, `resetTurnData()`
- All ability/modifier application methods

### Rendering Methods (require Phaser)
- `init()` -- creates sprites, adds to scene
- `getSprite()`, `getTintSprite()`, `getSpriteScale()`
- `enableMask()`, `disableMask()`
- `cry()`, `faintCry()`, `fusionFaintCry()`
- `updateInfo()` -- delegates to `BattleInfo.updateInfo()` which uses tweens
- `showInfo()`, `hideInfo()` -- tween-based animation
- `leaveField()` -- calls `resetSprite()`, `hideInfo()`, and `globalScene.field.remove()`
- `setFrameRate()` -- used in `doSetStatus()` (entanglement!)
- `resetSprite()`, `tryPlaySprite()`
- `updateFusionPalette()` -- already mocked to no-op in tests

### Mixed Methods (logic + rendering entangled)
- `doSetStatus()` -- sets `this.status` (logic) AND calls `this.setFrameRate()` (rendering)
- `leaveField()` -- resets tags/summon data (logic) AND calls `hideInfo()`, sprite reset (rendering)
- `damageAndUpdate()` -- calls `this.damage()` (logic) AND queues `DamageAnimPhase` (rendering)

---

## 3. BattleScene: Logic vs Display

### Logic Properties/Methods
- `currentBattle`, `arena`, `gameMode`, `score`, `seed`, `waveSeed`
- `getPlayerField()`, `getEnemyField()`, `getField()`, `getPokemonById()`
- `getPlayerParty()`, `getEnemyParty()`
- `applyModifier()`, `applyModifiers()`, `addModifier()`
- `money`, `pokeballCounts`, `modifiers`, `enemyModifiers`
- `phaseManager` -- the entire phase system
- `eventTarget` -- event dispatch system
- `gameData` -- save data

### Display Properties/Methods
- `field`, `fieldUI`, `uiContainer` -- Phaser containers
- `arenaBg`, `arenaPlayer`, `arenaEnemy` -- arena sprites
- `ui` -- the UI handler system
- `tweens`, `time`, `sound`, `cameras` -- Phaser subsystems
- `damageNumberHandler`, `spriteSparkleHandler`
- `modifierBar`, `enemyModifierBar`
- `playSound()`, `toggleInvert()`
- `triggerPokemonBattleAnim()` -- creates animation phases

### Mixed (logic gated on display)
- `triggerPokemonFormChange()` -- logic but creates phases
- `initFinalBossPhaseTwo()` -- boss logic tied to phase progression
- `updateFieldScale()` -- repositions field but is awaited by logic code

---

## 4. Phase System: Animation Gating Analysis

### Phases where `end()` is gated behind animation callbacks

| Phase | Animation Gate | Test Mock Solution |
|-------|---------------|-------------------|
| `DamageAnimPhase` | `time.addEvent` flash timer OR `updateInfo().then()` | MockClock runs immediately (delay=1), tweens.add fires onComplete |
| `FaintPhase` | `faintCry` callback -> `tweens.add` onComplete | faintCry mocked to call cb immediately, tweens.add fires onComplete |
| `StatStageChangePhase` | `time.delayedCall(1750)` | MockClock (delay=1) fires callback immediately |
| `MoveEffectPhase` | `MoveAnim.play()` callback | MoveAnim.getAnim mocked to return empty frames; tweens.addCounter fires onComplete |
| `CommonAnimPhase` | `CommonBattleAnim.play()` callback | Same as MoveEffectPhase |
| `ObtainStatusEffectPhase` | `CommonBattleAnim.play()` callback | Same as above |
| `PokemonAnimPhase` | Nested tween callbacks | tweens.add fires onComplete immediately |
| `PokemonHealPhase` | `updateInfo().then()` | Tweens fire immediately |
| `EvolutionPhase` | Heavy animation chain | Tweens fire immediately |
| `SwitchSummonPhase` | Pokeball throw animation | Tweens fire immediately |

### Phases with NO animation gating (purely logic)
- `MovePhase` -- all logic, delegates animation to `MoveEffectPhase`
- `CommandPhase` -- waits for user input (UI gated, not animation gated)
- `TurnStartPhase`, `TurnEndPhase` -- pure ordering/bookkeeping
- `VictoryPhase` -- queues other phases
- `BattleEndPhase` -- cleanup logic

---

## 5. Mock Analysis

### Mock File Inventory

| File | Replaces | Behavior |
|------|----------|----------|
| `mock-clock.ts` | `Phaser.Time.Clock` | Overrides `addEvent` to use `delay=1` instead of real delay. Runs `preUpdate`/`update` via `setInterval(1ms)`. **Critical for headless mode.** |
| `mock-texture-manager.ts` | `Phaser.Textures.TextureManager` | Routes `scene.add.container/sprite/text/etc.` to mock objects. No actual rendering. |
| `mock-game-object-creator.ts` | `Phaser.GameObjects.GameObjectCreator` | `scene.make.graphics()` and `rexTransitionImagePack()` -- both no-ops. |
| `mock-loader.ts` | `Phaser.Loader` | `once(event, cb)` calls cb immediately. `atlas/audio/image/spritesheet` are all no-ops. |
| `mock-fetch.ts` | `window.fetch` | Returns canned responses for API endpoints. |
| `mock-local-storage.ts` | `window.localStorage` | In-memory key-value store. |
| `mock-context-canvas.ts` | `HTMLCanvasElement` + `CanvasRenderingContext2D` | All methods are no-ops. |
| `mock-console/mock-console.ts` | `console` | Wraps console with colors, blacklists noisy messages. |
| `mocks-container/mock-container.ts` | `Phaser.GameObjects.Container` | All display methods are no-ops. Maintains `list` for child tracking. |
| `mocks-container/mock-sprite.ts` | `Phaser.GameObjects.Sprite` | Wraps a real `Phaser.GameObjects.Sprite` but intercepts several methods. Has `anims` stub. |
| `mocks-container/mock-text.ts` | `Phaser.GameObjects.Text` | No-op display. **Also mocks `UI.showText` and `UI.showDialogue`** to call callbacks immediately. |
| `mocks-container/mock-image.ts` | Extends MockContainer | Simple wrapper. |
| `mocks-container/mock-rectangle.ts` | `Phaser.GameObjects.Rectangle` | All no-ops. |
| `mocks-container/mock-graphics.ts` | `Phaser.GameObjects.Graphics` | All no-ops. |
| `mocks-container/mock-nineslice.ts` | Extends MockContainer | Simple wrapper. |
| `mocks-container/mock-polygon.ts` | Unknown (likely Phaser polygon) | Probably all no-ops. |
| `mocks-container/mock-texture.ts` | `Phaser.Textures.Texture` | Simple stub. |
| `mocks-container/mock-bbcode-text.ts` | Rex BBCode text plugin | Likely no-ops. |
| `mocks-container/mock-input-text.ts` | Rex input text plugin | Likely no-ops. |
| `mock-video-game-object.ts` | Video game object | All no-ops. |

### GameWrapper Prototype Overrides (game-wrapper.ts)

These are **critical** for headless mode -- they monkey-patch prototypes to bypass rendering:

| Override | What It Does |
|----------|-------------|
| `MoveAnim.prototype.getAnim = () => ({ frames: {} })` | Returns empty animation frames, preventing animation playback |
| `Pokemon.prototype.enableMask = () => null` | No-ops the stat change visual mask |
| `Pokemon.prototype.updateFusionPalette = () => null` | No-ops palette swaps |
| `Pokemon.prototype.cry = () => null` | No-ops Pokemon cries |
| `Pokemon.prototype.faintCry = cb => cb()` | **Immediately calls the callback**, bypassing sound/animation |
| `BattleScene.prototype.addPokemonIcon = () => new Container()` | Returns empty container |

### Injected Mock Subsystems (game-wrapper.ts:63-199)

| Subsystem | Mock |
|-----------|------|
| `scene.tweens` | `add: data => data.onComplete?.()` -- **instantly fires onComplete** |
| `scene.tweens.chain` | Fires all tween onCompletes then chain onComplete |
| `scene.tweens.addCounter` | Fires onComplete immediately |
| `scene.sound` | All no-ops; `get()` returns `{ totalDuration: 0 }` |
| `scene.cameras` | No-op pipelines |
| `scene.renderer` | Stub with `gl: {}`, no-op methods |
| `scene.load` | `MockLoader` -- immediate callbacks |
| `scene.time` | `MockClock` with `overrideDelay=1` |
| `scene.make` | `MockGameObjectCreator` |
| `scene.add` | Routed through `MockTextureManager` |

---

## 6. Phaser APIs NOT Mocked (Gaps)

The following Phaser APIs are used in game logic but are **NOT** explicitly mocked, relying instead on the real Phaser running in test mode:

1. **`Phaser.Math.RND`** -- Used for seeded random numbers. Works without rendering.
2. **`Phaser.GameObjects.Container`** -- Pokemon extends this. Tests use the real Phaser Container but with mock children.
3. **`Phaser.GameObjects.Sprite`** -- MockSprite wraps a real Phaser Sprite internally.
4. **`Phaser.Display.Masks.BitmapMask`** -- Used in StatStageChangePhase. Would crash headless without mock.
5. **`Phaser.Geom.Rectangle`** -- Used in BattleInfo for interactive areas.
6. **`Phaser.Events.EventEmitter`** -- Used directly. Works without rendering.
7. **`SoundFade`** (phaser3-rex-plugins) -- Used in fusionFaintCry. Would crash without sound mock.

---

## 7. Minimal Phaser Stub for Headless Game Logic

### Must Exist AND Have Behavior

| API | Required Behavior | Reason |
|-----|------------------|--------|
| `Phaser.Math.RND` | Seeded random number generation | Core game logic uses `randSeedInt`, `randSeedFloat`, etc. |
| `Phaser.Events.EventEmitter` | Event pub/sub | Used by `BattleScene.eventTarget` and phase system |
| `scene.tweens.add/chain/addCounter` | Must call `onComplete` immediately | Many phases gate `end()` on tween completion |
| `scene.time.addEvent/delayedCall` | Must fire callbacks quickly | `DamageAnimPhase`, `StatStageChangePhase`, `faintCry` failsafe |
| `scene.sound.play/get` | Must return truthy with `totalDuration: 0` | `faintCry` checks `!cry` to skip animation |

### Must Exist But Can Be No-ops

| API | Reason |
|-----|--------|
| All `Phaser.GameObjects.*` (Container, Sprite, Text, Image, Rectangle, etc.) | Pokemon extends Container; BattleInfo extends Container |
| `scene.add.*` (container, sprite, text, image, etc.) | Called extensively during initialization |
| `scene.load.*` (atlas, audio, spritesheet, image) | Asset loading during preload |
| `scene.cameras.main` | Only used for post-processing pipeline (visual only) |
| `scene.renderer` (gl, pipelines, etc.) | Only used for visual pipelines |
| `scene.input.*` | Only needed for user input handling |
| `Phaser.Display.Masks.BitmapMask` | Used in stat change animation; no-op is fine |
| `Pokemon.prototype.cry/faintCry/enableMask/updateFusionPalette` | Must be monkey-patched to no-op/immediate-callback |
| `MoveAnim.prototype.getAnim` | Must return `{ frames: {} }` to skip animation |
| `BattleAnim.play()` | Checks `globalScene.moveAnimations` -- if false, skips to callback immediately |

### Not Needed At All

| API | Reason |
|-----|--------|
| WebGL/Canvas rendering pipeline | No visual output |
| Actual texture loading/decoding | No sprites rendered |
| Audio decoding/playback | Sound mock is sufficient |
| Input handling (keyboard, gamepad) | RL agent provides actions programmatically |
| UI rendering (text layout, positioning) | RL doesn't need visual UI |

---

## 8. The `moveAnimations` Flag: A Built-in Rendering Toggle

There is a critical built-in flag: `globalScene.moveAnimations` (BattleScene property, line 213).

In `BattleAnim.play()` (battle-anims.ts:916-917):
```typescript
if (!globalScene.moveAnimations && !this.playRegardlessOfIssues) {
  return cleanUpAndComplete();  // Immediately calls callback, skipping animation
}
```

Setting `moveAnimations = false` would skip all move animations and immediately fire callbacks. This alone handles a significant portion of the animation gating.

Similarly, in `StatStageChangePhase.start()` (line 245):
```typescript
if (relLevels.filter(l => l).length > 0 && globalScene.moveAnimations) {
  // ... animation code ...
} else {
  end();  // Immediate
}
```

**Recommendation**: Set `globalScene.moveAnimations = false` in headless mode for free animation bypass.

---

## 9. Dual-Mode (Headless vs Rendered) Feasibility Assessment

### Clean Split Score: 4/10

The codebase was NOT designed with headless execution in mind. Game logic and rendering are interleaved throughout. However, the test infrastructure has already solved 90% of the problems through mocking.

### Strategy for Headless Mode

The simplest path is to **reuse the test mock infrastructure**:

1. **Keep Phaser loaded** (it's needed for `Phaser.Math.RND`, `EventEmitter`, and the Container/Sprite class hierarchy)
2. **Apply the same mock overrides** from `game-wrapper.ts`
3. **Set `globalScene.moveAnimations = false`**
4. **Use MockClock** with `overrideDelay=1` for instant timer resolution
5. **Use the same tween mock** that fires `onComplete` immediately

### Key Risks

1. **Race conditions**: Some code expects async tween resolution. Making everything synchronous could expose ordering bugs that don't manifest in the real game.
2. **Missing mocks**: If new animation-gated logic is added to phases, it won't be automatically covered.
3. **Phaser dependency size**: Even with mocking, Phaser must be imported (~3MB). This adds startup cost.
4. **BattleInfo.updateInfo() returns Promise**: Many callers `.then()` on it. The mock tween fires synchronously, so the Promise resolves on the next microtask, which could cause subtle ordering issues.

---

## 10. Summary of Entanglement Hotspots

| Hotspot | Severity | Description |
|---------|----------|-------------|
| `FaintPhase.doFaint()` | **HIGH** | Faint status set inside nested animation callbacks |
| `MoveEffectPhase.start()` | **HIGH** | All move effects applied inside MoveAnim.play() callback |
| `DamageAnimPhase.applyDamage()` | **MEDIUM** | Phase end gated on flash timer / updateInfo tween |
| `StatStageChangePhase.start()` | **MEDIUM** | Stat changes in delayedCall when animations enabled |
| `ObtainStatusEffectPhase.start()` | **MEDIUM** | Ability triggers inside animation callback |
| `PokemonAnimPhase` | **MEDIUM** | Entirely animation-driven phase |
| `Pokemon.doSetStatus()` | **LOW** | Calls `setFrameRate()` but status set regardless |
| `BattleInfo.updatePokemonHp()` | **LOW** | HP bar tween; HP already changed in `damage()` |
| `BattleInfo.updateInfo()` | **LOW** | Visual update; Promise resolution via tween |

All of these are already handled by the test mock infrastructure. For the RL environment, the same approach works.
