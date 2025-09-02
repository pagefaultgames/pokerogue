-- Unit Tests for Side Effects System
-- Tests Light Screen, Reflect, Aurora Veil, Safeguard, Mist mechanics
-- Validates duration tracking, damage reduction, and status/stat protection

-- Load system under test
local SideEffects = require("game-logic.battle.side-effects")

-- Test framework setup
local function assert(condition, message)
    if not condition then
        error(message or "Assertion failed")
    end
end

local function assertEqual(actual, expected, message)
    if actual ~= expected then
        error(string.format("%s: Expected %s, got %s", message or "Assertion failed", tostring(expected), tostring(actual)))
    end
end

local function assertContains(table_or_string, value, message)
    if type(table_or_string) == "table" then
        for _, v in ipairs(table_or_string) do
            if v == value then return end
        end
        error(message or string.format("Table does not contain %s", tostring(value)))
    elseif type(table_or_string) == "string" then
        if not string.find(table_or_string, value) then
            error(message or string.format("String '%s' does not contain '%s'", table_or_string, value))
        end
    end
end

local function assertNotNil(value, message)
    if value == nil then
        error(message or "Value should not be nil")
    end
end

local function assertNil(value, message)
    if value ~= nil then
        error(message or "Value should be nil")
    end
end

local function assertTrue(condition, message)
    if not condition then
        error(message or "Expected true")
    end
end

-- Test suite
local SideEffectsTest = {}

-- Test side effect initialization
function SideEffectsTest.testSideEffectInitialization()
    local battleState = {}
    
    -- Test initialization for player side
    local playerSideEffects = SideEffects.initializeSideEffects(battleState, "player")
    assertEqual(type(playerSideEffects), "table", "Player side effects should be table")
    assertEqual(type(battleState.sideEffects), "table", "Battle state should have sideEffects")
    assertEqual(type(battleState.sideEffects.player), "table", "Player side should exist")
    
    -- Test initialization for enemy side
    local enemySideEffects = SideEffects.initializeSideEffects(battleState, "enemy")
    assertEqual(type(enemySideEffects), "table", "Enemy side effects should be table")
    assertEqual(type(battleState.sideEffects.enemy), "table", "Enemy side should exist")
end

-- Test Light Screen mechanics
function SideEffectsTest.testLightScreenMechanics()
    local battleState = {turn = 1}
    
    -- Test setting Light Screen
    local success = SideEffects.setLightScreen(battleState, "player")
    assertEqual(success, true, "Light Screen should be set successfully")
    
    -- Test Light Screen is active
    local isActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.LIGHT_SCREEN)
    assertEqual(isActive, true, "Light Screen should be active")
    
    -- Test duration is 5
    local duration = SideEffects.getSideEffectDuration(battleState, "player", SideEffects.TYPES.LIGHT_SCREEN)
    assertEqual(duration, 5, "Light Screen should have 5 turn duration")
    
    -- Test Light Screen not active on enemy side
    local enemyActive = SideEffects.hasSideEffect(battleState, "enemy", SideEffects.TYPES.LIGHT_SCREEN)
    assertEqual(enemyActive, false, "Light Screen should not be active on enemy side")
end

-- Test Reflect mechanics
function SideEffectsTest.testReflectMechanics()
    local battleState = {turn = 1}
    
    -- Test setting Reflect
    local success = SideEffects.setReflect(battleState, "enemy")
    assertEqual(success, true, "Reflect should be set successfully")
    
    -- Test Reflect is active
    local isActive = SideEffects.hasSideEffect(battleState, "enemy", SideEffects.TYPES.REFLECT)
    assertEqual(isActive, true, "Reflect should be active")
    
    -- Test duration is 5
    local duration = SideEffects.getSideEffectDuration(battleState, "enemy", SideEffects.TYPES.REFLECT)
    assertEqual(duration, 5, "Reflect should have 5 turn duration")
end

-- Test Aurora Veil mechanics
function SideEffectsTest.testAuroraVeilMechanics()
    local battleState = {turn = 1, weather = "HAIL"}
    
    -- Test setting Aurora Veil during hail
    local success = SideEffects.setAuroraVeil(battleState, "player")
    assertEqual(success, true, "Aurora Veil should be set during hail")
    
    -- Test Aurora Veil is active
    local isActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.AURORA_VEIL)
    assertEqual(isActive, true, "Aurora Veil should be active")
    
    -- Test Aurora Veil fails without hail
    local battleStateNoHail = {turn = 1, weather = "NONE"}
    local failSuccess, failMessage = SideEffects.setAuroraVeil(battleStateNoHail, "player")
    assertEqual(failSuccess, false, "Aurora Veil should fail without hail")
    assertContains(failMessage, "requires hail", "Error message should mention hail requirement")
end

-- Test Safeguard mechanics
function SideEffectsTest.testSafeguardMechanics()
    local battleState = {turn = 1}
    
    -- Test setting Safeguard
    local success = SideEffects.setSafeguard(battleState, "player")
    assertEqual(success, true, "Safeguard should be set successfully")
    
    -- Test Safeguard prevention
    local isBlocked = SideEffects.preventStatusCondition(battleState, "player", "POISON")
    assertEqual(isBlocked, true, "Safeguard should prevent status conditions")
    
    -- Test other side not protected
    local enemyBlocked = SideEffects.preventStatusCondition(battleState, "enemy", "POISON")
    assertEqual(enemyBlocked, false, "Enemy side should not be protected by player Safeguard")
end

-- Test Mist mechanics
function SideEffectsTest.testMistMechanics()
    local battleState = {turn = 1}
    
    -- Test setting Mist
    local success = SideEffects.setMist(battleState, "player")
    assertEqual(success, true, "Mist should be set successfully")
    
    -- Test Mist prevention of stat reductions
    local statChanges = {attack = -1, defense = -2}
    local isBlocked = SideEffects.preventStatReduction(battleState, "player", statChanges)
    assertEqual(isBlocked, true, "Mist should prevent stat reductions")
    
    -- Test Mist allows stat increases
    local statIncreases = {attack = 1, defense = 2}
    local isBlockedIncreases = SideEffects.preventStatReduction(battleState, "player", statIncreases)
    assertEqual(isBlockedIncreases, false, "Mist should allow stat increases")
end

-- Test damage reduction calculations
function SideEffectsTest.testDamageReduction()
    local Enums = require("data.constants.enums")
    local battleState = {turn = 1}
    
    -- Set up Light Screen
    SideEffects.setLightScreen(battleState, "player")
    
    -- Test Special damage reduction (singles)
    local reducedDamage = SideEffects.applyDamageReduction(100, Enums.MoveCategory.SPECIAL, "enemy", "player", battleState, false)
    assertEqual(reducedDamage, 50, "Light Screen should reduce Special damage by 50% in singles")
    
    -- Test Physical damage not reduced by Light Screen
    local physicalDamage = SideEffects.applyDamageReduction(100, Enums.MoveCategory.PHYSICAL, "enemy", "player", battleState, false)
    assertEqual(physicalDamage, 100, "Light Screen should not reduce Physical damage")
    
    -- Test doubles format reduction (33%)
    local doublesReduction = SideEffects.applyDamageReduction(100, Enums.MoveCategory.SPECIAL, "enemy", "player", battleState, true)
    assertEqual(doublesReduction, 67, "Light Screen should reduce damage by 33% in doubles")
end

-- Test Reflect damage reduction
function SideEffectsTest.testReflectDamageReduction()
    local Enums = require("data.constants.enums")
    local battleState = {turn = 1}
    
    -- Set up Reflect
    SideEffects.setReflect(battleState, "player")
    
    -- Test Physical damage reduction
    local reducedDamage = SideEffects.applyDamageReduction(100, Enums.MoveCategory.PHYSICAL, "enemy", "player", battleState, false)
    assertEqual(reducedDamage, 50, "Reflect should reduce Physical damage by 50%")
    
    -- Test Special damage not reduced by Reflect
    local specialDamage = SideEffects.applyDamageReduction(100, Enums.MoveCategory.SPECIAL, "enemy", "player", battleState, false)
    assertEqual(specialDamage, 100, "Reflect should not reduce Special damage")
end

-- Test Aurora Veil combined reduction
function SideEffectsTest.testAuroraVeilDamageReduction()
    local Enums = require("data.constants.enums")
    local battleState = {turn = 1, weather = "HAIL"}
    
    -- Set up Aurora Veil
    SideEffects.setAuroraVeil(battleState, "player")
    
    -- Test both Physical and Special damage reduction
    local physicalReduction = SideEffects.applyDamageReduction(100, Enums.MoveCategory.PHYSICAL, "enemy", "player", battleState, false)
    assertEqual(physicalReduction, 50, "Aurora Veil should reduce Physical damage")
    
    local specialReduction = SideEffects.applyDamageReduction(100, Enums.MoveCategory.SPECIAL, "enemy", "player", battleState, false)
    assertEqual(specialReduction, 50, "Aurora Veil should reduce Special damage")
end

-- Test screen removal
function SideEffectsTest.testScreenRemoval()
    local battleState = {turn = 1, weather = "HAIL"}  -- Add weather for Aurora Veil
    
    -- Set up multiple screens
    SideEffects.setLightScreen(battleState, "player")
    SideEffects.setReflect(battleState, "player")
    SideEffects.setAuroraVeil(battleState, "enemy")
    
    -- Test Brick Break (removes Light Screen and Reflect only)
    local brickBreakRemoved = SideEffects.removeScreens(battleState, "player", false)
    assertEqual(#brickBreakRemoved, 2, "Brick Break should remove 2 screens")
    assertContains(brickBreakRemoved, SideEffects.TYPES.LIGHT_SCREEN, "Should remove Light Screen")
    assertContains(brickBreakRemoved, SideEffects.TYPES.REFLECT, "Should remove Reflect")
    
    -- Test Psychic Fangs (removes all screens including Aurora Veil)
    local psychicFangsRemoved = SideEffects.removeScreens(battleState, "enemy", true)
    assertEqual(#psychicFangsRemoved, 1, "Psychic Fangs should remove Aurora Veil")
    assertContains(psychicFangsRemoved, SideEffects.TYPES.AURORA_VEIL, "Should remove Aurora Veil")
end

-- Test duration countdown
function SideEffectsTest.testDurationCountdown()
    local battleState = {turn = 1}
    
    -- Set up side effects
    SideEffects.setLightScreen(battleState, "player")
    SideEffects.setReflect(battleState, "player")
    
    -- Process turn end
    local expiredEffects = SideEffects.processTurnEnd(battleState)
    
    -- Check durations decreased
    local lightScreenDuration = SideEffects.getSideEffectDuration(battleState, "player", SideEffects.TYPES.LIGHT_SCREEN)
    assertEqual(lightScreenDuration, 4, "Light Screen duration should decrease to 4")
    
    local reflectDuration = SideEffects.getSideEffectDuration(battleState, "player", SideEffects.TYPES.REFLECT)
    assertEqual(reflectDuration, 4, "Reflect duration should decrease to 4")
    
    -- Test expiration after 5 turns (need 4 more processTurnEnd calls)
    for i = 1, 3 do
        local midExpired = SideEffects.processTurnEnd(battleState)
        assertEqual(#midExpired.player, 0, "Effects should not expire in turns 2-4")
    end
    
    -- Final turn should expire both effects
    local finalExpired = SideEffects.processTurnEnd(battleState)
    assertEqual(#finalExpired.player, 2, "Both effects should expire after 5 turns")
    
    -- Verify effects are removed
    local lightScreenActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.LIGHT_SCREEN)
    assertEqual(lightScreenActive, false, "Light Screen should be inactive after expiration")
    
    local reflectActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.REFLECT)
    assertEqual(reflectActive, false, "Reflect should be inactive after expiration")
end

-- Test active side effects retrieval
function SideEffectsTest.testActiveSideEffectsRetrieval()
    local battleState = {turn = 1}
    
    -- Set up multiple side effects
    SideEffects.setLightScreen(battleState, "player")
    SideEffects.setSafeguard(battleState, "player")
    SideEffects.setReflect(battleState, "enemy")
    
    -- Get active effects for player
    local playerEffects = SideEffects.getActiveSideEffects(battleState, "player")
    assertEqual(type(playerEffects), "table", "Should return table of active effects")
    assertNotNil(playerEffects[SideEffects.TYPES.LIGHT_SCREEN], "Should include Light Screen")
    assertNotNil(playerEffects[SideEffects.TYPES.SAFEGUARD], "Should include Safeguard")
    assertNil(playerEffects[SideEffects.TYPES.REFLECT], "Should not include enemy Reflect")
    
    -- Get active effects for enemy
    local enemyEffects = SideEffects.getActiveSideEffects(battleState, "enemy")
    assertNotNil(enemyEffects[SideEffects.TYPES.REFLECT], "Should include enemy Reflect")
    assertNil(enemyEffects[SideEffects.TYPES.LIGHT_SCREEN], "Should not include player Light Screen")
end

-- Test screen detection utility
function SideEffectsTest.testScreenDetection()
    local battleState = {turn = 1}
    
    -- Test no screens initially
    local hasScreens = SideEffects.hasAnyScreens(battleState, "player")
    assertEqual(hasScreens, false, "Should have no screens initially")
    
    -- Test Light Screen detection
    SideEffects.setLightScreen(battleState, "player")
    hasScreens = SideEffects.hasAnyScreens(battleState, "player")
    assertEqual(hasScreens, true, "Should detect Light Screen")
    
    -- Test Reflect detection
    SideEffects.setReflect(battleState, "enemy")
    local enemyScreens = SideEffects.hasAnyScreens(battleState, "enemy")
    assertEqual(enemyScreens, true, "Should detect Reflect on enemy")
    
    -- Test Aurora Veil detection
    battleState.weather = "HAIL"
    SideEffects.setAuroraVeil(battleState, "player")
    hasScreens = SideEffects.hasAnyScreens(battleState, "player")
    assertEqual(hasScreens, true, "Should detect Aurora Veil")
end

-- Test effect name retrieval
function SideEffectsTest.testEffectNames()
    local lightScreenName = SideEffects.getEffectName(SideEffects.TYPES.LIGHT_SCREEN)
    assertEqual(lightScreenName, "Light Screen", "Should return proper Light Screen name")
    
    local reflectName = SideEffects.getEffectName(SideEffects.TYPES.REFLECT)
    assertEqual(reflectName, "Reflect", "Should return proper Reflect name")
    
    local auroraVeilName = SideEffects.getEffectName(SideEffects.TYPES.AURORA_VEIL)
    assertEqual(auroraVeilName, "Aurora Veil", "Should return proper Aurora Veil name")
    
    local safeguardName = SideEffects.getEffectName(SideEffects.TYPES.SAFEGUARD)
    assertEqual(safeguardName, "Safeguard", "Should return proper Safeguard name")
    
    local mistName = SideEffects.getEffectName(SideEffects.TYPES.MIST)
    assertEqual(mistName, "Mist", "Should return proper Mist name")
end

-- Test edge cases
function SideEffectsTest.testEdgeCases()
    local battleState = {turn = 1}
    
    -- Test invalid parameters
    local success = SideEffects.setSideEffect(nil, "player", SideEffects.TYPES.LIGHT_SCREEN)
    assertEqual(success, false, "Should fail with nil battleState")
    
    success = SideEffects.setSideEffect(battleState, nil, SideEffects.TYPES.LIGHT_SCREEN)
    assertEqual(success, false, "Should fail with nil side")
    
    success = SideEffects.setSideEffect(battleState, "player", nil)
    assertEqual(success, false, "Should fail with nil effectType")
    
    -- Test zero/negative damage
    local reducedDamage = SideEffects.applyDamageReduction(0, "SPECIAL", "enemy", "player", battleState, false)
    assertEqual(reducedDamage, 0, "Should handle zero damage correctly")
    
    reducedDamage = SideEffects.applyDamageReduction(-10, "SPECIAL", "enemy", "player", battleState, false)
    assertEqual(reducedDamage, -10, "Should handle negative damage correctly")
end

-- Test multiple side effects coexistence
function SideEffectsTest.testMultipleSideEffectsCoexistence()
    local battleState = {turn = 1, weather = "HAIL"}
    
    -- Test multiple effects on same side
    local lightSuccess = SideEffects.setLightScreen(battleState, "player")
    local reflectSuccess = SideEffects.setReflect(battleState, "player")
    local safeguardSuccess = SideEffects.setSafeguard(battleState, "player")
    local mistSuccess = SideEffects.setMist(battleState, "player")
    local auroraSuccess = SideEffects.setAuroraVeil(battleState, "player")
    
    assertEqual(lightSuccess, true, "Multiple effects should coexist")
    assertEqual(reflectSuccess, true, "Multiple effects should coexist")
    assertEqual(safeguardSuccess, true, "Multiple effects should coexist")
    assertEqual(mistSuccess, true, "Multiple effects should coexist")
    assertEqual(auroraSuccess, true, "Multiple effects should coexist")
    
    -- Test all effects are active
    assertEqual(SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.LIGHT_SCREEN), true, "Light Screen should be active")
    assertEqual(SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.REFLECT), true, "Reflect should be active")
    assertEqual(SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.SAFEGUARD), true, "Safeguard should be active")
    assertEqual(SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.MIST), true, "Mist should be active")
    assertEqual(SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.AURORA_VEIL), true, "Aurora Veil should be active")
end

-- Test stat reduction prevention edge cases
function SideEffectsTest.testStatReductionPreventionEdgeCases()
    local battleState = {turn = 1}
    SideEffects.setMist(battleState, "player")
    
    -- Test empty stat changes
    local emptyBlocked = SideEffects.preventStatReduction(battleState, "player", {})
    assertEqual(emptyBlocked, false, "Should not block empty stat changes")
    
    -- Test mixed stat changes (some positive, some negative)
    local mixedChanges = {attack = 1, defense = -1, speed = 2}
    local mixedBlocked = SideEffects.preventStatReduction(battleState, "player", mixedChanges)
    assertEqual(mixedBlocked, true, "Should block if any changes are negative")
    
    -- Test only positive changes
    local positiveChanges = {attack = 1, defense = 2, speed = 1}
    local positiveBlocked = SideEffects.preventStatReduction(battleState, "player", positiveChanges)
    assertEqual(positiveBlocked, false, "Should not block positive-only changes")
end

-- Run all tests
function SideEffectsTest.runAllTests()
    local tests = {
        "testSideEffectInitialization",
        "testLightScreenMechanics", 
        "testReflectMechanics",
        "testAuroraVeilMechanics",
        "testSafeguardMechanics",
        "testMistMechanics",
        "testDamageReduction",
        "testReflectDamageReduction",
        "testAuroraVeilDamageReduction",
        "testScreenRemoval",
        "testDurationCountdown",
        "testActiveSideEffectsRetrieval",
        "testScreenDetection",
        "testEffectNames",
        "testEdgeCases",
        "testMultipleSideEffectsCoexistence",
        "testStatReductionPreventionEdgeCases"
    }
    
    local passed = 0
    local failed = 0
    
    print("Running Side Effects Unit Tests...")
    print("=" .. string.rep("=", 50))
    
    for _, testName in ipairs(tests) do
        local success, error = pcall(SideEffectsTest[testName])
        if success then
            print("✓ " .. testName)
            passed = passed + 1
        else
            print("✗ " .. testName .. ": " .. tostring(error))
            failed = failed + 1
        end
    end
    
    print("=" .. string.rep("=", 50))
    print(string.format("Tests completed: %d passed, %d failed", passed, failed))
    
    if failed > 0 then
        error(string.format("Unit tests failed: %d/%d tests failed", failed, passed + failed))
    end
    
    return {passed = passed, failed = failed}
end

-- Auto-run if called directly
if ... == nil then
    SideEffectsTest.runAllTests()
end

return SideEffectsTest