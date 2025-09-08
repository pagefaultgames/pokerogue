-- Message Correlation System for Inter-Process Communication
-- Provides unique correlation ID generation and tracking across message chains

local CryptoRNG = require("game-logic.rng.crypto-rng")

local MessageCorrelator = {
    -- Correlation tracking storage
    activeCorrelations = {},
    correlationHistory = {},
    maxHistorySize = 10000
}

-- Correlation Types
MessageCorrelator.CORRELATION_TYPES = {
    INTER_PROCESS = "INTER_PROCESS",
    INTRA_PROCESS = "INTRA_PROCESS",
    CLIENT_REQUEST = "CLIENT_REQUEST"
}

-- Message Status
MessageCorrelator.MESSAGE_STATUS = {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING", 
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    TIMEOUT = "TIMEOUT"
}

-- Initialize the correlation system
function MessageCorrelator.initialize()
    MessageCorrelator.activeCorrelations = {}
    MessageCorrelator.correlationHistory = {}
    CryptoRNG.initGlobalRNG()
    print("[MessageCorrelator] Correlation system initialized")
end

-- Generate unique correlation ID using AO crypto module
function MessageCorrelator.generateCorrelationId(correlationType, timestamp)
    local currentTimestamp = timestamp or (msg and msg.Timestamp) or 0
    local baseTimestamp = currentTimestamp + CryptoRNG.random(0, 999)
    local randomSuffix = CryptoRNG.random(100000, 999999)
    local prefix = correlationType == MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS and "ipc" or "cor"
    
    return prefix .. "_" .. baseTimestamp .. "_" .. randomSuffix
end

-- Create new correlation with full metadata
function MessageCorrelator.createCorrelation(originProcessId, targetProcessId, messageType, parentCorrelationId, timestamp)
    local correlationId = MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS, timestamp)
    local currentTimestamp = timestamp or 0
    
    local correlation = {
        id = correlationId,
        parent = parentCorrelationId,
        origin = originProcessId,
        target = targetProcessId,
        messageType = messageType,
        status = MessageCorrelator.MESSAGE_STATUS.PENDING,
        created = currentTimestamp,
        lastUpdated = currentTimestamp,
        chain = {}
    }
    
    -- Add to parent chain if this is a nested operation
    if parentCorrelationId and MessageCorrelator.activeCorrelations[parentCorrelationId] then
        table.insert(MessageCorrelator.activeCorrelations[parentCorrelationId].chain, correlationId)
        correlation.depth = (MessageCorrelator.activeCorrelations[parentCorrelationId].depth or 0) + 1
    else
        correlation.depth = 0
    end
    
    MessageCorrelator.activeCorrelations[correlationId] = correlation
    
    return correlationId
end

-- Update correlation status
function MessageCorrelator.updateCorrelationStatus(correlationId, status, errorMessage, timestamp)
    local correlation = MessageCorrelator.activeCorrelations[correlationId]
    if not correlation then
        return false, "Correlation not found: " .. tostring(correlationId)
    end
    
    correlation.status = status
    correlation.lastUpdated = timestamp or 0
    
    if errorMessage then
        correlation.error = errorMessage
    end
    
    -- Move to history if completed or failed
    if status == MessageCorrelator.MESSAGE_STATUS.COMPLETED or 
       status == MessageCorrelator.MESSAGE_STATUS.FAILED or 
       status == MessageCorrelator.MESSAGE_STATUS.TIMEOUT then
        MessageCorrelator.moveToHistory(correlationId)
    end
    
    return true
end

-- Get correlation metadata
function MessageCorrelator.getCorrelation(correlationId)
    return MessageCorrelator.activeCorrelations[correlationId] or 
           MessageCorrelator.correlationHistory[correlationId]
end

-- Get all active correlations for a process
function MessageCorrelator.getProcessCorrelations(processId)
    local processCorrelations = {}
    
    for correlationId, correlation in pairs(MessageCorrelator.activeCorrelations) do
        if correlation.origin == processId or correlation.target == processId then
            processCorrelations[correlationId] = correlation
        end
    end
    
    return processCorrelations
end

-- Get correlation chain (parent and all children)
function MessageCorrelator.getCorrelationChain(correlationId)
    local correlation = MessageCorrelator.getCorrelation(correlationId)
    if not correlation then
        return nil
    end
    
    local chain = { correlation }
    
    -- Get parent chain
    local parent = correlation.parent
    while parent do
        local parentCorrelation = MessageCorrelator.getCorrelation(parent)
        if parentCorrelation then
            table.insert(chain, 1, parentCorrelation)
            parent = parentCorrelation.parent
        else
            break
        end
    end
    
    -- Get child chain
    local function addChildren(currentId)
        local current = MessageCorrelator.getCorrelation(currentId)
        if current and current.chain then
            for _, childId in ipairs(current.chain) do
                local childCorrelation = MessageCorrelator.getCorrelation(childId)
                if childCorrelation then
                    table.insert(chain, childCorrelation)
                    addChildren(childId)
                end
            end
        end
    end
    
    addChildren(correlationId)
    
    return chain
end

-- Move correlation to history and cleanup
function MessageCorrelator.moveToHistory(correlationId)
    local correlation = MessageCorrelator.activeCorrelations[correlationId]
    if not correlation then
        return false
    end
    
    -- Move to history
    MessageCorrelator.correlationHistory[correlationId] = correlation
    MessageCorrelator.activeCorrelations[correlationId] = nil
    
    -- Cleanup old history if at max size
    MessageCorrelator.cleanupHistory()
    
    return true
end

-- Cleanup old correlation history
function MessageCorrelator.cleanupHistory()
    local historySize = 0
    for _ in pairs(MessageCorrelator.correlationHistory) do
        historySize = historySize + 1
    end
    
    if historySize > MessageCorrelator.maxHistorySize then
        local oldestCorrelations = {}
        for correlationId, correlation in pairs(MessageCorrelator.correlationHistory) do
            table.insert(oldestCorrelations, {id = correlationId, lastUpdated = correlation.lastUpdated})
        end
        
        table.sort(oldestCorrelations, function(a, b) return a.lastUpdated < b.lastUpdated end)
        
        -- Remove oldest 20%
        local removeCount = math.floor(MessageCorrelator.maxHistorySize * 0.2)
        for i = 1, removeCount do
            MessageCorrelator.correlationHistory[oldestCorrelations[i].id] = nil
        end
    end
end

-- Create correlation metadata for message
function MessageCorrelator.createCorrelationMetadata(correlationId, originProcessId, targetProcessId, parentCorrelationId)
    return {
        id = correlationId,
        parent = parentCorrelationId,
        origin = originProcessId,
        target = targetProcessId
    }
end

-- Validate correlation metadata format
function MessageCorrelator.validateCorrelationMetadata(correlationMeta)
    if not correlationMeta or type(correlationMeta) ~= "table" then
        return false, "Correlation metadata must be a table"
    end
    
    if not correlationMeta.id or type(correlationMeta.id) ~= "string" then
        return false, "Correlation ID is required and must be a string"
    end
    
    if not correlationMeta.origin or type(correlationMeta.origin) ~= "string" then
        return false, "Origin process ID is required and must be a string"
    end
    
    if not correlationMeta.target or type(correlationMeta.target) ~= "string" then
        return false, "Target process ID is required and must be a string"
    end
    
    return true
end

-- Get correlation statistics
function MessageCorrelator.getStatistics()
    local activeCount = 0
    local historyCount = 0
    local statusCounts = {}
    
    for _ in pairs(MessageCorrelator.activeCorrelations) do
        activeCount = activeCount + 1
    end
    
    for _ in pairs(MessageCorrelator.correlationHistory) do
        historyCount = historyCount + 1
    end
    
    for _, correlation in pairs(MessageCorrelator.activeCorrelations) do
        statusCounts[correlation.status] = (statusCounts[correlation.status] or 0) + 1
    end
    
    for _, correlation in pairs(MessageCorrelator.correlationHistory) do
        statusCounts[correlation.status] = (statusCounts[correlation.status] or 0) + 1
    end
    
    return {
        activeCorrelations = activeCount,
        historyCorrelations = historyCount,
        totalCorrelations = activeCount + historyCount,
        statusBreakdown = statusCounts,
        maxHistorySize = MessageCorrelator.maxHistorySize
    }
end

return MessageCorrelator