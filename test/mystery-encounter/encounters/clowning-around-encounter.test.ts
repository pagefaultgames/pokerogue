import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { BiomeId } from "#enums/biome-id";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getPokemonSpecies } from "#app/utils/pokemon-utils";
import * as BattleAnims from "#app/data/battle-anims";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import {
  runMysteryEncounterToEnd,
  skipBattleRunMysteryEncounterRewardsPhase,
} from "#test/mystery-encounter/encounter-test-utils";
import { MoveId } from "#enums/move-id";
import type BattleScene from "#app/battle-scene";
import { PokemonMove } from "#app/data/moves/pokemon-move";
import { UiMode } from "#enums/ui-mode";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/testUtils/gameManagerUtils";
import { ClowningAroundEncounter } from "#app/data/mystery-encounters/encounters/clowning-around-encounter";
import { TrainerType } from "#enums/trainer-type";
import { AbilityId } from "#enums/ability-id";
import { PostMysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
import { Button } from "#enums/buttons";
import type PartyUiHandler from "#app/ui/party-ui-handler";
import type OptionSelectUiHandler from "#app/ui/settings/option-select-ui-handler";
import { PokemonType } from "#enums/pokemon-type";
import { CommandPhase } from "#app/phases/command-phase";
import { MovePhase } from "#app/phases/move-phase";
import { SelectRewardPhase } from "#app/phases/select-reward-phase";
import { NewBattlePhase } from "#app/phases/new-battle-phase";
import { HeldItemId } from "#enums/held-item-id";
import { getHeldItemTier } from "#app/items/held-item-tiers";
import { RewardTier } from "#enums/reward-tier";

const namespace = "mysteryEncounters/clowningAround";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.CAVE;
const defaultWave = 45;

describe("Clowning Around - Mystery Encounter", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let scene: BattleScene;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    scene = game.scene;
    game.override
      .mysteryEncounterChance(100)
      .startingWave(defaultWave)
      .startingBiome(defaultBiome)
      .disableTrainerWaves();

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<BiomeId, MysteryEncounterType[]>([[BiomeId.CAVE, [MysteryEncounterType.CLOWNING_AROUND]]]),
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);

    expect(ClowningAroundEncounter.encounterType).toBe(MysteryEncounterType.CLOWNING_AROUND);
    expect(ClowningAroundEncounter.encounterTier).toBe(MysteryEncounterTier.ULTRA);
    expect(ClowningAroundEncounter.dialogue).toBeDefined();
    expect(ClowningAroundEncounter.dialogue.intro).toStrictEqual([
      { text: `${namespace}:intro` },
      {
        speaker: `${namespace}:speaker`,
        text: `${namespace}:intro_dialogue`,
      },
    ]);
    expect(ClowningAroundEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(ClowningAroundEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(ClowningAroundEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(ClowningAroundEncounter.options.length).toBe(3);
  });

  it("should not run below wave 80", async () => {
    game.override.startingWave(79);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.CLOWNING_AROUND);
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = ClowningAroundEncounter;
    const moveInitSpy = vi.spyOn(BattleAnims, "initMoveAnim");
    const moveLoadSpy = vi.spyOn(BattleAnims, "loadMoveAnimAssets");

    const { onInit } = ClowningAroundEncounter;

    expect(ClowningAroundEncounter.onInit).toBeDefined();

    ClowningAroundEncounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();
    const config = ClowningAroundEncounter.enemyPartyConfigs[0];

    expect(config.doubleBattle).toBe(true);
    expect(config.trainerConfig?.trainerType).toBe(TrainerType.HARLEQUIN);
    expect(config.pokemonConfigs?.[0]).toEqual({
      species: getPokemonSpecies(SpeciesId.MR_MIME),
      isBoss: true,
      moveSet: [MoveId.TEETER_DANCE, MoveId.ALLY_SWITCH, MoveId.DAZZLING_GLEAM, MoveId.PSYCHIC],
    });
    expect(config.pokemonConfigs?.[1]).toEqual({
      species: getPokemonSpecies(SpeciesId.BLACEPHALON),
      customPokemonData: expect.anything(),
      isBoss: true,
      moveSet: [MoveId.TRICK, MoveId.HYPNOSIS, MoveId.SHADOW_BALL, MoveId.MIND_BLOWN],
    });
    expect(config.pokemonConfigs?.[1].customPokemonData?.types.length).toBe(2);
    expect([
      AbilityId.STURDY,
      AbilityId.PICKUP,
      AbilityId.INTIMIDATE,
      AbilityId.GUTS,
      AbilityId.DROUGHT,
      AbilityId.DRIZZLE,
      AbilityId.SNOW_WARNING,
      AbilityId.SAND_STREAM,
      AbilityId.ELECTRIC_SURGE,
      AbilityId.PSYCHIC_SURGE,
      AbilityId.GRASSY_SURGE,
      AbilityId.MISTY_SURGE,
      AbilityId.MAGICIAN,
      AbilityId.SHEER_FORCE,
      AbilityId.PRANKSTER,
    ]).toContain(config.pokemonConfigs?.[1].customPokemonData?.ability);
    expect(ClowningAroundEncounter.misc.ability).toBe(config.pokemonConfigs?.[1].customPokemonData?.ability);
    await vi.waitFor(() => expect(moveInitSpy).toHaveBeenCalled());
    await vi.waitFor(() => expect(moveLoadSpy).toHaveBeenCalled());
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Battle the Clown", () => {
    it("should have the correct properties", () => {
      const option = ClowningAroundEncounter.options[0];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.1.selected`,
          },
        ],
      });
    });

    it("should start double battle against the clown", async () => {
      const phaseSpy = vi.spyOn(scene.phaseManager, "pushPhase");

      await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(scene.phaseManager.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(2);
      expect(enemyField[0].species.speciesId).toBe(SpeciesId.MR_MIME);
      expect(enemyField[0].moveset).toEqual([
        new PokemonMove(MoveId.TEETER_DANCE),
        new PokemonMove(MoveId.ALLY_SWITCH),
        new PokemonMove(MoveId.DAZZLING_GLEAM),
        new PokemonMove(MoveId.PSYCHIC),
      ]);
      expect(enemyField[1].species.speciesId).toBe(SpeciesId.BLACEPHALON);
      expect(enemyField[1].moveset).toEqual([
        new PokemonMove(MoveId.TRICK),
        new PokemonMove(MoveId.HYPNOSIS),
        new PokemonMove(MoveId.SHADOW_BALL),
        new PokemonMove(MoveId.MIND_BLOWN),
      ]);

      // Should have used moves pre-battle
      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof MovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(3);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === MoveId.ROLE_PLAY).length).toBe(1);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === MoveId.TAUNT).length).toBe(2);
    });

    it("should let the player gain the ability after battle completion", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectRewardPhase, false);
      expect(scene.phaseManager.getCurrentPhase()?.constructor.name).toBe(SelectRewardPhase.name);
      await game.phaseInterceptor.run(SelectRewardPhase);
      const abilityToTrain = scene.currentBattle.mysteryEncounter?.misc.ability;

      game.onNextPrompt("PostMysteryEncounterPhase", UiMode.MESSAGE, () => {
        game.scene.ui.getHandler().processInput(Button.ACTION);
      });

      // Run to ability train option selection
      const optionSelectUiHandler = game.scene.ui.handlers[UiMode.OPTION_SELECT] as OptionSelectUiHandler;
      vi.spyOn(optionSelectUiHandler, "show");
      const partyUiHandler = game.scene.ui.handlers[UiMode.PARTY] as PartyUiHandler;
      vi.spyOn(partyUiHandler, "show");
      game.endPhase();
      await game.phaseInterceptor.to(PostMysteryEncounterPhase);
      expect(scene.phaseManager.getCurrentPhase()?.constructor.name).toBe(PostMysteryEncounterPhase.name);

      // Wait for Yes/No confirmation to appear
      await vi.waitFor(() => expect(optionSelectUiHandler.show).toHaveBeenCalled());
      // Select "Yes" on train ability
      optionSelectUiHandler.processInput(Button.ACTION);
      // Select first pokemon in party to train
      await vi.waitFor(() => expect(partyUiHandler.show).toHaveBeenCalled());
      partyUiHandler.processInput(Button.ACTION);
      // Click "Select" on Pokemon
      partyUiHandler.processInput(Button.ACTION);
      // Stop next battle before it runs
      await game.phaseInterceptor.to(NewBattlePhase, false);

      const leadPokemon = scene.getPlayerParty()[0];
      expect(leadPokemon.customPokemonData?.ability).toBe(abilityToTrain);
    });
  });

  describe("Option 2 - Remain Unprovoked", () => {
    it("should have the correct properties", () => {
      const option = ClowningAroundEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.2.selected`,
          },
          {
            text: `${namespace}:option.2.selected_2`,
          },
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.2.selected_3`,
          },
        ],
      });
    });

    it("should randomize held items of the Pokemon with the most items, and not the held items of other pokemon", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);

      // Set some moves on party for attack type booster generation
      scene.getPlayerParty()[0].moveset = [new PokemonMove(MoveId.TACKLE), new PokemonMove(MoveId.THIEF)];

      // 2 Sitrus Berries on lead
      scene.clearAllItems();
      scene.getPlayerParty()[0].heldItemManager.add(HeldItemId.SITRUS_BERRY, 2);
      scene.getPlayerParty()[0].heldItemManager.add(HeldItemId.GANLON_BERRY, 2);
      scene.getPlayerParty()[0].heldItemManager.add(HeldItemId.GOLDEN_PUNCH, 5);
      scene.getPlayerParty()[0].heldItemManager.add(HeldItemId.LUCKY_EGG, 5);
      scene.getPlayerParty()[0].heldItemManager.add(HeldItemId.SOOTHE_BELL, 3);
      scene.getPlayerParty()[0].heldItemManager.add(HeldItemId.SOUL_DEW, 5);
      scene.getPlayerParty()[0].heldItemManager.add(HeldItemId.GOLDEN_EGG, 2);

      scene.getPlayerParty()[1].heldItemManager.add(HeldItemId.SOUL_DEW, 5);

      await runMysteryEncounterToEnd(game, 2);

      const leadItemsAfter = scene.getPlayerParty()[0].getHeldItems();
      const ultraCountAfter = leadItemsAfter
        .filter(m => getHeldItemTier(m) === RewardTier.ULTRA)
        .reduce((a, b) => a + scene.getPlayerParty()[0].heldItemManager.getStack(b), 0);
      const rogueCountAfter = leadItemsAfter
        .filter(m => getHeldItemTier(m) === RewardTier.ROGUE)
        .reduce((a, b) => a + scene.getPlayerParty()[0].heldItemManager.getStack(b), 0);
      expect(ultraCountAfter).toBe(13);
      expect(rogueCountAfter).toBe(7);

      const secondItemsAfter = scene.getPlayerParty()[1].getHeldItems();
      expect(secondItemsAfter.length).toBe(1);
      expect(scene.getPlayerParty()[0].heldItemManager.getStack(HeldItemId.SOUL_DEW)).toBe(5);
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - Return the Insults", () => {
    it("should have the correct properties", () => {
      const option = ClowningAroundEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        selected: [
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.3.selected`,
          },
          {
            text: `${namespace}:option.3.selected_2`,
          },
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.3.selected_3`,
          },
        ],
      });
    });

    it("should randomize the pokemon types of the party", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);

      // Same type moves on lead
      scene.getPlayerParty()[0].moveset = [new PokemonMove(MoveId.ICE_BEAM), new PokemonMove(MoveId.SURF)];
      // Different type moves on second
      scene.getPlayerParty()[1].moveset = [new PokemonMove(MoveId.GRASS_KNOT), new PokemonMove(MoveId.ELECTRO_BALL)];
      // No moves on third
      scene.getPlayerParty()[2].moveset = [];
      await runMysteryEncounterToEnd(game, 3);

      const leadTypesAfter = scene.getPlayerParty()[0].getTypes();
      const secondaryTypesAfter = scene.getPlayerParty()[1].getTypes();
      const thirdTypesAfter = scene.getPlayerParty()[2].getTypes();

      expect(leadTypesAfter.length).toBe(2);
      expect(leadTypesAfter[0]).toBe(PokemonType.WATER);
      expect([PokemonType.WATER, PokemonType.ICE].includes(leadTypesAfter[1])).toBeFalsy();
      expect(secondaryTypesAfter.length).toBe(2);
      expect(secondaryTypesAfter[0]).toBe(PokemonType.GHOST);
      expect([PokemonType.GHOST, PokemonType.POISON].includes(secondaryTypesAfter[1])).toBeFalsy();
      expect([PokemonType.GRASS, PokemonType.ELECTRIC].includes(secondaryTypesAfter[1])).toBeTruthy();
      expect(thirdTypesAfter.length).toBe(2);
      expect(thirdTypesAfter[0]).toBe(PokemonType.PSYCHIC);
      expect(secondaryTypesAfter[1]).not.toBe(PokemonType.PSYCHIC);
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);
      await runMysteryEncounterToEnd(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
