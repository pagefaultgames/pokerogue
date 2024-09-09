import BattleScene from "#app/battle-scene.js";
import { Phase } from "#app/phase";

export class PartyExpPhase extends Phase {
  expValue: number;
  useWaveIndexMultiplier?: boolean;
  pokemonParticipantIds?: Set<number>;

  constructor(scene: BattleScene, expValue: number, useWaveIndexMultiplier?: boolean, pokemonParticipantIds?: Set<number>) {
    super(scene);

    this.expValue = expValue;
    this.useWaveIndexMultiplier = useWaveIndexMultiplier;
    this.pokemonParticipantIds = pokemonParticipantIds;
  }

  start() {
    super.start();

    this.scene.applyPartyExp(this.expValue, false, this.useWaveIndexMultiplier, this.pokemonParticipantIds);

    this.end();
  }
}
