import { allAbilities } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { Pokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Flame Burst", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  /**
   * Calculates the effect damage of Flame Burst which is 1/16 of the target ally's max HP
   * See Flame Burst {@link https://bulbapedia.bulbagarden.net/wiki/Flame_Burst_(move)}
   * See Flame Burst's move attribute {@linkcode FlameBurstAttr}
   * @param pokemon - The ally of the move's target
   * @returns Effect damage of Flame Burst
   */
  const getEffectDamage = (pokemon: Pokemon): number => {
    return toDmgValue(pokemon.getMaxHp() / 16);
  };

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
      .criticalHits(false)
      .ability(AbilityId.UNNERVE)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("inflicts damage to the target's ally equal to 1/16 of its max HP", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.PIKACHU]);
    const [leftEnemy, rightEnemy] = game.scene.getEnemyField();

    game.move.use(MoveId.FLAME_BURST, 0, leftEnemy.getBattlerIndex());
    game.move.use(MoveId.SPLASH, 1);
    await game.toEndOfTurn();

    expect(leftEnemy.hp).toBeLessThan(leftEnemy.getMaxHp());
    expect(rightEnemy.hp).toBe(rightEnemy.getMaxHp() - getEffectDamage(rightEnemy));
  });

  it("does not inflict damage to the target's ally if the target was not affected by Flame Burst", async () => {
    game.override.enemyAbility(AbilityId.FLASH_FIRE);

    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.PIKACHU]);
    const [leftEnemy, rightEnemy] = game.scene.getEnemyField();

    game.move.use(MoveId.FLAME_BURST, 0, leftEnemy.getBattlerIndex());
    game.move.use(MoveId.SPLASH, 1);
    await game.toEndOfTurn();

    expect(leftEnemy.hp).toBe(leftEnemy.getMaxHp());
    expect(rightEnemy.hp).toBe(rightEnemy.getMaxHp());
  });

  it("does not interact with the target ally's abilities", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.PIKACHU]);
    const [leftEnemy, rightEnemy] = game.scene.getEnemyField();

    vi.spyOn(rightEnemy, "getAbility").mockReturnValue(allAbilities[AbilityId.FLASH_FIRE]);

    game.move.use(MoveId.FLAME_BURST, 0, leftEnemy.getBattlerIndex());
    game.move.use(MoveId.SPLASH, 1);
    await game.toEndOfTurn();

    expect(leftEnemy.hp).toBeLessThan(leftEnemy.getMaxHp());
    expect(rightEnemy.hp).toBe(rightEnemy.getMaxHp() - getEffectDamage(rightEnemy));
  });

  it("effect damage is prevented by Magic Guard", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.PIKACHU]);
    const [leftEnemy, rightEnemy] = game.scene.getEnemyField();

    vi.spyOn(rightEnemy, "getAbility").mockReturnValue(allAbilities[AbilityId.MAGIC_GUARD]);

    game.move.use(MoveId.FLAME_BURST, 0, leftEnemy.getBattlerIndex());
    game.move.use(MoveId.SPLASH, 1);
    await game.toEndOfTurn();

    expect(leftEnemy.hp).toBeLessThan(leftEnemy.getMaxHp());
    expect(rightEnemy.hp).toBe(rightEnemy.getMaxHp());
  });

  it("ignores protection moves and Endure from the non-target pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.MILOTIC]);

    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.use(MoveId.FLAME_BURST, 0, BattlerIndex.ENEMY);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.PROTECT);
    await game.toNextTurn();

    expect(enemy1).not.toHaveFullHp();
    expect(enemy2).toHaveTakenDamage(getEffectDamage(enemy2));

    enemy1.hp = enemy1.getMaxHp();
    enemy2.hp = 1;

    game.move.use(MoveId.FLAME_BURST, 0, BattlerIndex.ENEMY);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.ENDURE);
    await game.toEndOfTurn();

    expect(enemy1).not.toHaveFullHp();
    expect(enemy2).toHaveFainted();
  });
});
