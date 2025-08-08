import { allAbilities, allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .moveset([MoveId.GROWL, MoveId.SPLASH])
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.MAGIC_BOUNCE)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should reflect basic status moves", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.use(MoveId.GROWL);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.field.getPlayerPokemon().getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not bounce moves while the target is in the semi-invulnerable state", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.use(MoveId.GROWL);
    await game.move.forceEnemyMove(MoveId.FLY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon().getStatStage(Stat.ATK)).toBe(0);
  });

  it("should individually bounce back multi-target moves", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP]);

    game.move.use(MoveId.GROWL, 0);
    game.move.use(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");

    const user = game.scene.getPlayerField()[0];
    expect(user.getStatStage(Stat.ATK)).toBe(-2);
  });

  it("should still bounce back a move that would otherwise fail", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    game.field.getEnemyPokemon().setStatStage(Stat.ATK, -6);

    game.move.use(MoveId.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon().getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not bounce back a move that was just bounced", async () => {
    game.override.ability(AbilityId.MAGIC_BOUNCE);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon().getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should receive the stat change after reflecting a move back to a mirror armor user", async () => {
    game.override.ability(AbilityId.MIRROR_ARMOR);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getEnemyPokemon().getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not bounce back a move from a mold breaker user", async () => {
    game.override.ability(AbilityId.MOLD_BREAKER);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.use(MoveId.GROWL);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getEnemyPokemon().getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should bounce back a spread status move against both pokemon", async () => {
    game.override.battleStyle("double").enemyMoveset([MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP]);

    game.move.use(MoveId.GROWL, 0);
    game.move.use(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerField().every(p => p.getStatStage(Stat.ATK) === -2)).toBeTruthy();
  });

  it("should only bounce spikes back once in doubles when both targets have magic bounce", async () => {
    game.override.battleStyle("double").moveset([MoveId.SPIKES]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.SPIKES);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.PLAYER)!["layers"]).toBe(1);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY)).toBeUndefined();
  });

  it("should bounce spikes even when the target is protected", async () => {
    game.override.moveset([MoveId.SPIKES]).enemyMoveset([MoveId.PROTECT]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.SPIKES);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.PLAYER)!["layers"]).toBe(1);
  });

  it("should not bounce spikes when the target is in the semi-invulnerable state", async () => {
    game.override.moveset([MoveId.SPIKES]).enemyMoveset([MoveId.FLY]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.SPIKES);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY)!["layers"]).toBe(1);
  });

  it("should not bounce back curse", async () => {
    game.override.moveset([MoveId.CURSE]);
    await game.classicMode.startBattle([SpeciesId.GASTLY]);

    game.move.select(MoveId.CURSE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getEnemyPokemon().getTag(BattlerTagType.CURSED)).toBeDefined();
  });

  // TODO: enable when Magic Bounce is fixed to properly reset the hit count
  it.todo("should not cause encore to be interrupted after bouncing", async () => {
    game.override.moveset([MoveId.SPLASH, MoveId.GROWL, MoveId.ENCORE]).enemyMoveset([MoveId.TACKLE, MoveId.GROWL]);
    // game.override.ability(AbilityId.MOLD_BREAKER);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    // Give the player MOLD_BREAKER for this turn to bypass Magic Bounce.
    const playerAbilitySpy = game.field.mockAbility(playerPokemon, AbilityId.MOLD_BREAKER);

    // turn 1
    game.move.select(MoveId.ENCORE);
    await game.move.selectEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();
    expect(enemyPokemon.getTag(BattlerTagType.ENCORE)!["moveId"]).toBe(MoveId.TACKLE);

    // turn 2
    playerAbilitySpy.mockRestore();
    game.move.select(MoveId.GROWL);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemyPokemon.getTag(BattlerTagType.ENCORE)!["moveId"]).toBe(MoveId.TACKLE);
    expect(enemyPokemon.getLastXMoves()[0].move).toBe(MoveId.TACKLE);
  });

  // TODO: encore is failing if the last move was virtual.
  it.todo("should not cause the bounced move to count for encore", async () => {
    game.override
      .moveset([MoveId.SPLASH, MoveId.GROWL, MoveId.ENCORE])
      .enemyMoveset([MoveId.GROWL, MoveId.TACKLE])
      .enemyAbility(AbilityId.MAGIC_BOUNCE);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    // turn 1
    game.move.select(MoveId.GROWL);
    await game.move.selectEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    // Give the player MOLD_BREAKER for this turn to bypass Magic Bounce.
    vi.spyOn(playerPokemon, "getAbility").mockReturnValue(allAbilities[AbilityId.MOLD_BREAKER]);

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
    game.override.battleStyle("single").moveset([MoveId.STOMPING_TANTRUM, MoveId.CHARM]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const stomping_tantrum = allMoves[MoveId.STOMPING_TANTRUM];
    vi.spyOn(stomping_tantrum, "calculateBattlePower");

    game.move.select(MoveId.CHARM);
    await game.toNextTurn();

    game.move.select(MoveId.STOMPING_TANTRUM);
    await game.phaseInterceptor.to("BerryPhase");
    expect(stomping_tantrum.calculateBattlePower).toHaveReturnedWith(150);
  });

  // TODO: stomping tantrum should consider moves that were bounced
  it.todo("should boost enemy's stomping tantrum after failed bounce", async () => {
    game.override.enemyMoveset([MoveId.STOMPING_TANTRUM, MoveId.SPLASH, MoveId.CHARM]);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const stomping_tantrum = allMoves[MoveId.STOMPING_TANTRUM];
    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(stomping_tantrum, "calculateBattlePower");

    // Spore gets reflected back onto us
    game.move.select(MoveId.SPORE);
    await game.move.selectEnemyMove(MoveId.CHARM);
    await game.toNextTurn();
    expect(enemy.getLastXMoves(1)[0].result).toBe("success");

    game.move.select(MoveId.SPORE);
    await game.move.selectEnemyMove(MoveId.STOMPING_TANTRUM);
    await game.toNextTurn();
    expect(stomping_tantrum.calculateBattlePower).toHaveReturnedWith(150);
  });

  it("should respect immunities when bouncing a move", async () => {
    vi.spyOn(allMoves[MoveId.THUNDER_WAVE], "accuracy", "get").mockReturnValue(100);
    game.override.moveset([MoveId.THUNDER_WAVE, MoveId.GROWL]).ability(AbilityId.SOUNDPROOF);
    await game.classicMode.startBattle([SpeciesId.PHANPY]);

    // Turn 1 - thunder wave immunity test
    game.move.select(MoveId.THUNDER_WAVE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.field.getPlayerPokemon().status).toBeUndefined();

    // Turn 2 - soundproof immunity test
    game.move.select(MoveId.GROWL);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.field.getPlayerPokemon().getStatStage(Stat.ATK)).toBe(0);
  });

  it("should bounce back a move before the accuracy check", async () => {
    game.override.moveset([MoveId.SPORE]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const attacker = game.field.getPlayerPokemon();

    vi.spyOn(attacker, "getAccuracyMultiplier").mockReturnValue(0.0);
    game.move.select(MoveId.SPORE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.field.getPlayerPokemon().status?.effect).toBe(StatusEffect.SLEEP);
  });

  it("should take the accuracy of the magic bounce user into account", async () => {
    game.override.moveset([MoveId.SPORE]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const opponent = game.field.getEnemyPokemon();

    vi.spyOn(opponent, "getAccuracyMultiplier").mockReturnValue(0);
    game.move.select(MoveId.SPORE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.field.getPlayerPokemon().status).toBeUndefined();
  });

  it("should always apply the leftmost available target's magic bounce when bouncing moves like sticky webs in doubles", async () => {
    game.override.battleStyle("double").moveset([MoveId.STICKY_WEB, MoveId.SPLASH, MoveId.TRICK_ROOM]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP]);
    const [enemy_1, enemy_2] = game.scene.getEnemyField();
    // set speed just incase logic erroneously checks for speed order
    enemy_1.setStat(Stat.SPD, enemy_2.getStat(Stat.SPD) + 1);

    // turn 1
    game.move.select(MoveId.STICKY_WEB, 0);
    game.move.select(MoveId.TRICK_ROOM, 1);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(
      game.scene.arena
        .getTagOnSide(ArenaTagType.STICKY_WEB, ArenaTagSide.PLAYER)
        ?.getSourcePokemon()
        ?.getBattlerIndex(),
    ).toBe(BattlerIndex.ENEMY);
    game.scene.arena.removeTagOnSide(ArenaTagType.STICKY_WEB, ArenaTagSide.PLAYER, true);

    // turn 2
    game.move.select(MoveId.STICKY_WEB, 0);
    game.move.select(MoveId.TRICK_ROOM, 1);
    await game.phaseInterceptor.to("BerryPhase");
    expect(
      game.scene.arena
        .getTagOnSide(ArenaTagType.STICKY_WEB, ArenaTagSide.PLAYER)
        ?.getSourcePokemon()
        ?.getBattlerIndex(),
    ).toBe(BattlerIndex.ENEMY);
  });

  it("should not bounce back status moves that hit through semi-invulnerable states", async () => {
    game.override.moveset([MoveId.TOXIC, MoveId.CHARM]);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    game.move.select(MoveId.TOXIC);
    await game.move.selectEnemyMove(MoveId.FLY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.field.getEnemyPokemon().status?.effect).toBe(StatusEffect.TOXIC);
    expect(game.field.getPlayerPokemon().status).toBeUndefined();

    game.override.ability(AbilityId.NO_GUARD);
    game.move.select(MoveId.CHARM);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.field.getEnemyPokemon().getStatStage(Stat.ATK)).toBe(-2);
    expect(game.field.getPlayerPokemon().getStatStage(Stat.ATK)).toBe(0);
  });
});
