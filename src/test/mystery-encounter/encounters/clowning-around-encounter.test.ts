import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import * as BattleAnims from "#app/data/battle-anims";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { generateModifierType } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { runMysteryEncounterToEnd, skipBattleRunMysteryEncounterRewardsPhase } from "#test/mystery-encounter/encounter-test-utils";
import { Moves } from "#enums/moves";
import BattleScene from "#app/battle-scene";
import Pokemon, { PokemonMove } from "#app/field/pokemon";
import { Mode } from "#app/ui/ui";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { ClowningAroundEncounter } from "#app/data/mystery-encounters/encounters/clowning-around-encounter";
import { TrainerType } from "#enums/trainer-type";
import { Abilities } from "#enums/abilities";
import { PostMysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
import { Button } from "#enums/buttons";
import PartyUiHandler from "#app/ui/party-ui-handler";
import OptionSelectUiHandler from "#app/ui/settings/option-select-ui-handler";
import { modifierTypes, PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { BerryType } from "#enums/berry-type";
import { PokemonHeldItemModifier } from "#app/modifier/modifier";
import { Type } from "#app/data/type";
import { CommandPhase } from "#app/phases/command-phase";
import { MovePhase } from "#app/phases/move-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { NewBattlePhase } from "#app/phases/new-battle-phase";

const namespace = "mysteryEncounter:clowningAround";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.CAVE;
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
    game.override.mysteryEncounterChance(100);
    game.override.startingWave(defaultWave);
    game.override.startingBiome(defaultBiome);
    game.override.disableTrainerWaves();

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<Biome, MysteryEncounterType[]>([
        [Biome.CAVE, [MysteryEncounterType.CLOWNING_AROUND]],
      ])
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);

    expect(ClowningAroundEncounter.encounterType).toBe(MysteryEncounterType.CLOWNING_AROUND);
    expect(ClowningAroundEncounter.encounterTier).toBe(MysteryEncounterTier.ULTRA);
    expect(ClowningAroundEncounter.dialogue).toBeDefined();
    expect(ClowningAroundEncounter.dialogue.intro).toStrictEqual([
      { text: `${namespace}.intro` },
      {
        speaker: `${namespace}.speaker`,
        text: `${namespace}.intro_dialogue`,
      },
    ]);
    expect(ClowningAroundEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}.title`);
    expect(ClowningAroundEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}.description`);
    expect(ClowningAroundEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}.query`);
    expect(ClowningAroundEncounter.options.length).toBe(3);
  });

  it("should not run below wave 80", async () => {
    game.override.startingWave(79);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.CLOWNING_AROUND);
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = ClowningAroundEncounter;
    const moveInitSpy = vi.spyOn(BattleAnims, "initMoveAnim");
    const moveLoadSpy = vi.spyOn(BattleAnims, "loadMoveAnimAssets");

    const { onInit } = ClowningAroundEncounter;

    expect(ClowningAroundEncounter.onInit).toBeDefined();

    ClowningAroundEncounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);
    const config = ClowningAroundEncounter.enemyPartyConfigs[0];

    expect(config.doubleBattle).toBe(true);
    expect(config.trainerConfig?.trainerType).toBe(TrainerType.HARLEQUIN);
    expect(config.pokemonConfigs?.[0]).toEqual({
      species: getPokemonSpecies(Species.MR_MIME),
      isBoss: true,
      moveSet: [Moves.TEETER_DANCE, Moves.ALLY_SWITCH, Moves.DAZZLING_GLEAM, Moves.PSYCHIC]
    });
    expect(config.pokemonConfigs?.[1]).toEqual({
      species: getPokemonSpecies(Species.BLACEPHALON),
      mysteryEncounterPokemonData: expect.anything(),
      isBoss: true,
      moveSet: [Moves.TRICK, Moves.HYPNOSIS, Moves.SHADOW_BALL, Moves.MIND_BLOWN]
    });
    expect(config.pokemonConfigs?.[1].mysteryEncounterPokemonData?.types.length).toBe(2);
    expect([
      Abilities.STURDY,
      Abilities.PICKUP,
      Abilities.INTIMIDATE,
      Abilities.GUTS,
      Abilities.DROUGHT,
      Abilities.DRIZZLE,
      Abilities.SNOW_WARNING,
      Abilities.SAND_STREAM,
      Abilities.ELECTRIC_SURGE,
      Abilities.PSYCHIC_SURGE,
      Abilities.GRASSY_SURGE,
      Abilities.MISTY_SURGE,
      Abilities.MAGICIAN,
      Abilities.SHEER_FORCE,
      Abilities.PRANKSTER
    ]).toContain(config.pokemonConfigs?.[1].mysteryEncounterPokemonData?.ability);
    expect(ClowningAroundEncounter.misc.ability).toBe(config.pokemonConfigs?.[1].mysteryEncounterPokemonData?.ability);
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
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        selected: [
          {
            speaker: `${namespace}.speaker`,
            text: `${namespace}.option.1.selected`,
          },
        ],
      });
    });

    it("should start double battle against the clown", async () => {
      const phaseSpy = vi.spyOn(scene, "pushPhase");

      await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(2);
      expect(enemyField[0].species.speciesId).toBe(Species.MR_MIME);
      expect(enemyField[0].moveset).toEqual([new PokemonMove(Moves.TEETER_DANCE), new PokemonMove(Moves.ALLY_SWITCH), new PokemonMove(Moves.DAZZLING_GLEAM), new PokemonMove(Moves.PSYCHIC)]);
      expect(enemyField[1].species.speciesId).toBe(Species.BLACEPHALON);
      expect(enemyField[1].moveset).toEqual([new PokemonMove(Moves.TRICK), new PokemonMove(Moves.HYPNOSIS), new PokemonMove(Moves.SHADOW_BALL), new PokemonMove(Moves.MIND_BLOWN)]);

      // Should have used moves pre-battle
      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof MovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(3);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === Moves.ROLE_PLAY).length).toBe(1);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === Moves.TAUNT).length).toBe(2);
    });

    it("should let the player gain the ability after battle completion", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);
      const abilityToTrain = scene.currentBattle.mysteryEncounter?.misc.ability;

      game.onNextPrompt("PostMysteryEncounterPhase", Mode.MESSAGE, () => {
        game.scene.ui.getHandler().processInput(Button.ACTION);
      });

      // Run to ability train option selection
      const optionSelectUiHandler = game.scene.ui.handlers[Mode.OPTION_SELECT] as OptionSelectUiHandler;
      vi.spyOn(optionSelectUiHandler, "show");
      const partyUiHandler = game.scene.ui.handlers[Mode.PARTY] as PartyUiHandler;
      vi.spyOn(partyUiHandler, "show");
      game.endPhase();
      await game.phaseInterceptor.to(PostMysteryEncounterPhase);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(PostMysteryEncounterPhase.name);

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

      const leadPokemon = scene.getParty()[0];
      expect(leadPokemon.mysteryEncounterPokemonData?.ability).toBe(abilityToTrain);
    });
  });

  describe("Option 2 - Remain Unprovoked", () => {
    it("should have the correct properties", () => {
      const option = ClowningAroundEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
        selected: [
          {
            speaker: `${namespace}.speaker`,
            text: `${namespace}.option.2.selected`,
          },
          {
            text: `${namespace}.option.2.selected_2`,
          },
          {
            speaker: `${namespace}.speaker`,
            text: `${namespace}.option.2.selected_3`,
          },
        ],
      });
    });

    it("should randomize held items of the Pokemon with the most items, and not the held items of other pokemon", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);

      // Set some moves on party for attack type booster generation
      scene.getParty()[0].moveset = [new PokemonMove(Moves.TACKLE), new PokemonMove(Moves.THIEF)];

      // 2 Sitrus Berries on lead
      scene.modifiers = [];
      let itemType = generateModifierType(scene, modifierTypes.BERRY, [BerryType.SITRUS]) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, scene.getParty()[0], 2, itemType);
      // 2 Ganlon Berries on lead
      itemType = generateModifierType(scene, modifierTypes.BERRY, [BerryType.GANLON]) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, scene.getParty()[0], 2, itemType);
      // 5 Golden Punch on lead (ultra)
      itemType = generateModifierType(scene, modifierTypes.GOLDEN_PUNCH) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, scene.getParty()[0], 5, itemType);
      // 5 Lucky Egg on lead (ultra)
      itemType = generateModifierType(scene, modifierTypes.LUCKY_EGG) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, scene.getParty()[0], 5, itemType);
      // 5 Soul Dew on lead (rogue)
      itemType = generateModifierType(scene, modifierTypes.SOUL_DEW) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, scene.getParty()[0], 5, itemType);
      // 2 Golden Egg on lead (rogue)
      itemType = generateModifierType(scene, modifierTypes.GOLDEN_EGG) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, scene.getParty()[0], 2, itemType);

      // 5 Soul Dew on second party pokemon (these should not change)
      itemType = generateModifierType(scene, modifierTypes.SOUL_DEW) as PokemonHeldItemModifierType;
      await addItemToPokemon(scene, scene.getParty()[1], 5, itemType);

      await runMysteryEncounterToEnd(game, 2);

      const leadItemsAfter = scene.getParty()[0].getHeldItems();
      const ultraCountAfter = leadItemsAfter
        .filter(m => m.type.tier === ModifierTier.ULTRA)
        .reduce((a, b) => a + b.stackCount, 0);
      const rogueCountAfter = leadItemsAfter
        .filter(m => m.type.tier === ModifierTier.ROGUE)
        .reduce((a, b) => a + b.stackCount, 0);
      expect(ultraCountAfter).toBe(10);
      expect(rogueCountAfter).toBe(7);

      const secondItemsAfter = scene.getParty()[1].getHeldItems();
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
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        selected: [
          {
            speaker: `${namespace}.speaker`,
            text: `${namespace}.option.3.selected`,
          },
          {
            text: `${namespace}.option.3.selected_2`,
          },
          {
            speaker: `${namespace}.speaker`,
            text: `${namespace}.option.3.selected_3`,
          },
        ],
      });
    });

    it("should randomize the pokemon types of the party", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);

      // Same type moves on lead
      scene.getParty()[0].moveset = [new PokemonMove(Moves.ICE_BEAM), new PokemonMove(Moves.SURF)];
      // Different type moves on second
      scene.getParty()[1].moveset = [new PokemonMove(Moves.GRASS_KNOT), new PokemonMove(Moves.ELECTRO_BALL)];
      // No moves on third
      scene.getParty()[2].moveset = [];
      await runMysteryEncounterToEnd(game, 3);

      const leadTypesAfter = scene.getParty()[0].mysteryEncounterPokemonData?.types;
      const secondaryTypesAfter = scene.getParty()[1].mysteryEncounterPokemonData?.types;
      const thirdTypesAfter = scene.getParty()[2].mysteryEncounterPokemonData?.types;

      expect(leadTypesAfter.length).toBe(2);
      expect(leadTypesAfter[0]).toBe(Type.WATER);
      expect([Type.WATER, Type.ICE].includes(leadTypesAfter[1])).toBeFalsy();
      expect(secondaryTypesAfter.length).toBe(2);
      expect(secondaryTypesAfter[0]).toBe(Type.GHOST);
      expect([Type.GHOST, Type.POISON].includes(secondaryTypesAfter[1])).toBeFalsy();
      expect([Type.GRASS, Type.ELECTRIC].includes(secondaryTypesAfter[1])).toBeTruthy();
      expect(thirdTypesAfter.length).toBe(2);
      expect(thirdTypesAfter[0]).toBe(Type.PSYCHIC);
      expect(secondaryTypesAfter[1]).not.toBe(Type.PSYCHIC);
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.CLOWNING_AROUND, defaultParty);
      await runMysteryEncounterToEnd(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});

async function addItemToPokemon(scene: BattleScene, pokemon: Pokemon, stackCount: integer, itemType: PokemonHeldItemModifierType) {
  const itemMod = itemType.newModifier(pokemon) as PokemonHeldItemModifier;
  itemMod.stackCount = stackCount;
  await scene.addModifier(itemMod, true, false, false, true);
  await scene.updateModifiers(true);
}
