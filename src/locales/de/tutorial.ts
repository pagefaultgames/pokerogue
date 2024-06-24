import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const tutorial: SimpleTranslationEntries = {
  "intro": `Willkommen bei PokéRogue! Dies ist ein kampforientiertes Pokémon-Fangame mit Roguelite-Elementen.
    $Dieses Spiel ist nicht monetarisiert.
    $Wir erheben keinen Eigentumsanspruch an Pokémon oder\nverwendeten, urheberrechtlich geschützten Inhalten.
    $Das Spiel befindet sich noch in der Entwicklung, ist aber voll spielbar.
    $Für Fehlerberichte nutze bitte den PokéRogue Discord-Server.
    $Sollte das Spiel langsam laufen, überprüfe, ob in deinem Browser "Hardwarebeschleunigung" aktiviert ist.`,

  "accessMenu": "Nutze M oder Esc, um das Menü zu öffnen. Dort hast du Zugriff auf die Einstellungen und andere Funktionen.",

  "menu": `In diesem Menü hast du Zugriff auf die Einstellungen.
    $Dort kannst du u. A. die Spielgeschwin-\ndigkeit und das Fensterdesign ändern.
    $Das Menü verbirgt noch andere Funktionen - probier' sie gerne aus!`,

  "starterSelect": `In diesem Bildschirm kannst du mit Z oder Leertaste deine\nStarter auswählen.
    $Sie begleiten dich am Anfang deines Abenteuers.
    $Jeder Starter hat einen Preis. Dein Team kann bis zu sechs\nMitglieder haben, solange der Gesamtpreis max. 10 beträgt.
    $Du kannst Geschlecht, Fähigkeit und Form beliebig auswählen,\nsobald du sie mindestens einmal gefangen hast.
    $Die DVs ergeben sich aus den Höchstwerten aller Pokémon,\ndie du bereits gefangen hast. 
    $Es lohnt sich also, das selbe Pokémon mehrmals zu fangen!`,

  "pokerus": `Jeden Tag haben drei zufällige Pokémon einen lila Rahmen.
    $Wenn du eins von ihnen besitzt,
    $nimm es doch mal mit und sieh dir seinen Bericht an!`,

  "statChange": `Statuswertveränderungen halten solange an, wie dein Pokémon auf dem Feld bleibt.
    $Pokémon werden am Anfang eines Trainerkampfes oder bei einem Arealwechsel automatisch zurückgerufen.
    $Nutze C oder Shift, um aktuelle Statuswertveränderungen anzuzeigen.`,

  "selectItem": `Nach jedem Kampf kannst du aus 3 zufälligen Items exakt eines auswählen.
    $Es gibt u. A. Heilitems, tragbare Items und Basis-Items, die dir einen permanenten Vorteil verschaffen.
    $Die meisten tragbaren und permanenten Items werden stärker, wenn du sie mehrfach sammelst.
    $Manche Items, wie Entwicklungssteine, tauchen nur auf, wenn du sie auch nutzen kannst.
    $Mithilfe der "Transfer"-Option kannst du Items zwischen deinen Pokémon verschieben.
    $Sie erscheint rechts unten, sobald du einem deiner Pokémon dein Item zum Tragen gegeben hast.
    $Du kannst Heilitems auch gegen Geld erwerben. Je weiter du kommst, desto mehr stehen dir zur Auswahl.
    $Erledige deine Einkäufe als erstes, denn sobald du dein zufälliges Item auswählst, beginnt der nächste Kampf.`,

  "eggGacha": `Hier kannst du deine Gutscheine gegen Pokémon-Eier\ntauschen.
    $Eier schlüpfen, nachdem du eine gewisse Anzahl Kämpfe\nabsolviert hast. Je seltener das Ei, desto länger dauert es.
    $Geschlüpfte Pokémon werden nicht deinem Team hinzugefügt,\nsondern deinen verfügbaren Startern.
    $In der Regel haben sie bessere DVs als in der Wildnis\ngefangene Pokémon.
    $Es gibt sogar Pokémon, die du nur aus Eiern erhalten kannst.
    $Es gibt drei Gacha-Maschinen mit je unterschiedlichen Boni,\nalso such' dir die aus, die dir am besten gefällt!`,
} as const;
