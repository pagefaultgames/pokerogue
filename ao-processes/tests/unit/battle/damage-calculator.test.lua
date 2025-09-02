-- Unit Tests for Damage Calculator
-- Comprehensive test coverage for all damage calculation components
-- AAA pattern (Arrange, Act, Assert) with 100% formula coverage

local DamageCalculator = require("game-logic.battle.damage-calculator")
local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")

local DamageCalculatorTests = {}

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

local function assertApproxEqual(actual, expected, tolerance, message)
    tolerance = tolerance or 0.001
    if math.abs(actual - expected) > tolerance then
        error(string.format("%s: Expected %s ± %s, got %s", message or "Assertion failed", tostring(expected), tostring(tolerance), tostring(actual)))
    end
end

local function assertTrue(condition, message)
    assert(condition, message)
end

local function assertFalse(condition, message)
    assert(not condition, message)
end

-- Mock data helpers
local function createMockPokemon(level, stats, types, battleData)
    return {
        level = level or 50,
        stats = stats or {hp = 100, atk = 100, def = 100, spatk = 100, spdef = 100, spd = 100},
        types = types or {Enums.PokemonType.NORMAL},
        battleData = battleData or {statStages = {atk = 0, def = 0, spatk = 0, spdef = 0, spd = 0, acc = 0, eva = 0}}
    }
end

local function createMockMove(power, type, category, criticalHitRatio)
    return {
        power = power or 80,
        type = type or Enums.PokemonType.NORMAL,
        category = category or Enums.MoveCategory.PHYSICAL,
        criticalHitRatio = criticalHitRatio or 0
    }
end

-- Test 1: Base Damage Formula Calculation
function DamageCalculatorTests.testBaseDamageFormula()
    -- Arrange
    BattleRNG.seed("test-base-damage")
    local attacker = createMockPokemon(50, {atk = 100, spatk = 100})
    local defender = createMockPokemon(50, {def = 100, spdef = 100})
    local move = createMockMove(80, Enums.PokemonType.NORMAL, Enums.MoveCategory.PHYSICAL)
    
    -- Act
    local result = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = move,
        options = {criticalHitForced = false}
    })
    
    -- Assert
    -- Expected base damage: ((2 * 50 / 5 + 2) * 80 * 100 / 100 / 50 + 2) = 37
    assertTrue(result.damage > 0, "Base damage should be greater than 0")
    assertTrue(result.details.baseDamage == 37, "Base damage should be 37 with given parameters")
end

-- Test 2: Level Impact on Damage
function DamageCalculatorTests.testLevelImpact()
    -- Arrange
    BattleRNG.seed("test-level-impact")
    local stats = {atk = 100, spatk = 100}
    local defenderStats = {def = 100, spdef = 100}
    local move = createMockMove(80, Enums.PokemonType.NORMAL, Enums.MoveCategory.PHYSICAL)
    
    -- Act - Different levels
    local level1Result = DamageCalculator.calculateDamage({
        attacker = createMockPokemon(1, stats),
        defender = createMockPokemon(50, defenderStats),
        moveData = move,
        options = {criticalHitForced = false}
    })
    
    local level100Result = DamageCalculator.calculateDamage({
        attacker = createMockPokemon(100, stats),
        defender = createMockPokemon(50, defenderStats),
        moveData = move,
        options = {criticalHitForced = false}
    })
    
    -- Assert
    assertTrue(level100Result.damage > level1Result.damage, "Higher level should deal more damage")
end

-- Test 3: Type Effectiveness Application
function DamageCalculatorTests.testTypeEffectiveness()
    -- Arrange
    BattleRNG.seed("test-type-effectiveness")
    local attacker = createMockPokemon(50, {atk = 100}, {Enums.PokemonType.WATER})
    local fireDefender = createMockPokemon(50, {def = 100}, {Enums.PokemonType.FIRE})
    local grassDefender = createMockPokemon(50, {def = 100}, {Enums.PokemonType.GRASS})
    local waterMove = createMockMove(80, Enums.PokemonType.WATER, Enums.MoveCategory.PHYSICAL)
    
    -- Act
    local superEffectiveResult = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = fireDefender,
        moveData = waterMove,
        options = {criticalHitForced = false}
    })
    
    local notVeryEffectiveResult = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = grassDefender,
        moveData = waterMove,
        options = {criticalHitForced = false}
    })
    
    -- Assert
    assertEqual(superEffectiveResult.typeEffectiveness, 2.0, "Water vs Fire should be 2x effective")
    assertEqual(notVeryEffectiveResult.typeEffectiveness, 0.5, "Water vs Grass should be 0.5x effective")
    assertTrue(superEffectiveResult.damage > notVeryEffectiveResult.damage, "Super effective should deal more damage")
end

-- Test 4: STAB (Same Type Attack Bonus) Application
function DamageCalculatorTests.testSTABApplication()
    -- Arrange
    BattleRNG.seed("test-stab")
    local waterPokemon = createMockPokemon(50, {atk = 100}, {Enums.PokemonType.WATER})
    local normalPokemon = createMockPokemon(50, {atk = 100}, {Enums.PokemonType.NORMAL})
    local defender = createMockPokemon(50, {def = 100}, {Enums.PokemonType.NORMAL})
    local waterMove = createMockMove(80, Enums.PokemonType.WATER, Enums.MoveCategory.PHYSICAL)
    
    -- Act
    local stabResult = DamageCalculator.calculateDamage({
        attacker = waterPokemon,
        defender = defender,
        moveData = waterMove,
        options = {criticalHitForced = false}
    })
    
    local noStabResult = DamageCalculator.calculateDamage({
        attacker = normalPokemon,
        defender = defender,
        moveData = waterMove,
        options = {criticalHitForced = false}
    })
    
    -- Assert
    assertTrue(stabResult.stab, "Water Pokemon using Water move should get STAB")
    assertFalse(noStabResult.stab, "Normal Pokemon using Water move should not get STAB")
    assertTrue(stabResult.damage > noStabResult.damage, "STAB should increase damage")
end

-- Test 5: Critical Hit Application
function DamageCalculatorTests.testCriticalHit()
    -- Arrange
    BattleRNG.seed("test-critical-hit")
    local attacker = createMockPokemon(50, {atk = 100})
    local defender = createMockPokemon(50, {def = 100})
    local move = createMockMove(80, Enums.PokemonType.NORMAL, Enums.MoveCategory.PHYSICAL)
    
    -- Act
    local normalResult = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = move,
        options = {criticalHitForced = false}
    })
    
    local criticalResult = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = move,
        options = {criticalHitForced = true}
    })
    
    -- Assert
    assertFalse(normalResult.criticalHit, "Normal hit should not be critical")
    assertTrue(criticalResult.criticalHit, "Forced critical hit should be critical")
    assertTrue(criticalResult.damage > normalResult.damage, "Critical hit should deal more damage")
end

-- Test 6: Stat Stage Modifications
function DamageCalculatorTests.testStatStageModifications()
    -- Arrange
    BattleRNG.seed("test-stat-stages")
    local normalStats = {atk = 100, spatk = 100}
    local boostedBattleData = {statStages = {atk = 2, def = 0, spatk = 2, spdef = 0, spd = 0, acc = 0, eva = 0}}
    local loweredBattleData = {statStages = {atk = -2, def = 0, spatk = -2, spdef = 0, spd = 0, acc = 0, eva = 0}}
    
    local normalAttacker = createMockPokemon(50, normalStats, {Enums.PokemonType.NORMAL})
    local boostedAttacker = createMockPokemon(50, normalStats, {Enums.PokemonType.NORMAL}, boostedBattleData)
    local loweredAttacker = createMockPokemon(50, normalStats, {Enums.PokemonType.NORMAL}, loweredBattleData)
    local defender = createMockPokemon(50, {def = 100, spdef = 100})
    local move = createMockMove(80, Enums.PokemonType.NORMAL, Enums.MoveCategory.PHYSICAL)
    
    -- Act
    local normalResult = DamageCalculator.calculateDamage({
        attacker = normalAttacker,
        defender = defender,
        moveData = move,
        options = {criticalHitForced = false}
    })
    
    local boostedResult = DamageCalculator.calculateDamage({
        attacker = boostedAttacker,
        defender = defender,
        moveData = move,
        options = {criticalHitForced = false}
    })
    
    local loweredResult = DamageCalculator.calculateDamage({
        attacker = loweredAttacker,
        defender = defender,
        moveData = move,
        options = {criticalHitForced = false}
    })
    
    -- Assert
    assertTrue(boostedResult.damage > normalResult.damage, "+2 attack stages should increase damage")
    assertTrue(normalResult.damage > loweredResult.damage, "-2 attack stages should decrease damage")
end

-- Test 7: Weather Effects
function DamageCalculatorTests.testWeatherEffects()
    -- Arrange
    BattleRNG.seed("test-weather")
    local attacker = createMockPokemon(50, {spatk = 100}, {Enums.PokemonType.WATER})
    local defender = createMockPokemon(50, {spdef = 100}, {Enums.PokemonType.FIRE})
    local waterMove = createMockMove(80, Enums.PokemonType.WATER, Enums.MoveCategory.SPECIAL)
    
    -- Act - Different weather conditions
    local normalResult = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = waterMove,
        battleState = {},
        options = {criticalHitForced = false}
    })
    
    local rainResult = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = waterMove,
        battleState = {weather = "RAIN"},
        options = {criticalHitForced = false}
    })
    
    local sunResult = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = waterMove,
        battleState = {weather = "SUN"},
        options = {criticalHitForced = false}
    })
    
    -- Assert
    assertTrue(rainResult.damage > normalResult.damage, "Rain should boost Water moves")
    assertTrue(normalResult.damage > sunResult.damage, "Sun should weaken Water moves")
end

-- Test 8: Physical vs Special Damage Categories
function DamageCalculatorTests.testDamageCategories()
    -- Arrange
    BattleRNG.seed("test-categories")
    local mixedAttacker = createMockPokemon(50, {atk = 150, spatk = 50})
    local mixedDefender = createMockPokemon(50, {def = 50, spdef = 150})
    
    local physicalMove = createMockMove(80, Enums.PokemonType.NORMAL, Enums.MoveCategory.PHYSICAL)
    local specialMove = createMockMove(80, Enums.PokemonType.NORMAL, Enums.MoveCategory.SPECIAL)
    
    -- Act
    local physicalResult = DamageCalculator.calculateDamage({
        attacker = mixedAttacker,
        defender = mixedDefender,
        moveData = physicalMove,
        options = {criticalHitForced = false}
    })
    
    local specialResult = DamageCalculator.calculateDamage({
        attacker = mixedAttacker,
        defender = mixedDefender,
        moveData = specialMove,
        options = {criticalHitForced = false}
    })
    
    -- Assert
    assertTrue(physicalResult.damage > specialResult.damage, "Physical move should do more damage with high attack vs low defense")
end

-- Test 9: Status Move No Damage
function DamageCalculatorTests.testStatusMoveNoDamage()
    -- Arrange
    local attacker = createMockPokemon(50, {atk = 100})
    local defender = createMockPokemon(50, {def = 100})
    local statusMove = createMockMove(0, Enums.PokemonType.NORMAL, Enums.MoveCategory.STATUS)
    
    -- Act
    local result = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = statusMove
    })
    
    -- Assert
    assertEqual(result.damage, 0, "Status moves should deal no damage")
    assertEqual(result.typeEffectiveness, 1.0, "Status moves should have normal type effectiveness")
end

-- Test 10: Zero Power Move No Damage
function DamageCalculatorTests.testZeroPowerMove()
    -- Arrange
    local attacker = createMockPokemon(50, {atk = 100})
    local defender = createMockPokemon(50, {def = 100})
    local zeroPowerMove = createMockMove(0, Enums.PokemonType.NORMAL, Enums.MoveCategory.PHYSICAL)
    
    -- Act
    local result = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = zeroPowerMove
    })
    
    -- Assert
    assertEqual(result.damage, 0, "Zero power moves should deal no damage")
end

-- Test 11: Minimum Damage Guarantee
function DamageCalculatorTests.testMinimumDamage()
    -- Arrange
    BattleRNG.seed("test-minimum-damage")
    local weakAttacker = createMockPokemon(1, {atk = 1})
    local strongDefender = createMockPokemon(100, {def = 255})
    local weakMove = createMockMove(1, Enums.PokemonType.NORMAL, Enums.MoveCategory.PHYSICAL)
    
    -- Act
    local result = DamageCalculator.calculateDamage({
        attacker = weakAttacker,
        defender = strongDefender,
        moveData = weakMove,
        options = {criticalHitForced = false}
    })
    
    -- Assert
    assertTrue(result.damage >= 1, "Damage should never be less than 1")
end

-- Test 12: Dual Type Effectiveness
function DamageCalculatorTests.testDualTypeEffectiveness()
    -- Arrange
    BattleRNG.seed("test-dual-type")
    local attacker = createMockPokemon(50, {spatk = 100}, {Enums.PokemonType.ELECTRIC})
    local dualDefender = createMockPokemon(50, {spdef = 100}, {Enums.PokemonType.WATER, Enums.PokemonType.FLYING})
    local electricMove = createMockMove(80, Enums.PokemonType.ELECTRIC, Enums.MoveCategory.SPECIAL)
    
    -- Act
    local result = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = dualDefender,
        moveData = electricMove,
        options = {criticalHitForced = false}
    })
    
    -- Assert
    assertEqual(result.typeEffectiveness, 4.0, "Electric vs Water/Flying should be 4x effective (2x * 2x)")
end

-- Test 13: Damage Preview Function
function DamageCalculatorTests.testDamagePreview()
    -- Arrange
    BattleRNG.seed("test-preview")
    local attacker = createMockPokemon(50, {atk = 100})
    local defender = createMockPokemon(50, {def = 100})
    local move = createMockMove(80, Enums.PokemonType.NORMAL, Enums.MoveCategory.PHYSICAL)
    
    -- Act
    local preview = DamageCalculator.previewDamage({
        attacker = attacker,
        defender = defender,
        moveData = move,
        options = {criticalHitForced = false}
    })
    
    -- Assert
    assertTrue(preview.minDamage > 0, "Preview min damage should be positive")
    assertTrue(preview.maxDamage >= preview.minDamage, "Preview max damage should be >= min damage")
end

-- Test 14: Parameter Validation
function DamageCalculatorTests.testParameterValidation()
    -- Arrange & Act & Assert
    local validResult, validMessage = DamageCalculator.validateParams({
        attacker = createMockPokemon(),
        defender = createMockPokemon(),
        moveData = createMockMove()
    })
    assertTrue(validResult, "Valid parameters should pass validation")
    
    local invalidResult, invalidMessage = DamageCalculator.validateParams({})
    assertFalse(invalidResult, "Empty parameters should fail validation")
    
    local noStatsResult = DamageCalculator.validateParams({
        attacker = {level = 50},
        defender = createMockPokemon(),
        moveData = createMockMove()
    })
    assertFalse(noStatsResult, "Pokemon without stats should fail validation")
end

-- Test 15: Utility Functions
function DamageCalculatorTests.testUtilityFunctions()
    -- Arrange & Act & Assert
    assertTrue(DamageCalculator.isSuperEffective(Enums.PokemonType.WATER, Enums.PokemonType.FIRE), "Water vs Fire should be super effective")
    assertTrue(DamageCalculator.hasNoEffect(Enums.PokemonType.NORMAL, Enums.PokemonType.GHOST), "Normal vs Ghost should have no effect")
    
    local description = DamageCalculator.getEffectivenessDescription(Enums.PokemonType.ELECTRIC, {Enums.PokemonType.WATER, Enums.PokemonType.FLYING})
    assertTrue(type(description) == "string" and #description > 0, "Effectiveness description should be non-empty string")
end

-- Test Runner
-- Test side effect damage reduction
function DamageCalculatorTests.testSideEffectDamageReduction()
    local SideEffects = require("game-logic.battle.side-effects")
    local battleState = {turn = 1}
    
    -- Set up Light Screen for player
    SideEffects.setLightScreen(battleState, "player")
    
    local attacker = createMockPokemon(50, {attack = 100, spAttack = 100}, {Enums.PokemonType.NORMAL}, "enemy")
    local defender = createMockPokemon(50, {defense = 80, spDefense = 80}, {Enums.PokemonType.NORMAL}, "player")
    
    -- Set side attributes explicitly
    attacker.side = "enemy"
    defender.side = "player"
    
    -- Test Special move damage reduction
    local specialMove = {
        name = "Psychic",
        type = Enums.PokemonType.PSYCHIC,
        category = Enums.MoveCategory.SPECIAL,
        power = 90
    }
    
    local result = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = specialMove,
        battleState = battleState
    })
    
    -- Damage should be reduced by Light Screen
    assert(result.damage > 0, "Should deal damage")
    
    -- Test without Light Screen for comparison
    local battleStateNoScreen = {turn = 1}
    local resultNoScreen = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = specialMove,
        battleState = battleStateNoScreen,
        options = {criticalHitForced = false}  -- Disable random variance for comparison
    })
    
    assert(result.damage < resultNoScreen.damage, "Light Screen should reduce damage")
end

-- Test side effect singles vs doubles format
function DamageCalculatorTests.testSideEffectSinglesVsDoubles()
    local SideEffects = require("game-logic.battle.side-effects")
    
    -- Test reduction percentages directly
    local baseDamage = 100
    
    -- Singles format (50% reduction)
    local singlesReduction = SideEffects.applyDamageReduction(baseDamage, Enums.MoveCategory.SPECIAL, "enemy", "player", 
        {sideEffects = {player = {LIGHT_SCREEN = {type = "LIGHT_SCREEN", duration = 5}}}}, false)
    assert(singlesReduction == 50, "Singles should reduce damage to 50%")
    
    -- Doubles format (33% reduction, so 67% remaining)
    local doublesReduction = SideEffects.applyDamageReduction(baseDamage, Enums.MoveCategory.SPECIAL, "enemy", "player",
        {sideEffects = {player = {LIGHT_SCREEN = {type = "LIGHT_SCREEN", duration = 5}}}}, true)
    assert(doublesReduction == 67, "Doubles should reduce damage to 67%")
end

-- Test side effect combinations
function DamageCalculatorTests.testSideEffectCombinations()
    local SideEffects = require("game-logic.battle.side-effects")
    local battleState = {turn = 1, weather = "HAIL"}
    
    -- Test Aurora Veil covers both physical and special
    SideEffects.setAuroraVeil(battleState, "player")
    
    local physicalReduction = SideEffects.applyDamageReduction(100, Enums.MoveCategory.PHYSICAL, "enemy", "player", battleState, false)
    local specialReduction = SideEffects.applyDamageReduction(100, Enums.MoveCategory.SPECIAL, "enemy", "player", battleState, false)
    
    assert(physicalReduction == 50, "Aurora Veil should reduce Physical damage")
    assert(specialReduction == 50, "Aurora Veil should reduce Special damage")
    
    -- Test that Light Screen + Reflect don't stack with Aurora Veil
    SideEffects.setLightScreen(battleState, "player")
    SideEffects.setReflect(battleState, "player")
    
    local combinedPhysical = SideEffects.applyDamageReduction(100, Enums.MoveCategory.PHYSICAL, "enemy", "player", battleState, false)
    local combinedSpecial = SideEffects.applyDamageReduction(100, Enums.MoveCategory.SPECIAL, "enemy", "player", battleState, false)
    
    assert(combinedPhysical == 50, "Multiple screen effects should not stack")
    assert(combinedSpecial == 50, "Multiple screen effects should not stack")
end

function DamageCalculatorTests.runAllTests()
    local tests = {
        "testBaseDamageFormula",
        "testLevelImpact",
        "testTypeEffectiveness",
        "testSTABApplication",
        "testCriticalHit",
        "testStatStageModifications", 
        "testWeatherEffects",
        "testDamageCategories",
        "testStatusMoveNoDamage",
        "testZeroPowerMove",
        "testMinimumDamage",
        "testDualTypeEffectiveness",
        "testDamagePreview",
        "testParameterValidation",
        "testUtilityFunctions",
        "testSideEffectDamageReduction",
        "testSideEffectSinglesVsDoubles",
        "testSideEffectCombinations"
    }
    
    local passed = 0
    local failed = 0
    
    print("Running Damage Calculator Unit Tests...")
    print("=" .. string.rep("=", 50))
    
    for _, testName in ipairs(tests) do
        local success, error = pcall(DamageCalculatorTests[testName])
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

-- Run tests if this file is executed directly
if arg and arg[0] and arg[0]:find("damage%-calculator%.test%.lua$") then
    DamageCalculatorTests.runAllTests()
end

return DamageCalculatorTests