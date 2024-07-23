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
import { BattleStat } from "#app/data/battle-stat.js";
import { Biome } from "#app/enums/biome.js";
import { Type } from "#app/data/type.js";
import { SemiInvulnerableTag } from "#app/data/battler-tags.js";

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
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FLOWER_SHIELD, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  });

  it("increases defense of all Grass-type Pokemon on the field by one stage - single battle", async () => {
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.CHERRIM);

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
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "STARTING_BIOME_OVERRIDE", "get").mockReturnValue(Biome.GRASS);
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);

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
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.PARAS);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.DIG, Moves.DIG, Moves.DIG, Moves.DIG]);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(50);

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
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);

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
