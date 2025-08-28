-- Critical Hit Calculator Unit Tests  
-- Comprehensive testing for critical hit calculation system
-- Tests critical hit rates, damage multipliers, and stage calculations
-- Ensures TypeScript parity for exact critical hit mechanics

-- Load test framework and dependencies
local TestFramework = require("tests.framework.test-framework-enhanced")
local CriticalHitCalculator = require("game-logic.battle.critical-hit-calculator")
local MoveDatabase = require("data.moves.move-database")

-- Test suite for Critical Hit Calculator
local CriticalHitCalculatorTests = {}

-- Helper function to create mock Pokemon
local function createMockPokemon(id, species, ability, heldItem, focusEnergy)
    return {
        id = id or "test_pokemon",
        species = species or "pikachu",
        ability = ability,
        heldItem = heldItem,
        focusEnergy = focusEnergy or false
    }
end

-- Helper function to create mock battle conditions
local function createMockBattleConditions(direHit, rng)
    return {
        direHit = direHit or {},
        rng = rng or {
            random = function() return 1073741823 end -- Fixed value for consistent testing (0.5 normalized)
        }
    }
end

function CriticalHitCalculatorTests.runAllTests()
    local testSuite = TestFramework.createTestSuite("CriticalHitCalculator")
    
    -- Test initialization
    testSuite:addTest("Critical Hit Calculator Initialization", function()
        local success = CriticalHitCalculator.init()
        TestFramework.assert(success == true, "Critical hit calculator should initialize successfully")
    end)
    
    -- Test basic critical hit stage calculation
    testSuite:addTest("Basic Critical Hit Stage Calculation", function()
        CriticalHitCalculator.init()
        
        -- Test normal move with no modifiers
        local pokemon = createMockPokemon()
        local stage = CriticalHitCalculator.calculateCriticalHitStage(pokemon, 1, nil, nil) -- POUND
        TestFramework.assert(stage == 0, "Normal move should have stage 0 critical hit rate")
        
        -- Test with Focus Energy effect
        local pokemon2 = createMockPokemon("focused", "pikachu", nil, nil, true)
        local stage2 = CriticalHitCalculator.calculateCriticalHitStage(pokemon2, 1, nil, nil)
        TestFramework.assert(stage2 == 2, "Focus Energy should add +2 critical hit stages")
        
        -- Test Super Luck ability
        local pokemon3 = createMockPokemon("lucky", "pikachu", "super_luck")
        local stage3 = CriticalHitCalculator.calculateCriticalHitStage(pokemon3, 1, nil, nil)
        TestFramework.assert(stage3 == 1, "Super Luck should add +1 critical hit stage")
    end)
    
    -- Test high critical hit ratio moves
    testSuite:addTest("High Critical Hit Ratio Moves", function()
        MoveDatabase.init()
        CriticalHitCalculator.init()
        
        -- Test move with high crit effect in database
        local pokemon = createMockPokemon()
        
        -- Test Karate Chop (should have high crit ratio)
        local stage = CriticalHitCalculator.calculateCriticalHitStage(pokemon, 2, nil, nil) -- KARATE_CHOP
        TestFramework.assert(stage >= 1, "Karate Chop should have increased critical hit stage")
    end)
    
    -- Test critical hit items
    testSuite:addTest("Critical Hit Items", function()
        CriticalHitCalculator.init()
        
        -- Test Scope Lens
        local pokemon = createMockPokemon("scope_lens_user", "pikachu", nil, "scope_lens")
        local stage = CriticalHitCalculator.calculateCriticalHitStage(pokemon, 1, nil, nil)
        TestFramework.assert(stage == 1, "Scope Lens should add +1 critical hit stage")
        
        -- Test Lucky Punch (Chansey only)
        local chansey = createMockPokemon("chansey", "chansey", nil, "lucky_punch")
        local stage2 = CriticalHitCalculator.calculateCriticalHitStage(chansey, 1, nil, nil)
        TestFramework.assert(stage2 == 2, "Lucky Punch should add +2 stages for Chansey")
        
        -- Test Lucky Punch on non-Chansey (should not work)
        local pikachu = createMockPokemon("pikachu", "pikachu", nil, "lucky_punch")
        local stage3 = CriticalHitCalculator.calculateCriticalHitStage(pikachu, 1, nil, nil)
        TestFramework.assert(stage3 == 0, "Lucky Punch should not work on non-Chansey Pokemon")
        
        -- Test Stick (Farfetch'd only)
        local farfetchd = createMockPokemon("farfetchd", "farfetchd", nil, "stick")
        local stage4 = CriticalHitCalculator.calculateCriticalHitStage(farfetchd, 1, nil, nil)
        TestFramework.assert(stage4 == 2, "Stick should add +2 stages for Farfetch'd")
    end)
    
    -- Test critical hit immunity
    testSuite:addTest("Critical Hit Immunity", function()
        CriticalHitCalculator.init()
        
        -- Test Battle Armor ability
        local pokemon = createMockPokemon()
        local target = createMockPokemon("armored", "pikachu", "battle_armor")
        
        local stage = CriticalHitCalculator.calculateCriticalHitStage(pokemon, 1, target, nil)
        TestFramework.assert(stage == -1, "Battle Armor should prevent critical hits (stage -1)")
        
        -- Test Shell Armor ability  
        local target2 = createMockPokemon("shelled", "pikachu", "shell_armor")
        local stage2 = CriticalHitCalculator.calculateCriticalHitStage(pokemon, 1, target2, nil)
        TestFramework.assert(stage2 == -1, "Shell Armor should prevent critical hits (stage -1)")
    end)
    
    -- Test critical hit rate calculation
    testSuite:addTest("Critical Hit Rate Calculation", function()
        CriticalHitCalculator.init()
        
        -- Test stage 0 rate (1/24 ≈ 4.17%)
        local rate0 = CriticalHitCalculator.getCriticalHitRate(0)
        TestFramework.assert(math.abs(rate0 - 4.1667) < 0.01, "Stage 0 should be approximately 4.17%")
        
        -- Test stage 1 rate (1/8 = 12.5%)
        local rate1 = CriticalHitCalculator.getCriticalHitRate(1)
        TestFramework.assert(rate1 == 12.5, "Stage 1 should be exactly 12.5%")
        
        -- Test stage 2 rate (1/2 = 50%)
        local rate2 = CriticalHitCalculator.getCriticalHitRate(2)
        TestFramework.assert(rate2 == 50.0, "Stage 2 should be exactly 50%")
        
        -- Test stage 3 rate (1/1 = 100%)
        local rate3 = CriticalHitCalculator.getCriticalHitRate(3)
        TestFramework.assert(rate3 == 100.0, "Stage 3 should be exactly 100%")
        
        -- Test immunity (negative stage)
        local rateImmune = CriticalHitCalculator.getCriticalHitRate(-1)
        TestFramework.assert(rateImmune == 0, "Immune Pokemon should have 0% critical hit rate")
    end)
    
    -- Test critical hit roll determination
    testSuite:addTest("Critical Hit Roll Determination", function()
        CriticalHitCalculator.init()
        
        local pokemon = createMockPokemon()
        
        -- Test guaranteed critical hit (stage 3)
        local pokemon3 = createMockPokemon("guaranteed", "pikachu", "super_luck", "scope_lens", true)
        -- super_luck(+1) + scope_lens(+1) + focus_energy(+2) = +4 clamped to +3
        
        local battleConditions = createMockBattleConditions()
        local isCrit, rate = CriticalHitCalculator.rollCriticalHit(pokemon3, 1, nil, battleConditions)
        TestFramework.assert(rate == 100.0, "Should have 100% critical hit rate")
        
        -- Test with predictable RNG (50% chance, stage 2)
        local pokemon2 = createMockPokemon("stage2", "pikachu", "super_luck", "scope_lens")
        local isCrit2, rate2 = CriticalHitCalculator.rollCriticalHit(pokemon2, 1, nil, battleConditions)
        TestFramework.assert(rate2 == 50.0, "Should have 50% critical hit rate")
        TestFramework.assert(isCrit2 == false, "With RNG 0.5, 50% rate should not crit")
        
        -- Test immunity
        local target = createMockPokemon("immune", "pikachu", "battle_armor")
        local isCrit3, rate3 = CriticalHitCalculator.rollCriticalHit(pokemon, 1, target, battleConditions)
        TestFramework.assert(isCrit3 == false, "Immune target should never receive critical hits")
        TestFramework.assert(rate3 == 0, "Immune target should have 0% rate")
    end)
    
    -- Test critical hit damage multiplier
    testSuite:addTest("Critical Hit Damage Multiplier", function()
        CriticalHitCalculator.init()
        
        -- Test normal critical hit multiplier
        local pokemon = createMockPokemon()
        local multiplier = CriticalHitCalculator.getCriticalHitDamageMultiplier(pokemon, nil, 1, true)
        TestFramework.assert(multiplier == 1.5, "Normal critical hit should have 1.5x multiplier")
        
        -- Test non-critical hit
        local multiplier2 = CriticalHitCalculator.getCriticalHitDamageMultiplier(pokemon, nil, 1, false)
        TestFramework.assert(multiplier2 == 1.0, "Non-critical hit should have 1.0x multiplier")
        
        -- Test Sniper ability
        local sniperPokemon = createMockPokemon("sniper", "pikachu", "sniper")
        local multiplier3 = CriticalHitCalculator.getCriticalHitDamageMultiplier(sniperPokemon, nil, 1, true)
        TestFramework.assert(multiplier3 == 2.25, "Sniper ability should make crits 2.25x instead of 1.5x")
    end)
    
    -- Test complete critical hit application
    testSuite:addTest("Complete Critical Hit Application", function()
        CriticalHitCalculator.init()
        
        local pokemon = createMockPokemon("attacker", "pikachu", "super_luck") -- +1 crit stage
        local battleConditions = createMockBattleConditions()
        battleConditions.rng.random = function() return 0 end -- Guarantee critical hit
        
        local baseDamage = 100
        local finalDamage, result = CriticalHitCalculator.applyCriticalHit(
            baseDamage, pokemon, nil, 1, battleConditions
        )
        
        TestFramework.assert(result.is_critical == true, "Should result in critical hit")
        TestFramework.assert(result.rate == 12.5, "Should have 12.5% critical hit rate (stage 1)")
        TestFramework.assert(result.multiplier == 1.5, "Should have 1.5x multiplier")
        TestFramework.assert(result.final_damage == 150, "Final damage should be 150 (100 * 1.5)")
        TestFramework.assert(result.base_damage == 100, "Should record base damage")
        
        TestFramework.assert(finalDamage == 150, "Return value should match final damage")
    end)
    
    -- Test move critical hit capability
    testSuite:addTest("Move Critical Hit Capability", function()
        MoveDatabase.init()
        CriticalHitCalculator.init()
        
        -- Test physical move can crit
        local canCrit1 = CriticalHitCalculator.canMoveCriticalHit(1, nil) -- POUND (Physical)
        TestFramework.assert(canCrit1 == true, "Physical moves should be able to critical hit")
        
        -- Test status move cannot crit (if we have one in database)
        -- This would need to be updated based on actual move database content
        
        -- Test immunity prevents crits
        local immuneTarget = createMockPokemon("immune", "pikachu", "battle_armor")
        local canCrit2 = CriticalHitCalculator.canMoveCriticalHit(1, immuneTarget)
        TestFramework.assert(canCrit2 == false, "Moves cannot crit against immune targets")
    end)
    
    -- Test critical hit breakdown analysis
    testSuite:addTest("Critical Hit Breakdown Analysis", function()
        CriticalHitCalculator.init()
        
        local pokemon = createMockPokemon("analysis", "chansey", "super_luck", "lucky_punch", true)
        local battleConditions = createMockBattleConditions({["analysis"] = true}) -- Dire Hit active
        
        local breakdown = CriticalHitCalculator.getCriticalHitBreakdown(pokemon, 1, nil, battleConditions)
        
        TestFramework.assert(breakdown.can_crit == true, "Move should be able to critical hit")
        TestFramework.assert(breakdown.base_stage == 0, "Should start at base stage 0")
        TestFramework.assert(breakdown.ability_bonus == 1, "Super Luck should add +1")
        TestFramework.assert(breakdown.item_bonus == 2, "Lucky Punch should add +2 for Chansey")
        TestFramework.assert(breakdown.condition_bonus == 3, "Focus Energy(+2) + Dire Hit(+1) = +3")
        TestFramework.assert(breakdown.final_stage == 3, "Should cap at stage 3 (0+1+2+3=6, clamped to 3)")
        TestFramework.assert(breakdown.final_rate == 100.0, "Stage 3 should be 100% rate")
    end)
    
    -- Test critical hit validation
    testSuite:addTest("Critical Hit Result Validation", function()
        CriticalHitCalculator.init()
        
        -- Test valid result
        local validResult = {
            is_critical = true,
            rate = 12.5,
            multiplier = 1.5,
            base_damage = 100,
            final_damage = 150
        }
        local isValid, msg = CriticalHitCalculator.validateCriticalHit(validResult)
        TestFramework.assert(isValid == true, "Valid result should pass validation")
        
        -- Test invalid rate
        local invalidResult = {
            is_critical = true,
            rate = 150, -- > 100
            multiplier = 1.5,
            final_damage = 150
        }
        local isValid2, msg2 = CriticalHitCalculator.validateCriticalHit(invalidResult)
        TestFramework.assert(isValid2 == false, "Invalid rate should fail validation")
        TestFramework.assert(msg2:find("rate out of range"), "Should mention rate range error")
        
        -- Test damage calculation mismatch
        local mismatchResult = {
            is_critical = true,
            rate = 50.0,
            multiplier = 1.5,
            base_damage = 100,
            final_damage = 200 -- Should be 150
        }
        local isValid3, msg3 = CriticalHitCalculator.validateCriticalHit(mismatchResult)
        TestFramework.assert(isValid3 == false, "Damage mismatch should fail validation")
    end)
    
    -- Performance test
    testSuite:addTest("Critical Hit Calculation Performance", function()
        CriticalHitCalculator.init()
        
        local pokemon = createMockPokemon("perf_test", "pikachu", "super_luck", "scope_lens")
        local battleConditions = createMockBattleConditions()
        
        -- Test stage calculation performance
        local startTime = os.clock()
        for i = 1, 1000 do
            CriticalHitCalculator.calculateCriticalHitStage(pokemon, 1, nil, battleConditions)
        end
        local stageTime = os.clock() - startTime
        
        -- Test full critical hit application performance
        local startTime2 = os.clock()
        for i = 1, 1000 do
            CriticalHitCalculator.applyCriticalHit(100, pokemon, nil, 1, battleConditions)
        end
        local applicationTime = os.clock() - startTime2
        
        print("Critical hit stage calculation: " .. string.format("%.4f", stageTime) .. 
              " seconds (1000 operations)")
        print("Critical hit application: " .. string.format("%.4f", applicationTime) .. 
              " seconds (1000 operations)")
        
        TestFramework.assert(stageTime < 0.5, "Stage calculation should complete in under 0.5 seconds")
        TestFramework.assert(applicationTime < 0.5, "Application should complete in under 0.5 seconds")
    end)
    
    -- Integration test with move database
    testSuite:addTest("Move Database Critical Hit Integration", function()
        MoveDatabase.init()
        CriticalHitCalculator.init()
        
        local pokemon = createMockPokemon()
        local battleConditions = createMockBattleConditions()
        
        -- Test several moves from database
        local testMoves = {
            {id = 1, name = "Pound", expectedHighCrit = false},
            {id = 2, name = "Karate Chop", expectedHighCrit = true}
        }
        
        for _, moveData in ipairs(testMoves) do
            local move = MoveDatabase.moves[moveData.id]
            if move then
                local stage = CriticalHitCalculator.calculateCriticalHitStage(pokemon, moveData.id, nil, battleConditions)
                
                if moveData.expectedHighCrit then
                    TestFramework.assert(stage >= 1, moveData.name .. " should have increased critical hit stage")
                else
                    TestFramework.assert(stage == 0, moveData.name .. " should have normal critical hit stage")
                end
                
                -- Test that move can critical hit
                local canCrit = CriticalHitCalculator.canMoveCriticalHit(moveData.id, nil)
                TestFramework.assert(canCrit == true, moveData.name .. " should be able to critical hit")
            end
        end
    end)
    
    -- Edge case tests
    testSuite:addTest("Critical Hit Edge Cases", function()
        CriticalHitCalculator.init()
        
        -- Test zero damage
        local pokemon = createMockPokemon()
        local battleConditions = createMockBattleConditions()
        
        local finalDamage, result = CriticalHitCalculator.applyCriticalHit(0, pokemon, nil, 1, battleConditions)
        TestFramework.assert(finalDamage == 0, "Zero damage should remain zero")
        TestFramework.assert(result.is_critical == false, "Zero damage moves should not crit")
        
        -- Test negative damage (shouldn't happen but handle gracefully)
        local finalDamage2, result2 = CriticalHitCalculator.applyCriticalHit(-10, pokemon, nil, 1, battleConditions)
        TestFramework.assert(finalDamage2 == -10, "Negative damage should be preserved")
        TestFramework.assert(result2.is_critical == false, "Negative damage should not crit")
        
        -- Test maximum stage combinations
        local maxPokemon = createMockPokemon("max_crit", "chansey", "super_luck", "lucky_punch", true)
        local maxConditions = createMockBattleConditions({["max_crit"] = true})
        local maxStage = CriticalHitCalculator.calculateCriticalHitStage(maxPokemon, 2, nil, maxConditions)
        TestFramework.assert(maxStage == 3, "Maximum combinations should cap at stage 3")
    end)
    
    return testSuite:run()
end

return CriticalHitCalculatorTests