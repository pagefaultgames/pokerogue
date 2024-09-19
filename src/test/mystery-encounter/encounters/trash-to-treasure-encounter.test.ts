import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import * as BattleAnims from "#app/data/battle-anims";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { runMysteryEncounterToEnd, skipBattleRunMysteryEncounterRewardsPhase } from "#test/mystery-encounter/encounter-test-utils";
import { Moves } from "#enums/moves";
import BattleScene from "#app/battle-scene";
import { PokemonMove } from "#app/field/pokemon";
import { Mode } from "#app/ui/ui";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import { HitHealModifier, HealShopCostModifier, TurnHealModifier } from "#app/modifier/modifier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import { TrashToTreasureEncounter } from "#app/data/mystery-encounters/encounters/trash-to-treasure-encounter";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { CommandPhase } from "#app/phases/command-phase";
import { MovePhase } from "#app/phases/move-phase";

const namespace = "mysteryEncounter:trashToTreasure";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.CAVE;
const defaultWave = 45;

describe("Trash to Treasure - Mystery Encounter", () => {
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
        [Biome.CAVE, [MysteryEncounterType.TRASH_TO_TREASURE]],
      ])
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.TRASH_TO_TREASURE, defaultParty);

    expect(TrashToTreasureEncounter.encounterType).toBe(MysteryEncounterType.TRASH_TO_TREASURE);
    expect(TrashToTreasureEncounter.encounterTier).toBe(MysteryEncounterTier.ULTRA);
    expect(TrashToTreasureEncounter.dialogue).toBeDefined();
    expect(TrashToTreasureEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}.intro` }]);
    expect(TrashToTreasureEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}.title`);
    expect(TrashToTreasureEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}.description`);
    expect(TrashToTreasureEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}.query`);
    expect(TrashToTreasureEncounter.options.length).toBe(2);
  });

  it("should not run below wave 10", async () => {
    game.override.startingWave(9);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.TRASH_TO_TREASURE);
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = TrashToTreasureEncounter;
    const moveInitSpy = vi.spyOn(BattleAnims, "initMoveAnim");
    const moveLoadSpy = vi.spyOn(BattleAnims, "loadMoveAnimAssets");

    const { onInit } = TrashToTreasureEncounter;

    expect(TrashToTreasureEncounter.onInit).toBeDefined();

    TrashToTreasureEncounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);

    expect(TrashToTreasureEncounter.enemyPartyConfigs).toEqual([
      {
        levelAdditiveModifier: 1,
        disableSwitch: true,
        pokemonConfigs: [
          {
            species: getPokemonSpecies(Species.GARBODOR),
            isBoss: true,
            formIndex: 1,
            bossSegmentModifier: 1,
            moveSet: [Moves.PAYBACK, Moves.GUNK_SHOT, Moves.STOMPING_TANTRUM, Moves.DRAIN_PUNCH],
          }
        ],
      }
    ]);
    await vi.waitFor(() => expect(moveInitSpy).toHaveBeenCalled());
    await vi.waitFor(() => expect(moveLoadSpy).toHaveBeenCalled());
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Dig for Valuables", () => {
    it("should have the correct properties", () => {
      const option1 = TrashToTreasureEncounter.options[0];
      expect(option1.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option1.dialogue).toBeDefined();
      expect(option1.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        selected: [
          {
            text: `${namespace}.option.1.selected`,
          },
        ],
      });
    });

    it("should give 2 Leftovers, 2 Shell Bell, and Black Sludge", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.TRASH_TO_TREASURE, defaultParty);
      await runMysteryEncounterToEnd(game, 1);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);

      const leftovers = scene.findModifier(m => m instanceof TurnHealModifier) as TurnHealModifier;
      expect(leftovers).toBeDefined();
      expect(leftovers?.stackCount).toBe(2);

      const shellBell = scene.findModifier(m => m instanceof HitHealModifier) as HitHealModifier;
      expect(shellBell).toBeDefined();
      expect(shellBell?.stackCount).toBe(2);

      const blackSludge = scene.findModifier(m => m instanceof HealShopCostModifier) as HealShopCostModifier;
      expect(blackSludge).toBeDefined();
      expect(blackSludge?.stackCount).toBe(1);
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.TRASH_TO_TREASURE, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 2 - Battle Garbodor", () => {
    it("should have the correct properties", () => {
      const option1 = TrashToTreasureEncounter.options[1];
      expect(option1.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option1.dialogue).toBeDefined();
      expect(option1.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
        selected: [
          {
            text: `${namespace}.option.2.selected`,
          },
        ],
      });
    });

    it("should start battle against Garbodor", async () => {
      const phaseSpy = vi.spyOn(scene, "pushPhase");

      await game.runToMysteryEncounter(MysteryEncounterType.TRASH_TO_TREASURE, defaultParty);
      await runMysteryEncounterToEnd(game, 2, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(Species.GARBODOR);
      expect(enemyField[0].moveset).toEqual([new PokemonMove(Moves.PAYBACK), new PokemonMove(Moves.GUNK_SHOT), new PokemonMove(Moves.STOMPING_TANTRUM), new PokemonMove(Moves.DRAIN_PUNCH)]);

      // Should have used moves pre-battle
      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof MovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(2);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === Moves.TOXIC).length).toBe(1);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === Moves.AMNESIA).length).toBe(1);
    });

    it("should have 2 Rogue, 1 Ultra, 1 Great in rewards", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.TRASH_TO_TREASURE, defaultParty);
      await runMysteryEncounterToEnd(game, 2, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(4);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.tier - modifierSelectHandler.options[0].modifierTypeOption.upgradeCount).toEqual(ModifierTier.ROGUE);
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.tier - modifierSelectHandler.options[1].modifierTypeOption.upgradeCount).toEqual(ModifierTier.ROGUE);
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.tier - modifierSelectHandler.options[2].modifierTypeOption.upgradeCount).toEqual(ModifierTier.ULTRA);
      expect(modifierSelectHandler.options[3].modifierTypeOption.type.tier - modifierSelectHandler.options[3].modifierTypeOption.upgradeCount).toEqual(ModifierTier.GREAT);
    });
  });
});
