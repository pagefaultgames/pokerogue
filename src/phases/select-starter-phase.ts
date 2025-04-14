import { globalScene } from "#app/global-scene";
import { applyChallenges, ChallengeType } from "#app/data/challenge";
import { Gender } from "#app/data/gender";
import { SpeciesFormChangeMoveLearnedTrigger } from "#app/data/pokemon-forms";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { overrideHeldItems, overrideModifiers } from "#app/modifier/modifier";
import Overrides from "#app/overrides";
import { Phase } from "#app/phase";
import { TitlePhase } from "#app/phases/title-phase";
import { SaveSlotUiMode } from "#app/ui/save-slot-select-ui-handler";
import type { Starter } from "#app/ui/starter-select-ui-handler";
import { UiMode } from "#enums/ui-mode";
import type { Species } from "#enums/species";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { isNullOrUndefined } from "#app/utils/common";

export class SelectStarterPhase extends Phase {
  start() {
    super.start();

    globalScene.playBgm("menu");

    globalScene.ui.setMode(UiMode.STARTER_SELECT, (starters: Starter[]) => {
      globalScene.ui.clearText();
      globalScene.ui.setMode(UiMode.SAVE_SLOT, SaveSlotUiMode.SAVE, (slotId: number) => {
        if (slotId === -1) {
          globalScene.clearPhaseQueue();
          globalScene.pushPhase(new TitlePhase());
          return this.end();
        }
        globalScene.sessionSlotId = slotId;
        this.initBattle(starters);
      });
    });
  }

  /**
   * Initialize starters before starting the first battle
   * @param starters {@linkcode Pokemon} with which to start the first battle
   */
  initBattle(starters: Starter[]) {
    const party = globalScene.getPlayerParty();
    const loadPokemonAssets: Promise<void>[] = [];
    starters.forEach((starter: Starter, i: number) => {
      if (!i && Overrides.STARTER_SPECIES_OVERRIDE) {
        starter.species = getPokemonSpecies(Overrides.STARTER_SPECIES_OVERRIDE as Species);
      }
      const starterProps = globalScene.gameData.getSpeciesDexAttrProps(starter.species, starter.dexAttr);
      let starterFormIndex = Math.min(starterProps.formIndex, Math.max(starter.species.forms.length - 1, 0));
      if (
        starter.species.speciesId in Overrides.STARTER_FORM_OVERRIDES &&
        !isNullOrUndefined(Overrides.STARTER_FORM_OVERRIDES[starter.species.speciesId]) &&
        starter.species.forms[Overrides.STARTER_FORM_OVERRIDES[starter.species.speciesId]!]
      ) {
        starterFormIndex = Overrides.STARTER_FORM_OVERRIDES[starter.species.speciesId]!;
      }

      let starterGender =
        starter.species.malePercent !== null ? (!starterProps.female ? Gender.MALE : Gender.FEMALE) : Gender.GENDERLESS;
      if (Overrides.GENDER_OVERRIDE !== null) {
        starterGender = Overrides.GENDER_OVERRIDE;
      }
      const starterIvs = globalScene.gameData.dexData[starter.species.speciesId].ivs.slice(0);
      const starterPokemon = globalScene.addPlayerPokemon(
        starter.species,
        globalScene.gameMode.getStartingLevel(),
        starter.abilityIndex,
        starterFormIndex,
        starterGender,
        starterProps.shiny,
        starterProps.variant,
        starterIvs,
        starter.nature,
      );
      starter.moveset && starterPokemon.tryPopulateMoveset(starter.moveset);
      if (starter.passive) {
        starterPokemon.passive = true;
      }
      starterPokemon.luck = globalScene.gameData.getDexAttrLuck(
        globalScene.gameData.dexData[starter.species.speciesId].caughtAttr,
      );
      if (starter.pokerus) {
        starterPokemon.pokerus = true;
      }

      if (starter.nickname) {
        starterPokemon.nickname = starter.nickname;
      }

      if (!isNullOrUndefined(starter.teraType)) {
        starterPokemon.teraType = starter.teraType;
      } else {
        starterPokemon.teraType = starterPokemon.species.type1;
      }

      if (globalScene.gameMode.isSplicedOnly || Overrides.STARTER_FUSION_OVERRIDE) {
        starterPokemon.generateFusionSpecies(true);
      }
      starterPokemon.setVisible(false);
      applyChallenges(ChallengeType.STARTER_MODIFY, starterPokemon);
      party.push(starterPokemon);
      loadPokemonAssets.push(starterPokemon.loadAssets());
    });
    overrideModifiers();
    overrideHeldItems(party[0]);
    Promise.all(loadPokemonAssets).then(() => {
      SoundFade.fadeOut(globalScene, globalScene.sound.get("menu"), 500, true);
      globalScene.time.delayedCall(500, () => globalScene.playBgm());
      if (globalScene.gameMode.isClassic) {
        globalScene.gameData.gameStats.classicSessionsPlayed++;
      } else {
        globalScene.gameData.gameStats.endlessSessionsPlayed++;
      }
      globalScene.newBattle();
      globalScene.arena.init();
      globalScene.sessionPlayTime = 0;
      globalScene.lastSavePlayTime = 0;
      // Ensures Keldeo (or any future Pokemon that have this type of form change) starts in the correct form
      globalScene.getPlayerParty().forEach(p => {
        globalScene.triggerPokemonFormChange(p, SpeciesFormChangeMoveLearnedTrigger);
      });
      this.end();
    });
  }
}
