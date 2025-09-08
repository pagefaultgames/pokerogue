-- Battle State Handler
-- Processes battle state queries and synchronization requests
-- Provides real-time battle state access for UI and agent decision making
-- Epic 32.3: Battle Engine Process Extraction

local BattleStateHandler = {}

-- Load dependencies
local BattleStateManager = require("battle.components.battle-state-manager")
local ConcurrentBattleManager = require("battle.components.concurrent-battle-manager")

-- Load inter-process communication components
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")

-- Query types
BattleStateHandler.QueryType = {
    FULL_STATE = "FULL_STATE",
    BATTLE_STATUS = "BATTLE_STATUS",
    TURN_RESULT = "TURN_RESULT",
    AVAILABLE_ACTIONS = "AVAILABLE_ACTIONS",
    BATTLE_HISTORY = "BATTLE_HISTORY",
    POKEMON_STATE = "POKEMON_STATE",
    BATTLE_CONDITIONS = "BATTLE_CONDITIONS"
}

-- State access levels
BattleStateHandler.AccessLevel = {
    PUBLIC = "PUBLIC",
    PLAYER = "PLAYER",
    COORDINATOR = "COORDINATOR",
    ADMIN = "ADMIN"
}

-- Query validation schemas
local QUERY_SCHEMAS = {
    FULL_STATE = {
        required = {"battleId"},
        optional = {"accessLevel", "correlation"}
    },
    BATTLE_STATUS = {
        required = {"battleId"},
        optional = {"correlation"}
    },
    BATTLE_HISTORY = {
        required = {"battleId"},
        optional = {"limit", "correlation"}
    },
    POKEMON_STATE = {
        required = {"battleId", "pokemonId"},
        optional = {"playerId", "correlation"}
    }
}

-- Process battle state query message
-- @param msg: AO message with query data
-- @return: JSON response string
function BattleStateHandler.process(msg)
    local startTime = msg.Timestamp
    
    -- Parse message data
    local success, messageData = pcall(json.decode, msg.Data or "{}")
    if not success then
        return json.encode({
            success = false,
            error = "Invalid JSON in message data",
            timestamp = 0
        })
    end
    
    -- Extract query information
    local query = messageData.query or {}
    local correlationId = messageData.correlation and messageData.correlation.id
    
    -- Determine query type
    local queryType = query.queryType
    if not queryType then
        return BattleStateHandler.createErrorResponse(
            correlationId,
            "Missing queryType in query data",
            "INVALID_QUERY"
        )
    end
    
    -- Validate query structure
    local schema = QUERY_SCHEMAS[queryType]
    if not schema then
        return BattleStateHandler.createErrorResponse(
            correlationId,
            "Unknown query type: " .. queryType,
            "UNKNOWN_QUERY"
        )
    end
    
    local validationResult = BattleStateHandler.validateQueryData(query, schema)
    if not validationResult.valid then
        return BattleStateHandler.createErrorResponse(
            correlationId,
            validationResult.error,
            "VALIDATION_ERROR"
        )
    end
    
    -- Determine access level
    local accessLevel = BattleStateHandler.determineAccessLevel(msg, query)
    
    -- Process based on query type
    local result
    if queryType == BattleStateHandler.QueryType.FULL_STATE then
        result = BattleStateHandler.processFullStateQuery(query, accessLevel, msg)
    elseif queryType == BattleStateHandler.QueryType.BATTLE_STATUS then
        result = BattleStateHandler.processBattleStatusQuery(query, accessLevel, msg)
    elseif queryType == BattleStateHandler.QueryType.BATTLE_HISTORY then
        result = BattleStateHandler.processBattleHistoryQuery(query, accessLevel, msg)
    elseif queryType == BattleStateHandler.QueryType.POKEMON_STATE then
        result = BattleStateHandler.processPokemonStateQuery(query, accessLevel, msg)
    elseif queryType == BattleStateHandler.QueryType.BATTLE_CONDITIONS then
        result = BattleStateHandler.processBattleConditionsQuery(query, accessLevel, msg)
    elseif queryType == BattleStateHandler.QueryType.AVAILABLE_ACTIONS then
        result = BattleStateHandler.processAvailableActionsQuery(query, accessLevel, msg)
    else
        result = BattleStateHandler.createErrorResponse(
            correlationId,
            "Unhandled query type: " .. queryType,
            "UNHANDLED_QUERY"
        )
    end
    
    -- Add processing metrics
    local processingTime = 0 - startTime
    if type(result) == "table" then
        local resultData = json.decode(result)
        resultData.processing_time = processingTime
        result = json.encode(resultData)
    end
    
    return result
end

-- Validate query data against schema
-- @param query: Query data
-- @param schema: Validation schema
-- @return: Validation result
function BattleStateHandler.validateQueryData(query, schema)
    -- Check required fields
    for _, field in ipairs(schema.required) do
        if not query[field] then
            return {
                valid = false,
                error = "Missing required field: " .. field
            }
        end
    end
    
    return {valid = true}
end

-- Determine access level based on message source and query data
-- @param msg: Original AO message
-- @param query: Query data
-- @return: Access level string
function BattleStateHandler.determineAccessLevel(msg, query)
    -- In production, this would check message authentication
    -- For now, default to PLAYER level
    return query.accessLevel or BattleStateHandler.AccessLevel.PLAYER
end

-- Process full state query
-- @param query: Query data
-- @param accessLevel: Access level for response filtering
-- @param msg: Original AO message
-- @return: JSON response string
function BattleStateHandler.processFullStateQuery(query, accessLevel, msg)
    local correlationId = query.correlation and query.correlation.id
    local battleId = query.battleId
    
    -- Get battle state
    local battleState = BattleStateManager.getBattleState(battleId)
    if not battleState then
        return BattleStateHandler.createErrorResponse(
            correlationId,
            "Battle state not found: " .. battleId,
            "BATTLE_NOT_FOUND"
        )
    end
    
    -- Filter state based on access level
    local filteredState = BattleStateHandler.filterBattleState(battleState, accessLevel)
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "FULL_STATE_RESULT"
        },
        result = {
            success = true,
            battleId = battleId,
            battleState = filteredState,
            accessLevel = accessLevel
        },
        timestamp = 0
    })
end

-- Process battle status query
-- @param query: Query data
-- @param accessLevel: Access level
-- @param msg: Original AO message
-- @return: JSON response string
function BattleStateHandler.processBattleStatusQuery(query, accessLevel, msg)
    local correlationId = query.correlation and query.correlation.id
    local battleId = query.battleId
    
    -- Get battle instance
    local battleInstance = ConcurrentBattleManager.getBattleInstance(battleId)
    if not battleInstance then
        return BattleStateHandler.createErrorResponse(
            correlationId,
            "Battle instance not found: " .. battleId,
            "BATTLE_NOT_FOUND"
        )
    end
    
    local status = {
        battleId = battleId,
        status = battleInstance.status,
        turn = battleInstance.battleState.turn,
        phase = battleInstance.battleState.phase,
        lastProcessed = battleInstance.lastProcessed,
        resourcePoolId = battleInstance.resourcePoolId
    }
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "BATTLE_STATUS_RESULT"
        },
        result = {
            success = true,
            battleStatus = status
        },
        timestamp = 0
    })
end

-- Process battle history query
-- @param query: Query data
-- @param accessLevel: Access level
-- @param msg: Original AO message
-- @return: JSON response string
function BattleStateHandler.processBattleHistoryQuery(query, accessLevel, msg)
    local correlationId = query.correlation and query.correlation.id
    local battleId = query.battleId
    local limit = query.limit or 50
    
    -- Get battle history
    local history = BattleStateManager.getBattleHistory(battleId, limit)
    
    -- Filter history based on access level
    local filteredHistory = BattleStateHandler.filterBattleHistory(history, accessLevel)
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "BATTLE_HISTORY_RESULT"
        },
        result = {
            success = true,
            battleId = battleId,
            history = filteredHistory,
            entryCount = #filteredHistory
        },
        timestamp = 0
    })
end

-- Process Pokemon state query
-- @param query: Query data
-- @param accessLevel: Access level
-- @param msg: Original AO message
-- @return: JSON response string
function BattleStateHandler.processPokemonStateQuery(query, accessLevel, msg)
    local correlationId = query.correlation and query.correlation.id
    local battleId = query.battleId
    local pokemonId = query.pokemonId
    
    -- Get battle state
    local battleState = BattleStateManager.getBattleState(battleId)
    if not battleState then
        return BattleStateHandler.createErrorResponse(
            correlationId,
            "Battle state not found: " .. battleId,
            "BATTLE_NOT_FOUND"
        )
    end
    
    -- Find Pokemon in battle
    local pokemon = nil
    for _, p in ipairs(battleState.playerParty) do
        if p.id == pokemonId then
            pokemon = p
            break
        end
    end
    
    if not pokemon then
        for _, p in ipairs(battleState.enemyParty) do
            if p.id == pokemonId then
                pokemon = p
                break
            end
        end
    end
    
    if not pokemon then
        return BattleStateHandler.createErrorResponse(
            correlationId,
            "Pokemon not found: " .. pokemonId,
            "POKEMON_NOT_FOUND"
        )
    end
    
    -- Filter Pokemon data based on access level
    local filteredPokemon = BattleStateHandler.filterPokemonState(pokemon, accessLevel)
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "POKEMON_STATE_RESULT"
        },
        result = {
            success = true,
            battleId = battleId,
            pokemonId = pokemonId,
            pokemonState = filteredPokemon
        },
        timestamp = 0
    })
end

-- Process battle conditions query
-- @param query: Query data
-- @param accessLevel: Access level
-- @param msg: Original AO message
-- @return: JSON response string
function BattleStateHandler.processBattleConditionsQuery(query, accessLevel, msg)
    local correlationId = query.correlation and query.correlation.id
    local battleId = query.battleId
    
    -- Get battle state
    local battleState = BattleStateManager.getBattleState(battleId)
    if not battleState then
        return BattleStateHandler.createErrorResponse(
            correlationId,
            "Battle state not found: " .. battleId,
            "BATTLE_NOT_FOUND"
        )
    end
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "BATTLE_CONDITIONS_RESULT"
        },
        result = {
            success = true,
            battleId = battleId,
            battleConditions = battleState.battleConditions
        },
        timestamp = 0
    })
end

-- Process available actions query
-- @param query: Query data
-- @param accessLevel: Access level
-- @param msg: Original AO message
-- @return: JSON response string
function BattleStateHandler.processAvailableActionsQuery(query, accessLevel, msg)
    local correlationId = query.correlation and query.correlation.id
    local battleId = query.battleId
    
    -- Get battle instance
    local battleInstance = ConcurrentBattleManager.getBattleInstance(battleId)
    if not battleInstance then
        return BattleStateHandler.createErrorResponse(
            correlationId,
            "Battle instance not found: " .. battleId,
            "BATTLE_NOT_FOUND"
        )
    end
    
    -- Calculate available actions based on battle state
    local availableActions = BattleStateHandler.calculateAvailableActions(battleInstance.battleState)
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "AVAILABLE_ACTIONS_RESULT"
        },
        result = {
            success = true,
            battleId = battleId,
            availableActions = availableActions
        },
        timestamp = 0
    })
end

-- Filter battle state based on access level
-- @param battleState: Full battle state
-- @param accessLevel: Access level for filtering
-- @return: Filtered battle state
function BattleStateHandler.filterBattleState(battleState, accessLevel)
    local filtered = {
        battleId = battleState.battleId,
        status = battleState.status,
        turn = battleState.turn,
        phase = battleState.phase,
        battleConditions = battleState.battleConditions
    }
    
    if accessLevel == BattleStateHandler.AccessLevel.PUBLIC then
        -- Minimal information for public access
        filtered.playerPartyCount = #battleState.playerParty
        filtered.enemyPartyCount = #battleState.enemyParty
        
    elseif accessLevel == BattleStateHandler.AccessLevel.PLAYER then
        -- Player can see their own Pokemon and limited enemy info
        filtered.playerParty = battleState.playerParty
        filtered.activePlayerPokemon = battleState.activePlayerPokemon
        filtered.activeEnemyPokemon = BattleStateHandler.filterEnemyPokemon(battleState.activeEnemyPokemon)
        
    elseif accessLevel == BattleStateHandler.AccessLevel.COORDINATOR or 
           accessLevel == BattleStateHandler.AccessLevel.ADMIN then
        -- Full access to all battle data
        filtered = battleState
    end
    
    return filtered
end

-- Filter enemy Pokemon data for player access
-- @param enemyPokemon: Enemy Pokemon array
-- @return: Filtered enemy Pokemon data
function BattleStateHandler.filterEnemyPokemon(enemyPokemon)
    local filtered = {}
    for _, pokemon in ipairs(enemyPokemon) do
        table.insert(filtered, {
            id = pokemon.id,
            species = pokemon.species,
            level = pokemon.level,
            hp = pokemon.hp,
            maxHp = pokemon.maxHp,
            status = pokemon.status,
            types = pokemon.types
            -- Hide detailed stats, moves, abilities, items
        })
    end
    return filtered
end

-- Filter battle history based on access level
-- @param history: Full battle history
-- @param accessLevel: Access level for filtering
-- @return: Filtered history
function BattleStateHandler.filterBattleHistory(history, accessLevel)
    if accessLevel == BattleStateHandler.AccessLevel.ADMIN or
       accessLevel == BattleStateHandler.AccessLevel.COORDINATOR then
        return history
    end
    
    -- Filter sensitive information for lower access levels
    local filtered = {}
    for _, entry in ipairs(history) do
        table.insert(filtered, {
            turn = entry.turn,
            timestamp = entry.timestamp,
            action = entry.action,
            stateSnapshot = {
                turn = entry.stateSnapshot.turn,
                phase = entry.stateSnapshot.phase,
                status = entry.stateSnapshot.status
            }
        })
    end
    
    return filtered
end

-- Filter Pokemon state based on access level
-- @param pokemon: Full Pokemon data
-- @param accessLevel: Access level for filtering
-- @return: Filtered Pokemon data
function BattleStateHandler.filterPokemonState(pokemon, accessLevel)
    if accessLevel == BattleStateHandler.AccessLevel.ADMIN or
       accessLevel == BattleStateHandler.AccessLevel.COORDINATOR then
        return pokemon
    end
    
    -- Basic Pokemon information for other access levels
    return {
        id = pokemon.id,
        species = pokemon.species,
        level = pokemon.level,
        hp = pokemon.hp,
        maxHp = pokemon.maxHp,
        status = pokemon.status,
        types = pokemon.types,
        statStages = pokemon.statStages
    }
end

-- Calculate available actions for current battle state
-- @param battleState: Current battle state
-- @return: Available actions data
function BattleStateHandler.calculateAvailableActions(battleState)
    if not battleState then
        return {}
    end
    
    local actions = {
        canFight = false,
        canSwitch = false,
        canUseItem = false,
        availableMoves = {},
        availableSwitch = {},
        availableItems = {}
    }
    
    -- Check if battle is in command selection phase
    if battleState.phase == "COMMAND_SELECTION" then
        actions.canFight = true
        actions.canSwitch = true
        actions.canUseItem = true
        
        -- Calculate available moves (simplified)
        for _, pokemon in ipairs(battleState.activePlayerPokemon) do
            if pokemon.moves then
                for _, move in ipairs(pokemon.moves) do
                    if move.pp > 0 then
                        table.insert(actions.availableMoves, {
                            moveId = move.id,
                            name = move.name,
                            pp = move.pp,
                            maxPp = move.maxPp
                        })
                    end
                end
            end
        end
        
        -- Calculate available Pokemon for switching
        for _, pokemon in ipairs(battleState.playerParty) do
            if pokemon.hp > 0 then
                local isActive = false
                for _, activePokemon in ipairs(battleState.activePlayerPokemon) do
                    if activePokemon.id == pokemon.id then
                        isActive = true
                        break
                    end
                end
                
                if not isActive then
                    table.insert(actions.availableSwitch, {
                        pokemonId = pokemon.id,
                        species = pokemon.species,
                        hp = pokemon.hp,
                        maxHp = pokemon.maxHp
                    })
                end
            end
        end
    end
    
    return actions
end

-- Create standardized error response
-- @param correlationId: Correlation ID for response tracking
-- @param errorMessage: Human-readable error message
-- @param errorCode: Machine-readable error code
-- @return: JSON error response string
function BattleStateHandler.createErrorResponse(correlationId, errorMessage, errorCode)
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "ERROR"
        },
        success = false,
        error = errorMessage,
        errorCode = errorCode,
        timestamp = 0
    })
end

return BattleStateHandler