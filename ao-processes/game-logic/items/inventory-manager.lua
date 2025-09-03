--[[
Inventory Management System
Manages player item collections with transaction logging and persistence

Features:
- Item acquisition and removal with validation
- Consumable item tracking and automatic removal
- Stack management with quantity limits
- Inventory capacity and organization
- Transaction logging for audit trail
- Save/load persistence integration
- Inventory validation and consistency checking

Usage:
- addItem(playerId, itemId, quantity)
- removeItem(playerId, itemId, quantity) 
- getInventory(playerId)
- validateInventory(playerId)
--]]

local InventoryManager = {}

-- Dependencies
local ItemDatabase = require('data.items.item-database')
local BerryDatabase = require('data.items.berry-database')

-- Inventory constants
local INVENTORY_CONSTANTS = {
    DEFAULT_CAPACITY = 999, -- Maximum unique items
    MAX_STACK_DEFAULT = 99, -- Default stack size
    TRANSACTION_LOG_LIMIT = 1000 -- Maximum transaction history entries
}

-- Transaction types
local TransactionType = {
    ADD = "add",
    REMOVE = "remove", 
    USE = "use",
    GIVE = "give",
    RECEIVE = "receive",
    SELL = "sell",
    BUY = "buy",
    BERRY_CONSUME = "berry_consume",
    BERRY_RECYCLE = "berry_recycle"
}

-- Manager state
local managerInitialized = false
local playerInventories = {} -- playerId -> inventory data
local transactionLogs = {} -- playerId -> transaction history

-- Initialize manager
function InventoryManager.init()
    if managerInitialized then
        return
    end
    
    ItemDatabase.init()
    managerInitialized = true
end

-- Initialize player inventory
-- @param playerId: Player identifier
-- @return: Inventory data structure
local function initializePlayerInventory(playerId)
    if not playerInventories[playerId] then
        playerInventories[playerId] = {
            items = {}, -- itemId -> {quantity, lastUpdated}
            capacity = INVENTORY_CONSTANTS.DEFAULT_CAPACITY,
            totalItems = 0,
            money = 0,
            lastModified = os.time and os.time() or 0,
            version = 1
        }
        
        transactionLogs[playerId] = {}
    end
    
    return playerInventories[playerId]
end

-- Log transaction
-- @param playerId: Player identifier
-- @param transactionType: Type of transaction
-- @param itemId: Item involved in transaction
-- @param quantity: Quantity involved
-- @param reason: Optional reason for transaction
local function logTransaction(playerId, transactionType, itemId, quantity, reason)
    if not transactionLogs[playerId] then
        transactionLogs[playerId] = {}
    end
    
    local transaction = {
        timestamp = os.time and os.time() or 0,
        type = transactionType,
        itemId = itemId,
        quantity = quantity,
        reason = reason or "No reason provided",
        balanceAfter = nil -- Will be set after transaction
    }
    
    table.insert(transactionLogs[playerId], transaction)
    
    -- Limit transaction log size
    if #transactionLogs[playerId] > INVENTORY_CONSTANTS.TRANSACTION_LOG_LIMIT then
        table.remove(transactionLogs[playerId], 1) -- Remove oldest entry
    end
    
    return transaction
end

-- Add item to player inventory
-- @param playerId: Player identifier
-- @param itemId: Item to add
-- @param quantity: Quantity to add (default 1)
-- @param reason: Optional reason for addition
-- @return: Boolean success, error message, final quantity
function InventoryManager.addItem(playerId, itemId, quantity, reason)
    InventoryManager.init()
    
    quantity = quantity or 1
    
    if quantity <= 0 then
        return false, "Invalid quantity", 0
    end
    
    -- Get item data for validation
    local itemData = ItemDatabase.getItem(itemId)
    if not itemData then
        return false, "Item not found: " .. tostring(itemId), 0
    end
    
    -- Initialize player inventory
    local inventory = initializePlayerInventory(playerId)
    
    -- Check if item is stackable
    local maxStack = ItemDatabase.getMaxStack(itemId)
    local currentQuantity = 0
    
    if inventory.items[itemId] then
        currentQuantity = inventory.items[itemId].quantity
    end
    
    -- Check stack limit
    if itemData.stackable then
        local newQuantity = currentQuantity + quantity
        if newQuantity > maxStack then
            local canAdd = maxStack - currentQuantity
            if canAdd <= 0 then
                return false, "Item stack full (max: " .. maxStack .. ")", currentQuantity
            end
            quantity = canAdd
        end
    else
        -- Non-stackable items
        if currentQuantity >= 1 then
            return false, "Item not stackable", currentQuantity
        end
        quantity = 1
    end
    
    -- Check inventory capacity (for new items)
    if not inventory.items[itemId] then
        local uniqueItemCount = 0
        for _ in pairs(inventory.items) do
            uniqueItemCount = uniqueItemCount + 1
        end
        
        if uniqueItemCount >= inventory.capacity then
            return false, "Inventory full (capacity: " .. inventory.capacity .. ")", 0
        end
    end
    
    -- Add item to inventory
    if inventory.items[itemId] then
        inventory.items[itemId].quantity = currentQuantity + quantity
        inventory.items[itemId].lastUpdated = os.time()
    else
        inventory.items[itemId] = {
            quantity = quantity,
            lastUpdated = os.time(),
            firstObtained = os.time()
        }
        inventory.totalItems = inventory.totalItems + 1
    end
    
    inventory.lastModified = os.time()
    
    -- Log transaction
    local transaction = logTransaction(playerId, TransactionType.ADD, itemId, quantity, reason)
    transaction.balanceAfter = inventory.items[itemId].quantity
    
    return true, "Item added successfully", inventory.items[itemId].quantity
end

-- Remove item from player inventory
-- @param playerId: Player identifier
-- @param itemId: Item to remove
-- @param quantity: Quantity to remove (default 1)
-- @param reason: Optional reason for removal
-- @return: Boolean success, error message, remaining quantity
function InventoryManager.removeItem(playerId, itemId, quantity, reason)
    InventoryManager.init()
    
    quantity = quantity or 1
    
    if quantity <= 0 then
        return false, "Invalid quantity", 0
    end
    
    -- Get player inventory
    local inventory = playerInventories[playerId]
    if not inventory or not inventory.items[itemId] then
        return false, "Item not found in inventory", 0
    end
    
    local currentQuantity = inventory.items[itemId].quantity
    
    if currentQuantity < quantity then
        return false, "Insufficient quantity (have: " .. currentQuantity .. ", need: " .. quantity .. ")", currentQuantity
    end
    
    -- Remove item quantity
    local newQuantity = currentQuantity - quantity
    
    if newQuantity > 0 then
        inventory.items[itemId].quantity = newQuantity
        inventory.items[itemId].lastUpdated = os.time()
    else
        -- Remove item entirely if quantity reaches 0
        inventory.items[itemId] = nil
        inventory.totalItems = inventory.totalItems - 1
    end
    
    inventory.lastModified = os.time()
    
    -- Log transaction
    local transaction = logTransaction(playerId, TransactionType.REMOVE, itemId, quantity, reason)
    transaction.balanceAfter = newQuantity
    
    return true, "Item removed successfully", newQuantity
end

-- Use consumable item (removes from inventory after use)
-- @param playerId: Player identifier
-- @param itemId: Item to use
-- @param quantity: Quantity to use (default 1)
-- @param reason: Optional reason for usage
-- @return: Boolean success, error message, remaining quantity
function InventoryManager.useItem(playerId, itemId, quantity, reason)
    InventoryManager.init()
    
    -- Check if item is consumable
    if not ItemDatabase.isConsumable(itemId) then
        return false, "Item is not consumable", 0
    end
    
    -- Remove item from inventory with USE transaction type
    local success, message, remaining = InventoryManager.removeItem(playerId, itemId, quantity, reason or "Item used")
    
    if success then
        -- Update transaction type in log
        local lastTransaction = transactionLogs[playerId][#transactionLogs[playerId]]
        if lastTransaction then
            lastTransaction.type = TransactionType.USE
        end
    end
    
    return success, message, remaining
end

-- Get item quantity in inventory
-- @param playerId: Player identifier
-- @param itemId: Item to check
-- @return: Quantity owned (0 if not found)
function InventoryManager.getItemQuantity(playerId, itemId)
    InventoryManager.init()
    
    local inventory = playerInventories[playerId]
    if not inventory or not inventory.items[itemId] then
        return 0
    end
    
    return inventory.items[itemId].quantity
end

-- Check if player has sufficient quantity of item
-- @param playerId: Player identifier
-- @param itemId: Item to check
-- @param requiredQuantity: Required quantity (default 1)
-- @return: Boolean has sufficient quantity
function InventoryManager.hasItem(playerId, itemId, requiredQuantity)
    requiredQuantity = requiredQuantity or 1
    return InventoryManager.getItemQuantity(playerId, itemId) >= requiredQuantity
end

-- Get complete player inventory
-- @param playerId: Player identifier
-- @return: Inventory data structure
function InventoryManager.getInventory(playerId)
    InventoryManager.init()
    
    local inventory = playerInventories[playerId]
    if not inventory then
        return initializePlayerInventory(playerId)
    end
    
    return inventory
end

-- Get items by category
-- @param playerId: Player identifier
-- @param category: Item category filter (optional)
-- @return: Array of {itemId, itemData, quantity}
function InventoryManager.getItemsByCategory(playerId, category)
    InventoryManager.init()
    
    local inventory = playerInventories[playerId]
    if not inventory then
        return {}
    end
    
    local categorizedItems = {}
    
    for itemId, inventoryData in pairs(inventory.items) do
        local itemData = ItemDatabase.getItem(itemId)
        if itemData then
            if not category or itemData.category == category then
                table.insert(categorizedItems, {
                    itemId = itemId,
                    itemData = itemData,
                    quantity = inventoryData.quantity,
                    lastUpdated = inventoryData.lastUpdated
                })
            end
        end
    end
    
    -- Sort by category priority and name
    table.sort(categorizedItems, function(a, b)
        if a.itemData.category ~= b.itemData.category then
            return (a.itemData.category or "") < (b.itemData.category or "")
        end
        return (a.itemData.name or "") < (b.itemData.name or "")
    end)
    
    return categorizedItems
end

-- Get transaction history
-- @param playerId: Player identifier
-- @param limit: Optional limit on number of transactions (default all)
-- @return: Array of transaction records
function InventoryManager.getTransactionHistory(playerId, limit)
    InventoryManager.init()
    
    local transactions = transactionLogs[playerId] or {}
    
    if limit and limit > 0 and limit < #transactions then
        -- Return most recent transactions
        local recent = {}
        for i = #transactions - limit + 1, #transactions do
            table.insert(recent, transactions[i])
        end
        return recent
    end
    
    return transactions
end

-- Validate inventory integrity
-- @param playerId: Player identifier
-- @return: Boolean valid, array of error messages
function InventoryManager.validateInventory(playerId)
    InventoryManager.init()
    
    local inventory = playerInventories[playerId]
    if not inventory then
        return true, {} -- Empty inventory is valid
    end
    
    local errors = {}
    local totalItems = 0
    
    for itemId, inventoryData in pairs(inventory.items) do
        -- Check item exists in database
        local itemData = ItemDatabase.getItem(itemId)
        if not itemData then
            table.insert(errors, "Invalid item in inventory: " .. tostring(itemId))
        else
            -- Check quantity limits
            local maxStack = ItemDatabase.getMaxStack(itemId)
            if inventoryData.quantity > maxStack then
                table.insert(errors, string.format("Item %s exceeds max stack (%d > %d)", itemId, inventoryData.quantity, maxStack))
            end
            
            -- Check non-stackable items
            if not itemData.stackable and inventoryData.quantity > 1 then
                table.insert(errors, string.format("Non-stackable item %s has quantity > 1", itemId))
            end
        end
        
        -- Check quantity is positive
        if inventoryData.quantity <= 0 then
            table.insert(errors, string.format("Item %s has invalid quantity: %d", itemId, inventoryData.quantity))
        end
        
        totalItems = totalItems + 1
    end
    
    -- Check capacity limits
    if totalItems > inventory.capacity then
        table.insert(errors, string.format("Inventory exceeds capacity (%d > %d)", totalItems, inventory.capacity))
    end
    
    -- Update total items count
    inventory.totalItems = totalItems
    
    return #errors == 0, errors
end

-- Clear all items from inventory (admin function)
-- @param playerId: Player identifier
-- @param reason: Reason for clearing
-- @return: Boolean success, number of items cleared
function InventoryManager.clearInventory(playerId, reason)
    InventoryManager.init()
    
    local inventory = playerInventories[playerId]
    if not inventory then
        return true, 0
    end
    
    local itemsCleared = 0
    
    for itemId, inventoryData in pairs(inventory.items) do
        logTransaction(playerId, TransactionType.REMOVE, itemId, inventoryData.quantity, reason or "Inventory cleared")
        itemsCleared = itemsCleared + 1
    end
    
    -- Reset inventory
    inventory.items = {}
    inventory.totalItems = 0
    inventory.lastModified = os.time()
    
    return true, itemsCleared
end

-- Set inventory capacity
-- @param playerId: Player identifier
-- @param newCapacity: New capacity limit
-- @return: Boolean success, error message
function InventoryManager.setCapacity(playerId, newCapacity)
    InventoryManager.init()
    
    if newCapacity <= 0 then
        return false, "Invalid capacity"
    end
    
    local inventory = initializePlayerInventory(playerId)
    
    -- Check if current items exceed new capacity
    if inventory.totalItems > newCapacity then
        return false, string.format("Cannot reduce capacity below current item count (%d items)", inventory.totalItems)
    end
    
    inventory.capacity = newCapacity
    inventory.lastModified = os.time()
    
    return true, "Capacity updated"
end

-- Get inventory statistics
-- @param playerId: Player identifier
-- @return: Statistics data structure
function InventoryManager.getInventoryStats(playerId)
    InventoryManager.init()
    
    local inventory = playerInventories[playerId]
    if not inventory then
        return {
            totalItems = 0,
            capacity = INVENTORY_CONSTANTS.DEFAULT_CAPACITY,
            capacityUsed = 0,
            categoryCounts = {},
            totalValue = 0,
            lastModified = 0
        }
    end
    
    local stats = {
        totalItems = inventory.totalItems,
        capacity = inventory.capacity,
        capacityUsed = math.floor((inventory.totalItems / inventory.capacity) * 100),
        categoryCounts = {},
        totalValue = 0,
        lastModified = inventory.lastModified
    }
    
    for itemId, inventoryData in pairs(inventory.items) do
        local itemData = ItemDatabase.getItem(itemId)
        if itemData then
            -- Count by category
            local category = itemData.category or "unknown"
            stats.categoryCounts[category] = (stats.categoryCounts[category] or 0) + 1
            
            -- Calculate value
            if itemData.cost then
                stats.totalValue = stats.totalValue + (itemData.cost * inventoryData.quantity)
            end
        end
    end
    
    return stats
end

-- Serialize inventory for save data
-- @param playerId: Player identifier
-- @return: Serialized inventory data
function InventoryManager.serializeInventory(playerId)
    InventoryManager.init()
    
    local inventory = playerInventories[playerId]
    if not inventory then
        return {}
    end
    
    return {
        items = inventory.items,
        capacity = inventory.capacity,
        totalItems = inventory.totalItems,
        money = inventory.money,
        lastModified = inventory.lastModified,
        version = inventory.version
    }
end

-- Deserialize inventory from save data
-- @param playerId: Player identifier
-- @param saveData: Serialized inventory data
-- @return: Boolean success, error message
function InventoryManager.deserializeInventory(playerId, saveData)
    InventoryManager.init()
    
    if not saveData then
        return false, "No save data provided"
    end
    
    -- Validate save data structure
    if type(saveData.items) ~= "table" then
        return false, "Invalid save data: items must be table"
    end
    
    playerInventories[playerId] = {
        items = saveData.items or {},
        capacity = saveData.capacity or INVENTORY_CONSTANTS.DEFAULT_CAPACITY,
        totalItems = saveData.totalItems or 0,
        money = saveData.money or 0,
        lastModified = saveData.lastModified or os.time(),
        version = saveData.version or 1
    }
    
    -- Initialize transaction log if not exists
    if not transactionLogs[playerId] then
        transactionLogs[playerId] = {}
    end
    
    -- Validate loaded inventory
    local valid, errors = InventoryManager.validateInventory(playerId)
    if not valid then
        return false, "Loaded inventory validation failed: " .. table.concat(errors, ", ")
    end
    
    return true, "Inventory loaded successfully"
end

-- Berry-specific inventory functions

--[[
Track berry consumption for recycling purposes
@param playerId Player identifier
@param berryId Berry that was consumed
@param pokemonId Pokemon that consumed the berry
@param battleId Battle where consumption occurred
@return Boolean success, error message
--]]
function InventoryManager.trackBerryConsumption(playerId, berryId, pokemonId, battleId)
    InventoryManager.init()
    
    if not playerId or not berryId then
        return false, "Invalid parameters for berry consumption tracking"
    end
    
    -- Validate berry exists
    local berry = BerryDatabase.getBerry(berryId)
    if not berry then
        return false, "Berry not found in database: " .. berryId
    end
    
    -- Log consumption transaction
    local transaction = {
        type = TransactionType.BERRY_CONSUME,
        itemId = berryId,
        quantity = 1,
        pokemonId = pokemonId,
        battleId = battleId,
        timestamp = os.time(),
        metadata = {
            berry_name = berry.name,
            effect_type = berry.effect.type,
            consumable = berry.consumable
        }
    }
    
    InventoryManager.logTransaction(playerId, transaction)
    
    return true, "Berry consumption tracked successfully"
end

--[[
Track berry recycling when berries are restored
@param playerId Player identifier
@param berryId Berry that was recycled
@param pokemonId Pokemon that received recycled berry
@param recycleMethod How berry was recycled (move/ability)
@return Boolean success, error message
--]]
function InventoryManager.trackBerryRecycling(playerId, berryId, pokemonId, recycleMethod)
    InventoryManager.init()
    
    if not playerId or not berryId then
        return false, "Invalid parameters for berry recycling tracking"
    end
    
    -- Validate berry exists
    local berry = BerryDatabase.getBerry(berryId)
    if not berry then
        return false, "Berry not found in database: " .. berryId
    end
    
    -- Log recycling transaction
    local transaction = {
        type = TransactionType.BERRY_RECYCLE,
        itemId = berryId,
        quantity = 1,
        pokemonId = pokemonId,
        timestamp = os.time(),
        metadata = {
            berry_name = berry.name,
            recycle_method = recycleMethod,
            effect_type = berry.effect.type
        }
    }
    
    InventoryManager.logTransaction(playerId, transaction)
    
    return true, "Berry recycling tracked successfully"
end

--[[
Get berry inventory statistics
@param playerId Player identifier
@return Berry statistics table
--]]
function InventoryManager.getBerryStats(playerId)
    InventoryManager.init()
    
    local inventory = playerInventories[playerId]
    if not inventory then
        return {
            totalBerries = 0,
            berryTypes = 0,
            berryCategories = {}
        }
    end
    
    local stats = {
        totalBerries = 0,
        berryTypes = 0,
        berryCategories = {}
    }
    
    for itemId, inventoryData in pairs(inventory.items) do
        if BerryDatabase.isBerry(itemId) then
            local berry = BerryDatabase.getBerry(itemId)
            if berry then
                stats.totalBerries = stats.totalBerries + inventoryData.quantity
                stats.berryTypes = stats.berryTypes + 1
                
                local category = berry.category
                if not stats.berryCategories[category] then
                    stats.berryCategories[category] = {
                        count = 0,
                        berries = {}
                    }
                end
                
                stats.berryCategories[category].count = stats.berryCategories[category].count + inventoryData.quantity
                table.insert(stats.berryCategories[category].berries, {
                    id = itemId,
                    name = berry.name,
                    quantity = inventoryData.quantity
                })
            end
        end
    end
    
    return stats
end

--[[
Get berries available for a specific activation condition
@param playerId Player identifier
@param activationCondition Berry activation condition to filter by
@return List of matching berries
--]]
function InventoryManager.getBerriesByActivation(playerId, activationCondition)
    InventoryManager.init()
    
    local inventory = playerInventories[playerId]
    if not inventory then
        return {}
    end
    
    local matchingBerries = {}
    
    for itemId, inventoryData in pairs(inventory.items) do
        if BerryDatabase.isBerry(itemId) then
            local berry = BerryDatabase.getBerry(itemId)
            if berry and berry.activationCondition == activationCondition then
                table.insert(matchingBerries, {
                    id = itemId,
                    name = berry.name,
                    quantity = inventoryData.quantity,
                    effect = berry.effect,
                    consumable = berry.consumable
                })
            end
        end
    end
    
    return matchingBerries
end

-- Export constants
InventoryManager.TransactionType = TransactionType
InventoryManager.INVENTORY_CONSTANTS = INVENTORY_CONSTANTS

return InventoryManager