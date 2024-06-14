import { BattleType } from "../battle";
import BattleScene from "../battle-scene";
import { Gender } from "../data/gender";
import { Nature } from "../data/nature";
import { PokeballType } from "../data/pokeball";
import { getPokemonSpecies } from "../data/pokemon-species";
import { Status } from "../data/status-effect";
import Pokemon, { EnemyPokemon, PokemonMove, PokemonSummonData } from "../field/pokemon";
import { TrainerSlot } from "../data/trainer-config";
import { Variant } from "#app/data/variant";
import { loadBattlerTag } from "../data/battler-tags";
import { Biome } from "#enums/biome";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";

export default class PokemonData {
  public id: integer;
  public player: boolean;
  public species: Species;
  public formIndex: integer;
  public abilityIndex: integer;
  public passive: boolean;
  public shiny: boolean;
  public variant: Variant;
  public pokeball: PokeballType;
  public level: integer;
  public exp: integer;
  public levelExp: integer;
  public gender: Gender;
  public hp: integer;
  public stats: integer[];
  public ivs: integer[];
  public nature: Nature;
  public natureOverride: Nature | -1;
  public moveset: PokemonMove[];
  public status: Status;
  public friendship: integer;
  public metLevel: integer;
  public metBiome: Biome | -1;
  public luck: integer;
  public pauseEvolutions: boolean;
  public pokerus: boolean;

  public fusionSpecies: Species;
  public fusionFormIndex: integer;
  public fusionAbilityIndex: integer;
  public fusionShiny: boolean;
  public fusionVariant: Variant;
  public fusionGender: Gender;
  public fusionLuck: integer;

  public boss: boolean;

  public summonData: PokemonSummonData;

  constructor(source: Pokemon | any, forHistory: boolean = false) {
    const sourcePokemon = source instanceof Pokemon ? source : null;
    this.id = source.id;
    this.player = sourcePokemon ? sourcePokemon.isPlayer() : source.player;
    this.species = sourcePokemon ? sourcePokemon.species.speciesId : source.species;
    this.formIndex = Math.max(Math.min(source.formIndex, getPokemonSpecies(this.species).forms.length - 1), 0);
    this.abilityIndex = source.abilityIndex;
    this.passive = source.passive;
    this.shiny = source.shiny;
    this.variant = source.variant;
    this.pokeball = source.pokeball;
    this.level = source.level;
    this.exp = source.exp;
    if (!forHistory) {
      this.levelExp = source.levelExp;
    }
    this.gender = source.gender;
    if (!forHistory) {
      this.hp = source.hp;
    }
    this.stats = source.stats;
    this.ivs = source.ivs;
    this.nature = source.nature !== undefined ? source.nature : 0 as Nature;
    this.natureOverride = source.natureOverride !== undefined ? source.natureOverride : -1;
    this.friendship = source.friendship !== undefined ? source.friendship : getPokemonSpecies(this.species).baseFriendship;
    this.metLevel = source.metLevel || 5;
    this.metBiome = source.metBiome !== undefined ? source.metBiome : -1;
    this.luck = source.luck !== undefined ? source.luck : (source.shiny ? (source.variant + 1) : 0);
    if (!forHistory) {
      this.pauseEvolutions = !!source.pauseEvolutions;
    }
    this.pokerus = !!source.pokerus;

    this.fusionSpecies = sourcePokemon ? sourcePokemon.fusionSpecies?.speciesId : source.fusionSpecies;
    this.fusionFormIndex = source.fusionFormIndex;
    this.fusionAbilityIndex = source.fusionAbilityIndex;
    this.fusionShiny = source.fusionShiny;
    this.fusionVariant = source.fusionVariant;
    this.fusionGender = source.fusionGender;
    this.fusionLuck = source.fusionLuck !== undefined ? source.fusionLuck : (source.fusionShiny ? source.fusionVariant + 1 : 0);

    if (!forHistory) {
      this.boss = (source instanceof EnemyPokemon && !!source.bossSegments) || (!this.player && !!source.boss);
    }

    if (sourcePokemon) {
      this.moveset = sourcePokemon.moveset;
      if (!forHistory) {
        this.status = sourcePokemon.status;
        if (this.player) {
          this.summonData = sourcePokemon.summonData;
        }
      }
    } else {
      this.moveset = (source.moveset || [ new PokemonMove(Moves.TACKLE), new PokemonMove(Moves.GROWL) ]).filter(m => m).map((m: any) => new PokemonMove(m.moveId, m.ppUsed, m.ppUp));
      if (!forHistory) {
        this.status = source.status
          ? new Status(source.status.effect, source.status.turnCount, source.status.cureTurn)
          : undefined;
      }

      this.summonData = new PokemonSummonData();
      if (!forHistory && source.summonData) {
        this.summonData.battleStats = source.summonData.battleStats;
        this.summonData.moveQueue = source.summonData.moveQueue;
        this.summonData.disabledMove = source.summonData.disabledMove;
        this.summonData.disabledTurns = source.summonData.disabledTurns;
        this.summonData.abilitySuppressed = source.summonData.abilitySuppressed;
        this.summonData.abilitiesApplied = source.summonData.abilitiesApplied;

        this.summonData.ability = source.summonData.ability;
        this.summonData.moveset = source.summonData.moveset?.map(m => PokemonMove.loadMove(m));
        this.summonData.types = source.summonData.types;

        if (source.summonData.tags) {
          this.summonData.tags = source.summonData.tags?.map(t => loadBattlerTag(t));
        } else {
          this.summonData.tags = [];
        }
      }
    }
  }

  toPokemon(scene: BattleScene, battleType?: BattleType, partyMemberIndex: integer = 0, double: boolean = false): Pokemon {
    const species = getPokemonSpecies(this.species);
    const ret: Pokemon = this.player
      ? scene.addPlayerPokemon(species, this.level, this.abilityIndex, this.formIndex, this.gender, this.shiny, this.variant, this.ivs, this.nature, this)
      : scene.addEnemyPokemon(species, this.level, battleType === BattleType.TRAINER ? !double || !(partyMemberIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER : TrainerSlot.NONE, this.boss, this);
    if (this.summonData) {
      ret.primeSummonData(this.summonData);
    }
    return ret;
  }
}
