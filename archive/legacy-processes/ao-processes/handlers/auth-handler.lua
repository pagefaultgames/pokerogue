-- auth-handler.lua: Player Authorization System
-- Implements wallet address validation and player ownership verification

local AuthHandler = {}

-- Constants
local AUTH_ERRORS = {
    INVALID_SENDER = "AUTH_001",
    OWNERSHIP_VIOLATION = "AUTH_002", 
    BATTLE_PARTICIPATION_DENIED = "AUTH_003",
    MISSING_PLAYER_ID = "AUTH_004",
    INVALID_MESSAGE_FORMAT = "AUTH_005"
}

-- Validate that message sender matches expected wallet address format
function AuthHandler.validateSender(messageFrom)
    if not messageFrom then
        error({
            code = AUTH_ERRORS.INVALID_SENDER,
            message = "Message sender is required",
            success = false
        })
    end
    
    if type(messageFrom) ~= "string" or #messageFrom < 10 then
        error({
            code = AUTH_ERRORS.INVALID_SENDER,
            message = "Invalid sender wallet address format", 
            success = false
        })
    end
    
    return true
end

-- Validate player ownership: only message sender can modify their own data
function AuthHandler.validatePlayerOwnership(playerId, messageFrom)
    AuthHandler.validateSender(messageFrom)
    
    if not playerId then
        error({
            code = AUTH_ERRORS.MISSING_PLAYER_ID,
            message = "Player ID is required for ownership validation",
            success = false
        })
    end
    
    if playerId ~= messageFrom then
        error({
            code = AUTH_ERRORS.OWNERSHIP_VIOLATION,
            message = "Players can only modify their own game data",
            success = false
        })
    end
    
    return true
end

-- Validate battle participation authorization
function AuthHandler.validateBattleParticipation(playerId, battleState, messageFrom)
    AuthHandler.validatePlayerOwnership(playerId, messageFrom)
    
    if not battleState or not battleState.participants then
        error({
            code = AUTH_ERRORS.BATTLE_PARTICIPATION_DENIED,
            message = "Invalid battle state for participation validation",
            success = false
        })
    end
    
    local isParticipant = false
    for _, participantId in ipairs(battleState.participants) do
        if participantId == playerId then
            isParticipant = true
            break
        end
    end
    
    if not isParticipant then
        error({
            code = AUTH_ERRORS.BATTLE_PARTICIPATION_DENIED,
            message = "Player is not authorized to participate in this battle",
            success = false
        })
    end
    
    return true
end

-- Authorization wrapper for player-specific operations
function AuthHandler.authorizePlayerOperation(operationName, playerId, messageFrom, additionalData)
    local success, result = pcall(function()
        AuthHandler.validatePlayerOwnership(playerId, messageFrom)
        
        -- Additional validation based on operation type
        if operationName == "battle_action" and additionalData and additionalData.battleState then
            AuthHandler.validateBattleParticipation(playerId, additionalData.battleState, messageFrom)
        end
        
        return {
            success = true,
            playerId = playerId,
            authorizedBy = messageFrom,
            operation = operationName
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

-- Validate AO message format and extract authorization data
function AuthHandler.validateMessageFormat(msg)
    if not msg then
        error({
            code = AUTH_ERRORS.INVALID_MESSAGE_FORMAT,
            message = "Message object is required",
            success = false
        })
    end
    
    if not msg.From then
        error({
            code = AUTH_ERRORS.INVALID_MESSAGE_FORMAT,
            message = "Message must include From field",
            success = false
        })
    end
    
    return {
        sender = msg.From,
        data = msg.Data or {},
        tags = msg.Tags or {}
    }
end

-- Get error information for structured error responses
function AuthHandler.getErrorInfo(errorCode)
    local errorMessages = {
        [AUTH_ERRORS.INVALID_SENDER] = "Invalid or missing sender wallet address",
        [AUTH_ERRORS.OWNERSHIP_VIOLATION] = "Unauthorized access to player data",
        [AUTH_ERRORS.BATTLE_PARTICIPATION_DENIED] = "Not authorized for battle participation",
        [AUTH_ERRORS.MISSING_PLAYER_ID] = "Player identification required",
        [AUTH_ERRORS.INVALID_MESSAGE_FORMAT] = "Malformed message structure"
    }
    
    return {
        code = errorCode,
        message = errorMessages[errorCode] or "Unknown authorization error",
        category = "AUTHORIZATION"
    }
end

return AuthHandler