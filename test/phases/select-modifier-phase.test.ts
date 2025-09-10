import type { BattleScene } from "#app/battle-scene";
import { modifierTypes } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { Button } from "#enums/buttons";
import { ModifierTier } from "#enums/modifier-tier";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { PlayerPokemon } from "#field/pokemon";
import type { CustomModifierSettings } from "#modifiers/modifier-type";
import { ModifierTypeOption } from "#modifiers/modifier-type";
import { SelectModifierPhase } from "#phases/select-modifier-phase";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import { ModifierSelectUiHandler } from "#ui/handlers/modifier-select-ui-handler";
import { shiftCharCodes } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

    game.override
      .moveset([MoveId.FISSURE, MoveId.SPLASH])
      .ability(AbilityId.NO_GUARD)
      .startingLevel(200)
      .enemySpecies(SpeciesId.MAGIKARP);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should start a select modifier phase", async () => {
    initSceneWithoutEncounterPhase(scene, [SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    const selectModifierPhase = new SelectModifierPhase();
    scene.phaseManager.unshiftPhase(selectModifierPhase);
    await game.phaseInterceptor.to(SelectModifierPhase);

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
  });

  it("should generate random modifiers", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    game.move.select(MoveId.FISSURE);
    await game.phaseInterceptor.to("SelectModifierPhase");

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(
      h => h instanceof ModifierSelectUiHandler,
    ) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);
  });

  it("should modify reroll cost", async () => {
    initSceneWithoutEncounterPhase(scene, [SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    const options = [
      new ModifierTypeOption(modifierTypes.POTION(), 0, 100),
      new ModifierTypeOption(modifierTypes.ETHER(), 0, 400),
      new ModifierTypeOption(modifierTypes.REVIVE(), 0, 1000),
    ];

    const selectModifierPhase1 = new SelectModifierPhase(0, undefined, {
      guaranteedModifierTypeOptions: options,
    });
    const selectModifierPhase2 = new SelectModifierPhase(0, undefined, {
      guaranteedModifierTypeOptions: options,
      rerollMultiplier: 2,
    });

    const cost1 = selectModifierPhase1.getRerollCost(false);
    const cost2 = selectModifierPhase2.getRerollCost(false);
    expect(cost2).toEqual(cost1 * 2);
  });

  it.todo("should generate random modifiers from reroll", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    scene.money = 1000000;
    scene.shopCursorTarget = 0;

    game.move.select(MoveId.FISSURE);
    await game.phaseInterceptor.to("SelectModifierPhase");

    // TODO: nagivate the ui to reroll somehow
    //const smphase = scene.phaseManager.getCurrentPhase() as SelectModifierPhase;
    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(
      h => h instanceof ModifierSelectUiHandler,
    ) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);

    modifierSelectHandler.processInput(Button.ACTION);

    expect(scene.money).toBe(1000000 - 250);
    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    expect(modifierSelectHandler.options.length).toEqual(3);
  });

  it.todo("should generate random modifiers of same tier for reroll with reroll lock", async () => {
    game.override.startingModifier([{ name: "LOCK_CAPSULE" }]);
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    scene.money = 1000000;
    // Just use fully random seed for this test
    vi.spyOn(scene, "resetSeed").mockImplementation(() => {
      scene.waveSeed = shiftCharCodes(scene.seed, 5);
      Phaser.Math.RND.sow([scene.waveSeed]);
      console.log("Wave Seed:", scene.waveSeed, 5);
      scene.rngCounter = 0;
    });

    game.move.select(MoveId.FISSURE);
    await game.phaseInterceptor.to("SelectModifierPhase");

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(
      h => h instanceof ModifierSelectUiHandler,
    ) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);
    const firstRollTiers: ModifierTier[] = modifierSelectHandler.options.map(o => o.modifierTypeOption.type.tier);

    // TODO: nagivate ui to reroll with lock capsule enabled

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    expect(modifierSelectHandler.options.length).toEqual(3);
    // Reroll with lock can still upgrade
    expect(
      modifierSelectHandler.options[0].modifierTypeOption.type.tier
        - modifierSelectHandler.options[0].modifierTypeOption.upgradeCount,
    ).toEqual(firstRollTiers[0]);
    expect(
      modifierSelectHandler.options[1].modifierTypeOption.type.tier
        - modifierSelectHandler.options[1].modifierTypeOption.upgradeCount,
    ).toEqual(firstRollTiers[1]);
    expect(
      modifierSelectHandler.options[2].modifierTypeOption.type.tier
        - modifierSelectHandler.options[2].modifierTypeOption.upgradeCount,
    ).toEqual(firstRollTiers[2]);
  });

  it("should generate custom modifiers", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    scene.money = 1000000;
    const customModifiers: CustomModifierSettings = {
      guaranteedModifierTypeFuncs: [
        modifierTypes.MEMORY_MUSHROOM,
        modifierTypes.TM_ULTRA,
        modifierTypes.LEFTOVERS,
        modifierTypes.AMULET_COIN,
        modifierTypes.GOLDEN_PUNCH,
      ],
    };
    const selectModifierPhase = new SelectModifierPhase(0, undefined, customModifiers);
    scene.phaseManager.unshiftPhase(selectModifierPhase);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("SelectModifierPhase");

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(
      h => h instanceof ModifierSelectUiHandler,
    ) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(5);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("MEMORY_MUSHROOM");
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toEqual("TM_ULTRA");
    expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toEqual("LEFTOVERS");
    expect(modifierSelectHandler.options[3].modifierTypeOption.type.id).toEqual("AMULET_COIN");
    expect(modifierSelectHandler.options[4].modifierTypeOption.type.id).toEqual("GOLDEN_PUNCH");
  });

  it("should generate custom modifier tiers that can upgrade from luck", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    scene.money = 1000000;
    const customModifiers: CustomModifierSettings = {
      guaranteedModifierTiers: [
        ModifierTier.COMMON,
        ModifierTier.GREAT,
        ModifierTier.ULTRA,
        ModifierTier.ROGUE,
        ModifierTier.MASTER,
      ],
    };
    const pokemon = new PlayerPokemon(getPokemonSpecies(SpeciesId.BULBASAUR), 10, undefined, 0, undefined, true, 2);

    // Fill party with max shinies
    while (scene.getPlayerParty().length > 0) {
      scene.getPlayerParty().pop();
    }
    scene.getPlayerParty().push(pokemon, pokemon, pokemon, pokemon, pokemon, pokemon);

    const selectModifierPhase = new SelectModifierPhase(0, undefined, customModifiers);
    scene.phaseManager.unshiftPhase(selectModifierPhase);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("SelectModifierPhase");

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(
      h => h instanceof ModifierSelectUiHandler,
    ) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(5);
    expect(
      modifierSelectHandler.options[0].modifierTypeOption.type.tier
        - modifierSelectHandler.options[0].modifierTypeOption.upgradeCount,
    ).toEqual(ModifierTier.COMMON);
    expect(
      modifierSelectHandler.options[1].modifierTypeOption.type.tier
        - modifierSelectHandler.options[1].modifierTypeOption.upgradeCount,
    ).toEqual(ModifierTier.GREAT);
    expect(
      modifierSelectHandler.options[2].modifierTypeOption.type.tier
        - modifierSelectHandler.options[2].modifierTypeOption.upgradeCount,
    ).toEqual(ModifierTier.ULTRA);
    expect(
      modifierSelectHandler.options[3].modifierTypeOption.type.tier
        - modifierSelectHandler.options[3].modifierTypeOption.upgradeCount,
    ).toEqual(ModifierTier.ROGUE);
    expect(
      modifierSelectHandler.options[4].modifierTypeOption.type.tier
        - modifierSelectHandler.options[4].modifierTypeOption.upgradeCount,
    ).toEqual(ModifierTier.MASTER);
  });

  it("should generate custom modifiers and modifier tiers together", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    scene.money = 1000000;
    const customModifiers: CustomModifierSettings = {
      guaranteedModifierTypeFuncs: [modifierTypes.MEMORY_MUSHROOM, modifierTypes.TM_COMMON],
      guaranteedModifierTiers: [ModifierTier.MASTER, ModifierTier.MASTER],
    };
    const selectModifierPhase = new SelectModifierPhase(0, undefined, customModifiers);
    scene.phaseManager.unshiftPhase(selectModifierPhase);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("SelectModifierPhase");

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(
      h => h instanceof ModifierSelectUiHandler,
    ) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(4);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("MEMORY_MUSHROOM");
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toEqual("TM_COMMON");
    expect(modifierSelectHandler.options[2].modifierTypeOption.type.tier).toEqual(ModifierTier.MASTER);
    expect(modifierSelectHandler.options[3].modifierTypeOption.type.tier).toEqual(ModifierTier.MASTER);
  });

  it("should fill remaining modifiers if fillRemaining is true with custom modifiers", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    scene.money = 1000000;
    const customModifiers: CustomModifierSettings = {
      guaranteedModifierTypeFuncs: [modifierTypes.MEMORY_MUSHROOM],
      guaranteedModifierTiers: [ModifierTier.MASTER],
      fillRemaining: true,
    };
    const selectModifierPhase = new SelectModifierPhase(0, undefined, customModifiers);
    scene.phaseManager.unshiftPhase(selectModifierPhase);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("SelectModifierPhase");

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(
      h => h instanceof ModifierSelectUiHandler,
    ) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("MEMORY_MUSHROOM");
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.tier).toEqual(ModifierTier.MASTER);
  });
});
