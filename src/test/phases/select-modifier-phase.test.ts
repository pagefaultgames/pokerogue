import {afterEach, beforeAll, beforeEach, describe, it, vi, expect} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import {initSceneWithoutEncounterPhase} from "#app/test/utils/gameManagerUtils";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import {ModifierTier} from "#app/modifier/modifier-tier";
import * as Utils from "#app/utils";
import {CustomModifierSettings, modifierTypes} from "#app/modifier/modifier-type";
import BattleScene from "#app/battle-scene";
import {SelectModifierPhase} from "#app/phases/select-modifier-phase";
import {Species} from "#enums/species";
import {Mode} from "#app/ui/ui";

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

    vi.spyOn(scene, "resetSeed").mockImplementation(() => {
      scene.waveSeed = "test";
      Phaser.Math.RND.sow([ scene.waveSeed ]);
      scene.rngCounter = 0;
    });

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
  }, 20000);

  it("should generate random modifiers", async () => {
    const selectModifierPhase = new SelectModifierPhase(scene);
    scene.pushPhase(selectModifierPhase);
    await game.phaseInterceptor.run(SelectModifierPhase);


    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("TEMP_STAT_BOOSTER");
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toEqual("POKEBALL");
    expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toEqual("BERRY");
  }, 5000);

  it("should generate random modifiers from reroll", async () => {
    let selectModifierPhase = new SelectModifierPhase(scene);
    scene.pushPhase(selectModifierPhase);
    await game.phaseInterceptor.run(SelectModifierPhase);

    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("TEMP_STAT_BOOSTER");
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toEqual("POKEBALL");
    expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toEqual("BERRY");

    // Simulate selecting reroll
    selectModifierPhase = new SelectModifierPhase(scene, 1, [ModifierTier.COMMON, ModifierTier.COMMON, ModifierTier.COMMON]);
    scene.unshiftPhase(selectModifierPhase);
    scene.ui.setMode(Mode.MESSAGE).then(() => game.endPhase());
    await game.phaseInterceptor.run(SelectModifierPhase);

    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    expect(modifierSelectHandler.options.length).toEqual(3);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("TM_COMMON");
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toEqual("LURE");
    expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toEqual("DIRE_HIT");
  }, 5000);

  it("should generate random modifiers of same tier for reroll with reroll lock", async () => {
    // Just use fully random seed for this test
    vi.spyOn(scene, "resetSeed").mockImplementation(() => {
      scene.waveSeed = Utils.shiftCharCodes(scene.seed, 5);
      Phaser.Math.RND.sow([ scene.waveSeed ]);
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
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.tier).toEqual(firstRollTiers[0]);
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.tier).toEqual(firstRollTiers[1]);
    expect(modifierSelectHandler.options[2].modifierTypeOption.type.tier).toEqual(firstRollTiers[2]);
  }, 5000);

  it("should generate custom modifiers", async () => {
    const customModifiers: CustomModifierSettings = {
      guaranteedModifiers: [modifierTypes.MEMORY_MUSHROOM, modifierTypes.TM_ULTRA, modifierTypes.LEFTOVERS, modifierTypes.AMULET_COIN, modifierTypes.GOLDEN_PUNCH]
    };
    const selectModifierPhase = new SelectModifierPhase(scene, 0, null, customModifiers);
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
  }, 5000);

  it("should generate custom modifier tiers", async () => {
    const customModifiers: CustomModifierSettings = {
      guaranteedModifierTiers: [ModifierTier.MASTER, ModifierTier.MASTER, ModifierTier.MASTER, ModifierTier.MASTER]
    };
    const selectModifierPhase = new SelectModifierPhase(scene, 0, null, customModifiers);
    scene.pushPhase(selectModifierPhase);
    await game.phaseInterceptor.run(SelectModifierPhase);


    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(4);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.tier).toEqual(ModifierTier.MASTER);
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.tier).toEqual(ModifierTier.MASTER);
    expect(modifierSelectHandler.options[2].modifierTypeOption.type.tier).toEqual(ModifierTier.MASTER);
    expect(modifierSelectHandler.options[3].modifierTypeOption.type.tier).toEqual(ModifierTier.MASTER);
  }, 5000);

  it("should generate custom modifiers and modifier tiers together", async () => {
    const customModifiers: CustomModifierSettings = {
      guaranteedModifiers: [modifierTypes.MEMORY_MUSHROOM, modifierTypes.TM_COMMON],
      guaranteedModifierTiers: [ModifierTier.MASTER, ModifierTier.MASTER]
    };
    const selectModifierPhase = new SelectModifierPhase(scene, 0, null, customModifiers);
    scene.pushPhase(selectModifierPhase);
    await game.phaseInterceptor.run(SelectModifierPhase);


    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(4);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("MEMORY_MUSHROOM");
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toEqual("TM_COMMON");
    expect(modifierSelectHandler.options[2].modifierTypeOption.type.tier).toEqual(ModifierTier.MASTER);
    expect(modifierSelectHandler.options[3].modifierTypeOption.type.tier).toEqual(ModifierTier.MASTER);
  }, 5000);

  it("should fill remaining modifiers if fillRemaining is true with custom modifiers", async () => {
    const customModifiers: CustomModifierSettings = {
      guaranteedModifiers: [modifierTypes.MEMORY_MUSHROOM],
      guaranteedModifierTiers: [ModifierTier.MASTER],
      fillRemaining: true
    };
    const selectModifierPhase = new SelectModifierPhase(scene, 0, null, customModifiers);
    scene.pushPhase(selectModifierPhase);
    await game.phaseInterceptor.run(SelectModifierPhase);


    expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("MEMORY_MUSHROOM");
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.tier).toEqual(ModifierTier.MASTER);
  }, 5000);
});
