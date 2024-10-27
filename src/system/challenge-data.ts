import { Challenge, copyChallenge } from "#app/data/challenge";

export default class ChallengeData {
  public id: integer;
  public value: integer;
  public severity: integer;
  public rand: integer;

  constructor(source: Challenge | any) {
    this.id = source.id;
    this.value = source.value;
    this.severity = source.severity;
    this.rand = source.rand;
  }

  toChallenge(): Challenge {
    return copyChallenge(this);
  }
}
