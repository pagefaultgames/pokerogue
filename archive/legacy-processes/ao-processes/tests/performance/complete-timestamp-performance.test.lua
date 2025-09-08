-- Performance Test for Complete Timestamp Threading
-- Tests performance impact of timestamp parameters across all secondary modules

local TestFramework = require("tests.framework.test-framework-enhanced")
local MoveEffects = require("game-logic.battle.move-effects")
local BattleIntegration = require("game-logic.battle.pokemon-battle-integration")
local SwitchInEffects = require("game-logic.battle.switch-in-effects")
local PokemonSwitchSystem = require("game-logic.battle.pokemon-switch-system")
local BattleCleanup = require("game-logic.battle.battle-cleanup")
local ExperienceSystem = require("game-logic.progression.experience-system")

local test = TestFramework.new("Complete Timestamp Threading Performance")

-- Performance benchmarking utilities
local function measureTime(func, iterations)
    local startTime = os.clock()
    for i = 1, iterations do
        func(i)
    end
    local endTime = os.clock()
    return endTime - startTime
end

local function comparePerformance(withTimestamp, withoutTimestamp, tolerance)
    tolerance = tolerance or 0.1 -- 10% tolerance by default
    local difference = math.abs(withTimestamp - withoutTimestamp)
    local percentDifference = difference / withoutTimestamp
    return percentDifference <= tolerance
end

-- Test data setup
local baseTimestamp = 1725565800000
local mockBattleId = "perf-test-battle"
local mockPlayerId = "perf-player"
local mockPokemonId = "perf-pokemon"

local mockPokemon = {
    id = mockPokemonId,
    species = 6,
    level = 50,
    hp = 150,
    maxHp = 150,
    types = {9, 2},
    ability = 66,
    statusEffect = 0,
    statStages = { attack = 0, defense = 0, spAttack = 0, spDefense = 0, speed = 0 },
    moves = {
        { id = 7, pp = 15, maxPP = 20 },
        { id = 19, pp = 10, maxPP = 15 },
        { id = 76, pp = 8, maxPP = 10 },
        { id = 89, pp = 20, maxPP = 25 }
    },
    experience = 125000,
    friendship = 128
}

local mockBattleState = {
    id = mockBattleId,
    state = "active",
    weather = { type = 1, turnsRemaining = 5 },
    terrain = { type = 2, turnsRemaining = 3 },
    entryHazards = { { type = "stealth_rock", damage = "1/8" } },
    effects = {},
    statistics = {}
}

-- Test performance of Move Effects functions
test:describe("Move Effects performance with timestamps", function()
    test:it("should have minimal performance impact for status processing", function()
        local iterations = 1000
        
        -- Test with timestamp
        local withTimestampTime = measureTime(function(i)
            MoveEffects.processStatusDamage(
                mockBattleId,
                mockPokemonId,
                mockPokemon,
                MoveEffects.StatusEffect.BURN,
                0,
                baseTimestamp + i
            )
        end, iterations)
        
        -- Test without timestamp
        local withoutTimestampTime = measureTime(function(i)
            MoveEffects.processStatusDamage(
                mockBattleId,
                mockPokemonId,
                mockPokemon,
                MoveEffects.StatusEffect.BURN,
                0
            )
        end, iterations)
        
        local isAcceptable = comparePerformance(withTimestampTime, withoutTimestampTime)
        test:expect(isAcceptable).to_be_true()
        
        -- Log performance results
        print(string.format("Status processing - With: %.4fs, Without: %.4fs", 
              withTimestampTime, withoutTimestampTime))
    end)
    
    test:it("should have minimal performance impact for stat changes", function()
        local iterations = 1000
        local mockCurrentStages = { attack = 0, defense = 0, speed = 0 }
        
        local withTimestampTime = measureTime(function(i)
            MoveEffects.applyStatStageChange(
                mockBattleId,
                mockPokemonId,
                "attack",
                1,
                "test-source",
                mockPokemon,
                mockCurrentStages,
                mockBattleState,
                baseTimestamp + i
            )
        end, iterations)
        
        local withoutTimestampTime = measureTime(function(i)
            MoveEffects.applyStatStageChange(
                mockBattleId,
                mockPokemonId,
                "attack",
                1,
                "test-source",
                mockPokemon,
                mockCurrentStages,
                mockBattleState
            )
        end, iterations)
        
        local isAcceptable = comparePerformance(withTimestampTime, withoutTimestampTime)
        test:expect(isAcceptable).to_be_true()
        
        print(string.format("Stat changes - With: %.4fs, Without: %.4fs", 
              withTimestampTime, withoutTimestampTime))
    end)
end)

-- Test performance of Battle Integration functions
test:describe("Battle Integration performance with timestamps", function()
    test:it("should have minimal performance impact for battle operations", function()
        local iterations = 1000
        
        local withTimestampTime = measureTime(function(i)
            BattleIntegration.clearTurnData(
                mockPokemonId,
                mockPlayerId,
                baseTimestamp + i
            )
        end, iterations)
        
        local withoutTimestampTime = measureTime(function(i)
            BattleIntegration.clearTurnData(
                mockPokemonId,
                mockPlayerId
            )
        end, iterations)
        
        local isAcceptable = comparePerformance(withTimestampTime, withoutTimestampTime)
        test:expect(isAcceptable).to_be_true()
        
        print(string.format("Battle operations - With: %.4fs, Without: %.4fs", 
              withTimestampTime, withoutTimestampTime))
    end)
    
    test:it("should have minimal performance impact for battle effects", function()
        local iterations = 500
        local mockModifications = {
            hp = -25,
            statusEffect = 4,
            statStages = { attack = -1 }
        }
        
        local withTimestampTime = measureTime(function(i)
            BattleIntegration.applyBattleEffects(
                mockPokemonId,
                mockModifications,
                mockPlayerId,
                baseTimestamp + i
            )
        end, iterations)
        
        local withoutTimestampTime = measureTime(function(i)
            BattleIntegration.applyBattleEffects(
                mockPokemonId,
                mockModifications,
                mockPlayerId
            )
        end, iterations)
        
        local isAcceptable = comparePerformance(withTimestampTime, withoutTimestampTime)
        test:expect(isAcceptable).to_be_true()
        
        print(string.format("Battle effects - With: %.4fs, Without: %.4fs", 
              withTimestampTime, withoutTimestampTime))
    end)
end)

-- Test performance of Switch-In Effects
test:describe("Switch-In Effects performance with timestamps", function()
    test:it("should have minimal performance impact for switch processing", function()
        local iterations = 500
        
        local withTimestampTime = measureTime(function(i)
            SwitchInEffects.processAllSwitchInEffects(
                mockBattleState,
                mockPokemon,
                1,
                nil,
                baseTimestamp + i
            )
        end, iterations)
        
        local withoutTimestampTime = measureTime(function(i)
            SwitchInEffects.processAllSwitchInEffects(
                mockBattleState,
                mockPokemon,
                1,
                nil
            )
        end, iterations)
        
        local isAcceptable = comparePerformance(withTimestampTime, withoutTimestampTime)
        test:expect(isAcceptable).to_be_true()
        
        print(string.format("Switch-in effects - With: %.4fs, Without: %.4fs", 
              withTimestampTime, withoutTimestampTime))
    end)
end)

-- Test performance of Experience System
test:describe("Experience System performance with timestamps", function()
    test:it("should have minimal performance impact for experience distribution", function()
        local iterations = 1000
        
        local withTimestampTime = measureTime(function(i)
            ExperienceSystem.distributeBattleExperience(
                mockPokemonId,
                100,
                mockPlayerId,
                baseTimestamp + i
            )
        end, iterations)
        
        local withoutTimestampTime = measureTime(function(i)
            ExperienceSystem.distributeBattleExperience(
                mockPokemonId,
                100,
                mockPlayerId
            )
        end, iterations)
        
        local isAcceptable = comparePerformance(withTimestampTime, withoutTimestampTime)
        test:expect(isAcceptable).to_be_true()
        
        print(string.format("Experience distribution - With: %.4fs, Without: %.4fs", 
              withTimestampTime, withoutTimestampTime))
    end)
    
    test:it("should have minimal performance impact for friendship updates", function()
        local iterations = 1000
        
        local withTimestampTime = measureTime(function(i)
            ExperienceSystem.updateFriendship(
                mockPokemonId,
                "battle_victory",
                5,
                mockPlayerId,
                baseTimestamp + i
            )
        end, iterations)
        
        local withoutTimestampTime = measureTime(function(i)
            ExperienceSystem.updateFriendship(
                mockPokemonId,
                "battle_victory",
                5,
                mockPlayerId
            )
        end, iterations)
        
        local isAcceptable = comparePerformance(withTimestampTime, withoutTimestampTime)
        test:expect(isAcceptable).to_be_true()
        
        print(string.format("Friendship updates - With: %.4fs, Without: %.4fs", 
              withTimestampTime, withoutTimestampTime))
    end)
end)

-- Test comprehensive battle flow performance
test:describe("Complete battle flow performance", function()
    test:it("should maintain performance in realistic battle scenarios", function()
        local iterations = 100
        
        -- Simulate complete battle turn with timestamp
        local withTimestampTime = measureTime(function(i)
            local currentTimestamp = baseTimestamp + (i * 1000)
            
            -- Switch-in effects
            SwitchInEffects.processAllSwitchInEffects(
                mockBattleState,
                mockPokemon,
                1,
                nil,
                currentTimestamp
            )
            
            -- Use move
            local moveContext = { battleId = mockBattleId, turnNumber = i }
            BattleIntegration.useMoveInBattle(
                mockPokemonId,
                1,
                mockPlayerId,
                moveContext,
                currentTimestamp
            )
            
            -- Apply status effect
            MoveEffects.applyStatusEffectBattle(
                mockBattleId,
                mockPokemonId,
                MoveEffects.StatusEffect.BURN,
                3,
                "opponent",
                mockPokemon,
                mockBattleState,
                currentTimestamp
            )
            
            -- Process status damage
            MoveEffects.processStatusDamage(
                mockBattleId,
                mockPokemonId,
                mockPokemon,
                MoveEffects.StatusEffect.BURN,
                0,
                currentTimestamp
            )
            
            -- Clear turn data
            BattleIntegration.clearTurnData(
                mockPokemonId,
                mockPlayerId,
                currentTimestamp
            )
        end, iterations)
        
        -- Simulate complete battle turn without timestamp
        local withoutTimestampTime = measureTime(function(i)
            SwitchInEffects.processAllSwitchInEffects(
                mockBattleState,
                mockPokemon,
                1,
                nil
            )
            
            local moveContext = { battleId = mockBattleId, turnNumber = i }
            BattleIntegration.useMoveInBattle(
                mockPokemonId,
                1,
                mockPlayerId,
                moveContext
            )
            
            MoveEffects.applyStatusEffectBattle(
                mockBattleId,
                mockPokemonId,
                MoveEffects.StatusEffect.BURN,
                3,
                "opponent",
                mockPokemon,
                mockBattleState
            )
            
            MoveEffects.processStatusDamage(
                mockBattleId,
                mockPokemonId,
                mockPokemon,
                MoveEffects.StatusEffect.BURN,
                0
            )
            
            BattleIntegration.clearTurnData(
                mockPokemonId,
                mockPlayerId
            )
        end, iterations)
        
        local isAcceptable = comparePerformance(withTimestampTime, withoutTimestampTime, 0.15) -- 15% tolerance for complex flow
        test:expect(isAcceptable).to_be_true()
        
        print(string.format("Complete battle flow - With: %.4fs, Without: %.4fs", 
              withTimestampTime, withoutTimestampTime))
        
        -- Both should complete within reasonable time
        test:expect(withTimestampTime).to_be_less_than(1.0)
        test:expect(withoutTimestampTime).to_be_less_than(1.0)
    end)
end)

-- Test memory usage with timestamp parameters
test:describe("Memory usage with timestamp parameters", function()
    test:it("should have minimal memory overhead", function()
        local iterations = 10000
        
        -- Collect garbage before test
        collectgarbage("collect")
        local memoryBefore = collectgarbage("count")
        
        -- Perform many operations with timestamps
        for i = 1, iterations do
            local currentTimestamp = baseTimestamp + i
            
            MoveEffects.processStatusTurn(
                mockBattleId,
                mockPokemonId,
                mockPokemon,
                MoveEffects.StatusEffect.SLEEP,
                2,
                currentTimestamp
            )
            
            BattleIntegration.clearTurnData(
                mockPokemonId,
                mockPlayerId,
                currentTimestamp
            )
        end
        
        collectgarbage("collect")
        local memoryAfter = collectgarbage("count")
        local memoryUsed = memoryAfter - memoryBefore
        
        -- Memory usage should be reasonable (less than 5MB for 10000 operations)
        test:expect(memoryUsed).to_be_less_than(5120) -- 5MB in KB
        
        print(string.format("Memory usage: %.2f KB for %d operations", 
              memoryUsed, iterations))
    end)
end)

-- Test timestamp parameter validation performance
test:describe("Timestamp validation performance", function()
    test:it("should handle timestamp validation efficiently", function()
        local iterations = 5000
        local testTimestamps = { 0, -1, nil, baseTimestamp, baseTimestamp + 999999 }
        
        local startTime = os.clock()
        
        for i = 1, iterations do
            local timestamp = testTimestamps[(i % #testTimestamps) + 1]
            
            -- Test various modules with different timestamp values
            MoveEffects.canPokemonAct(
                mockPokemon,
                MoveEffects.StatusEffect.PARALYSIS,
                { id = 1, name = "Tackle" },
                timestamp
            )
            
            BattleIntegration.updateBattleState(
                mockPokemonId,
                mockBattleState,
                mockPlayerId,
                timestamp
            )
            
            SwitchInEffects.processEffect(
                mockBattleState,
                mockPokemon,
                { type = "ability", abilityId = mockPokemon.ability },
                timestamp
            )
        end
        
        local endTime = os.clock()
        local totalTime = endTime - startTime
        
        -- Should complete validation efficiently
        test:expect(totalTime).to_be_less_than(2.0)
        
        print(string.format("Timestamp validation: %.4fs for %d validations", 
              totalTime, iterations * 3))
    end)
end)

return test