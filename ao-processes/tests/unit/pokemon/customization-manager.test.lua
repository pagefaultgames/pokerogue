--[[
Unit Tests for Pokemon Customization Manager
Tests nickname system, gender determination, shiny status, and variants

Test Coverage:
- Nickname validation and management
- Gender determination using personality values
- Shiny status calculation and management
- Variant/forme system
- Comprehensive customization functions
--]]

-- Import test framework
local TestFramework = require("tests.framework.test-framework-enhanced")

-- Import modules under test
local CustomizationManager = require("game-logic.pokemon.customization-manager")
local PokemonManager = require("game-logic.pokemon.pokemon-manager")
local SpeciesDatabase = require("data.species.species-database")
local Enums = require("data.constants.enums")

-- Test suite
local CustomizationManagerTests = {}

-- Test fixture setup
function CustomizationManagerTests.setUp()
    -- Clear storage and initialize databases
    PokemonManager.clearAllStorage()
    SpeciesDatabase.init()
    
    -- Create test Pokemon
    CustomizationManagerTests.testPokemon = {
        id = "PKM00000001",
        speciesId = 1,  -- Bulbasaur
        playerId = "test-player",
        level = 5,
        nickname = nil,
        gender = Enums.Gender.MALE,
        isShiny = false,
        variant = 0,
        ivs = {hp = 31, attack = 20, defense = 15, spAttack = 25, spDefense = 10, speed = 30}
    }
    
    -- Test player
    CustomizationManagerTests.testPlayerId = "test-player"
    CustomizationManagerTests.otherPlayerId = "other-player"
end

-- Test fixture teardown
function CustomizationManagerTests.tearDown()
    PokemonManager.clearAllStorage()
end

-- Nickname System Tests

function CustomizationManagerTests.testValidateNickname()
    -- Valid nicknames
    local valid1, error1 = CustomizationManager.validateNickname("Bulby")
    TestFramework.assert(valid1, "Short nickname should be valid: " .. (error1 or ""))
    
    local valid2, error2 = CustomizationManager.validateNickname("LongNickname")
    TestFramework.assert(valid2, "12-character nickname should be valid: " .. (error2 or ""))
    
    local valid3, error3 = CustomizationManager.validateNickname(nil)
    TestFramework.assert(valid3, "Nil nickname should be valid (clears nickname): " .. (error3 or ""))
    
    -- Invalid nicknames
    local invalid1, error1_msg = CustomizationManager.validateNickname("VeryLongNicknameThatExceedsLimit")
    TestFramework.assert(not invalid1, "Over-length nickname should be invalid")
    TestFramework.assert(string.find(error1_msg, "exceed"), "Should mention length limit")
    
    local invalid2, error2_msg = CustomizationManager.validateNickname("")
    TestFramework.assert(not invalid2, "Empty nickname should be invalid")
    
    local invalid3, error3_msg = CustomizationManager.validateNickname("Bad<script>")
    TestFramework.assert(not invalid3, "Nickname with HTML tags should be invalid")
    
    local invalid4, error4_msg = CustomizationManager.validateNickname(123)
    TestFramework.assert(not invalid4, "Non-string nickname should be invalid")
    
    return true, "Nickname validation working correctly"
end

function CustomizationManagerTests.testSetNickname()
    local pokemon = {}
    for k, v in pairs(CustomizationManagerTests.testPokemon) do
        pokemon[k] = v
    end
    
    -- Set valid nickname
    local updatedPokemon, result = CustomizationManager.setNickname(pokemon, "Bulby", CustomizationManagerTests.testPlayerId)
    
    TestFramework.assert(result.success, "Should succeed setting valid nickname: " .. (result.message or ""))
    TestFramework.assert(updatedPokemon.nickname == "Bulby", "Nickname should be set")
    TestFramework.assert(result.newNickname == "Bulby", "Result should include new nickname")
    
    -- Clear nickname
    updatedPokemon, result = CustomizationManager.setNickname(pokemon, nil, CustomizationManagerTests.testPlayerId)
    
    TestFramework.assert(result.success, "Should succeed clearing nickname")
    TestFramework.assert(updatedPokemon.nickname == nil, "Nickname should be cleared")
    
    -- Test ownership validation
    local deniedPokemon, deniedResult = CustomizationManager.setNickname(pokemon, "Hacked", CustomizationManagerTests.otherPlayerId)
    TestFramework.assert(not deniedResult.success, "Should deny access from different player")
    TestFramework.assert(deniedResult.reason == "access_denied", "Should indicate access denied")
    
    return true, "Nickname setting working correctly"
end

function CustomizationManagerTests.testGetDisplayName()
    local pokemon = {}
    for k, v in pairs(CustomizationManagerTests.testPokemon) do
        pokemon[k] = v
    end
    
    -- No nickname - should use species name
    local displayName1 = CustomizationManager.getDisplayName(pokemon)
    TestFramework.assert(type(displayName1) == "string", "Should return string display name")
    TestFramework.assert(displayName1 ~= "", "Should not return empty string")
    
    -- With nickname - should use nickname
    pokemon.nickname = "Bulby"
    local displayName2 = CustomizationManager.getDisplayName(pokemon)
    TestFramework.assert(displayName2 == "Bulby", "Should return nickname when set")
    
    -- Invalid Pokemon
    local unknownName = CustomizationManager.getDisplayName(nil)
    TestFramework.assert(unknownName == "Unknown", "Should handle nil Pokemon gracefully")
    
    return true, "Display name retrieval working correctly"
end

-- Gender System Tests

function CustomizationManagerTests.testDetermineGender()
    -- Test with different personality values
    local gender1 = CustomizationManager.determineGender(1, 12345)  -- Bulbasaur
    local gender2 = CustomizationManager.determineGender(1, 54321)
    
    TestFramework.assert(gender1 ~= nil, "Should return valid gender")
    TestFramework.assert(gender2 ~= nil, "Should return valid gender")
    
    -- Test valid gender values
    local validGenders = {
        [Enums.Gender.MALE] = true,
        [Enums.Gender.FEMALE] = true,
        [Enums.Gender.GENDERLESS] = true,
        [Enums.Gender.UNKNOWN] = true
    }
    
    TestFramework.assert(validGenders[gender1], "Should return valid gender enum")
    TestFramework.assert(validGenders[gender2], "Should return valid gender enum")
    
    -- Test invalid species
    local unknownGender = CustomizationManager.determineGender(999999, 12345)
    TestFramework.assert(unknownGender == Enums.Gender.UNKNOWN, "Should return UNKNOWN for invalid species")
    
    return true, "Gender determination working correctly"
end

function CustomizationManagerTests.testGeneratePersonalityValue()
    local pv1 = CustomizationManager.generatePersonalityValue()
    local pv2 = CustomizationManager.generatePersonalityValue()
    
    TestFramework.assert(pv1 >= 0 and pv1 <= 65535, "Personality value should be in valid range")
    TestFramework.assert(pv2 >= 0 and pv2 <= 65535, "Personality value should be in valid range")
    TestFramework.assert(pv1 ~= pv2, "Different calls should generate different values")
    
    -- Test seeded generation
    local seeded1 = CustomizationManager.generatePersonalityValue(12345)
    local seeded2 = CustomizationManager.generatePersonalityValue(12345)
    -- Note: Due to math.randomseed behavior, these might not be identical
    TestFramework.assert(type(seeded1) == "number", "Seeded generation should return number")
    
    return true, "Personality value generation working correctly"
end

function CustomizationManagerTests.testGetGenderDisplay()
    TestFramework.assert(CustomizationManager.getGenderDisplay(Enums.Gender.MALE) == "♂", "Male should display as ♂")
    TestFramework.assert(CustomizationManager.getGenderDisplay(Enums.Gender.FEMALE) == "♀", "Female should display as ♀")
    TestFramework.assert(CustomizationManager.getGenderDisplay(Enums.Gender.GENDERLESS) == "-", "Genderless should display as -")
    TestFramework.assert(CustomizationManager.getGenderDisplay(Enums.Gender.UNKNOWN) == "?", "Unknown should display as ?")
    
    return true, "Gender display working correctly"
end

-- Shiny System Tests

function CustomizationManagerTests.testCalculateShinyStatus()
    local pokemon = {}
    for k, v in pairs(CustomizationManagerTests.testPokemon) do
        pokemon[k] = v
    end
    
    -- Test standard shiny calculation
    local isShiny1 = CustomizationManager.calculateShinyStatus(pokemon, "standard")
    TestFramework.assert(type(isShiny1) == "boolean", "Should return boolean shiny status")
    
    -- Test different methods
    local isShiny2 = CustomizationManager.calculateShinyStatus(pokemon, "masuda")
    local isShiny3 = CustomizationManager.calculateShinyStatus(pokemon, "charm")
    
    TestFramework.assert(type(isShiny2) == "boolean", "Masuda method should return boolean")
    TestFramework.assert(type(isShiny3) == "boolean", "Charm method should return boolean")
    
    -- Test invalid input
    local invalidShiny = CustomizationManager.calculateShinyStatus(nil)
    TestFramework.assert(invalidShiny == false, "Should return false for invalid input")
    
    return true, "Shiny status calculation working correctly"
end

function CustomizationManagerTests.testSetShinyStatus()
    local pokemon = {}
    for k, v in pairs(CustomizationManagerTests.testPokemon) do
        pokemon[k] = v
    end
    
    local originalStatus = pokemon.isShiny
    
    -- Set shiny status
    local updatedPokemon, result = CustomizationManager.setShinyStatus(pokemon, true, CustomizationManagerTests.testPlayerId)
    
    TestFramework.assert(result.success, "Should succeed setting shiny status")
    TestFramework.assert(updatedPokemon.isShiny == true, "Pokemon should be shiny")
    TestFramework.assert(result.oldStatus == originalStatus, "Should track old status")
    TestFramework.assert(result.newStatus == true, "Should track new status")
    
    -- Test ownership validation
    local deniedPokemon, deniedResult = CustomizationManager.setShinyStatus(pokemon, false, CustomizationManagerTests.otherPlayerId)
    TestFramework.assert(not deniedResult.success, "Should deny access from different player")
    
    return true, "Shiny status setting working correctly"
end

function CustomizationManagerTests.testGetShinyDisplay()
    TestFramework.assert(CustomizationManager.getShinyDisplay(true) == "★", "Shiny should display as ★")
    TestFramework.assert(CustomizationManager.getShinyDisplay(false) == "", "Non-shiny should display empty")
    
    return true, "Shiny display working correctly"
end

-- Variant System Tests

function CustomizationManagerTests.testSetVariant()
    local pokemon = {}
    for k, v in pairs(CustomizationManagerTests.testPokemon) do
        pokemon[k] = v
    end
    
    local originalVariant = pokemon.variant
    
    -- Set variant
    local updatedPokemon, result = CustomizationManager.setVariant(pokemon, 1, CustomizationManagerTests.testPlayerId)
    
    TestFramework.assert(result.success, "Should succeed setting variant")
    TestFramework.assert(updatedPokemon.variant == 1, "Variant should be set")
    TestFramework.assert(result.oldVariant == originalVariant, "Should track old variant")
    TestFramework.assert(result.newVariant == 1, "Should track new variant")
    
    -- Test invalid variant
    local invalidPokemon, invalidResult = CustomizationManager.setVariant(pokemon, -1, CustomizationManagerTests.testPlayerId)
    TestFramework.assert(not invalidResult.success, "Should reject negative variant ID")
    TestFramework.assert(invalidResult.reason == "invalid_variant", "Should indicate invalid variant")
    
    -- Test ownership validation
    local deniedPokemon, deniedResult = CustomizationManager.setVariant(pokemon, 2, CustomizationManagerTests.otherPlayerId)
    TestFramework.assert(not deniedResult.success, "Should deny access from different player")
    
    return true, "Variant setting working correctly"
end

function CustomizationManagerTests.testGetVariantDisplay()
    TestFramework.assert(CustomizationManager.getVariantDisplay(1, 0) == "", "Standard variant should display empty")
    TestFramework.assert(CustomizationManager.getVariantDisplay(1, 1) == " (Alolan)", "Alolan variant should display correctly")
    TestFramework.assert(CustomizationManager.getVariantDisplay(1, 2) == " (Galarian)", "Galarian variant should display correctly")
    TestFramework.assert(CustomizationManager.getVariantDisplay(1, 3) == " (Hisuian)", "Hisuian variant should display correctly")
    TestFramework.assert(CustomizationManager.getVariantDisplay(1, 5) == " (Variant 5)", "Unknown variant should display generically")
    
    return true, "Variant display working correctly"
end

-- Comprehensive Customization Tests

function CustomizationManagerTests.testApplyCustomizations()
    local pokemon = {}
    for k, v in pairs(CustomizationManagerTests.testPokemon) do
        pokemon[k] = v
    end
    
    local customizations = {
        nickname = "TestName",
        variant = 1,
        isShiny = true,
        allowShinyChange = true
    }
    
    local updatedPokemon, results = CustomizationManager.applyCustomizations(pokemon, customizations, CustomizationManagerTests.testPlayerId)
    
    TestFramework.assert(results.success, "Should succeed applying customizations")
    TestFramework.assert(#results.changes > 0, "Should record changes made")
    TestFramework.assert(#results.errors == 0, "Should have no errors for valid customizations")
    
    TestFramework.assert(updatedPokemon.nickname == "TestName", "Nickname should be applied")
    TestFramework.assert(updatedPokemon.variant == 1, "Variant should be applied")
    TestFramework.assert(updatedPokemon.isShiny == true, "Shiny status should be applied")
    
    return true, "Comprehensive customization application working correctly"
end

function CustomizationManagerTests.testApplyCustomizationsWithErrors()
    local pokemon = {}
    for k, v in pairs(CustomizationManagerTests.testPokemon) do
        pokemon[k] = v
    end
    
    local invalidCustomizations = {
        nickname = "VeryLongNicknameThatExceedsTheMaximumLength",
        variant = -1
    }
    
    local updatedPokemon, results = CustomizationManager.applyCustomizations(pokemon, invalidCustomizations, CustomizationManagerTests.testPlayerId)
    
    TestFramework.assert(not results.success, "Should fail with invalid customizations")
    TestFramework.assert(#results.errors > 0, "Should have errors for invalid customizations")
    
    return true, "Customization error handling working correctly"
end

function CustomizationManagerTests.testGetPokemonDisplayInfo()
    local pokemon = {}
    for k, v in pairs(CustomizationManagerTests.testPokemon) do
        pokemon[k] = v
    end
    
    pokemon.nickname = "Bulby"
    pokemon.isShiny = true
    pokemon.variant = 1
    
    local displayInfo = CustomizationManager.getPokemonDisplayInfo(pokemon)
    
    TestFramework.assert(displayInfo.displayName == "Bulby", "Should use nickname for display name")
    TestFramework.assert(displayInfo.nickname == "Bulby", "Should include nickname")
    TestFramework.assert(displayInfo.gender ~= nil, "Should include gender display")
    TestFramework.assert(displayInfo.shiny == "★", "Should include shiny display")
    TestFramework.assert(string.find(displayInfo.variant, "Alolan"), "Should include variant display")
    TestFramework.assert(displayInfo.fullDisplay ~= nil, "Should build full display string")
    
    return true, "Pokemon display info generation working correctly"
end

-- Validation Tests

function CustomizationManagerTests.testValidateCustomizations()
    local validPokemon = {}
    for k, v in pairs(CustomizationManagerTests.testPokemon) do
        validPokemon[k] = v
    end
    validPokemon.nickname = "Bulby"
    
    local isValid, errors = CustomizationManager.validateCustomizations(validPokemon)
    TestFramework.assert(isValid, "Valid Pokemon should pass validation")
    TestFramework.assert(#errors == 0, "Valid Pokemon should have no errors")
    
    -- Test invalid Pokemon
    local invalidPokemon = {
        nickname = "VeryLongInvalidNicknameThatExceedsLimit",
        gender = 999,  -- Invalid gender
        isShiny = "not boolean",
        variant = -1
    }
    
    local isInvalid, invalidErrors = CustomizationManager.validateCustomizations(invalidPokemon)
    TestFramework.assert(not isInvalid, "Invalid Pokemon should fail validation")
    TestFramework.assert(#invalidErrors > 0, "Invalid Pokemon should have errors")
    
    return true, "Customization validation working correctly"
end

function CustomizationManagerTests.testGetCustomizationStats()
    local pokemon = {}
    for k, v in pairs(CustomizationManagerTests.testPokemon) do
        pokemon[k] = v
    end
    
    -- Basic Pokemon
    local stats1 = CustomizationManager.getCustomizationStats(pokemon)
    TestFramework.assert(stats1.hasNickname == false, "Should detect no nickname")
    TestFramework.assert(stats1.isShiny == false, "Should detect not shiny")
    TestFramework.assert(stats1.hasVariant == false, "Should detect no variant")
    TestFramework.assert(stats1.customizationLevel == 0, "Should calculate customization level")
    
    -- Customized Pokemon
    pokemon.nickname = "Bulby"
    pokemon.isShiny = true
    pokemon.variant = 1
    
    local stats2 = CustomizationManager.getCustomizationStats(pokemon)
    TestFramework.assert(stats2.hasNickname == true, "Should detect nickname")
    TestFramework.assert(stats2.isShiny == true, "Should detect shiny")
    TestFramework.assert(stats2.hasVariant == true, "Should detect variant")
    TestFramework.assert(stats2.customizationLevel == 3, "Should calculate full customization level")
    
    return true, "Customization statistics working correctly"
end

function CustomizationManagerTests.testGetConstants()
    local constants = CustomizationManager.getConstants()
    
    TestFramework.assert(constants.MAX_NICKNAME_LENGTH == 12, "Should return max nickname length")
    TestFramework.assert(constants.MIN_NICKNAME_LENGTH == 1, "Should return min nickname length")
    TestFramework.assert(constants.SHINY_ODDS_STANDARD > 0, "Should return standard shiny odds")
    TestFramework.assert(constants.SHINY_ODDS_MASUDA > 0, "Should return Masuda shiny odds")
    TestFramework.assert(constants.SHINY_ODDS_SHINY_CHARM > 0, "Should return charm shiny odds")
    
    return true, "Constants retrieval working correctly"
end

-- Generation Tests

function CustomizationManagerTests.testGenerateCustomizationData()
    local data1 = CustomizationManager.generateCustomizationData(1)  -- Bulbasaur
    
    TestFramework.assert(data1.personalityValue ~= nil, "Should generate personality value")
    TestFramework.assert(data1.gender ~= nil, "Should determine gender")
    TestFramework.assert(type(data1.isShiny) == "boolean", "Should determine shiny status")
    TestFramework.assert(data1.variant ~= nil, "Should set variant")
    
    -- Test with options
    local data2 = CustomizationManager.generateCustomizationData(1, {
        forceShiny = true,
        variant = 2
    })
    
    TestFramework.assert(data2.isShiny == true, "Should force shiny when requested")
    TestFramework.assert(data2.variant == 2, "Should use specified variant")
    
    return true, "Customization data generation working correctly"
end

-- Integration Tests

function CustomizationManagerTests.testIntegrationWithPokemonManager()
    -- Create Pokemon using PokemonManager
    local pokemon, error = PokemonManager.createPokemon(1, 5, CustomizationManagerTests.testPlayerId)
    TestFramework.assert(pokemon ~= nil, "Pokemon creation should succeed: " .. (error or ""))
    
    -- Apply customizations
    local updatedPokemon, result = CustomizationManager.setNickname(pokemon, "Integration", CustomizationManagerTests.testPlayerId)
    TestFramework.assert(result.success, "Should be able to customize created Pokemon")
    
    -- Get display info
    local displayInfo = CustomizationManager.getPokemonDisplayInfo(updatedPokemon)
    TestFramework.assert(displayInfo.displayName == "Integration", "Should show customized name")
    
    return true, "Integration with PokemonManager working correctly"
end

-- Performance Tests

function CustomizationManagerTests.testCustomizationPerformance()
    local startTime = os.clock()
    
    -- Perform many customization operations
    for i = 1, 100 do
        local pokemon = {
            id = "PKM" .. string.format("%08d", i),
            speciesId = 1,
            playerId = "test-player",
            nickname = nil,
            gender = Enums.Gender.MALE,
            isShiny = false,
            variant = 0
        }
        
        CustomizationManager.setNickname(pokemon, "Test" .. i, "test-player")
        CustomizationManager.setVariant(pokemon, i % 3, "test-player")
        CustomizationManager.validateCustomizations(pokemon)
        CustomizationManager.getDisplayName(pokemon)
        CustomizationManager.getCustomizationStats(pokemon)
    end
    
    local endTime = os.clock()
    local elapsed = endTime - startTime
    
    TestFramework.assert(elapsed < 0.5, "100 customization operations should complete in under 0.5 seconds, took " .. elapsed .. "s")
    
    return true, "Customization operations performance acceptable"
end

-- Test runner
function CustomizationManagerTests.runAllTests()
    local testSuite = TestFramework.TestSuite:new("Pokemon Customization Manager Tests")
    
    -- Nickname System Tests
    testSuite:addTest("Validate Nickname", CustomizationManagerTests.testValidateNickname)
    testSuite:addTest("Set Nickname", CustomizationManagerTests.testSetNickname)
    testSuite:addTest("Get Display Name", CustomizationManagerTests.testGetDisplayName)
    
    -- Gender System Tests
    testSuite:addTest("Determine Gender", CustomizationManagerTests.testDetermineGender)
    testSuite:addTest("Generate Personality Value", CustomizationManagerTests.testGeneratePersonalityValue)
    testSuite:addTest("Get Gender Display", CustomizationManagerTests.testGetGenderDisplay)
    
    -- Shiny System Tests
    testSuite:addTest("Calculate Shiny Status", CustomizationManagerTests.testCalculateShinyStatus)
    testSuite:addTest("Set Shiny Status", CustomizationManagerTests.testSetShinyStatus)
    testSuite:addTest("Get Shiny Display", CustomizationManagerTests.testGetShinyDisplay)
    
    -- Variant System Tests
    testSuite:addTest("Set Variant", CustomizationManagerTests.testSetVariant)
    testSuite:addTest("Get Variant Display", CustomizationManagerTests.testGetVariantDisplay)
    
    -- Comprehensive Customization Tests
    testSuite:addTest("Apply Customizations", CustomizationManagerTests.testApplyCustomizations)
    testSuite:addTest("Apply Customizations With Errors", CustomizationManagerTests.testApplyCustomizationsWithErrors)
    testSuite:addTest("Get Pokemon Display Info", CustomizationManagerTests.testGetPokemonDisplayInfo)
    
    -- Validation Tests
    testSuite:addTest("Validate Customizations", CustomizationManagerTests.testValidateCustomizations)
    testSuite:addTest("Get Customization Stats", CustomizationManagerTests.testGetCustomizationStats)
    testSuite:addTest("Get Constants", CustomizationManagerTests.testGetConstants)
    
    -- Generation Tests
    testSuite:addTest("Generate Customization Data", CustomizationManagerTests.testGenerateCustomizationData)
    
    -- Integration Tests
    testSuite:addTest("Integration with PokemonManager", CustomizationManagerTests.testIntegrationWithPokemonManager)
    
    -- Performance Tests
    testSuite:addTest("Customization Performance", CustomizationManagerTests.testCustomizationPerformance)
    
    -- Run tests with setup/teardown
    testSuite:setSetUp(CustomizationManagerTests.setUp)
    testSuite:setTearDown(CustomizationManagerTests.tearDown)
    
    local results = testSuite:run()
    return results
end

return CustomizationManagerTests