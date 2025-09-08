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
local TMDatabase = require("data.moves.tm-database")
local EggMoves = require("data.moves.egg-moves")
local TutorMoves = require("data.moves.tutor-moves")
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
        
        -- Add replaced move to forgotten moves for move reminder
        if not pokemon.forgottenMoves then
            pokemon.forgottenMoves = {}
        end
        
        table.insert(pokemon.forgottenMoves, {
            id = oldMove.id,
            forgottenAt = os.time(),
            originalLearnLevel = oldMove.learnedAt,
            learnMethod = oldMove.learnMethod
        })
        
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

-- Move Relearning Functions

-- Relearn a previously forgotten move
-- @param pokemon: Pokemon instance
-- @param moveId: Move ID to relearn
-- @param options: Additional options (cost payment, slot preference, etc.)
-- @return: Updated Pokemon, relearn result
function MoveManager.relearnMove(pokemon, moveId, options)
    if not pokemon or not moveId then
        return pokemon, {
            success = false,
            reason = "invalid_params",
            message = "Pokemon and move ID required"
        }
    end
    
    options = options or {}
    
    -- Check if Pokemon has forgotten moves
    if not pokemon.forgottenMoves then
        pokemon.forgottenMoves = {}
    end
    
    -- Find the forgotten move
    local forgottenMoveIndex = nil
    local forgottenMoveData = nil
    
    for i, forgottenMove in ipairs(pokemon.forgottenMoves) do
        if forgottenMove.id == moveId then
            forgottenMoveIndex = i
            forgottenMoveData = forgottenMove
            break
        end
    end
    
    if not forgottenMoveData then
        return pokemon, {
            success = false,
            reason = "not_forgotten",
            message = "Pokemon has never known this move"
        }
    end
    
    -- Check if Pokemon already knows this move
    if MoveManager.hasMove(pokemon, moveId) then
        return pokemon, {
            success = false,
            reason = "already_known",
            message = "Pokemon already knows this move"
        }
    end
    
    -- Calculate relearning cost (if applicable)
    local cost = MoveManager.calculateRelearnCost(pokemon, moveId, forgottenMoveData)
    
    -- Check if player can afford the cost
    if cost > 0 and options.playerMoney and options.playerMoney < cost then
        return pokemon, {
            success = false,
            reason = "insufficient_funds",
            cost = cost,
            message = "Insufficient funds to relearn this move (Cost: " .. cost .. ")"
        }
    end
    
    -- Attempt to learn the move
    local updatedPokemon, learnResult = MoveManager.learnMove(
        pokemon, 
        moveId, 
        LearnMethods.REMINDER,
        {
            replaceSlot = options.replaceSlot,
            force = true -- Allow relearning regardless of level restrictions
        }
    )
    
    if learnResult.success then
        -- Remove from forgotten moves list
        table.remove(updatedPokemon.forgottenMoves, forgottenMoveIndex)
        
        -- Record the relearning
        learnResult.relearned = true
        learnResult.originalLearnLevel = forgottenMoveData.originalLearnLevel
        learnResult.originalLearnMethod = forgottenMoveData.learnMethod
        learnResult.cost = cost
        learnResult.message = pokemon.name .. " remembered " .. (learnResult.move and learnResult.move.name or "the move") .. "!"
        
        -- Deduct cost if applicable
        if cost > 0 and options.playerMoney then
            learnResult.newBalance = options.playerMoney - cost
        end
    end
    
    return updatedPokemon, learnResult
end

-- Calculate cost for relearning a move
-- @param pokemon: Pokemon instance
-- @param moveId: Move ID to relearn
-- @param forgottenMoveData: Data about the forgotten move
-- @return: Cost in currency units
function MoveManager.calculateRelearnCost(pokemon, moveId, forgottenMoveData)
    -- Base cost calculation
    local baseCost = 0
    
    -- Factor in Pokemon level
    local levelFactor = math.floor(pokemon.level / 10)
    baseCost = baseCost + (levelFactor * 100)
    
    -- Factor in original learn method
    if forgottenMoveData.learnMethod == LearnMethods.TM then
        baseCost = baseCost + 500
    elseif forgottenMoveData.learnMethod == LearnMethods.TUTOR then
        baseCost = baseCost + 1000
    elseif forgottenMoveData.learnMethod == LearnMethods.EGG then
        baseCost = baseCost + 750
    else
        baseCost = baseCost + 200 -- Level/start moves
    end
    
    -- Factor in how long ago the move was forgotten
    if forgottenMoveData.forgottenAt then
        local timeAgo = os.time() - forgottenMoveData.forgottenAt
        local daysSince = math.floor(timeAgo / (24 * 3600))
        local timePenalty = math.min(daysSince * 50, 1000) -- Cap at 1000
        baseCost = baseCost + timePenalty
    end
    
    return baseCost
end

-- Get all moves that can be relearned
-- @param pokemon: Pokemon instance
-- @param includeKnown: Whether to include moves the Pokemon currently knows
-- @return: Array of relearnable moves with cost information
function MoveManager.getRellearnableMoves(pokemon, includeKnown)
    if not pokemon then
        return {}
    end
    
    includeKnown = includeKnown or false
    local relearnableMoves = {}
    
    -- Get forgotten moves
    local forgottenMoves = MoveManager.getForgottenMoves(pokemon)
    for _, forgottenMove in ipairs(forgottenMoves) do
        -- Skip if Pokemon already knows the move (unless includeKnown is true)
        if includeKnown or not MoveManager.hasMove(pokemon, forgottenMove.id) then
            local cost = MoveManager.calculateRelearnCost(pokemon, forgottenMove.id, forgottenMove)
            
            table.insert(relearnableMoves, {
                moveId = forgottenMove.id,
                originalLearnLevel = forgottenMove.originalLearnLevel,
                learnMethod = forgottenMove.learnMethod,
                forgottenAt = forgottenMove.forgottenAt,
                cost = cost,
                alreadyKnown = MoveManager.hasMove(pokemon, forgottenMove.id)
            })
        end
    end
    
    -- Sort by cost (lowest first)
    table.sort(relearnableMoves, function(a, b) return a.cost < b.cost end)
    
    return relearnableMoves
end

-- Validate forgotten moves data structure
-- @param pokemon: Pokemon instance
-- @return: Boolean indicating if forgotten moves data is valid, array of errors
function MoveManager.validateForgottenMoves(pokemon)
    if not pokemon then
        return false, {"Pokemon instance required"}
    end
    
    local errors = {}
    
    if pokemon.forgottenMoves then
        if type(pokemon.forgottenMoves) ~= "table" then
            table.insert(errors, "forgottenMoves must be array")
        else
            for i, forgottenMove in ipairs(pokemon.forgottenMoves) do
                if type(forgottenMove) ~= "table" then
                    table.insert(errors, "Forgotten move " .. i .. " must be table")
                else
                    -- Check required fields
                    if not forgottenMove.id or type(forgottenMove.id) ~= "number" then
                        table.insert(errors, "Forgotten move " .. i .. " must have valid ID")
                    end
                    
                    if forgottenMove.originalLearnLevel and type(forgottenMove.originalLearnLevel) ~= "number" then
                        table.insert(errors, "Forgotten move " .. i .. " originalLearnLevel must be number")
                    end
                    
                    if forgottenMove.learnMethod and type(forgottenMove.learnMethod) ~= "string" then
                        table.insert(errors, "Forgotten move " .. i .. " learnMethod must be string")
                    end
                    
                    if forgottenMove.forgottenAt and type(forgottenMove.forgottenAt) ~= "number" then
                        table.insert(errors, "Forgotten move " .. i .. " forgottenAt must be number")
                    end
                end
            end
        end
    end
    
    return #errors == 0, errors
end

-- Clear forgotten moves older than a certain age (cleanup utility)
-- @param pokemon: Pokemon instance
-- @param maxAgeDays: Maximum age in days to keep forgotten moves
-- @return: Updated Pokemon, number of moves removed
function MoveManager.cleanupForgottenMoves(pokemon, maxAgeDays)
    if not pokemon or not pokemon.forgottenMoves then
        return pokemon, 0
    end
    
    maxAgeDays = maxAgeDays or 365 -- Default to 1 year
    local currentTime = os.time()
    local maxAge = maxAgeDays * 24 * 3600 -- Convert to seconds
    
    local removed = 0
    local i = 1
    
    while i <= #pokemon.forgottenMoves do
        local forgottenMove = pokemon.forgottenMoves[i]
        if forgottenMove.forgottenAt and (currentTime - forgottenMove.forgottenAt) > maxAge then
            table.remove(pokemon.forgottenMoves, i)
            removed = removed + 1
        else
            i = i + 1
        end
    end
    
    return pokemon, removed
end

-- Get move relearning statistics for a Pokemon
-- @param pokemon: Pokemon instance
-- @return: Table with relearning statistics
function MoveManager.getRelearnStats(pokemon)
    if not pokemon then
        return {
            totalForgotten = 0,
            relearnable = 0,
            averageCost = 0,
            oldestForgotten = nil,
            newestForgotten = nil
        }
    end
    
    local stats = {
        totalForgotten = 0,
        relearnable = 0,
        averageCost = 0,
        oldestForgotten = nil,
        newestForgotten = nil
    }
    
    local forgottenMoves = MoveManager.getForgottenMoves(pokemon)
    stats.totalForgotten = #forgottenMoves
    
    if stats.totalForgotten == 0 then
        return stats
    end
    
    local totalCost = 0
    local oldestTime = math.huge
    local newestTime = 0
    
    for _, forgottenMove in ipairs(forgottenMoves) do
        -- Check if relearnable (not already known)
        if not MoveManager.hasMove(pokemon, forgottenMove.id) then
            stats.relearnable = stats.relearnable + 1
            local cost = MoveManager.calculateRelearnCost(pokemon, forgottenMove.id, forgottenMove)
            totalCost = totalCost + cost
        end
        
        -- Track oldest and newest
        if forgottenMove.forgottenAt then
            if forgottenMove.forgottenAt < oldestTime then
                oldestTime = forgottenMove.forgottenAt
                stats.oldestForgotten = forgottenMove
            end
            if forgottenMove.forgottenAt > newestTime then
                newestTime = forgottenMove.forgottenAt
                stats.newestForgotten = forgottenMove
            end
        end
    end
    
    stats.averageCost = stats.relearnable > 0 and (totalCost / stats.relearnable) or 0
    
    return stats
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

-- TM/TR Learning Functions

-- Learn a move from TM
-- @param pokemon: Pokemon instance
-- @param tmNumber: TM number (1-100+)
-- @param inventory: Player's inventory (for TM validation)
-- @param options: Additional options (force, slot preference, etc.)
-- @return: Updated Pokemon and inventory, learn result info
function MoveManager.learnFromTM(pokemon, tmNumber, inventory, options)
    if not pokemon or not tmNumber then
        return pokemon, inventory, {
            success = false,
            reason = "invalid_params",
            message = "Pokemon and TM number required"
        }
    end
    
    TMDatabase.init() -- Ensure TM database is loaded
    options = options or {}
    
    -- Validate TM exists and is obtainable
    local tmData = TMDatabase.getTM(tmNumber)
    if not tmData then
        return pokemon, inventory, {
            success = false,
            reason = "tm_not_found",
            message = "TM " .. tmNumber .. " does not exist"
        }
    end
    
    if not tmData.obtainable then
        return pokemon, inventory, {
            success = false,
            reason = "tm_not_obtainable",
            message = "TM " .. tmNumber .. " is not currently obtainable"
        }
    end
    
    -- Check if player has the TM in inventory
    if not inventory or not inventory.tms or not inventory.tms[tmNumber] or inventory.tms[tmNumber] < 1 then
        return pokemon, inventory, {
            success = false,
            reason = "tm_not_in_inventory",
            message = "You don't have TM " .. tmNumber .. " in your inventory"
        }
    end
    
    -- Check species compatibility
    local moveId = tmData.moveId
    if not SpeciesDatabase.isTMCompatible(pokemon.speciesId, moveId) then
        return pokemon, inventory, {
            success = false,
            reason = "incompatible",
            message = pokemon.name .. " cannot learn " .. tmData.name .. " from TM"
        }
    end
    
    -- Attempt to learn the move
    local updatedPokemon, learnResult = MoveManager.learnMove(pokemon, moveId, LearnMethods.TM, options)
    
    if learnResult.success then
        -- TMs are reusable, so don't consume from inventory
        learnResult.tmUsed = tmNumber
        learnResult.tmName = tmData.name
        learnResult.message = pokemon.name .. " learned " .. tmData.name .. " from TM" .. tmNumber .. "!"
    end
    
    return updatedPokemon, inventory, learnResult
end

-- Learn a move from TR
-- @param pokemon: Pokemon instance
-- @param trNumber: TR number (1-100+)
-- @param inventory: Player's inventory (for TR validation and consumption)
-- @param options: Additional options (force, slot preference, etc.)
-- @return: Updated Pokemon and inventory, learn result info
function MoveManager.learnFromTR(pokemon, trNumber, inventory, options)
    if not pokemon or not trNumber then
        return pokemon, inventory, {
            success = false,
            reason = "invalid_params",
            message = "Pokemon and TR number required"
        }
    end
    
    TMDatabase.init() -- Ensure TM database is loaded
    options = options or {}
    
    -- Validate TR exists and is obtainable
    local trData = TMDatabase.getTR(trNumber)
    if not trData then
        return pokemon, inventory, {
            success = false,
            reason = "tr_not_found",
            message = "TR " .. trNumber .. " does not exist"
        }
    end
    
    if not trData.obtainable then
        return pokemon, inventory, {
            success = false,
            reason = "tr_not_obtainable",
            message = "TR " .. trNumber .. " is not currently obtainable"
        }
    end
    
    -- Check if player has the TR in inventory
    if not inventory or not inventory.trs or not inventory.trs[trNumber] or inventory.trs[trNumber] < 1 then
        return pokemon, inventory, {
            success = false,
            reason = "tr_not_in_inventory",
            message = "You don't have TR " .. trNumber .. " in your inventory"
        }
    end
    
    -- Check species compatibility
    local moveId = trData.moveId
    if not SpeciesDatabase.isTRCompatible(pokemon.speciesId, moveId) then
        return pokemon, inventory, {
            success = false,
            reason = "incompatible",
            message = pokemon.name .. " cannot learn " .. trData.name .. " from TR"
        }
    end
    
    -- Attempt to learn the move
    local updatedPokemon, learnResult = MoveManager.learnMove(pokemon, moveId, LearnMethods.TUTOR, options)
    
    if learnResult.success then
        -- TRs are single-use, so consume from inventory
        if not inventory.trs then inventory.trs = {} end
        inventory.trs[trNumber] = (inventory.trs[trNumber] or 0) - 1
        if inventory.trs[trNumber] <= 0 then
            inventory.trs[trNumber] = nil
        end
        
        learnResult.trUsed = trNumber
        learnResult.trName = trData.name
        learnResult.trConsumed = true
        learnResult.message = pokemon.name .. " learned " .. trData.name .. " from TR" .. trNumber .. "! The TR was consumed."
    end
    
    return updatedPokemon, inventory, learnResult
end

-- Check if Pokemon can learn a move from TM/TR
-- @param pokemon: Pokemon instance
-- @param machineNumber: TM/TR number
-- @param machineType: "tm" or "tr"
-- @return: Boolean indicating compatibility, reason if not compatible
function MoveManager.canLearnFromMachine(pokemon, machineNumber, machineType)
    if not pokemon or not machineNumber or not machineType then
        return false, "invalid_parameters"
    end
    
    TMDatabase.init()
    local machineData
    local moveId
    
    if machineType == "tm" then
        machineData = TMDatabase.getTM(machineNumber)
        if machineData then
            moveId = machineData.moveId
            return SpeciesDatabase.isTMCompatible(pokemon.speciesId, moveId), "tm_compatibility"
        end
    elseif machineType == "tr" then
        machineData = TMDatabase.getTR(machineNumber)
        if machineData then
            moveId = machineData.moveId
            return SpeciesDatabase.isTRCompatible(pokemon.speciesId, moveId), "tr_compatibility"
        end
    end
    
    return false, "machine_not_found"
end

-- Get all TMs/TRs that a Pokemon can learn
-- @param pokemon: Pokemon instance
-- @param machineType: "tm", "tr", or "both"
-- @return: Table with learnable machines {tm: [...], tr: [...]}
function MoveManager.getLearnableMachines(pokemon, machineType)
    if not pokemon then
        return {tm = {}, tr = {}}
    end
    
    TMDatabase.init()
    SpeciesDatabase.init()
    machineType = machineType or "both"
    
    local result = {tm = {}, tr = {}}
    local speciesData = SpeciesDatabase.getSpecies(pokemon.speciesId)
    if not speciesData then
        return result
    end
    
    -- Get learnable TMs
    if machineType == "tm" or machineType == "both" then
        if speciesData.tmMoves then
            for _, moveId in ipairs(speciesData.tmMoves) do
                local tmNumbers = TMDatabase.getTMsForMove(moveId)
                for _, tmNumber in ipairs(tmNumbers) do
                    local tmData = TMDatabase.getTM(tmNumber)
                    if tmData and tmData.obtainable then
                        table.insert(result.tm, {
                            number = tmNumber,
                            moveId = moveId,
                            name = tmData.name,
                            description = tmData.description,
                            cost = tmData.cost
                        })
                    end
                end
            end
        end
    end
    
    -- Get learnable TRs
    if machineType == "tr" or machineType == "both" then
        if speciesData.trMoves then
            for _, moveId in ipairs(speciesData.trMoves) do
                local trNumbers = TMDatabase.getTRsForMove(moveId)
                for _, trNumber in ipairs(trNumbers) do
                    local trData = TMDatabase.getTR(trNumber)
                    if trData and trData.obtainable then
                        table.insert(result.tr, {
                            number = trNumber,
                            moveId = moveId,
                            name = trData.name,
                            description = trData.description,
                            cost = trData.cost
                        })
                    end
                end
            end
        end
    end
    
    -- Sort by machine number
    table.sort(result.tm, function(a, b) return a.number < b.number end)
    table.sort(result.tr, function(a, b) return a.number < b.number end)
    
    return result
end

-- Validate TM/TR inventory structure
-- @param inventory: Inventory object
-- @return: Boolean indicating if inventory is valid, array of errors
function MoveManager.validateTMTRInventory(inventory)
    if not inventory then
        return false, {"Inventory is required"}
    end
    
    local errors = {}
    
    -- Check TM inventory structure
    if inventory.tms then
        if type(inventory.tms) ~= "table" then
            table.insert(errors, "TM inventory must be table")
        else
            for tmNumber, count in pairs(inventory.tms) do
                if type(tmNumber) ~= "number" or tmNumber < 1 then
                    table.insert(errors, "Invalid TM number: " .. tostring(tmNumber))
                end
                if type(count) ~= "number" or count < 0 then
                    table.insert(errors, "Invalid TM count for TM " .. tmNumber .. ": " .. tostring(count))
                end
            end
        end
    end
    
    -- Check TR inventory structure  
    if inventory.trs then
        if type(inventory.trs) ~= "table" then
            table.insert(errors, "TR inventory must be table")
        else
            for trNumber, count in pairs(inventory.trs) do
                if type(trNumber) ~= "number" or trNumber < 1 then
                    table.insert(errors, "Invalid TR number: " .. tostring(trNumber))
                end
                if type(count) ~= "number" or count < 0 then
                    table.insert(errors, "Invalid TR count for TR " .. trNumber .. ": " .. tostring(count))
                end
            end
        end
    end
    
    return #errors == 0, errors
end

-- Egg Move Functions

-- Process egg move inheritance during breeding
-- @param motherPokemon: Mother Pokemon instance
-- @param fatherPokemon: Father Pokemon instance
-- @return: Array of inherited egg moves
function MoveManager.processEggMoveInheritance(motherPokemon, fatherPokemon)
    if not motherPokemon or not fatherPokemon then
        return {}
    end
    
    -- Get parent species and moves
    local motherSpeciesId = motherPokemon.speciesId
    local fatherSpeciesId = fatherPokemon.speciesId
    local motherMoves = motherPokemon.moves or {}
    local fatherMoves = fatherPokemon.moves or {}
    
    -- Use egg moves database to process inheritance
    return EggMoves.processEggMoveInheritance(motherSpeciesId, fatherSpeciesId, motherMoves, fatherMoves)
end

-- Get possible egg moves for a species
-- @param speciesId: Species ID
-- @return: Array of move IDs that can be inherited as egg moves
function MoveManager.getEggMovesForSpecies(speciesId)
    if not speciesId then
        return {}
    end
    
    return EggMoves.getEggMovesForSpecies(speciesId)
end

-- Validate if a move can be inherited as an egg move
-- @param motherSpeciesId: Mother's species ID
-- @param fatherSpeciesId: Father's species ID  
-- @param moveId: Move ID to validate
-- @return: Boolean success, string error message
function MoveManager.validateEggMoveInheritance(motherSpeciesId, fatherSpeciesId, moveId)
    if not motherSpeciesId or not fatherSpeciesId or not moveId then
        return false, "Missing required parameters for egg move validation"
    end
    
    return EggMoves.validateEggMoveInheritance(motherSpeciesId, fatherSpeciesId, moveId)
end

-- Add egg moves to a newly hatched Pokemon
-- @param pokemon: Pokemon instance (newly hatched)
-- @param inheritedMoves: Array of inherited egg moves from processEggMoveInheritance
-- @return: Boolean success, string error message
function MoveManager.addEggMovesToPokemon(pokemon, inheritedMoves)
    if not pokemon then
        return false, "Pokemon is required"
    end
    
    if not inheritedMoves or #inheritedMoves == 0 then
        return true, "No egg moves to add"
    end
    
    local errors = {}
    local movesAdded = 0
    
    for _, eggMove in ipairs(inheritedMoves) do
        if movesAdded >= EggMoves.breedingRequirements.maxEggMovesPerPokemon then
            break
        end
        
        -- Check if Pokemon has room for more moves
        if #(pokemon.moves or {}) >= MAX_MOVES then
            table.insert(errors, "Pokemon already has maximum moves")
            break
        end
        
        -- Add the egg move
        local success, error = MoveManager.teachMove(pokemon, eggMove.moveId, 1, LearnMethods.EGG)
        if success then
            movesAdded = movesAdded + 1
        else
            table.insert(errors, "Failed to add egg move " .. eggMove.moveId .. ": " .. (error or "Unknown error"))
        end
    end
    
    if #errors > 0 then
        return false, table.concat(errors, "; ")
    end
    
    return true, "Successfully added " .. movesAdded .. " egg moves"
end

-- Get breeding compatibility for egg moves
-- @param speciesId: Species ID to check compatibility for
-- @return: Table with compatible parent species and egg group info
function MoveManager.getEggMoveCompatibility(speciesId)
    if not speciesId then
        return {}
    end
    
    return {
        compatibleParents = EggMoves.getCompatibleParentsForSpecies(speciesId),
        eggMoves = EggMoves.getEggMovesForSpecies(speciesId)
    }
end

-- Move Tutor Functions

-- Get available tutor moves for a Pokemon species
-- @param speciesId: Species ID
-- @param tutorId: Optional specific tutor ID
-- @return: Array of available moves with cost information
function MoveManager.getAvailableTutorMoves(speciesId, tutorId)
    if not speciesId then
        return {}
    end
    
    return TutorMoves.getAvailableMovesForSpecies(speciesId, tutorId)
end

-- Validate if a Pokemon can learn a move from a tutor
-- @param pokemon: Pokemon instance
-- @param tutorId: Tutor ID
-- @param moveId: Move ID to learn
-- @param playerResources: Player's resources (battle points, coins, etc.)
-- @return: Boolean success, string error message
function MoveManager.validateTutorLearning(pokemon, tutorId, moveId, playerResources)
    if not pokemon or not tutorId or not moveId then
        return false, "Missing required parameters"
    end
    
    -- Check species compatibility
    local canLearn, reason = TutorMoves.canLearnFromTutor(pokemon.speciesId, tutorId, moveId)
    if not canLearn then
        return false, reason
    end
    
    -- Check if Pokemon already knows the move
    if MoveManager.hasMove(pokemon, moveId) then
        return false, "Pokemon already knows this move"
    end
    
    -- Check level requirements
    local levelReq = TutorMoves.requirements.levelRequirements[tutorId]
    if levelReq and pokemon.level < levelReq then
        return false, "Pokemon must be at least level " .. levelReq
    end
    
    -- Check player resources
    local hasResources, resourceReason = TutorMoves.validatePlayerResources(tutorId, moveId, playerResources)
    if not hasResources then
        return false, resourceReason
    end
    
    return true, "Pokemon can learn move from tutor"
end

-- Learn a move from a tutor
-- @param pokemon: Pokemon instance
-- @param tutorId: Tutor ID
-- @param moveId: Move ID to learn
-- @param playerResources: Player's current resources
-- @return: Boolean success, table updated resources, string message
function MoveManager.learnMoveFromTutor(pokemon, tutorId, moveId, playerResources)
    if not pokemon or not tutorId or not moveId or not playerResources then
        return false, {}, "Missing required parameters"
    end
    
    -- Validate the learning attempt
    local canLearn, reason = MoveManager.validateTutorLearning(pokemon, tutorId, moveId, playerResources)
    if not canLearn then
        return false, playerResources, reason
    end
    
    -- Process the transaction
    local success, updatedResources, transactionMessage = TutorMoves.processTutorLearning(tutorId, moveId, playerResources)
    if not success then
        return false, playerResources, transactionMessage
    end
    
    -- Check if Pokemon has room for the move
    if #(pokemon.moves or {}) >= MAX_MOVES then
        -- Need to replace a move - this should be handled by the calling code
        return false, updatedResources, "Pokemon has maximum moves - choose a move to replace"
    end
    
    -- Teach the move
    local teachSuccess, teachError = MoveManager.teachMove(pokemon, moveId, pokemon.level, LearnMethods.TUTOR)
    if not teachSuccess then
        -- Refund the transaction since teaching failed
        return false, playerResources, "Failed to teach move: " .. (teachError or "Unknown error")
    end
    
    return true, updatedResources, "Successfully learned move from tutor"
end

-- Learn a move from tutor with move replacement
-- @param pokemon: Pokemon instance
-- @param tutorId: Tutor ID
-- @param moveId: Move ID to learn
-- @param replaceSlot: Move slot to replace (1-4)
-- @param playerResources: Player's current resources
-- @return: Boolean success, table updated resources, string message
function MoveManager.learnMoveFromTutorWithReplacement(pokemon, tutorId, moveId, replaceSlot, playerResources)
    if not pokemon or not tutorId or not moveId or not replaceSlot or not playerResources then
        return false, {}, "Missing required parameters"
    end
    
    -- Validate the learning attempt (excluding move count check)
    local canLearn, reason = TutorMoves.canLearnFromTutor(pokemon.speciesId, tutorId, moveId)
    if not canLearn then
        return false, playerResources, reason
    end
    
    -- Check if Pokemon already knows the move
    if MoveManager.hasMove(pokemon, moveId) then
        return false, playerResources, "Pokemon already knows this move"
    end
    
    -- Check level requirements
    local levelReq = TutorMoves.requirements.levelRequirements[tutorId]
    if levelReq and pokemon.level < levelReq then
        return false, playerResources, "Pokemon must be at least level " .. levelReq
    end
    
    -- Check player resources
    local hasResources, resourceReason = TutorMoves.validatePlayerResources(tutorId, moveId, playerResources)
    if not hasResources then
        return false, playerResources, resourceReason
    end
    
    -- Validate replace slot
    if replaceSlot < 1 or replaceSlot > MAX_MOVES then
        return false, playerResources, "Invalid move slot: " .. replaceSlot
    end
    
    if not pokemon.moves or not pokemon.moves[replaceSlot] then
        return false, playerResources, "No move to replace in slot " .. replaceSlot
    end
    
    -- Process the transaction
    local success, updatedResources, transactionMessage = TutorMoves.processTutorLearning(tutorId, moveId, playerResources)
    if not success then
        return false, playerResources, transactionMessage
    end
    
    -- Replace the move
    local replaceSuccess, replaceError = MoveManager.replaceMove(pokemon, replaceSlot, moveId, LearnMethods.TUTOR)
    if not replaceSuccess then
        -- Refund the transaction since replacement failed
        return false, playerResources, "Failed to replace move: " .. (replaceError or "Unknown error")
    end
    
    return true, updatedResources, "Successfully learned move from tutor and replaced move in slot " .. replaceSlot
end

-- Get all available tutors
-- @return: Array of tutor information
function MoveManager.getAllTutors()
    return TutorMoves.getAllTutors()
end

-- Get tutor move cost
-- @param tutorId: Tutor ID
-- @param moveId: Move ID
-- @return: Number cost
function MoveManager.getTutorMoveCost(tutorId, moveId)
    if not tutorId or not moveId then
        return 0
    end
    
    return TutorMoves.getMoveCost(tutorId, moveId)
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