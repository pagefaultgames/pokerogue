import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Intimidate", () => {
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
      .criticalHits(false)
      .battleStyle("single")
      .enemySpecies(SpeciesId.RATTATA)
      .enemyAbility(AbilityId.INTIMIDATE)
      .ability(AbilityId.INTIMIDATE)
      .passiveAbility(AbilityId.NO_GUARD)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should lower all opponents' ATK by 1 stage on entry and switch", async () => {
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

    const enemy = game.field.getEnemyPokemon();
    expect(enemy.getStatStage(Stat.ATK)).toBe(-1);

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(enemy.getStatStage(Stat.ATK)).toBe(-2);
  });

  it("should lower ATK of all opponents in a double battle", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA]);

    const [enemy1, enemy2] = game.scene.getEnemyField();

    expect(enemy1.getStatStage(Stat.ATK)).toBe(-1);
    expect(enemy2.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not trigger on switching moves used by wild Pokemon", async () => {
    game.override.enemyMoveset(MoveId.VOLT_SWITCH);
    await game.classicMode.startBattle([SpeciesId.VENUSAUR]);

    const player = game.field.getPlayerPokemon();
    expect(player.getStatStage(Stat.ATK)).toBe(-1);

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    // doesn't lower attack due to not actually switching out
    expect(player.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should trigger on moves that switch user/target out during trainer battles", async () => {
    game.override.startingWave(5).enemyLevel(100);
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA]);

    const player = game.field.getPlayerPokemon();
    expect(player.getStatStage(Stat.ATK)).toBe(-1);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.TELEPORT);
    await game.toNextTurn();

    expect(player.getStatStage(Stat.ATK)).toBe(-2);

    game.move.use(MoveId.DRAGON_TAIL);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player.getStatStage(Stat.ATK)).toBe(-3);
  });
});
