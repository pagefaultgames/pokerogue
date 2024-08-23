import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import { Species } from "#enums/species";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { SPLASH_ONLY } from "../utils/testUtils";

describe("Moves - Guard Split", () => {
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
      .battleType("single")
      .enemyAbility(Abilities.NONE)
      .enemySpecies(Species.MEW)
      .enemyLevel(200)
      .moveset([ Moves.GUARD_SPLIT ])
      .ability(Abilities.NONE);
  });

  it("should average the user's DEF and SPDEF stats with those of the target", async () => {
    game.override.enemyMoveset(SPLASH_ONLY);
    await game.startBattle([
      Species.INDEEDEE
    ]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    const avgDef = Math.floor((player.getStat(Stat.DEF, false) + enemy.getStat(Stat.DEF, false)) / 2);
    const avgSpDef = Math.floor((player.getStat(Stat.SPDEF, false) + enemy.getStat(Stat.SPDEF, false)) / 2);

    game.move.select(Moves.GUARD_SPLIT);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.DEF, false)).toBe(avgDef);
    expect(enemy.getStat(Stat.DEF, false)).toBe(avgDef);

    expect(player.getStat(Stat.SPDEF, false)).toBe(avgSpDef);
    expect(enemy.getStat(Stat.SPDEF, false)).toBe(avgSpDef);
  }, 20000);

  it("should be idempotent", async () => {
    game.override.enemyMoveset(new Array(4).fill(Moves.GUARD_SPLIT));
    await game.startBattle([
      Species.INDEEDEE
    ]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    const avgDef = Math.floor((player.getStat(Stat.DEF, false) + enemy.getStat(Stat.DEF, false)) / 2);
    const avgSpDef = Math.floor((player.getStat(Stat.SPDEF, false) + enemy.getStat(Stat.SPDEF, false)) / 2);

    game.move.select(Moves.GUARD_SPLIT);
    await game.phaseInterceptor.to(TurnEndPhase);

    game.move.select(Moves.GUARD_SPLIT);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.DEF, false)).toBe(avgDef);
    expect(enemy.getStat(Stat.DEF, false)).toBe(avgDef);

    expect(player.getStat(Stat.SPDEF, false)).toBe(avgSpDef);
    expect(enemy.getStat(Stat.SPDEF, false)).toBe(avgSpDef);
  }, 20000);
});
