import { Stat } from "#enums/stat";
import { SemiInvulnerableTag } from "#app/data/battler-tags";
import { Type } from "#app/data/type";
import { Biome } from "#app/enums/biome";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Flower Shield", () => {
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
    game.override.ability(Abilities.NONE);
    game.override.enemyAbility(Abilities.NONE);
    game.override.battleType("single");
    game.override.moveset([Moves.FLOWER_SHIELD, Moves.SPLASH]);
    game.override.enemyMoveset(SPLASH_ONLY);
  });

  it("raises DEF stat stage by 1 for all Grass-type Pokemon on the field by one stage - single battle", async () => {
    game.override.enemySpecies(Species.CHERRIM);

    await game.startBattle([Species.MAGIKARP]);
    const cherrim = game.scene.getEnemyPokemon()!;
    const magikarp = game.scene.getPlayerPokemon()!;

    expect(magikarp.getStatStage(Stat.DEF)).toBe(0);
    expect(cherrim.getStatStage(Stat.DEF)).toBe(0);

    game.move.select(Moves.FLOWER_SHIELD);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(magikarp.getStatStage(Stat.DEF)).toBe(0);
    expect(cherrim.getStatStage(Stat.DEF)).toBe(1);
  });

  it("raises DEF stat stage by 1 for all Grass-type Pokemon on the field by one stage - double battle", async () => {
    game.override.enemySpecies(Species.MAGIKARP).startingBiome(Biome.GRASS).battleType("double");

    await game.startBattle([Species.CHERRIM, Species.MAGIKARP]);
    const field = game.scene.getField(true);

    const grassPokemons = field.filter(p => p.getTypes().includes(Type.GRASS));
    const nonGrassPokemons = field.filter(pokemon => !grassPokemons.includes(pokemon));

    grassPokemons.forEach(p => expect(p.getStatStage(Stat.DEF)).toBe(0));
    nonGrassPokemons.forEach(p => expect(p.getStatStage(Stat.DEF)).toBe(0));

    game.move.select(Moves.FLOWER_SHIELD);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to(TurnEndPhase);

    grassPokemons.forEach(p => expect(p.getStatStage(Stat.DEF)).toBe(1));
    nonGrassPokemons.forEach(p => expect(p.getStatStage(Stat.DEF)).toBe(0));
  });

  /**
   * See semi-vulnerable state tags. {@linkcode SemiInvulnerableTag}
  */
  it("does not raise DEF stat stage for a Pokemon in semi-vulnerable state", async () => {
    game.override.enemySpecies(Species.PARAS);
    game.override.enemyMoveset([Moves.DIG, Moves.DIG, Moves.DIG, Moves.DIG]);
    game.override.enemyLevel(50);

    await game.startBattle([Species.CHERRIM]);
    const paras = game.scene.getEnemyPokemon()!;
    const cherrim = game.scene.getPlayerPokemon()!;

    expect(paras.getStatStage(Stat.DEF)).toBe(0);
    expect(cherrim.getStatStage(Stat.DEF)).toBe(0);
    expect(paras.getTag(SemiInvulnerableTag)).toBeUndefined;

    game.move.select(Moves.FLOWER_SHIELD);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(paras.getTag(SemiInvulnerableTag)).toBeDefined();
    expect(paras.getStatStage(Stat.DEF)).toBe(0);
    expect(cherrim.getStatStage(Stat.DEF)).toBe(1);
  });

  it("does nothing if there are no Grass-type Pokemon on the field", async () => {
    game.override.enemySpecies(Species.MAGIKARP);

    await game.startBattle([Species.MAGIKARP]);
    const enemy = game.scene.getEnemyPokemon()!;
    const ally = game.scene.getPlayerPokemon()!;

    expect(enemy.getStatStage(Stat.DEF)).toBe(0);
    expect(ally.getStatStage(Stat.DEF)).toBe(0);

    game.move.select(Moves.FLOWER_SHIELD);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemy.getStatStage(Stat.DEF)).toBe(0);
    expect(ally.getStatStage(Stat.DEF)).toBe(0);
  });
});
