-- Battle Messages Unit Tests
-- Tests for battle message generation system
-- Validates message formatting, template processing, and output consistency
-- Ensures messages match current game narrative style

local BattleMessages = require("game-logic.battle.battle-messages")

-- Test framework
local tests = {}
local testResults = {
    passed = 0,
    failed = 0,
    total = 0,
    errors = {}
}

-- Test helper functions
local function assertEquals(actual, expected, message)
    testResults.total = testResults.total + 1
    if actual == expected then
        testResults.passed = testResults.passed + 1
        print("✓ " .. (message or "Test passed"))
    else
        testResults.failed = testResults.failed + 1
        local errorMsg = (message or "Test failed") .. ": expected '" .. tostring(expected) .. "', got '" .. tostring(actual) .. "'"
        print("✗ " .. errorMsg)
        table.insert(testResults.errors, errorMsg)
    end
end

local function assertTrue(condition, message)
    assertEquals(condition, true, message)
end

local function assertNotNil(value, message)
    testResults.total = testResults.total + 1
    if value ~= nil then
        testResults.passed = testResults.passed + 1
        print("✓ " .. (message or "Value is not nil"))
    else
        testResults.failed = testResults.failed + 1
        local errorMsg = (message or "Value should not be nil")
        print("✗ " .. errorMsg)
        table.insert(testResults.errors, errorMsg)
    end
end

local function assertContains(text, substring, message)
    testResults.total = testResults.total + 1
    if string.find(text, substring, 1, true) then
        testResults.passed = testResults.passed + 1
        print("✓ " .. (message or "Text contains expected substring"))
    else
        testResults.failed = testResults.failed + 1
        local errorMsg = (message or "Text should contain substring") .. ": '" .. text .. "' should contain '" .. substring .. "'"
        print("✗ " .. errorMsg)
        table.insert(testResults.errors, errorMsg)
    end
end

-- Create mock Pokemon for testing
local function createMockPokemon(name)
    return {
        id = 1,
        name = name,
        species = 25, -- Pikachu
        level = 50,
        currentHP = 80,
        maxHP = 100
    }
end

-- Test 1: Message Template Formatting
function tests.testMessageFormatting()
    print("\n=== Testing Message Template Formatting ===")
    
    local template = "{pokemon} used {move}!"
    local params = {
        pokemon = "Pikachu",
        move = "Thunderbolt"
    }
    
    local result = BattleMessages.formatMessage(template, params)
    assertEquals(result, "Pikachu used Thunderbolt!", "Template should be formatted correctly")
    
    -- Test with missing parameter
    local incompleteParams = {pokemon = "Pikachu"}
    local result2 = BattleMessages.formatMessage(template, incompleteParams)
    assertContains(result2, "Pikachu", "Should contain available parameter")
end

-- Test 2: Move Usage Messages
function tests.testMoveUsageMessages()
    print("\n=== Testing Move Usage Messages ===")
    
    BattleMessages.init()
    
    local attacker = createMockPokemon("Pikachu")
    local target = createMockPokemon("Charmander")
    
    -- Test basic move usage
    local move = {name = "Thunderbolt"}
    local result = {damage_dealt = 40, effectiveness = 2.0, critical_hit = true}
    
    local messages = BattleMessages.generateMoveMessage(attacker, move, target, result)
    
    assertTrue(#messages > 0, "Should generate at least one message")
    assertContains(messages[1], "Pikachu used Thunderbolt!", "Should contain basic move usage message")
end

-- Test 3: Damage Messages
function tests.testDamageMessages()
    print("\n=== Testing Damage Messages ===")
    
    local target = createMockPokemon("Charmander")
    
    -- Test super effective damage
    local messages = BattleMessages.generateDamageMessage(target, 60, "move", 2.0, false)
    assertTrue(#messages > 0, "Should generate damage messages")
    
    local foundSuperEffective = false
    for _, message in ipairs(messages) do
        if string.find(message, "super effective") then
            foundSuperEffective = true
            break
        end
    end
    assertTrue(foundSuperEffective, "Should indicate super effective damage")
    
    -- Test critical hit
    local critMessages = BattleMessages.generateDamageMessage(target, 60, "move", 1.0, true)
    local foundCritical = false
    for _, message in ipairs(critMessages) do
        if string.find(message, "critical") then
            foundCritical = true
            break
        end
    end
    assertTrue(foundCritical, "Should indicate critical hit")
end

-- Test 4: Status Effect Messages
function tests.testStatusEffectMessages()
    print("\n=== Testing Status Effect Messages ===")
    
    local pokemon = createMockPokemon("Pikachu")
    
    -- Test status application
    local burnMessage = BattleMessages.generateStatusMessage(pokemon, "burn", true)
    assertContains(burnMessage, "Pikachu", "Should contain Pokemon name")
    assertContains(burnMessage, "burn", "Should reference burn status")
    
    -- Test status removal
    local thawMessage = BattleMessages.generateStatusMessage(pokemon, "freeze", false)
    assertContains(thawMessage, "Pikachu", "Should contain Pokemon name")
    
    -- Test poison damage
    local poisonDamageMessages = BattleMessages.generateDamageMessage(pokemon, 12, "poison", nil, nil)
    assertTrue(#poisonDamageMessages > 0, "Should generate poison damage message")
    assertContains(poisonDamageMessages[1], "poison", "Should reference poison in damage message")
end

-- Test 5: Stat Modification Messages
function tests.testStatModificationMessages()
    print("\n=== Testing Stat Modification Messages ===")
    
    local pokemon = createMockPokemon("Pikachu")
    local Enums = require("data.constants.enums")
    
    -- Test stat increase
    local riseMessage = BattleMessages.generateStatMessage(pokemon, Enums.Stat.ATTACK, 1)
    assertContains(riseMessage, "Pikachu", "Should contain Pokemon name")
    assertContains(riseMessage, "Attack", "Should contain stat name")
    assertContains(riseMessage, "rose", "Should indicate stat increase")
    
    -- Test stat decrease
    local fallMessage = BattleMessages.generateStatMessage(pokemon, Enums.Stat.DEFENSE, -2)
    assertContains(fallMessage, "Pikachu", "Should contain Pokemon name")
    assertContains(fallMessage, "Defense", "Should contain stat name")
    assertContains(fallMessage, "fell", "Should indicate stat decrease")
    
    -- Test sharp increase
    local sharpMessage = BattleMessages.generateStatMessage(pokemon, Enums.Stat.SPEED, 2)
    assertContains(sharpMessage, "sharply", "Should indicate sharp increase for +2")
end

-- Test 6: Weather and Terrain Messages
function tests.testWeatherTerrainMessages()
    print("\n=== Testing Weather and Terrain Messages ===")
    
    local BattleConditions = require("game-logic.battle.battle-conditions")
    
    -- Test weather messages
    local sunMessage = BattleMessages.generateWeatherMessage(BattleConditions.WeatherType.SUNNY)
    assertContains(sunMessage, "sunlight", "Should describe sunny weather")
    
    local rainMessage = BattleMessages.generateWeatherMessage(BattleConditions.WeatherType.RAIN)
    assertContains(rainMessage, "rain", "Should describe rain weather")
    
    local weatherEndMessage = BattleMessages.generateWeatherMessage(nil, true)
    assertContains(weatherEndMessage, "cleared", "Should describe weather ending")
    
    -- Test terrain messages
    local electricMessage = BattleMessages.generateTerrainMessage(BattleConditions.TerrainType.ELECTRIC)
    assertContains(electricMessage, "electric", "Should describe electric terrain")
    
    local terrainEndMessage = BattleMessages.generateTerrainMessage(nil, true)
    assertContains(terrainEndMessage, "normal", "Should describe terrain ending")
end

-- Test 7: Pokemon Switching Messages
function tests.testSwitchingMessages()
    print("\n=== Testing Pokemon Switching Messages ===")
    
    local outPokemon = createMockPokemon("Pikachu")
    local inPokemon = createMockPokemon("Charmander")
    
    -- Test normal switch
    local switchMessages = BattleMessages.generateSwitchMessage(outPokemon, inPokemon)
    assertTrue(#switchMessages >= 2, "Should generate at least 2 messages for a switch")
    assertContains(switchMessages[1], "Pikachu", "First message should mention Pokemon going out")
    assertContains(switchMessages[2], "Charmander", "Second message should mention Pokemon coming in")
    
    -- Test forced switch
    local forcedMessages = BattleMessages.generateSwitchMessage(outPokemon, inPokemon, true)
    assertContains(forcedMessages[1], "forced", "Should indicate forced switch")
end

-- Test 8: Battle End Messages
function tests.testBattleEndMessages()
    print("\n=== Testing Battle End Messages ===")
    
    -- Test victory
    local victoryMessage = BattleMessages.generateBattleEndMessage("victory")
    assertContains(victoryMessage, "won", "Victory message should contain 'won'")
    
    -- Test defeat
    local defeatMessage = BattleMessages.generateBattleEndMessage("defeat")
    assertContains(defeatMessage, "lost", "Defeat message should contain 'lost'")
    
    -- Test draw
    local drawMessage = BattleMessages.generateBattleEndMessage("draw")
    assertContains(drawMessage, "draw", "Draw message should contain 'draw'")
    
    -- Test forfeit
    local forfeitMessage = BattleMessages.generateBattleEndMessage("forfeit")
    assertContains(forfeitMessage, "forfeit", "Forfeit message should contain 'forfeit'")
end

-- Test 9: Fainting Messages
function tests.testFaintingMessages()
    print("\n=== Testing Fainting Messages ===")
    
    local pokemon = createMockPokemon("Pikachu")
    
    local faintMessage = BattleMessages.generateFaintMessage(pokemon)
    assertContains(faintMessage, "Pikachu", "Should contain Pokemon name")
    assertContains(faintMessage, "fainted", "Should contain 'fainted'")
    
    -- Test with nil Pokemon
    local nilMessage = BattleMessages.generateFaintMessage(nil)
    assertContains(nilMessage, "fainted", "Should still generate a faint message")
end

-- Test 10: Turn Phase Messages
function tests.testTurnPhaseMessages()
    print("\n=== Testing Turn Phase Messages ===")
    
    -- Test turn start
    local startMessage = BattleMessages.generateTurnPhaseMessage("start", 5)
    assertContains(startMessage, "Turn 5", "Should contain turn number")
    
    -- Test turn end
    local endMessage = BattleMessages.generateTurnPhaseMessage("end", 5)
    assertContains(endMessage, "5", "Should contain turn number")
    
    -- Test command phase
    local pokemon = createMockPokemon("Pikachu")
    local commandMessage = BattleMessages.generateTurnPhaseMessage("command", 1, pokemon)
    assertContains(commandMessage, "Pikachu", "Should contain Pokemon name")
end

-- Test 11: Ability Messages
function tests.testAbilityMessages()
    print("\n=== Testing Ability Messages ===")
    
    local pokemon = createMockPokemon("Pikachu")
    
    -- Test ability activation
    local activateMessage = BattleMessages.generateAbilityMessage(pokemon, "Static")
    assertContains(activateMessage, "Pikachu", "Should contain Pokemon name")
    assertContains(activateMessage, "Static", "Should contain ability name")
    
    -- Test ability prevention
    local preventMessage = BattleMessages.generateAbilityMessage(pokemon, "Immunity", true)
    assertContains(preventMessage, "Pikachu", "Should contain Pokemon name")
    assertContains(preventMessage, "Immunity", "Should contain ability name")
    assertContains(preventMessage, "prevented", "Should indicate prevention")
end

-- Test 12: Error Messages
function tests.testErrorMessages()
    print("\n=== Testing Error Messages ===")
    
    local pokemon = createMockPokemon("Pikachu")
    
    -- Test no PP error
    local noPPMessage = BattleMessages.generateErrorMessage("no_pp", pokemon, "Thunderbolt")
    assertContains(noPPMessage, "Pikachu", "Should contain Pokemon name")
    assertContains(noPPMessage, "PP", "Should mention PP")
    
    -- Test cannot act error
    local cannotActMessage = BattleMessages.generateErrorMessage("cannot_act", pokemon)
    assertContains(cannotActMessage, "Pikachu", "Should contain Pokemon name")
    assertContains(cannotActMessage, "cannot", "Should indicate inability to act")
    
    -- Test invalid target error
    local invalidTargetMessage = BattleMessages.generateErrorMessage("invalid_target")
    assertContains(invalidTargetMessage, "target", "Should mention target")
end

-- Test 13: Action Description Generation
function tests.testActionDescriptionGeneration()
    print("\n=== Testing Action Description Generation ===")
    
    local attacker = createMockPokemon("Pikachu")
    local target = createMockPokemon("Charmander")
    
    local action = {
        type = "move",
        pokemon = attacker,
        moveId = 85, -- Thunderbolt
        target = target
    }
    
    local result = {
        damage_dealt = 45,
        effectiveness = 2.0,
        critical_hit = false
    }
    
    local messages = BattleMessages.generateActionDescription(action, result)
    assertTrue(#messages > 0, "Should generate action description messages")
    
    local foundMoveMessage = false
    for _, message in ipairs(messages) do
        if string.find(message, "used") then
            foundMoveMessage = true
            break
        end
    end
    assertTrue(foundMoveMessage, "Should include move usage message")
end

-- Run all tests
function tests.runAllTests()
    print("Starting Battle Messages Unit Tests...")
    
    -- Initialize required systems
    BattleMessages.init()
    
    -- Run individual tests
    tests.testMessageFormatting()
    tests.testMoveUsageMessages()
    tests.testDamageMessages()
    tests.testStatusEffectMessages()
    tests.testStatModificationMessages()
    tests.testWeatherTerrainMessages()
    tests.testSwitchingMessages()
    tests.testBattleEndMessages()
    tests.testFaintingMessages()
    tests.testTurnPhaseMessages()
    tests.testAbilityMessages()
    tests.testErrorMessages()
    tests.testActionDescriptionGeneration()
    
    -- Print results
    print("\n" .. string.rep("=", 50))
    print("BATTLE MESSAGES UNIT TEST RESULTS")
    print(string.rep("=", 50))
    print("Total Tests: " .. testResults.total)
    print("Passed: " .. testResults.passed)
    print("Failed: " .. testResults.failed)
    print("Success Rate: " .. string.format("%.1f%%", (testResults.passed / testResults.total) * 100))
    
    if #testResults.errors > 0 then
        print("\nErrors:")
        for _, error in ipairs(testResults.errors) do
            print("  • " .. error)
        end
    end
    
    print(string.rep("=", 50))
    
    return testResults.passed == testResults.total
end

return tests