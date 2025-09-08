-- Pokemon Process Main Entry Point
-- Dedicated Pokemon data operations and state management process

-- JSON handling for AO environment
local json = {}
local success, jsonModule = pcall(require, 'json')
if success then
    json = jsonModule
else
    -- Pure Lua JSON implementation for AO environment compatibility
    json = {
        encode = function(obj)
            if type(obj) == "string" then
                return '"' .. obj:gsub('"', '\\"'):gsub('\n', '\\n'):gsub('\r', '\\r'):gsub('\t', '\\t') .. '"'
            elseif type(obj) == "number" then
                return tostring(obj)
            elseif type(obj) == "boolean" then
                return obj and "true" or "false"
            elseif obj == nil then
                return "null"
            elseif type(obj) == "table" then
                local isArray = true
                local maxIndex = 0
                for k, v in pairs(obj) do
                    if type(k) ~= "number" then
                        isArray = false
                        break
                    end
                    maxIndex = math.max(maxIndex, k)
                end
                
                if isArray then
                    local result = "["
                    for i = 1, maxIndex do
                        if i > 1 then result = result .. "," end
                        result = result .. json.encode(obj[i])
                    end
                    return result .. "]"
                else
                    local result = "{"
                    local first = true
                    for k, v in pairs(obj) do
                        if not first then result = result .. "," end
                        result = result .. json.encode(tostring(k)) .. ":" .. json.encode(v)
                        first = false
                    end
                    return result .. "}"
                end
            else
                return "null"
            end
        end,
        decode = function(str)
            -- Basic decode implementation for common patterns
            if not str or str == "" then return {} end
            if str == "null" then return nil end
            if str == "true" then return true end
            if str == "false" then return false end
            if str:match("^%d+$") then return tonumber(str) end
            if str:match('^".*"$') then return str:sub(2, -2) end
            return {}
        end
    }
end

-- Load process coordination components from foundation
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local MessageRouter = require("game-logic.process-coordination.message-router")
local BackwardCompatibility = require("game-logic.process-coordination.backward-compatibility")
local PerformanceMonitor = require("game-logic.process-coordination.performance-monitor")

-- Load pokemon-specific components (to be created)
local PokemonStateManager = require("pokemon.components.pokemon-state-manager")
local PartyManager = require("pokemon.components.party-manager")
local SpeciesManager = require("pokemon.components.species-manager")

-- Load data components
local SpeciesDatabase = require("data.species.species-database") 
local AbilityDatabase = require("data.abilities.ability-database")

-- Process information for discovery
local PROCESS_INFO = {
    type = "POKEMON",
    version = "1.0.0",
    capabilities = {
        "pokemon-crud",
        "stats-calculation",
        "evolution-processing",
        "party-management",
        "species-data",
        "pokemon-validation",
        "inter-process-communication"
    },
    description = "Dedicated Pokemon data operations and state management process",
    endpoints = {
        "POKEMON_STATE_REQUEST",
        "POKEMON_STATS_REQUEST",
        "POKEMON_EVOLUTION_REQUEST",
        "PARTY_MANAGEMENT_REQUEST",
        "SPECIES_DATA_REQUEST",
        "POKEMON_VALIDATION_REQUEST",
        "INTER_PROCESS_MESSAGE",
        "PROCESS_HEALTH"
    }
}

-- Global process state
local pokemonState = {
    initialized = false,
    mode = "DISTRIBUTED", -- Always distributed for pokemon process
    processedRequests = 0,
    cacheHits = 0,
    cacheMisses = 0,
    healthStatus = "HEALTHY",
    activePokemonSessions = {},
    partyCache = {},
    speciesCache = {}
}

-- Expose globals for health checks
PokemonManager = PokemonStateManager
SpeciesDatabase = SpeciesDatabase
AbilityDatabase = AbilityDatabase

-- Initialize pokemon process
local function initialize()
    print("[Pokemon] Initializing pokemon process...")
    
    -- Initialize process coordination foundation
    MessageCorrelator.initialize()
    ProcessAuthenticator.initialize()
    MessageRouter.initialize()
    BackwardCompatibility.initialize()
    PerformanceMonitor.initialize()
    
    -- Initialize pokemon-specific components
    PokemonStateManager.initialize()
    PartyManager.initialize()
    SpeciesManager.initialize()
    
    -- Register this process with authenticator
    local authResult = ProcessAuthenticator.registerProcess(
        ao.id or "pokemon-process",
        PROCESS_INFO.type,
        PROCESS_INFO.capabilities
    )
    
    if authResult then
        print("[Pokemon] Process registered successfully")
    else
        print("[Pokemon] Warning: Process registration failed")
    end
    
    pokemonState.initialized = true
    pokemonState.startTime = 0
    
    print("[Pokemon] Pokemon process initialized")
    print("[Pokemon] Process ID: " .. (ao.id or "unknown"))
    print("[Pokemon] Capabilities: " .. table.concat(PROCESS_INFO.capabilities, ", "))
end

-- Process information handler for discovery
Handlers.add(
    "process-info",
    Handlers.utils.hasMatchingTag("Action", "Info"),
    function(msg)
        local processInfo = {
            process = PROCESS_INFO,
            state = {
                initialized = pokemonState.initialized,
                mode = pokemonState.mode,
                healthStatus = pokemonState.healthStatus,
                uptime = pokemonState.startTime and (0 - pokemonState.startTime) or 0,
                processedRequests = pokemonState.processedRequests,
                activePokemonSessions = _getTableSize(pokemonState.activePokemonSessions),
                cacheStatistics = {
                    hits = pokemonState.cacheHits,
                    misses = pokemonState.cacheMisses,
                    hitRatio = pokemonState.processedRequests > 0 and 
                              (pokemonState.cacheHits / pokemonState.processedRequests) or 0
                }
            },
            statistics = {
                messageCorrelator = MessageCorrelator.getStatistics(),
                messageRouter = MessageRouter.getRoutingStatistics(),
                performanceMonitor = PerformanceMonitor.getMetrics(),
                pokemonStateManager = PokemonStateManager.getStatistics(),
                partyManager = PartyManager.getStatistics(),
                speciesManager = SpeciesManager.getStatistics()
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = { Action = "Info-Response" },
            Data = json.encode(processInfo)
        })
    end
)

-- Health check handler
Handlers.add(
    "health-check",
    Handlers.utils.hasMatchingTag("Action", "HEALTH_CHECK"),
    function(msg)
        local healthInfo = {
            status = pokemonState.healthStatus,
            timestamp = msg.Timestamp,
            uptime = pokemonState.startTime and (0 - pokemonState.startTime) or 0,
            processId = ao.id or "unknown",
            version = PROCESS_INFO.version,
            mode = pokemonState.mode,
            components = {
                messageCorrelator = "HEALTHY",
                processAuthenticator = "HEALTHY", 
                messageRouter = "HEALTHY",
                pokemonStateManager = "HEALTHY",
                partyManager = "HEALTHY",
                speciesManager = "HEALTHY"
            },
            performance = {
                processedRequests = pokemonState.processedRequests,
                cacheHitRatio = pokemonState.processedRequests > 0 and 
                               (pokemonState.cacheHits / pokemonState.processedRequests) or 0,
                averageResponseTime = PerformanceMonitor.getAverageResponseTime()
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "HEALTH_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "health-check"
            },
            Data = json.encode(healthInfo)
        })
    end
)

-- Cache management functions
local function updateCacheStats(hit)
    pokemonState.processedRequests = pokemonState.processedRequests + 1
    if hit then
        pokemonState.cacheHits = pokemonState.cacheHits + 1
    else
        pokemonState.cacheMisses = pokemonState.cacheMisses + 1
    end
end

-- Session management for Pokemon operations
local function createPokemonSession(sessionId, playerId, pokemonId)
    pokemonState.activePokemonSessions[sessionId] = {
        sessionId = sessionId,
        playerId = playerId,
        pokemonId = pokemonId,
        startTime = 0,
        lastActivity = msg.Timestamp
    }
end

local function updatePokemonSessionActivity(sessionId)
    if pokemonState.activePokemonSessions[sessionId] then
        pokemonState.activePokemonSessions[sessionId].lastActivity = msg.Timestamp
    end
end

local function cleanupInactiveSessions()
    local currentTime = 0
    local sessionTimeout = 1800 -- 30 minutes
    
    for sessionId, session in pairs(pokemonState.activePokemonSessions) do
        if currentTime - session.lastActivity > sessionTimeout then
            pokemonState.activePokemonSessions[sessionId] = nil
            print("[Pokemon] Cleaned up inactive session: " .. sessionId)
        end
    end
end

-- Error handler
Handlers.add(
    "error-handler",
    function(msg)
        -- Catch-all error handler for unhandled messages
        return not (msg.Tags.Action and (
            msg.Tags.Action == "POKEMON_STATE_REQUEST" or
            msg.Tags.Action == "POKEMON_STATS_REQUEST" or
            msg.Tags.Action == "POKEMON_EVOLUTION_REQUEST" or
            msg.Tags.Action == "PARTY_MANAGEMENT_REQUEST" or
            msg.Tags.Action == "SPECIES_DATA_REQUEST" or
            msg.Tags.Action == "POKEMON_VALIDATION_REQUEST" or
            msg.Tags.Action == "INTER_PROCESS_MESSAGE" or
            msg.Tags.Action == "Info" or
            msg.Tags.Action == "HEALTH_CHECK"
        ))
    end,
    function(msg)
        print("[Pokemon] Unhandled message: Action=" .. (msg.Tags.Action or "nil"))
        
        if msg.From and msg.Tags.Action then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Unsupported action",
                    action = msg.Tags.Action,
                    supportedActions = PROCESS_INFO.endpoints
                })
            })
        end
    end
)

-- Periodic maintenance tasks
local function performMaintenance()
    cleanupInactiveSessions()
    PokemonStateManager.performMaintenance()
    PartyManager.performMaintenance()
    SpeciesManager.performMaintenance()
end

-- Schedule maintenance every 5 minutes
local maintenanceTimer = 0
local MAINTENANCE_INTERVAL = 300 -- 5 minutes

-- Add maintenance trigger (would be called by scheduler in full AO implementation)
local function checkMaintenance()
    local currentTime = 0
    if currentTime - maintenanceTimer >= MAINTENANCE_INTERVAL then
        performMaintenance()
        maintenanceTimer = currentTime
    end
end

-- Private helper functions

local function _getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

-- Load pokemon-specific handlers
require("pokemon.handlers.pokemon-state-handler")
require("pokemon.handlers.pokemon-evolution-handler")
require("pokemon.handlers.pokemon-stats-handler")
require("pokemon.handlers.pokemon-coordination-handler")

-- Initialize process on load
initialize()

-- Export maintenance function for external scheduling
_G.PokemonProcessMaintenance = checkMaintenance

print("[Pokemon] Pokemon process main module loaded")