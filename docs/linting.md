# Linting & Formatting

Writing clean, readable code is important, and linters and formatters are an integral part of ensuring code quality and readability.
It is for this reason we are using [Biome](https://biomejs.dev), an opinionated linter/formatter (akin to Prettier) with a heavy focus on speed and performance.

### Installation
You probably installed Biome already without noticing it - it's included inside `package.json` and should've been downloaded when you ran `pnpm install` after cloning the repo. If you haven't done that yet, go do it.

# Using Biome

For the most part, Biome attempts to stay "out of your hair", letting you write code while enforcing a consistent formatting standard and only notifying for errors it can't automatically fix.\
On the other hand, if Biome complains about a piece of code, **there's probably a good reason why**. Disable comments should be used sparingly or when readabilty demands it - your first instinct should be to fix the code in question, not disable the rule.

## Editor Integration
Biome has integration with many popular code editors. See [these](https://biomejs.dev/guides/editors/first-party-extensions/) [pages](https://biomejs.dev/guides/editors/third-party-extensions/) for information about enabling Biome in your editor of choice.

## Automated Runs
Generally speaking, most users shouldn't need to run Biome directly; in addition to editor integration, [pre-commit hook](../lefthook.yml) will periodically run Biome before each commit.
You will **not** be able to push code with `error`-level linting problems - fix them beforehand.

We also have a [Github Action](../.github/workflows/quality.yml) to verify code quality each time a PR is updated, preventing bad code from inadvertently making its way upstream.

## Running Biome via CLI
If you want Biome to check your files manually, you can run it from the command line like so:

```sh
pnpm exec biome check --[flags]
```

A full list of flags and options can be found on [their website](https://biomejs.dev/reference/cli/), but here's a few useful ones to keep in mind:

- `--write` will cause Biome to write all "safe" fixes and formatting changes directly to your files (rather than just complaining and doing nothing).
- `--changed` and `--staged` will only perform checks on all changed or staged files respectively. Biome sources this info from the relevant version control system (in this case Git).
- `diagnostic-level=XXX` will only show diagnostics with at least the given severity level (`info/warn/error`). Useful to only focus on errors causing a failed workflow run or similar.

## Linting Rules

We primarily use Biome's [recommended ruleset](https://biomejs.dev/linter/rules/) for linting JS/TS, with some customizations to better suit our project's needs[^1].

Some things to consider:

- We have disabled rules that prioritize style over performance, such as `useTemplate`.
- Some rules are currently disabled or marked as warnings (`warn`) to allow for gradual refactoring without blocking development. **Do not write new code that triggers these warnings.**
- The linter is configured to ignore specific files and folders (such as excessively large files or ones in need of refactoring) to improve performance and focus on actionable areas.

Any questions about linting rules should be brought up in the `#dev-corner` channel in the discord.

[^1]: A complete list of rules can be found in the `biome.jsonc` file in the project root.
