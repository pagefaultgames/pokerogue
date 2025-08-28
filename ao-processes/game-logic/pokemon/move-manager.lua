--[[
Pokemon Move Learning and Management System
Handles move learning, forgetting, relearning, and moveset management

Features:
- Level-based move learning from species movesets
- Move slot management with proper validation
- Move forgetting and relearning system
- Move replacement with player choice
- Integration with species database and battle system
--]]

local MoveManager = {}

-- Import dependencies
local SpeciesDatabase = require("data.species.species-database")
local Enums = require("data.constants.enums")

-- Constants
local MAX_MOVES = 4        -- Maximum moves a Pokemon can know
local MIN_MOVES = 1        -- Minimum moves a Pokemon should have
local STRUGGLE_MOVE_ID = 165  -- Struggle move ID (used when no moves available)

-- Move data structure for Pokemon movesets
local PokemonMoveSchema = {
    id = "number",          -- Move ID from move database
    ppCurrent = "number",   -- Current PP
    ppMax = "number",       -- Maximum PP for this move
    learnedAt = "number",   -- Level when move was learned
    learnMethod = "string", -- How move was learned ("level", "tm", "tutor", etc.)
    slot = "number",        -- Move slot (1-4)
    timesUsed = "number"    -- Battle usage counter
}

-- Move learning methods
local LearnMethods = {
    LEVEL = "level",        -- Learned by leveling up
    START = "start",        -- Known at level 1
    TM = "tm",             -- Learned from TM
    HM = "hm",             -- Learned from HM
    TUTOR = "tutor",       -- Learned from move tutor
    EGG = "egg",           -- Learned from breeding
    EVOLUTION = "evolution", -- Learned upon evolution
    REMINDER = "reminder"   -- Relearned from move reminder
}

-- Move Learning Functions

-- Get moves that a Pokemon can learn at a specific level
-- @param speciesId: Species ID
-- @param level: Level to check for learnable moves
-- @return: Array of move IDs that can be learned
function MoveManager.getMovesLearnedAtLevel(speciesId, level)
    if not speciesId or not level then
        return {}
    end
    
    SpeciesDatabase.init()
    local speciesData = SpeciesDatabase.getSpecies(speciesId)
    if not speciesData or not speciesData.levelMoves then
        return {}
    end
    
    local learnableMoves = {}
    
    -- Check level-up moves
    for _, moveData in ipairs(speciesData.levelMoves) do
        if moveData.level == level then
            table.insert(learnableMoves, {
                id = moveData.moveId,
                learnMethod = LearnMethods.LEVEL,
                requiredLevel = level
            })
        end
    end
    
    return learnableMoves
end

-- Get all moves a Pokemon can learn up to a specific level
-- @param speciesId: Species ID
-- @param maxLevel: Maximum level to check
-- @param includeStart: Whether to include starting moves (level 0-1)
-- @return: Array of learnable moves with level requirements
function MoveManager.getAllLearnableMoves(speciesId, maxLevel, includeStart)
    if not speciesId or not maxLevel then
        return {}
    end
    
    SpeciesDatabase.init()
    local speciesData = SpeciesDatabase.getSpecies(speciesId)
    if not speciesData or not speciesData.levelMoves then
        return {}
    end
    
    local allMoves = {}
    local seenMoves = {}  -- Prevent duplicates
    
    for _, moveData in ipairs(speciesData.levelMoves) do
        local moveLevel = moveData.level
        local moveId = moveData.moveId
        
        -- Check level requirements
        if moveLevel <= maxLevel and (includeStart or moveLevel > 1) then
            if not seenMoves[moveId] then
                seenMoves[moveId] = true
                table.insert(allMoves, {
                    id = moveId,
                    learnLevel = moveLevel,
                    learnMethod = moveLevel <= 1 and LearnMethods.START or LearnMethods.LEVEL
                })
            end
        end
    end
    
    -- Sort by learn level
    table.sort(allMoves, function(a, b) return a.learnLevel < b.learnLevel end)
    
    return allMoves
end

-- Get starting moves for a Pokemon at creation
-- @param speciesId: Species ID
-- @param level: Starting level
-- @return: Array of starting moves
function MoveManager.getStartingMoves(speciesId, level)
    if not speciesId or not level then
        return {}
    end
    
    local allMoves = MoveManager.getAllLearnableMoves(speciesId, level, true)
    local startingMoves = {}
    
    -- Take the last 4 moves the Pokemon would have learned
    for i = math.max(1, #allMoves - MAX_MOVES + 1), #allMoves do
        if allMoves[i] then
            table.insert(startingMoves, allMoves[i])
        end
    end
    
    -- If no moves found, add Struggle as emergency move
    if #startingMoves == 0 then
        table.insert(startingMoves, {
            id = STRUGGLE_MOVE_ID,
            learnLevel = 1,
            learnMethod = LearnMethods.START
        })
    end
    
    return startingMoves
end

-- Pokemon Moveset Management

-- Initialize moveset for a new Pokemon
-- @param pokemon: Pokemon instance
-- @return: Pokemon with initialized moveset
function MoveManager.initializeMoveset(pokemon)
    if not pokemon then
        return nil, "Pokemon instance required"
    end
    
    if pokemon.moveset and #pokemon.moveset > 0 then
        return pokemon  -- Already has moves
    end
    
    local startingMoves = MoveManager.getStartingMoves(pokemon.speciesId, pokemon.level)
    pokemon.moveset = {}
    
    for i, moveInfo in ipairs(startingMoves) do
        local pokemonMove = MoveManager.createPokemonMove(
            moveInfo.id,
            pokemon.level,
            moveInfo.learnMethod,
            i
        )
        if pokemonMove then
            table.insert(pokemon.moveset, pokemonMove)
        end
    end
    
    return pokemon
end

-- Create a PokemonMove object
-- @param moveId: Move ID
-- @param learnedAt: Level when learned
-- @param learnMethod: How move was learned
-- @param slot: Move slot (1-4)
-- @return: PokemonMove object
function MoveManager.createPokemonMove(moveId, learnedAt, learnMethod, slot)
    if not moveId then
        return nil
    end
    
    -- In a full implementation, this would look up move data for PP
    -- For now, using default values
    local basePP = 20  -- Default PP, should be looked up from move database
    
    return {
        id = moveId,
        ppCurrent = basePP,
        ppMax = basePP,
        learnedAt = learnedAt or 1,
        learnMethod = learnMethod or LearnMethods.LEVEL,
        slot = slot or 1,
        timesUsed = 0
    }
end

-- Learn a new move (level up, TM, etc.)
-- @param pokemon: Pokemon instance
-- @param moveId: Move ID to learn
-- @param learnMethod: How move is being learned
-- @param options: Additional options (force, slot preference, etc.)
-- @return: Updated Pokemon, learn result info
function MoveManager.learnMove(pokemon, moveId, learnMethod, options)
    if not pokemon or not moveId then
        return nil, "Pokemon and move ID required"
    end
    
    options = options or {}
    learnMethod = learnMethod or LearnMethods.LEVEL
    
    -- Check if Pokemon already knows this move
    if MoveManager.hasMove(pokemon, moveId) then
        return pokemon, {
            success = false,
            reason = "already_known",
            message = "Pokemon already knows this move"
        }
    end
    
    -- Validate move can be learned (except for forced learning like TMs)
    if not options.force and learnMethod == LearnMethods.LEVEL then
        local canLearn = MoveManager.canLearnMove(pokemon.speciesId, moveId, pokemon.level)
        if not canLearn then
            return pokemon, {
                success = false,
                reason = "cannot_learn",
                message = "Pokemon cannot learn this move"
            }
        end
    end
    
    -- Initialize moveset if empty
    if not pokemon.moveset then
        pokemon.moveset = {}
    end
    
    local newMove = MoveManager.createPokemonMove(moveId, pokemon.level, learnMethod)
    
    -- If moveset has space, add the move
    if #pokemon.moveset < MAX_MOVES then
        newMove.slot = #pokemon.moveset + 1
        table.insert(pokemon.moveset, newMove)
        
        return pokemon, {
            success = true,
            reason = "learned",
            move = newMove,
            message = "Move learned successfully"
        }
    end
    
    -- Moveset is full - need to replace or decline
    if options.replaceSlot and options.replaceSlot >= 1 and options.replaceSlot <= MAX_MOVES then
        local oldMove = pokemon.moveset[options.replaceSlot]
        newMove.slot = options.replaceSlot
        pokemon.moveset[options.replaceSlot] = newMove
        
        return pokemon, {
            success = true,
            reason = "replaced",
            move = newMove,
            replacedMove = oldMove,
            message = "Move learned, replaced previous move"
        }
    end
    
    -- No replacement specified - return choice needed
    return pokemon, {
        success = false,
        reason = "moveset_full",
        pendingMove = newMove,
        currentMoves = pokemon.moveset,
        message = "Moveset is full, choose a move to replace"
    }
end

-- Replace a move in a specific slot
-- @param pokemon: Pokemon instance
-- @param slot: Slot to replace (1-4)
-- @param moveId: New move ID
-- @param learnMethod: How move is being learned
-- @return: Updated Pokemon, replacement result
function MoveManager.replaceMove(pokemon, slot, moveId, learnMethod)
    if not pokemon or not slot or not moveId then
        return nil, "Pokemon, slot, and move ID required"
    end
    
    if slot < 1 or slot > MAX_MOVES then
        return pokemon, {
            success = false,
            reason = "invalid_slot",
            message = "Invalid move slot"
        }
    end
    
    if not pokemon.moveset or not pokemon.moveset[slot] then
        return pokemon, {
            success = false,
            reason = "no_move",
            message = "No move in specified slot"
        }
    end
    
    local oldMove = pokemon.moveset[slot]
    local newMove = MoveManager.createPokemonMove(moveId, pokemon.level, learnMethod, slot)
    
    pokemon.moveset[slot] = newMove
    
    return pokemon, {
        success = true,
        reason = "replaced",
        move = newMove,
        replacedMove = oldMove,
        message = "Move replaced successfully"
    }
end

-- Forget a move (remove from moveset)
-- @param pokemon: Pokemon instance
-- @param slot: Slot to forget (1-4)
-- @return: Updated Pokemon, forget result
function MoveManager.forgetMove(pokemon, slot)
    if not pokemon or not slot then
        return nil, "Pokemon and slot required"
    end
    
    if slot < 1 or slot > MAX_MOVES then
        return pokemon, {
            success = false,
            reason = "invalid_slot",
            message = "Invalid move slot"
        }
    end
    
    if not pokemon.moveset or not pokemon.moveset[slot] then
        return pokemon, {
            success = false,
            reason = "no_move",
            message = "No move in specified slot"
        }
    end
    
    -- Don't allow forgetting the last move
    local moveCount = 0
    for i = 1, MAX_MOVES do
        if pokemon.moveset[i] then
            moveCount = moveCount + 1
        end
    end
    
    if moveCount <= MIN_MOVES then
        return pokemon, {
            success = false,
            reason = "last_move",
            message = "Cannot forget the last move"
        }
    end
    
    local forgottenMove = pokemon.moveset[slot]
    
    -- Add to forgotten moves for move reminder
    if not pokemon.forgottenMoves then
        pokemon.forgottenMoves = {}
    end
    
    table.insert(pokemon.forgottenMoves, {
        id = forgottenMove.id,
        forgottenAt = os.time(),
        originalLearnLevel = forgottenMove.learnedAt,
        learnMethod = forgottenMove.learnMethod
    })
    
    -- Remove move and compact array
    table.remove(pokemon.moveset, slot)
    
    -- Update remaining move slots
    for i = 1, #pokemon.moveset do
        pokemon.moveset[i].slot = i
    end
    
    return pokemon, {
        success = true,
        reason = "forgotten",
        forgottenMove = forgottenMove,
        message = "Move forgotten successfully"
    }
end

-- Query and Validation Functions

-- Check if Pokemon has a specific move
-- @param pokemon: Pokemon instance
-- @param moveId: Move ID to check
-- @return: Boolean indicating if Pokemon knows the move
function MoveManager.hasMove(pokemon, moveId)
    if not pokemon or not moveId or not pokemon.moveset then
        return false
    end
    
    for _, move in ipairs(pokemon.moveset) do
        if move and move.id == moveId then
            return true
        end
    end
    
    return false
end

-- Get move from Pokemon's moveset by ID
-- @param pokemon: Pokemon instance
-- @param moveId: Move ID to find
-- @return: PokemonMove object or nil
function MoveManager.getMove(pokemon, moveId)
    if not pokemon or not moveId or not pokemon.moveset then
        return nil
    end
    
    for _, move in ipairs(pokemon.moveset) do
        if move and move.id == moveId then
            return move
        end
    end
    
    return nil
end

-- Get move from Pokemon's moveset by slot
-- @param pokemon: Pokemon instance
-- @param slot: Move slot (1-4)
-- @return: PokemonMove object or nil
function MoveManager.getMoveBySlot(pokemon, slot)
    if not pokemon or not slot or not pokemon.moveset then
        return nil
    end
    
    if slot < 1 or slot > MAX_MOVES then
        return nil
    end
    
    return pokemon.moveset[slot]
end

-- Check if Pokemon can learn a specific move
-- @param speciesId: Species ID
-- @param moveId: Move ID to check
-- @param currentLevel: Current Pokemon level
-- @return: Boolean indicating if move can be learned
function MoveManager.canLearnMove(speciesId, moveId, currentLevel)
    if not speciesId or not moveId then
        return false
    end
    
    local allMoves = MoveManager.getAllLearnableMoves(speciesId, currentLevel, true)
    
    for _, moveInfo in ipairs(allMoves) do
        if moveInfo.id == moveId then
            return true
        end
    end
    
    return false
end

-- Get moves Pokemon has forgotten (for move reminder)
-- @param pokemon: Pokemon instance
-- @return: Array of forgotten moves
function MoveManager.getForgottenMoves(pokemon)
    if not pokemon or not pokemon.forgottenMoves then
        return {}
    end
    
    return pokemon.forgottenMoves
end

-- Get all possible moves for a species (level + TM + tutor, etc.)
-- @param speciesId: Species ID
-- @return: Table of all learnable moves organized by method
function MoveManager.getAllPossibleMoves(speciesId)
    if not speciesId then
        return {}
    end
    
    SpeciesDatabase.init()
    local speciesData = SpeciesDatabase.getSpecies(speciesId)
    if not speciesData then
        return {}
    end
    
    local allMoves = {
        level = {},
        tm = {},
        tutor = {},
        egg = {}
    }
    
    -- Add level moves
    if speciesData.levelMoves then
        for _, moveData in ipairs(speciesData.levelMoves) do
            table.insert(allMoves.level, {
                id = moveData.moveId,
                level = moveData.level
            })
        end
    end
    
    -- Add TM moves (if available in species data)
    if speciesData.tmMoves then
        for _, moveId in ipairs(speciesData.tmMoves) do
            table.insert(allMoves.tm, {id = moveId})
        end
    end
    
    -- Add tutor moves (if available)
    if speciesData.tutorMoves then
        for _, moveId in ipairs(speciesData.tutorMoves) do
            table.insert(allMoves.tutor, {id = moveId})
        end
    end
    
    -- Add egg moves (if available)
    if speciesData.eggMoves then
        for _, moveId in ipairs(speciesData.eggMoves) do
            table.insert(allMoves.egg, {id = moveId})
        end
    end
    
    return allMoves
end

-- Battle Integration Functions

-- Use a move (reduce PP, update usage stats)
-- @param pokemon: Pokemon instance
-- @param moveSlot: Move slot used (1-4)
-- @return: Updated Pokemon, move usage result
function MoveManager.useMove(pokemon, moveSlot)
    if not pokemon or not moveSlot then
        return nil, "Pokemon and move slot required"
    end
    
    local move = MoveManager.getMoveBySlot(pokemon, moveSlot)
    if not move then
        return pokemon, {
            success = false,
            reason = "no_move",
            message = "No move in specified slot"
        }
    end
    
    if move.ppCurrent <= 0 then
        return pokemon, {
            success = false,
            reason = "no_pp",
            message = "Move has no PP remaining"
        }
    end
    
    -- Reduce PP and update usage
    move.ppCurrent = move.ppCurrent - 1
    move.timesUsed = move.timesUsed + 1
    
    return pokemon, {
        success = true,
        move = move,
        ppRemaining = move.ppCurrent,
        message = "Move used successfully"
    }
end

-- Restore PP for a move or all moves
-- @param pokemon: Pokemon instance
-- @param moveSlot: Specific slot to restore (nil for all)
-- @param amount: Amount to restore (nil for full restore)
-- @return: Updated Pokemon
function MoveManager.restorePP(pokemon, moveSlot, amount)
    if not pokemon or not pokemon.moveset then
        return pokemon
    end
    
    local slotsToRestore = {}
    
    if moveSlot then
        if moveSlot >= 1 and moveSlot <= MAX_MOVES then
            table.insert(slotsToRestore, moveSlot)
        end
    else
        for i = 1, MAX_MOVES do
            if pokemon.moveset[i] then
                table.insert(slotsToRestore, i)
            end
        end
    end
    
    for _, slot in ipairs(slotsToRestore) do
        local move = pokemon.moveset[slot]
        if move then
            if amount then
                move.ppCurrent = math.min(move.ppCurrent + amount, move.ppMax)
            else
                move.ppCurrent = move.ppMax
            end
        end
    end
    
    return pokemon
end

-- Get moveset statistics
-- @param pokemon: Pokemon instance
-- @return: Moveset statistics
function MoveManager.getMovesetStats(pokemon)
    if not pokemon or not pokemon.moveset then
        return {
            totalMoves = 0,
            totalPP = 0,
            currentPP = 0,
            averageUsage = 0
        }
    end
    
    local stats = {
        totalMoves = #pokemon.moveset,
        totalPP = 0,
        currentPP = 0,
        totalUsage = 0
    }
    
    for _, move in ipairs(pokemon.moveset) do
        if move then
            stats.totalPP = stats.totalPP + move.ppMax
            stats.currentPP = stats.currentPP + move.ppCurrent
            stats.totalUsage = stats.totalUsage + move.timesUsed
        end
    end
    
    stats.averageUsage = stats.totalMoves > 0 and (stats.totalUsage / stats.totalMoves) or 0
    stats.ppPercentage = stats.totalPP > 0 and (stats.currentPP / stats.totalPP) * 100 or 0
    
    return stats
end

-- Level Up Move Learning

-- Process move learning when Pokemon levels up
-- @param pokemon: Pokemon instance
-- @param newLevel: New level reached
-- @return: Updated Pokemon, moves learned info
function MoveManager.processLevelUpMoves(pokemon, newLevel)
    if not pokemon or not newLevel then
        return pokemon, {}
    end
    
    local oldLevel = pokemon.level or 1
    local movesLearned = {}
    
    -- Check each level from old to new for learnable moves
    for level = oldLevel + 1, newLevel do
        local learnableMoves = MoveManager.getMovesLearnedAtLevel(pokemon.speciesId, level)
        
        for _, moveInfo in ipairs(learnableMoves) do
            local result
            pokemon, result = MoveManager.learnMove(pokemon, moveInfo.id, LearnMethods.LEVEL)
            
            if result then
                result.level = level
                table.insert(movesLearned, result)
            end
        end
    end
    
    return pokemon, movesLearned
end

-- Utility Functions

-- Validate Pokemon moveset integrity
-- @param pokemon: Pokemon instance
-- @return: Boolean indicating if moveset is valid, error messages
function MoveManager.validateMoveset(pokemon)
    if not pokemon then
        return false, {"Pokemon instance required"}
    end
    
    local errors = {}
    
    if not pokemon.moveset then
        table.insert(errors, "Pokemon has no moveset")
        return false, errors
    end
    
    if #pokemon.moveset == 0 then
        table.insert(errors, "Pokemon has no moves")
    end
    
    if #pokemon.moveset > MAX_MOVES then
        table.insert(errors, "Pokemon has too many moves (max " .. MAX_MOVES .. ")")
    end
    
    -- Check move slots
    for i, move in ipairs(pokemon.moveset) do
        if not move.id then
            table.insert(errors, "Move in slot " .. i .. " has no ID")
        end
        
        if move.ppCurrent < 0 or move.ppCurrent > move.ppMax then
            table.insert(errors, "Move in slot " .. i .. " has invalid PP")
        end
        
        if move.slot ~= i then
            table.insert(errors, "Move in slot " .. i .. " has incorrect slot number")
        end
    end
    
    return #errors == 0, errors
end

-- Get move constants for external use
function MoveManager.getConstants()
    return {
        MAX_MOVES = MAX_MOVES,
        MIN_MOVES = MIN_MOVES,
        STRUGGLE_MOVE_ID = STRUGGLE_MOVE_ID,
        LEARN_METHODS = LearnMethods
    }
end

return MoveManager