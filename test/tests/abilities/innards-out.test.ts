import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Innards Out", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.INNARDS_OUT)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100);
  });

  it("should damage opponents that faint the ability holder for equal damage", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const magikarp = game.field.getEnemyPokemon();
    magikarp.hp = 20;
    game.move.use(MoveId.X_SCISSOR);
    await game.toEndOfTurn();

    expect(magikarp).toHaveFainted();
    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveTakenDamage(20);
  });

  it("should not activate if the ability holder lost Innards Out via Skill Swap before fainting", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    const magikarp = game.field.getEnemyPokemon();

    game.move.use(MoveId.SKILL_SWAP);
    await game.toNextTurn();

    expect(magikarp.getAbility().id).toBe(AbilityId.BALL_FETCH);
    expect(feebas.getAbility().id).toBe(AbilityId.INNARDS_OUT);

    magikarp.hp = 20;
    game.move.use(MoveId.X_SCISSOR);
    await game.toEndOfTurn();

    expect(magikarp).toHaveFainted();
    expect(feebas).toHaveFullHp();
  });

  it("should not activate if the ability holder's ability was suppressed before fainting", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    const magikarp = game.field.getEnemyPokemon();

    game.move.use(MoveId.GASTRO_ACID);
    await game.toNextTurn();

    expect(magikarp.summonData.abilitySuppressed).toBe(true);

    magikarp.hp = 20;
    game.move.use(MoveId.X_SCISSOR);
    await game.toEndOfTurn();

    expect(magikarp).toHaveFainted();
    expect(feebas).toHaveFullHp();
  });

  it("should not damage an ally in Double Battles", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const [magikarp1, magikarp2] = game.scene.getEnemyField();
    magikarp1.hp = 1;

    game.move.use(MoveId.PROTECT);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SURF);
    await game.toEndOfTurn();

    expect(magikarp1).toHaveFainted();
    expect(magikarp2).toHaveFullHp();
  });
});
