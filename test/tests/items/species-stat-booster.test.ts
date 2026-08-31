import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { Nature } from "#enums/nature";
import { SpeciesId } from "#enums/species-id";
import { EFFECTIVE_STATS, type EffectiveStat, Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

const speciesBoosterCases = [
  { itemName: "Light Ball", item: HeldItemId.LIGHT_BALL, species: SpeciesId.PIKACHU, stat: Stat.ATK },
  { itemName: "Light Ball", item: HeldItemId.LIGHT_BALL, species: SpeciesId.PIKACHU, stat: Stat.SPATK },
  { itemName: "Thick Club", item: HeldItemId.THICK_CLUB, species: SpeciesId.CUBONE, stat: Stat.ATK },
  { itemName: "Thick Club", item: HeldItemId.THICK_CLUB, species: SpeciesId.MAROWAK, stat: Stat.ATK },
  { itemName: "Thick Club", item: HeldItemId.THICK_CLUB, species: SpeciesId.ALOLA_MAROWAK, stat: Stat.ATK },
  { itemName: "Metal Powder", item: HeldItemId.METAL_POWDER, species: SpeciesId.DITTO, stat: Stat.DEF },
  { itemName: "Quick Powder", item: HeldItemId.QUICK_POWDER, species: SpeciesId.DITTO, stat: Stat.SPD },
  { itemName: "Deep Sea Scale", item: HeldItemId.DEEP_SEA_SCALE, species: SpeciesId.CLAMPERL, stat: Stat.SPDEF },
  { itemName: "Deep Sea Tooth", item: HeldItemId.DEEP_SEA_TOOTH, species: SpeciesId.CLAMPERL, stat: Stat.SPATK },
] as const;

describe("Items - Species Stat Boosters", () => {
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
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.BALL_FETCH)
      .nature(Nature.SERIOUS)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it.each(speciesBoosterCases)("$itemName should double $stat for $species", async ({ item, species, stat }) => {
    game.override.startingHeldItems([{ entry: item }]);

    await game.classicMode.startBattle(species);

    const player = game.field.getPlayerPokemon();
    expect(player.getSpeciesForm(true).speciesId).toBe(species);

    const baseline = player.getEffectiveStat(stat, { ignoreHeldItems: true });
    expect(player).toHaveEffectiveStat(stat, baseline * 2);
  });

  it.each([
    { itemName: "Light Ball", item: HeldItemId.LIGHT_BALL },
    { itemName: "Thick Club", item: HeldItemId.THICK_CLUB },
    { itemName: "Metal Powder", item: HeldItemId.METAL_POWDER },
    { itemName: "Quick Powder", item: HeldItemId.QUICK_POWDER },
    { itemName: "Deep Sea Scale", item: HeldItemId.DEEP_SEA_SCALE },
    { itemName: "Deep Sea Tooth", item: HeldItemId.DEEP_SEA_TOOTH },
  ])("$itemName should not boost stats of non-matching species", async ({ item }) => {
    game.override.startingHeldItems([{ entry: item }]);

    await game.classicMode.startBattle(SpeciesId.RATTATA);

    const player = game.field.getPlayerPokemon();
    for (const stat of EFFECTIVE_STATS) {
      expect(player).toHaveEffectiveStat(stat, player.getEffectiveStat(stat, { ignoreHeldItems: true }));
    }
  });

  it("should not boost stats other than the designated ones", async () => {
    game.override.startingHeldItems([{ entry: HeldItemId.LIGHT_BALL }]);

    await game.classicMode.startBattle(SpeciesId.PIKACHU);

    const player = game.field.getPlayerPokemon();
    for (const stat of [Stat.DEF, Stat.SPDEF] as const satisfies readonly EffectiveStat[]) {
      expect(player).toHaveEffectiveStat(stat, player.getEffectiveStat(stat, { ignoreHeldItems: true }));
    }
  });
});
