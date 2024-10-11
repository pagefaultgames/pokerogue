import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {Abilities} from "#enums/abilities";
import {applyAbAttrs ,MoveEffectChanceMultiplierAbAttr} from "#app/data/ability";
import {Species} from "#enums/species";
import {
  CommandPhase,
  MoveEffectPhase,
} from "#app/phases";
import {Mode} from "#app/ui/ui";
import {Stat} from "#app/data/pokemon-stat";
import {Moves} from "#enums/moves";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import {Command} from "#app/ui/command-ui-handler";
import * as Utils from "#app/utils";


describe("Abilities - Serene Grace", () => {
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
    const movesToUse = [Moves.AIR_SLASH, Moves.TACKLE];
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.ONIX);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue(movesToUse);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE,Moves.TACKLE,Moves.TACKLE,Moves.TACKLE]);
  });

  it("Move chance without Serene Grace", async() => {
    const moveToUse = Moves.AIR_SLASH;
    await game.startBattle([
      Species.PIDGEOT
    ]);


    game.scene.getEnemyParty()[0].stats[Stat.SPDEF] = 10000;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;
    expect(game.scene.getParty()[0].formIndex).toBe(0);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Check chance of Air Slash without Serene Grace
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.AIR_SLASH);

    const chance = new Utils.IntegerHolder(move.chance);
    console.log(move.chance + " Their ability is " + phase.getUserPokemon().getAbility().name);
    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, phase.getUserPokemon(), null, chance, move, phase.getTarget(), false);
    expect(chance.value).toBe(30);

  }, 20000);

  it("Move chance with Serene Grace", async() => {
    const moveToUse = Moves.AIR_SLASH;
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SERENE_GRACE);
    await game.startBattle([
      Species.TOGEKISS
    ]);

    game.scene.getEnemyParty()[0].stats[Stat.SPDEF] = 10000;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;
    expect(game.scene.getParty()[0].formIndex).toBe(0);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Check chance of Air Slash with Serene Grace
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.AIR_SLASH);

    const chance = new Utils.IntegerHolder(move.chance);
    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, phase.getUserPokemon(), null, chance, move, phase.getTarget(), false);
    expect(chance.value).toBe(60);

  }, 20000);

  //TODO King's Rock Interaction Unit Test
});
