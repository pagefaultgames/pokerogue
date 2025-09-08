local ReflectionSystem = {}

local MoveDatabase = require('data.moves.move-database')
local Enums = require('data.constants.enums')
local BattleRNG = require('game-logic.rng.battle-rng')

local function isStatusMove(moveData)
    return moveData and moveData.category == Enums.MoveCategory.STATUS
end

local function canReflect(moveData, targetPokemon, userPokemon)
    if not moveData then return false end
    if not isStatusMove(moveData) then return false end
    if moveData.flags and moveData.flags.unreflectable then return false end
    if moveData.target == Enums.MoveTarget.SELF then return false end
    if moveData.target == Enums.MoveTarget.USER_OR_ALLY then return false end
    
    return true
end

local function hasReflectionAbility(pokemon)
    if not pokemon or not pokemon.ability then return false end
    return pokemon.ability == Enums.Ability.MAGIC_BOUNCE
end

local function hasActiveReflectionMove(pokemon, battleState)
    if not pokemon or not battleState then return false end
    
    local protectionKey = pokemon.battleId .. '_reflection'
    local reflectionState = battleState.protectionStates[protectionKey]
    
    return reflectionState and reflectionState.active and reflectionState.turnsRemaining > 0
end

function ReflectionSystem.checkForReflection(moveData, targetPokemon, userPokemon, battleState)
    if not canReflect(moveData, targetPokemon, userPokemon) then
        return { reflected = false }
    end
    
    local reflectionTarget = nil
    local reflectionType = nil
    
    if hasActiveReflectionMove(targetPokemon, battleState) then
        reflectionTarget = userPokemon
        reflectionType = 'magic_coat'
    elseif hasReflectionAbility(targetPokemon) then
        reflectionTarget = userPokemon
        reflectionType = 'magic_bounce'
    end
    
    if reflectionTarget then
        if canReflect(moveData, reflectionTarget, targetPokemon) then
            return {
                reflected = true,
                newTarget = reflectionTarget,
                newUser = targetPokemon,
                reflectionType = reflectionType
            }
        else
            return { reflected = false, blocked = true, reason = 'infinite_reflection_prevented' }
        end
    end
    
    return { reflected = false }
end

function ReflectionSystem.activateMagicCoat(pokemon, battleState)
    if not pokemon or not battleState then
        return { success = false, error = "Invalid parameters" }
    end
    
    local protectionKey = pokemon.battleId .. '_reflection'
    battleState.protectionStates[protectionKey] = {
        active = true,
        turnsRemaining = 1,
        type = 'magic_coat',
        pokemon = pokemon.battleId
    }
    
    return { 
        success = true, 
        message = pokemon.name .. " shrouded itself with Magic Coat!"
    }
end

function ReflectionSystem.processReflection(reflectionResult, moveData, battleState)
    if not reflectionResult.reflected then
        return moveData, reflectionResult.newTarget or moveData.originalTarget, reflectionResult.newUser or moveData.originalUser
    end
    
    local reflectedMove = {
        id = moveData.id,
        name = moveData.name,
        category = moveData.category,
        type = moveData.type,
        power = moveData.power,
        accuracy = moveData.accuracy,
        effects = moveData.effects,
        flags = moveData.flags,
        target = moveData.target,
        priority = moveData.priority,
        reflected = true,
        originalUser = moveData.originalUser or moveData.user,
        originalTarget = moveData.originalTarget or moveData.target
    }
    
    return reflectedMove, reflectionResult.newTarget, reflectionResult.newUser
end

function ReflectionSystem.updateReflectionStates(battleState)
    if not battleState or not battleState.protectionStates then return end
    
    for key, state in pairs(battleState.protectionStates) do
        if state.type == 'magic_coat' and state.active then
            state.turnsRemaining = state.turnsRemaining - 1
            if state.turnsRemaining <= 0 then
                state.active = false
            end
        end
    end
end

function ReflectionSystem.init(battleState)
    if not battleState then
        return { success = false, error = "Battle state required" }
    end
    
    if not battleState.protectionStates then
        battleState.protectionStates = {}
    end
    
    return { success = true }
end

return ReflectionSystem