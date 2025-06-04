import { BattlerTagType } from "#app/enums/battler-tag-type";
import { StatusEffect } from "#app/enums/status-effect";
import { BerryPhase } from "#app/phases/berry-phase";
import { MovePhase } from "#app/phases/move-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Beak Blast", () => {
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
      .battleStyle("single")
      .ability(AbilityId.UNNERVE)
      .moveset([MoveId.BEAK_BLAST])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset([MoveId.TACKLE])
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should add a charge effect that burns attackers on contact", async () => {
    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.BEAK_BLAST);

    await game.phaseInterceptor.to(MovePhase, false);
    expect(leadPokemon.getTag(BattlerTagType.BEAK_BLAST_CHARGING)).toBeDefined();

    await game.phaseInterceptor.to(BerryPhase, false);
    expect(enemyPokemon.status?.effect).toBe(StatusEffect.BURN);
  });

  it("should still charge and burn opponents if the user is sleeping", async () => {
    game.override.statusEffect(StatusEffect.SLEEP);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.BEAK_BLAST);

    await game.phaseInterceptor.to(MovePhase, false);
    expect(leadPokemon.getTag(BattlerTagType.BEAK_BLAST_CHARGING)).toBeDefined();

    await game.phaseInterceptor.to(BerryPhase, false);
    expect(enemyPokemon.status?.effect).toBe(StatusEffect.BURN);
  });

  it("should not burn attackers that don't make contact", async () => {
    game.override.enemyMoveset([MoveId.WATER_GUN]);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.BEAK_BLAST);

    await game.phaseInterceptor.to(MovePhase, false);
    expect(leadPokemon.getTag(BattlerTagType.BEAK_BLAST_CHARGING)).toBeDefined();

    await game.phaseInterceptor.to(BerryPhase, false);
    expect(enemyPokemon.status?.effect).not.toBe(StatusEffect.BURN);
  });

  it("should only hit twice with Multi-Lens", async () => {
    game.override.startingHeldItems([{ name: "MULTI_LENS", count: 1 }]);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.BEAK_BLAST);

    await game.phaseInterceptor.to(BerryPhase, false);
    expect(leadPokemon.turnData.hitCount).toBe(2);
  });

  it("should be blocked by Protect", async () => {
    game.override.enemyMoveset([MoveId.PROTECT]);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.BEAK_BLAST);

    await game.phaseInterceptor.to(MovePhase, false);
    expect(leadPokemon.getTag(BattlerTagType.BEAK_BLAST_CHARGING)).toBeDefined();

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(leadPokemon.getTag(BattlerTagType.BEAK_BLAST_CHARGING)).toBeUndefined();
  });

  it("should still burn the enemy if the user is knocked out", async () => {
    game.override.ability(AbilityId.BALL_FETCH);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP]);
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const user = game.scene.getPlayerPokemon()!;
    user.hp = 1;
    game.move.select(MoveId.BEAK_BLAST);
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon.status?.effect).toBe(StatusEffect.BURN);
  });

  it("should not burn a long reach enemy that hits the user with a contact move", async () => {
    game.override.enemyAbility(AbilityId.LONG_REACH);
    game.override.enemyMoveset([MoveId.FALSE_SWIPE]).enemyLevel(100);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    game.move.select(MoveId.BEAK_BLAST);
    await game.phaseInterceptor.to("BerryPhase", false);
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    expect(enemyPokemon.status?.effect).not.toBe(StatusEffect.BURN);
  });
});
