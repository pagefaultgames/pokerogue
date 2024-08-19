import { BattlerIndex } from "#app/battle.js";
import { Abilities } from "#app/enums/abilities.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { CommandPhase } from "#app/phases/command-phase.js";
import { MovePhase } from "#app/phases/move-phase.js";
import { TurnEndPhase } from "#app/phases/turn-end-phase.js";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Sweet Veil", () => {
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
    game.override.battleType("double");
    game.override.moveset([Moves.SPLASH, Moves.REST]);
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.enemyMoveset([Moves.POWDER, Moves.POWDER, Moves.POWDER, Moves.POWDER]);
  });

  it("prevents the user and its allies from falling asleep", async () => {
    await game.startBattle([Species.SWIRLIX, Species.MAGIKARP]);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });

  it("causes Rest to fail when used by the user or its allies", async () => {
    game.override.enemyMoveset(SPLASH_ONLY);
    await game.startBattle([Species.SWIRLIX, Species.MAGIKARP]);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.REST, 1);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });

  it("causes Yawn to fail if used on the user or its allies", async () => {
    game.override.enemyMoveset([Moves.YAWN, Moves.YAWN, Moves.YAWN, Moves.YAWN]);
    await game.startBattle([Species.SWIRLIX, Species.MAGIKARP]);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => !!p.getTag(BattlerTagType.DROWSY))).toBe(false);
  });

  it("prevents the user and its allies already drowsy due to Yawn from falling asleep.", async () => {
    game.override.enemySpecies(Species.PIKACHU);
    game.override.enemyLevel(5);
    game.override.startingLevel(5);
    game.override.enemyMoveset([Moves.YAWN, Moves.YAWN, Moves.YAWN, Moves.YAWN]);

    await game.startBattle([Species.SHUCKLE, Species.SHUCKLE, Species.SWIRLIX]);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);

    // First pokemon move
    await game.move.forceHit();

    // Second pokemon move
    await game.phaseInterceptor.to(MovePhase, false);
    await game.move.forceHit();

    expect(game.scene.getPlayerField().some(p => !!p.getTag(BattlerTagType.DROWSY))).toBe(true);

    await game.phaseInterceptor.to(TurnEndPhase);

    const drowsyMon = game.scene.getPlayerField().find(p => !!p.getTag(BattlerTagType.DROWSY))!;

    await game.phaseInterceptor.to(CommandPhase);
    game.selectMove(getMovePosition(game.scene, (drowsyMon.getBattlerIndex() as BattlerIndex.PLAYER | BattlerIndex.PLAYER_2), Moves.SPLASH));
    game.doSwitchPokemon(2);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });
});
