import { globalScene } from "#app/global-scene";
import type { Gender } from "#data/gender";
import { CustomPokemonData, PokemonBattleData, PokemonSummonData } from "#data/pokemon-data";
import { Status } from "#data/status-effect";
import { BattleType } from "#enums/battle-type";
import type { BiomeId } from "#enums/biome-id";
import type { MoveId } from "#enums/move-id";
import { Nature } from "#enums/nature";
import { PokeballType } from "#enums/pokeball";
import type { PokemonType } from "#enums/pokemon-type";
import type { SpeciesId } from "#enums/species-id";
import { TrainerSlot } from "#enums/trainer-slot";
import { EnemyPokemon, Pokemon } from "#field/pokemon";
import { PokemonMove } from "#moves/pokemon-move";
import type { Variant } from "#sprites/variant";
import { getPokemonSpecies, getPokemonSpeciesForm } from "#utils/pokemon-utils";

export class PokemonData {
  public id: number;
  public player: boolean;
  public species: SpeciesId;
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
  public metBiome: BiomeId | -1; // -1 for starters
  public metSpecies: SpeciesId;
  public metWave: number; // 0 for unknown (previous saves), -1 for starters
  public luck: number;
  public pauseEvolutions: boolean;
  public pokerus: boolean;
  public usedTMs: MoveId[];
  public teraType: PokemonType;
  public isTerastallized: boolean;
  public stellarTypesBoosted: PokemonType[];

  public fusionSpecies: SpeciesId;
  public fusionFormIndex: number;
  public fusionAbilityIndex: number;
  public fusionShiny: boolean;
  public fusionVariant: Variant;
  public fusionGender: Gender;
  public fusionLuck: number;
  public fusionTeraType: PokemonType;

  public boss: boolean;
  public bossSegments: number;

  // Effects that need to be preserved between waves
  public summonData: PokemonSummonData;
  public battleData: PokemonBattleData;
  public summonDataSpeciesFormIndex: number;

  public customPokemonData: CustomPokemonData;
  public fusionCustomPokemonData: CustomPokemonData;

  // Deprecated attributes, needed for now to allow SessionData migration (see PR#4619 comments)
  // TODO: Remove these once pre-session migration is implemented
  public natureOverride: Nature | -1;
  public mysteryEncounterPokemonData: CustomPokemonData | null;
  public fusionMysteryEncounterPokemonData: CustomPokemonData | null;

  /**
   * Construct a new {@linkcode PokemonData} instance out of a {@linkcode Pokemon}
   * or JSON representation thereof.
   * @param source The {@linkcode Pokemon} to convert into data (or a JSON object representing one)
   */
  // TODO: Remove any from type signature in favor of 2 separate method funcs
  constructor(source: Pokemon | any) {
    const sourcePokemon = source instanceof Pokemon ? source : undefined;

    this.id = source.id;
    this.player = sourcePokemon?.isPlayer() ?? source.player;
    this.species = sourcePokemon?.species.speciesId ?? source.species;
    this.nickname = source.nickname;
    this.formIndex = Math.max(Math.min(source.formIndex, getPokemonSpecies(this.species).forms.length - 1), 0);
    this.abilityIndex = source.abilityIndex;
    this.passive = source.passive;
    this.shiny = source.shiny;
    this.variant = source.variant;
    this.pokeball = source.pokeball ?? PokeballType.POKEBALL;
    this.level = source.level;
    this.exp = source.exp;
    this.levelExp = source.levelExp;
    this.gender = source.gender;
    this.hp = source.hp;
    this.stats = source.stats;
    this.ivs = source.ivs;

    // TODO: Can't we move some of this verification stuff to an upgrade script?
    this.nature = source.nature ?? Nature.HARDY;
    this.moveset = source.moveset?.map((m: any) => PokemonMove.loadMove(m)) ?? [];
    this.status = source.status
      ? new Status(source.status.effect, source.status.toxicTurnCount, source.status.sleepTurnsRemaining)
      : null;
    this.friendship = source.friendship ?? getPokemonSpecies(this.species).baseFriendship;
    this.metLevel = source.metLevel || 5;
    this.metBiome = source.metBiome ?? -1;
    this.metSpecies = source.metSpecies;
    this.metWave = source.metWave ?? (this.metBiome === -1 ? -1 : 0);
    this.luck = source.luck ?? (source.shiny ? source.variant + 1 : 0);
    this.pauseEvolutions = !!source.pauseEvolutions;
    this.pokerus = !!source.pokerus;
    this.usedTMs = source.usedTMs ?? [];
    this.teraType = source.teraType as PokemonType;
    this.isTerastallized = !!source.isTerastallized;
    this.stellarTypesBoosted = source.stellarTypesBoosted ?? [];

    // Deprecated, but needed for session data migration
    this.natureOverride = source.natureOverride;
    this.mysteryEncounterPokemonData = source.mysteryEncounterPokemonData
      ? new CustomPokemonData(source.mysteryEncounterPokemonData)
      : null;
    this.fusionMysteryEncounterPokemonData = source.fusionMysteryEncounterPokemonData
      ? new CustomPokemonData(source.fusionMysteryEncounterPokemonData)
      : null;

    this.fusionSpecies = sourcePokemon?.fusionSpecies?.speciesId ?? source.fusionSpecies;
    this.fusionFormIndex = source.fusionFormIndex;
    this.fusionAbilityIndex = source.fusionAbilityIndex;
    this.fusionShiny = source.fusionShiny;
    this.fusionVariant = source.fusionVariant;
    this.fusionGender = source.fusionGender;
    this.fusionLuck = source.fusionLuck ?? (source.fusionShiny ? source.fusionVariant + 1 : 0);
    this.fusionTeraType = (source.fusionTeraType ?? 0) as PokemonType;

    this.boss = (source instanceof EnemyPokemon && !!source.bossSegments) || (!this.player && !!source.boss);
    this.bossSegments = source.bossSegments ?? 0;

    this.summonData = new PokemonSummonData(source.summonData);
    this.battleData = new PokemonBattleData(source.battleData);
    this.summonDataSpeciesFormIndex =
      sourcePokemon?.summonData.speciesForm?.formIndex ?? source.summonDataSpeciesFormIndex;

    this.customPokemonData = new CustomPokemonData(source.customPokemonData);
    this.fusionCustomPokemonData = new CustomPokemonData(source.fusionCustomPokemonData);
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

    // when loading from saved session, recover summonData.speciesFrom and form index species object
    // used to stay transformed on reload session
    if (this.summonData.speciesForm) {
      ret.summonData.speciesForm = getPokemonSpeciesForm(
        this.summonData.speciesForm.speciesId,
        this.summonDataSpeciesFormIndex,
      );
    }
    return ret;
  }
}
