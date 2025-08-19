import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Inverse Battle", () => {
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

    game.challengeMode.addChallenge(Challenges.INVERSE_BATTLE, 1, 1);

    game.override
      .battleStyle("single")
      .starterSpecies(SpeciesId.FEEBAS)
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("Immune types are 2x effective - Thunderbolt against Ground Type", async () => {
    game.override.moveset([MoveId.THUNDERBOLT]).enemySpecies(SpeciesId.SANDSHREW);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.THUNDERBOLT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveLastReturnedWith(2);
  });

  it("2x effective types are 0.5x effective - Thunderbolt against Flying Type", async () => {
    game.override.moveset([MoveId.THUNDERBOLT]).enemySpecies(SpeciesId.PIDGEY);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.THUNDERBOLT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveLastReturnedWith(0.5);
  });

  it("0.5x effective types are 2x effective - Thunderbolt against Electric Type", async () => {
    game.override.moveset([MoveId.THUNDERBOLT]).enemySpecies(SpeciesId.CHIKORITA);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.THUNDERBOLT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveLastReturnedWith(2);
  });

  it("Stealth Rock follows the inverse matchups - Stealth Rock against Charizard deals 1/32 of max HP", async () => {
    game.scene.arena.addTag(ArenaTagType.STEALTH_ROCK, 1, MoveId.STEALTH_ROCK, 0);
    game.override.enemySpecies(SpeciesId.CHARIZARD).enemyLevel(100);

    await game.challengeMode.startBattle();

    const charizard = game.field.getEnemyPokemon();

    const maxHp = charizard.getMaxHp();
    const damage_prediction = Math.max(Math.round(charizard.getMaxHp() / 32), 1);
    console.log("Damage calcuation before round: " + charizard.getMaxHp() / 32);
    const currentHp = charizard.hp;
    const expectedHP = maxHp - damage_prediction;

    console.log(
      "Charizard's max HP: " + maxHp,
      "Damage: " + damage_prediction,
      "Current HP: " + currentHp,
      "Expected HP: " + expectedHP,
    );
    expect(currentHp).toBeGreaterThan((maxHp * 31) / 32 - 1);
  });

  it("Freeze Dry is 2x effective against Water Type like other Ice type Move - Freeze Dry against Squirtle", async () => {
    game.override.moveset([MoveId.FREEZE_DRY]).enemySpecies(SpeciesId.SQUIRTLE);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveLastReturnedWith(2);
  });

  it("Water Absorb should heal against water moves - Water Absorb against Water gun", async () => {
    game.override.moveset([MoveId.WATER_GUN]).enemyAbility(AbilityId.WATER_ABSORB);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    enemy.hp = enemy.getMaxHp() - 1;
    game.move.select(MoveId.WATER_GUN);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(enemy.hp).toBe(enemy.getMaxHp());
  });

  it("Fire type does not get burned - Will-O-Wisp against Charmander", async () => {
    game.override.moveset([MoveId.WILL_O_WISP]).enemySpecies(SpeciesId.CHARMANDER);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.WILL_O_WISP);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(enemy.status?.effect).not.toBe(StatusEffect.BURN);
  });

  it("Electric type does not get paralyzed - Nuzzle against Pikachu", async () => {
    game.override.moveset([MoveId.NUZZLE]).enemySpecies(SpeciesId.PIKACHU).enemyLevel(50);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.NUZZLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(enemy.status?.effect).not.toBe(StatusEffect.PARALYSIS);
  });

  it("Ground type is not immune to Thunder Wave - Thunder Wave against Sandshrew", async () => {
    game.override.moveset([MoveId.THUNDER_WAVE]).enemySpecies(SpeciesId.SANDSHREW);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.THUNDER_WAVE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(enemy.status?.effect).toBe(StatusEffect.PARALYSIS);
  });

  it("Anticipation should trigger on 2x effective moves", async () => {
    game.override.moveset([MoveId.THUNDERBOLT]).enemySpecies(SpeciesId.SANDSHREW).enemyAbility(AbilityId.ANTICIPATION);

    await game.challengeMode.startBattle();

    expect(game.field.getEnemyPokemon().waveData.abilitiesApplied).toContain(AbilityId.ANTICIPATION);
  });

  it("Conversion 2 should change the type to the resistive type - Conversion 2 against Dragonite", async () => {
    game.override.moveset([MoveId.CONVERSION_2]).enemyMoveset(MoveId.DRAGON_CLAW);

    await game.challengeMode.startBattle();

    const player = game.field.getPlayerPokemon();

    game.move.select(MoveId.CONVERSION_2);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.getTypes()[0]).toBe(PokemonType.DRAGON);
  });

  it("Flying Press should be 0.25x effective against Grass + Dark Type - Flying Press against Meowscarada", async () => {
    game.override.moveset([MoveId.FLYING_PRESS]).enemySpecies(SpeciesId.MEOWSCARADA);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FLYING_PRESS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveLastReturnedWith(0.25);
  });

  it("Scrappy ability has no effect - Tackle against Ghost Type still 2x effective with Scrappy", async () => {
    game.override.moveset([MoveId.TACKLE]).ability(AbilityId.SCRAPPY).enemySpecies(SpeciesId.GASTLY);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveLastReturnedWith(2);
  });

  it("FORESIGHT has no effect - Tackle against Ghost Type still 2x effective with Foresight", async () => {
    game.override.moveset([MoveId.FORESIGHT, MoveId.TACKLE]).enemySpecies(SpeciesId.GASTLY);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FORESIGHT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    game.move.select(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveLastReturnedWith(2);
  });
});
