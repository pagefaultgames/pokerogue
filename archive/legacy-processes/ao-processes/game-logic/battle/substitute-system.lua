local SubstituteSystem = {}

local MoveDatabase = require('data.moves.move-database')
local Enums = require('data.constants.enums')
local BattleRNG = require('game-logic.rng.battle-rng')

local function isSoundMove(moveData)
    return moveData and moveData.flags and moveData.flags.sound
end

local function bypassesSubstitute(moveData)
    if not moveData then return false end
    if isSoundMove(moveData) then return true end
    if moveData.flags and moveData.flags.substitute_bypass then return true end
    
    local bypassMoves = {
        [Enums.Move.PERISH_SONG] = true,
        [Enums.Move.ROAR] = true,
        [Enums.Move.WHIRLWIND] = true
    }
    
    return bypassMoves[moveData.id] or false
end

function SubstituteSystem.createSubstitute(pokemon, battleState)
    if not pokemon or not battleState then
        return { success = false, error = "Invalid parameters" }
    end
    
    if not pokemon.hp or not pokemon.hp.max then
        return { success = false, error = "Pokemon missing HP data" }
    end
    
    local substituteHP = math.floor(pokemon.hp.max / 4)
    if pokemon.hp.current <= substituteHP then
        return { success = false, reason = "insufficient_hp", message = "Not enough HP to create a substitute!" }
    end
    
    if not battleState.substitutes then
        battleState.substitutes = {}
    end
    
    if battleState.substitutes[pokemon.battleId] then
        return { success = false, reason = "already_has_substitute", message = pokemon.name .. " already has a substitute!" }
    end
    
    pokemon.hp.current = pokemon.hp.current - substituteHP
    
    battleState.substitutes[pokemon.battleId] = {
        hp = { current = substituteHP, max = substituteHP },
        pokemon = pokemon.battleId,
        active = true
    }
    
    return {
        success = true,
        message = pokemon.name .. " created a substitute!",
        hpCost = substituteHP
    }
end

function SubstituteSystem.damageSubstitute(pokemon, damage, battleState)
    if not pokemon or not damage or not battleState or not battleState.substitutes then
        return { success = false, error = "Invalid parameters" }
    end
    
    local substitute = battleState.substitutes[pokemon.battleId]
    if not substitute or not substitute.active then
        return { success = false, reason = "no_substitute" }
    end
    
    local actualDamage = math.min(damage, substitute.hp.current)
    substitute.hp.current = substitute.hp.current - actualDamage
    
    if substitute.hp.current <= 0 then
        substitute.active = false
        battleState.substitutes[pokemon.battleId] = nil
        
        return {
            success = true,
            destroyed = true,
            damage = actualDamage,
            message = pokemon.name .. "'s substitute was destroyed!"
        }
    end
    
    return {
        success = true,
        destroyed = false,
        damage = actualDamage,
        message = "The substitute took the attack!"
    }
end

function SubstituteSystem.checkSubstituteInteraction(pokemon, moveData, battleState)
    if not pokemon or not moveData or not battleState or not battleState.substitutes then
        return { hasSubstitute = false, blocks = false }
    end
    
    local substitute = battleState.substitutes[pokemon.battleId]
    if not substitute or not substitute.active then
        return { hasSubstitute = false, blocks = false }
    end
    
    if bypassesSubstitute(moveData) then
        return { 
            hasSubstitute = true, 
            blocks = false, 
            bypass = true,
            reason = "substitute_bypass"
        }
    end
    
    if moveData.category == Enums.MoveCategory.STATUS then
        return { 
            hasSubstitute = true, 
            blocks = true, 
            reason = "status_blocked",
            message = "The substitute blocked the status move!"
        }
    end
    
    return { 
        hasSubstitute = true, 
        blocks = true, 
        reason = "damage_blocked",
        targetSubstitute = true
    }
end

function SubstituteSystem.processDamageWithSubstitute(pokemon, damage, moveData, battleState)
    if not pokemon or not damage or not moveData or not battleState then
        return { success = false, error = "Invalid parameters" }
    end
    
    local interaction = SubstituteSystem.checkSubstituteInteraction(pokemon, moveData, battleState)
    
    if not interaction.hasSubstitute or interaction.bypass then
        pokemon.hp.current = math.max(0, pokemon.hp.current - damage)
        return {
            success = true,
            targetHit = true,
            damage = damage,
            bypassedSubstitute = interaction.bypass or false
        }
    end
    
    if interaction.blocks and not interaction.targetSubstitute then
        return {
            success = true,
            targetHit = false,
            blocked = true,
            message = interaction.message
        }
    end
    
    local substituteResult = SubstituteSystem.damageSubstitute(pokemon, damage, battleState)
    return {
        success = true,
        targetHit = false,
        substituteHit = true,
        damage = substituteResult.damage,
        substituteDestroyed = substituteResult.destroyed,
        message = substituteResult.message
    }
end

function SubstituteSystem.processMultiHitWithSubstitute(pokemon, hitDamages, moveData, battleState)
    if not pokemon or not hitDamages or not moveData or not battleState then
        return { success = false, error = "Invalid parameters" }
    end
    
    local results = {
        success = true,
        hits = {},
        totalDamage = 0,
        substituteDestroyed = false
    }
    
    for i, damage in ipairs(hitDamages) do
        local hitResult = SubstituteSystem.processDamageWithSubstitute(pokemon, damage, moveData, battleState)
        
        table.insert(results.hits, {
            hitNumber = i,
            damage = hitResult.damage or 0,
            targetHit = hitResult.targetHit,
            substituteHit = hitResult.substituteHit,
            blocked = hitResult.blocked,
            message = hitResult.message
        })
        
        results.totalDamage = results.totalDamage + (hitResult.damage or 0)
        
        if hitResult.substituteDestroyed then
            results.substituteDestroyed = true
        end
        
        if hitResult.substituteDestroyed or not battleState.substitutes[pokemon.battleId] then
            break
        end
    end
    
    return results
end

function SubstituteSystem.hasActiveSubstitute(pokemon, battleState)
    if not pokemon or not battleState or not battleState.substitutes then
        return false
    end
    
    local substitute = battleState.substitutes[pokemon.battleId]
    return substitute and substitute.active
end

function SubstituteSystem.getSubstituteHP(pokemon, battleState)
    if not pokemon or not battleState or not battleState.substitutes then
        return nil
    end
    
    local substitute = battleState.substitutes[pokemon.battleId]
    if substitute and substitute.active then
        return { current = substitute.hp.current, max = substitute.hp.max }
    end
    
    return nil
end

function SubstituteSystem.removeSubstitute(pokemon, battleState)
    if not pokemon or not battleState or not battleState.substitutes then
        return { success = false, error = "Invalid parameters" }
    end
    
    if battleState.substitutes[pokemon.battleId] then
        battleState.substitutes[pokemon.battleId] = nil
        return { 
            success = true, 
            message = pokemon.name .. "'s substitute disappeared!"
        }
    end
    
    return { success = false, reason = "no_substitute" }
end

function SubstituteSystem.init(battleState)
    if not battleState then
        return { success = false, error = "Battle state required" }
    end
    
    if not battleState.substitutes then
        battleState.substitutes = {}
    end
    
    return { success = true }
end

return SubstituteSystem