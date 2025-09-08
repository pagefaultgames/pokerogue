-- Battle Reward Calculator
-- Calculates money rewards, item drops, and other battle completion rewards
-- Integrates with battle state data and victory/defeat conditions
-- Provides deterministic reward distribution based on battle type and outcome

local RewardCalculator = {}

-- Load dependencies
local BattleRNG = require("game-logic.rng.battle-rng")

-- Battle type reward multipliers
RewardCalculator.BattleMultipliers = {
    WILD = {
        money = 1.0,
        itemChance = 0.05,     -- 5% chance for wild Pokemon items
        bonusChance = 0.01     -- 1% chance for rare bonuses
    },
    TRAINER = {
        money = 1.5,
        itemChance = 0.15,     -- 15% chance for trainer battle items
        bonusChance = 0.05     -- 5% chance for bonuses
    },
    GYM = {
        money = 2.5,
        itemChance = 0.25,     -- 25% chance for gym battle items
        bonusChance = 0.15     -- 15% chance for rare rewards
    },
    ELITE = {
        money = 3.0,
        itemChance = 0.35,     -- 35% chance for Elite Four items
        bonusChance = 0.25     -- 25% chance for elite rewards
    },
    CHAMPION = {
        money = 5.0,
        itemChance = 0.50,     -- 50% chance for Champion items
        bonusChance = 0.40     -- 40% chance for champion rewards
    }
}

-- Base money reward per Pokemon level
RewardCalculator.BASE_MONEY_PER_LEVEL = 10

-- Item drop tables by battle type
RewardCalculator.ItemDrops = {
    WILD = {
        "POTION", "SUPER_POTION", "POKEBALL", "GREAT_BALL", "BERRY", "ORAN_BERRY"
    },
    TRAINER = {
        "SUPER_POTION", "HYPER_POTION", "GREAT_BALL", "ULTRA_BALL", "X_ATTACK", "X_DEFEND",
        "FULL_HEAL", "REVIVE", "LEPPA_BERRY", "SITRUS_BERRY"
    },
    GYM = {
        "HYPER_POTION", "MAX_POTION", "ULTRA_BALL", "X_ATTACK", "X_DEFEND", "X_SPEED",
        "FULL_RESTORE", "MAX_REVIVE", "RARE_CANDY", "TM_RANDOM"
    },
    ELITE = {
        "MAX_POTION", "FULL_RESTORE", "MAX_REVIVE", "RARE_CANDY", "PP_MAX", 
        "TM_RARE", "GOLD_BOTTLE_CAP", "ABILITY_CAPSULE"
    },
    CHAMPION = {
        "FULL_RESTORE", "MAX_REVIVE", "RARE_CANDY", "PP_MAX", "GOLD_BOTTLE_CAP",
        "ABILITY_CAPSULE", "MASTER_BALL", "LEGENDARY_ITEM"
    }
}

-- Bonus reward types
RewardCalculator.BonusRewards = {
    EXTRA_MONEY = "extra_money",
    RARE_ITEM = "rare_item", 
    EXPERIENCE_BONUS = "experience_bonus",
    FRIENDSHIP_BONUS = "friendship_bonus",
    SHINY_BONUS = "shiny_bonus"
}

-- Initialize reward calculator with battle seed
-- @param battleSeed: Deterministic RNG seed for consistent rewards
-- @return: Success status
function RewardCalculator.init(battleSeed)
    if battleSeed then
        BattleRNG.initSeed(battleSeed)
    end
    return true, "Reward calculator initialized"
end

-- Calculate money rewards from battle victory
-- @param battleState: Battle state with party and battle type information
-- @param battleResult: Battle conclusion result
-- @return: Money reward calculation details
function RewardCalculator.calculateMoneyRewards(battleState, battleResult)
    if not battleState or not battleResult then
        return {totalMoney = 0, breakdown = {}, error = "Invalid parameters"}
    end
    
    -- Only give money rewards for victory
    if battleResult.result ~= "victory" then
        return {totalMoney = 0, breakdown = {}, message = "No money reward for " .. battleResult.result}
    end
    
    local battleType = battleState.battleType or "WILD"
    local multiplier = RewardCalculator.BattleMultipliers[battleType]
    
    if not multiplier then
        return {totalMoney = 0, breakdown = {}, error = "Invalid battle type: " .. battleType}
    end
    
    local totalMoney = 0
    local breakdown = {}
    
    -- Calculate base money from defeated enemy Pokemon levels
    for i, enemyPokemon in ipairs(battleState.enemyParty or {}) do
        if enemyPokemon.fainted then
            local pokemonLevel = enemyPokemon.level or 50
            local baseMoney = RewardCalculator.BASE_MONEY_PER_LEVEL * pokemonLevel
            local battleMoney = math.floor(baseMoney * multiplier.money)
            
            totalMoney = totalMoney + battleMoney
            
            table.insert(breakdown, {
                pokemonName = enemyPokemon.name or ("Enemy " .. i),
                pokemonLevel = pokemonLevel,
                baseMoney = baseMoney,
                battleMoney = battleMoney,
                multiplier = multiplier.money
            })
        end
    end
    
    -- Apply random variation (±20%)
    local variation = BattleRNG.random(80, 120) / 100.0
    totalMoney = math.floor(totalMoney * variation)
    
    return {
        totalMoney = totalMoney,
        breakdown = breakdown,
        battleType = battleType,
        multiplier = multiplier.money,
        variation = variation
    }
end

-- Calculate item drops and rewards from battle
-- @param battleState: Battle state with party and battle type information
-- @param battleResult: Battle conclusion result
-- @return: Item reward calculation details
function RewardCalculator.calculateItemRewards(battleState, battleResult)
    if not battleState or not battleResult then
        return {items = {}, bonusItems = {}, error = "Invalid parameters"}
    end
    
    -- Only give item rewards for victory
    if battleResult.result ~= "victory" then
        return {items = {}, bonusItems = {}, message = "No item rewards for " .. battleResult.result}
    end
    
    local battleType = battleState.battleType or "WILD"
    local multiplier = RewardCalculator.BattleMultipliers[battleType]
    local dropTable = RewardCalculator.ItemDrops[battleType]
    
    if not multiplier or not dropTable then
        return {items = {}, bonusItems = {}, error = "Invalid battle type: " .. battleType}
    end
    
    local items = {}
    local bonusItems = {}
    
    -- Calculate item chance percentage for this battle type
    local itemChancePercent = multiplier.itemChance * 100
    local bonusChancePercent = multiplier.bonusChance * 100
    
    -- Check for item drops from each defeated Pokemon
    for i, enemyPokemon in ipairs(battleState.enemyParty or {}) do
        if enemyPokemon.fainted then
            -- Roll for item drop chance
            local itemRoll = BattleRNG.random(1, 100)
            
            if itemRoll <= itemChancePercent then
                -- Select random item from drop table
                local itemIndex = BattleRNG.random(1, #dropTable)
                local selectedItem = dropTable[itemIndex]
                
                -- Determine quantity (usually 1, sometimes more for common items)
                local quantity = 1
                if selectedItem == "POTION" or selectedItem == "POKEBALL" or selectedItem == "BERRY" then
                    quantity = BattleRNG.random(1, 3)
                end
                
                table.insert(items, {
                    itemId = selectedItem,
                    quantity = quantity,
                    source = enemyPokemon.name or ("Enemy " .. i),
                    dropChance = itemChancePercent,
                    roll = itemRoll
                })
            end
        end
    end
    
    -- Check for bonus rewards
    local bonusRoll = BattleRNG.random(1, 100)
    
    if bonusRoll <= bonusChancePercent then
        local bonusType = RewardCalculator.selectBonusReward(battleType)
        local bonusReward = RewardCalculator.generateBonusReward(bonusType, battleState)
        
        if bonusReward then
            table.insert(bonusItems, bonusReward)
        end
    end
    
    return {
        items = items,
        bonusItems = bonusItems,
        battleType = battleType,
        itemChance = itemChancePercent,
        bonusChance = bonusChancePercent,
        itemRoll = #items > 0 and "success" or "failed",
        bonusRoll = #bonusItems > 0 and "success" or "failed"
    }
end

-- Select bonus reward type based on battle type
-- @param battleType: Type of battle for bonus selection
-- @return: Selected bonus reward type
function RewardCalculator.selectBonusReward(battleType)
    local bonusWeights = {}
    
    if battleType == "WILD" then
        bonusWeights = {
            [RewardCalculator.BonusRewards.EXTRA_MONEY] = 40,
            [RewardCalculator.BonusRewards.RARE_ITEM] = 30,
            [RewardCalculator.BonusRewards.EXPERIENCE_BONUS] = 20,
            [RewardCalculator.BonusRewards.FRIENDSHIP_BONUS] = 10
        }
    elseif battleType == "TRAINER" then
        bonusWeights = {
            [RewardCalculator.BonusRewards.EXTRA_MONEY] = 30,
            [RewardCalculator.BonusRewards.RARE_ITEM] = 35,
            [RewardCalculator.BonusRewards.EXPERIENCE_BONUS] = 25,
            [RewardCalculator.BonusRewards.FRIENDSHIP_BONUS] = 10
        }
    else -- GYM, ELITE, CHAMPION
        bonusWeights = {
            [RewardCalculator.BonusRewards.EXTRA_MONEY] = 20,
            [RewardCalculator.BonusRewards.RARE_ITEM] = 50,
            [RewardCalculator.BonusRewards.EXPERIENCE_BONUS] = 20,
            [RewardCalculator.BonusRewards.FRIENDSHIP_BONUS] = 10
        }
    end
    
    -- Weighted random selection
    local totalWeight = 0
    for _, weight in pairs(bonusWeights) do
        totalWeight = totalWeight + weight
    end
    
    local roll = BattleRNG.random(1, totalWeight)
    local currentWeight = 0
    
    for bonusType, weight in pairs(bonusWeights) do
        currentWeight = currentWeight + weight
        if roll <= currentWeight then
            return bonusType
        end
    end
    
    return RewardCalculator.BonusRewards.EXTRA_MONEY  -- Fallback
end

-- Generate specific bonus reward based on type
-- @param bonusType: Type of bonus reward to generate
-- @param battleState: Battle state for context
-- @return: Generated bonus reward details
function RewardCalculator.generateBonusReward(bonusType, battleState)
    local battleType = battleState.battleType or "WILD"
    
    if bonusType == RewardCalculator.BonusRewards.EXTRA_MONEY then
        local baseMoney = RewardCalculator.BASE_MONEY_PER_LEVEL * 50  -- Base amount
        local multiplier = RewardCalculator.BattleMultipliers[battleType].money
        local bonusAmount = math.floor(baseMoney * multiplier * BattleRNG.random(50, 200) / 100)
        
        return {
            type = "MONEY",
            amount = bonusAmount,
            description = "Bonus money reward!"
        }
        
    elseif bonusType == RewardCalculator.BonusRewards.RARE_ITEM then
        local rareItems = {"RARE_CANDY", "TM_RANDOM", "GOLD_BOTTLE_CAP", "PP_UP"}
        local selectedItem = rareItems[BattleRNG.random(1, #rareItems)]
        
        return {
            type = "ITEM", 
            itemId = selectedItem,
            quantity = 1,
            description = "Rare item bonus!"
        }
        
    elseif bonusType == RewardCalculator.BonusRewards.EXPERIENCE_BONUS then
        local bonusPercent = BattleRNG.random(10, 50)  -- 10-50% bonus experience
        
        return {
            type = "EXPERIENCE_MULTIPLIER",
            multiplier = 1.0 + (bonusPercent / 100.0),
            description = "+" .. bonusPercent .. "% experience bonus!"
        }
        
    elseif bonusType == RewardCalculator.BonusRewards.FRIENDSHIP_BONUS then
        local friendshipBonus = BattleRNG.random(5, 20)
        
        return {
            type = "FRIENDSHIP_BOOST",
            amount = friendshipBonus,
            description = "+" .. friendshipBonus .. " friendship bonus!"
        }
    end
    
    return nil
end

-- Calculate complete battle rewards including money, items, and bonuses
-- @param battleState: Battle state with all necessary data
-- @param battleResult: Battle conclusion result
-- @return: Complete reward calculation results
function RewardCalculator.calculateBattleRewards(battleState, battleResult)
    if not battleState or not battleResult then
        return {
            success = false,
            error = "Invalid parameters for reward calculation"
        }
    end
    
    -- Initialize with battle seed for deterministic rewards
    if battleState.battleSeed then
        BattleRNG.initSeed(battleState.battleSeed)
    end
    
    local moneyRewards = RewardCalculator.calculateMoneyRewards(battleState, battleResult)
    local itemRewards = RewardCalculator.calculateItemRewards(battleState, battleResult)
    
    return {
        success = true,
        battleId = battleState.battleId,
        battleType = battleState.battleType,
        battleResult = battleResult.result,
        
        -- Money rewards
        money = moneyRewards,
        
        -- Item rewards
        items = itemRewards,
        
        -- Summary
        totalMoney = moneyRewards.totalMoney or 0,
        totalItems = #(itemRewards.items or {}),
        totalBonusItems = #(itemRewards.bonusItems or {}),
        
        -- Metadata
        timestamp = os.time(),
        turn = battleResult.turn or 0
    }
end

-- Validate reward calculation parameters
-- @param battleState: Battle state to validate
-- @param battleResult: Battle result to validate
-- @return: Validation result with success status
function RewardCalculator.validateRewardParameters(battleState, battleResult)
    if not battleState then
        return {valid = false, error = "Battle state is required"}
    end
    
    if not battleResult then
        return {valid = false, error = "Battle result is required"}
    end
    
    if not battleState.enemyParty or type(battleState.enemyParty) ~= "table" then
        return {valid = false, error = "Invalid enemy party data"}
    end
    
    local battleType = battleState.battleType or "WILD"
    if not RewardCalculator.BattleMultipliers[battleType] then
        return {valid = false, error = "Invalid battle type: " .. battleType}
    end
    
    return {valid = true, error = nil}
end

-- Get reward summary for display purposes
-- @param rewardResults: Results from calculateBattleRewards
-- @return: Human-readable reward summary
function RewardCalculator.getRewardSummary(rewardResults)
    if not rewardResults or not rewardResults.success then
        return "No rewards calculated"
    end
    
    local summary = {}
    
    if rewardResults.totalMoney > 0 then
        table.insert(summary, rewardResults.totalMoney .. " Pokédollars")
    end
    
    if rewardResults.totalItems > 0 then
        table.insert(summary, rewardResults.totalItems .. " items")
    end
    
    if rewardResults.totalBonusItems > 0 then
        table.insert(summary, rewardResults.totalBonusItems .. " bonus rewards")
    end
    
    if #summary == 0 then
        return "No rewards received"
    end
    
    local result = "Received: " .. table.concat(summary, ", ")
    
    if rewardResults.battleType and rewardResults.battleType ~= "WILD" then
        result = result .. " (" .. rewardResults.battleType .. " battle)"
    end
    
    return result
end

return RewardCalculator