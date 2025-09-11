# Localization 101

PokéRogue's localization team puts immense effort into making the game accessible around the world, supporting over 12 different languages at the time of writing this document. \
As a developer, it's important to help maintain global accessibility by effectively coordinating with the Translation Team on any new features or enhancements.

This document aims to cover everything you need to know to help keep the integration process for localization smooth and simple.

# Prerequisites
Before you continue, this document assumes:
- You have already forked the repository and set up a development environment according to [CONTRIBUTING.md](../CONTRIBUTING.md).
- You have a basic level of familiarity with Git commands and GitHub repositories.
- You have joined the [community Discord](https://discord.gg/pokerogue) and have access to `#dev-corner` and related channels via **[#select-roles](https://discord.com/channels/1125469663833370665/1194825607738052621)**.
This is the easiest way to keep in touch with both the Translation Team and other like-minded contributors!

# About the `pokerogue-locales` submodule

PokéRogue's translations are managed under a separate dedicated repository, [`pokerogue-locales`](https://github.com/pagefaultgames/pokerogue-locales/).
This repository is integrated into the main one as a [git submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules) within the `public/locales` folder.

## What Is a Submodule?

In essence, a submodule is a way for one repository (i.e. `pokerogue`) to use another repository (i.e. `pokerogue-locales`) internally.
The parent repo (the "superproject") houses a cloned version of the 2nd repository (the "submodule") inside it, making locales effectively a "repository within a repository", so to speak.

>[!TIP]
> Many popular IDEs have integrated `git` support with special handling around submodules:
>
> ![Image showing Visual Studio Code's `git` integration in the File Explorer. A blue "S" in the top right hand corner indicates the `public/locales` folder is a submodule.](https://github.com/user-attachments/assets/bd42d354-c65b-4cbe-8873-23d760dc1714 "What the `public/locales` submodule looks like in VS Code's File Explorer")
>
> ![Image showing Visual Studio Code's Source Control tab. A separate dropdown can be seen for each individual submodule.](https://github.com/user-attachments/assets/8b4d3f64-aec1-4474-91df-03dc1252a2fa "Making commits on submodules without even changing directories!")

## Fetching Changes from Submodules

The following command will initialize your branch's locales repository and update its HEAD:
```bash
pnpm update-locales
```

> [!TIP]
> This command is run _automatically_ after cloning, merging or changing branches, so you should rarely have to run it manually.

> [!IMPORTANT]
> If you EVER run into issues with the `locales` submodule, try deleting the `.git/modules/public` and `public/locales` folders before re-initializing it again.

## How Are Translations Integrated?

This project uses the [i18next library](https://www.i18next.com/) to integrate translations from `public/locales` into the source code.
The basic process for fetching translated text goes roughly as follows:
1. The source code fetches text by a given key.
    ```ts
    globalScene.phaseManager.queueMessage(
      i18next.t("fileName:keyName", { arg1: "Hello", arg2: "an example", ... })
    );
    ```
2. The game looks up the key in the corresponding JSON file for the user's language.
    ```jsonc
    // from "en/file-name.json"...
    {
      "keyName": "{{arg1}}! This is {{arg2}} of translated text!"
    }
    ```
    If the key doesn't exist for the given language, the game will default to an appropriate fallback (usually the corresponding English key).
3. The game shows the translated text to the user.
    ```ts
    "Hello! This is an example of translated text!"
    ```

# Submitting Locales Changes
If you have a feature or enhancement that requires additions or changes to in-game text, you will need to make a fork of the `pokerogue-locales` repo and submit your text changes as a pull request _in addition_ to your pull request to the main project. \
Since these two PRs aren't _technically_ linked, it's important to coordinate with the Translation Team to ensure that both PRs are integrated safely into the project.

> [!CAUTION]
> **DO NOT HARDCODE PLAYER-FACING TEXT INTO THE CODE!**

## Making Changes

One perk of submodules is you don't actually _need_ to clone the locales repository to start contributing - `git` already does that for you on initialization.

Given `pokerogue-locales` is a full-fledged `git` repository _inside_ `pokerogue`, making changes is roughly the same as normal, merely using `public/locales` as your root directory.

> [!WARNING]
> Make sure to checkout or rebase onto `upstream/main` (`pnpm update-locales:remote`) **BEFORE** creating a locales PR!
> The checked-out commit is based on the superproject's SHA-1 by default, so hastily making changes may see you basing your commits on last week's `HEAD`.

## Requirements for Adding Translated Text
When a new feature or enhancement requires adding a new locales key **without changing text in existing keys**, we have the following workflow with regards to localization:
1. You (the developer) make a pull request to the main repository for your new feature.
If this feature requires new text, the text should be integrated into the code with a new `i18next` key pointing to where you plan to add it into the locales repository.
2. You then make another pull request — this time to the `pokerogue-locales` repository — adding a new entry with text for each key you added to your main PR.
    - You must add the corresponding **English keys** while making the PR; the Translation Team can take care of the rest[^2].
    - For any feature pulled from the mainline Pokémon games (e.g. a Move or Ability implementation), it's best practice to include a source link for any added text. \
    [Poké Corpus](https://abcboy101.github.io/poke-corpus/) is a great resource for finding text from the mainline games; otherwise, a video/picture showing the text being displayed should suffice.
    - You should also [notify the current Head of Translation](#notifying-translation) to ensure a fast response.
3. Your locales should use the following format:
  - File names should be in `kebab-case`. Example: `trainer-names.json`
  - Key names should be in `camelCase`. Example: `aceTrainer`
    - If you make use of i18next's inbuilt [context support](https://www.i18next.com/translation-function/context), you need to use `snake_case` for the context key. Example: `aceTrainer_male`
4. At this point, you may begin [testing locales integration in your main PR](#documenting-locales-changes).
5. The Translation Team will approve the locales PR (after corrections, if necessary), then merge it into `pokerogue-locales`.
6. The Dev Team will approve your main PR for your feature, then merge it into PokéRogue's beta environment.

[^2]: For those wondering, the reason for choosing English specifically is due to it being the master language set in Pontoon (the program used by the Translation Team to perform locale updates).
If a key is present in any language _except_ the master language, it won't appear anywhere else in the translation tool, rendering missing English keys quite a hassle.

### Requirements for Modifying Translated Text

PRs that modify existing text have different risks with respect to coordination between development and translation, so their requirements are slightly different:
- As above, you set up 2 PRs: one for the feature itself in the main repo, and another for the associated locales changes in the locale repo.
- Now, however, you need to have your main PR be approved by the Dev Team **before** your corresponding locale changes are merged in.
- After your main PR is approved, you may update the submodule and post video evidence of integration into the **locales PR**.
- A Lead or Senior Translator from the Translation Team will then approve your main PR (if all is well), clearing your feature for merging into `beta`.

## Documenting Locales Changes

After making a PR involving any outwards-facing behavior (but _especially_ locales-related ones), it's generally considered good practice to attach proof of those changes working in-game.

The basic procedure is roughly as follows:
1. Update your locales submodule to point to **the branch you used to make the locales PR**. \
    Many IDEs with `git` integration support doing this from the GUI, \
    or you can simply do it via command-line:
    ```bash
    cd public/locales
    git checkout your-branch-name-here
    ```
2. Set some of the [in-game overrides](../CONTRIBUTING.md#1---manual-testing) inside `overrides.ts` to values corresponding to the interactions being tested.
3. Start a local dev server (`pnpm start:dev`) and open localhost in your browser.
4. Take screenshots or record a video of the locales changes being displayed in-game using the software of your choice[^2].

[^2]: For those lacking a screen capture device, [OBS Studio](https://obsproject.com) is a popular open-source option.

> [!NOTE]
> For those aiming to film their changes, bear in mind that GitHub has a hard **10mB limit** on uploaded media content.
> If your video is too large, consider making it shorter or downscaling the quality.

## Notifying Translation
Put simply, stating that a PR exists makes it much easier to review and merge.

The easiest way to do this is by **pinging the current Head of Translation** in the [community Discord](https://discord.gg/pokerogue) (ideally in `#dev-corner` or similar).

<!-- Remember to update this everytime the head of translation changes! -->
> [!IMPORTANT]
> The current Head of Translation is: \
> ** @lugiadrien **

# Closing Remarks
If you have any questions about the developer process for localization, don't hesitate to ask!
Feel free to contact us on Discord - the Dev Team and Translation Team will be happy to answer any questions.
