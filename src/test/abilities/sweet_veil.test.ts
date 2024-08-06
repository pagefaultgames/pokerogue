import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/utils/gameManager";
import { Species } from "#enums/species";
import { CommandPhase, MoveEffectPhase, MovePhase, TurnEndPhase } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { Abilities } from "#app/enums/abilities.js";
import { BattlerIndex } from "#app/battle.js";
import { SPLASH_ONLY } from "#test/utils/testUtils";

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

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });

  it("causes Rest to fail when used by the user or its allies", async () => {
    game.override.enemyMoveset(SPLASH_ONLY);
    await game.startBattle([Species.SWIRLIX, Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    game.doAttack(getMovePosition(game.scene, 1, Moves.REST));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });

  it("causes Yawn to fail if used on the user or its allies", async () => {
    game.override.enemyMoveset([Moves.YAWN, Moves.YAWN, Moves.YAWN, Moves.YAWN]);
    await game.startBattle([Species.SWIRLIX, Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => !!p.getTag(BattlerTagType.DROWSY))).toBe(false);
  });

  it("prevents the user and its allies already drowsy due to Yawn from falling asleep.", async () => {
    game.override.enemySpecies(Species.PIKACHU);
    game.override.enemyLevel(5);
    game.override.startingLevel(5);
    game.override.enemyMoveset([Moves.YAWN, Moves.YAWN, Moves.YAWN, Moves.YAWN]);

    await game.startBattle([Species.SHUCKLE, Species.SHUCKLE, Species.SWIRLIX]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    // First pokemon move
    await game.phaseInterceptor.to(MoveEffectPhase, false);
    vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValueOnce(true);

    // Second pokemon move
    await game.phaseInterceptor.to(MovePhase, false);
    await game.phaseInterceptor.to(MoveEffectPhase, false);
    vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValueOnce(true);

    expect(game.scene.getPlayerField().some(p => !!p.getTag(BattlerTagType.DROWSY))).toBe(true);

    await game.phaseInterceptor.to(TurnEndPhase);

    const drowsyMon = game.scene.getPlayerField().find(p => !!p.getTag(BattlerTagType.DROWSY));

    await game.phaseInterceptor.to(CommandPhase);
    game.doAttack(getMovePosition(game.scene, (drowsyMon.getBattlerIndex() as BattlerIndex.PLAYER | BattlerIndex.PLAYER_2), Moves.SPLASH));
    game.doSwitchPokemon(2);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });
});
