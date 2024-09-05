import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";


describe("Moves - Tail whip", () => {
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
    const moveToUse = Moves.TAIL_WHIP;
    game.override.battleType("single");
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(Abilities.INSOMNIA);
    game.override.ability(Abilities.INSOMNIA);
    game.override.startingLevel(2000);
    game.override.moveset([ moveToUse ]);
    game.override.enemyMoveset(SPLASH_ONLY);
  });

  it("should lower DEF stat stage by 1", async() => {
    const moveToUse = Moves.TAIL_WHIP;
    await game.startBattle([
      Species.MIGHTYENA,
      Species.MIGHTYENA,
    ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(0);

    game.move.select(moveToUse);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnInitPhase);

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(-1);
  }, 20000);
});
