# Things to (eventually) be done for Mystery Encounters ("MEs"):
- Add MEs to gamemodes Classic and Endless ✔️ @ImperialSympathizer
- MEs need to have a chance to spawn ✔️ @asdar (needs revision, has placeholder at floor 3)

- A MEs should **ALWAYS NEED**:
  - A wave index where they're happening -- each ME takes up a whole wave. ✔️
  - A title ✔️ // locales/mystery-encounter.ts
  - Quick opening message ✔️ // locales/mystery-encounter.ts
  - A sprite (of a Pokémon or trainer you're interacting with) ❌ 
  - An opening dialogue/description ✔️ // locales/mystery-encounter.ts
  - A prompt/query to the player, that leads into the options ✔️ // locales/mystery-encounter.ts
  - An option panel at the bottom, taking the space of what usually is the game dialogs + controls ✔️ // locales/mystery-encounter.ts
  - At least two "options", and up to four. ✔️// locales/mystery-encounter.ts
  - In what Biomes the ME happens, null by default. ❌
  - **Rarity** tier of the ME, common by default. ❌
    - Common pool ❌
    - Rare pool ❌
    - Super Rare (SR) pool ❌
    - Ultra Rare (UR) pool ❌

  - **Requirements** for ME to happen, if applicable. They can be: 
    - Being at wave X ❌
    - Being a range of wave X-Y ❌
    - Having X item ❌
    - Having Y amount of X item (borrow pokeball owning logic?) ❌
    - Having X amount of $$$ (borrow buying logic?) ❌
    - Having X-Y party members (similar to catching logic?) ❌
    - Pokémon X in player's party can learn Y move (similar to TM coding?) ❌

  - **Options** would be compounded by **option_pieces** (placeholder name). Some **options** could be just made out of one **option_piece**, such as "obtain a pokéball" (option_piece give item) and other **options** could be a few **option_pieces** chained together, like "fight a battle, and get an item if you win" (option_pieces combat encounter + let item choose)

  - **Option_pieces** for ME to happen, if applicable. They can be:
    - Giving the player X item ❌
    - Giving the player X item from Y item pool ❌
    - Letting the player choose from X items
    - Letting the player choose from X items from Y item pool ❌ 
    - Start a combat encounter with a trainer ❌
    - Start a combat encounter with a wild pokémon (from biome) ❌
    - Start a combat encounter with a wild pokémon (boss) ❌
    - XP to a Pokémon (similar to rare candy?) ❌
    - XP to the whole party (similar to rarer candy?) ❌     
    - Set a hazard ❌
    - Set a weather ❌
    - Status one or many Pokémon if your party -- if they can be statused ❌
    - Damage one or many Pokémon in your party ❌


Note on rarity: once the ME roll finalises, another roll decides which rarity pool the ME belongs to, and a final roll takes in different weights in the rarity tier pool to decide the ME that occurs, among the available ones in that pool.