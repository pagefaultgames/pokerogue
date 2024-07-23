import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { DamagePhase } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Species } from "#app/enums/species.js";
import { EnemyPokemon } from "#app/field/pokemon";

describe("Moves - Fissure", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  //let partyPokemon: PlayerPokemon;
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

    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);

    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FISSURE]);
    vi.spyOn(overrides, "PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);

    await game.startBattle();

    //partyPokemon = game.scene.getParty()[0];
    enemyPokemon = game.scene.getEnemyPokemon();

    // remove berries
    game.scene.removePartyMemberModifiers(0);
    game.scene.clearEnemyHeldItemModifiers();
  });

  it("ignores damage modification from abilities such as fur coat", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NO_GUARD);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.FUR_COAT);

    game.doAttack(getMovePosition(game.scene, 0, Moves.FISSURE));
    await game.phaseInterceptor.to(DamagePhase, true);

    expect(enemyPokemon.isFainted()).toBe(true);
  });
});
