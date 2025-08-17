import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Obstruct", () => {
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.TACKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.BALL_FETCH)
      .moveset([MoveId.OBSTRUCT])
      .starterSpecies(SpeciesId.FEEBAS);
  });

  it("protects from contact damaging moves and lowers the opponent's defense by 2 stages", async () => {
    await game.classicMode.startBattle();

    game.move.select(MoveId.OBSTRUCT);
    await game.phaseInterceptor.to("BerryPhase");

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    expect(player.isFullHp()).toBe(true);
    expect(enemy.getStatStage(Stat.DEF)).toBe(-2);
  });

  it("bypasses accuracy checks when applying protection and defense reduction", async () => {
    await game.classicMode.startBattle();

    game.move.select(MoveId.OBSTRUCT);
    await game.phaseInterceptor.to("MoveEffectPhase");
    await game.move.forceMiss();

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.isFullHp()).toBe(true);
    expect(enemy.getStatStage(Stat.DEF)).toBe(-2);
  });

  it("protects from non-contact damaging moves and doesn't lower the opponent's defense by 2 stages", async () => {
    game.override.enemyMoveset(MoveId.WATER_GUN);
    await game.classicMode.startBattle();

    game.move.select(MoveId.OBSTRUCT);
    await game.phaseInterceptor.to("BerryPhase");

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    expect(player.isFullHp()).toBe(true);
    expect(enemy.getStatStage(Stat.DEF)).toBe(0);
  });

  it("doesn't protect from status moves", async () => {
    game.override.enemyMoveset(MoveId.GROWL);
    await game.classicMode.startBattle();

    game.move.select(MoveId.OBSTRUCT);
    await game.phaseInterceptor.to("BerryPhase");

    const player = game.field.getPlayerPokemon();

    expect(player.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("doesn't reduce the stats of an opponent with Clear Body/etc", async () => {
    game.override.enemyAbility(AbilityId.CLEAR_BODY);
    await game.classicMode.startBattle();

    game.move.select(MoveId.OBSTRUCT);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getEnemyPokemon().getStatStage(Stat.DEF)).toBe(0);
  });
});
