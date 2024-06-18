import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {
  CommandPhase,
  SummonPhase,
} from "#app/phases";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import {BattleStyle} from "#enums/battle-style";
import {Nature} from "#app/data/nature";
import {Stat} from "#app/data/pokemon-stat";
import {BattleStat} from "#app/data/battle-stat";
import {Mode} from "#app/ui/ui";
import {Command} from "#app/ui/command-ui-handler";


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
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.GROWTH, Moves.TACKLE]);
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
    await game.phaseInterceptor.to(CommandPhase);
    const spDef = pokemon.stats[Stat.SPDEF];
    const oppSpDef = opponent.stats[Stat.SPDEF];
    expect(spDef).toBe(207); // 138 * 1.5
    expect(oppSpDef).toBe(226);
    expect(pokemon.summonData.attack_move_restriction).toBe(true);
    let battleStatsPokemon = pokemon.summonData.battleStats;
    expect(battleStatsPokemon[Stat.SPATK]).toBe(0);
    await new Promise<void>((resolve) => {
      game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
        game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
      });
      game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
        (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, 0, false);
        resolve();
      });
    });
    const message = game.textInterceptor.getLatestMessage();
    expect(message).toBe("The assault vest prevents the use of any non-offensive moves.");
    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.SPATK]).toBe(0);


  }, 20000);
});
