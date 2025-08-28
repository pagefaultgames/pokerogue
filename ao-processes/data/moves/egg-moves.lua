-- Egg Moves Database
-- Defines which moves can be inherited through breeding
-- Each species can inherit specific moves from compatible parents

local EggMoves = {
    -- Database version for compatibility tracking
    VERSION = "1.0.0",
    LAST_UPDATED = "2025-08-28"
}

-- Egg moves by species ID
-- Format: [speciesId] = { moveId1, moveId2, ... }
-- Only moves that can be inherited from parents during breeding
EggMoves.database = {
    [1] = {  -- Bulbasaur
        22,  -- Vine Whip
        73,  -- Leech Seed  
        230, -- Sweet Scent
        312, -- Aromatherapy
        388  -- Worry Seed
    },
    
    [4] = {  -- Charmander
        6,   -- Pay Day (from Meowth line)
        99,  -- Rage
        116, -- Focus Energy
        200, -- Outrage
        349  -- Dragon Rush
    },
    
    [7] = {  -- Squirtle
        33,  -- Tackle (basic)
        145, -- Bubble
        193, -- Foresight
        281, -- Yawn
        346  -- Water Sport
    },
    
    [25] = { -- Pikachu
        84,  -- Thunder Shock
        86,  -- Thunder Wave
        129, -- Swift
        203, -- Endure
        364  -- Feint
    },
    
    [39] = { -- Jigglypuff
        3,   -- Double Slap
        47,  -- Sing
        156, -- Rest
        213, -- Attract
        343  -- Covet
    },
    
    [133] = { -- Eevee
        33,  -- Tackle
        39,  -- Tail Whip
        98,  -- Quick Attack
        204, -- Charm
        343  -- Covet
    },
    
    [150] = { -- Mewtwo - No egg moves (Legendary, cannot breed)
    }
}

-- Parent compatibility for egg moves
-- Defines which parent species can pass moves to offspring
EggMoves.parentCompatibility = {
    [1] = {  -- Bulbasaur can inherit from:
        eggGroups = {"Monster", "Grass"},
        compatibleParents = {1, 2, 3}, -- Bulbasaur line
        requiredMoves = {
            [22] = {1, 2, 3},  -- Vine Whip from Bulbasaur line
            [73] = {1, 2, 3},  -- Leech Seed from Bulbasaur line
            [230] = {45, 46, 47}, -- Sweet Scent from Oddish line (if implemented)
        }
    },
    
    [4] = {  -- Charmander can inherit from:
        eggGroups = {"Monster", "Dragon"},
        compatibleParents = {4, 5, 6}, -- Charmander line
        requiredMoves = {
            [6] = {52, 53},     -- Pay Day from Meowth line (if implemented)
            [99] = {4, 5, 6},   -- Rage from Charmander line
            [116] = {4, 5, 6},  -- Focus Energy from Charmander line
        }
    },
    
    [7] = {  -- Squirtle can inherit from:
        eggGroups = {"Monster", "Water1"},
        compatibleParents = {7, 8, 9}, -- Squirtle line
        requiredMoves = {
            [145] = {7, 8, 9},  -- Bubble from Squirtle line
            [193] = {16, 17, 18}, -- Foresight from Pidgey line (if implemented)
        }
    },
    
    [25] = { -- Pikachu can inherit from:
        eggGroups = {"Field", "Fairy"},
        compatibleParents = {25, 26}, -- Pikachu line
        requiredMoves = {
            [84] = {25, 26},    -- Thunder Shock from Pikachu line
            [86] = {25, 26},    -- Thunder Wave from Pikachu line
        }
    },
    
    [39] = { -- Jigglypuff can inherit from:
        eggGroups = {"Fairy"},
        compatibleParents = {39, 40}, -- Jigglypuff line
        requiredMoves = {
            [47] = {39, 40},    -- Sing from Jigglypuff line
            [213] = {39, 40},   -- Attract from Jigglypuff line
        }
    },
    
    [133] = { -- Eevee can inherit from:
        eggGroups = {"Field"},
        compatibleParents = {133}, -- Eevee itself
        requiredMoves = {
            [98] = {133},       -- Quick Attack from Eevee
            [204] = {133},      -- Charm from Eevee
        }
    }
}

-- Breeding requirements for egg move inheritance
EggMoves.breedingRequirements = {
    -- Both parents must be in compatible egg groups
    requireCompatibleEggGroups = true,
    
    -- Parent must know the move to pass it
    parentMustKnowMove = true,
    
    -- Maximum egg moves that can be inherited
    maxEggMovesPerPokemon = 4,
    
    -- Priority system when multiple egg moves are available
    prioritySystem = "first_available", -- Options: "first_available", "random", "level_based"
    
    -- Egg move inheritance rate (100% if requirements met)
    inheritanceRate = 1.0
}

-- Validate egg move inheritance attempt
function EggMoves.validateEggMoveInheritance(motherSpeciesId, fatherSpeciesId, moveId)
    if not motherSpeciesId or not fatherSpeciesId or not moveId then
        return false, "Missing required parameters for egg move validation"
    end
    
    -- Determine offspring species (typically mother's species)
    local offspringSpeciesId = motherSpeciesId
    
    -- Check if offspring can learn this egg move
    local offspringEggMoves = EggMoves.database[offspringSpeciesId]
    if not offspringEggMoves then
        return false, "Offspring species cannot learn egg moves"
    end
    
    local canLearnMove = false
    for _, eggMoveId in ipairs(offspringEggMoves) do
        if eggMoveId == moveId then
            canLearnMove = true
            break
        end
    end
    
    if not canLearnMove then
        return false, "Move is not a valid egg move for offspring species"
    end
    
    -- Check parent compatibility
    local compatibility = EggMoves.parentCompatibility[offspringSpeciesId]
    if not compatibility then
        return false, "No breeding compatibility data for offspring species"
    end
    
    -- Validate that at least one parent can pass the move
    local requiredMoves = compatibility.requiredMoves
    if requiredMoves and requiredMoves[moveId] then
        local validParents = requiredMoves[moveId]
        local parentCanPassMove = false
        
        for _, validParentId in ipairs(validParents) do
            if fatherSpeciesId == validParentId or motherSpeciesId == validParentId then
                parentCanPassMove = true
                break
            end
        end
        
        if not parentCanPassMove then
            return false, "Neither parent can pass this egg move"
        end
    end
    
    return true, "Egg move inheritance valid"
end

-- Get all possible egg moves for a species
function EggMoves.getEggMovesForSpecies(speciesId)
    if not speciesId then
        return {}
    end
    
    return EggMoves.database[speciesId] or {}
end

-- Get compatible parent species for egg move inheritance
function EggMoves.getCompatibleParentsForSpecies(speciesId)
    if not speciesId then
        return {}
    end
    
    local compatibility = EggMoves.parentCompatibility[speciesId]
    if not compatibility then
        return {}
    end
    
    return compatibility.compatibleParents or {}
end

-- Process egg move inheritance during breeding
function EggMoves.processEggMoveInheritance(motherSpeciesId, fatherSpeciesId, motherMoves, fatherMoves)
    if not motherSpeciesId or not fatherSpeciesId then
        return {}
    end
    
    local offspringSpeciesId = motherSpeciesId
    local inheritedMoves = {}
    local possibleEggMoves = EggMoves.getEggMovesForSpecies(offspringSpeciesId)
    
    if not possibleEggMoves or #possibleEggMoves == 0 then
        return inheritedMoves
    end
    
    -- Check each possible egg move
    for _, eggMoveId in ipairs(possibleEggMoves) do
        if #inheritedMoves >= EggMoves.breedingRequirements.maxEggMovesPerPokemon then
            break
        end
        
        -- Check if either parent knows the move
        local motherKnowsMove = false
        local fatherKnowsMove = false
        
        if motherMoves then
            for _, move in ipairs(motherMoves) do
                if move.moveId == eggMoveId then
                    motherKnowsMove = true
                    break
                end
            end
        end
        
        if fatherMoves then
            for _, move in ipairs(fatherMoves) do
                if move.moveId == eggMoveId then
                    fatherKnowsMove = true
                    break
                end
            end
        end
        
        -- Validate and inherit the move
        if motherKnowsMove or fatherKnowsMove then
            local isValid, reason = EggMoves.validateEggMoveInheritance(motherSpeciesId, fatherSpeciesId, eggMoveId)
            if isValid then
                table.insert(inheritedMoves, {
                    moveId = eggMoveId,
                    inheritedFrom = motherKnowsMove and "mother" or "father",
                    learnMethod = "EGG"
                })
            end
        end
    end
    
    return inheritedMoves
end

-- Database statistics
function EggMoves.getStatistics()
    local totalSpecies = 0
    local totalEggMoves = 0
    local speciesWithEggMoves = 0
    
    for speciesId, moves in pairs(EggMoves.database) do
        totalSpecies = totalSpecies + 1
        if moves and #moves > 0 then
            speciesWithEggMoves = speciesWithEggMoves + 1
            totalEggMoves = totalEggMoves + #moves
        end
    end
    
    return {
        totalSpecies = totalSpecies,
        speciesWithEggMoves = speciesWithEggMoves,
        totalEggMoves = totalEggMoves,
        averageEggMovesPerSpecies = totalEggMoves / math.max(speciesWithEggMoves, 1)
    }
end

-- Validate database integrity
function EggMoves.validateDatabase()
    local errors = {}
    
    for speciesId, moves in pairs(EggMoves.database) do
        if type(speciesId) ~= "number" then
            table.insert(errors, "Invalid species ID type: " .. tostring(speciesId))
        end
        
        if type(moves) ~= "table" then
            table.insert(errors, "Invalid moves data for species " .. speciesId)
        else
            for i, moveId in ipairs(moves) do
                if type(moveId) ~= "number" then
                    table.insert(errors, "Invalid move ID type in species " .. speciesId .. " at index " .. i)
                end
            end
        end
    end
    
    return #errors == 0, errors
end

return EggMoves