import { BattlerIndex } from "#app/battle";
import { BattlerTagType } from "#enums/battler-tag-type";
import { PokemonAnimType } from "#enums/pokemon-anim-type";
import { EffectiveStat, Stat } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Order Up", () => {
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
    game.override
      .moveset(Moves.ORDER_UP)
      .ability(Abilities.COMMANDER)
      .battleType("double")
      .disableCrits()
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);

    vi.spyOn(game.scene, "triggerPokemonBattleAnim").mockReturnValue(true);
  });

  it.each([
    { formIndex: 0, formName: "Curly", stat: Stat.ATK, statName: "Attack" },
    { formIndex: 1, formName: "Droopy", stat: Stat.DEF, statName: "Defense" },
    { formIndex: 2, formName: "Stretchy", stat: Stat.SPD, statName: "Speed" }
  ])("should raise the user's $statName when the user is commanded by a $formName Tatsugiri", async ({ formIndex, stat }) => {
    game.override.starterForms({ [Species.TATSUGIRI]: formIndex });

    await game.classicMode.startBattle([ Species.TATSUGIRI, Species.DONDOZO ]);

    const [ tatsugiri, dondozo ] = game.scene.getPlayerField();

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    game.move.select(Moves.ORDER_UP, 1, BattlerIndex.ENEMY);
    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    await game.phaseInterceptor.to("BerryPhase", false);

    const affectedStats: EffectiveStat[] = [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ];
    affectedStats.forEach(st => expect(dondozo.getStatStage(st)).toBe(st === stat ? 3 : 2));
  });

  it("should be boosted by Sheer Force while still applying a stat boost", async () => {
    game.override
      .passiveAbility(Abilities.SHEER_FORCE)
      .starterForms({ [Species.TATSUGIRI]: 0 });

    await game.classicMode.startBattle([ Species.TATSUGIRI, Species.DONDOZO ]);

    const [ tatsugiri, dondozo ] = game.scene.getPlayerField();

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    game.move.select(Moves.ORDER_UP, 1, BattlerIndex.ENEMY);
    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(dondozo.battleData.abilitiesApplied.includes(Abilities.SHEER_FORCE)).toBeTruthy();
    expect(dondozo.getStatStage(Stat.ATK)).toBe(3);
  });
});
