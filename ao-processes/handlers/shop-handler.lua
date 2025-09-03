--[[
Shop Handler
AO message processing for shop operations

Features:
- Purchase message handler with comprehensive validation
- Sell message handler with item validation and price calculation
- Inventory query handler for shop display and availability
- Transaction history query handler for economic tracking
- Bulk purchase message handler with quantity and limit validation
- Shop availability query handler for progression-based access
- Proper error handling and success/failure responses

Behavioral Parity Requirements:
- Never use Lua's math.random() - ALWAYS use AO crypto module
- All AO message responses must include success boolean
- All shop operations must be deterministic and reproducible
--]]

-- JSON module (optional for testing environments)
local json = nil
local success, module = pcall(require, "json")
if success then
    json = module
else
    -- Fallback JSON implementation for testing
    json = {
        encode = function(obj)
            if type(obj) == "table" then
                return "{}"
            elseif type(obj) == "string" then
                return '"' .. obj .. '"'
            else
                return tostring(obj)
            end
        end,
        decode = function(str)
            return {}
        end
    }
end

-- Load dependencies
local ShopDatabase = require("../data/items/shop-database")
local ShopManager = require("../game-logic/items/shop-manager")
local EconomicSystem = require("../game-logic/items/economic-system")
local ValidationHandler = require("./validation-handler")
local ErrorHandler = require("./error-handler")
local PlayerProgressionSystem = require("../game-logic/progression/player-progression-system")

-- Shop Handler Implementation
local ShopHandler = {}

-- Purchase item from shop
local function purchaseItem(msg)
    local startTime = os.clock()
    
    -- Extract message data
    local playerId = msg.From or msg["Owner-Id"]
    local msgData = {}
    
    if msg.Data then
        local parseSuccess, parsedData = pcall(json.decode, msg.Data)
        if parseSuccess and type(parsedData) == "table" then
            msgData = parsedData
        end
    end
    
    -- Extract parameters
    local itemId = msgData.itemId or msg.Tags and msg.Tags["Item-Id"]
    local quantity = tonumber(msgData.quantity or (msg.Tags and msg.Tags["Quantity"]) or 1)
    local waveIndex = tonumber(msgData.waveIndex or (msg.Tags and msg.Tags["Wave"]) or 1)
    
    -- Validate input parameters
    if not playerId then
        return ErrorHandler.createErrorResponse("MISSING_PLAYER_ID", "Player ID is required", msg.Id)
    end
    
    if not itemId then
        return ErrorHandler.createErrorResponse("MISSING_ITEM_ID", "Item ID is required", msg.Id)
    end
    
    if not quantity or quantity <= 0 then
        return ErrorHandler.createErrorResponse("INVALID_QUANTITY", "Quantity must be positive", msg.Id)
    end
    
    -- Validate transaction with economic system
    local basePrice = ShopDatabase.getItemBuyPrice(itemId, waveIndex)
    local totalCost = basePrice * quantity
    
    local validTransaction, validMsg = EconomicSystem.validateTransaction(playerId, totalCost, "purchase")
    if not validTransaction then
        return ErrorHandler.createErrorResponse("TRANSACTION_INVALID", validMsg, msg.Id)
    end
    
    -- Try to get player data for progression integration
    local playerData = nil
    if msgData.playerData then
        playerData = msgData.playerData
    end
    
    -- Execute purchase through shop manager with progression integration
    local success, message, purchasedQuantity
    if playerData then
        success, message, purchasedQuantity = ShopManager.purchaseItemWithProgression(
            playerId, itemId, quantity, waveIndex, playerData
        )
    else
        -- Fallback to legacy function
        success, message, purchasedQuantity = ShopManager.purchaseItem(
            playerId, itemId, quantity, waveIndex
        )
    end
    
    if success then
        -- Record transaction in economic system
        EconomicSystem.recordItemPurchase(playerId, itemId, purchasedQuantity, totalCost, waveIndex)
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = success,
        action = "PURCHASE_ITEM",
        playerId = playerId,
        itemId = itemId,
        requestedQuantity = quantity,
        purchasedQuantity = purchasedQuantity or 0,
        totalCost = totalCost,
        message = message,
        waveIndex = waveIndex,
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

-- Sell item to shop
local function sellItem(msg)
    local startTime = os.clock()
    
    -- Extract message data
    local playerId = msg.From or msg["Owner-Id"]
    local msgData = {}
    
    if msg.Data then
        local parseSuccess, parsedData = pcall(json.decode, msg.Data)
        if parseSuccess and type(parsedData) == "table" then
            msgData = parsedData
        end
    end
    
    -- Extract parameters
    local itemId = msgData.itemId or msg.Tags and msg.Tags["Item-Id"]
    local quantity = tonumber(msgData.quantity or (msg.Tags and msg.Tags["Quantity"]) or 1)
    local waveIndex = tonumber(msgData.waveIndex or (msg.Tags and msg.Tags["Wave"]) or 1)
    
    -- Validate input parameters
    if not playerId then
        return ErrorHandler.createErrorResponse("MISSING_PLAYER_ID", "Player ID is required", msg.Id)
    end
    
    if not itemId then
        return ErrorHandler.createErrorResponse("MISSING_ITEM_ID", "Item ID is required", msg.Id)
    end
    
    if not quantity or quantity <= 0 then
        return ErrorHandler.createErrorResponse("INVALID_QUANTITY", "Quantity must be positive", msg.Id)
    end
    
    -- Try to get player data for progression integration
    local playerData = nil
    if msgData.playerData then
        playerData = msgData.playerData
    end
    
    -- Execute sale through shop manager with progression integration
    local success, message, earnings
    if playerData then
        success, message, earnings = ShopManager.sellItemWithProgression(
            playerId, itemId, quantity, waveIndex, playerData
        )
    else
        -- Fallback to legacy function
        success, message, earnings = ShopManager.sellItem(
            playerId, itemId, quantity, waveIndex
        )
    end
    
    if success then
        -- Record transaction in economic system
        EconomicSystem.recordItemSale(playerId, itemId, quantity, earnings, waveIndex)
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = success,
        action = "SELL_ITEM",
        playerId = playerId,
        itemId = itemId,
        quantity = quantity,
        earnings = earnings or 0,
        message = message,
        waveIndex = waveIndex,
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

-- Bulk purchase multiple items
local function bulkPurchase(msg)
    local startTime = os.clock()
    
    -- Extract message data
    local playerId = msg.From or msg["Owner-Id"]
    local msgData = {}
    
    if msg.Data then
        local parseSuccess, parsedData = pcall(json.decode, msg.Data)
        if parseSuccess and type(parsedData) == "table" then
            msgData = parsedData
        end
    end
    
    -- Extract parameters
    local purchases = msgData.purchases or {}
    local waveIndex = tonumber(msgData.waveIndex or (msg.Tags and msg.Tags["Wave"]) or 1)
    
    -- Validate input parameters
    if not playerId then
        return ErrorHandler.createErrorResponse("MISSING_PLAYER_ID", "Player ID is required", msg.Id)
    end
    
    if type(purchases) ~= "table" or #purchases == 0 then
        return ErrorHandler.createErrorResponse("INVALID_PURCHASES", "Purchases list is required", msg.Id)
    end
    
    -- Execute bulk purchase through shop manager
    local success, message, results = ShopManager.bulkPurchase(playerId, purchases, waveIndex)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = success,
        action = "BULK_PURCHASE",
        playerId = playerId,
        purchaseCount = #purchases,
        results = results or {},
        message = message,
        waveIndex = waveIndex,
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

-- Query shop inventory
local function queryShopInventory(msg)
    local startTime = os.clock()
    
    -- Extract message data
    local playerId = msg.From or msg["Owner-Id"]
    local msgData = {}
    
    if msg.Data then
        local parseSuccess, parsedData = pcall(json.decode, msg.Data)
        if parseSuccess and type(parsedData) == "table" then
            msgData = parsedData
        end
    end
    
    -- Extract parameters
    local waveIndex = tonumber(msgData.waveIndex or (msg.Tags and msg.Tags["Wave"]) or 1)
    
    -- Validate input parameters
    if not playerId then
        return ErrorHandler.createErrorResponse("MISSING_PLAYER_ID", "Player ID is required", msg.Id)
    end
    
    -- Get shop inventory
    local inventory, message = ShopManager.getShopInventory(playerId, waveIndex)
    local success = inventory and #inventory >= 0
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = success,
        action = "QUERY_SHOP_INVENTORY",
        playerId = playerId,
        waveIndex = waveIndex,
        inventory = inventory or {},
        itemCount = inventory and #inventory or 0,
        message = message or "Shop inventory retrieved",
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

-- Query transaction history
local function queryTransactionHistory(msg)
    local startTime = os.clock()
    
    -- Extract message data
    local playerId = msg.From or msg["Owner-Id"]
    local msgData = {}
    
    if msg.Data then
        local parseSuccess, parsedData = pcall(json.decode, msg.Data)
        if parseSuccess and type(parsedData) == "table" then
            msgData = parsedData
        end
    end
    
    -- Extract parameters
    local limit = tonumber(msgData.limit or (msg.Tags and msg.Tags["Limit"]) or 50)
    
    -- Validate input parameters
    if not playerId then
        return ErrorHandler.createErrorResponse("MISSING_PLAYER_ID", "Player ID is required", msg.Id)
    end
    
    -- Get player economics and shop stats
    local playerEconomics = EconomicSystem.getPlayerEconomics(playerId)
    local shopStats = ShopManager.getShopStats(playerId)
    local accessLog = ShopManager.getAccessLog(playerId)
    
    -- Limit access log to requested amount
    local limitedLog = {}
    local startIndex = math.max(1, #accessLog - limit + 1)
    for i = startIndex, #accessLog do
        table.insert(limitedLog, accessLog[i])
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "QUERY_TRANSACTION_HISTORY",
        playerId = playerId,
        playerEconomics = playerEconomics,
        shopStats = shopStats,
        transactionHistory = limitedLog,
        limit = limit,
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

-- Query shop availability
local function queryShopAvailability(msg)
    local startTime = os.clock()
    
    -- Extract message data
    local playerId = msg.From or msg["Owner-Id"]
    local msgData = {}
    
    if msg.Data then
        local parseSuccess, parsedData = pcall(json.decode, msg.Data)
        if parseSuccess and type(parsedData) == "table" then
            msgData = parsedData
        end
    end
    
    -- Extract parameters
    local waveIndex = tonumber(msgData.waveIndex or (msg.Tags and msg.Tags["Wave"]) or 1)
    
    -- Validate input parameters
    if not playerId then
        return ErrorHandler.createErrorResponse("MISSING_PLAYER_ID", "Player ID is required", msg.Id)
    end
    
    -- Try to get player data for progression checks
    local playerData = msgData.playerData
    local shopAccessible = true
    local accessMessage = "Shop is available"
    local unlocks = {}
    
    if playerData and playerData.progression then
        -- Check progression-based shop unlock
        if not playerData.progression.unlocks or not playerData.progression.unlocks.shop then
            shopAccessible = false
            accessMessage = "Shop not unlocked yet - visit Poké Mart first"
        else
            unlocks = playerData.progression.unlocks or {}
        end
    end
    
    -- Check shop access through manager (for wave-based restrictions)
    local accessValid, accessMsg = ShopManager.validateShopAccess(playerId, waveIndex, playerData)
    if not accessValid then
        shopAccessible = false
        accessMessage = accessMsg
    end
    
    -- Check if shop should restock
    local shouldRestock = ShopManager.shouldRestock(waveIndex)
    
    -- Get available inventory if accessible
    local inventory = {}
    local shopStats = {}
    
    if shopAccessible then
        local items, inventoryMsg = ShopManager.getShopInventory(playerId, waveIndex)
        if items then
            inventory = items
        end
        
        shopStats = ShopManager.getShopStats(playerId)
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "QUERY_SHOP_AVAILABILITY",
        playerId = playerId,
        waveIndex = waveIndex,
        shopAccessible = shopAccessible,
        accessMessage = accessMessage,
        unlocks = unlocks,
        inventory = inventory,
        shopStats = shopStats,
        shouldRestock = shouldRestock,
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

-- Query item market statistics
local function queryItemMarketStats(msg)
    local startTime = os.clock()
    
    -- Extract message data
    local msgData = {}
    
    if msg.Data then
        local parseSuccess, parsedData = pcall(json.decode, msg.Data)
        if parseSuccess and type(parsedData) == "table" then
            msgData = parsedData
        end
    end
    
    -- Extract parameters
    local itemId = msgData.itemId or msg.Tags and msg.Tags["Item-Id"]
    local waveIndex = tonumber(msgData.waveIndex or (msg.Tags and msg.Tags["Wave"]) or 1)
    
    -- Validate input parameters
    if not itemId then
        return ErrorHandler.createErrorResponse("MISSING_ITEM_ID", "Item ID is required", msg.Id)
    end
    
    -- Get market statistics
    local marketStats = EconomicSystem.getItemMarketStats(itemId)
    local currentPrice = ShopDatabase.getItemBuyPrice(itemId, waveIndex)
    local dynamicPrice = EconomicSystem.calculateDynamicPrice(itemId, currentPrice, waveIndex)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "QUERY_ITEM_MARKET_STATS",
        itemId = itemId,
        waveIndex = waveIndex,
        basePrice = currentPrice,
        dynamicPrice = dynamicPrice,
        marketStats = marketStats,
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

-- Get global economic overview
local function queryGlobalEconomics(msg)
    local startTime = os.clock()
    
    -- Get global economic data
    local globalStats = EconomicSystem.getGlobalEconomics()
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "QUERY_GLOBAL_ECONOMICS",
        globalEconomics = globalStats,
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end


-- Validate shop system
local function validateShopSystem(msg)
    local startTime = os.clock()
    
    local validationResults = {}
    
    -- Validate shop manager
    local shopValid, shopErrors = ShopManager.validateShopState("system_validation")
    validationResults.shopManager = {
        valid = shopValid,
        errors = shopErrors or {}
    }
    
    -- Test basic shop operations
    local testResults = {
        priceCalculation = false,
        inventoryAccess = false,
        economicValidation = false
    }
    
    -- Test price calculation
    local testPrice = ShopDatabase.getItemBuyPrice("POTION", 10)
    if testPrice and testPrice > 0 then
        testResults.priceCalculation = true
    end
    
    -- Test inventory access
    local testInventory = ShopDatabase.getAvailableItems(5)
    if testInventory and type(testInventory) == "table" then
        testResults.inventoryAccess = true
    end
    
    -- Test economic system
    local testEconomics = EconomicSystem.getGlobalEconomics()
    if testEconomics and testEconomics.marketStability then
        testResults.economicValidation = true
    end
    
    local allValid = shopValid and testResults.priceCalculation and 
                     testResults.inventoryAccess and testResults.economicValidation
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = allValid,
        action = "VALIDATE_SHOP_SYSTEM",
        validationResults = validationResults,
        testResults = testResults,
        systemValid = allValid,
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

-- Register AO Message Handlers
if Handlers then
    Handlers.add(
        "PURCHASE_ITEM",
        Handlers.utils.hasMatchingTag("Action", "PURCHASE_ITEM"),
        function(msg)
            local response = purchaseItem(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
    
    Handlers.add(
        "SELL_ITEM",
        Handlers.utils.hasMatchingTag("Action", "SELL_ITEM"),
        function(msg)
            local response = sellItem(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
    
    Handlers.add(
        "BULK_PURCHASE",
        Handlers.utils.hasMatchingTag("Action", "BULK_PURCHASE"),
        function(msg)
            local response = bulkPurchase(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
    
    Handlers.add(
        "QUERY_SHOP_INVENTORY",
        Handlers.utils.hasMatchingTag("Action", "QUERY_SHOP_INVENTORY"),
        function(msg)
            local response = queryShopInventory(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
    
    Handlers.add(
        "QUERY_TRANSACTION_HISTORY",
        Handlers.utils.hasMatchingTag("Action", "QUERY_TRANSACTION_HISTORY"),
        function(msg)
            local response = queryTransactionHistory(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
    
    Handlers.add(
        "QUERY_SHOP_AVAILABILITY",
        Handlers.utils.hasMatchingTag("Action", "QUERY_SHOP_AVAILABILITY"),
        function(msg)
            local response = queryShopAvailability(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
    
    Handlers.add(
        "QUERY_ITEM_MARKET_STATS",
        Handlers.utils.hasMatchingTag("Action", "QUERY_ITEM_MARKET_STATS"),
        function(msg)
            local response = queryItemMarketStats(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
    
    Handlers.add(
        "QUERY_GLOBAL_ECONOMICS",
        Handlers.utils.hasMatchingTag("Action", "QUERY_GLOBAL_ECONOMICS"),
        function(msg)
            local response = queryGlobalEconomics(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
    
    Handlers.add(
        "VALIDATE_SHOP_SYSTEM",
        Handlers.utils.hasMatchingTag("Action", "VALIDATE_SHOP_SYSTEM"),
        function(msg)
            local response = validateShopSystem(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
end

return ShopHandler