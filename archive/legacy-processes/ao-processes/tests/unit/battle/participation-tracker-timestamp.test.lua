--[[
Battle Participation Tracker Timestamp Parameter Integration Tests
Validates timestamp parameter threading and elimination of 0 dependencies

Test Coverage:
- All function signatures accept timestamp parameters
- Timestamp parameters are correctly threaded through tracking methods
- All participation calculations produce identical results
- No 0 dependencies remain in the system
--]]

local TestFramework = require('../../framework/test-framework-enhanced')
local ParticipationTracker = require('../../../game-logic/battle/participation-tracker')

-- Test fixtures
local testTimestamp = 1625097600 -- Fixed test timestamp
local testBattleState = {}
local testPokemonId = "pokemon_001"
local testMoveId = "move_tackle"

local function createTestBattleState(timestamp)
    return {
        turn = 1,
        activePlayer = {[1] = testPokemonId},
        activeEnemy = {[1] = "enemy_001"},
        playerParty = {{
            id = testPokemonId,
            name = "Pikachu",
            level = 25
        }},
        enemyParty = {{
            id = "enemy_001", 
            name = "Rattata",
            level = 10
        }}
    }
end

local function createParticipationTrackerTimestampTests()
    local tests = {}
    
    -- Test 1: Initialize participation tracker with timestamp parameter
    tests["test_participation_tracker_init_with_timestamp"] = function()
        local battleState = createTestBattleState(testTimestamp)
        
        local success, message = ParticipationTracker.init(battleState, testTimestamp)
        
        TestFramework.assert(success, "Participation tracker should initialize with timestamp: " .. (message or ""))
        TestFramework.assert(battleState.participationData ~= nil, "Participation data should be initialized")
        TestFramework.assert(battleState.participationData[testPokemonId] ~= nil, "Pokemon participation data should exist")
        TestFramework.assert(battleState.participationData[testPokemonId].battleStartTime == testTimestamp,
            "Battle start time should match provided timestamp")
    end
    
    -- Test 2: Record battle start with timestamp threading
    tests["test_record_battle_start_timestamp_threading"] = function()
        local battleState = createTestBattleState(testTimestamp)
        ParticipationTracker.init(battleState, testTimestamp)
        
        local success, message = ParticipationTracker.recordBattleStart(battleState, testTimestamp + 10)
        
        TestFramework.assert(success, "Battle start recording should succeed: " .. (message or ""))
        
        local pokemonData = battleState.participationData[testPokemonId]
        TestFramework.assert(pokemonData.participated, "Pokemon should be marked as participated")
        TestFramework.assert(pokemonData.activeAtBattleStart, "Pokemon should be marked as active at battle start")
        TestFramework.assert(pokemonData.firstParticipation == testTimestamp + 10,
            "First participation should match provided timestamp")
    end
    
    -- Test 3: Record switch-in with timestamp parameter
    tests["test_record_switch_in_timestamp_integration"] = function()
        local battleState = createTestBattleState(testTimestamp)
        ParticipationTracker.init(battleState, testTimestamp)
        
        local success, message = ParticipationTracker.recordSwitchIn(
            battleState, testPokemonId, 1, 2, testTimestamp + 50)
        
        TestFramework.assert(success, "Switch-in recording should succeed: " .. (message or ""))
        
        local pokemonData = battleState.participationData[testPokemonId]
        TestFramework.assert(pokemonData.totalSwitchIns == 1, "Switch-in count should be incremented")
        TestFramework.assert(pokemonData.lastParticipation == testTimestamp + 50,
            "Last participation should match switch-in timestamp")
    end
    
    -- Test 4: Record switch-out with timestamp parameter
    tests["test_record_switch_out_timestamp_integration"] = function()
        local battleState = createTestBattleState(testTimestamp)
        ParticipationTracker.init(battleState, testTimestamp)
        
        local success, message = ParticipationTracker.recordSwitchOut(
            battleState, testPokemonId, 1, 3, "voluntary", testTimestamp + 75)
        
        TestFramework.assert(success, "Switch-out recording should succeed: " .. (message or ""))
        
        local pokemonData = battleState.participationData[testPokemonId]
        TestFramework.assert(pokemonData.totalSwitchOuts == 1, "Switch-out count should be incremented")
        TestFramework.assert(pokemonData.lastActiveTurn == 3, "Last active turn should be recorded")
        TestFramework.assert(pokemonData.lastParticipation == testTimestamp + 75,
            "Last participation should match switch-out timestamp")
    end
    
    -- Test 5: Record move usage with timestamp threading
    tests["test_record_move_usage_timestamp_threading"] = function()
        local battleState = createTestBattleState(testTimestamp)
        ParticipationTracker.init(battleState, testTimestamp)
        
        local success, message = ParticipationTracker.recordMoveUsage(
            battleState, testPokemonId, testMoveId, 4, "enemy_001", true, testTimestamp + 100)
        
        TestFramework.assert(success, "Move usage recording should succeed: " .. (message or ""))
        
        local pokemonData = battleState.participationData[testPokemonId]
        TestFramework.assert(pokemonData.totalMoveCount == 1, "Move count should be incremented")
        TestFramework.assert(pokemonData.movesUsed[testMoveId] ~= nil, "Move usage should be tracked")
        TestFramework.assert(pokemonData.movesUsed[testMoveId].successes == 1, "Successful move should be counted")
        TestFramework.assert(pokemonData.lastParticipation == testTimestamp + 100,
            "Last participation should match move usage timestamp")
    end
    
    -- Test 6: Record damage dealt with timestamp parameter
    tests["test_record_damage_dealt_timestamp_integration"] = function()
        local battleState = createTestBattleState(testTimestamp)
        ParticipationTracker.init(battleState, testTimestamp)
        
        local damage = 35
        local success, message = ParticipationTracker.recordDamageDealt(
            battleState, testPokemonId, damage, 5, "enemy_001", testMoveId, false, testTimestamp + 125)
        
        TestFramework.assert(success, "Damage dealt recording should succeed: " .. (message or ""))
        
        local pokemonData = battleState.participationData[testPokemonId]
        TestFramework.assert(pokemonData.totalDamageDealt == damage, "Total damage dealt should be recorded")
        TestFramework.assert(pokemonData.maxDamageInOneTurn == damage, "Max damage should be recorded")
        TestFramework.assert(pokemonData.lastParticipation == testTimestamp + 125,
            "Last participation should match damage timestamp")
    end
    
    -- Test 7: Record damage taken with timestamp parameter
    tests["test_record_damage_taken_timestamp_integration"] = function()
        local battleState = createTestBattleState(testTimestamp)
        ParticipationTracker.init(battleState, testTimestamp)
        
        local damage = 20
        local success, message = ParticipationTracker.recordDamageTaken(
            battleState, testPokemonId, damage, 6, "enemy_001", "enemy_move", "move", testTimestamp + 150)
        
        TestFramework.assert(success, "Damage taken recording should succeed: " .. (message or ""))
        
        local pokemonData = battleState.participationData[testPokemonId]
        TestFramework.assert(pokemonData.totalDamageTaken == damage, "Total damage taken should be recorded")
        TestFramework.assert(pokemonData.lastParticipation == testTimestamp + 150,
            "Last participation should match damage timestamp")
    end
    
    -- Test 8: Record knockout with timestamp threading
    tests["test_record_knockout_timestamp_threading"] = function()
        local battleState = createTestBattleState(testTimestamp)
        ParticipationTracker.init(battleState, testTimestamp)
        
        local success, message = ParticipationTracker.recordKnockout(
            battleState, testPokemonId, "enemy_001", 7, nil, testTimestamp + 175)
        
        TestFramework.assert(success, "Knockout recording should succeed: " .. (message or ""))
        
        local pokemonData = battleState.participationData[testPokemonId]
        TestFramework.assert(pokemonData.knockouts == 1, "Knockout count should be incremented")
        TestFramework.assert(pokemonData.victoryContribution == 1.0, "Victory contribution should be recorded")
        TestFramework.assert(pokemonData.lastParticipation == testTimestamp + 175,
            "Last participation should match knockout timestamp")
    end
    
    -- Test 9: Calculate experience distribution with timestamp
    tests["test_calculate_experience_distribution_timestamp"] = function()
        local battleState = createTestBattleState(testTimestamp)
        ParticipationTracker.init(battleState, testTimestamp)
        ParticipationTracker.recordBattleStart(battleState, testTimestamp + 10)
        
        local distribution, error = ParticipationTracker.calculateExperienceDistribution(
            battleState, "victory", testTimestamp + 200)
        
        TestFramework.assert(distribution ~= nil, "Experience distribution should be calculated: " .. (error or ""))
        TestFramework.assert(distribution.calculationTime == testTimestamp + 200,
            "Calculation time should match provided timestamp")
        TestFramework.assert(distribution.battleResult == "victory", "Battle result should be recorded")
    end
    
    -- Test 10: Record battle end with timestamp integration
    tests["test_record_battle_end_timestamp_integration"] = function()
        local battleState = createTestBattleState(testTimestamp)
        ParticipationTracker.init(battleState, testTimestamp)
        ParticipationTracker.recordBattleStart(battleState, testTimestamp + 10)
        
        local success, summary = ParticipationTracker.recordBattleEnd(
            battleState, "victory", testTimestamp + 225)
        
        TestFramework.assert(success, "Battle end recording should succeed")
        TestFramework.assert(summary ~= nil, "Battle end summary should be provided")
        TestFramework.assert(summary.battleResult == "victory", "Battle result should be in summary")
        
        local pokemonData = battleState.participationData[testPokemonId]
        TestFramework.assert(pokemonData.battleEndTime == testTimestamp + 225,
            "Battle end time should match provided timestamp")
    end
    
    -- Test 11: Timestamp consistency across operations
    tests["test_timestamp_consistency_across_operations"] = function()
        local battleState = createTestBattleState(testTimestamp)
        local baseTimestamp = testTimestamp + 1000
        
        -- Initialize with specific timestamp
        ParticipationTracker.init(battleState, baseTimestamp)
        
        -- Record various events with incremented timestamps
        ParticipationTracker.recordBattleStart(battleState, baseTimestamp + 10)
        ParticipationTracker.recordMoveUsage(battleState, testPokemonId, testMoveId, 1, "enemy_001", true, baseTimestamp + 20)
        ParticipationTracker.recordDamageDealt(battleState, testPokemonId, 25, 1, "enemy_001", testMoveId, false, baseTimestamp + 25)
        
        local pokemonData = battleState.participationData[testPokemonId]
        
        TestFramework.assert(pokemonData.battleStartTime == baseTimestamp,
            "Battle start time should match initialization timestamp")
        TestFramework.assert(pokemonData.firstParticipation == baseTimestamp + 10,
            "First participation should match battle start timestamp")
        TestFramework.assert(pokemonData.lastParticipation == baseTimestamp + 25,
            "Last participation should match most recent event timestamp")
        
        -- Verify events have correct timestamps
        local hasCorrectTimestamps = true
        for _, event in ipairs(pokemonData.events) do
            if not event.timestamp or event.timestamp < baseTimestamp then
                hasCorrectTimestamps = false
                break
            end
        end
        TestFramework.assert(hasCorrectTimestamps, "All events should have valid timestamps")
    end
    
    -- Test 12: Participation summary with timestamp data
    tests["test_get_participation_summary_timestamp_data"] = function()
        local battleState = createTestBattleState(testTimestamp)
        ParticipationTracker.init(battleState, testTimestamp)
        ParticipationTracker.recordBattleStart(battleState, testTimestamp + 10)
        ParticipationTracker.recordBattleEnd(battleState, "victory", testTimestamp + 300)
        
        local summary, error = ParticipationTracker.getParticipationSummary(battleState, testPokemonId)
        
        TestFramework.assert(summary ~= nil, "Participation summary should be generated: " .. (error or ""))
        TestFramework.assert(summary.participated, "Pokemon should be marked as participated")
        TestFramework.assert(summary.battleDuration == 300, "Battle duration should be calculated correctly")
    end
    
    return tests
end

-- Create test suite
local function runParticipationTrackerTimestampTests()
    local tests = createParticipationTrackerTimestampTests()
    local results = {}
    
    print("\\n=== Running Battle Participation Tracker Timestamp Parameter Integration Tests ===")
    
    for testName, testFunc in pairs(tests) do
        local success, error = pcall(testFunc)
        results[testName] = {
            passed = success,
            error = error
        }
        
        if success then
            print("✅ " .. testName)
        else
            print("❌ " .. testName .. ": " .. tostring(error))
        end
    end
    
    -- Summary
    local passed = 0
    local total = 0
    for _, result in pairs(results) do
        total = total + 1
        if result.passed then
            passed = passed + 1
        end
    end
    
    print(string.format("\\n📊 Participation Tracker Timestamp Tests: %d/%d passed", passed, total))
    
    return results
end

-- Export for test runner
return {
    createParticipationTrackerTimestampTests = createParticipationTrackerTimestampTests,
    runParticipationTrackerTimestampTests = runParticipationTrackerTimestampTests
}