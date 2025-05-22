import { Stat } from "#enums/stat";
import { Species } from "#app/enums/species";
import type { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import { DamageAnimPhase } from "#app/phases/damage-anim-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import GameManager from "#test/testUtils/gameManager";
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

    game.override.battleStyle("single");
    game.override.disableCrits();

    game.override.starterSpecies(Species.SNORLAX);
    game.override.moveset([Moves.FISSURE]);
    game.override.passiveAbility(Abilities.BALL_FETCH);
    game.override.startingLevel(100);

    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyMoveset(Moves.SPLASH);
    game.override.enemyPassiveAbility(Abilities.BALL_FETCH);
    game.override.enemyLevel(100);

    await game.classicMode.startBattle();

    partyPokemon = game.scene.getPlayerParty()[0];
    enemyPokemon = game.scene.getEnemyPokemon()!;
  });

  it("ignores damage modification from abilities, for example FUR_COAT", async () => {
    game.override.ability(Abilities.NO_GUARD);
    game.override.enemyAbility(Abilities.FUR_COAT);

    game.move.select(Moves.FISSURE);
    await game.phaseInterceptor.to(DamageAnimPhase, true);

    expect(enemyPokemon.isFainted()).toBe(true);
  });

  it("ignores user's ACC stat stage", async () => {
    vi.spyOn(partyPokemon, "getAccuracyMultiplier");

    partyPokemon.setStatStage(Stat.ACC, -6);

    game.move.select(Moves.FISSURE);

    // wait for TurnEndPhase instead of DamagePhase as fissure might not actually inflict damage
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(partyPokemon.getAccuracyMultiplier).toHaveReturnedWith(1);
  });

  it("ignores target's EVA stat stage", async () => {
    vi.spyOn(partyPokemon, "getAccuracyMultiplier");

    enemyPokemon.setStatStage(Stat.EVA, 6);

    game.move.select(Moves.FISSURE);

    // wait for TurnEndPhase instead of DamagePhase as fissure might not actually inflict damage
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(partyPokemon.getAccuracyMultiplier).toHaveReturnedWith(1);
  });
});
