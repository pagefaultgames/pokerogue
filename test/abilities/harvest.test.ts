import { BattlerIndex } from "#app/battle";
import { BerryModifier } from "#app/modifier/modifier";
import type { ModifierOverride } from "#app/modifier/modifier-type";
import { Abilities } from "#enums/abilities";
import { BerryType } from "#enums/berry-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { WeatherType } from "#enums/weather-type";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Harvest", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  function expectBerries(battlerIndex: BattlerIndex, berries: ModifierOverride[]) {
    const actualBerries: ModifierOverride[] = game.scene
      .getModifiers(BerryModifier, battlerIndex < BattlerIndex.ENEMY)
      .filter(b => b.getPokemon()?.getBattlerIndex() === battlerIndex)
      .map(
        // only grab berry type and quantity since that's literally all we care about
        b => ({ name: "BERRY", type: b.berryType, count: b.getStackCount() }),
      );
    expect(actualBerries).toBe(berries);
  }

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
      .moveset([Moves.SPLASH, Moves.NATURAL_GIFT, Moves.DRAGON_RAGE, Moves.GASTRO_ACID])
      .ability(Abilities.HARVEST)
      .enemyLevel(1)
      .battleType("single")
      .disableCrits()
      .statusActivation(false) // Since we're using nuzzle to proc both enigma and sitrus berries
      .weather(WeatherType.SUNNY)
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([Moves.SPLASH, Moves.NUZZLE, Moves.KNOCK_OFF, Moves.INCINERATE]);
  });

  it("should replenish eaten berries", async () => {
    game.override.startingHeldItems([{ name: "BERRY", type: BerryType.LUM, count: 1 }]);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.NUZZLE);
    await game.phaseInterceptor.to("TurnEndPhase", true);

    expectBerries(BattlerIndex.PLAYER, [{ name: "BERRY", type: BerryType.LUM, count: 1 }]);
    expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toBe([]);
  });

  it("tracks berries eaten while disabled", async () => {
    game.override
      .enemyAbility(Abilities.NEUTRALIZING_GAS)
      .startingLevel(100)
      .startingHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 3 },
        { name: "BERRY", type: BerryType.LUM, count: 3 },
      ]);
    await game.classicMode.startBattle([Species.FEEBAS]);

    const player = game.scene.getPlayerPokemon()!;
    player.hp = player.getMaxHp() / 4 - 1; // low enough to proc sitruses twice guaranteed

    // Spam splash a couple times while we chug sitruses and lums
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.NUZZLE);
    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.NUZZLE);
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toBe([
      BerryType.SITRUS,
      BerryType.LUM,
      BerryType.SITRUS,
      BerryType.LUM,
    ]);

    // Disable neutralizing gas this turn and we _should_ get a berry back!
    game.move.select(Moves.GASTRO_ACID);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase", true);

    // we chugged 3 berries in total;
    expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toHaveLength(3);
    expect(game.scene.getModifiers(BerryModifier, true).reduce((ret, berry) => ret + berry.stackCount, 0)).toBe(3);
  });

  it("cannot restore capped berries", async () => {
    const initBerries: ModifierOverride[] = [
      { name: "BERRY", type: BerryType.LUM, count: 3 },
      { name: "BERRY", type: BerryType.ENIGMA, count: 3 },
    ];
    game.override.startingHeldItems(initBerries);
    await game.classicMode.startBattle([Species.FEEBAS]);
    const player = game.scene.getPlayerPokemon()!;
    player.battleData.berriesEaten = [BerryType.LUM, BerryType.LUM, BerryType.ENIGMA];

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase", false);
    // Force RNG roll to hit the first berry we find.
    // This does nothing on a success (since there'd only be the enigma berry left to grab),
    // but ensures we don't accidentally let any false positives through.
    vi.spyOn(Phaser.Math.RND, "integerInRange").mockReturnValue(0);
    await game.phaseInterceptor.to("TurnEndPhase", true);

    expectBerries(BattlerIndex.PLAYER, initBerries);
  });
});
