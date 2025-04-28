import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BattlerIndex } from "#app/battle";
import { allAbilities } from "#app/data/data-lists";
import { allMoves } from "#app/data/moves/move";
import { MoveCategory } from "#enums/MoveCategory";

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
      .battleStyle("double")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([Moves.TACKLE, Moves.SPLASH, Moves.DRAGON_RAGE])
      .enemySpecies(Species.SHUCKLE)
      .moveset([Moves.SPLASH])
      .startingLevel(100);
  });

  it("should reduce damage that other allied Pokémon receive from attacks (from any Pokémon) by 25%", async () => {
    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER]);
    const [player1, player2] = game.scene.getPlayerField();
    const spy = vi.spyOn(player1, "getAttackDamage");

    const enemy1 = game.scene.getEnemyField()[0];

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    // Get the last return value from `getAttackDamage`
    const turn1Damage = spy.mock.results[spy.mock.results.length - 1].value.damage;
    // Making sure the test is controlled; turn 1 damage is equal to base damage (after rounding)
    expect(turn1Damage).toBe(
      Math.floor(
        player1.getBaseDamage({ source: enemy1, move: allMoves[Moves.TACKLE], moveCategory: MoveCategory.PHYSICAL }),
      ),
    );

    vi.spyOn(player2, "getAbility").mockReturnValue(allAbilities[Abilities.FRIEND_GUARD]);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    // Get the last return value from `getAttackDamage`
    const turn2Damage = spy.mock.results[spy.mock.results.length - 1].value.damage;
    // With the ally's Friend Guard, damage should have been reduced from base damage by 25%
    expect(turn2Damage).toBe(
      Math.floor(
        player1.getBaseDamage({ source: enemy1, move: allMoves[Moves.TACKLE], moveCategory: MoveCategory.PHYSICAL }) *
          0.75,
      ),
    );
  });

  it("should NOT reduce damage to pokemon with friend guard", async () => {
    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER]);

    const player2 = game.scene.getPlayerField()[1];
    const spy = vi.spyOn(player2, "getAttackDamage");

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    const turn1Damage = spy.mock.results[spy.mock.results.length - 1].value.damage;

    vi.spyOn(player2, "getAbility").mockReturnValue(allAbilities[Abilities.FRIEND_GUARD]);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    const turn2Damage = spy.mock.results[spy.mock.results.length - 1].value.damage;
    expect(turn2Damage).toBe(turn1Damage);
  });

  it("should NOT reduce damage from fixed damage attacks", async () => {
    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER]);

    const [player1, player2] = game.scene.getPlayerField();
    const spy = vi.spyOn(player1, "getAttackDamage");

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.DRAGON_RAGE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    const turn1Damage = spy.mock.results[spy.mock.results.length - 1].value.damage;
    expect(turn1Damage).toBe(40);

    vi.spyOn(player2, "getAbility").mockReturnValue(allAbilities[Abilities.FRIEND_GUARD]);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.DRAGON_RAGE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    const turn2Damage = spy.mock.results[spy.mock.results.length - 1].value.damage;
    expect(turn2Damage).toBe(40);
  });
});
