import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  TurnEndPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";

describe("Abilities - Illusion", () => {
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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.ZORUA);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.ILLUSION);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);

    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.WORRY_SEED, Moves.SOAK, Moves.TACKLE, Moves.TACKLE]);
  });

  it("create illusion at the start", async () => {
    await game.startBattle([Species.ZOROARK, Species.AXEW]);

    //await game.phaseInterceptor.to(TurnInitPhase);

    const zoroark = game.scene.getPlayerPokemon();
    const zorua = game.scene.getEnemyPokemon();

    expect(zoroark.illusion.active).equals(true);
    expect(zorua.illusion.active).equals(true);
    expect(zoroark.illusion.available).equals(false);

  });

  it("break illusion after receiving damaging move and changing ability move", async () => {
    await game.startBattle([Species.ZOROARK, Species.AXEW]);
    game.doAttack(getMovePosition(game.scene, 0, Moves.WORRY_SEED));

    await game.phaseInterceptor.to(TurnEndPhase);

    const zoroark = game.scene.getPlayerPokemon();
    const zorua = game.scene.getEnemyPokemon();

    expect(zorua.illusion.active).equals(false);
    expect(zoroark.illusion.active).equals(false);
  });

  it("trick the enemy", async () => {
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FLAMETHROWER, Moves.PSYCHIC, Moves.TACKLE, Moves.TACKLE]);
    await game.startBattle([Species.ZOROARK, Species.AXEW]);

    const enemy = game.scene.getEnemyPokemon();
    const zoroark = game.scene.getPlayerPokemon();

    const flameThwowerEffectiveness = zoroark.getAttackMoveEffectiveness(enemy, enemy.getMoveset()[0], false, true);
    const psychicEffectiveness = zoroark.getAttackMoveEffectiveness(enemy, enemy.getMoveset()[1], false, true);

    expect(psychicEffectiveness).above(flameThwowerEffectiveness);
  });
});
