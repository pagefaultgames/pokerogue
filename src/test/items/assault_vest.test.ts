import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {
  CommandPhase,
  PostSummonPhase, SummonPhase, ToggleDoublePositionPhase,
} from "#app/phases";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import {BattleStyle} from "#enums/battle-style";
import {Nature} from "#app/data/nature";
import {Stat} from "#app/data/pokemon-stat";
import {BattlerTagType} from "#enums/battler-tag-type";


describe("Items - Assault Vest", () => {
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
    game.scene.battleStyle = BattleStyle.SET;
    const moveToUse = Moves.SPLASH;
    const oppMoveToUse = Moves.SPLASH;
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(3);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.ZEKROM);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([oppMoveToUse, oppMoveToUse, oppMoveToUse, oppMoveToUse]);
    vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{
      name: "ASSAULT_VEST",
    }]);
  });

  it("ASSAULT_VEST check stat", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    await game.runToSummon([
      Species.MIGHTYENA,
    ]);
    await game.phaseInterceptor.run(SummonPhase);
    const pokemon = game.scene.getParty()[0];
    const opponent = game.scene.currentBattle.enemyParty[0];
    opponent.ivs = [0, 0, 0, 0, 0, 0];
    pokemon.setNature(Nature.CALM);
    opponent.setNature(Nature.CALM);
    expect(game.scene.modifiers[0].type.id).toBe("ASSAULT_VEST");
    expect(pokemon.nature).toBe(Nature.CALM);
    expect(opponent.nature).toBe(Nature.CALM);
    await game.phaseInterceptor.run(ToggleDoublePositionPhase);
    await game.phaseInterceptor.run(PostSummonPhase);
    await game.phaseInterceptor.run(PostSummonPhase);
    await game.phaseInterceptor.to(CommandPhase);
    const spDef = pokemon.stats[Stat.SPDEF];
    const oppSpDef = opponent.stats[Stat.SPDEF];
    expect(spDef).toBe(207); // 138 * 1.5
    expect(oppSpDef).toBe(226);
    expect(pokemon.getTags(BattlerTagType.ATTACK_MOVE_ONLY)).toBe(true);

    //
    // game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
    //   // Select Attack
    //   game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    // });
    // game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
    //   // Select Move Growth
    //   const movePosition = getMovePosition(game.scene, 0, moveToUse);
    //   (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    // });
    //
    // // will run the 13 phase from enemyCommandPhase to TurnEndPhase
    // await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);
    // // Toxic orb should trigger here
    // await game.phaseInterceptor.run(MessagePhase);
    // const message = game.textInterceptor.getLatestMessage();
    // expect(message).toContain("was badly poisoned by Toxic Orb");
    // await game.phaseInterceptor.run(MessagePhase);
    // const message2 = game.textInterceptor.getLatestMessage();
    // expect(message2).toContain("is hurt");
    // expect(message2).toContain("by poison");
    // expect(game.scene.getParty()[0].status.effect).toBe(StatusEffect.TOXIC);
  }, 20000);
});
