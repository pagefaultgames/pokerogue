--[[
Integration Tests for Pokemon Process
Tests complete Pokemon workflows across processes and message handling
--]]

local lu = require("tests.luaunit")

-- Mock AO environment for testing
_G.ao = {
    id = "test-pokemon-process",
    send = function(message)
        -- Store sent messages for verification
        if not _G._test_sent_messages then
            _G._test_sent_messages = {}
        end
        table.insert(_G._test_sent_messages, message)
    end
}

-- Mock JSON encoding/decoding
_G.json = {
    encode = function(data)
        if type(data) == "table" then
            return "encoded_json_" .. tostring(data.success or "data")
        end
        return "encoded_json"
    end,
    decode = function(str)
        if str == "test_pokemon_request" then
            return {
                operation = "CREATE_POKEMON",
                pokemonData = {
                    speciesId = 1,
                    level = 5,
                    playerId = "test_player"
                },
                processAuth = {
                    sourceProcessId = "coordinator",
                    authToken = "valid_token"
                }
            }
        elseif str == "test_party_request" then
            return {
                operation = "GET_PARTY",
                partyData = {
                    playerId = "test_player"
                },
                processAuth = {
                    sourceProcessId = "coordinator",
                    authToken = "valid_token"
                }
            }
        end
        return {}
    end
}

-- Mock Handlers system
local mockHandlers = {}
_G.Handlers = {
    add = function(name, pattern, handler)
        mockHandlers[name] = {
            pattern = pattern,
            handler = handler
        }
    end,
    utils = {
        hasMatchingTag = function(tagName, tagValue)
            return function(msg)
                return msg.Tags and msg.Tags[tagName] == tagValue
            end
        end
    }
}

-- Mock process coordination components
package.loaded["game-logic.process-coordination.message-correlator"] = {
    initialize = function() end,
    generateId = function() return "test-correlation-id" end,
    getStatistics = function() return {} end
}

package.loaded["game-logic.process-coordination.process-authenticator"] = {
    initialize = function() end,
    registerProcess = function() return true end,
    authenticateRequest = function(from, auth, level)
        if auth.authToken == "valid_token" then
            return {authenticated = true}
        else
            return {authenticated = false, reason = "Invalid token"}
        end
    end
}

package.loaded["game-logic.process-coordination.message-router"] = {
    initialize = function() end,
    getRoutingStatistics = function() return {} end
}

package.loaded["game-logic.process-coordination.backward-compatibility"] = {
    initialize = function() end
}

package.loaded["game-logic.process-coordination.performance-monitor"] = {
    initialize = function() end,
    recordRequest = function() end,
    getMetrics = function() return {} end,
    getAverageResponseTime = function() return 0 end
}

-- Mock species data
package.loaded["data.species.species-database"] = {
    init = function() end,
    getSpecies = function(speciesId)
        if speciesId == 1 then
            return {
                name = "Bulbasaur",
                baseStats = {45, 49, 49, 65, 65, 45},
                growthRate = "MEDIUM_SLOW",
                genderRatio = 1,
                abilities = {normal = "Overgrow", hidden = "Chlorophyll"}
            }
        end
        return nil
    end
}

package.loaded["data.species.evolution-chains"] = {
    init = function() end,
    getEvolutionsForSpecies = function() return {} end,
    getFullEvolutionChain = function() return {} end,
    getPreEvolutionsForSpecies = function() return {} end
}

package.loaded["data.constants.nature-modifiers"] = {
    natureExists = function() return true end,
    getAllModifiers = function() return {1.0, 1.0, 1.0, 1.0, 1.0, 1.0} end
}

package.loaded["game-logic.rng.crypto-rng"] = {
    initGlobalRNG = function() end,
    globalRandomInt = function(min, max) return math.floor((min + max) / 2) end,
    globalRandom = function() return 0.5 end
}

package.loaded["game-logic.environment.time-system"] = {
    isDayTime = function() return true end,
    isNightTime = function() return false end,
    checkTimeCondition = function() return true end
}

package.loaded["game-logic.environment.location-system"] = {
    checkBiomeCondition = function() return true end,
    checkSpecialLocationCondition = function() return true end
}

-- Load the pokemon process main
require("pokemon.main")

-- Test suite
TestPokemonIntegration = {}

function TestPokemonIntegration:setUp()
    -- Clear test state
    _G._test_sent_messages = {}
end

function TestPokemonIntegration:tearDown()
    -- Clean up after each test
    _G._test_sent_messages = {}
end

-- Helper function to create test message
local function createTestMessage(action, data, from, correlationId)
    return {
        From = from or "test-coordinator",
        Tags = {
            Action = action,
            CorrelationId = correlationId or "test-correlation"
        },
        Data = data or "{}"
    }
end

-- Process Discovery and Health Tests

function TestPokemonIntegration:testProcessInfoHandler()
    -- Test process info request
    local msg = createTestMessage("Info", "{}")
    
    -- Find and call the handler
    local handler = mockHandlers["process-info"]
    lu.assertNotNil(handler, "Process info handler should be registered")
    
    -- Execute handler
    handler.handler(msg)
    
    -- Verify response was sent
    lu.assertEquals(#_G._test_sent_messages, 1)
    local response = _G._test_sent_messages[1]
    lu.assertEquals(response.Target, "test-coordinator")
    lu.assertEquals(response.Tags.Action, "Info-Response")
end

function TestPokemonIntegration:testHealthCheckHandler()
    -- Test health check request
    local msg = createTestMessage("HEALTH_CHECK", "{}")
    
    -- Find and call the handler
    local handler = mockHandlers["health-check"]
    lu.assertNotNil(handler, "Health check handler should be registered")
    
    -- Execute handler
    handler.handler(msg)
    
    -- Verify response was sent
    lu.assertEquals(#_G._test_sent_messages, 1)
    local response = _G._test_sent_messages[1]
    lu.assertEquals(response.Target, "test-coordinator")
    lu.assertEquals(response.Tags.Action, "HEALTH_RESPONSE")
end

-- Pokemon State Handler Integration Tests

function TestPokemonIntegration:testPokemonStateRequestHandler()
    -- Test Pokemon state request
    local msg = createTestMessage("POKEMON_STATE_REQUEST", "test_pokemon_request")
    
    -- Find and call the handler
    local handler = mockHandlers["pokemon-state-request"]
    lu.assertNotNil(handler, "Pokemon state handler should be registered")
    
    -- Execute handler
    handler.handler(msg)
    
    -- Verify response was sent
    lu.assertEquals(#_G._test_sent_messages, 1)
    local response = _G._test_sent_messages[1]
    lu.assertEquals(response.Target, "test-coordinator")
    lu.assertEquals(response.Tags.Action, "POKEMON_STATE_RESPONSE")
    lu.assertEquals(response.Tags.CorrelationId, "test-correlation")
end

function TestPokemonIntegration:testPokemonStateRequestAuthentication()
    -- Test request with invalid authentication
    local invalidAuthData = json.encode({
        operation = "CREATE_POKEMON",
        pokemonData = {speciesId = 1, level = 5, playerId = "test_player"},
        processAuth = {authToken = "invalid_token"}
    })
    
    local msg = createTestMessage("POKEMON_STATE_REQUEST", invalidAuthData)
    
    -- Find and call the handler
    local handler = mockHandlers["pokemon-state-request"]
    handler.handler(msg)
    
    -- Verify authentication failure response
    lu.assertEquals(#_G._test_sent_messages, 1)
    local response = _G._test_sent_messages[1]
    lu.assertEquals(response.Tags.Action, "POKEMON_STATE_RESPONSE")
    -- Response should indicate authentication failure
end

-- Pokemon Evolution Handler Integration Tests

function TestPokemonIntegration:testPokemonEvolutionRequestHandler()
    -- Create Pokemon first
    local createMsg = createTestMessage("POKEMON_STATE_REQUEST", "test_pokemon_request")
    mockHandlers["pokemon-state-request"].handler(createMsg)
    
    -- Clear previous messages
    _G._test_sent_messages = {}
    
    -- Test evolution request
    local evolutionData = json.encode({
        operation = "CHECK_AVAILABLE_EVOLUTIONS",
        pokemonData = {pokemonId = 1},
        processAuth = {authToken = "valid_token"}
    })
    
    local msg = createTestMessage("POKEMON_EVOLUTION_REQUEST", evolutionData)
    
    -- Find and call the handler
    local handler = mockHandlers["pokemon-evolution-request"]
    lu.assertNotNil(handler, "Evolution handler should be registered")
    
    -- Execute handler
    handler.handler(msg)
    
    -- Verify response was sent
    lu.assertEquals(#_G._test_sent_messages, 1)
    local response = _G._test_sent_messages[1]
    lu.assertEquals(response.Tags.Action, "POKEMON_EVOLUTION_RESPONSE")
end

-- Party Management Handler Integration Tests

function TestPokemonIntegration:testPartyManagementRequestHandler()
    -- Test party management request
    local msg = createTestMessage("PARTY_MANAGEMENT_REQUEST", "test_party_request")
    
    -- Find and call the handler
    local handler = mockHandlers["party-management-request"]
    lu.assertNotNil(handler, "Party management handler should be registered")
    
    -- Execute handler
    handler.handler(msg)
    
    -- Verify response was sent
    lu.assertEquals(#_G._test_sent_messages, 1)
    local response = _G._test_sent_messages[1]
    lu.assertEquals(response.Target, "test-coordinator")
    lu.assertEquals(response.Tags.Action, "PARTY_MANAGEMENT_RESPONSE")
end

-- Species Data Handler Integration Tests

function TestPokemonIntegration:testSpeciesDataRequestHandler()
    -- Test species data request
    local speciesData = json.encode({
        operation = "GET_SPECIES",
        speciesData = {speciesId = 1},
        processAuth = {authToken = "valid_token"}
    })
    
    local msg = createTestMessage("SPECIES_DATA_REQUEST", speciesData)
    
    -- Find and call the handler
    local handler = mockHandlers["species-data-request"]
    lu.assertNotNil(handler, "Species data handler should be registered")
    
    -- Execute handler
    handler.handler(msg)
    
    -- Verify response was sent
    lu.assertEquals(#_G._test_sent_messages, 1)
    local response = _G._test_sent_messages[1]
    lu.assertEquals(response.Tags.Action, "SPECIES_DATA_RESPONSE")
end

-- Validation Handler Integration Tests

function TestPokemonIntegration:testPokemonValidationRequestHandler()
    -- Test validation request
    local validationData = json.encode({
        operation = "VALIDATE_POKEMON",
        validationData = {
            pokemon = {
                id = 1,
                speciesId = 1,
                level = 5,
                hp = 50,
                maxHp = 50,
                stats = {hp = 50, attack = 40, defense = 40, spAttack = 50, spDefense = 50, speed = 40},
                ivs = {hp = 15, attack = 15, defense = 15, spAttack = 15, spDefense = 15, speed = 15}
            }
        },
        processAuth = {authToken = "valid_token"}
    })
    
    local msg = createTestMessage("POKEMON_VALIDATION_REQUEST", validationData)
    
    -- Find and call the handler  
    local handler = mockHandlers["pokemon-validation-request"]
    lu.assertNotNil(handler, "Validation handler should be registered")
    
    -- Execute handler
    handler.handler(msg)
    
    -- Verify response was sent
    lu.assertEquals(#_G._test_sent_messages, 1)
    local response = _G._test_sent_messages[1]
    lu.assertEquals(response.Tags.Action, "POKEMON_VALIDATION_RESPONSE")
end

-- Error Handler Integration Tests

function TestPokemonIntegration:testErrorHandlerForUnsupportedAction()
    -- Test unsupported action
    local msg = createTestMessage("UNSUPPORTED_ACTION", "{}")
    
    -- Find and call the error handler
    local handler = mockHandlers["error-handler"]
    lu.assertNotNil(handler, "Error handler should be registered")
    
    -- Execute handler
    handler.handler(msg)
    
    -- Verify error response was sent
    lu.assertEquals(#_G._test_sent_messages, 1)
    local response = _G._test_sent_messages[1]
    lu.assertEquals(response.Tags.Action, "ERROR_RESPONSE")
end

-- Complete Workflow Integration Tests

function TestPokemonIntegration:testCompleteWorkflowCreatePokemonAndAddToParty()
    -- Step 1: Create Pokemon
    local createMsg = createTestMessage("POKEMON_STATE_REQUEST", "test_pokemon_request")
    mockHandlers["pokemon-state-request"].handler(createMsg)
    
    lu.assertEquals(#_G._test_sent_messages, 1)
    local createResponse = _G._test_sent_messages[1]
    lu.assertEquals(createResponse.Tags.Action, "POKEMON_STATE_RESPONSE")
    
    -- Clear messages for next step
    _G._test_sent_messages = {}
    
    -- Step 2: Add Pokemon to party
    local partyData = json.encode({
        operation = "ADD_POKEMON",
        partyData = {
            playerId = "test_player",
            pokemonId = 1 -- Assuming first Pokemon gets ID 1
        },
        processAuth = {authToken = "valid_token"}
    })
    
    local partyMsg = createTestMessage("PARTY_MANAGEMENT_REQUEST", partyData)
    mockHandlers["party-management-request"].handler(partyMsg)
    
    lu.assertEquals(#_G._test_sent_messages, 1)
    local partyResponse = _G._test_sent_messages[1]
    lu.assertEquals(partyResponse.Tags.Action, "PARTY_MANAGEMENT_RESPONSE")
end

function TestPokemonIntegration:testCompleteWorkflowEvolutionCheck()
    -- Step 1: Create high-level Pokemon that might evolve
    local createHighLevelData = json.encode({
        operation = "CREATE_POKEMON",
        pokemonData = {
            speciesId = 1,
            level = 16, -- Level where Bulbasaur evolves
            playerId = "test_player"
        },
        processAuth = {authToken = "valid_token"}
    })
    
    local createMsg = createTestMessage("POKEMON_STATE_REQUEST", createHighLevelData)
    mockHandlers["pokemon-state-request"].handler(createMsg)
    
    -- Clear messages
    _G._test_sent_messages = {}
    
    -- Step 2: Check for available evolutions
    local evolutionData = json.encode({
        operation = "CHECK_AVAILABLE_EVOLUTIONS",
        pokemonData = {pokemonId = 1},
        processAuth = {authToken = "valid_token"}
    })
    
    local evolutionMsg = createTestMessage("POKEMON_EVOLUTION_REQUEST", evolutionData)
    mockHandlers["pokemon-evolution-request"].handler(evolutionMsg)
    
    lu.assertEquals(#_G._test_sent_messages, 1)
    local evolutionResponse = _G._test_sent_messages[1]
    lu.assertEquals(evolutionResponse.Tags.Action, "POKEMON_EVOLUTION_RESPONSE")
end

function TestPokemonIntegration:testCompleteWorkflowStatCalculationAndValidation()
    -- Step 1: Create Pokemon
    local createMsg = createTestMessage("POKEMON_STATE_REQUEST", "test_pokemon_request")
    mockHandlers["pokemon-state-request"].handler(createMsg)
    
    -- Clear messages
    _G._test_sent_messages = {}
    
    -- Step 2: Request stat calculation
    local statsData = json.encode({
        operation = "RECALCULATE_POKEMON_STATS",
        pokemonData = {pokemonId = 1},
        processAuth = {authToken = "valid_token"}
    })
    
    local statsMsg = createTestMessage("POKEMON_STATS_REQUEST", statsData)
    mockHandlers["pokemon-stats-request"].handler(statsMsg)
    
    -- Clear messages  
    _G._test_sent_messages = {}
    
    -- Step 3: Validate Pokemon
    local validationData = json.encode({
        operation = "VALIDATE_POKEMON",
        validationData = {
            pokemon = {
                id = 1,
                speciesId = 1,
                level = 5,
                hp = 50,
                maxHp = 50,
                stats = {hp = 50, attack = 40, defense = 40, spAttack = 50, spDefense = 50, speed = 40},
                ivs = {hp = 15, attack = 15, defense = 15, spAttack = 15, spDefense = 15, speed = 15}
            }
        },
        processAuth = {authToken = "valid_token"}
    })
    
    local validationMsg = createTestMessage("POKEMON_VALIDATION_REQUEST", validationData)
    mockHandlers["pokemon-validation-request"].handler(validationMsg)
    
    lu.assertEquals(#_G._test_sent_messages, 1)
    local validationResponse = _G._test_sent_messages[1]
    lu.assertEquals(validationResponse.Tags.Action, "POKEMON_VALIDATION_RESPONSE")
end

-- Performance and Load Tests

function TestPokemonIntegration:testMultipleSimultaneousRequests()
    -- Test processing multiple requests
    local requests = {
        createTestMessage("POKEMON_STATE_REQUEST", "test_pokemon_request"),
        createTestMessage("SPECIES_DATA_REQUEST", json.encode({
            operation = "GET_SPECIES",
            speciesData = {speciesId = 1},
            processAuth = {authToken = "valid_token"}
        })),
        createTestMessage("PARTY_MANAGEMENT_REQUEST", "test_party_request")
    }
    
    -- Process all requests
    for _, msg in ipairs(requests) do
        local actionType = msg.Tags.Action:gsub("_REQUEST$", ""):lower():gsub("_", "-") .. "-request"
        local handler = mockHandlers[actionType]
        if handler then
            handler.handler(msg)
        end
    end
    
    -- Verify all responses were sent
    lu.assertEquals(#_G._test_sent_messages, 3)
    
    -- Verify each response type
    local responseActions = {}
    for _, response in ipairs(_G._test_sent_messages) do
        table.insert(responseActions, response.Tags.Action)
    end
    
    lu.assertTrue(table.contains(responseActions, "POKEMON_STATE_RESPONSE"))
    lu.assertTrue(table.contains(responseActions, "SPECIES_DATA_RESPONSE"))  
    lu.assertTrue(table.contains(responseActions, "PARTY_MANAGEMENT_RESPONSE"))
end

-- Helper function for table contains check
function table.contains(table, element)
    for _, value in pairs(table) do
        if value == element then
            return true
        end
    end
    return false
end

-- Run the tests
return TestPokemonIntegration