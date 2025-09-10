# Linting & Formatting

Writing clean, readable code is important, and linters and formatters are an integral part of ensuring code quality and readability. \
It is for this reason we are using [Biome](https://biomejs.dev), an opinionated linter/formatter (akin to Prettier) with a heavy focus on speed and performance.

### Installation
You probably installed Biome already without noticing it - it's included inside `package.json` and should've been downloaded when you ran `pnpm install` after cloning the repo. If you haven't done that yet, go do that first.

# Using Biome

For the most part, Biome attempts to stay "out of your hair", letting you write code while enforcing a consistent formatting standard and only notifying for errors it can't automatically fix. \
On the other hand, if Biome complains about a piece of code, **there's probably a good reason why**. Disable comments should be used sparingly or when readabilty demands it - your first instinct should be to fix the code in question, not disable the rule.

## Editor Integration
Biome has integration with many popular code editors. See [these](https://biomejs.dev/guides/editors/first-party-extensions/) [pages](https://biomejs.dev/guides/editors/third-party-extensions/) for information about enabling Biome in your editor of choice.

## Automated Runs
Generally speaking, most users shouldn't need to run Biome directly; in addition to editor integration, a [pre-commit hook](../lefthook.yml) will automatically format and lint all staged files before each commit.

> ![WARNING]
> You will **not** be able to commit code if any staged files contain `error`-level linting problems. \
> If you, for whatever reason, _absolutely need_ to bypass Lefthook for a given commit,
> pass the `--no-verify` flag to `git commit`.

We also have a [Github Action](../.github/workflows/linting.yml) to verify code quality each time a PR is updated, preventing bad code from inadvertently making its way upstream. \
These are effectively the same commands as run by Lefthook, merely on a project-wide scale.

## Running Biome via CLI
To run you Biome on your files manually, you have 2 main options:
1. Run the scripts included in `package.json` (`pnpm biome` and `pnpm biome:all`). \
    These have sensible defaults for command-line options, but do not allow altering certain flags (as some cannot be specified twice in the same command)

2. Execute the Biome executable manually from the command line like so:
    ```sh
    pnpm exec biome check --[flags]
    ```
    This allows customizing non-overridable flags like `--diagnostic-level` on a more granular level, but requires slightly more verbosity and specifying more options.

A full list of flags and options can be found on [their website](https://biomejs.dev/reference/cli/), but here's a few useful ones to keep in mind:

- `--write` will cause Biome to write all "safe" fixes and formatting changes directly to your files (rather than just complaining and erroring out).
- `--changed` and `--staged` will limit checking to all changed or staged files respectively. Biome sources this info from the relevant version control system (in this case `git`).
- `diagnostic-level=XXX` will only show diagnostics with at least the given severity level (`info/warn/error`). Useful to only focus on errors causing a failed workflow run or similar.

## Linting Rules

We primarily use Biome's [recommended ruleset](https://biomejs.dev/linter/rules/) for linting JS/TS files, with some customizations to better suit our project's needs[^1].

Some things to consider:

- We have disabled rules that prioritize style over performance, such as `useTemplate`.
- Some rules are currently marked as warnings (`warn`) to allow for gradual refactoring without blocking development. **Do not write new code that triggers these rules!**
- The linter is configured to ignore specific files and folders (such as excessively large files or ones in need of refactoring) to improve performance and focus on actionable areas.

Any questions about linting rules can be brought up in the `#dev-corner` channel in the community Discord.

[^1]: A complete list of rules can be found in the [`biome.jsonc`](../biome.jsonc) file in the project root. Many rules are accompanied by comments explaining the reasons for their inclusion (or lack thereof).
