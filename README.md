<picture><img src="./public/images/logo.png" width="300" alt="PokéRogue"></picture>

PokéRogue is a browser based Pokémon fangame heavily inspired by the roguelite genre. Battle endlessly while gathering stacking items, exploring many different biomes, fighting trainers, bosses, and more!

# Contributing
## 🛠️ Development
If you have the motivation and experience with Typescript/Javascript (or are willing to learn) please feel free to fork the repository and make pull requests with contributions. If you don't know what to work on but want to help, reference the below **To-Do** section or the **#feature-vote** channel in the discord.

### 💻 Environment Setup
#### Prerequisites
- node 20.13.1+
- npm <sub>[how to install](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)</sub>

#### Local Setup
1. Clone the repo including submodules:
    ```shell
    git clone --recurse-submodules --remote-submodules https://github.com/flx-sta/pokerogue-locales.git
    ```
    <sub>Use SSH if preferred</sub>
2. Change into the root project directory
    ```shell
    git clone --recurse-submodules --remote-submodules https://github.com/flx-sta/pokerogue-locales.git
    ```
3. Install all npm modules:
    ```shell
    npm i
    # or
    npm install
    ```
    - *if you run into any errors, reach out in the **#dev-corner** channel in discord*


> [!TIP]
> If your submodules did not initialize properly try running:
> ```shell
> git submodule update --init --recursive
> ```

#### Running Locally

Simply Run:
```shell
npm run start
```
to locally run the project on [localhost:8000](http://localhost:8000)

#### Linting
We're using ESLint as our common linter and formatter. It will run automatically during the pre-commit hook but if you would like to manually run it, use the `npm run eslint` script.

### ❔ FAQ

**How do I test a new _______?**
- In the `src/overrides.ts` file there are overrides for most values you'll need to change for testing


## 🪧 To Do
Check out [Github Issues](https://github.com/pagefaultgames/pokerogue/issues) to see how can you help us!

# 📝 Credits
> If this project contains assets you have produced and you do not see your name here, **please** reach out.

### 🎵 BGM
  - Pokémon Mystery Dungeon: Explorers of Sky
    - Arata Iiyoshi
    - Hideki Sakamoto
    - Keisuke Ito
    - Ken-ichi Saito
    - Yoshihiro Maeda
  - Pokémon Black/White
    - Go Ichinose
    - Hitomi Sato
    - Shota Kageyama
  - Pokémon Mystery Dungeon: Rescue Team DX
    - Keisuke Ito
    - Arata Iiyoshi
    - Atsuhiro Ishizuna
  - Pokémon HeartGold/SoulSilver
  - Pokémon Black/White 2
  - Pokémon X/Y
  - Pokémon Omega Ruby/Alpha Sapphire
  - Pokémon Sun/Moon
  - Pokémon Ultra Sun/Ultra Moon
  - Pokémon Sword/Shield
  - Pokémon Legends: Arceus
  - Pokémon Scarlet/Violet
  - Firel (Custom Ice Cave, Laboratory, Metropolis, Plains, Power Plant, Seabed, Space, and Volcano biome music)
  - Lmz (Custom Ancient Ruins, Jungle, and Lake biome music)
  - Andr06 (Custom Slum and Sea biome music)

### 🎵 Sound Effects
  - Pokémon Emerald
  - Pokémon Black/White

### 🎨 Backgrounds
  - Squip (Paid Commissions)
  - Contributions by Someonealive-QN

### 🎨 UI
  - GAMEFREAK
  - LJ Birdman

### 🎨 Pagefault Games Intro
  - Spectremint

### 🎨 Game Logo
  - Gonstar (Paid Commission)

### 🎨 Trainer Sprites
  - GAMEFREAK (Pokémon Black/White 2, Pokémon Diamond/Pearl)
  - kyledove
  - Brumirage
  - pkmn_realidea (Paid Commissions)
  - IceJkai 

### 🎨 Trainer Portraits
  - pkmn_realidea (Paid Commissions)

### 🎨 Pokemon Sprites and Animation
  - GAMEFREAK (Pokémon Black/White 2)
  - Smogon Sprite Project (Various Artists)
  - Skyflyer
  - Nolo33
  - Ebaru
  - EricLostie
  - KingOfThe-X-Roads
  - kiriaura
  - Caruban
  - Sopita_Yorita
  - Azrita
  - AshnixsLaw
  - Hellfire0raptor
  - RetroNC
  - Franark122k
  - OldSoulja
  - PKMarioG
  - ItsYugen
  - lucasomi
  - Pkm Sinfonia
  - Poki Papillon
  - Fleimer_
  - bizcoeindoloro
  - mangalos810
  - Involuntary-Twitch
  - selstar
  - koda_want_to_sleep

### 🎨 Move Animations
  - Pokémon Reborn
