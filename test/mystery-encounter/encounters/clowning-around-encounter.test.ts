import type { BattleScene } from "#app/battle-scene";
import * as BattleAnims from "#data/battle-anims";
import { modifierTypes } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BerryType } from "#enums/berry-type";
import { BiomeId } from "#enums/biome-id";
import { Button } from "#enums/buttons";
import { ModifierTier } from "#enums/modifier-tier";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import { UiMode } from "#enums/ui-mode";
import type { Pokemon } from "#field/pokemon";
import type { PokemonHeldItemModifier } from "#modifiers/modifier";
import type { PokemonHeldItemModifierType } from "#modifiers/modifier-type";
import { PokemonMove } from "#moves/pokemon-move";
import { ClowningAroundEncounter } from "#mystery-encounters/clowning-around-encounter";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import { generateModifierType } from "#mystery-encounters/encounter-phase-utils";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { MovePhase } from "#phases/move-phase";
import {
  runMysteryEncounterToEnd,
  skipBattleRunMysteryEncounterRewardsPhase,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import type { PartyUiHandler } from "#ui/handlers/party-ui-handler";
import type { OptionSelectUiHandler } from "#ui/option-select-ui-handler";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
        text: `${namespace}:introDialogue`,
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
      expect(game).toBeAtPhase("CommandPhase");
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
      await game.phaseInterceptor.to("PostMysteryEncounterPhase");
      expect(game).toBeAtPhase("PostMysteryEncounterPhase");

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
      await game.phaseInterceptor.to("NewBattlePhase", false);

      const leadPokemon = game.field.getPlayerPokemon();
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
            text: `${namespace}:option.2.selected2`,
          },
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.2.selected3`,
          },
        ],
      });
    });

    it("should randomize held items of the Pokemon with the most items, and not the held items of other pokemon", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);

      // Set some moves on party for attack type booster generation
      game.move.changeMoveset(game.field.getPlayerPokemon(), [MoveId.TACKLE, MoveId.THIEF]);

      // 2 Sitrus Berries on lead
      scene.modifiers = [];
      let itemType = generateModifierType(modifierTypes.BERRY, [BerryType.SITRUS]) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, game.field.getPlayerPokemon(), 2, itemType);
      // 2 Ganlon Berries on lead
      itemType = generateModifierType(modifierTypes.BERRY, [BerryType.GANLON]) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, game.field.getPlayerPokemon(), 2, itemType);
      // 5 Golden Punch on lead (ultra)
      itemType = generateModifierType(modifierTypes.GOLDEN_PUNCH) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, game.field.getPlayerPokemon(), 5, itemType);
      // 5 Lucky Egg on lead (ultra)
      itemType = generateModifierType(modifierTypes.LUCKY_EGG) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, game.field.getPlayerPokemon(), 5, itemType);
      // 3 Soothe Bell on lead (great tier, but counted as ultra by this ME)
      itemType = generateModifierType(modifierTypes.SOOTHE_BELL) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, game.field.getPlayerPokemon(), 3, itemType);
      // 5 Soul Dew on lead (rogue)
      itemType = generateModifierType(modifierTypes.SOUL_DEW) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, game.field.getPlayerPokemon(), 5, itemType);
      // 2 Golden Egg on lead (rogue)
      itemType = generateModifierType(modifierTypes.GOLDEN_EGG) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, game.field.getPlayerPokemon(), 2, itemType);

      // 5 Soul Dew on second party pokemon (these should not change)
      itemType = generateModifierType(modifierTypes.SOUL_DEW) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, scene.getPlayerParty()[1], 5, itemType);

      await runMysteryEncounterToEnd(game, 2);

      const leadItemsAfter = game.field.getPlayerPokemon().getHeldItems();
      const ultraCountAfter = leadItemsAfter
        .filter(m => m.type.tier === ModifierTier.ULTRA)
        .reduce((a, b) => a + b.stackCount, 0);
      const rogueCountAfter = leadItemsAfter
        .filter(m => m.type.tier === ModifierTier.ROGUE)
        .reduce((a, b) => a + b.stackCount, 0);
      expect(ultraCountAfter).toBe(13);
      expect(rogueCountAfter).toBe(7);

      const secondItemsAfter = scene.getPlayerParty()[1].getHeldItems();
      expect(secondItemsAfter.length).toBe(1);
      expect(secondItemsAfter[0].type.id).toBe("SOUL_DEW");
      expect(secondItemsAfter[0]?.stackCount).toBe(5);
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
            text: `${namespace}:option.3.selected2`,
          },
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.3.selected3`,
          },
        ],
      });
    });

    it("should randomize the pokemon types of the party", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);

      // Same type moves on lead
      game.move.changeMoveset(game.field.getPlayerPokemon(), [MoveId.ICE_BEAM, MoveId.SURF]);
      // Different type moves on second
      game.move.changeMoveset(scene.getPlayerParty()[1], [MoveId.GRASS_KNOT, MoveId.ELECTRO_BALL]);
      // No moves on third
      scene.getPlayerParty()[2].moveset = [];
      await runMysteryEncounterToEnd(game, 3);

      const leadTypesAfter = game.field.getPlayerPokemon().getTypes();
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

async function addItemToPokemon(
  scene: BattleScene,
  pokemon: Pokemon,
  stackCount: number,
  itemType: PokemonHeldItemModifierType,
) {
  const itemMod = itemType.newModifier(pokemon) as PokemonHeldItemModifier;
  itemMod.stackCount = stackCount;
  scene.addModifier(itemMod, true, false, false, true);
  await scene.updateModifiers(true);
}
