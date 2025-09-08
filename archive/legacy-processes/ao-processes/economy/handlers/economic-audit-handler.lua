--[[
Economic Audit Handler
Processes economic audit requests and transaction logging for the Economic Process

Features:
- Transaction logging and history management with comprehensive audit trails
- Audit trail queries for debugging and monitoring economic operations
- Transaction correlation tracking for multi-process operations
- Economic operation monitoring and reporting
- Compliance reporting for economic integrity validation

Integration:
- Uses TransactionAuditSystem for audit data management
- Uses EconomicSystem for economic validation and integrity checks
- Uses MessageCorrelator for inter-process audit correlation
- Provides audit services for all economic process handlers
--]]

local EconomicAuditHandler = {}

-- Dependencies
local TransactionAuditSystem = require("economy.components.transaction-audit-system")
local EconomicSystem = require("economy.components.economic-system")
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")

-- Audit request type constants
local AUDIT_REQUEST_TYPES = {
    QUERY_TRANSACTIONS = "QUERY_TRANSACTIONS",
    GET_PLAYER_AUDIT_TRAIL = "GET_PLAYER_AUDIT_TRAIL",
    GET_SYSTEM_STATS = "GET_SYSTEM_STATS",
    EXPORT_AUDIT_DATA = "EXPORT_AUDIT_DATA",
    VALIDATE_TRANSACTION = "VALIDATE_TRANSACTION",
    LOG_SYSTEM_EVENT = "LOG_SYSTEM_EVENT",
    CLEANUP_OLD_LOGS = "CLEANUP_OLD_LOGS"
}

-- Process economic audit message
function EconomicAuditHandler.process(msg)
    local startTime = msg.Timestamp
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return json.encode({
            success = false,
            error = "Invalid JSON data",
            timestamp = startTime
        })
    end
    
    -- Validate required fields
    if not data.correlation or not data.correlation.id then
        return json.encode({
            success = false,
            error = "Missing correlation ID",
            timestamp = startTime
        })
    end
    
    local correlationId = data.correlation.id
    local auditRequestType = data.auditRequestType or "UNKNOWN"
    
    -- Log audit request start
    TransactionAuditSystem.logTransactionStart(correlationId, {
        type = "ECONOMIC_AUDIT",
        subtype = auditRequestType,
        playerId = msg.From,
        timestamp = startTime
    })
    
    local response = {}
    
    -- Route to appropriate audit handler
    if auditRequestType == AUDIT_REQUEST_TYPES.QUERY_TRANSACTIONS then
        response = EconomicAuditHandler.queryTransactions(data, msg.From, correlationId)
    elseif auditRequestType == AUDIT_REQUEST_TYPES.GET_PLAYER_AUDIT_TRAIL then
        response = EconomicAuditHandler.getPlayerAuditTrail(data, msg.From, correlationId)
    elseif auditRequestType == AUDIT_REQUEST_TYPES.GET_SYSTEM_STATS then
        response = EconomicAuditHandler.getSystemStats(data, msg.From, correlationId)
    elseif auditRequestType == AUDIT_REQUEST_TYPES.EXPORT_AUDIT_DATA then
        response = EconomicAuditHandler.exportAuditData(data, msg.From, correlationId)
    elseif auditRequestType == AUDIT_REQUEST_TYPES.VALIDATE_TRANSACTION then
        response = EconomicAuditHandler.validateTransaction(data, msg.From, correlationId)
    elseif auditRequestType == AUDIT_REQUEST_TYPES.LOG_SYSTEM_EVENT then
        response = EconomicAuditHandler.logSystemEvent(data, msg.From, correlationId)
    elseif auditRequestType == AUDIT_REQUEST_TYPES.CLEANUP_OLD_LOGS then
        response = EconomicAuditHandler.cleanupOldLogs(data, msg.From, correlationId)
    else
        response = {
            success = false,
            error = "Unknown audit request type: " .. auditRequestType,
            correlation = { id = correlationId, responseType = "AUDIT_ERROR" }
        }
    end
    
    -- Calculate processing time
    local endTime = 0
    local latency = endTime - startTime
    
    -- Log audit request completion
    TransactionAuditSystem.logTransactionComplete(correlationId, {
        success = response.success,
        latency = latency,
        timestamp = endTime
    })
    
    -- Add processing metadata
    response.processing = {
        latency = latency,
        timestamp = endTime
    }
    
    return json.encode(response)
end

-- Query transactions based on criteria
function EconomicAuditHandler.queryTransactions(data, playerId, correlationId)
    -- Validate query data
    if not data.queryData then
        return {
            success = false,
            error = "Missing query data",
            correlation = { id = correlationId, responseType = "TRANSACTION_QUERY_ERROR" }
        }
    end
    
    local queryData = data.queryData
    local criteria = queryData.criteria or {}
    
    -- Apply default limits to prevent excessive data transfer
    if not criteria.limit or criteria.limit > 1000 then
        criteria.limit = 1000
    end
    
    -- Query transactions through TransactionAuditSystem
    local transactions = TransactionAuditSystem.queryTransactions(criteria)
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "TRANSACTION_QUERY_SUCCESS" },
        result = {
            transactions = transactions,
            count = #transactions,
            criteria = criteria,
            queryTime = 0
        }
    }
end

-- Get player audit trail
function EconomicAuditHandler.getPlayerAuditTrail(data, playerId, correlationId)
    -- Validate player audit request
    if not data.playerData then
        return {
            success = false,
            error = "Missing player data",
            correlation = { id = correlationId, responseType = "PLAYER_AUDIT_ERROR" }
        }
    end
    
    local playerData = data.playerData
    local targetPlayerId = playerData.playerId or playerId
    local limit = playerData.limit or 100
    
    -- Ensure reasonable limit
    if limit > 500 then
        limit = 500
    end
    
    -- Get player audit trail
    local auditTrail = TransactionAuditSystem.getPlayerAuditTrail(targetPlayerId, limit)
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "PLAYER_AUDIT_SUCCESS" },
        result = {
            playerId = targetPlayerId,
            auditTrail = auditTrail,
            entryCount = #auditTrail,
            limit = limit
        }
    }
end

-- Get system audit statistics
function EconomicAuditHandler.getSystemStats(data, playerId, correlationId)
    -- Get statistics from both audit system and economic system
    local auditStats = TransactionAuditSystem.getAuditStats()
    local economicStats = EconomicSystem.getSystemStats()
    
    local combinedStats = {
        auditSystem = auditStats,
        economicSystem = economicStats,
        timestamp = 0
    }
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "SYSTEM_STATS_SUCCESS" },
        result = combinedStats
    }
end

-- Export audit data for external analysis
function EconomicAuditHandler.exportAuditData(data, playerId, correlationId)
    -- Validate export request
    if not data.exportData then
        return {
            success = false,
            error = "Missing export data",
            correlation = { id = correlationId, responseType = "AUDIT_EXPORT_ERROR" }
        }
    end
    
    local exportData = data.exportData
    local criteria = exportData.criteria or {}
    
    -- Apply reasonable limits for export
    if not criteria.limit or criteria.limit > 5000 then
        criteria.limit = 5000
    end
    
    -- Export audit data through TransactionAuditSystem
    local exportResult = TransactionAuditSystem.exportAuditData(criteria)
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "AUDIT_EXPORT_SUCCESS" },
        result = {
            exportData = exportResult,
            criteria = criteria,
            exportTime = 0
        }
    }
end

-- Validate specific transaction
function EconomicAuditHandler.validateTransaction(data, playerId, correlationId)
    -- Validate validation request
    if not data.validationData then
        return {
            success = false,
            error = "Missing validation data",
            correlation = { id = correlationId, responseType = "TRANSACTION_VALIDATION_ERROR" }
        }
    end
    
    local validationData = data.validationData
    local transactionCorrelationId = validationData.transactionCorrelationId
    
    if not transactionCorrelationId then
        return {
            success = false,
            error = "Missing transaction correlation ID",
            correlation = { id = correlationId, responseType = "TRANSACTION_VALIDATION_ERROR" }
        }
    end
    
    -- Get transaction audit data
    local transactionAudit = TransactionAuditSystem.getTransactionAudit(transactionCorrelationId)
    
    if not transactionAudit then
        return {
            success = false,
            error = "Transaction not found",
            correlation = { id = correlationId, responseType = "TRANSACTION_VALIDATION_ERROR" }
        }
    end
    
    -- Perform validation checks
    local validationResult = {
        correlationId = transactionCorrelationId,
        found = true,
        status = transactionAudit.status,
        integrityCheck = false,
        completeness = false,
        timing = false
    }
    
    -- Check integrity hash if present
    if transactionAudit.integrityHash then
        -- Recalculate hash to verify integrity
        local hashData = {
            correlationId = transactionCorrelationId,
            playerId = transactionAudit.playerId,
            transactionType = transactionAudit.transactionType,
            timestamp = transactionAudit.endTime or transactionAudit.startTime,
            success = transactionAudit.success
        }
        local expectedHash = EconomicSystem.generateTransactionHash(hashData)
        validationResult.integrityCheck = (expectedHash == transactionAudit.integrityHash)
    end
    
    -- Check completeness
    validationResult.completeness = (
        transactionAudit.startTime ~= nil and
        transactionAudit.status ~= nil and
        (transactionAudit.status ~= "COMPLETED" or transactionAudit.endTime ~= nil)
    )
    
    -- Check reasonable timing
    if transactionAudit.startTime and transactionAudit.endTime then
        local duration = transactionAudit.endTime - transactionAudit.startTime
        validationResult.timing = (duration >= 0 and duration < 3600) -- Max 1 hour
    else
        validationResult.timing = true -- Can't validate timing without complete data
    end
    
    local overallValid = validationResult.integrityCheck and validationResult.completeness and validationResult.timing
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "TRANSACTION_VALIDATION_SUCCESS" },
        result = {
            validation = validationResult,
            valid = overallValid,
            transactionData = transactionAudit
        }
    }
end

-- Log system event
function EconomicAuditHandler.logSystemEvent(data, playerId, correlationId)
    -- Validate event data
    if not data.eventData then
        return {
            success = false,
            error = "Missing event data",
            correlation = { id = correlationId, responseType = "SYSTEM_EVENT_ERROR" }
        }
    end
    
    local eventData = data.eventData
    
    -- Log system event
    local success = TransactionAuditSystem.logSystemEvent(eventData)
    
    if not success then
        return {
            success = false,
            error = "Failed to log system event",
            correlation = { id = correlationId, responseType = "SYSTEM_EVENT_ERROR" }
        }
    end
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "SYSTEM_EVENT_SUCCESS" },
        result = {
            eventLogged = true,
            eventType = eventData.eventType,
            timestamp = 0
        }
    }
end

-- Cleanup old logs
function EconomicAuditHandler.cleanupOldLogs(data, playerId, correlationId)
    -- Perform cleanup
    local cleanedCount = TransactionAuditSystem.cleanupOldLogs()
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "CLEANUP_SUCCESS" },
        result = {
            cleanedCount = cleanedCount,
            cleanupTime = 0
        }
    }
end

-- Get specific transaction audit data
function EconomicAuditHandler.getTransactionAudit(data, playerId, correlationId)
    -- Validate request
    if not data.transactionData or not data.transactionData.transactionCorrelationId then
        return {
            success = false,
            error = "Missing transaction correlation ID",
            correlation = { id = correlationId, responseType = "TRANSACTION_AUDIT_ERROR" }
        }
    end
    
    local transactionCorrelationId = data.transactionData.transactionCorrelationId
    local transactionAudit = TransactionAuditSystem.getTransactionAudit(transactionCorrelationId)
    
    if not transactionAudit then
        return {
            success = false,
            error = "Transaction audit not found",
            correlation = { id = correlationId, responseType = "TRANSACTION_AUDIT_ERROR" }
        }
    end
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "TRANSACTION_AUDIT_SUCCESS" },
        result = {
            transactionAudit = transactionAudit
        }
    }
end

return EconomicAuditHandler