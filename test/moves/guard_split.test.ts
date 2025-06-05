import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/testUtils/gameManager";
import { SpeciesId } from "#enums/species-id";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { MoveId } from "#enums/move-id";
import { Stat } from "#enums/stat";
import { AbilityId } from "#enums/ability-id";

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
      .battleStyle("single")
      .enemyAbility(AbilityId.NONE)
      .enemySpecies(SpeciesId.MEW)
      .enemyLevel(200)
      .moveset([MoveId.GUARD_SPLIT])
      .ability(AbilityId.NONE);
  });

  it("should average the user's DEF and SPDEF stats with those of the target", async () => {
    game.override.enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.INDEEDEE]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    const avgDef = Math.floor((player.getStat(Stat.DEF, false) + enemy.getStat(Stat.DEF, false)) / 2);
    const avgSpDef = Math.floor((player.getStat(Stat.SPDEF, false) + enemy.getStat(Stat.SPDEF, false)) / 2);

    game.move.select(MoveId.GUARD_SPLIT);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.DEF, false)).toBe(avgDef);
    expect(enemy.getStat(Stat.DEF, false)).toBe(avgDef);

    expect(player.getStat(Stat.SPDEF, false)).toBe(avgSpDef);
    expect(enemy.getStat(Stat.SPDEF, false)).toBe(avgSpDef);
  }, 20000);

  it("should be idempotent", async () => {
    game.override.enemyMoveset([MoveId.GUARD_SPLIT]);
    await game.classicMode.startBattle([SpeciesId.INDEEDEE]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    const avgDef = Math.floor((player.getStat(Stat.DEF, false) + enemy.getStat(Stat.DEF, false)) / 2);
    const avgSpDef = Math.floor((player.getStat(Stat.SPDEF, false) + enemy.getStat(Stat.SPDEF, false)) / 2);

    game.move.select(MoveId.GUARD_SPLIT);
    await game.phaseInterceptor.to(TurnEndPhase);

    game.move.select(MoveId.GUARD_SPLIT);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.DEF, false)).toBe(avgDef);
    expect(enemy.getStat(Stat.DEF, false)).toBe(avgDef);

    expect(player.getStat(Stat.SPDEF, false)).toBe(avgSpDef);
    expect(enemy.getStat(Stat.SPDEF, false)).toBe(avgSpDef);
  }, 20000);
});
