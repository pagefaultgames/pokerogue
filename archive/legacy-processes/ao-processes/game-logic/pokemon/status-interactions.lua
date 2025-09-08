-- Pokemon Status Condition Interactions
-- Handles status condition conflicts, replacements, and exclusion rules
-- Manages status condition stacking and priority handling
-- Integrates with Pokemon state management system

local StatusInteractions = {}

-- Load dependencies
local StatusEffects = require("game-logic.pokemon.status-effects")

-- Status interaction rules
StatusInteractions.InteractionRules = {
    -- Status conditions that cannot coexist
    MUTUALLY_EXCLUSIVE = {
        [StatusEffects.StatusType.SLEEP] = {
            StatusEffects.StatusType.POISON,
            StatusEffects.StatusType.BADLY_POISONED,
            StatusEffects.StatusType.PARALYSIS,
            StatusEffects.StatusType.BURN,
            StatusEffects.StatusType.FREEZE
        },
        [StatusEffects.StatusType.FREEZE] = {
            StatusEffects.StatusType.SLEEP,
            StatusEffects.StatusType.POISON,
            StatusEffects.StatusType.BADLY_POISONED,
            StatusEffects.StatusType.PARALYSIS,
            StatusEffects.StatusType.BURN
        },
        [StatusEffects.StatusType.PARALYSIS] = {
            StatusEffects.StatusType.SLEEP,
            StatusEffects.StatusType.FREEZE
        },
        [StatusEffects.StatusType.BURN] = {
            StatusEffects.StatusType.SLEEP,
            StatusEffects.StatusType.FREEZE
        },
        [StatusEffects.StatusType.POISON] = {
            StatusEffects.StatusType.SLEEP,
            StatusEffects.StatusType.FREEZE,
            StatusEffects.StatusType.BADLY_POISONED
        },
        [StatusEffects.StatusType.BADLY_POISONED] = {
            StatusEffects.StatusType.SLEEP,
            StatusEffects.StatusType.FREEZE,
            StatusEffects.StatusType.POISON
        }
    },
    
    -- Status replacement priority (higher priority replaces lower priority)
    REPLACEMENT_PRIORITY = {
        [StatusEffects.StatusType.BADLY_POISONED] = 5,
        [StatusEffects.StatusType.BURN] = 4,
        [StatusEffects.StatusType.POISON] = 3,
        [StatusEffects.StatusType.PARALYSIS] = 2,
        [StatusEffects.StatusType.SLEEP] = 1,
        [StatusEffects.StatusType.FREEZE] = 1
    },
    
    -- Status conditions that can upgrade to others
    STATUS_UPGRADES = {
        [StatusEffects.StatusType.POISON] = StatusEffects.StatusType.BADLY_POISONED
    }
}

-- Initialize status interactions system
function StatusInteractions.init()
    -- Status interactions system is stateless, no initialization needed
    return true
end

-- Validate status effect application considering interactions
-- @param pokemon: Pokemon to apply status to
-- @param newStatus: Status effect to apply
-- @param forceReplace: Whether to force replacement of existing status
-- @return: Validation result with allowed status and messages
function StatusInteractions.validateStatusApplication(pokemon, newStatus, forceReplace)
    if not pokemon then
        return {valid = false, error = "Invalid Pokemon"}
    end
    
    if not newStatus then
        return {valid = false, error = "No status effect specified"}
    end
    
    local result = {
        valid = false,
        allowedStatus = newStatus,
        messages = {},
        replacementOccurred = false,
        previousStatus = pokemon.statusEffect
    }
    
    -- If Pokemon has no status, allow application
    if not pokemon.statusEffect then
        result.valid = true
        result.allowedStatus = newStatus
        return result
    end
    
    local currentStatus = pokemon.statusEffect
    
    -- Check if attempting to apply the same status
    if currentStatus == newStatus then
        result.valid = false
        result.error = "Pokemon already has this status effect"
        table.insert(result.messages, pokemon.name .. " already has " .. newStatus .. "!")
        return result
    end
    
    -- Check for force replacement
    if forceReplace then
        result.valid = true
        result.allowedStatus = newStatus
        result.replacementOccurred = true
        table.insert(result.messages, pokemon.name .. "'s " .. currentStatus .. " was replaced with " .. newStatus .. "!")
        return result
    end
    
    -- Check status upgrade possibility
    if StatusInteractions.canUpgradeStatus(currentStatus, newStatus) then
        result.valid = true
        result.allowedStatus = newStatus
        result.replacementOccurred = true
        table.insert(result.messages, pokemon.name .. "'s " .. currentStatus .. " became " .. newStatus .. "!")
        return result
    end
    
    -- Check mutual exclusivity
    if StatusInteractions.areStatusesMutuallyExclusive(currentStatus, newStatus) then
        -- Check replacement priority
        local priorityResult = StatusInteractions.checkReplacementPriority(currentStatus, newStatus)
        
        if priorityResult.canReplace then
            result.valid = true
            result.allowedStatus = newStatus
            result.replacementOccurred = true
            table.insert(result.messages, priorityResult.message)
        else
            result.valid = false
            result.error = "Status effect blocked by existing condition"
            table.insert(result.messages, priorityResult.message)
        end
        
        return result
    end
    
    -- Default case - allow stacking of compatible effects
    result.valid = true
    result.allowedStatus = newStatus
    return result
end

-- Check if two status effects are mutually exclusive
-- @param status1: First status effect
-- @param status2: Second status effect
-- @return: Boolean indicating mutual exclusivity
function StatusInteractions.areStatusesMutuallyExclusive(status1, status2)
    if not status1 or not status2 then
        return false
    end
    
    local exclusiveList = StatusInteractions.InteractionRules.MUTUALLY_EXCLUSIVE[status1]
    if not exclusiveList then
        return false
    end
    
    for _, excludedStatus in ipairs(exclusiveList) do
        if excludedStatus == status2 then
            return true
        end
    end
    
    return false
end

-- Check replacement priority between two status effects
-- @param currentStatus: Currently applied status
-- @param newStatus: New status being applied
-- @return: Priority check result with replacement decision and message
function StatusInteractions.checkReplacementPriority(currentStatus, newStatus)
    local currentPriority = StatusInteractions.InteractionRules.REPLACEMENT_PRIORITY[currentStatus] or 0
    local newPriority = StatusInteractions.InteractionRules.REPLACEMENT_PRIORITY[newStatus] or 0
    
    local result = {
        canReplace = false,
        currentPriority = currentPriority,
        newPriority = newPriority,
        message = ""
    }
    
    if newPriority > currentPriority then
        result.canReplace = true
        result.message = "The more severe status effect took hold!"
    elseif newPriority == currentPriority then
        result.canReplace = false
        result.message = "The status effects conflicted and cancelled out!"
    else
        result.canReplace = false
        result.message = "The existing status effect prevented the new one!"
    end
    
    return result
end

-- Check if a status can be upgraded to another
-- @param currentStatus: Current status effect
-- @param newStatus: Potential upgrade status
-- @return: Boolean indicating if upgrade is possible
function StatusInteractions.canUpgradeStatus(currentStatus, newStatus)
    if not currentStatus or not newStatus then
        return false
    end
    
    local upgradeTarget = StatusInteractions.InteractionRules.STATUS_UPGRADES[currentStatus]
    return upgradeTarget == newStatus
end

-- Process status condition replacement
-- @param pokemon: Pokemon undergoing status replacement
-- @param newStatus: New status to apply
-- @param previousStatus: Status being replaced
-- @return: Replacement result with effects and messages
function StatusInteractions.processStatusReplacement(pokemon, newStatus, previousStatus)
    if not pokemon then
        return {success = false, error = "Invalid Pokemon"}
    end
    
    local result = {
        success = true,
        previousStatus = previousStatus,
        newStatus = newStatus,
        effects = {},
        messages = {}
    }
    
    -- Clear previous status effects
    if previousStatus then
        -- Remove stat modifications from previous status
        if previousStatus == StatusEffects.StatusType.BURN then
            table.insert(result.effects, {
                type = "stat_restoration",
                stat = "attack",
                message = pokemon.name .. "'s Attack returned to normal!"
            })
        elseif previousStatus == StatusEffects.StatusType.PARALYSIS then
            table.insert(result.effects, {
                type = "stat_restoration", 
                stat = "speed",
                message = pokemon.name .. "'s Speed returned to normal!"
            })
        end
    end
    
    -- Apply new status effects
    local statusApplication = StatusEffects.applyStatusEffect(pokemon, newStatus, nil, nil)
    if statusApplication.success then
        for _, effect in ipairs(statusApplication.effects) do
            table.insert(result.effects, effect)
        end
        for _, message in ipairs(statusApplication.messages) do
            table.insert(result.messages, message)
        end
    else
        result.success = false
        result.error = statusApplication.error
    end
    
    return result
end

-- Resolve status condition conflict
-- @param pokemon: Pokemon with conflicting status conditions
-- @param existingStatus: Current status effect
-- @param newStatus: New status being applied
-- @param context: Additional context (move, ability, item causing new status)
-- @return: Conflict resolution result
function StatusInteractions.resolveStatusConflict(pokemon, existingStatus, newStatus, context)
    if not pokemon or not existingStatus or not newStatus then
        return {resolved = false, error = "Invalid conflict parameters"}
    end
    
    local result = {
        resolved = false,
        finalStatus = existingStatus,
        actions = {},
        messages = {}
    }
    
    -- Check if conflict can be resolved through upgrade
    if StatusInteractions.canUpgradeStatus(existingStatus, newStatus) then
        result.resolved = true
        result.finalStatus = newStatus
        table.insert(result.actions, {
            type = "status_upgrade",
            from = existingStatus,
            to = newStatus
        })
        table.insert(result.messages, pokemon.name .. "'s condition worsened!")
        return result
    end
    
    -- Check priority-based replacement
    local priorityCheck = StatusInteractions.checkReplacementPriority(existingStatus, newStatus)
    if priorityCheck.canReplace then
        result.resolved = true
        result.finalStatus = newStatus
        table.insert(result.actions, {
            type = "status_replacement",
            from = existingStatus,
            to = newStatus,
            reason = "priority"
        })
        table.insert(result.messages, priorityCheck.message)
        return result
    end
    
    -- Handle special cases based on context
    if context then
        if context.type == "move" and context.forceReplace then
            result.resolved = true
            result.finalStatus = newStatus
            table.insert(result.actions, {
                type = "forced_replacement",
                from = existingStatus,
                to = newStatus,
                source = context.source
            })
            table.insert(result.messages, "The powerful effect overrode the existing status!")
            return result
        end
        
        if context.type == "ability" and context.preventAll then
            result.resolved = true
            result.finalStatus = nil
            table.insert(result.actions, {
                type = "status_prevention",
                prevented = newStatus,
                source = context.source
            })
            table.insert(result.messages, pokemon.name .. "'s ability prevented the status condition!")
            return result
        end
    end
    
    -- Default: existing status blocks new one
    result.resolved = false
    result.finalStatus = existingStatus
    table.insert(result.messages, "The new status effect had no effect!")
    
    return result
end

-- Get all compatible status effects for a Pokemon
-- @param pokemon: Pokemon to check
-- @param potentialStatuses: List of potential status effects
-- @return: List of compatible status effects
function StatusInteractions.getCompatibleStatuses(pokemon, potentialStatuses)
    if not pokemon or not potentialStatuses then
        return {}
    end
    
    local compatible = {}
    local currentStatus = pokemon.statusEffect
    
    for _, status in ipairs(potentialStatuses) do
        if not currentStatus then
            -- No current status, all are compatible
            table.insert(compatible, status)
        else
            -- Check compatibility with current status
            if not StatusInteractions.areStatusesMutuallyExclusive(currentStatus, status) then
                table.insert(compatible, status)
            elseif StatusInteractions.canUpgradeStatus(currentStatus, status) then
                table.insert(compatible, status)
            else
                -- Check if new status has higher priority
                local priorityCheck = StatusInteractions.checkReplacementPriority(currentStatus, status)
                if priorityCheck.canReplace then
                    table.insert(compatible, status)
                end
            end
        end
    end
    
    return compatible
end

-- Validate multiple status applications (for moves that apply multiple effects)
-- @param pokemon: Pokemon to apply statuses to
-- @param statusList: List of status effects to apply
-- @return: Validation result for all statuses
function StatusInteractions.validateMultipleStatusApplications(pokemon, statusList)
    if not pokemon or not statusList or #statusList == 0 then
        return {valid = false, error = "Invalid parameters"}
    end
    
    local result = {
        valid = true,
        applicableStatuses = {},
        blockedStatuses = {},
        messages = {}
    }
    
    local simulatedPokemon = {
        statusEffect = pokemon.statusEffect,
        statusTurns = pokemon.statusTurns,
        name = pokemon.name
    }
    
    for _, status in ipairs(statusList) do
        local validation = StatusInteractions.validateStatusApplication(simulatedPokemon, status, false)
        
        if validation.valid then
            table.insert(result.applicableStatuses, {
                status = status,
                replacementOccurred = validation.replacementOccurred
            })
            -- Update simulated Pokemon for next validation
            simulatedPokemon.statusEffect = validation.allowedStatus
            
            for _, message in ipairs(validation.messages) do
                table.insert(result.messages, message)
            end
        else
            table.insert(result.blockedStatuses, {
                status = status,
                reason = validation.error
            })
        end
    end
    
    if #result.applicableStatuses == 0 then
        result.valid = false
        result.error = "No status effects can be applied"
    end
    
    return result
end

return StatusInteractions