--[[
Transaction Audit System
Comprehensive transaction logging and audit trail management for Economic Process

Features:
- Complete transaction logging with correlation ID tracking
- Audit trail generation maintaining full economic operation history
- Transaction correlation tracking for multi-process economic operations
- Transaction history queries for debugging and monitoring
- Performance metrics tracking for transaction processing latency

Integration:
- Uses MessageCorrelator for inter-process correlation tracking
- Integrates with EconomicSystem for transaction hash generation
- Provides audit data for all economic process handlers
- Maintains audit compliance for economic operations across processes
--]]

local TransactionAuditSystem = {}

-- Dependencies
local EconomicSystem = require('economy.components.economic-system')
local MessageCorrelator = require('game-logic.process-coordination.message-correlator')

-- Audit data storage
local transactionLogs = {} -- correlationId -> transaction log
local playerAuditTrails = {} -- playerId -> audit trail
local systemAuditLog = {} -- System-wide audit events

-- Audit constants
local AUDIT_CONSTANTS = {
    MAX_TRANSACTION_LOGS = 10000,
    MAX_PLAYER_AUDIT_ENTRIES = 1000,
    MAX_SYSTEM_AUDIT_ENTRIES = 5000,
    AUDIT_RETENTION_DAYS = 30
}

-- Transaction status types
local TRANSACTION_STATUS = {
    INITIATED = "INITIATED",
    IN_PROGRESS = "IN_PROGRESS", 
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    ROLLED_BACK = "ROLLED_BACK"
}

-- Initialize audit system
function TransactionAuditSystem.init()
    -- Initialize audit storage structures
    print("[TransactionAuditSystem] Audit system initialized")
end

--[[
Log transaction start
@param correlationId string - Unique correlation identifier
@param transactionData table - Initial transaction data
@return boolean - Success status
--]]
function TransactionAuditSystem.logTransactionStart(correlationId, transactionData)
    if not correlationId then
        return false
    end
    
    local timestamp = 0
    local transactionLog = {
        correlationId = correlationId,
        status = TRANSACTION_STATUS.INITIATED,
        startTime = timestamp,
        transactionType = transactionData.type or "UNKNOWN",
        subtype = transactionData.subtype,
        playerId = transactionData.playerId,
        initialData = transactionData,
        events = {},
        performance = {
            startTime = timestamp
        }
    }
    
    -- Store transaction log
    transactionLogs[correlationId] = transactionLog
    
    -- Clean up old logs if needed
    TransactionAuditSystem.cleanupOldLogs()
    
    -- Add to player audit trail
    if transactionData.playerId then
        TransactionAuditSystem.addPlayerAuditEntry(transactionData.playerId, {
            correlationId = correlationId,
            action = "TRANSACTION_START",
            timestamp = timestamp,
            transactionType = transactionData.type
        })
    end
    
    return true
end

--[[
Log transaction event
@param correlationId string - Correlation identifier
@param eventData table - Event data to log
@return boolean - Success status
--]]
function TransactionAuditSystem.logTransactionEvent(correlationId, eventData)
    if not correlationId or not transactionLogs[correlationId] then
        return false
    end
    
    local transactionLog = transactionLogs[correlationId]
    local timestamp = 0
    
    local event = {
        timestamp = timestamp,
        eventType = eventData.eventType or "UNKNOWN",
        description = eventData.description,
        data = eventData.data,
        success = eventData.success
    }
    
    table.insert(transactionLog.events, event)
    
    -- Update transaction status if provided
    if eventData.status then
        transactionLog.status = eventData.status
    end
    
    return true
end

--[[
Log transaction completion
@param correlationId string - Correlation identifier
@param completionData table - Completion data
@return boolean - Success status
--]]
function TransactionAuditSystem.logTransactionComplete(correlationId, completionData)
    if not correlationId or not transactionLogs[correlationId] then
        return false
    end
    
    local transactionLog = transactionLogs[correlationId]
    local timestamp = 0
    
    -- Update completion data
    transactionLog.endTime = timestamp
    transactionLog.success = completionData.success
    transactionLog.finalResult = completionData.result
    transactionLog.errorMessage = completionData.error
    
    -- Update status
    transactionLog.status = completionData.success and 
        TRANSACTION_STATUS.COMPLETED or TRANSACTION_STATUS.FAILED
    
    -- Calculate performance metrics
    if transactionLog.performance and transactionLog.performance.startTime then
        transactionLog.performance.duration = timestamp - transactionLog.performance.startTime
        transactionLog.performance.latency = completionData.latency or 0
    end
    
    -- Generate transaction hash for integrity verification
    if completionData.success and transactionLog.initialData then
        local hashData = {
            correlationId = correlationId,
            playerId = transactionLog.playerId,
            transactionType = transactionLog.transactionType,
            timestamp = timestamp,
            success = true
        }
        transactionLog.integrityHash = EconomicSystem.generateTransactionHash(hashData)
    end
    
    -- Add to player audit trail
    if transactionLog.playerId then
        TransactionAuditSystem.addPlayerAuditEntry(transactionLog.playerId, {
            correlationId = correlationId,
            action = "TRANSACTION_COMPLETE",
            timestamp = timestamp,
            success = completionData.success,
            transactionType = transactionLog.transactionType
        })
    end
    
    return true
end

--[[
Add entry to player audit trail
@param playerId string - Player identifier
@param auditEntry table - Audit entry data
@return boolean - Success status
--]]
function TransactionAuditSystem.addPlayerAuditEntry(playerId, auditEntry)
    if not playerId then
        return false
    end
    
    if not playerAuditTrails[playerId] then
        playerAuditTrails[playerId] = {}
    end
    
    table.insert(playerAuditTrails[playerId], auditEntry)
    
    -- Limit audit trail size
    if #playerAuditTrails[playerId] > AUDIT_CONSTANTS.MAX_PLAYER_AUDIT_ENTRIES then
        table.remove(playerAuditTrails[playerId], 1)
    end
    
    return true
end

--[[
Log system-wide audit event
@param eventData table - System event data
@return boolean - Success status
--]]
function TransactionAuditSystem.logSystemEvent(eventData)
    if not eventData then
        return false
    end
    
    local systemEvent = {
        timestamp = msg.Timestamp,
        eventType = eventData.eventType or "SYSTEM_EVENT",
        description = eventData.description,
        data = eventData.data,
        severity = eventData.severity or "INFO"
    }
    
    table.insert(systemAuditLog, systemEvent)
    
    -- Limit system log size
    if #systemAuditLog > AUDIT_CONSTANTS.MAX_SYSTEM_AUDIT_ENTRIES then
        table.remove(systemAuditLog, 1)
    end
    
    return true
end

--[[
Get transaction audit data
@param correlationId string - Correlation identifier
@return table - Transaction audit data or nil
--]]
function TransactionAuditSystem.getTransactionAudit(correlationId)
    if not correlationId then
        return nil
    end
    
    return transactionLogs[correlationId]
end

--[[
Get player audit trail
@param playerId string - Player identifier
@param limit number - Optional limit on entries returned
@return array - Player audit trail
--]]
function TransactionAuditSystem.getPlayerAuditTrail(playerId, limit)
    if not playerId then
        return {}
    end
    
    local auditTrail = playerAuditTrails[playerId] or {}
    
    if limit and limit > 0 and limit < #auditTrail then
        -- Return most recent entries
        local recentTrail = {}
        for i = #auditTrail - limit + 1, #auditTrail do
            table.insert(recentTrail, auditTrail[i])
        end
        return recentTrail
    end
    
    return auditTrail
end

--[[
Query transactions by criteria
@param criteria table - Query criteria
@return array - Matching transactions
--]]
function TransactionAuditSystem.queryTransactions(criteria)
    if not criteria then
        return {}
    end
    
    local results = {}
    
    for correlationId, transactionLog in pairs(transactionLogs) do
        local matches = true
        
        -- Check player ID filter
        if criteria.playerId and transactionLog.playerId ~= criteria.playerId then
            matches = false
        end
        
        -- Check transaction type filter
        if criteria.transactionType and transactionLog.transactionType ~= criteria.transactionType then
            matches = false
        end
        
        -- Check status filter
        if criteria.status and transactionLog.status ~= criteria.status then
            matches = false
        end
        
        -- Check time range filter
        if criteria.startTime and transactionLog.startTime and transactionLog.startTime < criteria.startTime then
            matches = false
        end
        
        if criteria.endTime and transactionLog.startTime and transactionLog.startTime > criteria.endTime then
            matches = false
        end
        
        -- Check success filter
        if criteria.success ~= nil and transactionLog.success ~= criteria.success then
            matches = false
        end
        
        if matches then
            table.insert(results, transactionLog)
        end
    end
    
    -- Sort by start time (most recent first)
    table.sort(results, function(a, b)
        return (a.startTime or 0) > (b.startTime or 0)
    end)
    
    -- Apply limit if specified
    if criteria.limit and criteria.limit > 0 and criteria.limit < #results then
        local limitedResults = {}
        for i = 1, criteria.limit do
            table.insert(limitedResults, results[i])
        end
        return limitedResults
    end
    
    return results
end

--[[
Get audit system statistics
@return table - Audit system statistics
--]]
function TransactionAuditSystem.getAuditStats()
    local totalTransactions = 0
    local completedTransactions = 0
    local failedTransactions = 0
    local totalDuration = 0
    
    for correlationId, transactionLog in pairs(transactionLogs) do
        totalTransactions = totalTransactions + 1
        
        if transactionLog.status == TRANSACTION_STATUS.COMPLETED then
            completedTransactions = completedTransactions + 1
        elseif transactionLog.status == TRANSACTION_STATUS.FAILED then
            failedTransactions = failedTransactions + 1
        end
        
        if transactionLog.performance and transactionLog.performance.duration then
            totalDuration = totalDuration + transactionLog.performance.duration
        end
    end
    
    local averageDuration = totalTransactions > 0 and (totalDuration / totalTransactions) or 0
    
    return {
        totalTransactions = totalTransactions,
        completedTransactions = completedTransactions,
        failedTransactions = failedTransactions,
        successRate = totalTransactions > 0 and (completedTransactions / totalTransactions * 100) or 0,
        averageDuration = averageDuration,
        totalPlayers = 0, -- Will count players
        systemEvents = #systemAuditLog,
        timestamp = 0
    }
end

--[[
Clean up old audit logs
@return number - Number of logs cleaned up
--]]
function TransactionAuditSystem.cleanupOldLogs()
    local currentTime = 0
    local retentionCutoff = currentTime - (AUDIT_CONSTANTS.AUDIT_RETENTION_DAYS * 24 * 60 * 60)
    local cleanedCount = 0
    
    -- Clean up old transaction logs
    for correlationId, transactionLog in pairs(transactionLogs) do
        if transactionLog.startTime and transactionLog.startTime < retentionCutoff then
            transactionLogs[correlationId] = nil
            cleanedCount = cleanedCount + 1
        end
    end
    
    -- Clean up old system events
    for i = #systemAuditLog, 1, -1 do
        local event = systemAuditLog[i]
        if event.timestamp and event.timestamp < retentionCutoff then
            table.remove(systemAuditLog, i)
            cleanedCount = cleanedCount + 1
        end
    end
    
    -- Clean up old player audit entries
    for playerId, auditTrail in pairs(playerAuditTrails) do
        for i = #auditTrail, 1, -1 do
            local entry = auditTrail[i]
            if entry.timestamp and entry.timestamp < retentionCutoff then
                table.remove(auditTrail, i)
                cleanedCount = cleanedCount + 1
            end
        end
    end
    
    if cleanedCount > 0 then
        TransactionAuditSystem.logSystemEvent({
            eventType = "AUDIT_CLEANUP",
            description = "Cleaned up old audit logs",
            data = { cleanedCount = cleanedCount },
            severity = "INFO"
        })
    end
    
    return cleanedCount
end

--[[
Export audit data for external analysis
@param criteria table - Export criteria
@return table - Exported audit data
--]]
function TransactionAuditSystem.exportAuditData(criteria)
    local exportData = {
        exportTime = 0,
        criteria = criteria,
        transactions = {},
        systemEvents = {},
        playerStats = {}
    }
    
    -- Export matching transactions
    exportData.transactions = TransactionAuditSystem.queryTransactions(criteria or {})
    
    -- Export system events
    local eventLimit = criteria and criteria.systemEventLimit or 100
    for i = math.max(1, #systemAuditLog - eventLimit + 1), #systemAuditLog do
        table.insert(exportData.systemEvents, systemAuditLog[i])
    end
    
    -- Export player statistics
    for playerId, auditTrail in pairs(playerAuditTrails) do
        exportData.playerStats[playerId] = {
            totalEntries = #auditTrail,
            lastActivity = auditTrail[#auditTrail] and auditTrail[#auditTrail].timestamp or 0
        }
    end
    
    return exportData
end

return TransactionAuditSystem