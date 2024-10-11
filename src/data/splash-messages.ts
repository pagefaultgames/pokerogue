import i18next from "i18next";

export function getBattleCountSplashMessage(): string {
  return `{COUNT} ${i18next.t("splashMessages:battlesWon")}`;
}

export function getSplashMessages(): string[] {
  const splashMessages = Array(10).fill(getBattleCountSplashMessage());
  splashMessages.push(...[
    i18next.t("splashMessages:joinTheDiscord"),
    i18next.t("splashMessages:infiniteLevels"),
    i18next.t("splashMessages:everythingStacks"),
    i18next.t("splashMessages:optionalSaveScumming"),
    i18next.t("splashMessages:biomes"),
    i18next.t("splashMessages:openSource"),
    i18next.t("splashMessages:playWithSpeed"),
    i18next.t("splashMessages:liveBugTesting"),
    i18next.t("splashMessages:heavyInfluence"),
    i18next.t("splashMessages:pokemonRiskAndPokemonRain"),
    i18next.t("splashMessages:nowWithMoreSalt"),
    i18next.t("splashMessages:infiniteFusionAtHome"),
    i18next.t("splashMessages:brokenEggMoves"),
    i18next.t("splashMessages:magnificent"),
    i18next.t("splashMessages:mubstitute"),
    i18next.t("splashMessages:thatsCrazy"),
    i18next.t("splashMessages:oranceJuice"),
    i18next.t("splashMessages:questionableBalancing"),
    i18next.t("splashMessages:coolShaders"),
    i18next.t("splashMessages:aiFree"),
    i18next.t("splashMessages:suddenDifficultySpikes"),
    i18next.t("splashMessages:basedOnAnUnfinishedFlashGame"),
    i18next.t("splashMessages:moreAddictiveThanIntended"),
    i18next.t("splashMessages:mostlyConsistentSeeds"),
    i18next.t("splashMessages:achievementPointsDontDoAnything"),
    i18next.t("splashMessages:youDoNotStartAtLevel"),
    i18next.t("splashMessages:dontTalkAboutTheManaphyEggIncident"),
    i18next.t("splashMessages:alsoTryPokengine"),
    i18next.t("splashMessages:alsoTryEmeraldRogue"),
    i18next.t("splashMessages:alsoTryRadicalRed"),
    i18next.t("splashMessages:eeveeExpo"),
    i18next.t("splashMessages:ynoproject"),
  ]);

  return splashMessages;
}
