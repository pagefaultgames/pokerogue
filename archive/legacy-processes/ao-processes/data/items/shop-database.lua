--[[
Shop Database and Pricing System
Comprehensive item pricing and availability definitions matching TypeScript implementation

Features:
- Wave-based pricing progression with exact TypeScript calculations
- Progression-gated item availability with unlock conditions
- Rare item availability system with special acquisition conditions
- Item rarity classification and pricing tiers
- Buy/sell price ratios (typically 50% sell value)
- Shop restocking mechanics with wave-based triggers
- Dynamic shop inventory categories

Reference: src/modifier/modifier-type.ts getPlayerShopModifierTypeOptionsForWave()
--]]

local ShopDatabase = {}

-- Dependencies
-- local ItemDatabase = require('data.items.item-database') -- TODO: Use for item validation

-- Shop constants
local SHOP_CONSTANTS = {
    SELL_RATIO = 0.5, -- Items sell for 50% of buy price
    RESTOCK_WAVE_INTERVAL = 10, -- Shop restocks every 10 waves
    MAX_SHOP_ITEMS = 6, -- Maximum items displayed in shop
    BASE_COST_CALCULATION = true -- Enable wave-based cost calculation
}

-- Item availability tiers based on wave progression
local AvailabilityTier = {
    STARTER = 1,    -- Available from wave 1
    EARLY = 30,     -- Available from wave 30
    MID = 60,       -- Available from wave 60
    LATE = 90,      -- Available from wave 90
    ENDGAME = 120,  -- Available from wave 120
    SPECIAL = 999   -- Special unlock conditions required
}

-- Item rarity for pricing multipliers
local ItemRarity = {
    COMMON = 1.0,
    UNCOMMON = 1.5,
    RARE = 2.0,
    ULTRA_RARE = 4.0,
    LEGENDARY = 10.0
}

-- Shop categories for organization
local ShopCategory = {
    HEALING = "healing",
    PP_RESTORE = "pp_restore",
    REVIVAL = "revival",
    BATTLE_ITEMS = "battle_items",
    POKEBALLS = "pokeballs",
    EVOLUTION = "evolution",
    BERRIES = "berries",
    RARE_ITEMS = "rare_items"
}

--[[
Calculate base cost for current wave
Matches TypeScript: getWaveMoneyAmount() calculation
Returns the base cost multiplier for shop pricing
--]]
function ShopDatabase.calculateBaseCost(waveIndex)
    if not waveIndex or waveIndex < 1 then
        return 100 -- Default base cost
    end

    local waveSetIndex = math.ceil(waveIndex / 10) - 1
    local moneyValue = ((waveSetIndex + 1 + (0.75 + (((waveIndex - 1) % 10) + 1) / 10)) * 100)
        ^ (1 + 0.005 * waveSetIndex) * 1.0 -- moneyMultiplier = 1.0 for base cost

    return math.floor(moneyValue / 10) * 10
end

--[[
Shop Item Definitions - Organized by Tier
Matches TypeScript shop pricing exactly from getPlayerShopModifierTypeOptionsForWave()
Items are organized in tier arrays to match TypeScript slice logic
--]]
-- Matches TypeScript options array structure exactly
ShopDatabase.SHOP_TIERS = {
    -- Tier 0 (Wave 1-29)
    {
        {id = "POTION", cost_multiplier = 0.2, category = ShopCategory.HEALING},
        {id = "ETHER", cost_multiplier = 0.4, category = ShopCategory.PP_RESTORE},
        {id = "REVIVE", cost_multiplier = 2.0, category = ShopCategory.REVIVAL}
    },
    -- Tier 1 (Wave 30-59)
    {
        {id = "SUPER_POTION", cost_multiplier = 0.45, category = ShopCategory.HEALING},
        {id = "FULL_HEAL", cost_multiplier = 1.0, category = ShopCategory.HEALING}
    },
    -- Tier 2 (Wave 60-89)
    {
        {id = "ELIXIR", cost_multiplier = 1.0, category = ShopCategory.PP_RESTORE},
        {id = "MAX_ETHER", cost_multiplier = 1.0, category = ShopCategory.PP_RESTORE}
    },
    -- Tier 3 (Wave 90-119)
    {
        {id = "HYPER_POTION", cost_multiplier = 0.8, category = ShopCategory.HEALING},
        {id = "MAX_REVIVE", cost_multiplier = 2.75, category = ShopCategory.REVIVAL},
        {id = "MEMORY_MUSHROOM", cost_multiplier = 4.0, category = ShopCategory.RARE_ITEMS}
    },
    -- Tier 4 (Wave 120-149)
    {
        {id = "MAX_POTION", cost_multiplier = 1.5, category = ShopCategory.HEALING},
        {id = "MAX_ELIXIR", cost_multiplier = 2.5, category = ShopCategory.PP_RESTORE}
    },
    -- Tier 5 (Wave 150+)
    {
        {id = "FULL_RESTORE", cost_multiplier = 2.25, category = ShopCategory.HEALING}
    },
    -- Tier 6 (Special conditions)
    {
        {id = "SACRED_ASH", cost_multiplier = 10.0, category = ShopCategory.REVIVAL, special_condition = "defeat_legendary_boss"}
    }
}

--[[
Get available shop items for specific wave
Matches TypeScript logic from getPlayerShopModifierTypeOptionsForWave()
Returns items available at the current wave with calculated prices
--]]
function ShopDatabase.getAvailableItems(waveIndex)
    -- No shop on boss waves (every 10th wave)
    if waveIndex % 10 == 0 then
        return {}
    end

    local availableItems = {}
    local baseCost = ShopDatabase.calculateBaseCost(waveIndex)

    -- Matches TypeScript: slice(0, Math.ceil(Math.max(waveIndex + 10, 0) / 30))
    local maxTiers = math.ceil(math.max(waveIndex + 10, 0) / 30)

    -- Include all tiers up to maxTiers (like slice in TypeScript)
    for tierIndex = 1, math.min(maxTiers, #ShopDatabase.SHOP_TIERS) do
        for _, item in ipairs(ShopDatabase.SHOP_TIERS[tierIndex]) do
            -- Skip special condition items unless conditions met
            if not item.special_condition then
                local shopItem = {
                    id = item.id,
                    category = item.category,
                    cost = math.floor(baseCost * item.cost_multiplier)
                }
                table.insert(availableItems, shopItem)
            end
        end
    end

    return availableItems
end

--[[
Get item buy price for specific wave and item
--]]
function ShopDatabase.getItemBuyPrice(itemId, waveIndex)
    local baseCost = ShopDatabase.calculateBaseCost(waveIndex)

    -- Search through all tiers
    for _, tier in ipairs(ShopDatabase.SHOP_TIERS) do
        for _, item in ipairs(tier) do
            if item.id == itemId then
                return math.floor(baseCost * item.cost_multiplier)
            end
        end
    end

    return 0 -- Item not found
end

--[[
Get item sell price (50% of buy price)
--]]
function ShopDatabase.getItemSellPrice(itemId, waveIndex)
    local buyPrice = ShopDatabase.getItemBuyPrice(itemId, waveIndex)
    return math.floor(buyPrice * SHOP_CONSTANTS.SELL_RATIO)
end

--[[
Check if shop should restock for current wave
--]]
function ShopDatabase.shouldRestock(waveIndex)
    return waveIndex % SHOP_CONSTANTS.RESTOCK_WAVE_INTERVAL == 1
end

--[[
Get shop categories for organization
--]]
function ShopDatabase.getCategories()
    return ShopCategory
end

--[[
Get shop constants for configuration
--]]
function ShopDatabase.getConstants()
    return SHOP_CONSTANTS
end

--[[
Validate item purchase availability
--]]
function ShopDatabase.isItemAvailable(itemId, waveIndex, specialConditions)
    specialConditions = specialConditions or {}

    -- Search through all tiers to find item
    for tierIndex, tier in ipairs(ShopDatabase.SHOP_TIERS) do
        for _, item in ipairs(tier) do
            if item.id == itemId then
                -- Check wave requirement based on tier (each tier unlocks at 30-wave intervals)
                local requiredWave = (tierIndex - 1) * 30 + 1
                if requiredWave > waveIndex then
                    return false, "Item not available at current wave"
                end

                -- Check special conditions
                if item.special_condition and not specialConditions[item.special_condition] then
                    return false, "Special condition not met: " .. item.special_condition
                end

                return true, "Available"
            end
        end
    end

    return false, "Item not found"
end

return ShopDatabase