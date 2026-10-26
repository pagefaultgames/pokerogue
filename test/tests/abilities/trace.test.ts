import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Trace", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.TRACE)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should copy the opponent's ability", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    expect(game.field.getPlayerPokemon().getAbility().id).toBe(AbilityId.BALL_FETCH);
  });

  it("should activate a copied post-summon ability", async () => {
    game.override.enemyAbility(AbilityId.INTIMIDATE);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    expect(game.field.getEnemyPokemon().getStatStage(Stat.ATK)).toBe(-1);
  });

  describe("As Passive", () => {
    beforeEach(() => {
      game.override //
        .ability(AbilityId.BALL_FETCH)
        .passiveAbility(AbilityId.TRACE);
    });

    it("should copy the opponent's passive if Trace is a passive and the opponent's passive is enabled", async () => {
      game.override.enemyPassiveAbility(AbilityId.INSOMNIA);
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      expect(game.field.getPlayerPokemon().getPassiveAbility().id).toBe(AbilityId.INSOMNIA);
    });

    it("should copy the opponent's regular ability if Trace is a passive and the opponent's passive is disabled", async () => {
      game.override.enemyAbility(AbilityId.INSOMNIA);
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      expect(game.field.getPlayerPokemon().getPassiveAbility().id).toBe(AbilityId.INSOMNIA);
    });
  });
});
