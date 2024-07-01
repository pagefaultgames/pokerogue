import BattleScene from "../../battle-scene";
import {AddPokeballModifierType} from "../../modifier/modifier-type";
import {
  EnemyPartyConfig, EnemyPokemonConfig,
  getRandomPlayerPokemon,
  getRandomSpeciesByStarterTier,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle
} from "./mystery-encounter-utils";
import MysteryEncounter, {MysteryEncounterBuilder, MysteryEncounterTier} from "../mystery-encounter";
import {ModifierRewardPhase} from "#app/phases";
import {getPokemonSpecies} from "../pokemon-species";
import {MysteryEncounterType} from "#enums/mystery-encounter-type";
import {PokeballType} from "../pokeball";
import {PartySizeRequirement, WaveCountRequirement} from "../mystery-encounter-requirements";
import {MysteryEncounterOptionBuilder} from "../mystery-encounter-option";
import {Type} from "#app/data/type";
import {Species} from "#enums/species";
import {isNullOrUndefined, randSeedInt} from "#app/utils";

// TODO: may not need this list anymore since egg tiers have different rarities now
// const darkDealBosses = [
//   Species.SNORLAX,
//   Species.LAPRAS,
//   Species.ZAPDOS,
//   Species.ARTICUNO,
//   Species.MOLTRES,
//   Species.RAIKOU,
//   Species.ENTEI,
//   Species.SUICUNE,
//   Species.REGIROCK,
//   Species.REGICE,
//   Species.REGISTEEL,
//   Species.LATIAS,
//   Species.LATIOS,
//   Species.MESPRIT,
//   Species.AZELF,
//   Species.UXIE,
//   Species.ROTOM,
//   Species.COBALION,
//   Species.TERRAKION,
//   Species.VIRIZION,
//   Species.TORNADUS,
//   Species.THUNDURUS,
//   Species.LANDORUS,
//   Species.ETERNAL_FLOETTE,
//   Species.TAPU_BULU,
//   Species.TAPU_FINI,
//   Species.TAPU_KOKO,
//   Species.TAPU_LELE,
//   Species.TYPE_NULL,
//   Species.REGIELEKI,
//   Species.REGIDRAGO,
//   Species.GALAR_ZAPDOS,
//   Species.GALAR_ARTICUNO,
//   Species.GALAR_MOLTRES,
//   Species.OKIDOGI,
//   Species.MUNKIDORI,
//   Species.FEZANDIPITI,
//   Species.ENAMORUS,
//   Species.SCYTHER,
//   Species.BLOODMOON_URSALUNA,
//   Species.DURANT,
//   Species.WO_CHIEN,
//   Species.CHIEN_PAO,
//   Species.CHI_YU,
//   Species.TING_LU
// ];

// Exclude Ultra Beasts, Paradox, Necrozma, Eternatus, and egg-locked mythicals
const excludedBosses = [
  Species.NECROZMA,
  Species.ETERNATUS,
  Species.NIHILEGO,
  Species.BUZZWOLE,
  Species.PHEROMOSA,
  Species.XURKITREE,
  Species.CELESTEELA,
  Species.KARTANA,
  Species.GUZZLORD,
  Species.POIPOLE,
  Species.NAGANADEL,
  Species.STAKATAKA,
  Species.BLACEPHALON,
  Species.GREAT_TUSK,
  Species.SCREAM_TAIL,
  Species.BRUTE_BONNET,
  Species.FLUTTER_MANE,
  Species.SLITHER_WING,
  Species.SANDY_SHOCKS,
  Species.ROARING_MOON,
  Species.KORAIDON,
  Species.WALKING_WAKE,
  Species.GOUGING_FIRE,
  Species.RAGING_BOLT,
  Species.IRON_TREADS,
  Species.IRON_BUNDLE,
  Species.IRON_HANDS,
  Species.IRON_JUGULIS,
  Species.IRON_MOTH,
  Species.IRON_THORNS,
  Species.IRON_VALIANT,
  Species.MIRAIDON,
  Species.IRON_LEAVES,
  Species.IRON_BOULDER,
  Species.IRON_CROWN,
  Species.MEW,
  Species.CELEBI,
  Species.DEOXYS,
  Species.JIRACHI,
  Species.PHIONE,
  Species.MANAPHY,
  Species.ARCEUS,
  Species.VICTINI,
  Species.MELTAN,
  Species.PECHARUNT
];

export const DarkDealEncounter: MysteryEncounter = new MysteryEncounterBuilder()
  .withEncounterType(MysteryEncounterType.DARK_DEAL)
  .withEncounterTier(MysteryEncounterTier.ULTRA_RARE)
  .withIntroSpriteConfigs([
    {
      spriteKey: "mad_scientist_m",
      fileRoot: "mystery-encounters",
      hasShadow: true
    },
    {
      spriteKey: "dark_deal_porygon",
      fileRoot: "mystery-encounters",
      hasShadow: true,
      repeat: true
    }
  ])
  .withRequirement(new WaveCountRequirement([30, 180])) // waves 30 to 180
  .withRequirement(new PartySizeRequirement([2, 6])) // Must have at least 2 pokemon in party
  .withCatchAllowed(true)
  .withOption(new MysteryEncounterOptionBuilder()
    .withPreOptionPhase(async (scene: BattleScene) => {
      // Removes random pokemon (including fainted) from party and adds name to dialogue data tokens
      // Will never return last battle able mon and instead pick fainted/unable to battle
      const removedPokemon = getRandomPlayerPokemon(scene, false, true);
      scene.removePokemonFromPlayerParty(removedPokemon);
      scene.currentBattle.mysteryEncounter.dialogueTokens.push([/@ec\{pokeName\}/gi, removedPokemon.name]);

      // Store removed pokemon types
      scene.currentBattle.mysteryEncounter.misc = [removedPokemon.species.type1];
      if (removedPokemon.species.type2) {
        scene.currentBattle.mysteryEncounter.misc.push(removedPokemon.species.type2);
      }
    })
    .withOptionPhase(async (scene: BattleScene) => {
      // Give the player 5 Rogue Balls
      scene.unshiftPhase(new ModifierRewardPhase(scene, () => new AddPokeballModifierType("rb", PokeballType.ROGUE_BALL, 5)));

      // Start encounter with random legendary (7-10 starter strength) that has level additive
      const bossTypes = scene.currentBattle.mysteryEncounter.misc as Type[];
      // Starter egg tier, 35/50/10/5 %odds for tiers 6/7/8/9+
      const roll = randSeedInt(100);
      const starterTier: number | [number, number] = roll > 65 ? 6 : roll > 15 ? 7 : roll > 5 ? 8 : [9, 10];
      const bossSpecies = getPokemonSpecies(getRandomSpeciesByStarterTier(starterTier, excludedBosses, bossTypes));
      const pokemonConfig: EnemyPokemonConfig = {
        species: bossSpecies,
        isBoss: true
      };
      if (!isNullOrUndefined(bossSpecies.forms) && bossSpecies.forms.length > 0) {
        pokemonConfig.formIndex = 0;
      }
      const config: EnemyPartyConfig = {
        levelAdditiveMultiplier: 0.75,
        pokemonConfigs: [pokemonConfig]
      };
      return initBattleWithEnemyConfig(scene, config);
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      // Leave encounter with no rewards or exp
      leaveEncounterWithoutBattle(scene, true);
      return true;
    })
    .build())
  .build();
