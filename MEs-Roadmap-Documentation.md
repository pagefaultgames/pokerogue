# 📝 Things to be done before Mystery Encounters ("MEs/Events") goes __live__:

- ## 1: First round of playtesting (Beta PokéRogue)
  - First round of feedback on bugs for more slippery bugs 🛠️
  - First round of balance feedback on odds and power-level 🛠️
  - Tweak difficulty/rewards balance in MEs 🛠️

- ## 2.1: More requirements (with helper functions)
  - Having X item 🛠️
  - Having Y amount of X item 🛠️
  - A Pokémon X in player's party can learn Y move 🛠️
  - A Pokémon X in player's party knows Y move ✔️
  - A Pokémon X in player's party has Y ability 🛠️
  - A Pokémon X in player's party belongs to a pre-defined pool (ie. "Ultrabeasts") 🛠️

- ## 2.2: More outcomes (with helper functions)
  - Status one or many Pokémon if your party -- if they can be statused ✔️
  - Damage one or many Pokémon in your party ✔️
  - Set a hazard (ally or foe side) 🛠️
  - Set a weather 🛠️
  - Give the player a Pokémon from a pool 🛠️
  - XP to a Pokémon ✔️
  - Add logic for choosing a Pokémon from party for some effect ✔️
  - Add logic for awarding exp to the party ✔️
  - Encounter/pull a PKMN from a pre-defined pool (ie. "Ultrabeasts") ✔️

- ## 2.3: Other wanted utils
  - IV changes visuals for improving starter IVs in Events 🛠️

- ## 2.4: Bugless implementation of the MVP MEs
  - Bugless implementation of about 55-60 MEs
    - 20 non-biome-dependant:
      - ⚪ 9 Common Events 
      - 🔵 5 Great Events
      - 🟡 4 Ultra Events
      - 🔴 2 Rogue Events
    - ⚪/🔵/🟡 35-40 biome-dependant Events, at least one for each biome

- ## 3.0: Continuous playtesting (Beta PokéRogue)
  - More rounds of feedback on bugs for more slippery bugs 🛠️
  - More rounds of balance feedback on odds and power-level 🛠️
  - Tweak difficulty/rewards balance in MEs 🛠️

- ## Translation of MEs after playtest/balance
  - First round of translators feedback to avoid potential issues 🛠️
  - de localisation     🛠️
  - en localisation     🛠️
  - es-ES localisation  🛠️
  - es-MX localisation  🛠️
  - fr localisation     🛠️
  - it localisation     🛠️
  - ko localisation     🛠️
  - pt-BR localisation  🛠️
  - zh-CN localisation  🛠️
  - zh-TW localisation  🛠️


# So, __what__ are Events? 🧬
## (A deep dive into Events and what has been done so far)

Events (referred to as '__Mysterious Encounters, MEs__' in the code) aim to be an addition to PokeRogue that will fundamentally shift the way PokéRogue feels. It looks to improve the bet of the game into the RogueLike genre without touching the core gameplay loop of Pokémon battles/collection that we know and love already in this game. Below there are some specifications that clarify what's being worked on for ease of access for the devs, balance team, wiki editors, artists and others who may be interested. Beware of spoilers!

## An Event __**always has**__:
  ### #️⃣ A wave index where they're happening -- each ME takes up a whole wave (means you miss a combat!).

  ### 💬 Dialogue:
    - Dialogue/Message content populated in relevant locales files (namely locales/mystery-encounter.ts) 
    - An associated EncounterTypeDialogue object populated in allMysteryEncounterDialogue (see data/mystery-ecounter-dialogue.ts) 
      - This will require certain content, such as encounter description window text and option button labels, while some other fields will be optional
      - Key content to be aware of when writing encounter dialogue:
        - Intro dialogue or messages (shown before anything appears on screen) 
        - A title (shown in description box) 
        - A description (shown in description box) 
        - A prompt/query to the player, to choose the options (shown in description box) 
        - An option panel at the bottom, taking the space of what usually is the game dialogs + controls 
          - Containing at least two options, and up to four. 
    - ❗❗ To view what dialogue content is __**mandatory**__ for encounters, check the schema in data/mystery-ecounter-dialogue.ts

  ### 🕺 Intro Visuals:
    - One or multiple sprites may be used. They will slide onto the field when the encounter starts 
      - 📚 This could be anything from a group of trainers, to a Pokemon, to a static sprite of an inanimate object
    - ❗❗ To populate an encounter with intro visuals, see "Encounter Class Extending MysteryEncounterWrapper" section
      - 📚 Technically, the encounter will still work if Intro Visuals are not provided, but your encounter will look very strange when an empty field slides onto the screen

  ### 📋 Encounter Class Implementing MysteryEncounterWrapper
    - ❗❗ All encounters should have their own class files organized in the src/data/mystery-encounters folder
    - ❗❗ Encounter classes can be named anything, but **must implement MysteryEncounterWrapper**
      - Refer to existing MEs for examples
    - ❗❗ As part of MysteryEncounterWrapper, they should implement their own get() function
      - 📚 The get() function should return an object that is some concrete extension of class MysteryEncounter
        - Example: can return a new OptionSelectMysteryEncounter()
      - ❗❗ **This MysteryEncounter type class will be where all encounter functional/business logic will reside**
        - 📚 That includes things like, what intro visuals to display, what each option does (is it a battle, getting items, skipping the encounter, etc.)
        - 📚 It will also serve as the way to pull data from the encounter class when starting the game
    - ❗❗ A new instance of this encounter class should be added to the initMysteryEncounters() function inside data/mystery-encounter.ts
  
  ### 🌟 **Rarity** tier of the ME, common by default.
    - ⚪ Common pool 
    - 🔵 Great pool 
    - 🟡 Ultra pool
    - 🔴 Rogue pool

  ### **Optional Requirements** for Mystery Encounters.
  - 🛠️ They give granular control over whether encounters will spawn in certain situations
  - Requirements might include: 
    - Being within a wave range
    - Being a range of wave X-Y
    - Having X amount of $$$
    - Having X-Y party members (similar to catching logic?) ✔️/❌ (PARTIALLY COMPLETE)

  ### **MysteryEncounterOptions** 
    When selected, execute the custom logic passed in the **onSelect** function. Some **MysteryEncounterOptions** could be as simple as giving the player a pokéball, and others could be a few functions chained together, like "fight a battle, and get an item if you win"

  ### **Functions/ Helper functions** defined in __/utils/mystery-encounter-utils.ts__ for ME to happen, if applicable. They can be:
    - Giving the player X item ✔️
    - Giving the player X item from a certain tier ✔️
    - Letting the player choose from items ✔️
    - Letting the player choose from X items from a certain tier ✔️
    - Start a combat encounter with a trainer ✔️
    - Start a combat encounter with a wild pokémon (from biome) ✔️
    - Start a combat encounter with a boss wild pokémon ✔️
    - XP to the whole party ✔️
    - Remove a PKMN from the player's party ✔️
    - Steal from player ❌

# Log Documentation

## 12th-13th June
- The 🐛 "Opening the chest simply moves you to a wild battle against nothingness, which you can escape after you get bored of it." is fixed.
- The 🐛 "PKMN Sprites and their HP/lvl bar doesn't get properly recalled when finding an ME or when meeting Rival." is fixed. 
- The 🐛 "Weaker trainers from Mysterious Challenger crashes the game when the reward screen should come out" is fixed.
- The 🐛 "If a ME spawns on the first floor of a new biome (NewBiomeEncounterPhase), intro visuals do not spawn properly" is fixed.
- The 🐛 "Any ME that procs at wave (?)(?)(1) has its sprite removed. Only the sprite is affected." is fixed.
- The 🐛 "Picking a double battle trainer (ie Twins) as your challenge results in a game over, including loss of save." should be fixed.
- Allowed catch in "Fight or Flight" -- it was counterintuitive to not allow it as it __is__ a wild PKMN fight.
- More minor 🐛 squashed.
- Pushed Dark Deal ME to a higher wave requirement (+30) as it seems to be functioning (mostly) bugless.

## 27-29th June
- The 🐛 "Picking up certain items in Fight or Flight works poorly" has been squashed.
- The 🐛 "Modifiers that are applied to pokemon get skipped in Fight or Flight" has been squashed.
- ⚙️ Added "Omniboost" functionality (Fight or Flight ME) 
- The 🐛 "Wave seed generates different encounter data if you roll to a new wave, see the spawned stuff, and refresh the app" has been squashed. But we are still watching this one just in case 🕵️
- The 🐛 "Type-buffing items (like Silk Scarf) get swapped around when offered as a reward in Fight or Flight" has been squashed.
- ⚖️ Adjusted Dark Deal odds to show 6-7 cost PKMNs at a much higher rate (70%) than 8-cost (20%) or 9-cost (10%), to avoid box legendaries being overly present.
- The 🐛 about "Tooltips being remembered from the previous ME choice until you hovered a different option" is squashed.

## 01st-10th June; MVP ready!
- MVP threshold reached! Whoop whoop! Here's what we had set up to do and accomplished:
  - ### Bugless implementation of the MVP MEs
    - The framework for Events and all the helper functions. 💖
      Literally this didn't exist and is the backbone for any Event to to happen! 😅
    - ⚪ Bug-free implementation of Common ME 1 ('Mysterious Chest')✔️
    - ⚪ Bug-free implementation of Common ME 2 ('Fight or Flight')✔️
    - 🔵 Bug-free implementation of Great ME 1 ('Mysterious Challenger')✔️
    - 🟡 Bug-free implementation of Ultra ME 1 ('Training Session') ✔️
    - 🔴 Bug-free implementation of Rogue ME 1 ('Dark Deal') ✔️
- Lots of QoL added. 
- Refactor the rarity of Events
- Scrapped much of the Readme to keep it simpler, as we prepare to move onto GitHub Projects for better organization
