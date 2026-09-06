import { getGameMode } from "#app/game-mode";
import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { GameModes } from "#enums/game-modes";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { TrainerType } from "#enums/trainer-type";
import { TrainerVariant } from "#enums/trainer-variant";
import { UiMode } from "#enums/ui-mode";
import type { Pokemon } from "#field/pokemon";
import { GameManager } from "#test/framework/game-manager";
import type { ModifierSelectUiHandler } from "#ui/modifier-select-ui-handler";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Double Battles", () => {
  const DOUBLE_CHANCE = 8; // Normal chance of double battle is 1/8

  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override //
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.BALL_FETCH);
  });

  async function getModifierShopHandler(): Promise<ModifierSelectUiHandler> {
    await game.phaseInterceptor.to("BattleEndPhase");
    await vi.waitUntil(() => !game.scene.phaseManager.getCurrentPhase()?.is("BattleEndPhase"));

    const currentPhase = game.scene.phaseManager.getCurrentPhase()?.phaseName;
    expect(currentPhase, "Expected battle to transition to SelectModifierPhase").toBe("SelectModifierPhase");

    await game.phaseInterceptor.to("SelectModifierPhase");
    await vi.waitUntil(() => game.scene.ui.mode === UiMode.MODIFIER_SELECT);

    return game.scene.ui.getHandler() as ModifierSelectUiHandler;
  }

  // double-battle player's pokemon both fainted in same round, then revive one, and next double battle summons two player's pokemon successfully.
  // (There were bugs that either only summon one when can summon two, player stuck in switchPhase etc)
  it("3v2 edge case: player summons 2 pokemon on the next battle after being fainted and revived", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARIZARD, SpeciesId.SQUIRTLE);

    game.move.use(MoveId.SPLASH);
    game.move.use(MoveId.SPLASH, 1);

    for (const pokemon of game.scene.getPlayerField()) {
      pokemon.hp = 0;
      pokemon.status = new Status(StatusEffect.FAINT);
      expect(pokemon.isFainted()).toBe(true);
    }

    await game.doKillOpponents();

    await game.phaseInterceptor.to("BattleEndPhase");
    game.doSelectModifier();

    const charizard = game.scene.getPlayerParty().findIndex(p => p.species.speciesId === SpeciesId.CHARIZARD);
    game.doRevivePokemon(charizard);

    await game.phaseInterceptor.to("TurnInitPhase");
    expect(game.scene.getPlayerField().filter(p => !p.isFainted())).toHaveLength(2);
  });

  it("randomly chooses between single and double battles if there is no battle type override", async () => {
    let rngSweepProgress = 0; // Will simulate RNG rolls by slowly increasing from 0 to 1
    let doubleCount = 0;
    let singleCount = 0;

    vi.spyOn(Phaser.Math.RND, "realInRange").mockImplementation((min: number, max: number) => {
      return rngSweepProgress * (max - min) + min;
    });

    // Play through endless, waves 1 to 9, counting number of double battles from waves 2 to 9
    await game.classicMode.startBattle(SpeciesId.BULBASAUR);
    game.scene.gameMode = getGameMode(GameModes.ENDLESS);

    for (let i = 0; i < DOUBLE_CHANCE; i++) {
      rngSweepProgress = (i + 0.5) / DOUBLE_CHANCE;

      game.move.use(MoveId.SPLASH);
      await game.doKillOpponents();
      await game.toNextWave();

      if (game.scene.getEnemyParty().length === 1) {
        singleCount++;
      } else if (game.scene.getEnemyParty().length === 2) {
        doubleCount++;
      }
    }

    expect(doubleCount).toBe(1);
    expect(singleCount).toBe(DOUBLE_CHANCE - 1);
  });

  it("should offer no rewards when both opponents flee and zero are defeated", async () => {
    game.override.battleStyle("double").enemySpecies(SpeciesId.MAGIKARP).enemyMoveset([MoveId.SPLASH]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP, SpeciesId.MAGIKARP);

    const [p1, p2] = game.scene.getPlayerParty();
    game.move.changeMoveset(p1, [MoveId.ROAR]);
    game.move.changeMoveset(p2, [MoveId.SPLASH]);

    game.move.select(MoveId.ROAR, 0, 2);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    game.move.select(MoveId.ROAR, 0, 3);
    game.move.select(MoveId.SPLASH, 1);

    const handler = await getModifierShopHandler();
    expect(handler.options.length).toBe(0);
  });

  it("should offer normal rewards when one opponent is defeated and the other flees", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.MAGIKARP, SpeciesId.MAGIKARP);

    const [p1, p2] = game.scene.getPlayerParty();
    game.move.changeMoveset(p1, [MoveId.THUNDERBOLT, MoveId.ROAR]);
    game.move.changeMoveset(p2, [MoveId.SPLASH]);

    game.move.select(MoveId.THUNDERBOLT, 0, 2);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    game.move.select(MoveId.ROAR, 0, 3);
    game.move.select(MoveId.SPLASH, 1);

    const handler = await getModifierShopHandler();
    expect(handler.options.length).toBe(3);
  });

  it("won't queue multiple `BattleEndPhase`s/etc if the last 2 enemy Pokemon are defeated simultaneously in a trainer battle", async () => {
    game.override //
      .battleType(BattleType.TRAINER)
      .randomTrainer({ trainerType: TrainerType.YOUNGSTER, trainerVariant: TrainerVariant.DOUBLE })
      .startingLevel(200);

    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    expect(game.field.getEnemyParty()).toHaveLength(2);
    expect(game.scene.getEnemyField()).toHaveLength(2);

    game.move.use(MoveId.SURF);
    await game.toEndOfTurn(false);

    expect(game.scene.phaseManager["phaseQueue"].findAll("BattleEndPhase")).toHaveLength(1);
  });

  describe("Info box render order", () => {
    /** Position of the pokemon's info box in the field UI display list; higher renders on top */
    const getInfoBoxIndex = (pokemon: Pokemon) => game.scene.fieldUI.getAll().indexOf(pokemon.getBattleInfo());

    /**
     * Clear the current wave and start the next one.
     * From the 2nd wave on, the enemy info boxes are shown after the player's remain on screen,
     * which is the display list state that exposed the ordering bug.
     */
    async function toNextDoubleWave(): Promise<void> {
      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
      await game.doKillOpponents();
      await game.toNextWave();
      expect(game.scene.getPlayerField()).toHaveLength(2);
      expect(game.scene.getEnemyField()).toHaveLength(2);
    }

    beforeEach(() => {
      game.override.battleStyle("double");
    });

    it("should render the 2nd field slot's info box above the 1st's", async () => {
      await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARIZARD);

      const [bulbasaur, charizard] = game.scene.getPlayerField();
      expect(getInfoBoxIndex(charizard)).toBeGreaterThan(getInfoBoxIndex(bulbasaur));

      const [enemy1, enemy2] = game.scene.getEnemyField();
      expect(getInfoBoxIndex(enemy2)).toBeGreaterThan(getInfoBoxIndex(enemy1));
    });

    it("should render a pokemon switched into the 2nd field slot above the 1st slot's info box", async () => {
      await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARIZARD, SpeciesId.SQUIRTLE);

      const [bulbasaur, , squirtle] = game.scene.getPlayerParty();
      await toNextDoubleWave();

      // Bulbasaur / Squirtle // Charizard
      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
      game.doSwitchPokemon(2);
      await game.toNextTurn();

      expect(game.scene.getPlayerField()).toEqual([bulbasaur, squirtle]);
      expect(getInfoBoxIndex(squirtle)).toBeGreaterThan(getInfoBoxIndex(bulbasaur));
    });

    it("should render a pokemon replacing a fainted 2nd field slot above the 1st slot's info box", async () => {
      await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARIZARD, SpeciesId.SQUIRTLE);

      const [bulbasaur, charizard, squirtle] = game.scene.getPlayerParty();
      await toNextDoubleWave();

      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
      await game.killPokemon(charizard);
      game.doSelectPartyPokemon(2);
      await game.toNextTurn();

      expect(game.scene.getPlayerField()).toEqual([bulbasaur, squirtle]);
      expect(getInfoBoxIndex(squirtle)).toBeGreaterThan(getInfoBoxIndex(bulbasaur));
    });
  });
});
