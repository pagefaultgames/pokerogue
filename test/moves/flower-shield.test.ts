import { SemiInvulnerableTag } from "#data/battler-tags";
import { AbilityId } from "#enums/ability-id";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
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
    game.override
      .ability(AbilityId.NONE)
      .enemyAbility(AbilityId.NONE)
      .battleStyle("single")
      .moveset([MoveId.FLOWER_SHIELD, MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH);
  });

  it("raises DEF stat stage by 1 for all Grass-type Pokemon on the field by one stage - single battle", async () => {
    game.override.enemySpecies(SpeciesId.CHERRIM);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const cherrim = game.field.getEnemyPokemon();
    const magikarp = game.field.getPlayerPokemon();

    expect(magikarp.getStatStage(Stat.DEF)).toBe(0);
    expect(cherrim.getStatStage(Stat.DEF)).toBe(0);

    game.move.select(MoveId.FLOWER_SHIELD);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(magikarp.getStatStage(Stat.DEF)).toBe(0);
    expect(cherrim.getStatStage(Stat.DEF)).toBe(1);
  });

  it("raises DEF stat stage by 1 for all Grass-type Pokemon on the field by one stage - double battle", async () => {
    game.override.enemySpecies(SpeciesId.MAGIKARP).startingBiome(BiomeId.GRASS).battleStyle("double");

    await game.classicMode.startBattle([SpeciesId.CHERRIM, SpeciesId.MAGIKARP]);
    const field = game.scene.getField(true);

    const grassPokemons = field.filter(p => p.getTypes().includes(PokemonType.GRASS));
    const nonGrassPokemons = field.filter(pokemon => !grassPokemons.includes(pokemon));

    grassPokemons.forEach(p => expect(p.getStatStage(Stat.DEF)).toBe(0));
    nonGrassPokemons.forEach(p => expect(p.getStatStage(Stat.DEF)).toBe(0));

    game.move.select(MoveId.FLOWER_SHIELD);
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to(TurnEndPhase);

    grassPokemons.forEach(p => expect(p.getStatStage(Stat.DEF)).toBe(1));
    nonGrassPokemons.forEach(p => expect(p.getStatStage(Stat.DEF)).toBe(0));
  });

  /**
   * See semi-vulnerable state tags. {@linkcode SemiInvulnerableTag}
   */
  it("does not raise DEF stat stage for a Pokemon in semi-vulnerable state", async () => {
    game.override.enemySpecies(SpeciesId.PARAS).enemyMoveset(MoveId.DIG).enemyLevel(50);

    await game.classicMode.startBattle([SpeciesId.CHERRIM]);
    const paras = game.field.getEnemyPokemon();
    const cherrim = game.field.getPlayerPokemon();

    expect(paras.getStatStage(Stat.DEF)).toBe(0);
    expect(cherrim.getStatStage(Stat.DEF)).toBe(0);
    expect(paras.getTag(SemiInvulnerableTag)).toBeUndefined;

    game.move.select(MoveId.FLOWER_SHIELD);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(paras.getTag(SemiInvulnerableTag)).toBeDefined();
    expect(paras.getStatStage(Stat.DEF)).toBe(0);
    expect(cherrim.getStatStage(Stat.DEF)).toBe(1);
  });

  it("does nothing if there are no Grass-type Pokemon on the field", async () => {
    game.override.enemySpecies(SpeciesId.MAGIKARP);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const enemy = game.field.getEnemyPokemon();
    const ally = game.field.getPlayerPokemon();

    expect(enemy.getStatStage(Stat.DEF)).toBe(0);
    expect(ally.getStatStage(Stat.DEF)).toBe(0);

    game.move.select(MoveId.FLOWER_SHIELD);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemy.getStatStage(Stat.DEF)).toBe(0);
    expect(ally.getStatStage(Stat.DEF)).toBe(0);
  });
});
