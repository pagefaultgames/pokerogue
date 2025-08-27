-- PokéRogue AO Process - Main Entry Point
-- Version: 1.0.0
-- This is the primary AO process that handles all PokéRogue game operations

-- Process Metadata
PROCESS_VERSION = "1.0.0"
PROCESS_NAME = "PokeRogue-AO-Process"
PROCESS_CAPABILITIES = {
    "battle-resolution",
    "pokemon-management", 
    "game-state",
    "admin-operations"
}

-- Handler Registry
REGISTERED_HANDLERS = {}

-- Error Types and Codes
ERROR_TYPES = {
    VALIDATION = "VALIDATION_ERROR",
    HANDLER = "HANDLER_ERROR", 
    SYSTEM = "SYSTEM_ERROR",
    NOT_FOUND = "NOT_FOUND_ERROR"
}

-- Initialize process state
function initializeProcess()
    print("Initializing PokéRogue AO Process v" .. PROCESS_VERSION)
    
    -- Initialize handler registration system
    initializeHandlers()
    
    -- Set up error handling framework
    setupErrorHandling()
    
    print("Process initialization complete")
    return true
end

-- Handler Registration Framework
function registerHandler(name, pattern, handler)
    if not name or not pattern or not handler then
        error("Invalid handler registration parameters")
    end
    
    -- Register with AO Handlers system
    Handlers.add(name, pattern, handler)
    
    -- Track in internal registry
    REGISTERED_HANDLERS[name] = {
        pattern = pattern,
        handler = handler,
        registered_at = os.time()
    }
    
    print("Registered handler: " .. name)
end

-- Initialize all handlers
function initializeHandlers()
    -- Load and register admin handler (process info and discovery)
    loadAdminHandler()
    
    print("Handler initialization complete")
end

-- Load Admin Handler
function loadAdminHandler()
    -- Admin handler for process information and discovery
    registerHandler(
        "admin-info",
        Handlers.utils.hasMatchingTag("Action", "Info"),
        function(msg)
            local success, result = pcall(handleAdminInfo, msg)
            if not success then
                sendErrorResponse(msg, ERROR_TYPES.HANDLER, "Admin info handler failed: " .. tostring(result))
                return
            end
            
            msg.reply({
                Target = msg.From,
                Tags = {
                    Action = "Info-Response",
                    Success = "true"
                },
                Data = result
            })
        end
    )
    
    -- Handler discovery endpoint
    registerHandler(
        "admin-discover",
        Handlers.utils.hasMatchingTag("Action", "Discover-Handlers"),
        function(msg)
            local success, result = pcall(getHandlerDiscovery, msg)
            if not success then
                sendErrorResponse(msg, ERROR_TYPES.HANDLER, "Handler discovery failed: " .. tostring(result))
                return
            end
            
            msg.reply({
                Target = msg.From,
                Tags = {
                    Action = "Discover-Response", 
                    Success = "true"
                },
                Data = result
            })
        end
    )
end

-- Admin Info Handler
function handleAdminInfo(msg)
    local processInfo = {
        name = PROCESS_NAME,
        version = PROCESS_VERSION,
        capabilities = PROCESS_CAPABILITIES,
        handlers = getRegisteredHandlerNames(),
        initialized_at = os.date("%Y-%m-%d %H:%M:%S"),
        message_schemas = getMessageSchemas()
    }
    
    return json.encode(processInfo)
end

-- Handler Discovery
function getHandlerDiscovery(msg)
    local discovery = {
        available_handlers = {},
        message_patterns = {},
        process_info = {
            name = PROCESS_NAME,
            version = PROCESS_VERSION
        }
    }
    
    for name, info in pairs(REGISTERED_HANDLERS) do
        table.insert(discovery.available_handlers, {
            name = name,
            registered_at = info.registered_at
        })
    end
    
    return json.encode(discovery)
end

-- Get registered handler names
function getRegisteredHandlerNames()
    local names = {}
    for name, _ in pairs(REGISTERED_HANDLERS) do
        table.insert(names, name)
    end
    return names
end

-- Message Schema Definitions
function getMessageSchemas()
    return {
        ["Info"] = {
            required_tags = {"Action"},
            action_value = "Info",
            response_format = "JSON"
        },
        ["Discover-Handlers"] = {
            required_tags = {"Action"},
            action_value = "Discover-Handlers", 
            response_format = "JSON"
        }
    }
end

-- Error Handling Framework
function setupErrorHandling()
    -- Set up global error handler patterns
    print("Error handling framework initialized")
end

-- Send standardized error response
function sendErrorResponse(msg, errorType, errorMessage)
    local correlationId = msg.Tags["Correlation-ID"] or generateCorrelationId()
    
    msg.reply({
        Target = msg.From,
        Tags = {
            Action = "Error-Response",
            Success = "false",
            ["Error-Type"] = errorType,
            ["Correlation-ID"] = correlationId
        },
        Data = json.encode({
            error = errorType,
            message = errorMessage,
            correlation_id = correlationId,
            timestamp = os.date("%Y-%m-%d %H:%M:%S")
        })
    })
end

-- Generate correlation ID for operation tracking  
function generateCorrelationId()
    -- Use millisecond precision and larger random range for uniqueness
    local timestamp = os.time() * 1000 + math.random(0, 999)
    local randomSuffix = math.random(10000, 99999)
    return "cor_" .. timestamp .. "_" .. randomSuffix
end

-- Process startup
local initSuccess = pcall(initializeProcess)
if not initSuccess then
    error("Process initialization failed")
end

print("PokéRogue AO Process ready and listening for messages")