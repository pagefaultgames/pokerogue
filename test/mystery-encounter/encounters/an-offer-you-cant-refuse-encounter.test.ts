import type { BattleScene } from "#app/battle-scene";
import { AbilityId } from "#enums/ability-id";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { ShinyRateBoosterModifier } from "#modifiers/modifier";
import { AnOfferYouCantRefuseEncounter } from "#mystery-encounters/an-offer-you-cant-refuse-encounter";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { HUMAN_TRANSITABLE_BIOMES } from "#mystery-encounters/mystery-encounters";
import { SelectModifierPhase } from "#phases/select-modifier-phase";
import { runMysteryEncounterToEnd } from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/anOfferYouCantRefuse";
/** Gyarados for Indimidate */
const defaultParty = [SpeciesId.GYARADOS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.CAVE;
const defaultWave = 45;

describe("An Offer You Can't Refuse - Mystery Encounter", () => {
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
      .ability(AbilityId.INTIMIDATE); // Extortion ability

    const biomeMap = new Map<BiomeId, MysteryEncounterType[]>([
      [BiomeId.VOLCANO, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
    ]);
    HUMAN_TRANSITABLE_BIOMES.forEach(biome => {
      biomeMap.set(biome, [MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE, defaultParty);

    expect(AnOfferYouCantRefuseEncounter.encounterType).toBe(MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE);
    expect(AnOfferYouCantRefuseEncounter.encounterTier).toBe(MysteryEncounterTier.GREAT);
    expect(AnOfferYouCantRefuseEncounter.dialogue).toBeDefined();
    expect(AnOfferYouCantRefuseEncounter.dialogue.intro).toStrictEqual([
      { text: `${namespace}:intro` },
      { speaker: `${namespace}:speaker`, text: `${namespace}:introDialogue` },
    ]);
    expect(AnOfferYouCantRefuseEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(AnOfferYouCantRefuseEncounter.dialogue.encounterOptionsDialogue?.description).toBe(
      `${namespace}:description`,
    );
    expect(AnOfferYouCantRefuseEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(AnOfferYouCantRefuseEncounter.options.length).toBe(3);
  });

  it("should not spawn outside of HUMAN_TRANSITABLE_BIOMES", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.GREAT).startingBiome(BiomeId.VOLCANO);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(
      MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE,
    );
  });

  it("should initialize fully ", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = AnOfferYouCantRefuseEncounter;

    const { onInit } = AnOfferYouCantRefuseEncounter;

    expect(AnOfferYouCantRefuseEncounter.onInit).toBeDefined();

    AnOfferYouCantRefuseEncounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();

    expect(AnOfferYouCantRefuseEncounter.dialogueTokens?.strongestPokemon).toBeDefined();
    expect(AnOfferYouCantRefuseEncounter.dialogueTokens?.price).toBeDefined();
    expect(AnOfferYouCantRefuseEncounter.dialogueTokens?.option2PrimaryAbility).toBe(
      i18next.t("ability:intimidate.name"),
    );
    expect(AnOfferYouCantRefuseEncounter.dialogueTokens?.moveOrAbility).toBe(i18next.t("ability:intimidate.name"));
    expect(AnOfferYouCantRefuseEncounter.misc.pokemon.isPlayer()).toBeTruthy();
    expect(AnOfferYouCantRefuseEncounter.misc?.price?.toString()).toBe(
      AnOfferYouCantRefuseEncounter.dialogueTokens?.price,
    );
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Sell your Pokemon for money and a Shiny Charm", () => {
    it("should have the correct properties", () => {
      const option = AnOfferYouCantRefuseEncounter.options[0];
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

    it("Should update the player's money properly", async () => {
      const initialMoney = 20000;
      scene.money = initialMoney;
      const updateMoneySpy = vi.spyOn(EncounterPhaseUtils, "updatePlayerMoney");

      await game.runToMysteryEncounter(MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      const price = scene.currentBattle.mysteryEncounter!.misc.price;

      expect(updateMoneySpy).toHaveBeenCalledWith(price);
      expect(scene.money).toBe(initialMoney + price);
    });

    it("Should give the player a Shiny Charm", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      const itemModifier = scene.findModifier(m => m instanceof ShinyRateBoosterModifier) as ShinyRateBoosterModifier;

      expect(itemModifier).toBeDefined();
      expect(itemModifier?.stackCount).toBe(1);
    });

    it("Should remove the Pokemon from the party", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE, defaultParty);

      const initialPartySize = scene.getPlayerParty().length;
      const pokemonName = scene.currentBattle.mysteryEncounter!.misc.pokemon.name;

      await runMysteryEncounterToEnd(game, 1);

      expect(scene.getPlayerParty().length).toBe(initialPartySize - 1);
      expect(scene.getPlayerParty().find(p => p.name === pokemonName)).toBeUndefined();
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 2 - Extort the Kid", () => {
    it("should have the correct properties", () => {
      const option = AnOfferYouCantRefuseEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        disabledButtonTooltip: `${namespace}:option.2.tooltipDisabled`,
        selected: [
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.2.selected`,
          },
        ],
      });
    });

    it("should award EXP to a pokemon with an ability in EXTORTION_ABILITIES", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE, defaultParty);
      const party = scene.getPlayerParty();
      const gyarados = party.find(pkm => pkm.species.speciesId === SpeciesId.GYARADOS)!;
      const expBefore = gyarados.exp;

      await runMysteryEncounterToEnd(game, 2);
      await game.phaseInterceptor.to(SelectModifierPhase, false);

      expect(gyarados.exp).toBe(
        expBefore + Math.floor((getPokemonSpecies(SpeciesId.LIEPARD).baseExp * defaultWave) / 5 + 1),
      );
    });

    it("should award EXP to a pokemon with a move in EXTORTION_MOVES", async () => {
      game.override.ability(AbilityId.SYNCHRONIZE); // Not an extortion ability, so we can test extortion move
      await game.runToMysteryEncounter(MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE, [SpeciesId.ABRA]);
      const abra = game.field.getPlayerPokemon();
      game.move.changeMoveset(abra, MoveId.BEAT_UP);
      const expBefore = abra.exp;

      await runMysteryEncounterToEnd(game, 2);
      await game.phaseInterceptor.to(SelectModifierPhase, false);

      expect(abra.exp).toBe(
        expBefore + Math.floor((getPokemonSpecies(SpeciesId.LIEPARD).baseExp * defaultWave) / 5 + 1),
      );
    });

    it("Should update the player's money properly", async () => {
      const initialMoney = 20000;
      scene.money = initialMoney;
      const updateMoneySpy = vi.spyOn(EncounterPhaseUtils, "updatePlayerMoney");

      await game.runToMysteryEncounter(MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      const price = scene.currentBattle.mysteryEncounter!.misc.price;

      expect(updateMoneySpy).toHaveBeenCalledWith(price);
      expect(scene.money).toBe(initialMoney + price);
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - Leave", () => {
    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE, defaultParty);
      await runMysteryEncounterToEnd(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
