<!--
SPDX-FileCopyrightText: 2026 Pagefault Games

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Asserting Test Preconditions

## Background

PokéRogue's tests often use real game components (moves, species, abilities) instead of
mocks. Our components are coupled tightly enough that mocking them is often impractical.
The trade-off is that a test can quietly depend on how a component currently behaves,
even when that object has nothing to do with what the test is checking.

For example, a test of moveset generation might use Burn Up as its example of
"a move that requires the user to be a certain type." The test isn't about Burn Up.
It is borrowing Burn Up's behavior to exercise the move pool filter. If Burn Up's
mechanics change in a future generation, the test breaks even though moveset
generation is still correct.

## The principle

**A failing test should mean "functionality is broken," not "the test can no longer
evaluate the functionality."**

When a suite relies on a behavior it isn't testing, (herein, "incidental behavior"),
state the assumption explicitly as a precondition. This way, if the assumption stops
holding, the failure says exactly that, and the developer knows to update the test's
fixtures instead of hunting for a bug in the code under test.

To demonstrate this principle, consider a contrived example with the move Burn Up and
moveset generation. Here's necessary context: the `filterMovePool` function should
remove moves from the pool that require the user to be a certain type that it does not
have, and Burn Up currently has this condition. Now, consider this scenario: a new
Pokémon game is released, and burn up no longer requires its user to be the fire type.
A PokéRogue developer implements a PR that drops the condition from Burn Up, and
naturally updates the Burn Up test file to account for that change.

Without a precondition, the moveset generation tests then fail with messages that
suggest moveset generation is broken. With a precondition, the suite reports one clear
message: the assumption about Burn Up no longer holds, so swap in another move with a
type requirement.

## How to write one

Put the assertion in a `beforeAll` in the `describe` block for the tests that share the
assumption, and always give it a message beginning with `Violated assumption:`.

A trimmed pseudocode-esque example is below

```ts
describe("filterMovePool", () => {
  describe("type requirement conditions", () => {
    beforeAll(() => {
      expect(
        allMoves[burnUp],
        "Violated assumption: BURN_UP should require user to be FIRE type",
      // `.toRequireUserToBeFireType` is just for illustration; 
      ).toRequireUserToBeFireType();
    });
    it("does not remove a move when the user has the required type", () => { /* ... */ });
    it("removes a move when the user does not have the required type", () => { /* ... */ });
    // ... 
  });
});
```

There are two reasons to use `beforeAll` instead of a regular `it()`. First, if the
assumption fails, the suite stops and the tests that depend on it do not run. A
single failure that names the actual cause is then emitted, instead of several
failures that all point at the code under test. Second, a precondition is not part
of what the suite is testing, so presenting it as a test case would misrepresent the
suite's purpose.

Because the failure shows up under the `describe` name and not under a test name, the
message is what tells the reader what happened. Keep it specific: name the object and
the behavior you expected.

## A precondition is not a test

A precondition *checks* that a fixture is set up the way the suite expects. It does
not *test* that the behavior works. In the example above, the precondition confirms
that Burn Up has a Fire type requirement attached, not that the requirement is enforced
correctly in battle. Coverage of the behavior itself belongs in that object's own tests
(here, the Burn Up tests). Do not rely on preconditions elsewhere as a substitute.

## When to use this, and when not to

Preconditions are worth adding when the assumed behavior is the mechanism the test
depends on, is not the subject of the test, and could plausibly change (e.g. because of
a mechanic change in a later game or an adjustment made by balance team).

Do not assert simple config-defined data, such as a species' typing, a move's base
power, or an item's activation chance. These are not tests' job to verify, and asserting
them everywhere adds noise without adding clarity. For example, a test might specifically
use Snorlax to test an interaction that requires a normal type, or use ember to test an
interaction that requires a fire type move. Such cases have no need for preconditions.

## Prefer removing the assumption where you can

A precondition is the fallback. The better option is to make the test independent of
incidental behavior. For example, a test that needs one Pokémon to move after another
should set turn order explicitly, rather than rely on Snorlax being slower than its
opponent. Implicit dependencies like that are a reason to request changes on a PR. Use a
precondition when the dependency can't reasonably be removed, as when a unit test needs
a real move with a particular property and building a mock would be impractical.