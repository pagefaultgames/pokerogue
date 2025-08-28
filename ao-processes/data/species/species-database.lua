-- Species Database Implementation
-- Complete Pokemon species data for AO process
-- Based on TypeScript reference implementation for exact behavioral parity

-- Species data table with all Pokemon species
local SpeciesDatabase = {}

-- Initialize the species data structure
function SpeciesDatabase.init()
    -- Core species data storage - will be populated with all 800+ species
    SpeciesDatabase.species = {}
    
    -- Species lookup indexes for fast access
    SpeciesDatabase.speciesByName = {}
    SpeciesDatabase.speciesByType = {}
    
    -- Move learning indexes for fast compatibility lookups
    SpeciesDatabase.speciesByMove = {}           -- moveId -> [speciesId1, speciesId2, ...]
    SpeciesDatabase.speciesByTM = {}             -- tmMoveId -> [speciesId1, speciesId2, ...]
    SpeciesDatabase.speciesByTR = {}             -- trMoveId -> [speciesId1, speciesId2, ...]
    SpeciesDatabase.speciesByEggMove = {}        -- eggMoveId -> [speciesId1, speciesId2, ...]
    SpeciesDatabase.speciesByTutorMove = {}      -- tutorMoveId -> [speciesId1, speciesId2, ...]
    SpeciesDatabase.movesByLevel = {}            -- level -> {speciesId -> [moveId1, moveId2, ...]}
    
    -- Initialize with first batch of species data (Generation 1 examples)
    -- Following exact TypeScript PokemonSpecies constructor format
    local speciesData = {
        -- Format: [id] = {
        --   id, generation, subLegendary, legendary, mythical, category,
        --   type1, type2, height, weight, ability1, ability2, abilityHidden,
        --   baseTotal, baseHp, baseAtk, baseDef, baseSpatk, baseSpdef, baseSpd,
        --   catchRate, baseFriendship, baseExp, growthRate, malePercent, genderDiffs,
        --   name, forms
        -- }
        
        [1] = { -- BULBASAUR
            id = 1,
            generation = 1,
            subLegendary = false,
            legendary = false,
            mythical = false,
            category = "Seed Pokémon",
            type1 = "GRASS",
            type2 = "POISON",
            height = 0.7,
            weight = 6.9,
            ability1 = "OVERGROW",
            ability2 = nil,
            abilityHidden = "CHLOROPHYLL",
            baseTotal = 318,
            baseStats = {45, 49, 49, 65, 65, 45}, -- HP, ATK, DEF, SPATK, SPDEF, SPD
            catchRate = 45,
            baseFriendship = 50,
            baseExp = 64,
            growthRate = "MEDIUM_SLOW",
            malePercent = 87.5,
            genderDiffs = false,
            name = "Bulbasaur",
            -- Breeding data
            eggGroups = {"MONSTER", "GRASS"},
            hatchCycles = 20,
            canBreed = true,
            -- Encounter data
            rarity = "COMMON",
            encounterRate = 45,
            biomes = {"GRASS", "FOREST"},
            forms = {},
            -- Move learning data
            levelMoves = {
                {level = 1, moveId = 33},   -- Tackle
                {level = 3, moveId = 45},   -- Growl  
                {level = 7, moveId = 73},   -- Leech Seed
                {level = 9, moveId = 22},   -- Vine Whip
                {level = 13, moveId = 79},  -- Sleep Powder
                {level = 13, moveId = 77},  -- Poison Powder
                {level = 15, moveId = 75},  -- Razor Leaf
                {level = 19, moveId = 230}, -- Sweet Scent
                {level = 21, moveId = 74},  -- Growth
                {level = 25, moveId = 235}, -- Synthesis
                {level = 27, moveId = 80},  -- Petal Dance
                {level = 31, moveId = 76}   -- Solar Beam
            },
            tmMoves = {1, 6, 9, 10, 11, 17, 19, 20, 21, 22, 32, 42, 44, 45, 46, 75, 86, 87, 90, 96, 104},
            trMoves = {},
            eggMoves = {23, 38, 51, 72, 113, 150, 202, 230, 235, 267, 275, 312, 345, 388, 437, 447, 496},
            tutorMoves = {9, 10, 75, 77, 79, 80, 86, 235, 267, 437}
        },
        
        [2] = { -- IVYSAUR
            id = 2,
            generation = 1,
            subLegendary = false,
            legendary = false,
            mythical = false,
            category = "Seed Pokémon",
            type1 = "GRASS",
            type2 = "POISON",
            height = 1.0,
            weight = 13.0,
            ability1 = "OVERGROW",
            ability2 = nil,
            abilityHidden = "CHLOROPHYLL",
            baseTotal = 405,
            baseStats = {60, 62, 63, 80, 80, 60}, -- HP, ATK, DEF, SPATK, SPDEF, SPD
            catchRate = 45,
            baseFriendship = 50,
            baseExp = 142,
            growthRate = "MEDIUM_SLOW",
            malePercent = 87.5,
            genderDiffs = false,
            name = "Ivysaur",
            -- Breeding data
            eggGroups = {"MONSTER", "GRASS"},
            hatchCycles = 20,
            canBreed = true,
            -- Encounter data
            rarity = "UNCOMMON",
            encounterRate = 15,
            biomes = {"GRASS", "FOREST"},
            forms = {},
            -- Move learning data
            levelMoves = {
                {level = 1, moveId = 33},   -- Tackle
                {level = 1, moveId = 45},   -- Growl
                {level = 1, moveId = 73},   -- Leech Seed
                {level = 1, moveId = 22},   -- Vine Whip
                {level = 15, moveId = 79},  -- Sleep Powder
                {level = 15, moveId = 77},  -- Poison Powder
                {level = 20, moveId = 75},  -- Razor Leaf
                {level = 25, moveId = 230}, -- Sweet Scent
                {level = 28, moveId = 74},  -- Growth
                {level = 35, moveId = 235}, -- Synthesis
                {level = 38, moveId = 80},  -- Petal Dance
                {level = 44, moveId = 76}   -- Solar Beam
            },
            tmMoves = {1, 6, 9, 10, 11, 17, 19, 20, 21, 22, 32, 42, 44, 45, 46, 75, 86, 87, 90, 96, 104},
            trMoves = {},
            eggMoves = {23, 38, 51, 72, 113, 150, 202, 230, 235, 267, 275, 312, 345, 388, 437, 447, 496},
            tutorMoves = {9, 10, 75, 77, 79, 80, 86, 235, 267, 437}
        },
        
        [3] = { -- VENUSAUR
            id = 3,
            generation = 1,
            subLegendary = false,
            legendary = false,
            mythical = false,
            category = "Seed Pokémon",
            type1 = "GRASS",
            type2 = "POISON",
            height = 2.0,
            weight = 100.0,
            ability1 = "OVERGROW",
            ability2 = nil,
            abilityHidden = "CHLOROPHYLL",
            baseTotal = 525,
            baseStats = {80, 82, 83, 100, 100, 80}, -- HP, ATK, DEF, SPATK, SPDEF, SPD
            catchRate = 45,
            baseFriendship = 50,
            baseExp = 236,
            growthRate = "MEDIUM_SLOW",
            malePercent = 87.5,
            genderDiffs = false,
            name = "Venusaur",
            -- Breeding data
            eggGroups = {"MONSTER", "GRASS"},
            hatchCycles = 20,
            canBreed = true,
            -- Encounter data
            rarity = "RARE",
            encounterRate = 5,
            biomes = {"GRASS", "FOREST"},
            forms = {},
            -- Move learning data
            levelMoves = {
                {level = 1, moveId = 33},   -- Tackle
                {level = 1, moveId = 45},   -- Growl
                {level = 1, moveId = 73},   -- Leech Seed
                {level = 1, moveId = 22},   -- Vine Whip
                {level = 15, moveId = 79},  -- Sleep Powder
                {level = 15, moveId = 77},  -- Poison Powder
                {level = 20, moveId = 75},  -- Razor Leaf
                {level = 25, moveId = 230}, -- Sweet Scent
                {level = 28, moveId = 74},  -- Growth
                {level = 35, moveId = 235}, -- Synthesis
                {level = 40, moveId = 80},  -- Petal Dance
                {level = 50, moveId = 76}   -- Solar Beam
            },
            tmMoves = {1, 6, 9, 10, 11, 15, 17, 19, 20, 21, 22, 26, 32, 42, 44, 45, 46, 68, 75, 86, 87, 90, 96, 104},
            trMoves = {11, 17, 20, 22, 26, 59, 65, 71, 77, 85},
            eggMoves = {23, 38, 51, 72, 113, 150, 202, 230, 235, 267, 275, 312, 345, 388, 437, 447, 496},
            tutorMoves = {9, 10, 15, 68, 75, 77, 79, 80, 86, 235, 267, 437}
        },
        
        [4] = { -- CHARMANDER
            id = 4,
            generation = 1,
            subLegendary = false,
            legendary = false,
            mythical = false,
            category = "Lizard Pokémon",
            type1 = "FIRE",
            type2 = nil,
            height = 0.6,
            weight = 8.5,
            ability1 = "BLAZE",
            ability2 = nil,
            abilityHidden = "SOLAR_POWER",
            baseTotal = 309,
            baseStats = {39, 52, 43, 60, 50, 65}, -- HP, ATK, DEF, SPATK, SPDEF, SPD
            catchRate = 45,
            baseFriendship = 50,
            baseExp = 62,
            growthRate = "MEDIUM_SLOW",
            malePercent = 87.5,
            genderDiffs = false,
            name = "Charmander",
            -- Breeding data
            eggGroups = {"MONSTER", "DRAGON"},
            hatchCycles = 20,
            canBreed = true,
            -- Encounter data
            rarity = "COMMON",
            encounterRate = 45,
            biomes = {"VOLCANIC", "MOUNTAIN"},
            forms = {},
            -- Move learning data
            levelMoves = {
                {level = 1, moveId = 10},   -- Scratch
                {level = 1, moveId = 45},   -- Growl
                {level = 7, moveId = 52},   -- Ember
                {level = 10, moveId = 43},  -- Leer
                {level = 16, moveId = 99},  -- Rage
                {level = 19, moveId = 108}, -- Smokescreen
                {level = 25, moveId = 163}, -- Slash
                {level = 28, moveId = 83},  -- Fire Spin
                {level = 34, moveId = 242}  -- Flamethrower
            },
            tmMoves = {1, 6, 8, 10, 11, 17, 18, 21, 23, 28, 31, 32, 35, 38, 40, 42, 43, 44, 45, 46, 50, 54, 56, 58, 61, 65, 75, 78, 80, 82, 83, 87, 90, 91, 93, 94, 96, 100},
            trMoves = {},
            eggMoves = {37, 52, 98, 116, 219, 252, 307, 349, 387, 394, 414, 424, 444, 468},
            tutorMoves = {7, 8, 9, 24, 25, 38, 46, 50, 58, 78, 80, 83, 98}
        },
        
        [5] = { -- CHARMELEON
            id = 5,
            generation = 1,
            subLegendary = false,
            legendary = false,
            mythical = false,
            category = "Flame Pokémon",
            type1 = "FIRE",
            type2 = nil,
            height = 1.1,
            weight = 19.0,
            ability1 = "BLAZE",
            ability2 = nil,
            abilityHidden = "SOLAR_POWER",
            baseTotal = 405,
            baseStats = {58, 64, 58, 80, 65, 80}, -- HP, ATK, DEF, SPATK, SPDEF, SPD
            catchRate = 45,
            baseFriendship = 50,
            baseExp = 142,
            growthRate = "MEDIUM_SLOW",
            malePercent = 87.5,
            genderDiffs = false,
            name = "Charmeleon",
            -- Breeding data
            eggGroups = {"MONSTER", "DRAGON"},
            hatchCycles = 20,
            canBreed = true,
            -- Encounter data
            rarity = "UNCOMMON",
            encounterRate = 15,
            biomes = {"VOLCANIC", "MOUNTAIN"},
            forms = {},
            -- Move learning data
            levelMoves = {
                {level = 1, moveId = 10},   -- Scratch
                {level = 1, moveId = 45},   -- Growl
                {level = 1, moveId = 52},   -- Ember
                {level = 1, moveId = 43},   -- Leer
                {level = 17, moveId = 99},  -- Rage
                {level = 20, moveId = 108}, -- Smokescreen
                {level = 27, moveId = 163}, -- Slash
                {level = 31, moveId = 83},  -- Fire Spin
                {level = 39, moveId = 242}  -- Flamethrower
            },
            tmMoves = {1, 6, 8, 10, 11, 17, 18, 21, 23, 28, 31, 32, 35, 38, 40, 42, 43, 44, 45, 46, 50, 54, 56, 58, 61, 65, 75, 78, 80, 82, 83, 87, 90, 91, 93, 94, 96, 100},
            trMoves = {},
            eggMoves = {37, 52, 98, 116, 219, 252, 307, 349, 387, 394, 414, 424, 444, 468},
            tutorMoves = {7, 8, 9, 24, 25, 38, 46, 50, 58, 78, 80, 83, 98}
        },
        
        [6] = { -- CHARIZARD
            id = 6,
            generation = 1,
            subLegendary = false,
            legendary = false,
            mythical = false,
            category = "Flame Pokémon",
            type1 = "FIRE",
            type2 = "FLYING",
            height = 1.7,
            weight = 90.5,
            ability1 = "BLAZE",
            ability2 = nil,
            abilityHidden = "SOLAR_POWER",
            baseTotal = 534,
            baseStats = {78, 84, 78, 109, 85, 100}, -- HP, ATK, DEF, SPATK, SPDEF, SPD
            catchRate = 45,
            baseFriendship = 50,
            baseExp = 240,
            growthRate = "MEDIUM_SLOW",
            malePercent = 87.5,
            genderDiffs = false,
            name = "Charizard",
            -- Breeding data
            eggGroups = {"MONSTER", "DRAGON"},
            hatchCycles = 20,
            canBreed = true,
            -- Encounter data
            rarity = "RARE",
            encounterRate = 5,
            biomes = {"VOLCANIC", "MOUNTAIN"},
            forms = {},
            -- Move learning data
            levelMoves = {
                {level = 1, moveId = 10},   -- Scratch
                {level = 1, moveId = 45},   -- Growl
                {level = 1, moveId = 52},   -- Ember
                {level = 1, moveId = 43},   -- Leer
                {level = 17, moveId = 99},  -- Rage
                {level = 20, moveId = 108}, -- Smokescreen
                {level = 27, moveId = 163}, -- Slash
                {level = 31, moveId = 83},  -- Fire Spin
                {level = 36, moveId = 17},  -- Wing Attack
                {level = 41, moveId = 242}, -- Flamethrower
                {level = 46, moveId = 119}  -- Fire Blast
            },
            tmMoves = {1, 6, 8, 10, 11, 15, 17, 18, 19, 20, 21, 23, 26, 27, 28, 31, 32, 35, 38, 40, 42, 43, 44, 45, 46, 47, 50, 54, 56, 58, 61, 65, 68, 75, 78, 80, 82, 83, 87, 90, 91, 93, 94, 96, 100},
            trMoves = {2, 13, 15, 20, 27, 31, 35, 37, 43, 47, 56, 68, 85, 99},
            eggMoves = {37, 52, 98, 116, 219, 252, 307, 349, 387, 394, 414, 424, 444, 468},
            tutorMoves = {7, 8, 9, 15, 24, 25, 38, 46, 47, 50, 58, 68, 78, 80, 83, 98}
        },
        
        [7] = { -- SQUIRTLE
            id = 7,
            generation = 1,
            subLegendary = false,
            legendary = false,
            mythical = false,
            category = "Tiny Turtle Pokémon",
            type1 = "WATER",
            type2 = nil,
            height = 0.5,
            weight = 9.0,
            ability1 = "TORRENT",
            ability2 = nil,
            abilityHidden = "RAIN_DISH",
            baseTotal = 314,
            baseStats = {44, 48, 65, 50, 64, 43}, -- HP, ATK, DEF, SPATK, SPDEF, SPD
            catchRate = 45,
            baseFriendship = 50,
            baseExp = 63,
            growthRate = "MEDIUM_SLOW",
            malePercent = 87.5,
            genderDiffs = false,
            name = "Squirtle",
            -- Breeding data
            eggGroups = {"MONSTER", "WATER_1"},
            hatchCycles = 20,
            canBreed = true,
            -- Encounter data
            rarity = "COMMON",
            encounterRate = 45,
            biomes = {"WATER", "POND"},
            forms = {},
            -- Move learning data
            levelMoves = {
                {level = 1, moveId = 33},   -- Tackle
                {level = 4, moveId = 110},  -- Withdraw
                {level = 7, moveId = 55},   -- Water Gun
                {level = 10, moveId = 39},  -- Tail Whip
                {level = 13, moveId = 145}, -- Bubble
                {level = 18, moveId = 44},  -- Bite
                {level = 23, moveId = 56},  -- Hydro Pump
                {level = 28, moveId = 130}  -- Skull Bash
            },
            tmMoves = {1, 3, 6, 7, 8, 10, 11, 13, 14, 17, 18, 21, 23, 26, 27, 28, 31, 32, 33, 39, 42, 44, 45, 46, 55, 56, 58, 78, 82, 87, 90, 91, 94, 96, 98, 99},
            trMoves = {},
            eggMoves = {54, 62, 111, 130, 145, 174, 191, 243, 250, 300, 313, 352, 362, 392, 401, 503, 523},
            tutorMoves = {3, 7, 8, 13, 33, 44, 55, 56, 58, 78, 96, 99}
        }
        
        -- Note: This is a foundational structure. 
        -- Full database will be populated with all 800+ species following this exact format
    }
    
    -- Populate main species table and build indexes
    for id, data in pairs(speciesData) do
        SpeciesDatabase.species[id] = data
        
        -- Build name-based lookup index (case insensitive)
        local nameKey = string.lower(data.name)
        SpeciesDatabase.speciesByName[nameKey] = id
        
        -- Build type-based lookup indexes
        if not SpeciesDatabase.speciesByType[data.type1] then
            SpeciesDatabase.speciesByType[data.type1] = {}
        end
        table.insert(SpeciesDatabase.speciesByType[data.type1], id)
        
        if data.type2 then
            if not SpeciesDatabase.speciesByType[data.type2] then
                SpeciesDatabase.speciesByType[data.type2] = {}
            end
            table.insert(SpeciesDatabase.speciesByType[data.type2], id)
        end
        
        -- Build move learning indexes
        SpeciesDatabase.buildMoveLearningIndexes(id, data)
    end
end

-- Build move learning indexes for a species
-- @param speciesId: Species ID
-- @param speciesData: Species data
function SpeciesDatabase.buildMoveLearningIndexes(speciesId, speciesData)
    -- Index level moves
    if speciesData.levelMoves then
        for _, moveEntry in ipairs(speciesData.levelMoves) do
            local moveId = moveEntry.moveId
            local level = moveEntry.level
            
            -- Index by move ID
            if not SpeciesDatabase.speciesByMove[moveId] then
                SpeciesDatabase.speciesByMove[moveId] = {}
            end
            table.insert(SpeciesDatabase.speciesByMove[moveId], speciesId)
            
            -- Index by level
            if not SpeciesDatabase.movesByLevel[level] then
                SpeciesDatabase.movesByLevel[level] = {}
            end
            if not SpeciesDatabase.movesByLevel[level][speciesId] then
                SpeciesDatabase.movesByLevel[level][speciesId] = {}
            end
            table.insert(SpeciesDatabase.movesByLevel[level][speciesId], moveId)
        end
    end
    
    -- Index TM moves
    if speciesData.tmMoves then
        for _, moveId in ipairs(speciesData.tmMoves) do
            if not SpeciesDatabase.speciesByTM[moveId] then
                SpeciesDatabase.speciesByTM[moveId] = {}
            end
            table.insert(SpeciesDatabase.speciesByTM[moveId], speciesId)
            
            -- Also add to general move index
            if not SpeciesDatabase.speciesByMove[moveId] then
                SpeciesDatabase.speciesByMove[moveId] = {}
            end
            table.insert(SpeciesDatabase.speciesByMove[moveId], speciesId)
        end
    end
    
    -- Index TR moves
    if speciesData.trMoves then
        for _, moveId in ipairs(speciesData.trMoves) do
            if not SpeciesDatabase.speciesByTR[moveId] then
                SpeciesDatabase.speciesByTR[moveId] = {}
            end
            table.insert(SpeciesDatabase.speciesByTR[moveId], speciesId)
            
            -- Also add to general move index
            if not SpeciesDatabase.speciesByMove[moveId] then
                SpeciesDatabase.speciesByMove[moveId] = {}
            end
            table.insert(SpeciesDatabase.speciesByMove[moveId], speciesId)
        end
    end
    
    -- Index egg moves
    if speciesData.eggMoves then
        for _, moveId in ipairs(speciesData.eggMoves) do
            if not SpeciesDatabase.speciesByEggMove[moveId] then
                SpeciesDatabase.speciesByEggMove[moveId] = {}
            end
            table.insert(SpeciesDatabase.speciesByEggMove[moveId], speciesId)
            
            -- Also add to general move index
            if not SpeciesDatabase.speciesByMove[moveId] then
                SpeciesDatabase.speciesByMove[moveId] = {}
            end
            table.insert(SpeciesDatabase.speciesByMove[moveId], speciesId)
        end
    end
    
    -- Index tutor moves
    if speciesData.tutorMoves then
        for _, moveId in ipairs(speciesData.tutorMoves) do
            if not SpeciesDatabase.speciesByTutorMove[moveId] then
                SpeciesDatabase.speciesByTutorMove[moveId] = {}
            end
            table.insert(SpeciesDatabase.speciesByTutorMove[moveId], speciesId)
            
            -- Also add to general move index
            if not SpeciesDatabase.speciesByMove[moveId] then
                SpeciesDatabase.speciesByMove[moveId] = {}
            end
            table.insert(SpeciesDatabase.speciesByMove[moveId], speciesId)
        end
    end
end

-- Get species data by ID
-- @param speciesId: Species ID number
-- @return: Species data table or nil if not found
function SpeciesDatabase.getSpecies(speciesId)
    return SpeciesDatabase.species[speciesId]
end

-- Get species data by name (case insensitive)
-- @param name: Species name string
-- @return: Species data table or nil if not found
function SpeciesDatabase.getSpeciesByName(name)
    local nameKey = string.lower(name)
    local speciesId = SpeciesDatabase.speciesByName[nameKey]
    if speciesId then
        return SpeciesDatabase.species[speciesId]
    end
    return nil
end

-- Get all species of a specific type
-- @param pokemonType: Type string (e.g., "FIRE", "WATER")
-- @return: Array of species IDs matching the type
function SpeciesDatabase.getSpeciesByType(pokemonType)
    return SpeciesDatabase.speciesByType[pokemonType] or {}
end

-- Get base stats for a species (returns array in exact order: HP, ATK, DEF, SPATK, SPDEF, SPD)
-- @param speciesId: Species ID number
-- @return: Base stats array or nil if species not found
function SpeciesDatabase.getBaseStats(speciesId)
    local species = SpeciesDatabase.species[speciesId]
    if species then
        return species.baseStats
    end
    return nil
end

-- Validate species data integrity
-- @param speciesId: Species ID number
-- @return: Boolean indicating if species data is valid and complete
function SpeciesDatabase.validateSpeciesData(speciesId)
    local species = SpeciesDatabase.species[speciesId]
    if not species then
        return false
    end
    
    -- Validate required fields
    local requiredFields = {
        "id", "generation", "category", "type1", "height", "weight",
        "ability1", "baseTotal", "baseStats", "catchRate", "baseFriendship",
        "baseExp", "growthRate", "name"
    }
    
    for _, field in ipairs(requiredFields) do
        if species[field] == nil then
            return false
        end
    end
    
    -- Validate base stats array
    if type(species.baseStats) ~= "table" or #species.baseStats ~= 6 then
        return false
    end
    
    -- Validate base stats are numbers and non-negative
    for i, stat in ipairs(species.baseStats) do
        if type(stat) ~= "number" or stat < 0 then
            return false
        end
    end
    
    return true
end

-- Get total number of species in database
-- @return: Number of species loaded
function SpeciesDatabase.getSpeciesCount()
    local count = 0
    for _ in pairs(SpeciesDatabase.species) do
        count = count + 1
    end
    return count
end

-- Get all species IDs in database
-- @return: Array of all species IDs
function SpeciesDatabase.getAllSpeciesIds()
    local ids = {}
    for id in pairs(SpeciesDatabase.species) do
        table.insert(ids, id)
    end
    table.sort(ids) -- Sort numerically for consistent ordering
    return ids
end

-- Check if species exists in database
-- @param speciesId: Species ID number
-- @return: Boolean indicating if species exists
function SpeciesDatabase.speciesExists(speciesId)
    return SpeciesDatabase.species[speciesId] ~= nil
end

-- Breeding compatibility functions
-- Check if two species can breed
-- @param species1Id: First species ID
-- @param species2Id: Second species ID
-- @return: Boolean indicating if species can breed
function SpeciesDatabase.canBreedTogether(species1Id, species2Id)
    local species1 = SpeciesDatabase.getSpecies(species1Id)
    local species2 = SpeciesDatabase.getSpecies(species2Id)
    
    if not species1 or not species2 then
        return false
    end
    
    -- Check if both can breed
    if not species1.canBreed or not species2.canBreed then
        return false
    end
    
    -- Same species can always breed (if not genderless)
    if species1Id == species2Id then
        return species1.malePercent and species1.malePercent > 0 and species1.malePercent < 100
    end
    
    -- Check egg group compatibility
    for _, group1 in ipairs(species1.eggGroups or {}) do
        for _, group2 in ipairs(species2.eggGroups or {}) do
            if group1 == group2 and group1 ~= "UNDISCOVERED" then
                return true
            end
        end
    end
    
    return false
end

-- Get egg groups for a species
-- @param speciesId: Species ID
-- @return: Array of egg group names
function SpeciesDatabase.getEggGroups(speciesId)
    local species = SpeciesDatabase.getSpecies(speciesId)
    return species and species.eggGroups or {}
end

-- Get species by egg group
-- @param eggGroup: Egg group name
-- @return: Array of species IDs in the egg group
function SpeciesDatabase.getSpeciesByEggGroup(eggGroup)
    local result = {}
    for id, species in pairs(SpeciesDatabase.species) do
        if species.eggGroups then
            for _, group in ipairs(species.eggGroups) do
                if group == eggGroup then
                    table.insert(result, id)
                    break
                end
            end
        end
    end
    table.sort(result)
    return result
end

-- Encounter data functions
-- Get species rarity
-- @param speciesId: Species ID
-- @return: Rarity string or nil
function SpeciesDatabase.getRarity(speciesId)
    local species = SpeciesDatabase.getSpecies(speciesId)
    return species and species.rarity
end

-- Get species encounter rate
-- @param speciesId: Species ID
-- @return: Encounter rate number or nil
function SpeciesDatabase.getEncounterRate(speciesId)
    local species = SpeciesDatabase.getSpecies(speciesId)
    return species and species.encounterRate
end

-- Get species biomes
-- @param speciesId: Species ID
-- @return: Array of biome names or empty array
function SpeciesDatabase.getBiomes(speciesId)
    local species = SpeciesDatabase.getSpecies(speciesId)
    return species and species.biomes or {}
end

-- Get species by biome
-- @param biome: Biome name
-- @return: Array of species IDs found in the biome
function SpeciesDatabase.getSpeciesByBiome(biome)
    local result = {}
    for id, species in pairs(SpeciesDatabase.species) do
        if species.biomes then
            for _, speciesBiome in ipairs(species.biomes) do
                if speciesBiome == biome then
                    table.insert(result, id)
                    break
                end
            end
        end
    end
    table.sort(result)
    return result
end

-- Get species by rarity
-- @param rarity: Rarity string
-- @return: Array of species IDs with the specified rarity
function SpeciesDatabase.getSpeciesByRarity(rarity)
    local result = {}
    for id, species in pairs(SpeciesDatabase.species) do
        if species.rarity == rarity then
            table.insert(result, id)
        end
    end
    table.sort(result)
    return result
end

-- Validate breeding data
-- @param speciesId: Species ID
-- @return: Boolean indicating if breeding data is valid, error message if invalid
function SpeciesDatabase.validateBreedingData(speciesId)
    local species = SpeciesDatabase.getSpecies(speciesId)
    if not species then
        return false, "Species not found"
    end
    
    -- Check egg groups
    if species.eggGroups and type(species.eggGroups) ~= "table" then
        return false, "Egg groups must be array"
    end
    
    -- Check hatch cycles
    if species.hatchCycles and (type(species.hatchCycles) ~= "number" or species.hatchCycles < 0) then
        return false, "Hatch cycles must be non-negative number"
    end
    
    return true
end

-- Validate encounter data
-- @param speciesId: Species ID
-- @return: Boolean indicating if encounter data is valid, error message if invalid
function SpeciesDatabase.validateEncounterData(speciesId)
    local species = SpeciesDatabase.getSpecies(speciesId)
    if not species then
        return false, "Species not found"
    end
    
    -- Check encounter rate
    if species.encounterRate and (type(species.encounterRate) ~= "number" or species.encounterRate < 0 or species.encounterRate > 100) then
        return false, "Encounter rate must be number between 0-100"
    end
    
    -- Check biomes
    if species.biomes and type(species.biomes) ~= "table" then
        return false, "Biomes must be array"
    end
    
    return true
end

-- Move Learning Validation Functions

-- Validate move learning data for a species
-- @param speciesId: Species ID
-- @return: Boolean indicating if move learning data is valid, error message if invalid
function SpeciesDatabase.validateMoveLearningData(speciesId)
    local species = SpeciesDatabase.getSpecies(speciesId)
    if not species then
        return false, "Species not found"
    end
    
    -- Validate level moves structure
    if species.levelMoves then
        if type(species.levelMoves) ~= "table" then
            return false, "levelMoves must be array"
        end
        
        for i, moveEntry in ipairs(species.levelMoves) do
            if type(moveEntry) ~= "table" then
                return false, "levelMoves entry " .. i .. " must be table"
            end
            
            if not moveEntry.level or type(moveEntry.level) ~= "number" or moveEntry.level < 1 then
                return false, "levelMoves entry " .. i .. " must have valid level (number >= 1)"
            end
            
            if not moveEntry.moveId or type(moveEntry.moveId) ~= "number" or moveEntry.moveId < 1 then
                return false, "levelMoves entry " .. i .. " must have valid moveId (number >= 1)"
            end
        end
    end
    
    -- Validate TM moves structure
    if species.tmMoves then
        if type(species.tmMoves) ~= "table" then
            return false, "tmMoves must be array"
        end
        
        for i, moveId in ipairs(species.tmMoves) do
            if type(moveId) ~= "number" or moveId < 1 then
                return false, "tmMoves entry " .. i .. " must be valid moveId (number >= 1)"
            end
        end
    end
    
    -- Validate TR moves structure
    if species.trMoves then
        if type(species.trMoves) ~= "table" then
            return false, "trMoves must be array"
        end
        
        for i, moveId in ipairs(species.trMoves) do
            if type(moveId) ~= "number" or moveId < 1 then
                return false, "trMoves entry " .. i .. " must be valid moveId (number >= 1)"
            end
        end
    end
    
    -- Validate egg moves structure
    if species.eggMoves then
        if type(species.eggMoves) ~= "table" then
            return false, "eggMoves must be array"
        end
        
        for i, moveId in ipairs(species.eggMoves) do
            if type(moveId) ~= "number" or moveId < 1 then
                return false, "eggMoves entry " .. i .. " must be valid moveId (number >= 1)"
            end
        end
    end
    
    -- Validate tutor moves structure
    if species.tutorMoves then
        if type(species.tutorMoves) ~= "table" then
            return false, "tutorMoves must be array"
        end
        
        for i, moveId in ipairs(species.tutorMoves) do
            if type(moveId) ~= "number" or moveId < 1 then
                return false, "tutorMoves entry " .. i .. " must be valid moveId (number >= 1)"
            end
        end
    end
    
    return true
end

-- Check if species can learn a move through any method
-- @param speciesId: Species ID
-- @param moveId: Move ID to check
-- @param method: Optional learning method filter ("level", "tm", "tr", "egg", "tutor", "any")
-- @return: Boolean indicating if move can be learned, learning method found
function SpeciesDatabase.canLearnMove(speciesId, moveId, method)
    local species = SpeciesDatabase.getSpecies(speciesId)
    if not species or not moveId then
        return false, nil
    end
    
    method = method or "any"
    
    -- Check level moves
    if (method == "any" or method == "level") and species.levelMoves then
        for _, moveEntry in ipairs(species.levelMoves) do
            if moveEntry.moveId == moveId then
                return true, "level"
            end
        end
    end
    
    -- Check TM moves
    if (method == "any" or method == "tm") and species.tmMoves then
        for _, tmMoveId in ipairs(species.tmMoves) do
            if tmMoveId == moveId then
                return true, "tm"
            end
        end
    end
    
    -- Check TR moves
    if (method == "any" or method == "tr") and species.trMoves then
        for _, trMoveId in ipairs(species.trMoves) do
            if trMoveId == moveId then
                return true, "tr"
            end
        end
    end
    
    -- Check egg moves
    if (method == "any" or method == "egg") and species.eggMoves then
        for _, eggMoveId in ipairs(species.eggMoves) do
            if eggMoveId == moveId then
                return true, "egg"
            end
        end
    end
    
    -- Check tutor moves
    if (method == "any" or method == "tutor") and species.tutorMoves then
        for _, tutorMoveId in ipairs(species.tutorMoves) do
            if tutorMoveId == moveId then
                return true, "tutor"
            end
        end
    end
    
    return false, nil
end

-- Get level at which a move is learned
-- @param speciesId: Species ID  
-- @param moveId: Move ID to check
-- @return: Level at which move is learned, or nil if not learned by leveling
function SpeciesDatabase.getMoveLearnLevel(speciesId, moveId)
    local species = SpeciesDatabase.getSpecies(speciesId)
    if not species or not moveId or not species.levelMoves then
        return nil
    end
    
    for _, moveEntry in ipairs(species.levelMoves) do
        if moveEntry.moveId == moveId then
            return moveEntry.level
        end
    end
    
    return nil
end

-- Get all moves learnable at a specific level
-- @param speciesId: Species ID
-- @param level: Level to check
-- @return: Array of move IDs learnable at that level
function SpeciesDatabase.getMovesAtLevel(speciesId, level)
    local species = SpeciesDatabase.getSpecies(speciesId)
    if not species or not level or not species.levelMoves then
        return {}
    end
    
    local moves = {}
    for _, moveEntry in ipairs(species.levelMoves) do
        if moveEntry.level == level then
            table.insert(moves, moveEntry.moveId)
        end
    end
    
    return moves
end

-- Get all moves learnable up to a specific level
-- @param speciesId: Species ID
-- @param maxLevel: Maximum level to check
-- @return: Array of move entries {moveId, level} learnable up to that level
function SpeciesDatabase.getMovesUpToLevel(speciesId, maxLevel)
    local species = SpeciesDatabase.getSpecies(speciesId)
    if not species or not maxLevel or not species.levelMoves then
        return {}
    end
    
    local moves = {}
    for _, moveEntry in ipairs(species.levelMoves) do
        if moveEntry.level <= maxLevel then
            table.insert(moves, {
                moveId = moveEntry.moveId,
                level = moveEntry.level
            })
        end
    end
    
    -- Sort by level
    table.sort(moves, function(a, b) return a.level < b.level end)
    
    return moves
end

-- Check if species is compatible with TM
-- @param speciesId: Species ID
-- @param tmMoveId: TM move ID
-- @return: Boolean indicating TM compatibility
function SpeciesDatabase.isTMCompatible(speciesId, tmMoveId)
    local species = SpeciesDatabase.getSpecies(speciesId)
    if not species or not tmMoveId or not species.tmMoves then
        return false
    end
    
    for _, moveId in ipairs(species.tmMoves) do
        if moveId == tmMoveId then
            return true
        end
    end
    
    return false
end

-- Check if species is compatible with TR
-- @param speciesId: Species ID
-- @param trMoveId: TR move ID
-- @return: Boolean indicating TR compatibility
function SpeciesDatabase.isTRCompatible(speciesId, trMoveId)
    local species = SpeciesDatabase.getSpecies(speciesId)
    if not species or not trMoveId or not species.trMoves then
        return false
    end
    
    for _, moveId in ipairs(species.trMoves) do
        if moveId == trMoveId then
            return true
        end
    end
    
    return false
end

-- Get all learnable moves for a species organized by method
-- @param speciesId: Species ID
-- @return: Table with moves organized by learning method
function SpeciesDatabase.getAllLearnableMoves(speciesId)
    local species = SpeciesDatabase.getSpecies(speciesId)
    if not species then
        return {}
    end
    
    local result = {
        level = {},
        tm = {},
        tr = {},
        egg = {},
        tutor = {}
    }
    
    -- Level moves
    if species.levelMoves then
        for _, moveEntry in ipairs(species.levelMoves) do
            table.insert(result.level, {
                moveId = moveEntry.moveId,
                level = moveEntry.level
            })
        end
        -- Sort by level
        table.sort(result.level, function(a, b) return a.level < b.level end)
    end
    
    -- TM moves
    if species.tmMoves then
        for _, moveId in ipairs(species.tmMoves) do
            table.insert(result.tm, moveId)
        end
    end
    
    -- TR moves
    if species.trMoves then
        for _, moveId in ipairs(species.trMoves) do
            table.insert(result.tr, moveId)
        end
    end
    
    -- Egg moves
    if species.eggMoves then
        for _, moveId in ipairs(species.eggMoves) do
            table.insert(result.egg, moveId)
        end
    end
    
    -- Tutor moves
    if species.tutorMoves then
        for _, moveId in ipairs(species.tutorMoves) do
            table.insert(result.tutor, moveId)
        end
    end
    
    return result
end

-- Fast Compatibility Lookup Functions (using indexes)

-- Get all species that can learn a specific move (any method)
-- @param moveId: Move ID to search for
-- @return: Array of species IDs that can learn the move
function SpeciesDatabase.getSpeciesByMove(moveId)
    return SpeciesDatabase.speciesByMove[moveId] or {}
end

-- Get all species that can learn a move via TM
-- @param moveId: TM move ID to search for
-- @return: Array of species IDs compatible with the TM
function SpeciesDatabase.getSpeciesByTM(moveId)
    return SpeciesDatabase.speciesByTM[moveId] or {}
end

-- Get all species that can learn a move via TR
-- @param moveId: TR move ID to search for
-- @return: Array of species IDs compatible with the TR
function SpeciesDatabase.getSpeciesByTR(moveId)
    return SpeciesDatabase.speciesByTR[moveId] or {}
end

-- Get all species that have a move as an egg move
-- @param moveId: Egg move ID to search for
-- @return: Array of species IDs that have this as an egg move
function SpeciesDatabase.getSpeciesByEggMove(moveId)
    return SpeciesDatabase.speciesByEggMove[moveId] or {}
end

-- Get all species that can learn a move via tutor
-- @param moveId: Tutor move ID to search for
-- @return: Array of species IDs that can learn from move tutor
function SpeciesDatabase.getSpeciesByTutorMove(moveId)
    return SpeciesDatabase.speciesByTutorMove[moveId] or {}
end

-- Get all moves learned by all species at a specific level
-- @param level: Level to check
-- @return: Table with speciesId -> [moveId1, moveId2, ...]
function SpeciesDatabase.getAllMovesAtLevel(level)
    return SpeciesDatabase.movesByLevel[level] or {}
end

-- Get all species that learn any move at a specific level
-- @param level: Level to check
-- @return: Array of species IDs that learn moves at this level
function SpeciesDatabase.getSpeciesWithMovesAtLevel(level)
    local result = {}
    local movesAtLevel = SpeciesDatabase.movesByLevel[level] or {}
    
    for speciesId, _ in pairs(movesAtLevel) do
        table.insert(result, speciesId)
    end
    
    table.sort(result)
    return result
end

-- Fast move compatibility checking using indexes
-- @param moveId: Move ID to check
-- @param method: Learning method ("tm", "tr", "egg", "tutor", "level", "any")
-- @return: Table with method -> [speciesId1, speciesId2, ...]
function SpeciesDatabase.getMoveCompatibility(moveId, method)
    local result = {}
    
    if method == "any" or method == "tm" then
        result.tm = SpeciesDatabase.getSpeciesByTM(moveId)
    end
    
    if method == "any" or method == "tr" then
        result.tr = SpeciesDatabase.getSpeciesByTR(moveId)
    end
    
    if method == "any" or method == "egg" then
        result.egg = SpeciesDatabase.getSpeciesByEggMove(moveId)
    end
    
    if method == "any" or method == "tutor" then
        result.tutor = SpeciesDatabase.getSpeciesByTutorMove(moveId)
    end
    
    if method == "any" or method == "level" then
        -- For level moves, need to check all species manually
        result.level = {}
        for speciesId, species in pairs(SpeciesDatabase.species) do
            if species.levelMoves then
                for _, moveEntry in ipairs(species.levelMoves) do
                    if moveEntry.moveId == moveId then
                        table.insert(result.level, speciesId)
                        break
                    end
                end
            end
        end
    end
    
    if method == "any" then
        -- Combine all compatible species (remove duplicates)
        local allSpecies = {}
        local seen = {}
        
        for _, methodSpecies in pairs(result) do
            for _, speciesId in ipairs(methodSpecies) do
                if not seen[speciesId] then
                    seen[speciesId] = true
                    table.insert(allSpecies, speciesId)
                end
            end
        end
        
        table.sort(allSpecies)
        result.any = allSpecies
    end
    
    return result
end

-- Get move learning statistics
-- @return: Table with move learning statistics
function SpeciesDatabase.getMoveLearningStats()
    local stats = {
        totalSpecies = 0,
        speciesWithLevelMoves = 0,
        speciesWithTMMoves = 0,
        speciesWithTRMoves = 0,
        speciesWithEggMoves = 0,
        speciesWithTutorMoves = 0,
        totalMoveEntries = 0,
        uniqueMovesInDatabase = 0
    }
    
    local uniqueMoves = {}
    
    for speciesId, species in pairs(SpeciesDatabase.species) do
        stats.totalSpecies = stats.totalSpecies + 1
        
        if species.levelMoves and #species.levelMoves > 0 then
            stats.speciesWithLevelMoves = stats.speciesWithLevelMoves + 1
            stats.totalMoveEntries = stats.totalMoveEntries + #species.levelMoves
            
            for _, moveEntry in ipairs(species.levelMoves) do
                uniqueMoves[moveEntry.moveId] = true
            end
        end
        
        if species.tmMoves and #species.tmMoves > 0 then
            stats.speciesWithTMMoves = stats.speciesWithTMMoves + 1
            stats.totalMoveEntries = stats.totalMoveEntries + #species.tmMoves
            
            for _, moveId in ipairs(species.tmMoves) do
                uniqueMoves[moveId] = true
            end
        end
        
        if species.trMoves and #species.trMoves > 0 then
            stats.speciesWithTRMoves = stats.speciesWithTRMoves + 1
            stats.totalMoveEntries = stats.totalMoveEntries + #species.trMoves
            
            for _, moveId in ipairs(species.trMoves) do
                uniqueMoves[moveId] = true
            end
        end
        
        if species.eggMoves and #species.eggMoves > 0 then
            stats.speciesWithEggMoves = stats.speciesWithEggMoves + 1
            stats.totalMoveEntries = stats.totalMoveEntries + #species.eggMoves
            
            for _, moveId in ipairs(species.eggMoves) do
                uniqueMoves[moveId] = true
            end
        end
        
        if species.tutorMoves and #species.tutorMoves > 0 then
            stats.speciesWithTutorMoves = stats.speciesWithTutorMoves + 1
            stats.totalMoveEntries = stats.totalMoveEntries + #species.tutorMoves
            
            for _, moveId in ipairs(species.tutorMoves) do
                uniqueMoves[moveId] = true
            end
        end
    end
    
    for _ in pairs(uniqueMoves) do
        stats.uniqueMovesInDatabase = stats.uniqueMovesInDatabase + 1
    end
    
    return stats
end

-- Initialize the database when module is loaded
SpeciesDatabase.init()

return SpeciesDatabase