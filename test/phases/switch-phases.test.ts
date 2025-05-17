import Trainer from "#app/field/trainer";
import { Abilities } from "#enums/abilities";
import { BattleType } from "#enums/battle-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe.each<{ name: string; selfMove?: Moves; selfAbility?: Abilities; oppMove?: Moves }>([
  { name: "Self Switch Attack Moves", selfMove: Moves.U_TURN },
  { name: "Target Switch Attack Moves", oppMove: Moves.DRAGON_TAIL },
  { name: "Self Switch Status Moves", selfMove: Moves.TELEPORT },
  { name: "Target Switch Status Moves", oppMove: Moves.WHIRLWIND },
  { name: "Self Switch Abilities", selfAbility: Abilities.EMERGENCY_EXIT },
])(
  "Switch Outs - $name - ",
  ({ selfMove = Moves.SPLASH, selfAbility = Abilities.BALL_FETCH, oppMove = Moves.SPLASH }) => {
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
        .battleStyle("single")
        .disableCrits()
        .enemySpecies(Species.MAGIKARP)
        .enemyPassiveAbility(Abilities.NO_GUARD);
    });

    describe("Player -", () => {
      beforeEach(() => {
        game.override.moveset(oppMove).ability(selfAbility).enemyMoveset(selfMove).enemyAbility(Abilities.BALL_FETCH);
      });

      it("should only call leaveField once on the switched out pokemon", async () => {
        await game.classicMode.startBattle([Species.PILOSWINE, Species.MAMOSWINE]);

        const [piloswine, mamoswine] = game.scene.getPlayerParty();
        const piloLeaveSpy = vi.spyOn(piloswine, "leaveField");
        const mamoLeaveSpy = vi.spyOn(mamoswine, "leaveField");

        game.move.select(selfMove);
        game.doSelectPartyPokemon(1);
        await game.phaseInterceptor.to("BerryPhase", false);

        expect(piloLeaveSpy).toHaveBeenCalledTimes(1);
        expect(mamoLeaveSpy).toHaveBeenCalledTimes(0);
      });

      it("should only reset summonData/turnData once per switch", async () => {
        await game.classicMode.startBattle([Species.PILOSWINE, Species.MAMOSWINE]);

        const [piloswine, mamoswine] = game.scene.getPlayerParty();
        const piloSummonSpy = vi.spyOn(piloswine, "resetSummonData");
        const piloTurnSpy = vi.spyOn(piloswine, "resetTurnData");
        const mamoSummonSpy = vi.spyOn(mamoswine, "resetSummonData");
        const mamoTurnSpy = vi.spyOn(mamoswine, "resetTurnData");

        game.move.select(selfMove);
        game.doSelectPartyPokemon(1);
        await game.phaseInterceptor.to("BerryPhase", false);

        expect(piloSummonSpy).toHaveBeenCalledTimes(1);
        expect(piloTurnSpy).toHaveBeenCalledTimes(1);
        expect(mamoSummonSpy).toHaveBeenCalledTimes(1);
        expect(mamoTurnSpy).toHaveBeenCalledTimes(1);
      });

      it("should not reset battleData/waveData upon switching", async () => {
        await game.classicMode.startBattle([Species.PILOSWINE, Species.MAMOSWINE]);

        const [piloswine, mamoswine] = game.scene.getPlayerParty();
        const piloWaveSpy = vi.spyOn(piloswine, "resetWaveData");
        const piloBattleWaveSpy = vi.spyOn(piloswine, "resetBattleAndWaveData");
        const mamoWaveSpy = vi.spyOn(mamoswine, "resetWaveData");
        const mamoBattleWaveSpy = vi.spyOn(mamoswine, "resetBattleAndWaveData");

        game.move.select(selfMove);
        game.doSelectPartyPokemon(1);
        await game.phaseInterceptor.to("TurnEndPhase");

        expect(piloWaveSpy).toHaveBeenCalledTimes(0);
        expect(piloBattleWaveSpy).toHaveBeenCalledTimes(0);
        expect(mamoWaveSpy).toHaveBeenCalledTimes(0);
        expect(mamoBattleWaveSpy).toHaveBeenCalledTimes(0);
      });
    });

    describe("Enemy - ", () => {
      beforeEach(() => {
        game.override
          .enemyMoveset(oppMove)
          .enemyAbility(selfAbility)
          .moveset(selfMove)
          .ability(Abilities.BALL_FETCH)
          .battleType(BattleType.TRAINER);

        // prevent natural trainer switches
        vi.spyOn(Trainer.prototype, "getPartyMemberMatchupScores").mockReturnValue([
          [100, 1],
          [100, 1],
        ]);
      });

      it("should only call leaveField once on the switched out pokemon", async () => {
        await game.classicMode.startBattle([Species.PILOSWINE, Species.MAMOSWINE]);

        const [enemy1, enemy2] = game.scene.getEnemyParty();
        const enemy1LeaveSpy = vi.spyOn(enemy1, "leaveField");
        const enemy2LeaveSpy = vi.spyOn(enemy2, "leaveField");

        game.move.select(selfMove);
        await game.phaseInterceptor.to("BerryPhase", false);

        expect(enemy1LeaveSpy).toHaveBeenCalledTimes(1);
        expect(enemy2LeaveSpy).toHaveBeenCalledTimes(0);
      });

      it("should only reset summonData/turnData once per switch", async () => {
        await game.classicMode.startBattle([Species.PILOSWINE, Species.MAMOSWINE]);

        const [enemy1, enemy2] = game.scene.getEnemyParty();
        const enemy1SummonSpy = vi.spyOn(enemy1, "resetSummonData");
        const enemy1TurnSpy = vi.spyOn(enemy1, "resetTurnData");
        const enemy2SummonSpy = vi.spyOn(enemy2, "resetSummonData");
        const enemy2TurnSpy = vi.spyOn(enemy2, "resetTurnData");

        game.move.select(selfMove);
        await game.phaseInterceptor.to("BerryPhase", false);

        expect(enemy1SummonSpy).toHaveBeenCalledTimes(1);
        expect(enemy1TurnSpy).toHaveBeenCalledTimes(1);
        expect(enemy2SummonSpy).toHaveBeenCalledTimes(1);
        expect(enemy2TurnSpy).toHaveBeenCalledTimes(1);
      });

      it("should not reset battleData/waveData upon switching", async () => {
        await game.classicMode.startBattle([Species.PILOSWINE, Species.MAMOSWINE]);

        const [enemy1, enemy2] = game.scene.getEnemyParty();
        const enemy1WaveSpy = vi.spyOn(enemy1, "resetWaveData");
        const enemy1BattleWaveSpy = vi.spyOn(enemy1, "resetBattleAndWaveData");
        const enemy2WaveSpy = vi.spyOn(enemy2, "resetWaveData");
        const enemy2BattleWaveSpy = vi.spyOn(enemy2, "resetBattleAndWaveData");

        game.move.select(selfMove);
        await game.phaseInterceptor.to("TurnEndPhase");

        expect(enemy1WaveSpy).toHaveBeenCalledTimes(0);
        expect(enemy1BattleWaveSpy).toHaveBeenCalledTimes(0);
        expect(enemy2WaveSpy).toHaveBeenCalledTimes(0);
        expect(enemy2BattleWaveSpy).toHaveBeenCalledTimes(0);
      });
    });
  },
);
