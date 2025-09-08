-- Security Audit Logger
-- Comprehensive event logging with correlation tracking

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local CryptoRNG = require("game-logic.rng.crypto-rng")

local AuditLogger = {
    -- Audit storage
    auditEvents = {},
    eventIndex = {},
    
    -- Audit metrics
    auditMetrics = {
        totalEvents = 0,
        eventsByType = {},
        eventsBySeverity = {},
        lastPurgeTime = 0
    },
    
    -- Configuration
    maxAuditEvents = 50000,
    auditRetentionDays = 30,
    batchSize = 100
}

-- Event types
AuditLogger.EVENT_TYPES = {
    SECURITY_VALIDATION = "SECURITY_VALIDATION",
    CHEAT_DETECTED = "CHEAT_DETECTED",
    AUTH_VIOLATION = "AUTH_VIOLATION",
    POLICY_VIOLATION = "POLICY_VIOLATION",
    DATA_INTEGRITY_VIOLATION = "DATA_INTEGRITY_VIOLATION",
    PROCESS_MONITORING_STARTED = "PROCESS_MONITORING_STARTED",
    PROCESS_MONITORING_STOPPED = "PROCESS_MONITORING_STOPPED",
    INCIDENT_CREATED = "INCIDENT_CREATED",
    INCIDENT_RESOLVED = "INCIDENT_RESOLVED",
    SECURITY_ALERT = "SECURITY_ALERT",
    SYSTEM_EVENT = "SYSTEM_EVENT",
    UNHANDLED_MESSAGE = "UNHANDLED_MESSAGE"
}

-- Severity levels
AuditLogger.SEVERITY_LEVELS = {
    LOW = "LOW",
    MEDIUM = "MEDIUM", 
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}

-- Initialize audit logger
function AuditLogger.initialize()
    AuditLogger.auditEvents = {}
    AuditLogger.eventIndex = {
        byType = {},
        bySeverity = {},
        byPlayer = {},
        byProcess = {},
        byCorrelation = {}
    }
    
    AuditLogger.auditMetrics = {
        totalEvents = 0,
        eventsByType = {},
        eventsBySeverity = {},
        lastPurgeTime = 0
    }
    
    -- Log initialization event
    AuditLogger.logSecurityEvent({
        eventType = AuditLogger.EVENT_TYPES.SYSTEM_EVENT,
        severity = AuditLogger.SEVERITY_LEVELS.LOW,
        processId = ao.id or "security-process",
        eventData = {
            message = "Audit logging system initialized",
            maxEvents = AuditLogger.maxAuditEvents,
            retentionDays = AuditLogger.auditRetentionDays
        }
    })
    
    print("[AuditLogger] Audit logging system initialized")
end

-- Log security event with full correlation tracking
function AuditLogger.logSecurityEvent(eventData, correlationId)
    local timestamp = 0
    local eventId = AuditLogger._generateEventId()
    
    -- Validate required event data
    if not eventData.eventType or not AuditLogger.EVENT_TYPES[eventData.eventType] then
        print("[AuditLogger] Error: Invalid event type: " .. tostring(eventData.eventType))
        return nil
    end
    
    -- Create correlation if not provided
    if not correlationId then
        correlationId = MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTRA_PROCESS)
    end
    
    -- Build complete audit event
    local auditEvent = {
        eventId = eventId,
        eventType = eventData.eventType,
        severity = eventData.severity or AuditLogger.SEVERITY_LEVELS.MEDIUM,
        timestamp = timestamp,
        correlationId = correlationId,
        playerId = eventData.playerId,
        processId = eventData.processId or ao.id or "unknown",
        sourceIP = eventData.sourceIP,
        userAgent = eventData.userAgent,
        eventData = eventData.eventData or {},
        actionTaken = eventData.actionTaken,
        resolution = eventData.resolution,
        metadata = {
            loggedAt = timestamp,
            processVersion = "1.0.0",
            logLevel = "AUDIT"
        }
    }
    
    -- Store audit event
    AuditLogger.auditEvents[eventId] = auditEvent
    
    -- Update indexes for fast querying
    AuditLogger._updateEventIndexes(auditEvent)
    
    -- Update metrics
    AuditLogger._updateAuditMetrics(auditEvent)
    
    -- Auto-purge old events if needed
    AuditLogger._checkAndPurgeOldEvents()
    
    print(string.format("[AuditLogger] Event logged: %s [%s] - %s", 
          eventData.eventType, auditEvent.severity, eventId))
    
    return eventId
end

-- Log security validation result
function AuditLogger.logValidationResult(validationResult, correlationId)
    local eventData = {
        eventType = AuditLogger.EVENT_TYPES.SECURITY_VALIDATION,
        severity = validationResult.valid and AuditLogger.SEVERITY_LEVELS.LOW or 
                  AuditLogger._mapActionToSeverity(validationResult.securityAction),
        playerId = validationResult.playerId,
        processId = validationResult.processId,
        eventData = {
            validationType = validationResult.validationType,
            valid = validationResult.valid,
            violations = validationResult.violations or {},
            securityAction = validationResult.securityAction,
            validationLatency = validationResult.validationLatency,
            rulesEvaluated = validationResult.rulesEvaluated,
            cacheHit = validationResult.cacheHit
        },
        actionTaken = validationResult.securityAction
    }
    
    return AuditLogger.logSecurityEvent(eventData, correlationId)
end

-- Log cheat detection result
function AuditLogger.logCheatDetection(cheatDetection, correlationId)
    local eventData = {
        eventType = AuditLogger.EVENT_TYPES.CHEAT_DETECTED,
        severity = AuditLogger.SEVERITY_LEVELS.HIGH,
        playerId = cheatDetection.playerId,
        processId = cheatDetection.processId,
        eventData = {
            suspicionScore = cheatDetection.suspicionScore,
            detectedCheats = cheatDetection.detectedCheats or {},
            analysisTime = cheatDetection.analysisTime,
            cheatTypes = cheatDetection.cheatTypes
        },
        actionTaken = cheatDetection.actionTaken or "INVESTIGATION_REQUIRED"
    }
    
    return AuditLogger.logSecurityEvent(eventData, correlationId)
end

-- Log policy violation
function AuditLogger.logPolicyViolation(policyViolation, correlationId)
    local eventData = {
        eventType = AuditLogger.EVENT_TYPES.POLICY_VIOLATION,
        severity = AuditLogger._mapEnforcementToSeverity(policyViolation.enforcement),
        playerId = policyViolation.playerId,
        processId = policyViolation.processId,
        eventData = {
            policyId = policyViolation.policyId,
            policyName = policyViolation.policyName,
            violatedRules = policyViolation.violatedRules or {},
            enforcement = policyViolation.enforcement,
            context = policyViolation.context
        },
        actionTaken = policyViolation.enforcement
    }
    
    return AuditLogger.logSecurityEvent(eventData, correlationId)
end

-- Query audit events with filtering
function AuditLogger.queryAuditEvents(filters, limit, offset)
    local matchedEvents = {}
    local totalMatched = 0
    local processedCount = 0
    
    limit = limit or 100
    offset = offset or 0
    
    -- Use indexes for efficient querying when possible
    local candidateEvents = AuditLogger._getCandidateEvents(filters)
    
    for eventId, event in pairs(candidateEvents) do
        if AuditLogger._eventMatchesFilters(event, filters) then
            totalMatched = totalMatched + 1
            
            if processedCount >= offset and #matchedEvents < limit then
                table.insert(matchedEvents, event)
            end
            
            processedCount = processedCount + 1
            
            if #matchedEvents >= limit then
                break
            end
        end
    end
    
    return matchedEvents, totalMatched
end

-- Get audit events by correlation ID (for tracking request chains)
function AuditLogger.getEventsByCorrelation(correlationId)
    local correlatedEvents = {}
    
    if AuditLogger.eventIndex.byCorrelation[correlationId] then
        for eventId in pairs(AuditLogger.eventIndex.byCorrelation[correlationId]) do
            local event = AuditLogger.auditEvents[eventId]
            if event then
                table.insert(correlatedEvents, event)
            end
        end
        
        -- Sort by timestamp
        table.sort(correlatedEvents, function(a, b) return a.timestamp < b.timestamp end)
    end
    
    return correlatedEvents
end

-- Get security events for a specific player
function AuditLogger.getPlayerSecurityEvents(playerId, eventTypes, days)
    local playerEvents = {}
    days = days or 7 -- Default to last 7 days
    local cutoffTime = 0 - (days * 24 * 3600)
    
    if AuditLogger.eventIndex.byPlayer[playerId] then
        for eventId in pairs(AuditLogger.eventIndex.byPlayer[playerId]) do
            local event = AuditLogger.auditEvents[eventId]
            if event and event.timestamp >= cutoffTime then
                local includeEvent = true
                
                if eventTypes then
                    includeEvent = false
                    for _, eventType in ipairs(eventTypes) do
                        if event.eventType == eventType then
                            includeEvent = true
                            break
                        end
                    end
                end
                
                if includeEvent then
                    table.insert(playerEvents, event)
                end
            end
        end
        
        -- Sort by timestamp (most recent first)
        table.sort(playerEvents, function(a, b) return a.timestamp > b.timestamp end)
    end
    
    return playerEvents
end

-- Get audit statistics
function AuditLogger.getStatistics()
    local eventTypeStats = {}
    for eventType, count in pairs(AuditLogger.auditMetrics.eventsByType) do
        eventTypeStats[eventType] = count
    end
    
    local severityStats = {}
    for severity, count in pairs(AuditLogger.auditMetrics.eventsBySeverity) do
        severityStats[severity] = count
    end
    
    return {
        totalEvents = AuditLogger.auditMetrics.totalEvents,
        storedEvents = AuditLogger._getTableSize(AuditLogger.auditEvents),
        eventsByType = eventTypeStats,
        eventsBySeverity = severityStats,
        lastPurgeTime = AuditLogger.auditMetrics.lastPurgeTime,
        indexedPlayers = AuditLogger._getTableSize(AuditLogger.eventIndex.byPlayer),
        indexedProcesses = AuditLogger._getTableSize(AuditLogger.eventIndex.byProcess),
        indexedCorrelations = AuditLogger._getTableSize(AuditLogger.eventIndex.byCorrelation),
        maxAuditEvents = AuditLogger.maxAuditEvents,
        retentionDays = AuditLogger.auditRetentionDays
    }
end

-- Get health status
function AuditLogger.getHealth()
    local stats = AuditLogger.getStatistics()
    
    -- Check if audit storage is near capacity
    if stats.storedEvents > AuditLogger.maxAuditEvents * 0.9 then
        return "DEGRADED"
    end
    
    -- Check if purging is working
    local daysSinceLastPurge = (0 - stats.lastPurgeTime) / (24 * 3600)
    if daysSinceLastPurge > 2 then -- Should purge at least every 2 days
        return "DEGRADED"
    end
    
    return "HEALTHY"
end

-- Export audit events (for external analysis or compliance)
function AuditLogger.exportAuditEvents(startDate, endDate, eventTypes)
    local exportEvents = {}
    startDate = startDate or (0 - 7 * 24 * 3600) -- Default to last week
    endDate = endDate or 0
    
    for eventId, event in pairs(AuditLogger.auditEvents) do
        if event.timestamp >= startDate and event.timestamp <= endDate then
            local includeEvent = true
            
            if eventTypes then
                includeEvent = false
                for _, eventType in ipairs(eventTypes) do
                    if event.eventType == eventType then
                        includeEvent = true
                        break
                    end
                end
            end
            
            if includeEvent then
                -- Create export-friendly version (remove internal metadata)
                local exportEvent = {
                    eventId = event.eventId,
                    eventType = event.eventType,
                    severity = event.severity,
                    timestamp = event.timestamp,
                    correlationId = event.correlationId,
                    playerId = event.playerId,
                    processId = event.processId,
                    eventData = event.eventData,
                    actionTaken = event.actionTaken,
                    resolution = event.resolution
                }
                table.insert(exportEvents, exportEvent)
            end
        end
    end
    
    -- Sort by timestamp
    table.sort(exportEvents, function(a, b) return a.timestamp < b.timestamp end)
    
    return exportEvents
end

-- Private helper functions

function AuditLogger._generateEventId()
    local timestamp = msg.Timestamp + CryptoRNG.random(0, 999)
    local randomSuffix = CryptoRNG.random(100000, 999999)
    return "audit_" .. timestamp .. "_" .. randomSuffix
end

function AuditLogger._updateEventIndexes(event)
    -- Index by event type
    if not AuditLogger.eventIndex.byType[event.eventType] then
        AuditLogger.eventIndex.byType[event.eventType] = {}
    end
    AuditLogger.eventIndex.byType[event.eventType][event.eventId] = true
    
    -- Index by severity
    if not AuditLogger.eventIndex.bySeverity[event.severity] then
        AuditLogger.eventIndex.bySeverity[event.severity] = {}
    end
    AuditLogger.eventIndex.bySeverity[event.severity][event.eventId] = true
    
    -- Index by player
    if event.playerId then
        if not AuditLogger.eventIndex.byPlayer[event.playerId] then
            AuditLogger.eventIndex.byPlayer[event.playerId] = {}
        end
        AuditLogger.eventIndex.byPlayer[event.playerId][event.eventId] = true
    end
    
    -- Index by process
    if event.processId then
        if not AuditLogger.eventIndex.byProcess[event.processId] then
            AuditLogger.eventIndex.byProcess[event.processId] = {}
        end
        AuditLogger.eventIndex.byProcess[event.processId][event.eventId] = true
    end
    
    -- Index by correlation
    if event.correlationId then
        if not AuditLogger.eventIndex.byCorrelation[event.correlationId] then
            AuditLogger.eventIndex.byCorrelation[event.correlationId] = {}
        end
        AuditLogger.eventIndex.byCorrelation[event.correlationId][event.eventId] = true
    end
end

function AuditLogger._updateAuditMetrics(event)
    AuditLogger.auditMetrics.totalEvents = AuditLogger.auditMetrics.totalEvents + 1
    
    -- Update event type counts
    AuditLogger.auditMetrics.eventsByType[event.eventType] = 
        (AuditLogger.auditMetrics.eventsByType[event.eventType] or 0) + 1
    
    -- Update severity counts
    AuditLogger.auditMetrics.eventsBySeverity[event.severity] = 
        (AuditLogger.auditMetrics.eventsBySeverity[event.severity] or 0) + 1
end

function AuditLogger._getCandidateEvents(filters)
    -- Use most selective index first
    if filters.eventType and AuditLogger.eventIndex.byType[filters.eventType] then
        return AuditLogger.eventIndex.byType[filters.eventType]
    elseif filters.playerId and AuditLogger.eventIndex.byPlayer[filters.playerId] then
        return AuditLogger.eventIndex.byPlayer[filters.playerId]
    elseif filters.processId and AuditLogger.eventIndex.byProcess[filters.processId] then
        return AuditLogger.eventIndex.byProcess[filters.processId]
    elseif filters.correlationId and AuditLogger.eventIndex.byCorrelation[filters.correlationId] then
        return AuditLogger.eventIndex.byCorrelation[filters.correlationId]
    else
        return AuditLogger.auditEvents
    end
end

function AuditLogger._eventMatchesFilters(event, filters)
    if filters.eventType and event.eventType ~= filters.eventType then
        return false
    end
    
    if filters.severity and event.severity ~= filters.severity then
        return false
    end
    
    if filters.playerId and event.playerId ~= filters.playerId then
        return false
    end
    
    if filters.processId and event.processId ~= filters.processId then
        return false
    end
    
    if filters.correlationId and event.correlationId ~= filters.correlationId then
        return false
    end
    
    if filters.startTime and event.timestamp < filters.startTime then
        return false
    end
    
    if filters.endTime and event.timestamp > filters.endTime then
        return false
    end
    
    return true
end

function AuditLogger._checkAndPurgeOldEvents()
    local currentTime = 0
    local eventCount = AuditLogger._getTableSize(AuditLogger.auditEvents)
    
    -- Purge if over max events or old events exist
    if eventCount > AuditLogger.maxAuditEvents or 
       (currentTime - AuditLogger.auditMetrics.lastPurgeTime) > 24 * 3600 then -- Daily check
        
        AuditLogger._purgeOldEvents(currentTime)
        AuditLogger.auditMetrics.lastPurgeTime = currentTime
    end
end

function AuditLogger._purgeOldEvents(currentTime)
    local cutoffTime = currentTime - (AuditLogger.auditRetentionDays * 24 * 3600)
    local purgedCount = 0
    
    for eventId, event in pairs(AuditLogger.auditEvents) do
        if event.timestamp < cutoffTime then
            -- Remove from all indexes
            AuditLogger._removeEventFromIndexes(event)
            
            -- Remove from main storage
            AuditLogger.auditEvents[eventId] = nil
            purgedCount = purgedCount + 1
        end
    end
    
    if purgedCount > 0 then
        print(string.format("[AuditLogger] Purged %d old audit events", purgedCount))
    end
end

function AuditLogger._removeEventFromIndexes(event)
    if AuditLogger.eventIndex.byType[event.eventType] then
        AuditLogger.eventIndex.byType[event.eventType][event.eventId] = nil
    end
    
    if AuditLogger.eventIndex.bySeverity[event.severity] then
        AuditLogger.eventIndex.bySeverity[event.severity][event.eventId] = nil
    end
    
    if event.playerId and AuditLogger.eventIndex.byPlayer[event.playerId] then
        AuditLogger.eventIndex.byPlayer[event.playerId][event.eventId] = nil
    end
    
    if event.processId and AuditLogger.eventIndex.byProcess[event.processId] then
        AuditLogger.eventIndex.byProcess[event.processId][event.eventId] = nil
    end
    
    if event.correlationId and AuditLogger.eventIndex.byCorrelation[event.correlationId] then
        AuditLogger.eventIndex.byCorrelation[event.correlationId][event.eventId] = nil
    end
end

function AuditLogger._mapActionToSeverity(action)
    if action == "TERMINATE" then
        return AuditLogger.SEVERITY_LEVELS.CRITICAL
    elseif action == "BLOCK" then
        return AuditLogger.SEVERITY_LEVELS.HIGH
    elseif action == "WARN" then
        return AuditLogger.SEVERITY_LEVELS.MEDIUM
    else
        return AuditLogger.SEVERITY_LEVELS.LOW
    end
end

function AuditLogger._mapEnforcementToSeverity(enforcement)
    if enforcement == "TERMINATE" then
        return AuditLogger.SEVERITY_LEVELS.CRITICAL
    elseif enforcement == "BLOCK" then
        return AuditLogger.SEVERITY_LEVELS.HIGH
    elseif enforcement == "WARN" then
        return AuditLogger.SEVERITY_LEVELS.MEDIUM
    else
        return AuditLogger.SEVERITY_LEVELS.LOW
    end
end

function AuditLogger._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return AuditLogger