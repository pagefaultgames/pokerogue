import { CudChewConsumeBerryAbAttr } from "#abilities/ability";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BerryType } from "#enums/berry-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { Pokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Cud Chew", () => {
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
      .moveset([MoveId.BUG_BITE, MoveId.SPLASH, MoveId.HYPER_VOICE, MoveId.STUFF_CHEEKS])
      .startingHeldItems([{ name: "BERRY", type: BerryType.SITRUS, count: 1 }])
      .ability(AbilityId.CUD_CHEW)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  describe("tracks berries eaten", () => {
    it("stores inside summonData at end of turn", async () => {
      await game.classicMode.startBattle([SpeciesId.FARIGIRAF]);

      const farigiraf = game.field.getPlayerPokemon();
      farigiraf.hp = 1; // needed to allow sitrus procs

      game.move.select(MoveId.SPLASH);
      await game.phaseInterceptor.to("BerryPhase");

      // berries tracked in turnData; not moved to battleData yet
      expect(farigiraf.summonData.berriesEatenLast).toEqual([]);
      expect(farigiraf.turnData.berriesEaten).toEqual([BerryType.SITRUS]);

      await game.phaseInterceptor.to("TurnEndPhase");

      // berries stored in battleData; not yet cleared from turnData
      expect(farigiraf.summonData.berriesEatenLast).toEqual([BerryType.SITRUS]);
      expect(farigiraf.turnData.berriesEaten).toEqual([BerryType.SITRUS]);

      await game.toNextTurn();

      // turnData cleared on turn start
      expect(farigiraf.summonData.berriesEatenLast).toEqual([BerryType.SITRUS]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);
    });

    it("shows ability popup for eating berry, even if berry is useless", async () => {
      const abDisplaySpy = vi.spyOn(globalScene.phaseManager, "queueAbilityDisplay");
      game.override.enemyMoveset([MoveId.SPLASH, MoveId.HEAL_PULSE]);
      await game.classicMode.startBattle([SpeciesId.FARIGIRAF]);

      const farigiraf = game.field.getPlayerPokemon();
      // Dip below half to eat berry
      farigiraf.hp = farigiraf.getMaxHp() / 2 - 1;

      game.move.select(MoveId.SPLASH);
      await game.move.selectEnemyMove(MoveId.SPLASH);
      await game.phaseInterceptor.to("TurnEndPhase");

      // doesn't trigger since cud chew hasn't eaten berry yet
      expect(farigiraf.summonData.berriesEatenLast).toContain(BerryType.SITRUS);
      expect(abDisplaySpy).not.toHaveBeenCalledWith(farigiraf);
      await game.toNextTurn();

      // get heal pulsed back to full before the cud chew proc
      game.move.select(MoveId.SPLASH);
      await game.move.selectEnemyMove(MoveId.HEAL_PULSE);
      await game.phaseInterceptor.to("TurnEndPhase");

      // globalScene.phaseManager.queueAbilityDisplay should be called twice:
      // once to show cud chew text before regurgitating berries,
      // once to hide ability text after finishing.
      expect(abDisplaySpy).toBeCalledTimes(2);
      expect(abDisplaySpy.mock.calls[0][0]).toBe(farigiraf);
      expect(abDisplaySpy.mock.calls[0][2]).toBe(true);
      expect(abDisplaySpy.mock.calls[1][0]).toBe(farigiraf);
      expect(abDisplaySpy.mock.calls[1][2]).toBe(false);

      // should display messgae
      expect(game.textInterceptor.logs).toContain(
        i18next.t("battle:hpIsFull", {
          pokemonName: getPokemonNameWithAffix(farigiraf),
        }),
      );

      // not called again at turn end
      expect(abDisplaySpy).toBeCalledTimes(2);
    });

    it("can store multiple berries across 2 turns with teatime", async () => {
      // always eat first berry for stuff cheeks & company
      vi.spyOn(Pokemon.prototype, "randBattleSeedInt").mockReturnValue(0);
      game.override
        .startingHeldItems([
          { name: "BERRY", type: BerryType.PETAYA, count: 3 },
          { name: "BERRY", type: BerryType.LIECHI, count: 3 },
        ])
        .enemyMoveset(MoveId.TEATIME);
      await game.classicMode.startBattle([SpeciesId.FARIGIRAF]);

      const farigiraf = game.field.getPlayerPokemon();
      farigiraf.hp = 1; // needed to allow berry procs

      game.move.select(MoveId.STUFF_CHEEKS);
      await game.toNextTurn();

      // Ate 2 petayas from moves + 1 of each at turn end; all 4 get tallied on turn end
      expect(farigiraf.summonData.berriesEatenLast).toEqual([
        BerryType.PETAYA,
        BerryType.PETAYA,
        BerryType.PETAYA,
        BerryType.LIECHI,
      ]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);

      game.move.select(MoveId.SPLASH);
      await game.toNextTurn();

      // previous berries eaten and deleted from summon data as remaining eaten berries move to replace them
      expect(farigiraf.summonData.berriesEatenLast).toEqual([BerryType.LIECHI, BerryType.LIECHI]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);
      expect(farigiraf.getStatStage(Stat.SPATK)).toBe(6); // 3+0+3
      expect(farigiraf.getStatStage(Stat.ATK)).toBe(4); // 1+2+1
    });

    it("should reset both arrays on switch", async () => {
      await game.classicMode.startBattle([SpeciesId.FARIGIRAF, SpeciesId.GIRAFARIG]);

      const farigiraf = game.field.getPlayerPokemon();
      farigiraf.hp = 1;

      // eat berry turn 1, switch out turn 2
      game.move.select(MoveId.SPLASH);
      await game.toNextTurn();

      const turn1Hp = farigiraf.hp;
      game.doSwitchPokemon(1);
      await game.toNextTurn();

      // summonData got cleared due to switch, turnData got cleared due to turn end
      expect(farigiraf.summonData.berriesEatenLast).toEqual([]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);
      expect(farigiraf.hp).toEqual(turn1Hp);

      game.doSwitchPokemon(1);
      await game.toNextTurn();

      // TurnData gets cleared while switching in
      expect(farigiraf.summonData.berriesEatenLast).toEqual([]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);
      expect(farigiraf.hp).toEqual(turn1Hp);
    });

    it("clears array if disabled", async () => {
      game.override.enemyAbility(AbilityId.NEUTRALIZING_GAS);
      await game.classicMode.startBattle([SpeciesId.FARIGIRAF]);

      const farigiraf = game.field.getPlayerPokemon();
      farigiraf.hp = 1;

      game.move.select(MoveId.SPLASH);
      await game.phaseInterceptor.to("BerryPhase");

      expect(farigiraf.summonData.berriesEatenLast).toEqual([]);
      expect(farigiraf.turnData.berriesEaten).toEqual([BerryType.SITRUS]);

      await game.toNextTurn();

      // both arrays empty since neut gas disabled both the mid-turn and post-turn effects
      expect(farigiraf.summonData.berriesEatenLast).toEqual([]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);
    });
  });

  describe("regurgiates berries", () => {
    it("re-triggers effects on eater without pushing to array", async () => {
      const apply = vi.spyOn(CudChewConsumeBerryAbAttr.prototype, "apply");
      await game.classicMode.startBattle([SpeciesId.FARIGIRAF]);

      const farigiraf = game.field.getPlayerPokemon();
      farigiraf.hp = 1;

      game.move.select(MoveId.SPLASH);
      await game.toNextTurn();

      // ate 1 sitrus the turn prior, spitball pending
      expect(farigiraf.summonData.berriesEatenLast).toEqual([BerryType.SITRUS]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);
      expect(apply.mock.lastCall).toBeUndefined();

      const turn1Hp = farigiraf.hp;

      game.move.select(MoveId.SPLASH);
      await game.phaseInterceptor.to("TurnEndPhase");

      // healed back up to half without adding any more to array
      expect(farigiraf.hp).toBeGreaterThan(turn1Hp);
      expect(farigiraf.summonData.berriesEatenLast).toEqual([]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);
    });

    it("bypasses unnerve", async () => {
      game.override.enemyAbility(AbilityId.UNNERVE);
      await game.classicMode.startBattle([SpeciesId.FARIGIRAF]);

      const farigiraf = game.field.getPlayerPokemon();
      farigiraf.hp = 1;

      game.move.select(MoveId.SPLASH);
      await game.toNextTurn();
      game.move.select(MoveId.SPLASH);
      await game.phaseInterceptor.to("TurnEndPhase");

      // Turn end proc set the berriesEatenLast array back to being empty
      expect(farigiraf.summonData.berriesEatenLast).toEqual([]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);
      expect(farigiraf.hp).toBeGreaterThanOrEqual(farigiraf.hp / 2);
    });

    it("doesn't trigger on non-eating removal", async () => {
      game.override.enemyMoveset(MoveId.INCINERATE);
      await game.classicMode.startBattle([SpeciesId.FARIGIRAF]);

      const farigiraf = game.field.getPlayerPokemon();
      farigiraf.hp = farigiraf.getMaxHp() / 4;

      game.move.select(MoveId.SPLASH);
      await game.toNextTurn();

      // no berries eaten due to getting cooked
      expect(farigiraf.summonData.berriesEatenLast).toEqual([]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);
      expect(farigiraf.hp).toBeLessThan(farigiraf.getMaxHp() / 4);
    });

    it("works with pluck", async () => {
      game.override
        .enemySpecies(SpeciesId.BLAZIKEN)
        .enemyHeldItems([{ name: "BERRY", type: BerryType.PETAYA, count: 1 }])
        .startingHeldItems([]);
      await game.classicMode.startBattle([SpeciesId.FARIGIRAF]);

      const farigiraf = game.field.getPlayerPokemon();

      game.move.select(MoveId.BUG_BITE);
      await game.toNextTurn();

      game.move.select(MoveId.SPLASH);
      await game.toNextTurn();

      // berry effect triggered twice - once for bug bite, once for cud chew
      expect(farigiraf.getStatStage(Stat.SPATK)).toBe(2);
    });

    it("works with Ripen", async () => {
      game.override.passiveAbility(AbilityId.RIPEN);
      await game.classicMode.startBattle([SpeciesId.FARIGIRAF]);

      const farigiraf = game.field.getPlayerPokemon();
      farigiraf.hp = 1;

      game.move.select(MoveId.SPLASH);
      await game.toNextTurn();
      game.move.select(MoveId.SPLASH);
      await game.toNextTurn();

      // Rounding errors only ever cost a maximum of 4 hp
      expect(farigiraf.getInverseHp()).toBeLessThanOrEqual(3);
    });

    it("is preserved on reload/wave clear", async () => {
      game.override.enemyLevel(1);
      await game.classicMode.startBattle([SpeciesId.FARIGIRAF]);

      const farigiraf = game.field.getPlayerPokemon();
      farigiraf.hp = 1;

      game.move.select(MoveId.HYPER_VOICE);
      await game.toNextWave();

      // berry went yummy yummy in big fat giraffe tummy
      expect(farigiraf.summonData.berriesEatenLast).toEqual([BerryType.SITRUS]);
      expect(farigiraf.hp).toBeGreaterThan(1);

      // reload and the berry should still be there
      await game.reload.reloadSession();

      const farigirafReloaded = game.field.getPlayerPokemon();
      expect(farigirafReloaded.summonData.berriesEatenLast).toEqual([BerryType.SITRUS]);

      const wave1Hp = farigirafReloaded.hp;

      // blow up next wave and we should proc the repeat eating
      game.move.select(MoveId.HYPER_VOICE);
      await game.toNextWave();

      expect(farigirafReloaded.hp).toBeGreaterThan(wave1Hp);
    });
  });
});
