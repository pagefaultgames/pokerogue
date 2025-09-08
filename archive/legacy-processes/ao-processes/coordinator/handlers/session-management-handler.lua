-- Session Management Handler for Coordinator Process
-- Handles session lifecycle, state coordination, and process synchronization

local SessionCoordinator = require("coordinator.components.session-coordinator")
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")

-- Private helper functions

local function _getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

local function _getProcessTypes(processMap)
    local types = {}
    for processType, processes in pairs(processMap) do
        table.insert(types, processType)
    end
    return types
end

-- Session creation handler
Handlers.add(
    "session-create",
    Handlers.utils.hasMatchingTag("Action", "SESSION_CREATE"),
    function(msg)
        -- Authenticate request
        local authResult = ProcessAuthenticator.validateMessage(msg)
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_CREATE_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Authentication failed",
                    message = authResult.error
                })
            })
            return
        end

        -- Parse request data
        local requestData = json.decode(msg.Data)
        if not requestData or not requestData.playerId then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_CREATE_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Player ID is required"
                })
            })
            return
        end

        -- Create session
        local sessionId, error = SessionCoordinator.createSession(
            requestData.playerId,
            requestData.initialState
        )

        if sessionId then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_CREATE_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "session-create"
                },
                Data = json.encode({
                    success = true,
                    sessionId = sessionId,
                    playerId = requestData.playerId,
                    timestamp = 0
                })
            })
        else
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_CREATE_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "session-create"
                },
                Data = json.encode({
                    success = false,
                    error = error,
                    playerId = requestData.playerId
                })
            })
        end
    end
)

-- Session query handler
Handlers.add(
    "session-query",
    Handlers.utils.hasMatchingTag("Action", "SESSION_QUERY"),
    function(msg)
        local authResult = ProcessAuthenticator.validateMessage(msg)
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_QUERY_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Authentication failed"
                })
            })
            return
        end

        local requestData = json.decode(msg.Data)
        if not requestData then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_QUERY_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid request data"
                })
            })
            return
        end

        local session
        if requestData.sessionId then
            session = SessionCoordinator.getSession(requestData.sessionId)
        elseif requestData.playerId then
            session = SessionCoordinator.getActiveSession(requestData.playerId)
        end

        if session then
            -- Remove sensitive data for response
            local responseSession = {
                sessionId = session.sessionId,
                playerId = session.playerId,
                state = session.state,
                stateVersion = session.stateVersion,
                createdAt = session.createdAt,
                lastActivity = session.lastActivity,
                activeProcessCount = _getTableSize(session.activeProcesses),
                processTypes = _getProcessTypes(session.processMap)
            }

            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_QUERY_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "session-query"
                },
                Data = json.encode({
                    success = true,
                    session = responseSession
                })
            })
        else
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_QUERY_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "session-query"
                },
                Data = json.encode({
                    success = false,
                    error = "Session not found"
                })
            })
        end
    end
)

-- Session state synchronization handler
Handlers.add(
    "session-sync",
    Handlers.utils.hasMatchingTag("Action", "SESSION_SYNC"),
    function(msg)
        local authResult = ProcessAuthenticator.validateMessage(msg)
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_SYNC_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Authentication failed"
                })
            })
            return
        end

        local syncData = json.decode(msg.Data)
        if not syncData or not syncData.sessionId or not syncData.stateUpdate then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_SYNC_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Session ID and state update are required"
                })
            })
            return
        end

        -- Synchronize session state
        local success, error = SessionCoordinator.synchronizeSessionState(
            syncData.sessionId,
            syncData.stateUpdate,
            msg.From
        )

        if success then
            -- Update session activity
            SessionCoordinator.updateSessionActivity(syncData.sessionId)
            
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_SYNC_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "session-sync"
                },
                Data = json.encode({
                    success = true,
                    sessionId = syncData.sessionId,
                    syncTimestamp = 0
                })
            })
        else
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_SYNC_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "session-sync"
                },
                Data = json.encode({
                    success = false,
                    error = error,
                    sessionId = syncData.sessionId
                })
            })
        end
    end
)

-- Process registration in session handler
Handlers.add(
    "session-process-register",
    Handlers.utils.hasMatchingTag("Action", "SESSION_PROCESS_REGISTER"),
    function(msg)
        local authResult = ProcessAuthenticator.validateMessage(msg)
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_PROCESS_REGISTER_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Authentication failed"
                })
            })
            return
        end

        local registrationData = json.decode(msg.Data)
        if not registrationData or not registrationData.sessionId then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_PROCESS_REGISTER_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Session ID is required"
                })
            })
            return
        end

        -- Add process to session
        local success, error = SessionCoordinator.addProcessToSession(
            registrationData.sessionId,
            msg.From,
            registrationData.processType or "UNKNOWN",
            registrationData.operations or {}
        )

        if success then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_PROCESS_REGISTER_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "process-register"
                },
                Data = json.encode({
                    success = true,
                    sessionId = registrationData.sessionId,
                    processId = msg.From,
                    registeredAt = 0
                })
            })
        else
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_PROCESS_REGISTER_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "process-register"
                },
                Data = json.encode({
                    success = false,
                    error = error,
                    sessionId = registrationData.sessionId
                })
            })
        end
    end
)

-- Process deregistration from session handler
Handlers.add(
    "session-process-deregister",
    Handlers.utils.hasMatchingTag("Action", "SESSION_PROCESS_DEREGISTER"),
    function(msg)
        local authResult = ProcessAuthenticator.validateMessage(msg)
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_PROCESS_DEREGISTER_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Authentication failed"
                })
            })
            return
        end

        local deregistrationData = json.decode(msg.Data)
        if not deregistrationData or not deregistrationData.sessionId then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_PROCESS_DEREGISTER_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Session ID is required"
                })
            })
            return
        end

        -- Remove process from session
        local success, error = SessionCoordinator.removeProcessFromSession(
            deregistrationData.sessionId,
            msg.From
        )

        ao.send({
            Target = msg.From,
            Tags = {
                Action = "SESSION_PROCESS_DEREGISTER_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "process-deregister"
            },
            Data = json.encode({
                success = success,
                error = error,
                sessionId = deregistrationData.sessionId,
                processId = msg.From
            })
        })
    end
)

-- Session termination handler
Handlers.add(
    "session-terminate",
    Handlers.utils.hasMatchingTag("Action", "SESSION_TERMINATE"),
    function(msg)
        local authResult = ProcessAuthenticator.validateMessage(msg)
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_TERMINATE_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Authentication failed"
                })
            })
            return
        end

        local terminationData = json.decode(msg.Data)
        if not terminationData or not terminationData.sessionId then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_TERMINATE_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Session ID is required"
                })
            })
            return
        end

        -- Terminate session
        local success, error = SessionCoordinator.terminateSession(
            terminationData.sessionId,
            terminationData.reason
        )

        ao.send({
            Target = msg.From,
            Tags = {
                Action = "SESSION_TERMINATE_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "session-terminate"
            },
            Data = json.encode({
                success = success,
                error = error,
                sessionId = terminationData.sessionId,
                terminatedAt = 0
            })
        })
    end
)

-- Session statistics handler
Handlers.add(
    "session-statistics",
    Handlers.utils.hasMatchingTag("Action", "SESSION_STATISTICS"),
    function(msg)
        local stats = SessionCoordinator.getStatistics()
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "SESSION_STATISTICS_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "statistics"
            },
            Data = json.encode({
                success = true,
                statistics = stats,
                timestamp = 0
            })
        })
    end
)

-- Session cleanup handler (for maintenance)
Handlers.add(
    "session-cleanup",
    Handlers.utils.hasMatchingTag("Action", "SESSION_CLEANUP"),
    function(msg)
        local authResult = ProcessAuthenticator.validateMessage(msg)
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SESSION_CLEANUP_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Authentication failed"
                })
            })
            return
        end

        -- Cleanup expired sessions
        local cleanupCount = SessionCoordinator.cleanupExpiredSessions()
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "SESSION_CLEANUP_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "cleanup"
            },
            Data = json.encode({
                success = true,
                cleanedUpSessions = cleanupCount,
                timestamp = 0
            })
        })
    end
)

print("[SessionManagementHandler] Session management handlers registered")