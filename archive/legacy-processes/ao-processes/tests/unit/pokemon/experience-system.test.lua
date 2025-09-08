--[[
Unit Tests for Pokemon Experience and Progression System
Tests experience calculation, level progression, and friendship mechanics

Test Coverage:
- Experience calculation with different growth rates
- Level progression and stat recalculation
- Friendship system and battle participation
- Battle experience gain calculations
- Experience/level validation and edge cases
--]]

-- Import test framework
local TestFramework = require("framework.test-framework-enhanced")

-- Import modules under test
local ExperienceSystem = require("game-logic.progression.experience-system")
local ExperienceGroups = require("data.constants.experience-groups")
local PokemonManager = require("game-logic.pokemon.pokemon-manager")
local SpeciesDatabase = require("data.species.species-database")
local StatCalculator = require("game-logic.pokemon.stat-calculator")

-- Test suite
local ExperienceSystemTests = {}

-- Test fixture setup
function ExperienceSystemTests.setUp()
    -- Clear storage and initialize databases
    PokemonManager.clearAllStorage()
    SpeciesDatabase.init()
    ExperienceGroups.init()
    
    -- Create test Pokemon
    ExperienceSystemTests.testPokemon = {
        id = "PKM00000001",
        speciesId = 1,  -- Bulbasaur
        playerId = "test-player",
        level = 5,
        exp = 125,  -- 5^3 = 125 for medium fast
        friendship = 70,
        ivs = {hp = 31, attack = 20, defense = 15, spAttack = 25, spDefense = 10, speed = 30},
        nature = 1,
        stats = {hp = 24, maxHp = 24, attack = 12, defense = 11, spAttack = 13, spDefense = 11, speed = 12},
        battleHistory = {}
    }
end

-- Test fixture teardown
function ExperienceSystemTests.tearDown()
    PokemonManager.clearAllStorage()
end

-- Experience Calculation Tests

function ExperienceSystemTests.testGetExpForLevel()
    -- Test different growth rates
    local mediumFastExp = ExperienceSystem.getExpForLevel(10, "MEDIUM_FAST")
    local fastExp = ExperienceSystem.getExpForLevel(10, "FAST")
    local slowExp = ExperienceSystem.getExpForLevel(10, "SLOW")
    
    TestFramework.assert(mediumFastExp == 1000, "Medium Fast level 10 should be 1000 exp (10^3)")
    TestFramework.assert(fastExp == 800, "Fast level 10 should be 800 exp")
    TestFramework.assert(slowExp == 1250, "Slow level 10 should be 1250 exp")
    
    -- Test level 1 (should always be 0)
    TestFramework.assert(ExperienceSystem.getExpForLevel(1, "MEDIUM_FAST") == 0, "Level 1 should always be 0 exp")
    TestFramework.assert(ExperienceSystem.getExpForLevel(1, "SLOW") == 0, "Level 1 should always be 0 exp for all rates")
    
    return true, "Experience calculation working correctly"
end

function ExperienceSystemTests.testGetLevelFromExp()
    -- Test level calculation from experience
    local level5 = ExperienceSystem.getLevelFromExp(125, "MEDIUM_FAST")  -- 5^3
    local level10 = ExperienceSystem.getLevelFromExp(1000, "MEDIUM_FAST") -- 10^3
    local level50 = ExperienceSystem.getLevelFromExp(125000, "MEDIUM_FAST") -- 50^3
    
    TestFramework.assert(level5 == 5, "125 exp should be level 5")
    TestFramework.assert(level10 == 10, "1000 exp should be level 10")
    TestFramework.assert(level50 == 50, "125000 exp should be level 50")
    
    -- Test edge cases
    TestFramework.assert(ExperienceSystem.getLevelFromExp(0, "MEDIUM_FAST") == 1, "0 exp should be level 1")
    TestFramework.assert(ExperienceSystem.getLevelFromExp(-100, "MEDIUM_FAST") == 1, "Negative exp should be level 1")
    
    return true, "Level from experience calculation working correctly"
end

function ExperienceSystemTests.testGetExpToNextLevel()
    -- Test experience needed for next level
    local expToNext = ExperienceSystem.getExpToNextLevel(5, "MEDIUM_FAST")
    local expectedNext = 6*6*6 - 5*5*5  -- 216 - 125 = 91
    
    TestFramework.assert(expToNext == expectedNext, "Exp to next level should be " .. expectedNext .. ", got " .. expToNext)
    
    -- Test max level (should be 0)
    local maxLevelExp = ExperienceSystem.getExpToNextLevel(100, "MEDIUM_FAST")
    TestFramework.assert(maxLevelExp == 0, "Max level should need 0 exp to next level")
    
    return true, "Experience to next level calculation working correctly"
end

function ExperienceSystemTests.testGetLevelProgress()
    local currentExp = 150  -- Between level 5 (125) and level 6 (216)
    local progress = ExperienceSystem.getLevelProgress(currentExp, "MEDIUM_FAST")
    
    TestFramework.assert(progress.level == 5, "Should be at level 5")
    TestFramework.assert(progress.currentLevelExp == 125, "Current level exp should be 125")
    TestFramework.assert(progress.nextLevelExp == 216, "Next level exp should be 216")
    TestFramework.assert(progress.expInLevel == 25, "Should have 25 exp in current level")
    TestFramework.assert(progress.expToNextLevel == 66, "Should need 66 exp to next level")
    TestFramework.assert(progress.progressPercent > 0 and progress.progressPercent < 100, "Progress percent should be between 0 and 100")
    
    return true, "Level progress calculation working correctly"
end

-- Battle Experience Tests

function ExperienceSystemTests.testCalculateBattleExp()
    -- Create defeated Pokemon
    local defeatedPokemon = {
        speciesId = 1,  -- Bulbasaur
        level = 10
    }
    
    local victorPokemon = {
        speciesId = 1,
        level = 5
    }
    
    -- Test basic wild battle
    local wildExp = ExperienceSystem.calculateBattleExp(defeatedPokemon, victorPokemon, "WILD")
    TestFramework.assert(wildExp > 0, "Should gain experience from wild battle")
    
    -- Test trainer battle (should be more exp)
    local trainerExp = ExperienceSystem.calculateBattleExp(defeatedPokemon, victorPokemon, "TRAINER")
    TestFramework.assert(trainerExp > wildExp, "Trainer battle should give more exp than wild battle")
    
    -- Test with participation but no killing blow (should be less exp)
    local participationExp = ExperienceSystem.calculateBattleExp(
        defeatedPokemon, 
        victorPokemon, 
        "WILD", 
        {participated = true, killingBlow = false}
    )
    TestFramework.assert(participationExp < wildExp, "Participation without killing blow should give less exp")
    
    return true, "Battle experience calculation working correctly"
end

-- Pokemon Progression Tests

function ExperienceSystemTests.testGainExperience()
    local pokemon = {}
    for k, v in pairs(ExperienceSystemTests.testPokemon) do
        pokemon[k] = v
    end
    
    local originalLevel = pokemon.level
    local originalExp = pokemon.exp
    
    -- Gain enough experience to level up
    local expGain = 100  -- Should level up from 5 to 6
    local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, expGain)
    
    TestFramework.assert(updatedPokemon.exp == originalExp + expGain, "Experience should be added correctly")
    TestFramework.assert(updatedPokemon.level > originalLevel, "Pokemon should level up")
    TestFramework.assert(levelUpData ~= nil, "Should return level up data")
    TestFramework.assert(levelUpData.levelsGained > 0, "Should indicate levels gained")
    
    return true, "Experience gain and level up working correctly"
end

function ExperienceSystemTests.testGainExperienceNoLevelUp()
    local pokemon = {}
    for k, v in pairs(ExperienceSystemTests.testPokemon) do
        pokemon[k] = v
    end
    
    local originalLevel = pokemon.level
    local originalExp = pokemon.exp
    
    -- Gain small amount of experience (no level up)
    local expGain = 10
    local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, expGain)
    
    TestFramework.assert(updatedPokemon.exp == originalExp + expGain, "Experience should be added correctly")
    TestFramework.assert(updatedPokemon.level == originalLevel, "Pokemon should not level up")
    TestFramework.assert(levelUpData == nil, "Should not return level up data")
    
    return true, "Experience gain without level up working correctly"
end

function ExperienceSystemTests.testGainExperienceWithBattleContext()
    local pokemon = {}
    for k, v in pairs(ExperienceSystemTests.testPokemon) do
        pokemon[k] = v
    end
    
    local battleContext = {
        battleId = "test-battle-001",
        battleType = "TRAINER",
        opponent = "rival"
    }
    
    local expGain = 50
    local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, expGain, battleContext)
    
    TestFramework.assert(updatedPokemon.battleHistory ~= nil, "Should have battle history")
    TestFramework.assert(#updatedPokemon.battleHistory > 0, "Should record battle participation")
    TestFramework.assert(updatedPokemon.lastBattleAt ~= nil, "Should update last battle time")
    
    local lastBattle = updatedPokemon.battleHistory[#updatedPokemon.battleHistory]
    TestFramework.assert(lastBattle.battleId == battleContext.battleId, "Should record correct battle ID")
    TestFramework.assert(lastBattle.expGained == expGain, "Should record experience gained")
    
    return true, "Experience gain with battle context working correctly"
end

-- Friendship System Tests

function ExperienceSystemTests.testUpdateFriendship()
    local pokemon = {}
    for k, v in pairs(ExperienceSystemTests.testPokemon) do
        pokemon[k] = v
    end
    
    local originalFriendship = pokemon.friendship
    local friendshipGain = 5
    
    local updatedPokemon = ExperienceSystem.updateFriendship(pokemon, friendshipGain, "level_up")
    
    TestFramework.assert(updatedPokemon.friendship == originalFriendship + friendshipGain, "Friendship should increase")
    TestFramework.assert(updatedPokemon.friendshipHistory ~= nil, "Should track friendship history")
    TestFramework.assert(#updatedPokemon.friendshipHistory > 0, "Should record friendship change")
    
    return true, "Friendship update working correctly"
end

function ExperienceSystemTests.testFriendshipBounds()
    local pokemon = {friendship = 250}  -- Near max
    
    -- Test max friendship cap
    local maxedPokemon = ExperienceSystem.updateFriendship(pokemon, 10)
    TestFramework.assert(maxedPokemon.friendship == 255, "Friendship should be capped at 255")
    
    -- Test min friendship cap
    local minPokemon = {friendship = 5}
    local bottomedPokemon = ExperienceSystem.updateFriendship(minPokemon, -10)
    TestFramework.assert(bottomedPokemon.friendship == 0, "Friendship should be floored at 0")
    
    return true, "Friendship bounds working correctly"
end

function ExperienceSystemTests.testGetFriendshipLevel()
    TestFramework.assert(ExperienceSystem.getFriendshipLevel(255) == "BEST_FRIENDS", "255 friendship should be BEST_FRIENDS")
    TestFramework.assert(ExperienceSystem.getFriendshipLevel(200) == "GREAT_FRIENDS", "200 friendship should be GREAT_FRIENDS")
    TestFramework.assert(ExperienceSystem.getFriendshipLevel(120) == "GOOD_FRIENDS", "120 friendship should be GOOD_FRIENDS")
    TestFramework.assert(ExperienceSystem.getFriendshipLevel(70) == "NEUTRAL", "70 friendship should be NEUTRAL")
    TestFramework.assert(ExperienceSystem.getFriendshipLevel(30) == "LOW", "30 friendship should be LOW")
    
    return true, "Friendship level categorization working correctly"
end

function ExperienceSystemTests.testApplyBattleFriendship()
    local pokemon = {friendship = 100}
    
    -- Test battle victory
    local winPokemon = ExperienceSystem.applyBattleFriendship(pokemon, "WIN", "WILD")
    TestFramework.assert(winPokemon.friendship > 100, "Should gain friendship from winning")
    
    -- Test battle loss
    pokemon.friendship = 100  -- Reset
    local lossPokemon = ExperienceSystem.applyBattleFriendship(pokemon, "LOSS", "WILD")
    TestFramework.assert(lossPokemon.friendship > 100, "Should gain friendship from battle participation")
    
    -- Test important battle bonus
    pokemon.friendship = 100  -- Reset
    local gymPokemon = ExperienceSystem.applyBattleFriendship(pokemon, "WIN", "GYM")
    TestFramework.assert(gymPokemon.friendship > winPokemon.friendship, "Gym battles should give bonus friendship")
    
    return true, "Battle friendship application working correctly"
end

-- Battle Participation Tests

function ExperienceSystemTests.testRecordBattleParticipation()
    local pokemon = {battleHistory = {}}
    
    local battleData = {
        battleId = "test-battle-123",
        battleType = "TRAINER",
        outcome = "WIN",
        expGained = 75,
        friendshipChange = 3,
        killingBlow = true
    }
    
    local updatedPokemon = ExperienceSystem.recordBattleParticipation(pokemon, battleData)
    
    TestFramework.assert(#updatedPokemon.battleHistory == 1, "Should record battle participation")
    TestFramework.assert(updatedPokemon.lastBattleAt ~= nil, "Should update last battle time")
    
    local record = updatedPokemon.battleHistory[1]
    TestFramework.assert(record.battleId == battleData.battleId, "Should record battle ID")
    TestFramework.assert(record.outcome == battleData.outcome, "Should record battle outcome")
    TestFramework.assert(record.expGained == battleData.expGained, "Should record experience gained")
    TestFramework.assert(record.killingBlow == true, "Should record killing blow")
    
    return true, "Battle participation recording working correctly"
end

function ExperienceSystemTests.testGetBattleStats()
    local pokemon = {
        battleHistory = {
            {outcome = "WIN", expGained = 50, friendshipChange = 3, killingBlow = true, timestamp = os.time()},
            {outcome = "WIN", expGained = 60, friendshipChange = 3, killingBlow = false, timestamp = os.time()},
            {outcome = "LOSS", expGained = 20, friendshipChange = 1, killingBlow = false, timestamp = os.time()},
            {outcome = "WIN", expGained = 40, friendshipChange = 3, killingBlow = true, timestamp = os.time()}
        }
    }
    
    local stats = ExperienceSystem.getBattleStats(pokemon)
    
    TestFramework.assert(stats.totalBattles == 4, "Should count all battles")
    TestFramework.assert(stats.wins == 3, "Should count wins correctly")
    TestFramework.assert(stats.losses == 1, "Should count losses correctly")
    TestFramework.assert(stats.totalExpGained == 170, "Should sum experience gained")
    TestFramework.assert(stats.killingBlows == 2, "Should count killing blows")
    TestFramework.assert(stats.winRate == 0.75, "Should calculate win rate correctly")
    
    return true, "Battle statistics calculation working correctly"
end

-- Validation and Edge Case Tests

function ExperienceSystemTests.testValidateProgression()
    local validPokemon = {
        speciesId = 1,
        level = 5,
        exp = 125,  -- 5^3 for medium fast
        friendship = 100
    }
    
    local isValid, error = ExperienceSystem.validateProgression(validPokemon)
    TestFramework.assert(isValid, "Valid Pokemon should pass validation: " .. (error or ""))
    
    -- Test invalid level/exp combination
    local invalidPokemon = {
        speciesId = 1,
        level = 10,
        exp = 125,  -- Should be level 5, not 10
        friendship = 100
    }
    
    local isInvalid, error2 = ExperienceSystem.validateProgression(invalidPokemon)
    TestFramework.assert(not isInvalid, "Invalid level/exp should fail validation")
    TestFramework.assert(string.find(error2, "Level"), "Should mention level in error message")
    
    return true, "Progression validation working correctly"
end

function ExperienceSystemTests.testExperienceGroups()
    local groups = ExperienceSystem.getExperienceGroups()
    TestFramework.assert(#groups > 0, "Should return experience groups")
    
    local found = false
    for _, group in ipairs(groups) do
        if group == "MEDIUM_FAST" then
            found = true
            break
        end
    end
    TestFramework.assert(found, "Should include MEDIUM_FAST group")
    
    return true, "Experience groups retrieval working correctly"
end

function ExperienceSystemTests.testGetLevelMilestones()
    local milestones = ExperienceSystem.getLevelMilestones("MEDIUM_FAST")
    TestFramework.assert(#milestones > 0, "Should return level milestones")
    
    -- Check that milestones are in ascending order
    for i = 2, #milestones do
        TestFramework.assert(milestones[i].level > milestones[i-1].level, "Milestones should be in ascending order")
        TestFramework.assert(milestones[i].expRequired > milestones[i-1].expRequired, "Experience should increase with level")
    end
    
    return true, "Level milestones working correctly"
end

-- Performance Tests

function ExperienceSystemTests.testExperienceCalculationPerformance()
    local startTime = os.clock()
    
    -- Test rapid experience calculations
    for i = 1, 1000 do
        local level = math.random(1, 100)
        local exp = ExperienceSystem.getExpForLevel(level, "MEDIUM_FAST")
        local calcLevel = ExperienceSystem.getLevelFromExp(exp, "MEDIUM_FAST")
        TestFramework.assert(calcLevel == level, "Calculated level should match original")
    end
    
    local endTime = os.clock()
    local elapsed = endTime - startTime
    
    TestFramework.assert(elapsed < 0.5, "1000 experience calculations should complete in under 0.5 seconds, took " .. elapsed .. "s")
    
    return true, "Experience calculation performance acceptable"
end

-- Integration Tests

function ExperienceSystemTests.testIntegrationWithPokemonManager()
    -- Create a Pokemon using PokemonManager
    local pokemon, error = PokemonManager.createPokemon(1, 5, "test-player")
    TestFramework.assert(pokemon ~= nil, "Pokemon creation should succeed: " .. (error or ""))
    
    -- Gain experience using ExperienceSystem
    local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, 200)
    TestFramework.assert(updatedPokemon.level > 5, "Pokemon should level up")
    
    -- Update the stored Pokemon
    local success, updateError = PokemonManager.updatePokemonStats(
        pokemon.id,
        {level = updatedPokemon.level, exp = updatedPokemon.exp},
        "test-player"
    )
    TestFramework.assert(success, "Pokemon update should succeed: " .. (updateError or ""))
    
    return true, "Integration with PokemonManager working correctly"
end

-- Test runner
function ExperienceSystemTests.runAllTests()
    local testSuite = TestFramework.TestSuite:new("Pokemon Experience System Tests")
    
    -- Experience Calculation Tests
    testSuite:addTest("Get Exp For Level", ExperienceSystemTests.testGetExpForLevel)
    testSuite:addTest("Get Level From Exp", ExperienceSystemTests.testGetLevelFromExp)
    testSuite:addTest("Get Exp To Next Level", ExperienceSystemTests.testGetExpToNextLevel)
    testSuite:addTest("Get Level Progress", ExperienceSystemTests.testGetLevelProgress)
    
    -- Battle Experience Tests
    testSuite:addTest("Calculate Battle Exp", ExperienceSystemTests.testCalculateBattleExp)
    
    -- Pokemon Progression Tests
    testSuite:addTest("Gain Experience", ExperienceSystemTests.testGainExperience)
    testSuite:addTest("Gain Experience No Level Up", ExperienceSystemTests.testGainExperienceNoLevelUp)
    testSuite:addTest("Gain Experience With Battle Context", ExperienceSystemTests.testGainExperienceWithBattleContext)
    
    -- Friendship System Tests
    testSuite:addTest("Update Friendship", ExperienceSystemTests.testUpdateFriendship)
    testSuite:addTest("Friendship Bounds", ExperienceSystemTests.testFriendshipBounds)
    testSuite:addTest("Get Friendship Level", ExperienceSystemTests.testGetFriendshipLevel)
    testSuite:addTest("Apply Battle Friendship", ExperienceSystemTests.testApplyBattleFriendship)
    
    -- Battle Participation Tests
    testSuite:addTest("Record Battle Participation", ExperienceSystemTests.testRecordBattleParticipation)
    testSuite:addTest("Get Battle Stats", ExperienceSystemTests.testGetBattleStats)
    
    -- Validation and Edge Case Tests
    testSuite:addTest("Validate Progression", ExperienceSystemTests.testValidateProgression)
    testSuite:addTest("Experience Groups", ExperienceSystemTests.testExperienceGroups)
    testSuite:addTest("Get Level Milestones", ExperienceSystemTests.testGetLevelMilestones)
    
    -- Performance Tests
    testSuite:addTest("Experience Calculation Performance", ExperienceSystemTests.testExperienceCalculationPerformance)
    
    -- Integration Tests
    testSuite:addTest("Integration with PokemonManager", ExperienceSystemTests.testIntegrationWithPokemonManager)
    
    -- Run tests with setup/teardown
    testSuite:setSetUp(ExperienceSystemTests.setUp)
    testSuite:setTearDown(ExperienceSystemTests.tearDown)
    
    local results = testSuite:run()
    return results
end

return ExperienceSystemTests