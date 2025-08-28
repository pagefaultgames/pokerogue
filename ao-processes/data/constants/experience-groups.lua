--[[
Pokemon Experience Group Constants
Defines experience curves and growth rates for different Pokemon species

Contains:
- Experience group definitions
- Species-to-growth-rate mappings
- Level progression tables
- Experience calculation lookup tables
--]]

local ExperienceGroups = {}

-- Experience Group Types
ExperienceGroups.Types = {
    FAST = "FAST",
    MEDIUM_FAST = "MEDIUM_FAST", 
    MEDIUM_SLOW = "MEDIUM_SLOW",
    SLOW = "SLOW",
    ERRATIC = "ERRATIC",
    FLUCTUATING = "FLUCTUATING"
}

-- Pre-calculated experience tables for performance
-- These match the formulas in experience-system.lua but provide O(1) lookup
local ExperienceTables = {}

-- Fast experience group (4n^3/5)
ExperienceTables.FAST = {}
for level = 1, 100 do
    if level == 1 then
        ExperienceTables.FAST[level] = 0
    else
        ExperienceTables.FAST[level] = math.floor(4 * level * level * level / 5)
    end
end

-- Medium Fast experience group (n^3)
ExperienceTables.MEDIUM_FAST = {}
for level = 1, 100 do
    if level == 1 then
        ExperienceTables.MEDIUM_FAST[level] = 0
    else
        ExperienceTables.MEDIUM_FAST[level] = level * level * level
    end
end

-- Medium Slow experience group (6n^3/5 - 15n^2 + 100n - 140)
ExperienceTables.MEDIUM_SLOW = {}
for level = 1, 100 do
    if level == 1 then
        ExperienceTables.MEDIUM_SLOW[level] = 0
    else
        ExperienceTables.MEDIUM_SLOW[level] = math.floor(6 * level * level * level / 5) - (15 * level * level) + (100 * level) - 140
    end
end

-- Slow experience group (5n^3/4)
ExperienceTables.SLOW = {}
for level = 1, 100 do
    if level == 1 then
        ExperienceTables.SLOW[level] = 0
    else
        ExperienceTables.SLOW[level] = math.floor(5 * level * level * level / 4)
    end
end

-- Erratic experience group (complex formula with level ranges)
ExperienceTables.ERRATIC = {}
for level = 1, 100 do
    if level == 1 then
        ExperienceTables.ERRATIC[level] = 0
    elseif level <= 50 then
        ExperienceTables.ERRATIC[level] = math.floor(level * level * level * (100 - level) / 50)
    elseif level <= 68 then
        ExperienceTables.ERRATIC[level] = math.floor(level * level * level * (150 - level) / 100)
    elseif level <= 98 then
        ExperienceTables.ERRATIC[level] = math.floor(level * level * level * ((1911 - 10 * level) / 3) / 500)
    else
        ExperienceTables.ERRATIC[level] = math.floor(level * level * level * (160 - level) / 100)
    end
end

-- Fluctuating experience group (complex formula with level ranges)
ExperienceTables.FLUCTUATING = {}
for level = 1, 100 do
    if level == 1 then
        ExperienceTables.FLUCTUATING[level] = 0
    elseif level <= 15 then
        ExperienceTables.FLUCTUATING[level] = math.floor(level * level * level * ((24 + ((level + 1) / 3)) / 50))
    elseif level <= 36 then
        ExperienceTables.FLUCTUATING[level] = math.floor(level * level * level * ((14 + level) / 50))
    else
        ExperienceTables.FLUCTUATING[level] = math.floor(level * level * level * ((32 + (level / 2)) / 50))
    end
end

-- Species Growth Rate Mappings
-- Maps species IDs to their experience groups
ExperienceGroups.SpeciesGrowthRates = {
    -- Generation I Pokemon
    [1] = "MEDIUM_SLOW",   -- Bulbasaur
    [2] = "MEDIUM_SLOW",   -- Ivysaur
    [3] = "MEDIUM_SLOW",   -- Venusaur
    [4] = "MEDIUM_SLOW",   -- Charmander
    [5] = "MEDIUM_SLOW",   -- Charmeleon
    [6] = "MEDIUM_SLOW",   -- Charizard
    [7] = "MEDIUM_SLOW",   -- Squirtle
    [8] = "MEDIUM_SLOW",   -- Wartortle
    [9] = "MEDIUM_SLOW",   -- Blastoise
    [10] = "MEDIUM_FAST",  -- Caterpie
    [11] = "MEDIUM_FAST",  -- Metapod
    [12] = "MEDIUM_FAST",  -- Butterfree
    [13] = "MEDIUM_FAST",  -- Weedle
    [14] = "MEDIUM_FAST",  -- Kakuna
    [15] = "MEDIUM_FAST",  -- Beedrill
    [16] = "MEDIUM_SLOW",  -- Pidgey
    [17] = "MEDIUM_SLOW",  -- Pidgeotto
    [18] = "MEDIUM_SLOW",  -- Pidgeot
    [19] = "MEDIUM_FAST",  -- Rattata
    [20] = "MEDIUM_FAST",  -- Raticate
    [21] = "MEDIUM_FAST",  -- Spearow
    [22] = "MEDIUM_FAST",  -- Fearow
    [23] = "MEDIUM_FAST",  -- Ekans
    [24] = "MEDIUM_FAST",  -- Arbok
    [25] = "MEDIUM_FAST",  -- Pikachu
    [26] = "MEDIUM_FAST",  -- Raichu
    [27] = "MEDIUM_FAST",  -- Sandshrew
    [28] = "MEDIUM_FAST",  -- Sandslash
    [29] = "MEDIUM_SLOW",  -- Nidoran♀
    [30] = "MEDIUM_SLOW",  -- Nidorina
    [31] = "MEDIUM_SLOW",  -- Nidoqueen
    [32] = "MEDIUM_SLOW",  -- Nidoran♂
    [33] = "MEDIUM_SLOW",  -- Nidorino
    [34] = "MEDIUM_SLOW",  -- Nidoking
    [35] = "FAST",         -- Clefairy
    [36] = "FAST",         -- Clefable
    [37] = "MEDIUM_FAST",  -- Vulpix
    [38] = "MEDIUM_FAST",  -- Ninetales
    [39] = "FAST",         -- Jigglypuff
    [40] = "FAST",         -- Wigglytuff
    [41] = "MEDIUM_FAST",  -- Zubat
    [42] = "MEDIUM_FAST",  -- Golbat
    [43] = "MEDIUM_SLOW",  -- Oddish
    [44] = "MEDIUM_SLOW",  -- Gloom
    [45] = "MEDIUM_SLOW",  -- Vileplume
    [46] = "MEDIUM_FAST",  -- Paras
    [47] = "MEDIUM_FAST",  -- Parasect
    [48] = "MEDIUM_FAST",  -- Venonat
    [49] = "MEDIUM_FAST",  -- Venomoth
    [50] = "MEDIUM_FAST",  -- Diglett
    -- Add more species as needed...
    
    -- Legendary Pokemon typically use SLOW growth
    [144] = "SLOW",        -- Articuno
    [145] = "SLOW",        -- Zapdos
    [146] = "SLOW",        -- Moltres
    [150] = "SLOW",        -- Mewtwo
    [151] = "MEDIUM_SLOW", -- Mew
}

-- Utility Functions

-- Get experience table for a growth rate
-- @param growthRate: Experience group type
-- @return: Experience table or nil if invalid
function ExperienceGroups.getExperienceTable(growthRate)
    if not growthRate or type(growthRate) ~= "string" then
        return nil
    end
    
    return ExperienceTables[growthRate]
end

-- Get experience required for a level using pre-calculated tables
-- @param level: Target level (1-100)
-- @param growthRate: Experience group type
-- @return: Experience required or 0 if invalid
function ExperienceGroups.getExpForLevel(level, growthRate)
    if not level or level < 1 or level > 100 then
        return 0
    end
    
    local table = ExperienceGroups.getExperienceTable(growthRate)
    if not table then
        return 0
    end
    
    return table[level] or 0
end

-- Get growth rate for a species
-- @param speciesId: Species ID number
-- @return: Growth rate string or default "MEDIUM_FAST"
function ExperienceGroups.getSpeciesGrowthRate(speciesId)
    if not speciesId or type(speciesId) ~= "number" then
        return "MEDIUM_FAST"
    end
    
    return ExperienceGroups.SpeciesGrowthRates[speciesId] or "MEDIUM_FAST"
end

-- Validate growth rate type
-- @param growthRate: Growth rate string to validate
-- @return: Boolean indicating if valid
function ExperienceGroups.isValidGrowthRate(growthRate)
    if not growthRate or type(growthRate) ~= "string" then
        return false
    end
    
    for _, validRate in pairs(ExperienceGroups.Types) do
        if growthRate == validRate then
            return true
        end
    end
    
    return false
end

-- Get level from experience using pre-calculated tables
-- @param exp: Current experience points
-- @param growthRate: Experience group type
-- @return: Current level (1-100)
function ExperienceGroups.getLevelFromExp(exp, growthRate)
    if not exp or exp < 0 then
        return 1
    end
    
    local table = ExperienceGroups.getExperienceTable(growthRate)
    if not table then
        return 1
    end
    
    -- Binary search through the experience table
    local low = 1
    local high = 100
    
    while low < high do
        local mid = math.floor((low + high + 1) / 2)
        local requiredExp = table[mid] or 0
        
        if exp >= requiredExp then
            low = mid
        else
            high = mid - 1
        end
    end
    
    return low
end

-- Get experience difference between consecutive levels
-- @param level: Starting level
-- @param growthRate: Experience group type
-- @return: Experience needed to go from level to level+1
function ExperienceGroups.getExpDifference(level, growthRate)
    if not level or level < 1 or level >= 100 then
        return 0
    end
    
    local currentExp = ExperienceGroups.getExpForLevel(level, growthRate)
    local nextExp = ExperienceGroups.getExpForLevel(level + 1, growthRate)
    
    return nextExp - currentExp
end

-- Get all available growth rate types
-- @return: Array of growth rate strings
function ExperienceGroups.getAllGrowthRates()
    local rates = {}
    for _, rate in pairs(ExperienceGroups.Types) do
        table.insert(rates, rate)
    end
    table.sort(rates)
    return rates
end

-- Performance comparison between growth rates
-- @param level: Level to compare at
-- @return: Table with experience required for each growth rate
function ExperienceGroups.compareGrowthRates(level)
    if not level or level < 1 or level > 100 then
        return {}
    end
    
    local comparison = {}
    for rateName, _ in pairs(ExperienceGroups.Types) do
        comparison[rateName] = ExperienceGroups.getExpForLevel(level, rateName)
    end
    
    return comparison
end

-- Statistics about experience tables
-- @return: Table with statistics about experience requirements
function ExperienceGroups.getStatistics()
    local stats = {
        totalGrowthRates = 0,
        speciesMapped = 0,
        maxExpByRate = {},
        minExpByRate = {}
    }
    
    -- Count growth rates
    for _ in pairs(ExperienceGroups.Types) do
        stats.totalGrowthRates = stats.totalGrowthRates + 1
    end
    
    -- Count mapped species
    for _ in pairs(ExperienceGroups.SpeciesGrowthRates) do
        stats.speciesMapped = stats.speciesMapped + 1
    end
    
    -- Calculate min/max experience for each rate
    for rateName, _ in pairs(ExperienceGroups.Types) do
        local table = ExperienceTables[rateName]
        if table then
            stats.maxExpByRate[rateName] = table[100]  -- Experience at level 100
            stats.minExpByRate[rateName] = table[2]    -- Experience at level 2 (level 1 is always 0)
        end
    end
    
    return stats
end

-- Initialize experience groups (for any setup needed)
function ExperienceGroups.init()
    -- Experience tables are already calculated during module load
    -- This function is available for any future initialization needs
    return true
end

return ExperienceGroups