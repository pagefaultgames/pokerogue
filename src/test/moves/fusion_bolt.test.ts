import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Species } from "#enums/species";
import { Moves } from "#enums/moves";
import { Abilities } from "#enums/abilities";

describe("Moves - Fusion Bolt", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const fusionBolt = Moves.FUSION_BOLT;

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
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ fusionBolt ]);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(1);

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RESHIRAM);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.ROUGH_SKIN);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ]);

    vi.spyOn(overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(97);
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
  });

  it("should not make contact", async() => {
    await game.startBattle([
      Species.ZEKROM,
    ]);

    const partyMember = game.scene.getPlayerPokemon();
    const initialHp = partyMember.hp;

    game.doAttack(getMovePosition(game.scene, 0, fusionBolt));

    await game.toNextTurn();

    expect(initialHp - partyMember.hp).toBe(0);
  }, 20000);
});
