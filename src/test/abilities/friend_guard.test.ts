import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BattlerIndex } from "#app/battle";
import { allAbilities } from "#app/data/ability";

describe("Moves - Friend Guard", () => {
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
      .battleType("double")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([ Moves.TACKLE, Moves.SPLASH, Moves.DRAGON_RAGE ])
      .enemySpecies(Species.SHUCKLE)
      .moveset([ Moves.SPLASH ])
      .startingLevel(100);
  });

  it("should reduce damage that other allied Pokémon receive from attacks (from any Pokémon) by 25%", async () => {
    await game.classicMode.startBattle([ Species.BULBASAUR, Species.CHARMANDER ]);
    const [ player1, player2 ] = game.scene.getPlayerField();
    const maxHP = player1.hp;
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    const hp1 = player1.hp;

    // Reset HP to maxHP
    player1.hp = maxHP;

    vi.spyOn(player2, "getAbility").mockReturnValue(allAbilities[Abilities.FRIEND_GUARD]);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    const hp2 = player1.hp;
    expect(hp2).toBeGreaterThan(hp1);
  });

  it("should NOT reduce damage to pokemon with friend guard", async () => {
    await game.classicMode.startBattle([ Species.BULBASAUR, Species.CHARMANDER ]);
    const player2  = game.scene.getPlayerField()[1];
    const maxHP = player2.hp;
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    const hp1 = player2.hp;

    // Reset HP to maxHP
    player2.hp = maxHP;

    vi.spyOn(player2, "getAbility").mockReturnValue(allAbilities[Abilities.FRIEND_GUARD]);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    const hp2 = player2.hp;
    expect(hp2).toBe(hp1);
  });

  it("should NOT reduce damage from fixed damage attacks (i.e. dragon rage, sonic boom, etc)", async () => {
    await game.classicMode.startBattle([ Species.BULBASAUR, Species.CHARMANDER ]);
    const [ player1, player2 ] = game.scene.getPlayerField();
    const maxHP = player1.hp;
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.DRAGON_RAGE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    const hp1 = player1.hp;

    // Reset HP to maxHP
    player1.hp = maxHP;

    vi.spyOn(player2, "getAbility").mockReturnValue(allAbilities[Abilities.FRIEND_GUARD]);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.DRAGON_RAGE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    const hp2 = player1.hp;
    expect(hp2).toBe(hp1);
  });
});
