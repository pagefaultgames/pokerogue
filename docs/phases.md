# The Phase System


One of Pokerogue's most  central (and complex) abstractions is the `Phase` system, which serves as the backbone of the game's logic flow.
Having a solid understanding of the system is useful for

This document is intended to give a bird's-eye view of the Phase system, as well as document some of its less intuitive intricacies.
The sections are

## Anatomy of a Phase

A `Phase` serves as the most basic unit of game logic, representing a discrete chunk of work that must be completed before the next one can begin. This "work" can be anything from applying a move's effects to hiding an ability flyout.

At its core, a `Phase` is nothing more than a class which consists of 2 methods:
- `start()` — Contains the phase's core logic. Called by the `PhaseManager` when it is the phase's turn to run.
- `end()` — Signals to the `PhaseManager` that the phase is finished running and the next one should start. Phases are responsible for calling `end()` themselves (including after any async operations resolve).
  > [!DANGER]
  >  **Attempting to call `end()` more than once from the same phase will result in unpredictable behaviour that will most likely crash the game.**

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

The `PhaseManager` (as its name implies) serves as the central hub for managing the Phase system. It is responsible for starting new Phases after prior ones finish, queueing new ones to run and tracking the current state of the queue.

The two primary ways to queue a phase are:

| Type | Behaviour |
|--------|-----------|
| Push | Adds the phase to the **end** of the queue, run after all already-queued phases have finished. |
| Unshift | Queues the phase to run **immediately after** the currently-running phase finishes. Multiple calls to `unshiftPhase` during the _same phase's execution_ will queue the new phases in the order they were added. |
| Unshift (deferred) | Inserts the Phase _below* the current level's remaining phases, queueing it to run after all Phases unshifted during this Phase finish. |

There are also helpers like `queueMessage`, `queueAbilityDisplay`, and `queueFaintPhase` for common patterns (which internally delegate to one of these methods).

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
