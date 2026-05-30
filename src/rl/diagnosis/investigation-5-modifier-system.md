# Investigation 5: Modifier System Deep Dive

## Overview

The modifier system is how PokeRogue handles items (held items, consumables, pokeballs, vouchers, etc.). After each battle, the player enters a `SelectModifierPhase` which presents reward items and a shop. The system has 4 key layers:

1. **Modifier pools & type generation** (what items can appear)
2. **SelectModifierPhase** (the phase that orchestrates selection)
3. **ModifierSelectUiHandler** (the UI for displaying/selecting items)
4. **addModifier / modifier.apply** (actually applying the item)

---

## 1. How Modifier Options Are Generated

### Pool Structure

File: `src/modifier/modifier-pools.ts` — simple container objects:
- `modifierPool` (player rewards)
- `wildModifierPool`, `trainerModifierPool` (enemy held items)
- `enemyBuffModifierPool` (enemy buffs per wave)
- `dailyStarterModifierPool` (daily run starter items)

File: `src/modifier/init-modifier-pools.ts` — populates these pools at startup. Each pool is a map of `ModifierTier -> WeightedModifierType[]`. Each `WeightedModifierType` wraps a `ModifierTypeFunc` (factory function) and a weight (static number or dynamic function of `(party, rerollCount) => number`).

### Tier Weights (probability of each tier)

From `modifier-type.ts:2352`:
```
const tierWeights = [768/1024, 195/1024, 48/1024, 12/1024, 1/1024];
// COMMON=75%, GREAT=19%, ULTRA=4.7%, ROGUE=1.2%, MASTER=0.1%
```

Actual tier selection in `getNewModifierTypeOption()` (line 2764) uses `randSeedInt(1024)`:
- >255: COMMON
- >60: GREAT
- >12: ULTRA
- >0: ROGUE
- =0: MASTER

Luck upgrades can bump the tier upward. The upgrade odds are `128 / ((partyLuckValue + 4) / 4)`.

### Generation Pipeline

1. `SelectModifierPhase.start()` calls `regenerateModifierPoolThresholds(party, poolType, rerollCount)` — this recomputes weighted thresholds for each tier based on current party state, existing modifiers, and reroll count. Items already at max stack get weight 0.

2. `getModifierCount()` returns base 3, modified by `ExtraModifierModifier` and `TempExtraModifierModifier` held items.

3. `getModifierTypeOptions(count)` calls `getPlayerModifierTypeOptions()` which:
   - For each slot, calls `getModifierTypeOptionWithRetry()` which retries up to `min(count*5, 50)` times to avoid duplicate items.
   - Each attempt calls `getNewModifierTypeOption()` which: picks a tier via RNG, selects within that tier via weighted threshold, and if the type is a `ModifierTypeGenerator`, calls `generateType(party)` to produce the concrete `ModifierType`.
   - Result is a `ModifierTypeOption { type: ModifierType, upgradeCount: number, cost: number }`.

4. Custom modifiers (from mystery encounters etc.) can override via `CustomModifierSettings`: guaranteed tiers, guaranteed type options, guaranteed type funcs, fillRemaining flag, rerollMultiplier.

5. Finally, `overridePlayerModifierTypeOptions()` checks `Overrides.ITEM_REWARD_OVERRIDE` for dev testing.

### Shop Items

`getPlayerShopModifierTypeOptionsForWave(waveIndex, baseCost)` returns a **fixed set** of healing/utility items (potions, ethers, revives, etc.) with costs scaled by `baseCost`. The available items expand as wave progresses (`ceil((waveIndex+10)/30)` tiers of items). Shop items are NOT randomly generated — they're a deterministic menu. No shop items appear on boss waves (wave % 10 === 0).

---

## 2. UI Handler: From Click to Modifier Applied

File: `src/ui/handlers/modifier-select-ui-handler.ts`

### Layout
- **Row 0** (bottom): 4 buttons — Reroll (cursor 0), Transfer (cursor 1), Check Team (cursor 2), Lock Rarities (cursor 3)
- **Row 1**: Reward options (the randomly generated items)
- **Row 2+**: Shop options (up to 2 rows, `SHOP_OPTIONS_ROW_LIMIT = 7` per row)

### Selection Flow
1. `show(args)` receives `[isPlayer, typeOptions[], modifierSelectCallback, rerollCost]`
2. Creates `ModifierOption` visual objects for rewards and shop items
3. Plays staggered appearance animations with upgrade tween effects
4. Once animations complete, sets `awaitingActionInput = true` and stores `onActionInput = modifierSelectCallback`

5. `processInput(button)`:
   - **ACTION**: calls `onActionInput(rowCursor, cursor)` — this is the `_modifierSelectCallback` created in `SelectModifierPhase.start()`
   - **CANCEL**: calls `onActionInput(-1, -1)` — triggers skip confirmation

### The Callback (in SelectModifierPhase)

The `_modifierSelectCallback(rowCursor, cursor)` handles:
- `rowCursor < 0 || cursor < 0`: Show skip confirmation dialog
- `rowCursor === 0`: Bottom row actions (reroll/transfer/check/lock)
- `rowCursor === 1`: Reward selection via `selectRewardModifierOption(cursor)`
- `rowCursor >= 2`: Shop selection via `selectShopModifierOption(rowCursor, cursor)`

---

## 3. State Changes on Selection vs Skip

### When a modifier is selected (reward):
1. `selectRewardModifierOption(cursor)` gets the `ModifierType` from `typeOptions[cursor]`
2. `applyChosenModifier(modifierType, cost=-1, callback)`:
   - If `PokemonModifierType`: opens party menu to pick target Pokemon
   - If `FusePokemonModifierType`: opens fusion menu
   - Otherwise: calls `applyModifier(modifierType.newModifier(), cost=-1)`
3. `applyModifier(modifier, cost, playSound)`:
   - Calls `globalScene.addModifier(modifier, false, playSound, undefined, undefined, cost)`
   - For free items (cost === -1): clears UI text, sets mode to MESSAGE, calls `super.end()` (ends the phase)
   - Special case: TM/RememberMoveModifier — queues a copy of the phase to return to

### When a modifier is selected (shop):
Same flow but:
- Checks money >= cost (after HealShopCostModifier adjustment)
- On success: deducts money, updates money text, plays buy sound
- Does NOT end the phase — player can buy multiple shop items

### When skipped:
- Shows confirmation dialog "Skip item?"
- On confirm: clears UI, sets MESSAGE mode, calls `super.end()`
- On deny: resets modifier select screen

### State mutations by addModifier (battle-scene.ts:2622):
- **PersistentModifier**: calls `modifier.add(this.modifiers, virtual)` which either increases stack count of existing modifier or pushes new one. Then calls `updateModifiers(true)` which recalculates stats and updates the modifier bar UI.
- **ConsumableModifier**: iterates through party, calls `modifier.apply(pokemon, ...args)` for each eligible pokemon. Updates party info.
- If a persistent modifier is at max stack, substitutes with `getDefaultModifierTypeForTier(tier)` (a fallback item).

---

## 4. Rerolling

`rerollModifiers()`:
1. Calculates reroll cost via `getRerollCost(lockRarities)`:
   - Base 250 (or tier-weighted sum if lockRarities is on)
   - Multiplied by `ceil(waveIndex/10) * 2^rerollCount * customMultiplier`
   - Modified by HealShopCostModifier (Black Sludge)
   - Returns -1 if reroll is disabled (custom settings)
2. Checks money >= rerollCost
3. Sets `globalScene.reroll = true`
4. Unshifts a new `SelectModifierPhase` with `rerollCount + 1` and current tier array
5. Deducts money, ends current phase

Lock rarities toggle: `globalScene.lockModifierTiers` boolean. When true, rerolled items keep same tiers. When false, new random tiers.

---

## 5. Programmatic selectModifier(index) — Minimum Code Path

### Already implemented: `src/rl/modifier-api.ts`

The RL API provides:
- `getAvailableModifiers()` — queries current rewards and shop
- `selectRewardModifier(index, pokemonIndex?, moveIndex?)` — picks a reward
- `selectShopModifier(index, pokemonIndex?, moveIndex?)` — buys a shop item
- `skipModifiers()` — skips the phase
- `rerollModifiers()` — rerolls

### For "none" target modifiers (no pokemon needed):
Uses the phase's `_modifierSelectCallback(rowCursor, cursor)` directly.

### For pokemon-targeting modifiers:
Bypasses the party menu UI entirely using `phase.applyModifierDirectly(modifier, cost)` — a method added to SelectModifierPhase (line 505) that directly calls the private `applyModifier()`.

### Minimum code path for a reward pick:
```
1. getCurrentSelectModifierPhase() — verify we're in the right phase
2. phase.getTypeOptions()[index].type — get the modifier type
3. modifierType.newModifier(targetPokemon) — create the modifier instance
4. phase.applyModifierDirectly(modifier, -1) — apply it (ends the phase for rewards)
```

### Minimum code path for a shop purchase:
```
1. getPlayerShopModifierTypeOptionsForWave(...) — get shop options
2. Calculate adjusted cost with HealShopCostModifier
3. Check money >= cost
4. modifierType.newModifier(targetPokemon) — create instance
5. phase.applyModifierDirectly(modifier, cost) — apply (does NOT end phase)
```

---

## 6. Rendering Coupling

### Heavy rendering in ModifierSelectUiHandler:
- `ModifierOption` extends `Phaser.GameObjects.Container` — the visual representation of each item
- Upgrade animations (tier glow effects) via `globalScene.tweens`
- Shop overlay via `globalScene.showShopOverlay()`
- Item icon sprites loaded from Phaser texture atlas
- ModifierBar (left side icons) updates via `Phaser.GameObjects.Container`

### Pure logic (no rendering):
- Pool generation (`regenerateModifierPoolThresholds`, `getNewModifierTypeOption`) — pure RNG + weight math
- `ModifierType.newModifier()` — pure factory
- `PersistentModifier.add()` — pure array manipulation
- `SelectModifierPhase.start()` through callback creation — mixed (calls `resetModifierSelect` which sets UI mode)
- `applyModifier()` — calls `globalScene.addModifier()` which calls `updateModifiers()` which touches ModifierBar (Phaser container)

### RL bypass strategy:
The `modifier-api.ts` already bypasses the UI handler entirely. The remaining rendering touchpoints are:
1. `globalScene.addModifier()` → `updateModifiers()` → `ModifierBar.updateModifiers()` (Phaser container)
2. `p.updateInfo(instant)` — updates Pokemon info overlays (Phaser)
3. `globalScene.updateMoneyText()` — updates money display
4. `globalScene.animateMoneyChanged()` — money animation
5. Sound effects: `globalScene.playSound("se/buy")`

These are all in `BattleScene` methods and would need to be no-ops or have the rendering portions stubbed for headless mode.

---

## 7. Test Harness Handling

File: `test/test-utils/game-manager.ts`

### `doSelectModifier()` (line 326):
Simply **skips** modifier selection:
1. On next prompt for `SelectModifierPhase` in `UiMode.MODIFIER_SELECT`: sends `Button.CANCEL`
2. On next prompt for `SelectModifierPhase` in `UiMode.CONFIRM`: sends `Button.ACTION` (confirms skip)

This means tests never actually pick items — they always skip. The method is used by `toNextWave()` for advancing through waves.

### No test helpers for actually selecting specific modifiers.

---

## 8. Shop vs Reward System

### Same system, different sources:
- **Rewards**: randomly generated from `modifierPool` via `getPlayerModifierTypeOptions()`. Free. Picking one ends the phase.
- **Shop**: deterministic items from `getPlayerShopModifierTypeOptionsForWave()`. Cost money. Picking one does NOT end the phase (can buy multiple).

### UI layout:
- Rewards on row 1, shop on rows 2-3
- Shop has `SHOP_OPTIONS_ROW_LIMIT = 7` items per row
- Shop disabled on boss waves (wave % 10 === 0)
- Shop availability controlled by `globalScene.gameMode.getShopStatus()`

### Key difference for RL:
After selecting a reward, the phase ends automatically. After buying a shop item, the player stays in the phase and can buy more or skip. The RL API handles this: `selectRewardModifier` ends the phase, `selectShopModifier` does not.

---

## Summary: Key Findings for RL Integration

1. **The RL modifier API already exists** at `src/rl/modifier-api.ts` with clean abstractions. It bypasses the UI entirely.

2. **Rendering is coupled through `globalScene.addModifier()`** which calls `updateModifiers()` → `ModifierBar.updateModifiers()` (Phaser). For headless mode, this chain needs stubbing.

3. **The phase ends differently for rewards vs shop**: rewards end the phase on selection, shop items don't. Both paths ultimately go through `applyModifier()` which calls `globalScene.addModifier()`.

4. **Pool generation is pure logic** — no rendering dependency. Can be called standalone.

5. **Custom modifier settings** allow full control over what appears (guaranteed tiers, specific types, etc.), which could be useful for RL training curriculum.

6. **Reroll cost scales exponentially** (2^rerollCount), making repeated rerolls very expensive.

7. **The test harness always skips modifiers** — no existing test infrastructure for testing specific modifier selections.
