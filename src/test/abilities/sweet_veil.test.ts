import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  CommandPhase,
  MoveEffectPhase,
  MovePhase,
  TurnEndPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";

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
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.REST]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.POWDER, Moves.POWDER, Moves.POWDER, Moves.POWDER]);
  });

  it("prevents the user and its allies from falling asleep", async () => {
    await game.startBattle([Species.SWIRLIX, Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });

  it("causes Rest to fail when used by the user or its allies", async () => {
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    await game.startBattle([Species.SWIRLIX, Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    game.doAttack(getMovePosition(game.scene, 1, Moves.REST));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });

  it("causes Yawn to fail if used on the user or its allies", async () => {
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.YAWN, Moves.YAWN, Moves.YAWN, Moves.YAWN]);
    await game.startBattle([Species.SWIRLIX, Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => !!p.getTag(BattlerTagType.DROWSY))).toBe(false);
  });

  it("prevents the user and its allies already drowsy due to Yawn from falling asleep.", async () => {
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.PIKACHU);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(5);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(5);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.YAWN, Moves.YAWN, Moves.YAWN, Moves.YAWN]);

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
    game.doAttack(getMovePosition(game.scene, (drowsyMon.getBattlerIndex() as 0 | 1), Moves.SPLASH));
    game.doSwitchPokemon(2);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });
});
