import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { BiomeId } from "#app/enums/biome-id";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { SpeciesId } from "#app/enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  runMysteryEncounterToEnd,
  runSelectMysteryEncounterOption,
  skipBattleRunMysteryEncounterRewardsPhase,
} from "#test/mystery-encounter/encounter-test-utils";
import { MoveId } from "#enums/move-id";
import type BattleScene from "#app/battle-scene";
import { PokemonMove } from "#app/field/pokemon";
import { UiMode } from "#enums/ui-mode";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/testUtils/gameManagerUtils";
import { TrainerType } from "#enums/trainer-type";
import { MysteryEncounterPhase, MysteryEncounterRewardsPhase } from "#app/phases/mystery-encounter-phases";
import { CommandPhase } from "#app/phases/command-phase";
import * as encounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import { SkyBattleEncounter } from "#app/data/mystery-encounters/encounters/sky-battle-encounter";
import { Button } from "#enums/buttons";

const namespace = "mysteryEncounters/skyBattle";
const defaultParty = [SpeciesId.RAYQUAZA, SpeciesId.WEEDLE, SpeciesId.FLYGON, SpeciesId.RATTATA, SpeciesId.AERODACTYL];
const defaultBiome = BiomeId.BEACH;
const defaultWave = 52;

const POOL_0_POKEMON = [
  SpeciesId.CHARIZARD,
  SpeciesId.BUTTERFREE,
  SpeciesId.PIDGEOTTO,
  SpeciesId.PIDGEOT,
  SpeciesId.FEAROW,
  SpeciesId.ZUBAT,
  SpeciesId.GOLBAT,
  SpeciesId.HAUNTER,
  SpeciesId.KOFFING,
  SpeciesId.WEEZING,
  SpeciesId.SCYTHER,
  SpeciesId.GYARADOS,
  SpeciesId.AERODACTYL,
  SpeciesId.ARTICUNO,
  SpeciesId.ZAPDOS,
  SpeciesId.MOLTRES,
  SpeciesId.DRAGONITE,
  SpeciesId.NOCTOWL,
  SpeciesId.LEDYBA,
  SpeciesId.LEDIAN,
  SpeciesId.CROBAT,
  SpeciesId.TOGETIC,
  SpeciesId.XATU,
  SpeciesId.HOPPIP,
  SpeciesId.SKIPLOOM,
  SpeciesId.JUMPLUFF,
  SpeciesId.YANMA,
  SpeciesId.MISDREAVUS,
  SpeciesId.UNOWN,
  SpeciesId.GLIGAR,
  SpeciesId.MANTINE,
  SpeciesId.SKARMORY,
  SpeciesId.LUGIA,
  SpeciesId.HO_OH,
  SpeciesId.BEAUTIFLY,
  SpeciesId.SWELLOW,
  SpeciesId.WINGULL,
  SpeciesId.PELIPPER,
  SpeciesId.MASQUERAIN,
  SpeciesId.NINJASK,
  SpeciesId.VIBRAVA,
  SpeciesId.FLYGON,
  SpeciesId.SWABLU,
  SpeciesId.ALTARIA,
  SpeciesId.LUNATONE,
  SpeciesId.SOLROCK,
  SpeciesId.BALTOY,
  SpeciesId.CLAYDOL,
  SpeciesId.DUSKULL,
  SpeciesId.TROPIUS,
  SpeciesId.CHIMECHO,
  SpeciesId.SALAMENCE,
  SpeciesId.LATIAS,
  SpeciesId.LATIOS,
  SpeciesId.RAYQUAZA,
  SpeciesId.STARAVIA,
  SpeciesId.STARAPTOR,
  SpeciesId.MOTHIM,
  SpeciesId.COMBEE,
  SpeciesId.VESPIQUEN,
  SpeciesId.DRIFLOON,
  SpeciesId.DRIFBLIM,
  SpeciesId.MISMAGIUS,
  SpeciesId.HONCHKROW,
  SpeciesId.CHINGLING,
  SpeciesId.BRONZOR,
  SpeciesId.BRONZONG,
  SpeciesId.CARNIVINE,
  SpeciesId.MANTYKE,
  SpeciesId.TOGEKISS,
  SpeciesId.YANMEGA,
  SpeciesId.GLISCOR,
  SpeciesId.ROTOM,
  SpeciesId.UXIE,
  SpeciesId.MESPRIT,
  SpeciesId.AZELF,
  SpeciesId.CRESSELIA,
  SpeciesId.TRANQUILL,
  SpeciesId.UNFEZANT,
  SpeciesId.WOOBAT,
  SpeciesId.SWOOBAT,
  SpeciesId.SIGILYPH,
  SpeciesId.ARCHEOPS,
  SpeciesId.SWANNA,
  SpeciesId.EMOLGA,
  SpeciesId.TYNAMO,
  SpeciesId.EELEKTRIK,
  SpeciesId.EELEKTROSS,
  SpeciesId.CRYOGONAL,
  SpeciesId.BRAVIARY,
  SpeciesId.MANDIBUZZ,
  SpeciesId.HYDREIGON,
  SpeciesId.TORNADUS,
  SpeciesId.THUNDURUS,
  SpeciesId.LANDORUS,
  SpeciesId.FLETCHINDER,
  SpeciesId.TALONFLAME,
  SpeciesId.VIVILLON,
  SpeciesId.NOIBAT,
  SpeciesId.NOIVERN,
  SpeciesId.YVELTAL,
];

const PHYSICAL_TUTOR_MOVES = [
  MoveId.FLY,
  MoveId.BRAVE_BIRD,
  MoveId.ACROBATICS,
  MoveId.DRAGON_ASCENT,
  MoveId.BEAK_BLAST,
  MoveId.FLOATY_FALL,
  MoveId.DUAL_WINGBEAT,
];

const SPECIAL_TUTOR_MOVES = [MoveId.AEROBLAST, MoveId.AIR_SLASH, MoveId.HURRICANE, MoveId.BLEAKWIND_STORM];

const SUPPORT_TUTOR_MOVES = [MoveId.FEATHER_DANCE, MoveId.ROOST, MoveId.PLUCK, MoveId.TAILWIND];

describe("Sky Battle - Mystery Encounter", () => {
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
      new Map<BiomeId, MysteryEncounterType[]>([[BiomeId.BEACH, [MysteryEncounterType.SKY_BATTLE]]]),
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.SKY_BATTLE, defaultParty);

    expect(SkyBattleEncounter.encounterType).toBe(MysteryEncounterType.SKY_BATTLE);
    expect(SkyBattleEncounter.encounterTier).toBe(MysteryEncounterTier.ULTRA);
    expect(SkyBattleEncounter.dialogue).toBeDefined();
    expect(SkyBattleEncounter.dialogue.intro).toStrictEqual([
      {
        text: `${namespace}:intro`,
      },
      {
        speaker: `${namespace}:speaker`,
        text: `${namespace}:intro_dialogue`,
      },
    ]);
    expect(SkyBattleEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(SkyBattleEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(SkyBattleEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(SkyBattleEncounter.options.length).toBe(3);
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = SkyBattleEncounter;

    const { onInit } = SkyBattleEncounter;

    expect(SkyBattleEncounter.onInit).toBeDefined();

    SkyBattleEncounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();
    const config = SkyBattleEncounter.enemyPartyConfigs[0];

    expect(config).toBeDefined();
    expect(config.trainerConfig?.trainerType).toBe(TrainerType.SKY_TRAINER);
    expect(config.trainerConfig?.partyTemplates).toBeDefined();
    // Allows any gender (randomized)
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Battle the Sky Trainer", () => {
    it("should have the correct properties", () => {
      const option = SkyBattleEncounter.options[0];
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

    it("should start battle against the Sky Trainer", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.SKY_BATTLE, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.SKY_TRAINER);
      //Ensure the number of enemy pokemon match our party
      expect(enemyParty.length).toBe(scene.getPlayerParty().length);
      expect(enemyParty.every(pkm => POOL_0_POKEMON.includes(pkm.species.speciesId)));
    });

    it("should zero disallowed moves' pp", async () => {
      game.override.moveset([MoveId.DRAGON_CLAW, MoveId.EARTHQUAKE]);
      await game.runToMysteryEncounter(MysteryEncounterType.SKY_BATTLE, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      await skipBattleRunMysteryEncounterRewardsPhase(game, false);

      // Only allow acceptable moves (setting available pp to 0)
      const moveGood = scene.getPlayerParty()[0].getMoveset()[0];
      const moveBad = scene.getPlayerParty()[0].getMoveset()[1];
      expect(moveBad.ppUsed).toBe(moveBad.getMovePp());
      expect(moveGood.ppUsed).toBe(0);

      game.phaseInterceptor["prompts"] = []; // Clear out prompt handlers
      game.onNextPrompt("MysteryEncounterRewardsPhase", UiMode.OPTION_SELECT, () => {
        game.scene.ui.setCursor(3);
        game.scene.ui.processInput(Button.ACTION);
      });
      await game.phaseInterceptor.run(MysteryEncounterRewardsPhase);

      // Return unacceptable moves' pp
      const moveBadAfter = scene.getPlayerParty()[0].getMoveset()[1];
      expect(moveBadAfter.ppUsed).toBe(0);
    });

    it("should remove ineligeble pokemon from player party", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.SKY_BATTLE, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      await skipBattleRunMysteryEncounterRewardsPhase(game, false);

      // Only allow acceptable pokemon
      expect(scene.getPlayerParty().length).toBe(3); // we have 2 ineligle pokemon in the default party
      expect(
        scene
          .getPlayerParty()
          .every(pokemon => ![SpeciesId.WEEDLE, SpeciesId.RATTATA].includes(pokemon.species.speciesId)),
      ).toBe(true);

      game.phaseInterceptor["prompts"] = []; // Clear out prompt handlers
      game.onNextPrompt("MysteryEncounterRewardsPhase", UiMode.OPTION_SELECT, () => {
        game.scene.ui.setCursor(3);
        game.scene.ui.processInput(Button.ACTION);
      });
      await game.phaseInterceptor.run(MysteryEncounterRewardsPhase);

      // Return unacceptable pokemons to party
      expect(scene.getPlayerParty().length).toBe(defaultParty.length);
      expect(scene.getPlayerParty()[1].species.speciesId).toBe(SpeciesId.WEEDLE);
      expect(scene.getPlayerParty()[3].species.speciesId).toBe(SpeciesId.RATTATA);
    });

    it("should let the player learn a Flying move after battle ends", async () => {
      const selectOptionSpy = vi.spyOn(encounterPhaseUtils, "selectOptionThenPokemon");
      await game.runToMysteryEncounter(MysteryEncounterType.SKY_BATTLE, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game, false);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(MysteryEncounterRewardsPhase.name);
      game.phaseInterceptor["prompts"] = []; // Clear out prompt handlers
      game.onNextPrompt("MysteryEncounterRewardsPhase", UiMode.OPTION_SELECT, () => {
        game.phaseInterceptor.superEndPhase();
      });
      await game.phaseInterceptor.run(MysteryEncounterRewardsPhase);

      expect(selectOptionSpy).toHaveBeenCalledTimes(1);
      const optionData = selectOptionSpy.mock.calls[0][0];
      expect(PHYSICAL_TUTOR_MOVES.some(move => new PokemonMove(move).getName() === optionData[0].label)).toBe(true);
      expect(SPECIAL_TUTOR_MOVES.some(move => new PokemonMove(move).getName() === optionData[1].label)).toBe(true);
      expect(SUPPORT_TUTOR_MOVES.some(move => new PokemonMove(move).getName() === optionData[2].label)).toBe(true);
    });
  });

  describe("Option 2 - Show off Flying Types", () => {
    it("should have the correct properties", () => {
      const option = SkyBattleEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        disabledButtonTooltip: `${namespace}:option.2.disabled_tooltip`,
      });
    });

    it("should NOT be selectable if the player doesn't have enough Flying pokemon", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.SKY_BATTLE, [
        SpeciesId.ABRA,
        SpeciesId.PIDGEY,
        SpeciesId.SPEAROW,
      ]);
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 2);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(MysteryEncounterPhase.name);
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    it("should proceed to rewards screen with reward options", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.SKY_BATTLE, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(3);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toBe("QUICK_CLAW");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toBe("MAX_LURE");
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toBe("ULTRA_BALL");
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(encounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.SKY_BATTLE, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - Reject battle", () => {
    it("should have the correct properties", async () => {
      const option = SkyBattleEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      });
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(encounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.SKY_BATTLE, [SpeciesId.RAYQUAZA]);
      await runMysteryEncounterToEnd(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
