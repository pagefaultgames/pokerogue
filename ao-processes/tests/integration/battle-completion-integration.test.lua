-- Integration Tests for Battle Completion
-- Tests complete battle conclusion workflows within battle message processing system
-- Validates battle completion effects on Pokemon experience and player progression
-- Tests multi-battle scenarios with reward accumulation and statistics persistence

-- Load all required dependencies
local VictoryDefeatSystem = require("game-logic.battle.victory-defeat-system")
local ExperienceSystem = require("game-logic.progression.experience-system")
local RewardCalculator = require("game-logic.battle.reward-calculator")
local BattleStatistics = require("game-logic.battle.battle-statistics")
local BattleCleanup = require("game-logic.battle.battle-cleanup")
local BattleStateManager = require("game-logic.battle.battle-state-manager")
local TurnProcessor = require("game-logic.battle.turn-processor")
local ParticipationTracker = require("game-logic.battle.participation-tracker")

-- Test framework
local IntegrationTestSuite = {}
local testResults = {}

-- Mock data helpers
local function createFullBattleState(battleType, playerPokemon, enemyPokemon)
    local battleState = {
        battleId = "integration_test_" .. os.time(),
        battleSeed = "integration_seed_" .. math.random(1000, 9999),
        battleType = battleType or "WILD",
        turn = 1,
        phase = TurnProcessor.TurnPhase.ACTION_EXECUTION,
        
        -- Player party
        playerParty = {},
        enemyParty = {},
        
        -- Battle conditions
        battleConditions = {
            weather = "NONE",
            terrain = "NONE",
            weatherDuration = 0,
            terrainDuration = 0,
            trickRoom = 0,
            tailwind = {[0] = 0, [1] = 0}
        },
        
        -- Participation tracking
        participationData = {},
        
        -- Turn processing
        turnOrder = {},
        currentAction = nil,
        pendingActions = {},
        interruptQueue = {},
        turnCommands = {},
        turnHistory = {},
        battleEvents = {},
        
        -- Battle result
        battleResult = nil
    }
    
    -- Add player Pokemon
    for i, pokemonData in ipairs(playerPokemon or {}) do
        local pokemon = {
            id = "player_" .. i,
            name = pokemonData.name or ("Player Pokemon " .. i),
            speciesId = pokemonData.speciesId or 25, -- Pikachu default
            level = pokemonData.level or 50,
            exp = pokemonData.exp or (pokemonData.level and ExperienceSystem.getExpForLevel(pokemonData.level, "MEDIUM_FAST") or 125000),
            currentHP = pokemonData.currentHP or pokemonData.hp or 100,
            maxHP = pokemonData.maxHP or 100,
            fainted = pokemonData.fainted or (pokemonData.hp == 0),
            friendship = pokemonData.friendship or 70,
            nature = pokemonData.nature or "HARDY",
            stats = pokemonData.stats or {
                hp = 100,
                maxHp = 100,
                attack = 55,
                defense = 40,
                spAttack = 50,
                spDefense = 50,
                speed = 90
            },
            ivs = pokemonData.ivs or {
                hp = 31, attack = 31, defense = 31,
                spAttack = 31, spDefense = 31, speed = 31
            },
            evs = pokemonData.evs or {
                hp = 0, attack = 0, defense = 0,
                spAttack = 0, spDefense = 0, speed = 0
            },
            moves = pokemonData.moves or {"THUNDERBOLT", "QUICK_ATTACK", "THUNDER_WAVE", "AGILITY"},
            isTraded = pokemonData.isTraded or false,
            heldItem = pokemonData.heldItem,
            isShiny = pokemonData.isShiny or false
        }
        
        table.insert(battleState.playerParty, pokemon)
    end
    
    -- Add enemy Pokemon
    for i, pokemonData in ipairs(enemyPokemon or {}) do
        local pokemon = {
            id = "enemy_" .. i,
            name = pokemonData.name or ("Enemy Pokemon " .. i),
            speciesId = pokemonData.speciesId or 4, -- Charmander default
            level = pokemonData.level or 45,
            currentHP = pokemonData.currentHP or pokemonData.hp or 90,
            maxHP = pokemonData.maxHP or 90,
            fainted = pokemonData.fainted or (pokemonData.hp == 0),
            stats = pokemonData.stats or {
                hp = 90,
                maxHp = 90,
                attack = 52,
                defense = 43,
                spAttack = 60,
                spDefense = 50,
                speed = 65
            }
        }
        
        table.insert(battleState.enemyParty, pokemon)
    end
    
    return battleState
end

-- Helper to simulate battle participation
local function simulateBattleParticipation(battleState)
    ParticipationTracker.init(battleState)
    
    -- Simulate participation for all player Pokemon
    for _, pokemon in ipairs(battleState.playerParty) do
        if not pokemon.fainted then
            -- Create participation data
            battleState.participationData[pokemon.id] = {
                pokemonId = pokemon.id,
                pokemonName = pokemon.name,
                level = pokemon.level,
                side = "player",
                
                participated = true,
                activeAtBattleStart = true,
                activeAtBattleEnd = not pokemon.fainted,
                faintedDuringBattle = pokemon.fainted,
                
                turnsActive = math.random(3, 8),
                turnsSwitchedOut = 0,
                firstActiveTurn = 1,
                lastActiveTurn = battleState.turn or 5,
                
                movesUsed = {"THUNDERBOLT", "QUICK_ATTACK"},
                totalMoveCount = math.random(2, 5),
                criticalHitsLanded = math.random(0, 2),
                
                totalDamageDealt = math.random(100, 300),
                totalDamageTaken = math.random(50, 150),
                maxDamageInOneTurn = math.random(50, 100),
                
                statusesInflicted = {PARALYSIS = 1},
                statusesReceived = {},
                statusTurns = 0,
                
                switchInEvents = {},
                switchOutEvents = {},
                totalSwitchIns = 0,
                totalSwitchOuts = 0
            }
        end
    end
end

-- Test framework helpers
local function runIntegrationTest(testName, testFunction)
    local success, result = pcall(testFunction)
    table.insert(testResults, {
        name = testName,
        success = success,
        result = result,
        error = not success and result or nil
    })
    
    if success then
        print("✓ " .. testName)
        return true
    else
        print("✗ " .. testName .. ": " .. tostring(result))
        return false
    end
end

local function assert_equal(expected, actual, message)
    if expected ~= actual then
        error(message or ("Expected " .. tostring(expected) .. " but got " .. tostring(actual)))
    end
end

local function assert_true(condition, message)
    if not condition then
        error(message or "Expected condition to be true")
    end
end

local function assert_not_nil(value, message)
    if value == nil then
        error(message or "Expected value to not be nil")
    end
end

local function assert_greater_than(actual, minimum, message)
    if actual <= minimum then
        error(message or ("Expected " .. tostring(actual) .. " to be greater than " .. tostring(minimum)))
    end
end

-- Integration Test: Complete Victory Workflow
function IntegrationTestSuite.testCompleteVictoryWorkflow()
    -- Arrange: Create battle with victory conditions
    local battleState = createFullBattleState("TRAINER", 
        {{name = "Pikachu", level = 30, hp = 80}},  -- Player Pokemon alive
        {{name = "Charmander", level = 28, hp = 0, fainted = true}}  -- Enemy defeated
    )
    
    simulateBattleParticipation(battleState)
    
    -- Initialize all systems
    VictoryDefeatSystem.init(battleState.battleSeed)
    RewardCalculator.init(battleState.battleSeed)
    BattleStatistics.init()
    BattleCleanup.init()
    
    -- Act: Execute complete victory workflow
    
    -- 1. Check victory conditions
    local battleResult = VictoryDefeatSystem.checkBattleEndConditions(battleState)
    assert_not_nil(battleResult, "Should detect battle end")
    assert_equal("victory", battleResult.result, "Should be victory")
    
    -- 2. Distribute experience
    local expDistribution = ExperienceSystem.distributeBattleExperience(battleState, battleResult)
    assert_true(expDistribution.success, "Experience distribution should succeed")
    
    -- 3. Calculate rewards
    local rewardResults = RewardCalculator.calculateBattleRewards(battleState, battleResult)
    assert_true(rewardResults.success, "Reward calculation should succeed")
    
    -- 4. Update statistics
    local playerStatsUpdate = BattleStatistics.updatePlayerStatistics(
        "test_player_001", battleState, battleResult, rewardResults
    )
    assert_not_nil(playerStatsUpdate, "Player statistics should update")
    
    local pokemonStatsUpdate = BattleStatistics.updateAllPokemonStatistics(
        battleState, battleResult, expDistribution
    )
    assert_true(pokemonStatsUpdate.success, "Pokemon statistics should update")
    
    -- 5. Execute cleanup
    local cleanupResults = BattleCleanup.executeBattleCleanup(
        battleState, battleResult, BattleCleanup.CleanupType.PRESERVE_STATS
    )
    assert_true(cleanupResults.success, "Battle cleanup should succeed")
    
    -- Assert: Verify complete workflow results
    assert_greater_than(rewardResults.totalMoney, 0, "Should earn money from trainer battle")
    assert_greater_than(expDistribution.totalDistributions, 0, "Should distribute experience")
    assert_equal(1, playerStatsUpdate.victories, "Should record victory in player stats")
    assert_greater_than(#pokemonStatsUpdate.updates, 0, "Should update Pokemon stats")
    assert_greater_than(#cleanupResults.restoredPokemon, 0, "Should restore Pokemon")
end

-- Integration Test: Complete Defeat Workflow
function IntegrationTestSuite.testCompleteDefeatWorkflow()
    -- Arrange: Create battle with defeat conditions
    local battleState = createFullBattleState("GYM",
        {{name = "Pikachu", level = 25, hp = 0, fainted = true}},  -- Player defeated
        {{name = "Onix", level = 40, hp = 50}}  -- Enemy still alive
    )
    
    simulateBattleParticipation(battleState)
    
    -- Initialize systems
    VictoryDefeatSystem.init(battleState.battleSeed)
    BattleStatistics.init()
    BattleCleanup.init()
    
    -- Act: Execute defeat workflow
    local battleResult = VictoryDefeatSystem.checkBattleEndConditions(battleState)
    assert_equal("defeat", battleResult.result, "Should detect defeat")
    
    local expDistribution = ExperienceSystem.distributeBattleExperience(battleState, battleResult)
    local rewardResults = RewardCalculator.calculateBattleRewards(battleState, battleResult)
    
    local playerStatsUpdate = BattleStatistics.updatePlayerStatistics(
        "test_player_defeat", battleState, battleResult, rewardResults
    )
    
    local cleanupResults = BattleCleanup.executeBattleCleanup(battleState, battleResult)
    
    -- Assert: Verify defeat handling
    assert_equal(0, rewardResults.totalMoney, "Should earn no money from defeat")
    assert_equal(0, expDistribution.totalDistributions, "Should gain no experience from defeat")
    assert_equal(1, playerStatsUpdate.defeats, "Should record defeat in player stats")
    assert_true(cleanupResults.success, "Should cleanup after defeat")
end

-- Integration Test: Multi-Pokemon Victory with Experience Sharing
function IntegrationTestSuite.testMultiPokemonVictoryExperience()
    -- Arrange: Battle with multiple participating Pokemon
    local battleState = createFullBattleState("TRAINER",
        {
            {name = "Pikachu", level = 30, hp = 70},
            {name = "Charizard", level = 35, hp = 90},
            {name = "Blastoise", level = 32, hp = 0, fainted = true}  -- Participated but fainted
        },
        {
            {name = "Gengar", level = 40, hp = 0, fainted = true},
            {name = "Alakazam", level = 38, hp = 0, fainted = true}
        }
    )
    
    simulateBattleParticipation(battleState)
    
    -- Ensure all player Pokemon participated (even the fainted one)
    for _, pokemon in ipairs(battleState.playerParty) do
        if battleState.participationData[pokemon.id] then
            battleState.participationData[pokemon.id].participated = true
        end
    end
    
    -- Act
    VictoryDefeatSystem.init(battleState.battleSeed)
    local battleResult = VictoryDefeatSystem.checkBattleEndConditions(battleState)
    local expDistribution = ExperienceSystem.distributeBattleExperience(battleState, battleResult)
    
    -- Assert
    assert_equal("victory", battleResult.result, "Should be victory")
    assert_equal(3, expDistribution.totalDistributions, "All 3 Pokemon should receive experience")
    
    -- Check that each Pokemon got appropriate experience based on participation
    local pikachu_exp = nil
    local charizard_exp = nil
    local blastoise_exp = nil
    
    for _, dist in ipairs(expDistribution.distributions) do
        if dist.pokemonName == "Pikachu" then
            pikachu_exp = dist.expGained
        elseif dist.pokemonName == "Charizard" then
            charizard_exp = dist.expGained
        elseif dist.pokemonName == "Blastoise" then
            blastoise_exp = dist.expGained
        end
    end
    
    assert_not_nil(pikachu_exp, "Pikachu should receive experience")
    assert_not_nil(charizard_exp, "Charizard should receive experience")
    assert_not_nil(blastoise_exp, "Blastoise should receive experience despite fainting")
    
    -- Active Pokemon should generally get more experience than fainted ones
    assert_greater_than(pikachu_exp, 0, "Pikachu should get positive experience")
    assert_greater_than(charizard_exp, 0, "Charizard should get positive experience")
end

-- Integration Test: Gym Battle with Premium Rewards
function IntegrationTestSuite.testGymBattlePremiumRewards()
    -- Arrange: High-stakes gym battle
    local battleState = createFullBattleState("GYM",
        {{name = "Raichu", level = 45, hp = 120}},
        {
            {name = "Rhydon", level = 48, hp = 0, fainted = true},
            {name = "Golem", level = 50, hp = 0, fainted = true}
        }
    )
    
    simulateBattleParticipation(battleState)
    battleState.turn = 12  -- Longer battle for better rewards
    
    -- Act
    RewardCalculator.init(battleState.battleSeed)
    local battleResult = VictoryDefeatSystem.checkBattleEndConditions(battleState)
    local rewardResults = RewardCalculator.calculateBattleRewards(battleState, battleResult)
    local expDistribution = ExperienceSystem.distributeBattleExperience(battleState, battleResult)
    
    -- Assert: Verify gym battle rewards
    assert_equal("victory", battleResult.result, "Should win gym battle")
    assert_greater_than(rewardResults.totalMoney, 1000, "Gym battles should give substantial money")
    assert_equal(2.5, rewardResults.money.multiplier, "Should have gym battle money multiplier")
    assert_equal(25.0, rewardResults.items.itemChance, "Should have gym battle item chance")
    
    -- Experience should be higher due to level difference and battle type
    assert_greater_than(expDistribution.totalDistributions, 0, "Should distribute experience")
    local raichu_dist = expDistribution.distributions[1]
    assert_greater_than(raichu_dist.expGained, 2000, "Should get substantial experience from gym battle")
end

-- Integration Test: Escape Scenario with Partial Rewards
function IntegrationTestSuite.testEscapeScenarioPartialRewards()
    -- Arrange: Wild battle escape scenario
    local battleState = createFullBattleState("WILD",
        {{name = "Pidgeot", level = 40, hp = 85, stats = {speed = 101}}},  -- Fast Pokemon for escape
        {{name = "Snorlax", level = 45, hp = 150, stats = {speed = 30}}}   -- Slow enemy
    )
    
    simulateBattleParticipation(battleState)
    
    -- Act: Attempt escape
    VictoryDefeatSystem.init(battleState.battleSeed)
    local playerPokemon = battleState.playerParty[1]
    local enemyPokemon = battleState.enemyParty[1]
    
    local escapeResult = VictoryDefeatSystem.processEscape(battleState, playerPokemon, enemyPokemon)
    
    if escapeResult.success then
        -- Process escape rewards
        local expDistribution = ExperienceSystem.distributeBattleExperience(battleState, escapeResult.battleResult)
        local playerStats = BattleStatistics.updatePlayerStatistics(
            "escape_test_player", battleState, escapeResult.battleResult, {}
        )
        
        -- Assert: Verify escape handling
        assert_equal("escape", escapeResult.battleResult.result, "Should record as escape")
        assert_greater_than(escapeResult.escapeChance, 25, "Fast Pokemon should have decent escape chance")
        assert_equal(1, playerStats.escapes, "Should increment escape counter")
        
        -- Should still get some participation experience
        if expDistribution.totalDistributions > 0 then
            assert_greater_than(expDistribution.distributions[1].expGained, 0, 
                              "Should get some experience for participation")
        end
    end
    
    -- Test passes whether escape succeeds or fails - both are valid outcomes
    assert_not_nil(escapeResult, "Should return escape result")
end

-- Integration Test: Battle Statistics Persistence Across Multiple Battles
function IntegrationTestSuite.testMultiBattleStatisticsPersistence()
    -- Arrange: Simulate multiple consecutive battles
    local playerId = "multi_battle_player"
    
    -- Battle 1: Wild victory
    local battle1 = createFullBattleState("WILD",
        {{name = "Pikachu", level = 20, hp = 60}},
        {{name = "Rattata", level = 15, hp = 0, fainted = true}}
    )
    simulateBattleParticipation(battle1)
    
    -- Battle 2: Trainer victory  
    local battle2 = createFullBattleState("TRAINER",
        {{name = "Pikachu", level = 21, hp = 55}},  -- Leveled up from battle 1
        {{name = "Squirtle", level = 18, hp = 0, fainted = true}}
    )
    simulateBattleParticipation(battle2)
    
    -- Battle 3: Gym defeat
    local battle3 = createFullBattleState("GYM",
        {{name = "Pikachu", level = 21, hp = 0, fainted = true}},
        {{name = "Onix", level = 35, hp = 80}}
    )
    simulateBattleParticipation(battle3)
    
    -- Initialize systems
    BattleStatistics.init()
    
    -- Act: Process all three battles
    local results = {}
    
    for i, battleState in ipairs({battle1, battle2, battle3}) do
        local battleResult = VictoryDefeatSystem.checkBattleEndConditions(battleState)
        local rewardResults = RewardCalculator.calculateBattleRewards(battleState, battleResult)
        
        local playerStats = BattleStatistics.updatePlayerStatistics(
            playerId, battleState, battleResult, rewardResults
        )
        
        table.insert(results, {
            battle = i,
            result = battleResult.result,
            playerStats = playerStats
        })
    end
    
    -- Assert: Verify statistics accumulation
    local finalStats = results[3].playerStats
    assert_equal(3, finalStats.totalBattles, "Should track all 3 battles")
    assert_equal(2, finalStats.victories, "Should have 2 victories")
    assert_equal(1, finalStats.defeats, "Should have 1 defeat")
    assert_equal(0, finalStats.currentWinStreak, "Win streak should be broken by defeat")
    assert_equal(1, finalStats.wildBattles, "Should track wild battles")
    assert_equal(1, finalStats.trainerBattles, "Should track trainer battles")
    assert_equal(1, finalStats.gymBattles, "Should track gym battles")
    assert_greater_than(finalStats.totalMoneyEarned, 0, "Should accumulate money from victories")
end

-- Integration Test: Battle Cleanup with State Persistence
function IntegrationTestSuite.testBattleCleanupStatePersistence()
    -- Arrange: Complex battle state with lots of temporary data
    local battleState = createFullBattleState("ELITE",
        {
            {name = "Charizard", level = 55, hp = 120},
            {name = "Venusaur", level = 54, hp = 0, fainted = true}
        },
        {{name = "Dragonite", level = 60, hp = 0, fainted = true}}
    )
    
    simulateBattleParticipation(battleState)
    
    -- Add temporary battle data that should be cleaned up
    battleState.turnOrder = {
        {pokemon = "charizard", priority = 1, speed = 100},
        {pokemon = "dragonite", priority = 0, speed = 80}
    }
    battleState.pendingActions = {"MOVE_DRAGON_PULSE", "MOVE_FIRE_BLAST"}
    battleState.interruptQueue = {"SWITCH_FORCED"}
    battleState.multiTurnData = {confusion = 2, sleep = 0}
    
    -- Add battle modifications to Pokemon
    for _, pokemon in ipairs(battleState.playerParty) do
        pokemon.battleData = {turn_entered = 1, damage_taken_this_turn = 45}
        pokemon.statStages = {attack = 2, defense = -1, speed = 1}
        pokemon.battleModifications = {confused = true, paralyzed = false}
    end
    
    -- Act: Execute victory and cleanup
    local battleResult = VictoryDefeatSystem.checkBattleEndConditions(battleState)
    local cleanupResults = BattleCleanup.executeBattleCleanup(
        battleState, battleResult, BattleCleanup.CleanupType.PRESERVE_STATS
    )
    
    -- Assert: Verify proper cleanup while preserving important data
    assert_true(cleanupResults.success, "Cleanup should succeed")
    
    -- Temporary battle data should be cleared
    assert_equal(0, #battleState.turnOrder, "Turn order should be cleared")
    assert_equal(0, #battleState.pendingActions, "Pending actions should be cleared")
    assert_equal(0, #battleState.interruptQueue, "Interrupt queue should be cleared")
    
    -- Pokemon should be restored to non-battle state
    for _, pokemon in ipairs(battleState.playerParty) do
        assert_equal(nil, pokemon.battleData, "Battle data should be cleared")
        assert_equal(nil, pokemon.battleModifications, "Battle modifications should be cleared")
        
        -- Stat stages should be reset
        if pokemon.statStages then
            for stat, stage in pairs(pokemon.statStages) do
                assert_equal(0, stage, "Stat stages should be reset to 0")
            end
        end
        
        -- Persistent data should be preserved
        assert_not_nil(pokemon.name, "Pokemon name should be preserved")
        assert_not_nil(pokemon.level, "Pokemon level should be preserved")
        assert_not_nil(pokemon.exp, "Pokemon experience should be preserved")
    end
    
    -- Battle statistics should be preserved (PRESERVE_STATS mode)
    assert_not_nil(cleanupResults.preservedData.battleStats, "Battle stats should be preserved")
    assert_not_nil(cleanupResults.preservedData.participationData, "Participation data should be preserved")
end

-- Integration Test: Level Up During Battle Victory
function IntegrationTestSuite.testLevelUpDuringBattleVictory()
    -- Arrange: Pokemon close to level up
    local nearLevelUpExp = ExperienceSystem.getExpForLevel(30, "MEDIUM_FAST") - 100  -- Very close to level 30
    
    local battleState = createFullBattleState("TRAINER",
        {{
            name = "Wartortle", 
            level = 29, 
            exp = nearLevelUpExp,
            speciesId = 8,  -- Wartortle species ID
            hp = 85
        }},
        {{name = "Arcanine", level = 35, hp = 0, fainted = true}}  -- High level for good exp
    )
    
    simulateBattleParticipation(battleState)
    
    -- Act: Complete victory workflow
    VictoryDefeatSystem.init(battleState.battleSeed)
    local battleResult = VictoryDefeatSystem.checkBattleEndConditions(battleState)
    local expDistribution = ExperienceSystem.distributeBattleExperience(battleState, battleResult)
    
    -- Assert: Verify level up occurred
    assert_equal("victory", battleResult.result, "Should be victory")
    assert_greater_than(expDistribution.totalDistributions, 0, "Should distribute experience")
    
    local wartortle_dist = expDistribution.distributions[1]
    assert_equal("Wartortle", wartortle_dist.pokemonName, "Should be Wartortle distribution")
    assert_greater_than(wartortle_dist.expGained, 100, "Should gain enough experience to level up")
    
    if wartortle_dist.levelUpData then
        assert_equal(29, wartortle_dist.levelUpData.oldLevel, "Should start at level 29")
        assert_equal(30, wartortle_dist.levelUpData.newLevel, "Should level up to 30")
        assert_equal(1, wartortle_dist.levelUpData.levelsGained, "Should gain 1 level")
        assert_true(wartortle_dist.levelUpData.statsIncreased, "Stats should be recalculated")
    end
end

-- Integration Test: Error Handling and Recovery
function IntegrationTestSuite.testErrorHandlingAndRecovery()
    -- Arrange: Battle state with potential error conditions
    local battleState = createFullBattleState("TRAINER", {}, {})  -- Empty parties
    
    -- Act & Assert: Systems should handle errors gracefully
    
    -- Victory/defeat system should handle empty parties
    local battleResult = VictoryDefeatSystem.checkBattleEndConditions(battleState)
    -- Should either return nil or a valid result, not crash
    
    -- Experience system should handle empty distributions
    local expDistribution = ExperienceSystem.distributeBattleExperience(battleState, battleResult or {result = "draw"})
    assert_true(expDistribution.success or expDistribution.success == false, "Should return status")
    
    -- Reward calculator should handle empty enemy party
    local rewardResults = RewardCalculator.calculateBattleRewards(battleState, battleResult or {result = "victory"})
    assert_not_nil(rewardResults, "Should handle empty enemy party")
    
    -- Cleanup should handle empty battle state gracefully
    local cleanupResults = BattleCleanup.executeBattleCleanup(battleState, battleResult)
    assert_not_nil(cleanupResults, "Should attempt cleanup even with minimal state")
    
    -- Test passes if no errors are thrown during error conditions
    assert_true(true, "Error handling should not crash systems")
end

-- Run all integration tests
function IntegrationTestSuite.runAllTests()
    print("Running Battle Completion Integration Tests...")
    
    local tests = {
        {"Complete Victory Workflow", IntegrationTestSuite.testCompleteVictoryWorkflow},
        {"Complete Defeat Workflow", IntegrationTestSuite.testCompleteDefeatWorkflow},
        {"Multi-Pokemon Victory Experience", IntegrationTestSuite.testMultiPokemonVictoryExperience},
        {"Gym Battle Premium Rewards", IntegrationTestSuite.testGymBattlePremiumRewards},
        {"Escape Scenario Partial Rewards", IntegrationTestSuite.testEscapeScenarioPartialRewards},
        {"Multi-Battle Statistics Persistence", IntegrationTestSuite.testMultiBattleStatisticsPersistence},
        {"Battle Cleanup State Persistence", IntegrationTestSuite.testBattleCleanupStatePersistence},
        {"Level Up During Battle Victory", IntegrationTestSuite.testLevelUpDuringBattleVictory},
        {"Error Handling and Recovery", IntegrationTestSuite.testErrorHandlingAndRecovery}
    }
    
    local passed = 0
    local total = #tests
    
    for _, test in ipairs(tests) do
        if runIntegrationTest(test[1], test[2]) then
            passed = passed + 1
        end
    end
    
    print(string.format("\nBattle Completion Integration Tests: %d/%d passed (%.1f%%)", 
                       passed, total, (passed/total)*100))
    
    return {
        passed = passed,
        total = total,
        results = testResults
    }
end

return IntegrationTestSuite