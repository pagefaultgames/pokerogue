-- Data Integrity Monitor
-- Monitors cross-process data consistency and corruption detection

local CryptoRNG = require("game-logic.rng.crypto-rng")
local AuditLogger = require("security.components.audit-logger")

local IntegrityMonitor = {
    -- Integrity tracking
    dataChecksums = {},
    integrityChecks = {},
    corruptionIncidents = {},
    
    -- Monitoring metrics
    monitoringMetrics = {
        totalChecks = 0,
        dataCorruptions = 0,
        consistencyViolations = 0,
        checksumMismatches = 0,
        averageCheckTime = 0
    },
    
    -- Configuration
    checksumAlgorithm = "simple-hash",
    maxCorruptionHistory = 1000,
    integrityCheckInterval = 300, -- 5 minutes
    crossProcessSyncTimeout = 30000 -- 30 seconds
}

-- Integrity check types
IntegrityMonitor.CHECK_TYPES = {
    CHECKSUM_VALIDATION = "CHECKSUM_VALIDATION",
    CROSS_PROCESS_CONSISTENCY = "CROSS_PROCESS_CONSISTENCY",
    STATE_CORRUPTION = "STATE_CORRUPTION",
    DATA_SYNCHRONIZATION = "DATA_SYNCHRONIZATION"
}

-- Corruption severity levels
IntegrityMonitor.CORRUPTION_SEVERITY = {
    LOW = "LOW",           -- Minor inconsistencies, recoverable
    MEDIUM = "MEDIUM",     -- Data inconsistencies requiring attention
    HIGH = "HIGH",         -- Critical data corruption
    CRITICAL = "CRITICAL"  -- System-wide data corruption
}

-- Initialize integrity monitor
function IntegrityMonitor.initialize()
    IntegrityMonitor.dataChecksums = {}
    IntegrityMonitor.integrityChecks = {}
    IntegrityMonitor.corruptionIncidents = {}
    
    IntegrityMonitor.monitoringMetrics = {
        totalChecks = 0,
        dataCorruptions = 0,
        consistencyViolations = 0,
        checksumMismatches = 0,
        averageCheckTime = 0,
        totalCheckTime = 0
    }
    
    print("[IntegrityMonitor] Data integrity monitoring system initialized")
    
    -- Log initialization
    AuditLogger.logSecurityEvent({
        eventType = AuditLogger.EVENT_TYPES.SYSTEM_EVENT,
        severity = AuditLogger.SEVERITY_LEVELS.LOW,
        processId = ao.id or "security-process",
        eventData = {
            message = "Integrity monitoring system initialized",
            checksumAlgorithm = IntegrityMonitor.checksumAlgorithm,
            checkInterval = IntegrityMonitor.integrityCheckInterval
        }
    })
end

-- Generate data checksum for integrity validation
function IntegrityMonitor.generateDataChecksum(data, dataType, contextId)
    if not data then
        return nil, "No data provided for checksum"
    end
    
    local serializedData = IntegrityMonitor._serializeData(data)
    local checksum = IntegrityMonitor._calculateChecksum(serializedData)
    local timestamp = 0
    
    local checksumRecord = {
        checksum = checksum,
        dataType = dataType or "unknown",
        contextId = contextId or "unknown",
        timestamp = timestamp,
        dataSize = #serializedData,
        algorithm = IntegrityMonitor.checksumAlgorithm
    }
    
    -- Store checksum for later validation
    local checksumId = IntegrityMonitor._generateChecksumId(dataType, contextId, timestamp)
    IntegrityMonitor.dataChecksums[checksumId] = checksumRecord
    
    return checksum, checksumId
end

-- Validate data against stored checksum
function IntegrityMonitor.validateDataChecksum(data, expectedChecksum, checksumId)
    local startTime = msg.Timestamp
    
    if not data then
        return false, "No data provided for validation", 0
    end
    
    if not expectedChecksum then
        return false, "No expected checksum provided", 0
    end
    
    local serializedData = IntegrityMonitor._serializeData(data)
    local actualChecksum = IntegrityMonitor._calculateChecksum(serializedData)
    
    local isValid = actualChecksum == expectedChecksum
    local endTime = msg.Timestamp
    local checkTime = endTime - startTime
    
    -- Update metrics
    IntegrityMonitor.monitoringMetrics.totalChecks = IntegrityMonitor.monitoringMetrics.totalChecks + 1
    IntegrityMonitor.monitoringMetrics.totalCheckTime = IntegrityMonitor.monitoringMetrics.totalCheckTime + checkTime
    IntegrityMonitor.monitoringMetrics.averageCheckTime = 
        IntegrityMonitor.monitoringMetrics.totalCheckTime / IntegrityMonitor.monitoringMetrics.totalChecks
    
    if not isValid then
        IntegrityMonitor.monitoringMetrics.checksumMismatches = IntegrityMonitor.monitoringMetrics.checksumMismatches + 1
        
        -- Record corruption incident
        IntegrityMonitor._recordCorruptionIncident({
            checkType = IntegrityMonitor.CHECK_TYPES.CHECKSUM_VALIDATION,
            severity = IntegrityMonitor.CORRUPTION_SEVERITY.HIGH,
            description = "Data checksum validation failed",
            expectedChecksum = expectedChecksum,
            actualChecksum = actualChecksum,
            checksumId = checksumId,
            dataSize = #serializedData
        })
    end
    
    return isValid, isValid and "Checksum validation passed" or "Checksum validation failed", checkTime
end

-- Perform cross-process data consistency check
function IntegrityMonitor.performCrossProcessConsistencyCheck(processStates, dataKey)
    local startTime = msg.Timestamp
    local consistencyResults = {
        consistent = true,
        conflicts = {},
        processCount = 0,
        dataKey = dataKey
    }
    
    if not processStates or IntegrityMonitor._getTableSize(processStates) < 2 then
        return consistencyResults, "Insufficient process states for consistency check"
    end
    
    local referenceChecksum = nil
    local referenceProcessId = nil
    
    -- Compare checksums across all processes
    for processId, processState in pairs(processStates) do
        consistencyResults.processCount = consistencyResults.processCount + 1
        
        if processState.data then
            local currentChecksum = IntegrityMonitor._calculateChecksum(
                IntegrityMonitor._serializeData(processState.data)
            )
            
            if not referenceChecksum then
                referenceChecksum = currentChecksum
                referenceProcessId = processId
            elseif referenceChecksum ~= currentChecksum then
                -- Inconsistency detected
                consistencyResults.consistent = false
                table.insert(consistencyResults.conflicts, {
                    processId = processId,
                    expectedChecksum = referenceChecksum,
                    actualChecksum = currentChecksum,
                    referenceProcess = referenceProcessId
                })
            end
        end
    end
    
    local endTime = msg.Timestamp
    local checkTime = endTime - startTime
    
    -- Update metrics
    IntegrityMonitor.monitoringMetrics.totalChecks = IntegrityMonitor.monitoringMetrics.totalChecks + 1
    IntegrityMonitor.monitoringMetrics.totalCheckTime = IntegrityMonitor.monitoringMetrics.totalCheckTime + checkTime
    IntegrityMonitor.monitoringMetrics.averageCheckTime = 
        IntegrityMonitor.monitoringMetrics.totalCheckTime / IntegrityMonitor.monitoringMetrics.totalChecks
    
    if not consistencyResults.consistent then
        IntegrityMonitor.monitoringMetrics.consistencyViolations = 
            IntegrityMonitor.monitoringMetrics.consistencyViolations + 1
        
        -- Record consistency violation
        IntegrityMonitor._recordCorruptionIncident({
            checkType = IntegrityMonitor.CHECK_TYPES.CROSS_PROCESS_CONSISTENCY,
            severity = IntegrityMonitor.CORRUPTION_SEVERITY.MEDIUM,
            description = "Cross-process data consistency violation detected",
            dataKey = dataKey,
            conflicts = consistencyResults.conflicts,
            processCount = consistencyResults.processCount
        })
        
        -- Log audit event
        AuditLogger.logSecurityEvent({
            eventType = AuditLogger.EVENT_TYPES.DATA_INTEGRITY_VIOLATION,
            severity = AuditLogger.SEVERITY_LEVELS.MEDIUM,
            processId = ao.id or "security-process",
            eventData = {
                checkType = IntegrityMonitor.CHECK_TYPES.CROSS_PROCESS_CONSISTENCY,
                dataKey = dataKey,
                processCount = consistencyResults.processCount,
                conflictCount = #consistencyResults.conflicts,
                conflicts = consistencyResults.conflicts
            }
        })
    end
    
    return consistencyResults, checkTime
end

-- Monitor for state corruption patterns
function IntegrityMonitor.detectStateCorruption(gameState, stateType, contextId)
    local startTime = msg.Timestamp
    local corruptionDetails = {
        corrupted = false,
        corruptionTypes = {},
        severity = IntegrityMonitor.CORRUPTION_SEVERITY.LOW
    }
    
    if not gameState then
        return corruptionDetails, "No game state provided"
    end
    
    -- Pokemon state corruption checks
    if stateType == "pokemon" and gameState.pokemon then
        for pokemonIndex, pokemon in ipairs(gameState.pokemon) do
            local pokemonCorruption = IntegrityMonitor._checkPokemonStateCorruption(pokemon, pokemonIndex)
            if pokemonCorruption.corrupted then
                corruptionDetails.corrupted = true
                table.insert(corruptionDetails.corruptionTypes, pokemonCorruption)
                
                -- Update severity based on corruption type
                if pokemonCorruption.severity == IntegrityMonitor.CORRUPTION_SEVERITY.CRITICAL then
                    corruptionDetails.severity = IntegrityMonitor.CORRUPTION_SEVERITY.CRITICAL
                elseif pokemonCorruption.severity == IntegrityMonitor.CORRUPTION_SEVERITY.HIGH and
                       corruptionDetails.severity ~= IntegrityMonitor.CORRUPTION_SEVERITY.CRITICAL then
                    corruptionDetails.severity = IntegrityMonitor.CORRUPTION_SEVERITY.HIGH
                end
            end
        end
    end
    
    -- Battle state corruption checks
    if stateType == "battle" and gameState.battleState then
        local battleCorruption = IntegrityMonitor._checkBattleStateCorruption(gameState.battleState)
        if battleCorruption.corrupted then
            corruptionDetails.corrupted = true
            table.insert(corruptionDetails.corruptionTypes, battleCorruption)
            
            if battleCorruption.severity == IntegrityMonitor.CORRUPTION_SEVERITY.CRITICAL then
                corruptionDetails.severity = IntegrityMonitor.CORRUPTION_SEVERITY.CRITICAL
            end
        end
    end
    
    -- Inventory state corruption checks
    if stateType == "inventory" and gameState.inventory then
        local inventoryCorruption = IntegrityMonitor._checkInventoryStateCorruption(gameState.inventory)
        if inventoryCorruption.corrupted then
            corruptionDetails.corrupted = true
            table.insert(corruptionDetails.corruptionTypes, inventoryCorruption)
        end
    end
    
    local endTime = msg.Timestamp
    local checkTime = endTime - startTime
    
    -- Update metrics and record incidents
    IntegrityMonitor.monitoringMetrics.totalChecks = IntegrityMonitor.monitoringMetrics.totalChecks + 1
    IntegrityMonitor.monitoringMetrics.totalCheckTime = IntegrityMonitor.monitoringMetrics.totalCheckTime + checkTime
    IntegrityMonitor.monitoringMetrics.averageCheckTime = 
        IntegrityMonitor.monitoringMetrics.totalCheckTime / IntegrityMonitor.monitoringMetrics.totalChecks
    
    if corruptionDetails.corrupted then
        IntegrityMonitor.monitoringMetrics.dataCorruptions = IntegrityMonitor.monitoringMetrics.dataCorruptions + 1
        
        IntegrityMonitor._recordCorruptionIncident({
            checkType = IntegrityMonitor.CHECK_TYPES.STATE_CORRUPTION,
            severity = corruptionDetails.severity,
            description = "Game state corruption detected",
            stateType = stateType,
            contextId = contextId,
            corruptionTypes = corruptionDetails.corruptionTypes
        })
    end
    
    return corruptionDetails, checkTime
end

-- Check Pokemon state for corruption
function IntegrityMonitor._checkPokemonStateCorruption(pokemon, pokemonIndex)
    local corruption = {
        corrupted = false,
        pokemonIndex = pokemonIndex,
        issues = {},
        severity = IntegrityMonitor.CORRUPTION_SEVERITY.LOW
    }
    
    -- HP validation
    if pokemon.hp and pokemon.maxHp then
        if pokemon.hp < 0 then
            corruption.corrupted = true
            corruption.severity = IntegrityMonitor.CORRUPTION_SEVERITY.HIGH
            table.insert(corruption.issues, "Negative HP: " .. pokemon.hp)
        elseif pokemon.hp > pokemon.maxHp then
            corruption.corrupted = true
            corruption.severity = IntegrityMonitor.CORRUPTION_SEVERITY.MEDIUM
            table.insert(corruption.issues, "HP exceeds maxHP: " .. pokemon.hp .. " > " .. pokemon.maxHp)
        end
    end
    
    -- Level validation
    if pokemon.level then
        if pokemon.level < 1 or pokemon.level > 100 then
            corruption.corrupted = true
            corruption.severity = IntegrityMonitor.CORRUPTION_SEVERITY.HIGH
            table.insert(corruption.issues, "Invalid level: " .. pokemon.level)
        end
    end
    
    -- Stat validation
    local stats = {"attack", "defense", "spAttack", "spDefense", "speed"}
    for _, stat in ipairs(stats) do
        if pokemon[stat] and pokemon[stat] < 0 then
            corruption.corrupted = true
            corruption.severity = IntegrityMonitor.CORRUPTION_SEVERITY.HIGH
            table.insert(corruption.issues, "Negative " .. stat .. ": " .. pokemon[stat])
        end
    end
    
    -- Move validation
    if pokemon.moves then
        for moveIndex, move in ipairs(pokemon.moves) do
            if move.pp and move.maxPP and move.pp > move.maxPP then
                corruption.corrupted = true
                corruption.severity = IntegrityMonitor.CORRUPTION_SEVERITY.MEDIUM
                table.insert(corruption.issues, "Move " .. moveIndex .. " PP exceeds maxPP")
            end
        end
    end
    
    return corruption
end

-- Check battle state for corruption
function IntegrityMonitor._checkBattleStateCorruption(battleState)
    local corruption = {
        corrupted = false,
        issues = {},
        severity = IntegrityMonitor.CORRUPTION_SEVERITY.LOW
    }
    
    -- Turn validation
    if battleState.turn and battleState.turn < 0 then
        corruption.corrupted = true
        corruption.severity = IntegrityMonitor.CORRUPTION_SEVERITY.MEDIUM
        table.insert(corruption.issues, "Negative turn number: " .. battleState.turn)
    end
    
    -- Active Pokemon validation
    if battleState.activePlayerPokemon and battleState.activePlayerPokemon.hp and 
       battleState.activePlayerPokemon.hp <= 0 and battleState.battlePhase ~= "FAINTED" then
        corruption.corrupted = true
        corruption.severity = IntegrityMonitor.CORRUPTION_SEVERITY.HIGH
        table.insert(corruption.issues, "Active Pokemon has 0 HP but battle continues")
    end
    
    -- Battle phase consistency
    if battleState.battlePhase == "BATTLE_ENDED" and battleState.winner == nil then
        corruption.corrupted = true
        corruption.severity = IntegrityMonitor.CORRUPTION_SEVERITY.HIGH
        table.insert(corruption.issues, "Battle ended but no winner declared")
    end
    
    return corruption
end

-- Check inventory state for corruption
function IntegrityMonitor._checkInventoryStateCorruption(inventory)
    local corruption = {
        corrupted = false,
        issues = {},
        severity = IntegrityMonitor.CORRUPTION_SEVERITY.LOW
    }
    
    -- Item quantity validation
    if inventory.items then
        for itemId, quantity in pairs(inventory.items) do
            if quantity < 0 then
                corruption.corrupted = true
                corruption.severity = IntegrityMonitor.CORRUPTION_SEVERITY.MEDIUM
                table.insert(corruption.issues, "Negative item quantity for " .. itemId .. ": " .. quantity)
            elseif quantity > 999 then -- Assuming max stack of 999
                corruption.corrupted = true
                corruption.severity = IntegrityMonitor.CORRUPTION_SEVERITY.MEDIUM
                table.insert(corruption.issues, "Item quantity exceeds maximum for " .. itemId .. ": " .. quantity)
            end
        end
    end
    
    -- Money validation
    if inventory.money and inventory.money < 0 then
        corruption.corrupted = true
        corruption.severity = IntegrityMonitor.CORRUPTION_SEVERITY.HIGH
        table.insert(corruption.issues, "Negative money: " .. inventory.money)
    end
    
    return corruption
end

-- Record corruption incident
function IntegrityMonitor._recordCorruptionIncident(incidentData)
    local incidentId = IntegrityMonitor._generateIncidentId()
    local timestamp = 0
    
    local incident = {
        incidentId = incidentId,
        checkType = incidentData.checkType,
        severity = incidentData.severity,
        description = incidentData.description,
        timestamp = timestamp,
        resolved = false,
        details = incidentData
    }
    
    IntegrityMonitor.corruptionIncidents[incidentId] = incident
    
    -- Log audit event
    AuditLogger.logSecurityEvent({
        eventType = AuditLogger.EVENT_TYPES.DATA_INTEGRITY_VIOLATION,
        severity = AuditLogger._mapCorruptionSeverityToAuditSeverity(incidentData.severity),
        processId = ao.id or "security-process",
        eventData = {
            incidentId = incidentId,
            checkType = incidentData.checkType,
            description = incidentData.description,
            details = incidentData
        }
    })
    
    -- Cleanup old incidents if at limit
    IntegrityMonitor._cleanupOldIncidents()
    
    return incidentId
end

-- Generate unique IDs
function IntegrityMonitor._generateChecksumId(dataType, contextId, timestamp)
    local randomSuffix = CryptoRNG.random(1000, 9999)
    return "checksum_" .. (dataType or "unknown") .. "_" .. (contextId or "unknown") .. "_" .. 
           timestamp .. "_" .. randomSuffix
end

function IntegrityMonitor._generateIncidentId()
    local timestamp = msg.Timestamp + CryptoRNG.random(0, 999)
    local randomSuffix = CryptoRNG.random(100000, 999999)
    return "incident_" .. timestamp .. "_" .. randomSuffix
end

-- Data serialization and checksum calculation
function IntegrityMonitor._serializeData(data)
    -- Simple JSON serialization for checksum calculation
    local success, serialized = pcall(json.encode, data)
    if success then
        return serialized
    else
        -- Fallback to string representation
        return tostring(data)
    end
end

function IntegrityMonitor._calculateChecksum(serializedData)
    -- Simple hash function for checksum calculation
    local checksum = 0
    for i = 1, #serializedData do
        local char = string.byte(serializedData, i)
        checksum = ((checksum * 31) + char) % 2147483647 -- Large prime for better distribution
    end
    return string.format("%08x", checksum) -- Return as hex string
end

-- Cleanup old incidents
function IntegrityMonitor._cleanupOldIncidents()
    local incidentCount = IntegrityMonitor._getTableSize(IntegrityMonitor.corruptionIncidents)
    
    if incidentCount > IntegrityMonitor.maxCorruptionHistory then
        local incidentArray = {}
        for incidentId, incident in pairs(IntegrityMonitor.corruptionIncidents) do
            incident.incidentId = incidentId
            table.insert(incidentArray, incident)
        end
        
        table.sort(incidentArray, function(a, b) return a.timestamp < b.timestamp end)
        
        -- Remove oldest 20%
        local removeCount = math.floor(incidentCount * 0.2)
        for i = 1, removeCount do
            IntegrityMonitor.corruptionIncidents[incidentArray[i].incidentId] = nil
        end
    end
end

-- Get integrity monitoring statistics
function IntegrityMonitor.getStatistics()
    return {
        totalChecks = IntegrityMonitor.monitoringMetrics.totalChecks,
        dataCorruptions = IntegrityMonitor.monitoringMetrics.dataCorruptions,
        consistencyViolations = IntegrityMonitor.monitoringMetrics.consistencyViolations,
        checksumMismatches = IntegrityMonitor.monitoringMetrics.checksumMismatches,
        averageCheckTime = IntegrityMonitor.monitoringMetrics.averageCheckTime,
        corruptionRate = IntegrityMonitor.monitoringMetrics.totalChecks > 0 and 
                        (IntegrityMonitor.monitoringMetrics.dataCorruptions / IntegrityMonitor.monitoringMetrics.totalChecks) or 0,
        storedChecksums = IntegrityMonitor._getTableSize(IntegrityMonitor.dataChecksums),
        activeIncidents = IntegrityMonitor._getTableSize(IntegrityMonitor.corruptionIncidents),
        checksumAlgorithm = IntegrityMonitor.checksumAlgorithm
    }
end

-- Get corruption incidents
function IntegrityMonitor.getCorruptionIncidents(severity, days, resolved)
    local incidents = {}
    days = days or 7
    local cutoffTime = 0 - (days * 24 * 3600)
    
    for incidentId, incident in pairs(IntegrityMonitor.corruptionIncidents) do
        if incident.timestamp >= cutoffTime then
            local includeIncident = true
            
            if severity and incident.severity ~= severity then
                includeIncident = false
            end
            
            if resolved ~= nil and incident.resolved ~= resolved then
                includeIncident = false
            end
            
            if includeIncident then
                table.insert(incidents, incident)
            end
        end
    end
    
    -- Sort by timestamp (most recent first)
    table.sort(incidents, function(a, b) return a.timestamp > b.timestamp end)
    
    return incidents
end

-- Resolve corruption incident
function IntegrityMonitor.resolveIncident(incidentId, resolutionNotes)
    local incident = IntegrityMonitor.corruptionIncidents[incidentId]
    if incident then
        incident.resolved = true
        incident.resolvedAt = 0
        incident.resolutionNotes = resolutionNotes or "Incident resolved"
        
        -- Log resolution
        AuditLogger.logSecurityEvent({
            eventType = AuditLogger.EVENT_TYPES.INCIDENT_RESOLVED,
            severity = AuditLogger.SEVERITY_LEVELS.LOW,
            processId = ao.id or "security-process",
            eventData = {
                incidentId = incidentId,
                resolutionNotes = resolutionNotes,
                originalSeverity = incident.severity
            }
        })
        
        return true
    end
    return false
end

-- Get health status
function IntegrityMonitor.getHealth()
    local stats = IntegrityMonitor.getStatistics()
    
    -- Check corruption rate
    if stats.corruptionRate > 0.1 then -- More than 10% corruption rate
        return "DEGRADED"
    end
    
    -- Check average check time
    if stats.averageCheckTime > 100 then -- More than 100ms average
        return "DEGRADED"
    end
    
    -- Check for unresolved critical incidents
    local criticalIncidents = IntegrityMonitor.getCorruptionIncidents(
        IntegrityMonitor.CORRUPTION_SEVERITY.CRITICAL, 1, false
    )
    
    if #criticalIncidents > 0 then
        return "DEGRADED"
    end
    
    return "HEALTHY"
end

-- Helper function
function IntegrityMonitor._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return IntegrityMonitor