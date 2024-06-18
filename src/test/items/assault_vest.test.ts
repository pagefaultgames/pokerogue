import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {
  CommandPhase, SelectModifierPhase,
  SummonPhase, TurnEndPhase,
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
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import {Button} from "#enums/buttons";
import PartyUiHandler from "#app/ui/party-ui-handler";


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

  it("ASSAULT_VEST check stat + prevent non-offensive move", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.GROWTH, Moves.TACKLE]);
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
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
    const oppSpDef = opponent.stats[Stat.SPDEF];
    const spDef = pokemon.stats[Stat.SPDEF];
    // Check Special Defense stat boost
    expect(spDef).toBe(207); // 138 * 1.5

    // Check opponent does not have any special defense boost
    expect(oppSpDef).toBe(226);
    // Check if the assault vest restricts the use of non-offensive moves
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

  it("transfer assault vest to another mon to revert stats boost and restriction", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.GROWTH, Moves.TACKLE]);
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
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
    game.doAttack(1);
    await game.doKillOpponents();
    game.onNextPrompt("SelectModifierPhase", Mode.MODIFIER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;
      handler.processInput(Button.DOWN);
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.ACTION); // Transfer items
      game.phaseInterceptor.unlock();
    }, () => false, true);
    await game.phaseInterceptor.to(SelectModifierPhase);
    await new Promise<void>((resolve) => {
      game.onNextPrompt("SelectModifierPhase", Mode.PARTY, () => {
        const handler = game.scene.ui.getHandler() as PartyUiHandler;
        // Transfert first item from the first pokemon to the second and exit the party UI
        handler.processInput(Button.ACTION);
        handler.processInput(Button.ACTION);
        handler.processInput(Button.RIGHT);
        handler.processInput(Button.ACTION);
        handler.processInput(Button.ACTION);
        handler.processInput(Button.CANCEL);
        resolve();
      });
    });
    game.doSelectModifier();
    await game.phaseInterceptor.to(CommandPhase);
    const spDef = pokemon.stats[Stat.SPDEF];
    // Check Special Defense stat boost
    expect(spDef).toBe(138); // 138 * 1.5
    expect(pokemon.summonData.attack_move_restriction).toBe(false);
    let battleStatsPokemon = pokemon.summonData.battleStats;
    expect(battleStatsPokemon[Stat.SPATK]).toBe(0);
    game.doAttack(0);
    await game.phaseInterceptor.to(TurnEndPhase);
    const messages = game.textInterceptor.logs;
    expect(messages).not.toContain("The assault vest prevents the use of any non-offensive moves.");
    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.SPATK]).toBe(1);
  }, 200000);
});
