import { BattleStat } from "#app/data/battle-stat.js";
import { ArenaTagType } from "#app/enums/arena-tag-type.js";
import { MoveEndPhase, TurnEndPhase } from "#app/phases";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "#test/utils/testUtils";


describe("Moves - Tidy Up", () => {
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
    game.override.battleType("single");
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.starterSpecies(Species.FEEBAS);
    game.override.ability(Abilities.BALL_FETCH);
    game.override.moveset([Moves.TIDY_UP]);
    game.override.startingLevel(50);
  });

  it("spikes are cleared", async() => {
    game.override.moveset([Moves.SPIKES, Moves.TIDY_UP]);
    game.override.enemyMoveset([Moves.SPIKES, Moves.SPIKES, Moves.SPIKES, Moves.SPIKES]);
    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPIKES));
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doAttack(getMovePosition(game.scene, 0, Moves.TIDY_UP));
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.SPIKES)).toBeUndefined();

  }, 20000);

  it("stealth rocks are cleared", async() => {
    game.override.moveset([Moves.STEALTH_ROCK, Moves.TIDY_UP]);
    game.override.enemyMoveset([Moves.STEALTH_ROCK, Moves.STEALTH_ROCK, Moves.STEALTH_ROCK, Moves.STEALTH_ROCK]);
    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, Moves.STEALTH_ROCK));
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doAttack(getMovePosition(game.scene, 0, Moves.TIDY_UP));
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.STEALTH_ROCK)).toBeUndefined();

  }, 20000);

  it("toxic spikes are cleared", async() => {
    game.override.moveset([Moves.TOXIC_SPIKES, Moves.TIDY_UP]);
    game.override.enemyMoveset([Moves.TOXIC_SPIKES, Moves.TOXIC_SPIKES, Moves.TOXIC_SPIKES, Moves.TOXIC_SPIKES]);
    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, Moves.TOXIC_SPIKES));
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doAttack(getMovePosition(game.scene, 0, Moves.TIDY_UP));
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.TOXIC_SPIKES)).toBeUndefined();

  }, 20000);

  it("sticky webs are cleared", async() => {
    game.override.moveset([Moves.STICKY_WEB, Moves.TIDY_UP]);
    game.override.enemyMoveset([Moves.STICKY_WEB, Moves.STICKY_WEB, Moves.STICKY_WEB, Moves.STICKY_WEB]);

    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, Moves.STICKY_WEB));
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doAttack(getMovePosition(game.scene, 0, Moves.TIDY_UP));
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.STICKY_WEB)).toBeUndefined();

  }, 20000);

  it.skip("substitutes are cleared", async() => {
    game.override.moveset([Moves.SUBSTITUTE, Moves.TIDY_UP]);
    game.override.enemyMoveset([Moves.SUBSTITUTE, Moves.SUBSTITUTE, Moves.SUBSTITUTE, Moves.SUBSTITUTE]);

    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doAttack(getMovePosition(game.scene, 0, Moves.TIDY_UP));
    await game.phaseInterceptor.to(MoveEndPhase);
    // TODO: check for subs here once the move is implemented

  }, 20000);

  it("user's stats are raised with no traps set", async() => {
    await game.startBattle();
    const player = game.scene.getPlayerPokemon().summonData.battleStats;

    expect(player[BattleStat.ATK]).toBe(0);
    expect(player[BattleStat.SPD]).toBe(0);

    game.doAttack(getMovePosition(game.scene, 0, Moves.TIDY_UP));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player[BattleStat.ATK]).toBe(+1);
    expect(player[BattleStat.SPD]).toBe(+1);

  }, 20000);

});
