# Investigation 1: Vitest Dependency Map

## Executive Summary

The test harness has **two layers** of Vitest dependency:

1. **Infrastructure layer** (setup files, config, reporters) -- deeply coupled to Vitest's runner, hooks, and module mocking. These are the **hard** dependencies.
2. **Spy/mock layer** (spyOn, fn, waitUntil) -- already fully replaced by standalone implementations in `src/rl/mocks/spy.ts` across all test-utils files. This is **done**.

The remaining Vitest lock-in comes from 5 specific mechanisms, detailed below.

---

## 1. `vi.mock()` -- Module-Level Mocking (DEEP SURGERY)

### Location: `test/setup/vitest.setup.ts` lines 14-60

Two `vi.mock()` calls use Vitest's **module hoisting** to intercept ES module imports before any test code runs.

#### 1a. Overrides Mock (line 14-23)

```ts
vi.mock(import("#app/overrides"), async importOriginal => {
  const { defaultOverrides } = await importOriginal();
  return {
    default: defaultOverrides,
    defaultOverrides: { ...defaultOverrides },
  } satisfies typeof import("#app/overrides");
});
```

**What it does**: Replaces the entire `#app/overrides` module so that every test starts with default overrides (not user-customized ones). The `OverridesHelper` then uses `spyOn(Overrides, "PROP", "get")` to override individual values per-test.

**Why it exists**: Without this, any local `overrides.ts` customizations (e.g., a developer setting `STARTING_LEVEL_OVERRIDE = 999`) would leak into tests, making them non-deterministic.

**What breaks without it**: Every test that relies on clean default overrides (virtually all of them). Test determinism is destroyed.

**Standalone replacement**: Already exists in `src/rl/standalone-setup.ts:resetOverrides()` which uses `Object.defineProperty` to install getters returning `defaultOverrides` values. **Working.**

**Difficulty**: Already replaced for standalone. For Vitest removal from the main suite, need to ensure the standalone approach runs before any test code imports overrides.

#### 1b. i18next + MSW Mock (line 31-60)

```ts
vi.mock(import("i18next"), async importOriginal => {
  // Sets up msw server to intercept locale file HTTP requests
  const { setupServer } = await import("msw/node");
  // ...
  global.server = setupServer(
    http.get("/locales/en/*", async req => { /* serve from FS */ }),
    http.get("https://fonts.googleapis.com/*", () => HttpResponse.text("")),
  );
  global.server.listen({ onUnhandledRequest: "error" });
  return await importOriginal();
});
```

**What it does**: Uses `vi.mock()` purely for its **hoisting** behavior -- the mock doesn't replace i18next at all (it returns the original). The hoisting ensures the MSW server starts before any i18n initialization occurs, intercepting HTTP requests for locale JSON files and Google Fonts.

**Why it exists**: i18next uses `i18next-http-backend` which calls `fetch()` for locale files. In jsdom there's no real server, so MSW intercepts those requests and serves from the local filesystem.

**What breaks without it**: i18n initialization fails because locale files can't be fetched. Every test that involves any localized text (most of them) would break.

**Standalone replacement**: Already exists in `src/rl/standalone-setup.ts:setupLocaleFetch()` which intercepts `global.fetch` to serve locale files from disk. **Working.** Does NOT use MSW.

**Difficulty**: Already replaced for standalone. For Vitest removal, the fetch interception approach in `standalone-setup.ts` is simpler and avoids the MSW dependency entirely.

---

## 2. `vitest-canvas-mock` -- Canvas Polyfill (MODERATE)

### Location: `test/setup/vitest.setup.ts` line 1

```ts
import "vitest-canvas-mock";
```

### Also in: `package.json` (dependency)

**What it does**: Provides a mock implementation of the HTML Canvas 2D context for jsdom, which doesn't implement `<canvas>` natively. This is needed because Phaser's TextureManager and various game rendering code call canvas APIs.

**Why it exists**: jsdom doesn't implement Canvas. Without a polyfill, any code that calls `HTMLCanvasElement.prototype.getContext("2d")` throws.

**What breaks without it**: Any code path that touches canvas rendering (sprite loading, texture creation, text measurement, etc.) crashes.

**Standalone replacement**: The test harness already has `test/test-utils/mocks/mock-context-canvas.ts` which provides a minimal canvas context stub. Additionally, `test/test-utils/test-file-initialization.ts` line 71 overrides `HTMLCanvasElement.prototype.getContext`. And `src/rl/interactive-boot.ts` has its own comprehensive canvas mock.

**Difficulty**: MODERATE. The `vitest-canvas-mock` package is specifically designed for Vitest's jsdom environment. Replacing it requires ensuring the mock-context-canvas stub covers all canvas APIs that Phaser actually calls. The interactive-boot.ts already does this successfully, proving it's viable.

---

## 3. Vitest Test Runner APIs (INFRASTRUCTURE -- NOT NEEDED FOR RL)

### Locations: Every test file (`*.test.ts`)

```ts
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from "vitest";
```

These are used in ~200+ test files across `test/`. However, they are **NOT used in `src/rl/`** and are **NOT needed for the standalone runner**.

### Specific test-utils files that import from vitest:

| File | What it imports | Why |
|------|----------------|-----|
| `test/setup/vitest.setup.ts` | `afterAll, afterEach, beforeAll, beforeEach, vi` | Test lifecycle hooks + vi.mock |
| `test/setup/matchers.setup.ts` | `expect` | Registers custom matchers via `expect.extend()` |
| `test/test-utils/helpers/modifiers-helper.ts` | `expect` | Uses `expect(itemPoolChecks).toHaveKey()` in `testCheck()` |
| `test/test-utils/reporters/custom-default-reporter.ts` | Types from `vitest`, `vitest/node`, `vitest/reporters` | Custom reporter class |
| `test/test-utils/setup/test-end-log.ts` | Types from `vitest` (`RunnerTask`, `RunnerTestCase`) | Test logging utilities |

**Difficulty**: These are Vitest infrastructure. We do NOT need to replace them -- they are only used when running tests via Vitest. The standalone runner bypasses this entirely.

---

## 4. `vi.spyOn` / `vi.fn` / `vi.waitUntil` in Test-Utils (DONE -- ALREADY REPLACED)

### Status: FULLY REPLACED

All test-utils harness files have been migrated from `vi.spyOn`/`vi.fn` to the standalone implementations in `src/rl/mocks/spy.ts`. Here is the complete mapping:

| File | Uses | Source |
|------|------|--------|
| `test/test-utils/game-manager.ts` | `mockFn`, `spyOn`, `waitUntil`, `expectValue`, `standaloneExpect` | `#app/rl/mocks/spy` + `#app/rl/mocks/assert` |
| `test/test-utils/game-wrapper.ts` | `mockFn`, `spyOn` | `#app/rl/mocks/spy` |
| `test/test-utils/test-utils.ts` | `spyOn` | `#app/rl/mocks/spy` |
| `test/test-utils/helpers/overrides-helper.ts` | `spyOn` (40+ calls) | `#app/rl/mocks/spy` |
| `test/test-utils/helpers/move-helper.ts` | `spyOn`, `MockInstance`, `standaloneExpect`, `expectValue` | `#app/rl/mocks/spy` + `#app/rl/mocks/assert` |
| `test/test-utils/helpers/field-helper.ts` | `spyOn`, `MockInstance`, `expectValue` | `#app/rl/mocks/spy` + `#app/rl/mocks/assert` |
| `test/test-utils/helpers/reload-helper.ts` | `spyOn` | `#app/rl/mocks/spy` |
| `test/test-utils/listeners-manager.ts` | `expectValue` | `#app/rl/mocks/assert` |

### Files with NO vitest dependency (clean):
- `test/test-utils/helpers/classic-mode-helper.ts` -- No spy/mock imports at all
- `test/test-utils/helpers/daily-mode-helper.ts` -- No spy/mock imports at all
- `test/test-utils/helpers/challenge-mode-helper.ts` -- No spy/mock imports at all
- `test/test-utils/helpers/settings-helper.ts` -- No spy/mock imports at all
- `test/test-utils/helpers/game-manager-helper.ts` -- No spy/mock imports at all
- `test/test-utils/game-manager-utils.ts` -- No spy/mock imports at all
- `test/test-utils/error-interceptor.ts` -- No spy/mock imports at all
- `test/test-utils/inputs-handler.ts` -- No spy/mock imports at all
- `test/test-utils/text-interceptor.ts` -- No spy/mock imports at all
- `test/test-utils/phase-interceptor.ts` -- No spy/mock imports at all
- `test/test-utils/mocks/mock-fetch.ts` -- No spy/mock imports at all
- `test/test-utils/mocks/mock-context-canvas.ts` -- No spy/mock imports at all
- `test/test-utils/mocks/mock-clock.ts` -- No spy/mock imports at all

---

## 5. `vi.spyOn` / `vi.fn` in Individual Test Files (OUT OF SCOPE)

### Location: ~30+ test files in `test/`

Many individual test files (NOT the test-utils harness) still use `vi.spyOn()` and `vi.fn()` directly:

- `test/evolution.test.ts` -- `vi.spyOn(Utils, "randSeedInt")`
- `test/data/splash-messages.test.ts` -- `vi.spyOn(Constants, ...)`
- `test/ai/ai-moveset-gen.test.ts` -- `vi.spyOn(pokemon, ...)` (6 calls)
- `test/field/catching.test.ts` -- `vi.spyOn(pokerogueApi, ...)`
- `test/battler-tags/substitute.test.ts` -- `vi.fn()`, `vi.spyOn()` (multiple)
- Many more in `test/abilities/`, `test/moves/`, `test/items/`, etc.

**These are NOT a concern for the RL standalone runner.** They are test-specific mocks used only within individual Vitest test cases and are not part of the shared test harness infrastructure.

---

## 6. `src/rl/` -- Vitest Leak Check (CLEAN)

### Result: NO VITEST LEAKS

Searched all files in `src/rl/` for:
- `from 'vitest'` / `from "vitest"` -- **None found**
- `vi.` calls -- **None found** (only references in comments explaining what was replaced)

All files in `src/rl/` use only the standalone mocks from `src/rl/mocks/spy.ts` and `src/rl/mocks/assert.ts`.

---

## 7. `vitest.config.ts` Key Settings

```ts
restoreMocks: true,     // Auto-restores mocks after each test
threads: false,          // Single-threaded (important for game state)
environment: "jsdom",    // Browser environment simulation
setupFiles: ["./test/setup/font-face.setup.ts", "./test/setup/vitest.setup.ts", "./test/setup/matchers.setup.ts"],
```

**`restoreMocks: true`**: This Vitest setting auto-calls `mockRestore()` on all Vitest-created mocks after each test. Since we replaced vi.spyOn with our own, the standalone `restoreAllMocks()` from `src/rl/mocks/spy.ts` is now called explicitly in `vitest.setup.ts:72` (`afterEach`). Both mechanisms co-exist.

---

## 8. `vitest.interactive.config.ts` -- Interactive RL Config

```ts
setupFiles: ["./test/setup/font-face.setup.ts", "./test/setup/vitest.setup.ts"],
include: ["./test/rl/interactive-server.test.ts"],
testTimeout: 0,  // No timeout -- server runs indefinitely
```

**Note**: The interactive server config still depends on `vitest.setup.ts` (including the `vi.mock()` calls). This means the interactive server currently requires Vitest to run.

---

## Summary Table

| Dependency | Location | Difficulty | Status |
|-----------|----------|------------|--------|
| `vi.mock()` overrides | vitest.setup.ts:14-23 | Moderate | Replaced in standalone-setup.ts |
| `vi.mock()` i18next/MSW | vitest.setup.ts:31-60 | Moderate | Replaced in standalone-setup.ts |
| `vitest-canvas-mock` | vitest.setup.ts:1 | Moderate | Replaceable (mock-context-canvas.ts exists) |
| `vi.spyOn`/`vi.fn` in harness | 8 test-utils files | Done | **Already replaced** with spy.ts |
| `restoreMocks: true` config | vitest.config.ts | Trivial | `restoreAllMocks()` called in afterEach |
| Vitest test runner (`describe`/`it`/`expect`) | All test files | N/A | Not needed for standalone RL |
| Custom matchers (`expect.extend`) | matchers.setup.ts | N/A | Not needed for standalone RL |
| Custom reporter | reporters/custom-default-reporter.ts | N/A | Not needed for standalone RL |
| `vi.spyOn`/`vi.fn` in test files | ~30+ individual tests | N/A | Not needed for standalone RL |
| Vitest in `src/rl/` | (none) | Clean | No leaks found |

## Remaining Blockers for Fully Vitest-Free Standalone Runner

The standalone runner (`src/rl/standalone-runner.ts` + `src/rl/standalone-setup.ts`) is **already functional without `vi.*` calls**. The remaining blockers are:

1. **Module resolution**: Still requires Vite/Vitest to resolve `#app/*`, `#test/*` path aliases. Cannot run with bare Node.js.
2. **jsdom environment**: Vitest provides jsdom automatically. The standalone `interactive-boot.ts` manually sets up jsdom but still needs Vite for module transforms.
3. **`modifiers-helper.ts`**: The `testCheck()` method still imports `expect` from `vitest` directly. This is the ONLY remaining vitest import in test-utils harness files (line 4). However, this method is only used by individual test files, not by the core game loop.

## One Remaining Import to Fix

**`test/test-utils/helpers/modifiers-helper.ts` line 4:**
```ts
import { expect } from "vitest";
```
This is the sole remaining `vitest` import in the test-utils harness. The `testCheck()` method uses Vitest's `expect().toHaveKey()` custom matcher. This could be replaced with the standalone assert utilities, but it's only called from individual test files (not the RL runner path).
