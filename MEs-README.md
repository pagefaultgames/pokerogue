# Things to (eventually) be done for Mystery Encounters ("MEs"):
- Add MEs to gamemodes Classic and Endless (done by @ImperialSympathizer at gamemodes.ts)
- MEs need to have a chance to spawn (done by @asdar) (needs revision, has placeholder at floor 3)

- A MEs should always require:
  - A wave index where they're happening -- each ME takes up a whole wave.
  - A sprite (of a Pokémon or trainer you're interacting with)
  - An opening dialogue
  - A prompt/query to the player, that leads into the options
  - An option panel at the bottom, taking the space of what usually is the game dialogs + controls
  - At least two "choices", and up to four.
  - Requirements for ME to happen, if applicable. They can be:
    - Having X item
    - Having Y amount of X item (borrow pokeball owning logic?)
    - Having X amount of $$$ (borrow buying logic?)
    - Having X-Y party members (similar to catching logic?)
    - Pokémon X in player's party can learn Y move (similar to TM coding?)

  - In what Biomes the ME happens, if applicable.
  - Rarity tier of the ME, common by default. 
      - Rarities should follow the tiers of Pokémons in Biomes, so "Common, "Rare", "Super Rare" (SR), and "Ultra Rare" (UR).

- "Choices" can call one simple event or multiple. Some events which should be callable in the choices:
  - Force a fight with a Pokémon. Can be a fixed Pokémon or pulled from the biome.


A MEs creation "template" of some sort should exist, probably in a file in where all already written MEs exist?
