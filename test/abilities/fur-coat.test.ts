import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Fur Coat", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .startingLevel(50)
      .enemySpecies(SpeciesId.CHANSEY)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyPassiveAbility(AbilityId.NONE)
      .enemyMoveset([MoveId.SPLASH])
      .enemyLevel(50)
      .criticalHits(false);
  });

  function damageAfterShouldBeAboutHalfOfDamageBefore(damageAfter: number, damageBefore: number) {
    const halfDamage = damageBefore * 0.5;
    const difference = Math.abs(damageAfter - halfDamage);
    // Can't use `toBeCloseTo` because they're exactly 0.5 apart, and we still get rounding errors
    expect(difference).toBeLessThan(0.6);
  }

  it("should reduce damage from a physical move after gaining Fur Coat", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const enemy = game.field.getEnemyPokemon();
    // Use Tackle before Fur Coat
    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();
    const damageBefore = enemy.getMaxHp() - enemy.hp;
    // Give Fur Coat
    game.field.mockAbility(enemy, AbilityId.FUR_COAT);
    enemy.hp = enemy.getMaxHp();
    // Use Tackle after Fur Coat
    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();
    const damageAfter = enemy.getMaxHp() - enemy.hp;
    damageAfterShouldBeAboutHalfOfDamageBefore(damageAfter, damageBefore);
  });

  it("should not reduce damage from a special move", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const enemy = game.field.getEnemyPokemon();
    // Use Scald before Fur Coat
    game.move.use(MoveId.SCALD);
    await game.toEndOfTurn();
    const damageBefore = enemy.getMaxHp() - enemy.hp;
    // Give Fur Coat
    game.field.mockAbility(enemy, AbilityId.FUR_COAT);
    enemy.hp = enemy.getMaxHp();
    // Use Scald after Fur Coat
    game.move.use(MoveId.SCALD);
    await game.toEndOfTurn();
    const damageAfter = enemy.getMaxHp() - enemy.hp;
    expect(damageAfter).toBe(damageBefore);
  });

  it.each([
    { moveName: "Psyshock", moveId: MoveId.PSYSHOCK },
    {
      moveName: "Psystrike",
      moveId: MoveId.PSYSTRIKE,
    },
    {
      moveName: "Secret Sword",
      moveId: MoveId.SECRET_SWORD,
    },
  ])("should reduce damage from $moveName after gaining Fur Coat", async ({ moveId }) => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const enemy = game.field.getEnemyPokemon();

    game.move.use(moveId);
    await game.toEndOfTurn();

    const attackDamageBefore = enemy.getMaxHp() - enemy.hp;

    game.field.mockAbility(enemy, AbilityId.FUR_COAT);
    enemy.hp = enemy.getMaxHp();

    game.move.use(moveId);
    await game.toEndOfTurn();

    const attackDamageAfter = enemy.getMaxHp() - enemy.hp;
    damageAfterShouldBeAboutHalfOfDamageBefore(attackDamageAfter, attackDamageBefore);
  });

  it("should reduce damage from Shell Side Arm", async () => {
    await game.classicMode.startBattle([SpeciesId.HERACROSS]);
    game.override.enemyAbility(AbilityId.IMMUNITY);
    const enemy = game.field.getEnemyPokemon();

    // Use Shell Side Arm before Fur Coat
    game.move.use(MoveId.SHELL_SIDE_ARM);
    await game.toEndOfTurn();
    const damageBefore = enemy.getMaxHp() - enemy.hp;
    // Give Fur Coat
    game.field.mockAbility(enemy, AbilityId.FUR_COAT);
    enemy.hp = enemy.getMaxHp();
    // Use Shell Side Arm after Fur Coat
    game.move.use(MoveId.SHELL_SIDE_ARM);
    await game.toEndOfTurn();
    const damageAfter = enemy.getMaxHp() - enemy.hp;
    damageAfterShouldBeAboutHalfOfDamageBefore(damageAfter, damageBefore);
  });
});
