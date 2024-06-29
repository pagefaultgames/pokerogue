import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { MoveEffectPhase, TurnEndPhase } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Species } from "#app/enums/species.js";
import { Type } from "#app/data/type";
import * as Utils from "#app/utils";
import { BattleStat } from "#app/data/battle-stat";
import { BattlerTagType } from "#enums/battler-tag-type";
import { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import { OneHitKOAccuracyAttr } from "#app/data/move";

describe("Moves - Fissure", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let partyPokemon: PlayerPokemon;
  let enemyPokemon: EnemyPokemon;

  const baseFissureAccuracy = 30;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);

    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.PORYGON);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FISSURE]);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.PORYGON);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "OPP_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);

    await game.startBattle();

    partyPokemon = game.scene.getParty()[0];
    partyPokemon.addTag(BattlerTagType.NO_CRIT, 99);

    enemyPokemon = game.scene.getEnemyPokemon();
    enemyPokemon.addTag(BattlerTagType.NO_CRIT, 99);
  });

  it("always hits with no guard", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NO_GUARD);

    game.doAttack(getMovePosition(game.scene, 0, Moves.FISSURE));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.isFainted()).toBe(true);
  });

  it("ignores resistances", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NO_GUARD);
    vi.spyOn(enemyPokemon, "getTypes").mockReturnValue([Type.BUG]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.FISSURE));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.isFainted()).toBe(true);
  });

  it("ignores damage modification from abilities such as fur coat", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NO_GUARD);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.FUR_COAT);

    game.doAttack(getMovePosition(game.scene, 0, Moves.FISSURE));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.isFainted()).toBe(true);
  });

  it("accuracy scales with level difference", async () => {
    const oneHitKOAccuracyAttr = new OneHitKOAccuracyAttr();
    const fissureMove = partyPokemon.getMoveset()[getMovePosition(game.scene, 0, Moves.FISSURE)].getMove();
    const accuracy = new Utils.NumberHolder(0);

    partyPokemon.level = 1;
    enemyPokemon.level = 1;
    oneHitKOAccuracyAttr.apply(partyPokemon, enemyPokemon, fissureMove, [accuracy]);
    expect(accuracy.value).toBe(30);

    // we don't follow bulbapedia's formula. we use the ratio between the target and user's levels instead of the difference.
    partyPokemon.level = 100;
    enemyPokemon.level = 99;
    oneHitKOAccuracyAttr.apply(partyPokemon, enemyPokemon, fissureMove, [accuracy]);
    expect(accuracy.value).toBe(31);

    partyPokemon.level = 1000;
    enemyPokemon.level = 1;
    oneHitKOAccuracyAttr.apply(partyPokemon, enemyPokemon, fissureMove, [accuracy]);
    expect(accuracy.value).toBe(100);
  });

  it("ignores accuracy stat", async () => {
    const fissurePokemonMove = partyPokemon.getMoveset()[getMovePosition(game.scene, 0, Moves.FISSURE)];
    const moveEffectPhase = new MoveEffectPhase(game.scene, partyPokemon.getFieldIndex(), [enemyPokemon.getFieldIndex()], fissurePokemonMove);

    partyPokemon.summonData.battleStats[BattleStat.ACC] = 6;
    const hitAccuracy = moveEffectPhase.getHitAccuracy(enemyPokemon);

    expect(hitAccuracy).toBe(baseFissureAccuracy);
  });

  it("ignores evasion stat", async () => {
    const fissurePokemonMove = partyPokemon.getMoveset()[getMovePosition(game.scene, 0, Moves.FISSURE)];
    const moveEffectPhase = new MoveEffectPhase(game.scene, partyPokemon.getFieldIndex(), [enemyPokemon.getFieldIndex()], fissurePokemonMove);

    enemyPokemon.summonData.battleStats[BattleStat.EVA] = 6;
    const hitAccuracy = moveEffectPhase.getHitAccuracy(enemyPokemon);

    expect(hitAccuracy).toBe(baseFissureAccuracy);
  });

  it("ignores accuracy modifiers such as gravity, wide lens and compound eyes", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.COMPOUND_EYES);

    const fissurePokemonMove = partyPokemon.getMoveset()[getMovePosition(game.scene, 0, Moves.FISSURE)];
    const moveEffectPhase = new MoveEffectPhase(game.scene, partyPokemon.getFieldIndex(), [enemyPokemon.getFieldIndex()], fissurePokemonMove);

    const hitAccuracy = moveEffectPhase.getHitAccuracy(enemyPokemon);

    expect(hitAccuracy).toBe(baseFissureAccuracy);
  });

  it("can hit a pokemon in a semi-invulnerable state using lock-on", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FISSURE, Moves.LOCK_ON]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FLY, Moves.FLY, Moves.FLY, Moves.FLY]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.LOCK_ON));
    await game.phaseInterceptor.to(TurnEndPhase);

    // make sure we go first so we catch the enemy in fly
    partyPokemon.summonData.battleStats[BattleStat.SPD] = 6;

    game.doAttack(getMovePosition(game.scene, 0, Moves.FISSURE));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.isFainted()).toBe(true);
  });

  it("can hit a pokemon using dig", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NO_GUARD);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FISSURE, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.DIG, Moves.DIG, Moves.DIG, Moves.DIG]);

    // make sure we go second so we catch the enemy in dig
    partyPokemon.summonData.battleStats[BattleStat.SPD] = -6;

    game.doAttack(getMovePosition(game.scene, 0, Moves.FISSURE));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.isFainted()).toBe(true);
  });

  it("can't otherwise hit a pokemon in a semi-invulnerable state", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NO_GUARD);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FISSURE, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FLY, Moves.FLY, Moves.FLY, Moves.FLY]);

    // make sure we go second so we catch the enemy in fly
    partyPokemon.summonData.battleStats[BattleStat.SPD] = -6;

    game.doAttack(getMovePosition(game.scene, 0, Moves.FISSURE));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.isFainted()).toBe(false);
  });
});
