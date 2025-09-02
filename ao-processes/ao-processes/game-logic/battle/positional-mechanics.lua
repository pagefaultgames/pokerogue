-- Positional Mechanics System
-- Handles battle format detection, position tracking, and position-based calculations
-- Supports both single and double battle formats with proper position management

local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")

local PositionalMechanics = {}

-- Battle format constants
PositionalMechanics.BattleFormat = {
    SINGLE = "single",
    DOUBLE = "double"
}

-- Position constants for double battles
PositionalMechanics.BattlePosition = {
    LEFT = 1,
    RIGHT = 2
}

-- Position tracking data structure
PositionalMechanics.PositionData = {
    format = PositionalMechanics.BattleFormat.SINGLE,
    playerPositions = {},
    enemyPositions = {},
    adjacencyMap = {}
}

-- Initialize positional state for battle
-- @param battleState: Current battle state
-- @param playerPartySize: Number of active player Pokemon
-- @param enemyPartySize: Number of active enemy Pokemon
-- @return: Initialized position data or error message
function PositionalMechanics.initializePositionalState(battleState, playerPartySize, enemyPartySize)
    if not battleState then
        return nil, "Battle state required for position initialization"
    end
    
    local positionData = {
        format = PositionalMechanics.BattleFormat.SINGLE,
        playerPositions = {},
        enemyPositions = {},
        adjacencyMap = {}
    }
    
    -- Determine battle format based on party sizes
    local format = PositionalMechanics.detectBattleFormat(playerPartySize or 1, enemyPartySize or 1)
    positionData.format = format
    
    -- Initialize position tracking based on format
    if format == PositionalMechanics.BattleFormat.DOUBLE then
        -- Initialize double battle positions
        positionData.playerPositions = {
            [PositionalMechanics.BattlePosition.LEFT] = nil,
            [PositionalMechanics.BattlePosition.RIGHT] = nil
        }
        positionData.enemyPositions = {
            [PositionalMechanics.BattlePosition.LEFT] = nil,
            [PositionalMechanics.BattlePosition.RIGHT] = nil
        }
        
        -- Set up adjacency mapping for double battles
        positionData.adjacencyMap = PositionalMechanics.buildAdjacencyMap(format)
    else
        -- Single battle positions
        positionData.playerPositions = {[1] = nil}
        positionData.enemyPositions = {[1] = nil}
        positionData.adjacencyMap = {}
    end
    
    -- Store position data in battle state
    battleState.positionData = positionData
    
    return positionData
end

-- Detect battle format based on party configuration
-- @param playerPartySize: Number of active player Pokemon
-- @param enemyPartySize: Number of active enemy Pokemon
-- @return: Detected battle format (SINGLE or DOUBLE)
function PositionalMechanics.detectBattleFormat(playerPartySize, enemyPartySize)
    playerPartySize = playerPartySize or 1
    enemyPartySize = enemyPartySize or 1
    
    -- Double battle if either side has multiple active Pokemon
    if playerPartySize > 1 or enemyPartySize > 1 then
        return PositionalMechanics.BattleFormat.DOUBLE
    end
    
    return PositionalMechanics.BattleFormat.SINGLE
end

-- Assign Pokemon to battlefield position
-- @param battleState: Current battle state
-- @param pokemon: Pokemon to assign position
-- @param side: "player" or "enemy"
-- @param position: Position index (1 for left/single, 2 for right in doubles)
-- @return: Success boolean and result message
function PositionalMechanics.assignPokemonPosition(battleState, pokemon, side, position)
    if not battleState or not battleState.positionData then
        return false, "Position data not initialized"
    end
    
    if not pokemon then
        return false, "Pokemon required for position assignment"
    end
    
    if side ~= "player" and side ~= "enemy" then
        return false, "Invalid side specified"
    end
    
    local positionData = battleState.positionData
    local positions = side == "player" and positionData.playerPositions or positionData.enemyPositions
    
    -- Validate position index
    if not positions[position] then
        -- Check if position exists in the format
        if positionData.format == PositionalMechanics.BattleFormat.SINGLE and position ~= 1 then
            return false, "Single battle only supports position 1"
        elseif positionData.format == PositionalMechanics.BattleFormat.DOUBLE and (position < 1 or position > 2) then
            return false, "Double battle only supports positions 1-2"
        end
    end
    
    -- Assign position
    positions[position] = pokemon.id
    
    -- Set position in Pokemon's battle data
    if not pokemon.battleData then
        pokemon.battleData = {}
    end
    pokemon.battleData.position = position
    pokemon.battleData.side = side
    
    return true, "Position assigned successfully"
end

-- Get Pokemon at specific position
-- @param battleState: Current battle state
-- @param side: "player" or "enemy"
-- @param position: Position index
-- @return: Pokemon at position or nil
function PositionalMechanics.getPokemonAtPosition(battleState, side, position)
    if not battleState or not battleState.positionData then
        return nil
    end
    
    local positionData = battleState.positionData
    local positions = side == "player" and positionData.playerPositions or positionData.enemyPositions
    
    local pokemonId = positions[position]
    if not pokemonId then
        return nil
    end
    
    -- Find Pokemon by ID
    local party = side == "player" and battleState.playerParty or battleState.enemyParty
    for _, pokemon in ipairs(party) do
        if pokemon.id == pokemonId then
            return pokemon
        end
    end
    
    return nil
end

-- Get all active Pokemon positions
-- @param battleState: Current battle state
-- @return: Table with position information for all active Pokemon
function PositionalMechanics.getAllActivePositions(battleState)
    if not battleState or not battleState.positionData then
        return {}
    end
    
    local positionData = battleState.positionData
    local activePositions = {
        format = positionData.format,
        player = {},
        enemy = {}
    }
    
    -- Get player positions
    for position, pokemonId in pairs(positionData.playerPositions) do
        if pokemonId then
            local pokemon = PositionalMechanics.getPokemonAtPosition(battleState, "player", position)
            if pokemon and not pokemon.fainted then
                activePositions.player[position] = {
                    pokemon_id = pokemonId,
                    name = pokemon.name or "Unknown",
                    fainted = false
                }
            end
        end
    end
    
    -- Get enemy positions
    for position, pokemonId in pairs(positionData.enemyPositions) do
        if pokemonId then
            local pokemon = PositionalMechanics.getPokemonAtPosition(battleState, "enemy", position)
            if pokemon and not pokemon.fainted then
                activePositions.enemy[position] = {
                    pokemon_id = pokemonId,
                    name = pokemon.name or "Unknown",
                    fainted = false
                }
            end
        end
    end
    
    return activePositions
end

-- Build adjacency map for double battles
-- @param format: Battle format
-- @return: Adjacency mapping table
function PositionalMechanics.buildAdjacencyMap(format)
    if format ~= PositionalMechanics.BattleFormat.DOUBLE then
        return {}
    end
    
    return {
        -- Adjacent positions for each side
        player = {
            [PositionalMechanics.BattlePosition.LEFT] = {PositionalMechanics.BattlePosition.RIGHT},
            [PositionalMechanics.BattlePosition.RIGHT] = {PositionalMechanics.BattlePosition.LEFT}
        },
        enemy = {
            [PositionalMechanics.BattlePosition.LEFT] = {PositionalMechanics.BattlePosition.RIGHT},
            [PositionalMechanics.BattlePosition.RIGHT] = {PositionalMechanics.BattlePosition.LEFT}
        }
    }
end

-- Get adjacent Pokemon for positional abilities
-- @param battleState: Current battle state
-- @param pokemon: Pokemon to find adjacent allies for
-- @return: Array of adjacent ally Pokemon
function PositionalMechanics.getAdjacentAllies(battleState, pokemon)
    if not battleState or not pokemon or not pokemon.battleData then
        return {}
    end
    
    local positionData = battleState.positionData
    if positionData.format ~= PositionalMechanics.BattleFormat.DOUBLE then
        return {} -- No adjacency in single battles
    end
    
    local side = pokemon.battleData.side
    local position = pokemon.battleData.position
    
    if not side or not position then
        return {}
    end
    
    local adjacentPositions = positionData.adjacencyMap[side] and positionData.adjacencyMap[side][position] or {}
    local adjacentAllies = {}
    
    for _, adjPosition in ipairs(adjacentPositions) do
        local adjPokemon = PositionalMechanics.getPokemonAtPosition(battleState, side, adjPosition)
        if adjPokemon and not adjPokemon.fainted then
            table.insert(adjacentAllies, adjPokemon)
        end
    end
    
    return adjacentAllies
end

-- Swap positions between two Pokemon
-- @param battleState: Current battle state
-- @param pokemon1: First Pokemon
-- @param pokemon2: Second Pokemon
-- @return: Success boolean and result message
function PositionalMechanics.swapPokemonPositions(battleState, pokemon1, pokemon2)
    if not battleState or not battleState.positionData then
        return false, "Position data not initialized"
    end
    
    if not pokemon1 or not pokemon2 then
        return false, "Both Pokemon required for position swap"
    end
    
    if not pokemon1.battleData or not pokemon2.battleData then
        return false, "Pokemon missing battle data for position swap"
    end
    
    local side1 = pokemon1.battleData.side
    local side2 = pokemon2.battleData.side
    local pos1 = pokemon1.battleData.position
    local pos2 = pokemon2.battleData.position
    
    -- Must be same side (allies only)
    if side1 ~= side2 then
        return false, "Can only swap positions between allies"
    end
    
    -- Must be different positions
    if pos1 == pos2 then
        return false, "Pokemon are already in the same position"
    end
    
    local positionData = battleState.positionData
    local positions = side1 == "player" and positionData.playerPositions or positionData.enemyPositions
    
    -- Perform position swap
    positions[pos1] = pokemon2.id
    positions[pos2] = pokemon1.id
    
    -- Update Pokemon battle data
    pokemon1.battleData.position = pos2
    pokemon2.battleData.position = pos1
    
    return true, string.format("Swapped positions: %s to position %d, %s to position %d", 
        pokemon1.name or "Pokemon1", pos2, pokemon2.name or "Pokemon2", pos1)
end

-- Update position tracking when Pokemon faints
-- @param battleState: Current battle state
-- @param pokemon: Fainted Pokemon
-- @return: Updated position tracking
function PositionalMechanics.handlePokemonFaint(battleState, pokemon)
    if not battleState or not battleState.positionData or not pokemon then
        return
    end
    
    if not pokemon.battleData or not pokemon.battleData.side or not pokemon.battleData.position then
        return
    end
    
    local side = pokemon.battleData.side
    local position = pokemon.battleData.position
    
    local positionData = battleState.positionData
    local positions = side == "player" and positionData.playerPositions or positionData.enemyPositions
    
    -- Clear position
    positions[position] = nil
    
    -- Clear Pokemon position data
    pokemon.battleData.position = nil
end

-- Get battle format information
-- @param battleState: Current battle state
-- @return: Battle format details
function PositionalMechanics.getBattleFormatInfo(battleState)
    if not battleState or not battleState.positionData then
        return {
            format = PositionalMechanics.BattleFormat.SINGLE,
            supports_positioning = false,
            max_active_per_side = 1
        }
    end
    
    local format = battleState.positionData.format
    
    return {
        format = format,
        supports_positioning = format == PositionalMechanics.BattleFormat.DOUBLE,
        max_active_per_side = format == PositionalMechanics.BattleFormat.DOUBLE and 2 or 1,
        position_data = battleState.positionData
    }
end

-- Initialize positions for battle start
-- @param battleState: Current battle state
-- @param activePlayerPokemon: Array of active player Pokemon
-- @param activeEnemyPokemon: Array of active enemy Pokemon
-- @return: Success boolean and message
function PositionalMechanics.initializeBattlePositions(battleState, activePlayerPokemon, activeEnemyPokemon)
    if not battleState then
        return false, "Battle state required"
    end
    
    -- Initialize positional state
    local positionData, error = PositionalMechanics.initializePositionalState(
        battleState,
        activePlayerPokemon and #activePlayerPokemon or 1,
        activeEnemyPokemon and #activeEnemyPokemon or 1
    )
    
    if not positionData then
        return false, error
    end
    
    -- Assign starting positions for player Pokemon
    if activePlayerPokemon then
        for i, pokemon in ipairs(activePlayerPokemon) do
            local success, message = PositionalMechanics.assignPokemonPosition(battleState, pokemon, "player", i)
            if not success then
                return false, "Failed to assign player position " .. i .. ": " .. message
            end
        end
    end
    
    -- Assign starting positions for enemy Pokemon
    if activeEnemyPokemon then
        for i, pokemon in ipairs(activeEnemyPokemon) do
            local success, message = PositionalMechanics.assignPokemonPosition(battleState, pokemon, "enemy", i)
            if not success then
                return false, "Failed to assign enemy position " .. i .. ": " .. message
            end
        end
    end
    
    return true, "Battle positions initialized successfully"
end

-- Check if battle format supports positional mechanics
-- @param battleState: Current battle state
-- @return: Boolean indicating positional support
function PositionalMechanics.supportsPositionalMechanics(battleState)
    if not battleState or not battleState.positionData then
        return false
    end
    
    return battleState.positionData.format == PositionalMechanics.BattleFormat.DOUBLE
end

-- Get position-based targeting options
-- @param battleState: Current battle state
-- @param attackerPokemon: Pokemon using the move
-- @return: Available target positions and Pokemon
function PositionalMechanics.getPositionTargetingOptions(battleState, attackerPokemon)
    if not battleState or not attackerPokemon then
        return {}
    end
    
    local formatInfo = PositionalMechanics.getBattleFormatInfo(battleState)
    local targetingOptions = {
        allies = {},
        opponents = {},
        all = {}
    }
    
    if not attackerPokemon.battleData then
        return targetingOptions
    end
    
    local attackerSide = attackerPokemon.battleData.side
    local allySide = attackerSide
    local opponentSide = attackerSide == "player" and "enemy" or "player"
    
    -- Get ally targeting options
    for position = 1, formatInfo.max_active_per_side do
        local allyPokemon = PositionalMechanics.getPokemonAtPosition(battleState, allySide, position)
        if allyPokemon and allyPokemon.id ~= attackerPokemon.id and not allyPokemon.fainted then
            table.insert(targetingOptions.allies, {
                pokemon = allyPokemon,
                position = position,
                side = allySide
            })
            table.insert(targetingOptions.all, {
                pokemon = allyPokemon,
                position = position,
                side = allySide,
                relationship = "ally"
            })
        end
    end
    
    -- Get opponent targeting options
    for position = 1, formatInfo.max_active_per_side do
        local opponentPokemon = PositionalMechanics.getPokemonAtPosition(battleState, opponentSide, position)
        if opponentPokemon and not opponentPokemon.fainted then
            table.insert(targetingOptions.opponents, {
                pokemon = opponentPokemon,
                position = position,
                side = opponentSide
            })
            table.insert(targetingOptions.all, {
                pokemon = opponentPokemon,
                position = position,
                side = opponentSide,
                relationship = "opponent"
            })
        end
    end
    
    return targetingOptions
end

return PositionalMechanics