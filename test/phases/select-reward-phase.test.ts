import type { BattleScene } from "#app/battle-scene";
import { allRewards } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { Button } from "#enums/buttons";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { RewardId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import { UiMode } from "#enums/ui-mode";
import { PlayerPokemon } from "#field/pokemon";
import type { HeldItemReward, TrainerItemReward } from "#items/reward";
import { RewardOption } from "#items/reward";
import type { CustomRewardSettings } from "#items/reward-pool-utils";
import { SelectRewardPhase } from "#phases/select-reward-phase";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import { RewardSelectUiHandler } from "#ui/handlers/reward-select-ui-handler";
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
    const selectRewardPhase = new SelectRewardPhase();
    scene.phaseManager.unshiftPhase(selectRewardPhase);
    await game.phaseInterceptor.to(SelectRewardPhase);

    expect(scene.ui.getMode()).to.equal(UiMode.REWARD_SELECT);
  });

  it("should generate random modifiers", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    game.move.select(MoveId.FISSURE);
    await game.phaseInterceptor.to("SelectRewardPhase");

    expect(scene.ui.getMode()).to.equal(UiMode.REWARD_SELECT);
    const rewardSelectHandler = scene.ui.handlers.find(
      h => h instanceof RewardSelectUiHandler,
    ) as RewardSelectUiHandler;
    expect(rewardSelectHandler.options.length).toEqual(3);
  });

  it("should modify reroll cost", async () => {
    initSceneWithoutEncounterPhase(scene, [SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    const options = [
      new RewardOption(allRewards.POTION(), 0, RarityTier.COMMON, 100),
      new RewardOption(allRewards.ETHER(), 0, RarityTier.COMMON, 400),
      new RewardOption(allRewards.REVIVE(), 0, RarityTier.COMMON, 1000),
    ];

    const selectRewardPhase1 = new SelectRewardPhase(0, undefined, {
      guaranteedRewardOptions: options,
    });
    const selectRewardPhase2 = new SelectRewardPhase(0, undefined, {
      guaranteedRewardOptions: options,
      rerollMultiplier: 2,
    });

    const cost1 = selectRewardPhase1.getRerollCost(false);
    const cost2 = selectRewardPhase2.getRerollCost(false);
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
    expect(scene.ui.getMode()).to.equal(UiMode.REWARD_SELECT);
    const rewardSelectHandler = scene.ui.handlers.find(
      h => h instanceof RewardSelectUiHandler,
    ) as RewardSelectUiHandler;
    expect(rewardSelectHandler.options.length).toEqual(3);

    rewardSelectHandler.processInput(Button.ACTION);

    expect(scene.money).toBe(1000000 - 250);
    expect(scene.ui.getMode()).to.equal(UiMode.REWARD_SELECT);
    expect(rewardSelectHandler.options.length).toEqual(3);
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

    expect(scene.ui.getMode()).to.equal(UiMode.REWARD_SELECT);
    const rewardSelectHandler = scene.ui.handlers.find(
      h => h instanceof RewardSelectUiHandler,
    ) as RewardSelectUiHandler;
    expect(rewardSelectHandler.options.length).toEqual(3);
    const firstRollTiers: RarityTier[] = rewardSelectHandler.options.map(o => o.rewardOption.tier);

    // TODO: nagivate ui to reroll with lock capsule enabled

    expect(scene.ui.getMode()).to.equal(UiMode.REWARD_SELECT);
    expect(rewardSelectHandler.options.length).toEqual(3);
    // Reroll with lock can still upgrade
    expect(
      rewardSelectHandler.options[0].rewardOption.tier - rewardSelectHandler.options[0].rewardOption.upgradeCount,
    ).toEqual(firstRollTiers[0]);
    expect(
      rewardSelectHandler.options[1].rewardOption.tier - rewardSelectHandler.options[1].rewardOption.upgradeCount,
    ).toEqual(firstRollTiers[1]);
    expect(
      rewardSelectHandler.options[2].rewardOption.tier - rewardSelectHandler.options[2].rewardOption.upgradeCount,
    ).toEqual(firstRollTiers[2]);
  });

  it("should generate custom modifiers", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    scene.money = 1000000;
    const customRewards: CustomRewardSettings = {
      guaranteedRewardSpecs: [
        allRewards.MEMORY_MUSHROOM,
        allRewards.TM_ULTRA,
        allRewards.LEFTOVERS,
        allRewards.AMULET_COIN,
        allRewards.GOLDEN_PUNCH,
      ],
    };
    const selectRewardPhase = new SelectRewardPhase(0, undefined, customRewards);
    scene.phaseManager.unshiftPhase(selectRewardPhase);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("SelectRewardPhase");

    expect(scene.ui.getMode()).to.equal(UiMode.REWARD_SELECT);
    const rewardSelectHandler = scene.ui.handlers.find(
      h => h instanceof RewardSelectUiHandler,
    ) as RewardSelectUiHandler;
    expect(rewardSelectHandler.options.length).toEqual(5);
    expect(rewardSelectHandler.options[0].rewardOption.type.id).toEqual(RewardId.MEMORY_MUSHROOM);
    expect(rewardSelectHandler.options[1].rewardOption.type.id).toEqual(RewardId.TM_ULTRA);
    expect(rewardSelectHandler.options[2].rewardOption.type.id).toEqual(RewardId.HELD_ITEM);
    expect((rewardSelectHandler.options[2].rewardOption.type as HeldItemReward).itemId).toEqual(HeldItemId.LEFTOVERS);
    expect(rewardSelectHandler.options[3].rewardOption.type.id).toEqual(RewardId.TRAINER_ITEM);
    expect((rewardSelectHandler.options[3].rewardOption.type as TrainerItemReward).itemId).toEqual(
      TrainerItemId.AMULET_COIN,
    );
    expect(rewardSelectHandler.options[4].rewardOption.type.id).toEqual(RewardId.HELD_ITEM);
    expect((rewardSelectHandler.options[4].rewardOption.type as HeldItemReward).itemId).toEqual(
      HeldItemId.GOLDEN_PUNCH,
    );
  });

  it("should generate custom modifier tiers that can upgrade from luck", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    scene.money = 1000000;
    const customRewards: CustomRewardSettings = {
      guaranteedRarityTiers: [
        RarityTier.COMMON,
        RarityTier.GREAT,
        RarityTier.ULTRA,
        RarityTier.ROGUE,
        RarityTier.MASTER,
      ],
    };
    const pokemon = new PlayerPokemon(getPokemonSpecies(SpeciesId.BULBASAUR), 10, undefined, 0, undefined, true, 2);

    // Fill party with max shinies
    while (scene.getPlayerParty().length > 0) {
      scene.getPlayerParty().pop();
    }
    scene.getPlayerParty().push(pokemon, pokemon, pokemon, pokemon, pokemon, pokemon);

    const selectRewardPhase = new SelectRewardPhase(0, undefined, customRewards);
    scene.phaseManager.unshiftPhase(selectRewardPhase);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("SelectRewardPhase");

    expect(scene.ui.getMode()).to.equal(UiMode.REWARD_SELECT);
    const rewardSelectHandler = scene.ui.handlers.find(
      h => h instanceof RewardSelectUiHandler,
    ) as RewardSelectUiHandler;
    expect(rewardSelectHandler.options.length).toEqual(5);
    expect(
      rewardSelectHandler.options[0].rewardOption.tier - rewardSelectHandler.options[0].rewardOption.upgradeCount,
    ).toEqual(RarityTier.COMMON);
    expect(
      rewardSelectHandler.options[1].rewardOption.tier - rewardSelectHandler.options[1].rewardOption.upgradeCount,
    ).toEqual(RarityTier.GREAT);
    expect(
      rewardSelectHandler.options[2].rewardOption.tier - rewardSelectHandler.options[2].rewardOption.upgradeCount,
    ).toEqual(RarityTier.ULTRA);
    expect(
      rewardSelectHandler.options[3].rewardOption.tier - rewardSelectHandler.options[3].rewardOption.upgradeCount,
    ).toEqual(RarityTier.ROGUE);
    expect(
      rewardSelectHandler.options[4].rewardOption.tier - rewardSelectHandler.options[4].rewardOption.upgradeCount,
    ).toEqual(RarityTier.MASTER);
  });

  it("should generate custom modifiers and modifier tiers together", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    scene.money = 1000000;
    const customRewards: CustomRewardSettings = {
      guaranteedRewardSpecs: [allRewards.MEMORY_MUSHROOM, allRewards.TM_COMMON],
      guaranteedRarityTiers: [RarityTier.MASTER, RarityTier.MASTER],
    };
    const selectRewardPhase = new SelectRewardPhase(0, undefined, customRewards);
    scene.phaseManager.unshiftPhase(selectRewardPhase);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.run(SelectRewardPhase);

    expect(scene.ui.getMode()).to.equal(UiMode.REWARD_SELECT);
    const rewardSelectHandler = scene.ui.handlers.find(
      h => h instanceof RewardSelectUiHandler,
    ) as RewardSelectUiHandler;
    expect(rewardSelectHandler.options.length).toEqual(4);
    expect(rewardSelectHandler.options[0].rewardOption.type.id).toEqual(RewardId.MEMORY_MUSHROOM);
    expect(rewardSelectHandler.options[1].rewardOption.type.id).toEqual(RewardId.TM_COMMON);
    expect(rewardSelectHandler.options[2].rewardOption.tier).toEqual(RarityTier.MASTER);
    expect(rewardSelectHandler.options[3].rewardOption.tier).toEqual(RarityTier.MASTER);
  });

  it("should fill remaining modifiers if fillRemaining is true with custom modifiers", async () => {
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    scene.money = 1000000;
    const customRewards: CustomRewardSettings = {
      guaranteedRewardSpecs: [allRewards.MEMORY_MUSHROOM],
      guaranteedRarityTiers: [RarityTier.MASTER],
      fillRemaining: true,
    };
    const selectRewardPhase = new SelectRewardPhase(0, undefined, customRewards);
    scene.phaseManager.unshiftPhase(selectRewardPhase);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.run(SelectRewardPhase);

    expect(scene.ui.getMode()).to.equal(UiMode.REWARD_SELECT);
    const rewardSelectHandler = scene.ui.handlers.find(
      h => h instanceof RewardSelectUiHandler,
    ) as RewardSelectUiHandler;
    expect(rewardSelectHandler.options.length).toEqual(3);
    expect(rewardSelectHandler.options[0].rewardOption.type.id).toEqual(RewardId.MEMORY_MUSHROOM);
    expect(rewardSelectHandler.options[1].rewardOption.tier).toEqual(RarityTier.MASTER);
  });
});
