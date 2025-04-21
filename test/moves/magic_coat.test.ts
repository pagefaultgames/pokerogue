import { BattlerIndex } from "#app/battle";
import { ArenaTagSide } from "#app/data/arena-tag";
import { allMoves } from "#app/data/moves/move";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Stat } from "#app/enums/stat";
import { StatusEffect } from "#app/enums/status-effect";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Magic Coat", () => {
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
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.MAGIC_COAT);
  });

  it("should fail if the user goes last in the turn", async () => {
    game.override.moveset([Moves.PROTECT]);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.PROTECT);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getEnemyPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should fail if called again in the same turn due to moves like instruct", async () => {
    game.override.moveset([Moves.INSTRUCT]);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.INSTRUCT);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getEnemyPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should not reflect moves used on the next turn", async () => {
    game.override.moveset([Moves.GROWL, Moves.SPLASH]);
    game.override.enemyMoveset([Moves.MAGIC_COAT, Moves.SPLASH]);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    // turn 1
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.MAGIC_COAT);
    await game.toNextTurn();

    // turn 2
    game.move.select(Moves.GROWL);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should reflect basic status moves", async () => {
    game.override.moveset([Moves.GROWL]);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should individually bounce back multi-target moves when used by both targets in doubles", async () => {
    game.override.battleStyle("double");
    game.override.moveset([Moves.GROWL, Moves.SPLASH]);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.MAGIKARP]);

    game.move.select(Moves.GROWL, 0);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");

    const user = game.scene.getPlayerField()[0];
    expect(user.getStatStage(Stat.ATK)).toBe(-2);
  });

  it("should bounce back a spread status move against both pokemon", async () => {
    game.override.battleStyle("double");
    game.override.moveset([Moves.GROWL, Moves.SPLASH]);
    game.override.enemyMoveset([Moves.SPLASH, Moves.MAGIC_COAT]);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.MAGIKARP]);

    game.move.select(Moves.GROWL, 0);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.forceEnemyMove(Moves.MAGIC_COAT);

    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerField().every(p => p.getStatStage(Stat.ATK) === -1)).toBeTruthy();
  });

  it("should still bounce back a move that would otherwise fail", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);
    game.scene.getEnemyPokemon()?.setStatStage(Stat.ATK, -6);
    game.override.moveset([Moves.GROWL]);

    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not bounce back a move that was just bounced", async () => {
    game.override.battleStyle("double");
    game.override.ability(Abilities.MAGIC_BOUNCE);
    game.override.moveset([Moves.GROWL, Moves.MAGIC_COAT]);
    game.override.enemyMoveset([Moves.SPLASH, Moves.MAGIC_COAT]);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.MAGIKARP]);

    game.move.select(Moves.MAGIC_COAT, 0);
    game.move.select(Moves.GROWL, 1);
    await game.forceEnemyMove(Moves.MAGIC_COAT);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyField()[0].getStatStage(Stat.ATK)).toBe(0);
  });

  // todo while Mirror Armor is not implemented
  it.todo("should receive the stat change after reflecting a move back to a mirror armor user", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should still bounce back a move from a mold breaker user", async () => {
    game.override.ability(Abilities.MOLD_BREAKER);
    game.override.moveset([Moves.GROWL]);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.ATK)).toBe(0);
    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should only bounce spikes back once when both targets use magic coat in doubles", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([Species.MAGIKARP]);
    game.override.moveset([Moves.SPIKES]);

    game.move.select(Moves.SPIKES);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.PLAYER)!["layers"]).toBe(1);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY)).toBeUndefined();
  });

  it("should not bounce back curse", async () => {
    game.override.starterSpecies(Species.GASTLY);
    await game.classicMode.startBattle([Species.GASTLY]);
    game.override.moveset([Moves.CURSE]);

    game.move.select(Moves.CURSE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.getTag(BattlerTagType.CURSED)).toBeDefined();
  });

  // TODO: encore is failing if the last move was virtual.
  it.todo("should not cause the bounced move to count for encore", async () => {
    game.override.moveset([Moves.GROWL, Moves.ENCORE]);
    game.override.enemyMoveset([Moves.MAGIC_COAT, Moves.TACKLE]);
    game.override.enemyAbility(Abilities.MAGIC_BOUNCE);

    await game.classicMode.startBattle([Species.MAGIKARP]);
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    // turn 1
    game.move.select(Moves.GROWL);
    await game.forceEnemyMove(Moves.MAGIC_COAT);
    await game.toNextTurn();

    // turn 2
    game.move.select(Moves.ENCORE);
    await game.forceEnemyMove(Moves.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemyPokemon.getTag(BattlerTagType.ENCORE)!["moveId"]).toBe(Moves.TACKLE);
    expect(enemyPokemon.getLastXMoves()[0].move).toBe(Moves.TACKLE);
  });

  // TODO: stomping tantrum should consider moves that were bounced.
  it.todo("should cause stomping tantrum to double in power when the last move was bounced", async () => {
    game.override.battleStyle("single");
    await game.classicMode.startBattle([Species.MAGIKARP]);
    game.override.moveset([Moves.STOMPING_TANTRUM, Moves.CHARM]);

    const stomping_tantrum = allMoves[Moves.STOMPING_TANTRUM];
    vi.spyOn(stomping_tantrum, "calculateBattlePower");

    game.move.select(Moves.CHARM);
    await game.toNextTurn();

    game.move.select(Moves.STOMPING_TANTRUM);
    await game.phaseInterceptor.to("BerryPhase");
    expect(stomping_tantrum.calculateBattlePower).toHaveReturnedWith(150);
  });

  // TODO: stomping tantrum should consider moves that were bounced.
  it.todo(
    "should properly cause the enemy's stomping tantrum to be doubled in power after bouncing and failing",
    async () => {
      game.override.enemyMoveset([Moves.STOMPING_TANTRUM, Moves.SPLASH, Moves.CHARM]);
      await game.classicMode.startBattle([Species.BULBASAUR]);

      const stomping_tantrum = allMoves[Moves.STOMPING_TANTRUM];
      const enemy = game.scene.getEnemyPokemon()!;
      vi.spyOn(stomping_tantrum, "calculateBattlePower");

      game.move.select(Moves.SPORE);
      await game.forceEnemyMove(Moves.CHARM);
      await game.phaseInterceptor.to("TurnEndPhase");
      expect(enemy.getLastXMoves(1)[0].result).toBe("success");

      await game.phaseInterceptor.to("BerryPhase");
      expect(stomping_tantrum.calculateBattlePower).toHaveReturnedWith(75);

      await game.toNextTurn();
      game.move.select(Moves.GROWL);
      await game.phaseInterceptor.to("BerryPhase");
      expect(stomping_tantrum.calculateBattlePower).toHaveReturnedWith(75);
    },
  );

  it("should respect immunities when bouncing a move", async () => {
    vi.spyOn(allMoves[Moves.THUNDER_WAVE], "accuracy", "get").mockReturnValue(100);
    game.override.moveset([Moves.THUNDER_WAVE, Moves.GROWL]);
    game.override.ability(Abilities.SOUNDPROOF);
    await game.classicMode.startBattle([Species.PHANPY]);

    // Turn 1 - thunder wave immunity test
    game.move.select(Moves.THUNDER_WAVE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.status).toBeUndefined();

    // Turn 2 - soundproof immunity test
    game.move.select(Moves.GROWL);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should bounce back a move before the accuracy check", async () => {
    game.override.moveset([Moves.SPORE]);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const attacker = game.scene.getPlayerPokemon()!;

    vi.spyOn(attacker, "getAccuracyMultiplier").mockReturnValue(0.0);
    game.move.select(Moves.SPORE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.status?.effect).toBe(StatusEffect.SLEEP);
  });

  it("should take the accuracy of the magic bounce user into account", async () => {
    game.override.moveset([Moves.SPORE]);
    await game.classicMode.startBattle([Species.MAGIKARP]);
    const opponent = game.scene.getEnemyPokemon()!;

    vi.spyOn(opponent, "getAccuracyMultiplier").mockReturnValue(0);
    game.move.select(Moves.SPORE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.status).toBeUndefined();
  });
});
