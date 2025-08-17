# Contributing to PokéRogue

Thank you for taking the time to contribute, every little bit helps. This project is entirely open-source and unmonetized - community contributions are what keep it alive!

Please make sure you understand everything relevant to your changes from the [Table of Contents](#-table-of-contents), and absolutely *feel free to reach out in the **#dev-corner** channel on [Discord](https://discord.gg/pokerogue)*.
We are here to help and the better you understand what you're working on, the easier it will be for it to find its way into the game.

## 📄 Table of Contents

- [Development Basics](#️-development-basics)
- [Environment Setup](#-environment-setup)
- [Getting Started](#-getting-started)
- [Documentation](#-documentation)
- [Testing Your Changes](#-testing-your-changes)
- [Development Save File (Unlock Everything)](#-development-save-file)

## 🛠️ Development Basics

PokéRogue is built with [Typescript](https://www.typescriptlang.org/docs/handbook/intro.html), using the [Phaser](https://github.com/phaserjs/phaser) game framework.

If you have the motivation and experience with Typescript/Javascript (or are willing to learn), you can contribute by forking the repository and making pull requests with contributions.

## 💻 Environment Setup

### Codespaces/Devcontainer Environment

Arguably the easiest way to get started is by using the prepared development environment.

We have a `.devcontainer/devcontainer.json` file, meaning we are compatible with:

- [![Open in GitHub Codespaces][codespaces-badge]][codespaces-link], or
- the [Visual Studio Code Remote - Containers][devcontainer-ext] extension.

This Linux environment comes with all required dependencies needed to start working on the project.

[codespaces-badge]: <https://github.com/codespaces/badge.svg>
[codespaces-link]: <https://github.com/codespaces/new?hide_repo_select=true&repo=620476224&ref=beta>
[devcontainer-ext]: <https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers>

### Local Development

#### Prerequisites

- node: >=22.14.0 - [manage with pnpm](https://pnpm.io/cli/env) | [manage with fnm](https://github.com/Schniz/fnm) | [manage with nvm](https://github.com/nvm-sh/nvm) | [manage with volta.sh](https://volta.sh/)
- pnpm: 10.x - [how to install](https://pnpm.io/installation) (not recommended to install via `npm` on Windows native) | [alternate method - volta.sh](https://volta.sh/)
- The repository [forked](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) and [cloned](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) locally on your device

#### Running Locally

1. Run `pnpm install` from the repository root
    - *if you run into any errors, reach out in the **#dev-corner** channel on Discord*
2. Run `pnpm start:dev` to locally run the project at `localhost:8000`

## 🚀 Getting Started

A great way to develop an understanding of how the project works is to look at test cases (located in [the `test` folder](./test/)).
Tests show you both how things are supposed to work and the expected "flow" to get from point A to point B in battles.

*This is a big project and you will be confused at times - never be afraid to reach out and ask questions in **#dev-corner***!

### Where to Look

Once you have your feet under you, check out the [Issues](https://github.com/pagefaultgames/pokerogue/issues) page to see how you can help us!
Most issues are bugs and are labeled with their area, such as `Move`, `Ability`, `UI/UX`, etc. There are also priority labels:
- `P0`: Completely gamebreaking (very rare)
- `P1`: Major - Game crash
- `P2`: Minor - Incorrect (but non-crashing) move/ability/interaction
- `P3`: No gameplay impact - typo, minor graphical error, etc.

Also under issues, you can take a look at the [List of Partial / Unimplemented Moves and Abilities](https://github.com/pagefaultgames/pokerogue/issues/3503) and the [Bug Board](https://github.com/orgs/pagefaultgames/projects/3). The latter is essentially the same as the issues page, so take your pick.

You are free to comment on any issue so that you may be assigned to it and we can avoid multiple people working on the same thing.

## 📚 Documentation

You can find the auto-generated documentation [here](https://pagefaultgames.github.io/pokerogue/main/index.html).

Additionally, the [docs folder](./docs) contains a variety of in-depth documents and guides useful for aspiring contributors. \
Notable topics include:
- [Commenting your code](./docs/comments.md)
- [Linting & Formatting](./docs/linting.md)
- [Localization](./docs/localization.md)
- [Enemy AI move selection](./docs/enemy-ai.md)

Again, if you have unanswered questions please feel free to ask!

## 🧪 Testing Your Changes

You've just made a change - how can you check if it works? You have two areas to hit:

### 1 - Manual Testing

> This will likely be your first stop. After making a change, you'll want to spin the game up and make sure everything is as you expect. To do this, you will need a way to manipulate the game to produce the situation you're looking to test.

[src/overrides.ts](../src/overrides.ts) contains overrides for most values you'll need to change for testing, controlled through the `overrides` object.
For example, here is how you could test a scenario where the player Pokemon has the ability Drought and the enemy Pokemon has the move Water Gun:

```typescript
const overrides = {
  ABILITY_OVERRIDE: AbilityId.DROUGHT,
  ENEMY_MOVESET_OVERRIDE: MoveId.WATER_GUN,
} satisfies Partial<InstanceType<typeof DefaultOverrides>>;
```

Read through `src/overrides.ts` file to find the override that fits your needs - there are a lot of them!
If the situation you're trying to test can't be created using existing overrides (or with the [Dev Save](#-development-save-file)), reach out in **#dev-corner**.
You can get help testing your specific changes, and you might have found a new override that needs to be created!

### 2 - Automatic Testing

> PokéRogue uses [Vitest](https://vitest.dev/) for automatic testing. Checking out the existing tests in the [test](./test/) folder is a great way to understand how this works, and to get familiar with the project as a whole.

To make sure your changes didn't break any existing test cases, run `pnpm test:silent` in your terminal. You can also provide an argument to the command: to run only the Dancer (ability) tests, you could write `pnpm test:silent dancer`.
  - __Note that passing all test cases does *not* guarantee that everything is working properly__. The project does not have complete regression testing.

Most non-trivial changes (*especially bug fixes*) should come along with new test cases.
  - To make a new test file, run `pnpm test:create` and follow the prompts. If the move/ability/etc. you're modifying already has tests, simply add new cases to the end of the file. As mentioned before, the easiest way to get familiar with the system and understand how to write your own tests is simply to read the existing tests, particularly ones similar to the tests you intend to write.
  - Ensure that new tests:
    - Are deterministic. In other words, the test should never pass or fail when it shouldn't due to randomness. This involves primarily ensuring that abilities and moves are never randomly selected.
    - As much as possible, are unit tests. If you have made two distinct changes, they should be tested in two separate cases.
    - Test edge cases. A good strategy is to think of edge cases beforehand and create tests for them using `it.todo`. Once the edge case has been handled, you can remove the `todo` marker.

## 😈 Development Save File
> Some issues may require you to have unlocks on your save file which go beyond normal overrides. For this reason, the repository contains a [save file](../test/test-utils/saves/everything.psrv) with _everything_ unlocked (even ones not legitimately obtainable, like unimplemented variant shinies).

1. Start the game up locally and navigate to `Menu -> Manage Data -> Import Data`
2. Select [everything.prsv](test/test-utils/saves/everything.prsv) (`test/test-utils/saves/everything.prsv`) and confirm.