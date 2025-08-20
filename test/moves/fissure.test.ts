import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import type { EnemyPokemon, PlayerPokemon } from "#field/pokemon";
import { DamageAnimPhase } from "#phases/damage-anim-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Fissure", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let partyPokemon: PlayerPokemon;
  let enemyPokemon: EnemyPokemon;

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

    game.override
      .battleStyle("single")
      .criticalHits(false)
      .starterSpecies(SpeciesId.SNORLAX)
      .moveset(MoveId.FISSURE)
      .passiveAbility(AbilityId.BALL_FETCH)
      .startingLevel(100)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyMoveset(MoveId.SPLASH)
      .enemyPassiveAbility(AbilityId.BALL_FETCH)
      .enemyLevel(100);

    await game.classicMode.startBattle();

    partyPokemon = game.field.getPlayerPokemon();
    enemyPokemon = game.field.getEnemyPokemon();
  });

  it("ignores damage modification from abilities, for example FUR_COAT", async () => {
    game.override.ability(AbilityId.NO_GUARD).enemyAbility(AbilityId.FUR_COAT);

    game.move.select(MoveId.FISSURE);
    await game.phaseInterceptor.to(DamageAnimPhase, true);

    expect(enemyPokemon.isFainted()).toBe(true);
  });

  it("ignores user's ACC stat stage", async () => {
    vi.spyOn(partyPokemon, "getAccuracyMultiplier");

    partyPokemon.setStatStage(Stat.ACC, -6);

    game.move.select(MoveId.FISSURE);

    // wait for TurnEndPhase instead of DamagePhase as fissure might not actually inflict damage
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(partyPokemon.getAccuracyMultiplier).toHaveReturnedWith(1);
  });

  it("ignores target's EVA stat stage", async () => {
    vi.spyOn(partyPokemon, "getAccuracyMultiplier");

    enemyPokemon.setStatStage(Stat.EVA, 6);

    game.move.select(MoveId.FISSURE);

    // wait for TurnEndPhase instead of DamagePhase as fissure might not actually inflict damage
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(partyPokemon.getAccuracyMultiplier).toHaveReturnedWith(1);
  });
});
