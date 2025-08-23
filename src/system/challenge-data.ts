import type { Challenge } from "#data/challenge";
import { copyChallenge } from "#data/challenge";

export class ChallengeData {
  public id: number;
  public value: number;
  public severity: number;

  constructor(source: Challenge | any) {
    this.id = source.id;
    this.value = source.value;
    this.severity = source.severity;
  }

  toChallenge(): Challenge {
    return copyChallenge(this);
  }
}
