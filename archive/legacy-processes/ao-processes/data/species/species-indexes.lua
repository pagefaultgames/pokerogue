-- Species Indexes for Fast Data Access
-- Optimized lookup indexes for species database with O(1) performance
-- Compatible with AO process memory constraints and access patterns

local SpeciesIndexes = {}

-- Adjust package path to find modules from project root
package.path = package.path .. ";../../../?.lua;../../../../?.lua"

-- Import species database for index initialization  
local SpeciesDatabase = require('ao-processes.data.species.species-database')

-- Index storage structures
SpeciesIndexes.indexes = {
    byId = {},           -- ID -> species data (O(1) lookup)
    byName = {},         -- normalized name -> species ID
    byType = {},         -- type -> array of species IDs  
    byEggGroup = {},     -- egg group -> array of species IDs
    byBiome = {},        -- biome -> array of species IDs
    byRarity = {},       -- rarity -> array of species IDs
    byGeneration = {},   -- generation -> array of species IDs
    byBaseStatTotal = {} -- BST range -> array of species IDs
}

-- Index metadata
SpeciesIndexes.metadata = {
    lastUpdated = nil,
    indexCount = 0,
    speciesCount = 0,
    performanceStats = {
        lookupCount = 0,
        averageLookupTime = 0
    }
}

-- Normalize string for case-insensitive matching
-- @param str: Input string to normalize
-- @return: Normalized lowercase string with trimmed whitespace
local function normalizeString(str)
    if not str or type(str) ~= "string" then
        return ""
    end
    return string.lower(string.gsub(str, "^%s*(.-)%s*$", "%1"))
end

-- Initialize all indexes from species database
-- @return: Boolean success status, error message if failed
function SpeciesIndexes.buildIndexes()
    local startTime = os.time()
    
    -- Clear existing indexes
    for indexType, _ in pairs(SpeciesIndexes.indexes) do
        SpeciesIndexes.indexes[indexType] = {}
    end
    
    -- Get all species from database
    local allSpeciesIds = SpeciesDatabase.getAllSpeciesIds()
    local indexedCount = 0
    
    for _, speciesId in ipairs(allSpeciesIds) do
        local species = SpeciesDatabase.getSpecies(speciesId)
        if species then
            -- ID index (direct mapping)
            SpeciesIndexes.indexes.byId[speciesId] = species
            
            -- Name index (normalized for fast lookup)
            if species.name then
                local normalizedName = normalizeString(species.name)
                SpeciesIndexes.indexes.byName[normalizedName] = speciesId
            end
            
            -- Type indexes
            if species.type1 then
                if not SpeciesIndexes.indexes.byType[species.type1] then
                    SpeciesIndexes.indexes.byType[species.type1] = {}
                end
                table.insert(SpeciesIndexes.indexes.byType[species.type1], speciesId)
            end
            
            if species.type2 then
                if not SpeciesIndexes.indexes.byType[species.type2] then
                    SpeciesIndexes.indexes.byType[species.type2] = {}
                end
                table.insert(SpeciesIndexes.indexes.byType[species.type2], speciesId)
            end
            
            -- Egg group indexes
            if species.eggGroups then
                for _, eggGroup in ipairs(species.eggGroups) do
                    if not SpeciesIndexes.indexes.byEggGroup[eggGroup] then
                        SpeciesIndexes.indexes.byEggGroup[eggGroup] = {}
                    end
                    table.insert(SpeciesIndexes.indexes.byEggGroup[eggGroup], speciesId)
                end
            end
            
            -- Biome indexes
            if species.biomes then
                for _, biome in ipairs(species.biomes) do
                    if not SpeciesIndexes.indexes.byBiome[biome] then
                        SpeciesIndexes.indexes.byBiome[biome] = {}
                    end
                    table.insert(SpeciesIndexes.indexes.byBiome[biome], speciesId)
                end
            end
            
            -- Rarity index
            if species.rarity then
                if not SpeciesIndexes.indexes.byRarity[species.rarity] then
                    SpeciesIndexes.indexes.byRarity[species.rarity] = {}
                end
                table.insert(SpeciesIndexes.indexes.byRarity[species.rarity], speciesId)
            end
            
            -- Generation index
            if species.generation then
                if not SpeciesIndexes.indexes.byGeneration[species.generation] then
                    SpeciesIndexes.indexes.byGeneration[species.generation] = {}
                end
                table.insert(SpeciesIndexes.indexes.byGeneration[species.generation], speciesId)
            end
            
            -- Base stat total index (in ranges for efficient filtering)
            if species.baseStats then
                local bst = species.baseStats[1] + species.baseStats[2] + species.baseStats[3] + 
                          species.baseStats[4] + species.baseStats[5] + species.baseStats[6]
                local bstRange = math.floor(bst / 100) * 100 -- Group by 100s (0-99, 100-199, etc)
                
                if not SpeciesIndexes.indexes.byBaseStatTotal[bstRange] then
                    SpeciesIndexes.indexes.byBaseStatTotal[bstRange] = {}
                end
                table.insert(SpeciesIndexes.indexes.byBaseStatTotal[bstRange], speciesId)
            end
            
            indexedCount = indexedCount + 1
        end
    end
    
    -- Sort all array indexes for consistent ordering
    for indexType, indexData in pairs(SpeciesIndexes.indexes) do
        if indexType ~= "byId" and indexType ~= "byName" then
            for key, arr in pairs(indexData) do
                if type(arr) == "table" and #arr > 0 then
                    table.sort(arr)
                end
            end
        end
    end
    
    -- Update metadata
    SpeciesIndexes.metadata.lastUpdated = os.time()
    SpeciesIndexes.metadata.indexCount = indexedCount
    SpeciesIndexes.metadata.speciesCount = indexedCount
    
    local buildTime = os.time() - startTime
    return true, "Built indexes for " .. indexedCount .. " species in " .. buildTime .. "s"
end

-- Fast species lookup by ID (O(1))
-- @param speciesId: Species ID number
-- @return: Species data or nil
function SpeciesIndexes.getSpeciesById(speciesId)
    local startTime = os.clock()
    local species = SpeciesIndexes.indexes.byId[speciesId]
    SpeciesIndexes.updatePerformanceStats(os.clock() - startTime)
    return species
end

-- Fast species lookup by name (O(1))
-- @param name: Species name (case-insensitive)
-- @return: Species ID or nil
function SpeciesIndexes.getSpeciesIdByName(name)
    local startTime = os.clock()
    local normalizedName = normalizeString(name)
    local speciesId = SpeciesIndexes.indexes.byName[normalizedName]
    SpeciesIndexes.updatePerformanceStats(os.clock() - startTime)
    return speciesId
end

-- Get species by type (indexed lookup)
-- @param pokemonType: Type name
-- @return: Array of species IDs with that type
function SpeciesIndexes.getSpeciesByType(pokemonType)
    local startTime = os.clock()
    local result = SpeciesIndexes.indexes.byType[pokemonType] or {}
    SpeciesIndexes.updatePerformanceStats(os.clock() - startTime)
    return result
end

-- Get species by egg group (indexed lookup)
-- @param eggGroup: Egg group name
-- @return: Array of species IDs in that egg group
function SpeciesIndexes.getSpeciesByEggGroup(eggGroup)
    local startTime = os.clock()
    local result = SpeciesIndexes.indexes.byEggGroup[eggGroup] or {}
    SpeciesIndexes.updatePerformanceStats(os.clock() - startTime)
    return result
end

-- Get species by biome (indexed lookup)
-- @param biome: Biome name  
-- @return: Array of species IDs in that biome
function SpeciesIndexes.getSpeciesByBiome(biome)
    local startTime = os.clock()
    local result = SpeciesIndexes.indexes.byBiome[biome] or {}
    SpeciesIndexes.updatePerformanceStats(os.clock() - startTime)
    return result
end

-- Get species by rarity (indexed lookup)
-- @param rarity: Rarity level
-- @return: Array of species IDs with that rarity
function SpeciesIndexes.getSpeciesByRarity(rarity)
    local startTime = os.clock()
    local result = SpeciesIndexes.indexes.byRarity[rarity] or {}
    SpeciesIndexes.updatePerformanceStats(os.clock() - startTime)
    return result
end

-- Get species by generation (indexed lookup)
-- @param generation: Generation number
-- @return: Array of species IDs from that generation
function SpeciesIndexes.getSpeciesByGeneration(generation)
    local startTime = os.clock()
    local result = SpeciesIndexes.indexes.byGeneration[generation] or {}
    SpeciesIndexes.updatePerformanceStats(os.clock() - startTime)
    return result
end

-- Get species by base stat total range (indexed lookup)
-- @param minBST: Minimum base stat total
-- @param maxBST: Maximum base stat total (optional)
-- @return: Array of species IDs in BST range
function SpeciesIndexes.getSpeciesByBSTRange(minBST, maxBST)
    local startTime = os.clock()
    local result = {}
    
    maxBST = maxBST or minBST + 99 -- Default to 100-point range
    
    local minRange = math.floor(minBST / 100) * 100
    local maxRange = math.floor(maxBST / 100) * 100
    
    for bstRange = minRange, maxRange, 100 do
        local speciesInRange = SpeciesIndexes.indexes.byBaseStatTotal[bstRange] or {}
        for _, speciesId in ipairs(speciesInRange) do
            local species = SpeciesIndexes.indexes.byId[speciesId]
            if species and species.baseStats then
                local bst = species.baseStats[1] + species.baseStats[2] + species.baseStats[3] + 
                          species.baseStats[4] + species.baseStats[5] + species.baseStats[6]
                if bst >= minBST and bst <= maxBST then
                    table.insert(result, speciesId)
                end
            end
        end
    end
    
    table.sort(result)
    SpeciesIndexes.updatePerformanceStats(os.clock() - startTime)
    return result
end

-- Update performance statistics
-- @param lookupTime: Time taken for lookup operation
function SpeciesIndexes.updatePerformanceStats(lookupTime)
    local stats = SpeciesIndexes.metadata.performanceStats
    stats.lookupCount = stats.lookupCount + 1
    
    -- Running average of lookup times
    stats.averageLookupTime = ((stats.averageLookupTime * (stats.lookupCount - 1)) + lookupTime) / stats.lookupCount
end

-- Get all available index types
-- @return: Array of index type names
function SpeciesIndexes.getAvailableIndexes()
    local indexes = {}
    for indexType, _ in pairs(SpeciesIndexes.indexes) do
        table.insert(indexes, indexType)
    end
    table.sort(indexes)
    return indexes
end

-- Get index statistics
-- @return: Table with index usage and performance data
function SpeciesIndexes.getIndexStats()
    local stats = {
        indexTypes = {},
        totalLookups = SpeciesIndexes.metadata.performanceStats.lookupCount,
        averageLookupTime = SpeciesIndexes.metadata.performanceStats.averageLookupTime,
        lastUpdated = SpeciesIndexes.metadata.lastUpdated,
        speciesCount = SpeciesIndexes.metadata.speciesCount
    }
    
    -- Count entries in each index type
    for indexType, indexData in pairs(SpeciesIndexes.indexes) do
        local count = 0
        if indexType == "byId" or indexType == "byName" then
            for _ in pairs(indexData) do
                count = count + 1
            end
        else
            for _, arr in pairs(indexData) do
                if type(arr) == "table" then
                    count = count + #arr
                end
            end
        end
        stats.indexTypes[indexType] = count
    end
    
    return stats
end

-- Rebuild indexes if data has changed
-- @return: Boolean success status
function SpeciesIndexes.rebuildIfNeeded()
    local currentSpeciesCount = SpeciesDatabase.getSpeciesCount()
    
    if currentSpeciesCount ~= SpeciesIndexes.metadata.speciesCount or 
       not SpeciesIndexes.metadata.lastUpdated then
        return SpeciesIndexes.buildIndexes()
    end
    
    return true, "Indexes are up to date"
end

-- Validate index integrity
-- @return: Boolean validity, array of errors if invalid
function SpeciesIndexes.validateIndexes()
    local errors = {}
    
    -- Check if indexes are populated
    if not SpeciesIndexes.metadata.lastUpdated then
        table.insert(errors, "Indexes not initialized")
        return false, errors
    end
    
    -- Validate ID index completeness
    local speciesCount = SpeciesDatabase.getSpeciesCount()
    local idIndexCount = 0
    for _ in pairs(SpeciesIndexes.indexes.byId) do
        idIndexCount = idIndexCount + 1
    end
    
    if idIndexCount ~= speciesCount then
        table.insert(errors, "ID index count mismatch: " .. idIndexCount .. " vs " .. speciesCount)
    end
    
    -- Validate name index integrity
    for name, speciesId in pairs(SpeciesIndexes.indexes.byName) do
        local species = SpeciesIndexes.indexes.byId[speciesId]
        if not species then
            table.insert(errors, "Name index references missing species: " .. speciesId)
        elseif normalizeString(species.name) ~= name then
            table.insert(errors, "Name index normalization mismatch: " .. name .. " vs " .. normalizeString(species.name))
        end
    end
    
    return #errors == 0, errors
end

-- Initialize indexes on module load
local success, message = SpeciesIndexes.buildIndexes()
if not success then
    error("Failed to build species indexes: " .. tostring(message))
end

return SpeciesIndexes