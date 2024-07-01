import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { MoveEndPhase, TurnEndPhase } from "#app/phases";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { ArenaTagType } from "#app/enums/arena-tag-type.js";
import { BattleStat } from "#app/data/battle-stat.js";


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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.FEEBAS);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TIDY_UP]);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(50);
  });

  it("spikes are cleared", async() => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPIKES, Moves.TIDY_UP]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPIKES, Moves.SPIKES, Moves.SPIKES, Moves.SPIKES]);
    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPIKES));
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doAttack(getMovePosition(game.scene, 0, Moves.TIDY_UP));
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.SPIKES)).toBeUndefined();

  }, 20000);

  it("stealth rocks are cleared", async() => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.STEALTH_ROCK, Moves.TIDY_UP]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.STEALTH_ROCK, Moves.STEALTH_ROCK, Moves.STEALTH_ROCK, Moves.STEALTH_ROCK]);
    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, Moves.STEALTH_ROCK));
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doAttack(getMovePosition(game.scene, 0, Moves.TIDY_UP));
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.STEALTH_ROCK)).toBeUndefined();

  }, 20000);

  it("toxic spikes are cleared", async() => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TOXIC_SPIKES, Moves.TIDY_UP]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TOXIC_SPIKES, Moves.TOXIC_SPIKES, Moves.TOXIC_SPIKES, Moves.TOXIC_SPIKES]);
    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, Moves.TOXIC_SPIKES));
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doAttack(getMovePosition(game.scene, 0, Moves.TIDY_UP));
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.TOXIC_SPIKES)).toBeUndefined();

  }, 20000);

  it("sticky webs are cleared", async() => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.STICKY_WEB, Moves.TIDY_UP]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.STICKY_WEB, Moves.STICKY_WEB, Moves.STICKY_WEB, Moves.STICKY_WEB]);

    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, Moves.STICKY_WEB));
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doAttack(getMovePosition(game.scene, 0, Moves.TIDY_UP));
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.STICKY_WEB)).toBeUndefined();

  }, 20000);

  it.skip("substitutes are cleared", async() => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SUBSTITUTE, Moves.TIDY_UP]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SUBSTITUTE, Moves.SUBSTITUTE, Moves.SUBSTITUTE, Moves.SUBSTITUTE]);

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
