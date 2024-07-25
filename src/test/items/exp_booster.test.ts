import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phase from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
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

    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.ability(Abilities.BALL_FETCH);
    game.override.battleType("single");
  });

  it("EXP booster items stack additively", async() => {
    vi.spyOn(Overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "LUCKY_EGG"}, {name: "GOLDEN_EGG"}]);
    await game.startBattle();

    const partyMember = game.scene.getPlayerPokemon();
    const modifierBonusExp = new Utils.NumberHolder(1);
    partyMember.scene.applyModifiers(PokemonExpBoosterModifier, true, partyMember, modifierBonusExp);
    expect(modifierBonusExp.value).toBe(2.4);
  }, 20000);
});
