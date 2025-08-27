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
            forms = {}
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
            forms = {}
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
            forms = {}
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
            forms = {}
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
            forms = {}
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
            forms = {}
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
            forms = {}
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

-- Initialize the database when module is loaded
SpeciesDatabase.init()

return SpeciesDatabase