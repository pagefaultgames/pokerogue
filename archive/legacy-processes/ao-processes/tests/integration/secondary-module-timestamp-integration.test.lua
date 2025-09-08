-- Integration Test for Secondary Module Timestamp Parameter Flow
-- Tests timestamp parameter threading across all secondary modules updated in Story 33.3

local TestFramework = require("tests.framework.test-framework-enhanced")
local MoveEffects = require("game-logic.battle.move-effects")
local BattleIntegration = require("game-logic.battle.pokemon-battle-integration")
local SwitchInEffects = require("game-logic.battle.switch-in-effects")
local PokemonSwitchSystem = require("game-logic.battle.pokemon-switch-system")
local BattleCleanup = require("game-logic.battle.battle-cleanup")
local ExperienceSystem = require("game-logic.progression.experience-system")

local test = TestFramework.new("Secondary Module Timestamp Integration")

-- Test data setup
local testTimestamp = 1725565800000
local mockBattleId = "integration-test-battle"
local mockPlayerId = "player-timestamp-test"
local mockPokemonId = "pokemon-timestamp-integration"

-- Comprehensive battle state for integration testing
local mockBattleState = {
    id = mockBattleId,
    state = "active",
    turnNumber = 3,
    weather = { type = 1, turnsRemaining = 4 }, -- Sunny
    terrain = { type = 2, turnsRemaining = 2 }, -- Grassy Terrain
    entryHazards = {
        { type = "stealth_rock", damage = "1/8" }
    },
    participants = {
        [mockPlayerId] = { pokemon = { mockPokemonId } }
    },
    effects = {},
    statistics = {
        damageDealt = {},
        movesUsed = {},
        statusEffectsApplied = {}
    }
}

local mockPokemon = {
    id = mockPokemonId,
    species = 6, -- Charizard
    level = 50,
    hp = 120,
    maxHp = 150,
    types = {9, 2}, -- Fire/Flying
    ability = 66, -- Solar Power
    statusEffect = 0,
    statStages = {
        attack = 0,
        defense = 0,
        spAttack = 0,
        spDefense = 0,
        speed = 0
    },
    moves = {
        { id = 7, pp = 15, maxPP = 20 }, -- Flamethrower
        { id = 19, pp = 10, maxPP = 15 }, -- Fly
        { id = 76, pp = 8, maxPP = 10 }, -- Solar Beam
        { id = 89, pp = 20, maxPP = 25 }  -- Earthquake
    },
    experience = 125000,
    friendship = 128
}

-- Test end-to-end timestamp flow through secondary modules
test:describe("End-to-end timestamp parameter flow", function()
    test:it("should thread timestamp consistently through complete battle flow", function()
        -- Step 1: Add Pokemon to battle (Battle Integration)
        local addResult = BattleIntegration.addPokemonToBattle(
            mockBattleId,
            mockPokemonId,
            mockPlayerId,
            testTimestamp
        )
        test:expect(addResult).to_be_truthy()
        
        -- Step 2: Process switch-in effects with timestamp
        local switchResult = SwitchInEffects.processAllSwitchInEffects(
            mockBattleState,
            mockPokemon,
            1,
            nil,
            testTimestamp
        )
        test:expect(switchResult).to_be_truthy()
        
        -- Step 3: Use move in battle (Battle Integration + Move Effects)
        local moveContext = {
            battleId = mockBattleId,
            turnNumber = 3,
            weather = mockBattleState.weather.type,
            terrain = mockBattleState.terrain.type
        }
        
        local moveResult = BattleIntegration.useMoveInBattle(
            mockPokemonId,
            1, -- Use Flamethrower
            mockPlayerId,
            moveContext,
            testTimestamp
        )
        test:expect(moveResult).to_be_truthy()
        
        -- Step 4: Apply status effect (Move Effects)
        local statusResult = MoveEffects.applyStatusEffectBattle(
            mockBattleId,
            mockPokemonId,
            MoveEffects.StatusEffect.BURN,
            5,
            "opponent-move",
            mockPokemon,
            mockBattleState,
            testTimestamp
        )
        test:expect(statusResult).to_be_truthy()
        
        -- Step 5: Process status damage (Move Effects)
        local damageResult = MoveEffects.processStatusDamage(
            mockBattleId,
            mockPokemonId,
            mockPokemon,
            MoveEffects.StatusEffect.BURN,
            0,
            testTimestamp
        )
        test:expect(damageResult).to_be_truthy()
        
        -- Step 6: Clear turn data (Battle Integration)
        local clearResult = BattleIntegration.clearTurnData(
            mockPokemonId,
            mockPlayerId,
            testTimestamp
        )
        test:expect(clearResult).to_be_truthy()
    end)
end)

-- Test cross-module timestamp consistency
test:describe("Cross-module timestamp consistency", function()
    test:it("should maintain timestamp consistency across module boundaries", function()
        local incrementalTimestamp = testTimestamp
        
        -- Move Effects -> Battle Integration flow
        local healResult = MoveEffects.applyHealingEffect(
            mockBattleId,
            mockPokemonId,
            "25%",
            "recovery-move",
            mockPokemon,
            mockBattleState.weather.type,
            "Recover",
            incrementalTimestamp
        )
        test:expect(healResult).to_be_truthy()
        
        incrementalTimestamp = incrementalTimestamp + 1000
        
        -- Battle Integration -> Switch System flow
        local switchSetupResult = BattleIntegration.updateBattleState(
            mockPokemonId,
            mockBattleState,
            mockPlayerId,
            incrementalTimestamp
        )
        test:expect(switchSetupResult).to_be_truthy()
        
        incrementalTimestamp = incrementalTimestamp + 1000
        
        -- Switch System -> Switch-in Effects flow
        local newPokemon = {
            id = "replacement-pokemon",
            species = 1, -- Bulbasaur
            level = 45,
            types = {12, 3}, -- Grass/Poison
            ability = 65 -- Overgrow
        }
        
        local performSwitchResult = PokemonSwitchSystem.performSwitch(
            mockBattleState,
            mockPokemonId,
            newPokemon,
            mockPlayerId,
            incrementalTimestamp
        )
        test:expect(performSwitchResult).to_be_truthy()
        
        incrementalTimestamp = incrementalTimestamp + 1000
        
        -- Process switch-in effects for new Pokemon
        local switchInResult = SwitchInEffects.processAllSwitchInEffects(
            mockBattleState,
            newPokemon,
            1,
            mockPokemon,
            incrementalTimestamp
        )
        test:expect(switchInResult).to_be_truthy()
    end)
end)

-- Test battle completion flow with timestamp threading
test:describe("Battle completion timestamp flow", function()
    test:it("should thread timestamp through battle conclusion", function()
        local completionTimestamp = testTimestamp + 30000
        
        -- Process final battle effects
        local finalEffects = {
            hp = -50, -- Final damage
            statusEffect = 6, -- Faint
            experience = 200
        }
        
        local effectsResult = BattleIntegration.applyBattleEffects(
            mockPokemonId,
            finalEffects,
            mockPlayerId,
            completionTimestamp
        )
        test:expect(effectsResult).to_be_truthy()
        
        -- Distribute battle experience
        local expResult = ExperienceSystem.distributeBattleExperience(
            mockPokemonId,
            200,
            mockPlayerId,
            completionTimestamp
        )
        test:expect(expResult).to_be_truthy()
        
        -- Update friendship from battle participation
        local friendshipResult = ExperienceSystem.updateFriendship(
            mockPokemonId,
            "battle_victory",
            5,
            mockPlayerId,
            completionTimestamp
        )
        test:expect(friendshipResult).to_be_truthy()
        
        -- Process battle result
        local battleResult = {
            battleId = mockBattleId,
            winner = mockPlayerId,
            experience = 200,
            rewards = { items = {}, money = 500 }
        }
        
        local resultProcessing = BattleIntegration.processBattleResult(
            mockPokemonId,
            battleResult,
            mockPlayerId,
            completionTimestamp
        )
        test:expect(resultProcessing).to_be_truthy()
        
        -- Restore Pokemon after battle
        local restoreResult = BattleIntegration.restorePokemonAfterBattle(
            mockPokemonId,
            "partial",
            mockPlayerId,
            completionTimestamp
        )
        test:expect(restoreResult).to_be_truthy()
        
        -- Final battle cleanup
        local cleanupResult = BattleCleanup.restorePokemonState(
            mockBattleState,
            { mockPokemonId },
            completionTimestamp
        )
        test:expect(cleanupResult).to_be_truthy()
    end)
end)

-- Test error propagation with timestamp parameters
test:describe("Error handling with timestamp parameters", function()
    test:it("should handle errors gracefully while preserving timestamp flow", function()
        -- Test with invalid battle state but valid timestamp
        local invalidBattleState = { id = "invalid" }
        
        local result = SwitchInEffects.processAllSwitchInEffects(
            invalidBattleState,
            mockPokemon,
            1,
            nil,
            testTimestamp
        )
        
        -- Should handle gracefully and return result (may be false/error)
        test:expect(result).to_not_be_nil()
    end)
    
    test:it("should work with missing timestamp across modules", function()
        -- Test that all modules handle missing timestamp gracefully
        local moveResult = MoveEffects.processStatusDamage(
            mockBattleId,
            mockPokemonId,
            mockPokemon,
            MoveEffects.StatusEffect.POISON,
            0
            -- No timestamp parameter
        )
        test:expect(moveResult).to_be_truthy()
        
        local integrationResult = BattleIntegration.clearTurnData(
            mockPokemonId,
            mockPlayerId
            -- No timestamp parameter
        )
        test:expect(integrationResult).to_be_truthy()
        
        local switchResult = SwitchInEffects.processAbilityEffect(
            mockBattleState,
            mockPokemon,
            { type = "ability", abilityId = mockPokemon.ability }
            -- No timestamp parameter
        )
        test:expect(switchResult).to_be_truthy()
    end)
end)

-- Test timestamp parameter validation across modules
test:describe("Timestamp parameter validation", function()
    test:it("should validate timestamp parameters consistently", function()
        local validTimestamps = { 0, testTimestamp, testTimestamp + 5000 }
        local edgeCaseTimestamps = { -1, 9999999999999, nil }
        
        for _, timestamp in ipairs(validTimestamps) do
            local result = MoveEffects.canPokemonAct(
                mockPokemon,
                MoveEffects.StatusEffect.PARALYSIS,
                { id = 1, name = "Tackle" },
                timestamp
            )
            test:expect(type(result)).to_equal("boolean")
        end
        
        for _, timestamp in ipairs(edgeCaseTimestamps) do
            local result = BattleIntegration.updateBattleState(
                mockPokemonId,
                mockBattleState,
                mockPlayerId,
                timestamp
            )
            test:expect(result).to_be_truthy() -- Should handle edge cases gracefully
        end
    end)
end)

-- Test performance with timestamp parameters
test:describe("Performance with timestamp parameters", function()
    test:it("should maintain performance with timestamp threading", function()
        local startTime = os.clock()
        local iterations = 100
        
        -- Perform multiple operations with timestamp threading
        for i = 1, iterations do
            local currentTimestamp = testTimestamp + (i * 100)
            
            -- Quick succession of timestamp-dependent calls
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
            
            SwitchInEffects.processEffect(
                mockBattleState,
                mockPokemon,
                { type = "ability", abilityId = mockPokemon.ability },
                currentTimestamp
            )
        end
        
        local endTime = os.clock()
        local duration = endTime - startTime
        
        -- Performance should be reasonable (less than 1 second for 100 iterations)
        test:expect(duration).to_be_less_than(1.0)
    end)
end)

return test