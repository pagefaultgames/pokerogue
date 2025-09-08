--[[
Berry Activation Manager
Manages berry trigger monitoring and timing within battle system

Features:
- Battle turn integration for berry activation checks
- HP monitoring system triggering berry activation at correct thresholds
- Status effect monitoring triggering status-curing berries immediately
- Stat reduction monitoring for stat-boosting berry triggers
- Berry consumption workflow removing berries after activation
- Berry recycling system through moves (Recycle) and abilities (Harvest)
- Activation priority system for multiple berry triggers

Behavioral Parity Requirements:
- Never use Lua's math.random() - ALWAYS use AO crypto module
- All berry activation calculations must match TypeScript implementation exactly
- Berry activation and timing must be deterministic and reproducible
--]]

local BerryDatabase = require('data.items.berry-database')
local BerryEffectsProcessor = require('game-logic.items.berry-effects-processor')

local BerryActivationManager = {}

-- Battle berry tracking state
local battleBerryState = {}

--[[
Initialize berry activation state for a battle
@param battleId string - Unique battle identifier
@return boolean - Success status
--]]
function BerryActivationManager.initializeBattleState(battleId)
    if not battleId then
        return false
    end
    
    battleBerryState[battleId] = {
        activatedBerries = {},  -- Track once-per-battle berries
        activationQueue = {},   -- Pending berry activations
        recycledBerries = {},   -- Berries available for recycling
        turnActivations = {}    -- Activations for current turn
    }
    
    return true
end

--[[
Clear berry activation state for a battle
@param battleId string - Unique battle identifier
@return boolean - Success status
--]]
function BerryActivationManager.clearBattleState(battleId)
    if not battleId then
        return false
    end
    
    battleBerryState[battleId] = nil
    return true
end

--[[
Get battle berry state
@param battleId string - Battle identifier
@return table - Berry state for the battle
--]]
function BerryActivationManager.getBattleState(battleId)
    if not battleId or not battleBerryState[battleId] then
        return nil
    end
    
    return battleBerryState[battleId]
end

--[[
Monitor HP changes and trigger berry activation
@param battleId string - Battle identifier
@param pokemon table - Pokemon data
@param previousHp number - HP before change
@return table - Activation result
--]]
function BerryActivationManager.monitorHpChange(battleId, pokemon, previousHp)
    if not battleId or not pokemon or not pokemon.heldItem then
        return { success = false, message = "Invalid parameters" }
    end
    
    local berry = BerryDatabase.getBerry(pokemon.heldItem)
    if not berry then
        return { success = false, message = "No berry held" }
    end
    
    -- Check if HP threshold berry should activate
    local shouldActivate = false
    local currentHpPercent = BerryEffectsProcessor.calculateHpPercentage(pokemon.hp, pokemon.maxHp)
    local previousHpPercent = BerryEffectsProcessor.calculateHpPercentage(previousHp, pokemon.maxHp)
    
    -- Check if we crossed an activation threshold
    if berry.activationCondition == BerryDatabase.ActivationCondition.HP_25_PERCENT then
        shouldActivate = currentHpPercent <= 0.25 and previousHpPercent > 0.25
    elseif berry.activationCondition == BerryDatabase.ActivationCondition.HP_50_PERCENT then
        shouldActivate = currentHpPercent <= 0.50 and previousHpPercent > 0.50
    end
    
    if shouldActivate then
        return BerryActivationManager.queueBerryActivation(battleId, pokemon, {
            trigger = "hp_threshold",
            previousHp = previousHp,
            currentHp = pokemon.hp
        })
    end
    
    return { success = false, message = "Activation threshold not met" }
end

--[[
Monitor status effect changes and trigger berry activation
@param battleId string - Battle identifier
@param pokemon table - Pokemon data
@param statusCondition string - Newly inflicted status
@return table - Activation result
--]]
function BerryActivationManager.monitorStatusChange(battleId, pokemon, statusCondition)
    if not battleId or not pokemon or not pokemon.heldItem or not statusCondition then
        return { success = false, message = "Invalid parameters" }
    end
    
    local berry = BerryDatabase.getBerry(pokemon.heldItem)
    if not berry then
        return { success = false, message = "No berry held" }
    end
    
    -- Check if status-curing berry should activate
    local shouldActivate = BerryEffectsProcessor.shouldActivateStatusBerry(berry, statusCondition)
    
    if shouldActivate then
        return BerryActivationManager.queueBerryActivation(battleId, pokemon, {
            trigger = "status_inflicted",
            statusCondition = statusCondition
        })
    end
    
    return { success = false, message = "Berry does not cure this status" }
end

--[[
Monitor stat changes and trigger berry activation
@param battleId string - Battle identifier
@param pokemon table - Pokemon data
@param statChanges table - Stat modifications applied
@return table - Activation result
--]]
function BerryActivationManager.monitorStatChange(battleId, pokemon, statChanges)
    if not battleId or not pokemon or not pokemon.heldItem or not statChanges then
        return { success = false, message = "Invalid parameters" }
    end
    
    local berry = BerryDatabase.getBerry(pokemon.heldItem)
    if not berry then
        return { success = false, message = "No berry held" }
    end
    
    -- Check if stat-boosting berry should activate
    local shouldActivate = BerryEffectsProcessor.shouldActivateStatBerry(berry, statChanges)
    
    if shouldActivate then
        return BerryActivationManager.queueBerryActivation(battleId, pokemon, {
            trigger = "stat_lowered",
            statChanges = statChanges
        })
    end
    
    return { success = false, message = "Berry does not activate on stat changes" }
end

--[[
Monitor super-effective hits and trigger berry activation
@param battleId string - Battle identifier
@param pokemon table - Pokemon data (defender)
@param moveType string - Type of attacking move
@param effectiveness number - Type effectiveness multiplier
@param damage number - Damage amount
@return table - Activation result
--]]
function BerryActivationManager.monitorSuperEffectiveHit(battleId, pokemon, moveType, effectiveness, damage)
    if not battleId or not pokemon or not pokemon.heldItem then
        return { success = false, message = "Invalid parameters" }
    end
    
    local berry = BerryDatabase.getBerry(pokemon.heldItem)
    if not berry then
        return { success = false, message = "No berry held" }
    end
    
    -- Check if damage-reducing berry should activate
    local shouldActivate = BerryEffectsProcessor.shouldActivateDamageReduceBerry(
        berry, moveType, pokemon.types, effectiveness
    )
    
    if shouldActivate then
        -- Check once-per-battle restriction
        local state = BerryActivationManager.getBattleState(battleId)
        if state and berry.oncePerBattle and state.activatedBerries[berry.id] then
            return { success = false, message = "Berry already used this battle" }
        end
        
        return BerryActivationManager.queueBerryActivation(battleId, pokemon, {
            trigger = "super_effective_hit",
            moveType = moveType,
            effectiveness = effectiveness,
            damage = damage,
            defenderTypes = pokemon.types
        })
    end
    
    return { success = false, message = "Berry does not activate on this attack type" }
end

--[[
Monitor PP depletion and trigger berry activation
@param battleId string - Battle identifier
@param pokemon table - Pokemon data
@param moveId string - Move that ran out of PP
@return table - Activation result
--]]
function BerryActivationManager.monitorPpDepletion(battleId, pokemon, moveId)
    if not battleId or not pokemon or not pokemon.heldItem or not moveId then
        return { success = false, message = "Invalid parameters" }
    end
    
    local berry = BerryDatabase.getBerry(pokemon.heldItem)
    if not berry or berry.id ~= "LEPPA_BERRY" then
        return { success = false, message = "No Leppa Berry held" }
    end
    
    return BerryActivationManager.queueBerryActivation(battleId, pokemon, {
        trigger = "pp_depleted",
        moveId = moveId,
        ppDepleted = true
    })
end

--[[
Queue berry activation for processing
@param battleId string - Battle identifier
@param pokemon table - Pokemon data
@param context table - Activation context
@return table - Queue result
--]]
function BerryActivationManager.queueBerryActivation(battleId, pokemon, context)
    if not battleId or not pokemon then
        return { success = false, message = "Invalid parameters" }
    end
    
    local state = BerryActivationManager.getBattleState(battleId)
    if not state then
        BerryActivationManager.initializeBattleState(battleId)
        state = BerryActivationManager.getBattleState(battleId)
    end
    
    local activation = {
        pokemonId = pokemon.id,
        berryId = pokemon.heldItem,
        context = context,
        priority = BerryActivationManager.getActivationPriority(pokemon.heldItem, context),
        timestamp = os.time()
    }
    
    table.insert(state.activationQueue, activation)
    
    -- Sort queue by priority (higher priority first)
    table.sort(state.activationQueue, function(a, b)
        return a.priority > b.priority
    end)
    
    return {
        success = true,
        message = "Berry activation queued",
        activation = activation
    }
end

--[[
Get activation priority for berry type
@param berryId string - Berry identifier
@param context table - Activation context
@return number - Priority value (higher = more priority)
--]]
function BerryActivationManager.getActivationPriority(berryId, context)
    local berry = BerryDatabase.getBerry(berryId)
    if not berry then
        return 0
    end
    
    -- Priority order:
    -- 1. Status curing berries (highest priority)
    -- 2. HP restoration berries
    -- 3. Stat boosting berries
    -- 4. Damage reducing berries
    -- 5. PP restoration berries (lowest priority)
    
    if berry.category == BerryDatabase.BerryCategory.STATUS_CURE then
        return 100
    elseif berry.category == BerryDatabase.BerryCategory.HP_RESTORE then
        return 80
    elseif berry.category == BerryDatabase.BerryCategory.STAT_BOOST or berry.category == BerryDatabase.BerryCategory.PINCH_BERRY then
        return 60
    elseif berry.category == BerryDatabase.BerryCategory.DAMAGE_REDUCE or berry.category == BerryDatabase.BerryCategory.TYPE_RESIST then
        return 40
    elseif berry.category == BerryDatabase.BerryCategory.PP_RESTORE then
        return 20
    end
    
    return 10
end

--[[
Process all queued berry activations for a battle turn
@param battleId string - Battle identifier
@param battleSeed string - Deterministic seed for battle
@return table - Processing results
--]]
function BerryActivationManager.processActivationQueue(battleId, battleSeed)
    if not battleId then
        return { success = false, message = "Invalid battle ID" }
    end
    
    local state = BerryActivationManager.getBattleState(battleId)
    if not state or #state.activationQueue == 0 then
        return { success = true, message = "No activations to process", activations = {} }
    end
    
    local results = {
        success = true,
        activations = {},
        errors = {}
    }
    
    -- Process each activation in priority order
    for _, activation in ipairs(state.activationQueue) do
        local pokemon = BerryActivationManager.getPokemonFromBattle(battleId, activation.pokemonId)
        if pokemon then
            -- Create activation context
            local activationContext = activation.context or {}
            activationContext.battleSeed = battleSeed
            activationContext.activatedBerries = state.activatedBerries
            
            -- Process berry activation
            local result = BerryEffectsProcessor.processBerryActivation(pokemon, activationContext)
            
            if result.success then
                -- Mark berry as activated for once-per-battle tracking
                local berry = BerryDatabase.getBerry(activation.berryId)
                if berry and berry.oncePerBattle then
                    state.activatedBerries[berry.id] = true
                end
                
                -- Store consumed berry for potential recycling
                if result.pokemon and not result.pokemon.heldItem then
                    table.insert(state.recycledBerries, {
                        berryId = activation.berryId,
                        pokemonId = activation.pokemonId,
                        consumedTurn = state.currentTurn or 1
                    })
                end
                
                table.insert(results.activations, {
                    pokemonId = activation.pokemonId,
                    berryId = activation.berryId,
                    effect = result.berryEffect,
                    updatedPokemon = result.pokemon
                })
            else
                table.insert(results.errors, {
                    pokemonId = activation.pokemonId,
                    berryId = activation.berryId,
                    error = result.message
                })
            end
        else
            table.insert(results.errors, {
                pokemonId = activation.pokemonId,
                berryId = activation.berryId,
                error = "Pokemon not found in battle"
            })
        end
    end
    
    -- Clear processed activations
    state.activationQueue = {}
    state.turnActivations = results.activations
    
    return results
end

--[[
Handle berry recycling through moves or abilities
@param battleId string - Battle identifier
@param pokemonId string - Pokemon receiving recycled berry
@param recycleType string - "move" or "ability"
@return table - Recycling result
--]]
function BerryActivationManager.recycleBerry(battleId, pokemonId, recycleType)
    if not battleId or not pokemonId then
        return { success = false, message = "Invalid parameters" }
    end
    
    local state = BerryActivationManager.getBattleState(battleId)
    if not state or #state.recycledBerries == 0 then
        return { success = false, message = "No berries available for recycling" }
    end
    
    -- Find most recently consumed berry for this Pokemon
    local recycledBerry = nil
    local recycleIndex = nil
    
    for i = #state.recycledBerries, 1, -1 do
        local berry = state.recycledBerries[i]
        if berry.pokemonId == pokemonId then
            recycledBerry = berry
            recycleIndex = i
            break
        end
    end
    
    if not recycledBerry then
        return { success = false, message = "No berries consumed by this Pokemon" }
    end
    
    -- Remove from recycled berries list
    table.remove(state.recycledBerries, recycleIndex)
    
    -- Get Pokemon and update held item
    local pokemon = BerryActivationManager.getPokemonFromBattle(battleId, pokemonId)
    if not pokemon then
        return { success = false, message = "Pokemon not found" }
    end
    
    -- Pokemon must not already have a held item
    if pokemon.heldItem then
        return { success = false, message = "Pokemon already holding an item" }
    end
    
    return {
        success = true,
        message = "Berry recycled successfully",
        pokemonId = pokemonId,
        berryId = recycledBerry.berryId,
        recycleType = recycleType
    }
end

--[[
Get turn summary of berry activations
@param battleId string - Battle identifier
@return table - Turn berry activation summary
--]]
function BerryActivationManager.getTurnSummary(battleId)
    if not battleId then
        return { success = false, message = "Invalid battle ID" }
    end
    
    local state = BerryActivationManager.getBattleState(battleId)
    if not state then
        return { success = false, message = "Battle state not found" }
    end
    
    return {
        success = true,
        activations = state.turnActivations or {},
        activatedThisBattle = state.activatedBerries,
        availableForRecycling = state.recycledBerries,
        queuedActivations = #state.activationQueue
    }
end

--[[
Mock function to get Pokemon from battle (would be implemented by battle system)
@param battleId string - Battle identifier
@param pokemonId string - Pokemon identifier
@return table - Pokemon data
--]]
function BerryActivationManager.getPokemonFromBattle(battleId, pokemonId)
    -- This would be implemented by the battle system
    -- For now, return a mock Pokemon for testing
    return {
        id = pokemonId,
        hp = 50,
        maxHp = 100,
        statusEffect = nil,
        stats = {},
        heldItem = "SITRUS_BERRY",
        types = {"normal"}
    }
end

--[[
Validate berry activation manager state and data
@return boolean - True if validation passes
@return table - Validation errors if any
--]]
function BerryActivationManager.validate()
    local errors = {}
    
    -- Validate berry effects processor integration
    local processorValidation, processorErrors = BerryEffectsProcessor.validate()
    if not processorValidation then
        for _, error in ipairs(processorErrors) do
            table.insert(errors, "Berry processor: " .. error)
        end
    end
    
    -- Validate battle state structure
    for battleId, state in pairs(battleBerryState) do
        if not state.activatedBerries or type(state.activatedBerries) ~= "table" then
            table.insert(errors, "Invalid activatedBerries for battle " .. battleId)
        end
        
        if not state.activationQueue or type(state.activationQueue) ~= "table" then
            table.insert(errors, "Invalid activationQueue for battle " .. battleId)
        end
        
        if not state.recycledBerries or type(state.recycledBerries) ~= "table" then
            table.insert(errors, "Invalid recycledBerries for battle " .. battleId)
        end
    end
    
    return #errors == 0, errors
end

-- Export activation manager
return BerryActivationManager