--[[
Nature Modifiers System
Implements all 25 Pokemon natures with exact stat multipliers

Defines nature effects on Pokemon stats with precise multipliers:
- Decreased stats: 0.9 (10% reduction)
- Neutral stats: 1.0 (no change)  
- Increased stats: 1.1 (10% boost)

All multipliers match TypeScript implementation exactly for behavioral parity.
--]]

local NatureModifiers = {}

-- Import dependencies for RNG
local CryptoRNG = require("game-logic.rng.crypto-rng")

-- Nature stat effect constants
local NATURE_INCREASE = 1.1
local NATURE_DECREASE = 0.9
local NATURE_NEUTRAL = 1.0

-- Nature definitions with stat modifiers
-- Format: [natureId] = { increase = "stat", decrease = "stat", modifiers = { hp, attack, defense, spAttack, spDefense, speed } }
-- natureId corresponds to Enums.Nature constants from enums.lua
NatureModifiers.natures = {
    [0] = {  -- Hardy (neutral)
        name = "Hardy",
        increase = nil,
        decrease = nil,
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL }
    },
    [1] = {  -- Lonely (+Attack, -Defense)
        name = "Lonely", 
        increase = "attack",
        decrease = "defense",
        modifiers = { NATURE_NEUTRAL, NATURE_INCREASE, NATURE_DECREASE, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL }
    },
    [2] = {  -- Brave (+Attack, -Speed)
        name = "Brave",
        increase = "attack", 
        decrease = "speed",
        modifiers = { NATURE_NEUTRAL, NATURE_INCREASE, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_DECREASE }
    },
    [3] = {  -- Adamant (+Attack, -SpAttack)
        name = "Adamant",
        increase = "attack",
        decrease = "spAttack", 
        modifiers = { NATURE_NEUTRAL, NATURE_INCREASE, NATURE_NEUTRAL, NATURE_DECREASE, NATURE_NEUTRAL, NATURE_NEUTRAL }
    },
    [4] = {  -- Naughty (+Attack, -SpDefense)
        name = "Naughty",
        increase = "attack",
        decrease = "spDefense",
        modifiers = { NATURE_NEUTRAL, NATURE_INCREASE, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_DECREASE, NATURE_NEUTRAL }
    },
    [5] = {  -- Bold (+Defense, -Attack)
        name = "Bold",
        increase = "defense",
        decrease = "attack",
        modifiers = { NATURE_NEUTRAL, NATURE_DECREASE, NATURE_INCREASE, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL }
    },
    [6] = {  -- Docile (neutral)
        name = "Docile",
        increase = nil,
        decrease = nil,
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL }
    },
    [7] = {  -- Relaxed (+Defense, -Speed)
        name = "Relaxed",
        increase = "defense",
        decrease = "speed",
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_INCREASE, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_DECREASE }
    },
    [8] = {  -- Impish (+Defense, -SpAttack)
        name = "Impish", 
        increase = "defense",
        decrease = "spAttack",
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_INCREASE, NATURE_DECREASE, NATURE_NEUTRAL, NATURE_NEUTRAL }
    },
    [9] = { -- Lax (+Defense, -SpDefense)
        name = "Lax",
        increase = "defense",
        decrease = "spDefense", 
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_INCREASE, NATURE_NEUTRAL, NATURE_DECREASE, NATURE_NEUTRAL }
    },
    [10] = { -- Timid (+Speed, -Attack)
        name = "Timid",
        increase = "speed",
        decrease = "attack",
        modifiers = { NATURE_NEUTRAL, NATURE_DECREASE, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_INCREASE }
    },
    [11] = { -- Hasty (+Speed, -Defense)
        name = "Hasty", 
        increase = "speed",
        decrease = "defense",
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_DECREASE, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_INCREASE }
    },
    [12] = { -- Serious (neutral)
        name = "Serious",
        increase = nil,
        decrease = nil,
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL }
    },
    [13] = { -- Jolly (+Speed, -SpAttack)
        name = "Jolly",
        increase = "speed",
        decrease = "spAttack",
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_DECREASE, NATURE_NEUTRAL, NATURE_INCREASE }
    },
    [14] = { -- Naive (+Speed, -SpDefense)
        name = "Naive",
        increase = "speed", 
        decrease = "spDefense",
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_DECREASE, NATURE_INCREASE }
    },
    [15] = { -- Modest (+SpAttack, -Attack)
        name = "Modest",
        increase = "spAttack",
        decrease = "attack",
        modifiers = { NATURE_NEUTRAL, NATURE_DECREASE, NATURE_NEUTRAL, NATURE_INCREASE, NATURE_NEUTRAL, NATURE_NEUTRAL }
    },
    [16] = { -- Mild (+SpAttack, -Defense)
        name = "Mild",
        increase = "spAttack",
        decrease = "defense",
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_DECREASE, NATURE_INCREASE, NATURE_NEUTRAL, NATURE_NEUTRAL }
    },
    [17] = { -- Quiet (+SpAttack, -Speed)
        name = "Quiet",
        increase = "spAttack",
        decrease = "speed",
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_INCREASE, NATURE_NEUTRAL, NATURE_DECREASE }
    },
    [18] = { -- Bashful (neutral) 
        name = "Bashful",
        increase = nil,
        decrease = nil,
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL }
    },
    [19] = { -- Rash (+SpAttack, -SpDefense)
        name = "Rash",
        increase = "spAttack",
        decrease = "spDefense",
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_INCREASE, NATURE_DECREASE, NATURE_NEUTRAL }
    },
    [20] = { -- Calm (+SpDefense, -Attack)
        name = "Calm",
        increase = "spDefense",
        decrease = "attack",
        modifiers = { NATURE_NEUTRAL, NATURE_DECREASE, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_INCREASE, NATURE_NEUTRAL }
    },
    [21] = { -- Gentle (+SpDefense, -Defense)
        name = "Gentle",
        increase = "spDefense", 
        decrease = "defense",
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_DECREASE, NATURE_NEUTRAL, NATURE_INCREASE, NATURE_NEUTRAL }
    },
    [22] = { -- Sassy (+SpDefense, -Speed)
        name = "Sassy",
        increase = "spDefense",
        decrease = "speed",
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_INCREASE, NATURE_DECREASE }
    },
    [23] = { -- Careful (+SpDefense, -SpAttack)
        name = "Careful",
        increase = "spDefense",
        decrease = "spAttack",
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_DECREASE, NATURE_INCREASE, NATURE_NEUTRAL }
    },
    [24] = { -- Quirky (neutral)
        name = "Quirky",
        increase = nil,
        decrease = nil,
        modifiers = { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL }
    }
}

-- Fast nature lookup by ID
function NatureModifiers.getNature(natureId)
    return NatureModifiers.natures[natureId]
end

-- Get stat modifier for specific nature and stat index
function NatureModifiers.getStatModifier(natureId, statIndex)
    local nature = NatureModifiers.natures[natureId]
    if not nature then
        return NATURE_NEUTRAL
    end
    return nature.modifiers[statIndex] or NATURE_NEUTRAL
end

-- Get all stat modifiers for a nature
function NatureModifiers.getAllModifiers(natureId)
    local nature = NatureModifiers.natures[natureId]
    if not nature then
        return { NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL, NATURE_NEUTRAL }
    end
    return nature.modifiers
end

-- Validate nature data integrity
function NatureModifiers.validateNature(natureId)
    local nature = NatureModifiers.natures[natureId]
    if not nature then
        return false, "Nature not found"
    end
    
    -- Check modifiers array length
    if #nature.modifiers ~= 6 then
        return false, "Invalid modifiers array length"
    end
    
    -- Check all modifiers are valid values
    for i, modifier in ipairs(nature.modifiers) do
        if modifier ~= NATURE_INCREASE and modifier ~= NATURE_DECREASE and modifier ~= NATURE_NEUTRAL then
            return false, "Invalid modifier value at position " .. i
        end
    end
    
    -- Validate nature consistency (can't increase and decrease same stat)
    local increaseCount = 0
    local decreaseCount = 0
    for _, modifier in ipairs(nature.modifiers) do
        if modifier == NATURE_INCREASE then
            increaseCount = increaseCount + 1
        elseif modifier == NATURE_DECREASE then
            decreaseCount = decreaseCount + 1
        end
    end
    
    -- Neutral natures should have no increases/decreases
    if not nature.increase and not nature.decrease then
        if increaseCount ~= 0 or decreaseCount ~= 0 then
            return false, "Neutral nature has non-neutral modifiers"
        end
    else
        -- Non-neutral natures should have exactly one increase and one decrease
        if increaseCount ~= 1 or decreaseCount ~= 1 then
            return false, "Non-neutral nature must have exactly 1 increase and 1 decrease"
        end
    end
    
    return true
end

-- Validate all nature data on module load
function NatureModifiers.validateAllNatures()
    local errors = {}
    for natureId, nature in pairs(NatureModifiers.natures) do
        local valid, error = NatureModifiers.validateNature(natureId)
        if not valid then
            table.insert(errors, "Nature " .. natureId .. " (" .. (nature.name or "unknown") .. "): " .. error)
        end
    end
    return #errors == 0, errors
end

-- Check if exact multiplier values are preserved
function NatureModifiers.validateMultiplierPrecision()
    -- Verify exact multiplier constants match TypeScript implementation
    if NATURE_INCREASE ~= 1.1 then
        return false, "NATURE_INCREASE must be exactly 1.1"
    end
    if NATURE_DECREASE ~= 0.9 then
        return false, "NATURE_DECREASE must be exactly 0.9"
    end
    if NATURE_NEUTRAL ~= 1.0 then
        return false, "NATURE_NEUTRAL must be exactly 1.0"
    end
    return true
end

-- Get total nature count
function NatureModifiers.getNatureCount()
    local count = 0
    for _ in pairs(NatureModifiers.natures) do
        count = count + 1
    end
    return count
end

-- Get all nature IDs
function NatureModifiers.getAllNatureIds()
    local ids = {}
    for id in pairs(NatureModifiers.natures) do
        table.insert(ids, id)
    end
    table.sort(ids)
    return ids
end

-- O(1) nature name lookup by ID
function NatureModifiers.getNatureName(natureId)
    local nature = NatureModifiers.natures[natureId]
    return nature and nature.name
end

-- Check if nature exists (O(1))
function NatureModifiers.natureExists(natureId)
    return NatureModifiers.natures[natureId] ~= nil
end

-- Get nature's increased stat name (O(1))
function NatureModifiers.getIncreasedStat(natureId)
    local nature = NatureModifiers.natures[natureId]
    return nature and nature.increase
end

-- Get nature's decreased stat name (O(1))
function NatureModifiers.getDecreasedStat(natureId)
    local nature = NatureModifiers.natures[natureId]
    return nature and nature.decrease
end

-- Check if nature is neutral (has no stat modifications)
function NatureModifiers.isNeutralNature(natureId)
    local nature = NatureModifiers.natures[natureId]
    return nature and (not nature.increase and not nature.decrease)
end

-- Get random nature ID for Pokemon generation
-- @param seed: Optional seed for deterministic nature generation (for battle replay)
function NatureModifiers.getRandomNatureId(seed)
    if seed then
        CryptoRNG.initGlobalRNG(seed)
    end
    
    local ids = NatureModifiers.getAllNatureIds()
    return ids[CryptoRNG.globalRandomInt(1, #ids)]
end

return NatureModifiers