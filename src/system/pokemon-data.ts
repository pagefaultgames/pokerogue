import { BattleType } from "#enums/battle-type";
import { globalScene } from "#app/global-scene";
import type { Gender } from "../data/gender";
import { Nature } from "#enums/nature";
import type { PokeballType } from "#enums/pokeball";
import { getPokemonSpecies, getPokemonSpeciesForm } from "../data/pokemon-species";
import { Status } from "../data/status-effect";
import Pokemon, {
  EnemyPokemon,
  type PokemonMove,
  type PokemonSummonData,
  type PokemonBattleData,
} from "../field/pokemon";
import { TrainerSlot } from "#enums/trainer-slot";
import type { Variant } from "#app/sprites/variant";
import type { Biome } from "#enums/biome";
import type { Moves } from "#enums/moves";
import type { Species } from "#enums/species";
import { CustomPokemonData } from "#app/data/custom-pokemon-data";
import type { PokemonType } from "#enums/pokemon-type";

export default class PokemonData {
  public id: number;
  public player: boolean;
  public species: Species;
  public nickname: string;
  public formIndex: number;
  public abilityIndex: number;
  public passive: boolean;
  public shiny: boolean;
  public variant: Variant;
  public pokeball: PokeballType;
  public level: number;
  public exp: number;
  public levelExp: number;
  public gender: Gender;
  public hp: number;
  public stats: number[];
  public ivs: number[];
  public nature: Nature;
  public moveset: PokemonMove[];
  public status: Status | null;
  public friendship: number;
  public metLevel: number;
  public metBiome: Biome | -1; // -1 for starters
  public metSpecies: Species;
  public metWave: number; // 0 for unknown (previous saves), -1 for starters
  public luck: number;
  public pauseEvolutions: boolean;
  public pokerus: boolean;
  public usedTMs: Moves[];
  public evoCounter: number;
  public teraType: PokemonType;
  public isTerastallized: boolean;
  public stellarTypesBoosted: PokemonType[];

  public fusionSpecies: Species;
  public fusionFormIndex: number;
  public fusionAbilityIndex: number;
  public fusionShiny: boolean;
  public fusionVariant: Variant;
  public fusionGender: Gender;
  public fusionLuck: number;
  public fusionTeraType: PokemonType;

  public boss: boolean;
  public bossSegments?: number;

  // Effects that need to be preserved between waves
  public summonData: PokemonSummonData;
  public battleData: PokemonBattleData;
  public summonDataSpeciesFormIndex: number;

  public customPokemonData: CustomPokemonData;
  public fusionCustomPokemonData: CustomPokemonData;

  // Deprecated attributes, needed for now to allow SessionData migration (see PR#4619 comments).
  // TODO: These can probably be safely deleted (what with the upgrade scripts and all)
  public natureOverride: Nature | -1;
  public mysteryEncounterPokemonData: CustomPokemonData | null;
  public fusionMysteryEncounterPokemonData: CustomPokemonData | null;

  /**
   * Construct a new {@linkcode PokemonData} instance out of a {@linkcode Pokemon}
   * or JSON representation thereof.
   * @param source The {@linkcode Pokemon} to convert into data (or a JSON object representing one)
   */
  constructor(source: Pokemon | any) {
    const sourcePokemon = source instanceof Pokemon ? source : undefined;
    this.id = source.id;
    this.player = sourcePokemon ? sourcePokemon.isPlayer() : source.player;
    this.species = sourcePokemon ? sourcePokemon.species.speciesId : source.species;
    this.nickname =
      sourcePokemon?.summonData.illusion?.basePokemon.nickname ?? sourcePokemon?.nickname ?? source.nickname;
    this.formIndex = Math.max(Math.min(source.formIndex, getPokemonSpecies(this.species).forms.length - 1), 0);
    this.abilityIndex = source.abilityIndex;
    this.passive = source.passive;
    this.shiny = sourcePokemon?.isShiny() ?? source.shiny;
    this.variant = sourcePokemon?.getVariant() ?? source.variant;
    this.pokeball = source.pokeball;
    this.level = source.level;
    this.exp = source.exp;
    this.gender = source.gender;
    this.stats = source.stats;
    this.ivs = source.ivs;
    this.nature = source.nature ?? Nature.HARDY;
    this.friendship = source.friendship ?? getPokemonSpecies(this.species).baseFriendship;
    this.metLevel = source.metLevel || 5;
    this.metBiome = source.metBiome ?? -1;
    this.metSpecies = source.metSpecies;
    this.metWave = source.metWave ?? (this.metBiome === -1 ? -1 : 0);
    this.luck = source.luck ?? (source.shiny ? source.variant + 1 : 0);
    this.pokerus = !!source.pokerus;
    this.teraType = source.teraType as PokemonType;
    this.isTerastallized = !!source.isTerastallized;
    this.stellarTypesBoosted = source.stellarTypesBoosted ?? [];

    this.fusionSpecies = sourcePokemon ? sourcePokemon.fusionSpecies?.speciesId : source.fusionSpecies;
    this.fusionFormIndex = source.fusionFormIndex;
    this.fusionAbilityIndex = source.fusionAbilityIndex;
    this.fusionShiny =
      sourcePokemon?.summonData.illusion?.basePokemon.fusionShiny ?? sourcePokemon?.fusionShiny ?? source.fusionShiny;
    this.fusionVariant =
      sourcePokemon?.summonData.illusion?.basePokemon.fusionVariant ??
      sourcePokemon?.fusionVariant ??
      source.fusionVariant;
    this.fusionGender = source.fusionGender;
    this.fusionLuck = source.fusionLuck ?? (source.fusionShiny ? source.fusionVariant + 1 : 0);
    this.fusionCustomPokemonData = new CustomPokemonData(source.fusionCustomPokemonData);
    this.fusionTeraType = (source.fusionTeraType ?? 0) as PokemonType;
    this.usedTMs = source.usedTMs ?? [];

    this.customPokemonData = new CustomPokemonData(source.customPokemonData);

    this.moveset = sourcePokemon?.moveset ?? source.moveset;

    this.levelExp = source.levelExp;
    this.hp = source.hp;

    this.pauseEvolutions = !!source.pauseEvolutions;
    this.evoCounter = source.evoCounter ?? 0;

    this.boss = (source instanceof EnemyPokemon && !!source.bossSegments) || (!this.player && !!source.boss);
    this.bossSegments = source.bossSegments;
    this.status =
      sourcePokemon?.status ??
      (source.status
        ? new Status(source.status.effect, source.status.toxicTurnCount, source.status.sleepTurnsRemaining)
        : null);

    this.summonData = source.summonData;

    this.summonDataSpeciesFormIndex = sourcePokemon
      ? this.getSummonDataSpeciesFormIndex()
      : source.summonDataSpeciesFormIndex;
    this.battleData = sourcePokemon?.battleData ?? source.battleData;
  }

  toPokemon(battleType?: BattleType, partyMemberIndex = 0, double = false): Pokemon {
    const species = getPokemonSpecies(this.species);
    const ret: Pokemon = this.player
      ? globalScene.addPlayerPokemon(
          species,
          this.level,
          this.abilityIndex,
          this.formIndex,
          this.gender,
          this.shiny,
          this.variant,
          this.ivs,
          this.nature,
          this,
          playerPokemon => {
            if (this.nickname) {
              playerPokemon.nickname = this.nickname;
            }
          },
        )
      : globalScene.addEnemyPokemon(
          species,
          this.level,
          battleType === BattleType.TRAINER
            ? !double || !(partyMemberIndex % 2)
              ? TrainerSlot.TRAINER
              : TrainerSlot.TRAINER_PARTNER
            : TrainerSlot.NONE,
          this.boss,
          false,
          this,
        );
    if (this.summonData) {
      // when loading from saved session, recover summonData.speciesFrom and form index species object
      // used to stay transformed on reload session

      if (this.summonData.speciesForm) {
        this.summonData.speciesForm = getPokemonSpeciesForm(
          this.summonData.speciesForm.speciesId,
          this.summonDataSpeciesFormIndex,
        );
      }
      ret.primeSummonData(this.summonData);
    }
    return ret;
  }

  /**
   * Method to save summon data species form index
   * Necessary in case the pokemon is transformed
   * to reload the correct form
   */
  getSummonDataSpeciesFormIndex(): number {
    if (this.summonData.speciesForm) {
      return this.summonData.speciesForm.formIndex;
    }
    return 0;
  }
}
