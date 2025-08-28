-- Ability-Move Interaction System
-- Handles ability-based move interactions including redirections, absorptions, and immunities
-- Provides Lightning Rod, Water Absorb, Flash Fire, and other ability interactions

local AbilityInteractions = {}

-- Load dependencies
local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Ability interaction types
AbilityInteractions.InteractionType = {
    ABSORPTION = "ABSORPTION",        -- Move absorbed and provides benefit (Water Absorb, Volt Absorb)
    REDIRECTION = "REDIRECTION",      -- Move redirected to different target (Lightning Rod, Storm Drain)
    IMMUNITY = "IMMUNITY",            -- Move completely nullified (Levitate, Sap Sipper)
    BOOST = "BOOST",                  -- Move nullified with stat boost (Motor Drive, Sap Sipper)
    ACTIVATION = "ACTIVATION"         -- Ability activates due to move (Flash Fire, Water Veil)
}

-- Ability interaction data
-- Maps ability IDs to their interaction effects
AbilityInteractions.interactionData = {
    [Enums.AbilityId.LIGHTNING_ROD] = {
        type = AbilityInteractions.InteractionType.REDIRECTION,
        moveTypes = {Enums.PokemonType.ELECTRIC},
        effect = {
            redirect = true,
            statBoost = {stat = Enums.Stat.SPATK, stages = 1},
            absorb = true,
            message = "Lightning Rod drew the Electric-type attack!"
        },
        priority = 10 -- High priority for redirection
    },
    
    [Enums.AbilityId.WATER_ABSORB] = {
        type = AbilityInteractions.InteractionType.ABSORPTION,
        moveTypes = {Enums.PokemonType.WATER},
        effect = {
            healingFraction = "1/4", -- Heal 1/4 max HP
            absorb = true,
            message = "Water Absorb restored HP!"
        },
        priority = 5
    },
    
    [Enums.AbilityId.VOLT_ABSORB] = {
        type = AbilityInteractions.InteractionType.ABSORPTION,
        moveTypes = {Enums.PokemonType.ELECTRIC},
        effect = {
            healingFraction = "1/4",
            absorb = true,
            message = "Volt Absorb restored HP!"
        },
        priority = 5
    },
    
    [Enums.AbilityId.FLASH_FIRE] = {
        type = AbilityInteractions.InteractionType.ACTIVATION,
        moveTypes = {Enums.PokemonType.FIRE},
        effect = {
            absorb = true,
            firePowerBoost = 1.5,
            message = "Flash Fire raised the power of Fire-type moves!"
        },
        priority = 5
    },
    
    [Enums.AbilityId.LEVITATE] = {
        type = AbilityInteractions.InteractionType.IMMUNITY,
        moveTypes = {Enums.PokemonType.GROUND},
        effect = {
            immune = true,
            message = "Levitate makes Ground-type moves miss!"
        },
        priority = 8
    },
    
    [118] = { -- SAP_SIPPER placeholder ID
        type = AbilityInteractions.InteractionType.BOOST,
        moveTypes = {Enums.PokemonType.GRASS},
        effect = {
            statBoost = {stat = Enums.Stat.ATK, stages = 1},
            absorb = true,
            message = "Sap Sipper boosted Attack!"
        },
        priority = 5
    },
    
    -- Add Motor Drive for Electric moves
    [77] = { -- MOTOR_DRIVE placeholder ID
        type = AbilityInteractions.InteractionType.BOOST,
        moveTypes = {Enums.PokemonType.ELECTRIC},
        effect = {
            statBoost = {stat = Enums.Stat.SPD, stages = 1},
            absorb = true,
            message = "Motor Drive boosted Speed!"
        },
        priority = 5
    },
    
    -- Add Storm Drain for Water moves
    [114] = { -- STORM_DRAIN placeholder ID
        type = AbilityInteractions.InteractionType.REDIRECTION,
        moveTypes = {Enums.PokemonType.WATER},
        effect = {
            redirect = true,
            statBoost = {stat = Enums.Stat.SPATK, stages = 1},
            absorb = true,
            message = "Storm Drain drew the Water-type attack!"
        },
        priority = 10
    }
}

-- Check if ability can interact with move
-- @param abilityId: Ability ID to check
-- @param moveType: Type of the move
-- @param moveCategory: Category of the move (Physical/Special/Status)
-- @return: Boolean indicating if interaction exists
function AbilityInteractions.canInteract(abilityId, moveType, moveCategory)
    local interaction = AbilityInteractions.interactionData[abilityId]
    if not interaction then
        return false
    end
    
    -- Check if move type matches ability interaction
    for _, interactionType in ipairs(interaction.moveTypes) do
        if moveType == interactionType then
            return true
        end
    end
    
    return false
end

-- Process ability interaction with move
-- @param battleState: Current battle state
-- @param abilityPokemon: Pokemon with the ability
-- @param attacker: Pokemon using the move
-- @param moveData: Move being used
-- @param targets: Original move targets
-- @return: Interaction result with new targets, effects, and success flag
function AbilityInteractions.processInteraction(battleState, abilityPokemon, attacker, moveData, targets)
    if not AbilityInteractions.canInteract(abilityPokemon.ability, moveData.type, moveData.category) then
        return {success = false, reason = "No ability interaction"}
    end
    
    local interaction = AbilityInteractions.interactionData[abilityPokemon.ability]
    local result = {
        success = true,
        interactionType = interaction.type,
        effects = {},
        newTargets = targets,
        message = interaction.effect.message or "",
        priority = interaction.priority
    }
    
    -- Process different interaction types
    if interaction.type == AbilityInteractions.InteractionType.ABSORPTION then
        result.effects.absorbed = true
        result.effects.blocked = true
        result.newTargets = {} -- No targets - move absorbed
        
        -- Apply healing
        if interaction.effect.healingFraction then
            local maxHP = abilityPokemon.maxHP or abilityPokemon.stats[Enums.Stat.HP]
            local healAmount = 0
            
            if interaction.effect.healingFraction == "1/4" then
                healAmount = math.max(1, math.floor(maxHP / 4))
            elseif interaction.effect.healingFraction == "1/3" then
                healAmount = math.max(1, math.floor(maxHP / 3))
            elseif interaction.effect.healingFraction == "1/2" then
                healAmount = math.max(1, math.floor(maxHP / 2))
            end
            
            result.effects.healing = {
                target = abilityPokemon.id,
                amount = healAmount
            }
        end
        
    elseif interaction.type == AbilityInteractions.InteractionType.REDIRECTION then
        result.effects.redirected = true
        result.effects.blocked = true
        result.newTargets = {abilityPokemon.id} -- Redirect to ability user
        
        -- Apply stat boost after redirection
        if interaction.effect.statBoost then
            result.effects.statBoost = {
                target = abilityPokemon.id,
                stat = interaction.effect.statBoost.stat,
                stages = interaction.effect.statBoost.stages
            }
        end
        
    elseif interaction.type == AbilityInteractions.InteractionType.IMMUNITY then
        result.effects.immune = true
        result.effects.blocked = true
        result.newTargets = {} -- No targets - move has no effect
        
    elseif interaction.type == AbilityInteractions.InteractionType.BOOST then
        result.effects.absorbed = true
        result.effects.blocked = true
        result.newTargets = {} -- No targets - move absorbed
        
        -- Apply stat boost
        if interaction.effect.statBoost then
            result.effects.statBoost = {
                target = abilityPokemon.id,
                stat = interaction.effect.statBoost.stat,
                stages = interaction.effect.statBoost.stages
            }
        end
        
    elseif interaction.type == AbilityInteractions.InteractionType.ACTIVATION then
        result.effects.activated = true
        -- Move still hits, but ability activates
        -- Flash Fire boosts fire moves for future use
        if interaction.effect.firePowerBoost then
            -- Set battle state flag for Flash Fire activation
            battleState.abilityStates = battleState.abilityStates or {}
            battleState.abilityStates[abilityPokemon.id] = battleState.abilityStates[abilityPokemon.id] or {}
            battleState.abilityStates[abilityPokemon.id].flashFireActive = true
            battleState.abilityStates[abilityPokemon.id].firePowerMultiplier = interaction.effect.firePowerBoost
        end
    end
    
    return result
end

-- Check for multi-target redirection (doubles/triples)
-- @param battleState: Current battle state
-- @param moveData: Move being used
-- @param originalTargets: Original move targets
-- @return: Array of Pokemon with redirecting abilities and their priorities
function AbilityInteractions.getRedirectingAbilities(battleState, moveData, originalTargets)
    local redirectors = {}
    
    -- Check all Pokemon on the field for redirecting abilities
    for _, pokemon in pairs(battleState.activePokemon or {}) do
        if pokemon and pokemon.ability and not pokemon.fainted then
            local interaction = AbilityInteractions.interactionData[pokemon.ability]
            if interaction and interaction.type == AbilityInteractions.InteractionType.REDIRECTION then
                -- Check if this ability can redirect this move type
                for _, moveType in ipairs(interaction.moveTypes) do
                    if moveData.type == moveType then
                        table.insert(redirectors, {
                            pokemon = pokemon,
                            priority = interaction.priority,
                            interaction = interaction
                        })
                        break
                    end
                end
            end
        end
    end
    
    -- Sort by priority (highest first)
    table.sort(redirectors, function(a, b)
        return a.priority > b.priority
    end)
    
    return redirectors
end

-- Apply ability interaction effects to battle state
-- @param battleState: Battle state to modify
-- @param interactionResult: Result from processInteraction
-- @return: Updated battle state and effect messages
function AbilityInteractions.applyInteractionEffects(battleState, interactionResult)
    local messages = {}
    
    if not interactionResult.success then
        return battleState, messages
    end
    
    -- Add interaction message
    if interactionResult.message then
        table.insert(messages, interactionResult.message)
    end
    
    -- Apply healing effect
    if interactionResult.effects.healing then
        local target = interactionResult.effects.healing.target
        local amount = interactionResult.effects.healing.amount
        
        for _, pokemon in pairs(battleState.activePokemon or {}) do
            if pokemon and pokemon.id == target then
                local oldHP = pokemon.currentHP
                pokemon.currentHP = math.min(pokemon.currentHP + amount, 
                                           pokemon.maxHP or pokemon.stats[Enums.Stat.HP])
                local actualHealing = pokemon.currentHP - oldHP
                if actualHealing > 0 then
                    table.insert(messages, pokemon.name .. " restored " .. actualHealing .. " HP!")
                end
                break
            end
        end
    end
    
    -- Apply stat boost effect
    if interactionResult.effects.statBoost then
        local target = interactionResult.effects.statBoost.target
        local stat = interactionResult.effects.statBoost.stat
        local stages = interactionResult.effects.statBoost.stages
        
        for _, pokemon in pairs(battleState.activePokemon or {}) do
            if pokemon and pokemon.id == target then
                pokemon.statStages = pokemon.statStages or {}
                pokemon.statStages[stat] = (pokemon.statStages[stat] or 0) + stages
                
                -- Cap at +/-6
                pokemon.statStages[stat] = math.max(-6, math.min(6, pokemon.statStages[stat]))
                
                local statName = "Unknown"
                for name, id in pairs(Enums.Stat) do
                    if id == stat then
                        statName = name
                        break
                    end
                end
                
                if stages > 0 then
                    table.insert(messages, pokemon.name .. "'s " .. statName .. " rose!")
                else
                    table.insert(messages, pokemon.name .. "'s " .. statName .. " fell!")
                end
                break
            end
        end
    end
    
    return battleState, messages
end

-- Get active ability states for move power calculations
-- @param battleState: Current battle state
-- @param pokemonId: Pokemon ID to check
-- @return: Ability state data or nil
function AbilityInteractions.getAbilityState(battleState, pokemonId)
    if not battleState.abilityStates or not battleState.abilityStates[pokemonId] then
        return nil
    end
    
    return battleState.abilityStates[pokemonId]
end

-- Check if Flash Fire is active for Fire-type move power boost
-- @param battleState: Current battle state
-- @param pokemonId: Pokemon ID using Fire-type move
-- @return: Power multiplier (1.5 if Flash Fire active, 1.0 otherwise)
function AbilityInteractions.getFirePowerMultiplier(battleState, pokemonId)
    local abilityState = AbilityInteractions.getAbilityState(battleState, pokemonId)
    if abilityState and abilityState.flashFireActive then
        return abilityState.firePowerMultiplier or 1.5
    end
    return 1.0
end

-- Validate ability interaction data integrity
-- @return: Boolean indicating if all interaction data is valid
function AbilityInteractions.validateInteractionData()
    for abilityId, interaction in pairs(AbilityInteractions.interactionData) do
        -- Check required fields
        if not interaction.type or not interaction.moveTypes or not interaction.effect then
            print("Warning: Invalid interaction data for ability " .. tostring(abilityId))
            return false
        end
        
        -- Validate interaction type
        local validType = false
        for _, validTypeValue in pairs(AbilityInteractions.InteractionType) do
            if interaction.type == validTypeValue then
                validType = true
                break
            end
        end
        
        if not validType then
            print("Warning: Invalid interaction type for ability " .. tostring(abilityId) .. ": " .. tostring(interaction.type))
            return false
        end
        
        -- Validate move types
        for _, moveType in ipairs(interaction.moveTypes) do
            if not Enums.PokemonTypeName[moveType] then
                print("Warning: Invalid move type in ability " .. tostring(abilityId) .. ": " .. tostring(moveType))
                return false
            end
        end
    end
    
    return true
end

-- Initialize ability interactions system
function AbilityInteractions.init()
    if not AbilityInteractions.validateInteractionData() then
        return false, "Invalid ability interaction data"
    end
    
    print("Ability Interactions system initialized with " .. 
          #AbilityInteractions.interactionData .. " ability interactions")
    return true
end

return AbilityInteractions