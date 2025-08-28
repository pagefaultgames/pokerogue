-- Integration Tests for Damage Calculation System
-- Tests damage calculation within complete battle message processing workflows
-- Validates damage effects on Pokemon HP and battle state persistence

local DamageCalculator = require("game-logic.battle.damage-calculator")
local TurnProcessor = require("game-logic.battle.turn-processor")
local BattleRNG = require("game-logic.rng.battle-rng")
local Enums = require("data.constants.enums")

local DamageCalculationIntegrationTests = {}

-- Test framework functions
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

local function assertTrue(condition, message)
    assert(condition, message)
end

local function assertFalse(condition, message)
    assert(not condition, message)
end

-- Helper function to create complete Pokemon for integration testing
local function createBattlePokemon(speciesId, level, stats, types, moves, hp)
    return {
        id = "pokemon-" .. (speciesId or 1),
        speciesId = speciesId or Enums.SpeciesId.BULBASAUR,
        name = Enums.getSpeciesName(speciesId or Enums.SpeciesId.BULBASAUR),
        level = level or 50,
        stats = stats or {hp = 150, atk = 100, def = 100, spatk = 100, spdef = 100, spd = 100},
        types = types or {Enums.PokemonType.GRASS, Enums.PokemonType.POISON},
        moves = moves or {
            {id = Enums.MoveId.TACKLE, pp = 35, maxPP = 35},
            {id = Enums.MoveId.VINE_WHIP, pp = 25, maxPP = 25},
            {id = Enums.MoveId.RAZOR_LEAF, pp = 25, maxPP = 25},
            {id = Enums.MoveId.SOLAR_BEAM, pp = 10, maxPP = 10}
        },
        currentHP = hp or (stats and stats.hp) or 150,
        maxHP = (stats and stats.hp) or 150,
        status = nil,
        fainted = false,
        battleData = {
            statStages = {atk = 0, def = 0, spatk = 0, spdef = 0, spd = 0, acc = 0, eva = 0},
            conditions = {}
        }
    }
end

-- Helper function to create move data for testing
local function createMoveData(moveId, power, type, category, accuracy)
    return {
        id = moveId or Enums.MoveId.TACKLE,
        power = power or 40,
        type = type or Enums.PokemonType.NORMAL,
        category = category or Enums.MoveCategory.PHYSICAL,
        accuracy = accuracy or 100,
        pp = 35,
        priority = 0,
        criticalHitRatio = 0,
        flags = {},
        target = Enums.MoveTarget.NEAR_ENEMY
    }
end

-- Helper function to create test battle state
local function createTestBattleState(battleId, playerParty, enemyParty, conditions)
    local battleState = {
        battleId = battleId or "test-battle-001",
        battleSeed = "test-seed-12345",
        turn = 1,
        phase = "COMMAND_SELECTION",
        playerParty = playerParty or {},
        enemyParty = enemyParty or {},
        activePokemon = {
            player = playerParty and playerParty[1] or nil,
            enemy = enemyParty and enemyParty[1] or nil
        },
        battleConditions = conditions or {
            weather = nil,
            terrain = nil,
            fieldEffects = {}
        },
        turnOrder = {},
        pendingActions = {},
        interruptQueue = {},
        battleResult = nil
    }
    
    -- Initialize battle RNG with battle state
    BattleRNG.initBattle(battleState.battleId, battleState.battleSeed)
    
    return battleState
end

-- Test 1: Basic Damage Application in Battle Context
function DamageCalculationIntegrationTests.testBasicDamageApplication()
    -- Arrange
    local attacker = createBattlePokemon(Enums.SpeciesId.CHARMANDER, 50, 
        {hp = 120, atk = 120, def = 80, spatk = 100, spdef = 85, spd = 95}, 
        {Enums.PokemonType.FIRE})
    local defender = createBattlePokemon(Enums.SpeciesId.BULBASAUR, 50,
        {hp = 150, atk = 100, def = 100, spatk = 120, spdef = 120, spd = 90},
        {Enums.PokemonType.GRASS, Enums.PokemonType.POISON}, nil, 150)
    
    local battleState = createTestBattleState("test-damage-basic", {attacker}, {defender})
    local moveData = createMoveData(Enums.MoveId.EMBER, 40, Enums.PokemonType.FIRE, Enums.MoveCategory.SPECIAL)
    
    -- Act
    local damageResult = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = moveData,
        battleState = battleState
    })
    
    -- Simulate damage application to defender
    local originalHP = defender.currentHP
    defender.currentHP = math.max(0, defender.currentHP - damageResult.damage)
    
    -- Assert
    assertTrue(damageResult.damage > 0, "Damage should be dealt")
    assertTrue(damageResult.typeEffectiveness == 2.0, "Fire vs Grass should be super effective")
    assertTrue(damageResult.stab, "Fire Pokemon using Fire move should get STAB")
    assertTrue(defender.currentHP < originalHP, "Defender HP should be reduced")
    assertFalse(defender.fainted, "Defender should not faint from single ember")
end

-- Test 2: Multi-Turn Damage Accumulation
function DamageCalculationIntegrationTests.testMultiTurnDamageAccumulation()
    -- Arrange
    local attacker = createBattlePokemon(Enums.SpeciesId.MACHOP, 50,
        {hp = 140, atk = 140, def = 100, spatk = 70, spdef = 90, spd = 70},
        {Enums.PokemonType.FIGHTING})
    local defender = createBattlePokemon(Enums.SpeciesId.GEODUDE, 50,
        {hp = 120, atk = 120, def = 160, spatk = 60, spdef = 90, spd = 40},
        {Enums.PokemonType.ROCK, Enums.PokemonType.GROUND}, nil, 120)
    
    local battleState = createTestBattleState("test-multi-turn", {attacker}, {defender})
    local moveData = createMoveData(Enums.MoveId.KARATE_CHOP, 50, Enums.PokemonType.FIGHTING, Enums.MoveCategory.PHYSICAL)
    
    local originalHP = defender.currentHP
    local totalDamageDealt = 0
    
    -- Act - Simulate 3 turns of damage
    for turn = 1, 3 do
        battleState.turn = turn
        
        local damageResult = DamageCalculator.calculateDamage({
            attacker = attacker,
            defender = defender,
            moveData = moveData,
            battleState = battleState
        })
        
        defender.currentHP = math.max(0, defender.currentHP - damageResult.damage)
        totalDamageDealt = totalDamageDealt + damageResult.damage
        
        if defender.currentHP <= 0 then
            defender.fainted = true
            break
        end
    end
    
    -- Assert
    assertTrue(totalDamageDealt > 0, "Total damage should be accumulated")
    assertTrue(defender.currentHP < originalHP, "Defender should have lost HP over multiple turns")
    if not defender.fainted then
        assertTrue(defender.currentHP >= 0, "Defender HP should not be negative if not fainted")
    else
        assertTrue(defender.currentHP == 0, "Fainted defender should have 0 HP")
    end
end

-- Test 3: Weather Effects on Damage in Battle Context  
function DamageCalculationIntegrationTests.testWeatherEffectsInBattle()
    -- Arrange
    BattleRNG.seed("test-weather-effects")  -- Initialize RNG first
    
    local attacker = createBattlePokemon(Enums.SpeciesId.SQUIRTLE, 50,
        {hp = 135, atk = 90, def = 110, spatk = 100, spdef = 110, spd = 80},
        {Enums.PokemonType.WATER})
    local defender = createBattlePokemon(Enums.SpeciesId.CHARMANDER, 50,
        {hp = 120, atk = 100, def = 80, spatk = 100, spdef = 85, spd = 95},
        {Enums.PokemonType.FIRE}, nil, 120)
    
    local moveData = createMoveData(Enums.MoveId.WATER_GUN, 40, Enums.PokemonType.WATER, Enums.MoveCategory.SPECIAL)
    
    -- Use previewDamage to test weather effects without variance
    local normalPreview = DamageCalculator.previewDamage({
        attacker = attacker,
        defender = defender,
        moveData = moveData,
        battleState = {weather = nil}
    })
    
    local rainPreview = DamageCalculator.previewDamage({
        attacker = attacker,
        defender = defender,
        moveData = moveData,
        battleState = {weather = "RAIN"}
    })
    
    local sunPreview = DamageCalculator.previewDamage({
        attacker = attacker,
        defender = defender,
        moveData = moveData,
        battleState = {weather = "SUN"}
    })
    
    -- Assert weather effects
    assertTrue(rainPreview.maxDamage > normalPreview.maxDamage, "Rain should boost Water moves")
    assertTrue(normalPreview.maxDamage > sunPreview.maxDamage, "Sun should weaken Water moves")
    assertTrue(rainPreview.typeEffectiveness == normalPreview.typeEffectiveness, "Type effectiveness should be consistent")
    assertTrue(sunPreview.typeEffectiveness == normalPreview.typeEffectiveness, "Type effectiveness should be consistent")
end

-- Test 4: Critical Hits and Battle State Impact
function DamageCalculationIntegrationTests.testCriticalHitsInBattle()
    -- Arrange
    local attacker = createBattlePokemon(Enums.SpeciesId.MEOWTH, 50,
        {hp = 120, atk = 90, def = 85, spatk = 80, spdef = 80, spd = 110},
        {Enums.PokemonType.NORMAL})
    local defender = createBattlePokemon(Enums.SpeciesId.RATTATA, 50,
        {hp = 105, atk = 105, def = 70, spatk = 60, spdef = 70, spd = 130},
        {Enums.PokemonType.NORMAL}, nil, 105)
    
    local battleState = createTestBattleState("test-critical-hits", {attacker}, {defender})
    local moveData = createMoveData(Enums.MoveId.SLASH, 70, Enums.PokemonType.NORMAL, Enums.MoveCategory.PHYSICAL)
    moveData.criticalHitRatio = 1  -- Higher crit chance
    
    local criticalHits = 0
    local normalHits = 0
    local totalTests = 50  -- Run multiple tests to check crit ratio
    
    -- Act - Run multiple damage calculations
    for i = 1, totalTests do
        BattleRNG.seed("test-crit-" .. i)  -- Different seed each time
        local result = DamageCalculator.calculateDamage({
            attacker = attacker,
            defender = defender,
            moveData = moveData,
            battleState = battleState
        })
        
        if result.criticalHit then
            criticalHits = criticalHits + 1
        else
            normalHits = normalHits + 1
        end
    end
    
    -- Assert
    assertTrue(criticalHits > 0, "Should have some critical hits with enhanced crit ratio")
    assertTrue(normalHits > 0, "Should have some normal hits")
    assertTrue(criticalHits + normalHits == totalTests, "All hits should be accounted for")
end

-- Test 5: Fainting Pokemon Through Damage
function DamageCalculationIntegrationTests.testPokemonFaintingThroughDamage()
    -- Arrange
    local attacker = createBattlePokemon(Enums.SpeciesId.MACHAMP, 60,
        {hp = 180, atk = 200, def = 120, spatk = 110, spdef = 120, spd = 95},
        {Enums.PokemonType.FIGHTING})
    local defender = createBattlePokemon(Enums.SpeciesId.ABRA, 30,
        {hp = 50, atk = 40, def = 30, spatk = 160, spdef = 90, spd = 150},
        {Enums.PokemonType.PSYCHIC}, nil, 50)  -- Low HP, should faint easily
    
    local battleState = createTestBattleState("test-fainting", {attacker}, {defender})
    local moveData = createMoveData(Enums.MoveId.MEGA_PUNCH, 80, Enums.PokemonType.NORMAL, Enums.MoveCategory.PHYSICAL)
    
    -- Act
    local damageResult = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = moveData,
        battleState = battleState
    })
    
    -- Apply damage and check for fainting
    defender.currentHP = math.max(0, defender.currentHP - damageResult.damage)
    if defender.currentHP <= 0 then
        defender.fainted = true
    end
    
    -- Assert
    assertTrue(damageResult.damage > 0, "Damage should be dealt")
    assertTrue(defender.currentHP == 0, "Defender should have 0 HP")
    assertTrue(defender.fainted, "Defender should be marked as fainted")
end

-- Test 6: Stat Stage Effects on Damage in Battle Context
function DamageCalculationIntegrationTests.testStatStagesInBattleContext()
    -- Arrange
    local attacker = createBattlePokemon(Enums.SpeciesId.GROWLITHE, 50,
        {hp = 140, atk = 130, def = 90, spatk = 130, spdef = 90, spd = 110},
        {Enums.PokemonType.FIRE})
    local defender = createBattlePokemon(Enums.SpeciesId.PSYDUCK, 50,
        {hp = 140, atk = 100, def = 90, spatk = 110, spdef = 90, spd = 95},
        {Enums.PokemonType.WATER}, nil, 140)
    
    local battleState = createTestBattleState("test-stat-stages", {attacker}, {defender})
    local moveData = createMoveData(Enums.MoveId.FLAME_WHEEL, 60, Enums.PokemonType.FIRE, Enums.MoveCategory.PHYSICAL)
    
    -- Act - Normal stats
    local normalResult = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = moveData,
        battleState = battleState
    })
    
    -- Boost attacker's attack by 2 stages
    attacker.battleData.statStages.atk = 2
    local boostedResult = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = moveData,
        battleState = battleState
    })
    
    -- Lower attacker's attack by 2 stages  
    attacker.battleData.statStages.atk = -2
    local loweredResult = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = moveData,
        battleState = battleState
    })
    
    -- Assert
    assertTrue(boostedResult.damage > normalResult.damage, "Boosted attack should increase damage")
    assertTrue(normalResult.damage > loweredResult.damage, "Lowered attack should decrease damage")
    assertTrue(boostedResult.details.attackStages == 2, "Attack stages should be tracked")
    assertTrue(loweredResult.details.attackStages == -2, "Negative attack stages should be tracked")
end

-- Test 7: Type Effectiveness in Complex Battle Scenarios
function DamageCalculationIntegrationTests.testComplexTypeEffectiveness()
    -- Arrange
    local electricAttacker = createBattlePokemon(Enums.SpeciesId.PIKACHU, 50,
        {hp = 110, atk = 100, def = 80, spatk = 100, spdef = 100, spd = 150},
        {Enums.PokemonType.ELECTRIC})
    local flyingDefender = createBattlePokemon(Enums.SpeciesId.PIDGEOT, 50,
        {hp = 150, atk = 120, def = 110, spatk = 130, spdef = 120, spd = 140},
        {Enums.PokemonType.NORMAL, Enums.PokemonType.FLYING}, nil, 150)
    
    local battleState = createTestBattleState("test-complex-effectiveness", {electricAttacker}, {flyingDefender})
    local thunderboltData = createMoveData(Enums.MoveId.THUNDERBOLT, 90, Enums.PokemonType.ELECTRIC, Enums.MoveCategory.SPECIAL)
    
    -- Act
    local result = DamageCalculator.calculateDamage({
        attacker = electricAttacker,
        defender = flyingDefender,
        moveData = thunderboltData,
        battleState = battleState
    })
    
    -- Assert
    assertTrue(result.typeEffectiveness == 2.0, "Electric should be super effective against Flying")
    assertTrue(result.stab, "Electric Pokemon using Electric move should get STAB")
    assertTrue(result.damage > 50, "Super effective STAB move should deal significant damage")
end

-- Test 8: Damage Persistence Across Battle Turns
function DamageCalculationIntegrationTests.testDamagePersistenceAcrossTurns()
    -- Arrange
    local attacker = createBattlePokemon(Enums.SpeciesId.ONIX, 40,
        {hp = 110, atk = 90, def = 200, spatk = 60, spdef = 90, spd = 95},
        {Enums.PokemonType.ROCK, Enums.PokemonType.GROUND})
    local defender = createBattlePokemon(Enums.SpeciesId.MAGIKARP, 20,
        {hp = 60, atk = 30, def = 90, spatk = 30, spdef = 60, spd = 120},
        {Enums.PokemonType.WATER}, nil, 60)
    
    local battleState = createTestBattleState("test-damage-persistence", {attacker}, {defender})
    local moveData = createMoveData(Enums.MoveId.ROCK_THROW, 50, Enums.PokemonType.ROCK, Enums.MoveCategory.PHYSICAL)
    
    local damageHistory = {}
    local hpHistory = {defender.currentHP}
    
    -- Act - Multiple turns with damage persistence
    for turn = 1, 4 do
        battleState.turn = turn
        
        local damageResult = DamageCalculator.calculateDamage({
            attacker = attacker,
            defender = defender,
            moveData = moveData,
            battleState = battleState
        })
        
        defender.currentHP = math.max(0, defender.currentHP - damageResult.damage)
        
        table.insert(damageHistory, damageResult.damage)
        table.insert(hpHistory, defender.currentHP)
        
        if defender.currentHP <= 0 then
            defender.fainted = true
            break
        end
    end
    
    -- Assert
    assertTrue(#damageHistory > 0, "Damage should be recorded across turns")
    assertTrue(#hpHistory == #damageHistory + 1, "HP history should track damage application")
    assertTrue(hpHistory[1] > hpHistory[#hpHistory], "HP should decrease over turns")
    
    for i = 1, #damageHistory do
        assertTrue(damageHistory[i] > 0, "Each turn should deal damage")
    end
end

-- Test Runner
function DamageCalculationIntegrationTests.runAllTests()
    local tests = {
        "testBasicDamageApplication",
        "testMultiTurnDamageAccumulation", 
        "testWeatherEffectsInBattle",
        "testCriticalHitsInBattle",
        "testPokemonFaintingThroughDamage",
        "testStatStagesInBattleContext",
        "testComplexTypeEffectiveness",
        "testDamagePersistenceAcrossTurns"
    }
    
    local passed = 0
    local failed = 0
    
    print("Running Damage Calculation Integration Tests...")
    print("=" .. string.rep("=", 60))
    
    for _, testName in ipairs(tests) do
        local success, error = pcall(DamageCalculationIntegrationTests[testName])
        if success then
            print("✓ " .. testName)
            passed = passed + 1
        else
            print("✗ " .. testName .. ": " .. tostring(error))
            failed = failed + 1
        end
    end
    
    print("=" .. string.rep("=", 60))
    print(string.format("Integration tests completed: %d passed, %d failed", passed, failed))
    
    if failed > 0 then
        error(string.format("Integration tests failed: %d/%d tests failed", failed, passed + failed))
    end
    
    return {passed = passed, failed = failed}
end

-- Run tests if this file is executed directly
if arg and arg[0] and arg[0]:find("damage%-calculation%-integration%.test%.lua$") then
    DamageCalculationIntegrationTests.runAllTests()
end

return DamageCalculationIntegrationTests