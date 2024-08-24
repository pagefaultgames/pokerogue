import { Challenge, copyChallenge } from "#app/data/challenge.js";

export default class ChallengeData {
  public id: integer;
  public value: integer;
  public severity: integer;

  constructor(source: Challenge | any) {
    this.id = source.id;
    this.value = source.value;
    this.severity = source.severity;
  }

  toChallenge(): Challenge {
    return copyChallenge(this);
  }
}
