export enum Gender {
    GENDERLESS = -1,
    MALE,
    FEMALE
}

export function getGenderSymbol(gender: Gender) {
  switch (gender) {
  case Gender.MALE:
    return "♂";
  case Gender.FEMALE:
    return "♀";
  }
  return "";
}

export function getGenderColor(gender: Gender, shadow?: boolean) {
  switch (gender) {
  case Gender.MALE:
    return shadow ? "#006090" : "#40c8f8";
  case Gender.FEMALE:
    return shadow ? "#984038" : "#f89890";
  }
  return "#ffffff";
}
