import { BattleType } from "../battle";
import BattleScene from "../battle-scene";
import { Biome } from "../data/enums/biome";
import { Gender } from "../data/gender";
import { Nature } from "../data/nature";
import { PokeballType } from "../data/pokeball";
import { getPokemonSpecies } from "../data/pokemon-species";
import { Species } from "../data/enums/species";
import { Status } from "../data/status-effect";
import Pokemon, { EnemyPokemon, PlayerPokemon, PokemonMove, PokemonSummonData } from "../pokemon";

export default class PokemonData {
  public id: integer;
  public player: boolean;
  public species: Species;
  public formIndex: integer;
  public abilityIndex: integer;
  public shiny: boolean;
  public pokeball: PokeballType;
  public level: integer;
  public exp: integer;
  public levelExp: integer;
  public gender: Gender;
  public hp: integer;
  public stats: integer[];
  public ivs: integer[];
  public nature: Nature;
  public moveset: PokemonMove[];
  public status: Status;
  public friendship: integer;
  public metLevel: integer;
  public metBiome: Biome | -1;
  public pauseEvolutions: boolean;
  public pokerus: boolean;

  public fusionSpecies: Species;
  public fusionFormIndex: integer;
  public fusionAbilityIndex: integer;
  public fusionShiny: boolean;
  public fusionGender: Gender;

  public boss: boolean;

  public summonData: PokemonSummonData;

  constructor(source: Pokemon | any, forHistory: boolean = false) {
    const sourcePokemon = source instanceof Pokemon ? source as Pokemon : null;
    this.id = source.id;
    this.player = sourcePokemon ? sourcePokemon.isPlayer() : source.player;
    this.species = sourcePokemon ? sourcePokemon.species.speciesId : source.species;
    this.formIndex = source.formIndex;
    this.abilityIndex = source.abilityIndex;
    this.shiny = source.shiny;
    this.pokeball = source.pokeball;
    this.level = source.level;
    this.exp = source.exp;
    if (!forHistory)
      this.levelExp = source.levelExp;
    this.gender = source.gender;
    if (!forHistory)
      this.hp = source.hp;
    this.stats = source.stats;
    this.ivs = source.ivs;
    this.nature = source.nature !== undefined ? source.nature : 0 as Nature;
    this.friendship = source.friendship !== undefined ? source.friendship : getPokemonSpecies(this.species).baseFriendship;
    this.metLevel = source.metLevel || 5;
    this.metBiome = source.metBiome !== undefined ? source.metBiome : -1;
    if (!forHistory)
      this.pauseEvolutions = !!source.pauseEvolutions;
    this.pokerus = !!source.pokerus;

    this.fusionSpecies = sourcePokemon ? sourcePokemon.fusionSpecies?.speciesId : source.fusionSpecies;
    this.fusionFormIndex = source.fusionFormIndex;
    this.fusionAbilityIndex = source.fusionAbilityIndex;
    this.fusionShiny = source.fusionShiny;
    this.fusionGender = source.fusionGender;

    if (!forHistory)
      this.boss = (source instanceof EnemyPokemon && !!source.bossSegments) || (!this.player && !!source.boss);

    if (sourcePokemon) {
      this.moveset = sourcePokemon.moveset;
      if (!forHistory) {
        this.status = sourcePokemon.status;
        if (this.player)
          this.summonData = sourcePokemon.summonData;
      }
    } else {
      this.moveset = source.moveset.map((m: any) => new PokemonMove(m.moveId, m.ppUsed, m.ppUp));
      if (!forHistory) {
        this.status = source.status
          ? new Status(source.status.effect, source.status.turnCount, source.status.cureTurn)
          : undefined;
      }

      this.summonData = new PokemonSummonData();
      if (!forHistory && source.summonData) {
        this.summonData.battleStats = source.summonData.battleStats;
        this.summonData.moveQueue = source.summonData.moveQueue;
        this.summonData.tags = []; // TODO
        this.summonData.moveset = source.summonData.moveset;
        this.summonData.types = source.summonData.types;
      }
    }
  }

  toPokemon(scene: BattleScene, battleType?: BattleType): Pokemon {
    const species = getPokemonSpecies(this.species);
    if (this.player)
      return scene.addPlayerPokemon(species, this.level, this.abilityIndex, this.formIndex, this.gender, this.shiny, this.ivs, this.nature, this);
    return scene.addEnemyPokemon(species, this.level, battleType === BattleType.TRAINER, this.boss, this);
  }
}