import { globalScene } from "#app/global-scene";
import { startingWave } from "#app/starting-wave";
import { ClassicFixedBossWaves } from "#enums/fixed-boss-waves";
import { GameModes } from "#enums/game-modes";
import { PartyMemberStrength } from "#enums/party-member-strength";

export class TrainerPartyTemplate {
  public size: number;
  public strength: PartyMemberStrength;
  public sameSpecies: boolean;
  public balanced: boolean;

  constructor(size: number, strength: PartyMemberStrength, sameSpecies?: boolean, balanced?: boolean) {
    this.size = size;
    this.strength = strength;
    this.sameSpecies = !!sameSpecies;
    this.balanced = !!balanced;
  }

  getStrength(_index: number): PartyMemberStrength {
    return this.strength;
  }

  isSameSpecies(_index: number): boolean {
    return this.sameSpecies;
  }

  isBalanced(_index: number): boolean {
    return this.balanced;
  }
}

export class TrainerPartyCompoundTemplate extends TrainerPartyTemplate {
  public templates: TrainerPartyTemplate[];

  constructor(...templates: TrainerPartyTemplate[]) {
    super(
      templates.reduce((total: number, template: TrainerPartyTemplate) => {
        total += template.size;
        return total;
      }, 0),
      PartyMemberStrength.AVERAGE,
    );
    this.templates = templates;
  }

  getStrength(index: number): PartyMemberStrength {
    let t = 0;
    for (const template of this.templates) {
      if (t + template.size > index) {
        return template.getStrength(index - t);
      }
      t += template.size;
    }

    return super.getStrength(index);
  }

  isSameSpecies(index: number): boolean {
    let t = 0;
    for (const template of this.templates) {
      if (t + template.size > index) {
        return template.isSameSpecies(index - t);
      }
      t += template.size;
    }

    return super.isSameSpecies(index);
  }

  isBalanced(index: number): boolean {
    let t = 0;
    for (const template of this.templates) {
      if (t + template.size > index) {
        return template.isBalanced(index - t);
      }
      t += template.size;
    }

    return super.isBalanced(index);
  }
}

export const trainerPartyTemplates = {
  ONE_WEAK_ONE_STRONG: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(1, PartyMemberStrength.WEAK),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
  ),
  ONE_AVG: new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE),
  ONE_AVG_ONE_STRONG: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
  ),
  ONE_STRONG: new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
  ONE_STRONGER: new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER),
  TWO_WEAKER: new TrainerPartyTemplate(2, PartyMemberStrength.WEAKER),
  TWO_WEAK: new TrainerPartyTemplate(2, PartyMemberStrength.WEAK),
  TWO_WEAK_ONE_AVG: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(2, PartyMemberStrength.WEAK),
    new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE),
  ),
  TWO_WEAK_SAME_ONE_AVG: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(2, PartyMemberStrength.WEAK, true),
    new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE),
  ),
  TWO_WEAK_SAME_TWO_WEAK_SAME: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(2, PartyMemberStrength.WEAK, true),
    new TrainerPartyTemplate(2, PartyMemberStrength.WEAK, true),
  ),
  TWO_WEAK_ONE_STRONG: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(2, PartyMemberStrength.WEAK),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
  ),
  TWO_AVG: new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE),
  TWO_AVG_ONE_STRONG: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
  ),
  TWO_AVG_SAME_ONE_AVG: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE, true),
    new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE),
  ),
  TWO_AVG_SAME_ONE_STRONG: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE, true),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
  ),
  TWO_AVG_SAME_TWO_AVG_SAME: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE, true),
    new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE, true),
  ),
  TWO_STRONG: new TrainerPartyTemplate(2, PartyMemberStrength.STRONG),
  THREE_WEAK: new TrainerPartyTemplate(3, PartyMemberStrength.WEAK),
  THREE_WEAK_SAME: new TrainerPartyTemplate(3, PartyMemberStrength.WEAK, true),
  THREE_AVG: new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE),
  THREE_AVG_SAME: new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE, true),
  THREE_WEAK_BALANCED: new TrainerPartyTemplate(3, PartyMemberStrength.WEAK, false, true),
  FOUR_WEAKER: new TrainerPartyTemplate(4, PartyMemberStrength.WEAKER),
  FOUR_WEAKER_SAME: new TrainerPartyTemplate(4, PartyMemberStrength.WEAKER, true),
  FOUR_WEAK: new TrainerPartyTemplate(4, PartyMemberStrength.WEAK),
  FOUR_WEAK_SAME: new TrainerPartyTemplate(4, PartyMemberStrength.WEAK, true),
  FOUR_WEAK_BALANCED: new TrainerPartyTemplate(4, PartyMemberStrength.WEAK, false, true),
  FIVE_WEAKER: new TrainerPartyTemplate(5, PartyMemberStrength.WEAKER),
  FIVE_WEAK: new TrainerPartyTemplate(5, PartyMemberStrength.WEAK),
  FIVE_WEAK_BALANCED: new TrainerPartyTemplate(5, PartyMemberStrength.WEAK, false, true),
  SIX_WEAKER: new TrainerPartyTemplate(6, PartyMemberStrength.WEAKER),
  SIX_WEAKER_SAME: new TrainerPartyTemplate(6, PartyMemberStrength.WEAKER, true),
  SIX_WEAK: new TrainerPartyTemplate(6, PartyMemberStrength.WEAK),
  SIX_WEAK_SAME: new TrainerPartyTemplate(6, PartyMemberStrength.WEAK, true),
  SIX_WEAK_BALANCED: new TrainerPartyTemplate(6, PartyMemberStrength.WEAK, false, true),

  GYM_LEADER_1: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
  ),
  GYM_LEADER_2: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER),
  ),
  GYM_LEADER_3: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER),
  ),
  GYM_LEADER_4: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER),
  ),
  GYM_LEADER_5: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE),
    new TrainerPartyTemplate(2, PartyMemberStrength.STRONG),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER),
  ),

  ELITE_FOUR: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE),
    new TrainerPartyTemplate(3, PartyMemberStrength.STRONG),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER),
  ),

  CHAMPION: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(4, PartyMemberStrength.STRONG),
    new TrainerPartyTemplate(2, PartyMemberStrength.STRONGER, false, true),
  ),

  RIVAL: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
    new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE),
  ),
  RIVAL_2: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
    new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE),
    new TrainerPartyTemplate(1, PartyMemberStrength.WEAK, false, true),
  ),
  RIVAL_3: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
    new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE),
    new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE, false, true),
    new TrainerPartyTemplate(1, PartyMemberStrength.WEAK, false, true),
  ),
  RIVAL_4: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
    new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE),
    new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE, false, true),
    new TrainerPartyTemplate(1, PartyMemberStrength.WEAK, false, true),
  ),
  RIVAL_5: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
    new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE),
    new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE, false, true),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
  ),
  RIVAL_6: new TrainerPartyCompoundTemplate(
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
    new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE),
    new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE, false, true),
    new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER),
  ),
};

/**
 * The function to get variable strength grunts
 * @returns the correct TrainerPartyTemplate
 */
export function getEvilGruntPartyTemplate(): TrainerPartyTemplate {
  const waveIndex = globalScene.currentBattle?.waveIndex;
  if (waveIndex <= ClassicFixedBossWaves.EVIL_GRUNT_1) {
    return trainerPartyTemplates.TWO_AVG;
  }
  if (waveIndex <= ClassicFixedBossWaves.EVIL_GRUNT_2) {
    return trainerPartyTemplates.THREE_AVG;
  }
  if (waveIndex <= ClassicFixedBossWaves.EVIL_GRUNT_3) {
    return trainerPartyTemplates.TWO_AVG_ONE_STRONG;
  }
  if (waveIndex <= ClassicFixedBossWaves.EVIL_ADMIN_1) {
    return trainerPartyTemplates.GYM_LEADER_4; // 3avg 1 strong 1 stronger
  }
  return trainerPartyTemplates.GYM_LEADER_5; // 3 avg 2 strong 1 stronger
}

export function getWavePartyTemplate(...templates: TrainerPartyTemplate[]) {
  const { currentBattle, gameMode } = globalScene;
  const wave = gameMode.getWaveForDifficulty(currentBattle?.waveIndex || startingWave, true);
  const templateIndex = Math.ceil((wave - 20) / 30);
  return templates[Phaser.Math.Clamp(templateIndex, 0, templates.length - 1)];
}

export function getGymLeaderPartyTemplate() {
  const { currentBattle, gameMode } = globalScene;
  switch (gameMode.modeId) {
    case GameModes.DAILY:
      if (currentBattle?.waveIndex <= 20) {
        return trainerPartyTemplates.GYM_LEADER_2;
      }
      return trainerPartyTemplates.GYM_LEADER_3;
    case GameModes.CHALLENGE: // In the future, there may be a ChallengeType to call here. For now, use classic's.
    case GameModes.CLASSIC:
      if (currentBattle?.waveIndex <= 20) {
        return trainerPartyTemplates.GYM_LEADER_1; // 1 avg 1 strong
      }
      if (currentBattle?.waveIndex <= 30) {
        return trainerPartyTemplates.GYM_LEADER_2; // 1 avg 1 strong 1 stronger
      }
      // 50 and 60
      if (currentBattle?.waveIndex <= 60) {
        return trainerPartyTemplates.GYM_LEADER_3; // 2 avg 1 strong 1 stronger
      }
      // 80 and 90
      if (currentBattle?.waveIndex <= 90) {
        return trainerPartyTemplates.GYM_LEADER_4; // 3 avg 1 strong 1 stronger
      }
      // 110+
      return trainerPartyTemplates.GYM_LEADER_5; // 3 avg 2 strong 1 stronger
    default:
      return getWavePartyTemplate(
        trainerPartyTemplates.GYM_LEADER_1,
        trainerPartyTemplates.GYM_LEADER_2,
        trainerPartyTemplates.GYM_LEADER_3,
        trainerPartyTemplates.GYM_LEADER_4,
        trainerPartyTemplates.GYM_LEADER_5,
      );
  }
}
