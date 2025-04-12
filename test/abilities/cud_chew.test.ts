import { RepeatBerryNextTurnAbAttr } from "#app/data/ability";
import { Abilities } from "#enums/abilities";
import { BerryType } from "#enums/berry-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
    vi.resetAllMocks();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .moveset(Moves.SPLASH)
      .startingHeldItems([{ name: "BERRY", type: BerryType.SITRUS, count: 1 }])
      .ability(Abilities.CUD_CHEW)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  describe("tracks berries eaten", () => {
    it("stores inside battledata at end of turn", async () => {
      await game.classicMode.startBattle([Species.FARIGIRAF]);

      const farigiraf = game.scene.getPlayerPokemon()!;
      farigiraf.hp = 1; // needed to allow sitrus procs

      game.move.select(Moves.SPLASH);
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

    it("resets array on switch", async () => {
      await game.classicMode.startBattle([Species.FARIGIRAF, Species.GIRAFARIG]);

      const farigiraf = game.scene.getPlayerPokemon()!;
      farigiraf.hp = 1; // needed to allow sitrus procs

      // eat berry turn 1, switch out turn 2
      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      const turn1Hp = farigiraf.hp;
      game.doSwitchPokemon(1);
      await game.phaseInterceptor.to("TurnEndPhase");

      // summonData got cleared due to switch, turnData got cleared due to turn end
      expect(farigiraf.summonData.berriesEatenLast).toEqual([]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);
      expect(farigiraf.hp).toEqual(turn1Hp);
    });

    it("clears array if disabled", async () => {
      game.override.enemyAbility(Abilities.NEUTRALIZING_GAS);
      await game.classicMode.startBattle([Species.FARIGIRAF]);

      const farigiraf = game.scene.getPlayerPokemon()!;
      farigiraf.hp = 1; // needed to allow sitrus procs

      game.move.select(Moves.SPLASH);
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
    it("re-triggers effects on eater without infinitely looping", async () => {
      const apply = vi.spyOn(RepeatBerryNextTurnAbAttr.prototype, "apply");
      await game.classicMode.startBattle([Species.FARIGIRAF]);

      const farigiraf = game.scene.getPlayerPokemon()!;
      farigiraf.hp = 1; // needed to allow sitrus procs

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      // ate 1 sitrus the turn prior, spitball pending
      expect(farigiraf.battleData.berriesEaten).toEqual([BerryType.SITRUS]);
      expect(farigiraf.summonData.berriesEatenLast).toEqual([BerryType.SITRUS]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);
      expect(apply.mock.lastCall).toBeUndefined();

      const turn1Hp = farigiraf.hp;

      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to("TurnEndPhase");

      // healed back up to half without adding any more to array
      expect(farigiraf.hp).toBeGreaterThan(turn1Hp);
      expect(farigiraf.battleData.berriesEaten).toEqual([BerryType.SITRUS]);
      expect(farigiraf.summonData.berriesEatenLast).toEqual([]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);
    });

    it("bypasses unnerve", async () => {
      game.override.enemyAbility(Abilities.UNNERVE);
      await game.classicMode.startBattle([Species.FARIGIRAF]);

      const farigiraf = game.scene.getPlayerPokemon()!;
      farigiraf.hp = 1; // needed to allow sitrus procs

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();
      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to("TurnEndPhase");

      // Turn end proc set the berriesEatenLast array back to being empty
      expect(farigiraf.summonData.berriesEatenLast).toEqual([]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);
      expect(farigiraf.hp).toBeGreaterThanOrEqual(farigiraf.hp / 2);
    });

    it("doesn't count non-eating removal", async () => {
      game.override.enemyMoveset(Moves.INCINERATE);
      await game.classicMode.startBattle([Species.FARIGIRAF]);

      const farigiraf = game.scene.getPlayerPokemon()!;
      const initHp = farigiraf.getMaxHp() / 4; // needed to allow sitrus procs without dying
      farigiraf.hp = initHp;

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      // only 1 berry eaten due to 2nd one being cooked
      expect(farigiraf.summonData.berriesEatenLast).toEqual([BerryType.SITRUS]);
      expect(farigiraf.turnData.berriesEaten).toEqual([]);
    });
  });
});
