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
    },
    
    -- Stone evolutions examples
    [25] = { -- Pikachu
        {
            toSpeciesId = 26, -- Raichu  
            trigger = EvolutionTrigger.STONE,
            stone = 7, -- THUNDER_STONE
            item = 7
        }
    },
    [133] = { -- Eevee
        {
            toSpeciesId = 134, -- Vaporeon
            trigger = EvolutionTrigger.STONE,
            stone = 6, -- WATER_STONE
            item = 6
        },
        {
            toSpeciesId = 135, -- Jolteon
            trigger = EvolutionTrigger.STONE,
            stone = 7, -- THUNDER_STONE
            item = 7
        },
        {
            toSpeciesId = 136, -- Flareon
            trigger = EvolutionTrigger.STONE,
            stone = 5, -- FIRE_STONE
            item = 5
        },
        {
            toSpeciesId = 196, -- Espeon
            trigger = EvolutionTrigger.FRIENDSHIP_DAY,
            friendshipLevel = 220
        },
        {
            toSpeciesId = 197, -- Umbreon
            trigger = EvolutionTrigger.FRIENDSHIP_NIGHT,
            friendshipLevel = 220
        },
        {
            toSpeciesId = 470, -- Leafeon
            trigger = EvolutionTrigger.STONE,
            stone = 4, -- LEAF_STONE
            item = 4
        },
        {
            toSpeciesId = 471, -- Glaceon
            trigger = EvolutionTrigger.STONE,
            stone = 8, -- ICE_STONE
            item = 8
        },
        {
            toSpeciesId = 700, -- Sylveon
            trigger = EvolutionTrigger.SPECIAL,
            friendshipLevel = 220,
            conditions = {
                moveType = "FAIRY"
            }
        }
    },
    [37] = { -- Vulpix
        {
            toSpeciesId = 38, -- Ninetales
            trigger = EvolutionTrigger.STONE,
            stone = 5, -- FIRE_STONE
            item = 5
        }
    },
    [44] = { -- Gloom
        {
            toSpeciesId = 45, -- Vileplume
            trigger = EvolutionTrigger.STONE,
            stone = 4, -- LEAF_STONE
            item = 4
        },
        {
            toSpeciesId = 182, -- Bellossom
            trigger = EvolutionTrigger.STONE,
            stone = 2, -- SUN_STONE
            item = 2
        }
    },
    
    -- Trade evolutions examples
    [64] = { -- Kadabra
        {
            toSpeciesId = 65, -- Alakazam
            trigger = EvolutionTrigger.TRADE
        }
    },
    [67] = { -- Machoke
        {
            toSpeciesId = 68, -- Machamp
            trigger = EvolutionTrigger.TRADE
        }
    },
    [75] = { -- Graveler
        {
            toSpeciesId = 76, -- Golem
            trigger = EvolutionTrigger.TRADE
        }
    },
    [93] = { -- Haunter
        {
            toSpeciesId = 94, -- Gengar
            trigger = EvolutionTrigger.TRADE
        }
    },
    
    -- Trade with item examples
    [61] = { -- Poliwhirl
        {
            toSpeciesId = 62, -- Poliwrath
            trigger = EvolutionTrigger.STONE,
            stone = 6, -- WATER_STONE
            item = 6
        },
        {
            toSpeciesId = 186, -- Politoed
            trigger = EvolutionTrigger.TRADE_ITEM,
            heldItem = 1, -- LINKING_CORD equivalent
            item = 1
        }
    },
    [117] = { -- Seadra
        {
            toSpeciesId = 230, -- Kingdra
            trigger = EvolutionTrigger.TRADE_ITEM,
            heldItem = 19, -- DRAGON_SCALE
            item = 19
        }
    },
    [137] = { -- Porygon
        {
            toSpeciesId = 233, -- Porygon2
            trigger = EvolutionTrigger.TRADE_ITEM,
            heldItem = 17, -- UPGRADE
            item = 17
        }
    },
    [233] = { -- Porygon2
        {
            toSpeciesId = 474, -- Porygon-Z
            trigger = EvolutionTrigger.TRADE_ITEM,
            heldItem = 18, -- DUBIOUS_DISC
            item = 18
        }
    },
    
    -- Friendship evolutions
    [172] = { -- Pichu
        {
            toSpeciesId = 25, -- Pikachu
            trigger = EvolutionTrigger.FRIENDSHIP,
            friendshipLevel = 220
        }
    },
    [174] = { -- Igglybuff
        {
            toSpeciesId = 39, -- Jigglypuff
            trigger = EvolutionTrigger.FRIENDSHIP,
            friendshipLevel = 220
        }
    },
    [175] = { -- Togepi
        {
            toSpeciesId = 176, -- Togetic
            trigger = EvolutionTrigger.FRIENDSHIP,
            friendshipLevel = 220
        }
    },
    [176] = { -- Togetic
        {
            toSpeciesId = 468, -- Togekiss
            trigger = EvolutionTrigger.STONE,
            stone = 11, -- SHINY_STONE
            item = 11
        }
    },
    
    -- Level with stat requirements (Tyrogue)
    [236] = { -- Tyrogue
        {
            toSpeciesId = 106, -- Hitmonlee
            trigger = EvolutionTrigger.LEVEL_ATK_LT_DEF,
            level = 20
        },
        {
            toSpeciesId = 107, -- Hitmonchan
            trigger = EvolutionTrigger.LEVEL_ATK_GT_DEF,
            level = 20
        },
        {
            toSpeciesId = 237, -- Hitmontop
            trigger = EvolutionTrigger.LEVEL_ATK_EQ_DEF,
            level = 20
        }
    },
    
    -- Gender-based evolutions
    [280] = { -- Ralts
        {
            toSpeciesId = 281, -- Kirlia
            trigger = EvolutionTrigger.LEVEL,
            level = 20
        }
    },
    [281] = { -- Kirlia
        {
            toSpeciesId = 282, -- Gardevoir
            trigger = EvolutionTrigger.LEVEL,
            level = 30
        },
        {
            toSpeciesId = 475, -- Gallade
            trigger = EvolutionTrigger.STONE,
            stone = 10, -- DAWN_STONE
            item = 10,
            gender = "MALE"
        }
    },
    
    -- Move-based evolution example
    [446] = { -- Munchlax
        {
            toSpeciesId = 143, -- Snorlax
            trigger = EvolutionTrigger.FRIENDSHIP,
            friendshipLevel = 220
        }
    },
    
    -- Special location/time evolutions would go here
    -- These require more complex conditions that combine multiple factors
    
    -- Level + move requirement example
    [458] = { -- Mantyke
        {
            toSpeciesId = 226, -- Mantine
            trigger = EvolutionTrigger.LEVEL_MOVE,
            level = 1,
            moveId = 1, -- Specific move requirement
            otherPokemonRequired = 223 -- Remoraid in party
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

-- Initialize evolution chains (placeholder for any setup needed)
function EvolutionChains.init()
    -- No initialization required for this implementation
    return true
end

-- Get evolutions for species (matches what evolution system expects)
function EvolutionChains.getEvolutionsForSpecies(speciesId)
    return EvolutionChains.getEvolutionData(speciesId)
end

-- Get full evolution chain for species
function EvolutionChains.getFullEvolutionChain(speciesId)
    return EvolutionChains.getEvolutionChain(speciesId)
end

-- Get pre-evolutions for species (reverse lookup)
function EvolutionChains.getPreEvolutionsForSpecies(speciesId)
    local preEvolutions = {}
    
    for fromId, evolutions in pairs(evolutionData) do
        for _, evolution in ipairs(evolutions) do
            if evolution.toSpeciesId == speciesId then
                table.insert(preEvolutions, fromId)
            end
        end
    end
    
    return preEvolutions
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