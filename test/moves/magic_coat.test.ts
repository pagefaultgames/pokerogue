import { BattlerIndex } from "#app/battle";
import { ArenaTagSide } from "#app/data/arena-tag";
import { allMoves } from "#app/data/data-lists";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Stat } from "#app/enums/stat";
import { StatusEffect } from "#app/enums/status-effect";
import { MoveResult } from "#app/field/pokemon";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.MAGIC_COAT);
  });

  it("should fail if the user goes last in the turn", async () => {
    game.override.moveset([MoveId.PROTECT]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.PROTECT);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getEnemyPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should fail if called again in the same turn due to moves like instruct", async () => {
    game.override.moveset([MoveId.INSTRUCT]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.INSTRUCT);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getEnemyPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should not reflect moves used on the next turn", async () => {
    game.override.moveset([MoveId.GROWL, MoveId.SPLASH]);
    game.override.enemyMoveset([MoveId.MAGIC_COAT, MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    // turn 1
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.MAGIC_COAT);
    await game.toNextTurn();

    // turn 2
    game.move.select(MoveId.GROWL);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should reflect basic status moves", async () => {
    game.override.moveset([MoveId.GROWL]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.GROWL);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should individually bounce back multi-target moves when used by both targets in doubles", async () => {
    game.override.battleStyle("double");
    game.override.moveset([MoveId.GROWL, MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.GROWL, 0);
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");

    const user = game.scene.getPlayerField()[0];
    expect(user.getStatStage(Stat.ATK)).toBe(-2);
  });

  it("should bounce back a spread status move against both pokemon", async () => {
    game.override.battleStyle("double");
    game.override.moveset([MoveId.GROWL, MoveId.SPLASH]);
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.MAGIC_COAT]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.GROWL, 0);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.MAGIC_COAT);

    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerField().every(p => p.getStatStage(Stat.ATK) === -1)).toBeTruthy();
  });

  it("should still bounce back a move that would otherwise fail", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    game.scene.getEnemyPokemon()?.setStatStage(Stat.ATK, -6);
    game.override.moveset([MoveId.GROWL]);

    game.move.select(MoveId.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not bounce back a move that was just bounced", async () => {
    game.override.battleStyle("double");
    game.override.ability(AbilityId.MAGIC_BOUNCE);
    game.override.moveset([MoveId.GROWL, MoveId.MAGIC_COAT]);
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.MAGIC_COAT]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.MAGIC_COAT, 0);
    game.move.select(MoveId.GROWL, 1);
    await game.move.selectEnemyMove(MoveId.MAGIC_COAT);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyField()[0].getStatStage(Stat.ATK)).toBe(0);
  });

  // todo while Mirror Armor is not implemented
  it.todo("should receive the stat change after reflecting a move back to a mirror armor user", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should still bounce back a move from a mold breaker user", async () => {
    game.override.ability(AbilityId.MOLD_BREAKER);
    game.override.moveset([MoveId.GROWL]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.ATK)).toBe(0);
    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should only bounce spikes back once when both targets use magic coat in doubles", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    game.override.moveset([MoveId.SPIKES]);

    game.move.select(MoveId.SPIKES);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.PLAYER)!["layers"]).toBe(1);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY)).toBeUndefined();
  });

  it("should not bounce back curse", async () => {
    game.override.starterSpecies(SpeciesId.GASTLY);
    await game.classicMode.startBattle([SpeciesId.GASTLY]);
    game.override.moveset([MoveId.CURSE]);

    game.move.select(MoveId.CURSE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.getTag(BattlerTagType.CURSED)).toBeDefined();
  });

  // TODO: encore is failing if the last move was virtual.
  it.todo("should not cause the bounced move to count for encore", async () => {
    game.override.moveset([MoveId.GROWL, MoveId.ENCORE]);
    game.override.enemyMoveset([MoveId.MAGIC_COAT, MoveId.TACKLE]);
    game.override.enemyAbility(AbilityId.MAGIC_BOUNCE);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    // turn 1
    game.move.select(MoveId.GROWL);
    await game.move.selectEnemyMove(MoveId.MAGIC_COAT);
    await game.toNextTurn();

    // turn 2
    game.move.select(MoveId.ENCORE);
    await game.move.selectEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemyPokemon.getTag(BattlerTagType.ENCORE)!["moveId"]).toBe(MoveId.TACKLE);
    expect(enemyPokemon.getLastXMoves()[0].move).toBe(MoveId.TACKLE);
  });

  // TODO: stomping tantrum should consider moves that were bounced.
  it.todo("should cause stomping tantrum to double in power when the last move was bounced", async () => {
    game.override.battleStyle("single");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    game.override.moveset([MoveId.STOMPING_TANTRUM, MoveId.CHARM]);

    const stomping_tantrum = allMoves[MoveId.STOMPING_TANTRUM];
    vi.spyOn(stomping_tantrum, "calculateBattlePower");

    game.move.select(MoveId.CHARM);
    await game.toNextTurn();

    game.move.select(MoveId.STOMPING_TANTRUM);
    await game.phaseInterceptor.to("BerryPhase");
    expect(stomping_tantrum.calculateBattlePower).toHaveReturnedWith(150);
  });

  // TODO: stomping tantrum should consider moves that were bounced.
  it.todo(
    "should properly cause the enemy's stomping tantrum to be doubled in power after bouncing and failing",
    async () => {
      game.override.enemyMoveset([MoveId.STOMPING_TANTRUM, MoveId.SPLASH, MoveId.CHARM]);
      await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

      const stomping_tantrum = allMoves[MoveId.STOMPING_TANTRUM];
      const enemy = game.scene.getEnemyPokemon()!;
      vi.spyOn(stomping_tantrum, "calculateBattlePower");

      game.move.select(MoveId.SPORE);
      await game.move.selectEnemyMove(MoveId.CHARM);
      await game.phaseInterceptor.to("TurnEndPhase");
      expect(enemy.getLastXMoves(1)[0].result).toBe("success");

      await game.phaseInterceptor.to("BerryPhase");
      expect(stomping_tantrum.calculateBattlePower).toHaveReturnedWith(75);

      await game.toNextTurn();
      game.move.select(MoveId.GROWL);
      await game.phaseInterceptor.to("BerryPhase");
      expect(stomping_tantrum.calculateBattlePower).toHaveReturnedWith(75);
    },
  );

  it("should respect immunities when bouncing a move", async () => {
    vi.spyOn(allMoves[MoveId.THUNDER_WAVE], "accuracy", "get").mockReturnValue(100);
    game.override.moveset([MoveId.THUNDER_WAVE, MoveId.GROWL]);
    game.override.ability(AbilityId.SOUNDPROOF);
    await game.classicMode.startBattle([SpeciesId.PHANPY]);

    // Turn 1 - thunder wave immunity test
    game.move.select(MoveId.THUNDER_WAVE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.status).toBeUndefined();

    // Turn 2 - soundproof immunity test
    game.move.select(MoveId.GROWL);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should bounce back a move before the accuracy check", async () => {
    game.override.moveset([MoveId.SPORE]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const attacker = game.scene.getPlayerPokemon()!;

    vi.spyOn(attacker, "getAccuracyMultiplier").mockReturnValue(0.0);
    game.move.select(MoveId.SPORE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.status?.effect).toBe(StatusEffect.SLEEP);
  });

  it("should take the accuracy of the magic bounce user into account", async () => {
    game.override.moveset([MoveId.SPORE]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const opponent = game.scene.getEnemyPokemon()!;

    vi.spyOn(opponent, "getAccuracyMultiplier").mockReturnValue(0);
    game.move.select(MoveId.SPORE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.status).toBeUndefined();
  });
});
