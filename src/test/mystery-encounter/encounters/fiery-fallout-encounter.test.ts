import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { FieryFalloutEncounter } from "#app/data/mystery-encounters/encounters/fiery-fallout-encounter";
import { Gender } from "#app/data/gender";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import * as BattleAnims from "#app/data/battle-anims";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { runMysteryEncounterToEnd, runSelectMysteryEncounterOption, skipBattleRunMysteryEncounterRewardsPhase } from "#test/mystery-encounter/encounter-test-utils";
import { Moves } from "#enums/moves";
import BattleScene from "#app/battle-scene";
import { PokemonHeldItemModifier } from "#app/modifier/modifier";
import { Type } from "#app/data/type";
import { Status, StatusEffect } from "#app/data/status-effect";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import { CommandPhase } from "#app/phases/command-phase";
import { MovePhase } from "#app/phases/move-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";

const namespace = "mysteryEncounters/fieryFallout";
/** Arcanine and Ninetails for 2 Fire types. Lapras, Gengar, Abra for burnable mon. */
const defaultParty = [Species.ARCANINE, Species.NINETALES, Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.VOLCANO;
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
    game.override.mysteryEncounterChance(100);
    game.override.startingWave(defaultWave);
    game.override.startingBiome(defaultBiome);
    game.override.disableTrainerWaves();

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<Biome, MysteryEncounterType[]>([
        [Biome.VOLCANO, [MysteryEncounterType.FIERY_FALLOUT]],
        [Biome.MOUNTAIN, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
      ])
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
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
    game.override.startingBiome(Biome.MOUNTAIN);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.FIERY_FALLOUT);
  });

  it("should not run below wave 41", async () => {
    game.override.startingWave(38);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.FIERY_FALLOUT);
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should initialize fully ", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = FieryFalloutEncounter;
    const weatherSpy = vi.spyOn(scene.arena, "trySetWeather").mockReturnValue(true);
    const moveInitSpy = vi.spyOn(BattleAnims, "initMoveAnim");
    const moveLoadSpy = vi.spyOn(BattleAnims, "loadMoveAnimAssets");

    const { onInit } = FieryFalloutEncounter;

    expect(FieryFalloutEncounter.onInit).toBeDefined();

    FieryFalloutEncounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);

    expect(FieryFalloutEncounter.enemyPartyConfigs).toEqual([
      {
        pokemonConfigs: [
          {
            species: getPokemonSpecies(Species.VOLCARONA),
            isBoss: false,
            gender: Gender.MALE
          },
          {
            species: getPokemonSpecies(Species.VOLCARONA),
            isBoss: false,
            gender: Gender.FEMALE
          }
        ],
        doubleBattle: true,
        disableSwitch: true
      }
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
      const phaseSpy = vi.spyOn(scene, "pushPhase");

      await game.runToMysteryEncounter(MysteryEncounterType.FIERY_FALLOUT, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(2);
      expect(enemyField[0].species.speciesId).toBe(Species.VOLCARONA);
      expect(enemyField[1].species.speciesId).toBe(Species.VOLCARONA);
      expect(enemyField[0].gender).not.toEqual(enemyField[1].gender); // Should be opposite gender

      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof MovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(4);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === Moves.FIRE_SPIN).length).toBe(2); // Fire spin used twice before battle
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === Moves.QUIVER_DANCE).length).toBe(2); // Quiver Dance used twice before battle
    });

    it("should give charcoal to lead pokemon", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIERY_FALLOUT, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);

      const leadPokemonId = scene.getParty()?.[0].id;
      const leadPokemonItems = scene.findModifiers(m => m instanceof PokemonHeldItemModifier
        && (m as PokemonHeldItemModifier).pokemonId === leadPokemonId, true) as PokemonHeldItemModifier[];
      const charcoal = leadPokemonItems.find(i => i.type.name === "Charcoal");
      expect(charcoal).toBeDefined;
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

    it("should damage all non-fire party PKM by 20% and randomly burn 1", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIERY_FALLOUT, defaultParty);

      const party = scene.getParty();
      const lapras = party.find((pkm) => pkm.species.speciesId === Species.LAPRAS)!;
      lapras.status = new Status(StatusEffect.POISON);
      const abra = party.find((pkm) => pkm.species.speciesId === Species.ABRA)!;
      vi.spyOn(abra, "isAllowedInBattle").mockReturnValue(false);

      await runMysteryEncounterToEnd(game, 2);

      const burnablePokemon = party.filter((pkm) => pkm.isAllowedInBattle() && !pkm.getTypes().includes(Type.FIRE));
      const notBurnablePokemon = party.filter((pkm) => !pkm.isAllowedInBattle() || pkm.getTypes().includes(Type.FIRE));
      expect(scene.currentBattle.mysteryEncounter?.dialogueTokens["burnedPokemon"]).toBe("pokemon:gengar");
      burnablePokemon.forEach((pkm) => {
        expect(pkm.hp, `${pkm.name} should have received 20% damage: ${pkm.hp} / ${pkm.getMaxHp()} HP`).toBe(pkm.getMaxHp() - Math.floor(pkm.getMaxHp() * 0.2));
      });
      expect(burnablePokemon.some(pkm => pkm?.status?.effect === StatusEffect.BURN)).toBeTruthy();
      notBurnablePokemon.forEach((pkm) => expect(pkm.hp, `${pkm.name} should be full hp: ${pkm.hp} / ${pkm.getMaxHp()} HP`).toBe(pkm.getMaxHp()));
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
        disabledButtonTooltip: `${namespace}:option.3.disabled_tooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      });
    });

    it("should give charcoal to lead pokemon", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIERY_FALLOUT, defaultParty);
      await runMysteryEncounterToEnd(game, 3);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);

      const leadPokemonId = scene.getParty()?.[0].id;
      const leadPokemonItems = scene.findModifiers(m => m instanceof PokemonHeldItemModifier
        && (m as PokemonHeldItemModifier).pokemonId === leadPokemonId, true) as PokemonHeldItemModifier[];
      const charcoal = leadPokemonItems.find(i => i.type.name === "Charcoal");
      expect(charcoal).toBeDefined;
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.FIERY_FALLOUT, defaultParty);
      await runMysteryEncounterToEnd(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });

    it("should be disabled if not enough FIRE types are in party", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIERY_FALLOUT, [Species.MAGIKARP, Species.ARCANINE]);
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const continueEncounterSpy = vi.spyOn((encounterPhase as MysteryEncounterPhase), "continueEncounter");

      await runSelectMysteryEncounterOption(game, 3);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(MysteryEncounterPhase.name);
      expect(continueEncounterSpy).not.toHaveBeenCalled();
    });
  });
});
