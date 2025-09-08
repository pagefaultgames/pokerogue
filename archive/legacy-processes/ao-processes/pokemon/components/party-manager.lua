--[[
Party Manager
Pokemon party composition and validation management

Features:
- Party composition management (up to 6 Pokemon)
- Party validation and consistency checking
- Pokemon swapping and organization
- Battle readiness validation
- PC storage integration
--]]

local PartyManager = {}

-- Import dependencies
local PokemonValidator = require("pokemon.components.pokemon-validator")

-- Party storage - indexed by player ID
local playerParties = {}
local statistics = {
    partiesCreated = 0,
    pokemonAdded = 0,
    pokemonRemoved = 0,
    pokemonSwapped = 0,
    validationFailures = 0
}

-- Constants
local MAX_PARTY_SIZE = 6
local MIN_PARTY_SIZE_FOR_BATTLE = 1

-- Initialize manager
function PartyManager.initialize()
    print("[Pokemon] PartyManager initialized")
    playerParties = {}
end

-- Party Creation and Access

-- Get or create party for player
-- @param playerId: Player wallet address
-- @return: Party data structure
function PartyManager.getOrCreateParty(playerId)
    if not playerId then
        return nil, "Player ID required"
    end
    
    if not playerParties[playerId] then
        playerParties[playerId] = {
            playerId = playerId,
            party = {},
            createdAt = 0,
            lastModified = 0,
            battleReady = false
        }
        statistics.partiesCreated = statistics.partiesCreated + 1
    end
    
    return playerParties[playerId]
end

-- Get party data for player
-- @param playerId: Player wallet address
-- @return: Party data or nil
function PartyManager.getParty(playerId)
    return playerParties[playerId]
end

-- Get party Pokemon list
-- @param playerId: Player wallet address
-- @return: Array of Pokemon in party
function PartyManager.getPartyPokemon(playerId)
    local partyData = PartyManager.getParty(playerId)
    return partyData and partyData.party or {}
end

-- Party Management

-- Add Pokemon to party
-- @param playerId: Player wallet address
-- @param pokemon: Pokemon data to add
-- @param slot: Optional specific slot (1-6), or nil to add to next available
-- @return: Success boolean, party data or error message
function PartyManager.addPokemonToParty(playerId, pokemon, slot)
    if not playerId or not pokemon then
        statistics.validationFailures = statistics.validationFailures + 1
        return false, "Player ID and Pokemon data required"
    end
    
    -- Validate Pokemon data
    local isValid, validationError = PokemonValidator.validatePokemon(pokemon)
    if not isValid then
        statistics.validationFailures = statistics.validationFailures + 1
        return false, "Invalid Pokemon data: " .. validationError
    end
    
    -- Get or create party
    local partyData, error = PartyManager.getOrCreateParty(playerId)
    if not partyData then
        return false, error
    end
    
    -- Check if party is full
    if #partyData.party >= MAX_PARTY_SIZE then
        return false, "Party is full (maximum " .. MAX_PARTY_SIZE .. " Pokemon)"
    end
    
    -- Check if Pokemon is already in party
    for i, partyPokemon in ipairs(partyData.party) do
        if partyPokemon.id == pokemon.id then
            return false, "Pokemon is already in party"
        end
    end
    
    -- Add to specific slot or next available
    if slot then
        if slot < 1 or slot > MAX_PARTY_SIZE then
            return false, "Invalid slot: must be between 1 and " .. MAX_PARTY_SIZE
        end
        
        if partyData.party[slot] then
            return false, "Slot " .. slot .. " is already occupied"
        end
        
        partyData.party[slot] = pokemon
    else
        -- Add to next available slot
        table.insert(partyData.party, pokemon)
    end
    
    partyData.lastModified = 0
    statistics.pokemonAdded = statistics.pokemonAdded + 1
    
    -- Update battle readiness
    PartyManager.updateBattleReadiness(playerId)
    
    print("[Pokemon] Added " .. pokemon.species .. " to " .. playerId .. "'s party")
    
    return true, partyData
end

-- Remove Pokemon from party
-- @param playerId: Player wallet address
-- @param pokemonId: Pokemon ID to remove
-- @return: Success boolean, party data or error message
function PartyManager.removePokemonFromParty(playerId, pokemonId)
    if not playerId or not pokemonId then
        return false, "Player ID and Pokemon ID required"
    end
    
    local partyData = PartyManager.getParty(playerId)
    if not partyData then
        return false, "Player has no party"
    end
    
    -- Find and remove Pokemon
    for i, pokemon in ipairs(partyData.party) do
        if pokemon.id == pokemonId then
            table.remove(partyData.party, i)
            partyData.lastModified = 0
            statistics.pokemonRemoved = statistics.pokemonRemoved + 1
            
            -- Update battle readiness
            PartyManager.updateBattleReadiness(playerId)
            
            print("[Pokemon] Removed Pokemon ID " .. pokemonId .. " from " .. playerId .. "'s party")
            return true, partyData
        end
    end
    
    return false, "Pokemon not found in party"
end

-- Swap Pokemon positions in party
-- @param playerId: Player wallet address
-- @param fromSlot: Source slot (1-6)
-- @param toSlot: Destination slot (1-6)
-- @return: Success boolean, party data or error message
function PartyManager.swapPokemonInParty(playerId, fromSlot, toSlot)
    if not playerId or not fromSlot or not toSlot then
        return false, "Player ID and both slots required"
    end
    
    if fromSlot < 1 or fromSlot > MAX_PARTY_SIZE or toSlot < 1 or toSlot > MAX_PARTY_SIZE then
        return false, "Invalid slots: must be between 1 and " .. MAX_PARTY_SIZE
    end
    
    if fromSlot == toSlot then
        return false, "Cannot swap Pokemon to same slot"
    end
    
    local partyData = PartyManager.getParty(playerId)
    if not partyData then
        return false, "Player has no party"
    end
    
    local party = partyData.party
    if not party[fromSlot] then
        return false, "No Pokemon in source slot " .. fromSlot
    end
    
    -- Perform swap
    local temp = party[fromSlot]
    party[fromSlot] = party[toSlot]
    party[toSlot] = temp
    
    partyData.lastModified = 0
    statistics.pokemonSwapped = statistics.pokemonSwapped + 1
    
    print("[Pokemon] Swapped Pokemon between slots " .. fromSlot .. " and " .. toSlot .. " for " .. playerId)
    
    return true, partyData
end

-- Replace entire party
-- @param playerId: Player wallet address  
-- @param newParty: Array of Pokemon data (up to 6)
-- @return: Success boolean, party data or error message
function PartyManager.setParty(playerId, newParty)
    if not playerId then
        return false, "Player ID required"
    end
    
    if not newParty or type(newParty) ~= "table" then
        return false, "Party must be an array"
    end
    
    if #newParty > MAX_PARTY_SIZE then
        return false, "Party too large (maximum " .. MAX_PARTY_SIZE .. " Pokemon)"
    end
    
    -- Validate all Pokemon in new party
    for i, pokemon in ipairs(newParty) do
        local isValid, validationError = PokemonValidator.validatePokemon(pokemon)
        if not isValid then
            statistics.validationFailures = statistics.validationFailures + 1
            return false, "Invalid Pokemon at position " .. i .. ": " .. validationError
        end
    end
    
    -- Get or create party data
    local partyData, error = PartyManager.getOrCreateParty(playerId)
    if not partyData then
        return false, error
    end
    
    -- Replace party
    partyData.party = newParty
    partyData.lastModified = 0
    
    -- Update battle readiness
    PartyManager.updateBattleReadiness(playerId)
    
    print("[Pokemon] Set party for " .. playerId .. " (" .. #newParty .. " Pokemon)")
    
    return true, partyData
end

-- Party Validation

-- Update battle readiness status
-- @param playerId: Player wallet address
-- @return: Battle ready status
function PartyManager.updateBattleReadiness(playerId)
    local partyData = PartyManager.getParty(playerId)
    if not partyData then
        return false
    end
    
    local party = partyData.party
    local battleReady = false
    
    -- Check if party has at least one Pokemon that can battle
    if #party >= MIN_PARTY_SIZE_FOR_BATTLE then
        local hasHealthyPokemon = false
        
        for _, pokemon in ipairs(party) do
            if pokemon.hp and pokemon.hp > 0 then
                hasHealthyPokemon = true
                break
            end
        end
        
        battleReady = hasHealthyPokemon
    end
    
    partyData.battleReady = battleReady
    return battleReady
end

-- Validate party composition
-- @param partyData: Party data to validate
-- @return: Boolean indicating validity, error message if invalid
function PartyManager.validateParty(partyData)
    if not partyData then
        return false, "Party data required"
    end
    
    local party = partyData.party
    if not party or type(party) ~= "table" then
        return false, "Party must be an array"
    end
    
    if #party > MAX_PARTY_SIZE then
        return false, "Party exceeds maximum size of " .. MAX_PARTY_SIZE
    end
    
    -- Check for duplicate Pokemon IDs
    local seenIds = {}
    for i, pokemon in ipairs(party) do
        if not pokemon.id then
            return false, "Pokemon at position " .. i .. " missing ID"
        end
        
        if seenIds[pokemon.id] then
            return false, "Duplicate Pokemon ID " .. pokemon.id .. " at position " .. i
        end
        
        seenIds[pokemon.id] = true
        
        -- Validate individual Pokemon
        local isValid, validationError = PokemonValidator.validatePokemon(pokemon)
        if not isValid then
            return false, "Invalid Pokemon at position " .. i .. ": " .. validationError
        end
    end
    
    return true
end

-- Get party battle readiness info
-- @param playerId: Player wallet address
-- @return: Battle readiness information
function PartyManager.getPartyBattleInfo(playerId)
    local partyData = PartyManager.getParty(playerId)
    if not partyData then
        return {
            hasParty = false,
            pokemonCount = 0,
            healthyPokemon = 0,
            battleReady = false
        }
    end
    
    local party = partyData.party
    local healthyPokemon = 0
    
    for _, pokemon in ipairs(party) do
        if pokemon.hp and pokemon.hp > 0 then
            healthyPokemon = healthyPokemon + 1
        end
    end
    
    return {
        hasParty = true,
        pokemonCount = #party,
        healthyPokemon = healthyPokemon,
        battleReady = partyData.battleReady,
        party = party
    }
end

-- Party Information

-- Get party summary
-- @param playerId: Player wallet address
-- @return: Party summary information
function PartyManager.getPartySummary(playerId)
    local partyData = PartyManager.getParty(playerId)
    if not partyData then
        return {
            hasParty = false,
            pokemonCount = 0,
            summary = {}
        }
    end
    
    local summary = {}
    for i, pokemon in ipairs(partyData.party) do
        table.insert(summary, {
            slot = i,
            id = pokemon.id,
            speciesId = pokemon.speciesId,
            species = pokemon.species,
            level = pokemon.level,
            hp = pokemon.hp,
            maxHp = pokemon.maxHp,
            status = pokemon.statusEffect
        })
    end
    
    return {
        hasParty = true,
        pokemonCount = #partyData.party,
        battleReady = partyData.battleReady,
        lastModified = partyData.lastModified,
        summary = summary
    }
end

-- Get first healthy Pokemon in party
-- @param playerId: Player wallet address
-- @return: Pokemon data or nil
function PartyManager.getLeadPokemon(playerId)
    local partyData = PartyManager.getParty(playerId)
    if not partyData or #partyData.party == 0 then
        return nil
    end
    
    -- Return first Pokemon that can battle
    for _, pokemon in ipairs(partyData.party) do
        if pokemon.hp and pokemon.hp > 0 then
            return pokemon
        end
    end
    
    -- If no healthy Pokemon, return first Pokemon anyway
    return partyData.party[1]
end

-- Get all healthy Pokemon in party
-- @param playerId: Player wallet address
-- @return: Array of healthy Pokemon
function PartyManager.getHealthyPokemon(playerId)
    local partyData = PartyManager.getParty(playerId)
    if not partyData then
        return {}
    end
    
    local healthyPokemon = {}
    for _, pokemon in ipairs(partyData.party) do
        if pokemon.hp and pokemon.hp > 0 then
            table.insert(healthyPokemon, pokemon)
        end
    end
    
    return healthyPokemon
end

-- Maintenance and Statistics

-- Perform maintenance
function PartyManager.performMaintenance()
    local currentTime = 0
    local oldPartiesRemoved = 0
    
    -- Clean up parties that haven't been accessed in a very long time
    for playerId, partyData in pairs(playerParties) do
        if not partyData.lastModified or 
           (currentTime - partyData.lastModified) > 2592000 then -- 30 days
            playerParties[playerId] = nil
            oldPartiesRemoved = oldPartiesRemoved + 1
        end
    end
    
    if oldPartiesRemoved > 0 then
        print("[Pokemon] Removed " .. oldPartiesRemoved .. " old parties during maintenance")
    end
end

-- Get statistics
function PartyManager.getStatistics()
    local totalParties = 0
    local totalPokemonInParties = 0
    local battleReadyParties = 0
    
    for _, partyData in pairs(playerParties) do
        totalParties = totalParties + 1
        totalPokemonInParties = totalPokemonInParties + #partyData.party
        if partyData.battleReady then
            battleReadyParties = battleReadyParties + 1
        end
    end
    
    return {
        totalParties = totalParties,
        totalPokemonInParties = totalPokemonInParties,
        battleReadyParties = battleReadyParties,
        partiesCreated = statistics.partiesCreated,
        pokemonAdded = statistics.pokemonAdded,
        pokemonRemoved = statistics.pokemonRemoved,
        pokemonSwapped = statistics.pokemonSwapped,
        validationFailures = statistics.validationFailures
    }
end

-- Export for testing
PartyManager._internal = {
    playerParties = playerParties,
    statistics = statistics,
    MAX_PARTY_SIZE = MAX_PARTY_SIZE
}

return PartyManager