# Data Models

## Pokemon Model

**Purpose:** Represents individual Pokemon with complete battle stats, progression, and state information

**Key Attributes:**
- `id`: number - Unique Pokemon instance identifier
- `speciesId`: string - Species identifier from SpeciesId enum
- `level`: number - Current Pokemon level (1-100)
- `exp`: number - Total experience points
- `hp`: number - Current hit points
- `maxHp`: number - Maximum hit points at current level
- `stats`: table - Current battle stats [HP, ATK, DEF, SPATK, SPDEF, SPEED]
- `ivs`: table - Individual values for stat calculation
- `nature`: string - Nature affecting stat growth
- `moveset`: table - Array of PokemonMove objects
- `statusEffect`: string|nil - Current status condition
- `abilities`: table - Available abilities and current selection
- `heldItem`: string|nil - Currently held item identifier
- `battleData`: table - Temporary battle-specific data

**Relationships:**
- Belongs to Player (via party roster)
- References Species data (via speciesId)
- Contains Move data (via moveset array)
- Links to Battle data (when actively battling)

## Battle Model

**Purpose:** Manages active battle state including turn order, commands, and battle-specific conditions

**Key Attributes:**
- `battleId`: string - Unique battle session identifier
- `playerId`: string - Player wallet address
- `battleType`: string - Type of battle (WILD, TRAINER, GYM, etc.)
- `turn`: number - Current battle turn
- `battleSeed`: string - Deterministic RNG seed
- `playerParty`: table - Player's active Pokemon
- `enemyParty`: table - Enemy Pokemon data
- `turnCommands`: table - Queued player commands
- `battleState`: string - Current battle phase
- `conditions`: table - Active field conditions and effects

**Relationships:**
- Contains Pokemon instances (player and enemy parties)
- References Player progression data
- Links to Move usage history
- Connects to Item usage tracking

## Player Model

**Purpose:** Stores comprehensive player progression, save data, and game state across sessions

**Key Attributes:**
- `playerId`: string - Player wallet address (AO identity)
- `gameVersion`: string - Save data version for migration compatibility
- `progression`: table - Game progression state
- `party`: table - Current Pokemon party (up to 6)
- `pcStorage`: table - PC Pokemon storage system
- `inventory`: table - Items, money, and resources
- `pokedex`: table - Species seen/caught tracking
- `gameStats`: table - Battle wins, losses, playtime
- `settings`: table - Game preferences and options

**Relationships:**
- Owns Pokemon collection (party + PC)
- Tracks Battle participation history
- Maintains Item inventory
- Records Species discovery progress
