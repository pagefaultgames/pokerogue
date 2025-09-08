-- Item-Move Interaction System
-- Handles item-based move interactions including Choice items, Assault Vest, and other held items
-- Provides move restrictions, stat boosts, and effect modifications based on held items

local ItemInteractions = {}

-- Load dependencies
local Enums = require("data.constants.enums")

-- Item interaction types
ItemInteractions.InteractionType = {
    RESTRICTION = "RESTRICTION",     -- Item restricts move usage (Assault Vest, Choice items)
    ENHANCEMENT = "ENHANCEMENT",     -- Item enhances moves (Life Orb, Metronome)
    ACTIVATION = "ACTIVATION",       -- Item activates on move use (King's Rock, Razor Fang)
    CLEANSING = "CLEANSING",         -- Item removes effects (Mental Herb, White Herb)
    PROTECTION = "PROTECTION"        -- Item provides protection (Focus Sash, Focus Band)
}

-- Item ID constants (placeholders for now)
ItemInteractions.Items = {
    CHOICE_BAND = 1,
    CHOICE_SPECS = 2,
    CHOICE_SCARF = 3,
    ASSAULT_VEST = 4,
    LIFE_ORB = 5,
    METRONOME = 6,
    KINGS_ROCK = 7,
    RAZOR_FANG = 8,
    MENTAL_HERB = 9,
    WHITE_HERB = 10,
    FOCUS_SASH = 11,
    FOCUS_BAND = 12
}

-- Item interaction data
-- Maps item IDs to their interaction effects
ItemInteractions.interactionData = {
    [ItemInteractions.Items.CHOICE_BAND] = {
        type = ItemInteractions.InteractionType.RESTRICTION,
        effect = {
            lockToFirstMove = true,
            statBoost = {stat = Enums.Stat.ATK, multiplier = 1.5},
            categoryRestriction = {Enums.MoveCategory.PHYSICAL},
            message = "Choice Band locked the user into the first move!"
        },
        priority = 8
    },
    
    [ItemInteractions.Items.CHOICE_SPECS] = {
        type = ItemInteractions.InteractionType.RESTRICTION,
        effect = {
            lockToFirstMove = true,
            statBoost = {stat = Enums.Stat.SPATK, multiplier = 1.5},
            categoryRestriction = {Enums.MoveCategory.SPECIAL},
            message = "Choice Specs locked the user into the first move!"
        },
        priority = 8
    },
    
    [ItemInteractions.Items.CHOICE_SCARF] = {
        type = ItemInteractions.InteractionType.RESTRICTION,
        effect = {
            lockToFirstMove = true,
            statBoost = {stat = Enums.Stat.SPD, multiplier = 1.5},
            categoryRestriction = {},  -- No category restriction for Choice Scarf
            message = "Choice Scarf locked the user into the first move!"
        },
        priority = 8
    },
    
    [ItemInteractions.Items.ASSAULT_VEST] = {
        type = ItemInteractions.InteractionType.RESTRICTION,
        effect = {
            preventStatusMoves = true,
            statBoost = {stat = Enums.Stat.SPDEF, multiplier = 1.5},
            message = "Assault Vest prevents the use of status moves!"
        },
        priority = 9
    },
    
    [ItemInteractions.Items.LIFE_ORB] = {
        type = ItemInteractions.InteractionType.ENHANCEMENT,
        effect = {
            damagingMoveBoost = 1.3,
            recoilDamage = "1/10", -- 10% of max HP
            message = "Life Orb boosted the power of the move!"
        },
        priority = 5
    },
    
    [ItemInteractions.Items.METRONOME] = {
        type = ItemInteractions.InteractionType.ENHANCEMENT,
        effect = {
            progressiveBoost = true,
            maxBoost = 2.0,
            boostIncrement = 0.2, -- +20% per consecutive use
            resetOnDifferentMove = true,
            message = "Metronome boosted the power of the move!"
        },
        priority = 5
    },
    
    [ItemInteractions.Items.KINGS_ROCK] = {
        type = ItemInteractions.InteractionType.ACTIVATION,
        effect = {
            flinchChance = 0.1, -- 10% flinch chance
            onlyDamagingMoves = true,
            excludesNaturalFlinch = true, -- Doesn't stack with moves that already flinch
            message = "King's Rock may cause the target to flinch!"
        },
        priority = 3
    },
    
    [ItemInteractions.Items.RAZOR_FANG] = {
        type = ItemInteractions.InteractionType.ACTIVATION,
        effect = {
            flinchChance = 0.1, -- 10% flinch chance
            onlyDamagingMoves = true,
            excludesNaturalFlinch = true,
            message = "Razor Fang may cause the target to flinch!"
        },
        priority = 3
    },
    
    [ItemInteractions.Items.MENTAL_HERB] = {
        type = ItemInteractions.InteractionType.CLEANSING,
        effect = {
            cleansesOnUse = {"taunt", "torment", "encore", "disable", "cursed"},
            consumeOnUse = true,
            message = "Mental Herb snapped the user out of its confusion!"
        },
        priority = 10
    },
    
    [ItemInteractions.Items.WHITE_HERB] = {
        type = ItemInteractions.InteractionType.CLEANSING,
        effect = {
            restoresStatDrops = true,
            consumeOnUse = true,
            message = "White Herb restored the user's stats!"
        },
        priority = 10
    }
}

-- Check if item can interact with move
-- @param itemId: Item ID to check
-- @param moveData: Move data including category and type
-- @param pokemon: Pokemon using the move (for restrictions)
-- @return: Boolean indicating if interaction exists
function ItemInteractions.canInteract(itemId, moveData, pokemon)
    local interaction = ItemInteractions.interactionData[itemId]
    if not interaction then
        return false
    end
    
    -- Check category restrictions for Choice items
    if interaction.effect.categoryRestriction then
        local hasValidCategory = false
        if #interaction.effect.categoryRestriction == 0 then
            hasValidCategory = true -- No category restriction (Choice Scarf)
        else
            for _, validCategory in ipairs(interaction.effect.categoryRestriction) do
                if moveData.category == validCategory then
                    hasValidCategory = true
                    break
                end
            end
        end
        if not hasValidCategory then
            return false
        end
    end
    
    -- Check if Assault Vest prevents status moves
    if interaction.effect.preventStatusMoves then
        if moveData.category == Enums.MoveCategory.STATUS then
            return true -- Can interact to prevent the move
        else
            return false -- Assault Vest doesn't interact with non-status moves
        end
    end
    
    -- Check if enhancement item only affects damaging moves
    if interaction.effect.damagingMoveBoost and moveData.category == Enums.MoveCategory.STATUS then
        return false
    end
    
    -- Check if activation item only works on damaging moves
    if interaction.effect.onlyDamagingMoves and moveData.category == Enums.MoveCategory.STATUS then
        return false
    end
    
    return true
end

-- Process item interaction with move
-- @param battleState: Current battle state
-- @param pokemon: Pokemon with the item
-- @param moveData: Move being used
-- @param moveIndex: Index of move being used (for Choice item locking)
-- @return: Interaction result with effects and restrictions
function ItemInteractions.processItemInteraction(battleState, pokemon, moveData, moveIndex)
    if not pokemon.heldItem then
        return {success = false, reason = "No held item"}
    end
    
    if not ItemInteractions.canInteract(pokemon.heldItem, moveData, pokemon) then
        return {success = false, reason = "No item interaction"}
    end
    
    local interaction = ItemInteractions.interactionData[pokemon.heldItem]
    local result = {
        success = true,
        interactionType = interaction.type,
        effects = {},
        restrictions = {},
        message = interaction.effect.message or "",
        priority = interaction.priority
    }
    
    -- Process different interaction types
    if interaction.type == ItemInteractions.InteractionType.RESTRICTION then
        
        -- Choice item locking mechanism
        if interaction.effect.lockToFirstMove then
            battleState.choiceLocks = battleState.choiceLocks or {}
            
            if not battleState.choiceLocks[pokemon.id] then
                -- First move - lock to this move
                battleState.choiceLocks[pokemon.id] = {
                    moveId = moveData.id,
                    moveIndex = moveIndex,
                    itemId = pokemon.heldItem
                }
                result.effects.choiceLocked = true
            else
                -- Check if trying to use different move
                local choiceLock = battleState.choiceLocks[pokemon.id]
                if choiceLock.moveId ~= moveData.id then
                    result.restrictions.blocked = true
                    result.restrictions.reason = "choice_locked"
                    result.message = pokemon.name .. " is locked into using " .. 
                                   (choiceLock.moveName or "the previous move") .. "!"
                    return result
                end
            end
        end
        
        -- Assault Vest status move prevention
        if interaction.effect.preventStatusMoves and moveData.category == Enums.MoveCategory.STATUS then
            result.restrictions.blocked = true
            result.restrictions.reason = "assault_vest"
            result.message = "Assault Vest prevents the use of status moves!"
            return result
        end
        
    elseif interaction.type == ItemInteractions.InteractionType.ENHANCEMENT then
        
        -- Life Orb damage boost and recoil
        if interaction.effect.damagingMoveBoost then
            result.effects.powerMultiplier = interaction.effect.damagingMoveBoost
            
            if interaction.effect.recoilDamage then
                result.effects.recoil = {
                    type = "percentage",
                    amount = interaction.effect.recoilDamage,
                    target = pokemon.id
                }
            end
        end
        
        -- Metronome progressive boost
        if interaction.effect.progressiveBoost then
            battleState.metronomeCounters = battleState.metronomeCounters or {}
            local counter = battleState.metronomeCounters[pokemon.id] or {lastMoveId = nil, count = 0}
            
            if counter.lastMoveId == moveData.id then
                counter.count = counter.count + 1
            else
                counter.count = 1
                counter.lastMoveId = moveData.id
            end
            
            local boost = 1.0 + (counter.count - 1) * interaction.effect.boostIncrement
            boost = math.min(boost, interaction.effect.maxBoost)
            
            result.effects.powerMultiplier = boost
            battleState.metronomeCounters[pokemon.id] = counter
        end
        
    elseif interaction.type == ItemInteractions.InteractionType.ACTIVATION then
        
        -- Flinch-inducing items (King's Rock, Razor Fang)
        if interaction.effect.flinchChance then
            result.effects.additionalEffect = {
                type = "flinch",
                chance = interaction.effect.flinchChance,
                excludesNaturalFlinch = interaction.effect.excludesNaturalFlinch
            }
        end
        
    elseif interaction.type == ItemInteractions.InteractionType.CLEANSING then
        
        -- Mental Herb - cleanse mental restrictions
        if interaction.effect.cleansesOnUse then
            local cleansed = false
            pokemon.statusConditions = pokemon.statusConditions or {}
            
            for _, condition in ipairs(interaction.effect.cleansesOnUse) do
                if pokemon.statusConditions[condition] then
                    pokemon.statusConditions[condition] = nil
                    cleansed = true
                end
            end
            
            if cleansed then
                result.effects.cleansed = true
                if interaction.effect.consumeOnUse then
                    result.effects.consumeItem = true
                end
            end
        end
        
        -- White Herb - restore stat drops
        if interaction.effect.restoresStatDrops then
            local restored = false
            if pokemon.statStages then
                for stat, stage in pairs(pokemon.statStages) do
                    if stage < 0 then
                        pokemon.statStages[stat] = 0
                        restored = true
                    end
                end
            end
            
            if restored then
                result.effects.statsRestored = true
                if interaction.effect.consumeOnUse then
                    result.effects.consumeItem = true
                end
            end
        end
    end
    
    return result
end

-- Apply item interaction effects to battle state
-- @param battleState: Battle state to modify
-- @param interactionResult: Result from processItemInteraction
-- @param pokemon: Pokemon with the item
-- @return: Updated battle state and effect messages
function ItemInteractions.applyItemEffects(battleState, interactionResult, pokemon)
    local messages = {}
    
    if not interactionResult.success then
        return battleState, messages
    end
    
    -- Add interaction message
    if interactionResult.message and interactionResult.message ~= "" then
        table.insert(messages, interactionResult.message)
    end
    
    -- Apply recoil damage
    if interactionResult.effects.recoil then
        local recoil = interactionResult.effects.recoil
        local damage = 0
        
        if recoil.type == "percentage" and recoil.amount == "1/10" then
            local maxHP = pokemon.maxHP or pokemon.stats[Enums.Stat.HP]
            damage = math.max(1, math.floor(maxHP / 10))
        end
        
        pokemon.currentHP = math.max(0, pokemon.currentHP - damage)
        
        if damage > 0 then
            table.insert(messages, pokemon.name .. " was hurt by Life Orb recoil!")
        end
    end
    
    -- Consume item if needed
    if interactionResult.effects.consumeItem then
        pokemon.heldItem = nil
        table.insert(messages, pokemon.name .. "'s held item was consumed!")
    end
    
    return battleState, messages
end

-- Get item stat multiplier for battle calculations
-- @param pokemon: Pokemon with item
-- @param stat: Stat to get multiplier for
-- @return: Stat multiplier (1.0 = no change)
function ItemInteractions.getItemStatMultiplier(pokemon, stat)
    if not pokemon.heldItem then
        return 1.0
    end
    
    local interaction = ItemInteractions.interactionData[pokemon.heldItem]
    if not interaction or not interaction.effect.statBoost then
        return 1.0
    end
    
    if interaction.effect.statBoost.stat == stat then
        return interaction.effect.statBoost.multiplier or 1.0
    end
    
    return 1.0
end

-- Check if move is blocked by item restrictions
-- @param pokemon: Pokemon using move
-- @param moveData: Move being used
-- @param battleState: Current battle state
-- @return: Boolean indicating if blocked, reason string
function ItemInteractions.isBlockedByItem(pokemon, moveData, battleState)
    if not pokemon.heldItem then
        return false, nil
    end
    
    local result = ItemInteractions.processItemInteraction(battleState, pokemon, moveData, nil)
    if result.success and result.restrictions.blocked then
        return true, result.restrictions.reason
    end
    
    return false, nil
end

-- Clear Choice item locks when Pokemon switches out
-- @param battleState: Battle state to modify
-- @param pokemonId: Pokemon ID that switched out
-- @return: Updated battle state
function ItemInteractions.clearChoiceLock(battleState, pokemonId)
    if battleState.choiceLocks and battleState.choiceLocks[pokemonId] then
        battleState.choiceLocks[pokemonId] = nil
    end
    return battleState
end

-- Reset Metronome counter when appropriate
-- @param battleState: Battle state to modify
-- @param pokemonId: Pokemon ID to reset counter for
-- @return: Updated battle state
function ItemInteractions.resetMetronomeCounter(battleState, pokemonId)
    if battleState.metronomeCounters and battleState.metronomeCounters[pokemonId] then
        battleState.metronomeCounters[pokemonId] = {lastMoveId = nil, count = 0}
    end
    return battleState
end

-- Validate item interaction data integrity
-- @return: Boolean indicating if all interaction data is valid
function ItemInteractions.validateInteractionData()
    for itemId, interaction in pairs(ItemInteractions.interactionData) do
        -- Check required fields
        if not interaction.type or not interaction.effect then
            print("Warning: Invalid interaction data for item " .. tostring(itemId))
            return false
        end
        
        -- Validate interaction type
        local validType = false
        for _, validTypeValue in pairs(ItemInteractions.InteractionType) do
            if interaction.type == validTypeValue then
                validType = true
                break
            end
        end
        
        if not validType then
            print("Warning: Invalid interaction type for item " .. tostring(itemId) .. ": " .. tostring(interaction.type))
            return false
        end
    end
    
    return true
end

-- Initialize item interactions system
function ItemInteractions.init()
    if not ItemInteractions.validateInteractionData() then
        return false, "Invalid item interaction data"
    end
    
    print("Item Interactions system initialized with " .. 
          #ItemInteractions.interactionData .. " item interactions")
    return true
end

return ItemInteractions