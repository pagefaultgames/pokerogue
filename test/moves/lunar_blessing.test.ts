import { StatusEffect } from "#app/enums/status-effect";
import { CommandPhase } from "#app/phases/command-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Lunar Blessing", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override.battleStyle("double");

    game.override.enemySpecies(SpeciesId.SHUCKLE);
    game.override.enemyMoveset(MoveId.SPLASH);
    game.override.enemyAbility(AbilityId.BALL_FETCH);

    game.override.moveset([MoveId.LUNAR_BLESSING, MoveId.SPLASH]);
    game.override.ability(AbilityId.BALL_FETCH);
  });

  it("should restore 25% HP of the user and its ally", async () => {
    await game.classicMode.startBattle([SpeciesId.RATTATA, SpeciesId.RATTATA]);
    const [leftPlayer, rightPlayer] = game.scene.getPlayerField();

    vi.spyOn(leftPlayer, "getMaxHp").mockReturnValue(100);
    vi.spyOn(rightPlayer, "getMaxHp").mockReturnValue(100);

    const initialHp = 1;
    leftPlayer["hp"] = initialHp;
    rightPlayer["hp"] = initialHp;
    const expectedHeal = 25;

    vi.spyOn(leftPlayer, "heal");
    vi.spyOn(rightPlayer, "heal");

    game.move.select(MoveId.LUNAR_BLESSING, 0);
    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(leftPlayer.heal).toHaveBeenCalledOnce();
    expect(leftPlayer.heal).toHaveReturnedWith(expectedHeal);

    expect(rightPlayer.heal).toHaveBeenCalledOnce();
    expect(rightPlayer.heal).toHaveReturnedWith(expectedHeal);
  });

  it("should cure status effect of the user and its ally", async () => {
    game.override.statusEffect(StatusEffect.BURN);
    await game.classicMode.startBattle([SpeciesId.RATTATA, SpeciesId.RATTATA]);
    const [leftPlayer, rightPlayer] = game.scene.getPlayerField();

    vi.spyOn(leftPlayer, "resetStatus");
    vi.spyOn(rightPlayer, "resetStatus");

    game.move.select(MoveId.LUNAR_BLESSING, 0);
    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(leftPlayer.resetStatus).toHaveBeenCalledOnce();
    expect(rightPlayer.resetStatus).toHaveBeenCalledOnce();

    expect(leftPlayer.status?.effect).toBeUndefined();
    expect(rightPlayer.status?.effect).toBeUndefined();
  });
});
