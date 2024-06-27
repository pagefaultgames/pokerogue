import { beforeAll, afterEach, beforeEach, describe, vi, it, expect } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#app/data/pokemon-stat";
import { BattlerTagType } from "#enums/battler-tag-type";

const TIMEOUT = 20 * 1000;

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
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(
      Species.SHUCKLE
    );
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(
      Species.SHUCKLE
    );
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(5);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(6);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([
      Moves.TACKLE,
      Moves.BATON_PASS,
      Moves.POWER_TRICK,
      Moves.POWER_TRICK,
    ]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([
      Moves.NONE,
      Moves.NONE,
      Moves.NONE,
      Moves.NONE,
    ]);
  });

  it(
    "switches raw Attack stat with its raw Defense stat",
    async () => {
      await game.startBattle([Species.SHUCKLE]);

      const playerPokemon = game.scene.getPlayerField()[0];
      const initialStats = [...playerPokemon.stats];

      game.doAttack(getMovePosition(game.scene, 0, Moves.POWER_TRICK));
      await game.toNextTurn();

      expect(playerPokemon.getTag(BattlerTagType.POWER_TRICK)).not.toBe(undefined);
      expect(playerPokemon.getStat(Stat.ATK)).toBe(initialStats[Stat.DEF]);
      expect(playerPokemon.getStat(Stat.DEF)).toBe(initialStats[Stat.ATK]);
      expect(playerPokemon.getStat(Stat.HP)).toBe(initialStats[Stat.HP]);
      expect(playerPokemon.getStat(Stat.SPATK)).toBe(initialStats[Stat.SPATK]);
      expect(playerPokemon.getStat(Stat.SPD)).toBe(initialStats[Stat.SPD]);
      expect(playerPokemon.getStat(Stat.SPDEF)).toBe(initialStats[Stat.SPDEF]);
    },
    TIMEOUT
  );

  it(
    "using power trick again will reset stat change",
    async () => {
      await game.startBattle([Species.SHUCKLE]);

      const playerPokemon = game.scene.getPlayerField()[0];
      const initialStats = [...playerPokemon.stats];

      game.doAttack(getMovePosition(game.scene, 0, Moves.POWER_TRICK));
      await game.toNextTurn();

      game.doAttack(getMovePosition(game.scene, 0, Moves.POWER_TRICK));
      await game.toNextTurn();

      expect(playerPokemon.getTag(BattlerTagType.POWER_TRICK)).toBe(undefined);
      expect(playerPokemon.getStat(Stat.ATK)).toBe(initialStats[Stat.ATK]);
      expect(playerPokemon.getStat(Stat.DEF)).toBe(initialStats[Stat.DEF]);
      expect(playerPokemon.getStat(Stat.HP)).toBe(initialStats[Stat.HP]);
      expect(playerPokemon.getStat(Stat.SPATK)).toBe(initialStats[Stat.SPATK]);
      expect(playerPokemon.getStat(Stat.SPD)).toBe(initialStats[Stat.SPD]);
      expect(playerPokemon.getStat(Stat.SPDEF)).toBe(initialStats[Stat.SPDEF]);
    },
    TIMEOUT
  );
});
