-- Passive Abilities Implementation
-- Unlockable passive ability system separate from battle abilities
-- Provides persistent effects outside of battle contexts

local PassiveAbilities = {}

-- Passive ability categories
PassiveAbilities.Categories = {
    TRAINING = "TRAINING",         -- Training and XP bonuses
    BREEDING = "BREEDING",         -- Breeding enhancements
    EXPLORATION = "EXPLORATION",   -- World exploration bonuses
    COLLECTION = "COLLECTION",     -- Collection and discovery bonuses
    COMBAT = "COMBAT",            -- Persistent combat bonuses
    ECONOMIC = "ECONOMIC"         -- Resource and currency bonuses
}

-- Passive ability data structure
PassiveAbilities.passives = {}

-- Initialize passive ability system
function PassiveAbilities.init()
    -- Passive ability definitions separate from battle abilities
    PassiveAbilities.passives = {
        -- Training Category
        [1001] = {
            id = 1001,
            name = "Experience Boost",
            description = "Increases experience gained from battles by 25%",
            category = PassiveAbilities.Categories.TRAINING,
            unlockLevel = 5,
            unlockCost = 100,
            effects = {
                {
                    type = "EXPERIENCE_MULTIPLIER",
                    value = 1.25,
                    context = "BATTLE_VICTORY"
                }
            },
            prerequisites = {},
            maxLevel = 3,
            levelEffects = {
                [1] = {multiplier = 1.25},
                [2] = {multiplier = 1.50},
                [3] = {multiplier = 1.75}
            }
        },
        
        [1002] = {
            id = 1002,
            name = "Stat Training Efficiency",
            description = "Pokemon gain stat experience more efficiently during training",
            category = PassiveAbilities.Categories.TRAINING,
            unlockLevel = 10,
            unlockCost = 200,
            effects = {
                {
                    type = "STAT_TRAINING_MULTIPLIER",
                    value = 1.5,
                    context = "TRAINING"
                }
            },
            prerequisites = {1001},
            maxLevel = 2,
            levelEffects = {
                [1] = {multiplier = 1.5},
                [2] = {multiplier = 2.0}
            }
        },
        
        -- Breeding Category
        [2001] = {
            id = 2001,
            name = "Breeding Mastery",
            description = "Increases the chance of passing down desired abilities and IVs",
            category = PassiveAbilities.Categories.BREEDING,
            unlockLevel = 15,
            unlockCost = 300,
            effects = {
                {
                    type = "BREEDING_SUCCESS_RATE",
                    value = 1.3,
                    context = "BREEDING"
                }
            },
            prerequisites = {},
            maxLevel = 3,
            levelEffects = {
                [1] = {successRate = 1.3},
                [2] = {successRate = 1.6},
                [3] = {successRate = 2.0}
            }
        },
        
        [2002] = {
            id = 2002,
            name = "Egg Incubation Speed",
            description = "Pokemon eggs hatch faster with improved care",
            category = PassiveAbilities.Categories.BREEDING,
            unlockLevel = 12,
            unlockCost = 250,
            effects = {
                {
                    type = "EGG_HATCH_SPEED",
                    value = 1.5,
                    context = "EGG_INCUBATION"
                }
            },
            prerequisites = {},
            maxLevel = 2,
            levelEffects = {
                [1] = {speedMultiplier = 1.5},
                [2] = {speedMultiplier = 2.0}
            }
        },
        
        -- Exploration Category
        [3001] = {
            id = 3001,
            name = "Terrain Navigator",
            description = "Improved movement and discovery in various terrains",
            category = PassiveAbilities.Categories.EXPLORATION,
            unlockLevel = 8,
            unlockCost = 150,
            effects = {
                {
                    type = "TERRAIN_BONUS",
                    value = 1.2,
                    context = "EXPLORATION"
                }
            },
            prerequisites = {},
            maxLevel = 3,
            levelEffects = {
                [1] = {bonus = 1.2, terrains = {"GRASS", "CAVE"}},
                [2] = {bonus = 1.4, terrains = {"GRASS", "CAVE", "WATER"}},
                [3] = {bonus = 1.6, terrains = {"ALL"}}
            }
        },
        
        [3002] = {
            id = 3002,
            name = "Item Finder",
            description = "Increases the chance of finding rare items during exploration",
            category = PassiveAbilities.Categories.EXPLORATION,
            unlockLevel = 20,
            unlockCost = 400,
            effects = {
                {
                    type = "ITEM_FIND_RATE",
                    value = 1.5,
                    context = "EXPLORATION"
                }
            },
            prerequisites = {3001},
            maxLevel = 2,
            levelEffects = {
                [1] = {findRate = 1.5, rareChance = 1.2},
                [2] = {findRate = 2.0, rareChance = 1.5}
            }
        },
        
        -- Collection Category
        [4001] = {
            id = 4001,
            name = "Pokedex Scholar",
            description = "Gain additional information and bonuses from Pokedex entries",
            category = PassiveAbilities.Categories.COLLECTION,
            unlockLevel = 25,
            unlockCost = 500,
            effects = {
                {
                    type = "POKEDEX_BONUS",
                    value = 1.3,
                    context = "COLLECTION"
                }
            },
            prerequisites = {},
            maxLevel = 3,
            levelEffects = {
                [1] = {infoBonus = 1.3, rewardBonus = 1.1},
                [2] = {infoBonus = 1.6, rewardBonus = 1.25},
                [3] = {infoBonus = 2.0, rewardBonus = 1.5}
            }
        },
        
        -- Combat Category
        [5001] = {
            id = 5001,
            name = "Battle Strategist",
            description = "Gain tactical advantages in battles through improved planning",
            category = PassiveAbilities.Categories.COMBAT,
            unlockLevel = 30,
            unlockCost = 600,
            effects = {
                {
                    type = "BATTLE_PREPARATION",
                    value = 1.2,
                    context = "PRE_BATTLE"
                }
            },
            prerequisites = {},
            maxLevel = 2,
            levelEffects = {
                [1] = {strategyBonus = 1.2, prepTime = 1.5},
                [2] = {strategyBonus = 1.5, prepTime = 2.0}
            }
        },
        
        [5002] = {
            id = 5002,
            name = "Combat Veteran",
            description = "Persistent stat bonuses based on battle experience",
            category = PassiveAbilities.Categories.COMBAT,
            unlockLevel = 40,
            unlockCost = 800,
            effects = {
                {
                    type = "PERSISTENT_STAT_BONUS",
                    value = 1.1,
                    context = "ALWAYS"
                }
            },
            prerequisites = {5001},
            maxLevel = 3,
            levelEffects = {
                [1] = {statBonus = 1.1},
                [2] = {statBonus = 1.2},
                [3] = {statBonus = 1.3}
            }
        },
        
        -- Economic Category
        [6001] = {
            id = 6001,
            name = "Resource Manager",
            description = "More efficient use of items and resources",
            category = PassiveAbilities.Categories.ECONOMIC,
            unlockLevel = 18,
            unlockCost = 350,
            effects = {
                {
                    type = "RESOURCE_EFFICIENCY",
                    value = 1.25,
                    context = "ITEM_USE"
                }
            },
            prerequisites = {},
            maxLevel = 2,
            levelEffects = {
                [1] = {efficiency = 1.25, saveChance = 0.1},
                [2] = {efficiency = 1.5, saveChance = 0.2}
            }
        }
    }
    
    -- Create category indexes
    PassiveAbilities.categorizedPassives = {}
    for category in pairs(PassiveAbilities.Categories) do
        PassiveAbilities.categorizedPassives[category] = {}
    end
    
    for passiveId, passiveData in pairs(PassiveAbilities.passives) do
        local category = passiveData.category
        if PassiveAbilities.categorizedPassives[category] then
            table.insert(PassiveAbilities.categorizedPassives[category], passiveId)
        end
    end
end

-- Player passive ability state
PassiveAbilities.playerState = {
    unlockedPassives = {},
    activePassives = {},
    passiveLevels = {},
    totalPoints = 0,
    spentPoints = 0
}

-- Get passive ability by ID
function PassiveAbilities.getPassive(passiveId)
    if not PassiveAbilities.passives or not next(PassiveAbilities.passives) then
        PassiveAbilities.init()
    end
    return PassiveAbilities.passives[passiveId]
end

-- Get passives by category
function PassiveAbilities.getPassivesByCategory(category)
    if not PassiveAbilities.categorizedPassives or not next(PassiveAbilities.categorizedPassives) then
        PassiveAbilities.init()
    end
    return PassiveAbilities.categorizedPassives[category] or {}
end

-- Check if passive is unlockable
function PassiveAbilities.canUnlockPassive(playerId, passiveId)
    local passive = PassiveAbilities.getPassive(passiveId)
    if not passive then
        return false, "Passive ability not found"
    end
    
    local playerState = PassiveAbilities.getPlayerState(playerId)
    
    -- Check if already unlocked
    if playerState.unlockedPassives[passiveId] then
        return false, "Already unlocked"
    end
    
    -- Check level requirement
    if playerState.level < passive.unlockLevel then
        return false, "Level requirement not met: " .. passive.unlockLevel
    end
    
    -- Check cost
    local availablePoints = playerState.totalPoints - playerState.spentPoints
    if availablePoints < passive.unlockCost then
        return false, "Not enough points: " .. passive.unlockCost
    end
    
    -- Check prerequisites
    for _, prereqId in ipairs(passive.prerequisites or {}) do
        if not playerState.unlockedPassives[prereqId] then
            return false, "Prerequisite not met: " .. prereqId
        end
    end
    
    return true
end

-- Unlock passive ability
function PassiveAbilities.unlockPassive(playerId, passiveId)
    local canUnlock, reason = PassiveAbilities.canUnlockPassive(playerId, passiveId)
    if not canUnlock then
        return false, reason
    end
    
    local passive = PassiveAbilities.getPassive(passiveId)
    local playerState = PassiveAbilities.getPlayerState(playerId)
    
    -- Deduct cost and unlock
    playerState.spentPoints = playerState.spentPoints + passive.unlockCost
    playerState.unlockedPassives[passiveId] = true
    playerState.passiveLevels[passiveId] = 1
    
    -- Auto-activate passive
    playerState.activePassives[passiveId] = true
    
    PassiveAbilities.savePlayerState(playerId, playerState)
    
    return true
end

-- Upgrade passive ability level
function PassiveAbilities.upgradePassive(playerId, passiveId)
    local passive = PassiveAbilities.getPassive(passiveId)
    if not passive then
        return false, "Passive ability not found"
    end
    
    local playerState = PassiveAbilities.getPlayerState(playerId)
    
    if not playerState.unlockedPassives[passiveId] then
        return false, "Passive not unlocked"
    end
    
    local currentLevel = playerState.passiveLevels[passiveId] or 1
    if currentLevel >= passive.maxLevel then
        return false, "Already at maximum level"
    end
    
    local upgradeCost = math.floor(passive.unlockCost * (currentLevel + 1) * 0.5)
    local availablePoints = playerState.totalPoints - playerState.spentPoints
    
    if availablePoints < upgradeCost then
        return false, "Not enough points: " .. upgradeCost
    end
    
    -- Upgrade passive
    playerState.spentPoints = playerState.spentPoints + upgradeCost
    playerState.passiveLevels[passiveId] = currentLevel + 1
    
    PassiveAbilities.savePlayerState(playerId, playerState)
    
    return true
end

-- Apply passive ability effects
function PassiveAbilities.applyPassiveEffects(playerId, context, baseValue)
    local playerState = PassiveAbilities.getPlayerState(playerId)
    local modifiedValue = baseValue
    local appliedEffects = {}
    
    for passiveId, isActive in pairs(playerState.activePassives) do
        if isActive then
            local passive = PassiveAbilities.getPassive(passiveId)
            local level = playerState.passiveLevels[passiveId] or 1
            
            if passive then
                for _, effect in ipairs(passive.effects) do
                    if effect.context == context or effect.context == "ALWAYS" then
                        modifiedValue = PassiveAbilities.applyEffect(modifiedValue, effect, level, passive)
                        table.insert(appliedEffects, {
                            passiveId = passiveId,
                            effect = effect.type,
                            value = effect.value
                        })
                    end
                end
            end
        end
    end
    
    return modifiedValue, appliedEffects
end

-- Apply single passive effect
function PassiveAbilities.applyEffect(baseValue, effect, level, passive)
    local levelEffect = passive.levelEffects and passive.levelEffects[level]
    local effectValue = levelEffect and levelEffect.multiplier or effect.value
    
    if effect.type == "EXPERIENCE_MULTIPLIER" then
        return baseValue * effectValue
    elseif effect.type == "STAT_TRAINING_MULTIPLIER" then
        return baseValue * effectValue
    elseif effect.type == "BREEDING_SUCCESS_RATE" then
        return baseValue * effectValue
    elseif effect.type == "ITEM_FIND_RATE" then
        return baseValue * effectValue
    elseif effect.type == "RESOURCE_EFFICIENCY" then
        return baseValue * effectValue
    end
    
    return baseValue
end

-- Get player passive ability state
function PassiveAbilities.getPlayerState(playerId)
    -- This would typically load from persistent storage
    -- For now, return default state with level
    local state = {
        unlockedPassives = {},
        activePassives = {},
        passiveLevels = {},
        totalPoints = 500, -- Default points for testing
        spentPoints = 0,
        level = 10 -- Default level for testing
    }
    return state
end

-- Save player passive ability state
function PassiveAbilities.savePlayerState(playerId, state)
    -- This would typically save to persistent storage
    PassiveAbilities.playerState = state
    return true
end

-- Award points for passive ability unlocks
function PassiveAbilities.awardPoints(playerId, points, reason)
    local playerState = PassiveAbilities.getPlayerState(playerId)
    playerState.totalPoints = playerState.totalPoints + points
    PassiveAbilities.savePlayerState(playerId, playerState)
    
    return true
end

-- Get available passive abilities for player
function PassiveAbilities.getAvailablePassives(playerId)
    local playerState = PassiveAbilities.getPlayerState(playerId)
    local available = {}
    
    for passiveId, passive in pairs(PassiveAbilities.passives) do
        local canUnlock, reason = PassiveAbilities.canUnlockPassive(playerId, passiveId)
        table.insert(available, {
            id = passiveId,
            passive = passive,
            unlocked = playerState.unlockedPassives[passiveId] == true,
            level = playerState.passiveLevels[passiveId] or 0,
            active = playerState.activePassives[passiveId] == true,
            canUnlock = canUnlock,
            reason = reason
        })
    end
    
    return available
end

-- Get all passive ability categories
function PassiveAbilities.getCategories()
    local categories = {}
    for _, category in pairs(PassiveAbilities.Categories) do
        table.insert(categories, category)
    end
    return categories
end

-- Get passive abilities by category
function PassiveAbilities.getPassivesByCategory(category)
    local passives = {}
    for passiveId, passive in pairs(PassiveAbilities.passives) do
        if passive.category == category then
            table.insert(passives, passive)
        end
    end
    return passives
end

return PassiveAbilities