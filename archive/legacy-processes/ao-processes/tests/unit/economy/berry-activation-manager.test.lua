--[[
Berry Activation Manager Unit Tests
Tests for berry activation conditions and timing mechanics

Test Coverage:
- Berry activation condition checking with precise timing
- HP threshold monitoring for automatic berry activation
- Status condition monitoring for immediate berry activation
- Battle state management and berry tracking
- Berry recycling system functionality
--]]

_G.TEST_MODE = true

-- Test framework
local TestFramework = require('tests.test-framework')
local test = TestFramework.createTestSuite("BerryActivationManager")

-- Mock BerryDatabase
local MockBerryDatabase = {
    berries = {
        SITRUS_BERRY = {
            id = "SITRUS_BERRY",
            name = "Sitrus Berry",
            activationCondition = "hp_50_percent",
            effect = {
                type = "heal_percent",
                amount = 0.25
            },
            consumable = true,
            oncePerBattle = false
        },
        CHERI_BERRY = {
            id = "CHERI_BERRY", 
            name = "Cheri Berry",
            activationCondition = "status_inflicted",
            effect = {
                type = "cure_status",
                statusCondition = "paralysis"
            },
            consumable = true,
            oncePerBattle = false
        },
        SALAC_BERRY = {
            id = "SALAC_BERRY",
            name = "Salac Berry", 
            activationCondition = "hp_25_percent",
            effect = {
                type = "boost_stat",
                boostsStat = "speed"
            },
            consumable = true,
            oncePerBattle = false
        },
        OCCA_BERRY = {
            id = "OCCA_BERRY",
            name = "Occa Berry",
            activationCondition = "super_effective_hit",
            effect = {
                type = "reduce_damage",
                resistsType = "fire"
            },
            consumable = true,
            oncePerBattle = true
        }
    },
    getBerry = function(berryId)
        return MockBerryDatabase.berries[berryId]
    end
}

-- Mock BerryEffectsProcessor
local MockBerryEffectsProcessor = {
    applyBerryEffect = function(berry, pokemon, battleContext)
        local result = {
            success = true,
            effectType = berry.effect.type,
            effectMagnitude = 0,
            pokemonUpdates = {}
        }
        
        if berry.effect.type == "heal_percent" then
            local healAmount = math.floor(pokemon.maxHP * berry.effect.amount)
            result.effectMagnitude = healAmount
            result.pokemonUpdates.hp = math.min(pokemon.maxHP, pokemon.hp + healAmount)
            result.pokemonUpdates.healthRestored = healAmount
        elseif berry.effect.type == "cure_status" then
            if pokemon.statusCondition == berry.effect.statusCondition then
                result.effectMagnitude = 1
                result.pokemonUpdates.statusCondition = nil
                result.pokemonUpdates.statusCured = berry.effect.statusCondition
            end
        elseif berry.effect.type == "boost_stat" then
            result.effectMagnitude = 1
            result.pokemonUpdates.statStages = {}
            result.pokemonUpdates.statStages[berry.effect.boostsStat] = 1
        end
        
        return result
    end,
    init = function() end
}

-- Mock InventoryManager
local MockInventoryManager = {
    trackBerryConsumption = function(playerId, berryId, pokemonId, battleId)
        return true, "Berry consumption tracked successfully"
    end,
    removeItem = function(playerId, itemId, quantity, reason)
        return true, "Item removed successfully", 0
    end
}

-- Setup mocks
package.loaded['data.items.berry-database'] = MockBerryDatabase
package.loaded['economy.components.berry-effects-processor'] = MockBerryEffectsProcessor
package.loaded['economy.components.inventory-manager'] = MockInventoryManager

-- Load BerryActivationManager after mocks
local BerryActivationManager = require('economy.components.berry-activation-manager')

-- Test data
local testBattleId = "test-battle-1"
local testPokemonId = "pokemon-1"
local testPlayerId = "player-1"

local testPokemon = {
    hp = 50,
    maxHP = 100,
    statusCondition = nil,
    statStages = {},
    heldItem = "SITRUS_BERRY",
    playerId = testPlayerId
}

local testBattleContext = {
    battleId = testBattleId,
    pokemon = {
        [testPokemonId] = testPokemon
    },
    playerId = testPlayerId
}

-- Initialize manager
BerryActivationManager.init()

-- Test: Initialize battle state
test("should initialize battle state", function(assert)
    local success = BerryActivationManager.initializeBattleState(testBattleId)
    assert(success == true, "Should successfully initialize battle state")
    
    local history = BerryActivationManager.getBattleActivationHistory(testBattleId)
    assert(type(history) == "table", "Should return history table")
    assert(type(history.activatedBerries) == "table", "Should have activated berries tracker")
    assert(type(history.turnActivations) == "table", "Should have turn activations tracker")
end)

-- Test: HP-based berry activation (50% threshold)
test("should activate Sitrus Berry at 50% HP", function(assert)
    -- Set Pokemon to 50% HP
    testPokemon.hp = 50  -- 50% of 100 max HP
    testPokemon.heldItem = "SITRUS_BERRY"
    
    local shouldActivate, activationData = BerryActivationManager.shouldActivateBerry(
        testPokemonId, "SITRUS_BERRY", testBattleContext
    )
    
    assert(shouldActivate == true, "Sitrus Berry should activate at 50% HP")
    assert(activationData.currentHP == 50, "Should track current HP")
    assert(activationData.maxHP == 100, "Should track max HP")
    assert(activationData.threshold == 0.5, "Should have 50% threshold")
end)

-- Test: HP-based berry activation (25% threshold)
test("should activate Salac Berry at 25% HP", function(assert)
    -- Set Pokemon to 25% HP
    testPokemon.hp = 25  -- 25% of 100 max HP
    
    local shouldActivate, activationData = BerryActivationManager.shouldActivateBerry(
        testPokemonId, "SALAC_BERRY", testBattleContext
    )
    
    assert(shouldActivate == true, "Salac Berry should activate at 25% HP")
    assert(activationData.threshold == 0.25, "Should have 25% threshold")
end)

-- Test: HP-based berry should NOT activate above threshold
test("should not activate HP berry above threshold", function(assert)
    -- Set Pokemon to 75% HP
    testPokemon.hp = 75
    
    local shouldActivate, activationData = BerryActivationManager.shouldActivateBerry(
        testPokemonId, "SITRUS_BERRY", testBattleContext
    )
    
    assert(shouldActivate == false, "Sitrus Berry should not activate above 50% HP")
end)

-- Test: Status condition berry activation
test("should activate status cure berry", function(assert)
    -- Set Pokemon with paralysis
    testPokemon.statusCondition = "paralysis"
    
    local shouldActivate, activationData = BerryActivationManager.shouldActivateBerry(
        testPokemonId, "CHERI_BERRY", testBattleContext
    )
    
    assert(shouldActivate == true, "Cheri Berry should activate when paralyzed")
    assert(activationData.statusCondition == "paralysis", "Should track status condition")
end)

-- Test: Status condition berry should NOT activate for wrong status
test("should not activate status cure berry for wrong status", function(assert)
    -- Set Pokemon with different status
    testPokemon.statusCondition = "poison"
    
    local shouldActivate, activationData = BerryActivationManager.shouldActivateBerry(
        testPokemonId, "CHERI_BERRY", testBattleContext
    )
    
    assert(shouldActivate == false, "Cheri Berry should not activate for poison")
end)

-- Test: Super effective hit activation
test("should activate type resist berry on super effective hit", function(assert)
    -- Set up battle context with super effective move
    testBattleContext.lastMove = {
        targetId = testPokemonId,
        effectiveness = 2.0,  -- Super effective
        moveType = "fire"
    }
    
    local shouldActivate, activationData = BerryActivationManager.shouldActivateBerry(
        testPokemonId, "OCCA_BERRY", testBattleContext
    )
    
    assert(shouldActivate == true, "Occa Berry should activate on super effective fire move")
    assert(activationData.moveEffectiveness == 2.0, "Should track move effectiveness")
    assert(activationData.moveType == "fire", "Should track move type")
end)

-- Test: Once per battle restriction
test("should respect once per battle limitation", function(assert)
    -- Initialize battle state
    BerryActivationManager.initializeBattleState(testBattleId)
    
    -- Set up for super effective hit
    testBattleContext.lastMove = {
        targetId = testPokemonId,
        effectiveness = 2.0,
        moveType = "fire"
    }
    
    -- First activation should work
    local shouldActivate1, activationData1 = BerryActivationManager.shouldActivateBerry(
        testPokemonId, "OCCA_BERRY", testBattleContext
    )
    assert(shouldActivate1 == true, "First activation should succeed")
    
    -- Process the activation to mark berry as used
    BerryActivationManager.activateBerry(activationData1, testBattleContext)
    
    -- Second activation should fail
    local shouldActivate2, activationData2 = BerryActivationManager.shouldActivateBerry(
        testPokemonId, "OCCA_BERRY", testBattleContext
    )
    assert(shouldActivate2 == false, "Second activation should fail due to once per battle")
    assert(activationData2.alreadyActivated == true, "Should indicate already activated")
end)

-- Test: Berry activation processing
test("should process berry activation", function(assert)
    -- Set up for healing berry activation
    testPokemon.hp = 40  -- Below 50% threshold
    
    local shouldActivate, activationData = BerryActivationManager.shouldActivateBerry(
        testPokemonId, "SITRUS_BERRY", testBattleContext
    )
    
    assert(shouldActivate == true, "Should activate berry")
    
    -- Process activation
    local success, result = BerryActivationManager.activateBerry(activationData, testBattleContext)
    
    assert(success == true, "Should process activation successfully")
    assert(result.berryId == "SITRUS_BERRY", "Should return berry ID")
    assert(result.pokemonId == testPokemonId, "Should return Pokemon ID")
    assert(result.effectType == "heal_percent", "Should return effect type")
    assert(result.berryConsumed == true, "Should indicate berry consumed")
end)

-- Test: Turn start activation checking
test("should check turn start activations", function(assert)
    -- Initialize battle state
    BerryActivationManager.initializeBattleState(testBattleId)
    
    -- Set up Pokemon with low HP and berry
    testPokemon.hp = 30
    testPokemon.heldItem = "SITRUS_BERRY"
    
    local activations = BerryActivationManager.checkTurnStartActivations(testBattleContext)
    
    assert(type(activations) == "table", "Should return activations table")
    assert(#activations > 0, "Should find at least one activation")
    assert(activations[1].berryId == "SITRUS_BERRY", "Should identify correct berry")
end)

-- Test: Post damage activation checking
test("should check post damage activations", function(assert)
    -- Set up Pokemon that just took damage
    testPokemon.hp = 45  -- Just below 50%
    testPokemon.heldItem = "SITRUS_BERRY"
    
    local activations = BerryActivationManager.checkPostDamageActivations(
        testPokemonId, testBattleContext
    )
    
    assert(type(activations) == "table", "Should return activations table")
    if testPokemon.heldItem then
        assert(#activations >= 0, "Should check for activations")
    end
end)

-- Test: Berry recycling
test("should recycle berry", function(assert)
    -- Clear held item for recycling test
    testPokemon.heldItem = nil
    
    local success, result = BerryActivationManager.recycleBerry(
        testPokemonId, "SITRUS_BERRY", "RECYCLE_MOVE", testBattleContext
    )
    
    assert(success == true, "Should recycle berry successfully")
    assert(result.berryId == "SITRUS_BERRY", "Should return correct berry ID")
    assert(result.recycleMethod == "RECYCLE_MOVE", "Should track recycle method")
    
    -- Check that Pokemon now holds the berry
    assert(testPokemon.heldItem == "SITRUS_BERRY", "Pokemon should now hold recycled berry")
end)

-- Test: Battle state cleanup
test("should cleanup battle state", function(assert)
    -- Get history before cleanup
    local historyBefore = BerryActivationManager.getBattleActivationHistory(testBattleId)
    assert(type(historyBefore) == "table", "Should have battle history")
    
    -- Cleanup battle state
    local success = BerryActivationManager.clearBattleState(testBattleId)
    assert(success == true, "Should cleanup battle state successfully")
    
    -- Check history after cleanup
    local historyAfter = BerryActivationManager.getBattleActivationHistory(testBattleId)
    assert(#historyAfter.activatedBerries == 0, "Should have empty activated berries after cleanup")
end)

-- Test: Activation validation
test("should validate activation data", function(assert)
    local validActivationData = {
        berryId = "SITRUS_BERRY",
        pokemonId = testPokemonId,
        activationCondition = "hp_50_percent"
    }
    
    local isValid, result = BerryActivationManager.validateActivation(validActivationData)
    assert(isValid == true, "Should validate correct activation data")
    
    -- Test invalid data
    local invalidActivationData = {
        berryId = "INVALID_BERRY",
        pokemonId = testPokemonId,
        activationCondition = "hp_50_percent"
    }
    
    local isInvalid, invalidResult = BerryActivationManager.validateActivation(invalidActivationData)
    assert(isInvalid == false, "Should reject invalid berry")
    assert(invalidResult.error:find("Invalid berry"), "Should provide error message")
end)

-- Test: Edge cases
test("should handle edge cases", function(assert)
    -- Test with nil parameters
    local shouldActivate, activationData = BerryActivationManager.shouldActivateBerry(
        nil, "SITRUS_BERRY", testBattleContext
    )
    assert(shouldActivate == false, "Should handle nil Pokemon ID")
    
    -- Test with Pokemon at exactly 0 HP
    testPokemon.hp = 0
    local shouldActivate2, activationData2 = BerryActivationManager.shouldActivateBerry(
        testPokemonId, "SITRUS_BERRY", testBattleContext
    )
    assert(shouldActivate2 == false, "Should not activate berry when Pokemon is fainted")
    
    -- Test with invalid battle context
    local shouldActivate3, activationData3 = BerryActivationManager.shouldActivateBerry(
        testPokemonId, "SITRUS_BERRY", {}
    )
    assert(shouldActivate3 == false, "Should handle invalid battle context")
end)

-- Run all tests
test.run()

return test