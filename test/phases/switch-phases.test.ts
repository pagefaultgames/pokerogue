import { PokemonSummonData, PokemonTurnData } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { BattleType } from "#enums/battle-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Manual Switching -", () => {
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
      .moveset(Moves.SPLASH)
      .enemyMoveset(Moves.SPLASH)
      .battleType(BattleType.TRAINER)
      .enemyAbility(Abilities.BALL_FETCH);
  });

  describe("Player", () => {
    it("should only call leaveField once on the switched out pokemon", async () => {
      await game.classicMode.startBattle([Species.PILOSWINE, Species.MAMOSWINE]);

      const [piloswine, mamoswine] = game.scene.getPlayerParty();
      const piloLeaveSpy = vi.spyOn(piloswine, "leaveField");
      const mamoLeaveSpy = vi.spyOn(mamoswine, "leaveField");

      game.doSwitchPokemon(1);
      await game.phaseInterceptor.to("TurnEndPhase");

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

      game.doSwitchPokemon(1);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(piloSummonSpy).toHaveBeenCalledTimes(1);
      expect(piloTurnSpy).toHaveBeenCalledTimes(1);
      expect(mamoSummonSpy).toHaveBeenCalledTimes(1);
      expect(mamoTurnSpy).toHaveBeenCalledTimes(2); // once from switching, once at turn start
    });

    it("should not reset battleData/waveData upon switching", async () => {
      await game.classicMode.startBattle([Species.PILOSWINE, Species.MAMOSWINE]);

      const [piloswine, mamoswine] = game.scene.getPlayerParty();
      const piloWaveSpy = vi.spyOn(piloswine, "resetWaveData");
      const piloBattleWaveSpy = vi.spyOn(piloswine, "resetBattleAndWaveData");
      const mamoWaveSpy = vi.spyOn(mamoswine, "resetWaveData");
      const mamoBattleWaveSpy = vi.spyOn(mamoswine, "resetBattleAndWaveData");

      game.doSwitchPokemon(1);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(piloWaveSpy).toHaveBeenCalledTimes(0);
      expect(piloBattleWaveSpy).toHaveBeenCalledTimes(0);
      expect(mamoWaveSpy).toHaveBeenCalledTimes(0);
      expect(mamoBattleWaveSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe("Enemy", () => {
    it("should only call leaveField once on the switched out pokemon", async () => {
      await game.classicMode.startBattle([Species.PILOSWINE, Species.MAMOSWINE]);

      const [enemy1, enemy2] = game.scene.getEnemyParty();
      const enemy1LeaveSpy = vi.spyOn(enemy1, "leaveField");
      const enemy2LeaveSpy = vi.spyOn(enemy2, "leaveField");

      game.move.select(Moves.SPLASH);
      game.forceEnemyToSwitch();
      await game.phaseInterceptor.to("TurnEndPhase");

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

      game.move.select(Moves.SPLASH);
      game.forceEnemyToSwitch();
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(enemy1SummonSpy).toHaveBeenCalledTimes(1);
      expect(enemy1TurnSpy).toHaveBeenCalledTimes(1);
      expect(enemy2SummonSpy).toHaveBeenCalledTimes(1);
      expect(enemy2TurnSpy).toHaveBeenCalledTimes(2); // once from switching, once at turn start
    });

    it("should not reset battleData/waveData upon switching", async () => {
      await game.classicMode.startBattle([Species.PILOSWINE, Species.MAMOSWINE]);

      const [enemy1, enemy2] = game.scene.getEnemyParty();
      const enemy1WaveSpy = vi.spyOn(enemy1, "resetWaveData");
      const enemy1BattleWaveSpy = vi.spyOn(enemy1, "resetBattleAndWaveData");
      const enemy2WaveSpy = vi.spyOn(enemy2, "resetWaveData");
      const enemy2BattleWaveSpy = vi.spyOn(enemy2, "resetBattleAndWaveData");

      game.move.select(Moves.SPLASH);
      game.forceEnemyToSwitch();
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(enemy1WaveSpy).toHaveBeenCalledTimes(0);
      expect(enemy1BattleWaveSpy).toHaveBeenCalledTimes(0);
      expect(enemy2WaveSpy).toHaveBeenCalledTimes(0);
      expect(enemy2BattleWaveSpy).toHaveBeenCalledTimes(0);
    });
  });
});

describe.each<{ name: string; playerMove?: Moves; playerAbility?: Abilities; enemyMove?: Moves }>([
  { name: "Self Switch Attack Moves", playerMove: Moves.U_TURN },
  { name: "Target Switch Attack Moves", enemyMove: Moves.DRAGON_TAIL },
  { name: "Self Switch Status Moves", playerMove: Moves.TELEPORT },
  { name: "Target Switch Status Moves", enemyMove: Moves.WHIRLWIND },
  { name: "Self Switch Abilities", playerAbility: Abilities.EMERGENCY_EXIT, enemyMove: Moves.BRAVE_BIRD },
  /*   { name: "Fainting", playerMove: Moves.EXPLOSION }, */ // TODO: This calls it twice...
])(
  "Mid-Battle Switch Outs - $name - ",
  ({ playerMove = Moves.SPLASH, playerAbility = Abilities.BALL_FETCH, enemyMove = Moves.SPLASH }) => {
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
        .moveset(playerMove)
        .ability(playerAbility)
        .battleStyle("single")
        .disableCrits()
        .enemyLevel(100)
        .battleType(BattleType.TRAINER)
        .passiveAbility(Abilities.STURDY)
        .enemySpecies(Species.MAGIKARP)
        .enemyMoveset(enemyMove)
        .enemyAbility(Abilities.BALL_FETCH)
        .enemyPassiveAbility(Abilities.NO_GUARD);
    });

    it("should only call leaveField once on the switched out pokemon", async () => {
      await game.classicMode.startBattle([Species.PILOSWINE, Species.MAMOSWINE]);

      const [piloswine, mamoswine] = game.scene.getPlayerParty();
      const piloLeaveSpy = vi.spyOn(piloswine, "leaveField");
      const mamoLeaveSpy = vi.spyOn(mamoswine, "leaveField");

      game.move.select(playerMove);
      game.doSelectPartyPokemon(1);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(piloLeaveSpy).toHaveBeenCalledTimes(1);
      expect(mamoLeaveSpy).toHaveBeenCalledTimes(0);
    });

    it("should only reset summonData/turnData once per switch", async () => {
      await game.classicMode.startBattle([Species.PILOSWINE, Species.MAMOSWINE]);

      const [piloswine, mamoswine] = game.scene.getPlayerParty();
      piloswine.addTag(BattlerTagType.AQUA_RING, 999); // give piloswine a tag to ensure we know if summonData got reset
      const piloSummonSpy = vi.spyOn(piloswine, "resetSummonData");
      const piloTurnSpy = vi.spyOn(piloswine, "resetTurnData");
      const mamoSummonSpy = vi.spyOn(mamoswine, "resetSummonData");
      const mamoTurnSpy = vi.spyOn(mamoswine, "resetTurnData");

      game.move.select(playerMove);
      game.doSelectPartyPokemon(1);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(piloSummonSpy).toHaveBeenCalledTimes(1);
      expect(piloTurnSpy).toHaveBeenCalledTimes(1);
      expect(mamoSummonSpy).toHaveBeenCalledTimes(1);
      expect(mamoTurnSpy).toHaveBeenCalledTimes(1);
      expect(piloswine.summonData).toEqual(new PokemonSummonData());
      expect(piloswine.turnData).toEqual(new PokemonTurnData());
    });

    it("should not reset battleData/waveData upon switching", async () => {
      await game.classicMode.startBattle([Species.PILOSWINE, Species.MAMOSWINE]);

      const [piloswine, mamoswine] = game.scene.getPlayerParty();
      const piloWaveSpy = vi.spyOn(piloswine, "resetWaveData");
      const piloBattleWaveSpy = vi.spyOn(piloswine, "resetBattleAndWaveData");
      const mamoWaveSpy = vi.spyOn(mamoswine, "resetWaveData");
      const mamoBattleWaveSpy = vi.spyOn(mamoswine, "resetBattleAndWaveData");

      game.move.select(playerMove);
      game.doSelectPartyPokemon(1);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(piloWaveSpy).toHaveBeenCalledTimes(0);
      expect(piloBattleWaveSpy).toHaveBeenCalledTimes(0);
      expect(mamoWaveSpy).toHaveBeenCalledTimes(0);
      expect(mamoBattleWaveSpy).toHaveBeenCalledTimes(0);
    });
  },
);
