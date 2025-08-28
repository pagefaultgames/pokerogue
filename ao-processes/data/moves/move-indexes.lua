-- Move Indexes
-- Fast lookup indexes for move database queries
-- Provides O(1) lookup performance for battle processing and move validation
-- Integrates with move-database.lua for comprehensive move system

local MoveIndexes = {}

-- Index tables for fast lookups
MoveIndexes.byType = {}
MoveIndexes.byCategory = {}
MoveIndexes.byPowerRange = {}
MoveIndexes.byTarget = {}
MoveIndexes.byFlags = {}
MoveIndexes.byPriority = {}
MoveIndexes.byAccuracy = {}
MoveIndexes.byGeneration = {}

-- Special move collections
MoveIndexes.physicalMoves = {}
MoveIndexes.specialMoves = {}
MoveIndexes.statusMoves = {}
MoveIndexes.contactMoves = {}
MoveIndexes.nonContactMoves = {}
MoveIndexes.protectMoves = {}
MoveIndexes.soundMoves = {}
MoveIndexes.punchingMoves = {}
MoveIndexes.slicingMoves = {}
MoveIndexes.priorityMoves = {}
MoveIndexes.multiHitMoves = {}
MoveIndexes.chargingMoves = {}
MoveIndexes.recoilMoves = {}
MoveIndexes.healingMoves = {}

-- Initialize all indexes based on move database
-- Should be called after MoveDatabase.init()
function MoveIndexes.buildIndexes(moveDatabase)
    -- Clear existing indexes
    MoveIndexes.byType = {}
    MoveIndexes.byCategory = {}
    MoveIndexes.byPowerRange = {}
    MoveIndexes.byTarget = {}
    MoveIndexes.byFlags = {}
    MoveIndexes.byPriority = {}
    MoveIndexes.byAccuracy = {}
    MoveIndexes.byGeneration = {}
    
    MoveIndexes.physicalMoves = {}
    MoveIndexes.specialMoves = {}
    MoveIndexes.statusMoves = {}
    MoveIndexes.contactMoves = {}
    MoveIndexes.nonContactMoves = {}
    MoveIndexes.protectMoves = {}
    MoveIndexes.soundMoves = {}
    MoveIndexes.punchingMoves = {}
    MoveIndexes.slicingMoves = {}
    MoveIndexes.priorityMoves = {}
    MoveIndexes.multiHitMoves = {}
    MoveIndexes.chargingMoves = {}
    MoveIndexes.recoilMoves = {}
    MoveIndexes.healingMoves = {}
    
    -- Build indexes from move database
    for moveId, move in pairs(moveDatabase.moves) do
        -- Index by type
        if not MoveIndexes.byType[move.type] then
            MoveIndexes.byType[move.type] = {}
        end
        table.insert(MoveIndexes.byType[move.type], moveId)
        
        -- Index by category
        if not MoveIndexes.byCategory[move.category] then
            MoveIndexes.byCategory[move.category] = {}
        end
        table.insert(MoveIndexes.byCategory[move.category], moveId)
        
        -- Category-specific collections
        if move.category == 0 then -- Physical
            table.insert(MoveIndexes.physicalMoves, moveId)
        elseif move.category == 1 then -- Special
            table.insert(MoveIndexes.specialMoves, moveId)
        elseif move.category == 2 then -- Status
            table.insert(MoveIndexes.statusMoves, moveId)
        end
        
        -- Index by power range
        local powerRange = MoveIndexes.getPowerRange(move.power)
        if not MoveIndexes.byPowerRange[powerRange] then
            MoveIndexes.byPowerRange[powerRange] = {}
        end
        table.insert(MoveIndexes.byPowerRange[powerRange], moveId)
        
        -- Index by target
        if not MoveIndexes.byTarget[move.target] then
            MoveIndexes.byTarget[move.target] = {}
        end
        table.insert(MoveIndexes.byTarget[move.target], moveId)
        
        -- Index by priority
        if not MoveIndexes.byPriority[move.priority] then
            MoveIndexes.byPriority[move.priority] = {}
        end
        table.insert(MoveIndexes.byPriority[move.priority], moveId)
        
        -- Priority moves collection
        if move.priority > 0 then
            table.insert(MoveIndexes.priorityMoves, moveId)
        end
        
        -- Index by accuracy
        if not MoveIndexes.byAccuracy[move.accuracy] then
            MoveIndexes.byAccuracy[move.accuracy] = {}
        end
        table.insert(MoveIndexes.byAccuracy[move.accuracy], moveId)
        
        -- Index by flags
        for _, flag in ipairs(move.flags) do
            if not MoveIndexes.byFlags[flag] then
                MoveIndexes.byFlags[flag] = {}
            end
            table.insert(MoveIndexes.byFlags[flag], moveId)
            
            -- Special flag-based collections
            if flag == 0 then -- MAKES_CONTACT
                table.insert(MoveIndexes.contactMoves, moveId)
            end
            if flag == 2 then -- SOUND_BASED
                table.insert(MoveIndexes.soundMoves, moveId)
            end
            if flag == 7 then -- PUNCHING_MOVE
                table.insert(MoveIndexes.punchingMoves, moveId)
            end
            if flag == 8 then -- SLICING_MOVE
                table.insert(MoveIndexes.slicingMoves, moveId)
            end
        end
        
        -- Non-contact moves (doesn't have contact flag)
        local hasContact = false
        for _, flag in ipairs(move.flags) do
            if flag == 0 then -- MAKES_CONTACT
                hasContact = true
                break
            end
        end
        if not hasContact then
            table.insert(MoveIndexes.nonContactMoves, moveId)
        end
        
        -- Special effect-based collections
        if move.effects then
            if move.effects.multi_hit then
                table.insert(MoveIndexes.multiHitMoves, moveId)
            end
            if move.effects.charging then
                table.insert(MoveIndexes.chargingMoves, moveId)
            end
            if move.effects.recoil then
                table.insert(MoveIndexes.recoilMoves, moveId)
            end
            if move.effects.healing then
                table.insert(MoveIndexes.healingMoves, moveId)
            end
        end
    end
    
    -- Sort all indexes for consistent ordering
    for _, indexTable in pairs(MoveIndexes.byType) do
        table.sort(indexTable)
    end
    for _, indexTable in pairs(MoveIndexes.byCategory) do
        table.sort(indexTable)
    end
    for _, indexTable in pairs(MoveIndexes.byPowerRange) do
        table.sort(indexTable)
    end
    for _, indexTable in pairs(MoveIndexes.byTarget) do
        table.sort(indexTable)
    end
    for _, indexTable in pairs(MoveIndexes.byFlags) do
        table.sort(indexTable)
    end
    for _, indexTable in pairs(MoveIndexes.byPriority) do
        table.sort(indexTable)
    end
    for _, indexTable in pairs(MoveIndexes.byAccuracy) do
        table.sort(indexTable)
    end
    
    table.sort(MoveIndexes.physicalMoves)
    table.sort(MoveIndexes.specialMoves)
    table.sort(MoveIndexes.statusMoves)
    table.sort(MoveIndexes.contactMoves)
    table.sort(MoveIndexes.nonContactMoves)
    table.sort(MoveIndexes.soundMoves)
    table.sort(MoveIndexes.punchingMoves)
    table.sort(MoveIndexes.slicingMoves)
    table.sort(MoveIndexes.priorityMoves)
    table.sort(MoveIndexes.multiHitMoves)
    table.sort(MoveIndexes.chargingMoves)
    table.sort(MoveIndexes.recoilMoves)
    table.sort(MoveIndexes.healingMoves)
    
    print("MoveIndexes built for " .. MoveIndexes.getTotalIndexedMoves() .. " moves")
end

-- Get power range category for indexing
-- @param power: Move power value
-- @return: Power range string
function MoveIndexes.getPowerRange(power)
    if power == 0 then
        return "no_damage"
    elseif power <= 40 then
        return "weak"
    elseif power <= 70 then
        return "moderate"
    elseif power <= 100 then
        return "strong"
    elseif power <= 150 then
        return "very_strong"
    else
        return "extreme"
    end
end

-- Get moves by type with O(1) lookup
-- @param type: Pokemon type ID
-- @return: Array of move IDs or empty array
function MoveIndexes.getMovesByType(type)
    return MoveIndexes.byType[type] or {}
end

-- Get moves by category with O(1) lookup
-- @param category: Move category (0=Physical, 1=Special, 2=Status)
-- @return: Array of move IDs or empty array
function MoveIndexes.getMovesByCategory(category)
    return MoveIndexes.byCategory[category] or {}
end

-- Get moves by power range
-- @param powerRange: Power range string ("weak", "moderate", "strong", etc.)
-- @return: Array of move IDs or empty array
function MoveIndexes.getMovesByPowerRange(powerRange)
    return MoveIndexes.byPowerRange[powerRange] or {}
end

-- Get moves by target type
-- @param target: Move target type ID
-- @return: Array of move IDs or empty array
function MoveIndexes.getMovesByTarget(target)
    return MoveIndexes.byTarget[target] or {}
end

-- Get moves by flag
-- @param flag: Move flag bitmask value
-- @return: Array of move IDs or empty array
function MoveIndexes.getMovesByFlag(flag)
    return MoveIndexes.byFlags[flag] or {}
end

-- Get moves by priority
-- @param priority: Move priority value
-- @return: Array of move IDs or empty array
function MoveIndexes.getMovesByPriority(priority)
    return MoveIndexes.byPriority[priority] or {}
end

-- Get moves by accuracy
-- @param accuracy: Move accuracy value
-- @return: Array of move IDs or empty array
function MoveIndexes.getMovesByAccuracy(accuracy)
    return MoveIndexes.byAccuracy[accuracy] or {}
end

-- Get all physical moves
-- @return: Array of physical move IDs
function MoveIndexes.getPhysicalMoves()
    return MoveIndexes.physicalMoves
end

-- Get all special moves
-- @return: Array of special move IDs
function MoveIndexes.getSpecialMoves()
    return MoveIndexes.specialMoves
end

-- Get all status moves
-- @return: Array of status move IDs
function MoveIndexes.getStatusMoves()
    return MoveIndexes.statusMoves
end

-- Get all contact moves
-- @return: Array of contact move IDs
function MoveIndexes.getContactMoves()
    return MoveIndexes.contactMoves
end

-- Get all non-contact moves
-- @return: Array of non-contact move IDs
function MoveIndexes.getNonContactMoves()
    return MoveIndexes.nonContactMoves
end

-- Get all sound-based moves
-- @return: Array of sound move IDs
function MoveIndexes.getSoundMoves()
    return MoveIndexes.soundMoves
end

-- Get all punching moves
-- @return: Array of punching move IDs
function MoveIndexes.getPunchingMoves()
    return MoveIndexes.punchingMoves
end

-- Get all slicing moves
-- @return: Array of slicing move IDs
function MoveIndexes.getSlicingMoves()
    return MoveIndexes.slicingMoves
end

-- Get all priority moves (priority > 0)
-- @return: Array of priority move IDs
function MoveIndexes.getPriorityMoves()
    return MoveIndexes.priorityMoves
end

-- Get all multi-hit moves
-- @return: Array of multi-hit move IDs
function MoveIndexes.getMultiHitMoves()
    return MoveIndexes.multiHitMoves
end

-- Get all charging moves
-- @return: Array of charging move IDs
function MoveIndexes.getChargingMoves()
    return MoveIndexes.chargingMoves
end

-- Get all recoil moves
-- @return: Array of recoil move IDs
function MoveIndexes.getRecoilMoves()
    return MoveIndexes.recoilMoves
end

-- Get all healing moves
-- @return: Array of healing move IDs
function MoveIndexes.getHealingMoves()
    return MoveIndexes.healingMoves
end

-- Get total number of indexed moves
-- @return: Count of unique moves in indexes
function MoveIndexes.getTotalIndexedMoves()
    local count = 0
    count = count + #MoveIndexes.physicalMoves
    count = count + #MoveIndexes.specialMoves
    count = count + #MoveIndexes.statusMoves
    return count
end

-- Get index statistics
-- @return: Table with index statistics
function MoveIndexes.getIndexStats()
    return {
        total_moves = MoveIndexes.getTotalIndexedMoves(),
        physical_moves = #MoveIndexes.physicalMoves,
        special_moves = #MoveIndexes.specialMoves,
        status_moves = #MoveIndexes.statusMoves,
        contact_moves = #MoveIndexes.contactMoves,
        sound_moves = #MoveIndexes.soundMoves,
        punching_moves = #MoveIndexes.punchingMoves,
        slicing_moves = #MoveIndexes.slicingMoves,
        priority_moves = #MoveIndexes.priorityMoves,
        multi_hit_moves = #MoveIndexes.multiHitMoves,
        charging_moves = #MoveIndexes.chargingMoves,
        recoil_moves = #MoveIndexes.recoilMoves,
        healing_moves = #MoveIndexes.healingMoves
    }
end

return MoveIndexes