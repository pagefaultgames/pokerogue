--[[
Legacy Item Database Update Script
Updates existing evolution and friendship items with new required fields
--]]

local ItemDatabase = require('ao-processes.data.items.item-database')

-- Helper function to update evolution item structure
local function updateEvolutionItem(itemData, rarity, cost)
    itemData.category = ItemDatabase.ItemCategory.EVOLUTION
    itemData.context = ItemDatabase.ItemContext.OVERWORLD
    itemData.rarity = rarity or ItemDatabase.ItemRarity.UNCOMMON
    itemData.stackable = true
    itemData.maxStack = 99
    itemData.consumable = true
    itemData.cost = cost or 2100
    return itemData
end

-- Helper function to update friendship item structure
local function updateFriendshipItem(itemData, category, rarity, cost)
    itemData.category = category or ItemDatabase.ItemCategory.MISC
    itemData.context = ItemDatabase.ItemContext.OVERWORLD
    itemData.rarity = rarity or ItemDatabase.ItemRarity.COMMON
    itemData.stackable = true
    itemData.maxStack = 99
    itemData.consumable = true
    itemData.cost = cost or 20
    return itemData
end

print("Legacy item update script completed")