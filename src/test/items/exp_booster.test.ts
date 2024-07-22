import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phase from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Abilities } from "#app/enums/abilities.js";
import { PokemonExpBoosterModifier } from "#app/modifier/modifier.js";
import * as Utils from "#app/utils";

describe("EXP Modifier Items", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phase.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
  });

  it("EXP booster items stack additively", async() => {
    vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "LUCKY_EGG"}, {name: "GOLDEN_EGG"}]);
    await game.startBattle();

    const partyMember = game.scene.getPlayerPokemon();
    const modifierBonusExp = new Utils.NumberHolder(1);
    partyMember.scene.applyModifiers(PokemonExpBoosterModifier, true, partyMember, modifierBonusExp);
    expect(modifierBonusExp.value).toBe(2.4);
  }, 20000);
});
