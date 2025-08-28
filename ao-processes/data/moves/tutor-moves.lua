-- Move Tutor Database
-- Defines which moves can be learned from move tutors
-- Includes tutor locations, costs, and species compatibility

local TutorMoves = {
    -- Database version for compatibility tracking
    VERSION = "1.0.0",
    LAST_UPDATED = "2025-08-28"
}

-- Move tutors definition
-- Each tutor has specific moves they can teach and associated costs
TutorMoves.tutors = {
    ["BATTLE_FRONTIER"] = {
        id = "BATTLE_FRONTIER",
        name = "Battle Frontier Tutor",
        location = "Battle Frontier",
        currency = "battle_points", -- BP (Battle Points)
        moves = {
            [1] = { moveId = 7, cost = 16 },    -- Fire Punch
            [2] = { moveId = 8, cost = 16 },    -- Ice Punch  
            [3] = { moveId = 9, cost = 16 },    -- Thunder Punch
            [4] = { moveId = 69, cost = 24 },   -- Seismic Toss
            [5] = { moveId = 102, cost = 32 },  -- Mimic
            [6] = { moveId = 118, cost = 48 },  -- Metronome
            [7] = { moveId = 119, cost = 48 },  -- Self-Destruct
            [8] = { moveId = 196, cost = 64 },  -- Icy Wind
        }
    },
    
    ["GAME_CORNER"] = {
        id = "GAME_CORNER",
        name = "Game Corner Tutor",
        location = "Celadon Game Corner",
        currency = "coins", -- Game Corner coins
        moves = {
            [1] = { moveId = 129, cost = 4000 }, -- Swift
            [2] = { moveId = 200, cost = 4000 }, -- Outrage
            [3] = { moveId = 347, cost = 2000 }, -- Calm Mind
            [4] = { moveId = 349, cost = 6000 }, -- Dragon Rush
        }
    },
    
    ["ELITE_TUTOR"] = {
        id = "ELITE_TUTOR", 
        name = "Elite Four Tutor",
        location = "Indigo Plateau",
        currency = "champion_tokens", -- Special elite tokens
        moves = {
            [1] = { moveId = 153, cost = 5 },   -- Explosion
            [2] = { moveId = 188, cost = 5 },   -- Sleep Talk
            [3] = { moveId = 214, cost = 3 },   -- Heal Bell
            [4] = { moveId = 235, cost = 8 },   -- Synthesis
        }
    }
}

-- Species compatibility for tutor moves
-- Defines which species can learn from each tutor
TutorMoves.compatibility = {
    [1] = {  -- Bulbasaur
        tutors = {
            ["BATTLE_FRONTIER"] = { 7, 8, 69, 102 },    -- Fire Punch, Ice Punch, Seismic Toss, Mimic
            ["GAME_CORNER"] = { 129, 347 },              -- Swift, Calm Mind
            ["ELITE_TUTOR"] = { 188, 214, 235 }          -- Sleep Talk, Heal Bell, Synthesis
        }
    },
    
    [4] = {  -- Charmander
        tutors = {
            ["BATTLE_FRONTIER"] = { 7, 9, 69, 102, 119 }, -- Fire/Thunder Punch, Seismic Toss, Mimic, Self-Destruct
            ["GAME_CORNER"] = { 129, 200, 349 },           -- Swift, Outrage, Dragon Rush
            ["ELITE_TUTOR"] = { 153, 188 }                  -- Explosion, Sleep Talk
        }
    },
    
    [7] = {  -- Squirtle
        tutors = {
            ["BATTLE_FRONTIER"] = { 8, 9, 69, 102, 196 }, -- Ice/Thunder Punch, Seismic Toss, Mimic, Icy Wind
            ["GAME_CORNER"] = { 129 },                     -- Swift
            ["ELITE_TUTOR"] = { 188, 214 }                 -- Sleep Talk, Heal Bell
        }
    },
    
    [25] = { -- Pikachu
        tutors = {
            ["BATTLE_FRONTIER"] = { 8, 9, 69, 102, 118 }, -- Ice/Thunder Punch, Seismic Toss, Mimic, Metronome
            ["GAME_CORNER"] = { 129 },                     -- Swift
            ["ELITE_TUTOR"] = { 188 }                      -- Sleep Talk
        }
    },
    
    [39] = { -- Jigglypuff
        tutors = {
            ["BATTLE_FRONTIER"] = { 7, 8, 9, 102, 118 },  -- All punches, Mimic, Metronome
            ["GAME_CORNER"] = { 129 },                     -- Swift
            ["ELITE_TUTOR"] = { 188, 214 }                 -- Sleep Talk, Heal Bell
        }
    },
    
    [133] = { -- Eevee
        tutors = {
            ["BATTLE_FRONTIER"] = { 7, 8, 9, 102, 118 },  -- All punches, Mimic, Metronome
            ["GAME_CORNER"] = { 129, 347 },                -- Swift, Calm Mind
            ["ELITE_TUTOR"] = { 188, 214 }                 -- Sleep Talk, Heal Bell
        }
    },
    
    [150] = { -- Mewtwo
        tutors = {
            ["BATTLE_FRONTIER"] = { 7, 8, 9, 69, 102, 118, 119, 196 }, -- All Battle Frontier moves
            ["GAME_CORNER"] = { 129, 200, 347, 349 },                  -- All Game Corner moves
            ["ELITE_TUTOR"] = { 153, 188, 214, 235 }                   -- All Elite moves
        }
    }
}

-- Tutor requirements and restrictions
TutorMoves.requirements = {
    -- Level requirements for tutors
    levelRequirements = {
        ["BATTLE_FRONTIER"] = 25,  -- Must be level 25+
        ["GAME_CORNER"] = 15,      -- Must be level 15+
        ["ELITE_TUTOR"] = 50       -- Must be level 50+ (Elite tutor)
    },
    
    -- Badge requirements
    badgeRequirements = {
        ["BATTLE_FRONTIER"] = 7,   -- Need 7 badges
        ["GAME_CORNER"] = 3,       -- Need 3 badges
        ["ELITE_TUTOR"] = 8        -- Need to be Champion (all 8 badges + Elite Four)
    },
    
    -- Maximum moves that can be learned from tutors per Pokemon
    maxTutorMovesPerPokemon = 8,
    
    -- Cooldown between tutor sessions (in hours)
    tutorCooldown = 24
}

-- Validate if a species can learn a move from a tutor
function TutorMoves.canLearnFromTutor(speciesId, tutorId, moveId)
    if not speciesId or not tutorId or not moveId then
        return false, "Missing required parameters"
    end
    
    -- Check if tutor exists
    local tutor = TutorMoves.tutors[tutorId]
    if not tutor then
        return false, "Tutor does not exist"
    end
    
    -- Check if species has compatibility with this tutor
    local speciesCompatibility = TutorMoves.compatibility[speciesId]
    if not speciesCompatibility then
        return false, "Species cannot learn from tutors"
    end
    
    local tutorMoves = speciesCompatibility.tutors[tutorId]
    if not tutorMoves then
        return false, "Species cannot learn from this specific tutor"
    end
    
    -- Check if move is available from this tutor
    local moveAvailable = false
    for _, availableMoveId in ipairs(tutorMoves) do
        if availableMoveId == moveId then
            moveAvailable = true
            break
        end
    end
    
    if not moveAvailable then
        return false, "Move is not available from this tutor for this species"
    end
    
    return true, "Species can learn move from tutor"
end

-- Get available tutor moves for a species
function TutorMoves.getAvailableMovesForSpecies(speciesId, tutorId)
    if not speciesId then
        return {}
    end
    
    local speciesCompatibility = TutorMoves.compatibility[speciesId]
    if not speciesCompatibility then
        return {}
    end
    
    if tutorId then
        -- Get moves for specific tutor
        return speciesCompatibility.tutors[tutorId] or {}
    else
        -- Get all available moves from all tutors
        local allMoves = {}
        for currentTutorId, moves in pairs(speciesCompatibility.tutors) do
            for _, moveId in ipairs(moves) do
                table.insert(allMoves, {
                    moveId = moveId,
                    tutorId = currentTutorId,
                    cost = TutorMoves.getMoveCost(currentTutorId, moveId),
                    currency = TutorMoves.tutors[currentTutorId].currency
                })
            end
        end
        return allMoves
    end
end

-- Get cost for learning a specific move from a tutor
function TutorMoves.getMoveCost(tutorId, moveId)
    if not tutorId or not moveId then
        return 0
    end
    
    local tutor = TutorMoves.tutors[tutorId]
    if not tutor or not tutor.moves then
        return 0
    end
    
    for _, moveData in ipairs(tutor.moves) do
        if moveData.moveId == moveId then
            return moveData.cost
        end
    end
    
    return 0
end

-- Validate player resources for tutor learning
function TutorMoves.validatePlayerResources(tutorId, moveId, playerResources)
    if not tutorId or not moveId or not playerResources then
        return false, "Missing required parameters"
    end
    
    local tutor = TutorMoves.tutors[tutorId]
    if not tutor then
        return false, "Invalid tutor"
    end
    
    local cost = TutorMoves.getMoveCost(tutorId, moveId)
    if cost == 0 then
        return false, "Move not available from tutor"
    end
    
    local currency = tutor.currency
    local playerAmount = playerResources[currency] or 0
    
    if playerAmount < cost then
        return false, "Insufficient " .. currency .. " (need " .. cost .. ", have " .. playerAmount .. ")"
    end
    
    return true, "Player has sufficient resources"
end

-- Process tutor learning transaction
function TutorMoves.processTutorLearning(tutorId, moveId, playerResources)
    if not tutorId or not moveId or not playerResources then
        return false, {}, "Missing required parameters"
    end
    
    -- Validate resources
    local canAfford, reason = TutorMoves.validatePlayerResources(tutorId, moveId, playerResources)
    if not canAfford then
        return false, {}, reason
    end
    
    -- Calculate cost and deduct resources
    local tutor = TutorMoves.tutors[tutorId]
    local cost = TutorMoves.getMoveCost(tutorId, moveId)
    local currency = tutor.currency
    
    local updatedResources = {}
    for k, v in pairs(playerResources) do
        updatedResources[k] = v
    end
    updatedResources[currency] = (updatedResources[currency] or 0) - cost
    
    return true, updatedResources, "Successfully learned move from tutor"
end

-- Get all tutors and their information
function TutorMoves.getAllTutors()
    local tutorList = {}
    for tutorId, tutorData in pairs(TutorMoves.tutors) do
        table.insert(tutorList, {
            id = tutorId,
            name = tutorData.name,
            location = tutorData.location,
            currency = tutorData.currency,
            moveCount = #tutorData.moves,
            levelRequirement = TutorMoves.requirements.levelRequirements[tutorId],
            badgeRequirement = TutorMoves.requirements.badgeRequirements[tutorId]
        })
    end
    return tutorList
end

-- Database statistics
function TutorMoves.getStatistics()
    local totalTutors = 0
    local totalTutorMoves = 0
    local totalCompatibleSpecies = 0
    
    for tutorId, tutor in pairs(TutorMoves.tutors) do
        totalTutors = totalTutors + 1
        totalTutorMoves = totalTutorMoves + #tutor.moves
    end
    
    for speciesId, compatibility in pairs(TutorMoves.compatibility) do
        totalCompatibleSpecies = totalCompatibleSpecies + 1
    end
    
    return {
        totalTutors = totalTutors,
        totalTutorMoves = totalTutorMoves,
        totalCompatibleSpecies = totalCompatibleSpecies,
        averageMovesPerTutor = totalTutorMoves / math.max(totalTutors, 1)
    }
end

-- Validate database integrity
function TutorMoves.validateDatabase()
    local errors = {}
    
    -- Validate tutors
    for tutorId, tutor in pairs(TutorMoves.tutors) do
        if type(tutorId) ~= "string" then
            table.insert(errors, "Invalid tutor ID type: " .. tostring(tutorId))
        end
        
        if not tutor.name or type(tutor.name) ~= "string" then
            table.insert(errors, "Invalid tutor name for " .. tutorId)
        end
        
        if not tutor.moves or type(tutor.moves) ~= "table" then
            table.insert(errors, "Invalid moves table for tutor " .. tutorId)
        else
            for i, moveData in ipairs(tutor.moves) do
                if type(moveData.moveId) ~= "number" then
                    table.insert(errors, "Invalid move ID in tutor " .. tutorId .. " at index " .. i)
                end
                if type(moveData.cost) ~= "number" or moveData.cost < 0 then
                    table.insert(errors, "Invalid cost in tutor " .. tutorId .. " at index " .. i)
                end
            end
        end
    end
    
    -- Validate compatibility
    for speciesId, compatibility in pairs(TutorMoves.compatibility) do
        if type(speciesId) ~= "number" then
            table.insert(errors, "Invalid species ID type: " .. tostring(speciesId))
        end
        
        if not compatibility.tutors or type(compatibility.tutors) ~= "table" then
            table.insert(errors, "Invalid tutors table for species " .. speciesId)
        end
    end
    
    return #errors == 0, errors
end

return TutorMoves