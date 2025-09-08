--[[
Species Manager
Species data access and validation for Pokemon process

Features:
- Species data lookup and caching
- Evolution chain access
- Base stats and typing information
- Move learning data
- Species validation and integrity checking
--]]

local SpeciesManager = {}

-- Import species data
local SpeciesDatabase = require("data.species.species-database")
local EvolutionChains = require("data.species.evolution-chains")

-- Cache for frequently accessed species data
local speciesCache = {}
local evolutionCache = {}
local statistics = {
    lookups = 0,
    cacheHits = 0,
    cacheMisses = 0,
    validationChecks = 0
}

-- Initialize manager
function SpeciesManager.initialize()
    print("[Pokemon] SpeciesManager initialized")
    SpeciesDatabase.init()
    EvolutionChains.init()
    speciesCache = {}
    evolutionCache = {}
end

-- Species Data Access

-- Get species data by ID
-- @param speciesId: Species ID from SpeciesId enum
-- @return: Species data or nil if not found
function SpeciesManager.getSpecies(speciesId)
    if not speciesId then
        return nil
    end
    
    statistics.lookups = statistics.lookups + 1
    
    -- Check cache first
    if speciesCache[speciesId] then
        statistics.cacheHits = statistics.cacheHits + 1
        return speciesCache[speciesId]
    end
    
    statistics.cacheMisses = statistics.cacheMisses + 1
    
    -- Get from database
    local speciesData = SpeciesDatabase.getSpecies(speciesId)
    if speciesData then
        -- Cache the data
        speciesCache[speciesId] = speciesData
    end
    
    return speciesData
end

-- Get multiple species data
-- @param speciesIds: Array of species IDs
-- @return: Table mapping species ID to species data
function SpeciesManager.getMultipleSpecies(speciesIds)
    if not speciesIds or #speciesIds == 0 then
        return {}
    end
    
    local results = {}
    for _, speciesId in ipairs(speciesIds) do
        local speciesData = SpeciesManager.getSpecies(speciesId)
        if speciesData then
            results[speciesId] = speciesData
        end
    end
    
    return results
end

-- Evolution Chain Access

-- Get evolution chain for species
-- @param speciesId: Species ID
-- @return: Evolution chain data
function SpeciesManager.getEvolutionChain(speciesId)
    if not speciesId then
        return nil
    end
    
    -- Check evolution cache
    if evolutionCache[speciesId] then
        return evolutionCache[speciesId]
    end
    
    -- Get from evolution chains
    local chainData = EvolutionChains.getFullEvolutionChain(speciesId)
    if chainData then
        evolutionCache[speciesId] = chainData
    end
    
    return chainData
end

-- Get available evolutions for species
-- @param speciesId: Species ID
-- @return: Array of evolution data
function SpeciesManager.getEvolutionsForSpecies(speciesId)
    if not speciesId then
        return {}
    end
    
    return EvolutionChains.getEvolutionsForSpecies(speciesId) or {}
end

-- Get pre-evolutions for species
-- @param speciesId: Species ID
-- @return: Array of species IDs that evolve into this species
function SpeciesManager.getPreEvolutions(speciesId)
    if not speciesId then
        return {}
    end
    
    return EvolutionChains.getPreEvolutionsForSpecies(speciesId) or {}
end

-- Species Validation

-- Validate species exists
-- @param speciesId: Species ID to validate
-- @return: Boolean indicating if species exists
function SpeciesManager.speciesExists(speciesId)
    statistics.validationChecks = statistics.validationChecks + 1
    return SpeciesManager.getSpecies(speciesId) ~= nil
end

-- Validate species ID format
-- @param speciesId: Species ID to validate
-- @return: Boolean indicating if ID format is valid, error message
function SpeciesManager.validateSpeciesId(speciesId)
    if not speciesId then
        return false, "Species ID is required"
    end
    
    if type(speciesId) ~= "string" and type(speciesId) ~= "number" then
        return false, "Species ID must be string or number"
    end
    
    if type(speciesId) == "string" and speciesId == "" then
        return false, "Species ID cannot be empty string"
    end
    
    if type(speciesId) == "number" and (speciesId < 1 or speciesId ~= math.floor(speciesId)) then
        return false, "Species ID must be positive integer if number"
    end
    
    return true
end

-- Species Information Queries

-- Get base stats for species
-- @param speciesId: Species ID
-- @return: Base stats array or nil
function SpeciesManager.getBaseStats(speciesId)
    local speciesData = SpeciesManager.getSpecies(speciesId)
    return speciesData and speciesData.baseStats
end

-- Get typing for species
-- @param speciesId: Species ID
-- @return: Array of types or nil
function SpeciesManager.getTypes(speciesId)
    local speciesData = SpeciesManager.getSpecies(speciesId)
    return speciesData and speciesData.types
end

-- Get abilities for species
-- @param speciesId: Species ID
-- @return: Abilities data or nil
function SpeciesManager.getAbilities(speciesId)
    local speciesData = SpeciesManager.getSpecies(speciesId)
    return speciesData and speciesData.abilities
end

-- Get species name
-- @param speciesId: Species ID
-- @return: Species name or nil
function SpeciesManager.getSpeciesName(speciesId)
    local speciesData = SpeciesManager.getSpecies(speciesId)
    return speciesData and speciesData.name
end

-- Get growth rate for species
-- @param speciesId: Species ID
-- @return: Growth rate string or nil
function SpeciesManager.getGrowthRate(speciesId)
    local speciesData = SpeciesManager.getSpecies(speciesId)
    return speciesData and speciesData.growthRate or "MEDIUM_FAST"
end

-- Get gender ratio for species
-- @param speciesId: Species ID
-- @return: Gender ratio or nil
function SpeciesManager.getGenderRatio(speciesId)
    local speciesData = SpeciesManager.getSpecies(speciesId)
    return speciesData and speciesData.genderRatio
end

-- Species Searching

-- Find species by name
-- @param name: Species name to search for
-- @return: Array of matching species data
function SpeciesManager.findSpeciesByName(name)
    if not name or name == "" then
        return {}
    end
    
    local results = {}
    local namePattern = string.lower(name)
    
    -- This would need to iterate through species database
    -- For now, return empty array as species search is not commonly needed
    return results
end

-- Find species by type
-- @param pokemonType: Type to search for
-- @return: Array of species IDs with that type
function SpeciesManager.findSpeciesByType(pokemonType)
    if not pokemonType then
        return {}
    end
    
    local results = {}
    -- This would iterate through species database to find matching types
    return results
end

-- Evolution Validation

-- Check if species can evolve
-- @param speciesId: Species ID
-- @return: Boolean indicating if species has evolutions
function SpeciesManager.canSpeciesEvolve(speciesId)
    local evolutions = SpeciesManager.getEvolutionsForSpecies(speciesId)
    return #evolutions > 0
end

-- Check if evolution is valid
-- @param fromSpeciesId: Source species
-- @param toSpeciesId: Target species
-- @return: Boolean indicating if evolution is valid
function SpeciesManager.isValidEvolution(fromSpeciesId, toSpeciesId)
    local evolutions = SpeciesManager.getEvolutionsForSpecies(fromSpeciesId)
    
    for _, evolution in ipairs(evolutions) do
        if evolution.toSpeciesId == toSpeciesId then
            return true
        end
    end
    
    return false
end

-- Cache Management

-- Clear species cache
function SpeciesManager.clearCache()
    speciesCache = {}
    evolutionCache = {}
    print("[Pokemon] SpeciesManager cache cleared")
end

-- Warm cache with commonly used species
-- @param speciesIds: Array of species IDs to cache
function SpeciesManager.warmCache(speciesIds)
    if not speciesIds then
        return
    end
    
    for _, speciesId in ipairs(speciesIds) do
        SpeciesManager.getSpecies(speciesId)
    end
    
    print("[Pokemon] Warmed species cache with " .. #speciesIds .. " species")
end

-- Get cache statistics
-- @return: Cache statistics
function SpeciesManager.getCacheStatistics()
    local cacheSize = 0
    for _ in pairs(speciesCache) do
        cacheSize = cacheSize + 1
    end
    
    local evolutionCacheSize = 0
    for _ in pairs(evolutionCache) do
        evolutionCacheSize = evolutionCacheSize + 1
    end
    
    return {
        speciesCacheSize = cacheSize,
        evolutionCacheSize = evolutionCacheSize,
        hitRatio = statistics.lookups > 0 and (statistics.cacheHits / statistics.lookups) or 0
    }
end

-- Maintenance

-- Perform maintenance tasks
function SpeciesManager.performMaintenance()
    local currentTime = 0
    
    -- Species data doesn't typically need cleanup as it's static
    -- but we could limit cache size if needed
    local cacheStats = SpeciesManager.getCacheStatistics()
    if cacheStats.speciesCacheSize > 1000 then
        -- Keep only most recently accessed species in cache
        -- For now, just log the situation
        print("[Pokemon] SpeciesManager cache is large (" .. cacheStats.speciesCacheSize .. " entries)")
    end
end

-- Get statistics
function SpeciesManager.getStatistics()
    local cacheStats = SpeciesManager.getCacheStatistics()
    
    return {
        lookups = statistics.lookups,
        cacheHits = statistics.cacheHits,
        cacheMisses = statistics.cacheMisses,
        hitRatio = statistics.lookups > 0 and (statistics.cacheHits / statistics.lookups) or 0,
        validationChecks = statistics.validationChecks,
        speciesCacheSize = cacheStats.speciesCacheSize,
        evolutionCacheSize = cacheStats.evolutionCacheSize
    }
end

-- Export for testing
SpeciesManager._internal = {
    speciesCache = speciesCache,
    evolutionCache = evolutionCache,
    statistics = statistics
}

return SpeciesManager