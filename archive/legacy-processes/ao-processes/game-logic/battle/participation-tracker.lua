-- Battle Participation Tracker  
-- Tracks Pokemon battle participation for experience distribution and battle memory
-- Records move usage, damage taken/dealt, and switch events for accurate experience calculation
-- Integrates with battle state persistence system for cross-session continuity

local ParticipationTracker = {}

-- Load dependencies
local BattleStateManager = require("game-logic.battle.battle-state-manager")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Participation event types
ParticipationTracker.EventType = {
    BATTLE_START = "battle_start",
    SWITCH_IN = "switch_in",
    SWITCH_OUT = "switch_out",
    MOVE_USED = "move_used",
    DAMAGE_DEALT = "damage_dealt",
    DAMAGE_TAKEN = "damage_taken",
    STATUS_INFLICTED = "status_inflicted",
    STATUS_RECEIVED = "status_received",
    FAINTED = "fainted",
    VICTORY_CONTRIBUTION = "victory_contribution",
    BATTLE_END = "battle_end"
}

-- Experience calculation factors
ParticipationTracker.ExperienceFactors = {
    PARTICIPATED_MULTIPLIER = 1.0,      -- Full experience for participated Pokemon
    SWITCHED_OUT_MULTIPLIER = 0.5,      -- Half experience if switched out before victory
    MINIMAL_PARTICIPATION = 0.1,        -- Minimum experience for any participation
    EXP_SHARE_MULTIPLIER = 0.5,        -- Experience share factor (if Exp. Share implemented)
    LEVEL_DIFFERENCE_CAP = 7            -- Maximum level difference for experience scaling
}

-- Initialize participation tracker
-- @param battleState: Battle state to initialize tracking for
-- @return: Initialization success status
function ParticipationTracker.init(battleState)
    if not battleState then
        return false, "Invalid battle state for participation tracking"
    end
    
    -- Initialize participation data structure if not exists
    if not battleState.participationData then
        battleState.participationData = {}
    end
    
    -- Initialize participation tracking for all Pokemon
    local allPokemon = {}
    for _, pokemon in ipairs(battleState.playerParty) do
        table.insert(allPokemon, {pokemon = pokemon, side = "player"})
    end
    for _, pokemon in ipairs(battleState.enemyParty) do
        table.insert(allPokemon, {pokemon = pokemon, side = "enemy"})
    end
    
    for _, entry in ipairs(allPokemon) do
        local pokemon = entry.pokemon
        if not battleState.participationData[pokemon.id] then
            battleState.participationData[pokemon.id] = {
                pokemonId = pokemon.id,
                pokemonName = pokemon.name or "Unknown",
                level = pokemon.level or 50,
                side = entry.side,
                
                -- Participation flags
                participated = false,
                activeAtBattleStart = false,
                activeAtBattleEnd = false,
                faintedDuringBattle = false,
                
                -- Turn tracking
                turnsActive = 0,
                turnsSwitchedOut = 0,
                firstActiveTurn = nil,
                lastActiveTurn = nil,
                
                -- Action tracking
                movesUsed = {},
                totalMoveCount = 0,
                criticalHitsLanded = 0,
                
                -- Damage tracking
                totalDamageDealt = 0,
                totalDamageTaken = 0,
                maxDamageInOneTurn = 0,
                damageDealtByMoveId = {},
                damageTakenBySource = {},
                
                -- Status tracking
                statusesInflicted = {},
                statusesReceived = {},
                statusTurns = 0,
                
                -- Switch tracking
                switchInEvents = {},
                switchOutEvents = {},
                totalSwitchIns = 0,
                totalSwitchOuts = 0,
                
                -- Victory contribution
                knockouts = 0,
                assistKnockouts = 0,
                victoryContribution = 0.0,
                
                -- Event history
                events = {},
                
                -- Experience data
                experienceEarned = 0,
                experienceMultiplier = 1.0,
                
                -- Timestamps
                firstParticipation = nil,
                lastParticipation = nil,
                battleStartTime = os.time(),
                battleEndTime = nil
            }
        end
    end
    
    return true, "Participation tracker initialized"
end

-- Record battle start participation
-- @param battleState: Current battle state
-- @return: Success status
function ParticipationTracker.recordBattleStart(battleState)
    if not battleState or not battleState.participationData then
        return false, "Invalid battle state or participation data"
    end
    
    local currentTime = os.time()
    
    -- Mark active Pokemon as participating
    local activePokemon = {}
    
    -- Get active player Pokemon
    for position, pokemonId in pairs(battleState.activePlayer or {}) do
        if pokemonId then
            table.insert(activePokemon, {id = pokemonId, side = "player", position = position})
        end
    end
    
    -- Get active enemy Pokemon
    for position, pokemonId in pairs(battleState.activeEnemy or {}) do
        if pokemonId then
            table.insert(activePokemon, {id = pokemonId, side = "enemy", position = position})
        end
    end
    
    -- Record participation for active Pokemon
    for _, activeData in ipairs(activePokemon) do
        local pokemonData = battleState.participationData[activeData.id]
        if pokemonData then
            pokemonData.participated = true
            pokemonData.activeAtBattleStart = true
            pokemonData.firstActiveTurn = 0
            pokemonData.firstParticipation = currentTime
            pokemonData.lastParticipation = currentTime
            
            -- Record battle start event
            table.insert(pokemonData.events, {
                type = ParticipationTracker.EventType.BATTLE_START,
                turn = 0,
                position = activeData.position,
                timestamp = currentTime
            })
        end
    end
    
    return true, "Battle start participation recorded"
end

-- Record Pokemon switch-in
-- @param battleState: Current battle state
-- @param pokemonId: Pokemon switching in
-- @param position: Battle position
-- @param turn: Current turn number
-- @return: Success status
function ParticipationTracker.recordSwitchIn(battleState, pokemonId, position, turn)
    if not battleState or not battleState.participationData then
        return false, "Invalid battle state or participation data"
    end
    
    local pokemonData = battleState.participationData[pokemonId]
    if not pokemonData then
        return false, "Pokemon not found in participation data"
    end
    
    local currentTime = os.time()
    turn = turn or battleState.turn or 0
    
    -- Mark as participated
    pokemonData.participated = true
    pokemonData.totalSwitchIns = pokemonData.totalSwitchIns + 1
    pokemonData.lastParticipation = currentTime
    
    -- Set first participation if not set
    if not pokemonData.firstParticipation then
        pokemonData.firstParticipation = currentTime
        pokemonData.firstActiveTurn = turn
    end
    
    -- Record switch-in event
    local switchInEvent = {
        type = ParticipationTracker.EventType.SWITCH_IN,
        turn = turn,
        position = position,
        timestamp = currentTime
    }
    
    table.insert(pokemonData.events, switchInEvent)
    table.insert(pokemonData.switchInEvents, switchInEvent)
    
    return true, "Switch-in recorded for " .. pokemonData.pokemonName
end

-- Record Pokemon switch-out
-- @param battleState: Current battle state
-- @param pokemonId: Pokemon switching out
-- @param position: Battle position
-- @param turn: Current turn number
-- @param reason: Switch-out reason (voluntary, faint, forced)
-- @return: Success status
function ParticipationTracker.recordSwitchOut(battleState, pokemonId, position, turn, reason)
    if not battleState or not battleState.participationData then
        return false, "Invalid battle state or participation data"
    end
    
    local pokemonData = battleState.participationData[pokemonId]
    if not pokemonData then
        return false, "Pokemon not found in participation data"
    end
    
    local currentTime = os.time()
    turn = turn or battleState.turn or 0
    reason = reason or "voluntary"
    
    pokemonData.totalSwitchOuts = pokemonData.totalSwitchOuts + 1
    pokemonData.lastActiveTurn = turn
    pokemonData.lastParticipation = currentTime
    
    -- Record faint status
    if reason == "faint" then
        pokemonData.faintedDuringBattle = true
    end
    
    -- Record switch-out event
    local switchOutEvent = {
        type = ParticipationTracker.EventType.SWITCH_OUT,
        turn = turn,
        position = position,
        reason = reason,
        timestamp = currentTime
    }
    
    table.insert(pokemonData.events, switchOutEvent)
    table.insert(pokemonData.switchOutEvents, switchOutEvent)
    
    return true, "Switch-out recorded for " .. pokemonData.pokemonName
end

-- Record move usage
-- @param battleState: Current battle state
-- @param pokemonId: Pokemon using move
-- @param moveId: Move ID used
-- @param turn: Current turn number
-- @param targetId: Target Pokemon ID (optional)
-- @param success: Whether move was successful
-- @return: Success status
function ParticipationTracker.recordMoveUsage(battleState, pokemonId, moveId, turn, targetId, success)
    if not battleState or not battleState.participationData then
        return false, "Invalid battle state or participation data"
    end
    
    local pokemonData = battleState.participationData[pokemonId]
    if not pokemonData then
        return false, "Pokemon not found in participation data"
    end
    
    local currentTime = os.time()
    turn = turn or battleState.turn or 0
    success = success ~= false -- Default to true unless explicitly false
    
    -- Update participation
    pokemonData.participated = true
    pokemonData.totalMoveCount = pokemonData.totalMoveCount + 1
    pokemonData.lastParticipation = currentTime
    
    -- Track move usage
    if not pokemonData.movesUsed[moveId] then
        pokemonData.movesUsed[moveId] = {
            count = 0,
            successes = 0,
            failures = 0
        }
    end
    
    pokemonData.movesUsed[moveId].count = pokemonData.movesUsed[moveId].count + 1
    if success then
        pokemonData.movesUsed[moveId].successes = pokemonData.movesUsed[moveId].successes + 1
    else
        pokemonData.movesUsed[moveId].failures = pokemonData.movesUsed[moveId].failures + 1
    end
    
    -- Record move usage event
    table.insert(pokemonData.events, {
        type = ParticipationTracker.EventType.MOVE_USED,
        turn = turn,
        moveId = moveId,
        targetId = targetId,
        success = success,
        timestamp = currentTime
    })
    
    return true, "Move usage recorded for " .. pokemonData.pokemonName
end

-- Record damage dealt by Pokemon
-- @param battleState: Current battle state  
-- @param pokemonId: Pokemon dealing damage
-- @param damage: Amount of damage dealt
-- @param turn: Current turn number
-- @param targetId: Target that took damage
-- @param moveId: Move that caused damage (optional)
-- @param critical: Whether it was a critical hit
-- @return: Success status
function ParticipationTracker.recordDamageDealt(battleState, pokemonId, damage, turn, targetId, moveId, critical)
    if not battleState or not battleState.participationData then
        return false, "Invalid battle state or participation data"
    end
    
    local pokemonData = battleState.participationData[pokemonId]
    if not pokemonData then
        return false, "Pokemon not found in participation data"
    end
    
    local currentTime = os.time()
    turn = turn or battleState.turn or 0
    damage = damage or 0
    critical = critical == true
    
    -- Update damage tracking
    pokemonData.totalDamageDealt = pokemonData.totalDamageDealt + damage
    pokemonData.maxDamageInOneTurn = math.max(pokemonData.maxDamageInOneTurn, damage)
    pokemonData.participated = true
    pokemonData.lastParticipation = currentTime
    
    if critical then
        pokemonData.criticalHitsLanded = pokemonData.criticalHitsLanded + 1
    end
    
    -- Track damage by move
    if moveId then
        if not pokemonData.damageDealtByMoveId[moveId] then
            pokemonData.damageDealtByMoveId[moveId] = 0
        end
        pokemonData.damageDealtByMoveId[moveId] = pokemonData.damageDealtByMoveId[moveId] + damage
    end
    
    -- Record damage dealt event
    table.insert(pokemonData.events, {
        type = ParticipationTracker.EventType.DAMAGE_DEALT,
        turn = turn,
        damage = damage,
        targetId = targetId,
        moveId = moveId,
        critical = critical,
        timestamp = currentTime
    })
    
    return true, "Damage dealt recorded for " .. pokemonData.pokemonName
end

-- Record damage taken by Pokemon
-- @param battleState: Current battle state
-- @param pokemonId: Pokemon taking damage
-- @param damage: Amount of damage taken
-- @param turn: Current turn number
-- @param sourceId: Pokemon that dealt damage
-- @param moveId: Move that caused damage (optional)
-- @param source: Damage source type (move, weather, status, etc.)
-- @return: Success status
function ParticipationTracker.recordDamageTaken(battleState, pokemonId, damage, turn, sourceId, moveId, source)
    if not battleState or not battleState.participationData then
        return false, "Invalid battle state or participation data"
    end
    
    local pokemonData = battleState.participationData[pokemonId]
    if not pokemonData then
        return false, "Pokemon not found in participation data"
    end
    
    local currentTime = os.time()
    turn = turn or battleState.turn or 0
    damage = damage or 0
    source = source or "move"
    
    -- Update damage tracking
    pokemonData.totalDamageTaken = pokemonData.totalDamageTaken + damage
    pokemonData.participated = true
    pokemonData.lastParticipation = currentTime
    
    -- Track damage by source
    local sourceKey = sourceId and (sourceId .. "_" .. (moveId or source)) or source
    if not pokemonData.damageTakenBySource[sourceKey] then
        pokemonData.damageTakenBySource[sourceKey] = 0
    end
    pokemonData.damageTakenBySource[sourceKey] = pokemonData.damageTakenBySource[sourceKey] + damage
    
    -- Record damage taken event
    table.insert(pokemonData.events, {
        type = ParticipationTracker.EventType.DAMAGE_TAKEN,
        turn = turn,
        damage = damage,
        sourceId = sourceId,
        moveId = moveId,
        source = source,
        timestamp = currentTime
    })
    
    return true, "Damage taken recorded for " .. pokemonData.pokemonName
end

-- Record Pokemon knockout (contributing to victory)
-- @param battleState: Current battle state
-- @param attackerId: Pokemon that caused knockout
-- @param faintedId: Pokemon that fainted
-- @param turn: Current turn number
-- @param assistIds: Array of Pokemon IDs that assisted (optional)
-- @return: Success status
function ParticipationTracker.recordKnockout(battleState, attackerId, faintedId, turn, assistIds)
    if not battleState or not battleState.participationData then
        return false, "Invalid battle state or participation data"
    end
    
    local attackerData = battleState.participationData[attackerId]
    local faintedData = battleState.participationData[faintedId]
    
    if not attackerData or not faintedData then
        return false, "Pokemon data not found for knockout recording"
    end
    
    local currentTime = os.time()
    turn = turn or battleState.turn or 0
    
    -- Record knockout for attacker
    attackerData.knockouts = attackerData.knockouts + 1
    attackerData.victoryContribution = attackerData.victoryContribution + 1.0
    attackerData.participated = true
    attackerData.lastParticipation = currentTime
    
    table.insert(attackerData.events, {
        type = ParticipationTracker.EventType.VICTORY_CONTRIBUTION,
        turn = turn,
        contribution = "knockout",
        faintedPokemon = faintedId,
        timestamp = currentTime
    })
    
    -- Record assists
    if assistIds then
        for _, assistId in ipairs(assistIds) do
            local assistData = battleState.participationData[assistId]
            if assistData then
                assistData.assistKnockouts = assistData.assistKnockouts + 1
                assistData.victoryContribution = assistData.victoryContribution + 0.25
                assistData.participated = true
                assistData.lastParticipation = currentTime
                
                table.insert(assistData.events, {
                    type = ParticipationTracker.EventType.VICTORY_CONTRIBUTION,
                    turn = turn,
                    contribution = "assist",
                    faintedPokemon = faintedId,
                    primaryAttacker = attackerId,
                    timestamp = currentTime
                })
            end
        end
    end
    
    -- Record faint for the fainted Pokemon
    faintedData.faintedDuringBattle = true
    ParticipationTracker.recordSwitchOut(battleState, faintedId, nil, turn, "faint")
    
    table.insert(faintedData.events, {
        type = ParticipationTracker.EventType.FAINTED,
        turn = turn,
        attackerId = attackerId,
        timestamp = currentTime
    })
    
    return true, "Knockout recorded"
end

-- Calculate experience distribution for battle end
-- @param battleState: Current battle state
-- @param battleResult: Battle outcome (victory, defeat, draw)
-- @return: Experience distribution data
function ParticipationTracker.calculateExperienceDistribution(battleState, battleResult)
    if not battleState or not battleState.participationData then
        return nil, "Invalid battle state or participation data"
    end
    
    local distribution = {
        battleResult = battleResult,
        totalExperience = 0,
        pokemonExperience = {},
        calculationTime = os.time()
    }
    
    -- Base experience calculation (simplified)
    local baseExperience = 1000 -- This would be calculated based on defeated Pokemon levels
    local totalParticipants = 0
    
    -- Count participants
    for pokemonId, pokemonData in pairs(battleState.participationData) do
        if pokemonData.participated and pokemonData.side == "player" then
            totalParticipants = totalParticipants + 1
        end
    end
    
    if totalParticipants == 0 then
        return distribution, "No participants for experience distribution"
    end
    
    -- Calculate experience for each participating Pokemon
    for pokemonId, pokemonData in pairs(battleState.participationData) do
        if pokemonData.participated and pokemonData.side == "player" then
            local experience = ParticipationTracker.calculatePokemonExperience(
                pokemonData, baseExperience, totalParticipants, battleResult
            )
            
            pokemonData.experienceEarned = experience
            distribution.pokemonExperience[pokemonId] = {
                pokemonName = pokemonData.pokemonName,
                level = pokemonData.level,
                experience = experience,
                multiplier = pokemonData.experienceMultiplier,
                participationLevel = ParticipationTracker.getParticipationLevel(pokemonData)
            }
            
            distribution.totalExperience = distribution.totalExperience + experience
        end
    end
    
    return distribution, nil
end

-- Calculate experience for individual Pokemon
-- @param pokemonData: Pokemon participation data
-- @param baseExperience: Base experience pool
-- @param totalParticipants: Number of participating Pokemon
-- @param battleResult: Battle outcome
-- @return: Calculated experience value
function ParticipationTracker.calculatePokemonExperience(pokemonData, baseExperience, totalParticipants, battleResult)
    if not pokemonData.participated then
        return 0
    end
    
    local experience = baseExperience / totalParticipants
    local multiplier = 1.0
    
    -- Participation level multiplier
    if pokemonData.activeAtBattleStart then
        multiplier = multiplier * ParticipationTracker.ExperienceFactors.PARTICIPATED_MULTIPLIER
    else
        multiplier = multiplier * ParticipationTracker.ExperienceFactors.SWITCHED_OUT_MULTIPLIER
    end
    
    -- Victory contribution bonus
    if battleResult == "victory" then
        multiplier = multiplier + (pokemonData.victoryContribution * 0.1)
    end
    
    -- Apply minimum participation multiplier
    multiplier = math.max(multiplier, ParticipationTracker.ExperienceFactors.MINIMAL_PARTICIPATION)
    
    pokemonData.experienceMultiplier = multiplier
    return math.floor(experience * multiplier)
end

-- Get participation level assessment
-- @param pokemonData: Pokemon participation data
-- @return: Participation level string
function ParticipationTracker.getParticipationLevel(pokemonData)
    if not pokemonData.participated then
        return "none"
    end
    
    if pokemonData.activeAtBattleStart and pokemonData.totalMoveCount > 0 then
        return "full"
    elseif pokemonData.totalMoveCount > 0 or pokemonData.totalDamageDealt > 0 then
        return "active"
    elseif pokemonData.totalSwitchIns > 0 then
        return "minimal"
    else
        return "passive"
    end
end

-- Record battle end and finalize participation
-- @param battleState: Current battle state
-- @param battleResult: Battle outcome
-- @return: Success status and participation summary
function ParticipationTracker.recordBattleEnd(battleState, battleResult)
    if not battleState or not battleState.participationData then
        return false, "Invalid battle state or participation data"
    end
    
    local currentTime = os.time()
    local summary = {
        battleResult = battleResult,
        totalParticipants = 0,
        playerParticipants = 0,
        enemyParticipants = 0,
        totalTurns = battleState.turn or 0
    }
    
    -- Mark active Pokemon at battle end
    for position, pokemonId in pairs(battleState.activePlayer or {}) do
        if pokemonId and battleState.participationData[pokemonId] then
            battleState.participationData[pokemonId].activeAtBattleEnd = true
        end
    end
    
    for position, pokemonId in pairs(battleState.activeEnemy or {}) do
        if pokemonId and battleState.participationData[pokemonId] then
            battleState.participationData[pokemonId].activeAtBattleEnd = true
        end
    end
    
    -- Finalize all Pokemon participation data
    for pokemonId, pokemonData in pairs(battleState.participationData) do
        pokemonData.battleEndTime = currentTime
        
        if pokemonData.participated then
            summary.totalParticipants = summary.totalParticipants + 1
            if pokemonData.side == "player" then
                summary.playerParticipants = summary.playerParticipants + 1
            else
                summary.enemyParticipants = summary.enemyParticipants + 1
            end
        end
        
        -- Record battle end event
        table.insert(pokemonData.events, {
            type = ParticipationTracker.EventType.BATTLE_END,
            turn = battleState.turn or 0,
            battleResult = battleResult,
            participationLevel = ParticipationTracker.getParticipationLevel(pokemonData),
            timestamp = currentTime
        })
    end
    
    -- Calculate experience distribution
    local experienceDistribution = ParticipationTracker.calculateExperienceDistribution(battleState, battleResult)
    summary.experienceDistribution = experienceDistribution
    
    return true, summary
end

-- Get participation summary for a Pokemon
-- @param battleState: Current battle state
-- @param pokemonId: Pokemon ID to summarize
-- @return: Participation summary
function ParticipationTracker.getParticipationSummary(battleState, pokemonId)
    if not battleState or not battleState.participationData or not pokemonId then
        return nil, "Invalid parameters for participation summary"
    end
    
    local pokemonData = battleState.participationData[pokemonId]
    if not pokemonData then
        return nil, "Pokemon not found in participation data"
    end
    
    local summary = {
        pokemonId = pokemonId,
        pokemonName = pokemonData.pokemonName,
        participated = pokemonData.participated,
        participationLevel = ParticipationTracker.getParticipationLevel(pokemonData),
        
        -- Activity summary
        turnsActive = pokemonData.turnsActive,
        totalMoveCount = pokemonData.totalMoveCount,
        totalDamageDealt = pokemonData.totalDamageDealt,
        totalDamageTaken = pokemonData.totalDamageTaken,
        knockouts = pokemonData.knockouts,
        
        -- Switch summary
        totalSwitchIns = pokemonData.totalSwitchIns,
        totalSwitchOuts = pokemonData.totalSwitchOuts,
        fainted = pokemonData.faintedDuringBattle,
        
        -- Experience
        experienceEarned = pokemonData.experienceEarned,
        experienceMultiplier = pokemonData.experienceMultiplier,
        
        -- Timing
        battleDuration = pokemonData.battleEndTime and 
                        (pokemonData.battleEndTime - pokemonData.battleStartTime) or nil
    }
    
    return summary, nil
end

return ParticipationTracker