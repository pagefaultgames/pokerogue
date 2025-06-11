import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";

/**
 * Provides EXP to the player's party *without* doing any Pokemon defeated checks or queueing extraneous post-battle phases
 * Intended to be used as a more 1-off phase to provide exp to the party (such as during MEs), rather than cleanup a battle entirely
 */
export class PartyExpPhase extends Phase {
  public readonly phaseName = "PartyExpPhase";

  constructor(
    public expValue: number,
    public useWaveIndexMultiplier?: boolean,
    public pokemonParticipantIds?: Set<number>,
  ) {
    super();
  }

  /**
   * Gives EXP to the party
   */
  start() {
    super.start();

    globalScene.applyPartyExp(this.expValue, false, this.useWaveIndexMultiplier, this.pokemonParticipantIds);

    this.end();
  }
}
