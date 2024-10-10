import { BattlerIndex } from "#app/battle";
import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Assist", () => {
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
      .moveset([ Moves.SPLASH ])
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should be able to use an ally's moves", async () => {
    game.override
      .battleType("double")
      .moveset([ Moves.ASSIST, Moves.SKETCH, Moves.FLY, Moves.DRAGON_TAIL ]) // Populate movesets with moves Assist cannot call
      .enemyMoveset(Moves.SWORDS_DANCE);
    await game.classicMode.startBattle([ Species.FEEBAS, Species.SHUCKLE ]);
    const leftPlayer = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.ASSIST, 0);
    game.move.select(Moves.SKETCH, 1);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER ]);
    // Player_2 uses Sketch, copies Swords Dance, Player_1 uses Assist, uses Player_2's Sketched Swords Dance
    await game.toNextTurn();

    expect(leftPlayer.getStatStage(Stat.ATK)).toBe(2); // Stat raised from Assist -> Swords Dance
  });
});
