import { BattleStat } from "#app/data/battle-stat.js";
import { SemiInvulnerableTag } from "#app/data/battler-tags.js";
import { Type } from "#app/data/type.js";
import { Biome } from "#app/enums/biome.js";
import {
  TurnEndPhase,
} from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";

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

  it("increases defense of all Grass-type Pokemon on the field by one stage - single battle", async () => {
    game.override.enemySpecies(Species.CHERRIM);

    await game.startBattle([Species.MAGIKARP]);
    const cherrim = game.scene.getEnemyPokemon();
    const magikarp = game.scene.getPlayerPokemon();

    expect(magikarp.summonData.battleStats[BattleStat.DEF]).toBe(0);
    expect(cherrim.summonData.battleStats[BattleStat.DEF]).toBe(0);

    game.doAttack(getMovePosition(game.scene, 0, Moves.FLOWER_SHIELD));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(magikarp.summonData.battleStats[BattleStat.DEF]).toBe(0);
    expect(cherrim.summonData.battleStats[BattleStat.DEF]).toBe(1);
  });

  it("increases defense of all Grass-type Pokemon on the field by one stage - double battle", async () => {
    game.override.enemySpecies(Species.MAGIKARP).startingBiome(Biome.GRASS).battleType("double");

    await game.startBattle([Species.CHERRIM, Species.MAGIKARP]);
    const field = game.scene.getField(true);

    const grassPokemons = field.filter(p => p.getTypes().includes(Type.GRASS));
    const nonGrassPokemons = field.filter(pokemon => !grassPokemons.includes(pokemon));

    grassPokemons.forEach(p => expect(p.summonData.battleStats[BattleStat.DEF]).toBe(0));
    nonGrassPokemons.forEach(p => expect(p.summonData.battleStats[BattleStat.DEF]).toBe(0));

    game.doAttack(getMovePosition(game.scene, 0, Moves.FLOWER_SHIELD));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);

    grassPokemons.forEach(p => expect(p.summonData.battleStats[BattleStat.DEF]).toBe(1));
    nonGrassPokemons.forEach(p => expect(p.summonData.battleStats[BattleStat.DEF]).toBe(0));
  });

  /**
   * See semi-vulnerable state tags. {@linkcode SemiInvulnerableTag}
  */
  it("does not increase defense of a pokemon in semi-vulnerable state", async () => {
    game.override.enemySpecies(Species.PARAS);
    game.override.enemyMoveset([Moves.DIG, Moves.DIG, Moves.DIG, Moves.DIG]);
    game.override.enemyLevel(50);

    await game.startBattle([Species.CHERRIM]);
    const paras = game.scene.getEnemyPokemon();
    const cherrim = game.scene.getPlayerPokemon();

    expect(paras.summonData.battleStats[BattleStat.DEF]).toBe(0);
    expect(cherrim.summonData.battleStats[BattleStat.DEF]).toBe(0);
    expect(paras.getTag(SemiInvulnerableTag)).toBeUndefined;

    game.doAttack(getMovePosition(game.scene, 0, Moves.FLOWER_SHIELD));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(paras.getTag(SemiInvulnerableTag)).toBeDefined();
    expect(paras.summonData.battleStats[BattleStat.DEF]).toBe(0);
    expect(cherrim.summonData.battleStats[BattleStat.DEF]).toBe(1);
  });

  it("does nothing if there are no Grass-type pokemon on the field", async () => {
    game.override.enemySpecies(Species.MAGIKARP);

    await game.startBattle([Species.MAGIKARP]);
    const enemy = game.scene.getEnemyPokemon();
    const ally = game.scene.getPlayerPokemon();

    expect(enemy.summonData.battleStats[BattleStat.DEF]).toBe(0);
    expect(ally.summonData.battleStats[BattleStat.DEF]).toBe(0);

    game.doAttack(getMovePosition(game.scene, 0, Moves.FLOWER_SHIELD));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemy.summonData.battleStats[BattleStat.DEF]).toBe(0);
    expect(ally.summonData.battleStats[BattleStat.DEF]).toBe(0);
  });
});
