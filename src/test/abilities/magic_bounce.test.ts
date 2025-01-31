import { BattlerIndex } from "#app/battle";
import { ArenaTagSide } from "#app/data/arena-tag";
import { allMoves } from "#app/data/move";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .moveset( [ Moves.GROWL, Moves.SPLASH ])
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.MAGIC_BOUNCE)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should reflect basic status moves", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not bounce moves while the target is in the semi-invulnerable state", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);
    await game.override.moveset([ Moves.GROWL ]);
    await game.override.enemyMoveset( [ Moves.FLY ]);

    game.move.select(Moves.GROWL);
    await game.forceEnemyMove(Moves.FLY);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(0);
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

    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not bounce back a move that was just bounced", async () => {
    game.override.ability(Abilities.MAGIC_BOUNCE);
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  // todo while Mirror Armor is not implemented
  it.todo("should receive the stat change after reflecting a move back to a mirror armor user", async () => {
    game.override.ability(Abilities.MIRROR_ARMOR);
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not bounce back a move from a mold breaker user", async () => {
    game.override.ability(Abilities.MOLD_BREAKER);
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should bounce back a spread status move against both pokemon", async () => {
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

  it("should not bounce back curse", async() => {
    await game.classicMode.startBattle([ Species.GASTLY ]);
    game.override.moveset([ Moves.CURSE ]);

    game.move.select(Moves.CURSE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.getTag(BattlerTagType.CURSED)).toBeDefined();
  });

  // todo: a move reflected by magic bounce counts as though it failed.

  it("should not count the bounced move as the last move used", async () => {
    game.override.enemyMoveset([ Moves.INSTRUCT, Moves.GROWL, Moves.SPLASH ]);
    game.override.battleType("double");
    await game.classicMode.startBattle([ Species.MAGIKARP, Species.MAGIKARP ]);

    game.move.select(Moves.GROWL, 0);
    game.move.select(Moves.SPLASH, 1);
    game.forceEnemyMove(Moves.SPLASH);
    game.forceEnemyMove(Moves.INSTRUCT);
    game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2 ]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getEnemyPokemon()!.getLastXMoves(1)[0].move).toEqual([ Moves.SPLASH ]);
  });

  it("should cause stomping tantrum to double in power if the bounced move fails", async () => {
    game.override.moveset([ Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should properly cause the enemy's stomping tantrum to be doubled in power after bouncing", async () => {
    game.override.battleType("double");
    game.override.enemyMoveset([ Moves.GROWL, Moves.STOMPING_TANTRUM, Moves.CHARM, Moves.SPLASH ]);
    game.override.enemyLevel(50);
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const stomping_tantrum = allMoves[Moves.STOMPING_TANTRUM];
    vi.spyOn(stomping_tantrum, "calculateBattlePower");

    game.move.select(Moves.CHARM, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("TurnEndPhase");

    game.move.select(Moves.STOMPING_TANTRUM, 0, BattlerIndex.ENEMY_2);
    await game.phaseInterceptor.to("BerryPhase");
    expect(stomping_tantrum.calculateBattlePower).toHaveReturnedWith(150);

    await game.toNextTurn();
    game.move.select(Moves.GROWL, 0);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");
    expect(stomping_tantrum.calculateBattlePower).toHaveReturnedWith(75);
  });

  it("should respect immunities when bouncing a move", async () => {
    vi.spyOn(allMoves[Moves.THUNDER_WAVE], "accuracy", "get").mockReturnValue(100);
    game.override.moveset([ Moves.THUNDER_WAVE, Moves.GROWL ]);
    game.override.ability(Abilities.SOUNDPROOF);
    await game.classicMode.startBattle([ Species.PHANPY ]);

    // Turn 1 - thunder wave immunity test
    game.move.select(Moves.THUNDER_WAVE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.status).toBeNull();

    // Turn 2 - soundproof immunity test
    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should bounce back a move before the accuracy check", async () => {
    game.override.moveset([ Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const attacker = game.scene.getPlayerPokemon()!;

    vi.spyOn(attacker, "getAccuracyMultiplier").mockReturnValue(0.0);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should take the accuracy of the magic bounce user into account", async () => {
    game.override.moveset([ Moves.SPORE ]);
    const opponent = game.scene.getEnemyPokemon()!;
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    vi.spyOn(opponent, "getAccuracyMultiplier").mockReturnValue(0);
    game.move.select(Moves.SPORE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.status).toBeNull();
  });
});
