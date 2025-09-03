--[[
Unit Tests for Held Item Effects
Comprehensive testing for held item battle effects and stat modifications

Tests cover:
- Stat-boosting held item effects (Life Orb, Choice items) with precise calculations
- Type-boosting held item effects with accurate power percentages
- Status-related held item effects with proper timing validation
- Battle-restricting held item effects with move selection validation
- Consumable held item effects with proper activation conditions
- Held item-ability interactions including Unburden
- Damage modifier effects and recoil calculations

Follows AAA pattern (Arrange, Act, Assert) with 100% coverage requirement
All external dependencies mocked for isolated unit testing
--]]

-- Import test framework and modules under test
local TestFramework = require("tests.test-framework")
local HeldItemEffects = require("game-logic.items.held-item-effects")

-- Mock external dependencies  
local MockItemDatabase = require("tests.mocks.item-database-mock")
local MockEnums = require("tests.mocks.enums-mock")

-- Test suite setup
local HeldItemEffectsTests = {}

-- Test data
local testPokemonWithChoiceBand = {
    heldItem = "CHOICE_BAND",
    stats = { hp = 100, attack = 100, defense = 80, spAttack = 70, spDefense = 80, speed = 90 },
    ability = "Pressure"
}

local testPokemonWithLifeOrb = {
    heldItem = "LIFE_ORB",
    stats = { hp = 150, attack = 120, defense = 90, spAttack = 110, spDefense = 85, speed = 100 },
    ability = "Blaze"
}

local testPokemonWithUnburden = {
    heldItem = "FOCUS_SASH",
    stats = { hp = 80, attack = 90, defense = 70, spAttack = 85, spDefense = 75, speed = 95 },
    ability = "Unburden"
}

-- Setup function run before each test
function HeldItemEffectsTests.setUp()
    -- Reset mocks
    MockItemDatabase.reset()
    MockEnums.reset()
    
    -- Set up held items in database
    local heldItems = {
        "CHOICE_BAND", "CHOICE_SPECS", "CHOICE_SCARF", "LIFE_ORB",
        "LEFTOVERS", "FOCUS_SASH", "ASSAULT_VEST", "EVIOLITE",
        "FLAME_PLATE", "SPLASH_PLATE", "EXPERT_BELT", "MUSCLE_BAND",
        "WISE_GLASSES", "ROCKY_HELMET", "WEAKNESS_POLICY", "FLAME_ORB"
    }
    
    for _, itemId in ipairs(heldItems) do
        MockItemDatabase.setItem(itemId, {
            id = itemId,
            category = "held_item",
            stackable = false
        })
    end
    
    -- Set up move categories and types
    MockEnums.setMoveCategory("PHYSICAL", 0)
    MockEnums.setMoveCategory("SPECIAL", 1) 
    MockEnums.setMoveCategory("STATUS", 2)
    
    MockEnums.setPokemonType("FIRE", 9)
    MockEnums.setPokemonType("WATER", 10)
    MockEnums.setPokemonType("ELECTRIC", 12)
end

-- Cleanup function run after each test
function HeldItemEffectsTests.tearDown()
    MockItemDatabase.reset()
    MockEnums.reset()
end

-- Test stat modifier calculations

function HeldItemEffectsTests.testGetStatModifier_ChoiceBandAttack_Returns150Percent()
    -- Arrange
    local itemId = "CHOICE_BAND"
    local statName = "attack"
    local pokemon = testPokemonWithChoiceBand
    
    -- Act
    local modifier = HeldItemEffects.getStatModifier(itemId, statName, pokemon)
    
    -- Assert
    TestFramework.assertEqual(modifier, 1.5, "Choice Band should boost attack by 50%")
end

function HeldItemEffectsTests.testGetStatModifier_ChoiceSpecsSpecialAttack_Returns150Percent()
    -- Arrange
    local itemId = "CHOICE_SPECS"
    local statName = "spAttack"
    local pokemon = {}
    
    -- Act
    local modifier = HeldItemEffects.getStatModifier(itemId, statName, pokemon)
    
    -- Assert
    TestFramework.assertEqual(modifier, 1.5, "Choice Specs should boost special attack by 50%")
end

function HeldItemEffectsTests.testGetStatModifier_ChoiceScarfSpeed_Returns150Percent()
    -- Arrange
    local itemId = "CHOICE_SCARF"
    local statName = "speed"
    local pokemon = {}
    
    -- Act
    local modifier = HeldItemEffects.getStatModifier(itemId, statName, pokemon)
    
    -- Assert
    TestFramework.assertEqual(modifier, 1.5, "Choice Scarf should boost speed by 50%")
end

function HeldItemEffectsTests.testGetStatModifier_AssaultVestSpecialDefense_Returns150Percent()
    -- Arrange
    local itemId = "ASSAULT_VEST"
    local statName = "spDefense"
    local pokemon = {}
    
    -- Act
    local modifier = HeldItemEffects.getStatModifier(itemId, statName, pokemon)
    
    -- Assert
    TestFramework.assertEqual(modifier, 1.5, "Assault Vest should boost special defense by 50%")
end

function HeldItemEffectsTests.testGetStatModifier_EvioliteDefense_Returns150Percent()
    -- Arrange
    local itemId = "EVIOLITE"
    local statName = "defense"
    local pokemon = {} -- In real implementation, would check if can evolve
    
    -- Act
    local modifier = HeldItemEffects.getStatModifier(itemId, statName, pokemon)
    
    -- Assert
    TestFramework.assertEqual(modifier, 1.5, "Eviolite should boost defense by 50%")
end

function HeldItemEffectsTests.testGetStatModifier_NoMatchingItem_Returns100Percent()
    -- Arrange
    local itemId = "LEFTOVERS"
    local statName = "attack"
    local pokemon = {}
    
    -- Act
    local modifier = HeldItemEffects.getStatModifier(itemId, statName, pokemon)
    
    -- Assert
    TestFramework.assertEqual(modifier, 1.0, "Leftovers should not modify attack stat")
end

-- Test stat modifier application

function HeldItemEffectsTests.testApplyStatModifiers_ChoiceBand_ModifiesAttack()
    -- Arrange
    local pokemon = {
        heldItem = "CHOICE_BAND",
        stats = { attack = 100, defense = 80 }
    }
    
    -- Act
    local modifiedPokemon = HeldItemEffects.applyStatModifiers(pokemon)
    
    -- Assert
    TestFramework.assertEqual(modifiedPokemon.stats.attack, 150, "Attack should be boosted to 150")
    TestFramework.assertEqual(modifiedPokemon.stats.defense, 80, "Defense should remain unchanged")
    TestFramework.assertNotNil(modifiedPokemon.originalStats, "Original stats should be preserved")
end

function HeldItemEffectsTests.testApplyStatModifiers_NoHeldItem_NoChange()
    -- Arrange
    local pokemon = {
        heldItem = nil,
        stats = { attack = 100, defense = 80 }
    }
    
    -- Act
    local modifiedPokemon = HeldItemEffects.applyStatModifiers(pokemon)
    
    -- Assert
    TestFramework.assertEqual(modifiedPokemon.stats.attack, 100, "Attack should remain unchanged")
    TestFramework.assertEqual(modifiedPokemon.stats.defense, 80, "Defense should remain unchanged")
end

-- Test move power multipliers

function HeldItemEffectsTests.testGetMovePowerMultiplier_LifeOrbPhysical_Returns130Percent()
    -- Arrange
    local itemId = "LIFE_ORB"
    local move = {}
    local moveType = 9 -- FIRE
    local moveCategory = 0 -- PHYSICAL
    
    -- Act
    local multiplier = HeldItemEffects.getMovePowerMultiplier(itemId, move, moveType, moveCategory, {})
    
    -- Assert
    TestFramework.assertEqual(multiplier, 1.3, "Life Orb should boost physical moves by 30%")
end

function HeldItemEffectsTests.testGetMovePowerMultiplier_LifeOrbSpecial_Returns130Percent()
    -- Arrange
    local itemId = "LIFE_ORB"
    local move = {}
    local moveType = 10 -- WATER  
    local moveCategory = 1 -- SPECIAL
    
    -- Act
    local multiplier = HeldItemEffects.getMovePowerMultiplier(itemId, move, moveType, moveCategory, {})
    
    -- Assert
    TestFramework.assertEqual(multiplier, 1.3, "Life Orb should boost special moves by 30%")
end

function HeldItemEffectsTests.testGetMovePowerMultiplier_LifeOrbStatus_Returns100Percent()
    -- Arrange
    local itemId = "LIFE_ORB"
    local move = {}
    local moveType = 9 -- FIRE
    local moveCategory = 2 -- STATUS
    
    -- Act
    local multiplier = HeldItemEffects.getMovePowerMultiplier(itemId, move, moveType, moveCategory, {})
    
    -- Assert
    TestFramework.assertEqual(multiplier, 1.0, "Life Orb should not boost status moves")
end

function HeldItemEffectsTests.testGetMovePowerMultiplier_FlamePlateFireMove_Returns120Percent()
    -- Arrange
    local itemId = "FLAME_PLATE"
    local move = {}
    local moveType = 9 -- FIRE
    local moveCategory = 1 -- SPECIAL
    
    -- Act
    local multiplier = HeldItemEffects.getMovePowerMultiplier(itemId, move, moveType, moveCategory, {})
    
    -- Assert
    TestFramework.assertEqual(multiplier, 1.2, "Flame Plate should boost Fire moves by 20%")
end

function HeldItemEffectsTests.testGetMovePowerMultiplier_ExpertBeltSuperEffective_Returns120Percent()
    -- Arrange
    local itemId = "EXPERT_BELT"
    local move = {}
    local moveType = 9 -- FIRE
    local moveCategory = 1 -- SPECIAL
    local damageContext = { effectiveness = 2.0 } -- Super effective
    
    -- Act
    local multiplier = HeldItemEffects.getMovePowerMultiplier(itemId, move, moveType, moveCategory, damageContext)
    
    -- Assert
    TestFramework.assertEqual(multiplier, 1.2, "Expert Belt should boost super effective moves by 20%")
end

function HeldItemEffectsTests.testGetMovePowerMultiplier_MuscleBandPhysical_Returns110Percent()
    -- Arrange
    local itemId = "MUSCLE_BAND"
    local move = {}
    local moveType = 9 -- FIRE
    local moveCategory = 0 -- PHYSICAL
    
    -- Act
    local multiplier = HeldItemEffects.getMovePowerMultiplier(itemId, move, moveType, moveCategory, {})
    
    -- Assert
    TestFramework.assertEqual(multiplier, 1.1, "Muscle Band should boost physical moves by 10%")
end

function HeldItemEffectsTests.testGetMovePowerMultiplier_WiseGlassesSpecial_Returns110Percent()
    -- Arrange
    local itemId = "WISE_GLASSES"
    local move = {}
    local moveType = 10 -- WATER
    local moveCategory = 1 -- SPECIAL
    
    -- Act
    local multiplier = HeldItemEffects.getMovePowerMultiplier(itemId, move, moveType, moveCategory, {})
    
    -- Assert
    TestFramework.assertEqual(multiplier, 1.1, "Wise Glasses should boost special moves by 10%")
end

-- Test status effects

function HeldItemEffectsTests.testGetStatusEffect_FlameOrbEndTurn_ReturnsBurn()
    -- Arrange
    local itemId = "FLAME_ORB"
    local turnPhase = "end"
    local pokemon = { status = "none" }
    
    -- Act
    local statusEffect = HeldItemEffects.getStatusEffect(itemId, turnPhase, pokemon)
    
    -- Assert
    TestFramework.assertNotNil(statusEffect, "Flame Orb should apply status effect")
    TestFramework.assertEqual(statusEffect.effect, "burn", "Flame Orb should cause burn")
    TestFramework.assertEqual(statusEffect.source, "held_item", "Status should be from held item")
end

function HeldItemEffectsTests.testGetStatusEffect_FlameOrbAlreadyBurned_ReturnsNil()
    -- Arrange
    local itemId = "FLAME_ORB"
    local turnPhase = "end"
    local pokemon = { status = "burn" }
    
    -- Act
    local statusEffect = HeldItemEffects.getStatusEffect(itemId, turnPhase, pokemon)
    
    -- Assert
    TestFramework.assertNil(statusEffect, "Flame Orb should not affect already burned Pokemon")
end

function HeldItemEffectsTests.testGetStatusEffect_FlameOrbStartTurn_ReturnsNil()
    -- Arrange
    local itemId = "FLAME_ORB"
    local turnPhase = "start"
    local pokemon = { status = "none" }
    
    -- Act
    local statusEffect = HeldItemEffects.getStatusEffect(itemId, turnPhase, pokemon)
    
    -- Assert
    TestFramework.assertNil(statusEffect, "Flame Orb should not activate at start of turn")
end

-- Test healing effects

function HeldItemEffectsTests.testGetHealingEffect_LeftoversEndTurn_ReturnsHealing()
    -- Arrange
    local itemId = "LEFTOVERS"
    local turnPhase = "end"
    local pokemon = { 
        currentHP = 80,
        stats = { hp = 100 }
    }
    
    -- Act
    local healingEffect = HeldItemEffects.getHealingEffect(itemId, turnPhase, pokemon)
    
    -- Assert
    TestFramework.assertNotNil(healingEffect, "Leftovers should provide healing")
    TestFramework.assertEqual(healingEffect.type, "heal", "Effect should be healing")
    TestFramework.assertEqual(healingEffect.amount, 6, "Should heal 1/16 of max HP (6.25 -> 6)")
    TestFramework.assertEqual(healingEffect.source, "held_item", "Healing should be from held item")
end

function HeldItemEffectsTests.testGetHealingEffect_LeftoversFullHP_ReturnsNil()
    -- Arrange
    local itemId = "LEFTOVERS"
    local turnPhase = "end"
    local pokemon = {
        currentHP = 100,
        stats = { hp = 100 }
    }
    
    -- Act
    local healingEffect = HeldItemEffects.getHealingEffect(itemId, turnPhase, pokemon)
    
    -- Assert
    TestFramework.assertNil(healingEffect, "Leftovers should not heal Pokemon at full HP")
end

-- Test move restrictions

function HeldItemEffectsTests.testCheckMoveRestriction_ChoiceBandFirstMove_ReturnsNil()
    -- Arrange
    local itemId = "CHOICE_BAND"
    local pokemon = { battleState = {} }
    local moveId = "TACKLE"
    
    -- Act
    local restriction = HeldItemEffects.checkMoveRestriction(itemId, pokemon, moveId, {})
    
    -- Assert
    TestFramework.assertNil(restriction, "Choice Band should not restrict first move")
end

function HeldItemEffectsTests.testCheckMoveRestriction_ChoiceBandLockedMove_ReturnsNil()
    -- Arrange
    local itemId = "CHOICE_BAND"
    local pokemon = { 
        battleState = { choiceLockedMove = "TACKLE" }
    }
    local moveId = "TACKLE"
    
    -- Act
    local restriction = HeldItemEffects.checkMoveRestriction(itemId, pokemon, moveId, {})
    
    -- Assert
    TestFramework.assertNil(restriction, "Choice Band should allow locked move")
end

function HeldItemEffectsTests.testCheckMoveRestriction_ChoiceBandDifferentMove_ReturnsRestriction()
    -- Arrange
    local itemId = "CHOICE_BAND"
    local pokemon = {
        battleState = { choiceLockedMove = "TACKLE" }
    }
    local moveId = "FLAMETHROWER"
    
    -- Act
    local restriction = HeldItemEffects.checkMoveRestriction(itemId, pokemon, moveId, {})
    
    -- Assert
    TestFramework.assertNotNil(restriction, "Choice Band should restrict different move")
    TestFramework.assertEqual(restriction.type, "choice_lock", "Restriction should be choice lock")
    TestFramework.assertEqual(restriction.allowedMove, "TACKLE", "Should indicate allowed move")
    TestFramework.assertTrue(restriction.blocked, "Move should be blocked")
end

-- Test choice restriction application

function HeldItemEffectsTests.testApplyChoiceRestriction_ChoiceBand_SetsLock()
    -- Arrange
    local itemId = "CHOICE_BAND"
    local pokemon = {}
    local moveId = "TACKLE"
    
    -- Act
    local success, updatedPokemon = HeldItemEffects.applyChoiceRestriction(itemId, pokemon, moveId)
    
    -- Assert
    TestFramework.assertTrue(success, "Choice restriction should be applied successfully")
    TestFramework.assertNotNil(updatedPokemon.battleState, "Battle state should be initialized")
    TestFramework.assertEqual(updatedPokemon.battleState.choiceLockedMove, moveId, "Pokemon should be locked to move")
    TestFramework.assertEqual(updatedPokemon.battleState.choiceItemActive, itemId, "Choice item should be marked active")
end

function HeldItemEffectsTests.testApplyChoiceRestriction_NonChoiceItem_NoChange()
    -- Arrange
    local itemId = "LEFTOVERS"
    local pokemon = {}
    local moveId = "TACKLE"
    
    -- Act
    local success, updatedPokemon = HeldItemEffects.applyChoiceRestriction(itemId, pokemon, moveId)
    
    -- Assert
    TestFramework.assertTrue(success, "Non-choice item should succeed without change")
    TestFramework.assertEqual(updatedPokemon, pokemon, "Pokemon should be unchanged")
end

function HeldItemEffectsTests.testClearChoiceRestriction_RemovesLock()
    -- Arrange
    local pokemon = {
        battleState = {
            choiceLockedMove = "TACKLE",
            choiceItemActive = "CHOICE_BAND"
        }
    }
    
    -- Act
    local clearedPokemon = HeldItemEffects.clearChoiceRestriction(pokemon)
    
    -- Assert
    TestFramework.assertNil(clearedPokemon.battleState.choiceLockedMove, "Choice lock should be cleared")
    TestFramework.assertNil(clearedPokemon.battleState.choiceItemActive, "Choice item should be cleared")
end

-- Test consumable effects

function HeldItemEffectsTests.testCheckConsumption_FocusSashKOPrevention_ReturnsConsumption()
    -- Arrange
    local itemId = "FOCUS_SASH"
    local pokemon = { currentHP = 100, stats = { hp = 100 } }
    local trigger = "damage_taken"
    local triggerData = { wouldKO = true }
    
    -- Act
    local consumption = HeldItemEffects.checkConsumption(itemId, pokemon, trigger, triggerData)
    
    -- Assert
    TestFramework.assertNotNil(consumption, "Focus Sash should be consumed")
    TestFramework.assertEqual(consumption.type, "prevent_ko", "Should prevent KO")
    TestFramework.assertTrue(consumption.consumed, "Item should be consumed")
    TestFramework.assertEqual(consumption.effect, "survive_with_1_hp", "Should survive with 1 HP")
end

function HeldItemEffectsTests.testCheckConsumption_WeaknessPolicySuperEffective_ReturnsConsumption()
    -- Arrange
    local itemId = "WEAKNESS_POLICY"
    local pokemon = {}
    local trigger = "damage_taken"
    local triggerData = { effectiveness = 2.0 }
    
    -- Act
    local consumption = HeldItemEffects.checkConsumption(itemId, pokemon, trigger, triggerData)
    
    -- Assert
    TestFramework.assertNotNil(consumption, "Weakness Policy should be consumed")
    TestFramework.assertEqual(consumption.type, "stat_boost", "Should boost stats")
    TestFramework.assertTrue(consumption.consumed, "Item should be consumed")
    TestFramework.assertEqual(consumption.effect.attack, 2, "Should boost attack by 2 stages")
    TestFramework.assertEqual(consumption.effect.spAttack, 2, "Should boost special attack by 2 stages")
end

-- Test damage effects

function HeldItemEffectsTests.testGetRecoilDamage_LifeOrb_Returns10PercentRecoil()
    -- Arrange
    local itemId = "LIFE_ORB"
    local pokemon = { stats = { hp = 100 } }
    local move = {}
    local damageDealt = 50
    
    -- Act
    local recoilDamage = HeldItemEffects.getRecoilDamage(itemId, pokemon, move, damageDealt)
    
    -- Assert
    TestFramework.assertNotNil(recoilDamage, "Life Orb should cause recoil")
    TestFramework.assertEqual(recoilDamage.type, "recoil", "Should be recoil damage")
    TestFramework.assertEqual(recoilDamage.damage, 10, "Should be 10% of max HP")
    TestFramework.assertEqual(recoilDamage.source, "life_orb", "Source should be Life Orb")
end

function HeldItemEffectsTests.testGetRecoilDamage_NoDamageDealt_ReturnsNil()
    -- Arrange
    local itemId = "LIFE_ORB"
    local pokemon = { stats = { hp = 100 } }
    local move = {}
    local damageDealt = 0
    
    -- Act
    local recoilDamage = HeldItemEffects.getRecoilDamage(itemId, pokemon, move, damageDealt)
    
    -- Assert
    TestFramework.assertNil(recoilDamage, "Life Orb should not cause recoil if no damage dealt")
end

-- Test ability interactions

function HeldItemEffectsTests.testCheckAbilityInteraction_UnburdenOnConsume_ReturnsSpeedBoost()
    -- Arrange
    local itemId = "FOCUS_SASH"
    local pokemon = { ability = "Unburden" }
    local context = "on_consume"
    
    -- Act
    local interaction = HeldItemEffects.checkAbilityInteraction(itemId, pokemon, context)
    
    -- Assert
    TestFramework.assertNotNil(interaction, "Unburden should interact with consumed item")
    TestFramework.assertEqual(interaction.type, "speed_boost", "Should boost speed")
    TestFramework.assertEqual(interaction.multiplier, 2.0, "Should double speed")
end

function HeldItemEffectsTests.testCheckAbilityInteraction_KlutzDisablesItem_ReturnsDisabled()
    -- Arrange
    local itemId = "CHOICE_BAND"
    local pokemon = { ability = "Klutz" }
    local context = "in_battle"
    
    -- Act
    local interaction = HeldItemEffects.checkAbilityInteraction(itemId, pokemon, context)
    
    -- Assert
    TestFramework.assertNotNil(interaction, "Klutz should interact with held item")
    TestFramework.assertEqual(interaction.type, "item_disabled", "Should disable item")
    TestFramework.assertTrue(interaction.blocked, "Item effects should be blocked")
end

-- Test utility functions

function HeldItemEffectsTests.testGetActiveEffects_ChoiceBandPokemon_ReturnsEffects()
    -- Arrange
    local pokemon = testPokemonWithChoiceBand
    local battleContext = {}
    
    -- Act
    local effects = HeldItemEffects.getActiveEffects(pokemon, battleContext)
    
    -- Assert
    TestFramework.assertNotNil(effects, "Should return effects array")
    TestFramework.assertTrue(#effects > 0, "Should have at least one effect")
    
    -- Find stat modifier effect
    local statEffect = nil
    for _, effect in ipairs(effects) do
        if effect.type == "stat_modifier" and effect.stat == "attack" then
            statEffect = effect
            break
        end
    end
    
    TestFramework.assertNotNil(statEffect, "Should have attack stat modifier")
    TestFramework.assertEqual(statEffect.multiplier, 1.5, "Attack modifier should be 1.5")
end

function HeldItemEffectsTests.testValidateEffectCalculation_AccurateValue_ReturnsTrue()
    -- Arrange
    local itemId = "CHOICE_BAND"
    local effectType = "stat_modifier"
    local calculatedValue = 1.5
    local expectedValue = 1.5
    
    -- Act
    local isValid = HeldItemEffects.validateEffectCalculation(itemId, effectType, calculatedValue, expectedValue)
    
    -- Assert
    TestFramework.assertTrue(isValid, "Accurate calculation should be valid")
end

function HeldItemEffectsTests.testValidateEffectCalculation_InaccurateValue_ReturnsFalse()
    -- Arrange
    local itemId = "CHOICE_BAND"
    local effectType = "stat_modifier"
    local calculatedValue = 1.6
    local expectedValue = 1.5
    
    -- Act
    local isValid = HeldItemEffects.validateEffectCalculation(itemId, effectType, calculatedValue, expectedValue)
    
    -- Assert
    TestFramework.assertFalse(isValid, "Inaccurate calculation should be invalid")
end

function HeldItemEffectsTests.testResetEffects_ClearsAllEffects()
    -- Arrange
    local pokemon = {
        battleState = {
            choiceLockedMove = "TACKLE",
            choiceItemActive = "CHOICE_BAND"
        },
        originalStats = { attack = 100 },
        stats = { attack = 150 }
    }
    
    -- Act
    local resetPokemon = HeldItemEffects.resetEffects(pokemon)
    
    -- Assert
    TestFramework.assertNil(resetPokemon.battleState.choiceLockedMove, "Choice lock should be cleared")
    TestFramework.assertNil(resetPokemon.battleState.choiceItemActive, "Choice item should be cleared")
    TestFramework.assertEqual(resetPokemon.stats.attack, 100, "Stats should be restored")
    TestFramework.assertNil(resetPokemon.originalStats, "Original stats should be cleared")
end

-- Run all tests
function HeldItemEffectsTests.runAllTests()
    local testMethods = {
        "testGetStatModifier_ChoiceBandAttack_Returns150Percent",
        "testGetStatModifier_ChoiceSpecsSpecialAttack_Returns150Percent",
        "testGetStatModifier_ChoiceScarfSpeed_Returns150Percent",
        "testGetStatModifier_AssaultVestSpecialDefense_Returns150Percent",
        "testGetStatModifier_EvioliteDefense_Returns150Percent",
        "testGetStatModifier_NoMatchingItem_Returns100Percent",
        "testApplyStatModifiers_ChoiceBand_ModifiesAttack",
        "testApplyStatModifiers_NoHeldItem_NoChange",
        "testGetMovePowerMultiplier_LifeOrbPhysical_Returns130Percent",
        "testGetMovePowerMultiplier_LifeOrbSpecial_Returns130Percent",
        "testGetMovePowerMultiplier_LifeOrbStatus_Returns100Percent",
        "testGetMovePowerMultiplier_FlamePlateFireMove_Returns120Percent",
        "testGetMovePowerMultiplier_ExpertBeltSuperEffective_Returns120Percent",
        "testGetMovePowerMultiplier_MuscleBandPhysical_Returns110Percent",
        "testGetMovePowerMultiplier_WiseGlassesSpecial_Returns110Percent",
        "testGetStatusEffect_FlameOrbEndTurn_ReturnsBurn",
        "testGetStatusEffect_FlameOrbAlreadyBurned_ReturnsNil",
        "testGetStatusEffect_FlameOrbStartTurn_ReturnsNil",
        "testGetHealingEffect_LeftoversEndTurn_ReturnsHealing",
        "testGetHealingEffect_LeftoversFullHP_ReturnsNil",
        "testCheckMoveRestriction_ChoiceBandFirstMove_ReturnsNil",
        "testCheckMoveRestriction_ChoiceBandLockedMove_ReturnsNil",
        "testCheckMoveRestriction_ChoiceBandDifferentMove_ReturnsRestriction",
        "testApplyChoiceRestriction_ChoiceBand_SetsLock",
        "testApplyChoiceRestriction_NonChoiceItem_NoChange",
        "testClearChoiceRestriction_RemovesLock",
        "testCheckConsumption_FocusSashKOPrevention_ReturnsConsumption",
        "testCheckConsumption_WeaknessPolicySuperEffective_ReturnsConsumption",
        "testGetRecoilDamage_LifeOrb_Returns10PercentRecoil",
        "testGetRecoilDamage_NoDamageDealt_ReturnsNil",
        "testCheckAbilityInteraction_UnburdenOnConsume_ReturnsSpeedBoost",
        "testCheckAbilityInteraction_KlutzDisablesItem_ReturnsDisabled",
        "testGetActiveEffects_ChoiceBandPokemon_ReturnsEffects",
        "testValidateEffectCalculation_AccurateValue_ReturnsTrue",
        "testValidateEffectCalculation_InaccurateValue_ReturnsFalse",
        "testResetEffects_ClearsAllEffects"
    }
    
    return TestFramework.runTestSuite("HeldItemEffects", HeldItemEffectsTests, testMethods)
end

return HeldItemEffectsTests