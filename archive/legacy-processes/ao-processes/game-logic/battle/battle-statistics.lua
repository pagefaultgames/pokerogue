-- Battle Statistics Tracking System
-- Tracks battle wins, losses, and participation statistics for Pokemon and players
-- Integrates with player progression and provides persistent statistics storage
-- Updates battle records based on battle completion outcomes

local BattleStatistics = {}

-- Load dependencies
local ParticipationTracker = require("game-logic.battle.participation-tracker")

-- Statistics categories
BattleStatistics.StatType = {
    PLAYER_STATS = "player",
    POKEMON_STATS = "pokemon",
    BATTLE_STATS = "battle"
}

-- Battle outcome types for statistics
BattleStatistics.BattleOutcome = {
    VICTORY = "victory",
    DEFEAT = "defeat",
    DRAW = "draw", 
    FORFEIT = "forfeit",
    ESCAPE = "escape"
}

-- Default statistics structure for new players
BattleStatistics.DefaultPlayerStats = {
    totalBattles = 0,
    victories = 0,
    defeats = 0,
    draws = 0,
    forfeits = 0,
    escapes = 0,
    
    -- Battle type breakdowns
    wildBattles = 0,
    trainerBattles = 0,
    gymBattles = 0,
    eliteBattles = 0,
    championBattles = 0,
    
    -- Achievement counters
    perfectVictories = 0,        -- Won without losing any Pokemon
    comebackVictories = 0,       -- Won after losing multiple Pokemon
    longestWinStreak = 0,
    currentWinStreak = 0,
    longestLoseStreak = 0,
    currentLoseStreak = 0,
    
    -- Experience and rewards
    totalExpGained = 0,
    totalMoneyEarned = 0,
    totalItemsFound = 0,
    
    -- Time tracking
    totalBattleTime = 0,
    averageBattleTime = 0,
    fastestVictory = 9999,       -- Turn count for fastest win
    longestBattle = 0,           -- Turn count for longest battle
    
    -- First achievement timestamps
    firstVictory = nil,
    firstGymVictory = nil,
    firstEliteVictory = nil,
    firstChampionVictory = nil,
    
    lastUpdated = 0
}

-- Default statistics structure for Pokemon
BattleStatistics.DefaultPokemonStats = {
    totalBattles = 0,
    victories = 0,
    defeats = 0,
    
    -- Participation tracking
    battlesParticipated = 0,
    turnsActive = 0,
    switchIns = 0,
    switchOuts = 0,
    
    -- Combat statistics
    totalDamageDealt = 0,
    totalDamageTaken = 0,
    movesUsed = 0,
    criticalHits = 0,
    knockouts = 0,              -- Pokemon this one has defeated
    timesKnockedOut = 0,
    
    -- Status and effects
    statusesInflicted = 0,
    statusesReceived = 0,
    statusTurnsActive = 0,
    
    -- Experience and progression
    totalExpGained = 0,
    levelsGained = 0,
    friendshipGained = 0,
    
    -- Performance metrics
    averageDamagePerTurn = 0,
    averageExpPerBattle = 0,
    winRate = 0.0,
    participationRate = 0.0,
    survivalRate = 0.0,
    
    lastUpdated = 0
}

-- Initialize battle statistics system
-- @return: Success status
function BattleStatistics.init()
    return true, "Battle statistics system initialized"
end

-- Update player battle statistics after battle completion
-- @param playerId: Player identifier
-- @param battleState: Complete battle state with all data
-- @param battleResult: Battle conclusion result
-- @param rewardResults: Battle reward calculation results
-- @return: Updated player statistics
function BattleStatistics.updatePlayerStatistics(playerId, battleState, battleResult, rewardResults)
    if not playerId or not battleState or not battleResult then
        return nil, "Invalid parameters for player statistics update"
    end
    
    -- Initialize player statistics if not exist (this would normally load from persistent storage)
    local playerStats = BattleStatistics.getPlayerStatistics(playerId) or BattleStatistics.copyTable(BattleStatistics.DefaultPlayerStats)
    
    -- Update basic battle counters
    playerStats.totalBattles = playerStats.totalBattles + 1
    
    local outcome = battleResult.result
    if outcome == BattleStatistics.BattleOutcome.VICTORY then
        playerStats.victories = playerStats.victories + 1
        playerStats.currentWinStreak = playerStats.currentWinStreak + 1
        playerStats.currentLoseStreak = 0
        playerStats.longestWinStreak = math.max(playerStats.longestWinStreak, playerStats.currentWinStreak)
        
        -- Track first victory
        if playerStats.victories == 1 then
            playerStats.firstVictory = os.time()
        end
        
        -- Check for perfect victory (no Pokemon fainted)
        local playerLosses = BattleStatistics.countFaintedPokemon(battleState.playerParty)
        if playerLosses == 0 then
            playerStats.perfectVictories = playerStats.perfectVictories + 1
        elseif playerLosses >= 3 then
            playerStats.comebackVictories = playerStats.comebackVictories + 1
        end
        
    elseif outcome == BattleStatistics.BattleOutcome.DEFEAT then
        playerStats.defeats = playerStats.defeats + 1
        playerStats.currentLoseStreak = playerStats.currentLoseStreak + 1
        playerStats.currentWinStreak = 0
        playerStats.longestLoseStreak = math.max(playerStats.longestLoseStreak, playerStats.currentLoseStreak)
        
    elseif outcome == BattleStatistics.BattleOutcome.DRAW then
        playerStats.draws = playerStats.draws + 1
        playerStats.currentWinStreak = 0
        playerStats.currentLoseStreak = 0
        
    elseif outcome == BattleStatistics.BattleOutcome.FORFEIT then
        playerStats.forfeits = playerStats.forfeits + 1
        playerStats.currentWinStreak = 0
        
    elseif outcome == BattleStatistics.BattleOutcome.ESCAPE then
        playerStats.escapes = playerStats.escapes + 1
        playerStats.currentWinStreak = 0
    end
    
    -- Update battle type counters
    local battleType = battleState.battleType or "WILD"
    if battleType == "WILD" then
        playerStats.wildBattles = playerStats.wildBattles + 1
    elseif battleType == "TRAINER" then
        playerStats.trainerBattles = playerStats.trainerBattles + 1
    elseif battleType == "GYM" then
        playerStats.gymBattles = playerStats.gymBattles + 1
        if outcome == BattleStatistics.BattleOutcome.VICTORY and not playerStats.firstGymVictory then
            playerStats.firstGymVictory = os.time()
        end
    elseif battleType == "ELITE" then
        playerStats.eliteBattles = playerStats.eliteBattles + 1
        if outcome == BattleStatistics.BattleOutcome.VICTORY and not playerStats.firstEliteVictory then
            playerStats.firstEliteVictory = os.time()
        end
    elseif battleType == "CHAMPION" then
        playerStats.championBattles = playerStats.championBattles + 1
        if outcome == BattleStatistics.BattleOutcome.VICTORY and not playerStats.firstChampionVictory then
            playerStats.firstChampionVictory = os.time()
        end
    end
    
    -- Update reward statistics
    if rewardResults and rewardResults.success then
        playerStats.totalMoneyEarned = playerStats.totalMoneyEarned + (rewardResults.totalMoney or 0)
        playerStats.totalItemsFound = playerStats.totalItemsFound + (rewardResults.totalItems or 0)
    end
    
    -- Update battle time statistics
    local battleTurns = battleResult.turn or 0
    if battleTurns > 0 then
        if outcome == BattleStatistics.BattleOutcome.VICTORY then
            playerStats.fastestVictory = math.min(playerStats.fastestVictory, battleTurns)
        end
        playerStats.longestBattle = math.max(playerStats.longestBattle, battleTurns)
        
        -- Update average battle time (using turn count as proxy)
        playerStats.totalBattleTime = playerStats.totalBattleTime + battleTurns
        playerStats.averageBattleTime = playerStats.totalBattleTime / playerStats.totalBattles
    end
    
    playerStats.lastUpdated = os.time()
    
    -- Store updated statistics (this would normally persist to storage)
    BattleStatistics.setPlayerStatistics(playerId, playerStats)
    
    return playerStats, nil
end

-- Update individual Pokemon battle statistics
-- @param pokemon: Pokemon instance with participation data
-- @param battleState: Complete battle state
-- @param battleResult: Battle conclusion result
-- @param expDistribution: Experience distribution data for this Pokemon
-- @return: Updated Pokemon statistics
function BattleStatistics.updatePokemonStatistics(pokemon, battleState, battleResult, expDistribution)
    if not pokemon or not battleState or not battleResult then
        return nil, "Invalid parameters for Pokemon statistics update"
    end
    
    -- Initialize Pokemon statistics if not exist
    if not pokemon.battleStats then
        pokemon.battleStats = BattleStatistics.copyTable(BattleStatistics.DefaultPokemonStats)
    end
    
    local stats = pokemon.battleStats
    local participation = battleState.participationData and battleState.participationData[pokemon.id]
    
    -- Only update if Pokemon participated in battle
    if not participation or not participation.participated then
        return stats, "Pokemon did not participate"
    end
    
    -- Update basic battle counters
    stats.totalBattles = stats.totalBattles + 1
    stats.battlesParticipated = stats.battlesParticipated + 1
    
    local outcome = battleResult.result
    if outcome == BattleStatistics.BattleOutcome.VICTORY then
        stats.victories = stats.victories + 1
    elseif outcome == BattleStatistics.BattleOutcome.DEFEAT then
        stats.defeats = stats.defeats + 1
    end
    
    -- Update participation statistics from battle data
    if participation then
        stats.turnsActive = stats.turnsActive + (participation.turnsActive or 0)
        stats.switchIns = stats.switchIns + (participation.totalSwitchIns or 0)
        stats.switchOuts = stats.switchOuts + (participation.totalSwitchOuts or 0)
        
        -- Combat statistics
        stats.totalDamageDealt = stats.totalDamageDealt + (participation.totalDamageDealt or 0)
        stats.totalDamageTaken = stats.totalDamageTaken + (participation.totalDamageTaken or 0)
        stats.movesUsed = stats.movesUsed + (participation.totalMoveCount or 0)
        stats.criticalHits = stats.criticalHits + (participation.criticalHitsLanded or 0)
        
        -- Status tracking
        local statusInflicted = 0
        for _, count in pairs(participation.statusesInflicted or {}) do
            statusInflicted = statusInflicted + count
        end
        stats.statusesInflicted = stats.statusesInflicted + statusInflicted
        
        local statusReceived = 0
        for _, count in pairs(participation.statusesReceived or {}) do
            statusReceived = statusReceived + count
        end
        stats.statusesReceived = stats.statusesReceived + statusReceived
        stats.statusTurnsActive = stats.statusTurnsActive + (participation.statusTurns or 0)
        
        -- Knockouts and fainted tracking
        if participation.faintedDuringBattle then
            stats.timesKnockedOut = stats.timesKnockedOut + 1
        end
        
        -- Count knockouts this Pokemon achieved (enemies it defeated)
        for _, enemyPokemon in ipairs(battleState.enemyParty or {}) do
            if enemyPokemon.fainted and participation.totalDamageDealt > 0 then
                -- Simple heuristic: if dealt significant damage and enemy fainted, count as knockout
                stats.knockouts = stats.knockouts + 1
                break  -- Count once per battle maximum
            end
        end
    end
    
    -- Update experience and progression
    if expDistribution then
        stats.totalExpGained = stats.totalExpGained + (expDistribution.expGained or 0)
        if expDistribution.levelUpData then
            stats.levelsGained = stats.levelsGained + (expDistribution.levelUpData.levelsGained or 0)
        end
        stats.friendshipGained = stats.friendshipGained + 1  -- Battle participation friendship
    end
    
    -- Calculate performance metrics
    if stats.battlesParticipated > 0 then
        stats.winRate = stats.victories / stats.battlesParticipated
        stats.participationRate = stats.battlesParticipated / stats.totalBattles
        stats.survivalRate = 1.0 - (stats.timesKnockedOut / stats.battlesParticipated)
        stats.averageExpPerBattle = stats.totalExpGained / stats.battlesParticipated
    end
    
    if stats.turnsActive > 0 then
        stats.averageDamagePerTurn = stats.totalDamageDealt / stats.turnsActive
    end
    
    stats.lastUpdated = os.time()
    
    return stats, nil
end

-- Update battle statistics for all participating Pokemon
-- @param battleState: Complete battle state
-- @param battleResult: Battle conclusion result  
-- @param experienceDistribution: Results from experience distribution
-- @return: Statistics update summary
function BattleStatistics.updateAllPokemonStatistics(battleState, battleResult, experienceDistribution)
    if not battleState or not battleResult then
        return {success = false, error = "Invalid parameters"}
    end
    
    local updates = {}
    local distributions = (experienceDistribution and experienceDistribution.distributions) or {}
    
    -- Create lookup for experience distribution by Pokemon ID
    local expLookup = {}
    for _, dist in ipairs(distributions) do
        expLookup[dist.pokemonId] = dist
    end
    
    -- Update statistics for all player Pokemon that participated
    for _, pokemon in ipairs(battleState.playerParty or {}) do
        local participation = battleState.participationData and battleState.participationData[pokemon.id]
        
        if participation and participation.participated then
            local expDistribution = expLookup[pokemon.id]
            local updatedStats, error = BattleStatistics.updatePokemonStatistics(
                pokemon, 
                battleState, 
                battleResult, 
                expDistribution
            )
            
            table.insert(updates, {
                pokemonId = pokemon.id,
                pokemonName = pokemon.name,
                success = updatedStats ~= nil,
                error = error,
                stats = updatedStats
            })
        end
    end
    
    return {
        success = true,
        updates = updates,
        totalUpdates = #updates,
        battleId = battleState.battleId,
        battleResult = battleResult.result
    }
end

-- Count fainted Pokemon in party for statistics
-- @param party: Pokemon party to count
-- @return: Number of fainted Pokemon
function BattleStatistics.countFaintedPokemon(party)
    if not party then return 0 end
    
    local faintedCount = 0
    for _, pokemon in ipairs(party) do
        if pokemon.fainted or (pokemon.currentHP and pokemon.currentHP <= 0) then
            faintedCount = faintedCount + 1
        end
    end
    return faintedCount
end

-- Get player statistics (normally would load from persistent storage)
-- @param playerId: Player identifier
-- @return: Player statistics or nil if not found
function BattleStatistics.getPlayerStatistics(playerId)
    -- This would normally load from persistent storage
    -- For now, return nil to trigger creation of default stats
    return nil
end

-- Store player statistics (normally would persist to storage)
-- @param playerId: Player identifier  
-- @param playerStats: Statistics to store
-- @return: Success status
function BattleStatistics.setPlayerStatistics(playerId, playerStats)
    -- This would normally persist to storage
    -- For now, just return success
    return true
end

-- Create deep copy of a table (utility function)
-- @param original: Table to copy
-- @return: Deep copy of the table
function BattleStatistics.copyTable(original)
    local copy = {}
    for key, value in pairs(original) do
        if type(value) == "table" then
            copy[key] = BattleStatistics.copyTable(value)
        else
            copy[key] = value
        end
    end
    return copy
end

-- Get battle statistics summary for display
-- @param playerStats: Player statistics
-- @return: Human-readable statistics summary
function BattleStatistics.getPlayerStatsSummary(playerStats)
    if not playerStats then
        return "No battle statistics available"
    end
    
    local winRate = playerStats.totalBattles > 0 and (playerStats.victories / playerStats.totalBattles * 100) or 0
    local summary = string.format(
        "Battles: %d | Wins: %d (%.1f%%) | Current Streak: %d | Money Earned: %d",
        playerStats.totalBattles,
        playerStats.victories,
        winRate,
        playerStats.currentWinStreak,
        playerStats.totalMoneyEarned
    )
    
    if playerStats.gymBattles > 0 then
        summary = summary .. string.format(" | Gyms: %d", playerStats.gymBattles)
    end
    
    return summary
end

-- Get Pokemon statistics summary for display
-- @param pokemonStats: Pokemon statistics
-- @return: Human-readable statistics summary  
function BattleStatistics.getPokemonStatsSummary(pokemonStats)
    if not pokemonStats then
        return "No battle statistics available"
    end
    
    local summary = string.format(
        "Battles: %d | Wins: %d (%.1f%%) | Damage: %d dealt/%d taken | KOs: %d",
        pokemonStats.battlesParticipated,
        pokemonStats.victories,
        pokemonStats.winRate * 100,
        pokemonStats.totalDamageDealt,
        pokemonStats.totalDamageTaken,
        pokemonStats.knockouts
    )
    
    return summary
end

-- Validate statistics data integrity
-- @param stats: Statistics to validate (player or Pokemon)
-- @param statType: Type of statistics being validated
-- @return: Validation result
function BattleStatistics.validateStatistics(stats, statType)
    if not stats then
        return {valid = false, error = "Statistics data is nil"}
    end
    
    if statType == BattleStatistics.StatType.PLAYER_STATS then
        if stats.totalBattles < 0 or stats.victories < 0 or stats.defeats < 0 then
            return {valid = false, error = "Invalid negative battle counts"}
        end
        
        if stats.victories + stats.defeats + stats.draws + stats.forfeits + stats.escapes > stats.totalBattles then
            return {valid = false, error = "Outcome counts exceed total battles"}
        end
        
    elseif statType == BattleStatistics.StatType.POKEMON_STATS then
        if stats.battlesParticipated > stats.totalBattles then
            return {valid = false, error = "Participation exceeds total battles"}
        end
        
        if stats.winRate < 0 or stats.winRate > 1 then
            return {valid = false, error = "Invalid win rate"}
        end
    end
    
    return {valid = true, error = nil}
end

return BattleStatistics