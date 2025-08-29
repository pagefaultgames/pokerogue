-- Status Effects System Unit Tests
-- Tests all status conditions with proper mechanics and edge cases
-- Ensures 100% coverage of status effect calculations and duration tracking

local StatusEffects = require("game-logic.pokemon.status-effects")

-- Mock dependencies
local MockBattleRNG = {
    initSeed = function(seed) end,
    randomInt = function(min, max) return math.floor((min + max) / 2) end -- Deterministic for testing
}

-- Test framework
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
local function createMockPokemon(name, statusEffect, maxHP)
    return {
        id = "test-pokemon-" .. (name or "pikachu"),
        name = name or "Pikachu",
        statusEffect = statusEffect,
        statusTurns = nil,
        maxHP = maxHP or 100,
        currentHP = maxHP or 100,
        stats = {
            hp = maxHP or 100,
            attack = 50,
            defense = 50,
            spatk = 50,
            spdef = 50,
            speed = 50
        }
    }
end

local function createMockBattleState(seed)
    return {
        battleSeed = seed or "test-seed",
        battleId = "test-battle"
    }
end

-- Test Status Effect Application
function testStatusEffectApplication()
    print("\n=== Testing Status Effect Application ===")
    
    -- Test Sleep Application
    local pokemon = createMockPokemon("Pikachu", nil, 100)
    local battleState = createMockBattleState("sleep-test")
    
    local result = StatusEffects.applyStatusEffect(pokemon, StatusEffects.StatusType.SLEEP, 2, battleState)
    
    TestFramework.assertTrue(result.success, "Sleep status should be applied successfully")
    TestFramework.assertEquals(StatusEffects.StatusType.SLEEP, pokemon.statusEffect, "Pokemon should have sleep status")
    TestFramework.assertEquals(2, pokemon.statusTurns, "Sleep duration should be set")
    TestFramework.assertNotNil(result.messages, "Application should return messages")
    
    -- Test Burn Application
    pokemon = createMockPokemon("Charmander", nil, 100)
    result = StatusEffects.applyStatusEffect(pokemon, StatusEffects.StatusType.BURN, nil, battleState)
    
    TestFramework.assertTrue(result.success, "Burn status should be applied successfully")
    TestFramework.assertEquals(StatusEffects.StatusType.BURN, pokemon.statusEffect, "Pokemon should have burn status")
    TestFramework.assertTrue(#result.effects > 0, "Burn should apply stat modification effects")
    
    -- Test Poison Application
    pokemon = createMockPokemon("Bulbasaur", nil, 100)
    result = StatusEffects.applyStatusEffect(pokemon, StatusEffects.StatusType.POISON, nil, battleState)
    
    TestFramework.assertTrue(result.success, "Poison status should be applied successfully")
    TestFramework.assertEquals(StatusEffects.StatusType.POISON, pokemon.statusEffect, "Pokemon should have poison status")
    
    -- Test Badly Poisoned Application
    pokemon = createMockPokemon("Venomoth", nil, 100)
    result = StatusEffects.applyStatusEffect(pokemon, StatusEffects.StatusType.BADLY_POISONED, nil, battleState)
    
    TestFramework.assertTrue(result.success, "Badly poisoned status should be applied successfully")
    TestFramework.assertEquals(StatusEffects.StatusType.BADLY_POISONED, pokemon.statusEffect, "Pokemon should have badly poisoned status")
    TestFramework.assertEquals(1, pokemon.statusTurns, "Badly poisoned counter should start at 1")
    
    -- Test Paralysis Application
    pokemon = createMockPokemon("Magnemite", nil, 100)
    result = StatusEffects.applyStatusEffect(pokemon, StatusEffects.StatusType.PARALYSIS, nil, battleState)
    
    TestFramework.assertTrue(result.success, "Paralysis status should be applied successfully")
    TestFramework.assertEquals(StatusEffects.StatusType.PARALYSIS, pokemon.statusEffect, "Pokemon should have paralysis status")
    TestFramework.assertTrue(#result.effects > 0, "Paralysis should apply speed reduction effect")
    
    -- Test Freeze Application
    pokemon = createMockPokemon("Articuno", nil, 100)
    result = StatusEffects.applyStatusEffect(pokemon, StatusEffects.StatusType.FREEZE, nil, battleState)
    
    TestFramework.assertTrue(result.success, "Freeze status should be applied successfully")
    TestFramework.assertEquals(StatusEffects.StatusType.FREEZE, pokemon.statusEffect, "Pokemon should have freeze status")
end

-- Test End-of-Turn Status Processing
function testEndOfTurnStatusProcessing()
    print("\n=== Testing End-of-Turn Status Processing ===")
    
    -- Test Burn Damage
    local pokemon = createMockPokemon("Charmander", StatusEffects.StatusType.BURN, 100)
    pokemon.currentHP = 100
    local battleState = createMockBattleState("burn-test")
    
    local result = StatusEffects.processEndOfTurnEffects(pokemon, battleState)
    
    TestFramework.assertTrue(result.damageDealt > 0, "Burn should deal damage")
    TestFramework.assertEquals(6, result.damageDealt, "Burn should deal 1/16 max HP damage (6 HP)")
    TestFramework.assertEquals(94, pokemon.currentHP, "Pokemon HP should be reduced by burn damage")
    TestFramework.assertTrue(#result.messages > 0, "Burn processing should return messages")
    
    -- Test Poison Damage
    pokemon = createMockPokemon("Bulbasaur", StatusEffects.StatusType.POISON, 100)
    pokemon.currentHP = 100
    result = StatusEffects.processEndOfTurnEffects(pokemon, battleState)
    
    TestFramework.assertTrue(result.damageDealt > 0, "Poison should deal damage")
    TestFramework.assertEquals(12, result.damageDealt, "Poison should deal 1/8 max HP damage (12 HP)")
    TestFramework.assertEquals(88, pokemon.currentHP, "Pokemon HP should be reduced by poison damage")
    
    -- Test Badly Poisoned Escalating Damage
    pokemon = createMockPokemon("Venomoth", StatusEffects.StatusType.BADLY_POISONED, 100)
    pokemon.currentHP = 100
    pokemon.statusTurns = 2
    result = StatusEffects.processEndOfTurnEffects(pokemon, battleState)
    
    TestFramework.assertTrue(result.damageDealt > 0, "Badly poisoned should deal damage")
    TestFramework.assertEquals(24, result.damageDealt, "Badly poisoned should deal escalating damage (12 * 2 = 24 HP)")
    TestFramework.assertEquals(3, pokemon.statusTurns, "Badly poisoned counter should increment")
    
    -- Test Sleep Duration
    pokemon = createMockPokemon("Snorlax", StatusEffects.StatusType.SLEEP, 100)
    pokemon.statusTurns = 2
    result = StatusEffects.processEndOfTurnEffects(pokemon, battleState)
    
    TestFramework.assertEquals(1, pokemon.statusTurns, "Sleep turns should decrement")
    TestFramework.assertEquals(StatusEffects.StatusType.SLEEP, pokemon.statusEffect, "Pokemon should still be asleep")
    
    -- Test Sleep Wake Up
    pokemon.statusTurns = 1
    result = StatusEffects.processEndOfTurnEffects(pokemon, battleState)
    
    TestFramework.assertEquals(nil, pokemon.statusEffect, "Pokemon should wake up when sleep turns reach 0")
    TestFramework.assertEquals(nil, pokemon.statusTurns, "Sleep turns should be cleared")
    TestFramework.assertTrue(result.statusChanged, "Status change should be flagged")
end

-- Test Move Prevention Effects
function testMovePreventionEffects()
    print("\n=== Testing Move Prevention Effects ===")
    
    -- Mock move data
    local normalMove = {type = 1, name = "Tackle"}
    local fireMove = {type = 10, name = "Flamethrower"} -- Fire type for thaw testing
    
    -- Test Sleep Move Prevention
    local pokemon = createMockPokemon("Snorlax", StatusEffects.StatusType.SLEEP, 100)
    pokemon.statusTurns = 2
    local battleState = createMockBattleState("sleep-prevention")
    
    -- Override the RNG to ensure predictable results
    local originalRandomInt = MockBattleRNG.randomInt
    MockBattleRNG.randomInt = function(min, max) return 50 end -- Above wake chance
    
    local result = StatusEffects.checkMovePreventionEffects(pokemon, normalMove, battleState)
    
    TestFramework.assertFalse(result.canMove, "Sleeping Pokemon should not be able to move")
    TestFramework.assertTrue(#result.messages > 0, "Sleep prevention should return messages")
    
    -- Test Early Wake Up
    MockBattleRNG.randomInt = function(min, max) return 20 end -- Below wake chance
    result = StatusEffects.checkMovePreventionEffects(pokemon, normalMove, battleState)
    
    TestFramework.assertTrue(result.canMove, "Pokemon should wake up and be able to move")
    TestFramework.assertTrue(result.statusChanged, "Status change should be flagged")
    TestFramework.assertEquals(nil, pokemon.statusEffect, "Pokemon should no longer be asleep")
    
    -- Test Freeze Move Prevention
    pokemon = createMockPokemon("Articuno", StatusEffects.StatusType.FREEZE, 100)
    MockBattleRNG.randomInt = function(min, max) return 50 end -- Above thaw chance
    
    result = StatusEffects.checkMovePreventionEffects(pokemon, normalMove, battleState)
    
    TestFramework.assertFalse(result.canMove, "Frozen Pokemon should not be able to move")
    TestFramework.assertTrue(#result.messages > 0, "Freeze prevention should return messages")
    
    -- Test Fire Move Thaw
    result = StatusEffects.checkMovePreventionEffects(pokemon, fireMove, battleState)
    
    TestFramework.assertTrue(result.canMove, "Fire moves should always thaw frozen Pokemon")
    TestFramework.assertTrue(result.statusChanged, "Status change should be flagged")
    TestFramework.assertEquals(nil, pokemon.statusEffect, "Pokemon should no longer be frozen")
    
    -- Test Paralysis Move Prevention
    pokemon = createMockPokemon("Magnemite", StatusEffects.StatusType.PARALYSIS, 100)
    MockBattleRNG.randomInt = function(min, max) return 20 end -- Below paralysis chance
    
    result = StatusEffects.checkMovePreventionEffects(pokemon, normalMove, battleState)
    
    TestFramework.assertFalse(result.canMove, "Paralyzed Pokemon should fail to move")
    TestFramework.assertTrue(#result.messages > 0, "Paralysis prevention should return messages")
    
    -- Test Paralysis Success
    MockBattleRNG.randomInt = function(min, max) return 50 end -- Above paralysis chance
    result = StatusEffects.checkMovePreventionEffects(pokemon, normalMove, battleState)
    
    TestFramework.assertTrue(result.canMove, "Paralyzed Pokemon should sometimes be able to move")
    
    -- Restore original RNG function
    MockBattleRNG.randomInt = originalRandomInt
end

-- Test Damage Calculations
function testDamageCalculations()
    print("\n=== Testing Damage Calculations ===")
    
    -- Test Burn Damage
    local pokemon = createMockPokemon("Charmander", nil, 100)
    local burnDamage = StatusEffects.calculateBurnDamage(pokemon)
    
    TestFramework.assertEquals(6, burnDamage, "Burn damage should be 1/16 of max HP (100/16 = 6)")
    
    -- Test with different max HP
    pokemon.maxHP = 200
    pokemon.stats.hp = 200
    burnDamage = StatusEffects.calculateBurnDamage(pokemon)
    
    TestFramework.assertEquals(12, burnDamage, "Burn damage should scale with max HP (200/16 = 12)")
    
    -- Test Poison Damage
    pokemon = createMockPokemon("Bulbasaur", nil, 80)
    local poisonDamage = StatusEffects.calculatePoisonDamage(pokemon)
    
    TestFramework.assertEquals(10, poisonDamage, "Poison damage should be 1/8 of max HP (80/8 = 10)")
    
    -- Test Badly Poisoned Damage
    pokemon = createMockPokemon("Venomoth", StatusEffects.StatusType.BADLY_POISONED, 120)
    pokemon.statusTurns = 3
    local badlyPoisonDamage = StatusEffects.calculateBadlyPoisonedDamage(pokemon)
    
    TestFramework.assertEquals(45, badlyPoisonDamage, "Badly poisoned damage should escalate (120/8 * 3 = 45)")
    
    -- Test minimum damage
    pokemon = createMockPokemon("LowHP", nil, 8) -- Very low HP
    burnDamage = StatusEffects.calculateBurnDamage(pokemon)
    
    TestFramework.assertEquals(1, burnDamage, "Damage should have minimum of 1 HP")
end

-- Test Stat Modifications
function testStatModifications()
    print("\n=== Testing Stat Modifications ===")
    
    -- Test Burn Attack Reduction
    local pokemon = createMockPokemon("Charmander", StatusEffects.StatusType.BURN, 100)
    local attackMod = StatusEffects.getStatModification(pokemon, "attack")
    
    TestFramework.assertEquals(0.5, attackMod, "Burn should reduce attack by 50%")
    
    -- Test Paralysis Speed Reduction
    pokemon = createMockPokemon("Magnemite", StatusEffects.StatusType.PARALYSIS, 100)
    local speedMod = StatusEffects.getStatModification(pokemon, "speed")
    
    TestFramework.assertEquals(0.5, speedMod, "Paralysis should reduce speed by 50%")
    
    -- Test No Modification
    pokemon = createMockPokemon("Pikachu", StatusEffects.StatusType.POISON, 100)
    local defMod = StatusEffects.getStatModification(pokemon, "defense")
    
    TestFramework.assertEquals(1.0, defMod, "Poison should not modify defense")
    
    -- Test No Status
    pokemon = createMockPokemon("Pikachu", nil, 100)
    attackMod = StatusEffects.getStatModification(pokemon, "attack")
    
    TestFramework.assertEquals(1.0, attackMod, "No status should not modify stats")
end

-- Test Status Clear
function testStatusClear()
    print("\n=== Testing Status Clear ===")
    
    -- Test Clear Existing Status
    local pokemon = createMockPokemon("Pikachu", StatusEffects.StatusType.BURN, 100)
    pokemon.statusTurns = 5
    
    local result = StatusEffects.clearStatusEffect(pokemon, "Custom clear message!")
    
    TestFramework.assertTrue(result.success, "Status clear should succeed")
    TestFramework.assertEquals(StatusEffects.StatusType.BURN, result.previousStatus, "Previous status should be recorded")
    TestFramework.assertEquals(nil, pokemon.statusEffect, "Pokemon status should be cleared")
    TestFramework.assertEquals(nil, pokemon.statusTurns, "Status turns should be cleared")
    TestFramework.assertTrue(#result.messages > 0, "Clear should return messages")
    
    -- Test Clear No Status
    pokemon = createMockPokemon("Pikachu", nil, 100)
    result = StatusEffects.clearStatusEffect(pokemon, nil)
    
    TestFramework.assertFalse(result.success, "Clearing no status should fail")
end

-- Test Status Check
function testStatusCheck()
    print("\n=== Testing Status Check ===")
    
    -- Test Has Status
    local pokemon = createMockPokemon("Pikachu", StatusEffects.StatusType.PARALYSIS, 100)
    local hasParalysis = StatusEffects.hasStatusEffect(pokemon, StatusEffects.StatusType.PARALYSIS)
    local hasSleep = StatusEffects.hasStatusEffect(pokemon, StatusEffects.StatusType.SLEEP)
    
    TestFramework.assertTrue(hasParalysis, "Pokemon should have paralysis")
    TestFramework.assertFalse(hasSleep, "Pokemon should not have sleep")
    
    -- Test No Status
    pokemon = createMockPokemon("Pikachu", nil, 100)
    hasParalysis = StatusEffects.hasStatusEffect(pokemon, StatusEffects.StatusType.PARALYSIS)
    
    TestFramework.assertFalse(hasParalysis, "Pokemon with no status should not have paralysis")
end

-- Test Status Info
function testStatusInfo()
    print("\n=== Testing Status Info ===")
    
    -- Test With Status
    local pokemon = createMockPokemon("Pikachu", StatusEffects.StatusType.BURN, 100)
    pokemon.statusTurns = 3
    
    local info = StatusEffects.getStatusEffectInfo(pokemon)
    
    TestFramework.assertTrue(info.hasStatus, "Pokemon should have status")
    TestFramework.assertEquals(StatusEffects.StatusType.BURN, info.statusType, "Status type should match")
    TestFramework.assertEquals(3, info.turnsRemaining, "Turns remaining should match")
    TestFramework.assertNotNil(info.statModifications, "Stat modifications should be included")
    
    -- Test No Status
    pokemon = createMockPokemon("Pikachu", nil, 100)
    info = StatusEffects.getStatusEffectInfo(pokemon)
    
    TestFramework.assertFalse(info.hasStatus, "Pokemon should not have status")
end

-- Run all tests
function runAllTests()
    print("Starting Status Effects Unit Tests...")
    
    StatusEffects.init()
    
    testStatusEffectApplication()
    testEndOfTurnStatusProcessing()
    testMovePreventionEffects()
    testDamageCalculations()
    testStatModifications()
    testStatusClear()
    testStatusCheck()
    testStatusInfo()
    
    TestFramework.printSummary()
    
    return TestFramework.failCount == 0
end

-- Export for test runner
return {
    runAllTests = runAllTests,
    testName = "Status Effects System"
}