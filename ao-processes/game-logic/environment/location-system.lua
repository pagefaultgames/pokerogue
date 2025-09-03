--[[
Location System for Pokemon Evolution
Minimal implementation for location-based evolution conditions

Provides:
- Biome/area tracking for evolution requirements
- Location-based evolution condition validation
- Basic location detection from battle context
--]]

local LocationSystem = {}

-- Biome constants for evolution conditions
local BiomeId = {
    TOWN = "TOWN",
    PLAINS = "PLAINS", 
    GRASS = "GRASS",
    TALL_GRASS = "TALL_GRASS",
    METROPOLIS = "METROPOLIS",
    FOREST = "FOREST",
    SEA = "SEA",
    SWAMP = "SWAMP",
    BEACH = "BEACH",
    LAKE = "LAKE",
    SEABED = "SEABED",
    MOUNTAIN = "MOUNTAIN",
    BADLANDS = "BADLANDS",
    CAVE = "CAVE",
    DESERT = "DESERT",
    ICE_CAVE = "ICE_CAVE",
    MEADOW = "MEADOW",
    POWER_PLANT = "POWER_PLANT",
    VOLCANO = "VOLCANO",
    GRAVEYARD = "GRAVEYARD",
    DOJO = "DOJO",
    FACTORY = "FACTORY",
    RUINS = "RUINS",
    WASTELAND = "WASTELAND",
    ABYSS = "ABYSS",
    SPACE = "SPACE",
    CONSTRUCTION_SITE = "CONSTRUCTION_SITE",
    JUNGLE = "JUNGLE",
    FAIRY_CAVE = "FAIRY_CAVE",
    TEMPLE = "TEMPLE",
    SLUM = "SLUM",
    SNOWY_FOREST = "SNOWY_FOREST",
    ISLAND = "ISLAND",
    LABORATORY = "LABORATORY",
    END = "END"
}

-- Special location conditions for evolution
local SpecialLocation = {
    MAGNETIC_FIELD = "MAGNETIC_FIELD", -- For Magnezone, Probopass
    ICY_ROCK = "ICY_ROCK", -- For Glaceon
    MOSSY_ROCK = "MOSSY_ROCK", -- For Leafeon
    ELECTRIC_FIELD = "ELECTRIC_FIELD" -- General electric environment
}

-- Current game location state
local gameLocationState = {
    currentBiome = BiomeId.TOWN, -- Default location
    specialLocations = {}, -- Active special location conditions
    locationOverride = nil -- For testing or specific scenarios
}

-- Initialize location system
-- @param initialBiome: Optional initial biome override
function LocationSystem.init(initialBiome)
    if initialBiome then
        gameLocationState.currentBiome = initialBiome
    end
end

-- Get current biome
-- @return: BiomeId constant
function LocationSystem.getCurrentBiome()
    if gameLocationState.locationOverride then
        return gameLocationState.locationOverride
    end
    
    return gameLocationState.currentBiome
end

-- Set current biome (for testing or manual control)
-- @param biomeId: BiomeId constant to set
function LocationSystem.setBiome(biomeId)
    if BiomeId[biomeId] then
        gameLocationState.locationOverride = biomeId
    end
end

-- Clear location override
function LocationSystem.clearLocationOverride()
    gameLocationState.locationOverride = nil
end

-- Update location from battle context
-- @param battleData: Battle data containing location information
function LocationSystem.updateFromBattleContext(battleData)
    if battleData and battleData.biome then
        gameLocationState.currentBiome = battleData.biome
    elseif battleData and battleData.location then
        -- Map location to biome if needed
        gameLocationState.currentBiome = battleData.location
    end
    
    -- Update special location conditions based on biome
    LocationSystem.updateSpecialLocations()
end

-- Update special location conditions based on current biome
function LocationSystem.updateSpecialLocations()
    gameLocationState.specialLocations = {}
    
    local currentBiome = LocationSystem.getCurrentBiome()
    
    -- Map biomes to special location conditions
    if currentBiome == BiomeId.POWER_PLANT or currentBiome == BiomeId.FACTORY then
        table.insert(gameLocationState.specialLocations, SpecialLocation.MAGNETIC_FIELD)
        table.insert(gameLocationState.specialLocations, SpecialLocation.ELECTRIC_FIELD)
    elseif currentBiome == BiomeId.ICE_CAVE or currentBiome == BiomeId.SNOWY_FOREST then
        table.insert(gameLocationState.specialLocations, SpecialLocation.ICY_ROCK)
    elseif currentBiome == BiomeId.FOREST or currentBiome == BiomeId.JUNGLE then
        table.insert(gameLocationState.specialLocations, SpecialLocation.MOSSY_ROCK)
    end
end

-- Check if current location matches evolution requirement
-- @param requiredBiomes: Array of BiomeId values for evolution condition
-- @return: Boolean indicating if current location matches requirement
function LocationSystem.checkBiomeCondition(requiredBiomes)
    if not requiredBiomes or type(requiredBiomes) ~= "table" then
        return false
    end
    
    local currentBiome = LocationSystem.getCurrentBiome()
    
    for _, biomeRequirement in ipairs(requiredBiomes) do
        if currentBiome == biomeRequirement then
            return true
        end
    end
    
    return false
end

-- Check if special location condition is met
-- @param specialLocationRequirement: Special location requirement
-- @return: Boolean indicating if special location condition is met
function LocationSystem.checkSpecialLocationCondition(specialLocationRequirement)
    if not specialLocationRequirement then
        return true -- No special requirement
    end
    
    for _, activeLocation in ipairs(gameLocationState.specialLocations) do
        if activeLocation == specialLocationRequirement then
            return true
        end
    end
    
    return false
end

-- Check location-based evolution eligibility
-- @param evolutionLocationRequirement: Location requirement from evolution data
-- @return: Boolean indicating if location condition is met
function LocationSystem.checkEvolutionLocationRequirement(evolutionLocationRequirement)
    if not evolutionLocationRequirement then
        return true -- No location requirement
    end
    
    -- Handle biome requirements
    if evolutionLocationRequirement.biomes then
        if not LocationSystem.checkBiomeCondition(evolutionLocationRequirement.biomes) then
            return false
        end
    end
    
    -- Handle special location requirements  
    if evolutionLocationRequirement.specialLocation then
        if not LocationSystem.checkSpecialLocationCondition(evolutionLocationRequirement.specialLocation) then
            return false
        end
    end
    
    return true
end

-- Get readable location description for evolution requirements
-- @param locationRequirement: Location requirement data
-- @return: Human-readable location requirement text
function LocationSystem.getLocationRequirementText(locationRequirement)
    if not locationRequirement then
        return "Any location"
    end
    
    local requirements = {}
    
    if locationRequirement.biomes then
        if #locationRequirement.biomes == 1 then
            table.insert(requirements, locationRequirement.biomes[1]:lower():gsub("_", " "))
        else
            local biomeTexts = {}
            for _, biome in ipairs(locationRequirement.biomes) do
                table.insert(biomeTexts, biome:lower():gsub("_", " "))
            end
            table.insert(requirements, table.concat(biomeTexts, " or "))
        end
    end
    
    if locationRequirement.specialLocation then
        table.insert(requirements, locationRequirement.specialLocation:lower():gsub("_", " "))
    end
    
    if #requirements > 0 then
        return table.concat(requirements, " with ")
    end
    
    return "Special location condition"
end

-- Check if current location has magnetic field (for Magnezone/Probopass evolution)
-- @return: Boolean indicating if magnetic field is present
function LocationSystem.hasMagneticField()
    return LocationSystem.checkSpecialLocationCondition(SpecialLocation.MAGNETIC_FIELD)
end

-- Check if current location has icy rock (for Glaceon evolution)
-- @return: Boolean indicating if icy rock is present
function LocationSystem.hasIcyRock()
    return LocationSystem.checkSpecialLocationCondition(SpecialLocation.ICY_ROCK)
end

-- Check if current location has mossy rock (for Leafeon evolution)
-- @return: Boolean indicating if mossy rock is present
function LocationSystem.hasMossyRock()
    return LocationSystem.checkSpecialLocationCondition(SpecialLocation.MOSSY_ROCK)
end

-- Export constants for other modules
LocationSystem.BiomeId = BiomeId
LocationSystem.SpecialLocation = SpecialLocation

return LocationSystem