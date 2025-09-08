-- Economic Process - Dedicated Shop and Berry System Management
-- Extracted economic processing for Epic 32.5: Economy & Shop Process Separation
-- Handles shop transactions, berry systems, and item management operations

-- Core AO process identification
Name = "EconomicProcess"
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

-- Process metadata for discovery
local PROCESS_INFO = {
    name = "EconomicProcess",
    version = "1.0.0",
    description = "Dedicated economic process for shop transactions, berry systems, and item management",
    capabilities = {
        "SHOP_TRANSACTION_PROCESSING",
        "BERRY_ACTIVATION_MANAGEMENT", 
        "ITEM_MANAGEMENT_OPERATIONS",
        "ECONOMIC_VALIDATION",
        "TRANSACTION_AUDIT_LOGGING",
        "INVENTORY_SYNCHRONIZATION"
    },
    dependencies = {
        "CoordinatorProcess",
        "PokemonProcess"
    }
}

-- Load inter-process communication components
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator") 
local MessageRouter = require("game-logic.process-coordination.message-router")

-- Load economic-specific handlers
local ShopTransactionHandler = require("economy.handlers.shop-transaction-handler")
local ItemManagementHandler = require("economy.handlers.item-management-handler")
local BerryActivationHandler = require("economy.handlers.berry-activation-handler")
local EconomicAuditHandler = require("economy.handlers.economic-audit-handler")

-- Load core economic components
local ShopManager = require("economy.components.shop-manager")
local InventoryManager = require("economy.components.inventory-manager")
local BerryEffectsProcessor = require("economy.components.berry-effects-processor")
local BerryActivationManager = require("economy.components.berry-activation-manager")
local EconomicSystem = require("economy.components.economic-system")
local TransactionAuditSystem = require("economy.components.transaction-audit-system")

-- Economic process storage
local EconomicTransactions = {}
local ProcessStats = {
    activeTransactions = 0,
    totalTransactionsProcessed = 0,
    averageLatency = 0,
    concurrentTransactionCapacity = 200,
    shopTransactions = 0,
    berryActivations = 0,
    itemOperations = 0,
    auditEvents = 0
}

-- Expose globals for health checks
ShopManager = ShopManager
InventoryManager = InventoryManager

-- Initialize economic process
local function initializeEconomicProcess()
    print("[EconomicProcess] Initializing dedicated economic engine...")
    
    -- Initialize inter-process communication
    MessageCorrelator.initialize()
    ProcessAuthenticator.initialize()
    MessageRouter.initialize()
    
    -- Initialize economic components
    ShopManager.init()
    InventoryManager.init()
    BerryEffectsProcessor.init()
    BerryActivationManager.init()
    EconomicSystem.init()
    TransactionAuditSystem.init()
    
    -- Register with coordinator process for discovery
    local registrationData = {
        processInfo = PROCESS_INFO,
        processId = ao.id,
        capabilities = PROCESS_INFO.capabilities,
        maxConcurrentTransactions = ProcessStats.concurrentTransactionCapacity
    }
    
    print("[EconomicProcess] Economic engine initialized successfully")
    return registrationData
end

-- Process authentication for incoming messages
local function authenticateMessage(msg)
    local authResult = ProcessAuthenticator.authenticate(msg)
    if not authResult.success then
        print("[EconomicProcess] Authentication failed: " .. (authResult.error or "Unknown error"))
        return false, authResult.error
    end
    return true, authResult.authLevel
end

-- Handle economic process info requests (AO protocol compliance)
Handlers.add(
    "ECONOMIC_PROCESS_INFO",
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

-- Handle shop transaction processing requests
Handlers.add(
    "SHOP_TRANSACTION",
    Handlers.utils.hasMatchingTag("Action", "SHOP_TRANSACTION"),
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
        
        -- Process shop transaction through handler
        local response = ShopTransactionHandler.process(msg)
        ProcessStats.shopTransactions = ProcessStats.shopTransactions + 1
        Handlers.utils.reply(response)(msg)
    end
)

-- Handle item management operations
Handlers.add(
    "ITEM_MANAGEMENT",
    Handlers.utils.hasMatchingTag("Action", "ITEM_MANAGEMENT"),
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
        
        -- Process item management through handler
        local response = ItemManagementHandler.process(msg)
        ProcessStats.itemOperations = ProcessStats.itemOperations + 1
        Handlers.utils.reply(response)(msg)
    end
)

-- Handle berry activation requests
Handlers.add(
    "BERRY_ACTIVATION",
    Handlers.utils.hasMatchingTag("Action", "BERRY_ACTIVATION"),
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
        
        -- Process berry activation through handler
        local response = BerryActivationHandler.process(msg)
        ProcessStats.berryActivations = ProcessStats.berryActivations + 1
        Handlers.utils.reply(response)(msg)
    end
)

-- Handle economic audit requests
Handlers.add(
    "ECONOMIC_AUDIT",
    Handlers.utils.hasMatchingTag("Action", "ECONOMIC_AUDIT"),
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
        
        -- Process audit request through handler
        local response = EconomicAuditHandler.process(msg)
        ProcessStats.auditEvents = ProcessStats.auditEvents + 1
        Handlers.utils.reply(response)(msg)
    end
)

-- Handle inter-process economic coordination
Handlers.add(
    "ECONOMIC_COORDINATION",
    Handlers.utils.hasMatchingTag("Action", "ECONOMIC_COORDINATION"),
    function(msg)
        -- Process coordination messages through message router
        local response = MessageRouter.route(msg)
        Handlers.utils.reply(response)(msg)
    end
)

-- Handle process health checks
Handlers.add(
    "ECONOMIC_HEALTH_CHECK",
    Handlers.utils.hasMatchingTag("Action", "HEALTH_CHECK"),
    function(msg)
        local healthData = {
            processId = ao.id,
            status = "HEALTHY",
            activeTransactions = ProcessStats.activeTransactions,
            totalProcessed = ProcessStats.totalTransactionsProcessed,
            averageLatency = ProcessStats.averageLatency,
            capacity = ProcessStats.concurrentTransactionCapacity,
            shopTransactions = ProcessStats.shopTransactions,
            berryActivations = ProcessStats.berryActivations,
            itemOperations = ProcessStats.itemOperations,
            auditEvents = ProcessStats.auditEvents,
            timestamp = 0
        }
        
        Handlers.utils.reply(json.encode({
            success = true,
            data = healthData
        }))(msg)
    end
)

-- Initialize the economic process
initializeEconomicProcess()

-- Export process components for testing
if _G.TEST_MODE then
    _G.EconomicProcess = {
        ShopManager = ShopManager,
        InventoryManager = InventoryManager,
        BerryEffectsProcessor = BerryEffectsProcessor,
        BerryActivationManager = BerryActivationManager,
        EconomicSystem = EconomicSystem,
        TransactionAuditSystem = TransactionAuditSystem,
        ProcessStats = ProcessStats,
        PROCESS_INFO = PROCESS_INFO
    }
end

print("[EconomicProcess] Economic process loaded and ready for transaction processing")