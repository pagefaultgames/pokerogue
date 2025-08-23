import { allAbilities } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { Pokemon } from "#field/pokemon";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Flame Burst", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  /**
   * Calculates the effect damage of Flame Burst which is 1/16 of the target ally's max HP
   * See Flame Burst {@link https://bulbapedia.bulbagarden.net/wiki/Flame_Burst_(move)}
   * See Flame Burst's move attribute {@linkcode FlameBurstAttr}
   * @param pokemon {@linkcode Pokemon} - The ally of the move's target
   * @returns Effect damage of Flame Burst
   */
  const getEffectDamage = (pokemon: Pokemon): number => {
    return Math.max(1, Math.floor((pokemon.getMaxHp() * 1) / 16));
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
      .moveset([MoveId.FLAME_BURST, MoveId.SPLASH])
      .criticalHits(false)
      .ability(AbilityId.UNNERVE)
      .startingWave(4)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("inflicts damage to the target's ally equal to 1/16 of its max HP", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.PIKACHU]);
    const [leftEnemy, rightEnemy] = game.scene.getEnemyField();

    game.move.select(MoveId.FLAME_BURST, 0, leftEnemy.getBattlerIndex());
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leftEnemy.hp).toBeLessThan(leftEnemy.getMaxHp());
    expect(rightEnemy.hp).toBe(rightEnemy.getMaxHp() - getEffectDamage(rightEnemy));
  });

  it("does not inflict damage to the target's ally if the target was not affected by Flame Burst", async () => {
    game.override.enemyAbility(AbilityId.FLASH_FIRE);

    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.PIKACHU]);
    const [leftEnemy, rightEnemy] = game.scene.getEnemyField();

    game.move.select(MoveId.FLAME_BURST, 0, leftEnemy.getBattlerIndex());
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leftEnemy.hp).toBe(leftEnemy.getMaxHp());
    expect(rightEnemy.hp).toBe(rightEnemy.getMaxHp());
  });

  it("does not interact with the target ally's abilities", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.PIKACHU]);
    const [leftEnemy, rightEnemy] = game.scene.getEnemyField();

    vi.spyOn(rightEnemy, "getAbility").mockReturnValue(allAbilities[AbilityId.FLASH_FIRE]);

    game.move.select(MoveId.FLAME_BURST, 0, leftEnemy.getBattlerIndex());
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leftEnemy.hp).toBeLessThan(leftEnemy.getMaxHp());
    expect(rightEnemy.hp).toBe(rightEnemy.getMaxHp() - getEffectDamage(rightEnemy));
  });

  it("effect damage is prevented by Magic Guard", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.PIKACHU]);
    const [leftEnemy, rightEnemy] = game.scene.getEnemyField();

    vi.spyOn(rightEnemy, "getAbility").mockReturnValue(allAbilities[AbilityId.MAGIC_GUARD]);

    game.move.select(MoveId.FLAME_BURST, 0, leftEnemy.getBattlerIndex());
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leftEnemy.hp).toBeLessThan(leftEnemy.getMaxHp());
    expect(rightEnemy.hp).toBe(rightEnemy.getMaxHp());
  });

  it(
    "is not affected by protection moves and Endure",
    async () => {
      // TODO: update this test when it's possible to select move for each enemy
    },
    { skip: true },
  );
});
