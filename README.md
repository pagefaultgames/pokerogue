<picture><img src="./public/images/logo.png" width="300" alt="PokéRogue"></picture>

PokéRogue is a browser based Pokémon fangame heavily inspired by the roguelite genre. Battle endlessly while gathering stacking items, exploring many different biomes, fighting trainers, bosses, and more!

# Contributing

## 🛠️ Development

If you have the motivation and experience with Typescript/Javascript (or are willing to learn) please feel free to fork the repository and make pull requests with contributions. If you don't know what to work on but want to help, reference the below **To-Do** section or the **#feature-vote** channel in the discord.

### 💻 Environment Setup

#### Prerequisites

- node: 22.14.0
- npm: [how to install](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

#### Running Locally

1. Clone the repository through Git by running the following command in your desired directory:
   ``bash
   git clone --recurse-submodules https://github.com/pagefaultgames/pokerogue
   ```
   [^1]
2. Run `npm install` in the newly cloned folder to download required dependencies.
3. Run `npm run start:dev` to locally run the project in `localhost:8000`

If you run into any errors, reach out in the **#dev-corner** channel in discord

[^1]: If you forget to use the `--recurse-submodules` flag when cloning initially, consult [localization.md](./docs/localization.md) \
for instructions on how to clone the `locales` submodule manually.

#### Linting

<!-- TODO: Mention linting.md -->
We're using Biome as our common linter and formatter. \
It will run automatically during the pre-commit hook, or can be done manually via `npm run biome`. \
To view the complete rules, check out the [biome.jsonc](./biome.jsonc) file.

### 📚 Documentation

You can find the auto-generated documentation [here](https://pagefaultgames.github.io/pokerogue/main/index.html).

Additionally, the [docs folder](./docs) contains a variety of documents and guides useful for aspiring contributors. \
Notable topics include:
- [Commenting your code](./docs/comments.md)
- [Linting & Formatting](./docs/linting.md)
- [Localization](./docs/localization.md)
- [Enemy AI move selection](./docs/enemy-ai.md)

### ❔ FAQ

**How do I test a new _______?**

- In the `src/overrides.ts` file there are overrides for most values you'll need to change for testing

**How do I retrieve the translations?**

- See [localization.md](./docs/localization.md) for detailed info on everything to do with translations, \
from cloning the `locales` repository to adding new entries and submitting changes.

## 🪧 To Do

Check out [Github Issues](https://github.com/pagefaultgames/pokerogue/issues) to see how can you help us!

# 📝 Credits
>
> If this project contains assets you have produced and you do not see your name, **please** reach out, either [here on GitHub](https://github.com/pagefaultgames/pokerogue/issues/new) or via [Discord](https://discord.gg/pokerogue).

Thank you to all the wonderful people that have contributed to the PokéRogue project! You can find the credits [here](./CREDITS.md).
