# Database Schema (Embedded Lua Data Structures)

## Species Database Schema

```lua
-- Species Database Structure
local SpeciesDatabase = {
  [SPECIES.CHARIZARD] = {
    speciesId = SPECIES.CHARIZARD,
    name = "Charizard",
    baseStats = {78, 84, 78, 109, 85, 100}, -- HP, ATK, DEF, SPATK, SPDEF, SPD
    types = {POKEMON_TYPE.FIRE, POKEMON_TYPE.FLYING},
    abilities = {ABILITY.BLAZE, ABILITY.SOLAR_POWER}, -- normal, hidden
    height = 17, -- decimeters
    weight = 905, -- hectograms
    
    -- Evolution data
    evolutionChain = {
      from = SPECIES.CHARMELEON,
      level = 36,
      conditions = {} -- additional evolution requirements
    },
    
    -- Learn sets
    levelMoves = {
      [1] = {MOVE.SCRATCH, MOVE.GROWL, MOVE.EMBER},
      [7] = {MOVE.SMOKESCREEN},
      [13] = {MOVE.DRAGON_RAGE},
      [36] = {MOVE.FLAMETHROWER}, -- Evolution move
    }
  }
}
```

## Player Save Data Schema

```lua
-- Player Save Data Structure
local PlayerSaveSchema = {
  -- Player identification
  playerId = "string", -- Player wallet address
  gameVersion = "string", -- Save compatibility version
  createdDate = "number", -- Unix timestamp
  lastSaved = "number", -- Unix timestamp
  
  -- Game progression
  progression = {
    waveIndex = "number", -- Current wave (1-based)
    biomeIndex = "number", -- Current biome
    gameMode = "string", -- CLASSIC, DAILY, CHALLENGE
  },
  
  -- Pokemon collection
  party = "table", -- array of up to 6 Pokemon
  pcStorage = {
    boxes = "table", -- 30+ boxes of Pokemon storage
    totalStored = "number" -- count of stored Pokemon
  },
  
  -- Save integrity
  dataIntegrity = {
    checksum = "string", -- SHA256 hash of all save data
    version = "number", -- Schema version for migration
  }
}
```
