export enum Gender {
    GENDERLESS = -1,
    FEMALE,
    MALE
}

export function getGenderSymbol(gender: Gender) {
    switch (gender) {
        case Gender.MALE:
            return '♂';
        case Gender.FEMALE:
            return '♀';
    }
    return '';
}

export function getGenderColor(gender: Gender) {
    switch (gender) {
        case Gender.MALE:
            return '#40c8f8';
        case Gender.FEMALE:
            return '#f89890';
    }
    return '#ffffff';
}