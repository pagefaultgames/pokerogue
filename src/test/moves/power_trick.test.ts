import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#app/data/pokemon-stat";
import { BattlerTagType } from "#enums/battler-tag-type";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { TurnEndPhase } from "#app/phases";

describe("Moves - Power Trick", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SHUCKLE);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SHUCKLE);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(5);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(6);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SWIFT, Moves.POWER_TRICK]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.NONE, Moves.NONE, Moves.NONE, Moves.NONE]);
  });

  test(
    "switches raw Attack stat with its raw Defense stat",
    async () => {
      await game.startBattle([Species.SHUCKLE]);

      const playerPokemon = game.scene.getPlayerField()[0];
      const initialStats = [...playerPokemon.stats];

      game.doAttack(getMovePosition(game.scene, 0, Moves.POWER_TRICK));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(playerPokemon.getTag(BattlerTagType.POWER_TRICK)).not.toBe(undefined);
      expect(playerPokemon.stats[Stat.ATK]).toBe(initialStats[Stat.DEF]);
      expect(playerPokemon.stats[Stat.DEF]).toBe(initialStats[Stat.ATK]);
    },
    20000
  );

  test(
    "using power trick again will reset stat change",
    async () => {
      await game.startBattle([Species.SHUCKLE]);

      const playerPokemon = game.scene.getPlayerField()[0];
      const initialStats = [...playerPokemon.stats];

      game.doAttack(getMovePosition(game.scene, 0, Moves.POWER_TRICK));
      await game.toNextTurn();

      game.doAttack(getMovePosition(game.scene, 0, Moves.POWER_TRICK));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(playerPokemon.getTag(BattlerTagType.POWER_TRICK)).toBe(undefined);
      expect(playerPokemon.stats[Stat.ATK]).toBe(initialStats[Stat.ATK]);
      expect(playerPokemon.stats[Stat.DEF]).toBe(initialStats[Stat.DEF]);
    },
    20000
  );

  test(
    "effect disappears with summoning event",
    async () => {
      await game.startBattle([Species.SHUCKLE]);

      const playerPokemon = game.scene.getPlayerField()[0];
      const initialStats = [...playerPokemon.stats];

      game.doAttack(getMovePosition(game.scene, 0, Moves.POWER_TRICK));
      await game.toNextTurn();

      game.doSwitchPokemon(0);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(playerPokemon.getTag(BattlerTagType.POWER_TRICK)).toBe(undefined);
      expect(playerPokemon.stats[Stat.ATK]).toBe(initialStats[Stat.ATK]);
      expect(playerPokemon.stats[Stat.DEF]).toBe(initialStats[Stat.DEF]);
    },
    20000
  );

  test(
    "effect remains after levelup event",
    async () => {
      await game.startBattle([Species.SHUCKLE]);

      const playerPokemon = game.scene.getPlayerField()[0];
      const enemyPokemon = game.scene.getEnemyField()[0];
      const initialLevel = playerPokemon.level;

      enemyPokemon.hp = 1;

      game.doAttack(getMovePosition(game.scene, 0, Moves.POWER_TRICK));
      await game.toNextTurn();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SWIFT));
      await game.phaseInterceptor.to(TurnEndPhase);

      const expectedStats = [...playerPokemon.stats];

      // recalculate stats for getting base Stats to compare
      playerPokemon.resetSummonData();
      playerPokemon.calculateStats();

      expect(playerPokemon.level).toBeGreaterThan(initialLevel);
      expect(playerPokemon.getTag(BattlerTagType.POWER_TRICK)).toBe(undefined);
      expect(playerPokemon.stats[Stat.ATK]).toBe(expectedStats[Stat.DEF]);
      expect(playerPokemon.stats[Stat.DEF]).toBe(expectedStats[Stat.ATK]);
    },
    20000
  );
});
