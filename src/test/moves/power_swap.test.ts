import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import { Species } from "#enums/species";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { MoveEndPhase } from "#app/phases/move-end-phase";

describe("Moves - Power Swap", () => {
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
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(new Array(4).fill(Moves.SHELL_SMASH))
      .enemySpecies(Species.MEW)
      .enemyLevel(200)
      .moveset([ Moves.POWER_SWAP ])
      .ability(Abilities.NONE);
  });

  it("should swap the user's ATK AND SPATK stat stages with the target's", async () => {
    await game.startBattle([
      Species.INDEEDEE
    ]);

    // Should start with no stat stages
    const player = game.scene.getPlayerPokemon()!;
    // After Shell Smash, should have +2 in ATK and SPATK, -1 in DEF and SPDEF
    const enemy = game.scene.getEnemyPokemon()!;
    game.move.select(Moves.POWER_SWAP);

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(player.getStatStage(Stat.ATK)).toBe(0);
    expect(player.getStatStage(Stat.SPATK)).toBe(0);
    expect(enemy.getStatStage(Stat.ATK)).toBe(2);
    expect(enemy.getStatStage(Stat.SPATK)).toBe(2);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStatStage(Stat.ATK)).toBe(2);
    expect(player.getStatStage(Stat.SPATK)).toBe(2);
    expect(enemy.getStatStage(Stat.ATK)).toBe(0);
    expect(enemy.getStatStage(Stat.SPATK)).toBe(0);
  }, 20000);
});
