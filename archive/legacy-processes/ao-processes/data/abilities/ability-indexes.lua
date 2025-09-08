-- Ability Indexes Implementation
-- Fast lookup optimization for ability access and queries
-- Provides O(1) performance for ability system operations

local AbilityIndexes = {}

-- Index structures for fast ability lookups
AbilityIndexes.indexes = {
    byId = {},              -- Direct ID to ability data mapping
    byName = {},            -- Name to ID mapping (case-insensitive)
    byTrigger = {},         -- Trigger type to ability IDs mapping
    byGeneration = {},      -- Generation to ability IDs mapping
    bySpecies = {},         -- Species to available ability IDs mapping
    passive = {},           -- Passive ability IDs only
    battle = {},            -- Battle ability IDs only
    byPriority = {}         -- Priority-sorted ability lists by trigger
}

-- Initialize all ability indexes
function AbilityIndexes.init()
    local AbilityDatabase = require("data.abilities.ability-database")
    
    -- Ensure ability database is initialized
    if not AbilityDatabase.abilities then
        AbilityDatabase.init()
    end
    
    -- Clear existing indexes
    for indexName, index in pairs(AbilityIndexes.indexes) do
        AbilityIndexes.indexes[indexName] = {}
    end
    
    -- Build all indexes from ability database
    for abilityId, abilityData in pairs(AbilityDatabase.abilities) do
        AbilityIndexes.indexAbility(abilityId, abilityData)
    end
    
    -- Build species-specific indexes
    AbilityIndexes.buildSpeciesIndexes()
    
    -- Build priority indexes
    AbilityIndexes.buildPriorityIndexes()
end

-- Index a single ability across all index structures
function AbilityIndexes.indexAbility(abilityId, abilityData)
    -- Direct ID mapping
    AbilityIndexes.indexes.byId[abilityId] = abilityData
    
    -- Name to ID mapping (case-insensitive)
    local normalizedName = abilityData.name:upper():gsub(" ", "_")
    AbilityIndexes.indexes.byName[normalizedName] = abilityId
    
    -- Trigger-based indexing
    for _, trigger in ipairs(abilityData.triggers or {}) do
        if not AbilityIndexes.indexes.byTrigger[trigger] then
            AbilityIndexes.indexes.byTrigger[trigger] = {}
        end
        table.insert(AbilityIndexes.indexes.byTrigger[trigger], abilityId)
    end
    
    -- Generation-based indexing
    local generation = abilityData.generation
    if not AbilityIndexes.indexes.byGeneration[generation] then
        AbilityIndexes.indexes.byGeneration[generation] = {}
    end
    table.insert(AbilityIndexes.indexes.byGeneration[generation], abilityId)
    
    -- Passive vs battle ability separation
    if abilityData.isPassive then
        AbilityIndexes.indexes.passive[abilityId] = true
    else
        AbilityIndexes.indexes.battle[abilityId] = true
    end
end

-- Build species-specific ability indexes from species database
function AbilityIndexes.buildSpeciesIndexes()
    local SpeciesDatabase = require("data.species.species-database")
    
    -- Ensure species database is initialized
    if not SpeciesDatabase.species then
        SpeciesDatabase.init()
    end
    
    -- Index abilities by species compatibility
    for speciesId, speciesData in pairs(SpeciesDatabase.species) do
        local speciesAbilities = {}
        
        -- Add regular abilities
        if speciesData.ability1 then
            local abilityId = AbilityIndexes.getAbilityIdByName(speciesData.ability1)
            if abilityId then
                table.insert(speciesAbilities, {id = abilityId, slot = 1, hidden = false})
            end
        end
        
        if speciesData.ability2 then
            local abilityId = AbilityIndexes.getAbilityIdByName(speciesData.ability2)
            if abilityId then
                table.insert(speciesAbilities, {id = abilityId, slot = 2, hidden = false})
            end
        end
        
        -- Add hidden ability
        if speciesData.abilityHidden then
            local abilityId = AbilityIndexes.getAbilityIdByName(speciesData.abilityHidden)
            if abilityId then
                table.insert(speciesAbilities, {id = abilityId, slot = 4, hidden = true})
            end
        end
        
        AbilityIndexes.indexes.bySpecies[speciesId] = speciesAbilities
    end
end

-- Build priority-sorted indexes for efficient trigger resolution
function AbilityIndexes.buildPriorityIndexes()
    local AbilityEffects = require("data.abilities.ability-effects")
    
    for trigger, abilityIds in pairs(AbilityIndexes.indexes.byTrigger) do
        -- Sort abilities by trigger priority
        local prioritizedAbilities = {}
        for _, abilityId in ipairs(abilityIds) do
            table.insert(prioritizedAbilities, {
                id = abilityId,
                priority = AbilityEffects.getTriggerPriority(abilityId, trigger)
            })
        end
        
        -- Sort by priority (highest first)
        table.sort(prioritizedAbilities, function(a, b)
            return a.priority > b.priority
        end)
        
        -- Store priority-sorted list
        AbilityIndexes.indexes.byPriority[trigger] = prioritizedAbilities
    end
end

-- Fast ability lookup by ID
function AbilityIndexes.getAbilityById(abilityId)
    if not AbilityIndexes.indexes.byId or not next(AbilityIndexes.indexes.byId) then
        AbilityIndexes.init()
    end
    return AbilityIndexes.indexes.byId[abilityId]
end

-- Fast ability ID lookup by name
function AbilityIndexes.getAbilityIdByName(name)
    if not AbilityIndexes.indexes.byName or not next(AbilityIndexes.indexes.byName) then
        AbilityIndexes.init()
    end
    local normalizedName = name:upper():gsub(" ", "_")
    return AbilityIndexes.indexes.byName[normalizedName]
end

-- Get abilities by trigger type (with priority sorting)
function AbilityIndexes.getAbilitiesByTrigger(trigger, prioritySorted)
    if not AbilityIndexes.indexes.byTrigger or not next(AbilityIndexes.indexes.byTrigger) then
        AbilityIndexes.init()
    end
    
    if prioritySorted and AbilityIndexes.indexes.byPriority[trigger] then
        return AbilityIndexes.indexes.byPriority[trigger]
    end
    
    return AbilityIndexes.indexes.byTrigger[trigger] or {}
end

-- Get abilities available to a species
function AbilityIndexes.getSpeciesAbilities(speciesId)
    if not AbilityIndexes.indexes.bySpecies or not next(AbilityIndexes.indexes.bySpecies) then
        AbilityIndexes.init()
    end
    return AbilityIndexes.indexes.bySpecies[speciesId] or {}
end

-- Get abilities by generation
function AbilityIndexes.getAbilitiesByGeneration(generation)
    if not AbilityIndexes.indexes.byGeneration or not next(AbilityIndexes.indexes.byGeneration) then
        AbilityIndexes.init()
    end
    return AbilityIndexes.indexes.byGeneration[generation] or {}
end

-- Check if ability is passive
function AbilityIndexes.isPassiveAbility(abilityId)
    if not AbilityIndexes.indexes.passive or not next(AbilityIndexes.indexes.passive) then
        AbilityIndexes.init()
    end
    return AbilityIndexes.indexes.passive[abilityId] == true
end

-- Check if ability is battle ability
function AbilityIndexes.isBattleAbility(abilityId)
    if not AbilityIndexes.indexes.battle or not next(AbilityIndexes.indexes.battle) then
        AbilityIndexes.init()
    end
    return AbilityIndexes.indexes.battle[abilityId] == true
end

-- Validate species ability compatibility
function AbilityIndexes.validateSpeciesAbility(speciesId, abilityId, abilitySlot)
    local speciesAbilities = AbilityIndexes.getSpeciesAbilities(speciesId)
    
    for _, abilityInfo in ipairs(speciesAbilities) do
        if abilityInfo.id == abilityId then
            -- Check slot compatibility if specified
            if abilitySlot and abilityInfo.slot ~= abilitySlot then
                return false
            end
            return true
        end
    end
    
    return false
end

-- Get available ability slots for species
function AbilityIndexes.getSpeciesAbilitySlots(speciesId)
    local speciesAbilities = AbilityIndexes.getSpeciesAbilities(speciesId)
    local slots = {}
    
    for _, abilityInfo in ipairs(speciesAbilities) do
        slots[abilityInfo.slot] = abilityInfo.id
    end
    
    return slots
end

-- Search abilities by partial name match
function AbilityIndexes.searchAbilitiesByName(partialName)
    if not AbilityIndexes.indexes.byName or not next(AbilityIndexes.indexes.byName) then
        AbilityIndexes.init()
    end
    
    local matches = {}
    local searchTerm = partialName:upper()
    
    for abilityName, abilityId in pairs(AbilityIndexes.indexes.byName) do
        if abilityName:find(searchTerm, 1, true) then
            local abilityData = AbilityIndexes.getAbilityById(abilityId)
            if abilityData then
                table.insert(matches, {
                    id = abilityId,
                    name = abilityData.name,
                    description = abilityData.description
                })
            end
        end
    end
    
    -- Sort matches by name
    table.sort(matches, function(a, b) return a.name < b.name end)
    
    return matches
end

-- Get index statistics for debugging
function AbilityIndexes.getIndexStats()
    if not AbilityIndexes.indexes.byId or not next(AbilityIndexes.indexes.byId) then
        AbilityIndexes.init()
    end
    
    local stats = {
        totalAbilities = 0,
        byTriggerCounts = {},
        byGenerationCounts = {},
        passiveCount = 0,
        battleCount = 0,
        speciesCount = 0
    }
    
    -- Count total abilities
    for _ in pairs(AbilityIndexes.indexes.byId) do
        stats.totalAbilities = stats.totalAbilities + 1
    end
    
    -- Count by trigger
    for trigger, abilities in pairs(AbilityIndexes.indexes.byTrigger) do
        stats.byTriggerCounts[trigger] = #abilities
    end
    
    -- Count by generation
    for generation, abilities in pairs(AbilityIndexes.indexes.byGeneration) do
        stats.byGenerationCounts[generation] = #abilities
    end
    
    -- Count passive and battle abilities
    for _ in pairs(AbilityIndexes.indexes.passive) do
        stats.passiveCount = stats.passiveCount + 1
    end
    
    for _ in pairs(AbilityIndexes.indexes.battle) do
        stats.battleCount = stats.battleCount + 1
    end
    
    -- Count species with abilities
    for _ in pairs(AbilityIndexes.indexes.bySpecies) do
        stats.speciesCount = stats.speciesCount + 1
    end
    
    return stats
end

-- Rebuild all indexes (for maintenance)
function AbilityIndexes.rebuild()
    AbilityIndexes.init()
    return true
end

return AbilityIndexes