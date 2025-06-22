# Contributing to PokéRogue

Thank you for taking the time to contribute, every little bit helps. This project is entirely open-source and unmonetized - community contributions are what keep it alive!

Please make sure you understand everything relevant to your changes from the [Table of Contents](#-table-of-contents), and absolutely *feel free to reach out reach out in the **#dev-corner** channel on [Discord](https://discord.gg/pokerogue)*. We are here to help and the better you understand what you're working on, the easier it will be for it to find its way into the game.

## 📄 Table of Contents

- [Development Basics](#️-development-basics)
- [Environment Setup](#-environment-setup)
- [Getting Started](#-getting-started)
- [Documentation](#-documentation)
- [Testing Your Changes](#-testing-your-changes)
- [Localization](#-localization)
- [Development Save File (Unlock Everything)](#-development-save-file)

## 🛠️ Development Basics

PokéRogue is built with [Typescript](https://www.typescriptlang.org/docs/handbook/intro.html), using the [Phaser](https://github.com/phaserjs/phaser) game framework. 

If you have the motivation and experience with Typescript/Javascript (or are willing to learn) you can contribute by forking the repository and making pull requests with contributions. 

## 💻 Environment Setup

### Prerequisites

- node: >=22.14.0
- npm: [how to install](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

### Running Locally

1. Clone the repo and in the root directory run `npm install`
    - *if you run into any errors, reach out in the **#dev-corner** channel on Discord*
2. Run `npm run start:dev` to locally run the project in `localhost:8000`

### Linting

Check out our [in-depth file](./docs/linting.md) on linting and formatting!

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

Also under issues, you can take a look at the [List of Partial / Unimplemented Moves and Abilities](https://github.com/pagefaultgames/pokerogue/issues/3503) and the [Bug Board](https://github.com/orgs/pagefaultgames/projects/3) (the latter is essentially the same as the issues page but easier to work with).

You are free to comment on any issue so that you may be assigned to it and we can avoid multiple people working on the same thing.

## 📚 Documentation

You can find the auto-generated documentation [here](https://pagefaultgames.github.io/pokerogue/main/index.html).
For information on enemy AI, check out the [enemy-ai.md](./docs/enemy-ai.md) file.
For detailed guidelines on documenting your code, refer to the [comments.md](./docs/comments.md) file.

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
  OPP_MOVESET_OVERRIDE: MoveId.WATER_GUN,
} satisfies Partial<InstanceType<typeof DefaultOverrides>>;
```

Read through `src/overrides.ts` file to find the override that fits your needs - there are a lot of them!
If the situation you're trying to test can't be created using existing overrides (or with the [Dev Save](#-development-save-file)), reach out in **#dev-corner**. 
You can get help testing your specific changes, and you might have found a new override that needs to be created!

### 2 - Automatic Testing

> PokéRogue uses [Vitest](https://vitest.dev/) for automatic testing. Checking out the existing tests in the [test](./test/) folder is a great way to understand how this works, and to get familiar with the project as a whole.

To make sure your changes didn't break any existing test cases, run `npm run test:silent` in your terminal. You can also provide an argument to the command: to run only the Dancer (ability) tests, you could write `npm run test:silent dancer`. 
  - __Note that passing all test cases does *not* guarantee that everything is working properly__. The project does not have complete regression testing.

Most non-trivial changes (*especially bug fixes*) should come along with new test cases. 
  - To make a new test file, run `npm run create-test` and follow the prompts. If the move/ability/etc. you're modifying already has tests, simply add new cases to the end of the file. As mentioned before, the easiest way to get familiar with the system and understand how to write your own tests is simply to read the existing tests, particularly ones similar to the tests you intend to write.
  - Ensure that new tests:
    - Are deterministic. In other words, the test should never pass or fail when it shouldn't due to randomness. This involves primarily ensuring that abilities and moves are never randomly selected.
    - As much as possible, are unit tests. If you have made two distinct changes, they should be tested in two separate cases.
    - Test edge cases. A good strategy is to think of edge cases beforehand and create tests for them using `it.todo`. Once the edge case has been handled, you can remove the `todo` marker.

## 📜 Localization

The project intends for all text to be localized. That is, strings are pulled from translation files using keys (depending on the current language) and *never* hardcoded as a particular language. Note that there is a PDF in a message pinned in **#dev-corner** which gives the following information in greater detail.

### Setting Up and Updating the Locales Submodule
> The locales (translation) files are set up as a git submodule. A project-in-a-project, if you will.

To fetch translations when you first start development in your fork or to update them on your local branch, run:
```bash
git submodule update --progress --init --recursive
```

### How Localizations Work
> This project uses the [i18next](https://www.i18next.com/) library to integrate translations from public/locales
into the source code based on the user's settings or location. The basic process for
fetching translated text is as follows:
1. The source code fetches text by a given key, e.g.

    ```ts 
    i18next.t("fileName:keyName", { arg1: "Hello", arg2: "an example", ... }) 
    ```
2. The game looks up the key in the corresponding JSON file in the user's
language, e.g.

    ```ts
    // from "en/file-name.json"...
    "keyName": "{{arg1}}! This is {{arg2}} of translated text!" 
    ```
    If the key doesn't exist for the user's language, the game will default to the
corresponding English key (in the case of LATAM Spanish, it will first default to ES Spanish).

3. The game shows the text to the user:

    ```ts
    "Hello! This is an example of translated text!"
    ```
### Adding Translated Text
> If your feature involves new or modified text in any form, then you will be modifying the [locales](https://github.com/pagefaultgames/pokerogue-locales) repository. ***Never hardcode new text in any language!*** 

The workflow is:

1.  Make a pull request to the main repository for your new feature. 
If this feature requires new text, the text should be integrated into the code with a new i18next key pointing to where you plan to add it into the pokerogue-locales repository.

2. Make another pull request -- this time to the [pokerogue-locales](https://github.com/pagefaultgames/pokerogue-locales)
repository -- adding a new entry to the English locale with text for each key
you added to your main PR. You *only* need to add the English key and value - the translation team will handle the rest.

3.  If your feature is pulled from the mainline Pokémon games (e.g. a Move or Ability implementation), add a source link for any added text within the locale PR. 
[Poké Corpus](https://abcboy101.github.io/poke-corpus) is a great resource for finding text from the latest mainline games; otherwise, a YouTube video link showing the text in mainline is sufficient.

4. Ping @lugiadrien in **#dev-corner** or the current callout thread to make sure your locales PR is seen. 
It'll be merged into the locales repository after any necessary corrections, at which point you can test it in your main PR (after updating locales from remote)

5. The Dev team will approve your main PR, and your changes will be in the beta environment!

## 😈 Development Save File
> Some issues may require you to have unlocks on your save file which go beyond normal overrides. For this reason, the repository contains a [save file](../test/testUtils/saves/everything.psrv) with _everything_ unlocked (even ones not legitimately obtainable, like unimplemented variant shinies).

1. Start the game up locally and navigate to `Menu -> Manage Data -> Import Data`
2. Select [everything.prsv](test/testUtils/saves/everything.prsv) (`test/testUtils/saves/everything.prsv`) and confirm.
