--[[
Unit Tests for Friendship System
Tests all friendship calculations, gain/loss mechanics, and battle bonuses

Test Coverage:
- Friendship initialization and validation
- Friendship gain from battles, leveling, and items
- Friendship loss from fainting and bitter items
- Battle bonuses (critical hits, status cure, evasion, survival)
- Friendship evolution requirement checking
- Return/Frustration move power calculation
- Item integration and effects
--]]

-- Mock dependencies for isolated unit testing
local mockCryptoRNG = {
    initBattleRNG = function(seed) end,
    initGlobalRNG = function(seed) end,
    battleRandom = function() return 0.05 end,  -- 5% roll - will trigger all bonuses
    globalRandomInt = function(min, max) return math.floor((min + max) / 2) end
}

-- Make sure the mock is properly exposed
mockCryptoRNG.battleRandom = mockCryptoRNG.battleRandom

local mockSpeciesDatabase = {
    init = function() end,
    getSpecies = function(speciesId)
        local mockSpecies = {
            [1] = {baseFriendship = 50},   -- Bulbasaur
            [25] = {baseFriendship = 50},  -- Pikachu  
            [133] = {baseFriendship = 70}, -- Eevee
        }
        return mockSpecies[speciesId]
    end
}

local mockItemDatabase = {
    getItem = function(itemId)
        if itemId == "SOOTHE_BELL" then
            return {friendshipBoostMultiplier = 2.0}
        elseif itemId == "REVIVAL_HERB" then
            return {isBitter = true}
        end
        return nil
    end,
    isFriendshipBoostingItem = function(itemId)
        return itemId == "SOOTHE_BELL"
    end
}

-- Replace actual dependencies with mocks
package.loaded["game-logic.rng.crypto-rng"] = mockCryptoRNG
package.loaded["data.species.species-database"] = mockSpeciesDatabase
package.loaded["data.items.item-database"] = mockItemDatabase

-- Load the system under test
local FriendshipSystem = require("game-logic.pokemon.friendship-system")

-- Test framework utilities
local TestResults = {
    passed = 0,
    failed = 0,
    errors = {}
}

local function assertEquals(expected, actual, testName)
    if expected == actual then
        TestResults.passed = TestResults.passed + 1
        print("✓ PASS: " .. testName)
    else
        TestResults.failed = TestResults.failed + 1
        local error = testName .. " - Expected: " .. tostring(expected) .. ", Got: " .. tostring(actual)
        table.insert(TestResults.errors, error)
        print("✗ FAIL: " .. error)
    end
end

local function assertTrue(condition, testName)
    assertEquals(true, condition, testName)
end

local function assertFalse(condition, testName)
    assertEquals(false, condition, testName)
end

local function assertNotNil(value, testName)
    if value ~= nil then
        TestResults.passed = TestResults.passed + 1
        print("✓ PASS: " .. testName)
    else
        TestResults.failed = TestResults.failed + 1
        local error = testName .. " - Expected non-nil value"
        table.insert(TestResults.errors, error)
        print("✗ FAIL: " .. error)
    end
end

-- Test helper to create mock Pokemon
local function createMockPokemon(friendship, level, speciesId, statusEffect)
    return {
        friendship = friendship or 50,
        level = level or 10,
        speciesId = speciesId or 1,
        statusEffect = statusEffect,
        stats = {hp = 100}
    }
end

print("=== Starting Friendship System Unit Tests ===\n")

-- Test Group 1: Friendship Initialization
print("--- Test Group 1: Friendship Initialization ---")

do
    local pokemon = {}
    local friendship = FriendshipSystem.initializeFriendship(pokemon, false, 1)
    assertEquals(50, friendship, "Default friendship initialization")
    assertEquals(50, pokemon.friendship, "Pokemon friendship value set correctly")
end

do
    local pokemon = {}
    local friendship = FriendshipSystem.initializeFriendship(pokemon, true, 1)
    assertEquals(120, friendship, "Traded Pokemon higher friendship")
end

do
    local pokemon = {}
    local friendship = FriendshipSystem.initializeFriendship(pokemon, false, 133)
    assertEquals(70, friendship, "Species base friendship (Eevee)")
end

-- Test Group 2: Friendship Gain Rate Calculation
print("\n--- Test Group 2: Friendship Gain Rate Calculation ---")

do
    local rate = FriendshipSystem.getFriendshipGainRate(50, "BATTLE_PARTICIPATION")
    assertEquals(5, rate, "Battle gain rate at low friendship (50)")
end

do
    local rate = FriendshipSystem.getFriendshipGainRate(150, "BATTLE_PARTICIPATION")
    assertEquals(3, rate, "Battle gain rate at medium friendship (150)")
end

do
    local rate = FriendshipSystem.getFriendshipGainRate(220, "BATTLE_PARTICIPATION")
    assertEquals(2, rate, "Battle gain rate at high friendship (220)")
end

do
    local rate = FriendshipSystem.getFriendshipGainRate(50, "BERRY_USE")
    assertEquals(10, rate, "Berry gain rate at low friendship (50)")
end

do
    local rate = FriendshipSystem.getFriendshipGainRate(50, "INVALID_TYPE")
    assertEquals(0, rate, "Invalid action type returns 0")
end

-- Test Group 3: Friendship Loss Rate Calculation
print("\n--- Test Group 3: Friendship Loss Rate Calculation ---")

do
    local rate = FriendshipSystem.getFriendshipLossRate(50, "FAINTING")
    assertEquals(-1, rate, "Fainting loss rate at low friendship (50)")
end

do
    local rate = FriendshipSystem.getFriendshipLossRate(150, "FAINTING")
    assertEquals(-5, rate, "Fainting loss rate at medium friendship (150)")
end

do
    local rate = FriendshipSystem.getFriendshipLossRate(220, "FAINTING")
    assertEquals(-10, rate, "Fainting loss rate at high friendship (220)")
end

do
    local rate = FriendshipSystem.getFriendshipLossRate(150, "BITTER_ITEM")
    assertEquals(-5, rate, "Bitter item loss rate at medium friendship")
end

-- Test Group 4: Friendship Change Application
print("\n--- Test Group 4: Friendship Change Application ---")

do
    local pokemon = createMockPokemon(100)
    local newFriendship, actualChange = FriendshipSystem.applyFriendshipChange(pokemon, 50)
    assertEquals(150, newFriendship, "Friendship increased correctly")
    assertEquals(50, actualChange, "Actual change matches expected")
    assertEquals(150, pokemon.friendship, "Pokemon friendship updated")
end

do
    local pokemon = createMockPokemon(200)
    local newFriendship, actualChange = FriendshipSystem.applyFriendshipChange(pokemon, 100)
    assertEquals(255, newFriendship, "Friendship capped at maximum (255)")
    assertEquals(55, actualChange, "Actual change reflects cap")
end

do
    local pokemon = createMockPokemon(50)
    local newFriendship, actualChange = FriendshipSystem.applyFriendshipChange(pokemon, -100)
    assertEquals(0, newFriendship, "Friendship floored at minimum (0)")
    assertEquals(-50, actualChange, "Actual change reflects floor")
end

-- Test Group 5: Battle Friendship Gain
print("\n--- Test Group 5: Battle Friendship Gain ---")

do
    local pokemon = createMockPokemon(100)
    local battleContext = {battleType = "wild"}
    local gain = FriendshipSystem.processBattleFriendshipGain(pokemon, battleContext)
    assertEquals(3, gain, "Wild battle friendship gain at medium friendship")
end

do
    local pokemon = createMockPokemon(100)
    local battleContext = {battleType = "trainer"}
    local gain = FriendshipSystem.processBattleFriendshipGain(pokemon, battleContext)
    assertEquals(4, gain, "Trainer battle friendship gain (1.5x wild)")  -- 3 * 1.5 = 4.5, floored to 4
end

do
    local pokemon = createMockPokemon(100)
    pokemon.caughtInLuxuryBall = true
    local gain = FriendshipSystem.processBattleFriendshipGain(pokemon, {})
    assertEquals(6, gain, "Luxury Ball doubles friendship gain")
end

-- Test Group 6: Level Up Friendship Gain
print("\n--- Test Group 6: Level Up Friendship Gain ---")

do
    local pokemon = createMockPokemon(100, 20)
    local gain = FriendshipSystem.processLevelUpFriendshipGain(pokemon)
    assertEquals(3, gain, "Level up friendship gain at medium friendship")
end

do
    local pokemon = createMockPokemon(50, 20)
    pokemon.caughtInLuxuryBall = true
    local gain = FriendshipSystem.processLevelUpFriendshipGain(pokemon)
    assertEquals(10, gain, "Luxury Ball doubles level up friendship gain")  -- 5 * 2 = 10
end

-- Test Group 7: Item Friendship Gain
print("\n--- Test Group 7: Item Friendship Gain ---")

do
    local pokemon = createMockPokemon(100)
    local gain = FriendshipSystem.processItemFriendshipGain(pokemon, "VITAMIN")
    assertEquals(3, gain, "Vitamin friendship gain at medium friendship")
end

do
    local pokemon = createMockPokemon(50)
    local gain = FriendshipSystem.processItemFriendshipGain(pokemon, "BERRY")
    assertEquals(10, gain, "Berry friendship gain at low friendship")
end

do
    local pokemon = createMockPokemon(100)
    local gain = FriendshipSystem.processItemFriendshipGain(pokemon, "MASSAGE")
    assertEquals(20, gain, "Massage friendship gain at medium friendship")
end

-- Test Group 8: Fainting Friendship Loss
print("\n--- Test Group 8: Fainting Friendship Loss ---")

do
    local pokemon = createMockPokemon(150, 25)
    local battleContext = {battleType = "wild"}
    local loss = FriendshipSystem.processFaintingFriendshipLoss(pokemon, battleContext)
    assertEquals(-5, loss, "Wild battle fainting loss at medium friendship")
end

do
    local pokemon = createMockPokemon(150, 25)
    local battleContext = {battleType = "gym"}
    local loss = FriendshipSystem.processFaintingFriendshipLoss(pokemon, battleContext)
    assertEquals(-8, loss, "Gym battle increased fainting loss")  -- -5 * 1.5 = -7.5, floored to -8
end

do
    local pokemon = createMockPokemon(150, 55)
    local battleContext = {battleType = "wild"}
    local loss = FriendshipSystem.processFaintingFriendshipLoss(pokemon, battleContext)
    assertEquals(-4, loss, "High level reduces fainting loss")  -- -5 * 0.8 = -4
end

-- Test Group 9: Bitter Item Friendship Loss
print("\n--- Test Group 9: Bitter Item Friendship Loss ---")

do
    local pokemon = createMockPokemon(150)
    local loss = FriendshipSystem.processBitterItemFriendshipLoss(pokemon, "REVIVAL_HERB")
    assertEquals(-5, loss, "Revival Herb friendship loss")
end

do
    local pokemon = createMockPokemon(150)
    local loss = FriendshipSystem.processBitterItemFriendshipLoss(pokemon, "ENERGY_ROOT")
    assertEquals(-5, loss, "Energy Root friendship loss")
end

do
    local pokemon = createMockPokemon(150)
    local loss = FriendshipSystem.processBitterItemFriendshipLoss(pokemon, "POTION")
    assertEquals(0, loss, "Non-bitter item no friendship loss")
end

-- Test Group 10: High Friendship Detection
print("\n--- Test Group 10: High Friendship Detection ---")

do
    local pokemon = createMockPokemon(219)
    local isHigh = FriendshipSystem.hasHighFriendship(pokemon)
    assertFalse(isHigh, "Friendship 219 not high enough for bonuses")
end

do
    local pokemon = createMockPokemon(220)
    local isHigh = FriendshipSystem.hasHighFriendship(pokemon)
    assertTrue(isHigh, "Friendship 220 qualifies for bonuses")
end

do
    local pokemon = createMockPokemon(255)
    local isHigh = FriendshipSystem.hasHighFriendship(pokemon)
    assertTrue(isHigh, "Maximum friendship qualifies for bonuses")
end

-- Test Group 11: Friendship Battle Bonuses
print("\n--- Test Group 11: Friendship Battle Bonuses ---")

do
    local pokemon = createMockPokemon(240)
    local bonus = FriendshipSystem.calculateFriendshipCriticalHitBonus(pokemon, "test_seed")
    assertTrue(bonus, "High friendship enables critical hit bonus (with mocked 5% roll)")
end

do
    local pokemon = createMockPokemon(150)
    local bonus = FriendshipSystem.calculateFriendshipCriticalHitBonus(pokemon, "test_seed")
    assertFalse(bonus, "Low friendship no critical hit bonus")
end

do
    local pokemon = createMockPokemon(240)
    pokemon.statusEffect = "POISON"
    local cure = FriendshipSystem.calculateFriendshipStatusCure(pokemon, "test_seed")
    assertTrue(cure, "High friendship cures poison status")
end

do
    local pokemon = createMockPokemon(240)
    pokemon.statusEffect = "FAINTED"
    local cure = FriendshipSystem.calculateFriendshipStatusCure(pokemon, "test_seed")
    assertFalse(cure, "Friendship doesn't cure fainted status")
end

do
    local pokemon = createMockPokemon(240)
    local evasion = FriendshipSystem.calculateFriendshipDamageEvasion(pokemon, "test_seed")
    assertTrue(evasion, "High friendship enables damage evasion")
end

do
    local pokemon = createMockPokemon(240)
    local survival = FriendshipSystem.calculateFriendshipSurvival(pokemon, "test_seed")
    assertTrue(survival, "High friendship enables fatal hit survival")
end

-- Test Group 12: Friendship Display and Descriptions
print("\n--- Test Group 12: Friendship Display and Descriptions ---")

do
    local pokemon = createMockPokemon(25)
    local description = FriendshipSystem.getFriendshipDescription(pokemon)
    assertEquals("hates traveling with you", description, "Low friendship description")
end

do
    local pokemon = createMockPokemon(175)
    local description = FriendshipSystem.getFriendshipDescription(pokemon)
    assertEquals("likes you quite a lot", description, "Medium-high friendship description")
end

do
    local pokemon = createMockPokemon(255)
    local description = FriendshipSystem.getFriendshipDescription(pokemon)
    assertEquals("loves you", description, "Maximum friendship description")
end

do
    local pokemon = createMockPokemon(175)
    local range = FriendshipSystem.getFriendshipRange(pokemon)
    assertEquals("151-200", range, "Friendship range display")
end

-- Test Group 13: Evolution Requirement Checking
print("\n--- Test Group 13: Evolution Requirement Checking ---")

do
    local pokemon = createMockPokemon(219)
    local ready = FriendshipSystem.checkFriendshipEvolutionRequirement(pokemon)
    assertFalse(ready, "Friendship 219 not ready for evolution")
end

do
    local pokemon = createMockPokemon(220)
    local ready = FriendshipSystem.checkFriendshipEvolutionRequirement(pokemon)
    assertTrue(ready, "Friendship 220 ready for evolution")
end

do
    local pokemon = createMockPokemon(150)
    local ready = FriendshipSystem.checkFriendshipEvolutionRequirement(pokemon, 150)
    assertTrue(ready, "Custom friendship threshold met")
end

-- Test Group 14: Return/Frustration Move Power
print("\n--- Test Group 14: Return/Frustration Move Power ---")

do
    local pokemon = createMockPokemon(255)
    local power = FriendshipSystem.calculateFriendshipMovePower(pokemon, true)
    assertEquals(102, power, "Return max power at friendship 255")
end

do
    local pokemon = createMockPokemon(0)
    local power = FriendshipSystem.calculateFriendshipMovePower(pokemon, true)
    assertEquals(0, power, "Return min power at friendship 0")
end

do
    local pokemon = createMockPokemon(255)
    local power = FriendshipSystem.calculateFriendshipMovePower(pokemon, false)
    assertEquals(0, power, "Frustration min power at friendship 255")
end

do
    local pokemon = createMockPokemon(0)
    local power = FriendshipSystem.calculateFriendshipMovePower(pokemon, false)
    assertEquals(102, power, "Frustration max power at friendship 0")
end

do
    local pokemon = createMockPokemon(127)  -- Approximately halfway
    local returnPower = FriendshipSystem.calculateFriendshipMovePower(pokemon, true)
    local frustrationPower = FriendshipSystem.calculateFriendshipMovePower(pokemon, false)
    -- 127 * 102 / 255 = 50.8, floored to 50
    -- (255-127) * 102 / 255 = 51.2, floored to 51
    assertEquals(50, returnPower, "Return power at mid friendship")
    assertEquals(51, frustrationPower, "Frustration power at mid friendship (128*102/255=51.2 floored to 51)")
end

-- Test Group 15: Friendship Validation
print("\n--- Test Group 15: Friendship Validation ---")

do
    local pokemon = createMockPokemon(150)
    local valid = FriendshipSystem.validateFriendship(pokemon)
    assertTrue(valid, "Valid friendship value passes validation")
end

do
    local pokemon = createMockPokemon(-1)
    local valid = FriendshipSystem.validateFriendship(pokemon)
    assertFalse(valid, "Negative friendship fails validation")
end

do
    local pokemon = createMockPokemon(256)
    local valid = FriendshipSystem.validateFriendship(pokemon)
    assertFalse(valid, "Friendship > 255 fails validation")
end

do
    local pokemon = createMockPokemon(150.5)
    local valid = FriendshipSystem.validateFriendship(pokemon)
    assertFalse(valid, "Non-integer friendship fails validation")
end

do
    local pokemon = {friendship = nil}
    local valid = FriendshipSystem.validateFriendship(pokemon)
    assertFalse(valid, "Missing friendship fails validation")
end

do
    local pokemon = {friendship = "high"}
    local valid = FriendshipSystem.validateFriendship(pokemon)
    assertFalse(valid, "String friendship fails validation")
end

-- Test Group 16: Friendship Statistics
print("\n--- Test Group 16: Friendship Statistics ---")

do
    local pokemon = createMockPokemon(240)
    local stats = FriendshipSystem.getFriendshipStatistics(pokemon)
    assertNotNil(stats, "Friendship statistics generated")
    assertEquals(240, stats.current_friendship, "Current friendship correct")
    assertTrue(stats.high_friendship, "High friendship detected")
    assertTrue(stats.evolution_ready, "Evolution ready detected")
    assertTrue(stats.battle_bonus_eligible, "Battle bonus eligible detected")
end

do
    local pokemon = createMockPokemon(100)
    local stats = FriendshipSystem.getFriendshipStatistics(pokemon)
    assertEquals(100, stats.current_friendship, "Current friendship correct")
    assertFalse(stats.high_friendship, "Low friendship detected")
    assertFalse(stats.evolution_ready, "Evolution not ready detected")
    assertFalse(stats.battle_bonus_eligible, "Battle bonus not eligible detected")
end

-- Test Group 17: Edge Cases and Error Handling
print("\n--- Test Group 17: Edge Cases and Error Handling ---")

do
    local friendship = FriendshipSystem.initializeFriendship(nil)
    assertEquals(50, friendship, "Nil Pokemon returns default friendship")
end

do
    local rate = FriendshipSystem.getFriendshipGainRate(nil, "BATTLE_PARTICIPATION")
    assertEquals(0, rate, "Nil friendship returns 0 gain rate")
end

do
    local rate = FriendshipSystem.getFriendshipGainRate(100, nil)
    assertEquals(0, rate, "Nil action type returns 0 gain rate")
end

do
    local _, change = FriendshipSystem.applyFriendshipChange(nil, 10)
    assertEquals(0, change, "Nil Pokemon returns 0 change")
end

do
    local gain = FriendshipSystem.processBattleFriendshipGain(nil, {})
    assertEquals(0, gain, "Nil Pokemon returns 0 battle gain")
end

do
    local isHigh = FriendshipSystem.hasHighFriendship(nil)
    assertFalse(isHigh, "Nil Pokemon not high friendship")
end

do
    local description = FriendshipSystem.getFriendshipDescription(nil)
    assertEquals("Unknown friendship level", description, "Nil Pokemon returns unknown description")
end

-- Test Summary
print("\n=== Test Results Summary ===")
print("Total Tests: " .. (TestResults.passed + TestResults.failed))
print("Passed: " .. TestResults.passed)
print("Failed: " .. TestResults.failed)

if TestResults.failed > 0 then
    print("\nFailures:")
    for _, error in ipairs(TestResults.errors) do
        print("  - " .. error)
    end
    print("\n❌ SOME TESTS FAILED")
else
    print("\n✅ ALL TESTS PASSED")
end

-- Return results for external use
return {
    passed = TestResults.passed,
    failed = TestResults.failed,
    errors = TestResults.errors,
    success = TestResults.failed == 0
}