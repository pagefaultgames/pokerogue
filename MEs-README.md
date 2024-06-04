# Immediate things on the to-do platter

- Add logic to handle spawning boss encounters [ ]
- Bugfix not getting a reward at the end of battle ME
- Add logic for awarding exp to the party (outside of a normal combat)
- Add logic for choosing a Pokémon from party for some effect (trades, sacrifices, etc)
- Introduce more text tree hierarchy -- for better organization of encounters, options and dialogue text/layers 
- More steps to encounters -- ie Option --> __Dialogue: "You chose to not open the chest"__ --> Efects -> __Dialogue: "You walk away with regret"__

# Things to (eventually) be done for Mystery Encounters ("MEs"):
- Add MEs to gamemodes Classic and Endless ✔️ @ImperialSympathizer
- MEs need to have a chance to spawn ✔️ @asdar/@ImperialSympathizer


- A MEs should **ALWAYS HAVE**:
  - A wave index where they're happening -- each ME takes up a whole wave. ✔️
  - Dialogue:
    - Dialogue/Message content populated in relevant locales files (namely locales/mystery-encounter.ts) ✔️
    - An associated EncounterTypeDialogue object populated in allMysteryEncounterDialogue (see data/mystery-ecounter-dialogue.ts) ✔️
      - This will require certain content, such as encounter description window text and option button labels, while some other fields will be optional
      - Key content to be aware of when writing encounter dialogue:
        - Intro dialogue or messages (shown before anything appears on screen) ✔️
        - A title (shown in description box) ✔️
        - A description (shown in description box) ✔️
        - A prompt/query to the player, to choose the options (shown in description box) ✔️
        - An option panel at the bottom, taking the space of what usually is the game dialogs + controls ✔️
          - Containing at least two options, and up to four. ✔️
    - To view what dialogue content is mandatory for encounters, check the schema in data/mystery-ecounter-dialogue.ts
  - Intro Visuals:
    - One or multiple sprites may be used that will slide in on the field when the encounter starts ✔️
      - This could be anything from a group of trainers, to a Pokemon, to a static sprite of an inanimate object
    - To populate an encounter with intro visuals, see "Encounter Class Extending MysteryEncounterWrapper" section
    - Technically, the encounter will still work if Intro Visuals are not provided, but your encounter will look very strange when an empty field slides onto the screen
  - Encounter Class Implementing MysteryEncounterWrapper
    - All encounters should have their own class files organized in the src/data/mystery-encounters folder
    - Encounter classes can be named anything, but **must implement MysteryEncounterWrapper**
      - refer to existing encounters for examples
    - As part of MysteryEncounterWrapper, they should implement their own get() function
      - The get() function should return an object that is some concrete extension of class MysteryEncounter
        - example: can return a new OptionSelectMysteryEncounter()
      - **This MysteryEncounter type class will be where all encounter functional/business logic will reside**
      - That includes things like, what intro visuals to display, what each option does (is it a battle, getting items, skipping the encounter, etc.)
      - It will also serve as the way to pull data from the encounter class when starting the game
    - A new instance of this encounter class should be added to the initMysteryEncounters() function inside data/mystery-encounter.ts
  
  - **Rarity** tier of the ME, common by default. ✔️
    - Common pool ✔️
    - Rare pool ✔️
    - Super Rare (SR) pool ✔️
    - Ultra Rare (UR) pool ✔️

  - **Requirements** for Mystery Encounters and/or Encounter Options, if applicable.
  - These are entirely optional, but they give granular control over whether encounters will spawn in certain situations
  - Requirements include: 
    - Being within a wave range (e.g. floors 20-50) ✔️
    - Being in a specific Biome ✔️
    - Being a range of wave X-Y ✔️
    - Having X item ❌
    - Having Y amount of X item (borrow pokeball owning logic?) ❌
    - Having X amount of $$$ ✔️
    - Having X-Y party members (similar to catching logic?) ✔️/❌ (PARTIALLY COMPLETE)
    - Pokémon X in player's party can learn Y move (similar to TM coding?) ❌

  - **MysteryEncounterOptions** when selected, execute the custom logic passed in the **onSelect** function. Some **MysteryEncounterOptions** could be as simple as giving the player a pokéball, and others could be a few functions chained together, like "fight a battle, and get an item if you win"
  - See: /utils/mystery-encounter-utils.ts for the functions that can be used in **MysteryEncounterOptions**

  - **Option_pieces/effects/helper functions** for ME to happen, if applicable. They can be:
    - Giving the player X item ✔️
    - Giving the player X item from Y item pool ❌
    - Letting the player choose from X items
    - Letting the player choose from X items from Y item pool ❌ 
    - Start a combat encounter with a trainer ✔️
    - Start a combat encounter with a wild pokémon (from biome) ❌
    - Start a combat encounter with a wild pokémon (boss) ❌
    - XP to a Pokémon (similar to rare candy?) ❌
    - XP to the whole party (similar to rarer candy?) ❌     
    - Set a hazard ❌
    - Set a weather ❌
    - Status one or many Pokémon if your party -- if they can be statused ❌
    - Damage one or many Pokémon in your party ❌
    - Give the player a Pokémon from a pool (useful for reg. professors/traders) ❌
    - Remove a PKMN from the player's party (Shedinja deal) ❌
    - Steal from player (Gholdengo, Ninjask deal) ❌


Note on rarity: once the ME roll finalises, another roll decides which rarity pool the ME belongs to, and a final roll takes in different weights in the rarity tier pool to decide the ME that occurs, among the available ones in that pool.
