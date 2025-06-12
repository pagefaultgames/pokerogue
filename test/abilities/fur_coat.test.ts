import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { allAbilities } from "#app/data/data-lists";

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
      .moveset([MoveId.TACKLE, MoveId.PSYSHOCK, MoveId.PSYSTRIKE, MoveId.SECRET_SWORD, MoveId.SCALD])
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MINCCINO)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH])
      .disableCrits();
  });

  it("should reduce damage from a physical move after gaining Fur Coat", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const enemy = game.scene.getEnemyPokemon()!;
    // Use Tackle before Fur Coat
    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("TurnEndPhase");
    const damageBefore = enemy.getMaxHp() - enemy.hp;
    // Give Fur Coat
    enemy.setTempAbility(allAbilities[AbilityId.FUR_COAT]);
    enemy.hp = enemy.getMaxHp();
    // Use Tackle after Fur Coat
    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("TurnEndPhase");
    const damageAfter = enemy.getMaxHp() - enemy.hp;
    expect(damageAfter).toBeLessThan(damageBefore);
  });

  it("should not reduce damage from a special move", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const enemy = game.scene.getEnemyPokemon()!;
    // Use Scald before Fur Coat
    game.move.select(MoveId.SCALD);
    await game.phaseInterceptor.to("TurnEndPhase");
    const damageBefore = enemy.getMaxHp() - enemy.hp;
    // Give Fur Coat
    enemy.setTempAbility(allAbilities[AbilityId.FUR_COAT]);
    enemy.hp = enemy.getMaxHp();
    // Use Scald after Fur Coat
    game.move.select(MoveId.SCALD);
    await game.phaseInterceptor.to("TurnEndPhase");
    const damageAfter = enemy.getMaxHp() - enemy.hp;
    expect(damageAfter).toBeCloseTo(damageBefore, 1);
  });

  it("should reduce damage from Psyshock, Psystrike, and Secret Sword after gaining Fur Coat", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const enemy = game.scene.getEnemyPokemon()!;
    // Test Psyshock
    game.move.select(MoveId.PSYSHOCK);
    await game.phaseInterceptor.to("TurnEndPhase");
    const psyshockBefore = enemy.getMaxHp() - enemy.hp;
    enemy.setTempAbility(allAbilities[AbilityId.FUR_COAT]);
    enemy.hp = enemy.getMaxHp();
    game.move.select(MoveId.PSYSHOCK);
    await game.phaseInterceptor.to("TurnEndPhase");
    const psyshockAfter = enemy.getMaxHp() - enemy.hp;
    expect(psyshockAfter).toBeLessThan(psyshockBefore);
    // Test Psystrike
    enemy.hp = enemy.getMaxHp();
    game.move.select(MoveId.PSYSTRIKE);
    await game.phaseInterceptor.to("TurnEndPhase");
    const psystrikeBefore = enemy.getMaxHp() - enemy.hp;
    enemy.setTempAbility(allAbilities[AbilityId.FUR_COAT]);
    enemy.hp = enemy.getMaxHp();
    game.move.select(MoveId.PSYSTRIKE);
    await game.phaseInterceptor.to("TurnEndPhase");
    const psystrikeAfter = enemy.getMaxHp() - enemy.hp;
    expect(psystrikeAfter).toBeLessThan(psystrikeBefore);
    // Test Secret Sword
    enemy.hp = enemy.getMaxHp();
    game.move.select(MoveId.SECRET_SWORD);
    await game.phaseInterceptor.to("TurnEndPhase");
    const secretSwordBefore = enemy.getMaxHp() - enemy.hp;
    enemy.setTempAbility(allAbilities[AbilityId.FUR_COAT]);
    enemy.hp = enemy.getMaxHp();
    game.move.select(MoveId.SECRET_SWORD);
    await game.phaseInterceptor.to("TurnEndPhase");
    const secretSwordAfter = enemy.getMaxHp() - enemy.hp;
    expect(secretSwordAfter).toBeLessThan(secretSwordBefore);
  });
});
