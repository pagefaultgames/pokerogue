# Commenting code

People spend more time reading code than writing it (sometimes substantially more so). As such, comments and documentation are **vital** for any large codebase like this.

## General Guidelines
While we're not enforcing a strict standard, here are some things to keep in mind:
- Make comments meaningful
  - Comments should **NOT** repeat _what_ code _does_[^1] or explain concepts obvious to someone with a basic understanding of the language at hand. Instead, focus on explaining _why_ a line or block of code exists.
    - Anyone with basic reading comprehension and a good IDE can figure out what code does; gaining a _post hoc_ understanding of the _reasons_ behind its existence takes a lot more digging, effort and bloodshed.
- Keep comments readable
  - A comment's verbosity should roughly scale with the complexity of its subject matter. Some people naturally write shorter or longer comments as a personal style, but summarizing a 300 line function with "does a thing" is about as good as writing nothing. Conversely, writing a paragraph-level response where a basic one-liner would suffice is no less undesirable.
  - Long comments should ideally be broken into multiple lines at around the 100-120 character mark. This isn't _mandatory_, but avoids unnecessary scrolling in terminals and IDEs.
- Make sure comments exist on Functions, Classes, Methods, and Properties
  - These may be the most important things to comment. When someone goes to use a function/class/method/etc., having a comment reduces the need to flip back and forth between files to figure out what XYZ does. Peek Definition is great until you're three nested levels deep.

[^1]: With exceptions for extremely long, convoluted or unintuitive methods (though an over-dependency on said comments is likely a symptom of poorly structured code).

# TSDoc
The codebase makes extensive use of [TSDoc](https://tsdoc.org), which is a TypeScript-specific version of [JSDoc](https://jsdoc.app/about-getting-started)
that uses similar syntax and attaches to functions, classes, etc.

When formatted correctly, these comments are shown within VS Code or similar IDEs just by hovering over the function or object.
- Functions also show the comment for each parameter as you type them, making keeping track of arguments inside lengthy functions much more clear.

They can also be used to generate a commentated overview of the codebase. There is a GitHub action that automatically updates [this docs site](https://pagefaultgames.github.io/pokerogue/main/index.html)
and you can generate it locally as well via `pnpm run docs` which will generate into the `typedoc/` directory.

## Syntax
For an example of how TSDoc comments work, here are some TSDoc comments taken from `src/data/moves/move.ts`:
```ts
/**
 * Attribute to put in a {@link https://bulbapedia.bulbagarden.net/wiki/Substitute_(doll) | Substitute Doll} for the user.
 */
export class AddSubstituteAttr extends MoveEffectAttr {
  /** The ratio of the user's max HP that is required to apply this effect */
  private hpCost: number;
  /** Whether the damage taken should be rounded up (Shed Tail rounds up) */
  private roundUp: boolean;

  constructor(hpCost: number, roundUp: boolean) {
    // code removed
  }

  /**
   * Removes 1/4 of the user's maximum HP (rounded down) to create a substitute for the user
   * @param user - The {@linkcode Pokemon} that used the move.
   * @param target - n/a
   * @param move - The {@linkcode Move} with this attribute.
   * @param args - n/a
   * @returns `true` if the attribute successfully applies, `false` otherwise
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    // code removed
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    // code removed
  }

  getCondition(): MoveConditionFunc {
    // code removed
  }

  /**
   * Get the substitute-specific failure message if one should be displayed.
   * @param user - The pokemon using the move.
   * @returns The substitute-specific failure message if the conditions apply, otherwise `undefined`
   */
  getFailedText(user: Pokemon, _target: Pokemon, _move: Move): string | undefined {
    // code removed
  }
}
```

Looking at the example given, you'll notice this contains an `{@linkcode XYZ}` tag in some of the parameters. This provides a clickable hyperlink to that type or object in most modern IDEs. (`@linkcode` is used here instead of `@link` so that the text appears in monospace which is more obviously a `type` rather than a random hyperlink.) \
Also note the dashes (` - `) between the parameter names and descriptions - these are **mandatory** under the TSDoc spec[^2].

If you're interested in going more in depth, you can find a reference guide for how comments like these work [on the TSDoc website](https://tsdoc.org).
The [playground page](https://tsdoc.org/play/) there can also be used for live testing of examples.

[^2]: Incidentally, this is also the only place dashes are explicitly _required_.

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
