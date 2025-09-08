--[[
Pokemon Instance Manager
Manages individual Pokemon instances with unique properties, stats, and progression

Handles:
- Unique Pokemon ID generation and collision prevention
- Individual Pokemon instance creation and management
- Ownership validation and security
- Pokemon storage and retrieval
- Integration with species database, ability system, nature/IV system
--]]

local PokemonManager = {}

-- Import dependencies
local StatCalculator = require("game-logic.pokemon.stat-calculator")
local SpeciesDatabase = require("data.species.species-database")
local AbilityDatabase = require("data.abilities.ability-database")
local NatureModifiers = require("data.constants.nature-modifiers")
local Enums = require("data.constants.enums")
local CryptoRNG = require("game-logic.rng.crypto-rng")

-- Constants
local POKEMON_ID_PREFIX = "PKM"
local MIN_LEVEL = 1
local MAX_LEVEL = 100
local MIN_FRIENDSHIP = 0
local MAX_FRIENDSHIP = 255
local DEFAULT_FRIENDSHIP = 70

-- Global storage for Pokemon instances and counters
-- In production AO process, this would be persisted in process state
if not _G.PokemonInstances then
    _G.PokemonInstances = {}
end
if not _G.PokemonIdCounter then
    _G.PokemonIdCounter = 1
end
if not _G.PlayerPokemonIndex then
    _G.PlayerPokemonIndex = {}
end

-- Pokemon instance data structure
local PokemonInstanceSchema = {
    id = "string",           -- Unique instance ID
    speciesId = "number",    -- Species reference
    playerId = "string",     -- Owner identification
    level = "number",        -- Current level (1-100)
    exp = "number",          -- Experience points
    friendship = "number",   -- Friendship value (0-255)
    nickname = "string",     -- Custom nickname (optional)
    originalTrainer = "string", -- Original trainer ID
    
    -- Stats and attributes
    stats = {
        hp = "number",
        maxHp = "number", 
        attack = "number",
        defense = "number",
        spAttack = "number",
        spDefense = "number",
        speed = "number"
    },
    
    ivs = {
        hp = "number",
        attack = "number", 
        defense = "number",
        spAttack = "number",
        spDefense = "number",
        speed = "number"
    },
    
    nature = "number",       -- Nature enum ID
    gender = "number",       -- Gender enum ID  
    isShiny = "boolean",     -- Shiny status
    variant = "number",      -- Form/variant ID
    
    -- Battle and progression data
    statusEffect = "string", -- Current status condition
    heldItem = "number",     -- Held item ID
    moveset = {},           -- Array of move data
    battleData = {},        -- Temporary battle state
    
    -- Tracking data
    battleHistory = {},     -- Battle participation records
    createdAt = "number",   -- Creation timestamp
    lastBattleAt = "number" -- Last battle timestamp
}

-- ID Generation Functions

-- Generate unique Pokemon instance ID
-- @return: Unique string ID for new Pokemon instance
function PokemonManager.generateUniqueId()
    local id
    local attempts = 0
    local maxAttempts = 1000
    
    repeat
        id = POKEMON_ID_PREFIX .. string.format("%08d", _G.PokemonIdCounter)
        _G.PokemonIdCounter = _G.PokemonIdCounter + 1
        attempts = attempts + 1
        
        if attempts > maxAttempts then
            error("Failed to generate unique Pokemon ID after " .. maxAttempts .. " attempts")
        end
    until not _G.PokemonInstances[id]
    
    return id
end

-- Validate Pokemon instance ID format
-- @param id: ID string to validate
-- @return: Boolean indicating if ID format is valid
function PokemonManager.validateIdFormat(id)
    if type(id) ~= "string" then
        return false, "Pokemon ID must be a string"
    end
    
    if not string.match(id, "^" .. POKEMON_ID_PREFIX .. "%d+$") then
        return false, "Invalid Pokemon ID format"
    end
    
    return true
end

-- Pokemon Instance Creation

-- Create new Pokemon instance
-- @param speciesId: Species ID from species database
-- @param level: Starting level (1-100)
-- @param playerId: Owner player ID
-- @param options: Optional parameters (ivs, nature, nickname, etc.)
-- @return: Pokemon instance table or nil, error message
function PokemonManager.createPokemon(speciesId, level, playerId, options)
    -- Validate required parameters
    if type(speciesId) ~= "number" then
        return nil, "Species ID must be a number"
    end
    
    if type(level) ~= "number" or level < MIN_LEVEL or level > MAX_LEVEL then
        return nil, "Level must be between " .. MIN_LEVEL .. " and " .. MAX_LEVEL
    end
    
    if type(playerId) ~= "string" or playerId == "" then
        return nil, "Player ID must be a non-empty string"
    end
    
    -- Initialize dependencies
    SpeciesDatabase.init()
    AbilityDatabase.init()
    
    -- Validate species exists
    local speciesData = SpeciesDatabase.getSpecies(speciesId)
    if not speciesData then
        return nil, "Invalid species ID: " .. speciesId
    end
    
    -- Parse options
    options = options or {}
    
    -- Generate or validate IVs
    local ivs = options.ivs
    if ivs then
        local valid, error = StatCalculator.validateIVs(ivs)
        if not valid then
            return nil, error
        end
    else
        ivs = StatCalculator.generateRandomIVs(options.seed)
    end
    
    -- Validate or default nature
    local nature = options.nature or CryptoRNG.globalRandomInt(0, 24) -- Random nature if not specified (valid range 0-24)
    if not NatureModifiers.natureExists(nature) then
        return nil, "Invalid nature ID: " .. nature
    end
    
    -- Generate unique ID
    local pokemonId = PokemonManager.generateUniqueId()
    
    -- Calculate stats
    local calculatedStats, error = StatCalculator.calculateAllStats(speciesData.baseStats, ivs, level, nature)
    if not calculatedStats then
        return nil, "Failed to calculate stats: " .. (error or "unknown error")
    end
    
    -- Determine gender (simplified - actual implementation would use species gender ratio)
    local gender = options.gender or (CryptoRNG.globalRandom() < 0.5 and Enums.Gender.MALE or Enums.Gender.FEMALE)
    
    -- Determine shiny status
    local isShiny = options.isShiny ~= nil and options.isShiny or StatCalculator.calculateShinyFromIVs(ivs)
    
    -- Create Pokemon instance
    local pokemon = {
        -- Basic identification
        id = pokemonId,
        speciesId = speciesId,
        playerId = playerId,
        originalTrainer = playerId,
        
        -- Level and experience
        level = level,
        exp = options.exp or PokemonManager.getExpForLevel(level, speciesData.growthRate),
        friendship = options.friendship or DEFAULT_FRIENDSHIP,
        
        -- Customization
        nickname = options.nickname,
        
        -- Stats and attributes  
        stats = {
            hp = calculatedStats.hp,
            maxHp = calculatedStats.hp,
            attack = calculatedStats.attack,
            defense = calculatedStats.defense,
            spAttack = calculatedStats.spAttack,
            spDefense = calculatedStats.spDefense,
            speed = calculatedStats.speed
        },
        
        ivs = ivs,
        nature = nature,
        gender = gender,
        isShiny = isShiny,
        variant = options.variant or 0,
        
        -- Battle state
        statusEffect = nil,
        heldItem = options.heldItem,
        moveset = {},
        battleData = {},
        
        -- Tracking
        battleHistory = {},
        createdAt = os.time(),
        lastBattleAt = nil
    }
    
    -- Store Pokemon instance
    _G.PokemonInstances[pokemonId] = pokemon
    
    -- Update player index
    if not _G.PlayerPokemonIndex[playerId] then
        _G.PlayerPokemonIndex[playerId] = {}
    end
    table.insert(_G.PlayerPokemonIndex[playerId], pokemonId)
    
    return pokemon
end

-- Experience and Level Functions

-- Get experience required for a specific level (simplified formula)
-- @param level: Target level
-- @param growthRate: Growth rate from species data
-- @return: Experience points required
function PokemonManager.getExpForLevel(level, growthRate)
    -- Simplified medium-fast growth rate formula
    -- In production, this would use proper growth rate tables
    if level == 1 then
        return 0
    end
    
    local exp = math.floor(level * level * level)
    return math.max(0, exp)
end

-- Calculate level from experience points
-- @param exp: Current experience points
-- @param growthRate: Growth rate from species data
-- @return: Current level based on experience
function PokemonManager.getLevelFromExp(exp, growthRate)
    if exp <= 0 then
        return 1
    end
    
    -- Binary search for level (simplified)
    for level = 1, MAX_LEVEL do
        local requiredExp = PokemonManager.getExpForLevel(level, growthRate)
        if exp < requiredExp then
            return math.max(1, level - 1)
        end
    end
    
    return MAX_LEVEL
end

-- Pokemon Retrieval Functions

-- Get Pokemon instance by ID
-- @param pokemonId: Pokemon instance ID
-- @return: Pokemon instance or nil if not found
function PokemonManager.getPokemon(pokemonId)
    if not pokemonId then
        return nil, "Pokemon ID is required"
    end
    
    local valid, error = PokemonManager.validateIdFormat(pokemonId)
    if not valid then
        return nil, error
    end
    
    return _G.PokemonInstances[pokemonId]
end

-- Get Pokemon with ownership validation
-- @param pokemonId: Pokemon instance ID
-- @param playerId: Player ID requesting access
-- @return: Pokemon instance or nil with error
function PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    local pokemon, error = PokemonManager.getPokemon(pokemonId)
    if not pokemon then
        return nil, error
    end
    
    if pokemon.playerId ~= playerId then
        return nil, "Access denied: Pokemon belongs to different player"
    end
    
    return pokemon
end

-- Get all Pokemon owned by a player
-- @param playerId: Player ID
-- @param filters: Optional filters (level range, species, etc.)
-- @return: Array of Pokemon instances
function PokemonManager.getPlayerPokemon(playerId, filters)
    if type(playerId) ~= "string" or playerId == "" then
        return {}, "Invalid player ID"
    end
    
    local pokemonIds = _G.PlayerPokemonIndex[playerId] or {}
    local pokemon = {}
    
    for _, pokemonId in ipairs(pokemonIds) do
        local pkmn = _G.PokemonInstances[pokemonId]
        if pkmn then
            -- Apply filters if provided
            if not filters or PokemonManager.matchesFilters(pkmn, filters) then
                table.insert(pokemon, pkmn)
            end
        end
    end
    
    return pokemon
end

-- Check if Pokemon matches filter criteria
-- @param pokemon: Pokemon instance
-- @param filters: Filter criteria
-- @return: Boolean indicating if Pokemon matches
function PokemonManager.matchesFilters(pokemon, filters)
    if filters.minLevel and pokemon.level < filters.minLevel then
        return false
    end
    
    if filters.maxLevel and pokemon.level > filters.maxLevel then
        return false
    end
    
    if filters.speciesId and pokemon.speciesId ~= filters.speciesId then
        return false
    end
    
    if filters.isShiny ~= nil and pokemon.isShiny ~= filters.isShiny then
        return false
    end
    
    return true
end

-- Ownership and Security Functions

-- Validate Pokemon ownership
-- @param pokemonId: Pokemon instance ID
-- @param playerId: Player ID claiming ownership
-- @return: Boolean indicating if player owns Pokemon
function PokemonManager.validateOwnership(pokemonId, playerId)
    local pokemon = _G.PokemonInstances[pokemonId]
    if not pokemon then
        return false, "Pokemon not found"
    end
    
    if pokemon.playerId ~= playerId then
        return false, "Access denied: Pokemon belongs to different player"
    end
    
    return true
end

-- Transfer Pokemon ownership (for trading system)
-- @param pokemonId: Pokemon instance ID
-- @param fromPlayerId: Current owner
-- @param toPlayerId: New owner
-- @return: Boolean success and error message
function PokemonManager.transferOwnership(pokemonId, fromPlayerId, toPlayerId)
    if not PokemonManager.validateOwnership(pokemonId, fromPlayerId) then
        return false, "Only current owner can transfer Pokemon"
    end
    
    local pokemon = _G.PokemonInstances[pokemonId]
    
    -- Update ownership
    pokemon.playerId = toPlayerId
    
    -- Update player indexes
    local fromIndex = _G.PlayerPokemonIndex[fromPlayerId]
    if fromIndex then
        for i, id in ipairs(fromIndex) do
            if id == pokemonId then
                table.remove(fromIndex, i)
                break
            end
        end
    end
    
    if not _G.PlayerPokemonIndex[toPlayerId] then
        _G.PlayerPokemonIndex[toPlayerId] = {}
    end
    table.insert(_G.PlayerPokemonIndex[toPlayerId], pokemonId)
    
    return true
end

-- Pokemon Modification Functions

-- Update Pokemon stats after level change or other modifications
-- @param pokemonId: Pokemon instance ID
-- @param modifications: Table with stat modifications
-- @param playerId: Player ID for ownership validation
-- @return: Updated Pokemon or nil with error
function PokemonManager.updatePokemonStats(pokemonId, modifications, playerId)
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return nil, error
    end
    
    -- Initialize dependencies for stat calculation
    SpeciesDatabase.init()
    
    local speciesData = SpeciesDatabase.getSpecies(pokemon.speciesId)
    if not speciesData then
        return nil, "Species data not found for Pokemon"
    end
    
    -- Apply modifications
    if modifications.level then
        if modifications.level < MIN_LEVEL or modifications.level > MAX_LEVEL then
            return nil, "Invalid level: must be between " .. MIN_LEVEL .. " and " .. MAX_LEVEL
        end
        pokemon.level = modifications.level
        pokemon.exp = math.max(pokemon.exp, PokemonManager.getExpForLevel(pokemon.level, speciesData.growthRate))
    end
    
    if modifications.exp then
        pokemon.exp = math.max(0, modifications.exp)
        pokemon.level = PokemonManager.getLevelFromExp(pokemon.exp, speciesData.growthRate)
    end
    
    if modifications.friendship then
        pokemon.friendship = math.max(MIN_FRIENDSHIP, math.min(MAX_FRIENDSHIP, modifications.friendship))
    end
    
    -- Recalculate stats if level changed
    if modifications.level or modifications.exp then
        local newStats, error = StatCalculator.calculateAllStats(
            speciesData.baseStats, 
            pokemon.ivs, 
            pokemon.level, 
            pokemon.nature
        )
        
        if not newStats then
            return nil, "Failed to recalculate stats: " .. (error or "unknown error")
        end
        
        -- Preserve current HP ratio when updating max HP
        local hpRatio = pokemon.stats.hp / pokemon.stats.maxHp
        
        pokemon.stats.attack = newStats.attack
        pokemon.stats.defense = newStats.defense
        pokemon.stats.spAttack = newStats.spAttack
        pokemon.stats.spDefense = newStats.spDefense
        pokemon.stats.speed = newStats.speed
        pokemon.stats.maxHp = newStats.hp
        
        -- Update current HP based on ratio
        pokemon.stats.hp = math.floor(pokemon.stats.maxHp * hpRatio)
    end
    
    return pokemon
end

-- Assign nickname to Pokemon
-- @param pokemonId: Pokemon instance ID
-- @param nickname: New nickname (nil to clear)
-- @param playerId: Player ID for ownership validation
-- @return: Updated Pokemon or nil with error
function PokemonManager.assignNickname(pokemonId, nickname, playerId)
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return nil, error
    end
    
    -- Validate nickname if provided
    if nickname ~= nil then
        if type(nickname) ~= "string" then
            return nil, "Nickname must be a string"
        end
        
        if string.len(nickname) > 12 then
            return nil, "Nickname cannot exceed 12 characters"
        end
        
        if string.len(nickname) == 0 then
            nickname = nil
        end
    end
    
    pokemon.nickname = nickname
    return pokemon
end

-- Utility Functions

-- Get Pokemon display name (nickname or species name)
-- @param pokemon: Pokemon instance
-- @return: Display name string
function PokemonManager.getDisplayName(pokemon)
    if pokemon.nickname and pokemon.nickname ~= "" then
        return pokemon.nickname
    end
    
    -- Initialize species database if needed
    SpeciesDatabase.init()
    local speciesData = SpeciesDatabase.getSpecies(pokemon.speciesId)
    return speciesData and speciesData.name or "Unknown"
end

-- Get storage statistics
-- @return: Table with storage statistics
function PokemonManager.getStorageStats()
    local totalPokemon = 0
    local playerCount = 0
    
    for _ in pairs(_G.PokemonInstances) do
        totalPokemon = totalPokemon + 1
    end
    
    for _ in pairs(_G.PlayerPokemonIndex) do
        playerCount = playerCount + 1
    end
    
    return {
        totalPokemon = totalPokemon,
        playersWithPokemon = playerCount,
        nextId = _G.PokemonIdCounter
    }
end

-- Delete Pokemon instance (for testing or admin functions)
-- @param pokemonId: Pokemon instance ID
-- @param playerId: Player ID for ownership validation (nil for admin)
-- @return: Boolean success
function PokemonManager.deletePokemon(pokemonId, playerId)
    local pokemon = _G.PokemonInstances[pokemonId]
    if not pokemon then
        return false, "Pokemon not found"
    end
    
    -- Validate ownership unless admin operation (playerId is nil)
    if playerId and not PokemonManager.validateOwnership(pokemonId, playerId) then
        return false, "Only owner can delete Pokemon"
    end
    
    -- Remove from player index
    local pokemonPlayerId = pokemon.playerId
    local playerIndex = _G.PlayerPokemonIndex[pokemonPlayerId]
    if playerIndex then
        for i, id in ipairs(playerIndex) do
            if id == pokemonId then
                table.remove(playerIndex, i)
                break
            end
        end
    end
    
    -- Remove from main storage
    _G.PokemonInstances[pokemonId] = nil
    
    return true
end

-- Clear all storage (for testing)
function PokemonManager.clearAllStorage()
    _G.PokemonInstances = {}
    _G.PlayerPokemonIndex = {}
    _G.PokemonIdCounter = 1
end

return PokemonManager