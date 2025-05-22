import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
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
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(Moves.TACKLE)
      .enemyAbility(Abilities.BALL_FETCH)
      .ability(Abilities.BALL_FETCH)
      .moveset([Moves.OBSTRUCT])
      .starterSpecies(Species.FEEBAS);
  });

  it("protects from contact damaging moves and lowers the opponent's defense by 2 stages", async () => {
    await game.classicMode.startBattle();

    game.move.select(Moves.OBSTRUCT);
    await game.phaseInterceptor.to("BerryPhase");

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(player.isFullHp()).toBe(true);
    expect(enemy.getStatStage(Stat.DEF)).toBe(-2);
  });

  it("bypasses accuracy checks when applying protection and defense reduction", async () => {
    await game.classicMode.startBattle();

    game.move.select(Moves.OBSTRUCT);
    await game.phaseInterceptor.to("MoveEffectPhase");
    await game.move.forceMiss();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.isFullHp()).toBe(true);
    expect(enemy.getStatStage(Stat.DEF)).toBe(-2);
  });

  it("protects from non-contact damaging moves and doesn't lower the opponent's defense by 2 stages", async () => {
    game.override.enemyMoveset(Moves.WATER_GUN);
    await game.classicMode.startBattle();

    game.move.select(Moves.OBSTRUCT);
    await game.phaseInterceptor.to("BerryPhase");

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(player.isFullHp()).toBe(true);
    expect(enemy.getStatStage(Stat.DEF)).toBe(0);
  });

  it("doesn't protect from status moves", async () => {
    game.override.enemyMoveset(Moves.GROWL);
    await game.classicMode.startBattle();

    game.move.select(Moves.OBSTRUCT);
    await game.phaseInterceptor.to("BerryPhase");

    const player = game.scene.getPlayerPokemon()!;

    expect(player.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("doesn't reduce the stats of an opponent with Clear Body/etc", async () => {
    game.override.enemyAbility(Abilities.CLEAR_BODY);
    await game.classicMode.startBattle();

    game.move.select(Moves.OBSTRUCT);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.DEF)).toBe(0);
  });
});
