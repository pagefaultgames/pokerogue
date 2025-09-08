-- Session Coordinator for Distributed Session State Management
-- Coordinates player sessions across all distributed processes using MessageCorrelator

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local CryptoRNG = require("game-logic.rng.crypto-rng")

local SessionCoordinator = {
    -- Active player sessions
    activeSessions = {},
    
    -- Session state synchronization tracking
    synchronizationState = {},
    
    -- Session configuration
    config = {
        sessionTimeoutMs = 1800000, -- 30 minutes
        maxConcurrentSessions = 10000,
        stateVersioningEnabled = true,
        conflictResolutionStrategy = "LAST_WRITER_WINS"
    },
    
    -- Statistics
    stats = {
        sessionsCreated = 0,
        sessionsDestroyed = 0,
        activeSessions = 0,
        stateConflictsResolved = 0,
        synchronizationEvents = 0
    }
}

-- Session states
SessionCoordinator.SESSION_STATES = {
    ACTIVE = "ACTIVE",
    MIGRATING = "MIGRATING", 
    SUSPENDED = "SUSPENDED",
    TERMINATED = "TERMINATED"
}

-- Conflict resolution strategies
SessionCoordinator.CONFLICT_RESOLUTION = {
    LAST_WRITER_WINS = "LAST_WRITER_WINS",
    OPTIMISTIC_LOCKING = "OPTIMISTIC_LOCKING",
    MANUAL_RESOLUTION = "MANUAL_RESOLUTION"
}

-- Initialize session coordinator
function SessionCoordinator.initialize()
    SessionCoordinator.activeSessions = {}
    SessionCoordinator.synchronizationState = {}
    SessionCoordinator.stats = {
        sessionsCreated = 0,
        sessionsDestroyed = 0,
        activeSessions = 0,
        stateConflictsResolved = 0,
        synchronizationEvents = 0
    }
    
    -- Initialize crypto RNG for session ID generation
    CryptoRNG.initGlobalRNG()
    
    print("[SessionCoordinator] Session management system initialized")
    return true
end

-- Create new player session
function SessionCoordinator.createSession(playerId, initialState)
    if not playerId then
        return nil, "Player ID is required"
    end
    
    -- Check for existing active session
    local existingSession = SessionCoordinator.getActiveSession(playerId)
    if existingSession then
        return existingSession.sessionId, "Session already exists"
    end
    
    -- Check session limits
    if SessionCoordinator.stats.activeSessions >= SessionCoordinator.config.maxConcurrentSessions then
        return nil, "Maximum concurrent sessions reached"
    end
    
    -- Generate unique session ID
    local sessionId = SessionCoordinator._generateSessionId(playerId)
    
    -- Create session metadata
    local session = {
        sessionId = sessionId,
        playerId = playerId,
        state = SessionCoordinator.SESSION_STATES.ACTIVE,
        processMap = {},
        activeProcesses = {},
        stateVersion = 1,
        createdAt = 0,
        lastActivity = msg.Timestamp,
        lastStateSync = 0,
        sessionData = initialState or {},
        syncHistory = {},
        conflictLog = {}
    }
    
    -- Store session
    SessionCoordinator.activeSessions[sessionId] = session
    SessionCoordinator.stats.sessionsCreated = SessionCoordinator.stats.sessionsCreated + 1
    SessionCoordinator.stats.activeSessions = SessionCoordinator.stats.activeSessions + 1
    
    print("[SessionCoordinator] Created session " .. sessionId .. " for player " .. playerId)
    return sessionId
end

-- Get active session for player
function SessionCoordinator.getActiveSession(playerId)
    for sessionId, session in pairs(SessionCoordinator.activeSessions) do
        if session.playerId == playerId and session.state == SessionCoordinator.SESSION_STATES.ACTIVE then
            return session
        end
    end
    return nil
end

-- Get session by ID
function SessionCoordinator.getSession(sessionId)
    return SessionCoordinator.activeSessions[sessionId]
end

-- Update session activity timestamp
function SessionCoordinator.updateSessionActivity(sessionId)
    local session = SessionCoordinator.activeSessions[sessionId]
    if session then
        session.lastActivity = msg.Timestamp
        return true
    end
    return false
end

-- Add process to session's process map
function SessionCoordinator.addProcessToSession(sessionId, processId, processType, operations)
    local session = SessionCoordinator.activeSessions[sessionId]
    if not session then
        return false, "Session not found"
    end
    
    -- Validate process is registered and active
    local processInfo = ProcessAuthenticator.getProcessInfo(processId)
    if not processInfo or processInfo.status ~= "active" then
        return false, "Process not available: " .. tostring(processId)
    end
    
    -- Add to process map
    session.processMap[processType] = session.processMap[processType] or {}
    table.insert(session.processMap[processType], processId)
    
    -- Add to active processes
    session.activeProcesses[processId] = {
        processType = processType,
        operations = operations or {},
        addedAt = 0,
        lastHeartbeat = 0
    }
    
    session.lastActivity = msg.Timestamp
    return true
end

-- Remove process from session
function SessionCoordinator.removeProcessFromSession(sessionId, processId)
    local session = SessionCoordinator.activeSessions[sessionId]
    if not session then
        return false, "Session not found"
    end
    
    -- Remove from active processes
    local processInfo = session.activeProcesses[processId]
    if processInfo then
        session.activeProcesses[processId] = nil
        
        -- Remove from process map
        local processType = processInfo.processType
        if session.processMap[processType] then
            for i, pid in ipairs(session.processMap[processType]) do
                if pid == processId then
                    table.remove(session.processMap[processType], i)
                    break
                end
            end
            
            -- Clean up empty process type entries
            if #session.processMap[processType] == 0 then
                session.processMap[processType] = nil
            end
        end
        
        session.lastActivity = msg.Timestamp
        return true
    end
    
    return false, "Process not found in session"
end

-- Synchronize session state across processes
function SessionCoordinator.synchronizeSessionState(sessionId, stateUpdate, fromProcessId)
    local session = SessionCoordinator.activeSessions[sessionId]
    if not session then
        return false, "Session not found"
    end
    
    SessionCoordinator.stats.synchronizationEvents = SessionCoordinator.stats.synchronizationEvents + 1
    
    -- Check for conflicts if versioning enabled
    if SessionCoordinator.config.stateVersioningEnabled then
        local hasConflict, conflictInfo = SessionCoordinator._detectStateConflict(session, stateUpdate)
        if hasConflict then
            local resolution = SessionCoordinator._resolveStateConflict(session, stateUpdate, conflictInfo)
            if not resolution then
                return false, "State conflict could not be resolved"
            end
            
            SessionCoordinator.stats.stateConflictsResolved = SessionCoordinator.stats.stateConflictsResolved + 1
        end
    end
    
    -- Generate correlation for sync operation
    local correlationId = MessageCorrelator.createCorrelation(
        fromProcessId or "session-coordinator",
        "session-sync",
        "SESSION_STATE_SYNC"
    )
    
    -- Apply state update
    local success, error = SessionCoordinator._applyStateUpdate(session, stateUpdate, correlationId)
    if not success then
        return false, error
    end
    
    -- Propagate to interested processes
    SessionCoordinator._propagateStateUpdate(session, stateUpdate, correlationId, fromProcessId)
    
    session.lastStateSync = 0
    session.lastActivity = msg.Timestamp
    
    return true
end

-- Handle session conflict resolution
function SessionCoordinator.resolveSessionConflict(sessionId, conflictData, resolution)
    local session = SessionCoordinator.activeSessions[sessionId]
    if not session then
        return false, "Session not found"
    end
    
    -- Log conflict for analysis
    table.insert(session.conflictLog, {
        timestamp = msg.Timestamp,
        conflictData = conflictData,
        resolution = resolution,
        resolvedBy = "SessionCoordinator"
    })
    
    SessionCoordinator.stats.stateConflictsResolved = SessionCoordinator.stats.stateConflictsResolved + 1
    return true
end

-- Terminate session and cleanup
function SessionCoordinator.terminateSession(sessionId, reason)
    local session = SessionCoordinator.activeSessions[sessionId]
    if not session then
        return false, "Session not found"
    end
    
    -- Update session state
    session.state = SessionCoordinator.SESSION_STATES.TERMINATED
    session.terminatedAt = 0
    session.terminationReason = reason or "Manual termination"
    
    -- Notify all active processes
    for processId, processInfo in pairs(session.activeProcesses) do
        SessionCoordinator._notifyProcessOfSessionTermination(processId, sessionId, reason)
    end
    
    -- Cleanup session data
    SessionCoordinator.activeSessions[sessionId] = nil
    SessionCoordinator.synchronizationState[sessionId] = nil
    SessionCoordinator.stats.sessionsDestroyed = SessionCoordinator.stats.sessionsDestroyed + 1
    SessionCoordinator.stats.activeSessions = SessionCoordinator.stats.activeSessions - 1
    
    print("[SessionCoordinator] Terminated session " .. sessionId .. " - " .. (reason or "No reason"))
    return true
end

-- Cleanup expired sessions
function SessionCoordinator.cleanupExpiredSessions()
    local currentTime = 0
    local cleanupCount = 0
    local expiredSessions = {}
    
    -- Find expired sessions
    for sessionId, session in pairs(SessionCoordinator.activeSessions) do
        local timeSinceActivity = (currentTime - session.lastActivity) * 1000
        if timeSinceActivity > SessionCoordinator.config.sessionTimeoutMs then
            table.insert(expiredSessions, sessionId)
        end
    end
    
    -- Terminate expired sessions
    for _, sessionId in ipairs(expiredSessions) do
        if SessionCoordinator.terminateSession(sessionId, "Session timeout") then
            cleanupCount = cleanupCount + 1
        end
    end
    
    if cleanupCount > 0 then
        print("[SessionCoordinator] Cleaned up " .. cleanupCount .. " expired sessions")
    end
    
    return cleanupCount
end

-- Get session statistics
function SessionCoordinator.getStatistics()
    local processDistribution = {}
    local stateVersions = {}
    
    for sessionId, session in pairs(SessionCoordinator.activeSessions) do
        -- Count processes per session
        local processCount = 0
        for _ in pairs(session.activeProcesses) do
            processCount = processCount + 1
        end
        
        -- Track process distribution
        for processType, processes in pairs(session.processMap) do
            processDistribution[processType] = (processDistribution[processType] or 0) + #processes
        end
        
        -- Track state versions
        stateVersions[session.stateVersion] = (stateVersions[session.stateVersion] or 0) + 1
    end
    
    return {
        stats = SessionCoordinator.stats,
        config = SessionCoordinator.config,
        processDistribution = processDistribution,
        stateVersionDistribution = stateVersions,
        averageProcessesPerSession = SessionCoordinator.stats.activeSessions > 0 and 
            SessionCoordinator._getTableSize(processDistribution) / SessionCoordinator.stats.activeSessions or 0
    }
end

-- Private helper functions

function SessionCoordinator._generateSessionId(playerId)
    local timestamp = msg.Timestamp
    local random = CryptoRNG.random(100000, 999999)
    return "session_" .. playerId .. "_" .. timestamp .. "_" .. random
end

function SessionCoordinator._detectStateConflict(session, stateUpdate)
    if not stateUpdate.expectedVersion then
        return false, nil
    end
    
    if session.stateVersion ~= stateUpdate.expectedVersion then
        return true, {
            currentVersion = session.stateVersion,
            expectedVersion = stateUpdate.expectedVersion,
            conflictType = "VERSION_MISMATCH"
        }
    end
    
    return false, nil
end

function SessionCoordinator._resolveStateConflict(session, stateUpdate, conflictInfo)
    local strategy = SessionCoordinator.config.conflictResolutionStrategy
    
    if strategy == SessionCoordinator.CONFLICT_RESOLUTION.LAST_WRITER_WINS then
        -- Accept the new state update
        return true
    elseif strategy == SessionCoordinator.CONFLICT_RESOLUTION.OPTIMISTIC_LOCKING then
        -- Reject conflicting updates
        return false
    elseif strategy == SessionCoordinator.CONFLICT_RESOLUTION.MANUAL_RESOLUTION then
        -- Queue for manual resolution (not implemented here)
        return false
    end
    
    return false
end

function SessionCoordinator._applyStateUpdate(session, stateUpdate, correlationId)
    -- Increment version
    if SessionCoordinator.config.stateVersioningEnabled then
        session.stateVersion = session.stateVersion + 1
    end
    
    -- Apply data changes
    if stateUpdate.data then
        for key, value in pairs(stateUpdate.data) do
            session.sessionData[key] = value
        end
    end
    
    -- Add to sync history
    table.insert(session.syncHistory, {
        timestamp = msg.Timestamp,
        version = session.stateVersion,
        correlationId = correlationId,
        updateType = stateUpdate.updateType or "STATE_SYNC"
    })
    
    -- Limit history size
    if #session.syncHistory > 100 then
        table.remove(session.syncHistory, 1)
    end
    
    return true
end

function SessionCoordinator._propagateStateUpdate(session, stateUpdate, correlationId, excludeProcessId)
    -- Send state update to all active processes except the source
    for processId, processInfo in pairs(session.activeProcesses) do
        if processId ~= excludeProcessId then
            SessionCoordinator._sendStateUpdateToProcess(processId, session.sessionId, stateUpdate, correlationId)
        end
    end
end

function SessionCoordinator._sendStateUpdateToProcess(processId, sessionId, stateUpdate, correlationId)
    -- This would send an actual message to the process in a real AO environment
    -- For now, just log the intent
    print("[SessionCoordinator] Would send state update to process " .. processId .. " for session " .. sessionId)
end

function SessionCoordinator._notifyProcessOfSessionTermination(processId, sessionId, reason)
    -- This would send termination notification to the process
    print("[SessionCoordinator] Would notify process " .. processId .. " of session " .. sessionId .. " termination")
end

function SessionCoordinator._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return SessionCoordinator