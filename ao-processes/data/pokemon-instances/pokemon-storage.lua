--[[
Pokemon Instance Storage System
Efficient storage and retrieval for Pokemon instances with indexing

Handles:
- Fast Pokemon instance storage and lookup
- Player-to-Pokemon indexing for collection queries
- Storage optimization and management
- Data integrity validation
--]]

local PokemonStorage = {}

-- Storage collections (in production AO process, these would be persisted)
if not _G.PokemonStorage then
    _G.PokemonStorage = {
        instances = {},        -- [pokemonId] = pokemonData
        playerIndex = {},      -- [playerId] = {pokemonId1, pokemonId2, ...}
        speciesIndex = {},     -- [speciesId] = {pokemonId1, pokemonId2, ...}
        battleIndex = {},      -- [battleId] = {pokemonId1, pokemonId2, ...}
        activeCount = 0,       -- Total number of stored Pokemon
        lastCleanup = 0        -- Timestamp of last cleanup operation
    }
end

-- Constants for storage management
local MAX_POKEMON_PER_PLAYER = 1000  -- Reasonable limit per player
local CLEANUP_INTERVAL = 3600         -- Cleanup every hour (in seconds)

-- Storage Operations

-- Store Pokemon instance
-- @param pokemon: Complete Pokemon instance data
-- @return: Boolean success and error message
function PokemonStorage.store(pokemon)
    if not pokemon or not pokemon.id then
        return false, "Invalid Pokemon data: missing ID"
    end
    
    if not pokemon.playerId then
        return false, "Invalid Pokemon data: missing player ID"
    end
    
    if not pokemon.speciesId then
        return false, "Invalid Pokemon data: missing species ID"
    end
    
    local pokemonId = pokemon.id
    local playerId = pokemon.playerId
    local speciesId = pokemon.speciesId
    
    -- Check if Pokemon already exists
    if _G.PokemonStorage.instances[pokemonId] then
        return false, "Pokemon with ID " .. pokemonId .. " already exists"
    end
    
    -- Validate player Pokemon limit
    local playerPokemon = _G.PokemonStorage.playerIndex[playerId] or {}
    if #playerPokemon >= MAX_POKEMON_PER_PLAYER then
        return false, "Player has reached maximum Pokemon limit (" .. MAX_POKEMON_PER_PLAYER .. ")"
    end
    
    -- Store Pokemon instance
    _G.PokemonStorage.instances[pokemonId] = pokemon
    _G.PokemonStorage.activeCount = _G.PokemonStorage.activeCount + 1
    
    -- Update player index
    if not _G.PokemonStorage.playerIndex[playerId] then
        _G.PokemonStorage.playerIndex[playerId] = {}
    end
    table.insert(_G.PokemonStorage.playerIndex[playerId], pokemonId)
    
    -- Update species index
    if not _G.PokemonStorage.speciesIndex[speciesId] then
        _G.PokemonStorage.speciesIndex[speciesId] = {}
    end
    table.insert(_G.PokemonStorage.speciesIndex[speciesId], pokemonId)
    
    return true
end

-- Retrieve Pokemon instance by ID
-- @param pokemonId: Pokemon instance ID
-- @return: Pokemon instance or nil if not found
function PokemonStorage.get(pokemonId)
    if not pokemonId then
        return nil, "Pokemon ID is required"
    end
    
    return _G.PokemonStorage.instances[pokemonId]
end

-- Update existing Pokemon instance
-- @param pokemonId: Pokemon instance ID
-- @param updates: Partial Pokemon data to update
-- @return: Boolean success and error message
function PokemonStorage.update(pokemonId, updates)
    if not pokemonId or not updates then
        return false, "Pokemon ID and updates are required"
    end
    
    local pokemon = _G.PokemonStorage.instances[pokemonId]
    if not pokemon then
        return false, "Pokemon not found: " .. pokemonId
    end
    
    -- Apply updates (shallow merge)
    for key, value in pairs(updates) do
        if key ~= "id" and key ~= "playerId" and key ~= "speciesId" then
            pokemon[key] = value
        end
    end
    
    -- Update timestamp
    pokemon.updatedAt = os.time()
    
    return true
end

-- Delete Pokemon instance
-- @param pokemonId: Pokemon instance ID
-- @return: Boolean success and error message
function PokemonStorage.delete(pokemonId)
    if not pokemonId then
        return false, "Pokemon ID is required"
    end
    
    local pokemon = _G.PokemonStorage.instances[pokemonId]
    if not pokemon then
        return false, "Pokemon not found: " .. pokemonId
    end
    
    local playerId = pokemon.playerId
    local speciesId = pokemon.speciesId
    
    -- Remove from main storage
    _G.PokemonStorage.instances[pokemonId] = nil
    _G.PokemonStorage.activeCount = _G.PokemonStorage.activeCount - 1
    
    -- Remove from player index
    local playerIndex = _G.PokemonStorage.playerIndex[playerId]
    if playerIndex then
        for i, id in ipairs(playerIndex) do
            if id == pokemonId then
                table.remove(playerIndex, i)
                break
            end
        end
    end
    
    -- Remove from species index
    local speciesIndex = _G.PokemonStorage.speciesIndex[speciesId]
    if speciesIndex then
        for i, id in ipairs(speciesIndex) do
            if id == pokemonId then
                table.remove(speciesIndex, i)
                break
            end
        end
    end
    
    -- Remove from battle index if present
    for battleId, battlePokemon in pairs(_G.PokemonStorage.battleIndex) do
        for i, id in ipairs(battlePokemon) do
            if id == pokemonId then
                table.remove(battlePokemon, i)
                break
            end
        end
    end
    
    return true
end

-- Query Operations

-- Get all Pokemon owned by a player
-- @param playerId: Player ID
-- @param limit: Maximum number of Pokemon to return (optional)
-- @param offset: Number of Pokemon to skip (optional, for pagination)
-- @return: Array of Pokemon instances
function PokemonStorage.getPlayerPokemon(playerId, limit, offset)
    if not playerId then
        return {}, "Player ID is required"
    end
    
    local pokemonIds = _G.PokemonStorage.playerIndex[playerId] or {}
    local pokemon = {}
    
    local startIndex = (offset or 0) + 1
    local endIndex = limit and (startIndex + limit - 1) or #pokemonIds
    endIndex = math.min(endIndex, #pokemonIds)
    
    for i = startIndex, endIndex do
        local pokemonId = pokemonIds[i]
        local pkmn = _G.PokemonStorage.instances[pokemonId]
        if pkmn then
            table.insert(pokemon, pkmn)
        end
    end
    
    return pokemon
end

-- Get Pokemon by species
-- @param speciesId: Species ID
-- @param limit: Maximum number of Pokemon to return (optional)
-- @return: Array of Pokemon instances
function PokemonStorage.getBySpecies(speciesId, limit)
    if not speciesId then
        return {}, "Species ID is required"
    end
    
    local pokemonIds = _G.PokemonStorage.speciesIndex[speciesId] or {}
    local pokemon = {}
    
    local maxResults = limit or #pokemonIds
    maxResults = math.min(maxResults, #pokemonIds)
    
    for i = 1, maxResults do
        local pokemonId = pokemonIds[i]
        local pkmn = _G.PokemonStorage.instances[pokemonId]
        if pkmn then
            table.insert(pokemon, pkmn)
        end
    end
    
    return pokemon
end

-- Search Pokemon with filters
-- @param filters: Filter criteria table
-- @return: Array of matching Pokemon instances
function PokemonStorage.search(filters)
    if not filters or type(filters) ~= "table" then
        return {}, "Filters must be provided as a table"
    end
    
    local results = {}
    local maxResults = filters.limit or 100  -- Default limit to prevent large result sets
    local currentCount = 0
    
    -- Iterate through all Pokemon instances
    for pokemonId, pokemon in pairs(_G.PokemonStorage.instances) do
        if currentCount >= maxResults then
            break
        end
        
        local matches = true
        
        -- Apply filters
        if filters.playerId and pokemon.playerId ~= filters.playerId then
            matches = false
        end
        
        if matches and filters.speciesId and pokemon.speciesId ~= filters.speciesId then
            matches = false
        end
        
        if matches and filters.minLevel and pokemon.level < filters.minLevel then
            matches = false
        end
        
        if matches and filters.maxLevel and pokemon.level > filters.maxLevel then
            matches = false
        end
        
        if matches and filters.isShiny ~= nil and pokemon.isShiny ~= filters.isShiny then
            matches = false
        end
        
        if matches and filters.nature and pokemon.nature ~= filters.nature then
            matches = false
        end
        
        if matches and filters.hasNickname ~= nil then
            local hasNick = pokemon.nickname and pokemon.nickname ~= ""
            if hasNick ~= filters.hasNickname then
                matches = false
            end
        end
        
        if matches then
            table.insert(results, pokemon)
            currentCount = currentCount + 1
        end
    end
    
    return results
end

-- Battle Integration

-- Add Pokemon to battle index
-- @param battleId: Battle ID
-- @param pokemonId: Pokemon instance ID
-- @return: Boolean success
function PokemonStorage.addToBattle(battleId, pokemonId)
    if not battleId or not pokemonId then
        return false, "Battle ID and Pokemon ID are required"
    end
    
    if not _G.PokemonStorage.instances[pokemonId] then
        return false, "Pokemon not found: " .. pokemonId
    end
    
    if not _G.PokemonStorage.battleIndex[battleId] then
        _G.PokemonStorage.battleIndex[battleId] = {}
    end
    
    -- Check if already in battle
    for _, id in ipairs(_G.PokemonStorage.battleIndex[battleId]) do
        if id == pokemonId then
            return true  -- Already in battle, no error
        end
    end
    
    table.insert(_G.PokemonStorage.battleIndex[battleId], pokemonId)
    return true
end

-- Remove Pokemon from battle index
-- @param battleId: Battle ID
-- @param pokemonId: Pokemon instance ID
-- @return: Boolean success
function PokemonStorage.removeFromBattle(battleId, pokemonId)
    if not battleId or not pokemonId then
        return false, "Battle ID and Pokemon ID are required"
    end
    
    local battlePokemon = _G.PokemonStorage.battleIndex[battleId]
    if not battlePokemon then
        return true  -- Battle not found, no error
    end
    
    for i, id in ipairs(battlePokemon) do
        if id == pokemonId then
            table.remove(battlePokemon, i)
            return true
        end
    end
    
    return true  -- Pokemon not in battle, no error
end

-- Get Pokemon in battle
-- @param battleId: Battle ID
-- @return: Array of Pokemon instances in battle
function PokemonStorage.getBattlePokemon(battleId)
    if not battleId then
        return {}, "Battle ID is required"
    end
    
    local pokemonIds = _G.PokemonStorage.battleIndex[battleId] or {}
    local pokemon = {}
    
    for _, pokemonId in ipairs(pokemonIds) do
        local pkmn = _G.PokemonStorage.instances[pokemonId]
        if pkmn then
            table.insert(pokemon, pkmn)
        end
    end
    
    return pokemon
end

-- Maintenance and Statistics

-- Get storage statistics
-- @return: Table with storage statistics
function PokemonStorage.getStats()
    local playerCount = 0
    local speciesCount = 0
    local activeBattles = 0
    
    for _ in pairs(_G.PokemonStorage.playerIndex) do
        playerCount = playerCount + 1
    end
    
    for _ in pairs(_G.PokemonStorage.speciesIndex) do
        speciesCount = speciesCount + 1
    end
    
    for _ in pairs(_G.PokemonStorage.battleIndex) do
        activeBattles = activeBattles + 1
    end
    
    return {
        totalPokemon = _G.PokemonStorage.activeCount,
        playersWithPokemon = playerCount,
        uniqueSpecies = speciesCount,
        activeBattles = activeBattles,
        lastCleanup = _G.PokemonStorage.lastCleanup
    }
end

-- Clean up stale battle entries
-- @return: Number of cleaned up entries
function PokemonStorage.cleanup()
    local cleanedCount = 0
    local currentTime = os.time()
    
    -- Only run cleanup periodically
    if currentTime - _G.PokemonStorage.lastCleanup < CLEANUP_INTERVAL then
        return 0
    end
    
    -- Clean up empty player indexes
    for playerId, pokemonIds in pairs(_G.PokemonStorage.playerIndex) do
        if #pokemonIds == 0 then
            _G.PokemonStorage.playerIndex[playerId] = nil
            cleanedCount = cleanedCount + 1
        end
    end
    
    -- Clean up empty species indexes
    for speciesId, pokemonIds in pairs(_G.PokemonStorage.speciesIndex) do
        if #pokemonIds == 0 then
            _G.PokemonStorage.speciesIndex[speciesId] = nil
            cleanedCount = cleanedCount + 1
        end
    end
    
    -- Clean up empty battle indexes
    for battleId, pokemonIds in pairs(_G.PokemonStorage.battleIndex) do
        if #pokemonIds == 0 then
            _G.PokemonStorage.battleIndex[battleId] = nil
            cleanedCount = cleanedCount + 1
        end
    end
    
    _G.PokemonStorage.lastCleanup = currentTime
    return cleanedCount
end

-- Clear all storage (for testing)
function PokemonStorage.clear()
    _G.PokemonStorage = {
        instances = {},
        playerIndex = {},
        speciesIndex = {},
        battleIndex = {},
        activeCount = 0,
        lastCleanup = os.time()
    }
end

-- Validate storage integrity
-- @return: Boolean indicating if storage is consistent
function PokemonStorage.validate()
    local errors = {}
    
    -- Check active count matches actual instances
    local actualCount = 0
    for _ in pairs(_G.PokemonStorage.instances) do
        actualCount = actualCount + 1
    end
    
    if actualCount ~= _G.PokemonStorage.activeCount then
        table.insert(errors, "Active count mismatch: expected " .. _G.PokemonStorage.activeCount .. ", actual " .. actualCount)
    end
    
    -- Check player index consistency
    for playerId, pokemonIds in pairs(_G.PokemonStorage.playerIndex) do
        for _, pokemonId in ipairs(pokemonIds) do
            local pokemon = _G.PokemonStorage.instances[pokemonId]
            if not pokemon then
                table.insert(errors, "Player index references non-existent Pokemon: " .. pokemonId)
            elseif pokemon.playerId ~= playerId then
                table.insert(errors, "Player index mismatch: Pokemon " .. pokemonId .. " belongs to " .. pokemon.playerId .. ", not " .. playerId)
            end
        end
    end
    
    -- Check species index consistency
    for speciesId, pokemonIds in pairs(_G.PokemonStorage.speciesIndex) do
        for _, pokemonId in ipairs(pokemonIds) do
            local pokemon = _G.PokemonStorage.instances[pokemonId]
            if not pokemon then
                table.insert(errors, "Species index references non-existent Pokemon: " .. pokemonId)
            elseif pokemon.speciesId ~= speciesId then
                table.insert(errors, "Species index mismatch: Pokemon " .. pokemonId .. " is species " .. pokemon.speciesId .. ", not " .. speciesId)
            end
        end
    end
    
    return #errors == 0, errors
end

return PokemonStorage