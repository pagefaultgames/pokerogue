# Localization 101

PokéRogue's localization team puts immense effort into making the game accessible around the world, supporting over 10 different languages at the time of writing this document.
As a developer, it's important to help maintain global accessibility by effectively coordinating with the Translation Team on any new features or enhancements.

This document aims to cover everything you need to know to help keep the integration process for localization smooth and simple.

# Stupid Assumptions
Before you continue, this document assumes:
<!-- TODO: Change to mention contributing.md once that released -->
- You have already forked the repository and set up a  development environment according to the [respository README] (https://github.com/pagefaultgames/pokerogue/blob/beta/README.md).
<!-- TODO: Get @SirsBenjie to add a good Git/GH tutorial for noobs --> 
- You have a basic level of familiarity with Git commands and GitHub repositories.
- You have joined the [community Discord](https://discord.gg/pokerogue) and have access to `#dev-corner` and related channels via **[#select-roles](https://discord.com/channels/1125469663833370665/1194825607738052621)**. This is the easiest way to keep in touch with both the Translation Team and other like-minded contributors!

## About the `pokerogue-locales` submodule

PokéRogue's translations are managed under a separate dedicated repository, [`pokerogue-locales`](https://github.com/pagefaultgames/pokerogue-locales/). 
This repository is integrated into the main one as a [git submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules) within the `public/locales` folder.

### What Is a Submodule?

In essence, a submodule is a way for one repository (i.e. `pokerogue`) to use another repository internally (`pokerogue-locales`).
From the perspective of the main project, the locales submodule is fairly simple to work with, but there are some important commands to keep in mind.

#### Fetching Changes from Submodules

Once you have set up your fork, run the following command to integrate the latest locales changes into your branch:
```bash
git submodule update --init --recursive
```
[^1]

This is run automatically after merge or switching branches, so you _usually_ won't have to run it manually in most cases.

[^1]: If you run into issues with your development environment afterwards, try deleting the `.git/modules/public` and `public/locales` folders before re-running the command.

## Adding Translated Text

### How Are Translations Integrated?

This project uses the [i18next library](https://www.i18next.com/) to integrate translations from `public/locales` into the source code based on the user's settings or location. The basic process for fetching translated text is as follows:
1. The source code fetches text by a given key, e.g.
    ```ts
    i18next.t("fileName:keyName", { arg1: "Hello", arg2: "an example", ... })
    ```
2. The game looks up the key in the corresponding JSON file in the user's language, e.g.
    ```ts
    // from "en/file-name.json"...
    "keyName": "{{arg1}}! This is {{arg2}} of translated text!"
    ```
    If the key doesn't exist for the user's language, the game will default to the corresponding English key.
3. The game shows the text to the user:
    ```ts
    "Hello! This is an example of translated text!"
    ```

### Requirements for Adding Translated Text

If you have a feature or enhancement that requires additions or changes to in-game text, you will need to make a fork of the `pokerogue-locales` repo and submit your text changes as a pull request to that repo _in addition_ to your pull request to the main project. 
Since these two PRs aren't technically linked, it's important to coordinate with the Translation Team to ensure that both PRs are integrated safely into the project. 
As the developer, you are responsible for creating or adjusting English keys (or your mother language) in support of your feature or enhancement; the Translation Team will take care of the rest.

When your new feature or enhancement requires a new key **without changing text in existing keys**, we require the following workflow with regards to localization:
1. You (the developer) make a pull request to the main repository for your new feature. If this feature requires new text, the text should be integrated into the code with a new `i18next` key pointing to where you plan to add it into the locales repository. **DO NOT HARDCODE PLAYER-FACING TEXT INTO THE CODE!**
2. You then make another pull request -- this time to the `pokerogue-locales` repository -- adding a new entries to the JSON files with text for each key you added to your main PR.
   - For any feature pulled from the mainline Pokémon games (e.g. a Move or Ability implementation), it's best practice to include a source link for any added text.
     [Poké Corpus](https://abcboy101.github.io/poke-corpus/) is a great resource for finding text from the mainline games; otherwise, a video (YouTube or otherwise) showing the text in mainline should suffice.
   - You should also [notify the current Head of Translation](#Contacting Translation Staff) to ensure a fast response.
3. You can now [test locales integration](#Filming Locales Changes) in your main PR.
4. The Translation Team will approve the locale PR (after corrections, if necessary), then merge it into `pokerogue-locales`.
5. The Dev Team will approve your main PR for your feature, then merge it into PokéRogue's beta environment.

### Requirements for Modifying Translated Text

PRs that modify existing text have different risks with respect to coordination between development and translation, so their requirements are slightly different:
- As above, you set up 2 PRs: one for the feature itself in the main repo, and another for the associated locales changes in the locales repo.
- Now, however, you need to have your main PR be approved by the Dev Team **before** your corresponding locale changes are merged in.
- After your main PR is approved, the Translation Team will merge your locale PR, and you may update the submodule and post video evidence of locale integration in the **locales PR**.
<!-- - A Lead or Senior Translator from the Translation Team will then approve your main PR (if all is well), clearing your feature for merging into beta. -->

## Filming Locales Changes
TODO mention obs

## Contacting Translation Staff
It is much easier for someone to merge a PR if they know it exists. 

The best way to notify Translation staff of an impending Locales PR is by **pinging the current Head of Translation** in the community discord.

The current Head of Translation is:
** @lugiadrien **

# Closing Remarks
If you have any questions about the developer process for localization, don't hesitate to ask someone in `#dev-corner`!
The Dev Team and Translation Team will be happy to answer any questions.
