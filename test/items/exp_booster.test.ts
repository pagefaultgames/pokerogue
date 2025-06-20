import { AbilityId } from "#enums/ability-id";
import { PokemonExpBoosterModifier } from "#app/modifier/modifier";
import { NumberHolder } from "#app/utils/common";
import GameManager from "#test/testUtils/gameManager";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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

    game.override.enemyAbility(AbilityId.BALL_FETCH).ability(AbilityId.BALL_FETCH).battleStyle("single");
  });

  it("EXP booster items stack multiplicatively", async () => {
    game.override.startingHeldItems([{ name: "LUCKY_EGG", count: 3 }, { name: "GOLDEN_EGG" }]);
    await game.classicMode.startBattle();

    const partyMember = game.scene.getPlayerPokemon()!;
    partyMember.exp = 100;
    const expHolder = new NumberHolder(partyMember.exp);
    game.scene.applyModifiers(PokemonExpBoosterModifier, true, partyMember, expHolder);
    expect(expHolder.value).toBe(440);
  });
});
