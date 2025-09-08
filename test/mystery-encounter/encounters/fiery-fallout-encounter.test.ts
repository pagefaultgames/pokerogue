import type { BattleScene } from "#app/battle-scene";
import * as BattleAnims from "#data/battle-anims";
import { Gender } from "#data/gender";
import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { AttackTypeBoosterModifier, PokemonHeldItemModifier } from "#modifiers/modifier";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import { FieryFalloutEncounter } from "#mystery-encounters/fiery-fallout-encounter";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { MovePhase } from "#phases/move-phase";
import { MysteryEncounterPhase } from "#phases/mystery-encounter-phases";
import { SelectModifierPhase } from "#phases/select-modifier-phase";
import {
  runMysteryEncounterToEnd,
  runSelectMysteryEncounterOption,
  skipBattleRunMysteryEncounterRewardsPhase,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/fieryFallout";
/** Arcanine and Ninetails for 2 Fire types. Lapras, Gengar, Abra for burnable mon. */
const defaultParty = [SpeciesId.ARCANINE, SpeciesId.NINETALES, SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.VOLCANO;
const defaultWave = 56;

describe("Fiery Fallout - Mystery Encounter", () => {
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
      .disableTrainerWaves()
      .moveset([MoveId.PAYBACK, MoveId.THUNDERBOLT]); // Required for attack type booster item generation

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<BiomeId, MysteryEncounterType[]>([
        [BiomeId.VOLCANO, [MysteryEncounterType.FIERY_FALLOUT]],
        [BiomeId.MOUNTAIN, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
      ]),
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.FIERY_FALLOUT, defaultParty);

    expect(FieryFalloutEncounter.encounterType).toBe(MysteryEncounterType.FIERY_FALLOUT);
    expect(FieryFalloutEncounter.encounterTier).toBe(MysteryEncounterTier.COMMON);
    expect(FieryFalloutEncounter.dialogue).toBeDefined();
    expect(FieryFalloutEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}:intro` }]);
    expect(FieryFalloutEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(FieryFalloutEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(FieryFalloutEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(FieryFalloutEncounter.options.length).toBe(3);
  });

  it("should not spawn outside of volcano biome", async () => {
    game.override.startingBiome(BiomeId.MOUNTAIN);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.FIERY_FALLOUT);
  });

  it("should not run below wave 41", async () => {
    game.override.startingWave(38);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.FIERY_FALLOUT);
  });

  it("should initialize fully ", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = FieryFalloutEncounter;
    const weatherSpy = vi.spyOn(scene.arena, "trySetWeather").mockReturnValue(true);
    const moveInitSpy = vi.spyOn(BattleAnims, "initMoveAnim");
    const moveLoadSpy = vi.spyOn(BattleAnims, "loadMoveAnimAssets");

    const { onInit } = FieryFalloutEncounter;

    expect(FieryFalloutEncounter.onInit).toBeDefined();

    FieryFalloutEncounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();

    expect(FieryFalloutEncounter.enemyPartyConfigs).toEqual([
      {
        pokemonConfigs: [
          {
            species: getPokemonSpecies(SpeciesId.VOLCARONA),
            isBoss: false,
            gender: Gender.MALE,
            tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
            mysteryEncounterBattleEffects: expect.any(Function),
          },
          {
            species: getPokemonSpecies(SpeciesId.VOLCARONA),
            isBoss: false,
            gender: Gender.FEMALE,
            tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
            mysteryEncounterBattleEffects: expect.any(Function),
          },
        ],
        doubleBattle: true,
        disableSwitch: true,
      },
    ]);
    expect(weatherSpy).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(moveInitSpy).toHaveBeenCalled());
    await vi.waitFor(() => expect(moveLoadSpy).toHaveBeenCalled());
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Fight 2 Volcarona", () => {
    it("should have the correct properties", () => {
      const option1 = FieryFalloutEncounter.options[0];
      expect(option1.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option1.dialogue).toBeDefined();
      expect(option1.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selected`,
          },
        ],
      });
    });

    it("should start battle against 2 Volcarona", async () => {
      const phaseSpy = vi.spyOn(scene.phaseManager, "pushPhase");

      await game.runToMysteryEncounter(MysteryEncounterType.FIERY_FALLOUT, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyField.length).toBe(2);
      expect(enemyField[0].species.speciesId).toBe(SpeciesId.VOLCARONA);
      expect(enemyField[1].species.speciesId).toBe(SpeciesId.VOLCARONA);
      expect(enemyField[0].gender).not.toEqual(enemyField[1].gender); // Should be opposite gender

      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof MovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(2);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === MoveId.FIRE_SPIN).length).toBe(2); // Fire spin used twice before battle
    });

    it("should give attack type boosting item to lead pokemon", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIERY_FALLOUT, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(game).toBeAtPhase("SelectModifierPhase");

      const leadPokemonId = scene.getPlayerParty()?.[0].id;
      const leadPokemonItems = scene.findModifiers(
        m => m instanceof PokemonHeldItemModifier && (m as PokemonHeldItemModifier).pokemonId === leadPokemonId,
        true,
      ) as PokemonHeldItemModifier[];
      const item = leadPokemonItems.find(i => i instanceof AttackTypeBoosterModifier);
      expect(item).toBeDefined;
    });
  });

  describe("Option 2 - Suffer the weather", () => {
    it("should have the correct properties", () => {
      const option1 = FieryFalloutEncounter.options[1];
      expect(option1.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option1.dialogue).toBeDefined();
      expect(option1.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          },
        ],
      });
    });

    it("should damage all non-fire party PKM by 20%, and burn + give Heatproof to a random Pokemon", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIERY_FALLOUT, defaultParty);

      const party = scene.getPlayerParty();
      const lapras = party.find(pkm => pkm.species.speciesId === SpeciesId.LAPRAS)!;
      lapras.status = new Status(StatusEffect.POISON);
      const abra = party.find(pkm => pkm.species.speciesId === SpeciesId.ABRA)!;
      vi.spyOn(abra, "isAllowedInBattle").mockReturnValue(false);

      await runMysteryEncounterToEnd(game, 2);

      const burnablePokemon = party.filter(
        pkm => pkm.isAllowedInBattle() && !pkm.getTypes().includes(PokemonType.FIRE),
      );
      const notBurnablePokemon = party.filter(
        pkm => !pkm.isAllowedInBattle() || pkm.getTypes().includes(PokemonType.FIRE),
      );
      expect(scene.currentBattle.mysteryEncounter?.dialogueTokens["burnedPokemon"]).toBe(i18next.t("pokemon:gengar"));
      burnablePokemon.forEach(pkm => {
        expect(pkm.hp, `${pkm.name} should have received 20% damage: ${pkm.hp} / ${pkm.getMaxHp()} HP`).toBe(
          pkm.getMaxHp() - Math.floor(pkm.getMaxHp() * 0.2),
        );
      });
      expect(burnablePokemon.some(pkm => pkm.status?.effect === StatusEffect.BURN)).toBeTruthy();
      expect(burnablePokemon.some(pkm => pkm.customPokemonData.ability === AbilityId.HEATPROOF));
      notBurnablePokemon.forEach(pkm =>
        expect(pkm.hp, `${pkm.name} should be full hp: ${pkm.hp} / ${pkm.getMaxHp()} HP`).toBe(pkm.getMaxHp()),
      );
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.FIERY_FALLOUT, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - use FIRE types", () => {
    it("should have the correct properties", () => {
      const option1 = FieryFalloutEncounter.options[2];
      expect(option1.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL);
      expect(option1.dialogue).toBeDefined();
      expect(option1.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        disabledButtonTooltip: `${namespace}:option.3.disabledTooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      });
    });

    it("should give attack type boosting item to lead pokemon", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIERY_FALLOUT, defaultParty);
      await runMysteryEncounterToEnd(game, 3);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(game).toBeAtPhase("SelectModifierPhase");

      const leadPokemonItems = scene.getPlayerParty()[0].getHeldItems() as PokemonHeldItemModifier[];
      const item = leadPokemonItems.find(i => i instanceof AttackTypeBoosterModifier);
      expect(item).toBeDefined;
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.FIERY_FALLOUT, defaultParty);
      await runMysteryEncounterToEnd(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });

    it("should be disabled if not enough FIRE types are in party", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIERY_FALLOUT, [SpeciesId.MAGIKARP]);
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.phaseManager.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const continueEncounterSpy = vi.spyOn(encounterPhase as MysteryEncounterPhase, "continueEncounter");

      await runSelectMysteryEncounterOption(game, 3);

      expect(game).toBeAtPhase("MysteryEncounterPhase");
      expect(continueEncounterSpy).not.toHaveBeenCalled();
    });
  });
});
