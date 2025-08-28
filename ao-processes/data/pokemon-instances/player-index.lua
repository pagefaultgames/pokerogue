--[[
Player Pokemon Index System
Fast mapping and retrieval of Pokemon owned by players

Handles:
- Player-to-Pokemon mapping with fast lookups
- Pokemon collection organization (party, PC, etc.)
- Player ownership validation
- Collection statistics and management
--]]

local PlayerIndex = {}

-- Import Pokemon storage for data consistency
local PokemonStorage = require("data.pokemon-instances.pokemon-storage")

-- Player collection types
local CollectionTypes = {
    PARTY = "party",       -- Active battle party (max 6)
    PC_BOX = "pc_box",     -- PC storage boxes
    DAYCARE = "daycare",   -- Breeding daycare
    TRADE = "trade"        -- Pokemon in trade
}

-- Constants
local MAX_PARTY_SIZE = 6
local MAX_BOX_SIZE = 30
local MAX_BOXES = 20
local MAX_DAYCARE_SIZE = 2

-- Player collection storage
if not _G.PlayerCollections then
    _G.PlayerCollections = {}
end

-- Collection Management

-- Initialize player collections
-- @param playerId: Player ID
-- @return: Boolean success
function PlayerIndex.initializePlayer(playerId)
    if not playerId or playerId == "" then
        return false, "Invalid player ID"
    end
    
    if _G.PlayerCollections[playerId] then
        return true  -- Already initialized
    end
    
    _G.PlayerCollections[playerId] = {
        party = {},           -- Active Pokemon party
        boxes = {},           -- PC boxes (array of box arrays)
        daycare = {},         -- Daycare Pokemon
        trade = {},           -- Pokemon in trade
        activeBox = 1,        -- Currently selected box
        lastActivity = os.time()
    }
    
    -- Initialize PC boxes
    for i = 1, MAX_BOXES do
        _G.PlayerCollections[playerId].boxes[i] = {}
    end
    
    return true
end

-- Get player collection data
-- @param playerId: Player ID
-- @return: Player collection data or nil
function PlayerIndex.getPlayerCollections(playerId)
    if not playerId then
        return nil, "Player ID is required"
    end
    
    return _G.PlayerCollections[playerId]
end

-- Party Management

-- Add Pokemon to player's party
-- @param playerId: Player ID
-- @param pokemonId: Pokemon instance ID
-- @param position: Optional position (1-6), if nil adds to first empty slot
-- @return: Boolean success and error message
function PlayerIndex.addToParty(playerId, pokemonId, position)
    if not playerId or not pokemonId then
        return false, "Player ID and Pokemon ID are required"
    end
    
    -- Initialize player if needed
    PlayerIndex.initializePlayer(playerId)
    
    local collections = _G.PlayerCollections[playerId]
    local party = collections.party
    
    -- Validate Pokemon exists and ownership
    local pokemon = PokemonStorage.get(pokemonId)
    if not pokemon then
        return false, "Pokemon not found: " .. pokemonId
    end
    
    if pokemon.playerId ~= playerId then
        return false, "Pokemon belongs to different player"
    end
    
    -- Check if Pokemon is already in party
    for i, id in ipairs(party) do
        if id == pokemonId then
            return false, "Pokemon already in party"
        end
    end
    
    -- Handle position-specific addition
    if position then
        if position < 1 or position > MAX_PARTY_SIZE then
            return false, "Invalid party position: " .. position
        end
        
        -- If position is occupied, return error
        if party[position] then
            return false, "Party position " .. position .. " is already occupied"
        end
        
        party[position] = pokemonId
    else
        -- Find first empty slot
        if #party >= MAX_PARTY_SIZE then
            return false, "Party is full (maximum " .. MAX_PARTY_SIZE .. " Pokemon)"
        end
        
        table.insert(party, pokemonId)
    end
    
    collections.lastActivity = os.time()
    return true
end

-- Remove Pokemon from party
-- @param playerId: Player ID
-- @param pokemonId: Pokemon instance ID
-- @return: Boolean success
function PlayerIndex.removeFromParty(playerId, pokemonId)
    if not playerId or not pokemonId then
        return false, "Player ID and Pokemon ID are required"
    end
    
    local collections = _G.PlayerCollections[playerId]
    if not collections then
        return false, "Player collections not found"
    end
    
    local party = collections.party
    
    for i, id in ipairs(party) do
        if id == pokemonId then
            table.remove(party, i)
            collections.lastActivity = os.time()
            return true
        end
    end
    
    return false, "Pokemon not found in party"
end

-- Get Pokemon in party
-- @param playerId: Player ID
-- @return: Array of Pokemon instances in party order
function PlayerIndex.getParty(playerId)
    if not playerId then
        return {}, "Player ID is required"
    end
    
    local collections = _G.PlayerCollections[playerId]
    if not collections then
        return {}
    end
    
    local partyPokemon = {}
    for _, pokemonId in ipairs(collections.party) do
        local pokemon = PokemonStorage.get(pokemonId)
        if pokemon then
            table.insert(partyPokemon, pokemon)
        end
    end
    
    return partyPokemon
end

-- Swap Pokemon positions in party
-- @param playerId: Player ID
-- @param position1: First position (1-6)
-- @param position2: Second position (1-6)
-- @return: Boolean success
function PlayerIndex.swapPartyPositions(playerId, position1, position2)
    if not playerId then
        return false, "Player ID is required"
    end
    
    if not position1 or not position2 then
        return false, "Both positions are required"
    end
    
    if position1 < 1 or position1 > MAX_PARTY_SIZE or position2 < 1 or position2 > MAX_PARTY_SIZE then
        return false, "Invalid party positions"
    end
    
    local collections = _G.PlayerCollections[playerId]
    if not collections then
        return false, "Player collections not found"
    end
    
    local party = collections.party
    
    -- Swap positions
    party[position1], party[position2] = party[position2], party[position1]
    
    collections.lastActivity = os.time()
    return true
end

-- PC Box Management

-- Add Pokemon to PC box
-- @param playerId: Player ID
-- @param pokemonId: Pokemon instance ID
-- @param boxNumber: Box number (1-20), if nil uses active box
-- @return: Boolean success and error message
function PlayerIndex.addToBox(playerId, pokemonId, boxNumber)
    if not playerId or not pokemonId then
        return false, "Player ID and Pokemon ID are required"
    end
    
    PlayerIndex.initializePlayer(playerId)
    
    local collections = _G.PlayerCollections[playerId]
    boxNumber = boxNumber or collections.activeBox
    
    if boxNumber < 1 or boxNumber > MAX_BOXES then
        return false, "Invalid box number: " .. boxNumber
    end
    
    local box = collections.boxes[boxNumber]
    if #box >= MAX_BOX_SIZE then
        return false, "Box " .. boxNumber .. " is full (maximum " .. MAX_BOX_SIZE .. " Pokemon)"
    end
    
    -- Validate Pokemon exists and ownership
    local pokemon = PokemonStorage.get(pokemonId)
    if not pokemon then
        return false, "Pokemon not found: " .. pokemonId
    end
    
    if pokemon.playerId ~= playerId then
        return false, "Pokemon belongs to different player"
    end
    
    -- Check if Pokemon is already in any collection
    if PlayerIndex.findPokemonLocation(playerId, pokemonId) then
        return false, "Pokemon is already in a collection"
    end
    
    table.insert(box, pokemonId)
    collections.lastActivity = os.time()
    return true
end

-- Remove Pokemon from PC box
-- @param playerId: Player ID
-- @param pokemonId: Pokemon instance ID
-- @param boxNumber: Box number (optional, searches all boxes if nil)
-- @return: Boolean success
function PlayerIndex.removeFromBox(playerId, pokemonId, boxNumber)
    if not playerId or not pokemonId then
        return false, "Player ID and Pokemon ID are required"
    end
    
    local collections = _G.PlayerCollections[playerId]
    if not collections then
        return false, "Player collections not found"
    end
    
    local searchBoxes = boxNumber and {boxNumber} or {}
    if not boxNumber then
        for i = 1, MAX_BOXES do
            table.insert(searchBoxes, i)
        end
    end
    
    for _, boxNum in ipairs(searchBoxes) do
        local box = collections.boxes[boxNum]
        if box then
            for i, id in ipairs(box) do
                if id == pokemonId then
                    table.remove(box, i)
                    collections.lastActivity = os.time()
                    return true
                end
            end
        end
    end
    
    return false, "Pokemon not found in specified box(es)"
end

-- Get Pokemon in specific PC box
-- @param playerId: Player ID
-- @param boxNumber: Box number (1-20)
-- @return: Array of Pokemon instances
function PlayerIndex.getBox(playerId, boxNumber)
    if not playerId or not boxNumber then
        return {}, "Player ID and box number are required"
    end
    
    if boxNumber < 1 or boxNumber > MAX_BOXES then
        return {}, "Invalid box number"
    end
    
    local collections = _G.PlayerCollections[playerId]
    if not collections then
        return {}
    end
    
    local boxPokemon = {}
    local box = collections.boxes[boxNumber]
    
    if box then
        for _, pokemonId in ipairs(box) do
            local pokemon = PokemonStorage.get(pokemonId)
            if pokemon then
                table.insert(boxPokemon, pokemon)
            end
        end
    end
    
    return boxPokemon
end

-- Set active PC box
-- @param playerId: Player ID
-- @param boxNumber: Box number (1-20)
-- @return: Boolean success
function PlayerIndex.setActiveBox(playerId, boxNumber)
    if not playerId or not boxNumber then
        return false, "Player ID and box number are required"
    end
    
    if boxNumber < 1 or boxNumber > MAX_BOXES then
        return false, "Invalid box number: " .. boxNumber
    end
    
    PlayerIndex.initializePlayer(playerId)
    
    local collections = _G.PlayerCollections[playerId]
    collections.activeBox = boxNumber
    collections.lastActivity = os.time()
    
    return true
end

-- Specialized Collections

-- Add Pokemon to daycare
-- @param playerId: Player ID
-- @param pokemonId: Pokemon instance ID
-- @return: Boolean success
function PlayerIndex.addToDaycare(playerId, pokemonId)
    if not playerId or not pokemonId then
        return false, "Player ID and Pokemon ID are required"
    end
    
    PlayerIndex.initializePlayer(playerId)
    
    local collections = _G.PlayerCollections[playerId]
    local daycare = collections.daycare
    
    if #daycare >= MAX_DAYCARE_SIZE then
        return false, "Daycare is full (maximum " .. MAX_DAYCARE_SIZE .. " Pokemon)"
    end
    
    -- Validate Pokemon exists and ownership
    local pokemon = PokemonStorage.get(pokemonId)
    if not pokemon then
        return false, "Pokemon not found: " .. pokemonId
    end
    
    if pokemon.playerId ~= playerId then
        return false, "Pokemon belongs to different player"
    end
    
    table.insert(daycare, pokemonId)
    collections.lastActivity = os.time()
    return true
end

-- Remove Pokemon from daycare
-- @param playerId: Player ID
-- @param pokemonId: Pokemon instance ID
-- @return: Boolean success
function PlayerIndex.removeFromDaycare(playerId, pokemonId)
    if not playerId or not pokemonId then
        return false, "Player ID and Pokemon ID are required"
    end
    
    local collections = _G.PlayerCollections[playerId]
    if not collections then
        return false, "Player collections not found"
    end
    
    local daycare = collections.daycare
    
    for i, id in ipairs(daycare) do
        if id == pokemonId then
            table.remove(daycare, i)
            collections.lastActivity = os.time()
            return true
        end
    end
    
    return false, "Pokemon not found in daycare"
end

-- Query and Search Functions

-- Find Pokemon location in player's collections
-- @param playerId: Player ID
-- @param pokemonId: Pokemon instance ID
-- @return: Location info or nil if not found
function PlayerIndex.findPokemonLocation(playerId, pokemonId)
    if not playerId or not pokemonId then
        return nil
    end
    
    local collections = _G.PlayerCollections[playerId]
    if not collections then
        return nil
    end
    
    -- Check party
    for i, id in ipairs(collections.party) do
        if id == pokemonId then
            return {
                type = CollectionTypes.PARTY,
                position = i
            }
        end
    end
    
    -- Check PC boxes
    for boxNum, box in ipairs(collections.boxes) do
        for pos, id in ipairs(box) do
            if id == pokemonId then
                return {
                    type = CollectionTypes.PC_BOX,
                    box = boxNum,
                    position = pos
                }
            end
        end
    end
    
    -- Check daycare
    for i, id in ipairs(collections.daycare) do
        if id == pokemonId then
            return {
                type = CollectionTypes.DAYCARE,
                position = i
            }
        end
    end
    
    return nil
end

-- Get all Pokemon owned by player
-- @param playerId: Player ID
-- @param includeLocation: Include location info for each Pokemon
-- @return: Array of Pokemon instances with optional location data
function PlayerIndex.getAllPokemon(playerId, includeLocation)
    if not playerId then
        return {}, "Player ID is required"
    end
    
    local collections = _G.PlayerCollections[playerId]
    if not collections then
        return {}
    end
    
    local allPokemon = {}
    
    -- Add party Pokemon
    for i, pokemonId in ipairs(collections.party) do
        local pokemon = PokemonStorage.get(pokemonId)
        if pokemon then
            if includeLocation then
                pokemon._location = {
                    type = CollectionTypes.PARTY,
                    position = i
                }
            end
            table.insert(allPokemon, pokemon)
        end
    end
    
    -- Add PC box Pokemon
    for boxNum, box in ipairs(collections.boxes) do
        for pos, pokemonId in ipairs(box) do
            local pokemon = PokemonStorage.get(pokemonId)
            if pokemon then
                if includeLocation then
                    pokemon._location = {
                        type = CollectionTypes.PC_BOX,
                        box = boxNum,
                        position = pos
                    }
                end
                table.insert(allPokemon, pokemon)
            end
        end
    end
    
    -- Add daycare Pokemon
    for i, pokemonId in ipairs(collections.daycare) do
        local pokemon = PokemonStorage.get(pokemonId)
        if pokemon then
            if includeLocation then
                pokemon._location = {
                    type = CollectionTypes.DAYCARE,
                    position = i
                }
            end
            table.insert(allPokemon, pokemon)
        end
    end
    
    return allPokemon
end

-- Get player collection statistics
-- @param playerId: Player ID
-- @return: Statistics table
function PlayerIndex.getPlayerStats(playerId)
    if not playerId then
        return {}, "Player ID is required"
    end
    
    local collections = _G.PlayerCollections[playerId]
    if not collections then
        return {
            totalPokemon = 0,
            partyCount = 0,
            boxCount = 0,
            daycareCount = 0,
            activeBox = 1
        }
    end
    
    local boxCount = 0
    for _, box in ipairs(collections.boxes) do
        boxCount = boxCount + #box
    end
    
    return {
        totalPokemon = #collections.party + boxCount + #collections.daycare,
        partyCount = #collections.party,
        boxCount = boxCount,
        daycareCount = #collections.daycare,
        activeBox = collections.activeBox,
        lastActivity = collections.lastActivity
    }
end

-- Maintenance Functions

-- Clear player collections (for testing)
-- @param playerId: Player ID
-- @return: Boolean success
function PlayerIndex.clearPlayer(playerId)
    if not playerId then
        return false, "Player ID is required"
    end
    
    _G.PlayerCollections[playerId] = nil
    return true
end

-- Clear all collections (for testing)
function PlayerIndex.clearAll()
    _G.PlayerCollections = {}
end

-- Validate player collections integrity
-- @param playerId: Player ID
-- @return: Boolean indicating if collections are consistent
function PlayerIndex.validatePlayer(playerId)
    if not playerId then
        return false, "Player ID is required"
    end
    
    local collections = _G.PlayerCollections[playerId]
    if not collections then
        return true  -- No collections is valid
    end
    
    local errors = {}
    
    -- Validate party
    if #collections.party > MAX_PARTY_SIZE then
        table.insert(errors, "Party exceeds maximum size")
    end
    
    -- Validate each Pokemon in party exists and belongs to player
    for i, pokemonId in ipairs(collections.party) do
        local pokemon = PokemonStorage.get(pokemonId)
        if not pokemon then
            table.insert(errors, "Party references non-existent Pokemon: " .. pokemonId)
        elseif pokemon.playerId ~= playerId then
            table.insert(errors, "Party contains Pokemon belonging to different player: " .. pokemonId)
        end
    end
    
    -- Validate PC boxes
    for boxNum, box in ipairs(collections.boxes) do
        if #box > MAX_BOX_SIZE then
            table.insert(errors, "Box " .. boxNum .. " exceeds maximum size")
        end
        
        for pos, pokemonId in ipairs(box) do
            local pokemon = PokemonStorage.get(pokemonId)
            if not pokemon then
                table.insert(errors, "Box " .. boxNum .. " references non-existent Pokemon: " .. pokemonId)
            elseif pokemon.playerId ~= playerId then
                table.insert(errors, "Box " .. boxNum .. " contains Pokemon belonging to different player: " .. pokemonId)
            end
        end
    end
    
    -- Validate daycare
    if #collections.daycare > MAX_DAYCARE_SIZE then
        table.insert(errors, "Daycare exceeds maximum size")
    end
    
    for i, pokemonId in ipairs(collections.daycare) do
        local pokemon = PokemonStorage.get(pokemonId)
        if not pokemon then
            table.insert(errors, "Daycare references non-existent Pokemon: " .. pokemonId)
        elseif pokemon.playerId ~= playerId then
            table.insert(errors, "Daycare contains Pokemon belonging to different player: " .. pokemonId)
        end
    end
    
    return #errors == 0, errors
end

-- Get collection type constants
function PlayerIndex.getCollectionTypes()
    return CollectionTypes
end

return PlayerIndex