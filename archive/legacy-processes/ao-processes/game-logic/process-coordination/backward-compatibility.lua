-- Backward Compatibility Layer for Single-Process to Multi-Process Migration
-- Provides compatibility shims for existing single-process message formats

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")

local BackwardCompatibility = {
    -- Legacy message format mappings
    legacyOperationMappings = {},
    
    -- Compatibility statistics
    compatibilityStats = {
        legacyMessagesProcessed = 0,
        adaptedMessages = 0,
        incompatibleMessages = 0,
        byOperationType = {}
    }
}

-- Legacy operation types to new operation type mappings
BackwardCompatibility.LEGACY_OPERATION_MAPPINGS = {
    -- Battle legacy mappings
    ["battle"] = "BATTLE_RESOLUTION",
    ["start-battle"] = "BATTLE_START", 
    ["end-battle"] = "BATTLE_END",
    ["execute-move"] = "MOVE_EXECUTION",
    
    -- Pokemon legacy mappings
    ["update-pokemon"] = "POKEMON_UPDATE",
    ["evolve-pokemon"] = "POKEMON_EVOLUTION", 
    ["calculate-stats"] = "STAT_CALCULATION",
    ["catch-pokemon"] = "POKEMON_CAPTURE",
    
    -- Shop legacy mappings
    ["shop-buy"] = "ITEM_PURCHASE",
    ["shop-sell"] = "ITEM_SALE",
    ["shop-inventory"] = "SHOP_INVENTORY",
    ["shop-transaction"] = "SHOP_TRANSACTION",
    
    -- Game state legacy mappings
    ["save"] = "SAVE_GAME",
    ["load"] = "LOAD_GAME",
    ["sync"] = "SYNC_STATE",
    
    -- Admin legacy mappings  
    ["get-info"] = "PROCESS_INFO",
    ["admin"] = "ADMIN_COMMAND"
}

-- Initialize the backward compatibility system
function BackwardCompatibility.initialize()
    BackwardCompatibility.legacyOperationMappings = BackwardCompatibility.LEGACY_OPERATION_MAPPINGS
    
    -- Initialize statistics tracking
    for legacyOp, newOp in pairs(BackwardCompatibility.legacyOperationMappings) do
        BackwardCompatibility.compatibilityStats.byOperationType[legacyOp] = {
            processed = 0,
            adapted = 0,
            failed = 0
        }
    end
    
    return true
end

-- Detect if a message uses legacy format
function BackwardCompatibility.isLegacyMessage(messageData)
    if type(messageData) ~= "table" then
        return false
    end
    
    -- Check for new inter-process message structure
    if messageData.correlation and messageData.auth and messageData.operation then
        return false -- This is a new format message
    end
    
    -- Check for common legacy patterns
    local hasLegacyPatterns = (
        messageData.action or 
        messageData.command or 
        messageData.operation or
        messageData.type
    )
    
    return hasLegacyPatterns ~= nil
end

-- Convert legacy message format to new inter-process format
function BackwardCompatibility.adaptLegacyMessage(messageData, fromProcessId, toProcessId, timestamp)
    BackwardCompatibility.compatibilityStats.legacyMessagesProcessed = BackwardCompatibility.compatibilityStats.legacyMessagesProcessed + 1
    
    if not BackwardCompatibility.isLegacyMessage(messageData) then
        return messageData -- Already new format, no adaptation needed
    end
    
    -- Extract legacy operation type
    local legacyOperationType = messageData.action or messageData.command or messageData.operation or messageData.type
    if not legacyOperationType then
        BackwardCompatibility.compatibilityStats.incompatibleMessages = BackwardCompatibility.compatibilityStats.incompatibleMessages + 1
        return nil, "Cannot determine operation type from legacy message"
    end
    
    -- Map to new operation type
    local newOperationType = BackwardCompatibility.legacyOperationMappings[legacyOperationType]
    if not newOperationType then
        BackwardCompatibility.compatibilityStats.incompatibleMessages = BackwardCompatibility.compatibilityStats.incompatibleMessages + 1
        return nil, "No mapping found for legacy operation: " .. tostring(legacyOperationType)
    end
    
    -- Generate correlation ID
    local correlationId = MessageCorrelator.generateCorrelationId()
    
    -- Create authentication context (use process authenticator if available)
    local authToken = "legacy-compat-token"
    if ProcessAuthenticator.generateProcessToken then
        authToken = ProcessAuthenticator.generateProcessToken(fromProcessId or "legacy-process") or authToken
    end
    
    -- Build new format message
    local adaptedMessage = {
        correlation = {
            id = correlationId,
            parent = nil, -- Legacy messages don't have parent correlations
            origin = fromProcessId or "legacy-process",
            target = toProcessId or "coordinator"
        },
        auth = {
            processId = fromProcessId or "legacy-process", 
            token = authToken,
            timestamp = timestamp or 0
        },
        operation = {
            type = newOperationType,
            priority = messageData.priority or "NORMAL",
            retryable = messageData.retryable ~= false -- Default to retryable
        },
        payload = {
            -- Include original message data as payload
            originalData = messageData,
            legacyOperation = legacyOperationType,
            adaptedBy = "BackwardCompatibility",
            adaptedAt = timestamp or 0
        },
        _compatibility = {
            isAdapted = true,
            originalFormat = "legacy",
            adaptedFrom = legacyOperationType
        }
    }
    
    -- Update statistics
    BackwardCompatibility.compatibilityStats.adaptedMessages = BackwardCompatibility.compatibilityStats.adaptedMessages + 1
    if BackwardCompatibility.compatibilityStats.byOperationType[legacyOperationType] then
        BackwardCompatibility.compatibilityStats.byOperationType[legacyOperationType].processed = 
            BackwardCompatibility.compatibilityStats.byOperationType[legacyOperationType].processed + 1
        BackwardCompatibility.compatibilityStats.byOperationType[legacyOperationType].adapted = 
            BackwardCompatibility.compatibilityStats.byOperationType[legacyOperationType].adapted + 1
    end
    
    return adaptedMessage
end

-- Convert new format response back to legacy format for backward compatibility
function BackwardCompatibility.adaptResponseToLegacy(responseData, originalLegacyMessage, timestamp)
    if not responseData then
        return nil
    end
    
    -- If original message wasn't legacy, return response as-is
    if not BackwardCompatibility.isLegacyMessage(originalLegacyMessage) then
        return responseData
    end
    
    -- Extract key information for legacy response
    local legacyResponse = {
        success = responseData.success or true,
        result = responseData.payload or responseData.result,
        timestamp = responseData.timestamp or timestamp or 0,
        correlationId = responseData.correlationId or (responseData.correlation and responseData.correlation.id),
        processedBy = responseData.targetProcessId or "unknown"
    }
    
    -- Include error information if present
    if responseData.error then
        legacyResponse.success = false
        legacyResponse.error = responseData.error
        legacyResponse.message = responseData.message
    end
    
    -- Mark as adapted response
    legacyResponse._adapted = {
        from = "inter-process",
        to = "legacy",
        adaptedAt = timestamp or 0
    }
    
    return legacyResponse
end

-- Add custom legacy operation mapping
function BackwardCompatibility.addLegacyMapping(legacyOperation, newOperation)
    if not legacyOperation or not newOperation then
        return false, "Both legacy and new operation types are required"
    end
    
    BackwardCompatibility.legacyOperationMappings[legacyOperation] = newOperation
    
    -- Initialize statistics tracking
    BackwardCompatibility.compatibilityStats.byOperationType[legacyOperation] = {
        processed = 0,
        adapted = 0, 
        failed = 0
    }
    
    return true
end

-- Remove legacy operation mapping
function BackwardCompatibility.removeLegacyMapping(legacyOperation)
    if BackwardCompatibility.legacyOperationMappings[legacyOperation] then
        BackwardCompatibility.legacyOperationMappings[legacyOperation] = nil
        BackwardCompatibility.compatibilityStats.byOperationType[legacyOperation] = nil
        return true
    end
    return false
end

-- Get compatibility statistics
function BackwardCompatibility.getCompatibilityStats()
    return BackwardCompatibility.compatibilityStats
end

-- Get available legacy mappings
function BackwardCompatibility.getLegacyMappings()
    return BackwardCompatibility.legacyOperationMappings
end

-- Validate legacy message compatibility
function BackwardCompatibility.validateLegacyCompatibility(messageData)
    if not BackwardCompatibility.isLegacyMessage(messageData) then
        return true, "Message uses new format - no compatibility issues"
    end
    
    local legacyOperationType = messageData.action or messageData.command or messageData.operation or messageData.type
    if not legacyOperationType then
        return false, "Cannot determine operation type from legacy message"
    end
    
    local newOperationType = BackwardCompatibility.legacyOperationMappings[legacyOperationType]
    if not newOperationType then
        return false, "No mapping available for legacy operation: " .. tostring(legacyOperationType)
    end
    
    return true, "Legacy operation '" .. legacyOperationType .. "' can be mapped to '" .. newOperationType .. "'"
end

-- Initialize on module load
BackwardCompatibility.initialize()

return BackwardCompatibility