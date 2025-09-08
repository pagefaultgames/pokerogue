-- Process Administration Handler
-- Handles process information, discovery, and AO protocol compliance

-- Admin Handler Module
local AdminHandler = {}

-- Process Information Handler
function AdminHandler.handleProcessInfo(msg)
    local processInfo = {
        name = PROCESS_NAME or "PokeRogue-AO-Process",
        version = PROCESS_VERSION or "1.0.0",
        capabilities = PROCESS_CAPABILITIES or {},
        handlers = getRegisteredHandlerNames and getRegisteredHandlerNames() or {},
        initialized_at = os.date("%Y-%m-%d %H:%M:%S"),
        message_schemas = AdminHandler.getMessageSchemas(),
        process_status = "running",
        ao_protocol_version = "1.0",
        documentation_url = "https://github.com/pokerogue/ao-migration"
    }
    
    return json.encode(processInfo)
end

-- Handler Discovery for Agent Integration
function AdminHandler.handleHandlerDiscovery(msg)
    local discovery = {
        available_handlers = {},
        message_patterns = AdminHandler.getMessagePatterns(),
        process_info = {
            name = PROCESS_NAME or "PokeRogue-AO-Process",
            version = PROCESS_VERSION or "1.0.0",
            capabilities = PROCESS_CAPABILITIES or {}
        },
        agent_integration = {
            supported_operations = AdminHandler.getSupportedOperations(),
            authentication_required = true,
            rate_limits = AdminHandler.getRateLimits()
        }
    }
    
    -- Populate available handlers from registry
    if REGISTERED_HANDLERS then
        for name, info in pairs(REGISTERED_HANDLERS) do
            table.insert(discovery.available_handlers, {
                name = name,
                registered_at = info.registered_at,
                description = AdminHandler.getHandlerDescription(name)
            })
        end
    end
    
    return json.encode(discovery)
end

-- Get Message Schema Definitions
function AdminHandler.getMessageSchemas()
    return {
        ["Info"] = {
            description = "Get process information and capabilities",
            required_tags = {"Action"},
            action_value = "Info",
            response_format = "JSON",
            authentication_required = false
        },
        ["Discover-Handlers"] = {
            description = "Discover available handlers for agent integration",
            required_tags = {"Action"},
            action_value = "Discover-Handlers", 
            response_format = "JSON",
            authentication_required = false
        },
        ["Battle-Start"] = {
            description = "Start a new battle session",
            required_tags = {"Action", "Player-ID"},
            action_value = "Battle-Start",
            required_data = {"pokemon_team", "battle_type"},
            response_format = "JSON",
            authentication_required = true
        },
        ["Battle-Action"] = {
            description = "Execute battle action (move, switch, item)",
            required_tags = {"Action", "Player-ID", "Battle-ID"},
            action_value = "Battle-Action",
            required_data = {"action_type", "target", "move_id"},
            response_format = "JSON",
            authentication_required = true
        },
        ["Pokemon-Query"] = {
            description = "Query Pokemon information and stats",
            required_tags = {"Action", "Query-Type"},
            action_value = "Pokemon-Query",
            optional_data = {"species_id", "level", "nature"},
            response_format = "JSON",
            authentication_required = false
        }
    }
end

-- Get Message Patterns for Discovery
function AdminHandler.getMessagePatterns()
    return {
        info_pattern = "Action == 'Info'",
        discovery_pattern = "Action == 'Discover-Handlers'",
        battle_start_pattern = "Action == 'Battle-Start' AND Player-ID != nil",
        battle_action_pattern = "Action == 'Battle-Action' AND Battle-ID != nil",
        pokemon_query_pattern = "Action == 'Pokemon-Query'"
    }
end

-- Get Supported Operations for Agents
function AdminHandler.getSupportedOperations()
    return {
        "process_information",
        "handler_discovery", 
        "battle_management",
        "pokemon_queries",
        "state_management",
        "error_handling"
    }
end

-- Get Rate Limits for API Usage
function AdminHandler.getRateLimits()
    return {
        requests_per_minute = 60,
        battle_actions_per_second = 2,
        query_requests_per_minute = 100
    }
end

-- Get Handler Descriptions
function AdminHandler.getHandlerDescription(handlerName)
    local descriptions = {
        ["admin-info"] = "Provides process information and capabilities",
        ["admin-discover"] = "Enables handler discovery for agent integration",
        ["battle-handler"] = "Manages battle resolution and turn processing",
        ["state-handler"] = "Handles Pokemon state management and persistence",
        ["query-handler"] = "Processes information queries about Pokemon and moves"
    }
    
    return descriptions[handlerName] or "Handler for " .. handlerName
end

-- Validate Message Format
function AdminHandler.validateMessageFormat(messageType, msg)
    local schemas = AdminHandler.getMessageSchemas()
    local schema = schemas[messageType]
    
    if not schema then
        return false, "Unknown message type: " .. messageType
    end
    
    -- Check required tags
    if not msg.Tags then
        return false, "Message missing Tags"
    end
    
    for _, tag in ipairs(schema.required_tags) do
        if not msg.Tags[tag] then
            return false, "Missing required tag: " .. tag
        end
    end
    
    -- Check action value
    if schema.action_value and msg.Tags.Action ~= schema.action_value then
        return false, "Invalid action value. Expected: " .. schema.action_value
    end
    
    -- Check required data if specified
    if schema.required_data and msg.Data then
        local data = json.decode(msg.Data)
        for _, field in ipairs(schema.required_data) do
            if not data[field] then
                return false, "Missing required data field: " .. field
            end
        end
    end
    
    return true, "Valid message format"
end

-- Get Process Capabilities with Details
function AdminHandler.getProcessCapabilitiesDetails()
    return {
        ["battle-resolution"] = {
            description = "Handles complete battle turn resolution",
            supported_formats = {"1v1", "2v2", "raid"},
            features = {"damage_calculation", "status_effects", "type_effectiveness"}
        },
        ["pokemon-management"] = {
            description = "Pokemon state and data management",
            supported_operations = {"stat_calculation", "evolution", "move_learning"},
            data_sources = {"species_database", "move_database", "item_database"}
        },
        ["game-state"] = {
            description = "Game state persistence and management",
            supported_operations = {"save", "load", "backup", "restore"},
            storage_format = "embedded_lua_tables"
        },
        ["admin-operations"] = {
            description = "Process administration and monitoring",
            supported_operations = {"info", "discovery", "health_check", "metrics"},
            compliance = {"ao_protocol", "agent_integration"}
        }
    }
end

-- Health Check for Process Monitoring
function AdminHandler.handleHealthCheck(msg)
    local health = {
        status = "healthy",
        uptime_seconds = os.time() - (PROCESS_START_TIME or os.time()),
        handlers_registered = 0,
        memory_usage = "unknown", -- Would need actual memory monitoring
        last_activity = os.date("%Y-%m-%d %H:%M:%S")
    }
    
    -- Count registered handlers
    if REGISTERED_HANDLERS then
        for _ in pairs(REGISTERED_HANDLERS) do
            health.handlers_registered = health.handlers_registered + 1
        end
    end
    
    return json.encode(health)
end

return AdminHandler