import { BattlerIndex } from "#app/battle";
import { ArenaTagSide } from "#app/data/arena-tag";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Magic Bounce", () => {
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
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .moveset( [ Moves.GROWL ])
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.MAGIC_BOUNCE)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should reflect basic status moves", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not bounce moves while the target is in the semi-invulnerable state", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);
    await game.override.moveset([ Moves.GROWL ]);
    await game.override.enemyMoveset( [ Moves.FLY ]);

    game.move.select(Moves.GROWL);
    await game.forceEnemyMove(Moves.FLY);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should individually bounce back multi-target moves", async () => {
    game.override.battleType("double");
    game.override.moveset([ Moves.GROWL, Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.MAGIKARP, Species.MAGIKARP ]);

    game.move.select(Moves.GROWL, 0);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");

    const user = game.scene.getPlayerField()[0];
    expect(user.getStatStage(Stat.ATK)).toBe(-2);
  });

  it("should still bounce back a move that would otherwise fail", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);
    game.scene.getEnemyPokemon()?.setStatStage(Stat.ATK, -6);
    game.override.moveset([ Moves.GROWL ]);

    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not bounce back a move that was just bounced", async () => {
    game.override.ability(Abilities.MAGIC_BOUNCE);
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.ATK)).toBe(-1);
  });

  // todo while Mirror Armor is not implemented
  it.todo("should receive the stat change after reflecting a move back to a mirror armor user", async () => {
    game.override.ability(Abilities.MIRROR_ARMOR);
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()?.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not bounce back a move from a mold breaker user", async () => {
    game.override.ability(Abilities.MOLD_BREAKER);
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()?.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should bounce back a spread status against both pokemon", async () => {
    game.override.battleType("double");
    game.override.moveset([ Moves.GROWL, Moves.SPLASH ]);
    game.override.enemyMoveset([ Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.MAGIKARP, Species.MAGIKARP ]);

    game.move.select(Moves.GROWL, 0);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerField().every(p => p.getStatStage(Stat.ATK) === -1)).toBeTruthy();
  });

  it("should only bounce spikes back once in doubles when both targets have magic bounce", async () => {
    game.override.battleType("double");
    await game.classicMode.startBattle([ Species.MAGIKARP ]);
    game.override.moveset([ Moves.SPIKES ]);

    game.move.select(Moves.SPIKES);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.PLAYER)).toBe(1);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY)).toBe(0);
  });
});
