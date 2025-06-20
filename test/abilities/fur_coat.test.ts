import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Fur Coat", () => {
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
      .enemySpecies(SpeciesId.MILOTIC)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH])
      .enemyLevel(20)
      .criticalHits(false);
  });

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
    expect(damageAfter).toBeLessThan(damageBefore);
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
    expect(damageAfter).toBeCloseTo(damageBefore, 1);
  });

  it.each([
    { moveName: "Psyshock", moveId: MoveId.PSYSHOCK },
    { moveName: "Psystrike", moveId: MoveId.PSYSTRIKE },
    { moveName: "Secret Sword", moveId: MoveId.SECRET_SWORD },
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
    expect(attackDamageAfter).toBeLessThan(attackDamageBefore);
  });
});
