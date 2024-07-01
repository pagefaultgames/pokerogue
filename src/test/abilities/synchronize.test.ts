import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {
  MoveEffectPhase,
  TurnEndPhase,
} from "#app/phases";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#app/data/status-effect.js";

describe("Abilities - Synchronize", () => {
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
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "STATUS_OVERRIDE", "get").mockReturnValue(StatusEffect.NONE);
    vi.spyOn(overrides, "OPP_STATUS_OVERRIDE", "get").mockReturnValue(StatusEffect.NONE);
    // Opponent mocks
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.ALAKAZAM);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.PSYCHIC, Moves.CALM_MIND, Moves.FOCUS_BLAST, Moves.RECOVER]);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SYNCHRONIZE);
  }, 20000);

  it("does not trigger when no status is applied by opponent Pokemon", async () => {
    // Arrange
    const moveToUse = Moves.HEADBUTT;

    // Starter mocks
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.ZIGZAGOON);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.PICKUP);

    // Act
    await game.startBattle();
    game.doAttack(getMovePosition(game.scene, 0, moveToUse));
    await game.phaseInterceptor.to(TurnEndPhase);

    // Assert
    expect(game.scene.getParty()[0].status).toBe(undefined);
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  }, 20000);

  it("sets the status of the source pokemon to Paralysis when paralyzed by it", async () => {
    // Arrange
    const moveToUse = Moves.THUNDER_WAVE;

    // Starter mocks
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.TOGEKISS);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SERENE_GRACE);

    // Act
    await game.startBattle();
    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

    await game.phaseInterceptor.to(TurnEndPhase);

    // Assert
    expect(game.scene.getParty()[0].status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(game.scene.getEnemyParty()[0].status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  }, 20000);

  it("sets the status of the source pokemon to Burned when burn is applied by it", async () => {
    // Arrange
    const moveToUse = Moves.WILL_O_WISP;

    // Starter mocks
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.EEVEE);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.GUTS);

    // Act
    await game.startBattle();
    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

    await game.phaseInterceptor.to(TurnEndPhase);

    // Assert
    expect(game.scene.getParty()[0].status?.effect).toBe(StatusEffect.BURN);
    expect(game.scene.getEnemyParty()[0].status?.effect).toBe(StatusEffect.BURN);
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  }, 20000);

  it("sets the status of the source pokemon to Poisoned when poison is applied by it", async () => {
    // Arrange
    const moveToUse = Moves.POISON_POWDER;

    // Starter mocks
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.BRELOOM);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.TECHNICIAN);

    // Act
    await game.startBattle();
    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

    await game.phaseInterceptor.to(TurnEndPhase);

    // Assert
    expect(game.scene.getParty()[0].status?.effect).toBe(StatusEffect.POISON);
    expect(game.scene.getEnemyParty()[0].status?.effect).toBe(StatusEffect.POISON);
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  }, 20000);

  it("sets the status of the source pokemon to Toxic when toxic is applied by it", async () => {
    // Arrange
    const moveToUse = Moves.TOXIC;

    // Starter mocks
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.QUAGSIRE);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.DAMP);

    // Act
    await game.startBattle();
    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

    await game.phaseInterceptor.to(TurnEndPhase);

    // Assert
    expect(game.scene.getParty()[0].status?.effect).toBe(StatusEffect.TOXIC);
    expect(game.scene.getEnemyParty()[0].status?.effect).toBe(StatusEffect.TOXIC);
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  }, 20000);

  it("does not trigger when Pokemon is statused to non Burn, Paralysis, Poison, or Toxic", async () => {
    // Arrange
    const moveToUse = Moves.SPORE;

    // Starter mocks
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.BRELOOM);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.POISON_HEAL);

    // Act
    await game.startBattle();
    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

    await game.phaseInterceptor.to(TurnEndPhase);

    // Assert
    expect(game.scene.getParty()[0].status?.effect).toBe(undefined);
    expect(game.scene.getEnemyParty()[0].status?.effect).toBe(StatusEffect.SLEEP);
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  }, 20000);

  it("does not trigger when Pokemon is statused by Toxic Spikes", async () => {
    // Arrange
    const moveToUse = Moves.SPLASH;

    // Starter mocks
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SYNCHRONIZE);

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.BRELOOM);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TOXIC_SPIKES]);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.TECHNICIAN);

    // Act
    // Turn 1 - Opponent uses spikes, trainer uses splash
    // Turn 2 - Opponent uses splash, trainer sends out Alakazam. Alakazam is toxic-ed but Synchronize should not proc
    await game.startBattle([Species.MAGIKARP, Species.ALAKAZAM]);
    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).not.toBe(undefined);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH)); // use splash

    await game.toNextTurn();
    game.doSwitchPokemon(1);
    game.doAttack(0);

    await game.phaseInterceptor.to(TurnEndPhase);

    // Assert
    expect(game.scene.getParty()[0].status?.effect).toBe(StatusEffect.POISON);
    expect(game.scene.getEnemyParty()[0].status?.effect).toBe(undefined);
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  }, 20000);

  it("shows ability even if it fails to set the status of the opponent Pokemon", async () => {
    // Arrange
    const moveToUse = Moves.THUNDER_WAVE;

    // Starter mocks
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.PIKACHU);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.STATIC);

    // Act
    await game.startBattle();
    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

    await game.phaseInterceptor.to(TurnEndPhase);

    // Assert
    expect(game.scene.getParty()[0].status?.effect).toBe(undefined);
    expect(game.scene.getEnemyParty()[0].status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  }, 20000);

  it("should activate with Psycho Shift after the move clears the status", async () => {
    // Arrange
    const moveToUse = Moves.PSYCHO_SHIFT;

    // Starter mocks
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.HOOTHOOT);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.KEEN_EYE);
    vi.spyOn(overrides, "STATUS_OVERRIDE", "get").mockReturnValue(StatusEffect.PARALYSIS);

    // Act
    await game.startBattle();
    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

    await game.phaseInterceptor.to(TurnEndPhase);

    // Assert
    expect(game.scene.getParty()[0].status?.effect).toBe(StatusEffect.PARALYSIS); // keeping old gen < V impl for now since it's buggy otherwise
    expect(game.scene.getEnemyParty()[0].status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  }, 20000);
});
