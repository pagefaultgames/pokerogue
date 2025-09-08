-- Protection System Unit Tests
-- Comprehensive test coverage for move protection mechanics
-- Tests Protect, Detect, Wide Guard, Quick Guard, and contact protection moves

local function runProtectionSystemTests()
    print("Starting Protection System Tests...")
    
    -- Load test dependencies
    local ProtectionSystem = require("game-logic.battle.protection-system")
    local Enums = require("data.constants.enums")
    local BattleRNG = require("game-logic.rng.battle-rng")
    
    -- Initialize battle RNG for testing
    BattleRNG.initBattle("test_battle", "test_seed_12345")
    
    local testsPassed = 0
    local totalTests = 0
    
    -- Test helper function
    local function assertEquals(actual, expected, testName)
        totalTests = totalTests + 1
        if actual == expected then
            testsPassed = testsPassed + 1
            print("✓ " .. testName)
        else
            print("✗ " .. testName .. " - Expected: " .. tostring(expected) .. ", Got: " .. tostring(actual))
        end
    end
    
    local function assertNotNil(value, testName)
        totalTests = totalTests + 1
        if value ~= nil then
            testsPassed = testsPassed + 1
            print("✓ " .. testName)
        else
            print("✗ " .. testName .. " - Expected non-nil value")
        end
    end
    
    local function assertTrue(condition, testName)
        totalTests = totalTests + 1
        if condition then
            testsPassed = testsPassed + 1
            print("✓ " .. testName)
        else
            print("✗ " .. testName .. " - Expected true")
        end
    end
    
    -- Test 1: Protect Move Data Validation
    print("\n--- Test 1: Protect Move Data Validation ---")
    local protectData = ProtectionSystem.protectionMoves[Enums.MoveId.PROTECT]
    assertNotNil(protectData, "Protect move data should exist")
    assertEquals(protectData.type, ProtectionSystem.ProtectionType.SINGLE_TARGET, "Protect should be single target protection")
    assertEquals(protectData.baseSuccessRate, 1.0, "Protect should have 100% base success rate")
    assertTrue(protectData.protects.damaging, "Protect should protect against damaging moves")
    assertTrue(protectData.protects.status, "Protect should protect against status moves")
    
    -- Test 2: Detect Move Data Validation
    print("\n--- Test 2: Detect Move Data Validation ---")
    local detectData = ProtectionSystem.protectionMoves[Enums.MoveId.DETECT]
    assertNotNil(detectData, "Detect move data should exist")
    assertEquals(detectData.type, ProtectionSystem.ProtectionType.SINGLE_TARGET, "Detect should be single target protection")
    assertEquals(detectData.baseSuccessRate, 1.0, "Detect should have 100% base success rate")
    
    -- Test 3: Can Protect Against - Normal Cases
    print("\n--- Test 3: Can Protect Against - Normal Cases ---")
    local physicalMove = {
        id = 1,
        category = Enums.MoveCategory.PHYSICAL,
        target = Enums.MoveTarget.NEAR_ENEMY,
        priority = 0
    }
    
    assertTrue(ProtectionSystem.canProtectAgainst(physicalMove, protectData), 
               "Protect should defend against physical moves")
    
    local statusMove = {
        id = 2,
        category = Enums.MoveCategory.STATUS,
        target = Enums.MoveTarget.NEAR_ENEMY,
        priority = 0
    }
    
    assertTrue(ProtectionSystem.canProtectAgainst(statusMove, protectData), 
               "Protect should defend against status moves")
    
    -- Test 4: Can Protect Against - Bypass Moves
    print("\n--- Test 4: Can Protect Against - Bypass Moves ---")
    local feintMove = {
        id = 185, -- FEINT
        category = Enums.MoveCategory.PHYSICAL,
        target = Enums.MoveTarget.NEAR_ENEMY,
        priority = 2
    }
    
    assertTrue(not ProtectionSystem.canProtectAgainst(feintMove, protectData), 
               "Feint should bypass protection")
    
    -- Test 5: Wide Guard Protection Logic
    print("\n--- Test 5: Wide Guard Protection Logic ---")
    local wideGuardData = ProtectionSystem.protectionMoves[509] -- WIDE_GUARD placeholder
    assertNotNil(wideGuardData, "Wide Guard data should exist")
    
    local multiTargetMove = {
        id = 3,
        category = Enums.MoveCategory.PHYSICAL,
        target = Enums.MoveTarget.ALL_NEAR_ENEMIES,
        priority = 0
    }
    
    assertTrue(ProtectionSystem.canProtectAgainst(multiTargetMove, wideGuardData), 
               "Wide Guard should protect against multi-target moves")
    
    local singleTargetMove = {
        id = 4,
        category = Enums.MoveCategory.PHYSICAL,
        target = Enums.MoveTarget.NEAR_ENEMY,
        priority = 0
    }
    
    assertTrue(not ProtectionSystem.canProtectAgainst(singleTargetMove, wideGuardData), 
               "Wide Guard should not protect against single-target moves")
    
    -- Test 6: Quick Guard Protection Logic
    print("\n--- Test 6: Quick Guard Protection Logic ---")
    local quickGuardData = ProtectionSystem.protectionMoves[510] -- QUICK_GUARD placeholder
    assertNotNil(quickGuardData, "Quick Guard data should exist")
    
    local priorityMove = {
        id = 5,
        category = Enums.MoveCategory.PHYSICAL,
        target = Enums.MoveTarget.NEAR_ENEMY,
        priority = 1
    }
    
    assertTrue(ProtectionSystem.canProtectAgainst(priorityMove, quickGuardData), 
               "Quick Guard should protect against priority moves")
    
    local normalPriorityMove = {
        id = 6,
        category = Enums.MoveCategory.PHYSICAL,
        target = Enums.MoveTarget.NEAR_ENEMY,
        priority = 0
    }
    
    assertTrue(not ProtectionSystem.canProtectAgainst(normalPriorityMove, quickGuardData), 
               "Quick Guard should not protect against normal priority moves")
    
    -- Test 7: Success Rate Calculation - First Use
    print("\n--- Test 7: Success Rate Calculation - First Use ---")
    local battleState = {protectionHistory = {}}
    local protectorId = "pokemon_1"
    
    local successRate = ProtectionSystem.calculateSuccessRate(battleState, protectorId, protectData)
    assertEquals(successRate, 1.0, "First use should have 100% success rate")
    
    -- Test 8: Success Rate Calculation - Consecutive Uses
    print("\n--- Test 8: Success Rate Calculation - Consecutive Uses ---")
    battleState.protectionHistory[protectorId] = {consecutiveUses = 1}
    successRate = ProtectionSystem.calculateSuccessRate(battleState, protectorId, protectData)
    assertTrue(math.abs(successRate - (1/3)) < 0.001, "Second use should have ~33.3% success rate")
    
    battleState.protectionHistory[protectorId] = {consecutiveUses = 2}
    successRate = ProtectionSystem.calculateSuccessRate(battleState, protectorId, protectData)
    assertTrue(math.abs(successRate - (1/9)) < 0.001, "Third use should have ~11.1% success rate")
    
    -- Test 9: Use Protection - Success Case
    print("\n--- Test 9: Use Protection - Success Case ---")
    -- Reset battle state
    battleState = {}
    local protector = {
        id = "protect_user",
        name = "Machamp",
        side = "player"
    }
    
    -- Force success by setting RNG seed
    local result = ProtectionSystem.useProtection(battleState, protector, Enums.MoveId.PROTECT)
    
    -- Note: Since we can't control RNG easily in test, we'll just check structure
    assertNotNil(result.success, "Should have success field")
    assertEquals(result.protectorId, "protect_user", "Should have correct protector ID")
    assertEquals(result.protectionType, ProtectionSystem.ProtectionType.SINGLE_TARGET, "Should have correct protection type")
    assertTrue(string.find(result.message, "protected"), "Message should mention protection")
    
    -- If protection succeeded, check battle state
    if result.success then
        assertNotNil(battleState.activeProtections, "Should create active protections")
        assertNotNil(battleState.activeProtections["protect_user"], "Should set protection for user")
        assertNotNil(battleState.protectionHistory, "Should update protection history")
    end
    
    -- Test 10: Check Protection - Blocked Case
    print("\n--- Test 10: Check Protection - Blocked Case ---")
    -- Set up active protection
    battleState.activeProtections = {
        ["defender"] = {
            moveId = Enums.MoveId.PROTECT,
            type = ProtectionSystem.ProtectionType.SINGLE_TARGET,
            data = protectData
        }
    }
    
    local attacker = {id = "attacker", name = "Gengar"}
    local target = {id = "defender", name = "Machamp"}
    local attackMove = {
        id = 7,
        category = Enums.MoveCategory.SPECIAL,
        target = Enums.MoveTarget.NEAR_ENEMY,
        priority = 0
    }
    
    local protectionResult = ProtectionSystem.checkProtection(battleState, attacker, target, attackMove)
    
    assertTrue(protectionResult.success, "Protection check should succeed")
    assertTrue(protectionResult.blocked, "Attack should be blocked")
    assertEquals(protectionResult.protectorId, "defender", "Should identify correct protector")
    assertNotNil(protectionResult.message, "Should have protection message")
    
    -- Test 11: Check Protection - Not Blocked Case
    print("\n--- Test 11: Check Protection - Not Blocked Case ---")
    battleState.activeProtections = {} -- Clear protections
    
    protectionResult = ProtectionSystem.checkProtection(battleState, attacker, target, attackMove)
    
    assertTrue(not protectionResult.success, "Protection check should not succeed")
    assertTrue(not protectionResult.blocked, "Attack should not be blocked")
    
    -- Test 12: Contact Protection Effects - Spiky Shield
    print("\n--- Test 12: Contact Protection Effects - Spiky Shield ---")
    local spikyShieldData = ProtectionSystem.protectionMoves[596] -- SPIKY_SHIELD placeholder
    battleState.activeProtections = {
        ["spiky_defender"] = {
            moveId = 596,
            type = ProtectionSystem.ProtectionType.CONTACT_PROTECTION,
            data = spikyShieldData
        }
    }
    
    target.id = "spiky_defender"
    local contactMove = {
        id = 8,
        category = Enums.MoveCategory.PHYSICAL,
        flags = Enums.MoveFlags.MAKES_CONTACT, -- Contact move
        target = Enums.MoveTarget.NEAR_ENEMY,
        priority = 0
    }
    
    protectionResult = ProtectionSystem.checkProtection(battleState, attacker, target, contactMove)
    
    assertTrue(protectionResult.success, "Spiky Shield should block contact move")
    assertTrue(protectionResult.contactEffect, "Should trigger contact effect")
    assertNotNil(protectionResult.contactDamage, "Should have contact damage")
    assertEquals(protectionResult.contactDamage.amount, "1/8", "Should deal 1/8 HP damage")
    
    -- Test 13: Contact Protection Effects - Baneful Bunker
    print("\n--- Test 13: Contact Protection Effects - Baneful Bunker ---")
    local banefulBunkerData = ProtectionSystem.protectionMoves[661] -- BANEFUL_BUNKER placeholder
    battleState.activeProtections = {
        ["poison_defender"] = {
            moveId = 661,
            type = ProtectionSystem.ProtectionType.CONTACT_PROTECTION,
            data = banefulBunkerData
        }
    }
    
    target.id = "poison_defender"
    
    protectionResult = ProtectionSystem.checkProtection(battleState, attacker, target, contactMove)
    
    assertTrue(protectionResult.success, "Baneful Bunker should block contact move")
    assertTrue(protectionResult.contactEffect, "Should trigger contact effect")
    assertNotNil(protectionResult.contactStatus, "Should have contact status")
    assertEquals(protectionResult.contactStatus.effect, "poison", "Should inflict poison")
    
    -- Test 14: Apply Contact Effects - Damage
    print("\n--- Test 14: Apply Contact Effects - Damage ---")
    battleState.activePokemon = {
        {
            id = "attacker",
            name = "Gengar",
            currentHP = 200,
            maxHP = 200,
            stats = {[Enums.Stat.HP] = 200}
        }
    }
    
    local damageResult = {
        contactEffect = true,
        contactDamage = {
            target = "attacker",
            amount = "1/8"
        }
    }
    
    local newBattleState, messages = ProtectionSystem.applyContactEffects(battleState, damageResult)
    
    assertEquals(battleState.activePokemon[1].currentHP, 175, "Should take 25 HP damage (200/8)")
    assertEquals(#messages, 1, "Should have damage message")
    assertTrue(string.find(messages[1], "spikes"), "Message should mention spikes")
    
    -- Test 15: Apply Contact Effects - Status
    print("\n--- Test 15: Apply Contact Effects - Status ---")
    battleState.activePokemon[1].currentHP = 200 -- Reset HP for clean test
    
    local statusResult = {
        contactEffect = true,
        contactStatus = {
            target = "attacker",
            effect = "poison"
        }
    }
    
    newBattleState, messages = ProtectionSystem.applyContactEffects(battleState, statusResult)
    
    assertTrue(battleState.activePokemon[1].statusConditions.poison, "Should be poisoned")
    assertEquals(#messages, 1, "Should have poison message")
    assertTrue(string.find(messages[1], "poisoned"), "Message should mention poison")
    
    -- Test 16: Team Protection - Wide Guard
    print("\n--- Test 16: Team Protection - Wide Guard ---")
    battleState = {
        teamProtections = {
            ["player"] = {
                moveId = 509,
                type = ProtectionSystem.ProtectionType.WIDE_PROTECTION,
                data = wideGuardData,
                protectorId = "wide_guard_user"
            }
        }
    }
    
    target = {id = "team_member", side = "player"}
    
    protectionResult = ProtectionSystem.checkProtection(battleState, attacker, target, multiTargetMove)
    
    assertTrue(protectionResult.success, "Wide Guard should protect team member")
    assertTrue(protectionResult.blocked, "Multi-target move should be blocked")
    assertTrue(protectionResult.teamProtection, "Should be team protection")
    assertEquals(protectionResult.protectorId, "wide_guard_user", "Should identify Wide Guard user")
    
    -- Test 17: Update Protection History
    print("\n--- Test 17: Update Protection History ---")
    battleState.protectionHistory = {
        ["test_pokemon"] = {consecutiveUses = 2}
    }
    
    -- Use non-protection move should reset history
    newBattleState = ProtectionSystem.updateProtectionHistory(battleState, "test_pokemon", 1)
    assertEquals(newBattleState.protectionHistory["test_pokemon"].consecutiveUses, 0, 
                "Non-protection move should reset consecutive uses")
    
    -- Use protection move should not reset history
    battleState.protectionHistory["test_pokemon"].consecutiveUses = 2
    newBattleState = ProtectionSystem.updateProtectionHistory(battleState, "test_pokemon", Enums.MoveId.PROTECT)
    assertEquals(newBattleState.protectionHistory["test_pokemon"].consecutiveUses, 2, 
                "Protection move should not reset consecutive uses")
    
    -- Test 18: Clear Protections
    print("\n--- Test 18: Clear Protections ---")
    battleState.activeProtections = {["pokemon1"] = {moveId = 1}}
    battleState.teamProtections = {["player"] = {moveId = 2}}
    
    newBattleState = ProtectionSystem.clearProtections(battleState)
    
    assertTrue(next(newBattleState.activeProtections) == nil, "Should clear active protections")
    assertTrue(next(newBattleState.teamProtections) == nil, "Should clear team protections")
    
    -- Test 19: Get Protection Status
    print("\n--- Test 19: Get Protection Status ---")
    battleState.activeProtections = {
        ["protected_pokemon"] = {
            moveId = Enums.MoveId.PROTECT,
            type = ProtectionSystem.ProtectionType.SINGLE_TARGET
        }
    }
    
    local status = ProtectionSystem.getProtectionStatus(battleState, "protected_pokemon")
    assertNotNil(status, "Should return protection status")
    assertEquals(status.moveId, Enums.MoveId.PROTECT, "Should have correct move ID")
    
    status = ProtectionSystem.getProtectionStatus(battleState, "unprotected_pokemon")
    assertEquals(status, nil, "Should return nil for unprotected Pokemon")
    
    -- Test 20: Data Validation and Initialization
    print("\n--- Test 20: Data Validation and Initialization ---")
    assertTrue(ProtectionSystem.validateProtectionData(), "Protection data should be valid")
    
    local success, msg = ProtectionSystem.init()
    assertTrue(success, "System should initialize successfully")
    
    -- Print test results
    print(string.format("\nProtection System Tests completed: %d/%d passed (%.1f%%)", 
          testsPassed, totalTests, (testsPassed / totalTests) * 100))
    
    if testsPassed == totalTests then
        print("✅ All Protection System tests passed!")
        return true
    else
        print("❌ Some Protection System tests failed!")
        return false
    end
end

-- Run tests if file executed directly
if arg and arg[0] and string.find(arg[0], "protection%-system%.test%.lua") then
    runProtectionSystemTests()
end

return {runAllTests = runProtectionSystemTests}