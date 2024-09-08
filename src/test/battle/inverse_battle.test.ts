import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/move";
import { Type } from "#app/data/type";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Challenges } from "#enums/challenges";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TIMEOUT = 20 * 1000;

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
      .battleType("single")
      .starterSpecies(Species.FEEBAS)
      .ability(Abilities.BALL_FETCH)
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH);
  });

  it("1. immune types are 2x effective - Thunderbolt against Ground Type", async () => {
    game.override.enemySpecies(Species.SANDSHREW);

    await game.challengeMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(enemy.getMoveEffectiveness(player, allMoves[Moves.THUNDERBOLT])).toBe(2);
  }, TIMEOUT);

  it("2. 2x effective types are 0.5x effective - Thunderbolt against Flying Type", async () => {
    game.override.enemySpecies(Species.PIDGEY);

    await game.challengeMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(enemy.getMoveEffectiveness(player, allMoves[Moves.THUNDERBOLT])).toBe(0.5);
  }, TIMEOUT);

  it("3. 0.5x effective types are 2x effective - Thunderbolt against Electric Type", async () => {
    game.override.enemySpecies(Species.CHIKORITA);

    await game.challengeMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(enemy.getMoveEffectiveness(player, allMoves[Moves.THUNDERBOLT])).toBe(2);
  }, TIMEOUT);

  it("4. Stealth Rock follows the inverse matchups - Stealth Rock against Charizard deals 1/32 of max HP", async () => {
    game.scene.arena.addTag(ArenaTagType.STEALTH_ROCK, 1, Moves.STEALTH_ROCK, 0);
    game.override
      .enemySpecies(Species.CHARIZARD)
      .enemyLevel(100);

    await game.challengeMode.startBattle();

    const charizard = game.scene.getEnemyPokemon()!;

    const maxHp = charizard.getMaxHp();
    const damage_prediction = Math.max(Math.round(charizard.getMaxHp() / 32), 1);
    console.log("Damage calcuation before round: " + charizard.getMaxHp() / 32);
    const currentHp = charizard.hp;
    const expectedHP = maxHp - damage_prediction;

    console.log("Charizard's max HP: " + maxHp, "Damage: " + damage_prediction, "Current HP: " + currentHp, "Expected HP: " + expectedHP);
    expect(currentHp).toBeGreaterThan(maxHp * 31 / 32 - 1);
  }, TIMEOUT);

  it("5. Freeze Dry is 2x effective against Water Type like other Ice type Move - Freeze Dry against Squirtle", async () => {
    game.override.enemySpecies(Species.SQUIRTLE);

    await game.challengeMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(enemy.getMoveEffectiveness(player, allMoves[Moves.FREEZE_DRY])).toBe(2);
  }, TIMEOUT);

  it("6. Water Absorb should heal against water moves - Water Absorb against Water gun", async () => {
    game.override
      .moveset([Moves.WATER_GUN])
      .enemyAbility(Abilities.WATER_ABSORB);

    await game.challengeMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = enemy.getMaxHp() - 1;
    game.move.select(Moves.WATER_GUN);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(enemy.hp).toBe(enemy.getMaxHp());
  }, TIMEOUT);

  it("7. Fire type does not get burned - Will-O-Wisp against Charmander", async () => {
    game.override
      .moveset([Moves.WILL_O_WISP])
      .enemySpecies(Species.CHARMANDER);

    await game.challengeMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.WILL_O_WISP);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(enemy.status?.effect).not.toBe(StatusEffect.BURN);
  }, TIMEOUT);

  it("8. Electric type does not get paralyzed - Nuzzle against Pikachu", async () => {
    game.override
      .moveset([Moves.NUZZLE])
      .enemySpecies(Species.PIKACHU)
      .enemyLevel(50);

    await game.challengeMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.NUZZLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(enemy.status?.effect).not.toBe(StatusEffect.PARALYSIS);
  }, TIMEOUT);


  it("10. Anticipation should trigger on 2x effective moves - Anticipation against Thunderbolt", async () => {
    game.override
      .moveset([Moves.THUNDERBOLT])
      .enemySpecies(Species.SANDSHREW)
      .enemyAbility(Abilities.ANTICIPATION);

    await game.challengeMode.startBattle();

    expect(game.scene.getEnemyPokemon()?.summonData.abilitiesApplied[0]).toBe(Abilities.ANTICIPATION);
  }, TIMEOUT);

  it("11. Conversion 2 should change the type to the resistive type - Conversion 2 against Dragonite", async () => {
    game.override
      .moveset([Moves.CONVERSION_2])
      .enemyMoveset([Moves.DRAGON_CLAW, Moves.DRAGON_CLAW, Moves.DRAGON_CLAW, Moves.DRAGON_CLAW]);

    await game.challengeMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.CONVERSION_2);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getTypes()[0]).toBe(Type.DRAGON);
  }, TIMEOUT);

  it("12. Flying Press should be 0.25x effective against Grass + Dark Type - Flying Press against Meowscarada", async () => {
    game.override
      .moveset([Moves.FLYING_PRESS])
      .enemySpecies(Species.MEOWSCARADA);

    await game.challengeMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(enemy.getMoveEffectiveness(player, allMoves[Moves.FLYING_PRESS])).toBe(0.25);
  }, TIMEOUT);
});
