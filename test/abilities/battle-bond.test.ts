import { allMoves } from "#data/data-lists";
import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MultiHitType } from "#enums/multi-hit-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Battle Bond", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  describe("Greninja", () => {
    const baseForm = 1;
    const ashForm = 2;

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .battleStyle("single")
        .startingWave(4) // Leads to arena reset on Wave 5 trainer battle
        .ability(AbilityId.BATTLE_BOND)
        .starterForms({ [SpeciesId.GRENINJA]: ashForm })
        .enemySpecies(SpeciesId.BULBASAUR)
        .enemyMoveset(MoveId.SPLASH)
        .startingLevel(100) // Avoid levelling up
        .enemyLevel(1000); // Avoid opponent dying before `doKillOpponents()`
    });

    it("check if fainted pokemon switches to base form on arena reset", async () => {
      await game.classicMode.startBattle(SpeciesId.MAGIKARP, SpeciesId.GRENINJA);

      const greninja = game.scene.getPlayerParty()[1];
      expect(greninja.formIndex).toBe(ashForm);

      greninja.hp = 0;
      greninja.status = new Status(StatusEffect.FAINT);
      expect(greninja.isFainted()).toBe(true);

      game.move.use(MoveId.SPLASH);
      await game.doKillOpponents();
      await game.phaseInterceptor.to("TurnEndPhase");
      game.doSelectModifier();
      await game.phaseInterceptor.to("QuietFormChangePhase");

      expect(greninja.formIndex).toBe(baseForm);
    });

    it("should not keep buffing Water Shuriken after Greninja switches to base form", async () => {
      await game.classicMode.startBattle(SpeciesId.GRENINJA);

      const waterShuriken = allMoves[MoveId.WATER_SHURIKEN];
      vi.spyOn(waterShuriken, "calculateBattlePower");

      let actualMultiHitType: MultiHitType | null = null;
      const multiHitAttr = waterShuriken.getAttrs("MultiHitAttr")[0];
      vi.spyOn(multiHitAttr, "getHitCount").mockImplementation(() => {
        actualMultiHitType = multiHitAttr.getMultiHitType();
        return 3;
      });

      // Wave 4: Use Water Shuriken in Ash form
      let expectedBattlePower = 20;
      let expectedMultiHitType = MultiHitType.THREE;

      game.move.use(MoveId.WATER_SHURIKEN);
      await game.phaseInterceptor.to("BerryPhase", false);
      expect(waterShuriken.calculateBattlePower).toHaveLastReturnedWith(expectedBattlePower);
      expect(actualMultiHitType).toBe(expectedMultiHitType);

      await game.doKillOpponents();
      await game.toNextWave();

      // Wave 5: Use Water Shuriken in base form
      expectedBattlePower = 15;
      expectedMultiHitType = MultiHitType.TWO_TO_FIVE;

      game.move.use(MoveId.WATER_SHURIKEN);
      await game.phaseInterceptor.to("BerryPhase", false);
      expect(waterShuriken.calculateBattlePower).toHaveLastReturnedWith(expectedBattlePower);
      expect(actualMultiHitType).toBe(expectedMultiHitType);
    });
  });

  describe("Non-Greninja and Fusions", () => {
    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .ability(AbilityId.BATTLE_BOND)
        .battleStyle("single")
        .criticalHits(false)
        .startingLevel(100)
        .enemyLevel(1)
        .enemySpecies(SpeciesId.MAGIKARP)
        .enemyAbility(AbilityId.BALL_FETCH)
        .enemyMoveset(MoveId.SPLASH);
    });

    it("should increase Attack, Special Attack, and Speed stages by 1 on KO once per switch-in", async () => {
      await game.classicMode.startBattle(SpeciesId.MILOTIC, SpeciesId.FEEBAS);

      game.move.use(MoveId.THUNDERBOLT);
      await game.toEndOfTurn();

      const player = game.field.getPlayerPokemon();
      expect(player).toHaveStatStage(Stat.ATK, 1);
      expect(player).toHaveStatStage(Stat.SPATK, 1);
      expect(player).toHaveStatStage(Stat.SPD, 1);

      await game.toNextWave();
      game.move.use(MoveId.THUNDERBOLT);
      await game.toEndOfTurn();

      expect(player).toHaveStatStage(Stat.ATK, 1);
      expect(player).toHaveStatStage(Stat.SPATK, 1);
      expect(player).toHaveStatStage(Stat.SPD, 1);

      await game.toNextWave();
      game.doSwitchPokemon(1);
      await game.toNextTurn();
      game.doSwitchPokemon(1);
      await game.toNextTurn();

      expect(player).toHaveStatStage(Stat.ATK, 0);
      expect(player).toHaveStatStage(Stat.SPATK, 0);
      expect(player).toHaveStatStage(Stat.SPD, 0);

      game.move.use(MoveId.THUNDERBOLT);
      await game.toEndOfTurn();

      expect(player).toHaveStatStage(Stat.ATK, 1);
      expect(player).toHaveStatStage(Stat.SPATK, 1);
      expect(player).toHaveStatStage(Stat.SPD, 1);
    });

    it.each([
      { baseSpecies: SpeciesId.GRENINJA, fusionSpecies: SpeciesId.MILOTIC, slot: "Base" },
      { baseSpecies: SpeciesId.MILOTIC, fusionSpecies: SpeciesId.GRENINJA, slot: "Fusion" },
    ])("should increase Attack, Special Attack, and Speed stages by 1 for fusions even if the $slot species of the fusion is Greninja", async ({
      baseSpecies,
      fusionSpecies,
    }) => {
      game.override.starterFusionSpecies(fusionSpecies).enableStarterFusion();
      await game.classicMode.startBattle(baseSpecies);

      game.move.use(MoveId.THUNDERBOLT);
      await game.toEndOfTurn();

      const player = game.field.getPlayerPokemon();
      expect(player.isFusion()).toBe(true);
      expect(player).toHaveStatStage(Stat.ATK, 1);
      expect(player).toHaveStatStage(Stat.SPATK, 1);
      expect(player).toHaveStatStage(Stat.SPD, 1);
    });
  });
});
