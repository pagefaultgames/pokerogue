<!--
SPDX-FileCopyrightText: 2026 Pagefault Games

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# The Phase System

One of PokéRogue's most central (and complex) abstractions is the `Phase` system, which forms the backbone of the game's logic flow.
Having a solid understanding of the system is useful for those looking to contribute to the codebase, as well as for those who are just curious about how the game works under the hood.

This document is intended to give a bird's-eye view of the Phase system, as well as document some of its less intuitive intricacies.
The sections are structured in order from high-level to low-level, so feel free to skip around as needed.

## Anatomy of a Phase

A `Phase` serves as the most basic unit of game logic, representing a discrete chunk of work that must be completed before the next Phase can begin.
This "work" can be anything from applying a move's effects to toggling an ability flyout or showing the login screen.

`Phase`s primarily consist of 2 methods:
- `start()` — Contains the phase's core logic. Called by the `PhaseManager` when it is the phase's turn to run. **Must call `this.end()` at some point during its execution** (either directly or indirectly) or else the game will stall indefinitely.
- `end()` — Signals to the `PhaseManager` that the phase has finished running and the next one should start.

> [!CAUTION]
>  **Attempting to call `end()` more than once from the same phase will result in unpredictable behaviour that will most likely crash the game.**
> Moreover, Phases that override `end()` with custom logic **must call `super.end()`** once their work is complete to ensure the next Phase starts correctly.

Every concrete phase also declares a `phaseName` string, which is used for type-safe lookup and comparison in lieu of `instanceof` to avoid circular imports.

```ts
export class FooPhase extends Phase {
  public override readonly phaseName = "FooPhase";

  public override start(): void {
    console.log("foo mane padme hum");
    this.end();
  }

  public override end(): void {
    console.log("Our first obligation is to keep the foo counters turning");
    super.end();
  }
}
```

## The PhaseManager

The `PhaseManager` (as its name implies) serves as the central hub for managing the Phase system. It is responsible for starting new Phases after prior ones finish, queueing new ones to run and managing the current state of the queue.

The 3 primary ways to queue a new phase are:

| Type    | Behaviour |
|---------|-----------|
| Push               | Adds the phase to the **end** of the queue, run after all already-queued phases have finished. |
| Unshift            | Queues the phase to run **immediately after** the currently-running phase finishes. Multiple calls to `unshiftPhase` during the _same phase's execution_ will queue the new phases in the order they were added. |
| Unshift (deferred) | Queues the phase to run _immediately after_ all Phases unshifted during the current Phase have finished. Multiple deferrals during the same Phase will trigger in FIFO order among one another. |

There are also helpers like `queueMessage`, `queueAbilityDisplay`, and `queueFaintPhase` for common patterns (which internally delegate to one of these methods).

> [!NOTE]
> If there are ever no phases left to run in the queue, the `PhaseManager` will automatically queue a new `TurnStartPhase` to kick off the next turn.

## The PhaseTree and Execution Order

Internally, the `PhaseManager` stores pending phases in a `PhaseTree`, whose storage consists of  _levels_ (`Phase[][]`).

- **Level 0** is the "push" queue — the bottom of the stack, populated by `pushPhase`.
- **Higher levels** are created dynamically as phases call `unshiftPhase` during their own execution.
- The "topmost" level refers to the **last non-empty level** in the tree, from which the next phase to run will be pulled.

When a phase calls `unshiftPhase`, the new phase is inserted at **one level above** the level the current phase is running on. This means that child phases created by a running phase are always exhausted before execution returns to any remaining phases at the parent's level — without disturbing the push queue below.

`getNextPhase()` always picks from the **topmost non-empty level** first, so the tree naturally resolves the deepest work before returning to shallower queues.

### Example: move execution

The following simplified example illustrates level nesting during a single move in a double battle.
After `TurnStartPhase` populates the Phase queue with two `MovePhase`s, execution proceeds something like this:

```
Initial queue (level 0):
  [MovePhase(A), MovePhase(B)]

MovePhase(A) starts (currentLevel = 0)
  └─ unshiftNew("MoveEffectPhase", ...) → inserted at level 1
  └─ unshiftNew("MoveEndPhase", ...) → inserted at level 1

Levels:
  0: [MovePhase(B)]
  1: [MoveEffectPhase(A), MoveEndPhase(A)]   ← runs next

MovePhase(A) ends → MoveEffectPhase(A) starts (currentLevel = 1)
  ├─ unshiftNew("MoveReflectPhase", ...) → inserted at level 2  (runs first)
  └─ queueFaintPhase(...)   → deferred, inserted at level 1     (runs after level 2 drains)


Levels:
  0: [MovePhase(B)]
  1: [MoveEndPhase(A)]
  2: [FaintPhase]
  3: [MoveReflectPhase]     ← runs next

And so on and so forth...
```

Because of the level structure, _every_ Phase directly queued during `MovePhase(A)` must fully resolve before `MovePhase(B)` begins — no matter how many phases said children create.
