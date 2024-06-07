# 📝 Most immediate things on the to-do platter

- ### High priority
    - 🐛 Game crashes after Dark Deal scientist is done talking to you 🛠️
    - 🐛 Accepting the scientist's offer causes the "thing" to your PKMN happen, but nothing else changes (ME doesn't continue as it should) 🛠️
      - Only out for this seems to be to refuse the offer, which also seems to cause a crash if the next fight is a trainer battle. 🛠️

- ### Medium priority
    - 🐛 PKMN Sprites and their HP/lvl bar doesn't get properly recalled when finding an ME or when meeting Rival. 🛠️
    - ⚙️ "Steal from player" functionality (Gholdengo ME) ❌


# 📝 Things to be done before Mystery Encounters ("MEs") MVP is finished:
  All the things on this list should be done before the merge as a MVP (Minimum Viable Product) release.

- ## Bugless implementation of the MVP MEs
  - Establish placeholder waves for MEs to happen ✔️
  - Bug-ish implementation of Common ME 1 🛠️
  - Bug-ish implementation of Common ME 2 🛠️
  - Bug-ish implementation of Rare ME 1 ✔️
  - Bug-ish implementation of Epic ME 1 🛠️
  - Bug-ish implementation of Legendary ME 1 🛠️

- ## First round of playtesting (Alpha)
  - Establish a placeholder odd for MEs to happen closer to real implementation ❌
  - Find and eliminate as many bugs as possible 🛠️
  - Tweak odds of ME spawn if needed ❌
  - Tweak difficulty/rewards balance in MEs 🛠️

  ## Translation of MEs after playtest/balance
  - EN localisation 🛠️
  - ES localisation 🛠️


# 🧬 Deep dive into MEs and what has done so far

Mysterious Encounters aim to be an addition to PokeRogue that will fundamentally shift the way PokéRogue feels. It looks to improve the bet of the game into the RogueLite genre without touching the core gameplay loop of Pokémon battles/collection that we know and love already in this game. Below there are some specifications that clarify what's being worked on for ease of access for the devs, balance team, artists and others who may be interested. Beware of spoilers!

## A Mysterious Encounter __**always has**__:
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
    - 🔵 Rare pool 
    - 🟣 Epic pool
    - 🟡 Legendary pool

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

# 📝 Known bugs (squash 'em all!):
  - ## 🔴 __**Really bad ones**__
    -🐛 Game crashes after Dark Deal scientist is done talking to you 🛠️
      - To reproduce: Start a game. Find ME. Finish dialogue.
    - 🐛 Accepting the scientist's offer causes the "thing" to your PKMN happen, but nothing else changes (ME doesn't continue as it should) 🛠️
      - To reproduce: (After previous crash): Reload the run, click on "Accept".
    - 🐛 Refusing the Deal and moving onto the next battle (in this case, a trainer battle) also crashed the game after the trainer dialogue
      - To reproduce: Refuse the scientist's deal. Run into a trainer. Finish dialogue.

  - ## 🟡 __**Bad ones under certain circumstances**__
    - 🐛 PKMN Sprites and their HP/lvl bar doesn't get properly recalled when finding an ME or when meeting Rival
      - To reproduce: Encounter an ME, a trainer, or the rival.

  - ## 🟢 __**Non-game breaking**__


# 🗿 Other cool things/functionalities that won't make it in the MVP but are planned to accomodate future MEs:

### QoL improvements
- Dialogue references to __**good**__ outcomes will be colored 🟢,  __**bad**__ ones in 🔴 and __**ambiguous**__ or __**mixed**__, in 🟡
  - Helps with quick glances when 5x speed

#### More requirements (with helper functions)
- Having X item
- Having Y amount of X item
- Being in a specific Biome
- A Pokémon X in player's party can learn Y move
- A Pokémon X in player's party knows Y move
- A Pokémon X in player's party has Y ability

#### More outcomes (with helper functions)
- Status one or many Pokémon if your party -- if they can be statused 
- Damage one or many Pokémon in your party 
- Set a hazard (ally or foe side)
- Set a weather 
- Give the player a Pokémon from a pool (useful for reg. professors/traders) 
- XP to a Pokémon (similar to rare candy?) 
- Add logic for choosing a Pokémon from party for some effect (trades, sacrifices, etc) 
- Add logic for awarding exp to the party (outside of a normal combat) 
