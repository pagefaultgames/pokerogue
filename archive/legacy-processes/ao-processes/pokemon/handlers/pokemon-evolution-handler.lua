--[[
Pokemon Evolution Handler
Handles evolution processing and validation requests

Message Types:
- POKEMON_EVOLUTION_REQUEST: Evolution checking, triggering, and validation
--]]

-- Import dependencies
local EvolutionSystem = require("pokemon.components.evolution-system")
local PokemonStateManager = require("pokemon.components.pokemon-state-manager")
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local PerformanceMonitor = require("game-logic.process-coordination.performance-monitor")

-- Pokemon Evolution Request Handler
Handlers.add(
    "pokemon-evolution-request",
    Handlers.utils.hasMatchingTag("Action", "POKEMON_EVOLUTION_REQUEST"),
    function(msg)
        local startTime = os.clock()
        local correlationId = msg.Tags.CorrelationId or MessageCorrelator.generateId()
        
        print("[Pokemon] Processing POKEMON_EVOLUTION_REQUEST from " .. (msg.From or "unknown"))
        
        -- Parse request data
        local requestData = json.decode(msg.Data)
        if not requestData then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "POKEMON_EVOLUTION_RESPONSE",
                    CorrelationId = correlationId
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid request data format"
                })
            })
            return
        end
        
        -- Authenticate request
        local authResult = ProcessAuthenticator.authenticateRequest(
            msg.From,
            requestData.processAuth or {},
            "BASIC"
        )
        
        if not authResult.authenticated then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "POKEMON_EVOLUTION_RESPONSE",
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
        
        if operation == "CHECK_AVAILABLE_EVOLUTIONS" then
            -- Get available evolutions for Pokemon
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            
            if pokemon then
                local evolutions = EvolutionSystem.getAvailableEvolutions(pokemon)
                result.success = true
                result.evolutions = evolutions
                result.canEvolve = #evolutions > 0
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "CHECK_LEVEL_EVOLUTION" then
            -- Check if level up should trigger evolution
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            
            if pokemon then
                local evolutionResult = EvolutionSystem.checkLevelEvolution(pokemon)
                result.success = true
                result.evolutionResult = evolutionResult
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "PROCESS_EVOLUTION" then
            -- Process evolution with cancellation checking
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local evolutionTarget = pokemonData.evolutionTarget
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            
            if pokemon then
                local evolvedPokemon, error = EvolutionSystem.evolveSpecies(pokemon, evolutionTarget)
                if evolvedPokemon then
                    result.success = true
                    result.pokemon = evolvedPokemon
                    result.evolved = true
                    print("[Pokemon] Evolution successful: " .. pokemon.species .. " -> " .. evolvedPokemon.species)
                else
                    result.error = error
                end
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "PROCESS_STONE_EVOLUTION" then
            -- Process stone evolution
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local stoneItemId = pokemonData.stoneItemId
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            
            if pokemon then
                local evolvedPokemon, evolutionResult = EvolutionSystem.processStoneEvolution(pokemon, stoneItemId)
                if evolvedPokemon then
                    result.success = true
                    result.pokemon = evolvedPokemon
                    result.evolutionResult = evolutionResult
                    print("[Pokemon] Stone evolution successful: " .. stoneItemId)
                else
                    result.error = evolutionResult
                end
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "PROCESS_TRADE_EVOLUTION" then
            -- Process trade evolution
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local linkingCordUsed = pokemonData.linkingCordUsed or false
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            
            if pokemon then
                local evolvedPokemon, evolutionResult = EvolutionSystem.processTradeEvolution(
                    pokemon, linkingCordUsed
                )
                if evolvedPokemon then
                    result.success = true
                    result.pokemon = evolvedPokemon
                    result.evolutionResult = evolutionResult
                    print("[Pokemon] Trade evolution successful")
                else
                    result.error = evolutionResult
                end
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "GET_EVOLUTION_CHAIN" then
            -- Get full evolution chain for species
            local speciesId = pokemonData.speciesId
            if not speciesId then
                local pokemonId = pokemonData.pokemonId or pokemonData.id
                local pokemon = PokemonStateManager.getPokemon(pokemonId)
                if pokemon then
                    speciesId = pokemon.speciesId
                end
            end
            
            if speciesId then
                local chain = EvolutionSystem.getEvolutionChain(speciesId)
                result.success = true
                result.evolutionChain = chain
            else
                result.error = "Species ID or Pokemon ID required"
            end
            
        elseif operation == "VALIDATE_EVOLUTION" then
            -- Validate if evolution is possible
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local targetSpeciesId = pokemonData.targetSpeciesId
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            
            if pokemon then
                local evolutions = EvolutionSystem.getAvailableEvolutions(pokemon)
                local canEvolve = false
                local evolutionData = nil
                
                for _, evolution in ipairs(evolutions) do
                    if evolution.toSpeciesId == targetSpeciesId then
                        canEvolve = true
                        evolutionData = evolution
                        break
                    end
                end
                
                result.success = true
                result.canEvolve = canEvolve
                result.evolutionData = evolutionData
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "GET_COMPATIBLE_STONES" then
            -- Get stones that can evolve this Pokemon
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            
            if pokemon then
                local stones = EvolutionSystem.getCompatibleStones(pokemon)
                result.success = true
                result.compatibleStones = stones
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "GET_TRADE_EVOLUTION_OPTIONS" then
            -- Get trade evolution options
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            
            if pokemon then
                local options = EvolutionSystem.getTradeEvolutionOptions(pokemon)
                result.success = true
                result.tradeOptions = options
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "GET_EVOLUTION_STATISTICS" then
            -- Get evolution statistics for Pokemon
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            
            if pokemon then
                local stats = EvolutionSystem.getEvolutionStatistics(pokemon)
                result.success = true
                result.evolutionStatistics = stats
            else
                result.error = "Pokemon not found"
            end
            
        else
            result.error = "Unsupported evolution operation: " .. tostring(operation)
        end
        
        -- Send response
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "POKEMON_EVOLUTION_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(result)
        })
        
        -- Record performance metrics
        local endTime = os.clock()
        PerformanceMonitor.recordRequest("POKEMON_EVOLUTION_REQUEST", operation, endTime - startTime)
        
        print("[Pokemon] Completed POKEMON_EVOLUTION_REQUEST: " .. operation .. " (" .. 
              string.format("%.2fms", (endTime - startTime) * 1000) .. ")")
    end
)

print("[Pokemon] Pokemon evolution handler loaded")