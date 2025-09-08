--[[
Pokemon Stats Handler
Advanced stat calculation and battle-specific stat queries

Message Types:
- POKEMON_BATTLE_STATS_REQUEST: Battle stat calculations with modifiers
--]]

-- Import dependencies
local StatCalculator = require("pokemon.components.stat-calculator")
local PokemonStateManager = require("pokemon.components.pokemon-state-manager")
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local PerformanceMonitor = require("game-logic.process-coordination.performance-monitor")

-- Pokemon Battle Stats Request Handler
Handlers.add(
    "pokemon-battle-stats-request",
    Handlers.utils.hasMatchingTag("Action", "POKEMON_BATTLE_STATS_REQUEST"),
    function(msg)
        local startTime = os.clock()
        local correlationId = msg.Tags.CorrelationId or MessageCorrelator.generateId()
        
        print("[Pokemon] Processing POKEMON_BATTLE_STATS_REQUEST from " .. (msg.From or "unknown"))
        
        -- Parse request data
        local requestData = json.decode(msg.Data)
        if not requestData then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "POKEMON_BATTLE_STATS_RESPONSE",
                    CorrelationId = correlationId
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid request data format"
                })
            })
            return
        end
        
        -- Authenticate request (elevated auth for battle stats)
        local authResult = ProcessAuthenticator.authenticateRequest(
            msg.From,
            requestData.processAuth or {},
            "ELEVATED"
        )
        
        if not authResult.authenticated then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "POKEMON_BATTLE_STATS_RESPONSE",
                    CorrelationId = correlationId
                },
                Data = json.encode({
                    success = false,
                    error = "Authentication failed: " .. (authResult.reason or "Unknown")
                })
            })
            return
        end
        
        local result = { success = false, correlationId = correlationId }
        local operation = requestData.operation
        local pokemonData = requestData.pokemonData or {}
        
        if operation == "CALCULATE_EFFECTIVE_STAT" then
            -- Calculate effective stat with all modifiers
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local statName = pokemonData.statName
            local fieldConditions = pokemonData.fieldConditions
            local battleState = pokemonData.battleState
            local stages = pokemonData.stages or 0
            
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            if pokemon then
                local effectiveStat, isSwapped = StatCalculator.calculateEffectiveStatWithAllModifiers(
                    pokemon, statName, fieldConditions, battleState, stages
                )
                
                result.success = true
                result.effectiveStat = effectiveStat
                result.isSwapped = isSwapped
                result.statName = statName
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "APPLY_STAT_STAGES" then
            -- Apply stat stage modifications
            local baseStat = pokemonData.baseStat
            local stages = pokemonData.stages
            
            if baseStat and stages then
                local modifiedStat = StatCalculator.applyStatStages(baseStat, stages)
                result.success = true
                result.modifiedStat = modifiedStat
                result.originalStat = baseStat
                result.stages = stages
            else
                result.error = "baseStat and stages required"
            end
            
        elseif operation == "APPLY_POSITIONAL_ABILITIES" then
            -- Apply positional ability effects
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local battleState = pokemonData.battleState
            
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            if pokemon and battleState then
                local success, updateDetails = StatCalculator.updatePositionalAbilityBattleData(pokemon, battleState)
                result.success = success
                result.updateDetails = updateDetails
                result.pokemon = pokemon
            else
                result.error = "Pokemon and battleState required"
            end
            
        elseif operation == "APPLY_HELD_ITEM_MODIFIERS" then
            -- Apply held item stat modifiers
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            if pokemon then
                local success, updateDetails = StatCalculator.updateHeldItemBattleData(pokemon)
                result.success = success
                result.updateDetails = updateDetails
                result.pokemon = pokemon
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "GET_STAT_MODIFIER_INFO" then
            -- Get comprehensive stat modifier information
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local battleState = pokemonData.battleState
            local fieldConditions = pokemonData.fieldConditions
            
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            if pokemon then
                local modifierInfo = StatCalculator.getStatModifierInfo(pokemon, battleState, fieldConditions)
                result.success = true
                result.modifierInfo = modifierInfo
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "CHECK_POSITIONAL_ABILITY" then
            -- Check positional ability activation
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local battleState = pokemonData.battleState
            
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            if pokemon and battleState then
                local abilityInfo = StatCalculator.getPositionalAbilityInfo(pokemon, battleState)
                result.success = true
                result.positionalAbilityInfo = abilityInfo
            else
                result.error = "Pokemon and battleState required"
            end
            
        elseif operation == "RESET_BATTLE_MODIFIERS" then
            -- Reset all battle-specific stat modifiers
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            if pokemon then
                local positionalReset = StatCalculator.resetPositionalAbilityEffects(pokemon)
                local heldItemReset = StatCalculator.resetHeldItemEffects(pokemon)
                
                result.success = true
                result.positionalReset = positionalReset
                result.heldItemReset = heldItemReset
                result.pokemon = pokemon
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "CALCULATE_HIDDEN_POWER_TYPE" then
            -- Calculate Hidden Power type from IVs
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local ivs = pokemonData.ivs
            
            if pokemonId then
                local pokemon = PokemonStateManager.getPokemon(pokemonId)
                if pokemon then
                    ivs = pokemon.ivs
                end
            end
            
            if ivs then
                local hiddenPowerType, error = StatCalculator.calculateHiddenPowerType(ivs)
                if hiddenPowerType then
                    result.success = true
                    result.hiddenPowerType = hiddenPowerType
                else
                    result.error = error
                end
            else
                result.error = "Pokemon ID or IVs required"
            end
            
        elseif operation == "VALIDATE_STAT_CALCULATION" then
            -- Validate stat calculation accuracy
            local expected = pokemonData.expected
            local actual = pokemonData.actual
            local tolerance = pokemonData.tolerance or 0
            
            if expected and actual then
                local isValid = StatCalculator.validateStatCalculation(expected, actual, tolerance)
                result.success = true
                result.isValid = isValid
                result.difference = math.abs(expected - actual)
            else
                result.error = "expected and actual values required"
            end
            
        elseif operation == "CHECK_ABILITY_INTERACTION" then
            -- Check positional ability interactions
            local pokemon1Id = pokemonData.pokemon1Id
            local pokemon2Id = pokemonData.pokemon2Id
            
            local pokemon1 = PokemonStateManager.getPokemon(pokemon1Id)
            local pokemon2 = PokemonStateManager.getPokemon(pokemon2Id)
            
            if pokemon1 and pokemon2 then
                local interaction = StatCalculator.checkPositionalAbilityInteraction(pokemon1, pokemon2)
                result.success = true
                result.interaction = interaction
            else
                result.error = "Both Pokemon required for ability interaction check"
            end
            
        else
            result.error = "Unsupported battle stats operation: " .. tostring(operation)
        end
        
        -- Send response
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "POKEMON_BATTLE_STATS_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(result)
        })
        
        -- Record performance metrics
        local endTime = os.clock()
        PerformanceMonitor.recordRequest("POKEMON_BATTLE_STATS_REQUEST", operation, endTime - startTime)
        
        print("[Pokemon] Completed POKEMON_BATTLE_STATS_REQUEST: " .. operation .. " (" .. 
              string.format("%.2fms", (endTime - startTime) * 1000) .. ")")
    end
)

print("[Pokemon] Pokemon stats handler loaded")