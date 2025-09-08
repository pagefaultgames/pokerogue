-- Pokemon Status Healing and Curing System
-- Implements move-based, item-based, and ability-based status healing
-- Integrates with battle handler message processing and inventory systems
-- Handles targeted healing, group healing, and prevention effects

local StatusHealing = {}

-- Load dependencies
local StatusEffects = require("game-logic.pokemon.status-effects")
local StatusInteractions = require("game-logic.pokemon.status-interactions")

-- Healing method enumeration
StatusHealing.HealingMethod = {
    MOVE = "move",
    ITEM = "item", 
    ABILITY = "ability",
    NATURAL = "natural",
    SWITCH = "switch"
}

-- Healing scope enumeration
StatusHealing.HealingScope = {
    SELF = "self",
    TARGET = "target",
    ALLY = "ally",
    TEAM = "team",
    ALL = "all"
}

-- Status healing move configurations
StatusHealing.HealingMoves = {
    -- Moves that heal all status conditions
    HEAL_BELL = {
        moveId = 215,
        scope = StatusHealing.HealingScope.TEAM,
        healsAll = true,
        message = "A bell chimed and status conditions were healed!"
    },
    AROMATHERAPY = {
        moveId = 312,
        scope = StatusHealing.HealingScope.TEAM,
        healsAll = true,
        message = "The soothing scent healed all status conditions!"
    },
    REFRESH = {
        moveId = 287,
        scope = StatusHealing.HealingScope.SELF,
        healsAll = true,
        message = "{pokemon} healed its status condition!"
    },
    
    -- Moves that heal specific status conditions
    WAKE_UP_SLAP = {
        moveId = 358,
        scope = StatusHealing.HealingScope.TARGET,
        healsSpecific = {StatusEffects.StatusType.SLEEP},
        message = "{pokemon} was slapped awake!"
    },
    SMELLING_SALTS = {
        moveId = 265,
        scope = StatusHealing.HealingScope.TARGET,
        healsSpecific = {StatusEffects.StatusType.PARALYSIS},
        message = "{pokemon} was cured of paralysis!"
    },
    FLAME_WHEEL = {
        moveId = 172,
        scope = StatusHealing.HealingScope.SELF,
        healsSpecific = {StatusEffects.StatusType.FREEZE},
        message = "{pokemon} thawed itself out!"
    }
}

-- Status healing item configurations
StatusHealing.HealingItems = {
    -- Items that heal all status conditions
    FULL_HEAL = {
        itemId = 17,
        scope = StatusHealing.HealingScope.TARGET,
        healsAll = true,
        consumable = true,
        message = "{pokemon} was cured with a Full Heal!"
    },
    PECHA_BERRY = {
        itemId = 151,
        scope = StatusHealing.HealingScope.SELF,
        healsSpecific = {StatusEffects.StatusType.POISON, StatusEffects.StatusType.BADLY_POISONED},
        consumable = true,
        autoUse = true,
        message = "{pokemon}'s Pecha Berry cured its poison!"
    },
    CHESTO_BERRY = {
        itemId = 149,
        scope = StatusHealing.HealingScope.SELF,
        healsSpecific = {StatusEffects.StatusType.SLEEP},
        consumable = true,
        autoUse = true,
        message = "{pokemon}'s Chesto Berry woke it up!"
    },
    RAWST_BERRY = {
        itemId = 152,
        scope = StatusHealing.HealingScope.SELF,
        healsSpecific = {StatusEffects.StatusType.BURN},
        consumable = true,
        autoUse = true,
        message = "{pokemon}'s Rawst Berry healed its burn!"
    },
    ASPEAR_BERRY = {
        itemId = 153,
        scope = StatusHealing.HealingScope.SELF,
        healsSpecific = {StatusEffects.StatusType.FREEZE},
        consumable = true,
        autoUse = true,
        message = "{pokemon}'s Aspear Berry defrosted it!"
    },
    CHERI_BERRY = {
        itemId = 150,
        scope = StatusHealing.HealingScope.SELF,
        healsSpecific = {StatusEffects.StatusType.PARALYSIS},
        consumable = true,
        autoUse = true,
        message = "{pokemon}'s Cheri Berry cured its paralysis!"
    },
    LUM_BERRY = {
        itemId = 157,
        scope = StatusHealing.HealingScope.SELF,
        healsAll = true,
        consumable = true,
        autoUse = true,
        message = "{pokemon}'s Lum Berry cured its status condition!"
    }
}

-- Status healing ability configurations
StatusHealing.HealingAbilities = {
    NATURAL_CURE = {
        abilityId = 30,
        scope = StatusHealing.HealingScope.SELF,
        trigger = "switch_out",
        healsAll = true,
        message = "{pokemon}'s Natural Cure healed its status condition!"
    },
    IMMUNITY = {
        abilityId = 17,
        scope = StatusHealing.HealingScope.SELF,
        trigger = "status_attempt",
        preventsSpecific = {StatusEffects.StatusType.POISON, StatusEffects.StatusType.BADLY_POISONED},
        message = "{pokemon}'s Immunity prevents poison!"
    },
    LIMBER = {
        abilityId = 7,
        scope = StatusHealing.HealingScope.SELF,
        trigger = "status_attempt",
        preventsSpecific = {StatusEffects.StatusType.PARALYSIS},
        message = "{pokemon}'s Limber prevents paralysis!"
    },
    INSOMNIA = {
        abilityId = 15,
        scope = StatusHealing.HealingScope.SELF,
        trigger = "status_attempt",
        preventsSpecific = {StatusEffects.StatusType.SLEEP},
        message = "{pokemon}'s Insomnia prevents sleep!"
    },
    WATER_VEIL = {
        abilityId = 41,
        scope = StatusHealing.HealingScope.SELF,
        trigger = "status_attempt",
        preventsSpecific = {StatusEffects.StatusType.BURN},
        message = "{pokemon}'s Water Veil prevents burns!"
    },
    MAGMA_ARMOR = {
        abilityId = 40,
        scope = StatusHealing.HealingScope.SELF,
        trigger = "status_attempt",
        preventsSpecific = {StatusEffects.StatusType.FREEZE},
        message = "{pokemon}'s Magma Armor prevents freezing!"
    }
}

-- Initialize status healing system
function StatusHealing.init()
    -- Status healing system is stateless, no initialization needed
    return true
end

-- Execute move-based status healing
-- @param battleState: Current battle state
-- @param pokemon: Pokemon using the healing move
-- @param moveId: ID of the healing move
-- @param targetPokemon: Target Pokemon (for targeted healing)
-- @return: Healing result with effects and messages
function StatusHealing.executeMoveBased(battleState, pokemon, moveId, targetPokemon)
    if not pokemon or not moveId then
        return {success = false, error = "Invalid move healing parameters"}
    end
    
    -- Find healing move configuration
    local healingMove = nil
    for moveName, config in pairs(StatusHealing.HealingMoves) do
        if config.moveId == moveId then
            healingMove = config
            break
        end
    end
    
    if not healingMove then
        return {success = false, error = "Move is not a healing move"}
    end
    
    local result = {
        success = true,
        method = StatusHealing.HealingMethod.MOVE,
        scope = healingMove.scope,
        healedPokemon = {},
        messages = {}
    }
    
    -- Determine target Pokemon based on scope
    local targets = StatusHealing.getTargetsForScope(battleState, pokemon, healingMove.scope, targetPokemon)
    
    -- Apply healing to each target
    for _, target in ipairs(targets) do
        local healingResult = StatusHealing.applyHealing(target, healingMove, pokemon)
        if healingResult.healed then
            table.insert(result.healedPokemon, {
                pokemon = target,
                previousStatus = healingResult.previousStatus,
                method = "move"
            })
            
            -- Generate healing message
            local message = healingMove.message
            message = string.gsub(message, "{pokemon}", target.name)
            table.insert(result.messages, message)
        end
    end
    
    return result
end

-- Execute item-based status healing
-- @param battleState: Current battle state
-- @param pokemon: Pokemon using the item (trainer's Pokemon)
-- @param itemId: ID of the healing item
-- @param targetPokemon: Target Pokemon
-- @param inventory: Player's inventory for item consumption
-- @return: Healing result with inventory updates
function StatusHealing.executeItemBased(battleState, pokemon, itemId, targetPokemon, inventory)
    if not pokemon or not itemId then
        return {success = false, error = "Invalid item healing parameters"}
    end
    
    -- Find healing item configuration
    local healingItem = nil
    for itemName, config in pairs(StatusHealing.HealingItems) do
        if config.itemId == itemId then
            healingItem = config
            break
        end
    end
    
    if not healingItem then
        return {success = false, error = "Item is not a healing item"}
    end
    
    -- Check inventory availability
    if healingItem.consumable and inventory then
        if not inventory[itemId] or inventory[itemId] <= 0 then
            return {success = false, error = "Item not available in inventory"}
        end
    end
    
    local result = {
        success = true,
        method = StatusHealing.HealingMethod.ITEM,
        scope = healingItem.scope,
        healedPokemon = {},
        messages = {},
        inventoryUpdates = {}
    }
    
    -- Determine target Pokemon
    local target = targetPokemon or pokemon
    
    -- Apply healing
    local healingResult = StatusHealing.applyHealing(target, healingItem, pokemon)
    if healingResult.healed then
        table.insert(result.healedPokemon, {
            pokemon = target,
            previousStatus = healingResult.previousStatus,
            method = "item"
        })
        
        -- Generate healing message
        local message = healingItem.message
        message = string.gsub(message, "{pokemon}", target.name)
        table.insert(result.messages, message)
    end
    
    -- Update inventory if item is consumable
    if healingItem.consumable and inventory then
        inventory[itemId] = inventory[itemId] - 1
        table.insert(result.inventoryUpdates, {
            itemId = itemId,
            change = -1,
            remaining = inventory[itemId]
        })
    end
    
    return result
end

-- Execute ability-based status healing or prevention
-- @param battleState: Current battle state
-- @param pokemon: Pokemon with the healing ability
-- @param abilityId: ID of the healing ability
-- @param trigger: Trigger context (switch_out, status_attempt, etc.)
-- @param statusBeingApplied: Status effect being applied (for prevention)
-- @return: Healing/prevention result
function StatusHealing.executeAbilityBased(battleState, pokemon, abilityId, trigger, statusBeingApplied)
    if not pokemon or not abilityId or not trigger then
        return {success = false, error = "Invalid ability healing parameters"}
    end
    
    -- Find healing ability configuration
    local healingAbility = nil
    for abilityName, config in pairs(StatusHealing.HealingAbilities) do
        if config.abilityId == abilityId and config.trigger == trigger then
            healingAbility = config
            break
        end
    end
    
    if not healingAbility then
        return {success = false, error = "Ability does not provide healing for this trigger"}
    end
    
    local result = {
        success = true,
        method = StatusHealing.HealingMethod.ABILITY,
        trigger = trigger,
        healedPokemon = {},
        preventedStatuses = {},
        messages = {}
    }
    
    -- Handle prevention abilities
    if trigger == "status_attempt" and healingAbility.preventsSpecific then
        if not statusBeingApplied then
            return {success = false, error = "No status being applied to prevent"}
        end
        
        for _, preventedStatus in ipairs(healingAbility.preventsSpecific) do
            if preventedStatus == statusBeingApplied then
                table.insert(result.preventedStatuses, {
                    pokemon = pokemon,
                    preventedStatus = statusBeingApplied,
                    ability = abilityId
                })
                
                -- Generate prevention message
                local message = healingAbility.message
                message = string.gsub(message, "{pokemon}", pokemon.name)
                table.insert(result.messages, message)
                
                result.statusPrevented = true
                return result
            end
        end
    end
    
    -- Handle healing abilities
    if trigger == "switch_out" or trigger == "end_of_turn" then
        local healingResult = StatusHealing.applyHealing(pokemon, healingAbility, pokemon)
        if healingResult.healed then
            table.insert(result.healedPokemon, {
                pokemon = pokemon,
                previousStatus = healingResult.previousStatus,
                method = "ability"
            })
            
            -- Generate healing message
            local message = healingAbility.message
            message = string.gsub(message, "{pokemon}", pokemon.name)
            table.insert(result.messages, message)
        end
    end
    
    return result
end

-- Execute automatic berry healing (when status is applied)
-- @param pokemon: Pokemon with held berry
-- @param statusApplied: Status effect that was just applied
-- @return: Auto-healing result
function StatusHealing.executeAutoBerryHealing(pokemon, statusApplied)
    if not pokemon or not pokemon.heldItem then
        return {success = false, autoHealed = false}
    end
    
    -- Find matching auto-healing berry
    local healingBerry = nil
    for berryName, config in pairs(StatusHealing.HealingItems) do
        if config.itemId == pokemon.heldItem and config.autoUse then
            -- Check if berry heals this specific status
            if config.healsAll then
                healingBerry = config
                break
            elseif config.healsSpecific then
                for _, healedStatus in ipairs(config.healsSpecific) do
                    if healedStatus == statusApplied then
                        healingBerry = config
                        break
                    end
                end
                if healingBerry then break end
            end
        end
    end
    
    if not healingBerry then
        return {success = false, autoHealed = false}
    end
    
    local result = {
        success = true,
        autoHealed = true,
        method = StatusHealing.HealingMethod.ITEM,
        healedPokemon = {},
        messages = {}
    }
    
    -- Apply healing
    local healingResult = StatusHealing.applyHealing(pokemon, healingBerry, pokemon)
    if healingResult.healed then
        table.insert(result.healedPokemon, {
            pokemon = pokemon,
            previousStatus = healingResult.previousStatus,
            method = "auto_berry"
        })
        
        -- Generate healing message
        local message = healingBerry.message
        message = string.gsub(message, "{pokemon}", pokemon.name)
        table.insert(result.messages, message)
        
        -- Remove consumed berry
        pokemon.heldItem = nil
        result.berryConsumed = healingBerry.itemId
    end
    
    return result
end

-- Apply healing to a Pokemon
-- @param pokemon: Pokemon to heal
-- @param healingConfig: Healing method configuration
-- @param source: Pokemon or entity providing the healing
-- @return: Healing application result
function StatusHealing.applyHealing(pokemon, healingConfig, source)
    if not pokemon or not pokemon.statusEffect then
        return {healed = false, reason = "No status to heal"}
    end
    
    local result = {
        healed = false,
        previousStatus = pokemon.statusEffect,
        method = healingConfig
    }
    
    -- Check if the healing method can cure the current status
    local canHeal = false
    
    if healingConfig.healsAll then
        canHeal = true
    elseif healingConfig.healsSpecific then
        for _, healableStatus in ipairs(healingConfig.healsSpecific) do
            if healableStatus == pokemon.statusEffect then
                canHeal = true
                break
            end
        end
    end
    
    if canHeal then
        -- Clear the status effect
        local clearResult = StatusEffects.clearStatusEffect(pokemon, nil)
        if clearResult.success then
            result.healed = true
            result.clearResult = clearResult
        end
    else
        result.reason = "Healing method doesn't cure this status"
    end
    
    return result
end

-- Get target Pokemon for healing scope
-- @param battleState: Current battle state
-- @param sourcePokemon: Pokemon providing healing
-- @param scope: Healing scope
-- @param explicitTarget: Explicitly specified target
-- @return: List of target Pokemon
function StatusHealing.getTargetsForScope(battleState, sourcePokemon, scope, explicitTarget)
    local targets = {}
    
    if scope == StatusHealing.HealingScope.SELF then
        table.insert(targets, sourcePokemon)
        
    elseif scope == StatusHealing.HealingScope.TARGET then
        if explicitTarget then
            table.insert(targets, explicitTarget)
        else
            table.insert(targets, sourcePokemon) -- Default to self if no target
        end
        
    elseif scope == StatusHealing.HealingScope.TEAM then
        -- Find source Pokemon's team
        local isPlayerPokemon = false
        for _, pokemon in ipairs(battleState.playerParty) do
            if pokemon.id == sourcePokemon.id then
                isPlayerPokemon = true
                break
            end
        end
        
        -- Add all team members
        local teamParty = isPlayerPokemon and battleState.playerParty or battleState.enemyParty
        for _, pokemon in ipairs(teamParty) do
            if pokemon.currentHP > 0 then -- Only heal conscious Pokemon
                table.insert(targets, pokemon)
            end
        end
        
    elseif scope == StatusHealing.HealingScope.ALL then
        -- Add all Pokemon in battle
        for _, pokemon in ipairs(battleState.playerParty) do
            if pokemon.currentHP > 0 then
                table.insert(targets, pokemon)
            end
        end
        for _, pokemon in ipairs(battleState.enemyParty) do
            if pokemon.currentHP > 0 then
                table.insert(targets, pokemon)
            end
        end
    end
    
    return targets
end

-- Check if a Pokemon has any healing items available
-- @param pokemon: Pokemon to check
-- @param inventory: Available inventory
-- @return: List of available healing items
function StatusHealing.getAvailableHealingItems(pokemon, inventory)
    local availableItems = {}
    
    if not inventory then
        return availableItems
    end
    
    for itemName, config in pairs(StatusHealing.HealingItems) do
        if inventory[config.itemId] and inventory[config.itemId] > 0 then
            -- Check if item can heal current status
            local canHeal = false
            if pokemon.statusEffect then
                if config.healsAll then
                    canHeal = true
                elseif config.healsSpecific then
                    for _, healableStatus in ipairs(config.healsSpecific) do
                        if healableStatus == pokemon.statusEffect then
                            canHeal = true
                            break
                        end
                    end
                end
            end
            
            if canHeal then
                table.insert(availableItems, {
                    itemId = config.itemId,
                    name = itemName,
                    available = inventory[config.itemId],
                    config = config
                })
            end
        end
    end
    
    return availableItems
end

-- Get comprehensive healing summary for a Pokemon
-- @param pokemon: Pokemon to get healing info for
-- @param battleState: Current battle state
-- @param inventory: Available inventory
-- @return: Healing options summary
function StatusHealing.getHealingOptions(pokemon, battleState, inventory)
    if not pokemon then
        return {hasOptions = false}
    end
    
    local options = {
        hasOptions = false,
        currentStatus = pokemon.statusEffect,
        healingMoves = {},
        healingItems = {},
        healingAbilities = {},
        autoHealing = {}
    }
    
    if not pokemon.statusEffect then
        return options
    end
    
    -- Check for healing moves
    if pokemon.moves then
        for moveId, moveData in pairs(pokemon.moves) do
            for moveName, config in pairs(StatusHealing.HealingMoves) do
                if config.moveId == moveId then
                    -- Check if move can heal current status
                    local canHeal = config.healsAll
                    if not canHeal and config.healsSpecific then
                        for _, healableStatus in ipairs(config.healsSpecific) do
                            if healableStatus == pokemon.statusEffect then
                                canHeal = true
                                break
                            end
                        end
                    end
                    
                    if canHeal then
                        table.insert(options.healingMoves, {
                            moveId = moveId,
                            name = moveName,
                            scope = config.scope,
                            pp = moveData.pp
                        })
                        options.hasOptions = true
                    end
                end
            end
        end
    end
    
    -- Check for healing items
    local availableItems = StatusHealing.getAvailableHealingItems(pokemon, inventory)
    for _, item in ipairs(availableItems) do
        table.insert(options.healingItems, item)
        options.hasOptions = true
    end
    
    -- Check for healing abilities
    if pokemon.ability then
        for abilityName, config in pairs(StatusHealing.HealingAbilities) do
            if config.abilityId == pokemon.ability then
                table.insert(options.healingAbilities, {
                    abilityId = pokemon.ability,
                    name = abilityName,
                    trigger = config.trigger
                })
                options.hasOptions = true
            end
        end
    end
    
    -- Check for auto-healing items
    if pokemon.heldItem then
        for itemName, config in pairs(StatusHealing.HealingItems) do
            if config.itemId == pokemon.heldItem and config.autoUse then
                -- Check if item can heal current status
                local canAutoHeal = config.healsAll
                if not canAutoHeal and config.healsSpecific then
                    for _, healableStatus in ipairs(config.healsSpecific) do
                        if healableStatus == pokemon.statusEffect then
                            canAutoHeal = true
                            break
                        end
                    end
                end
                
                if canAutoHeal then
                    table.insert(options.autoHealing, {
                        itemId = pokemon.heldItem,
                        name = itemName
                    })
                end
            end
        end
    end
    
    return options
end

return StatusHealing