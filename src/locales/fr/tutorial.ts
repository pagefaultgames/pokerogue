import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const tutorial: SimpleTranslationEntries = {
  "intro": `Bienvenue dans PokéRogue, un fangame axé sur les combats Pokémon avec des éléments roguelite !
    $Ce jeu n’est pas monétisé et nous ne prétendons pas à la propriété de Pokémon, ni des éléments sous copyright
    $utilisés.
    $Ce jeu est toujours en développement, mais entièrement jouable.
    $Tout signalement de bugs passe par le serveur Discord.
    $Si le jeu est lent, vérifiez que l’Accélération Matérielle est activée dans les paramètres du navigateur.`,

  "accessMenu": `Accédez au menu avec M ou Échap lors de l’attente d’une\naction.
    $Il contient les paramètres et diverses fonctionnalités`,

  "menu": `Vous pouvez accéder aux paramètres depuis ce menu.
    $Vous pouvez entre autres y changer la vitesse du jeu ou le style de fenêtre.
    $Il y a également toute une variété d’autres fonctionnalités,
    $jetez-y un œil !`,

  "starterSelect": `Choisissez vos starters depuis cet écran avec Z ou Espace.\nIls formeront votre équipe de départ.
    $Chacun possède une valeur. Votre équipe peut avoir jusqu’à\n6 membres, tant que vous ne dépassez pas un cout de 10.
    $Vous pouvez aussi choisir le sexe, le talent et la forme en\nfonction des variants déjà capturés ou éclos.
    $Les IVs d’un starter sont les meilleurs de tous ceux de son\nespèce déjà obtenus. Essayez donc d’en obtenir plusieurs !`,

  "pokerus": `Chaque jour, 3 starters tirés aléatoirement ont un contour
    $violet. Si un starter que vous possédez l’a, essayez de
    $l’ajouter à votre équipe. Vérifiez bien son résumé !`,

  "statChange": `Les changements de stats restent à travers les combats tant que le Pokémon n’est pas rappelé.
    $Vos Pokémon sont rappelés avant un combat de Dresseur et avant d’entrer dans un nouveau biome.
    $Vous pouvez également voir en combat les changements de stats d’un Pokémon en maintenant C ou Maj.`,

  "selectItem": `Après chaque combat, vous avez le choix entre 3 objets\ntirés au sort. Vous ne pouvez en prendre qu’un.
    $Cela peut être des objets consommables, des objets à\nfaire tenir, ou des objets passifs aux effets permanents.
    $La plupart des effets des objets non-consommables se cumuleront de diverses manières.
    $Certains objets apparaîtront s’ils peuvent être utilisés, comme les objets d’évolution.
    $Vous pouvez aussi transférer des objets tenus entre Pokémon en utilisant l’option de transfert.
    $L’option de transfert apparaît en bas à droite dès que vous avez obtenu un objet à faire tenir.
    $Vous pouvez acheter des consommables avec de l’argent.\nPlus vous progressez, plus le choix sera varié.
    $Choisir un des objets gratuits déclenchera le prochain combat, donc faites bien tous vos achats avant.`,

  "eggGacha": `Depuis cet écran, vous pouvez échanger vos coupons\ncontre des Œufs de Pokémon.
    $Les Œufs éclosent après avoir remporté un certain nombre\nde combats. Les plus rares mettent plus de temps.
    $Les Pokémon éclos ne rejoindront pas votre équipe,\nmais seront ajoutés à vos starters.
    $Les Pokémon issus d’Œufs ont généralement de\nmeilleurs IVs que les Pokémon sauvages.
    $Certains Pokémon ne peuvent être obtenus\nque dans des Œufs.
    $Il y a 3 différentes machines à actionner avec différents\nbonus, prenez celle qui vous convient le mieux !`,
} as const;
