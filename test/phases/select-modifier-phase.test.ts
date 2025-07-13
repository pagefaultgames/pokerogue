import type { BattleScene } from "#app/battle-scene";
import { modifierTypes } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { Button } from "#enums/buttons";
import { MoveId } from "#enums/move-id";
import { RewardTier } from "#enums/reward-tier";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import { UiMode } from "#enums/ui-mode";
import { PlayerPokemon } from "#field/pokemon";
import type { CustomModifierSettings } from "#modifiers/modifier-type";
import { RewardOption } from "#modifiers/modifier-type";
import { SelectRewardPhase } from "#phases/select-reward-phase";
import { GameManager } from "#test/testUtils/gameManager";
import { initSceneWithoutEncounterPhase } from "#test/testUtils/gameManagerUtils";
import { RewardSelectUiHandler } from "#ui/reward-select-ui-handler";
import { shiftCharCodes } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("SelectRewardPhase", () => {
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
    const selectModifierPhase = new SelectRewardPhase();
    scene.phaseManager.unshiftPhase(selectModifierPhase);
    await game.phaseInterceptor.to(SelectRewardPhase);

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
  });

  it("should generate random modifiers", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    game.move.select(MoveId.FISSURE);
    await game.phaseInterceptor.to("SelectRewardPhase");

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(
      h => h instanceof RewardSelectUiHandler,
    ) as RewardSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);
  });

  it("should modify reroll cost", async () => {
    initSceneWithoutEncounterPhase(scene, [SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    const options = [
      new RewardOption(modifierTypes.POTION(), 0, 100),
      new RewardOption(modifierTypes.ETHER(), 0, 400),
      new RewardOption(modifierTypes.REVIVE(), 0, 1000),
    ];

    const selectModifierPhase1 = new SelectRewardPhase(0, undefined, {
      guaranteedRewardOptions: options,
    });
    const selectModifierPhase2 = new SelectRewardPhase(0, undefined, {
      guaranteedRewardOptions: options,
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
    await game.phaseInterceptor.to("SelectRewardPhase");

    // TODO: nagivate the ui to reroll somehow
    //const smphase = scene.phaseManager.getCurrentPhase() as SelectRewardPhase;
    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(
      h => h instanceof RewardSelectUiHandler,
    ) as RewardSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);

    modifierSelectHandler.processInput(Button.ACTION);

    expect(scene.money).toBe(1000000 - 250);
    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    expect(modifierSelectHandler.options.length).toEqual(3);
  });

  it.todo("should generate random modifiers of same tier for reroll with reroll lock", async () => {
    game.override.startingTrainerItems([{ entry: TrainerItemId.LOCK_CAPSULE }]);
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
    await game.phaseInterceptor.to("SelectRewardPhase");

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(
      h => h instanceof RewardSelectUiHandler,
    ) as RewardSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);
    const firstRollTiers: RewardTier[] = modifierSelectHandler.options.map(o => o.modifierTypeOption.type.tier);

    // TODO: nagivate ui to reroll with lock capsule enabled

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    expect(modifierSelectHandler.options.length).toEqual(3);
    // Reroll with lock can still upgrade
    expect(
      modifierSelectHandler.options[0].modifierTypeOption.type.tier -
        modifierSelectHandler.options[0].modifierTypeOption.upgradeCount,
    ).toEqual(firstRollTiers[0]);
    expect(
      modifierSelectHandler.options[1].modifierTypeOption.type.tier -
        modifierSelectHandler.options[1].modifierTypeOption.upgradeCount,
    ).toEqual(firstRollTiers[1]);
    expect(
      modifierSelectHandler.options[2].modifierTypeOption.type.tier -
        modifierSelectHandler.options[2].modifierTypeOption.upgradeCount,
    ).toEqual(firstRollTiers[2]);
  });

  it("should generate custom modifiers", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    scene.money = 1000000;
    const customModifiers: CustomModifierSettings = {
      guaranteedRewardFuncs: [
        modifierTypes.MEMORY_MUSHROOM,
        modifierTypes.TM_ULTRA,
        modifierTypes.LEFTOVERS,
        modifierTypes.AMULET_COIN,
        modifierTypes.GOLDEN_PUNCH,
      ],
    };
    const selectModifierPhase = new SelectRewardPhase(0, undefined, customModifiers);
    scene.phaseManager.unshiftPhase(selectModifierPhase);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("SelectRewardPhase");

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(
      h => h instanceof RewardSelectUiHandler,
    ) as RewardSelectUiHandler;
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
        RewardTier.COMMON,
        RewardTier.GREAT,
        RewardTier.ULTRA,
        RewardTier.ROGUE,
        RewardTier.MASTER,
      ],
    };
    const pokemon = new PlayerPokemon(getPokemonSpecies(SpeciesId.BULBASAUR), 10, undefined, 0, undefined, true, 2);

    // Fill party with max shinies
    while (scene.getPlayerParty().length > 0) {
      scene.getPlayerParty().pop();
    }
    scene.getPlayerParty().push(pokemon, pokemon, pokemon, pokemon, pokemon, pokemon);

    const selectModifierPhase = new SelectRewardPhase(0, undefined, customModifiers);
    scene.phaseManager.unshiftPhase(selectModifierPhase);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("SelectRewardPhase");

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(
      h => h instanceof RewardSelectUiHandler,
    ) as RewardSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(5);
    expect(
      modifierSelectHandler.options[0].modifierTypeOption.type.tier -
        modifierSelectHandler.options[0].modifierTypeOption.upgradeCount,
    ).toEqual(RewardTier.COMMON);
    expect(
      modifierSelectHandler.options[1].modifierTypeOption.type.tier -
        modifierSelectHandler.options[1].modifierTypeOption.upgradeCount,
    ).toEqual(RewardTier.GREAT);
    expect(
      modifierSelectHandler.options[2].modifierTypeOption.type.tier -
        modifierSelectHandler.options[2].modifierTypeOption.upgradeCount,
    ).toEqual(RewardTier.ULTRA);
    expect(
      modifierSelectHandler.options[3].modifierTypeOption.type.tier -
        modifierSelectHandler.options[3].modifierTypeOption.upgradeCount,
    ).toEqual(RewardTier.ROGUE);
    expect(
      modifierSelectHandler.options[4].modifierTypeOption.type.tier -
        modifierSelectHandler.options[4].modifierTypeOption.upgradeCount,
    ).toEqual(RewardTier.MASTER);
  });

  it("should generate custom modifiers and modifier tiers together", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    scene.money = 1000000;
    const customModifiers: CustomModifierSettings = {
      guaranteedRewardFuncs: [modifierTypes.MEMORY_MUSHROOM, modifierTypes.TM_COMMON],
      guaranteedModifierTiers: [RewardTier.MASTER, RewardTier.MASTER],
    };
    const selectModifierPhase = new SelectRewardPhase(0, undefined, customModifiers);
    scene.phaseManager.unshiftPhase(selectModifierPhase);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.run(SelectRewardPhase);

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(
      h => h instanceof RewardSelectUiHandler,
    ) as RewardSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(4);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("MEMORY_MUSHROOM");
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toEqual("TM_COMMON");
    expect(modifierSelectHandler.options[2].modifierTypeOption.type.tier).toEqual(RewardTier.MASTER);
    expect(modifierSelectHandler.options[3].modifierTypeOption.type.tier).toEqual(RewardTier.MASTER);
  });

  it("should fill remaining modifiers if fillRemaining is true with custom modifiers", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    scene.money = 1000000;
    const customModifiers: CustomModifierSettings = {
      guaranteedRewardFuncs: [modifierTypes.MEMORY_MUSHROOM],
      guaranteedModifierTiers: [RewardTier.MASTER],
      fillRemaining: true,
    };
    const selectModifierPhase = new SelectRewardPhase(0, undefined, customModifiers);
    scene.phaseManager.unshiftPhase(selectModifierPhase);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.run(SelectRewardPhase);

    expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = scene.ui.handlers.find(
      h => h instanceof RewardSelectUiHandler,
    ) as RewardSelectUiHandler;
    expect(modifierSelectHandler.options.length).toEqual(3);
    expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("MEMORY_MUSHROOM");
    expect(modifierSelectHandler.options[1].modifierTypeOption.type.tier).toEqual(RewardTier.MASTER);
  });
});
