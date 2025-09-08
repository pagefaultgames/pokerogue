--[[
Unit Tests for Berry Effects Processor
Tests berry effect calculations and applications

Test Coverage:
- HP threshold monitoring for automatic berry activation (25%, 50%)
- Status condition monitoring for immediate berry activation upon status infliction  
- Stat reduction monitoring for stat-boosting berry activation
- Damage calculation integration for damage-reducing berry effects
- Berry consumption logic removing berry from held item slot after activation
- Stat modification system for pinch berries with correct stat boosts
- Once-per-battle tracking for damage-reducing berries

Behavioral Parity Testing:
- All calculations must match TypeScript implementation exactly
- Berry activation and effect calculations must be deterministic and reproducible
--]]

local TestFramework = require("tests.test-framework")
local BerryEffectsProcessor = require("game-logic.items.berry-effects-processor")
local BerryDatabase = require("data.items.berry-database")

local tests = {}

-- Test HP percentage calculation
function tests.testCalculateHpPercentage()
    -- Test normal cases
    local result = BerryEffectsProcessor.calculateHpPercentage(25, 100)
    TestFramework.assertEqual(result, 0.25, "25/100 should equal 0.25")
    
    result = BerryEffectsProcessor.calculateHpPercentage(50, 200)  
    TestFramework.assertEqual(result, 0.25, "50/200 should equal 0.25")
    
    -- Test edge cases
    result = BerryEffectsProcessor.calculateHpPercentage(0, 100)
    TestFramework.assertEqual(result, 0, "0/100 should equal 0")
    
    result = BerryEffectsProcessor.calculateHpPercentage(100, 100)
    TestFramework.assertEqual(result, 1.0, "100/100 should equal 1.0")
    
    -- Test invalid inputs
    result = BerryEffectsProcessor.calculateHpPercentage(50, 0)
    TestFramework.assertEqual(result, 0, "Division by zero should return 0")
    
    result = BerryEffectsProcessor.calculateHpPercentage(nil, 100)
    TestFramework.assertEqual(result, 0, "Nil HP should return 0")
end

-- Test HP berry activation conditions
function tests.testShouldActivateHpBerry()
    local sitrusBerry = BerryDatabase.getBerry("SITRUS_BERRY")
    local liechi = BerryDatabase.getBerry("LIECHI_BERRY")
    
    -- Test Sitrus Berry (50% HP threshold)
    local shouldActivate = BerryEffectsProcessor.shouldActivateHpBerry(sitrusBerry, 49, 100)
    TestFramework.assertTrue(shouldActivate, "Sitrus Berry should activate at 49/100 HP")
    
    shouldActivate = BerryEffectsProcessor.shouldActivateHpBerry(sitrusBerry, 51, 100)
    TestFramework.assertFalse(shouldActivate, "Sitrus Berry should not activate at 51/100 HP")
    
    shouldActivate = BerryEffectsProcessor.shouldActivateHpBerry(sitrusBerry, 50, 100)
    TestFramework.assertTrue(shouldActivate, "Sitrus Berry should activate at exactly 50/100 HP")
    
    -- Test Liechi Berry (25% HP threshold)
    shouldActivate = BerryEffectsProcessor.shouldActivateHpBerry(liechi, 24, 100)
    TestFramework.assertTrue(shouldActivate, "Liechi Berry should activate at 24/100 HP")
    
    shouldActivate = BerryEffectsProcessor.shouldActivateHpBerry(liechi, 26, 100)
    TestFramework.assertFalse(shouldActivate, "Liechi Berry should not activate at 26/100 HP")
    
    shouldActivate = BerryEffectsProcessor.shouldActivateHpBerry(liechi, 25, 100)
    TestFramework.assertTrue(shouldActivate, "Liechi Berry should activate at exactly 25/100 HP")
end

-- Test status berry activation conditions
function tests.testShouldActivateStatusBerry()
    local cheriBerry = BerryDatabase.getBerry("CHERI_BERRY")
    local lumBerry = BerryDatabase.getBerry("LUM_BERRY")
    
    -- Test Cheri Berry (paralysis cure)
    local shouldActivate = BerryEffectsProcessor.shouldActivateStatusBerry(cheriBerry, "paralysis")
    TestFramework.assertTrue(shouldActivate, "Cheri Berry should activate for paralysis")
    
    shouldActivate = BerryEffectsProcessor.shouldActivateStatusBerry(cheriBerry, "burn")
    TestFramework.assertFalse(shouldActivate, "Cheri Berry should not activate for burn")
    
    -- Test Lum Berry (any status cure)
    shouldActivate = BerryEffectsProcessor.shouldActivateStatusBerry(lumBerry, "paralysis")
    TestFramework.assertTrue(shouldActivate, "Lum Berry should activate for paralysis")
    
    shouldActivate = BerryEffectsProcessor.shouldActivateStatusBerry(lumBerry, "burn")
    TestFramework.assertTrue(shouldActivate, "Lum Berry should activate for burn")
    
    shouldActivate = BerryEffectsProcessor.shouldActivateStatusBerry(lumBerry, "sleep")
    TestFramework.assertTrue(shouldActivate, "Lum Berry should activate for sleep")
end

-- Test stat berry activation conditions  
function tests.testShouldActivateStatBerry()
    local whiteHerb = BerryDatabase.getBerry("WHITE_HERB")
    
    -- Test stat reduction triggering
    local statChanges = {
        attack = -1,
        defense = 0,
        speed = 1
    }
    
    local shouldActivate = BerryEffectsProcessor.shouldActivateStatBerry(whiteHerb, statChanges)
    TestFramework.assertTrue(shouldActivate, "White Herb should activate when attack is lowered")
    
    -- Test no stat reduction
    statChanges = {
        attack = 0,
        defense = 1,
        speed = 2
    }
    
    shouldActivate = BerryEffectsProcessor.shouldActivateStatBerry(whiteHerb, statChanges)
    TestFramework.assertFalse(shouldActivate, "White Herb should not activate when no stats lowered")
end

-- Test damage reduction berry activation
function tests.testShouldActivateDamageReduceBerry()
    local occaBerry = BerryDatabase.getBerry("OCCA_BERRY")
    local enigmaBerry = BerryDatabase.getBerry("ENIGMA_BERRY")
    
    -- Test type-resist berry (Occa for Fire moves)
    local shouldActivate = BerryEffectsProcessor.shouldActivateDamageReduceBerry(
        occaBerry, "fire", {"grass"}, 2.0
    )
    TestFramework.assertTrue(shouldActivate, "Occa Berry should activate for super-effective Fire moves")
    
    shouldActivate = BerryEffectsProcessor.shouldActivateDamageReduceBerry(
        occaBerry, "water", {"grass"}, 2.0  
    )
    TestFramework.assertFalse(shouldActivate, "Occa Berry should not activate for Water moves")
    
    shouldActivate = BerryEffectsProcessor.shouldActivateDamageReduceBerry(
        occaBerry, "fire", {"grass"}, 1.0
    )
    TestFramework.assertFalse(shouldActivate, "Occa Berry should not activate for non-super-effective moves")
    
    -- Test Enigma Berry (any super-effective hit)
    shouldActivate = BerryEffectsProcessor.shouldActivateDamageReduceBerry(
        enigmaBerry, "water", {"fire"}, 2.0
    )
    TestFramework.assertTrue(shouldActivate, "Enigma Berry should activate for any super-effective hit")
end

-- Test HP restoration berry effects
function tests.testApplyHpRestoration()
    local oranBerry = BerryDatabase.getBerry("ORAN_BERRY")
    local sitrusBerry = BerryDatabase.getBerry("SITRUS_BERRY")
    
    local pokemon = {
        id = "test_pokemon",
        hp = 30,
        maxHp = 100,
        statusEffect = nil,
        stats = {},
        heldItem = "ORAN_BERRY"
    }
    
    -- Test Oran Berry (fixed 10 HP)
    local result = BerryEffectsProcessor.applyHpRestoration(oranBerry, pokemon)
    TestFramework.assertEqual(result.hp, 40, "Oran Berry should restore 10 HP")
    TestFramework.assertEqual(result.healedAmount, 10, "Should track healed amount")
    TestFramework.assertNil(result.heldItem, "Berry should be consumed")
    TestFramework.assertEqual(result.berryActivated, "ORAN_BERRY", "Should track activated berry")
    
    -- Test Sitrus Berry (25% of max HP)
    pokemon.hp = 30
    pokemon.heldItem = "SITRUS_BERRY"
    result = BerryEffectsProcessor.applyHpRestoration(sitrusBerry, pokemon)
    TestFramework.assertEqual(result.hp, 55, "Sitrus Berry should restore 25 HP (25% of 100)")
    TestFramework.assertEqual(result.healedAmount, 25, "Should track healed amount")
    
    -- Test HP cap
    pokemon.hp = 90
    result = BerryEffectsProcessor.applyHpRestoration(sitrusBerry, pokemon)
    TestFramework.assertEqual(result.hp, 100, "HP should not exceed maximum")
    TestFramework.assertEqual(result.healedAmount, 25, "Should still track full heal amount")
end

-- Test status curing berry effects
function tests.testApplyStatusCure()
    local cheriBerry = BerryDatabase.getBerry("CHERI_BERRY")
    local lumBerry = BerryDatabase.getBerry("LUM_BERRY")
    
    local pokemon = {
        id = "test_pokemon",
        hp = 50,
        maxHp = 100,
        statusEffect = "paralysis",
        stats = {},
        heldItem = "CHERI_BERRY"
    }
    
    -- Test Cheri Berry curing paralysis
    local result = BerryEffectsProcessor.applyStatusCure(cheriBerry, pokemon)
    TestFramework.assertNil(result.statusEffect, "Status should be cured")
    TestFramework.assertEqual(result.statusCured, "paralysis", "Should track cured status")
    TestFramework.assertNil(result.heldItem, "Berry should be consumed")
    TestFramework.assertEqual(result.berryActivated, "CHERI_BERRY", "Should track activated berry")
    
    -- Test Lum Berry curing any status
    pokemon.statusEffect = "burn"
    pokemon.heldItem = "LUM_BERRY" 
    result = BerryEffectsProcessor.applyStatusCure(lumBerry, pokemon)
    TestFramework.assertNil(result.statusEffect, "Lum Berry should cure any status")
    TestFramework.assertEqual(result.statusCured, "burn", "Should track cured status")
    
    -- Test berry not activating for wrong status
    pokemon.statusEffect = "sleep"
    pokemon.heldItem = "CHERI_BERRY"
    result = BerryEffectsProcessor.applyStatusCure(cheriBerry, pokemon)
    TestFramework.assertEqual(result.statusEffect, "sleep", "Status should not be cured")
    TestFramework.assertEqual(result.heldItem, "CHERI_BERRY", "Berry should not be consumed")
end

-- Test stat boosting berry effects
function tests.testApplyStatBoost()
    local liechi = BerryDatabase.getBerry("LIECHI_BERRY")
    local whiteHerb = BerryDatabase.getBerry("WHITE_HERB")
    
    local pokemon = {
        id = "test_pokemon",
        hp = 20,
        maxHp = 100,
        statusEffect = nil,
        stats = {
            attackStage = 0,
            defenseStage = -2,
            speedStage = -1
        },
        heldItem = "LIECHI_BERRY"
    }
    
    -- Test Liechi Berry stat boost
    local result = BerryEffectsProcessor.applyStatBoost(liechi, pokemon, "test_seed")
    TestFramework.assertEqual(result.stats.attackStage, 1, "Attack should be boosted by 1 stage")
    TestFramework.assertEqual(result.statBoosted, "attack", "Should track boosted stat")
    TestFramework.assertEqual(result.boostAmount, 1, "Should track boost amount")
    TestFramework.assertNil(result.heldItem, "Berry should be consumed")
    
    -- Test White Herb stat restoration
    pokemon.heldItem = "WHITE_HERB"
    result = BerryEffectsProcessor.applyStatBoost(whiteHerb, pokemon, "test_seed")
    TestFramework.assertEqual(result.stats.defenseStage, 0, "Defense stage should be restored to 0")
    TestFramework.assertEqual(result.stats.speedStage, 0, "Speed stage should be restored to 0")
    TestFramework.assertTrue(result.statsRestored, "Should indicate stats were restored")
    TestFramework.assertNil(result.heldItem, "Berry should be consumed")
end

-- Test damage reduction berry effects
function tests.testApplyDamageReduction()
    local occaBerry = BerryDatabase.getBerry("OCCA_BERRY")
    
    -- Test type-resist berry damage reduction
    local originalDamage = 100
    local reducedDamage = BerryEffectsProcessor.applyDamageReduction(occaBerry, originalDamage, "fire")
    TestFramework.assertEqual(reducedDamage, 50, "Occa Berry should reduce Fire damage by 50%")
    
    -- Test no reduction for wrong type
    reducedDamage = BerryEffectsProcessor.applyDamageReduction(occaBerry, originalDamage, "water")
    TestFramework.assertEqual(reducedDamage, 100, "Occa Berry should not reduce Water damage")
end

-- Test complete berry activation process
function tests.testProcessBerryActivation()
    local pokemon = {
        id = "test_pokemon",
        hp = 24,
        maxHp = 100,
        statusEffect = nil,
        stats = {},
        heldItem = "LIECHI_BERRY"
    }
    
    local activationContext = {
        trigger = "hp_threshold"
    }
    
    -- Test successful activation
    local result = BerryEffectsProcessor.processBerryActivation(pokemon, activationContext)
    TestFramework.assertTrue(result.success, "Berry activation should succeed")
    TestFramework.assertEqual(result.berryActivated, "LIECHI_BERRY", "Should identify activated berry")
    TestFramework.assertNotNil(result.pokemon, "Should return updated Pokemon")
    TestFramework.assertNil(result.pokemon.heldItem, "Berry should be consumed")
    
    -- Test activation failure (no berry)
    pokemon.heldItem = nil
    result = BerryEffectsProcessor.processBerryActivation(pokemon, activationContext)
    TestFramework.assertFalse(result.success, "Activation should fail with no held item")
    TestFramework.assertEqual(result.message, "No held item", "Should provide failure reason")
    
    -- Test activation failure (not a berry)
    pokemon.heldItem = "POTION"
    result = BerryEffectsProcessor.processBerryActivation(pokemon, activationContext)
    TestFramework.assertFalse(result.success, "Activation should fail with non-berry item")
    TestFramework.assertEqual(result.message, "Held item is not a berry", "Should provide failure reason")
end

-- Test berry effects processor validation
function tests.testValidate()
    local valid, errors = BerryEffectsProcessor.validate()
    
    if valid then
        TestFramework.assertTrue(valid, "Berry effects processor should validate successfully")
    else
        print("Validation errors found:")
        for _, error in ipairs(errors or {}) do
            print("  - " .. error)
        end
        TestFramework.assertTrue(false, "Berry effects processor validation failed")
    end
end

-- Test edge cases and error handling
function tests.testEdgeCases()
    -- Test nil parameters
    local result = BerryEffectsProcessor.calculateHpPercentage(nil, nil)
    TestFramework.assertEqual(result, 0, "Should handle nil parameters gracefully")
    
    result = BerryEffectsProcessor.shouldActivateHpBerry(nil, 50, 100)
    TestFramework.assertFalse(result, "Should handle nil berry gracefully")
    
    result = BerryEffectsProcessor.shouldActivateStatusBerry(nil, "paralysis")
    TestFramework.assertFalse(result, "Should handle nil berry gracefully")
    
    -- Test invalid berry data
    local invalidBerry = {
        id = "INVALID_BERRY",
        activationCondition = "invalid_condition"
    }
    
    result = BerryEffectsProcessor.shouldActivateHpBerry(invalidBerry, 25, 100)
    TestFramework.assertFalse(result, "Should handle invalid berry data gracefully")
end

-- Run all tests
function tests.runAllTests()
    print("\n=== Berry Effects Processor Unit Tests ===")
    
    local testFunctions = {
        tests.testCalculateHpPercentage,
        tests.testShouldActivateHpBerry,
        tests.testShouldActivateStatusBerry,
        tests.testShouldActivateStatBerry,
        tests.testShouldActivateDamageReduceBerry,
        tests.testApplyHpRestoration,
        tests.testApplyStatusCure,
        tests.testApplyStatBoost,
        tests.testApplyDamageReduction,
        tests.testProcessBerryActivation,
        tests.testValidate,
        tests.testEdgeCases
    }
    
    TestFramework.runTests(testFunctions, "Berry Effects Processor")
end

return tests