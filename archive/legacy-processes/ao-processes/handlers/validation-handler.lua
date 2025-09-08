-- validation-handler.lua: Game Action Validation Framework
-- Validates game actions, moves, stats, and battle operations

local ValidationHandler = {}

-- Constants
local VALIDATION_ERRORS = {
    INVALID_MOVE = "VAL_001",
    ILLEGAL_STAT = "VAL_002", 
    BATTLE_ACTION_DENIED = "VAL_003",
    INVALID_POKEMON_DATA = "VAL_004",
    MOVE_LEARNING_VIOLATION = "VAL_005",
    BATTLE_TIMING_ERROR = "VAL_006",
    INVALID_ACTION_TYPE = "VAL_007"
}

-- Game constants (normally loaded from data files)
local GAME_CONSTANTS = {
    MAX_POKEMON_LEVEL = 100,
    MIN_POKEMON_LEVEL = 1,
    MAX_STAT_VALUE = 999,
    MIN_STAT_VALUE = 1,
    MAX_IV_VALUE = 31,
    MIN_IV_VALUE = 0,
    MAX_MOVES_PER_POKEMON = 4,
    NATURE_MULTIPLIERS = {0.9, 1.0, 1.1}
}

-- Validate Pokemon stat values against game rules
function ValidationHandler.validatePokemonStats(pokemonData)
    if not pokemonData then
        error({
            code = VALIDATION_ERRORS.INVALID_POKEMON_DATA,
            message = "Pokemon data is required",
            success = false
        })
    end
    
    -- Level validation
    local level = pokemonData.level
    if not level or level < GAME_CONSTANTS.MIN_POKEMON_LEVEL or level > GAME_CONSTANTS.MAX_POKEMON_LEVEL then
        error({
            code = VALIDATION_ERRORS.ILLEGAL_STAT,
            message = string.format("Invalid Pokemon level: %s (must be %d-%d)", 
                tostring(level), GAME_CONSTANTS.MIN_POKEMON_LEVEL, GAME_CONSTANTS.MAX_POKEMON_LEVEL),
            success = false
        })
    end
    
    -- Stat validation
    local stats = pokemonData.stats or {}
    local statNames = {"hp", "attack", "defense", "spAttack", "spDefense", "speed"}
    
    for _, statName in ipairs(statNames) do
        local statValue = stats[statName]
        if statValue and (statValue < GAME_CONSTANTS.MIN_STAT_VALUE or statValue > GAME_CONSTANTS.MAX_STAT_VALUE) then
            error({
                code = VALIDATION_ERRORS.ILLEGAL_STAT,
                message = string.format("Invalid %s stat: %d (must be %d-%d)", 
                    statName, statValue, GAME_CONSTANTS.MIN_STAT_VALUE, GAME_CONSTANTS.MAX_STAT_VALUE),
                success = false
            })
        end
    end
    
    -- IV validation
    local ivs = pokemonData.ivs or {}
    for _, statName in ipairs(statNames) do
        local ivValue = ivs[statName]
        if ivValue and (ivValue < GAME_CONSTANTS.MIN_IV_VALUE or ivValue > GAME_CONSTANTS.MAX_IV_VALUE) then
            error({
                code = VALIDATION_ERRORS.ILLEGAL_STAT,
                message = string.format("Invalid %s IV: %d (must be %d-%d)", 
                    statName, ivValue, GAME_CONSTANTS.MIN_IV_VALUE, GAME_CONSTANTS.MAX_IV_VALUE),
                success = false
            })
        end
    end
    
    return true
end

-- Validate move against Pokemon's legal moveset
function ValidationHandler.validatePokemonMove(pokemonSpeciesId, moveId, pokemonLevel, learnedMoves)
    if not pokemonSpeciesId or not moveId then
        error({
            code = VALIDATION_ERRORS.INVALID_MOVE,
            message = "Pokemon species and move ID required for validation",
            success = false
        })
    end
    
    -- Check if move is in learned moves list (simplified validation)
    if learnedMoves then
        local moveFound = false
        for _, learnedMove in ipairs(learnedMoves) do
            if learnedMove.id == moveId then
                moveFound = true
                break
            end
        end
        
        if not moveFound then
            error({
                code = VALIDATION_ERRORS.MOVE_LEARNING_VIOLATION,
                message = string.format("Pokemon species %s cannot learn move %s", pokemonSpeciesId, moveId),
                success = false
            })
        end
    end
    
    return true
end

-- Validate Pokemon moveset (max 4 moves, all legal)
function ValidationHandler.validatePokemonMoveset(pokemonData, moveDatabase)
    if not pokemonData or not pokemonData.moves then
        return true -- No moves to validate
    end
    
    local moves = pokemonData.moves
    
    -- Check move count
    if #moves > GAME_CONSTANTS.MAX_MOVES_PER_POKEMON then
        error({
            code = VALIDATION_ERRORS.INVALID_MOVE,
            message = string.format("Pokemon can have maximum %d moves, got %d", 
                GAME_CONSTANTS.MAX_MOVES_PER_POKEMON, #moves),
            success = false
        })
    end
    
    -- Validate each move
    local learnedMoves = moveDatabase and moveDatabase[pokemonData.speciesId]
    for _, move in ipairs(moves) do
        ValidationHandler.validatePokemonMove(pokemonData.speciesId, move.id, pokemonData.level, learnedMoves)
    end
    
    return true
end

-- Validate battle action timing and legality
function ValidationHandler.validateBattleAction(action, battleState, pokemonData)
    if not action or not action.type then
        error({
            code = VALIDATION_ERRORS.INVALID_ACTION_TYPE,
            message = "Battle action must have a type",
            success = false
        })
    end
    
    local actionType = action.type
    local validActions = {"move", "switch", "item", "run"}
    local isValidType = false
    
    for _, validType in ipairs(validActions) do
        if actionType == validType then
            isValidType = true
            break
        end
    end
    
    if not isValidType then
        error({
            code = VALIDATION_ERRORS.INVALID_ACTION_TYPE,
            message = string.format("Invalid battle action type: %s", actionType),
            success = false
        })
    end
    
    -- Validate move action
    if actionType == "move" then
        if not action.moveId then
            error({
                code = VALIDATION_ERRORS.INVALID_MOVE,
                message = "Move action requires moveId",
                success = false
            })
        end
        
        -- Check if Pokemon knows the move
        if pokemonData and pokemonData.moves then
            local moveFound = false
            for _, move in ipairs(pokemonData.moves) do
                if move.id == action.moveId then
                    moveFound = true
                    break
                end
            end
            
            if not moveFound then
                error({
                    code = VALIDATION_ERRORS.INVALID_MOVE,
                    message = string.format("Pokemon does not know move %s", action.moveId),
                    success = false
                })
            end
        end
    end
    
    -- Validate switch action
    if actionType == "switch" then
        if not action.pokemonIndex then
            error({
                code = VALIDATION_ERRORS.BATTLE_ACTION_DENIED,
                message = "Switch action requires pokemonIndex",
                success = false
            })
        end
    end
    
    return true
end

-- Validate battle turn timing
function ValidationHandler.validateBattleTiming(battleState, playerId, actionTimestamp)
    if not battleState then
        error({
            code = VALIDATION_ERRORS.BATTLE_TIMING_ERROR,
            message = "Battle state required for timing validation",
            success = false
        })
    end
    
    -- Check if it's player's turn
    if battleState.currentTurn and battleState.currentTurn ~= playerId then
        error({
            code = VALIDATION_ERRORS.BATTLE_TIMING_ERROR,
            message = "Action submitted out of turn",
            success = false
        })
    end
    
    -- Check turn timeout (simplified - would use actual timestamps in production)
    if actionTimestamp and battleState.turnStartTime then
        local turnDuration = actionTimestamp - battleState.turnStartTime
        local maxTurnTime = 30 -- 30 seconds max per turn
        
        if turnDuration > maxTurnTime then
            error({
                code = VALIDATION_ERRORS.BATTLE_TIMING_ERROR,
                message = "Turn action timeout exceeded",
                success = false
            })
        end
    end
    
    return true
end

-- Comprehensive validation for battle actions
function ValidationHandler.validateCompleteAction(actionData, battleState, playerPokemon, moveDatabase)
    local success, result = pcall(function()
        -- Validate action structure
        ValidationHandler.validateBattleAction(actionData.action, battleState, playerPokemon)
        
        -- Validate timing
        ValidationHandler.validateBattleTiming(battleState, actionData.playerId, actionData.timestamp)
        
        -- Validate Pokemon data if present
        if playerPokemon then
            ValidationHandler.validatePokemonStats(playerPokemon)
            ValidationHandler.validatePokemonMoveset(playerPokemon, moveDatabase)
        end
        
        return {
            success = true,
            validatedAction = actionData.action,
            playerId = actionData.playerId
        }
    end)
    
    if not success then
        return {
            success = false,
            error = result
        }
    end
    
    return result
end

-- Get validation error information
function ValidationHandler.getErrorInfo(errorCode)
    local errorMessages = {
        [VALIDATION_ERRORS.INVALID_MOVE] = "Move validation failed",
        [VALIDATION_ERRORS.ILLEGAL_STAT] = "Pokemon stat validation failed", 
        [VALIDATION_ERRORS.BATTLE_ACTION_DENIED] = "Battle action not permitted",
        [VALIDATION_ERRORS.INVALID_POKEMON_DATA] = "Pokemon data validation failed",
        [VALIDATION_ERRORS.MOVE_LEARNING_VIOLATION] = "Pokemon cannot learn specified move",
        [VALIDATION_ERRORS.BATTLE_TIMING_ERROR] = "Battle timing validation failed",
        [VALIDATION_ERRORS.INVALID_ACTION_TYPE] = "Invalid battle action type"
    }
    
    return {
        code = errorCode,
        message = errorMessages[errorCode] or "Unknown validation error",
        category = "VALIDATION"
    }
end

return ValidationHandler