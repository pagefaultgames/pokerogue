import BattleScene from "./battle-scene";
import { pokemonPrevolutions } from "./data/pokemon-evolutions";
import PokemonSpecies, { getPokemonSpecies } from "./data/pokemon-species";
import { TrainerConfig, TrainerPartyCompoundTemplate, TrainerPartyMemberStrength, TrainerPartyTemplate, TrainerPoolTier, trainerConfigs, trainerPartyTemplates } from "./data/trainer-config";
import { TrainerType } from "./data/enums/trainer-type";
import { EnemyPokemon } from "./pokemon";
import * as Utils from "./utils";

export default class Trainer extends Phaser.GameObjects.Container {
  public config: TrainerConfig;
  public female: boolean;
  public partyTemplateIndex: integer;

  constructor(scene: BattleScene, trainerType: TrainerType, female?: boolean, partyTemplateIndex?: integer) {
    super(scene, -72, 80);
    this.config = trainerConfigs.hasOwnProperty(trainerType)
      ? trainerConfigs[trainerType]
      : trainerConfigs[TrainerType.ACE_TRAINER];
    this.female = female;
    this.partyTemplateIndex = Math.min(partyTemplateIndex !== undefined ? partyTemplateIndex : Phaser.Math.RND.weightedPick(this.config.partyTemplates.map((_, i) => i)), 
      this.config.partyTemplates.length - 1);
      
    // TODO: Remove when Phaser weightedPick bug is fixed
    if (isNaN(this.partyTemplateIndex))
      this.partyTemplateIndex = this.config.partyTemplates.length - 1;

    console.log(Object.keys(trainerPartyTemplates)[Object.values(trainerPartyTemplates).indexOf(this.getPartyTemplate())]);

    const getSprite = (hasShadow?: boolean) => {
      const ret = this.scene.addFieldSprite(0, 0, this.getKey());
      ret.setOrigin(0.5, 1);
      ret.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], hasShadow: !!hasShadow });
      return ret;
    };
    
    const sprite = getSprite(true);
    const tintSprite = getSprite();

    tintSprite.setVisible(false);

    this.add(sprite);
    this.add(tintSprite);
  }

  getKey(): string {
    return this.config.getKey(this.female);
  }

  getName(): string {
    return this.config.getName(this.female);
  }

  getBattleBgm(): string {
    return this.config.battleBgm;
  }

  getEncounterBgm(): string {
    return !this.female ? this.config.encounterBgm : this.config.femaleEncounterBgm || this.config.encounterBgm;
  }

  getPartyTemplate(): TrainerPartyTemplate {
    if (this.config.partyTemplateFunc)
      return this.config.partyTemplateFunc(this.scene);
    return this.config.partyTemplates[this.partyTemplateIndex];
  }

  getPartyLevels(waveIndex: integer): integer[] {
    const ret = [];
    const partyTemplate = this.getPartyTemplate();
    
    let baseLevel = 1 + waveIndex / 2 + Math.pow(waveIndex / 25, 2);

    for (let i = 0; i < partyTemplate.size; i++) {
      let multiplier = 1;
      
      const strength = partyTemplate.getStrength(i)
      
      switch (strength) {
        case TrainerPartyMemberStrength.WEAKEST:
          multiplier = 0.85;
          break;
        case TrainerPartyMemberStrength.WEAKER:
          multiplier = 0.95;
          break;
        case TrainerPartyMemberStrength.WEAK:
          multiplier = 1.0;
          break;
        case TrainerPartyMemberStrength.AVERAGE:
          multiplier = 1.1;
          break;
        case TrainerPartyMemberStrength.STRONG:
          multiplier = 1.2;
          break;
        case TrainerPartyMemberStrength.STRONGER:
          multiplier = 1.25;
          break;
      }

      let level = Math.ceil(baseLevel * multiplier);
      if (strength < TrainerPartyMemberStrength.STRONG) {
        const minLevel = Math.ceil(baseLevel * 1.2) - Math.floor(waveIndex / 25);
        if (level < minLevel)
          level = minLevel;
      }

      ret.push(level);
    }

    return ret;
  }

  genPartyMember(index: integer): EnemyPokemon {
    const battle = this.scene.currentBattle;
    const level = battle.enemyLevels[index];
    
    let ret: EnemyPokemon;

    this.scene.executeWithSeedOffset(() => {
      const template = this.getPartyTemplate();

      if (this.config.partyMemberFuncs.hasOwnProperty(index)) {
        ret = this.config.partyMemberFuncs[index](this.scene, level);
        return;
      }
      if (this.config.partyMemberFuncs.hasOwnProperty(index - template.size)) {
        ret = this.config.partyMemberFuncs[index - template.size](this.scene, level);
        return;
      }

      let offset = 0;

      if (template instanceof TrainerPartyCompoundTemplate) {
        for (let innerTemplate of template.templates) {
          if (offset + innerTemplate.size > index)
            break;
          offset += innerTemplate.size;
        }
      }

      const species = template.isSameSpecies(index) && index > offset
        ? getPokemonSpecies(battle.enemyParty[offset].species.getSpeciesForLevel(level, false, true, this.config.isBoss))
        : this.genNewPartyMemberSpecies(level);
      
      ret = this.scene.addEnemyPokemon(species, level, true);
    }, this.config.hasStaticParty ? this.config.getDerivedType() + ((index + 1) << 8) : this.scene.currentBattle.waveIndex + (this.config.getDerivedType() << 10) + (((!this.config.useSameSeedForAllMembers ? index : 0) + 1) << 8));

    return ret;
  }

  genNewPartyMemberSpecies(level: integer, attempt?: integer): PokemonSpecies {
    const battle = this.scene.currentBattle;
    const template = this.getPartyTemplate();

    let species: PokemonSpecies;
    if (this.config.speciesPools) {
      const tierValue = Utils.randSeedInt(512);
      let tier = tierValue >= 156 ? TrainerPoolTier.COMMON : tierValue >= 32 ? TrainerPoolTier.UNCOMMON : tierValue >= 6 ? TrainerPoolTier.RARE : tierValue >= 1 ? TrainerPoolTier.SUPER_RARE : TrainerPoolTier.ULTRA_RARE
      console.log(TrainerPoolTier[tier]);
      while (!this.config.speciesPools.hasOwnProperty(tier) || !this.config.speciesPools[tier].length) {
        console.log(`Downgraded trainer Pokemon rarity tier from ${TrainerPoolTier[tier]} to ${TrainerPoolTier[tier - 1]}`);
        tier--;
      }
      const tierPool = this.config.speciesPools[tier];
      species = getPokemonSpecies(Phaser.Math.RND.pick(tierPool));
    } else
      species = this.scene.randomSpecies(battle.waveIndex, level, false, this.config.speciesFilter);

    let ret = getPokemonSpecies(species.getSpeciesForLevel(level, true, true, this.config.isBoss));
    let retry = false;

    console.log(ret.getName());

    if (pokemonPrevolutions.hasOwnProperty(species.speciesId) && ret.speciesId !== species.speciesId)
      retry = true;
    else if (template.isBalanced(battle.enemyParty.length)) {
      const partyMemberTypes = battle.enemyParty.map(p => p.getTypes()).flat();
      if (partyMemberTypes.indexOf(ret.type1) > -1 || (ret.type2 !== null && partyMemberTypes.indexOf(ret.type2) > -1))
        retry = true;
    }

    if (!retry && this.config.specialtyTypes.length && !this.config.specialtyTypes.find(t => ret.isOfType(t))) {
      retry = true;
      console.log('Attempting reroll of species evolution to fit specialty type...');
      let evoAttempt = 0;
      while (retry && evoAttempt++ < 10) {
        ret = getPokemonSpecies(species.getSpeciesForLevel(level, true, true, this.config.isBoss));
        console.log(ret.name);
        if (this.config.specialtyTypes.find(t => ret.isOfType(t)))
          retry = false;
      }
    }

    if (retry && (attempt || 0) < 10) {
      console.log('Rerolling party member...')
      ret = this.genNewPartyMemberSpecies(level, (attempt || 0) + 1);
    }

    return ret;
  }

  getNextSummonIndex(): integer {
    const party = this.scene.getEnemyParty();
    const nonFaintedPartyMembers = party.slice(this.scene.currentBattle.getBattlerCount()).filter(p => !p.isFainted());
    const partyMemberScores = nonFaintedPartyMembers.map(p => {
      const playerField = this.scene.getPlayerField();
      let score = 0;
      for (let playerPokemon of playerField) {
        score += p.getMatchupScore(playerPokemon);
        if (playerPokemon.species.legendary)
          score /= 2;
      }
      score /= playerField.length;
      return [ party.indexOf(p), score ];
    });

    const sortedPartyMemberScores = partyMemberScores.slice(0);
    sortedPartyMemberScores.sort((a, b) => {
      const scoreA = a[1];
      const scoreB = b[1];
      return scoreA < scoreB ? 1 : scoreA > scoreB ? -1 : 0;
    });

    const maxScorePartyMemberIndexes = partyMemberScores.filter(pms => pms[1] === sortedPartyMemberScores[0][1]).map(pms => pms[0]);
    return maxScorePartyMemberIndexes[Utils.randSeedInt(maxScorePartyMemberIndexes.length)];
  }
  
  getPartyMemberModifierChanceMultiplier(index: integer): number {
    switch (this.getPartyTemplate().getStrength(index)) {
      case TrainerPartyMemberStrength.WEAKER:
        return 0.75;
      case TrainerPartyMemberStrength.WEAK:
        return 0.675;
      case TrainerPartyMemberStrength.AVERAGE:
        return 0.5625;
      case TrainerPartyMemberStrength.STRONG:
        return 0.45;
      case TrainerPartyMemberStrength.STRONGER:
        return 0.375;
    }
  }

  loadAssets(): Promise<void> {
    return this.config.loadAssets(this.scene, this.female);
  }

  initSprite(): void {
    this.getSprite().setTexture(this.getKey()).setFrame(0);
    this.getTintSprite().setTexture(this.getKey()).setFrame(0);
  }

  playAnim(): void {
    const trainerAnimConfig = {
      key: this.getKey(),
      repeat: 0,
      startFrame: 0
    };
    this.getSprite().play(trainerAnimConfig);
    this.getTintSprite().play(trainerAnimConfig);
  }

  getSprite(): Phaser.GameObjects.Sprite {
    return this.getAt(0) as Phaser.GameObjects.Sprite;
  }

  getTintSprite(): Phaser.GameObjects.Sprite {
    return this.getAt(1) as Phaser.GameObjects.Sprite;
  }

  tint(color: number, alpha?: number, duration?: integer, ease?: string): void {
    const tintSprite = this.getTintSprite();
    tintSprite.setTintFill(color);
    tintSprite.setVisible(true);

    if (duration) {
      tintSprite.setAlpha(0);

      this.scene.tweens.add({
        targets: tintSprite,
        alpha: alpha || 1,
        duration: duration,
        ease: ease || 'Linear'
      });
    } else
      tintSprite.setAlpha(alpha);
  }

  untint(duration: integer, ease?: string): void {
    const tintSprite = this.getTintSprite();

    if (duration) {
      this.scene.tweens.add({
        targets: tintSprite,
        alpha: 0,
        duration: duration,
        ease: ease || 'Linear',
        onComplete: () => {
          tintSprite.setVisible(false);
          tintSprite.setAlpha(1);
        }
      });
    } else {
      tintSprite.setVisible(false);
      tintSprite.setAlpha(1);
    }
  }
}

export default interface Trainer {
  scene: BattleScene
}