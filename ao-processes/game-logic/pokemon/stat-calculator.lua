--[[
Pokemon Stat Calculator
Implements precise stat calculation formulas matching TypeScript reference implementation

Handles:
- Base stat calculations with IV, nature, and level factors
- Nature modifier application in correct order
- IV generation and validation
- Shiny determination
- Hidden Power type calculation
- Battle stat integration for temporary modifications
--]]

local StatCalculator = {}

-- Import dependencies
local NatureModifiers = require("data.constants.nature-modifiers")
local Enums = require("data.constants.enums")
local CryptoRNG = require("game-logic.rng.crypto-rng")

-- Constants for stat calculations (matching TypeScript Math.floor/Math.ceil behavior)
local MAX_IV = 31
local MIN_IV = 0
local MIN_LEVEL = 1
local MAX_LEVEL = 100
local SHINY_ODDS_DIVISOR = 4096  -- 1/4096 chance for shiny

-- IV generation and validation

-- Generate random IVs for a Pokemon using AO crypto module for deterministic battles
-- @param seed: Optional seed for deterministic IV generation (for battle replay)
-- @return: Table with IVs for all 6 stats (0-31 range)
function StatCalculator.generateRandomIVs(seed)
    -- Initialize global RNG with seed for deterministic generation
    if seed then
        CryptoRNG.initGlobalRNG(seed)
    end
    
    return {
        hp = CryptoRNG.globalRandomInt(MIN_IV, MAX_IV),
        attack = CryptoRNG.globalRandomInt(MIN_IV, MAX_IV),
        defense = CryptoRNG.globalRandomInt(MIN_IV, MAX_IV),
        spAttack = CryptoRNG.globalRandomInt(MIN_IV, MAX_IV),
        spDefense = CryptoRNG.globalRandomInt(MIN_IV, MAX_IV),
        speed = CryptoRNG.globalRandomInt(MIN_IV, MAX_IV)
    }
end

-- Validate IV data integrity
-- @param ivs: Table with IV values
-- @return: Boolean indicating if all IVs are valid (0-31 range)
function StatCalculator.validateIVs(ivs)
    if type(ivs) ~= "table" then
        return false, "IVs must be a table"
    end
    
    local requiredStats = {"hp", "attack", "defense", "spAttack", "spDefense", "speed"}
    
    for _, stat in ipairs(requiredStats) do
        local iv = ivs[stat]
        if type(iv) ~= "number" then
            return false, "IV for " .. stat .. " must be a number"
        end
        if iv < MIN_IV or iv > MAX_IV then
            return false, "IV for " .. stat .. " must be between " .. MIN_IV .. " and " .. MAX_IV
        end
        if iv ~= math.floor(iv) then
            return false, "IV for " .. stat .. " must be an integer"
        end
    end
    
    return true
end

-- Shiny determination based on IV values

-- Calculate shiny probability based on IV combination
-- @param ivs: Table with IV values
-- @return: Boolean indicating if Pokemon is shiny
function StatCalculator.calculateShinyFromIVs(ivs)
    if not StatCalculator.validateIVs(ivs) then
        return false
    end
    
    -- Calculate shiny value using traditional method
    -- Combines HP, Attack, Defense, and Speed IVs
    local shinyValue = (ivs.hp * 2048) + (ivs.attack * 128) + (ivs.defense * 8) + ivs.speed
    
    return (shinyValue % SHINY_ODDS_DIVISOR) == 0
end

-- Stat calculation functions

-- Calculate HP stat using Pokemon formula
-- @param baseHp: Base HP stat from species data
-- @param iv: HP IV value (0-31)
-- @param level: Pokemon level (1-100)
-- @return: Calculated HP stat
function StatCalculator.calculateHPStat(baseHp, iv, level)
    -- Special case: Shedinja always has 1 HP
    if baseHp == 1 then
        return 1
    end
    
    if level == 1 then
        return baseHp + iv + 10
    end
    
    -- HP Formula: floor(((2 * Base + IV) * Level) / 100) + Level + 10
    local calculation = math.floor(((2 * baseHp + iv) * level) / 100) + level + 10
    return calculation
end

-- Calculate non-HP stat using Pokemon formula
-- @param baseStat: Base stat value from species data
-- @param iv: IV value for this stat (0-31)  
-- @param level: Pokemon level (1-100)
-- @param natureModifier: Nature multiplier (0.9, 1.0, or 1.1)
-- @return: Calculated stat value
function StatCalculator.calculateStat(baseStat, iv, level, natureModifier)
    if level == 1 then
        return math.floor((baseStat + iv) * (natureModifier or 1.0))
    end
    
    -- Stat Formula: floor((floor(((2 * Base + IV) * Level) / 100) + 5) * Nature)
    local baseCalc = math.floor(((2 * baseStat + iv) * level) / 100) + 5
    local calculation = math.floor(baseCalc * (natureModifier or 1.0))
    return calculation
end

-- Calculate all Pokemon stats
-- @param baseStats: Table with base stats {hp, attack, defense, spAttack, spDefense, speed}
-- @param ivs: Table with IV values {hp, attack, defense, spAttack, spDefense, speed}
-- @param level: Pokemon level (1-100)
-- @param natureId: Nature ID from Enums.Nature
-- @return: Table with calculated stats
function StatCalculator.calculateAllStats(baseStats, ivs, level, natureId)
    -- Validate inputs
    if type(baseStats) ~= "table" or type(ivs) ~= "table" then
        return nil, "Base stats and IVs must be tables"
    end
    
    if type(level) ~= "number" or level < MIN_LEVEL or level > MAX_LEVEL then
        return nil, "Level must be between " .. MIN_LEVEL .. " and " .. MAX_LEVEL
    end
    
    local valid, error = StatCalculator.validateIVs(ivs)
    if not valid then
        return nil, error
    end
    
    if not NatureModifiers.natureExists(natureId) then
        return nil, "Invalid nature ID: " .. tostring(natureId)
    end
    
    -- Get nature modifiers
    local natureMultipliers = NatureModifiers.getAllModifiers(natureId)
    
    -- Convert indexed baseStats array to named fields if needed
    -- Species database provides [1,2,3,4,5,6] but we need {hp, attack, defense, spAttack, spDefense, speed}
    local normalizedBaseStats = baseStats
    if baseStats[1] and not baseStats.hp then
        normalizedBaseStats = {
            hp = baseStats[1],
            attack = baseStats[2],
            defense = baseStats[3],
            spAttack = baseStats[4],
            spDefense = baseStats[5],
            speed = baseStats[6]
        }
    end
    
    -- Calculate stats
    local stats = {}
    
    -- HP calculation (no nature modifier)
    stats.hp = StatCalculator.calculateHPStat(normalizedBaseStats.hp, ivs.hp, level)
    
    -- Other stats with nature modifiers
    stats.attack = StatCalculator.calculateStat(normalizedBaseStats.attack, ivs.attack, level, natureMultipliers[2])
    stats.defense = StatCalculator.calculateStat(normalizedBaseStats.defense, ivs.defense, level, natureMultipliers[3])
    stats.spAttack = StatCalculator.calculateStat(normalizedBaseStats.spAttack, ivs.spAttack, level, natureMultipliers[4])
    stats.spDefense = StatCalculator.calculateStat(normalizedBaseStats.spDefense, ivs.spDefense, level, natureMultipliers[5])
    stats.speed = StatCalculator.calculateStat(normalizedBaseStats.speed, ivs.speed, level, natureMultipliers[6])
    
    return stats
end

-- Hidden Power type calculation (if used in game)

-- Calculate Hidden Power type from IVs
-- @param ivs: Table with IV values
-- @return: Type ID for Hidden Power move
function StatCalculator.calculateHiddenPowerType(ivs)
    if not StatCalculator.validateIVs(ivs) then
        return nil, "Invalid IVs for Hidden Power calculation"
    end
    
    -- Hidden Power type formula using IV remainders
    local typeValue = 0
    
    -- Each stat contributes based on IV % 2
    typeValue = typeValue + (ivs.hp % 2)
    typeValue = typeValue + ((ivs.attack % 2) * 2)
    typeValue = typeValue + ((ivs.defense % 2) * 4)
    typeValue = typeValue + ((ivs.speed % 2) * 8)
    typeValue = typeValue + ((ivs.spAttack % 2) * 16)
    typeValue = typeValue + ((ivs.spDefense % 2) * 32)
    
    -- Map to type (excludes Normal and ???)
    local hiddenPowerTypes = {
        Enums.PokemonType.FIGHTING, -- 0
        Enums.PokemonType.FLYING,   -- 1
        Enums.PokemonType.POISON,   -- 2
        Enums.PokemonType.GROUND,   -- 3
        Enums.PokemonType.ROCK,     -- 4
        Enums.PokemonType.BUG,      -- 5
        Enums.PokemonType.GHOST,    -- 6
        Enums.PokemonType.STEEL,    -- 7
        Enums.PokemonType.FIRE,     -- 8
        Enums.PokemonType.WATER,    -- 9
        Enums.PokemonType.GRASS,    -- 10
        Enums.PokemonType.ELECTRIC, -- 11
        Enums.PokemonType.PSYCHIC,  -- 12
        Enums.PokemonType.ICE,      -- 13
        Enums.PokemonType.DRAGON,   -- 14
        Enums.PokemonType.DARK      -- 15
    }
    
    local typeIndex = (typeValue % 15) + 1  -- Lua arrays are 1-indexed
    return hiddenPowerTypes[typeIndex]
end

-- Battle integration functions

-- Apply stat stage modifications for battle
-- @param baseStat: Original calculated stat
-- @param stages: Stat stage changes (-6 to +6)
-- @return: Modified stat for battle
function StatCalculator.applyStatStages(baseStat, stages)
    if stages == 0 then
        return baseStat
    end
    
    -- Stat stage multipliers (traditional Pokemon formula)
    local multipliers = {
        [-6] = 2/8, [-5] = 2/7, [-4] = 2/6, [-3] = 2/5, [-2] = 2/4, [-1] = 2/3,
        [0] = 1,
        [1] = 3/2, [2] = 4/2, [3] = 5/2, [4] = 6/2, [5] = 7/2, [6] = 8/2
    }
    
    local multiplier = multipliers[math.max(-6, math.min(6, stages))]
    return math.floor(baseStat * multiplier)
end

-- Recalculate stats after level change or evolution
-- @param pokemon: Pokemon data table with baseStats, ivs, level, natureId
-- @return: Updated stats table
function StatCalculator.recalculateStats(pokemon)
    if not pokemon.baseStats or not pokemon.ivs or not pokemon.level or not pokemon.natureId then
        return nil, "Missing required Pokemon data for stat recalculation"
    end
    
    return StatCalculator.calculateAllStats(
        pokemon.baseStats, 
        pokemon.ivs, 
        pokemon.level, 
        pokemon.natureId
    )
end

-- Breeding-related functions

-- Generate child IVs from parent IVs (simplified inheritance)
-- @param parent1IVs: First parent's IVs
-- @param parent2IVs: Second parent's IVs
-- @param seed: Optional seed for deterministic breeding (for battle replay)
-- @return: Child IVs with inheritance from both parents
function StatCalculator.generateChildIVs(parent1IVs, parent2IVs, seed)
    if not StatCalculator.validateIVs(parent1IVs) or not StatCalculator.validateIVs(parent2IVs) then
        return nil, "Invalid parent IVs for breeding"
    end
    
    local childIVs = {}
    local stats = {"hp", "attack", "defense", "spAttack", "spDefense", "speed"}
    
    if seed then
        CryptoRNG.initGlobalRNG(seed)
    end
    
    for _, stat in ipairs(stats) do
        -- 50% chance to inherit from each parent, with some random variation
        if CryptoRNG.globalRandom() < 0.5 then
            -- Inherit from parent 1 with slight variation
            childIVs[stat] = math.min(MAX_IV, math.max(MIN_IV, parent1IVs[stat] + CryptoRNG.globalRandomInt(-2, 2)))
        else
            -- Inherit from parent 2 with slight variation  
            childIVs[stat] = math.min(MAX_IV, math.max(MIN_IV, parent2IVs[stat] + CryptoRNG.globalRandomInt(-2, 2)))
        end
    end
    
    return childIVs
end

-- Utility functions

-- Get stat modifier from nature for specific stat
-- @param natureId: Nature ID
-- @param statName: Stat name ("attack", "defense", etc.)
-- @return: Multiplier value for the stat
function StatCalculator.getNatureModifier(natureId, statName)
    local statIndexMap = {
        hp = 1, attack = 2, defense = 3, 
        spAttack = 4, spDefense = 5, speed = 6
    }
    
    local statIndex = statIndexMap[statName]
    if not statIndex then
        return 1.0
    end
    
    return NatureModifiers.getStatModifier(natureId, statIndex)
end

-- Check if stat calculation matches expected value (for testing)
-- @param expected: Expected stat value
-- @param actual: Calculated stat value  
-- @param tolerance: Allowed difference (default 0)
-- @return: Boolean indicating if values match within tolerance
function StatCalculator.validateStatCalculation(expected, actual, tolerance)
    tolerance = tolerance or 0
    return math.abs(expected - actual) <= tolerance
end

return StatCalculator