import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BattlerIndex } from "#app/battle";
import { PlayerPokemon } from "#app/field/pokemon";

describe("Moves - Friend Guard", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let hp1: number;
  let hp2: number;
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
      .battleType("double")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([ Moves.TACKLE, Moves.SPLASH ])
      .enemySpecies(Species.SHUCKLE)
      .moveset([ Moves.SPLASH ]);
  });

  it("first part of test, getting hp without friend guard", async () => {
    await game.classicMode.startBattle([ Species.BULBASAUR, Species.BULBASAUR ]);
    const party = game.scene.getParty()! as PlayerPokemon[];
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    hp1 = party[0].hp;
  });

  it("second part of test, getting hp with friend guard and comparing", async () => {
    game.override.ability(Abilities.FRIEND_GUARD);
    await game.classicMode.startBattle([ Species.BULBASAUR, Species.BULBASAUR ]);
    const party = game.scene.getParty()! as PlayerPokemon[];
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    hp2 = party[0].hp;
    expect(hp2).toBeGreaterThan(hp1);
  });
});
