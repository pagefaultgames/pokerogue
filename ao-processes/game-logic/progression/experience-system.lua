--[[
Pokemon Experience and Progression System
Handles level progression, experience gain, and friendship mechanics

Features:
- Experience gain calculation from battles
- Level progression with TypeScript parity
- Friendship tracking and updates
- Battle participation logging
- Experience group support (Fast, Medium Fast, Medium Slow, Slow)
--]]

local ExperienceSystem = {}

-- Import dependencies
local StatCalculator = require("game-logic.pokemon.stat-calculator")
local SpeciesDatabase = require("data.species.species-database")

-- Experience group formulas (matching Pokemon games)
local ExperienceFormulas = {
    ["FAST"] = function(level)
        return math.floor(4 * level * level * level / 5)
    end,
    
    ["MEDIUM_FAST"] = function(level)
        return level * level * level
    end,
    
    ["MEDIUM_SLOW"] = function(level)
        return math.floor(6 * level * level * level / 5) - (15 * level * level) + (100 * level) - 140
    end,
    
    ["SLOW"] = function(level)
        return math.floor(5 * level * level * level / 4)
    end,
    
    ["ERRATIC"] = function(level)
        if level <= 50 then
            return math.floor(level * level * level * (100 - level) / 50)
        elseif level <= 68 then
            return math.floor(level * level * level * (150 - level) / 100)
        elseif level <= 98 then
            return math.floor(level * level * level * ((1911 - 10 * level) / 3) / 500)
        else
            return math.floor(level * level * level * (160 - level) / 100)
        end
    end,
    
    ["FLUCTUATING"] = function(level)
        if level <= 15 then
            return math.floor(level * level * level * ((24 + ((level + 1) / 3)) / 50))
        elseif level <= 36 then
            return math.floor(level * level * level * ((14 + level) / 50))
        else
            return math.floor(level * level * level * ((32 + (level / 2)) / 50))
        end
    end
}

-- Constants
local MIN_LEVEL = 1
local MAX_LEVEL = 100
local MIN_FRIENDSHIP = 0
local MAX_FRIENDSHIP = 255
local DEFAULT_FRIENDSHIP = 70
local FRIENDSHIP_LEVEL_GAIN = 2    -- Friendship gained per level up
local FRIENDSHIP_BATTLE_WIN = 3    -- Friendship gained for winning battle
local FRIENDSHIP_BATTLE_LOSS = 1   -- Friendship gained for participating in battle

-- Experience calculation from battle participation
local BASE_EXP_YIELD = {
    ["WILD"] = 1.0,      -- Wild Pokemon battles
    ["TRAINER"] = 1.5,   -- Trainer battles  
    ["GYM"] = 2.0,       -- Gym leader battles
    ["ELITE"] = 2.5,     -- Elite Four battles
    ["CHAMPION"] = 3.0   -- Champion battles
}

-- Level and Experience Functions

-- Get experience required for a specific level based on growth rate
-- @param level: Target level (1-100)
-- @param growthRate: Experience group ("FAST", "MEDIUM_FAST", etc.)
-- @return: Total experience required to reach level
function ExperienceSystem.getExpForLevel(level, growthRate)
    if level < MIN_LEVEL then
        return 0
    end
    
    if level > MAX_LEVEL then
        level = MAX_LEVEL
    end
    
    if level == 1 then
        return 0
    end
    
    growthRate = growthRate or "MEDIUM_FAST"
    local formula = ExperienceFormulas[growthRate]
    
    if not formula then
        error("Invalid growth rate: " .. tostring(growthRate))
    end
    
    return math.max(0, formula(level))
end

-- Calculate current level from total experience
-- @param exp: Current experience points
-- @param growthRate: Experience group
-- @return: Current level (1-100)
function ExperienceSystem.getLevelFromExp(exp, growthRate)
    if exp <= 0 then
        return MIN_LEVEL
    end
    
    growthRate = growthRate or "MEDIUM_FAST"
    
    -- Binary search for efficient level calculation
    local low = MIN_LEVEL
    local high = MAX_LEVEL
    
    while low < high do
        local mid = math.floor((low + high + 1) / 2)
        local requiredExp = ExperienceSystem.getExpForLevel(mid, growthRate)
        
        if exp >= requiredExp then
            low = mid
        else
            high = mid - 1
        end
    end
    
    return low
end

-- Get experience needed for next level
-- @param currentLevel: Current level
-- @param growthRate: Experience group
-- @return: Experience needed to reach next level
function ExperienceSystem.getExpToNextLevel(currentLevel, growthRate)
    if currentLevel >= MAX_LEVEL then
        return 0
    end
    
    local currentLevelExp = ExperienceSystem.getExpForLevel(currentLevel, growthRate)
    local nextLevelExp = ExperienceSystem.getExpForLevel(currentLevel + 1, growthRate)
    
    return nextLevelExp - currentLevelExp
end

-- Get experience progress within current level
-- @param currentExp: Current experience points
-- @param growthRate: Experience group
-- @return: Table with level progress information
function ExperienceSystem.getLevelProgress(currentExp, growthRate)
    local currentLevel = ExperienceSystem.getLevelFromExp(currentExp, growthRate)
    local currentLevelExp = ExperienceSystem.getExpForLevel(currentLevel, growthRate)
    
    if currentLevel >= MAX_LEVEL then
        return {
            level = currentLevel,
            currentLevelExp = currentExp,
            nextLevelExp = currentExp,
            expInLevel = 0,
            expToNextLevel = 0,
            progressPercent = 100
        }
    end
    
    local nextLevelExp = ExperienceSystem.getExpForLevel(currentLevel + 1, growthRate)
    local expInLevel = currentExp - currentLevelExp
    local expToNextLevel = nextLevelExp - currentExp
    local progressPercent = (expInLevel / (nextLevelExp - currentLevelExp)) * 100
    
    return {
        level = currentLevel,
        currentLevelExp = currentLevelExp,
        nextLevelExp = nextLevelExp,
        expInLevel = expInLevel,
        expToNextLevel = expToNextLevel,
        progressPercent = progressPercent
    }
end

-- Battle Experience Calculation

-- Calculate experience gained from defeating a Pokemon
-- @param defeatedPokemon: The defeated Pokemon instance
-- @param victorPokemon: The Pokemon that gained experience
-- @param battleType: Type of battle ("WILD", "TRAINER", etc.)
-- @param participationData: Additional participation info
-- @return: Experience points gained
function ExperienceSystem.calculateBattleExp(defeatedPokemon, victorPokemon, battleType, participationData)
    if not defeatedPokemon or not victorPokemon then
        return 0
    end
    
    participationData = participationData or {}
    battleType = battleType or "WILD"
    
    -- Base experience from defeated Pokemon's species and level
    local speciesData = SpeciesDatabase.getSpecies(defeatedPokemon.speciesId)
    if not speciesData then
        return 0
    end
    
    local baseExp = speciesData.baseExp or 50
    local defeatedLevel = defeatedPokemon.level
    
    -- Base formula: (Base Exp * Defeated Level) / 7
    local expGained = math.floor((baseExp * defeatedLevel) / 7)
    
    -- Battle type multiplier
    local battleMultiplier = BASE_EXP_YIELD[battleType] or 1.0
    expGained = math.floor(expGained * battleMultiplier)
    
    -- Participation multiplier (if Pokemon didn't deal killing blow)
    if participationData.participated and not participationData.killingBlow then
        expGained = math.floor(expGained * 0.5)  -- Half exp for participation
    end
    
    -- Traded Pokemon bonus
    if participationData.isTraded then
        expGained = math.floor(expGained * 1.5)
    end
    
    -- Lucky Egg bonus (if held item)
    if participationData.hasLuckyEgg then
        expGained = math.floor(expGained * 1.5)
    end
    
    -- Level difference bonus/penalty
    local levelDifference = defeatedLevel - victorPokemon.level
    if levelDifference > 0 then
        -- Bonus for defeating higher level Pokemon
        local levelBonus = 1.0 + (levelDifference * 0.1)
        expGained = math.floor(expGained * math.min(levelBonus, 2.0))  -- Cap at 2x
    elseif levelDifference < -5 then
        -- Penalty for defeating much lower level Pokemon
        local levelPenalty = 1.0 + (levelDifference * 0.05)  -- Negative difference reduces exp
        expGained = math.floor(expGained * math.max(levelPenalty, 0.1))  -- Floor at 10%
    end
    
    return math.max(1, expGained)  -- Always gain at least 1 exp
end

-- Pokemon Progression Updates

-- Apply experience gain to Pokemon and handle level ups
-- @param pokemon: Pokemon instance to update
-- @param expGained: Amount of experience to add
-- @param battleContext: Context information about the battle
-- @return: Updated Pokemon with level progression results
function ExperienceSystem.gainExperience(pokemon, expGained, battleContext)
    if not pokemon or not expGained or expGained <= 0 then
        return pokemon, nil
    end
    
    battleContext = battleContext or {}
    
    -- Get species data for growth rate
    SpeciesDatabase.init()
    local speciesData = SpeciesDatabase.getSpecies(pokemon.speciesId)
    if not speciesData then
        return pokemon, "Species data not found"
    end
    
    local growthRate = speciesData.growthRate or "MEDIUM_FAST"
    local oldLevel = pokemon.level
    local oldExp = pokemon.exp
    
    -- Add experience
    pokemon.exp = oldExp + expGained
    
    -- Calculate new level
    local newLevel = ExperienceSystem.getLevelFromExp(pokemon.exp, growthRate)
    
    local levelUpData = nil
    
    -- Handle level up if occurred
    if newLevel > oldLevel then
        pokemon.level = newLevel
        
        -- Recalculate stats
        local newStats, error = StatCalculator.calculateAllStats(
            speciesData.baseStats,
            pokemon.ivs,
            newLevel,
            pokemon.nature
        )
        
        if newStats then
            -- Preserve HP ratio during level up
            local hpRatio = pokemon.stats.hp / pokemon.stats.maxHp
            
            pokemon.stats.attack = newStats.attack
            pokemon.stats.defense = newStats.defense
            pokemon.stats.spAttack = newStats.spAttack
            pokemon.stats.spDefense = newStats.spDefense
            pokemon.stats.speed = newStats.speed
            pokemon.stats.maxHp = newStats.hp
            
            -- Restore HP based on ratio plus level up healing
            pokemon.stats.hp = math.floor(pokemon.stats.maxHp * hpRatio) + (newLevel - oldLevel)
            pokemon.stats.hp = math.min(pokemon.stats.hp, pokemon.stats.maxHp)
        end
        
        -- Update friendship for level gain
        ExperienceSystem.updateFriendship(pokemon, FRIENDSHIP_LEVEL_GAIN * (newLevel - oldLevel))
        
        -- Prepare level up data
        levelUpData = {
            oldLevel = oldLevel,
            newLevel = newLevel,
            levelsGained = newLevel - oldLevel,
            expGained = expGained,
            totalExp = pokemon.exp,
            statsIncreased = newStats and true or false
        }
    end
    
    -- Update battle tracking
    if battleContext.battleId then
        if not pokemon.battleHistory then
            pokemon.battleHistory = {}
        end
        
        table.insert(pokemon.battleHistory, {
            battleId = battleContext.battleId,
            expGained = expGained,
            levelBefore = oldLevel,
            levelAfter = pokemon.level,
            timestamp = os.time()
        })
        
        pokemon.lastBattleAt = os.time()
    end
    
    return pokemon, levelUpData
end

-- Friendship System

-- Update Pokemon friendship value
-- @param pokemon: Pokemon instance
-- @param friendshipChange: Amount to change friendship (can be negative)
-- @param reason: Reason for friendship change (optional)
-- @return: Updated Pokemon instance
function ExperienceSystem.updateFriendship(pokemon, friendshipChange, reason)
    if not pokemon or not friendshipChange then
        return pokemon
    end
    
    local oldFriendship = pokemon.friendship or DEFAULT_FRIENDSHIP
    local newFriendship = oldFriendship + friendshipChange
    
    -- Clamp to valid range
    newFriendship = math.max(MIN_FRIENDSHIP, math.min(MAX_FRIENDSHIP, newFriendship))
    
    pokemon.friendship = newFriendship
    
    -- Track friendship changes if significant
    if math.abs(friendshipChange) > 0 then
        if not pokemon.friendshipHistory then
            pokemon.friendshipHistory = {}
        end
        
        -- Keep only recent friendship changes (last 10)
        if #pokemon.friendshipHistory >= 10 then
            table.remove(pokemon.friendshipHistory, 1)
        end
        
        table.insert(pokemon.friendshipHistory, {
            change = friendshipChange,
            oldValue = oldFriendship,
            newValue = newFriendship,
            reason = reason or "unknown",
            timestamp = os.time()
        })
    end
    
    return pokemon
end

-- Get friendship level category
-- @param friendship: Friendship value (0-255)
-- @return: Friendship category string
function ExperienceSystem.getFriendshipLevel(friendship)
    if friendship >= 220 then
        return "BEST_FRIENDS"    -- Maximum friendship
    elseif friendship >= 160 then
        return "GREAT_FRIENDS"   -- High friendship
    elseif friendship >= 100 then
        return "GOOD_FRIENDS"    -- Medium friendship
    elseif friendship >= 50 then
        return "NEUTRAL"         -- Default friendship
    else
        return "LOW"             -- Low friendship
    end
end

-- Apply friendship change from battle outcome
-- @param pokemon: Pokemon instance
-- @param battleOutcome: Battle result ("WIN", "LOSS", "DRAW")
-- @param battleType: Type of battle
-- @return: Updated Pokemon instance
function ExperienceSystem.applyBattleFriendship(pokemon, battleOutcome, battleType)
    if not pokemon or not battleOutcome then
        return pokemon
    end
    
    local friendshipGain = 0
    local reason = "battle"
    
    if battleOutcome == "WIN" then
        friendshipGain = FRIENDSHIP_BATTLE_WIN
        reason = "battle_victory"
    elseif battleOutcome == "LOSS" then
        friendshipGain = FRIENDSHIP_BATTLE_LOSS
        reason = "battle_participation"
    end
    
    -- Bonus friendship for important battles
    if battleType == "GYM" or battleType == "ELITE" or battleType == "CHAMPION" then
        friendshipGain = friendshipGain + 1
        reason = reason .. "_important"
    end
    
    return ExperienceSystem.updateFriendship(pokemon, friendshipGain, reason)
end

-- Battle Participation Tracking

-- Record battle participation for a Pokemon
-- @param pokemon: Pokemon instance
-- @param battleData: Battle information
-- @return: Updated Pokemon instance
function ExperienceSystem.recordBattleParticipation(pokemon, battleData)
    if not pokemon or not battleData then
        return pokemon
    end
    
    if not pokemon.battleHistory then
        pokemon.battleHistory = {}
    end
    
    -- Limit battle history size
    if #pokemon.battleHistory >= 50 then
        table.remove(pokemon.battleHistory, 1)
    end
    
    local battleRecord = {
        battleId = battleData.battleId,
        battleType = battleData.battleType or "UNKNOWN",
        outcome = battleData.outcome,
        expGained = battleData.expGained or 0,
        friendshipChange = battleData.friendshipChange or 0,
        participated = true,
        killingBlow = battleData.killingBlow or false,
        timestamp = os.time()
    }
    
    table.insert(pokemon.battleHistory, battleRecord)
    pokemon.lastBattleAt = os.time()
    
    return pokemon
end

-- Get battle participation statistics
-- @param pokemon: Pokemon instance
-- @param timeRange: Optional time range in seconds (default: all time)
-- @return: Statistics table
function ExperienceSystem.getBattleStats(pokemon, timeRange)
    if not pokemon or not pokemon.battleHistory then
        return {
            totalBattles = 0,
            wins = 0,
            losses = 0,
            totalExpGained = 0,
            averageExpPerBattle = 0,
            friendshipGained = 0
        }
    end
    
    local cutoffTime = timeRange and (os.time() - timeRange) or 0
    local stats = {
        totalBattles = 0,
        wins = 0,
        losses = 0,
        draws = 0,
        totalExpGained = 0,
        friendshipGained = 0,
        killingBlows = 0
    }
    
    for _, battle in ipairs(pokemon.battleHistory) do
        if battle.timestamp >= cutoffTime then
            stats.totalBattles = stats.totalBattles + 1
            stats.totalExpGained = stats.totalExpGained + (battle.expGained or 0)
            stats.friendshipGained = stats.friendshipGained + (battle.friendshipChange or 0)
            
            if battle.outcome == "WIN" then
                stats.wins = stats.wins + 1
            elseif battle.outcome == "LOSS" then
                stats.losses = stats.losses + 1
            elseif battle.outcome == "DRAW" then
                stats.draws = stats.draws + 1
            end
            
            if battle.killingBlow then
                stats.killingBlows = stats.killingBlows + 1
            end
        end
    end
    
    stats.averageExpPerBattle = stats.totalBattles > 0 and (stats.totalExpGained / stats.totalBattles) or 0
    stats.winRate = stats.totalBattles > 0 and (stats.wins / stats.totalBattles) or 0
    
    return stats
end

-- Utility Functions

-- Validate experience and level consistency
-- @param pokemon: Pokemon instance to validate
-- @return: Boolean indicating if experience/level are consistent
function ExperienceSystem.validateProgression(pokemon)
    if not pokemon then
        return false, "Pokemon instance required"
    end
    
    local speciesData = SpeciesDatabase.getSpecies(pokemon.speciesId)
    if not speciesData then
        return false, "Species data not found"
    end
    
    local growthRate = speciesData.growthRate or "MEDIUM_FAST"
    local expectedLevel = ExperienceSystem.getLevelFromExp(pokemon.exp, growthRate)
    
    if pokemon.level ~= expectedLevel then
        return false, "Level " .. pokemon.level .. " does not match experience " .. pokemon.exp .. " (expected level " .. expectedLevel .. ")"
    end
    
    if pokemon.friendship < MIN_FRIENDSHIP or pokemon.friendship > MAX_FRIENDSHIP then
        return false, "Friendship " .. pokemon.friendship .. " is outside valid range"
    end
    
    return true
end

-- Get experience group constants for external use
function ExperienceSystem.getExperienceGroups()
    local groups = {}
    for group, _ in pairs(ExperienceFormulas) do
        table.insert(groups, group)
    end
    return groups
end

-- Get level boundaries for experience group
-- @param growthRate: Experience group
-- @return: Table with level milestone information
function ExperienceSystem.getLevelMilestones(growthRate)
    growthRate = growthRate or "MEDIUM_FAST"
    
    local milestones = {}
    local importantLevels = {1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100}
    
    for _, level in ipairs(importantLevels) do
        local expRequired = ExperienceSystem.getExpForLevel(level, growthRate)
        table.insert(milestones, {
            level = level,
            expRequired = expRequired,
            expFromPrevious = level > 1 and (expRequired - ExperienceSystem.getExpForLevel(level - 1, growthRate)) or 0
        })
    end
    
    return milestones
end

return ExperienceSystem