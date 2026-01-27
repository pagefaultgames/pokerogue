import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { type BattleStat, Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import { toTitleCase } from "#utils/strings";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe.each<{ name: string; ability: AbilityId; stat: BattleStat }>([
  { name: "Teal", ability: AbilityId.EMBODY_ASPECT_TEAL, stat: Stat.SPD },
  { name: "Cornerstone", ability: AbilityId.EMBODY_ASPECT_CORNERSTONE, stat: Stat.DEF },
  { name: "Hearthflame", ability: AbilityId.EMBODY_ASPECT_HEARTHFLAME, stat: Stat.ATK },
  { name: "Wellspring", ability: AbilityId.EMBODY_ASPECT_WELLSPRING, stat: Stat.SPDEF },
])("Ability - Embody Aspect $name", ({ ability, stat }) => {
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
      .ability(ability)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH);
  });

  const statName = toTitleCase(Stat[stat]);

  // NB: Our impl of Embody Aspect is a simple "on summon" ability w/o any fancy shenanigans
  it(`should raise the user's ${statName} by 1 stage on summon`, async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveAbilityApplied(ability);
    expect(feebas).toHaveStatStage(stat, 1);
  });
});
