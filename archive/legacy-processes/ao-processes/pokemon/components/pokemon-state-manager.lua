--[[
Pokemon State Manager
Central Pokemon data management and CRUD operations for the pokemon process

Features:
- Pokemon instance creation, update, deletion
- State persistence and validation  
- Experience and level management
- HP and status management
- Integration with stat calculator and evolution system
--]]

local PokemonStateManager = {}

-- Import dependencies  
local StatCalculator = require("pokemon.components.stat-calculator")
local EvolutionSystem = require("pokemon.components.evolution-system")
local SpeciesManager = require("pokemon.components.species-manager")
local PokemonValidator = require("pokemon.components.pokemon-validator")
local CryptoRNG = require("game-logic.rng.crypto-rng")

-- State storage
local pokemonInstances = {}
local nextPokemonId = 1
local statistics = {
    created = 0,
    updated = 0,
    deleted = 0,
    levelUps = 0,
    evolutions = 0,
    validationFailures = 0
}

-- Initialize manager
function PokemonStateManager.initialize()
    print("[Pokemon] PokemonStateManager initialized")
    nextPokemonId = 1
    pokemonInstances = {}
end

-- Pokemon Creation

-- Create new Pokemon instance
-- @param speciesId: Species ID from SpeciesId enum
-- @param level: Starting level (1-100)
-- @param playerId: Player wallet address
-- @param options: Optional creation parameters (ivs, nature, etc)
-- @return: Pokemon instance data, or nil and error
function PokemonStateManager.createPokemon(speciesId, level, playerId, options)
    if not speciesId or not level or not playerId then
        statistics.validationFailures = statistics.validationFailures + 1
        return nil, "Missing required parameters for Pokemon creation"
    end
    
    -- Validate level
    if level < 1 or level > 100 then
        statistics.validationFailures = statistics.validationFailures + 1
        return nil, "Invalid level: must be between 1 and 100"
    end
    
    -- Get species data
    local speciesData = SpeciesManager.getSpecies(speciesId)
    if not speciesData then
        statistics.validationFailures = statistics.validationFailures + 1
        return nil, "Species not found: " .. tostring(speciesId)
    end
    
    -- Set default options
    options = options or {}
    local seed = options.seed or (tostring(playerId) .. tostring(speciesId) .. tostring(CryptoRNG.globalRandomInt(1, 999999)))
    
    -- Generate IVs
    local ivs = options.ivs or StatCalculator.generateRandomIVs(seed)
    
    -- Select nature
    local natureId = options.natureId
    if not natureId then
        CryptoRNG.initGlobalRNG(seed .. "nature")
        natureId = CryptoRNG.globalRandomInt(1, 25) -- 25 natures
    end
    
    -- Calculate stats
    local stats, error = StatCalculator.calculateAllStats(speciesData.baseStats, ivs, level, natureId)
    if not stats then
        statistics.validationFailures = statistics.validationFailures + 1
        return nil, "Failed to calculate stats: " .. (error or "unknown error")
    end
    
    -- Calculate experience for level
    local experience = PokemonStateManager.calculateExperienceForLevel(level, speciesData.growthRate)
    
    -- Determine gender
    local gender = options.gender
    if not gender then
        gender = PokemonStateManager.generateGender(speciesData.genderRatio, seed .. "gender")
    end
    
    -- Create Pokemon instance
    local pokemon = {
        id = nextPokemonId,
        speciesId = speciesId,
        species = speciesData.name,
        level = level,
        exp = experience,
        hp = stats.hp,
        maxHp = stats.hp,
        stats = stats,
        ivs = ivs,
        nature = natureId,
        gender = gender,
        moveset = options.moveset or {},
        statusEffect = nil,
        abilities = speciesData.abilities,
        heldItem = options.heldItem,
        friendship = options.friendship or 50, -- Base friendship
        ballType = options.ballType or "POKE_BALL",
        originalTrainer = playerId,
        playerId = playerId,
        createdAt = 0,
        lastModified = 0,
        battleData = {},
        correlationId = options.correlationId,
        baseStats = speciesData.baseStats,
        natureId = natureId
    }
    
    -- Validate created Pokemon
    local isValid, validationError = PokemonValidator.validatePokemon(pokemon)
    if not isValid then
        statistics.validationFailures = statistics.validationFailures + 1
        return nil, "Pokemon validation failed: " .. validationError
    end
    
    -- Store Pokemon instance
    pokemonInstances[nextPokemonId] = pokemon
    nextPokemonId = nextPokemonId + 1
    statistics.created = statistics.created + 1
    
    print("[Pokemon] Created Pokemon: " .. speciesData.name .. " (ID: " .. pokemon.id .. ") Level " .. level)
    
    return pokemon
end

-- Pokemon Retrieval

-- Get Pokemon by ID
-- @param pokemonId: Pokemon instance ID
-- @return: Pokemon data or nil if not found
function PokemonStateManager.getPokemon(pokemonId)
    if not pokemonId then
        return nil
    end
    
    return pokemonInstances[pokemonId]
end

-- Get all Pokemon for player
-- @param playerId: Player wallet address
-- @return: Array of Pokemon owned by player
function PokemonStateManager.getPlayerPokemon(playerId)
    if not playerId then
        return {}
    end
    
    local playerPokemon = {}
    for _, pokemon in pairs(pokemonInstances) do
        if pokemon.playerId == playerId then
            table.insert(playerPokemon, pokemon)
        end
    end
    
    return playerPokemon
end

-- Pokemon Updates

-- Update Pokemon HP
-- @param pokemonId: Pokemon instance ID
-- @param newHp: New HP value
-- @return: Success boolean and updated Pokemon or error
function PokemonStateManager.updateHp(pokemonId, newHp)
    local pokemon = pokemonInstances[pokemonId]
    if not pokemon then
        return false, "Pokemon not found"
    end
    
    -- Validate HP
    if newHp < 0 or newHp > pokemon.maxHp then
        statistics.validationFailures = statistics.validationFailures + 1
        return false, "Invalid HP value: " .. newHp .. " (max: " .. pokemon.maxHp .. ")"
    end
    
    pokemon.hp = newHp
    pokemon.lastModified = 0
    statistics.updated = statistics.updated + 1
    
    return true, pokemon
end

-- Update Pokemon experience and handle level ups
-- @param pokemonId: Pokemon instance ID  
-- @param expGained: Experience points to add
-- @param evolutionPreferences: Player evolution preferences
-- @return: Success boolean, updated Pokemon, level up info
function PokemonStateManager.gainExperience(pokemonId, expGained, evolutionPreferences)
    local pokemon = pokemonInstances[pokemonId]
    if not pokemon then
        return false, nil, "Pokemon not found"
    end
    
    if expGained <= 0 then
        return false, nil, "Experience gained must be positive"
    end
    
    local oldLevel = pokemon.level
    local oldExp = pokemon.exp
    
    -- Add experience
    pokemon.exp = pokemon.exp + expGained
    
    -- Check for level up
    local newLevel = PokemonStateManager.calculateLevelFromExperience(pokemon.exp, pokemon.baseStats)
    newLevel = math.min(newLevel, 100) -- Cap at level 100
    
    local levelUpInfo = {
        levelsGained = newLevel - oldLevel,
        oldLevel = oldLevel,
        newLevel = newLevel,
        expGained = expGained,
        totalExp = pokemon.exp,
        evolved = false
    }
    
    if newLevel > oldLevel then
        -- Level up occurred
        pokemon.level = newLevel
        statistics.levelUps = statistics.levelUps + 1
        
        -- Recalculate stats
        local newStats, error = StatCalculator.recalculateStats(pokemon)
        if newStats then
            local oldMaxHp = pokemon.maxHp
            pokemon.stats = newStats
            pokemon.maxHp = newStats.hp
            
            -- Heal HP proportionally for level up
            local hpRatio = pokemon.hp / oldMaxHp
            pokemon.hp = math.floor(pokemon.maxHp * hpRatio)
            
            print("[Pokemon] " .. pokemon.species .. " leveled up to " .. newLevel)
            
            -- Check for evolution
            local evolutionResult = EvolutionSystem.processEvolutionWithCancellation(
                pokemon, 
                EvolutionSystem.checkLevelEvolution(pokemon),
                evolutionPreferences
            )
            
            if evolutionResult and evolutionResult.evolved then
                -- Pokemon evolved
                statistics.evolutions = statistics.evolutions + 1
                levelUpInfo.evolved = true
                levelUpInfo.evolutionInfo = evolutionResult
                
                -- Recalculate stats for evolved form
                local evolvedStats, statError = StatCalculator.recalculateStats(pokemon)
                if evolvedStats then
                    pokemon.stats = evolvedStats
                    pokemon.maxHp = evolvedStats.hp
                    -- Heal to full after evolution
                    pokemon.hp = pokemon.maxHp
                end
                
                print("[Pokemon] " .. pokemon.species .. " evolved!")
            end
        else
            print("[Pokemon] Warning: Failed to recalculate stats after level up: " .. error)
        end
    end
    
    pokemon.lastModified = 0
    statistics.updated = statistics.updated + 1
    
    return true, pokemon, levelUpInfo
end

-- Update Pokemon status effect
-- @param pokemonId: Pokemon instance ID
-- @param statusEffect: Status effect to apply (or nil to clear)
-- @return: Success boolean and updated Pokemon or error
function PokemonStateManager.updateStatusEffect(pokemonId, statusEffect)
    local pokemon = pokemonInstances[pokemonId]
    if not pokemon then
        return false, "Pokemon not found"
    end
    
    pokemon.statusEffect = statusEffect
    pokemon.lastModified = 0
    statistics.updated = statistics.updated + 1
    
    return true, pokemon
end

-- Update Pokemon held item
-- @param pokemonId: Pokemon instance ID
-- @param itemId: Item ID to hold (or nil to clear)
-- @return: Success boolean and updated Pokemon or error
function PokemonStateManager.updateHeldItem(pokemonId, itemId)
    local pokemon = pokemonInstances[pokemonId]
    if not pokemon then
        return false, "Pokemon not found"
    end
    
    pokemon.heldItem = itemId
    pokemon.lastModified = 0
    statistics.updated = statistics.updated + 1
    
    -- Recalculate stats if held item affects stats
    local hasModifiers, _ = StatCalculator.hasHeldItemStatModifiers(pokemon)
    if hasModifiers then
        local newStats = StatCalculator.recalculateStatsWithHeldItems(pokemon)
        if newStats then
            pokemon.stats = newStats
        end
    end
    
    return true, pokemon
end

-- Pokemon Deletion

-- Delete Pokemon instance
-- @param pokemonId: Pokemon instance ID
-- @param playerId: Player ID for authorization
-- @return: Success boolean and message
function PokemonStateManager.deletePokemon(pokemonId, playerId)
    local pokemon = pokemonInstances[pokemonId]
    if not pokemon then
        return false, "Pokemon not found"
    end
    
    -- Verify ownership
    if pokemon.playerId ~= playerId then
        return false, "Not authorized to delete this Pokemon"
    end
    
    pokemonInstances[pokemonId] = nil
    statistics.deleted = statistics.deleted + 1
    
    print("[Pokemon] Deleted Pokemon ID: " .. pokemonId)
    return true, "Pokemon deleted successfully"
end

-- Utility Functions

-- Calculate experience required for specific level
-- @param level: Target level
-- @param growthRate: Species growth rate
-- @return: Total experience required
function PokemonStateManager.calculateExperienceForLevel(level, growthRate)
    growthRate = growthRate or "MEDIUM_FAST"
    
    if level <= 1 then
        return 0
    end
    
    -- Medium Fast formula (most common)
    if growthRate == "MEDIUM_FAST" then
        return level * level * level
    elseif growthRate == "ERRATIC" then
        if level <= 50 then
            return math.floor(level * level * level * (100 - level) / 50)
        elseif level <= 68 then
            return math.floor(level * level * level * (150 - level) / 100)
        elseif level <= 98 then
            return math.floor(level * level * level * (1911 - 10 * level) / 1500)
        else
            return math.floor(level * level * level * (160 - level) / 100)
        end
    elseif growthRate == "FAST" then
        return math.floor(4 * level * level * level / 5)
    elseif growthRate == "MEDIUM_SLOW" then
        return math.floor(6/5 * level * level * level - 15 * level * level + 100 * level - 140)
    elseif growthRate == "SLOW" then
        return math.floor(5 * level * level * level / 4)
    elseif growthRate == "FLUCTUATING" then
        if level <= 15 then
            return math.floor(level * level * level * (((level + 1) / 3) + 24) / 50)
        elseif level <= 36 then
            return math.floor(level * level * level * (level + 14) / 50)
        else
            return math.floor(level * level * level * ((level / 2) + 32) / 50)
        end
    end
    
    -- Default to medium fast
    return level * level * level
end

-- Calculate level from experience
-- @param experience: Total experience
-- @param growthRate: Species growth rate
-- @return: Calculated level
function PokemonStateManager.calculateLevelFromExperience(experience, growthRate)
    for level = 1, 100 do
        local requiredExp = PokemonStateManager.calculateExperienceForLevel(level + 1, growthRate)
        if experience < requiredExp then
            return level
        end
    end
    return 100
end

-- Generate Pokemon gender based on species ratio
-- @param genderRatio: Species gender ratio
-- @param seed: Random seed
-- @return: Gender string
function PokemonStateManager.generateGender(genderRatio, seed)
    if not genderRatio then
        return "GENDERLESS"
    end
    
    -- Handle genderless Pokemon
    if genderRatio == -1 or genderRatio == "GENDERLESS" then
        return "GENDERLESS"
    end
    
    -- Handle always female/male
    if genderRatio == 0 then
        return "MALE"
    elseif genderRatio == 8 then
        return "FEMALE"
    end
    
    -- Random gender based on ratio
    CryptoRNG.initGlobalRNG(seed)
    local roll = CryptoRNG.globalRandomInt(0, 7)
    
    -- Ratio is out of 8 (0-7 female, 8 male in original games)
    if roll < genderRatio then
        return "FEMALE"
    else
        return "MALE"
    end
end

-- Management Functions

-- Get statistics
-- @return: Manager statistics
function PokemonStateManager.getStatistics()
    local totalPokemon = 0
    for _ in pairs(pokemonInstances) do
        totalPokemon = totalPokemon + 1
    end
    
    return {
        totalPokemon = totalPokemon,
        created = statistics.created,
        updated = statistics.updated,
        deleted = statistics.deleted,
        levelUps = statistics.levelUps,
        evolutions = statistics.evolutions,
        validationFailures = statistics.validationFailures
    }
end

-- Perform maintenance
function PokemonStateManager.performMaintenance()
    local currentTime = 0
    local cleaned = 0
    
    -- Clean up very old temporary battle data
    for pokemonId, pokemon in pairs(pokemonInstances) do
        if pokemon.battleData and pokemon.battleData.temporary then
            if not pokemon.battleData.lastAccessed or 
               (currentTime - pokemon.battleData.lastAccessed) > 3600 then -- 1 hour
                pokemon.battleData = {}
                cleaned = cleaned + 1
            end
        end
    end
    
    if cleaned > 0 then
        print("[Pokemon] Cleaned up battle data for " .. cleaned .. " Pokemon")
    end
end

-- Export additional functions for testing
PokemonStateManager._internal = {
    pokemonInstances = pokemonInstances,
    statistics = statistics
}

return PokemonStateManager