import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Pastel Veil", () => {
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
    game.override.battleStyle("double").enemyAbility(AbilityId.BALL_FETCH).enemySpecies(SpeciesId.TOXAPEX);
  });

  it("should prevent the user and its allies from being poisoned", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.GALAR_PONYTA]);
    const [magikarp, ponyta] = game.scene.getPlayerField();
    game.field.mockAbility(ponyta, AbilityId.PASTEL_VEIL);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.TOXIC, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.TOXIC, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expect(magikarp).toHaveStatusEffect(StatusEffect.NONE);
    expect(ponyta).toHaveStatusEffect(StatusEffect.NONE);
  });

  it("should cure allies' poison if user is sent out into battle", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS, SpeciesId.GALAR_PONYTA]);
    const [magikarp, , ponyta] = game.scene.getPlayerParty();
    game.field.mockAbility(ponyta, AbilityId.PASTEL_VEIL);

    magikarp.doSetStatus(StatusEffect.POISON);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.doSwitchPokemon(2);
    await game.toEndOfTurn();

    expect(magikarp).toHaveStatusEffect(StatusEffect.NONE);
  });
});
