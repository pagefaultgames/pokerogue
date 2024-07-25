import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import { DamagePhase, TurnEndPhase } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Species } from "#app/enums/species.js";
import { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import { BattleStat } from "#app/data/battle-stat";
import { SPLASH_ONLY } from "../utils/testUtils";

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

    game.override.battleType("single");
    vi.spyOn(Overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);

    game.override.starterSpecies(Species.SNORLAX);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FISSURE]);
    vi.spyOn(Overrides, "PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    game.override.startingLevel(100);

    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyMoveset(SPLASH_ONLY);
    vi.spyOn(Overrides, "OPP_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(Overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);

    await game.startBattle();

    partyPokemon = game.scene.getParty()[0];
    enemyPokemon = game.scene.getEnemyPokemon();

    // remove berries
    game.scene.removePartyMemberModifiers(0);
    game.scene.clearEnemyHeldItemModifiers();
  });

  it("ignores damage modification from abilities such as fur coat", async () => {
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NO_GUARD);
    game.override.enemyAbility(Abilities.FUR_COAT);

    game.doAttack(getMovePosition(game.scene, 0, Moves.FISSURE));
    await game.phaseInterceptor.to(DamagePhase, true);

    expect(enemyPokemon.isFainted()).toBe(true);
  });

  it("ignores accuracy stat", async () => {
    vi.spyOn(partyPokemon, "getAccuracyMultiplier");

    enemyPokemon.summonData.battleStats[BattleStat.ACC] = -6;

    game.doAttack(getMovePosition(game.scene, 0, Moves.FISSURE));

    // wait for TurnEndPhase instead of DamagePhase as fissure might not actually inflict damage
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(partyPokemon.getAccuracyMultiplier).toHaveReturnedWith(1);
  });

  it("ignores evasion stat", async () => {
    vi.spyOn(partyPokemon, "getAccuracyMultiplier");

    enemyPokemon.summonData.battleStats[BattleStat.EVA] = 6;

    game.doAttack(getMovePosition(game.scene, 0, Moves.FISSURE));

    // wait for TurnEndPhase instead of DamagePhase as fissure might not actually inflict damage
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(partyPokemon.getAccuracyMultiplier).toHaveReturnedWith(1);
  });
});
