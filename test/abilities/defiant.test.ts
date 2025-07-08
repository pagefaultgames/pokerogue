import { Stat } from "#enums/stat";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Defiant", () => {
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
      .enemySpecies(SpeciesId.BEEDRILL)
      .enemyMoveset(MoveId.TICKLE)
      .startingLevel(1)
      .moveset([MoveId.SPLASH, MoveId.CLOSE_COMBAT])
      .ability(AbilityId.DEFIANT);
  });

  it("lower atk and def by 1 via tickle, then increase atk by 4 via defiant", async () => {
    await game.classicMode.startBattle([SpeciesId.FLYGON]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(3);
    expect(playerPokemon.getStatStage(Stat.DEF)).toBe(-1);
  });

  it("lowering your own stats should not trigger defiant", async () => {
    game.override.enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.FLYGON]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    game.move.select(MoveId.CLOSE_COMBAT);
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(playerPokemon.getStatStage(Stat.SPDEF)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.DEF)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("white herb should remove only the negative effects", async () => {
    game.override.startingHeldItems([{ name: "WHITE_HERB" }]);
    await game.classicMode.startBattle([SpeciesId.FLYGON]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(playerPokemon.getStatStage(Stat.DEF)).toBe(0);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(3);
  });
});
