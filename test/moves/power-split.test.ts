import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Power Split", () => {
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
    game.override
      .battleStyle("single")
      .enemyAbility(AbilityId.NONE)
      .enemySpecies(SpeciesId.MEW)
      .enemyLevel(200)
      .moveset([MoveId.POWER_SPLIT])
      .ability(AbilityId.NONE);
  });

  it("should average the user's ATK and SPATK stats with those of the target", async () => {
    game.override.enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.INDEEDEE]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    const avgAtk = Math.floor((player.getStat(Stat.ATK, false) + enemy.getStat(Stat.ATK, false)) / 2);
    const avgSpAtk = Math.floor((player.getStat(Stat.SPATK, false) + enemy.getStat(Stat.SPATK, false)) / 2);

    game.move.select(MoveId.POWER_SPLIT);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.ATK, false)).toBe(avgAtk);
    expect(enemy.getStat(Stat.ATK, false)).toBe(avgAtk);

    expect(player.getStat(Stat.SPATK, false)).toBe(avgSpAtk);
    expect(enemy.getStat(Stat.SPATK, false)).toBe(avgSpAtk);
  });

  it("should be idempotent", async () => {
    game.override.enemyMoveset([MoveId.POWER_SPLIT]);
    await game.classicMode.startBattle([SpeciesId.INDEEDEE]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    const avgAtk = Math.floor((player.getStat(Stat.ATK, false) + enemy.getStat(Stat.ATK, false)) / 2);
    const avgSpAtk = Math.floor((player.getStat(Stat.SPATK, false) + enemy.getStat(Stat.SPATK, false)) / 2);

    game.move.select(MoveId.POWER_SPLIT);
    await game.phaseInterceptor.to(TurnEndPhase);

    game.move.select(MoveId.POWER_SPLIT);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.ATK, false)).toBe(avgAtk);
    expect(enemy.getStat(Stat.ATK, false)).toBe(avgAtk);

    expect(player.getStat(Stat.SPATK, false)).toBe(avgSpAtk);
    expect(enemy.getStat(Stat.SPATK, false)).toBe(avgSpAtk);
  });
});
