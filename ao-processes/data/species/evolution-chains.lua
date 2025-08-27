-- Evolution Chains Database for AO Process
-- Stores complete evolution relationships and conditions for all Pokemon species
-- Compatible with TypeScript reference implementation

local EvolutionChains = {}

-- Evolution condition types
local EvolutionTrigger = {
    LEVEL = "level",
    LEVEL_ATK_GT_DEF = "level_atk_gt_def", 
    LEVEL_ATK_EQ_DEF = "level_atk_eq_def",
    LEVEL_ATK_LT_DEF = "level_atk_lt_def",
    LEVEL_FEMALE = "level_female",
    LEVEL_MALE = "level_male",
    ITEM = "item",
    FRIENDSHIP = "friendship",
    FRIENDSHIP_DAY = "friendship_day",
    FRIENDSHIP_NIGHT = "friendship_night",
    TRADE = "trade",
    TRADE_ITEM = "trade_item",
    STONE = "stone",
    LEVEL_MOVE = "level_move",
    OTHER_POKEMON = "other_pokemon",
    SPECIAL = "special"
}

-- Evolution data structure for each species
-- Format: [fromSpeciesId] = { { toSpeciesId, conditions } }
local evolutionData = {
    -- Bulbasaur evolution line
    [1] = { -- Bulbasaur
        {
            toSpeciesId = 2,
            trigger = EvolutionTrigger.LEVEL,
            level = 16
        }
    },
    [2] = { -- Ivysaur  
        {
            toSpeciesId = 3,
            trigger = EvolutionTrigger.LEVEL,
            level = 32
        }
    },
    -- Charmander evolution line
    [4] = { -- Charmander
        {
            toSpeciesId = 5,
            trigger = EvolutionTrigger.LEVEL,
            level = 16
        }
    },
    [5] = { -- Charmeleon
        {
            toSpeciesId = 6,
            trigger = EvolutionTrigger.LEVEL,
            level = 36
        }
    },
    -- Squirtle evolution line  
    [7] = { -- Squirtle
        {
            toSpeciesId = 8,
            trigger = EvolutionTrigger.LEVEL,
            level = 16
        }
    },
    [8] = { -- Wartortle
        {
            toSpeciesId = 9,
            trigger = EvolutionTrigger.LEVEL,
            level = 36
        }
    }
}

-- Get evolution data for a specific species
function EvolutionChains.getEvolutionData(speciesId)
    if not speciesId or type(speciesId) ~= "number" then
        return nil, "Invalid species ID"
    end
    
    return evolutionData[speciesId] or {}
end

-- Get all possible evolutions for a species
function EvolutionChains.getPossibleEvolutions(speciesId)
    local evolutions = EvolutionChains.getEvolutionData(speciesId)
    local result = {}
    
    for _, evolution in ipairs(evolutions) do
        table.insert(result, {
            speciesId = evolution.toSpeciesId,
            trigger = evolution.trigger,
            level = evolution.level,
            item = evolution.item,
            move = evolution.move,
            otherPokemon = evolution.otherPokemon,
            friendship = evolution.friendship,
            timeOfDay = evolution.timeOfDay,
            gender = evolution.gender,
            stats = evolution.stats
        })
    end
    
    return result
end

-- Check if a species can evolve
function EvolutionChains.canEvolve(speciesId)
    local evolutions = EvolutionChains.getEvolutionData(speciesId)
    return #evolutions > 0
end

-- Get evolution chain for a species (all forms in the line)
function EvolutionChains.getEvolutionChain(speciesId)
    local chain = {}
    local visited = {}
    
    -- Find the base form by going backwards
    local currentId = speciesId
    local baseId = speciesId
    
    -- Search backwards to find base form
    for fromId, evolutions in pairs(evolutionData) do
        for _, evolution in ipairs(evolutions) do
            if evolution.toSpeciesId == currentId then
                baseId = fromId
                break
            end
        end
    end
    
    -- Build forward chain from base
    local function buildChain(fromId, depth)
        if visited[fromId] or depth > 10 then -- Prevent infinite loops
            return
        end
        
        visited[fromId] = true
        table.insert(chain, fromId)
        
        local evolutions = evolutionData[fromId]
        if evolutions then
            for _, evolution in ipairs(evolutions) do
                buildChain(evolution.toSpeciesId, depth + 1)
            end
        end
    end
    
    buildChain(baseId, 0)
    return chain
end

-- Validate evolution conditions for a Pokemon
function EvolutionChains.validateEvolutionConditions(speciesId, pokemonData, conditions)
    if not conditions then
        return false, "No evolution conditions provided"
    end
    
    local trigger = conditions.trigger
    local level = pokemonData.level or 1
    local stats = pokemonData.stats or {}
    
    if trigger == EvolutionTrigger.LEVEL then
        return level >= (conditions.level or 1)
    elseif trigger == EvolutionTrigger.LEVEL_ATK_GT_DEF then
        return level >= (conditions.level or 1) and (stats.attack or 0) > (stats.defense or 0)
    elseif trigger == EvolutionTrigger.LEVEL_ATK_EQ_DEF then
        return level >= (conditions.level or 1) and (stats.attack or 0) == (stats.defense or 0)
    elseif trigger == EvolutionTrigger.LEVEL_ATK_LT_DEF then
        return level >= (conditions.level or 1) and (stats.attack or 0) < (stats.defense or 0)
    elseif trigger == EvolutionTrigger.LEVEL_FEMALE then
        return level >= (conditions.level or 1) and pokemonData.gender == "female"
    elseif trigger == EvolutionTrigger.LEVEL_MALE then
        return level >= (conditions.level or 1) and pokemonData.gender == "male"
    elseif trigger == EvolutionTrigger.FRIENDSHIP then
        return (pokemonData.friendship or 0) >= (conditions.friendship or 220)
    elseif trigger == EvolutionTrigger.FRIENDSHIP_DAY then
        return (pokemonData.friendship or 0) >= (conditions.friendship or 220) and conditions.timeOfDay == "day"
    elseif trigger == EvolutionTrigger.FRIENDSHIP_NIGHT then
        return (pokemonData.friendship or 0) >= (conditions.friendship or 220) and conditions.timeOfDay == "night"
    elseif trigger == EvolutionTrigger.ITEM or trigger == EvolutionTrigger.STONE then
        return conditions.item ~= nil -- Item usage handled externally
    elseif trigger == EvolutionTrigger.TRADE then
        return conditions.traded == true
    elseif trigger == EvolutionTrigger.TRADE_ITEM then
        return conditions.traded == true and conditions.item ~= nil
    elseif trigger == EvolutionTrigger.LEVEL_MOVE then
        return level >= (conditions.level or 1) and pokemonData.knowsMove and pokemonData.knowsMove[conditions.move]
    elseif trigger == EvolutionTrigger.OTHER_POKEMON then
        return conditions.otherPokemon ~= nil -- Party composition handled externally
    end
    
    return false, "Unknown evolution trigger: " .. tostring(trigger)
end

-- Get pre-evolution species (reverse lookup)
function EvolutionChains.getPreEvolution(speciesId)
    for fromId, evolutions in pairs(evolutionData) do
        for _, evolution in ipairs(evolutions) do
            if evolution.toSpeciesId == speciesId then
                return fromId
            end
        end
    end
    return nil
end

-- Check if species is in same evolution line
function EvolutionChains.isSameEvolutionLine(speciesId1, speciesId2)
    local chain1 = EvolutionChains.getEvolutionChain(speciesId1)
    local chain2 = EvolutionChains.getEvolutionChain(speciesId2)
    
    -- Check if both species appear in either chain
    for _, id1 in ipairs(chain1) do
        for _, id2 in ipairs(chain2) do
            if id1 == id2 then
                return true
            end
        end
    end
    
    return false
end

-- Validate evolution data integrity
function EvolutionChains.validateEvolutionData()
    local errors = {}
    
    for fromId, evolutions in pairs(evolutionData) do
        if type(fromId) ~= "number" or fromId < 1 then
            table.insert(errors, "Invalid from species ID: " .. tostring(fromId))
        end
        
        for i, evolution in ipairs(evolutions) do
            if not evolution.toSpeciesId or type(evolution.toSpeciesId) ~= "number" then
                table.insert(errors, "Invalid to species ID for " .. fromId .. " evolution " .. i)
            end
            
            if not evolution.trigger then
                table.insert(errors, "Missing trigger for " .. fromId .. " evolution " .. i)
            end
            
            -- Validate trigger-specific requirements
            if evolution.trigger == EvolutionTrigger.LEVEL and not evolution.level then
                table.insert(errors, "Missing level for level-based evolution " .. fromId .. " -> " .. evolution.toSpeciesId)
            end
        end
    end
    
    return #errors == 0, errors
end

-- Export for AO process
return {
    EvolutionChains = EvolutionChains,
    EvolutionTrigger = EvolutionTrigger
}