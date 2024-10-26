## How do I comment my code?

### While we're not enforcing a strict standard, there are some things to keep in mind:
- Make comments meaningful
 - Comments should be explaining why a line or block of code exists and what the reason behind it is
 - Comments should not be repeating chunks of code or explaining what 'true' and 'false' means in typescript
- Make sure comments exist on Functions, Classes, Methods, and Properties
 - This may be the most important things to comment. When someone goes to use a function/class/method/etc., having a comment reduces the need to flip back and forth between files to figure out how something works. Peek Definition is great until you're three nested functions deep.
 - The best example of this is JSDoc-style comments as seen below:
   - When formatted this way, the comment gets shown by intellisense in VS Code or similar IDEs just by hovering over the text!
   - Functions also show each the comment for parameter as you type them, making keeping track of what each one does in lengthy functions much more clear
```js
/**
 * Changes the type-based weather modifier if this move's power would be reduced by it
 * @param user {@linkcode Pokemon} using this move
 * @param target {@linkcode Pokemon} target of this move
 * @param move {@linkcode Move} being used
 * @param args [0] {@linkcode Utils.NumberHolder} for arenaAttackTypeMultiplier
 * @returns true if the function succeeds
 */
apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
}

/** Set to true when experimental animated sprites from Gen6+ are used */
public experimentalSprites: boolean = false;

/**
 * Cures the user's party of non-volatile status conditions, ie. Heal Bell, Aromatherapy
 * @extends MoveAttr
 * @see {@linkcode apply}
 */
export class DontHealThePartyPlsAttr extends MoveAttr {
}
```
You'll notice this contains an `{@linkcode Object}` tag for each parameter. This provides an easy type denomination and hyperlink to that type using VS Code's Intellisense. `@linkcode` is used instead of `@link` so that the text appears in monospace which is more obviously a `type` rather than a random hyperlink.

If you're interested in going more in depth, you can find a reference guide for how comments like these work [here](https://jsdoc.app)

### What not to do:
- Don't leave comments for code you don't understand
 - Incorrect information is worse than no information. If you aren't sure how something works, don't make something up to explain it. Ask for help instead.
- Don't over-comment
 - Not everything needs an explanation. Try to summarize blocks of code instead of singular lines where possible. Single line comments should call out specific oddities.

## How do Abilities and Moves differ from other classes?
While other classes should be fully documented, Abilities and Moves heavily incoperate inheritance (i.e. the `extends` keyword). Because of this, much of the functionality in these classes is duplicated or only slightly changed between classes.
### With this in mind, there's a few more things to keep in mind for these:
- Do not document any parameters if the function mirrors the one they extend.
  - Keep this in mind for functions that are not the `apply` function as they are usually sparce and mostly reused
- The class itself must be documented
  - This must include the `@extends BaseClass` and `@see {@linkcode apply}` tags
- Class member variables must be documented
  - You can use a single line documentation comment for these `/** i.e. a comment like this */`
- `args` parameters must be documented if used
  - This should look something like this when there are multiple:
```ts
/**
...
 * @param args [0] {@linkcode Utils.NumberHolder} of arenaAttackTypeMultiplier
 *             [1] {@linkcode Utils.BooleanHolder} of cancelled
 *             [2] {@linkcode Utils.BooleanHolder} of rWeDoneYet
...
*/
```