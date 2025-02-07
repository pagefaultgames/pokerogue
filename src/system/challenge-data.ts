import type { Challenge } from "#app/data/challenge";
import { copyChallenge } from "#app/data/challenge";

export default class ChallengeData {
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
