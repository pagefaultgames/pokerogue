import { allAbilities, allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveCategory } from "#enums/move-category";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.TACKLE, MoveId.SPLASH, MoveId.DRAGON_RAGE])
      .enemySpecies(SpeciesId.SHUCKLE)
      .moveset([MoveId.SPLASH])
      .startingLevel(100);
  });

  it("should reduce damage that other allied Pokémon receive from attacks (from any Pokémon) by 25%", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER]);
    const [player1, player2] = game.scene.getPlayerField();
    const spy = vi.spyOn(player1, "getAttackDamage");

    const enemy1 = game.field.getEnemyPokemon();
    const baseDmg = player1.getBaseDamage({
      source: enemy1,
      move: allMoves[MoveId.TACKLE],
      moveCategory: MoveCategory.PHYSICAL,
    });

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    // Get the last return value from `getAttackDamage`
    // Making sure the test is controlled; turn 1 damage is equal to base damage (after rounding)
    expect(spy).toHaveLastReturnedWith(
      expect.objectContaining({
        damage: Math.floor(baseDmg),
      }),
    );

    vi.spyOn(player2, "getAbility").mockReturnValue(allAbilities[AbilityId.FRIEND_GUARD]);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    // Get the last return value from `getAttackDamage`
    // With the ally's Friend Guard, damage should have been reduced from base damage by 25%
    expect(spy).toHaveLastReturnedWith(expect.objectContaining({ damage: Math.floor(baseDmg * 0.75) }));
  });

  it("should NOT reduce damage to pokemon with friend guard", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER]);

    const player2 = game.scene.getPlayerField()[1];
    const spy = vi.spyOn(player2, "getAttackDamage");

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    const turn1Damage = spy.mock.results.at(-1)!.value.damage;

    vi.spyOn(player2, "getAbility").mockReturnValue(allAbilities[AbilityId.FRIEND_GUARD]);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    const turn2Damage = spy.mock.results.at(-1)!.value.damage;
    expect(turn2Damage).toBe(turn1Damage);
  });

  it("should NOT reduce damage from fixed damage attacks", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER]);

    const [player1, player2] = game.scene.getPlayerField();
    const spy = vi.spyOn(player1, "getAttackDamage");

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.DRAGON_RAGE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    const turn1Damage = spy.mock.results.at(-1)!.value.damage;
    expect(turn1Damage).toBe(40);

    vi.spyOn(player2, "getAbility").mockReturnValue(allAbilities[AbilityId.FRIEND_GUARD]);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.DRAGON_RAGE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    const turn2Damage = spy.mock.results.at(-1)!.value.damage;
    expect(turn2Damage).toBe(40);
  });
});
