import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import type { StatStageChangeCallback } from "#types/stat-change";
import { groupStatChange } from "#utils/stat-change";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("StatStageChangePhase", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .criticalHits(false)
      .battleStyle("single")
      .enemySpecies(SpeciesId.RATTATA)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.BALL_FETCH)
      .passiveAbility(AbilityId.NO_GUARD)
      .enemyMoveset(MoveId.SPLASH);
  });

  describe("groupStatChange", () => {
    it("should produce one StatChange per stat with the shared stage change", () => {
      const changes = groupStatChange([Stat.ATK, Stat.DEF, Stat.SPD], -1);

      expect(changes).toEqual([
        { stat: Stat.ATK, stages: -1 },
        { stat: Stat.DEF, stages: -1 },
        { stat: Stat.SPD, stages: -1 },
      ]);
    });

    it("should return an empty array when given no stats", () => {
      expect(groupStatChange([], 2)).toEqual([]);
    });
  });

  describe("basic application", () => {
    it("should raise a single stat by the correct amount", async () => {
      await game.classicMode.startBattle(SpeciesId.MIGHTYENA);
      const player = game.field.getPlayerPokemon();

      game.move.use(MoveId.SWORDS_DANCE);
      await game.toNextTurn();

      expect(player).toHaveStatStage(Stat.ATK, 2);
    });

    it("should lower multiple stats by the correct amount", async () => {
      await game.classicMode.startBattle(SpeciesId.MIGHTYENA);
      const player = game.field.getPlayerPokemon();

      game.move.use(MoveId.CLOSE_COMBAT);
      await game.toEndOfTurn();

      expect(player).toHaveStatStage(Stat.DEF, -1);
      expect(player).toHaveStatStage(Stat.SPDEF, -1);
    });

    it("should accumulate across turns", async () => {
      await game.classicMode.startBattle(SpeciesId.MIGHTYENA);
      const enemy = game.field.getEnemyPokemon();

      game.move.use(MoveId.GROWL);
      await game.toNextTurn();
      expect(enemy).toHaveStatStage(Stat.ATK, -1);

      game.move.use(MoveId.GROWL);
      await game.toEndOfTurn();
      expect(enemy).toHaveStatStage(Stat.ATK, -2);
    });
  });

  describe("clamping", () => {
    it("should not exceed +6", async () => {
      await game.classicMode.startBattle(SpeciesId.MIGHTYENA);
      const player = game.field.getPlayerPokemon();

      player.setStatStage(Stat.ATK, 5);

      game.move.use(MoveId.SWORDS_DANCE);
      await game.toEndOfTurn();

      expect(player).toHaveStatStage(Stat.ATK, 6);
    });

    it("should not drop below -6", async () => {
      await game.classicMode.startBattle(SpeciesId.MIGHTYENA);
      const enemy = game.field.getEnemyPokemon();

      enemy.setStatStage(Stat.ATK, -6);

      game.move.use(MoveId.GROWL);
      await game.toEndOfTurn();

      expect(enemy).toHaveStatStage(Stat.ATK, -6);
    });

    it("should report the clamped change to the onChange callback", async () => {
      await game.classicMode.startBattle(SpeciesId.MIGHTYENA);
      const player = game.field.getPlayerPokemon();
      player.setStatStage(Stat.ATK, 5);
      const onChange = vi.fn<StatStageChangeCallback>();
      game.scene.phaseManager.unshiftNew("StatStageChangePhase", {
        battlerIndex: player.getBattlerIndex(),
        changes: groupStatChange([Stat.ATK], 3),
        sourcePokemon: player,
        onChange,
      });

      game.move.use(MoveId.SPLASH);
      await game.toEndOfTurn();

      expect(onChange).toHaveBeenCalledExactlyOnceWith(player, [{ stat: Stat.ATK, stages: 1 }]);
      expect(player).toHaveStatStage(Stat.ATK, 6);
    });
  });

  describe("sign splitting", () => {
    it("should keep same-sign changes of different magnitudes in one phase", async () => {
      await game.classicMode.startBattle(SpeciesId.MIGHTYENA);
      const player = game.field.getPlayerPokemon();

      const onChange = vi.fn<StatStageChangeCallback>();
      game.scene.phaseManager.unshiftNew("StatStageChangePhase", {
        battlerIndex: player.getBattlerIndex(),
        changes: [
          { stat: Stat.ATK, stages: 1 },
          { stat: Stat.SPATK, stages: 2 },
        ],
        sourcePokemon: player,
        onChange,
      });

      game.move.use(MoveId.SPLASH);
      await game.toEndOfTurn();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(player).toHaveStatStage(Stat.ATK, 1);
      expect(player).toHaveStatStage(Stat.SPATK, 2);
    });

    it("should split into exactly two phases when both signs are present", async () => {
      await game.classicMode.startBattle(SpeciesId.MIGHTYENA);
      const player = game.field.getPlayerPokemon();

      const onChange = vi.fn();
      game.scene.phaseManager.unshiftNew("StatStageChangePhase", {
        battlerIndex: player.getBattlerIndex(),
        changes: [
          { stat: Stat.ATK, stages: 1 },
          { stat: Stat.SPATK, stages: 2 },
          { stat: Stat.DEF, stages: -1 },
          { stat: Stat.SPDEF, stages: -2 },
        ],
        sourcePokemon: player,
        onChange,
      });

      game.move.use(MoveId.SPLASH);
      await game.toEndOfTurn();

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(player).toHaveStatStage(Stat.ATK, 1);
      expect(player).toHaveStatStage(Stat.SPATK, 2);
      expect(player).toHaveStatStage(Stat.DEF, -1);
      expect(player).toHaveStatStage(Stat.SPDEF, -2);
    });
  });

  it("should bypass Contrary with ignoreAbilities set", async () => {
    game.override.ability(AbilityId.CONTRARY);
    await game.classicMode.startBattle(SpeciesId.MIGHTYENA);
    const player = game.field.getPlayerPokemon();

    game.scene.phaseManager.unshiftNew("StatStageChangePhase", {
      battlerIndex: player.getBattlerIndex(),
      changes: groupStatChange([Stat.ATK], 1),
      sourcePokemon: player,
      ignoreAbilities: true,
    });

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(player).toHaveStatStage(Stat.ATK, 1);
  });
});
