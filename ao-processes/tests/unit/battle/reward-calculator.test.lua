-- Unit Tests for Reward Calculator
-- Tests all reward calculation components with 100% coverage requirement
-- Covers money rewards, item drops, bonus rewards, and battle type variations
-- Uses AAA pattern (Arrange, Act, Assert) for all test functions

local RewardCalculator = require("game-logic.battle.reward-calculator")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Test framework functions
local TestSuite = {}
local testResults = {}

-- Helper function to create mock battle state
local function createMockBattleState(battleType, enemyPartyData)
    local enemyParty = {}
    
    for i, data in ipairs(enemyPartyData or {}) do
        table.insert(enemyParty, {
            id = "enemy_" .. i,
            name = data.name or ("Enemy " .. i),
            level = data.level or 50,
            fainted = data.fainted or false,
            currentHP = data.fainted and 0 or (data.hp or 100),
            maxHP = data.maxHP or 100
        })
    end
    
    return {
        battleId = "reward_test_001",
        battleType = battleType or "WILD",
        battleSeed = "reward_seed_123",
        turn = 5,
        playerParty = {{id = "player_1", name = "Pikachu"}},
        enemyParty = enemyParty
    }
end

-- Helper function to create mock battle result
local function createMockBattleResult(result, turn)
    return {
        result = result or "victory",
        reason = "Test battle result",
        timestamp = os.time(),
        turn = turn or 5,
        battleId = "reward_test_001"
    }
end

-- Helper function to run test and record results
local function runTest(testName, testFunction)
    local success, result = pcall(testFunction)
    table.insert(testResults, {
        name = testName,
        success = success,
        result = result,
        error = not success and result or nil
    })
    
    if success then
        print("✓ " .. testName)
    else
        print("✗ " .. testName .. ": " .. tostring(result))
    end
    
    return success
end

-- Helper function for assertions
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

local function assert_false(condition, message)
    if condition then
        error(message or "Expected condition to be false")
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

local function assert_less_than_or_equal(actual, maximum, message)
    if actual > maximum then
        error(message or ("Expected " .. tostring(actual) .. " to be less than or equal to " .. tostring(maximum)))
    end
end

-- Test: Reward Calculator Initialization
function TestSuite.testInitialization()
    -- Arrange & Act
    local success, message = RewardCalculator.init("test_seed_123")
    
    -- Assert
    assert_true(success, "Reward calculator should initialize successfully")
    assert_not_nil(message, "Initialization should return a message")
end

-- Test: Money Rewards - Victory with Wild Battle
function TestSuite.testMoneyRewardsWildVictory()
    -- Arrange
    local battleState = createMockBattleState("WILD", {
        {name = "Rattata", level = 10, fainted = true},
        {name = "Pidgey", level = 15, fainted = true}
    })
    local battleResult = createMockBattleResult("victory")
    
    RewardCalculator.init("money_test_001")
    
    -- Act
    local result = RewardCalculator.calculateMoneyRewards(battleState, battleResult)
    
    -- Assert
    assert_not_nil(result, "Should return money reward result")
    assert_greater_than(result.totalMoney, 0, "Should calculate positive money reward for victory")
    assert_equal("WILD", result.battleType, "Should record correct battle type")
    assert_equal(1.0, result.multiplier, "Wild battles should have 1.0 multiplier")
    assert_not_nil(result.breakdown, "Should provide money breakdown")
    assert_equal(2, #result.breakdown, "Should have breakdown for each defeated Pokemon")
end

-- Test: Money Rewards - No Money for Defeat
function TestSuite.testMoneyRewardsDefeat()
    -- Arrange
    local battleState = createMockBattleState("TRAINER", {
        {name = "Charmander", level = 20, fainted = false}
    })
    local battleResult = createMockBattleResult("defeat")
    
    -- Act
    local result = RewardCalculator.calculateMoneyRewards(battleState, battleResult)
    
    -- Assert
    assert_not_nil(result, "Should return result even for defeat")
    assert_equal(0, result.totalMoney, "Should give no money for defeat")
    assert_not_nil(result.message, "Should explain why no money was given")
end

-- Test: Money Rewards - Trainer Battle Multiplier
function TestSuite.testMoneyRewardsTrainerBattle()
    -- Arrange
    local battleState = createMockBattleState("TRAINER", {
        {name = "Squirtle", level = 25, fainted = true}
    })
    local battleResult = createMockBattleResult("victory")
    
    RewardCalculator.init("trainer_money_test")
    
    -- Act
    local result = RewardCalculator.calculateMoneyRewards(battleState, battleResult)
    
    -- Assert
    assert_greater_than(result.totalMoney, 0, "Should give money for trainer victory")
    assert_equal(1.5, result.multiplier, "Trainer battles should have 1.5x multiplier")
    
    -- Compare with wild battle equivalent
    local wildState = createMockBattleState("WILD", {
        {name = "Squirtle", level = 25, fainted = true}
    })
    local wildResult = RewardCalculator.calculateMoneyRewards(wildState, battleResult)
    
    assert_greater_than(result.totalMoney, wildResult.totalMoney, 
                       "Trainer battles should give more money than wild battles")
end

-- Test: Money Rewards - Gym Battle High Multiplier
function TestSuite.testMoneyRewardsGymBattle()
    -- Arrange
    local battleState = createMockBattleState("GYM", {
        {name = "Onix", level = 40, fainted = true},
        {name = "Graveler", level = 42, fainted = true}
    })
    local battleResult = createMockBattleResult("victory")
    
    RewardCalculator.init("gym_money_test")
    
    -- Act
    local result = RewardCalculator.calculateMoneyRewards(battleState, battleResult)
    
    -- Assert
    assert_greater_than(result.totalMoney, 0, "Should give money for gym victory")
    assert_equal(2.5, result.multiplier, "Gym battles should have 2.5x multiplier")
    assert_equal(2, #result.breakdown, "Should have breakdown for both gym Pokemon")
end

-- Test: Item Rewards - Wild Battle Basic Drops
function TestSuite.testItemRewardsWildBattle()
    -- Arrange
    local battleState = createMockBattleState("WILD", {
        {name = "Caterpie", level = 5, fainted = true}
    })
    local battleResult = createMockBattleResult("victory")
    
    RewardCalculator.init("item_test_wild")
    
    -- Act
    local result = RewardCalculator.calculateItemRewards(battleState, battleResult)
    
    -- Assert
    assert_not_nil(result, "Should return item reward result")
    assert_not_nil(result.items, "Should have items array")
    assert_not_nil(result.bonusItems, "Should have bonus items array")
    assert_equal("WILD", result.battleType, "Should record correct battle type")
    assert_equal(5.0, result.itemChance, "Wild battles should have 5% item chance")
end

-- Test: Item Rewards - No Items for Defeat
function TestSuite.testItemRewardsDefeat()
    -- Arrange
    local battleState = createMockBattleState("TRAINER", {
        {name = "Machop", level = 30, fainted = false}
    })
    local battleResult = createMockBattleResult("defeat")
    
    -- Act
    local result = RewardCalculator.calculateItemRewards(battleState, battleResult)
    
    -- Assert
    assert_not_nil(result, "Should return result even for defeat")
    assert_equal(0, #result.items, "Should give no items for defeat")
    assert_equal(0, #result.bonusItems, "Should give no bonus items for defeat")
    assert_not_nil(result.message, "Should explain why no items were given")
end

-- Test: Item Rewards - Trainer Battle Higher Drop Rates
function TestSuite.testItemRewardsTrainerBattle()
    -- Arrange
    local battleState = createMockBattleState("TRAINER", {
        {name = "Kadabra", level = 35, fainted = true},
        {name = "Alakazam", level = 45, fainted = true}
    })
    local battleResult = createMockBattleResult("victory")
    
    RewardCalculator.init("item_trainer_test")
    
    -- Act
    local result = RewardCalculator.calculateItemRewards(battleState, battleResult)
    
    -- Assert
    assert_equal(15.0, result.itemChance, "Trainer battles should have 15% item chance")
    assert_equal(5.0, result.bonusChance, "Trainer battles should have 5% bonus chance")
    -- Items array length depends on RNG, but structure should be correct
end

-- Test: Item Rewards - Elite Battle Premium Rewards
function TestSuite.testItemRewardsEliteBattle()
    -- Arrange
    local battleState = createMockBattleState("ELITE", {
        {name = "Dragonite", level = 60, fainted = true}
    })
    local battleResult = createMockBattleResult("victory")
    
    RewardCalculator.init("item_elite_test")
    
    -- Act
    local result = RewardCalculator.calculateItemRewards(battleState, battleResult)
    
    -- Assert
    assert_equal(35.0, result.itemChance, "Elite battles should have 35% item chance")
    assert_equal(25.0, result.bonusChance, "Elite battles should have 25% bonus chance")
end

-- Test: Complete Battle Rewards - Victory Integration
function TestSuite.testCompleteBattleRewardsVictory()
    -- Arrange
    local battleState = createMockBattleState("TRAINER", {
        {name = "Gengar", level = 50, fainted = true},
        {name = "Crobat", level = 48, fainted = true}
    })
    local battleResult = createMockBattleResult("victory")
    
    -- Act
    local result = RewardCalculator.calculateBattleRewards(battleState, battleResult)
    
    -- Assert
    assert_true(result.success, "Battle rewards calculation should succeed")
    assert_equal("victory", result.battleResult, "Should record victory result")
    assert_not_nil(result.money, "Should include money rewards")
    assert_not_nil(result.items, "Should include item rewards")
    assert_greater_than(result.totalMoney, 0, "Should have positive total money")
    assert_not_nil(result.totalItems, "Should count total items")
    assert_not_nil(result.totalBonusItems, "Should count bonus items")
    assert_equal("TRAINER", result.battleType, "Should record battle type")
end

-- Test: Complete Battle Rewards - Defeat No Rewards
function TestSuite.testCompleteBattleRewardsDefeat()
    -- Arrange
    local battleState = createMockBattleState("GYM", {
        {name = "Machamp", level = 55, fainted = false}
    })
    local battleResult = createMockBattleResult("defeat")
    
    -- Act
    local result = RewardCalculator.calculateBattleRewards(battleState, battleResult)
    
    -- Assert
    assert_true(result.success, "Calculation should succeed even for defeat")
    assert_equal("defeat", result.battleResult, "Should record defeat result")
    assert_equal(0, result.totalMoney, "Should have no money for defeat")
    assert_equal(0, result.totalItems, "Should have no items for defeat")
end

-- Test: Bonus Reward Selection - Wild Battle
function TestSuite.testBonusRewardSelectionWild()
    -- Arrange & Act
    local bonusType = RewardCalculator.selectBonusReward("WILD")
    
    -- Assert
    assert_not_nil(bonusType, "Should select a bonus reward type")
    local validTypes = {
        RewardCalculator.BonusRewards.EXTRA_MONEY,
        RewardCalculator.BonusRewards.RARE_ITEM,
        RewardCalculator.BonusRewards.EXPERIENCE_BONUS,
        RewardCalculator.BonusRewards.FRIENDSHIP_BONUS
    }
    
    local found = false
    for _, validType in ipairs(validTypes) do
        if bonusType == validType then
            found = true
            break
        end
    end
    assert_true(found, "Should select a valid bonus type")
end

-- Test: Bonus Reward Generation - Extra Money
function TestSuite.testBonusRewardGenerationMoney()
    -- Arrange
    local battleState = createMockBattleState("TRAINER", {})
    
    -- Act
    local reward = RewardCalculator.generateBonusReward(
        RewardCalculator.BonusRewards.EXTRA_MONEY,
        battleState
    )
    
    -- Assert
    assert_not_nil(reward, "Should generate bonus reward")
    assert_equal("MONEY", reward.type, "Should be money reward")
    assert_greater_than(reward.amount, 0, "Should have positive amount")
    assert_not_nil(reward.description, "Should have description")
end

-- Test: Bonus Reward Generation - Rare Item
function TestSuite.testBonusRewardGenerationItem()
    -- Arrange
    local battleState = createMockBattleState("GYM", {})
    
    RewardCalculator.init("rare_item_test")
    
    -- Act
    local reward = RewardCalculator.generateBonusReward(
        RewardCalculator.BonusRewards.RARE_ITEM,
        battleState
    )
    
    -- Assert
    assert_not_nil(reward, "Should generate rare item reward")
    assert_equal("ITEM", reward.type, "Should be item reward")
    assert_not_nil(reward.itemId, "Should have item ID")
    assert_equal(1, reward.quantity, "Should have quantity")
    assert_not_nil(reward.description, "Should have description")
end

-- Test: Bonus Reward Generation - Experience Bonus
function TestSuite.testBonusRewardGenerationExperience()
    -- Arrange
    local battleState = createMockBattleState("ELITE", {})
    
    RewardCalculator.init("exp_bonus_test")
    
    -- Act
    local reward = RewardCalculator.generateBonusReward(
        RewardCalculator.BonusRewards.EXPERIENCE_BONUS,
        battleState
    )
    
    -- Assert
    assert_not_nil(reward, "Should generate experience bonus")
    assert_equal("EXPERIENCE_MULTIPLIER", reward.type, "Should be experience multiplier")
    assert_greater_than(reward.multiplier, 1.0, "Multiplier should be greater than 1.0")
    assert_less_than_or_equal(reward.multiplier, 1.5, "Multiplier should be reasonable")
    assert_not_nil(reward.description, "Should have description")
end

-- Test: Bonus Reward Generation - Friendship Bonus
function TestSuite.testBonusRewardGenerationFriendship()
    -- Arrange
    local battleState = createMockBattleState("CHAMPION", {})
    
    RewardCalculator.init("friendship_test")
    
    -- Act
    local reward = RewardCalculator.generateBonusReward(
        RewardCalculator.BonusRewards.FRIENDSHIP_BONUS,
        battleState
    )
    
    -- Assert
    assert_not_nil(reward, "Should generate friendship bonus")
    assert_equal("FRIENDSHIP_BOOST", reward.type, "Should be friendship boost")
    assert_greater_than(reward.amount, 0, "Should have positive friendship amount")
    assert_less_than_or_equal(reward.amount, 20, "Friendship amount should be reasonable")
end

-- Test: Reward Parameter Validation
function TestSuite.testRewardParameterValidation()
    -- Arrange
    local validBattleState = createMockBattleState("WILD", {{name = "Test", fainted = true}})
    local validBattleResult = createMockBattleResult("victory")
    
    -- Act & Assert
    local validResult = RewardCalculator.validateRewardParameters(validBattleState, validBattleResult)
    assert_true(validResult.valid, "Valid parameters should pass validation")
    
    local nilBattleState = RewardCalculator.validateRewardParameters(nil, validBattleResult)
    assert_false(nilBattleState.valid, "Nil battle state should fail validation")
    
    local nilBattleResult = RewardCalculator.validateRewardParameters(validBattleState, nil)
    assert_false(nilBattleResult.valid, "Nil battle result should fail validation")
    
    local invalidBattleType = createMockBattleState("INVALID_TYPE", {})
    local invalidTypeResult = RewardCalculator.validateRewardParameters(invalidBattleType, validBattleResult)
    assert_false(invalidTypeResult.valid, "Invalid battle type should fail validation")
end

-- Test: Reward Summary Generation
function TestSuite.testRewardSummaryGeneration()
    -- Arrange
    local rewardResults = {
        success = true,
        battleType = "TRAINER",
        totalMoney = 1500,
        totalItems = 2,
        totalBonusItems = 1
    }
    
    local noRewards = {
        success = true,
        totalMoney = 0,
        totalItems = 0,
        totalBonusItems = 0
    }
    
    local failedResults = {
        success = false
    }
    
    -- Act
    local fullSummary = RewardCalculator.getRewardSummary(rewardResults)
    local noRewardSummary = RewardCalculator.getRewardSummary(noRewards)
    local failedSummary = RewardCalculator.getRewardSummary(failedResults)
    
    -- Assert
    assert_true(string.find(fullSummary, "1500"), "Should include money amount")
    assert_true(string.find(fullSummary, "2 items"), "Should include item count")
    assert_true(string.find(fullSummary, "1 bonus"), "Should include bonus count")
    assert_true(string.find(fullSummary, "TRAINER"), "Should include battle type")
    
    assert_equal("No rewards received", noRewardSummary, "Should handle no rewards")
    assert_equal("No rewards calculated", failedSummary, "Should handle failed calculation")
end

-- Test: Champion Battle Maximum Rewards
function TestSuite.testChampionBattleMaximumRewards()
    -- Arrange
    local battleState = createMockBattleState("CHAMPION", {
        {name = "Mewtwo", level = 70, fainted = true},
        {name = "Mew", level = 70, fainted = true}
    })
    local battleResult = createMockBattleResult("victory")
    
    RewardCalculator.init("champion_test")
    
    -- Act
    local moneyResult = RewardCalculator.calculateMoneyRewards(battleState, battleResult)
    local itemResult = RewardCalculator.calculateItemRewards(battleState, battleResult)
    
    -- Assert
    assert_equal(5.0, moneyResult.multiplier, "Champion battles should have 5.0x money multiplier")
    assert_equal(50.0, itemResult.itemChance, "Champion battles should have 50% item chance")
    assert_equal(40.0, itemResult.bonusChance, "Champion battles should have 40% bonus chance")
end

-- Test: Edge Case - Empty Enemy Party
function TestSuite.testEmptyEnemyParty()
    -- Arrange
    local battleState = createMockBattleState("WILD", {})  -- No enemy Pokemon
    local battleResult = createMockBattleResult("victory")
    
    -- Act
    local result = RewardCalculator.calculateBattleRewards(battleState, battleResult)
    
    -- Assert
    assert_true(result.success, "Should handle empty enemy party")
    assert_equal(0, result.totalMoney, "Should give no money with no enemies")
    assert_equal(0, result.totalItems, "Should give no items with no enemies")
end

-- Test: Deterministic Rewards - Same Seed Same Results
function TestSuite.testDeterministicRewards()
    -- Arrange
    local battleState1 = createMockBattleState("TRAINER", {
        {name = "Pikachu", level = 30, fainted = true}
    })
    local battleState2 = createMockBattleState("TRAINER", {
        {name = "Pikachu", level = 30, fainted = true}
    })
    local battleResult = createMockBattleResult("victory")
    
    -- Act
    RewardCalculator.init("deterministic_test")
    local result1 = RewardCalculator.calculateBattleRewards(battleState1, battleResult)
    
    RewardCalculator.init("deterministic_test")  -- Same seed
    local result2 = RewardCalculator.calculateBattleRewards(battleState2, battleResult)
    
    -- Assert
    assert_equal(result1.totalMoney, result2.totalMoney, 
                "Same seed should produce same money rewards")
    assert_equal(result1.totalItems, result2.totalItems, 
                "Same seed should produce same item count")
end

-- Run all tests
function TestSuite.runAllTests()
    print("Running Reward Calculator Unit Tests...")
    
    local tests = {
        {"Initialization", TestSuite.testInitialization},
        {"Money Rewards Wild Victory", TestSuite.testMoneyRewardsWildVictory},
        {"Money Rewards Defeat", TestSuite.testMoneyRewardsDefeat},
        {"Money Rewards Trainer Battle", TestSuite.testMoneyRewardsTrainerBattle},
        {"Money Rewards Gym Battle", TestSuite.testMoneyRewardsGymBattle},
        {"Item Rewards Wild Battle", TestSuite.testItemRewardsWildBattle},
        {"Item Rewards Defeat", TestSuite.testItemRewardsDefeat},
        {"Item Rewards Trainer Battle", TestSuite.testItemRewardsTrainerBattle},
        {"Item Rewards Elite Battle", TestSuite.testItemRewardsEliteBattle},
        {"Complete Battle Rewards Victory", TestSuite.testCompleteBattleRewardsVictory},
        {"Complete Battle Rewards Defeat", TestSuite.testCompleteBattleRewardsDefeat},
        {"Bonus Reward Selection Wild", TestSuite.testBonusRewardSelectionWild},
        {"Bonus Reward Generation Money", TestSuite.testBonusRewardGenerationMoney},
        {"Bonus Reward Generation Item", TestSuite.testBonusRewardGenerationItem},
        {"Bonus Reward Generation Experience", TestSuite.testBonusRewardGenerationExperience},
        {"Bonus Reward Generation Friendship", TestSuite.testBonusRewardGenerationFriendship},
        {"Reward Parameter Validation", TestSuite.testRewardParameterValidation},
        {"Reward Summary Generation", TestSuite.testRewardSummaryGeneration},
        {"Champion Battle Maximum Rewards", TestSuite.testChampionBattleMaximumRewards},
        {"Empty Enemy Party", TestSuite.testEmptyEnemyParty},
        {"Deterministic Rewards", TestSuite.testDeterministicRewards}
    }
    
    local passed = 0
    local total = #tests
    
    for _, test in ipairs(tests) do
        if runTest(test[1], test[2]) then
            passed = passed + 1
        end
    end
    
    print(string.format("\nReward Calculator Tests: %d/%d passed (%.1f%%)", 
                       passed, total, (passed/total)*100))
    
    return {
        passed = passed,
        total = total,
        results = testResults
    }
end

return TestSuite