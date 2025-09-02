-- Debug test for Spikes Flying immunity issues

local TestSetup = require("test-setup")
local TestFramework = TestSetup.setupLuaPath()
TestSetup.initializeTestEnvironment()

local EntryHazards = require("game-logic.battle.entry-hazards")
local SwitchInEffects = require("game-logic.battle.switch-in-effects")
local TestEnums = TestSetup.TestEnums

-- Mock Enums for this test
package.loaded["data.constants.enums"] = TestEnums

-- Create test battle state
local battleState = TestSetup.createStandardBattleState()

print("=== Debug Spikes Flying Immunity Test ===")

-- Step 1: Set up 3 layers of Spikes on enemy side manually
battleState.battleConditions.entryHazards.enemy.spikes = 3
print("1. Manually set 3 layers of Spikes on enemy side:", battleState.battleConditions.entryHazards.enemy.spikes)

-- Step 2: Create a Flying-type Pokemon (exactly like the failing test)
local createBattlePokemon = TestSetup.createStandardPokemon
local flyingPokemon = createBattlePokemon("Flying", 142, 50, {TestEnums.PokemonType.FLYING}, nil)
flyingPokemon.battleData.side = "enemy"
flyingPokemon.currentHP = flyingPokemon.maxHP

print("2. Flying Pokemon created:")
print("   Name:", flyingPokemon.name)
print("   Types:", flyingPokemon.species.type1, flyingPokemon.species.type2)
print("   Flying type constant:", TestEnums.PokemonType.FLYING)
print("   Current HP:", flyingPokemon.currentHP)
print("   Max HP:", flyingPokemon.maxHP)

-- Step 3: Test immunity check for Spikes
local config = EntryHazards.HazardConfig[EntryHazards.HazardType.SPIKES]
local immunity = EntryHazards.checkHazardImmunity(flyingPokemon, EntryHazards.HazardType.SPIKES, config)
print("3. Spikes immunity check:")
print("   Config affectedByFlying:", config.affectedByFlying)
print("   Has Flying type:", EntryHazards.hasType(flyingPokemon, TestEnums.PokemonType.FLYING))
print("   Immune:", immunity.immune)
print("   Messages:", #immunity.messages)

-- Step 4: Test switch-in effects
local switchResult = SwitchInEffects.processAllSwitchInEffects(battleState, flyingPokemon, "enemy")
print("4. Switch-in result:")
print("   Success:", switchResult.success)
print("   Damage taken:", switchResult.damageTaken)

print("5. Flying Pokemon after switch-in:")
print("   Current HP:", flyingPokemon.currentHP)
print("   HP lost:", flyingPokemon.maxHP - flyingPokemon.currentHP)

print("=== End Debug Test ===")