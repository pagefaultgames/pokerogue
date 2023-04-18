import BattleScene from "./battle-scene";
import { Gender } from "./gender";
import PokemonSpecies, { allSpecies } from "./pokemon-species";
import { Species } from "./species";
import * as Utils from "./utils";

export interface DexData {
  [key: integer]: DexData | DexEntry
}

export interface DexEntry {
  seen: boolean;
  caught: boolean;
}

export interface StarterDexEntry {
  shiny: boolean;
  formIndex: integer;
  female: boolean;
  entry: DexEntry;
}

export interface StarterDexUnlockTree {
  shiny: boolean | Map<boolean, StarterDexUnlockTree>
  formIndex: integer | Map<integer, StarterDexUnlockTree>
  female: boolean | Map<boolean, StarterDexUnlockTree>
  key: string,
  entry: DexEntry
}

export class SaveData {
  private scene: BattleScene;

  public trainerId: integer;
  public secretId: integer;
  
  public dexData: DexData;

  constructor(scene: BattleScene) {
    this.scene = scene;
    this.trainerId = Utils.randInt(65536);
    this.secretId = Utils.randInt(65536)
    this.initDexData();
  }

  save() {

  }

  load() {

  }

  initDexData() {
    const data: DexData = {};

    const initDexSubData = (dexData: DexData, count: integer): DexData[] => {
      const ret: DexData[] = [];
      for (let i = 0; i < count; i++) {
        const newData: DexData = {};
        dexData[i] = newData;
        ret.push(newData);
      }

      return ret;
    };

    const initDexEntries = (dexData: DexData, count: integer): DexEntry[] => {
      const ret: DexEntry[] = [];
      for (let i = 0; i < count; i++) {
        const entry: DexEntry = { seen: true, caught: true };
        dexData[i] = entry;
        ret.push(entry);
      }

      return ret;
    };

    for (let species of allSpecies) {
      data[species.speciesId] = {};
      if (species.forms?.length)
        initDexSubData(data[species.speciesId] as DexData, 2).map(sd => species.malePercent !== null ? initDexSubData(sd, species.forms.length).map(fd =>  initDexEntries(fd, 2)) : initDexEntries(sd, species.forms.length));
      else if (species.malePercent !== null)
        initDexSubData(data[species.speciesId] as DexData, 2).map(sd => initDexEntries(sd, 2));
      else
        initDexEntries(data[species.speciesId] as DexData, 2)
    }

    const defaultStarters: Species[] = [
      Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE,
      Species.CHIKORITA, Species.CYNDAQUIL, Species.TOTODILE,
      Species.TREECKO, Species.TORCHIC, Species.MUDKIP,
      Species.TURTWIG, Species.CHIMCHAR, Species.PIPLUP,
      Species.SNIVY, Species.TEPIG, Species.OSHAWOTT
    ];

    for (let ds of defaultStarters) {
      let entry = data[ds][0][Gender.MALE] as DexEntry;
      entry.seen = true;
      entry.caught = true;

      entry = data[ds][0][Gender.FEMALE] as DexEntry;
      entry.seen = true;
      entry.caught = true;

      entry = data[ds][1][Gender.FEMALE] as DexEntry;
      entry.seen = true;
      entry.caught = true;
    }

    this.dexData = data;
  }

  getDexEntry(species: PokemonSpecies, shiny: boolean, formIndex: integer, female: boolean) : DexEntry {
    const shinyIndex = !shiny ? 0 : 1;
    const genderIndex = !female ? 0 : 1;
    const data = this.dexData[species.speciesId];
    if (species.forms?.length) {
      if (species.malePercent !== null)
        return data[shinyIndex][formIndex][genderIndex];
      return data[shinyIndex][formIndex];
    } else if (species.malePercent !== null)
      return data[shinyIndex][genderIndex];
    return data[shinyIndex] as DexEntry;
  }

  getDefaultStarterDexEntry(species: PokemonSpecies, forceShiny?: boolean, forceFormIndex?: integer, forceFemale?: boolean): StarterDexEntry {
    const hasForms = !!species.forms?.length;
    let shiny = false;
    let formIndex = 0;
    let female = false;
    let entry = null;

    const traverseData = (data: DexData, level: integer) => {
      const keys = Object.keys(data);
      keys.forEach((key: string, k: integer) => {
        if (entry)
          return;

        switch (level) {
          case 0:
            shiny = !!k;
            if (forceShiny !== undefined && shiny !== forceShiny)
              return;
            break;
          case 1:
            formIndex = k;
            if (forceFormIndex !== undefined && formIndex !== forceFormIndex)
              return;
            break;
          case 2:
            female = !!k;
            if (forceFemale !== undefined && female !== forceFemale)
              return
            break;
        }

        if ('caught' in data[key]) {
          if (data[key].caught)
            entry = data[key] as DexEntry;
        } else
          traverseData(data[key] as DexData, level + (hasForms ? 1 : 2));
      });
    };

    traverseData(this.dexData[species.speciesId] as DexData, 0);

    if (entry) {
      return { 
        shiny: shiny,
        formIndex: formIndex,
        female: female,
        entry: entry
      };
    }

    return null;
  }

  getStarterDexUnlockTree(species: PokemonSpecies): StarterDexUnlockTree {
    const hasForms = !!species.forms?.length;
    const hasGender = species.malePercent !== null;

    const getTreeOrValueMap = (key: string, parent?: StarterDexUnlockTree): (Map<any, any>) => {
      switch (key) {
        case 'shiny':
          const shinyMap = new Map<boolean, StarterDexUnlockTree>();
          for (let s = 0; s < 2; s++) {
            const props = { shiny: !!s, formIndex: null };
            shinyMap.set(!!s, {
              shiny: !!s,
              formIndex: hasForms ? getTreeOrValueMap('formIndex', props as StarterDexUnlockTree) : null,
              female: !hasForms && hasGender ? getTreeOrValueMap('female', props as StarterDexUnlockTree) : null,
              key: hasForms ? 'formIndex' : hasGender ? 'female' : 'entry',
              entry: hasForms || hasGender ? null : this.dexData[species.speciesId][!s ? 0 : 1]
            });
          }
          return shinyMap;
        case 'formIndex':
          const formMap = new Map<integer, StarterDexUnlockTree>();
          for (let f = 0; f < species.forms.length; f++) {
            const props = { shiny: parent.shiny, formIndex: f };
            formMap.set(f, {
              shiny: parent.shiny,
              formIndex: f,
              female: hasGender ? getTreeOrValueMap('female', props as StarterDexUnlockTree) : null,
              key: hasGender ? 'female' : 'entry',
              entry: hasGender ? null : this.dexData[species.speciesId][!parent.shiny ? 0 : 1][f]
            });
          }
          return formMap;
        case 'female':
          const genderMap = new Map<boolean, StarterDexUnlockTree>();
          for (let g = 0; g < 2; g++) {
            genderMap.set(!!g, {
              shiny: parent.shiny,
              formIndex: parent.formIndex,
              female: !!g,
              key: 'entry',
              entry: hasForms
                ? this.dexData[species.speciesId][!parent.shiny ? 0 : 1][parent.formIndex as integer][g]
                : this.dexData[species.speciesId][!parent.shiny ? 0 : 1][g]
            });
          }
          return genderMap;
      }
    };

    const root = {
      shiny: getTreeOrValueMap('shiny'),
      formIndex: null,
      female: null,
      key: 'shiny',
      entry: null
    };

    return root;
  }
}