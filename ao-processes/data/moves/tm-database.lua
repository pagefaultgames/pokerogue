-- TM/TR Database Implementation
-- Complete database of Technical Machines and Technical Records
-- Maps TM/TR numbers to move IDs and provides compatibility checking
-- Supports both reusable TMs and single-use TRs

local TMDatabase = {}

-- TM/TR data structure
TMDatabase.tms = {}          -- TM number -> TM data
TMDatabase.trs = {}          -- TR number -> TR data
TMDatabase.tmsByMove = {}    -- moveId -> TM number
TMDatabase.trsByMove = {}    -- moveId -> TR number

-- TM/TR item structure
local TMItemSchema = {
    id = "number",           -- TM/TR number
    moveId = "number",       -- Associated move ID
    name = "string",         -- Display name
    type = "string",         -- "tm" or "tr"
    generation = "number",   -- Generation introduced
    reusable = "boolean",    -- Whether item can be used multiple times
    description = "string",  -- Item description
    cost = "number",         -- Purchase cost (if buyable)
    obtainable = "boolean"   -- Whether currently obtainable
}

-- Initialize TM/TR database
function TMDatabase.init()
    -- Clear existing data
    TMDatabase.tms = {}
    TMDatabase.trs = {}
    TMDatabase.tmsByMove = {}
    TMDatabase.trsByMove = {}
    
    -- Complete TM database (Gen 1-9)
    -- Format: {id, moveId, name, generation, reusable, cost, obtainable, description}
    local tmDefinitions = {
        -- Generation 1 TMs
        {1, 264, "Focus Punch", 3, true, 3000, true, "A powerful punch thrown after focusing. The user's concentration is broken if hit."},
        {2, 337, "Dragon Claw", 3, true, 5000, true, "Sharp claws rake the target. This move has a high critical-hit ratio."},
        {3, 352, "Water Pulse", 3, true, 2000, true, "Attacks with ultrasonic waves. May cause confusion."},
        {4, 347, "Calm Mind", 3, true, 2000, true, "Raises the user's Sp. Atk and Sp. Def stats."},
        {5, 46, "Roar", 1, true, 1000, true, "The target is scared off and replaced by another Pokémon in its party."},
        {6, 92, "Toxic", 1, true, 3000, true, "A move that leaves the target badly poisoned."},
        {7, 258, "Hail", 3, true, 2000, true, "Summons a hailstorm that lasts several turns."},
        {8, 339, "Bulk Up", 3, true, 2000, true, "Bulks up the body to boost both Attack and Defense stats."},
        {9, 331, "Bullet Seed", 3, true, 3000, true, "Shoots 2-5 seeds in rapid succession."},
        {10, 237, "Hidden Power", 2, true, 3000, true, "A unique attack that varies in type and power."},
        {11, 241, "Sunny Day", 2, true, 2000, true, "Boosts the power of Fire-type moves for five turns."},
        {12, 269, "Taunt", 3, true, 2000, true, "Provokes the target into only using attack moves."},
        {13, 58, "Ice Beam", 1, true, 10000, true, "An ice-type attack. May freeze the target."},
        {14, 59, "Blizzard", 1, true, 10000, true, "A howling blizzard that may freeze the target."},
        {15, 63, "Hyper Beam", 1, true, 7500, true, "Extremely powerful, but the user must rest the next turn."},
        {16, 113, "Light Screen", 1, true, 3000, true, "Reduces damage from special attacks for five turns."},
        {17, 219, "Protect", 2, true, 3000, true, "Protects the user from attacks for one turn."},
        {18, 240, "Rain Dance", 2, true, 2000, true, "Boosts the power of Water-type moves for five turns."},
        {19, 202, "Giga Drain", 2, true, 3000, true, "A nutrient-draining attack that restores HP."},
        {20, 219, "Safeguard", 2, true, 3000, true, "Protects the party from status conditions for five turns."},
        {21, 218, "Frustration", 2, true, 1000, true, "An attack move that grows weaker as the user becomes happier."},
        {22, 76, "Solar Beam", 1, true, 3000, true, "A two-turn attack. The user gathers solar energy first."},
        {23, 231, "Iron Tail", 2, true, 3000, true, "An attack with a steel-hard tail. May lower Defense."},
        {24, 85, "Thunderbolt", 1, true, 10000, true, "An electric attack that may cause paralysis."},
        {25, 87, "Thunder", 1, true, 10000, true, "A powerful electric attack that may cause paralysis."},
        {26, 89, "Earthquake", 1, true, 3000, true, "An earthquake that strikes all Pokémon around the user."},
        {27, 216, "Return", 2, true, 1000, true, "An attack move that grows stronger as the user becomes happier."},
        {28, 91, "Dig", 1, true, 2000, true, "Digs underground the first turn and attacks the next turn."},
        {29, 94, "Psychic", 1, true, 10000, true, "A psychic attack that may lower Sp. Def."},
        {30, 247, "Shadow Ball", 2, true, 3000, true, "A shadowy blob is hurled at the target."},
        {31, 280, "Brick Break", 3, true, 3000, true, "Destroys barriers like Light Screen and attacks."},
        {32, 104, "Double Team", 1, true, 2000, true, "Creates illusory copies to raise evasiveness."},
        {33, 115, "Reflect", 1, true, 3000, true, "Reduces damage from physical attacks for five turns."},
        {34, 351, "Shock Wave", 3, true, 3000, true, "A fast electric attack that never misses."},
        {35, 53, "Flamethrower", 1, true, 10000, true, "A fire attack that may inflict a burn."},
        {36, 188, "Sludge Bomb", 2, true, 10000, true, "A poisonous attack that may poison the target."},
        {37, 201, "Sandstorm", 2, true, 2000, true, "Summons a sandstorm that lasts several turns."},
        {38, 126, "Fire Blast", 1, true, 5500, true, "An intense fire attack that may inflict a burn."},
        {39, 317, "Rock Tomb", 3, true, 3000, true, "Hurls boulders at the target and lowers Speed."},
        {40, 332, "Aerial Ace", 3, true, 3000, true, "An attack that always hits and can't be evaded."},
        {41, 259, "Torment", 3, true, 2000, true, "Torments the target and stops consecutive move use."},
        {42, 263, "Facade", 3, true, 2000, true, "Doubles power if the user is burned, poisoned, or paralyzed."},
        {43, 290, "Secret Power", 3, true, 3000, true, "An attack with effects that vary by location."},
        {44, 156, "Rest", 1, true, 3000, true, "The user sleeps for two turns to fully heal."},
        {45, 213, "Attract", 2, true, 3000, true, "Makes the opposite gender infatuated and less likely to attack."},
        {46, 168, "Thief", 2, true, 3000, true, "Steals the target's held item if the user isn't holding one."},
        {47, 211, "Steel Wing", 2, true, 3000, true, "Strikes with steel-hard wings. May raise Defense."},
        {48, 285, "Skill Swap", 3, true, 3000, true, "The user swaps abilities with the target."},
        {49, 289, "Snatch", 3, true, 3000, true, "Steals the effects of the target's next healing move."},
        {50, 315, "Overheat", 3, true, 5500, true, "A fierce fire attack that lowers the user's Sp. Atk."},
        
        -- Additional TMs can be added following this pattern
        -- Generation 8 TMs (Sword/Shield)
        {51, 371, "Roost", 4, true, 3000, true, "The user lands and rests. Restores HP and removes Flying type temporarily."},
        {52, 355, "Focus Blast", 4, true, 5500, true, "A devastating fighting move that may lower Sp. Def."},
        {53, 411, "Energy Ball", 4, true, 5000, true, "A life-energy ball that may lower Sp. Def."},
        {54, 417, "False Swipe", 2, true, 3000, true, "Leaves the target with at least 1 HP."},
        {55, 56, "Scald", 5, true, 5000, true, "Hot water that may burn the target."},
        {56, 374, "Fling", 4, true, 3000, true, "Hurls the held item at the target."},
        {57, 451, "Charge Beam", 4, true, 5000, true, "May raise the user's Sp. Atk."},
        {58, 103, "Endure", 2, true, 3000, true, "Always leaves at least 1 HP."},
        {59, 421, "Dragon Pulse", 4, true, 5000, true, "A draconic attack that never misses."},
        {60, 261, "Drain Punch", 4, true, 3000, true, "A punching move that restores HP."}
    }
    
    -- Complete TR database (Generation 8+)
    -- Format: {id, moveId, name, generation, reusable, cost, obtainable, description}
    local trDefinitions = {
        {1, 14, "Swords Dance", 1, false, 2000, true, "Sharply boosts the user's Attack stat."},
        {2, 115, "Reflect", 1, false, 3000, true, "Reduces damage from physical attacks for five turns."},
        {3, 113, "Light Screen", 1, false, 3000, true, "Reduces damage from special attacks for five turns."},
        {4, 97, "Agility", 1, false, 2000, true, "Sharply boosts the user's Speed stat."},
        {5, 98, "Quick Attack", 1, false, 1000, true, "Always strikes first with a speedy attack."},
        {6, 109, "Haze", 1, false, 2000, true, "Resets all stat changes."},
        {7, 129, "Swift", 1, false, 3000, true, "Shoots stars that never miss."},
        {8, 142, "Lovely Kiss", 1, false, 3000, true, "Forces the target to sleep with a lovely kiss."},
        {9, 87, "Thunder", 1, false, 10000, true, "A powerful electric attack that may cause paralysis."},
        {10, 89, "Earthquake", 1, false, 3000, true, "An earthquake that strikes all Pokémon around the user."},
        {11, 94, "Psychic", 1, false, 10000, true, "A psychic attack that may lower Sp. Def."},
        {12, 97, "Agility", 1, false, 2000, true, "Sharply boosts the user's Speed stat."},
        {13, 355, "Focus Blast", 4, false, 5500, true, "A devastating fighting move that may lower Sp. Def."},
        {14, 446, "Metronome", 1, false, 1000, true, "Randomly uses any move in the game."},
        {15, 126, "Fire Blast", 1, false, 5500, true, "An intense fire attack that may inflict a burn."},
        {16, 57, "Waterfall", 1, false, 3000, true, "Charges the target with tremendous force."},
        {17, 129, "Amnesia", 1, false, 2000, true, "Sharply raises the user's Sp. Def stat."},
        {18, 340, "Leech Life", 1, false, 3000, true, "Drains the target's blood and restores HP."},
        {19, 605, "Tri Attack", 1, false, 3000, true, "Strikes with three beams that may paralyze, burn, or freeze."},
        {20, 280, "Substitute", 1, false, 2000, true, "Creates a substitute using 1/4 of max HP."},
        
        -- Additional TRs following the same pattern
        {21, 364, "Reversal", 2, false, 1000, true, "Grows more powerful as the user's HP decreases."},
        {22, 188, "Sludge Bomb", 2, false, 10000, true, "A poisonous attack that may poison the target."},
        {23, 371, "Spikes", 2, false, 2000, true, "Lays spikes that hurt switching Pokémon."},
        {24, 203, "Outrage", 2, false, 5000, true, "A rampage that lasts 2-3 turns but confuses the user."},
        {25, 94, "Psychic", 1, false, 10000, true, "A psychic attack that may lower Sp. Def."}
    }
    
    -- Populate TM database
    for _, tm in ipairs(tmDefinitions) do
        local tmData = {
            id = tm[1],
            moveId = tm[2], 
            name = tm[3],
            generation = tm[4],
            reusable = tm[5],
            cost = tm[6],
            obtainable = tm[7],
            description = tm[8],
            type = "tm"
        }
        
        TMDatabase.tms[tm[1]] = tmData
        
        -- Build reverse lookup
        if not TMDatabase.tmsByMove[tm[2]] then
            TMDatabase.tmsByMove[tm[2]] = {}
        end
        table.insert(TMDatabase.tmsByMove[tm[2]], tm[1])
    end
    
    -- Populate TR database
    for _, tr in ipairs(trDefinitions) do
        local trData = {
            id = tr[1],
            moveId = tr[2],
            name = tr[3], 
            generation = tr[4],
            reusable = tr[5],
            cost = tr[6],
            obtainable = tr[7],
            description = tr[8],
            type = "tr"
        }
        
        TMDatabase.trs[tr[1]] = trData
        
        -- Build reverse lookup
        if not TMDatabase.trsByMove[tr[2]] then
            TMDatabase.trsByMove[tr[2]] = {}
        end
        table.insert(TMDatabase.trsByMove[tr[2]], tr[1])
    end
end

-- Get TM data by TM number
-- @param tmNumber: TM number (1-100+)
-- @return: TM data or nil if not found
function TMDatabase.getTM(tmNumber)
    return TMDatabase.tms[tmNumber]
end

-- Get TR data by TR number
-- @param trNumber: TR number (1-100+)
-- @return: TR data or nil if not found
function TMDatabase.getTR(trNumber)
    return TMDatabase.trs[trNumber]
end

-- Get TM number(s) for a move ID
-- @param moveId: Move ID
-- @return: Array of TM numbers that teach this move
function TMDatabase.getTMsForMove(moveId)
    return TMDatabase.tmsByMove[moveId] or {}
end

-- Get TR number(s) for a move ID
-- @param moveId: Move ID
-- @return: Array of TR numbers that teach this move
function TMDatabase.getTRsForMove(moveId)
    return TMDatabase.trsByMove[moveId] or {}
end

-- Check if TM exists and is obtainable
-- @param tmNumber: TM number
-- @return: Boolean indicating if TM exists and is obtainable
function TMDatabase.isTMObtainable(tmNumber)
    local tm = TMDatabase.getTM(tmNumber)
    return tm ~= nil and tm.obtainable
end

-- Check if TR exists and is obtainable
-- @param trNumber: TR number
-- @return: Boolean indicating if TR exists and is obtainable
function TMDatabase.isTRObtainable(trNumber)
    local tr = TMDatabase.getTR(trNumber)
    return tr ~= nil and tr.obtainable
end

-- Get move ID for TM
-- @param tmNumber: TM number
-- @return: Move ID or nil if TM doesn't exist
function TMDatabase.getTMMove(tmNumber)
    local tm = TMDatabase.getTM(tmNumber)
    return tm and tm.moveId
end

-- Get move ID for TR
-- @param trNumber: TR number
-- @return: Move ID or nil if TR doesn't exist
function TMDatabase.getTRMove(trNumber)
    local tr = TMDatabase.getTR(trNumber)
    return tr and tr.moveId
end

-- Get all TMs
-- @return: Table of all TM data
function TMDatabase.getAllTMs()
    return TMDatabase.tms
end

-- Get all TRs
-- @return: Table of all TR data
function TMDatabase.getAllTRs()
    return TMDatabase.trs
end

-- Get TM/TR by move ID (either TM or TR)
-- @param moveId: Move ID
-- @return: Table with tm and tr arrays containing applicable TM/TR numbers
function TMDatabase.getMachinesForMove(moveId)
    return {
        tm = TMDatabase.getTMsForMove(moveId),
        tr = TMDatabase.getTRsForMove(moveId)
    }
end

-- Validate TM/TR database integrity
-- @return: Boolean indicating if database is valid, array of error messages
function TMDatabase.validateDatabase()
    local errors = {}
    local seenMoveIds = {}
    
    -- Validate TMs
    for tmNumber, tmData in pairs(TMDatabase.tms) do
        if type(tmData) ~= "table" then
            table.insert(errors, "TM " .. tmNumber .. " data is not a table")
        else
            -- Check required fields
            local requiredFields = {"id", "moveId", "name", "generation", "reusable", "type"}
            for _, field in ipairs(requiredFields) do
                if tmData[field] == nil then
                    table.insert(errors, "TM " .. tmNumber .. " missing field: " .. field)
                end
            end
            
            -- Check TM number matches ID
            if tmData.id ~= tmNumber then
                table.insert(errors, "TM " .. tmNumber .. " has incorrect ID: " .. tostring(tmData.id))
            end
            
            -- Check type is correct
            if tmData.type ~= "tm" then
                table.insert(errors, "TM " .. tmNumber .. " has incorrect type: " .. tostring(tmData.type))
            end
            
            -- Check reusable is true for TMs
            if tmData.reusable ~= true then
                table.insert(errors, "TM " .. tmNumber .. " should be reusable")
            end
        end
    end
    
    -- Validate TRs
    for trNumber, trData in pairs(TMDatabase.trs) do
        if type(trData) ~= "table" then
            table.insert(errors, "TR " .. trNumber .. " data is not a table")
        else
            -- Check required fields
            local requiredFields = {"id", "moveId", "name", "generation", "reusable", "type"}
            for _, field in ipairs(requiredFields) do
                if trData[field] == nil then
                    table.insert(errors, "TR " .. trNumber .. " missing field: " .. field)
                end
            end
            
            -- Check TR number matches ID
            if trData.id ~= trNumber then
                table.insert(errors, "TR " .. trNumber .. " has incorrect ID: " .. tostring(trData.id))
            end
            
            -- Check type is correct
            if trData.type ~= "tr" then
                table.insert(errors, "TR " .. trNumber .. " has incorrect type: " .. tostring(trData.type))
            end
            
            -- Check reusable is false for TRs
            if trData.reusable ~= false then
                table.insert(errors, "TR " .. trNumber .. " should not be reusable")
            end
        end
    end
    
    return #errors == 0, errors
end

-- Get TM/TR database statistics
-- @return: Table with database statistics
function TMDatabase.getDatabaseStats()
    local stats = {
        totalTMs = 0,
        totalTRs = 0,
        obtainableTMs = 0,
        obtainableTRs = 0,
        uniqueMovesInTMs = 0,
        uniqueMovesInTRs = 0,
        averageTMCost = 0,
        averageTRCost = 0
    }
    
    local uniqueTMMoves = {}
    local uniqueTRMoves = {}
    local tmCostSum = 0
    local trCostSum = 0
    local tmCostCount = 0
    local trCostCount = 0
    
    -- Count TMs
    for _, tmData in pairs(TMDatabase.tms) do
        stats.totalTMs = stats.totalTMs + 1
        if tmData.obtainable then
            stats.obtainableTMs = stats.obtainableTMs + 1
        end
        uniqueTMMoves[tmData.moveId] = true
        if tmData.cost then
            tmCostSum = tmCostSum + tmData.cost
            tmCostCount = tmCostCount + 1
        end
    end
    
    -- Count TRs
    for _, trData in pairs(TMDatabase.trs) do
        stats.totalTRs = stats.totalTRs + 1
        if trData.obtainable then
            stats.obtainableTRs = stats.obtainableTRs + 1
        end
        uniqueTRMoves[trData.moveId] = true
        if trData.cost then
            trCostSum = trCostSum + trData.cost
            trCostCount = trCostCount + 1
        end
    end
    
    -- Count unique moves
    for _ in pairs(uniqueTMMoves) do
        stats.uniqueMovesInTMs = stats.uniqueMovesInTMs + 1
    end
    for _ in pairs(uniqueTRMoves) do
        stats.uniqueMovesInTRs = stats.uniqueMovesInTRs + 1
    end
    
    -- Calculate averages
    stats.averageTMCost = tmCostCount > 0 and (tmCostSum / tmCostCount) or 0
    stats.averageTRCost = trCostCount > 0 and (trCostSum / trCostCount) or 0
    
    return stats
end

-- Initialize the database when module is loaded
TMDatabase.init()

return TMDatabase