import { Stat } from "#enums/stat";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Competitive", () => {
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

    game.override.battleType("single")
      .enemySpecies(Species.RATTATA)
      .enemyMoveset(Moves.TICKLE)
      .startingLevel(100)
      .moveset(Moves.SPLASH)
      .ability(Abilities.COMPETITIVE);
  });

  it("lower atk and def by 1 via tickle, then increase spatk by 4 via competitive", async () => {
    await game.classicMode.startBattle([ Species.FLYGON ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.DEF)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(4);
  });
});
