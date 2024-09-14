import { Moves } from "#app/enums/moves";
import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Obstruct", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const TIMEOUT = 20 * 1000;

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
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .ability(Abilities.BALL_FETCH)
      .moveset([Moves.OBSTRUCT]);
  });

  it("protects from contact damaging moves and lowers the opponent's defense by 2 stages", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.ICE_PUNCH));
    await game.classicMode.startBattle();

    game.move.select(Moves.OBSTRUCT);
    await game.phaseInterceptor.to("BerryPhase");

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(player.isFullHp()).toBe(true);
    expect(enemy.getStatStage(Stat.DEF)).toBe(-2);
  }, TIMEOUT);

  it("bypasses accuracy checks when applying protection and defense reduction", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.ICE_PUNCH));
    await game.classicMode.startBattle();

    game.move.select(Moves.OBSTRUCT);
    await game.phaseInterceptor.to("MoveEffectPhase");
    await game.move.forceMiss();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.isFullHp()).toBe(true);
    expect(enemy.getStatStage(Stat.DEF)).toBe(-2);
  }, TIMEOUT
  );

  it("protects from non-contact damaging moves and doesn't lower the opponent's defense by 2 stages", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.WATER_GUN));
    await game.classicMode.startBattle();

    game.move.select(Moves.OBSTRUCT);
    await game.phaseInterceptor.to("BerryPhase");

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(player.isFullHp()).toBe(true);
    expect(enemy.getStatStage(Stat.DEF)).toBe(0);
  }, TIMEOUT);

  it("doesn't protect from status moves", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.GROWL));
    await game.classicMode.startBattle();

    game.move.select(Moves.OBSTRUCT);
    await game.phaseInterceptor.to("BerryPhase");

    const player = game.scene.getPlayerPokemon()!;

    expect(player.getStatStage(Stat.ATK)).toBe(-1);
  }, TIMEOUT);
});
