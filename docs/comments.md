<!--
SPDX-FileCopyrightText: 2024-2025 Pagefault Games

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Commenting code

> _Any fool can write code that a computer can understand. Good programmers write code that humans can understand._ \
> \- Martin Fowler

The goal of programming is to write functioning code, not create comprehensive documentation. \
However, programmers spend significantly more time _reading_ code than writing it, especially those new to a codebase. \
As such, comments and documentation are **vital** for any large codebase like this.

This document is intended to serve as a guide for how to (and not to) document code while working on PokéRogue.

> [!IMPORTANT]
> **These are general guidelines, not "hard and fast" rules.**
> When in doubt, **use common sense** and err on the side of readability.

<!-- TODO: Add mention of overall style guide after it is made -->

## 📄 Table of Contents

- [General Guidelines](#general-guidelines)
- [TSDoc](#tsdoc)
  - [Example](#example)
  - [TSDoc Comment guidelines](#tsdoc-comment-guidelines)
- [Inheritance and Documentation](#inheritance-and-documentation)

## General Guidelines
**DO**:
- Keep comments meaningful
  - Focus on explaining _why_ a line or block of code exists - a _post hoc_ understanding of the _reasons_ is infinitely more useful.
  - Comments should **NOT** repeat _what_ code _does_[^1] or explain concepts obvious to someone with a basic understanding of the language at hand.
- Keep comments readable
  - A comment's verbosity should roughly scale with the complexity of its subject matter. Some people naturally write shorter or longer comments, but summarizing a 300-line function with "does a thing" is about as good as writing nothing.
  Conversely, writing a paragraph-level response where a basic one-liner would suffice is just as undesirable.
  - Long comments should be broken into multiple lines at around **100-120 characters** to avoid unnecessary scrolling in terminals and IDEs.
- **Make sure comments exist on Functions, Classes, Methods, and Properties**.
  - These tend to be the most important things to comment. When someone goes to use a function/class/method/etc., having a comment reduces the need to flip back and forth between files to figure out what XYZ does. Peek Definition is great until you're three nesting levels deep.

**DON'T**:
- Leave comments for code you don't understand
  - Incorrect information is worse than no information. If you aren't sure how something works, don't make something up to explain it - ask for help or mark it as `TODO`.
- Over-comment
   - Adding too many comments can risk distracting from the actual code in favor of repeating the self-evident.
   - Where possible, try to summarize blocks of code instead of singular lines where possible, always preferring giving a reason over stating a fact. Single line comments should call out specific oddities or features.

[^1]: With exceptions for extremely long, convoluted or unintuitive methods (though an over-dependency on said comments is likely a symptom of poorly structured code).

## TSDoc
The codebase makes extensive use of [TSDoc](https://tsdoc.org), a TypeScript-specific version of [JSDoc](https://jsdoc.app/about-getting-started) with standardized syntax and Markdown support.

> [!TIP]
> Most modern IDEs have functionality for showing JSDoc annotations upon hovering over attached constructs.
> Some (like VS Code) also show `@param` descriptions for function parameters as you type them, helping keep track of arguments inside lengthy functions.

#### Typedoc
One of TSDoc's many upsides is its standardized parser that allows other tools to read and process module documentation. \
We make use of one such tool ([Typedoc](https://typedoc.org/)) to automatically generate [API documentation](https://pagefaultgames.github.io/pokerogue/beta/index.html) from comments on classes, interfaces and the like[^2].

[^2]: You can preview the output by running `pnpm typedoc`, though [Live Preview](<https://marketplace.visualstudio.com/items?itemName=ms-vscode.live-server>) or a similar method of previewing local HTML files is recommended to make your life easier. \
Note that certain features (like the "Go to Main/Beta" navigation bar links) are disabled on local docs builds due to relying on CI-exclusive environment variables.

### Example
For an example of how TSDoc comments work, here are some comments taken from `src/data/moves/move.ts`:
<details>
<summary>Reference Example</summary>

```ts
/**
 * Attribute to put in a {@link https://bulbapedia.bulbagarden.net/wiki/Substitute_(doll) | Substitute Doll} for the user.
 *
 * Used for {@linkcode MoveId.SUBSTITUTE} and {@linkcode MoveId.SHED_TAIL}.
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

</details>

Looking at the example given, you may notice certain terms are annotated with `{@linkcode XYZ}` tags. This provides a clickable hyperlink to the referenced type or object in most modern IDEs[^3]. \
Also notice the dashes (` - `) between the parameter names and descriptions - these are **required** under the TSDoc spec.

[^3]: For those curious, the difference between `@linkcode` and `@link` is that the former renders text in monospace, more clearly indicating a code symbol rather than a URL/hyperlink.

### TSDoc Comment guidelines
With all these in mind, here are a few TSDoc-specific guidelines to ensure readability of both rendered API documentation and IDE syntax hints:

- <details>
  <summary>Use <b>proper English sentences</b> for descriptors</summary>

  Since these comments are going onto a website, annotations for properties, methods and functions should be well-formed, present-tense English sentences where possible.
  - The only exceptions are single-sentence `@param`/`@typeParam` lines - these should _not_ end with periods and instead take the form of bullet-point declarations.
  Example:
  ```ts
  /**
   * Wrapper class to handle doomsday events.
   */
  class Doomsday {
    /**
     * Whether the world has exploded yet.
     * Set to `true` upon any of this class' methods being called.
    */
    public worldExploded: boolean;
  };

  /**
   * Compute the geometric mean of multiple numbers.
   * @param nums - The numbers whose mean will be computed
   * @returns The geometric mean of `nums`.
   */
  declare function geometricMean(nums: number[]): number;
  ```
  </details>

- <details>
  <summary>Default values <b>must be mentioned if present</b></summary>

  TypeScript displays no information about default values in IDEs, so mentioning defaults inside doc comments is the easiest way to inform callers about a given property or parameter's default values.
  - Classes & interfaces can make use of the `@defaultValue` tag to annotate property initial values.
  As for function and method arguments, our codebase opts to include default value information immediately following the `@param` tag. This ensures the information is prominently visible in IDEs and similar tools.

  Example:
  ```ts
  class BattleScene {
    /**
     * Tracker for whether the last run attempt failed.
     * @defaultValue `false`
     */
    public failedRunAway = false;
  }

  /**
   * Turn all frogs in the global frog registry gay using science mumbo-jumbo.
   * @param maxFrogs - The maximum number of animals to convert
   * @param includeToads - (Default `false`) Whether to also convert toads as well
   * @param turnExplosive - (Default `true`) Whether to make converted frogs explode
   */
  function turnFrogsGay(maxFrogs: number, includeToads = false, turnExplosive = true): void {};

  /**
   * Print a copiously long, procedurally generated lorem ipsum-like placeholder string.
   * @param charCount - (Default `1000`) The number of characters to create
   */
  function printLorem(charCount = 1000): string {};
  ```

  </details>


## Inheritance and Documentation
While most class methods should be fully documented, the main exception comes with inheritance -
classes and interfaces will inherit documentation comments from any other classes/interfaces they extend/implement, **provided no other comments are present on inherited symbols**.

As such, _do not_ document properties or methods in sub-classes that do not substantially differ from the superclass' implementation.

> [!IMPORTANT]
> Any properties or methods unique to the class **must still be documented**!
