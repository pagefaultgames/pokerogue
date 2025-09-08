--[[
Pokemon State Handler  
Handles Pokemon CRUD operations and state management requests

Message Types:
- POKEMON_STATE_REQUEST: Get, create, update, delete Pokemon
- POKEMON_STATS_REQUEST: Stat calculations and recalculations
--]]

-- Import dependencies
local PokemonStateManager = require("pokemon.components.pokemon-state-manager")
local SpeciesManager = require("pokemon.components.species-manager")
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local PerformanceMonitor = require("game-logic.process-coordination.performance-monitor")

-- Pokemon State Request Handler
Handlers.add(
    "pokemon-state-request",
    Handlers.utils.hasMatchingTag("Action", "POKEMON_STATE_REQUEST"),
    function(msg)
        local startTime = os.clock()
        local correlationId = msg.Tags.CorrelationId or MessageCorrelator.generateId()
        
        print("[Pokemon] Processing POKEMON_STATE_REQUEST from " .. (msg.From or "unknown"))
        
        -- Parse request data
        local requestData = json.decode(msg.Data)
        if not requestData then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "POKEMON_STATE_RESPONSE",
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
                    Action = "POKEMON_STATE_RESPONSE", 
                    CorrelationId = correlationId
                },
                Data = json.encode({
                    success = false,
                    error = "Authentication failed: " .. (authResult.reason or "Unknown")
                })
            })
            return
        end
        
        -- Extract operation parameters
        local operation = requestData.operation
        local pokemonData = requestData.pokemonData or {}
        local playerId = pokemonData.playerId or requestData.playerId
        
        local result = { success = false, correlationId = correlationId }
        
        -- Process based on operation type
        if operation == "CREATE_POKEMON" then
            -- Create new Pokemon
            local speciesId = pokemonData.speciesId
            local level = pokemonData.level or 1
            local options = pokemonData.options or {}
            options.correlationId = correlationId
            
            local pokemon, error = PokemonStateManager.createPokemon(speciesId, level, playerId, options)
            if pokemon then
                result.success = true
                result.pokemon = pokemon
                print("[Pokemon] Created Pokemon " .. pokemon.species .. " for " .. playerId)
            else
                result.error = error
            end
            
        elseif operation == "GET_POKEMON" then
            -- Get Pokemon by ID
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            
            if pokemon then
                result.success = true
                result.pokemon = pokemon
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "GET_PLAYER_POKEMON" then
            -- Get all Pokemon for player
            local playerPokemon = PokemonStateManager.getPlayerPokemon(playerId)
            result.success = true
            result.pokemon = playerPokemon
            result.count = #playerPokemon
            
        elseif operation == "UPDATE_HP" then
            -- Update Pokemon HP
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local newHp = pokemonData.newHp
            
            local success, pokemon_or_error = PokemonStateManager.updateHp(pokemonId, newHp)
            if success then
                result.success = true
                result.pokemon = pokemon_or_error
            else
                result.error = pokemon_or_error
            end
            
        elseif operation == "GAIN_EXPERIENCE" then
            -- Add experience to Pokemon
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local expGained = pokemonData.expGained
            local evolutionPreferences = pokemonData.evolutionPreferences
            
            local success, pokemon, levelUpInfo = PokemonStateManager.gainExperience(
                pokemonId, expGained, evolutionPreferences
            )
            
            if success then
                result.success = true
                result.pokemon = pokemon
                result.levelUpInfo = levelUpInfo
            else
                result.error = pokemon -- error message in second return
            end
            
        elseif operation == "UPDATE_STATUS" then
            -- Update Pokemon status effect
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local statusEffect = pokemonData.statusEffect
            
            local success, pokemon_or_error = PokemonStateManager.updateStatusEffect(pokemonId, statusEffect)
            if success then
                result.success = true
                result.pokemon = pokemon_or_error
            else
                result.error = pokemon_or_error
            end
            
        elseif operation == "UPDATE_HELD_ITEM" then
            -- Update Pokemon held item
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local itemId = pokemonData.itemId
            
            local success, pokemon_or_error = PokemonStateManager.updateHeldItem(pokemonId, itemId)
            if success then
                result.success = true
                result.pokemon = pokemon_or_error
            else
                result.error = pokemon_or_error
            end
            
        elseif operation == "DELETE_POKEMON" then
            -- Delete Pokemon
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            
            local success, message = PokemonStateManager.deletePokemon(pokemonId, playerId)
            if success then
                result.success = true
                result.message = message
            else
                result.error = message
            end
            
        else
            result.error = "Unsupported operation: " .. tostring(operation)
        end
        
        -- Send response
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "POKEMON_STATE_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(result)
        })
        
        -- Record performance metrics
        local endTime = os.clock()
        PerformanceMonitor.recordRequest("POKEMON_STATE_REQUEST", operation, endTime - startTime)
        
        print("[Pokemon] Completed POKEMON_STATE_REQUEST: " .. operation .. " (" .. 
              string.format("%.2fms", (endTime - startTime) * 1000) .. ")")
    end
)

-- Pokemon Stats Request Handler
Handlers.add(
    "pokemon-stats-request", 
    Handlers.utils.hasMatchingTag("Action", "POKEMON_STATS_REQUEST"),
    function(msg)
        local startTime = os.clock()
        local correlationId = msg.Tags.CorrelationId or MessageCorrelator.generateId()
        
        print("[Pokemon] Processing POKEMON_STATS_REQUEST from " .. (msg.From or "unknown"))
        
        -- Parse request data
        local requestData = json.decode(msg.Data)
        if not requestData then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "POKEMON_STATS_RESPONSE",
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
                    Action = "POKEMON_STATS_RESPONSE",
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
        
        if operation == "CALCULATE_STATS" then
            -- Calculate stats from base parameters
            local StatCalculator = require("pokemon.components.stat-calculator")
            
            local baseStats = pokemonData.baseStats
            local ivs = pokemonData.ivs
            local level = pokemonData.level
            local natureId = pokemonData.natureId
            
            local stats, error = StatCalculator.calculateAllStats(baseStats, ivs, level, natureId)
            if stats then
                result.success = true
                result.stats = stats
            else
                result.error = error
            end
            
        elseif operation == "RECALCULATE_POKEMON_STATS" then
            -- Recalculate stats for existing Pokemon
            local pokemonId = pokemonData.pokemonId or pokemonData.id
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            
            if pokemon then
                local StatCalculator = require("pokemon.components.stat-calculator")
                local stats, error = StatCalculator.recalculateStats(pokemon)
                
                if stats then
                    result.success = true
                    result.stats = stats
                    result.pokemon = pokemon
                else
                    result.error = error
                end
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "GENERATE_IVS" then
            -- Generate random IVs
            local StatCalculator = require("pokemon.components.stat-calculator")
            local seed = pokemonData.seed
            
            local ivs = StatCalculator.generateRandomIVs(seed)
            result.success = true
            result.ivs = ivs
            
        else
            result.error = "Unsupported stats operation: " .. tostring(operation)
        end
        
        -- Send response
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "POKEMON_STATS_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(result)
        })
        
        -- Record performance metrics
        local endTime = os.clock()
        PerformanceMonitor.recordRequest("POKEMON_STATS_REQUEST", operation, endTime - startTime)
        
        print("[Pokemon] Completed POKEMON_STATS_REQUEST: " .. operation .. " (" .. 
              string.format("%.2fms", (endTime - startTime) * 1000) .. ")")
    end
)

print("[Pokemon] Pokemon state handler loaded")