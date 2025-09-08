-- Battle Process - Dedicated High-Performance Battle Engine
-- Extracted battle processing for Epic 32.3: Battle Engine Process Extraction
-- Handles battle calculations, turn resolution, and concurrent battle management

-- Core AO process identification
Name = "BattleProcess"
Owner = Owner or "process-owner"

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
            -- Basic decode fallback - returns empty table for safety
            -- More robust implementation would be needed for full JSON parsing
            return {}
        end
    }
end

-- Process metadata for discovery
local PROCESS_INFO = {
    name = "BattleProcess",
    version = "1.0.0",
    description = "Dedicated battle engine process for high-performance battle calculations",
    capabilities = {
        "BATTLE_COMMAND_PROCESSING",
        "DAMAGE_CALCULATION", 
        "MOVE_EFFECT_PROCESSING",
        "BATTLE_STATE_MANAGEMENT",
        "CONCURRENT_BATTLES",
        "BATTLE_REPLAY"
    },
    dependencies = {
        "CoordinatorProcess",
        "PokemonProcess",
        "RNGProcess"
    }
}

-- Load inter-process communication components
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator") 
local MessageRouter = require("game-logic.process-coordination.message-router")

-- Load battle-specific handlers
local BattleCommandHandler = require("battle.handlers.battle-command-handler")
local BattleStateHandler = require("battle.handlers.battle-state-handler")
local BattleCoordinationHandler = require("battle.handlers.battle-coordination-handler")
local BattleReplayHandler = require("battle.handlers.battle-replay-handler")

-- Load core battle components
local DamageCalculator = require("battle.components.damage-calculator")
local TurnProcessor = require("battle.components.turn-processor")
local MoveEffectProcessor = require("battle.components.move-effect-processor")
local BattleStateManager = require("battle.components.battle-state-manager")
local ConcurrentBattleManager = require("battle.components.concurrent-battle-manager")

-- Battle process storage
local BattleInstances = {}
local ProcessStats = {
    activeBattles = 0,
    totalBattlesProcessed = 0,
    averageLatency = 0,
    concurrentBattleCapacity = 100
}

-- Expose globals for health checks
BattleEngine = ConcurrentBattleManager
DamageCalculator = DamageCalculator
BattleRNG = require("game-logic.rng.battle-rng")

-- Initialize battle process
local function initializeBattleProcess()
    print("[BattleProcess] Initializing dedicated battle engine...")
    
    -- Initialize inter-process communication
    MessageCorrelator.initialize()
    ProcessAuthenticator.initialize()
    MessageRouter.initialize()
    
    -- Initialize battle components
    ConcurrentBattleManager.initialize(ProcessStats.concurrentBattleCapacity)
    BattleStateManager.initialize()
    
    -- Register with coordinator process for discovery
    local registrationData = {
        processInfo = PROCESS_INFO,
        processId = ao.id,
        capabilities = PROCESS_INFO.capabilities,
        maxConcurrentBattles = ProcessStats.concurrentBattleCapacity
    }
    
    print("[BattleProcess] Battle engine initialized successfully")
    return registrationData
end

-- Process authentication for incoming messages
local function authenticateMessage(msg)
    local authResult = ProcessAuthenticator.authenticate(msg)
    if not authResult.success then
        print("[BattleProcess] Authentication failed: " .. (authResult.error or "Unknown error"))
        return false, authResult.error
    end
    return true, authResult.authLevel
end

-- Handle battle process info requests (AO protocol compliance)
Handlers.add(
    "BATTLE_PROCESS_INFO",
    Handlers.utils.hasMatchingTag("Action", "Info"),
    function(msg)
        local response = {
            name = PROCESS_INFO.name,
            version = PROCESS_INFO.version,
            description = PROCESS_INFO.description,
            capabilities = PROCESS_INFO.capabilities,
            stats = ProcessStats,
            timestamp = 0
        }
        
        Handlers.utils.reply(json.encode({
            success = true,
            data = response
        }))(msg)
    end
)

-- Handle battle command processing requests
Handlers.add(
    "BATTLE_COMMAND",
    Handlers.utils.hasMatchingTag("Action", "BATTLE_COMMAND"),
    function(msg)
        -- Authenticate the message
        local authSuccess, authLevel = authenticateMessage(msg)
        if not authSuccess then
            Handlers.utils.reply(json.encode({
                success = false,
                error = "Authentication failed",
                timestamp = 0
            }))(msg)
            return
        end
        
        -- Process battle command through handler
        local response = BattleCommandHandler.process(msg)
        Handlers.utils.reply(response)(msg)
    end
)

-- Handle battle state queries
Handlers.add(
    "BATTLE_STATE_QUERY",
    Handlers.utils.hasMatchingTag("Action", "BATTLE_STATE_QUERY"),
    function(msg)
        -- Authenticate the message
        local authSuccess, authLevel = authenticateMessage(msg)
        if not authSuccess then
            Handlers.utils.reply(json.encode({
                success = false,
                error = "Authentication failed",
                timestamp = 0
            }))(msg)
            return
        end
        
        -- Process state query through handler
        local response = BattleStateHandler.process(msg)
        Handlers.utils.reply(response)(msg)
    end
)

-- Handle inter-process coordination messages
Handlers.add(
    "BATTLE_COORDINATION",
    Handlers.utils.hasMatchingTag("Action", "BATTLE_COORDINATION"),
    function(msg)
        -- Process coordination messages through handler
        local response = BattleCoordinationHandler.process(msg)
        Handlers.utils.reply(response)(msg)
    end
)

-- Handle battle replay requests
Handlers.add(
    "BATTLE_REPLAY", 
    Handlers.utils.hasMatchingTag("Action", "BATTLE_REPLAY"),
    function(msg)
        -- Authenticate the message
        local authSuccess, authLevel = authenticateMessage(msg)
        if not authSuccess then
            Handlers.utils.reply(json.encode({
                success = false,
                error = "Authentication failed",
                timestamp = 0
            }))(msg)
            return
        end
        
        -- Process replay request through handler
        local response = BattleReplayHandler.process(msg)
        Handlers.utils.reply(response)(msg)
    end
)

-- Handle process health checks
Handlers.add(
    "BATTLE_HEALTH_CHECK",
    Handlers.utils.hasMatchingTag("Action", "HEALTH_CHECK"),
    function(msg)
        local healthData = {
            processId = ao.id,
            status = "HEALTHY",
            activeBattles = ProcessStats.activeBattles,
            totalProcessed = ProcessStats.totalBattlesProcessed,
            averageLatency = ProcessStats.averageLatency,
            capacity = ProcessStats.concurrentBattleCapacity,
            timestamp = 0
        }
        
        Handlers.utils.reply(json.encode({
            success = true,
            data = healthData
        }))(msg)
    end
)

-- Initialize the battle process
initializeBattleProcess()

-- Export process components for testing
if _G.TEST_MODE then
    _G.BattleProcess = {
        DamageCalculator = DamageCalculator,
        TurnProcessor = TurnProcessor,
        MoveEffectProcessor = MoveEffectProcessor,
        BattleStateManager = BattleStateManager,
        ConcurrentBattleManager = ConcurrentBattleManager,
        ProcessStats = ProcessStats,
        PROCESS_INFO = PROCESS_INFO
    }
end

print("[BattleProcess] Battle process loaded and ready for battle command processing")