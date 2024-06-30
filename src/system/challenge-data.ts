import { Challenge, copyChallenge } from "#app/data/challenge.js";

export default class ChallengeData {
  public id: integer;
  public value: integer;
  public severity: integer;
  public additionalData: {[x: string]: any};

  constructor(source: Challenge | any) {
    this.id = source.id;
    this.value = source.value;
    this.severity = source.severity;
    this.additionalData = source.additionalData;
  }

  toChallenge(): Challenge {
    return copyChallenge(this);
  }
}
