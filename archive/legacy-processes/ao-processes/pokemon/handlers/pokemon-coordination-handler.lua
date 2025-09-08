--[[
Pokemon Coordination Handler
Inter-process communication and coordination for Pokemon operations

Message Types:
- PARTY_MANAGEMENT_REQUEST: Party composition and management
- SPECIES_DATA_REQUEST: Species information and validation
- POKEMON_VALIDATION_REQUEST: Pokemon data validation
--]]

-- Import dependencies
local PartyManager = require("pokemon.components.party-manager")
local SpeciesManager = require("pokemon.components.species-manager")
local PokemonValidator = require("pokemon.components.pokemon-validator")
local PokemonStateManager = require("pokemon.components.pokemon-state-manager")
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local PerformanceMonitor = require("game-logic.process-coordination.performance-monitor")

-- Party Management Request Handler
Handlers.add(
    "party-management-request",
    Handlers.utils.hasMatchingTag("Action", "PARTY_MANAGEMENT_REQUEST"),
    function(msg)
        local startTime = os.clock()
        local correlationId = msg.Tags.CorrelationId or MessageCorrelator.generateId()
        
        print("[Pokemon] Processing PARTY_MANAGEMENT_REQUEST from " .. (msg.From or "unknown"))
        
        -- Parse request data
        local requestData = json.decode(msg.Data)
        if not requestData then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "PARTY_MANAGEMENT_RESPONSE",
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
                    Action = "PARTY_MANAGEMENT_RESPONSE",
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
        local partyData = requestData.partyData or {}
        local playerId = partyData.playerId or requestData.playerId
        
        if operation == "GET_PARTY" then
            -- Get player's party
            local party = PartyManager.getPartySummary(playerId)
            result.success = true
            result.partyData = party
            
        elseif operation == "SET_PARTY" then
            -- Replace entire party
            local newParty = partyData.party or {}
            local success, partyResult = PartyManager.setParty(playerId, newParty)
            
            if success then
                result.success = true
                result.partyData = partyResult
            else
                result.error = partyResult
            end
            
        elseif operation == "ADD_POKEMON" then
            -- Add Pokemon to party
            local pokemonId = partyData.pokemonId
            local slot = partyData.slot
            
            local pokemon = PokemonStateManager.getPokemon(pokemonId)
            if pokemon then
                local success, partyResult = PartyManager.addPokemonToParty(playerId, pokemon, slot)
                if success then
                    result.success = true
                    result.partyData = partyResult
                else
                    result.error = partyResult
                end
            else
                result.error = "Pokemon not found"
            end
            
        elseif operation == "REMOVE_POKEMON" then
            -- Remove Pokemon from party
            local pokemonId = partyData.pokemonId
            
            local success, partyResult = PartyManager.removePokemonFromParty(playerId, pokemonId)
            if success then
                result.success = true
                result.partyData = partyResult
            else
                result.error = partyResult
            end
            
        elseif operation == "SWAP_POKEMON" then
            -- Swap Pokemon positions in party
            local fromSlot = partyData.fromSlot
            local toSlot = partyData.toSlot
            
            local success, partyResult = PartyManager.swapPokemonInParty(playerId, fromSlot, toSlot)
            if success then
                result.success = true
                result.partyData = partyResult
            else
                result.error = partyResult
            end
            
        elseif operation == "GET_PARTY_BATTLE_INFO" then
            -- Get party battle readiness
            local battleInfo = PartyManager.getPartyBattleInfo(playerId)
            result.success = true
            result.battleInfo = battleInfo
            
        elseif operation == "GET_LEAD_POKEMON" then
            -- Get first healthy Pokemon
            local leadPokemon = PartyManager.getLeadPokemon(playerId)
            result.success = true
            result.leadPokemon = leadPokemon
            
        elseif operation == "GET_HEALTHY_POKEMON" then
            -- Get all healthy Pokemon in party
            local healthyPokemon = PartyManager.getHealthyPokemon(playerId)
            result.success = true
            result.healthyPokemon = healthyPokemon
            result.count = #healthyPokemon
            
        else
            result.error = "Unsupported party operation: " .. tostring(operation)
        end
        
        -- Send response
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "PARTY_MANAGEMENT_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(result)
        })
        
        -- Record performance metrics
        local endTime = os.clock()
        PerformanceMonitor.recordRequest("PARTY_MANAGEMENT_REQUEST", operation, endTime - startTime)
        
        print("[Pokemon] Completed PARTY_MANAGEMENT_REQUEST: " .. operation .. " (" .. 
              string.format("%.2fms", (endTime - startTime) * 1000) .. ")")
    end
)

-- Species Data Request Handler
Handlers.add(
    "species-data-request",
    Handlers.utils.hasMatchingTag("Action", "SPECIES_DATA_REQUEST"),
    function(msg)
        local startTime = os.clock()
        local correlationId = msg.Tags.CorrelationId or MessageCorrelator.generateId()
        
        print("[Pokemon] Processing SPECIES_DATA_REQUEST from " .. (msg.From or "unknown"))
        
        -- Parse request data
        local requestData = json.decode(msg.Data)
        if not requestData then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SPECIES_DATA_RESPONSE",
                    CorrelationId = correlationId
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid request data format"
                })
            })
            return
        end
        
        -- Basic authentication for species data (public information)
        local authResult = ProcessAuthenticator.authenticateRequest(
            msg.From,
            requestData.processAuth or {},
            "BASIC"
        )
        
        if not authResult.authenticated then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "SPECIES_DATA_RESPONSE",
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
        local speciesData = requestData.speciesData or {}
        
        if operation == "GET_SPECIES" then
            -- Get single species data
            local speciesId = speciesData.speciesId
            local species = SpeciesManager.getSpecies(speciesId)
            
            if species then
                result.success = true
                result.species = species
            else
                result.error = "Species not found"
            end
            
        elseif operation == "GET_MULTIPLE_SPECIES" then
            -- Get multiple species data
            local speciesIds = speciesData.speciesIds or {}
            local species = SpeciesManager.getMultipleSpecies(speciesIds)
            
            result.success = true
            result.species = species
            result.count = 0
            for _ in pairs(species) do
                result.count = result.count + 1
            end
            
        elseif operation == "GET_BASE_STATS" then
            -- Get base stats for species
            local speciesId = speciesData.speciesId
            local baseStats = SpeciesManager.getBaseStats(speciesId)
            
            if baseStats then
                result.success = true
                result.baseStats = baseStats
            else
                result.error = "Species not found or no base stats available"
            end
            
        elseif operation == "GET_TYPES" then
            -- Get types for species
            local speciesId = speciesData.speciesId
            local types = SpeciesManager.getTypes(speciesId)
            
            if types then
                result.success = true
                result.types = types
            else
                result.error = "Species not found or no type information available"
            end
            
        elseif operation == "GET_ABILITIES" then
            -- Get abilities for species
            local speciesId = speciesData.speciesId
            local abilities = SpeciesManager.getAbilities(speciesId)
            
            if abilities then
                result.success = true
                result.abilities = abilities
            else
                result.error = "Species not found or no ability information available"
            end
            
        elseif operation == "GET_EVOLUTION_CHAIN" then
            -- Get evolution chain for species
            local speciesId = speciesData.speciesId
            local chain = SpeciesManager.getEvolutionChain(speciesId)
            
            result.success = true
            result.evolutionChain = chain
            
        elseif operation == "VALIDATE_SPECIES_ID" then
            -- Validate species ID format and existence
            local speciesId = speciesData.speciesId
            local formatValid, formatError = SpeciesManager.validateSpeciesId(speciesId)
            local exists = formatValid and SpeciesManager.speciesExists(speciesId)
            
            result.success = true
            result.formatValid = formatValid
            result.exists = exists
            if not formatValid then
                result.formatError = formatError
            end
            
        else
            result.error = "Unsupported species operation: " .. tostring(operation)
        end
        
        -- Send response
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "SPECIES_DATA_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(result)
        })
        
        -- Record performance metrics
        local endTime = os.clock()
        PerformanceMonitor.recordRequest("SPECIES_DATA_REQUEST", operation, endTime - startTime)
        
        print("[Pokemon] Completed SPECIES_DATA_REQUEST: " .. operation .. " (" .. 
              string.format("%.2fms", (endTime - startTime) * 1000) .. ")")
    end
)

-- Pokemon Validation Request Handler
Handlers.add(
    "pokemon-validation-request",
    Handlers.utils.hasMatchingTag("Action", "POKEMON_VALIDATION_REQUEST"),
    function(msg)
        local startTime = os.clock()
        local correlationId = msg.Tags.CorrelationId or MessageCorrelator.generateId()
        
        print("[Pokemon] Processing POKEMON_VALIDATION_REQUEST from " .. (msg.From or "unknown"))
        
        -- Parse request data
        local requestData = json.decode(msg.Data)
        if not requestData then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "POKEMON_VALIDATION_RESPONSE",
                    CorrelationId = correlationId
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid request data format"
                })
            })
            return
        end
        
        -- Elevated authentication for validation (security-sensitive)
        local authResult = ProcessAuthenticator.authenticateRequest(
            msg.From,
            requestData.processAuth or {},
            "ELEVATED"
        )
        
        if not authResult.authenticated then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "POKEMON_VALIDATION_RESPONSE",
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
        local validationData = requestData.validationData or {}
        
        if operation == "VALIDATE_POKEMON" then
            -- Comprehensive Pokemon validation
            local pokemon = validationData.pokemon
            
            if pokemon then
                local isValid, error = PokemonValidator.validatePokemon(pokemon)
                result.success = true
                result.isValid = isValid
                result.error = error
            else
                result.error = "Pokemon data required for validation"
            end
            
        elseif operation == "VALIDATE_POKEMON_BATCH" then
            -- Validate multiple Pokemon
            local pokemonList = validationData.pokemonList or {}
            local validationResults = PokemonValidator.validatePokemonBatch(pokemonList)
            
            result.success = true
            result.validationResults = validationResults
            result.totalCount = #pokemonList
            
            -- Count valid/invalid Pokemon
            local validCount = 0
            for _, validationResult in ipairs(validationResults) do
                if validationResult.valid then
                    validCount = validCount + 1
                end
            end
            
            result.validCount = validCount
            result.invalidCount = #pokemonList - validCount
            
        elseif operation == "QUICK_VALIDATE" then
            -- Quick validation for performance
            local pokemon = validationData.pokemon
            
            if pokemon then
                local isValid = PokemonValidator.quickValidate(pokemon)
                result.success = true
                result.isValid = isValid
            else
                result.error = "Pokemon data required for validation"
            end
            
        elseif operation == "GET_VALIDATION_DETAILS" then
            -- Get detailed validation breakdown
            local pokemon = validationData.pokemon
            
            if pokemon then
                local details = PokemonValidator.getValidationDetails(pokemon)
                result.success = true
                result.validationDetails = details
            else
                result.error = "Pokemon data required for validation details"
            end
            
        elseif operation == "VALIDATE_ANTI_CHEAT" then
            -- Anti-cheat validation
            local pokemon = validationData.pokemon
            
            if pokemon then
                local isLegitimate, error = PokemonValidator.validateAntiCheat(pokemon)
                result.success = true
                result.isLegitimate = isLegitimate
                result.error = error
            else
                result.error = "Pokemon data required for anti-cheat validation"
            end
            
        else
            result.error = "Unsupported validation operation: " .. tostring(operation)
        end
        
        -- Send response
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "POKEMON_VALIDATION_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(result)
        })
        
        -- Record performance metrics
        local endTime = os.clock()
        PerformanceMonitor.recordRequest("POKEMON_VALIDATION_REQUEST", operation, endTime - startTime)
        
        print("[Pokemon] Completed POKEMON_VALIDATION_REQUEST: " .. operation .. " (" .. 
              string.format("%.2fms", (endTime - startTime) * 1000) .. ")")
    end
)

print("[Pokemon] Pokemon coordination handler loaded")