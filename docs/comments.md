# Commenting code

People spend more time reading code than writing it (sometimes substantially more so). As such, comments and documentation are **vital** for any large codebase like this.

## While we're not enforcing a strict standard, here are some things to keep in mind:
- Make comments meaningful
  - Comments should explain _why_ a line or block of code exists - its "raison d'être", if you will.
  - Comments should not repeat chunks of code or explain concepts obvious to the average reader like the meaning of `&&=` or `??`
- Make comments readable
  - The length of a comment should roughly scale with the complexity of whatever it is describing. Small quips are fine for inline comments and explanations, but summarizing a 300 line function with "Starts a battle" is about as good as doing nothing.
  - Long comments should ideally be broken into multiple lines at around the 100-120 character mark.
- Make sure comments exist on Functions, Classes, Methods, and Properties
  - These may be the most important things to comment. When someone goes to use a function/class/method/etc., having a comment reduces the need to flip back and forth between files to figure out what XYZ does. Peek Definition is great until you're three nested levels deep.
  - The best example of this is TSDoc-style comments as seen below:
    - When formatted this way, the comment gets shown within VS Code or similar IDEs just by hovering over the function!
    - Functions also show the comment for each parameter as you type them, making keeping track of arguments inside lengthy functions much more clear.

```ts
/**
 * Change the type-based weather modifier if this move's power would be reduced by it.
 * @param user - The {@linkcode Pokemon} using this move
 * @param target - The {@linkcode Pokemon} being targeted by this move
 * @param move - The {@linkcode Move} being used (unused)
 * @param args - [0]: A {@linkcode NumberHolder} for arenaAttackTypeMultiplier
 * @returns - Whether the move effect was applied successfully
 */
apply(user: Pokemon, target: Pokemon, move: Move, args: [NumberHolder, ...any]): boolean {
}

/** Class containing  */
class Settings {
  /** Set to `true` when experimental animated sprites from Gen6+ should be used */
  public experimentalSprites: boolean = false;
}
/**
 * Cure the user's party of non-volatile status conditions, ie. Heal Bell, Aromatherapy
 */
export class DontHealThePartyPlsAttr extends MoveAttr {
}

```
You'll notice this contains an `{@linkcode Object}` tag for each parameter. This provides an easy type denomination and hyperlink to that type using VS Code's Intellisense. `@linkcode` is used instead of `@link` so that the text appears in monospace which is more obviously a `type` rather than a random hyperlink.

If you're interested in going more in depth, you can find a reference guide for how comments like these work [here](https://tsdoc.org).

### What not to do:
- Don't leave comments for code you don't understand
  - Incorrect information is worse than no information. If you aren't sure how something works, don't make something up to explain it - ask for help and/or mark it as TODO.
- Don't over-comment
  - Not everything needs an explanation. Try to summarize blocks of code instead of singular lines where possible. Single line comments should call out specific oddities or features.

## How do Abilities and Moves differ from other classes?
While other classes should be fully documented, Abilities and Moves heavily incoperate inheritance (i.e. the `extends` keyword). Because of this, much of the functionality in these classes is duplicated or only slightly changed between classes.
### With this in mind, there's a few more things to keep in mind for these:
- Do not document any parameters if the function mirrors the one they extend.
  - Keep this in mind for functions that are not the `apply` function as they are usually sparse and mostly reused
- Class member variables must be documented
  - You can use a single line documentation comment for these `/** i.e. a comment like this */`
- `args` parameters must be documented if used
  - This should look something vaguely like this when there are multiple:
```ts
/**
...
 * @param args -
 * `[0]` The {@linkcode Move} being used
 * `[1]` A {@linkcode BooleanHolder} used to track XYZ
 * `[2]` {@linkcode BooleanHolder} `paramC` - paramC description here
...
*/
```
