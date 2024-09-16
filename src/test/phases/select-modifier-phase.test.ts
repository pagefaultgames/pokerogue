import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import { initSceneWithoutEncounterPhase } from "#app/test/utils/gameManagerUtils";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import { ModifierTier } from "#app/modifier/modifier-tier";
import * as Utils from "#app/utils";
import { CustomModifierSettings, ModifierTypeOption, modifierTypes } from "#app/modifier/modifier-type";
import BattleScene from "#app/battle-scene";
import { Species } from "#enums/species";
import { Mode } from "#app/ui/ui";
import { PlayerPokemon } from "#app/field/pokemon";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";

describe("SelectModifierPhase", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let scene: BattleScene;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    scene = game.scene;

    initSceneWithoutEncounterPhase(scene, [Species.ABRA, Species.VOLCARONA]);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();

    vi.clearAllMocks();
  });

  it("should start a select modifier phase", async () => {
    const selectModifierPhase = new SelectModifierPhase(scene);
    scene.pushPhase(selectModifierPhase);
    await game.phaseInterceptor.run(SelectModifierPhase);

    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
  });

  it("should generate random modifiers", async () => {
    const selectModifierPhase = new SelectModifierPhase(scene);
    scene.pushPhase(selectModifierPhase);
    await game.phaseInterceptor.run(SelectModifierPhase);


    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);
  });

  it("should modify reroll cost", async () => {
    const options = [
      new ModifierTypeOption(modifierTypes.POTION(), 0, 100),
      new ModifierTypeOption(modifierTypes.ETHER(), 0, 400),
      new ModifierTypeOption(modifierTypes.REVIVE(), 0, 1000)
    ];

    const selectModifierPhase1 = new SelectModifierPhase(scene);
    const selectModifierPhase2 = new SelectModifierPhase(scene, 0, undefined, { rerollMultiplier: 2 });

    const cost1 = selectModifierPhase1.getRerollCost(options, false);
    const cost2 = selectModifierPhase2.getRerollCost(options, false);
    expect(cost2).toEqual(cost1 * 2);
  });

  it("should generate random modifiers from reroll", async () => {
    let selectModifierPhase = new SelectModifierPhase(scene);
    scene.pushPhase(selectModifierPhase);
    await game.phaseInterceptor.run(SelectModifierPhase);

    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);

    // Simulate selecting reroll
    selectModifierPhase = new SelectModifierPhase(scene, 1, [ModifierTier.COMMON, ModifierTier.COMMON, ModifierTier.COMMON]);
    scene.unshiftPhase(selectModifierPhase);
    scene.ui.setMode(Mode.MESSAGE).then(() => game.endPhase());
    await game.phaseInterceptor.run(SelectModifierPhase);

    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    expect(modifierSelectHandler.options.length).toEqual(3);
  });

  it("should generate random modifiers of same tier for reroll with reroll lock", async () => {
    // Just use fully random seed for this test
    vi.spyOn(scene, "resetSeed").mockImplementation(() => {
      scene.waveSeed = Utils.shiftCharCodes(scene.seed, 5);
      Phaser.Math.RND.sow([scene.waveSeed]);
      console.log("Wave Seed:", scene.waveSeed, 5);
      scene.rngCounter = 0;
    });

    let selectModifierPhase = new SelectModifierPhase(scene);
    scene.pushPhase(selectModifierPhase);
    await game.phaseInterceptor.run(SelectModifierPhase);

    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);
    const firstRollTiers: ModifierTier[] = modifierSelectHandler.options.map(o => o.modifierTypeOption.type.tier);

    // Simulate selecting reroll with lock
    scene.lockModifierTiers = true;
    scene.reroll = true;
    selectModifierPhase = new SelectModifierPhase(scene, 1, firstRollTiers);
    scene.unshiftPhase(selectModifierPhase);
    scene.ui.setMode(Mode.MESSAGE).then(() => game.endPhase());
    await game.phaseInterceptor.run(SelectModifierPhase);

    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    expect(modifierSelectHandler.options.length).toEqual(3);
    // Reroll with lock can still upgrade
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.tier - modifierSelectHandler.options[0].modifierTypeOption.upgradeCount).toEqual(firstRollTiers[0]);
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.tier - modifierSelectHandler.options[1].modifierTypeOption.upgradeCount).toEqual(firstRollTiers[1]);
    expect(modifierSelectHandler.options[2].modifierTypeOption.type.tier - modifierSelectHandler.options[2].modifierTypeOption.upgradeCount).toEqual(firstRollTiers[2]);
  });

  it("should generate custom modifiers", async () => {
    const customModifiers: CustomModifierSettings = {
      guaranteedModifierTypeFuncs: [modifierTypes.MEMORY_MUSHROOM, modifierTypes.TM_ULTRA, modifierTypes.LEFTOVERS, modifierTypes.AMULET_COIN, modifierTypes.GOLDEN_PUNCH]
    };
    const selectModifierPhase = new SelectModifierPhase(scene, 0, undefined, customModifiers);
    scene.pushPhase(selectModifierPhase);
    await game.phaseInterceptor.run(SelectModifierPhase);


    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(5);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("MEMORY_MUSHROOM");
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toEqual("TM_ULTRA");
    expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toEqual("LEFTOVERS");
    expect(modifierSelectHandler.options[3].modifierTypeOption.type.id).toEqual("AMULET_COIN");
    expect(modifierSelectHandler.options[4].modifierTypeOption.type.id).toEqual("GOLDEN_PUNCH");
  });

  it("should generate custom modifier tiers that can upgrade from luck", async () => {
    const customModifiers: CustomModifierSettings = {
      guaranteedModifierTiers: [ModifierTier.COMMON, ModifierTier.GREAT, ModifierTier.ULTRA, ModifierTier.ROGUE, ModifierTier.MASTER]
    };
    const pokemon = new PlayerPokemon(scene, getPokemonSpecies(Species.BULBASAUR), 10, undefined, 0, undefined, true, 2, undefined, undefined, undefined);

    // Fill party with max shinies
    while (scene.getParty().length > 0) {
      scene.getParty().pop();
    }
    scene.getParty().push(pokemon, pokemon, pokemon, pokemon, pokemon, pokemon);

    const selectModifierPhase = new SelectModifierPhase(scene, 0, undefined, customModifiers);
    scene.pushPhase(selectModifierPhase);
    await game.phaseInterceptor.run(SelectModifierPhase);


    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(5);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.tier - modifierSelectHandler.options[0].modifierTypeOption.upgradeCount).toEqual(ModifierTier.COMMON);
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.tier - modifierSelectHandler.options[1].modifierTypeOption.upgradeCount).toEqual(ModifierTier.GREAT);
    expect(modifierSelectHandler.options[2].modifierTypeOption.type.tier - modifierSelectHandler.options[2].modifierTypeOption.upgradeCount).toEqual(ModifierTier.ULTRA);
    expect(modifierSelectHandler.options[3].modifierTypeOption.type.tier - modifierSelectHandler.options[3].modifierTypeOption.upgradeCount).toEqual(ModifierTier.ROGUE);
    expect(modifierSelectHandler.options[4].modifierTypeOption.type.tier - modifierSelectHandler.options[4].modifierTypeOption.upgradeCount).toEqual(ModifierTier.MASTER);
  });

  it("should generate custom modifiers and modifier tiers together", async () => {
    const customModifiers: CustomModifierSettings = {
      guaranteedModifierTypeFuncs: [modifierTypes.MEMORY_MUSHROOM, modifierTypes.TM_COMMON],
      guaranteedModifierTiers: [ModifierTier.MASTER, ModifierTier.MASTER]
    };
    const selectModifierPhase = new SelectModifierPhase(scene, 0, undefined, customModifiers);
    scene.pushPhase(selectModifierPhase);
    await game.phaseInterceptor.run(SelectModifierPhase);


    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(4);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("MEMORY_MUSHROOM");
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toEqual("TM_COMMON");
    expect(modifierSelectHandler.options[2].modifierTypeOption.type.tier).toEqual(ModifierTier.MASTER);
    expect(modifierSelectHandler.options[3].modifierTypeOption.type.tier).toEqual(ModifierTier.MASTER);
  });

  it("should fill remaining modifiers if fillRemaining is true with custom modifiers", async () => {
    const customModifiers: CustomModifierSettings = {
      guaranteedModifierTypeFuncs: [modifierTypes.MEMORY_MUSHROOM],
      guaranteedModifierTiers: [ModifierTier.MASTER],
      fillRemaining: true
    };
    const selectModifierPhase = new SelectModifierPhase(scene, 0, undefined, customModifiers);
    scene.pushPhase(selectModifierPhase);
    await game.phaseInterceptor.run(SelectModifierPhase);


    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("MEMORY_MUSHROOM");
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.tier).toEqual(ModifierTier.MASTER);
  });
});
