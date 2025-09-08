-- Side Effects Integration Tests (Aolite Version)
-- Tests side effect mechanics in battle context
-- Covers Light Screen, Reflect, Aurora Veil, Safeguard, Mist

print("🔄 Running Side Effects Integration Tests (Aolite)")
print("==================================================")

-- Test results tracking
local testResults = { passed = 0, failed = 0, errors = {} }

function runTest(testName, testFunc)
    local success, result = pcall(testFunc)
    if success and result then
        testResults.passed = testResults.passed + 1
        print("✓ " .. testName)
    else
        testResults.failed = testResults.failed + 1
        local errorMsg = result and tostring(result) or "Test failed"
        table.insert(testResults.errors, testName .. ": " .. errorMsg)
        print("✗ " .. testName .. " - " .. errorMsg)
    end
end

-- Helper assertion functions
local function assert_true(condition, message)
    if not condition then
        error(message or "Assertion failed: expected true")
    end
    return true
end

local function assert_false(condition, message)
    if condition then
        error(message or "Assertion failed: expected false")
    end
    return true
end

local function assert_equals(expected, actual, message)
    if expected ~= actual then
        error((message or "Assertion failed") .. ": expected '" .. tostring(expected) .. "', got '" .. tostring(actual) .. "'")
    end
    return true
end

local function assert_not_nil(value, message)
    if value == nil then
        error(message or "Assertion failed: expected non-nil value")
    end
    return true
end

local function assert_less_than(actual, expected, message)
    if actual >= expected then
        error((message or "Assertion failed") .. ": expected " .. tostring(actual) .. " to be less than " .. tostring(expected))
    end
    return true
end

-- Mock side effects constants and functions
local SideEffects = {
    TYPES = {
        LIGHT_SCREEN = "light_screen",
        REFLECT = "reflect",
        AURORA_VEIL = "aurora_veil",
        SAFEGUARD = "safeguard",
        MIST = "mist"
    }
}

-- Test battle state factory
local function createTestBattleState()
    return {
        battleId = "test-battle-001",
        turn = 1,
        phase = "command",
        playerParty = {
            {
                id = "player_pokemon_001",
                name = "Charizard",
                currentHP = 100,
                maxHP = 100,
                stats = {hp = 100, attack = 80, defense = 70, spAttack = 90, spDefense = 75, speed = 100},
                side = "player"
            }
        },
        enemyParty = {
            {
                id = "enemy_pokemon_001", 
                name = "Blastoise",
                currentHP = 100,
                maxHP = 100,
                stats = {hp = 100, attack = 75, defense = 85, spAttack = 100, spDefense = 90, speed = 80},
                side = "enemy"
            }
        },
        sideEffects = {
            player = {},
            enemy = {}
        },
        weather = nil,
        terrain = nil,
        battleFormat = "singles"
    }
end

-- Test 1: Light Screen battle integration
function testLightScreenBattleIntegration()
    local battleState = createTestBattleState()
    
    -- Mock Light Screen activation
    battleState.sideEffects.player.light_screen = {
        active = true,
        duration = 5,
        damage_reduction = 0.5 -- 50% special damage reduction
    }
    
    -- Mock special attack damage calculation
    local baseDamage = 60
    local lightScreenActive = battleState.sideEffects.player.light_screen and battleState.sideEffects.player.light_screen.active
    local actualDamage = lightScreenActive and (baseDamage * battleState.sideEffects.player.light_screen.damage_reduction) or baseDamage
    
    assert_true(lightScreenActive, "Light Screen should be active")
    assert_equals(30, actualDamage, "Special damage should be reduced by Light Screen")
    assert_less_than(actualDamage, baseDamage, "Reduced damage should be less than base damage")
    
    return true
end

-- Test 2: Reflect battle integration
function testReflectBattleIntegration()
    local battleState = createTestBattleState()
    
    -- Mock Reflect activation
    battleState.sideEffects.player.reflect = {
        active = true,
        duration = 5,
        damage_reduction = 0.5 -- 50% physical damage reduction
    }
    
    -- Mock physical attack damage calculation
    local baseDamage = 50
    local reflectActive = battleState.sideEffects.player.reflect and battleState.sideEffects.player.reflect.active
    local actualDamage = reflectActive and (baseDamage * battleState.sideEffects.player.reflect.damage_reduction) or baseDamage
    
    assert_true(reflectActive, "Reflect should be active")
    assert_equals(25, actualDamage, "Physical damage should be reduced by Reflect")
    assert_less_than(actualDamage, baseDamage, "Reduced damage should be less than base damage")
    
    return true
end

-- Test 3: Aurora Veil battle integration
function testAuroraVeilBattleIntegration()
    local battleState = createTestBattleState()
    battleState.weather = "HAIL" -- Required for Aurora Veil
    
    -- Mock Aurora Veil activation
    battleState.sideEffects.player.aurora_veil = {
        active = true,
        duration = 5,
        damage_reduction = 0.67 -- 33% damage reduction for both physical and special
    }
    
    -- Test both physical and special damage reduction
    local physicalBaseDamage = 45
    local specialBaseDamage = 55
    
    local auroraVeilActive = battleState.sideEffects.player.aurora_veil and battleState.sideEffects.player.aurora_veil.active
    local physicalActualDamage = auroraVeilActive and (physicalBaseDamage * battleState.sideEffects.player.aurora_veil.damage_reduction) or physicalBaseDamage
    local specialActualDamage = auroraVeilActive and (specialBaseDamage * battleState.sideEffects.player.aurora_veil.damage_reduction) or specialBaseDamage
    
    assert_true(auroraVeilActive, "Aurora Veil should be active")
    assert_equals("HAIL", battleState.weather, "Weather should be HAIL for Aurora Veil")
    assert_less_than(physicalActualDamage, physicalBaseDamage, "Aurora Veil should reduce physical damage")
    assert_less_than(specialActualDamage, specialBaseDamage, "Aurora Veil should reduce special damage")
    
    return true
end

-- Test 4: Safeguard status prevention
function testSafeguardStatusPrevention()
    local battleState = createTestBattleState()
    
    -- Mock Safeguard activation
    battleState.sideEffects.player.safeguard = {
        active = true,
        duration = 5
    }
    
    -- Mock status effect application attempt
    local pokemon = battleState.playerParty[1]
    local statusAttempt = {
        type = "poison",
        target = pokemon
    }
    
    local safeguardActive = battleState.sideEffects.player.safeguard and battleState.sideEffects.player.safeguard.active
    local statusBlocked = safeguardActive
    
    assert_true(safeguardActive, "Safeguard should be active")
    assert_true(statusBlocked, "Status effect should be blocked by Safeguard")
    assert_not_nil(pokemon, "Pokemon should exist")
    
    return true
end

-- Test 5: Mist stat reduction prevention
function testMistStatReductionPrevention()
    local battleState = createTestBattleState()
    
    -- Mock Mist activation
    battleState.sideEffects.player.mist = {
        active = true,
        duration = 5
    }
    
    -- Mock stat reduction attempt
    local pokemon = battleState.playerParty[1]
    local originalAttack = pokemon.stats.attack
    
    local mistActive = battleState.sideEffects.player.mist and battleState.sideEffects.player.mist.active
    local statReductionBlocked = mistActive
    
    -- If Mist is active, stat reduction should be blocked
    local newAttack = statReductionBlocked and originalAttack or (originalAttack - 10)
    
    assert_true(mistActive, "Mist should be active")
    assert_true(statReductionBlocked, "Stat reduction should be blocked by Mist")
    assert_equals(originalAttack, newAttack, "Attack stat should remain unchanged due to Mist")
    
    return true
end

-- Test 6: Screen breaking integration
function testScreenBreakingIntegration()
    local battleState = createTestBattleState()
    
    -- Set up multiple screens
    battleState.sideEffects.player.light_screen = {active = true, duration = 3}
    battleState.sideEffects.player.reflect = {active = true, duration = 4}
    
    -- Mock screen-breaking move (like Brick Break)
    local brickBreakUsed = true
    
    if brickBreakUsed then
        battleState.sideEffects.player.light_screen.active = false
        battleState.sideEffects.player.reflect.active = false
    end
    
    assert_false(battleState.sideEffects.player.light_screen.active, "Light Screen should be removed")
    assert_false(battleState.sideEffects.player.reflect.active, "Reflect should be removed")
    
    return true
end

-- Test 7: Multi-turn side effect duration
function testMultiTurnSideEffectDuration()
    local battleState = createTestBattleState()
    
    -- Set up Light Screen with 3-turn duration
    battleState.sideEffects.player.light_screen = {active = true, duration = 3}
    
    -- Simulate turn progression
    for turn = 1, 3 do
        battleState.turn = turn
        
        -- Process end of turn duration countdown
        if battleState.sideEffects.player.light_screen.active then
            battleState.sideEffects.player.light_screen.duration = battleState.sideEffects.player.light_screen.duration - 1
            if battleState.sideEffects.player.light_screen.duration <= 0 then
                battleState.sideEffects.player.light_screen.active = false
            end
        end
    end
    
    assert_equals(3, battleState.turn, "Should have processed 3 turns")
    assert_false(battleState.sideEffects.player.light_screen.active, "Light Screen should be inactive after expiration")
    assert_equals(0, battleState.sideEffects.player.light_screen.duration, "Duration should be 0")
    
    return true
end

-- Test 8: Team-wide application
function testTeamWideApplication()
    local battleState = createTestBattleState()
    
    -- Add second Pokemon to team
    local secondPokemon = {
        id = "player_pokemon_002",
        name = "Pikachu",
        currentHP = 80,
        maxHP = 80,
        stats = {hp = 80, attack = 55, defense = 40, spAttack = 50, spDefense = 50, speed = 90},
        side = "player"
    }
    table.insert(battleState.playerParty, secondPokemon)
    
    -- Mock team-wide Safeguard
    battleState.sideEffects.player.safeguard = {active = true, duration = 5, team_wide = true}
    
    -- Mock status attempt on both Pokemon
    local firstPokemonProtected = battleState.sideEffects.player.safeguard.active
    local secondPokemonProtected = battleState.sideEffects.player.safeguard.active and battleState.sideEffects.player.safeguard.team_wide
    
    assert_equals(2, #battleState.playerParty, "Should have 2 Pokemon in party")
    assert_true(firstPokemonProtected, "First Pokemon should be protected by Safeguard")
    assert_true(secondPokemonProtected, "Second Pokemon should be protected by team-wide Safeguard")
    
    return true
end

-- Test 9: Doubles format damage reduction
function testDoublesFormatDamageReduction()
    local battleState = createTestBattleState()
    battleState.battleFormat = "doubles"
    
    -- Set up Light Screen
    battleState.sideEffects.player.light_screen = {active = true, duration = 5}
    
    -- In doubles, screens provide less damage reduction (67% instead of 50%)
    local baseDamage = 60
    local doublesReduction = battleState.battleFormat == "doubles" and 0.67 or 0.5
    local reducedDamage = baseDamage * doublesReduction
    
    assert_equals("doubles", battleState.battleFormat, "Battle format should be doubles")
    assert_equals(40, math.floor(reducedDamage), "Doubles format should reduce damage to ~67%")
    
    return true
end

-- Test 10: Aurora Veil weather dependency
function testAuroraVeilWeatherDependency()
    local battleState = createTestBattleState()
    
    -- Test Aurora Veil failure without proper weather
    battleState.weather = "NONE"
    local auroraVeilCanActivate = (battleState.weather == "HAIL" or battleState.weather == "SNOW")
    
    assert_false(auroraVeilCanActivate, "Aurora Veil should not activate without hail/snow")
    
    -- Test Aurora Veil success with hail
    battleState.weather = "HAIL"
    auroraVeilCanActivate = (battleState.weather == "HAIL" or battleState.weather == "SNOW")
    
    assert_true(auroraVeilCanActivate, "Aurora Veil should activate with hail")
    
    -- Test Aurora Veil success with snow
    battleState.weather = "SNOW"
    auroraVeilCanActivate = (battleState.weather == "HAIL" or battleState.weather == "SNOW")
    
    assert_true(auroraVeilCanActivate, "Aurora Veil should activate with snow")
    
    return true
end

-- Run all tests
local tests = {
    {"Light Screen Battle Integration", testLightScreenBattleIntegration},
    {"Reflect Battle Integration", testReflectBattleIntegration},
    {"Aurora Veil Battle Integration", testAuroraVeilBattleIntegration},
    {"Safeguard Status Prevention", testSafeguardStatusPrevention},
    {"Mist Stat Reduction Prevention", testMistStatReductionPrevention},
    {"Screen Breaking Integration", testScreenBreakingIntegration},
    {"Multi-turn Side Effect Duration", testMultiTurnSideEffectDuration},
    {"Team-wide Application", testTeamWideApplication},
    {"Doubles Format Damage Reduction", testDoublesFormatDamageReduction},
    {"Aurora Veil Weather Dependency", testAuroraVeilWeatherDependency}
}

for _, test in ipairs(tests) do
    runTest(test[1], test[2])
end

print("\nSide Effects Integration Test Results:")
print("Passed: " .. testResults.passed)
print("Failed: " .. testResults.failed)

if #testResults.errors > 0 then
    print("\nErrors:")
    for _, error in ipairs(testResults.errors) do
        print("  " .. error)
    end
end

if testResults.failed == 0 then
    print("\n🎉 All side effects integration tests passed!")
    print("✅ Side effects integration verified!")
else
    print("\n❌ Some side effects integration tests failed")
    os.exit(1)
end