-- Status Immunities System Unit Tests
-- Tests type-based and ability-based status immunities
-- Ensures immunity validation and prevention mechanisms work correctly

local StatusImmunities = require("game-logic.pokemon.status-immunities")
local StatusEffects = require("game-logic.pokemon.status-effects")

-- Mock Enums for testing
local MockEnums = {
    Type = {
        ELECTRIC = 13,
        FIRE = 10,
        ICE = 15,
        POISON = 4,
        STEEL = 9,
        FLYING = 3
    },
    Weather = {
        HARSH_SUNLIGHT = 1
    },
    Terrain = {
        ELECTRIC_TERRAIN = 1,
        MISTY_TERRAIN = 2
    }
}

-- Test framework (same as status-effects test)
local TestFramework = {
    testCount = 0,
    passCount = 0,
    failCount = 0,
    
    assertEquals = function(expected, actual, message)
        TestFramework.testCount = TestFramework.testCount + 1
        if expected == actual then
            TestFramework.passCount = TestFramework.passCount + 1
            print("✓ " .. (message or "Test passed"))
        else
            TestFramework.failCount = TestFramework.failCount + 1
            print("✗ " .. (message or "Test failed") .. " - Expected: " .. tostring(expected) .. ", Actual: " .. tostring(actual))
        end
    end,
    
    assertTrue = function(condition, message)
        TestFramework.assertEquals(true, condition, message)
    end,
    
    assertFalse = function(condition, message)
        TestFramework.assertEquals(false, condition, message)
    end,
    
    assertNotNil = function(value, message)
        TestFramework.testCount = TestFramework.testCount + 1
        if value ~= nil then
            TestFramework.passCount = TestFramework.passCount + 1
            print("✓ " .. (message or "Value is not nil"))
        else
            TestFramework.failCount = TestFramework.failCount + 1
            print("✗ " .. (message or "Value should not be nil"))
        end
    end,
    
    printSummary = function()
        print("\n=== Test Summary ===")
        print("Total: " .. TestFramework.testCount)
        print("Passed: " .. TestFramework.passCount)
        print("Failed: " .. TestFramework.failCount)
        if TestFramework.failCount == 0 then
            print("All tests passed! ✓")
        else
            print("Some tests failed! ✗")
        end
    end
}

-- Test helper functions
local function createMockPokemon(name, types, ability, heldItem)
    return {
        id = "test-pokemon-" .. (name or "pikachu"),
        name = name or "Pikachu",
        types = types or {MockEnums.Type.ELECTRIC},
        ability = ability,
        heldItem = heldItem,
        statusEffect = nil,
        maxHP = 100,
        currentHP = 100
    }
end

local function createMockBattleState(weather, terrain)
    return {
        battleId = "test-battle",
        battleSeed = "immunity-test",
        battleConditions = {
            weather = weather or 0,
            terrain = terrain or 0
        }
    }
end

-- Test Type-Based Immunities
function testTypeBasedImmunities()
    print("\n=== Testing Type-Based Immunities ===")
    
    -- Test Electric Type Paralysis Immunity
    local pokemon = createMockPokemon("Pikachu", {MockEnums.Type.ELECTRIC})
    local battleState = createMockBattleState()
    
    local immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.PARALYSIS, battleState)
    
    TestFramework.assertTrue(immunity.immune, "Electric types should be immune to paralysis")
    TestFramework.assertEquals("type", immunity.immunityType, "Immunity should be type-based")
    TestFramework.assertEquals(MockEnums.Type.ELECTRIC, immunity.immunitySource, "Source should be Electric type")
    TestFramework.assertNotNil(immunity.message, "Immunity should include message")
    
    -- Test Fire Type Burn and Freeze Immunity
    pokemon = createMockPokemon("Charmander", {MockEnums.Type.FIRE})
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.BURN, battleState)
    TestFramework.assertTrue(immunity.immune, "Fire types should be immune to burn")
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.FREEZE, battleState)
    TestFramework.assertTrue(immunity.immune, "Fire types should be immune to freeze")
    
    -- Test Ice Type Freeze Immunity
    pokemon = createMockPokemon("Articuno", {MockEnums.Type.ICE})
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.FREEZE, battleState)
    TestFramework.assertTrue(immunity.immune, "Ice types should be immune to freeze")
    
    -- Test Poison Type Poison Immunity
    pokemon = createMockPokemon("Venomoth", {MockEnums.Type.POISON})
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.POISON, battleState)
    TestFramework.assertTrue(immunity.immune, "Poison types should be immune to poison")
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.BADLY_POISONED, battleState)
    TestFramework.assertTrue(immunity.immune, "Poison types should be immune to badly poisoned")
    
    -- Test Steel Type Poison Immunity
    pokemon = createMockPokemon("Skarmory", {MockEnums.Type.STEEL})
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.POISON, battleState)
    TestFramework.assertTrue(immunity.immune, "Steel types should be immune to poison")
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.BADLY_POISONED, battleState)
    TestFramework.assertTrue(immunity.immune, "Steel types should be immune to badly poisoned")
    
    -- Test No Immunity
    pokemon = createMockPokemon("Pikachu", {MockEnums.Type.ELECTRIC})
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.BURN, battleState)
    TestFramework.assertFalse(immunity.immune, "Electric types should not be immune to burn")
end

-- Test Ability-Based Immunities
function testAbilityBasedImmunities()
    print("\n=== Testing Ability-Based Immunities ===")
    
    -- Test Limber (Paralysis Immunity)
    local pokemon = createMockPokemon("Persian", {1}, 7) -- Limber ability
    local battleState = createMockBattleState()
    
    local immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.PARALYSIS, battleState)
    
    TestFramework.assertTrue(immunity.immune, "Limber should provide paralysis immunity")
    TestFramework.assertEquals("ability", immunity.immunityType, "Immunity should be ability-based")
    TestFramework.assertEquals(7, immunity.immunitySource, "Source should be Limber ability")
    
    -- Test Insomnia (Sleep Immunity)
    pokemon = createMockPokemon("Noctowl", {1}, 15) -- Insomnia ability
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.SLEEP, battleState)
    TestFramework.assertTrue(immunity.immune, "Insomnia should provide sleep immunity")
    
    -- Test Vital Spirit (Sleep Immunity)
    pokemon = createMockPokemon("Mankey", {1}, 72) -- Vital Spirit ability
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.SLEEP, battleState)
    TestFramework.assertTrue(immunity.immune, "Vital Spirit should provide sleep immunity")
    
    -- Test Immunity (Poison Immunity)
    pokemon = createMockPokemon("Zangoose", {1}, 17) -- Immunity ability
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.POISON, battleState)
    TestFramework.assertTrue(immunity.immune, "Immunity ability should provide poison immunity")
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.BADLY_POISONED, battleState)
    TestFramework.assertTrue(immunity.immune, "Immunity ability should provide badly poisoned immunity")
    
    -- Test Water Veil (Burn Immunity)
    pokemon = createMockPokemon("Goldeen", {11}, 41) -- Water Veil ability
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.BURN, battleState)
    TestFramework.assertTrue(immunity.immune, "Water Veil should provide burn immunity")
    
    -- Test Magma Armor (Freeze Immunity)
    pokemon = createMockPokemon("Slugma", {MockEnums.Type.FIRE}, 40) -- Magma Armor ability
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.FREEZE, battleState)
    TestFramework.assertTrue(immunity.immune, "Magma Armor should provide freeze immunity")
    
    -- Test No Immunity
    pokemon = createMockPokemon("Pikachu", {MockEnums.Type.ELECTRIC}, 9) -- Static ability (non-immunity)
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.BURN, battleState)
    TestFramework.assertFalse(immunity.immune, "Non-immunity abilities should not provide immunity")
end

-- Test Conditional Immunities
function testConditionalImmunities()
    print("\n=== Testing Conditional Immunities ===")
    
    -- Test Leaf Guard in Harsh Sunlight
    local pokemon = createMockPokemon("Leafeon", {12}, 119) -- Leaf Guard ability
    local battleState = createMockBattleState(MockEnums.Weather.HARSH_SUNLIGHT)
    
    local immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.SLEEP, battleState)
    TestFramework.assertTrue(immunity.immune, "Leaf Guard should provide immunity in harsh sunlight")
    TestFramework.assertEquals("conditional", immunity.immunityType, "Immunity should be conditional")
    
    -- Test Leaf Guard without Harsh Sunlight
    battleState = createMockBattleState(0) -- No weather
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.SLEEP, battleState)
    TestFramework.assertFalse(immunity.immune, "Leaf Guard should not provide immunity without harsh sunlight")
end

-- Test Terrain Immunities  
function testTerrainImmunities()
    print("\n=== Testing Terrain Immunities ===")
    
    -- Test Electric Terrain Sleep Immunity (grounded Pokemon)
    local pokemon = createMockPokemon("Pikachu", {MockEnums.Type.ELECTRIC}) -- Grounded
    local battleState = createMockBattleState(0, MockEnums.Terrain.ELECTRIC_TERRAIN)
    
    local immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.SLEEP, battleState)
    TestFramework.assertTrue(immunity.immune, "Electric Terrain should prevent sleep for grounded Pokemon")
    TestFramework.assertEquals("conditional", immunity.immunityType, "Immunity should be conditional")
    
    -- Test Electric Terrain No Immunity (Flying Pokemon)
    pokemon = createMockPokemon("Crobat", {MockEnums.Type.POISON, MockEnums.Type.FLYING}) -- Flying type
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.SLEEP, battleState)
    TestFramework.assertFalse(immunity.immune, "Electric Terrain should not prevent sleep for flying Pokemon")
    
    -- Test Misty Terrain Status Immunity (grounded Pokemon)
    pokemon = createMockPokemon("Clefairy", {18}) -- Grounded
    battleState = createMockBattleState(0, MockEnums.Terrain.MISTY_TERRAIN)
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.BURN, battleState)
    TestFramework.assertTrue(immunity.immune, "Misty Terrain should prevent status conditions for grounded Pokemon")
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.PARALYSIS, battleState)
    TestFramework.assertTrue(immunity.immune, "Misty Terrain should prevent paralysis for grounded Pokemon")
    
    -- Test Misty Terrain No Immunity (Flying Pokemon)
    pokemon = createMockPokemon("Charizard", {MockEnums.Type.FIRE, MockEnums.Type.FLYING}) -- Flying type
    
    immunity = StatusImmunities.checkStatusImmunity(pokemon, StatusEffects.StatusType.BURN, battleState)
    TestFramework.assertFalse(immunity.immune, "Misty Terrain should not prevent status for flying Pokemon")
end

-- Test Grounded Check
function testGroundedCheck()
    print("\n=== Testing Grounded Check ===")
    
    -- Test Grounded Pokemon
    local pokemon = createMockPokemon("Pikachu", {MockEnums.Type.ELECTRIC})
    local isGrounded = StatusImmunities.isPokemonGrounded(pokemon)
    
    TestFramework.assertTrue(isGrounded, "Non-flying Pokemon should be grounded")
    
    -- Test Flying Pokemon
    pokemon = createMockPokemon("Pidgey", {1, MockEnums.Type.FLYING})
    isGrounded = StatusImmunities.isPokemonGrounded(pokemon)
    
    TestFramework.assertFalse(isGrounded, "Flying-type Pokemon should not be grounded")
    
    -- Test Levitate Ability
    pokemon = createMockPokemon("Gengar", {7, 8}, 26) -- Levitate ability
    isGrounded = StatusImmunities.isPokemonGrounded(pokemon)
    
    TestFramework.assertFalse(isGrounded, "Pokemon with Levitate should not be grounded")
    
    -- Test Air Balloon
    pokemon = createMockPokemon("Electrode", {MockEnums.Type.ELECTRIC}, nil, 541) -- Air Balloon item
    isGrounded = StatusImmunities.isPokemonGrounded(pokemon)
    
    TestFramework.assertFalse(isGrounded, "Pokemon with Air Balloon should not be grounded")
end

-- Test Immunity Bypass
function testImmunityBypass()
    print("\n=== Testing Immunity Bypass ===")
    
    -- Test Mold Breaker Bypass
    local pokemon = createMockPokemon("Noctowl", {1}, 15) -- Insomnia ability
    local battleState = createMockBattleState()
    
    local bypassMethod = {
        type = "ability",
        source = 104 -- Mold Breaker
    }
    
    local bypass = StatusImmunities.checkImmunityBypass(pokemon, StatusEffects.StatusType.SLEEP, bypassMethod, battleState)
    TestFramework.assertTrue(bypass.canBypass, "Mold Breaker should bypass ability-based immunities")
    
    -- Test No Bypass for Type Immunity
    pokemon = createMockPokemon("Pikachu", {MockEnums.Type.ELECTRIC})
    
    bypass = StatusImmunities.checkImmunityBypass(pokemon, StatusEffects.StatusType.PARALYSIS, bypassMethod, battleState)
    TestFramework.assertFalse(bypass.canBypass, "Mold Breaker should not bypass type-based immunities")
    
    -- Test Corrosive Move Bypass
    pokemon = createMockPokemon("Skarmory", {MockEnums.Type.STEEL})
    bypassMethod = {
        type = "move",
        corrosive = true
    }
    
    bypass = StatusImmunities.checkImmunityBypass(pokemon, StatusEffects.StatusType.POISON, bypassMethod, battleState)
    TestFramework.assertTrue(bypass.canBypass, "Corrosive moves should bypass Steel-type poison immunity")
end

-- Test Full Status Application Validation
function testStatusApplicationValidation()
    print("\n=== Testing Status Application Validation ===")
    
    -- Test Valid Application
    local pokemon = createMockPokemon("Pikachu", {MockEnums.Type.ELECTRIC})
    local battleState = createMockBattleState()
    
    local validation = StatusImmunities.validateStatusApplication(pokemon, StatusEffects.StatusType.BURN, battleState)
    
    TestFramework.assertTrue(validation.valid, "Valid status application should succeed")
    TestFramework.assertFalse(validation.blocked, "Valid application should not be blocked")
    
    -- Test Blocked Application
    validation = StatusImmunities.validateStatusApplication(pokemon, StatusEffects.StatusType.PARALYSIS, battleState)
    
    TestFramework.assertFalse(validation.valid, "Immune status application should fail")
    TestFramework.assertTrue(validation.blocked, "Immune application should be blocked")
    TestFramework.assertEquals("type", validation.immunityType, "Block reason should be recorded")
    
    -- Test Bypassed Application
    local bypassMethod = {
        type = "move",
        ignoreType = true
    }
    
    validation = StatusImmunities.validateStatusApplication(pokemon, StatusEffects.StatusType.PARALYSIS, battleState, bypassMethod)
    TestFramework.assertTrue(validation.valid, "Bypassed application should succeed")
    TestFramework.assertTrue(validation.bypassUsed, "Bypass usage should be recorded")
end

-- Test Pokemon Immunity Info
function testPokemonImmunityInfo()
    print("\n=== Testing Pokemon Immunity Info ===")
    
    -- Test Multi-Immunity Pokemon
    local pokemon = createMockPokemon("Magnezone", {MockEnums.Type.ELECTRIC, MockEnums.Type.STEEL}, 7) -- Limber + Steel/Electric types
    local battleState = createMockBattleState()
    
    local info = StatusImmunities.getPokemonImmunityInfo(pokemon, battleState)
    
    TestFramework.assertTrue(info.hasImmunities, "Multi-immunity Pokemon should have immunities")
    TestFramework.assertTrue(#info.typeImmunities > 0, "Should have type immunities")
    TestFramework.assertTrue(#info.abilityImmunities > 0, "Should have ability immunities")
    TestFramework.assertTrue(#info.activeImmunities > 0, "Should have active immunities list")
    
    -- Test No Immunity Pokemon
    pokemon = createMockPokemon("Caterpie", {7}, 19) -- Bug type, Shield Dust ability (non-immunity)
    
    info = StatusImmunities.getPokemonImmunityInfo(pokemon, battleState)
    TestFramework.assertFalse(info.hasImmunities, "Non-immune Pokemon should have no immunities")
end

-- Run all tests
function runAllTests()
    print("Starting Status Immunities Unit Tests...")
    
    StatusImmunities.init()
    
    testTypeBasedImmunities()
    testAbilityBasedImmunities()
    testConditionalImmunities()
    testTerrainImmunities()
    testGroundedCheck()
    testImmunityBypass()
    testStatusApplicationValidation()
    testPokemonImmunityInfo()
    
    TestFramework.printSummary()
    
    return TestFramework.failCount == 0
end

-- Export for test runner
return {
    runAllTests = runAllTests,
    testName = "Status Immunities System"
}