--[[
Core Shop Manager
Manages shop operations and state including purchases, sales, and inventory management

Features:
- Item purchase functionality with money validation and inventory limits
- Item selling system with proper price calculation and inventory management  
- Bulk purchasing system with quantity selection and validation
- Shop inventory management and restocking mechanics
- Transaction validation preventing purchases exceeding available funds
- Inventory space validation for purchase operations
- Shop access restrictions based on game state

Integration:
- Uses ShopDatabase for pricing and availability
- Uses InventoryManager for item and money management
- Follows AO crypto module standards for deterministic operations
--]]

local ShopManager = {}

-- Dependencies  
local ShopDatabase = require('data.items.shop-database')
local InventoryManager = require('economy.components.inventory-manager')
local PlayerProgressionSystem = require('game-logic.progression.player-progression-system')

-- Shop constants
local SHOP_CONSTANTS = {
    MAX_PURCHASE_QUANTITY = 99,     -- Maximum items in single purchase
    MIN_PURCHASE_QUANTITY = 1,      -- Minimum items in single purchase
    SHOP_ACCESS_COOLDOWN = 0,       -- Cooldown between shop accesses (waves)
    BULK_DISCOUNT_THRESHOLD = 10,   -- Quantity threshold for bulk discounts
    BULK_DISCOUNT_RATE = 0.95       -- 5% discount for bulk purchases
}

-- Shop state management
local shopManagerInitialized = false
local playerShopState = {} -- playerId -> shop state data
local shopAccessLog = {} -- playerId -> access history

-- Initialize shop manager
function ShopManager.init()
    if shopManagerInitialized then
        return
    end
    
    -- ShopDatabase.init() -- ShopDatabase doesn't have init function
    InventoryManager.init()
    shopManagerInitialized = true
end

-- Initialize player shop state
local function initializePlayerShopState(playerId)
    if not playerShopState[playerId] then
        playerShopState[playerId] = {
            lastShopWave = 0,
            totalPurchases = 0,
            totalSales = 0,
            lifetimeSpent = 0,
            lifetimeEarned = 0,
            shopLevel = 1, -- Affects available items and discounts
            lastAccessWave = 0
        }
        
        shopAccessLog[playerId] = {}
    end
    
    return playerShopState[playerId]
end

-- Log shop access
local function logShopAccess(playerId, waveIndex, action, details)
    if not shopAccessLog[playerId] then
        shopAccessLog[playerId] = {}
    end
    
    local accessEntry = {
        timestamp = os.time and 0 or 0,
        wave = waveIndex,
        action = action,
        details = details or {}
    }
    
    table.insert(shopAccessLog[playerId], accessEntry)
    
    -- Limit log size
    if #shopAccessLog[playerId] > 100 then
        table.remove(shopAccessLog[playerId], 1)
    end
end

-- Validate shop access with progression system integration
function ShopManager.validateShopAccess(playerId, waveIndex, playerData)
    ShopManager.init()
    
    if not playerId or not waveIndex then
        return false, "Invalid parameters for shop access validation"
    end
    
    -- Boss waves have no shop
    if waveIndex % 10 == 0 then
        return false, "Shop is closed during boss waves"
    end
    
    -- Check progression-based shop unlock if playerData is provided
    if playerData and playerData.progression then
        if not playerData.progression.unlocks or not playerData.progression.unlocks.shop then
            return false, "Shop not unlocked yet - visit Poké Mart first"
        end
    end
    
    -- Initialize player state
    local shopState = initializePlayerShopState(playerId)
    
    -- Check cooldown (if any future restrictions needed)
    local wavesSinceLastAccess = waveIndex - shopState.lastAccessWave
    if wavesSinceLastAccess < SHOP_CONSTANTS.SHOP_ACCESS_COOLDOWN then
        return false, "Shop access on cooldown"
    end
    
    -- Update last access
    shopState.lastAccessWave = waveIndex
    
    return true, "Shop access granted"
end

-- Get available shop items for player
function ShopManager.getShopInventory(playerId, waveIndex)
    ShopManager.init()
    
    local accessValid, accessMsg = ShopManager.validateShopAccess(playerId, waveIndex)
    if not accessValid then
        return {}, accessMsg
    end
    
    -- Get base items from database
    local availableItems = ShopDatabase.getAvailableItems(waveIndex)
    
    -- Log shop access
    logShopAccess(playerId, waveIndex, "view_inventory", {
        itemCount = #availableItems
    })
    
    return availableItems, "Shop inventory retrieved"
end

-- Purchase item from shop with integrated progression system
function ShopManager.purchaseItemWithProgression(playerId, itemId, quantity, waveIndex, playerData)
    ShopManager.init()
    
    quantity = quantity or 1
    
    -- Validate basic parameters
    if not playerId or not itemId or not waveIndex then
        return false, "Invalid parameters for item purchase", 0
    end
    
    if quantity < SHOP_CONSTANTS.MIN_PURCHASE_QUANTITY or 
       quantity > SHOP_CONSTANTS.MAX_PURCHASE_QUANTITY then
        return false, "Invalid purchase quantity", 0
    end
    
    -- Validate shop access with progression data
    local accessValid, accessMsg = ShopManager.validateShopAccess(playerId, waveIndex, playerData)
    if not accessValid then
        return false, accessMsg, 0
    end
    
    -- Check item availability  
    local available, availMsg = ShopDatabase.isItemAvailable(itemId, waveIndex)
    if not available then
        return false, availMsg, 0
    end
    
    -- Get item price
    local unitPrice = ShopDatabase.getItemBuyPrice(itemId, waveIndex)
    if unitPrice <= 0 then
        return false, "Item price unavailable", 0
    end
    
    -- Calculate total cost with potential bulk discount
    local totalCost = unitPrice * quantity
    if quantity >= SHOP_CONSTANTS.BULK_DISCOUNT_THRESHOLD then
        totalCost = math.floor(totalCost * SHOP_CONSTANTS.BULK_DISCOUNT_RATE)
    end
    
    -- Use progression system for money management if available
    local moneyResult = false
    local newBalance = 0
    local moneyMsg = ""
    
    if playerData and playerData.money then
        -- Use PlayerProgressionSystem for proper money management
        moneyResult, newBalance, moneyMsg = PlayerProgressionSystem.spendMoney(
            playerData, 
            totalCost, 
            "item_purchase", 
            string.format("Purchased %d x %s at wave %d", quantity, itemId, waveIndex)
        )
    else
        -- Fallback to inventory system (legacy)
        local inventory = InventoryManager.getInventory(playerId)
        if not inventory then
            return false, "Player inventory not found", 0
        end
        
        if inventory.money < totalCost then
            return false, "Insufficient funds", 0
        end
        
        inventory.money = inventory.money - totalCost
        moneyResult = true
        newBalance = inventory.money
    end
    
    if not moneyResult then
        return false, moneyMsg or "Failed to deduct money", 0
    end
    
    -- Add item to inventory
    local success, addMsg, finalQuantity = InventoryManager.addItem(
        playerId, 
        itemId, 
        quantity, 
        "Shop purchase at wave " .. waveIndex
    )
    
    if not success then
        -- Refund money if item couldn't be added
        if playerData and playerData.money then
            PlayerProgressionSystem.addMoney(playerData, totalCost, "refund", "Failed purchase refund")
        else
            local inventory = InventoryManager.getInventory(playerId)
            if inventory then
                inventory.money = inventory.money + totalCost
            end
        end
        return false, "Failed to add item: " .. addMsg, 0
    end
    
    -- Update shop state
    local shopState = initializePlayerShopState(playerId)
    shopState.totalPurchases = shopState.totalPurchases + finalQuantity
    shopState.lifetimeSpent = shopState.lifetimeSpent + totalCost
    
    -- Log transaction
    logShopAccess(playerId, waveIndex, "purchase", {
        itemId = itemId,
        quantity = finalQuantity,
        unitPrice = unitPrice,
        totalCost = totalCost,
        bulkDiscount = quantity >= SHOP_CONSTANTS.BULK_DISCOUNT_THRESHOLD,
        newBalance = newBalance
    })
    
    return true, "Item purchased successfully", finalQuantity
end

-- Purchase item from shop (legacy version)
function ShopManager.purchaseItem(playerId, itemId, quantity, waveIndex)
    ShopManager.init()
    
    quantity = quantity or 1
    
    -- Validate basic parameters
    if not playerId or not itemId or not waveIndex then
        return false, "Invalid parameters for item purchase", 0
    end
    
    if quantity < SHOP_CONSTANTS.MIN_PURCHASE_QUANTITY or 
       quantity > SHOP_CONSTANTS.MAX_PURCHASE_QUANTITY then
        return false, "Invalid purchase quantity", 0
    end
    
    -- Validate shop access
    local accessValid, accessMsg = ShopManager.validateShopAccess(playerId, waveIndex)
    if not accessValid then
        return false, accessMsg, 0
    end
    
    -- Check item availability
    local available, availMsg = ShopDatabase.isItemAvailable(itemId, waveIndex)
    if not available then
        return false, availMsg, 0
    end
    
    -- Get item price
    local unitPrice = ShopDatabase.getItemBuyPrice(itemId, waveIndex)
    if unitPrice <= 0 then
        return false, "Item price unavailable", 0
    end
    
    -- Calculate total cost with potential bulk discount
    local totalCost = unitPrice * quantity
    if quantity >= SHOP_CONSTANTS.BULK_DISCOUNT_THRESHOLD then
        totalCost = math.floor(totalCost * SHOP_CONSTANTS.BULK_DISCOUNT_RATE)
    end
    
    -- Get player inventory and money
    local inventory = InventoryManager.getInventory(playerId)
    if not inventory then
        return false, "Player inventory not found", 0
    end
    
    -- Inventory state validated
    
    -- Validate player has enough money
    if inventory.money < totalCost then
        return false, "Insufficient funds", 0
    end
    
    -- Note: Inventory space validation will be handled by InventoryManager.addItem
    
    -- Execute transaction
    local success, addMsg, finalQuantity = InventoryManager.addItem(
        playerId, 
        itemId, 
        quantity, 
        "Shop purchase at wave " .. waveIndex
    )
    
    if not success then
        return false, "Failed to add item: " .. addMsg, 0
    end
    
    -- Deduct money (inventory manager doesn't handle money directly)
    inventory.money = inventory.money - totalCost
    
    -- Update shop state
    local shopState = initializePlayerShopState(playerId)
    shopState.totalPurchases = shopState.totalPurchases + quantity
    shopState.lifetimeSpent = shopState.lifetimeSpent + totalCost
    
    -- Log transaction
    logShopAccess(playerId, waveIndex, "purchase", {
        itemId = itemId,
        quantity = finalQuantity,
        unitPrice = unitPrice,
        totalCost = totalCost,
        bulkDiscount = quantity >= SHOP_CONSTANTS.BULK_DISCOUNT_THRESHOLD
    })
    
    return true, "Item purchased successfully", quantity
end

-- Bulk purchase multiple items
function ShopManager.bulkPurchase(playerId, purchases, waveIndex)
    ShopManager.init()
    
    if not playerId or not purchases or not waveIndex then
        return false, "Invalid parameters for bulk purchase", {}
    end
    
    if type(purchases) ~= "table" or #purchases == 0 then
        return false, "Invalid purchase list", {}
    end
    
    local results = {}
    local totalSpent = 0
    local failedPurchases = 0
    
    -- Process each purchase
    for i, purchase in ipairs(purchases) do
        if type(purchase) == "table" and purchase.itemId and purchase.quantity then
            local success, msg, quantity = ShopManager.purchaseItem(
                playerId, 
                purchase.itemId, 
                purchase.quantity, 
                waveIndex
            )
            
            local result = {
                itemId = purchase.itemId,
                requestedQuantity = purchase.quantity,
                success = success,
                message = msg,
                actualQuantity = quantity
            }
            
            if success then
                local itemPrice = ShopDatabase.getItemBuyPrice(purchase.itemId, waveIndex)
                totalSpent = totalSpent + (itemPrice * quantity)
            else
                failedPurchases = failedPurchases + 1
            end
            
            table.insert(results, result)
        else
            table.insert(results, {
                itemId = "unknown",
                success = false,
                message = "Invalid purchase format",
                actualQuantity = 0
            })
            failedPurchases = failedPurchases + 1
        end
    end
    
    -- Log bulk purchase
    logShopAccess(playerId, waveIndex, "bulk_purchase", {
        totalItems = #purchases,
        successfulPurchases = #purchases - failedPurchases,
        failedPurchases = failedPurchases,
        totalSpent = totalSpent
    })
    
    local overallSuccess = failedPurchases == 0
    local summary = string.format("Bulk purchase: %d/%d successful, spent %d money", 
        #purchases - failedPurchases, #purchases, totalSpent)
    
    return overallSuccess, summary, results
end

-- Sell item to shop with progression integration
function ShopManager.sellItemWithProgression(playerId, itemId, quantity, waveIndex, playerData)
    ShopManager.init()
    
    quantity = quantity or 1
    
    -- Validate basic parameters
    if not playerId or not itemId or not waveIndex then
        return false, "Invalid parameters for item sale", 0
    end
    
    if quantity <= 0 then
        return false, "Invalid sale quantity", 0
    end
    
    -- Validate shop access with progression data
    local accessValid, accessMsg = ShopManager.validateShopAccess(playerId, waveIndex, playerData)
    if not accessValid then
        return false, accessMsg, 0
    end
    
    -- Check if item can be sold
    local sellPrice = ShopDatabase.getItemSellPrice(itemId, waveIndex)
    if sellPrice <= 0 then
        return false, "Item cannot be sold or has no value", 0
    end
    
    -- Check player has enough items
    if not InventoryManager.hasItem(playerId, itemId, quantity) then
        return false, "Insufficient items to sell", 0
    end
    
    -- Calculate total sale value
    local totalValue = sellPrice * quantity
    
    -- Remove items from inventory
    local success, removeMsg, actualQuantity = InventoryManager.removeItem(
        playerId, 
        itemId, 
        quantity,
        "Sold to shop at wave " .. waveIndex
    )
    
    if not success or actualQuantity == 0 then
        return false, "Failed to remove items: " .. (removeMsg or "Unknown error"), 0
    end
    
    -- Recalculate value based on actual quantity removed
    totalValue = sellPrice * actualQuantity
    
    -- Add money using progression system if available
    local moneyResult = false
    local newBalance = 0
    
    if playerData and playerData.money then
        -- Use PlayerProgressionSystem for proper money management
        moneyResult, newBalance = PlayerProgressionSystem.addMoney(
            playerData, 
            totalValue, 
            "item_sale", 
            string.format("Sold %d x %s at wave %d", actualQuantity, itemId, waveIndex)
        )
    else
        -- Fallback to inventory system (legacy)
        local inventory = InventoryManager.getInventory(playerId)
        if inventory then
            inventory.money = inventory.money + totalValue
            moneyResult = true
            newBalance = inventory.money
        end
    end
    
    if not moneyResult then
        -- Try to restore items if money addition failed
        InventoryManager.addItem(playerId, itemId, actualQuantity, "Sale refund - money error")
        return false, "Failed to add money from sale", 0
    end
    
    -- Update shop state
    local shopState = initializePlayerShopState(playerId)
    shopState.totalSales = shopState.totalSales + actualQuantity
    shopState.lifetimeEarned = shopState.lifetimeEarned + totalValue
    
    -- Log transaction
    logShopAccess(playerId, waveIndex, "sale", {
        itemId = itemId,
        quantity = actualQuantity,
        unitPrice = sellPrice,
        totalValue = totalValue,
        newBalance = newBalance
    })
    
    return true, "Item sold successfully", totalValue
end

-- Sell item to shop (legacy version)
function ShopManager.sellItem(playerId, itemId, quantity, waveIndex)
    ShopManager.init()
    
    quantity = quantity or 1
    
    -- Validate basic parameters
    if not playerId or not itemId or not waveIndex then
        return false, "Invalid parameters for item sale", 0
    end
    
    if quantity <= 0 then
        return false, "Invalid sell quantity", 0
    end
    
    -- Validate shop access
    local accessValid, accessMsg = ShopManager.validateShopAccess(playerId, waveIndex)
    if not accessValid then
        return false, accessMsg, 0
    end
    
    -- Check if player has the item
    local playerInventory = InventoryManager.getInventory(playerId)
    if not playerInventory then
        return false, "Player inventory not found", 0
    end
    
    local itemData = playerInventory.items[itemId]
    if not itemData or itemData.quantity < quantity then
        return false, "Insufficient item quantity to sell", 0
    end
    
    -- Get sell price
    local unitSellPrice = ShopDatabase.getItemSellPrice(itemId, waveIndex)
    if unitSellPrice <= 0 then
        return false, "Item cannot be sold or has no value", 0
    end
    
    local totalEarnings = unitSellPrice * quantity
    
    -- Remove item from inventory
    local success, removeMsg, finalQuantity = InventoryManager.removeItem(
        playerId,
        itemId,
        quantity,
        "Shop sale at wave " .. waveIndex
    )
    
    if not success then
        return false, "Failed to remove item: " .. removeMsg, 0
    end
    
    -- Add money to player
    playerInventory.money = playerInventory.money + totalEarnings
    
    -- Update shop state
    local shopState = initializePlayerShopState(playerId)
    shopState.totalSales = shopState.totalSales + quantity
    shopState.lifetimeEarned = shopState.lifetimeEarned + totalEarnings
    
    -- Log transaction
    logShopAccess(playerId, waveIndex, "sale", {
        itemId = itemId,
        quantity = quantity,
        unitPrice = unitSellPrice,
        totalEarnings = totalEarnings
    })
    
    return true, "Item sold successfully", totalEarnings
end

-- Get player shop statistics
function ShopManager.getShopStats(playerId)
    ShopManager.init()
    
    if not playerId then
        return {}
    end
    
    local shopState = playerShopState[playerId]
    if not shopState then
        return {
            totalPurchases = 0,
            totalSales = 0,
            lifetimeSpent = 0,
            lifetimeEarned = 0,
            shopLevel = 1,
            netSpending = 0
        }
    end
    
    return {
        totalPurchases = shopState.totalPurchases,
        totalSales = shopState.totalSales,
        lifetimeSpent = shopState.lifetimeSpent,
        lifetimeEarned = shopState.lifetimeEarned,
        shopLevel = shopState.shopLevel,
        netSpending = shopState.lifetimeSpent - shopState.lifetimeEarned,
        lastAccessWave = shopState.lastAccessWave
    }
end

-- Check if shop should restock
function ShopManager.shouldRestock(waveIndex, lastShopWave)
    return ShopDatabase.shouldRestock(waveIndex)
end

-- Get shop access log for debugging
function ShopManager.getAccessLog(playerId)
    ShopManager.init()
    
    if not playerId then
        return {}
    end
    
    return shopAccessLog[playerId] or {}
end

-- Validate shop state integrity
function ShopManager.validateShopState(playerId)
    ShopManager.init()
    
    if not playerId then
        return false, {"Invalid player ID"}
    end
    
    local shopState = playerShopState[playerId]
    if not shopState then
        return true, {} -- No state to validate
    end
    
    local errors = {}
    
    -- Validate numeric fields
    if shopState.totalPurchases < 0 then
        table.insert(errors, "Negative total purchases")
    end
    
    if shopState.totalSales < 0 then
        table.insert(errors, "Negative total sales")
    end
    
    if shopState.lifetimeSpent < 0 then
        table.insert(errors, "Negative lifetime spent")
    end
    
    if shopState.lifetimeEarned < 0 then
        table.insert(errors, "Negative lifetime earned")
    end
    
    if shopState.shopLevel < 1 then
        table.insert(errors, "Invalid shop level")
    end
    
    return #errors == 0, errors
end

-- Get shop constants
function ShopManager.getConstants()
    return SHOP_CONSTANTS
end

-- Helper function to unlock shop for player (integration with progression system)
function ShopManager.unlockShop(playerData)
    if not playerData or not playerData.progression then
        return false, "Invalid player data"
    end
    
    if not playerData.progression.unlocks then
        playerData.progression.unlocks = {}
    end
    
    playerData.progression.unlocks.shop = true
    
    -- Update last saved timestamp
    if playerData.lastSaved then
        playerData.lastSaved = 0
    end
    
    return true, "Shop unlocked successfully"
end

-- Helper function to check if shop is unlocked for player
function ShopManager.isShopUnlocked(playerData)
    if not playerData or not playerData.progression then
        return false -- Assume locked if no progression data
    end
    
    return playerData.progression.unlocks and playerData.progression.unlocks.shop or false
end

-- Get inventory (helper function for backward compatibility)
function ShopManager.getInventory(playerId)
    return InventoryManager.getInventory(playerId)
end

return ShopManager