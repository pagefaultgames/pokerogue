# Commenting code

People spend more time reading code than writing it (sometimes substantially more so). As such, comments and documentation are **vital** for any large codebase like this to function.

## While we're not enforcing a strict standard, here are some things to keep in mind:
- Make comments meaningful
  - Comments should **NOT** repeat _what_ code _does_[^1] or explain concepts obvious to someone with a basic understanding of the language at hand. Instead, focus on explaining _why_ a line or block of code exists - its "raison d'être", if you will.
    - Anyone with basic reading comprehension and a good IDE can figure out what code does; gaining a _post hoc_ understanding of the _reasons_ behind its existence takes a lot more digging, effort and bloodshed.
- Keep comments readable
  - A comment's verbosity should roughly scale with the complexity of its subject matter. Some people naturally write shorter or longer comments as a personal style, but summarizing a 300 line function with "does a thing" is about as good as writing nothing. Conversely, writing a paragraph-level response where a basic one-liner would suffice is equally unhelpful.
  - Long comments should ideally be broken into multiple lines at around the 100-120 character mark. This isn't _mandatory_, but avoids unnecessary scrolling in terminals and IDEs.
- Make sure comments exist on Functions, Classes, Methods, and Properties
  - These may be the most important things to comment. When someone goes to use a function/class/method/etc., having a comment reduces the need to flip back and forth between files to figure out what XYZ does. Peek Definition is great until you're three nested levels deep.

[^1]: With exceptions for extremely long, convoluted or unintuitive methods (though an over-dependency on said comments is likely asymptomatic of poorly structured code).

Given all this, look at the following

# TSDoc
Taking all these together, one notable example of good comments are those adhering to the TSDoc standard. These comments (frequentl)
When formatted this way, these comments are shown within VS Code or similar IDEs just by hovering over the function!
- Functions also show the comment for each parameter as you type them, making keeping track of arguments inside lengthy functions much more clear.

## Syntax
For an example of how TSDoc comments work, here are several real examples of TSDoc comments at work, taken from various files inside this very repo[^2]:
```ts
/**
 * Change the type-based weather modifier if this move's power would be reduced by it.
 * @param user - The {@linkcode Pokemon} using this move
 * @param target - The {@linkcode Pokemon} being targeted by this move
 * @param move - The {@linkcode Move} being used (unused)
 * @param args - [0]: A {@linkcode NumberHolder} for `arenaAttackTypeMultiplier`
 * @returns - Whether the move effect was applied successfully
 */
apply(user: Pokemon, target: Pokemon, move: Move, args: [NumberHolder, ...any]): boolean {
}

/** Class containing configurable user settings. */
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

Looking at the example given, you'll notice this contains an `{@linkcode XYZ}` tag for each parameter. This provides an easy type denomination and hyperlink to that type in most modern IDEs. (`@linkcode` is used here instead of `@link` so that the text appears in monospace which is more obviously a `type` rather than a random hyperlink.) \
Also note the dashes (` - `) between the parameter names and descriptions - these are **mandatory** under the TSDoc spec[^3].

If you're interested in going more in depth, you can find a reference guide for how comments like these work [here](https://tsdoc.org).

[^3]: Incidentally, this is also the only place dashes are explicitly _required_.

### What not to do:
- Don't leave comments for code you don't understand
  - Incorrect information is worse than no information. If you aren't sure how something works, don't make something up to explain it - ask for help and/or mark it as TODO.
- Don't over-comment
  - Not everything needs a comment. Try to summarize blocks of code instead of singular lines where possible, always preferring giving a reason over stating a fact. Single line comments should call out specific oddities or features.

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
