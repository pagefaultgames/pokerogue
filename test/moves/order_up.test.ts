import { BattlerIndex } from "#app/battle";
import { BattlerTagType } from "#enums/battler-tag-type";
import { PokemonAnimType } from "#enums/pokemon-anim-type";
import type { EffectiveStat } from "#enums/stat";
import { Stat } from "#enums/stat";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset(MoveId.ORDER_UP)
      .ability(AbilityId.COMMANDER)
      .battleStyle("double")
      .disableCrits()
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);

    vi.spyOn(game.scene, "triggerPokemonBattleAnim").mockReturnValue(true);
  });

  it.each([
    { formIndex: 0, formName: "Curly", stat: Stat.ATK, statName: "Attack" },
    { formIndex: 1, formName: "Droopy", stat: Stat.DEF, statName: "Defense" },
    { formIndex: 2, formName: "Stretchy", stat: Stat.SPD, statName: "Speed" },
  ])(
    "should raise the user's $statName when the user is commanded by a $formName Tatsugiri",
    async ({ formIndex, stat }) => {
      game.override.starterForms({ [SpeciesId.TATSUGIRI]: formIndex });

      await game.classicMode.startBattle([SpeciesId.TATSUGIRI, SpeciesId.DONDOZO]);

      const [tatsugiri, dondozo] = game.scene.getPlayerField();

      expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
      expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

      game.move.select(MoveId.ORDER_UP, 1, BattlerIndex.ENEMY);
      expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

      await game.phaseInterceptor.to("BerryPhase", false);

      const affectedStats: EffectiveStat[] = [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD];
      affectedStats.forEach(st => expect(dondozo.getStatStage(st)).toBe(st === stat ? 3 : 2));
    },
  );

  it("should be boosted by Sheer Force while still applying a stat boost", async () => {
    game.override.passiveAbility(AbilityId.SHEER_FORCE).starterForms({ [SpeciesId.TATSUGIRI]: 0 });

    await game.classicMode.startBattle([SpeciesId.TATSUGIRI, SpeciesId.DONDOZO]);

    const [tatsugiri, dondozo] = game.scene.getPlayerField();

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    game.move.select(MoveId.ORDER_UP, 1, BattlerIndex.ENEMY);
    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(dondozo.waveData.abilitiesApplied.has(AbilityId.SHEER_FORCE)).toBeTruthy();
    expect(dondozo.getStatStage(Stat.ATK)).toBe(3);
  });
});
