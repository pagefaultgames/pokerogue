import {DialogueTranslationEntries, SimpleTranslationEntries} from "#app/interfaces/locales";

// Dialogue of the NPCs in the game when the player character is male (or unset)
export const PGMdialogue: DialogueTranslationEntries = {
  "youngster": {
    "encounter": {
      1: "Hé ! Combat ?",
      2: "Toi aussi, tu débutes ?",
      3: "Hé, j’me souviens pas de ta tête. Combat !",
      4: "J’ai perdu, alors j’essaye de capturer d’autres Pokémon.\nHé, t’as l’air faible toi ! Allez, combat !",
      5: "On s’connait ? J’ai comme un doute. Dans tous les cas, sympa de te rencontrer !",
      6: "Allez, c’est parti !",
      7: "Attention, me voilà !\nTu vas voir comment j’suis fort !",
      8: "Coucou... Tu veux voir mes bô Pokémon ?",
      9: "Assez causé. Ramène-toi quand tu le sens !",
      10: "Baisse pas ta garde si tu veux pas pleurer d’avoir perdu face à un gamin.",
      11: "J’ai tout donné pour élever mes Pokémon. Attention à toi si tu leur fait du mal !",
      12: "Incroyable que tu sois arrivé jusque là ! Mais la suite va pas être une partie de plaisir.",
      13: "Les combats sont éternels ! Bienvenue dans un monde sans fin !"
    },
    "victory": {
      1: "Hé, mais t’es trop fort !",
      2: "En vrai j’avais aucune chance hein ?",
      3: "J’te retrouverai un jour, et là j’te battrai !",
      4: "Arg... J’ai plus aucun Pokémon.",
      5: "Non... IMPOSSIBLE ! Pourquoi j’ai encore perdu...",
      6: "Non ! J’ai perdu !",
      7: "Waah ! T’es trop incroyable ! J’suis bouche bée !",
      8: "Pourquoi... Comment... Pourtant on est les plus forts, mes Pokémon et moi...",
      9: "J’perdrai pas la prochaine fois ! Remettons ça un jour !",
      10: "Weeeesh ! Tu vois que j’suis qu’un gamin ? C’est pas juste de me bully comme ça !",
      11: "Tes Pokémon sont trop incroyables !\n... P’tit échange ?",
      12: "C'était me battre, qu'était une partie de plaisir...",
      13: "Ahaha ! Et voilà, ça y est !\nT’es déjà comme chez toi dans ce monde !"
    }
  },
  "lass": {
    "encounter": {
      1: "Affrontons-nous, d’accord ?",
      2: "T’as l’air d’un nouveau Dresseur. Battons nous !",
      3: "Je te connais pas. Ça te dit de te battre ?",
      4: "Prenons du bon temps avec ce combat Pokémon !",
      5: "Je vais t’apprendre à te battre avec tes Pokémon !",
      6: "Un combat doit être pris au sérieux. T’es prêt à te battre ?",
      7: "Tu seras pas jeune éternellement. T’as qu’une chance pendant un combat. Bientôt, tu seras plus qu’un souvenir.",
      8: "Tu ferais mieux d’y aller doucement avec moi. Mais je vais me battre sérieusement !",
      9: "Je m’ennuie à l’école. Y’a rien à y faire. *Baille*\nJe me bats juste pour passer le temps."
    },
    "victory": {
      1: "Wah, c’était impressionnant ! J’ai encore beaucoup à apprendre.",
      2: "Je ne pensais pas que je perdrais comme ça...",
      3: "J’espère que j’aurai ma revanche un jour.",
      4: "C’était super amusant ! Mais ce combat m’a épuisée...",
      5: "Tu m’as appris une belle leçon ! T’es vraiment incroyable !",
      6: "Vraiment ? J’ai perdu... ? C’est des choses qui arrivent, ça me déprime mais tu es vraiment très cool.",
      7: "J’ai pas besoin de ce genre de souvenirs.\n*Suppression de mémoire en cours...*",
      8: "Hé ! Je t’avais dit d’y aller doucement avec moi ! Mais t’es vraiment si cool quand tu te bats sérieusement...",
      9: "J’en ai marre des combats Pokémon...\nJe vais chercher d’autres trucs à faire..."
    }
  },
  "breeder": {
    "encounter": {
      1: "Qu’ils soient obéissants ou égoïstes... Les Pokémon ont des caractéristiques uniques.",
      2: "Même si mes choix et ma personnalité ne sont pas fous, je pense quand même bien avoir élevé mes Pokémon.",
      3: "Hum, t’es pas trop laxiste avec tes Pokémon ?\nTrop les chouchouter n’est pas bon.",
    },
    "victory": {
      1: "Il est primordial de nourir et développer toutes les caractéristiques de chaque Pokémon.",
      2: "Contrairement à moi, ces Pokémon ont un bon fond.",
      3: "Trop d’éloges peut ruiner les Pokémon et les gens.",
    },
    "defeat": {
      1: "Tu ne devrais pas t’énerver sur tes Pokémon, même après une défaite.",
      2: "Alors ? Pas mal mes Pokémon, hein ? Je suis fait pour ça.",
      3: "Peut importe à quel point t’aimes tes Pokémon, il faut toujours de la discipline s’ils se comportent mal."
    }
  },
  "breeder_female": {
    "encounter": {
      1: "Les Pokémon ne trahissent jamais. Ils te rendront toujours l’amour que tu leur donne.",
      2: "Puis-je te donner une astuce pour mieux élever tes Pokémon ?",
      3: "J’ai élevé mes Pokémon en utilisant une méthode très spéciale."
    },
    "victory": {
      1: "Arg... C’était pas supposé se passer comme ça. Leur ai-je administré la mauvaise préparation ?",
      2: "Comment ça a pu arriver...\nAvec quoi nourris-tu tes Pokémon ?",
      3: "Si je perds, c’est juste pour te dire que je tuais le temps. Mon ego n’est absolument pas touché..."
    },
    "defeat": {
      1: "C’est la preuve que mes Pokémon reconnaissent tout mon amour.",
      2: "Le seul secret derrière des Pokémon bien entrainés, c’est surtout d’en capturer des bons.",
      3: "La force des Pokémon dépend de ta capacité à savoir les élever correctement."
    }
  },
  "fisherman": {
    "encounter": {
      1: "Aaah non ! J’avais une touche !\nTu comptes faire quoi pour arranger ça ?",
      2: "Bouge de là ! Tu fais peur aux Pokémon !",
      3: "Voyons si t'arrives à ferrer une victoire !",
    },
    "victory": {
      1: "Vas-y là, oublie.",
      2: "La prochaine fois, je vais me repêcher !",
      3: "Je présume que j’ai sous-estimé les courants...",
    }
  },
  "fisherman_female": {
    "encounter": {
      1: "Oh la belle prise !",
      2: "Ma ligne est en place, prête à ferrer le succès !",
      3: "Prête à faire des vagues !"
    },
    "victory": {
      1: "Je suppose que je vais avoir besoin d’un plus gros hameçon.",
      2: "La ligne s’est brisée, j’ai pas pu la ferrer...",
      3: "Attends que j’aiguise mes hameçons pour la revanche !"
    }
  },
  "swimmer": {
    "encounter": {
      1: "C’est l’heure de plonger dans le vif !",
      2: "C’est le moment de surfer sur les vagues de la victoire !",
      3: "Je vais t’éclabousser de mon talent !",
    },
    "victory": {
      1: "Tu m’as complètement séché !",
      2: "Il semblerait que ce soit celles de la défaite...",
      3: "Retour sur la terre ferme, je suppose...",
    }
  },
  "backpacker": {
    "encounter": {
      1: "Fais ton sac, on y va !",
      2: "Voyons si t’arrives à garder le rythme !",
      3: "Accélère le pas, camarade !",
      4: "J’ai passé 20 ans à la recherche de moi-même...\nMais où suis-je ?"
    },
    "victory": {
      1: "J’ai trébuché !",
      2: "Ah, je crois que je me suis paumé.",
      3: "Ah, une impasse !",
      4: "Hé ! Attends une seconde...\nTu saurais pas qui je suis ?"
    }
  },
  "ace_trainer": {
    "encounter": {
      1: "T’as l’air plutôt confiant.",
      2: "Tes Pokémon... Montre-les-moi...",
      3: "Les gens pensent que je suis fort par que je suis un Topdresseur.",
      4: "T’es au courant de ce que ça signifie d’être un Topdresseur ?"
    },
    "victory": {
      1: "Très bien... T’as de bons Pokémon...",
      2: "Quoi ?! Mais c'est moi le génie des combats !",
      3: "Évidemment que t’es le personnage principal !",
      4: "OK ! OK ! Tu pourrais être un Topdresseur !"
    },
    "defeat": {
      1: "Je me dévoue corps et âme aux combats Pokémon !",
      2: "Comme prévu... Vraiment aucune surprise...",
      3: "Et moi qui pensais qu’en grandissant, j’allais rester frêle et fragile, à me briser à la moindre étreinte.",
      4: "Évidemment que je suis fort et encore moins un perdant. C’est important de gagner avec grâce."
    }
  },
  "parasol_lady": {
    "encounter": {
      1: "Honorons ce terrain de combat avec élégance et équilibre !",
    },
    "victory": {
      2: "Mon élégance demeure inébranlable !",
    }
  },
  "twins": {
    "encounter": {
      1: "Prépare-toi, parce que quand on fait équipe, c’est deux fois plus d’embrouilles !",
      2: "Deux cœurs, une stratégie – on va gagner grâce au pouvoir des jumelles !",
      3: "À deux contre un, nous sommes imbattables, alors prépare-toi !"
    },
    "victory": {
      1: "On a peut-être perdu ce combat, mais notre lien reste incassable !",
      2: "L’esprit des jumelles ne restera pas affaibli très longtemps.",
      3: "Notre duo dynamique reviendra plus fort !"
    },
    "defeat": {
      1: "Le pouvoir des jumelles règne en maître !",
      2: "Deux cœurs, une victoire !",
      3: "Deux fois plus de sourires, deux fois plus de danses de la victoire !"
    }
  },
  "cyclist": {
    "encounter": {
      1: "Prépare-toi à mordre la poussière !",
      2: "Attention ! Je change de vitesse !",
      3: "Je vais toujours à fond la caisse, est-ce que tu peux me suivre ?"
    },
    "victory": {
      1: "Ça va me mettre des bâtons dans les roues.",
      2: "Tu étais trop rapide !",
      3: "La route vers la victoire comporte encore de nombreux rebondissements."
    }
  },
  "black_belt": {
    "encounter": {
      1: "C’est très courageux de ta part de m’affronter ! Car j’ai un superbe coup de pied !",
      2: "Oh, je vois. Tu veux que je découpe en morceaux ? Ou tu préfères le rôle de punching-ball ?"
    },
    "victory": {
      1: "Oh. Ce sont mes Pokémon qui se sont battus. Mon coup de pied n’a servi à rien.",
      2: "Hmmm... Si je devais perdre de toute façon, j’espérais être complètement à côté."
    }
  },
  "battle_girl": {
    "encounter": {
      1: "Tu n’es pas obligé d’essayer de m’impressionner. Tu peux perdre contre moi."
    },
    "victory": {
      1: "C’est difficile de se dire au revoir, mais nous manquons de temps...",
    }
  },
  "hiker": {
    "encounter": {
      1: "Mon âge m’a donné autant de gravité que les montagnes que je parcourt !",
      2: "Je tiens ces os solides de mes parents... Je suis comme une chaîne de montagnes vivante..."
    },
    "victory": {
      1: "Au moins, je ne peux pas perdre en termes d’IMC !",
      2: "Ce n’est pas assez... Ce n’est jamais assez. Mon mauvais cholestérol n’est pas assez élevé..."
    }
  },
  "ranger": {
    "encounter": {
      1: "Quand je suis entouré par la nature, la plupart des autres choses cessent d’avoir de l’importance.",
      2: "Quand je vis sans nature dans ma vie, je ressens parfois soudainement une crise d’angoisse."
    },
    "victory": {
      1: "Face à l’immensité de la nature, peu importe que je gagne ou que je perde...",
      2: "Cette défaite est insignifiante, comparée aux sensations étouffantes de la vie urbaine."
    },
    "defeat": {
      1: "J’ai gagné la bataille. Mais face à l’immensité de la nature, ce n’est rien...",
      2: "Je suis sûr que ce que tu ressens n’est pas si mal, comparé à mes crises d’angoisse..."
    }
  },
  "scientist": {
    "encounter": {
      1: "Mes recherches mèneront ce monde vers la paix et la joie."
    },
    "victory": {
      1: "Je suis un génie... Je ne suis pas censé perdre contre quelqu’un comme toi...",
    }
  },
  "school_kid": {
    "encounter": {
      1: "Héhé... J’ai confiance en mes calculs et mes analyses.",
      2: "Je veux acquérir le plus d’expérience possible parce que je veux un jour devenir Champion d’Arène !"
    },
    "victory": {
      1: "Ohhhh... Le calcul et l’analyse ne font peut-être pas le poids face à la chance...",
      2: "Même les expériences difficiles et éprouvantes peuvent être utiles, je suppose."
    }
  },
  "artist": {
    "encounter": {
      1: "Avant, j’étais populaire, mais maintenant je suis complètement dépassé."
    },
    "victory": {
      1: "Les temps changent et les valeurs également. Je m’en suis rendu compte trop tard.",
    }
  },
  "guitarist": {
    "encounter": {
      1: "Prépare-toi à ressentir le rythme de la défaite alors que je gratte mon chemin vers la victoire !"
    },
    "victory": {
      1: "Je suis réduit au silence pour l’instant, mais ma mélodie de résilience continuera à jouer.",
    }
  },
  "worker": {
    "encounter": {
      1: "Ça me dérange que les gens se méprennent toujours sur moi. Je suis beaucoup plus pur qu’on ne le pense."
    },
    "victory": {
      1: "Je ne veux pas recevoir de coups de soleil, donc je reste à l’ombre pendant que je travaille.",
    }
  },
  "worker_female": {
    "encounter": {
      1: "Ça me dérange que les gens se méprennent toujours sur moi. Je suis beaucoup plus pure qu’on ne le pense."
    },
    "victory": {
      1: "Je ne veux pas recevoir de coups de soleil, donc je reste à l’ombre pendant que je travaille."
    },
    "defeat": {
      1: "Mon corps et mon esprit ne sont pas forcément toujours synchronisés."
    }
  },
  "worker_double": {
    "encounter": {
      1: "Je vais te montrer que nous pouvons te briser. Nous nous sommes entraînés sur le terrain !"
    },
    "victory": {
      1: "Comme c’est étrange... Comment c’est possible... À deux, on aurait dû te battre.",
    }
  },
  "hex_maniac": {
    "encounter": {
      1: "Normalement, je n’écoute que de la musique classique, mais si je perds, je pense que je vais essayer des musiques plus récentes !",
      2: "Chacune de mes larmes me rend plus forte."
    },
    "victory": {
      1: "Serait-ce l’aube de l’ère du Verseau ?",
      2: "Maintenant je peux devenir plus forte. Chaque rancune me rend plus forte."
    },
    "defeat": {
      1: "Les compositeurs classiques du vingtième siècle, ça compte ?",
      2: "Ne t’attarde pas sur la tristesse ou la frustration. Tu peux utiliser tes rancunes pour te motiver."
    }
  },
  "psychic": {
    "encounter": {
      1: "Salut ! Concentration !",
    },
    "victory": {
      1: "Zut !",
    }
  },
  "officer": {
    "encounter": {
      1: "On ne bouge plus ! Justice va être rendue !",
      2: "Prêt à faire respecter la loi et à servir la justice sur le champ de bataille !"
    },
    "victory": {
      1: "Le poids de la justice semble plus lourd que jamais...",
      2: "Les ombres de la défaite persistent."
    }
  },
  "beauty": {
    "encounter": {
      1: "Ma dernière bataille... C'est comme ça que j'aimerais qu'on voit ce match...",
    },
    "victory": {
      1: "Ça a été amusant... Faisons encore une dernière bataille un jour...",
    }
  },
  "baker": {
    "encounter": {
      1: "J'espère que tu es prêt à goûter à la défaite !"
    },
    "victory": {
      1: "Je suis au bout du rouleau... à pâtisserie."
    }
  },
  "biker": {
    "encounter": {
      1: "Il est temps de démarrer et de te laisser dans la poussière !"
    },
    "victory": {
      1: "Je vais me préparer pour la prochaine course."
    }
  },
  "firebreather": {
    "encounter": {
      1: "Mes flammes vont te dévorer !",
      2: "Mon âme est en feu. Je vais te montrer à quel point elle brûle !",
      3: "Approche-toi et jette un coup d’œil !"
    },
    "victory": {
      1: "J’ai brûlé en cendres...",
      2: "Ouais ! C’est chaud !",
      3: "Aïe ! Je me suis brûlé le bout du nez !"
    }
  },
  "sailor": {
    "encounter": {
      1: "Si tu perds, tu prends la planche !",
      2: "Allons-y ! Il en va de ma fierté de marin !",
      3: "Yo ho ho ! Tu as le mal de mer ?"
    },
    "victory": {
      1: "Argh ! Battu par un gamin !",
      2: "Ton esprit m’a coulé !",
      3: "Oooh, j’ai la nausée..."
    }
  },
  //sbires teams
  "rocket_grunt": {
    "encounter": {
      1: "Nous sommes de retour !"
    },
    "victory": {
      1: "Une fois de plus, la Team Rocket s’envole vers d’autres cieux !"
    }
  },
  "magma_grunt": {
    "encounter": {
      1: "N’espère pas recevoir de la pitié si tu te mets sur le chemin de la Team Magma !"
    },
    "victory": {
      1: "Je...?\nJ’ai perdu ?!"
    }
  },
  "aqua_grunt": {
    "encounter": {
      1: "Aucune pitié si tu te mets sur le chemin de la Team Aqua, même pour un gamin !"
    },
    "victory": {
      1: "Comment ça ?"
    }
  },
  "galactic_grunt": {
    "encounter": {
      1: "Ne te mets pas en travers de la Team Galaxie !"
    },
    "victory": {
      1: "Désactivation..."
    }
  },
  "plasma_grunt": {
    "encounter": {
      1: "Pas de quatiers à ceux qui ne suivent pas notre idéal !"
    },
    "victory": {
      1: "Plasmaaaaaaaaa !"
    }
  },
  "flare_grunt": {
    "encounter": {
      1: "Le style et le bon gout, il n’y a que ça qui compte !"
    },
    "victory": {
      1: "Mon futur me semble guère radieux."
    }
  },
  //chefs teams
  "rocket_boss_giovanni_1": {
    "encounter": {
      1: "Bien. Je dois admettre que je suis impressionné de te voir ici !"
    },
    "victory": {
      1: "QUOI ? IMPOSSIBLE !"
    },
    "defeat": {
      1: "Retiens bien. Ton incapacité à évaluer ta propre force est\nla démonstration claire que tu n’es encore qu’un gamin."
    }
  },
  "rocket_boss_giovanni_2": {
    "encounter": {
      1: "Mes anciens collaborateurs m’attendent.\nComptes-tu m’en empêcher ?"
    },
    "victory": {
      1: "Comment c’est possible... ? Le grand dessein de la Team Rocket n’est plus qu’une illusion..."
    },
    "defeat": {
      1: "La Team Rocket renaitra, et je dominerai le monde !"
    }
  },
  "magma_boss_maxie_1": {
    "encounter": {
      1: "Je vais t’enterrer de mes propres mains.\nJ’espère que t’apprécieras cet honneur !"
    },
    "victory": {
      1: "Gnn... ! Tu... T’as du répondant...\nCe sentiment d’être à la traine, de si peu..."
    },
    "defeat": {
      1: "La Team Magma vaincra !"
    }
  },
  "magma_boss_maxie_2": {
    "encounter": {
      1: "T’es le dernier rempart entravant mes objectifs. Prépare-toi à mon ultime riposte ! Hahahaha !"
    },
    "victory": {
      1: "Ce... Ce n’est pas... Gnn..."
    },
    "defeat": {
      1: "L’heure est venue...\nJe vais transformer cette planète en paradis pour l’humanité."
    }
  },
  "aqua_boss_archie_1": {
    "encounter": {
      1: "Je suis le Leader de la Team Aqua.\nJ’ai bien peur que pour toi, ce soit fin de parcours."
    },
    "victory": {
      1: "Retrouvons-nous.\nJe me souviendrai de ton visage."
    },
    "defeat": {
      1: "Magnifique !\nPlus rien ne peut nous retenir !"
    }
  },
  "aqua_boss_archie_2": {
    "encounter": {
      1: "J’ai attendu ce moment depuis si longtemps.\nVoici la vraie puissance de la Team Aqua !"
    },
    "victory": {
      1: "Comme si j’y avait cru..."
    },
    "defeat": {
      1: "Je rendrai à ce monde sa pureté originelle !"
    }
  },
  "galactic_boss_cyrus_1": {
    "encounter": {
      1: "Tu t’es senti obligé de venir ici dans un acte vide de sens. Je vais te le faire regretter."
    },
    "victory": {
      1: "Intéressant. Et plutôt curieux."
    },
    "defeat": {
      1: "Je le créerai, mon nouveau monde..."
    }
  },
  "galactic_boss_cyrus_2": {
    "encounter": {
      1: "Nous y revoilà. Il semblerait que nos destinées soient entremêlées. Il est l’heure d’y mettre un terme."
    },
    "victory": {
      1: "Comment. Comment ?\nCOMMENT ?!"
    },
    "defeat": {
      1: "Adieu."
    }
  },
  "plasma_boss_ghetsis_1": {
    "encounter": {
      1: "Je n’accepterai pas qu’on me barre la route !\nPeu importe qui fait quoi !"
    },
    "victory": {
      1: "Comment ? Je suis le leader de la Team Plasma !\nJe suis parfait !"
    },
    "defeat": {
      1: "Je suis le parfait monarque d’un monde parfait !\nHahaha !"
    }
  },
  "plasma_boss_ghetsis_2": {
    "encounter": {
      1: "Viens ! Je veux voir ton visage à l’instant même où l’espoir quittera ton corps !"
    },
    "victory": {
      1: "Mes calculs... Non ! Mes plans étaient parfaits !\nCe monde devrait être mien !"
    },
    "defeat": {
      1: "Kyurem ! Fusiorption !!!"
    }
  },
  "flare_boss_lysandre_1": {
    "encounter": {
      1: "Comptes-tu m’arrêter ? Prouve-le."
    },
    "victory": {
      1: "Tu es venu m’arrêter. Mais je te demande d’attendre."
    },
    "defeat": {
      1: "Les Pokémon... Ne devraient plus exister."
    }
  },
  "flare_boss_lysandre_2": {
    "encounter": {
      1: "Ton futur ou le mien...\nVoyons lequel mérite plus d’aboutir."
    },
    "victory": {
      1: "Ohhhh... !"
    },
    "defeat": {
      1: "Les ignorants sans aucune vision n’auront donc de cesse de souiller ce monde."
    }
  },
  //kanto 1g
  "brock": {
    "encounter": {
      1: "Mon expertise sur les Pokémon de type Roche va te mettre à terre ! C’est parti !",
      2: "Ma volonté inébranlable comme la pierre va te submerger !",
      3: "Je vais te montrer la vraie force de mes Pokémons !"
    },
    "victory": {
      1: "Tes attaques ont surpassé ma défense de fer... euh, de pierre !",
      2: "Le monde est plein de surprises ! Je suis heureux d’avoir pu t’affronter.",
      3: "Peut-être que je pourrais suivre mon rêve de devenir éleveur de Pokémon..."
    },
    "defeat": {
      1: "La meilleure attaque est une bonne défense ! C’est ça, mon style !",
      2: "Viens étudier les pierres avec moi la prochaine fois pour mieux apprendre à les combattre !",
      3: "Hah, tous mes voyages entre les régions ont fini par payer !"
    }
  },
  "misty": {
    "encounter": {
      1: "Ma tactique est simple : attaquer encore et encore avec des Pokémon Eau !",
      2: "Attention, je vais te montrer la force de mes Pokémon aquatiques !",
      3: `Mon rêve était de partir en voyage et d'affronter de puissants entraîneurs...
         $Est-ce que tu seras à la hauteur ?`
    },
    "victory": {
      1: "T'es pas mal, dis donc... Je dois bien l'admettre.",
      2: "Grrr... C'était juste un coup de chance, tu le sais ?!",
      3: "Wow, tu es trop fort ! J'arrive pas à croire que tu m'as battue !"
    },
    "defeat": {
      1: "Qu'en dis-tu ? C'est ça, la puissance des Pokémon Eau !",
      2: "J'espère que t'as vu les techniques de nage élégantes de mes Pokémon !",
      3: "Tes Pokémon n'étaient pas à la hauteur !"
    }
  },
  "lt_surge": {
    "encounter": {
      1: "Mes Pokémon de électricité saved me pendant la guerre ! Tu vas voir !",
      2: "Attention ! Compte tes dents, tu vas morfler !",
      3: "Je vais te shock comme un soldat enemy !"
    },
    "victory": {
      1: "Wow ! Ton équipe est le real deal, gamin !",
      2: "Tu es very costaud ! Même mes tricks électriques sont à plat.",
      3: "C’était une défaite absolument shocking !"
    },
    "defeat": {
      1: "Oh yeah ! Quand on parle de Pokémon Électrik, je suis le number one !",
      2: "Hahaha ! C’était une battle électrisante, gamin !",
      3: "Une battle de Pokémon, c’est comme la war, et je t’ai montré le battle en personne !"
    }
  },
  "erika": {
    "encounter": {
      1: "Le temps est admirable, aujourd’hui...\nOh, tu veux te battre ? Très bien.",
      2: "Je me suis entraînée à la fois en dressage et en arrangement floral. En garde !",
      3: "Oh, j’espère que l’arome agréable de mes Pokémon ne vont pas m’endormir...",
      4: "Voir des fleurs dans un jardin est tellement apaisant."
    },
    "victory": {
      1: "Oh ! J’admets ma défaite.",
      2: "Ce match était des plus délicieux.",
      3 : "Ah, il semblerait que ce soit ma perte...",
      4 : "Oh mon Dieu."
    },
    "defeat": {
      1: "J’ai failli m’endormir...",
      2: "Quel bonheur que de vaincre avec ses petits Pokémon adorés.",
      3: "Ce combat était une belle expérience.",
      4: "Oh... C’est tout ?"
    }
  },
  "janine": {
    "encounter": {
      1: "Je maîtrise l'art des attaques empoisonnées. Tu seras mon partenaire d'entraînement !",
      2: "Mon petit papa est certain que je puisse me débrouiller seule. Je lui donnerai raison !",
      3: "Mes techniques ninja sont presque égales à celles de mon père !"
 },
    "victory": {
      1: "Même maintenant, j'ai encore besoin d'entraînement... Je comprends.",
      2: "Ta technique de combat a surpassé la mienne.",
      3: "Je vais vraiment m'appliquer et améliorer mes compétences."
 },
    "defeat": {
      1: "Hahaha... le poison a sapé toutes tes forces pour combattre.",
      2: "Ha ! Tu n'avais aucune chance face à mes techniques ninja supérieures !",
      3: "Mon père a eu raison de me faire confiance."
    }
  },
  "sabrina": {
    "encounter": {
      1: "J’avais prédit ton arrivée, grâce à mes pouvoirs psychiques !",
      2: "Je n’aime pas les combats, mais si tu insistes, je vais te montrer mes pouvoirs !",
      3: "Je sens en toi une grande ambition. Voyons si ce n’est pas infondé."
    },
    "victory": {
      1: "Quelle puissance... ! C’est bien plus que ce que j’avais prévu.",
      2: "Ta puissance dépasse mes pouvoirs de prescience.",
      3: "Même avec mes immenses pouvoirs psychiques, je ne peux pas sentir un être aussi fort que toi."
    },
    "defeat": {
      1: "Cette victoire... C’est exactement ce que j’avais prédit.",
      2: "Peut-être que ce grand désir que j’ai ressenti provenait de quelqu’un d’autre...",
      3: "Perfectionne tes capacités avant de te lancer imprudemment dans la bataille. On ne sait jamais ce que l’avenir peut nous réserver..."
    }
  },
  "blaine": {
    "encounter": {
      1: "Yohoho ! J’espère que tu as de l’Anti-Brûle !",
      2: "Mes Pokémon flamboyants vont te réduire en cendres !",
      3: "Prépare-toi à jouer avec le feu !"
    },
    "victory": {
      1: "Bravo ! Je suis en cendres...",
      2: "Mais comment donc ?! Pourtant, question motivation, j’étais au taquet !",
      3: "Woho... hohoho... J’ai cramé tout ce que j’avais. Mais tu as renforcé ma volonté de feu !"
    },
    "defeat": {
      1: "Wohoho ! Fait chaud, hein?",
      2: "Wohoho ! La fièvre de ce combat va rendre mes Pokémon encore plus forts !",
      3: "Yohoho ! Notre détermination est sans faille !"
    }
  },
  "giovanni": {
    "encounter": {
      1: "Moi, le leader de la Team Rocket, je vais te faire ressentir un monde de douleur !",
      2: "Cet entraînement sera vital avant de devoir faire face à nouveau à mes sbires.",
      3: "Je ne crois pas que tu sois préparé à l’échec que tu t’apprêtes à vivre !"
    },
    "victory": {
      1: "Quoi ! Damnation ! Il n’y a plus rien à dire !",
      2: "Hmph... Tu ne pourras jamais comprendre ce que j’espère réaliser.",
      3: "Cette défaite ne fait que retarder l’inévitable. Je ferai renaître la Team Rocket de ses cendres en temps voulu."
    },
    "defeat": {
      1: "Ne pas pouvoir mesurer sa propre force montre que tu n’es encore qu’un gosse.",
      2: "Essaye de ne plus me gêner.",
      3: "J’espère que tu comprends à quel point c’était stupide de me défier."
    }
  },
  //johto 2g
  "falkner": {
    "encounter": {
      1: "Tu vas subir les terribles attaques de mes Pokémon volants !",
      2: "Allez, que le vent se lève !",
      3: "Papa, regarde ce combat !"
    },
    "victory": {
      1: "C’est compris... Il est temps de redescendre sur terre.",
      2: "Une défaite est une défaite. En effet, tu es fort.",
      3: "... Zut de flûte ! Très bien, j’ai perdu."
    },
    "defeat": {
      1: "Papa... Avec les Pokémon que tu chérissais tant, j’ai remporté une magnifique victoire !",
      2: "Tu as compris la puissance des Pokémon Oiseaux ?",
      3: "J’ai l’impression de rattraper mon père !"
    }
  },
  "bugsy": {
    "encounter": {
      1: "Moi, c’est Hector ! Personne ne connait mieux les Pokémon Insecte que moi !"
    },
    "victory": {
      1: "Wah, Ça alors ! Tu connais vraiment bien les Pokémon ! Ah, j’ai encore beaucoup à apprendre ! OK, tu as gagné."
    },
    "defeat": {
      1: "Merci! Grâce à toi, j’ai pu avancer dans mes recherches !"
    }
  },
  "whitney": {
    "encounter": {
      1: "Hé ! Tu trouves pas que les Pokémon sont, genre trop mimis ?"
    },
    "victory": {
      1: "Mais euh ! OUIN !!! NON ! T’as pas le droit !"
    },
    "defeat": {
      1: "Trop fastoche !"
    }
  },
  "morty": {
    "encounter": {
      1: `Je poursuis mon apprentissage pour un jour rencontrer un Pokémon sacré entre tous.
         $Tu vas m’aider à m’entraîner !`,
      2: `On dit qu’un Pokémon légendaire apparaîtra face à un Dresseur d’exception.
         $Je crois à ce récit, et dans ce but, je m’entraîne ici depuis ma naissance.
         $C’est ainsi que je peux voir ce que les autres ne voient pas.
         $Je sais qui pourra faire venir le Pokémon de la légende... C’est moi, je suis l’élu !
         $Et toi, tu vas m’aider à m’améliorer ici et maintenant !`,
      3: "Que tu choisis d’y croire ou non, les pouvoirs mystiques existent.",
      4: "Sois témoin des fruits de ma formation.",
      5: "Ton âme ne doit faire qu’une avec celle des Pokémon. En es-tu capable ?",
      6: "Combattre des Dresseurs surpuissants, ça fait partie de mon apprentissage. Tu vas me donner un coup de main !"
    },
    "victory": {
      1: "Je ne suis pas encore assez bon...",
      2: `Je vois... Ton périple t’a conduit dans des endroits lointains et tu as été témoin de bien plus de choses que moi.
         $Je t’envie pour cela...`,
      3: "Comment expliquer cela...",
      4: "En puissance pure, je ne devais pas être tellement loin derrière... Mais tu as quelque chose de plus...",
      5: "Il me faut plus d’entraînement.",
      6: "C’est dommage..."
    },
    "defeat": {
      1: "Encore un grand pas de fait sur la voie de l’apprentissage !",
      2: "Hahaha...",
      3: "Mon entraînement a porté ses fruits !",
      4: "J’ai vu quelque chose... Comme une vision.",
      5: "Victoire !",
      6: "Je savais que j’allais gagner !"
    }
  },
  "chuck": {
    "encounter": {
      1: "Hah ! Tu veux m’affronter ? Tu es courageux ou juste stupide ?"
    },
    "victory": {
      1: "T’es balèze ! Je me suis bien amusé avec toi !"
    },
    "defeat": {
      1: "Tu ferais mieux de retourner t’entraîner... 24 heures sur 24 s’il le faut !"
    }
  },
  "jasmine": {
    "encounter": {
      1: "Oh... Tes Pokémon sont impressionnants. Je pense que ce combat va être intéressant."
    },
    "victory": {
      1: "Tu es vraiment fort. Je vais devoir faire beaucoup plus d’efforts, moi aussi."
    },
    "defeat": {
      1: "Je ne m’attendais pas à gagner."
    }
  },
  "pryce": {
    "encounter": {
      1: "La jeunesse seule ne garantit pas la victoire ! C’est l’expérience qui compte."
    },
    "victory": {
      1: "Exceptionnel ! C’était parfait. Essaye de ne pas oublier ce sentiment."
    },
    "defeat": {
      1: "Exactement comme je l’imaginais."
    }
  },
  "clair": {
    "encounter": {
      1: "Sais-tu qui je suis ? Et tu oses malgré tout me défier ?"
    },
    "victory": {
      1: "Je me demande jusqu’où tu peux aller avec ton niveau. Ça devrait être fascinant."
    },
    "defeat": {
      1: "... C’en est fini."
    }
  },
  
  //hoenn 3g
  "roxanne": {
    "encounter": {
      1: "Tu voudrais bien me faire voir comment tu te bats ?",
      2: "Plus on rencontre de Dresseurs, plus on fait de combats... et plus on apprend !",
      3: "Oh, j’étais en train d’élaborer une stratégie. Voudrais-tu te battre avec moi ?"
    },
    "victory": {
      1: "Bon... J’ai perdu... Je comprends.",
      2: "Apparemment, j’ai encore bien des choses à apprendre...",
      3: "Je prendrai à cœur ce que j’ai appris ici aujourd’hui."
    },
    "defeat": {
      1: "J’ai appris beaucoup de choses grâce à ce combat.",
      2: "J’ai hâte de t’affronter à nouveau. J’espère que tu utiliseras ce que tu as appris ici.",
      3: "J’ai gagné grâce à tout ce que j’ai appris jusqu’ici."
    }
  },
  "brawly": {
    "encounter": {
      1: "Alors, tu veux me défier ? Voyons donc de quoi tu es capable !",
      2: "Voyons si tu as ce qu’il faut pour chevaucher les vagues déferlantes !",
      3: "Je m’entraîne dans les brisants et les cavernes sous-marines. Voyons si tu es à la hauteur !"
    },
    "victory": {
      1: "Waouh... Je ne m’attendais pas à une telle déferlante !",
      2: "Tu as surfé sur ma vague et tu m’as écrasé !",
      3: "J’ai l’impression d’être perdu dans la Grotte Granite !"
    },
    "defeat": {
      1: "Cool, j’ai pris la vague à la perfection !",
      2: "Reviens surfer avec moi quand tu veux !",
      3: "Tout comme les marées montent et descendent, j’espère que tu reviendras pour me défier à nouveau."
    }
  },
  "wattson": {
    "encounter": {
      1: "Hahahaha !\nCa va faire des étincelles !",
      2: "Hahahaha !\nJe vais t’électriser !",
      3: "Hahahaha !\nJ’espère que t’as de l’Anti-Para !"
    },
    "victory": {
      1: "Ouaaaaaouh !\nJ’ai perdu! Tu m’as électrisé !",
      2: "Ouaaaaaouh !\nMe voilà à terre !",
      3: "Ouaaaaaouh !\nUn talent pareil, ça me met de bonne humeur !"
    },
    "defeat": {
      1: "Hahahaha !\nRecharge mes batteries et reviens m’affronter !",
      2: "Hahahaha !\nJ’espère que tu as trouvé notre combat électrisant !",
      3: "Hahahaha !\nT’as eu des frissons, hein ?"
    }
  },
  "flannery": {
    "encounter": {
      1: "Bienvenue... Heu, non, attends.\nJe vais t’incendier !",
      2: "Je ne suis pas Championne depuis très longtemps,\nmais ne me sous-estime pas !",
      3: "Je vais te montrer les techniques que mon papy m’a appris ! Battons-nous !"
    },
    "victory": {
      1: "Tu me rapelles mon papy...\nPas étonnant que j’ai perdu.",
      2: "Zut, on dirait que j’ai encore voulu forcer mes coups...",
      3: "Perdre ne va pas m’étouffer.\nJe vais continuer à m’entraîner !"
    },
    "defeat": {
      1: "J’espère que j’ai rendu mon papy fier...\nBattons-nous à nouveau, un jour",
      2: "J’ai pu gagner à ma façon, en restant moi-même.\nÇa veut dire que j’ai grandi !",
      3: "J’espère qu’on pourra se réaffronter à nouveau !"
    }
  },
  "norman": {
    "encounter": {
      1: "Je suis surpris que tu aies réussi à arriver ici.\nBattons-nous.",
      2: "Je ferai tout ce qui est en mon pouvoir en tant que Champion pour gagner.\nC’est parti !",
      3: "Je donne toujours mon maximum.\nJ’espère que tu en feras autant."
    },
    "victory": {
      1: "J’ai perdu contre toi... ?\nMais les règles sont les règles.",
      2: "Est-ce que quitter Oliville était une erreur... ?",
      3: "Je n’arrive pas à y croire.\nC’était un match formidable."
    },
    "defeat": {
      1: "C’était un beau combat,\nnous avons tous les deux fait notre maximum !",
      2: "Tu devrais plutôt essayer de défier ma fille.\nTu pourrais apprendre quelque chose !",
      3: "Merci pour ce combat.\nTu auras plus de chance la prochaine fois."
    }
  },
  "winona": {
    "encounter": {
      1: "Je sillonne le ciel à la recherche d’une proie...\nEt je l’ai trouvée !",
      2: "Aussi difficile que soit le duel, je m’en sors toujours avec élégance. Battons-nous !",
      3: "J’espère que tu n’as pas le vertige !\nPrépare-toi à l’ascension !"
    },
    "victory": {
      1: "Je n’avais encore jamais vu de Dresseur commander ses Pokémon avec autant de grâce que moi.",
      2: "Oh, mes Pokémon Oiseaux ont chuté !\nTrès bien.",
      3: "Même si je suis tombée, mes Pokémon continueront à voler !"
    },
    "defeat": {
      1: "Mes Pokémon Oiseaux et moi danserons toujours avec grâce !",
      2: "J’espère que tu as apprécié notre spectacle.\nNotre danse gracieuse est terminée.",
      3: "Reviendras-tu voir notre élégante chorégraphie ?"
    }
  },
  "tate": {
    "encounter": {
      1: "Héhéhé...\nSurpris de me voir sans ma sœur ?",
      2: "Je sais ce que tu penses...\nTu veux te battre !",
      3: "Comment vaincre quelqu’un...\nQui connaît chacun de tes mouvements ?"
    },
    "victory": {
      1: "On n’y peut rien...\nTatia me manque...",
      2: "Ton lien avec tes Pokémon était bien plus fort que le mien...",
      3: "Si j’étais avec Tatia, nous aurions gagné.\nOn arrive à communiquer par la pensée !"
    },
    "defeat": {
      1: "Mes combinaisons ont eu raison de toi !",
      2: "Si tu ne peux pas me vaincre, tu ne pourras jamais non plus vaincre Tatia.",
      3: "Tout cela grâce à mon entraînement strict avec Tatia.\nJe peut atteindre une parfaite harmonie avec mes Pokémon."
    }
  },
  "liza": {
    "encounter": {
      1: "Hihihi...\nTu es surpris de me voir sans mon frère ?",
      2: "Je vois ce que tu désires...\nTu veux te battre, n’est-ce pas ?",
      3: "Comment vaincre quelqu’un...\nQui ne fait qu’un avec ses Pokémon ?"
    },
    "victory": {
      1: "On n’y peut rien...\nLévy me manque...",
      2: "Ton lien avec tes Pokémon...\Il est plus fort que le mien...",
      3: "Si j’étais avec Lévy, on aurait gagné.\nOn arrive à communiquer par la pensée !"
    },
    "defeat": {
      1: "Mes combinaisons ont eu raison de toi !",
      2: "Si tu ne peux pas me vaincre, tu n’arriveras pas non plus à vaincre Lévy.",
      3: "C’est grâce à mon entraînement strict avec Lévy.\nJe peux atteindre une parfaite harmonie avec mes Pokémon."
    }
  },
  "juan": {
    "encounter": {
      1: "Ah, il n’est plus le temps d’être timide.\nPrépare-toi !",
      2: "Tes yeux vont se repaître des illusions aquatiques de mes Pokémon !",
      3: "Un typhon approche !\nSauras-tu y résister ?",
      4: `Prépare-toi à assister à une véritable démonstration de talent.
         $Une œuvre sur le thème de l’eau composée par mes Pokémon et moi.`
    },
    "victory": {
      1: "Tu es peut-être un génie capable de tenir tête à Marc !",
      2: "Je me suis concentré sur l’élégance pendant que tu t’entraînais. C’est tout naturellement que tu m’as vaincu.",
      3: "Ha ha ha !\nTrès bien, tu as gagné, cette fois.",
      4: "De toi, je sens l’éclat brillant d’une habileté qui vaincra tout."
    },
    "defeat": {
      1: "Mes Pokémon et moi avons sculpté une illusion d’eau et en sommes sortis victorieux.",
      2: "Ha ha ha, la victoire est mienne et tu as perdu.",
      3: "Dois-je te prêter ma tenue ? Cela pourrait t’aider à te battre !\nHa ha ha! Je plaisante !",
      4: "Le dandysme, c’est un art de vivre !\nCe que j’aime, c’est gagner avec élégance..."
    }
  },
  //sinnoh 4g
  "roark": {
    "encounter": {
      1: "J’ai besoin de voir ton potentiel en tant que Dresseur. Et j’ai besoin de voir la robustesse des Pokémon qui combattent avec toi !",
      2: "Voici mes Pokémon Roche ! J’en suis super fier !",
      3: "Je ne suis qu’un Dresseur combattant fièrement avec des Pokémon Roche !",
      4: "Jour après jour, je creuse pour trouver des fossiles, et j’entraîne mes Pokémon. Tu vas voir comme ils sont géniaux !"
    },
    "victory": {
      1: "Quoi ? Impossible ! Mes Pokémon Roche, entraînés si dur !",
      2: "J’ai perdu ? Bon, je vais aller me consoler en cherchant des fossiles dans les sous-sols de Sinnoh.",
      3: "Avec un talent comme le tien, c’est normal que tu gagnes.",
      4: "Comment ? Impossible ! Mes Pokémon étaient prêts !",
      5: "J’ai perdu."
    },
    "defeat": {
      1: "Alors ? Ils sont géniaux, mes Pokémon Roche, n’est-ce pas ?",
      2: "Merci ! Avec cette victoire, je sens que je suis assez fort pour défier mon papa !",
      3: "J’ai l’impression d’avoir fracassé un rocher vraiment tenace !"
    }
  },
  "gardenia": {
    "encounter": {
      1: "Tu as l’aura d’un as. Enfin, ce combat s’annonce amusant. En garde !"
    },
    "victory": {
      1: "Incroyable ! Tu as beaucoup de talent !"
    },
    "defeat": {
      1: "On a vraiment assuré, mes Pokémon et moi !"
    }
  },
  "maylene": {
    "encounter": {
      1: `Je prends le combat très au sérieux et je fais toujours de mon mieux !
         $Allez, c’est quand tu veux !`
    },
    "victory": {
      1: "Je dois admettre ma défaite..."
    },
    "defeat": {
      1: "C’était génial."
    }
  },
  "crasher_wake": {
    "encounter": {
      1: "Tu as l’honneur de t’adresser au grand Lovis le Teigneux !\nTu vas boire la tasse !",
      2: "Mes Pokémon encaisseront toutes tes attaques, sans exception, et te feront boire la tasse !",
      3: "Le ring, c’est mon océan ! Sur les flots déchaînés, monde flottant ! C’est moi, LO-VIS ! LO-VIS !!"
    },
    "victory": {
      1: "Har, har, har ! C’était un régal ! Merci pour ce combat !",
      2: "Ouah ! La tension est retombée ! Comment dire... ? J’en veux encore ! Je voulais continuer à me battre !",
      3: "QUOOOOI ?!"
    },
    "defeat": {
      1: "Ouaaaais ! ",
      2: "J’ai gagné... mais j’en veux encore !\nJe voulais continuer à me battre !",
      3: "À un de ces jours !"
    }
  },
  "fantina": {
    "encounter": {
      1: `Toi et moi, c’est challenge !
         $Je vais gagner, because je suis Champion d’Arène d’Unionpolis.`
    },
    "victory": {
      1: "Tu es tellement powerful. Je perdu, sans aucun doubt."
    },
    "defeat": {
      1: "Tu es powerful, darling... Mais c’est moi qui ai la victory !"
    }
  },
  "byron": {
    "encounter": {
      1: `Tu es un bien jeune Dresseur, comme mon fils Pierrick !
         $Je crois, vois-tu, que les jeunes sont la clé d’un avenir radieux pour les Pokémon !
         $Moi, Charles, le protecteur des jeunes Dresseurs et du futur des Pokémon... aurai donc le plaisir de t’affronter !`
    },
    "victory": {
      1: "Hum ! Mes robustes Pokémon, anéantis ?!"
    },
    "defeat": {
      1: "Gwahaha ! Alors, qu’en dis-tu ? Ne sont-ils pas robustes, mes Pokémon ?!"
    }
  },
  "candice": {
    "encounter": {
      1: `Tu veux me défier ? Bien sûr ! J’attendais un Dresseur coriace !$
      Laisse-moi te dire une chose, je tire ma force de ma concentration.`,
      2: `Les Pokémon, la mode, l’amour... C’est une question de concentration !
         $Je vais t’en faire la démonstration. Tu peux numéroter tes abattis !`
    },
    "victory": {
      1: "Je me suis prise de sympathie pour toi ! Il se pourrait même que je t’admire...",
      2: `Waouh ! Tu es fantastique ! Tu viens de gagner mon respect !
         $Je suis stupéfaite par ta concentration et ta volonté.`
    },
    "defeat": {
      1: "J’ai bien senti ta concentration, mais... Elle n’a pas suffi pour me battre !",
      2: "On est super concentrés, hein, mes Pokémon et moi !"
    }
  },
  "volkner": {
    "encounter": {
      1: "J’aimerais que tu m’aides à retrouver le plaisir des combats de Pokémon ! Mets-m’en plein la vue !"
    },
    "victory": {
      1: `Tu m’as battu...
         $Cette volonté et la manière noble dont tes Pokémon ont combattu pour toi...
         $J’en ai eu des frissons tout le long ! C’était un très beau combat.`
    },
    "defeat": {
      1: "Ce combat m’a laissé de glace... alors que je voulais retrouver la flamme !"
    }
  },
  //unys 5g
  "chili": {
    "encounter": {
      1: "Ouais ! Ouais ! Tu vas t’fritter avec le plus fort de la fratrie !",
      2: "C’est moi, Armando, j’vais t’exploser avec mes Pokémon !",
      3: "J’vais te cramer la tête avec mes Pokémon !"
    },
    "victory": {
      1: "Mince... Me v’là cramé !",
      2: "Pfiou... T’es vraiment à fond !",
      3: "J’me suis fait cramer !"
    },
    "defeat": {
      1: "Ça chauffe, ça brûle ! Je suis tout feu tout flamme !",
      2: "Quand tu joues avec le feu, tu t’brûles !",
      3: "T’inquiète, c’était écrit d’avance. Fallait pas tomber sur moi, c’est tout !"
    }
  },
  "cilan": {
    "encounter": {
      1: `Rien de personnel... Pas de rancune... Moi et mes Pokémon Plante allons..
         $Euh... Nous allons nous battre... coûte que coûte.`,
      2: "Donc... Si ça ne te dérange pas... Je serai... ton adversaire.",
      3: "Très bien... Je suis Rachid. J’aime... le type Plante."
    },
    "victory": {
      1: "Oh... Donc c’est fini ?",
      2: `... Quelle surprise. Tu es... très fort, n’est-ce pas ?
         $J’imagine que mes frères... n’auraient pas été capables... de te vaincre non plus...`,
      3: "Le timing... la synchronisation, là... C’est pas encore ça..."
    },
    "defeat": {
      1: "Hein ? ... J’ai gagné ?",
      2: `Je suppose que...
         $J’ai gagné... parce que je m’entraîne... avec mes frères Armando et Noa... et nous avons tous pu devenir plus forts.`,
      3: "C’était... une expérience assez passionnante..."
    }
  },
  "cress": {
    "encounter": {
      1: "Excellent ! Moi, Noa, grand amateur du type Eau, vais avoir le plaisir de t’affronter !"
    },
    "victory": {
      1: "Moi ? Perdre ? Je n’y crois pas."
    },
    "defeat": {
      1: "Tu affrontais Noa. C’est donc le plus logique des résultats."
    }
  },
  "cheren": {
    "encounter": {
      1: "Tu me rappelles un vieil ami. Cela m’enthousiasme pour ce combat !",
      2: `Veux-tu simplement montrer ta force ou comprendre l’essence du combat ?
         $Les combats de Pokémon n’ont aucun sens si l’on ne réfléchit pas à cela.`,
      3: "Je m’appelle Tcheren. Je suis Champion d’Arène et professeur à Pavonnay. Ravi de te rencontrer !"
    },
    "victory": {
      1: "Merci ! J’ai vu ce qui manquait en moi.",
      2: "Merci ! Tu m’as montré la voie... pour me rapprocher de mon idéal.",
      3: "Hmm... C’est problématique."
    },
    "defeat": {
      1: "En tant que Champion d’Arène, mon objectif est d’être un mur à surmonter.",
      2: "Très bien !",
      3: `Toi et moi, comme tous les Dresseurs, nous avons les Pokémon à nos côtés !
         $C’est cela qui nous fait avancer. Ils nous accompagnent et nous donnent la force d'y croire.`
    }
  },
  "lenora": {
    "encounter": {
      1: "Ta façon de te battre va me permettre de déterminer si tu as entraîné tes Pokémon avec amour !"
    },
    "victory": {
      1: `Mes hypothèses étaient justes, tu as autant de talent que je le pensais !
         $C’est un plaisir d’avoir fait ta connaissance !`
    },
    "defeat": {
      1: "Hahaha ! Maintenant, il faut que tu analyses ta défaite pour qu’elle te serve par la suite !"
    }
  },
  "roxie": {
    "encounter": {
      1: "Let’s rock ! Ca va twister dans ta p’tite tête !"
    },
    "victory": {
      1: "Tu déchires ! C’est toi qui m’as twisté la tête !"
    },
    "defeat": {
      1: "Non ! Ça ne va pas du tout ! Tu ne te lâches pas assez !"
    }
  },
  "burgh": {
    "encounter": {
      1: `Hmm... Si je gagne ce combat, cela me donnera l’inspiration pour un tableau d’un tout nouveau style.
         $Les combats, il n’y a rien de mieux pour stimuler l’imagination. Allons ! La postérité nous attend !`,
      2: `Sois en sûr, je suis fier de chacun de mes Pokémon !
         $Allons ! Que ce combat soit digne de mes plus grands chefs-d’œuvre !`
    },
    "victory": {
      1: "Hélas, ma muse, j’ai perdu... Je ne pouvais que céder face à tant de force !",
      2: "Quel final ! J’en suis émerveillé !"
    },
    "defeat": {
      1: "Quelle... quelle stupéfiante beauté ! C’était... magnifique!",
      2: `Parfois, on parle de victoire peu reluisante.
         $Mais chaque méthode de combat a sa beauté, du moment que l’on fait de son mieux.`
    }
  },
  "elesa": {
    "encounter": {
      1: `Rien que de penser à ce futur combat, ça me fait des étincelles partout !
         $Je veux cette sensation et pour ça, je suis prête à te faire tourner la tête !`
    },
    "victory": {
      1: "Je voulais te donner le vertige, mais c’est toi qui m’as fait vibrer."
    },
    "defeat": {
      1: "Ça ne me suffit pas... La prochaine fois, j’espère que tu donneras tout ce que tu as."
    }
  },
  "clay": {
    "encounter": {
      1: "Vindiou ! T’en as mis du temps, tu sais ? C’est le moment de voir c’que t’as dans le ventre !"
    },
    "victory": {
      1: "Vindiou ! Ça fait drôle de perdre, quand on se donne à fond !"
    },
    "defeat": {
      1: `C’qui compte, c’est c’que tu fais d’tes défaites.
          $Ceux qui savent s’en servir pour grandir, c’est eux qu’sont les plus forts !`
    }
  },
  "skyla": {
    "encounter": {
      1: `Les combats Pokémon, c’est le top, n’est-ce pas ?
          $Les sommets, j’adore ça... D’en haut, on peut voir tellement loin.
          $Allez, toi et moi, on va bien s’amuser !`
    },
    "victory": {
      1: "Grâce à toi, je sens que je suis devenue plus forte... Merci !"
    },
    "defeat": {
      1: "Qu’on gagne ou qu’on perde, il y a toujours à apprendre d’un combat."
    }
  },
  "brycen": {
    "encounter": {
      1: `Vivre parmi les humains et les Pokémon ouvre la voie vers la puissance.
          $Montre-moi ce qu’il en est de toi !`
    },
    "victory": {
      1: "Quelle combinaison magnifique vous faites, toi et tes Pokémon. Quelle belle amitié !"
    },
    "defeat": {
      1: "Se battre... jusqu’au bout ! Tenter le diable ! Endurer et grandir !"
    }
  },
  "drayden": {
    "encounter": {
      1: `Je cherche de jeunes Dresseurs capables d’incarner un avenir radieux.
          $Il me faut donc voir ce que tu vaux : pour ce faire, mon expérience et mon amour pour les Pokémon ne seront pas de trop !`
    },
    "victory": {
      1: "Cette ardeur que je ressens dans la défaite, comment l’exprimer... ?"
    },
    "defeat": {
      1: "Voyons ! Je pense que tu vaux bien mieux que ça !"
    }
  },
  "marlon": {
    "encounter": {
      1: "T’as l’air balèze, toi. Allez, on démarre ?",
      2: "La mer est vaste et profonde, comme ma puissance, en fait. Tu vas en rester baba.",
      3: "Waaah... C’est toi, mon adversaire ? Cool... On va se faire un match de dingos !"
    },
    "victory": {
      1: "T’es balèze comme un océan en furie, et cool comme une mer d’huile...",
      2: "T’as pas juste l’air balèze, tu l’es vraiment, en fait. J’en reste baba !",
      3: "Tu étais comme un vrai tourbillon qui aspire tout !"
    },
    "defeat": {
      1: "T’es balèze, mais pas assez pour refouler la marée !",
      2: "Hop ! On dirait que j’ai encore gagné !",
      3: "Super, à moi la victoire !"
    }
  },
  //kalos 6g
  "viola": {
    "encounter": {
      1: `Qu’il s’agisse des larmes de la défaite ou de la joie de la victoire...
          $ Tous les sujets méritent d’être immortalisés par mon appareil, du moment qu’ils expriment quelque chose de fort.
          $Tu feras un sujet sensationnel ! Oui, oui !`,
      2: "J’ai toujours l’œil rivé sur mon objectif ... et sur la victoire !"
    },
    "victory": {
      1: "Tu m’as battu en beauté ! Fantastique ! Vraiment fantastique !",
      2: `Il y a des choses qu’on ne commence à voir qu’après les avoir remarquées à travers le viseur !
          $De la même façon, il y a certaines choses auxquelles on ne fait attention qu’en vivant avec les Pokémon.`
    },
    "defeat": {
      1: "Le cliché de ma victoire sera un instantané d’éternité !",
      2: "Oui ! J’ai pris de superbes photos !"
    }
  },
  "grant": {
    "encounter": {
      1: `Je n’ai qu’un seul souhait :
          $Du haut de chaque sommet conquis, pouvoir contempler le prochain qui m’attend.`
    },
    "victory": {
      1: "Une nouvelle paroi se dresse devant moi... Et cette fois, c’est de toi qu’il s’agit."
    },
    "defeat": {
      1: "Il ne faut jamais abandonner. C’est aussi simple que ça.",
    }
  },
  "korrina": {
    "encounter": {
      1: "En piste avec Cornélia !"
    },
    "victory": {
      1: "Les Pokémon évoluent parce que TU es là !"
    },
    "defeat": {
      1: "Quel combat explosif !"
    }
  },
  "ramos": {
    "encounter": {
      1: "Tu es prêt pour ta coupe de printemps, Maître en herbe ? Hé hé !"
    },
    "victory": {
      1: "Ton équipe a foi en toi, et tu as toute confiance en elle... Ce combat m’a comblé !"
    },
    "defeat": {
      1: "Ha ha ha ! Quand je dis que mes petites plantes peuvent percer l’asphalte !"
    }
  },
  "clemont": {
    "encounter": {
      1: "Alors, Dresseur, tu es prêt ? Il va falloir donner le meilleur de nous-mêmes !"
    },
    "victory": {
      1: "Rien de tel qu’observer les plus grands pour apprendre un maximum ! Merci de la leçon."
    },
    "defeat": {
      1: "Entraînomatron de Dresseurs : essai validé. On dirait qu’il fonctionne sans problème."
    }
  },
  "valerie": {
    "encounter": {
      1: `Bonjour, mon petit. Alors, on a réussi à arriver jusqu’ici ? Bien.
          $Tu vas pouvoir goûter au chic de ma collection Pokémon, le fameux type Fée, façon Valériane.
          $Le thème de cette année : Douceur, Rondeurs et Vigueur.`
    },
    "victory": {
      1: "Quelle joie... Que demain t’apporte autant de sourires."
    },
    "defeat": {
      1: "Oh... Quelle tristesse."
    }
  },
  "olympia": {
    "encounter": {
      1: "Voici la Tradition ! Que le combat commence !"
    },
    "victory": {
      1: "Je sens... je SAIS ! Rien ne t’arrêtera. Ta force pourra même déplacer les étoiles !"
    },
    "defeat": {
      1: "Notre futur... Il est clair, à présent."
    }
  },
  "wulfric": {
    "encounter": {
      1: `Toutes ces histoires de combattre pour renforcer nos liens ou pour mieux s’comprendre...
          $Moi je dis, tout ça, c’est du blabla !
          $On se bat pour s’amuser ! Alors, sors ton équipe, et éclatons-nous !`
    },
    "victory": {
      1: "C’est bien ça, c’est bien ! C’est une bonne façon de briser la glace !"
    },
    "defeat": {
      1: "Lutte avec moi et voilà ce qui se passe !"
    }
  },
  //galar 8g
  "milo": {
    "encounter": {
      1: `Tu as de très bons instincts, en ce qui concerne les Pokémon.
          $Tu les comprends. Ce combat s’annonce serré !
          $Je vais devoir me donner à fond si je ne veux pas que tu me coupes l’herbe sous le pied !`
    },
    "victory": {
      1: "Mes Pokémon sont tout fanés... Tu as du talent, ça se voit !"
    },
    "defeat": {
      1: "Cela me laisse vraiment sous le choc..."
    }
  },
  "nessa": {
    "encounter": {
      1: "Peu importe le type de plan que tu es en train de comploter, mon partenaire et moi serons sûrs de le faire échouer.",
      2: "Je ne suis pas là pour discuter. Je suis là pour gagner !",
      3: "C’est un petit cadeau de mon Pokémon... J’espère que tu vas l’accepter !"
    },
    "victory": {
      1: "Toi et tes Pokémon êtes simplement trop forts...",
      2: "Comment... ? Comment est-ce possible ?!",
      3: "Tu as fait boire la tasse à tous les membres de mon équipe !"
    },
    "defeat": {
      1: "La vague déchaînée s’écrase à nouveau !",
      2: "Il est temps de surfer sur la vague de la victoire !",
      3: "Héhéhé !"
    }
  },
  "kabu": {
    "encounter": {
      1: `Laisse-moi te dire une chose sur les combats Pokémon : l’entraînement, ça ne fait pas tout.
          $Tout le monde peut s’entraîner. Mais il faut aussi être capable de tout donner au moment crucial.`
    },
    "victory": {
      1: "Ta victoire est méritée."
    },
    "defeat": {
      1: "C’est une excellente façon pour moi de constater mes progrès !"
    }
  },
  "bea": {
    "encounter": {
      1: `Dirais-tu que tu possèdes un esprit paré à toute épreuve ?
          $Laisse-moi donc en juger par moi-même.`
    },
    "victory": {
      1: "J’ai ressenti l’esprit combatif de tes Pokémon."
    },
    "defeat": {
      1: "C’était le meilleur match que l’on puisse espérer."
    }
  },
  "allister": {
    "encounter": {
      1: "... Je... je suis Alistair...\nBa... battons-nous."
    },
    "victory": {
      1: "Tu es... très fort...\nJ’ai failli... en perdre... mon masque..."
    },
    "defeat": {
      1: "J’ai... réussi... !"
    }
  },
  "opal": {
    "encounter": {
      1: "Voyons comment ton partenaire et toi résistez à la pression."
    },
    "victory": {
      1: "Tu manques un peu de féerie, mais tu te débrouilles plutôt bien !"
    },
    "defeat": {
      1: "Dommage pour toi, j’imagine."
    }
  },
  "bede": {
    "encounter": {
      1: "Laisse-moi te montrer en combat l’étendue du gouffre qui nous sépare."
    },
    "victory": {
      1: "Je vois... Bah. De toute façon, je n’étais même pas à fond."
    },
    "defeat": {
      1: "Pas mal, j’imagine."
    }
  },
  "gordie": {
    "encounter": {
      1: "Bon, finissons-en."
    },
    "victory": {
      1: "Moi qui pensais te vaincre sans problème... je tombe de haut."
    },
    "defeat": {
      1: "Bats-toi comme tu le fais toujours, la victoire suivra !"
    }
  },
  "melony": {
    "encounter": {
      1: "Je ne vais pas me retenir !",
      2: "Très bien, je suppose que nous devrions commencer.",
      3: "Il est temps pour toi de trembler de froid..."
    },
    "victory": {
      1: "Tu... Tu es plutôt fort, hein ?",
      2: "Si tu vois mon fils dans les parages, assure-toi de lui donner une bonne raclée, d’accord ?",
      3: "Quand je parlais de briser la glace, c’était juste une métaphore..."
    },
    "defeat": {
      1: "Alors, tu vois à quel point les combats peuvent être sévères ?",
      2: "Héhéhé ! On dirait que j’ai encore gagné !",
      3: "Est-ce que tu te retenais ?"
    }
  },
  "piers": {
    "encounter": {
      1: "Prépare-toi à un combat épique, avec moi et mon équipe ! Smashings, let’s rock !"
    },
    "victory": {
      1: "Au moins, on aura tout donné, mon groupe et moi. On se reverra..."
    },
    "defeat": {
      1: "J’ai la gorge fatiguée à force de crier... Mais c’était un combat passionnant !"
    }
  },
  "marnie": {
    "encounter": {
      1: `En vérité, quand j’en aurais fini... J’compte dev’nir Championne !
          $Donc ça n’a rien d’personnel quand j’dit que j’vais te remballer presto !`
    },
    "victory": {
      1: "OK, j’ai perdu... Mais j’ai pu voir les bons points d’toi et tes Pokémon."
    },
    "defeat": {
      1: "Alors, t’as apprécié mes techniques ?"
    }
  },
  "raihan": {
    "encounter": {
      1: "Je vais gagner ce combat, puis battre Tarak et prouver que la star de Galar, c’est moi !"
    },
    "victory": {
      1: `J’ai perdu mais je garde ma dignité.
          $Je prendrai un selfie en souvenir de ce jour...`
    },
    "defeat": {
      1: "Ah ouais, ça mérite un petit selfie pour fêter ça !"
    }
  },
  //paldea 9g
  "katy": {
    "encounter": {
      1: "Ne sous-estime pas mes Pokémon Insecte si tu ne veux pas que les tiens en \"pâtissent\" !"
    },
    "victory": {
      1: "Oh non, tous mes Pokémon sont au bout du rouleau à pâtisserie..."
    },
    "defeat": {
      1: "Et voilà, j’ai gagné !"
    }
  },
  "brassius": {
    "encounter": {
      1: "J’espère que tu es paré. Commençons... notre création !!!"
    },
    "victory": {
      1: "Quel avant-gardisme !!!"
    },
    "defeat": {
      1: "Il me faut étancher ma soif d’art !"
    }
  },
  "iono": {
    "encounter": {
      1: `Alors, comment tu te sens ?
         $Allez, on commence le stream ! Quelle est la puissance de notre challenger ? 
         $’Cune idée ! Découvrons-le ensemble !`,
    },
    "victory": {
      1: "T’es plus lumineux et foudroyant qu'un Giga-Tonnerre !"
    },
    "defeat": {
      1: "Oubliez pas de laisser un like et de vous abonner !"
    }
  },
  "kofu": {
    "encounter": {
      1: `L’eau des rivières va dans la mer, s’évapore dans les nuages, puis redevient de la pluie.
          $Moi, je suis aussi imprévisible qu’un torrent furieux ! Alors, essaie un peu de me résister !`
    },
    "victory": {
      1: "Mouah ha ha ! J’ai dégusté !"
    },
    "defeat": {
      1: "Reviens tenter ta chance quand tu veux !"
    }
  },
  "larry": {
    "encounter": {
      1: "Pourquoi tout compliquer inutilement ? Rien ne vaut la simplicité."
    },
    "victory": {
      1: "Hmpf... Tu m'as fait goûter à la défaite."
    },
    "defeat": {
      1: "Le combat est terminé."
    }
  },
  "ryme": {
    "encounter": {
      1: "T’es bien joli, p’tit challenger !\nDonne tout ce que t’as, vas-y, fais-moi peur !"
    },
    "victory": {
      1: "T’es grave cool, cousin, c’est dingue !\nJ’ai l’âme qui vibre à toute berzingue !"
    },
    "defeat": {
      1: "Laïm, out. Peace !"
    }
  },
  "tulip": {
    "encounter": {
      1: "Je vais user de mon talent pour rendre tes Pokémon encore plus resplendissants !"
    },
    "victory": {
      1: "Tu es plus tenace qu’un mascara waterproof !"
    },
    "defeat": {
      1: "Dans mon travail, les gens qui manquent de talent dans un domaine ou un autre disparaissent souvent rapidement et on n’en entend plus jamais parler."
    }
  },
  "grusha": {
    "encounter": {
      1: "Il suffit que je te congèle jusqu’au os, et tout ira bien."
    },
    "victory": {
      1: "La flamme qui brûle en toi... J’avoue qu’elle m’émeut quelque peu."
    },
    "defeat": {
      1: "Pas de chance."
    }
  },
  //conseil 4 kanto 1g
  "lorelei": {
    "encounter": {
      1: `Je suis la maîtresse incontestée des Pokémon Glace. Personne ne peut les vaincre.
          $Car ma foi, une fois gelée, ton équipe sera à ma merci ! C’est parti !`
    },
    "victory": {
      1: "Cela ne devait pas se passer ainsi !"
    },
    "defeat": {
      1: "Il n’y a rien que tu puisses faire une fois que tu es gelé."
    }
  },
  "bruno": {
    "encounter": {
      1: "Ton équipe, j’vais en faire du yaourt ! À table !"
    },
    "victory": {
      1: "Moi ? Perdre ? Pourquoi ?"
    },
    "defeat": {
      1: "Tu peux me défier autant que tu veux, mais le résultat ne changera jamais !"
    }
  },
  "agatha": {
    "encounter": {
      1: "La nature des Pokémon, c’est de combattre ! Je vais te montrer ce qu’est un vrai combat de Dresseurs !"
    },
    "victory": {
      1: "Oh ho ! Pas mal, tu as du talent !"
    },
    "defeat": {
      1: "Hin hin, voilà comment on fait !"
    }
  },
  "lance": {
    "encounter": {
      1: "Enfin... J’ai entendu parler de toi ! Permets-moi de mesurer tes compétences.",
      2: "Je suis Peter, le légendaire Dracologue. À nous deux !"
    },
    "victory": {
      1: "Tu m’as vaincu. Tu es magnifique !",
      2: "Incroyable ! Ça me fait mal de l’admettre, mais tu as un vrai talent pour les combats Pokémon."
    },
    "defeat": {
      1: "Je n’abandonne jamais. Toi non plus d’ailleurs ?",
      2: "Crois-moi, tu n’es pas faible. Ne laisse pas cette défaite te perturber."
    }
  },
  //conseil 4 johto 2g
  "will": {
    "encounter": {
      1: `J’ai parcouru le monde pour tout connaître sur les Pokémon de type Psy.
          $Je continue toujours à m’améliorer ! Je ne peux pas perdre maintenant !`
    },
    "victory": {
      1: "C’est... Incroyable..."
    },
    "defeat": {
      1: "Ta victoire était proche. Je me demande ce qu’il te manquait."
    }
  },
  "koga": {
    "encounter": {
      1: "Fwah ha ha ! Il est temps de t’apprendre que certains Pokémon ne peuvent pas être vaincus par la force pure !"
    },
    "victory": {
      1: "Hmmm... Tu es un honorable adversaire."
    },
    "defeat": {
      1: "As-tu appris à craindre mes techniques ninja ?"
    }
  },
  "karen": {
    "encounter": {
      1: "Je suis Marion. Tu veux te frotter à mes Pokémon de type Ténèbres ?",
      2: "Je ne suis pas comme ceux que tu as déjà rencontrés.",
      3: "Tu dois avoir une charmante équipe pour être arrivé jusqu’ici. Notre combat sera intéressant."
    },
    "victory": {
      1: "Non ! Je ne peux pas gagner. Comment peux-tu être aussi fort ?",
      2: "Je ne m’écarterai pas du chemin que j’ai choisi.",
      3: "Le Maître a hâte de te rencontrer."
    },
    "defeat": {
      1: "C’est à peu près ce à quoi je m’attendais.",
      2: "Eh bien, c’était amusant... relativement.",
      3: "Viens me rendre visite à tout moment."
    }
  },
  //conseil 4 hoenn 3g
  "sidney": {
    "encounter": {
      1: `T’as du courage de me regarder en face !
          $Je sens qu’on va bien s’amuser. Haha ! Bon !
          $Nous allons livrer un combat trépidant comme on ne peut en voir qu’ici !`
    },
    "victory": {
      1: "Allons bon, voilà que j’ai perdu ! Bah, l’important est d’avoir apprécié le combat."
    },
    "defeat": {
      1: "Pas de rancune, OK ?"
    }
  },
  "phoebe": {
    "encounter": {
      1: `Durant mon entraînement, j’ai appris à communier avec les Pokémon de type Spectre.
          $Oui, le lien que j’ai créé avec eux est très étroit.
          $Viens ! On verra si tu arrives à infliger des dégâts à mes Pokémon !`
    },
    "victory": {
      1: "Ça alors, tu m’as battue !"
    },
    "defeat": {
      1: "J’ai hâte de pouvoir t’affronter à nouveau !"
    }
  },
  "glacia": {
    "encounter": {
      1: `Je n’ai rencontré ici que des Dresseurs et des Pokémon frêles.
          $Et toi, mérites-tu le temps que je t’accorde ?
          $Ça me ferait extrêmement plaisir de pouvoir enfin utiliser toute ma puissance !`
    },
    "victory": {
      1: "L’affection qui te lie à tes Pokémon me fait fondre !"
    },
    "defeat": {
      1: "Une bataille acharnée et passionnée, en effet."
    }
  },
  "drake": {
    "encounter": {
      1: `Combattre en s’alliant avec les Pokémon, tu sais ce que ça représente ? Tu sais ce qu’il faut pour y parvenir ?
          $Si tu ne le sais pas, alors tu ne pourras jamais me vaincre !`
    },
    "victory": {
      1: "Superbe ! Je n’ai rien à ajouter !"
    },
    "defeat": {
      1: "J’ai donné tout ce que j’avais dans ce combat !"
    }
  },
  //conseil 4 sinnoh 4g
  "aaron": {
    "encounter": {
      1: `Si je me bats ici, c’est pour devenir parfait, comme les Pokémon Insecte !
          $Alors que le duel commence !`
    },
    "victory": {
      1: "J’accepte ma défaite."
    },
    "defeat": {
      1: "La victoire en Ligue Pokémon n’est pas si facile."
    }
  },
  "bertha": {
    "encounter": {
      1: `Ma spécialité, c’est les Pokémon de type Sol.
          $Et si tu montrais à une vieille dame ce dont la nouvelle garde est capable ?`
    },
    "victory": {
      1: "Eh bien ! Mon chou, je dois dire que je suis impressionnée."
    },
    "defeat": {
      1: "Ha ha ha ! On dirait que c’est l’ancienne génération qui l’emporte !"
    }
  },
  "flint": {
    "encounter": {
      1: `Prépare-toi à affronter des Pokémon de type Feu !
          $Montre-moi si la flamme du combat brûle en toi !`
    },
    "victory": {
      1: "... ... Waouh... Que dire... Tu m’as réduit en cendres..."
    },
    "defeat": {
      1: "Hein ? C’est tout ? Je pense qu’il te faut plus de passion."
    }
  },
  "lucian": {
    "encounter": {
      1: `Veux-tu bien patienter un instant ? J’ai bientôt terminé mon livre...
          $Le protagoniste s’apprête à affronter une ultime épreuve, armé de son épée sacrée...
          $Oh, mais puisque tu as fait tout ce chemin, il serait bien impoli de ma part de te faire patienter davantage.
          $Battons-nous donc. Prouve-moi que ta force égale celle du protagoniste de mon livre !`
    },
    "victory": {
      1: "... Échec et mat."
    },
    "defeat": {
      1: "J’ai une réputation à tenir."
    }
  },
  //conseil 4 unys 5g
  "shauntal": {
    "encounter": {
      1: "Excuse-moi. Tu es un challenger, n’est-ce pas ? Je suis Anis, la reine des Pokémon Spectre, ton adversaire !",
      2: "J’adore coucher sur papier des histoires où Dresseurs et Pokémon venus me défier s’entendent parfaitement. Mériteras-tu d’être un de mes sujets ?",
      3: "Chaque personne qui travaille avec mes Pokémon a une histoire à raconter. Quelle histoire est sur le point d’être contée ?"
    },
    "victory": {
      1: "Alors là, j’en reste coite, muette, bouche bée, sidérée, sciée quoi !",
      2: "Tout d’abord, je dois m’excuser auprès de mes Pokémon... Je suis vraiment désolée que vous ayez eu une mauvaise expérience à cause de moi !",
      3: "Malgré cette défaite, je reste membre du Conseil 4 !"
    },
    "defeat": {
      1: "Héhé.",
      2: "Ce sera excellent dans mon prochain roman !",
      3: "Et ainsi, un autre conte se termine..."
    }
  },
  "marshal": {
    "encounter": {
      1: "Je m’appelle Kunz. Premier apprenti de Maître Goyah. Il est de mon devoir de tester moi-même ce que tu vaux. Go !",
      2: "La victoire, et une décisive, voilà ce que je veux ! Challenger, prépare-toi !",
      3: "Je crois en la force au combat. La force des convictions porte les coups gagnants. Surtout, il faut rêver sans cesse à une écrasante victoire !"
    },
    "victory": {
      1: "Ouf ! Bien joué !",
      2: "Au fur et à mesure que tes combats se poursuivent, vise des hauteurs encore plus élevées !",
      3: "La force dont toi et tes Pokémon avez fait preuve m’a profondément impressionné..."
    },
    "defeat": {
      1: "Hmm.",
      2: "C’était un bon combat.",
      3: "Haaah ! Haaah ! Haiyaaaah !"
    }
  },
  "grimsley": {
    "encounter": {
      1: "Le gagnant remporte tout, le perdant ne garde rien !"
    },
    "victory": {
      1: "Lorsque quelqu’un gagne un combat, forcément, il y a un vainqueur et un vaincu. La prochaine fois, je serai le vainqueur !"
    },
    "defeat": {
      1: "Lorsque quelqu’un gagne un combat, la personne affrontée est forcément un perdant."
    }
  },
  "caitlin": {
    "encounter": {
      1: `Me voici, moderne flore, aurore aux doigts de rose, fraîchement éclose. Et te voilà...
          $Dresseur alliant... force et bonté ?
          $Moi, Percila, ne te demande qu’une chose : un duel nécessitant la force ultime.
          $J’espère que tu ne me décevras pas.`
    },
    "victory": {
      1: "Je suis heureuse d’avoir pu affronter de tels adversaires. Mes Pokémon et moi-même en sortons grandis."
    },
    "defeat": {
      1: "J’aspire à remporter la victoire avec élégance et grâce."
    }
  },
  //conseil 4 kalos 6g
  "malva": {
    "encounter": {
      1: "Je brûlais d’impatience. Je brûlais... de haine et de rancœur !!!"
    },
    "victory": {
      1: "Et notre challenger triomphe brillamment de Malva du Conseil 4 !"
    },
    "defeat": {
      1: "Je suis ravie ! Oui, ravie d’avoir pu t’écraser sous mon talon !"
    }
  },
  "siebold": {
    "encounter": {
      1: "Tant que je vivrai, je continuerai à exalter mon amour des bonnes choses et le plaisir que je retire des combats !"
    },
    "victory": {
      1: "Ce combat avec toi restera pour toujours gravé dans mon cœur."
    },
    "defeat": {
      1: "Ce combat m’aura apporté autant de satisfaction qu’un bon repas. J’espère par ces mots te montrer à quel point j’estime que tu te sois donné corps et âme."
    }
  },
  "wikstrom": {
    "encounter": {
      1: `Willecomme, preu Dresseur ! Je suis le chevalier a l’armeure d’acier, Thyméo.
          $Les miens et vaillans Pokémon offrons belle et intense jouste, ce je vous jure et afferme. Taiaut !`
    },
    "victory": {
      1: "Sui desconfi et vaincu en bataille et en confiance !"
    },
    "defeat": {
      1: "Mon cuer tremble, car j’ay si grant joie. Car vraiement c’est un grans fais, mon rival j’ai subjugué !"
    }
  },
  "drasna": {
    "encounter": {
      1: `Tu dois être très valeureux pour être arrivé jusqu’ici. Ah, ça, oui !
          $J’en suis folle de joie ! Mes petits chéris vont passer un merveilleux moment avec un Dresseur de ta trempe !`
    },
    "victory": {
      1: "Mes aïeux, cela aura été court... Pardon ! Au plaisir de te retrouver pour un nouveau combat."
    },
    "defeat": {
      1: "Comment est-ce possible ?"
    }
  },
  //conseil 4 alola 7g
  "hala": {
    "encounter": {
      1: "Alors, prêt à prendre le \"Pectauros\" par les cornes ?! Haha !"
    },
    "victory": {
      1: "J’ai pu ressentir la puissance qui t’a permis d’arriver jusqu’ici !"
    },
    "defeat": {
      1: "Hohoho ! Quel fantastique combat !"
    }
  },
  "molayne": {
    "encounter": {
      1: "Ma force est comme celle d’une supernova !"
    },
    "victory": {
      1: "C’est que tu es un Dresseur étonnant, toi !"
    },
    "defeat": {
      1: "Hahaha. Quel combat intéressant."
    }
  },
  "olivia": {
    "encounter": {
      1: "Trêve de bavardage, place au combat !"
    },
    "victory": {
      1: "Vous êtes vraiment époustouflants, tes Pokémon et toi !"
    },
    "defeat": {
      1: "Mmm-hmm."
    }
  },
  "acerola": {
    "encounter": {
      1: "Je trouve les combats tellement amusants, hihi. Allez, battons-nous !"
    },
    "victory": {
      1: "Ce combat m’a laissée tout simplement bouche bée !"
    },
    "defeat": {
      1: "Hihi ! Quelle super victoire !"
    }
  },
  "kahili": {
    "encounter": {
      1: "Bien... Sur qui de nous deux soufflera le vent de la victoire ?"
    },
    "victory": {
      1: "En tant que membre du Conseil 4, je ne peux que reconnaître ta force incroyable."
    },
    "defeat": {
      1: "Trou en un !"
    }
  },
  //conseil 4 galar 8g
  "marnie_elite": {
    "encounter": {
      1: "T’es arrivé jusqu’ici, hein ? Voyons si tu peux battre mes Pokémon !",
      2: "Ton équipe et toi, j’vais vous remballer presto ! Enfin, gentiment quand même, hein."
    },
    "victory": {
      1: "Tu m’as mis de ces raclées... ! J’avoue, tu te débrouilles.",
      2: "On dirait qu’j’ai encore beaucoup à apprendre. Mais beau combat !"
    },
    "defeat": {
      1: "Tu t’es bien battu, mais c’est moi qu’ai gagné à la fin ! T’auras plus de chance la prochaine fois !",
      2: "Mon entraînement a enfin payé. Merci pour c’combat !"
    }
  },
  "nessa_elite": {
    "encounter": {
      1: "Les marées tournent en ma faveur. Prêt à te faire emporter ?",
      2: "Faisons quelques vagues avec ce combat ! J’espère que tu es prêt !"
    },
    "victory": {
      1: "Tu as parfaitement navigué sur ces eaux... Bravo !",
      2: "On dirait que mes courants n’étaient pas suffisants. Excellent travail !"
    },
    "defeat": {
      1: "L’eau trouve toujours un chemin. C’était un combat rafraîchissant !",
      2: "Tu t’es bien battu, mais la puissance de l’océan est imparable !"
    }
  },
  "bea_elite": {
    "encounter": {
      1: "Prépare-toi ! Mon esprit combatif brûle de mille feux !",
      2: "Voyons si tu peux suivre mon rythme incessant !"
    },
    "victory": {
      1: "Ta force... C’est impressionnant. Tu mérites vraiment cette victoire.",
      2: "Je n’ai jamais ressenti une telle intensité auparavant. C’est incroyable !"
    },
    "defeat": {
      1: "Encore une victoire pour mon entraînement intense ! Bravo !",
      2: "Tu as de la force, mais je me suis plus entraînée que toi. Beau combat !"
    }
  },
  "allister_elite": {
    "encounter": {
      1: "Les ténèbres tombent... Es-tu prêt... à affronter tes peurs ?",
      2: "Voyons si tu peux... faire face aux ténèbres... que je commande..."
    },
    "victory": {
      1: "Tu as dissipé les ombres... Pour l’instant... Bravo...",
      2: "Ta lumière a percé... mes ténèbres... Excellent travail..."
    },
    "defeat": {
      1: "Les ombres ont parlé... Ta force ne suffit pas.",
      2: "Les ténèbres triomphent... Peut-être que... la prochaine fois... tu verras la lumière."
    }
  },
  "raihan_elite": {
    "encounter": {
      1: "La tempête approche ! Est-ce que tu peux surmonter ce combat ?",
      2: "Prépare-toi à affronter l’œil du cyclone !"
    },
    "victory": {
      1: "Tu as vaincu la tempête... Incroyable !",
      2: "J’ai peut-être perdu, mais c’était en beauté !"
    },
    "defeat": {
      1: "Une autre tempête résistée, une autre victoire remportée ! Beau combat !",
      2: "Tu as été pris dans ma tempête ! T’auras plus de chance la prochaine fois !"
    }
  },
  //conseil 4 paldea 9g
  "rika": {
    "encounter": {
      1: "Bon, on s’y met ? C’est moi qu’ouvre les hostilités ! J’vais pas retenir mes coups !"
    },
    "victory": {
      1: "Pas mal, j’avoue !"
    },
    "defeat": {
      1: "Ha ha ha ! T’auras essayé !"
    }
  },
  "poppy": {
    "encounter": {
      1: "Oooh ! Tu veux te battre contre moi ?"
    },
    "victory": {
      1: "Muuuuurgh..."
    },
    "defeat": {
      1: "Ouais ! J’ai réussi ! Je t’ai battu ! Reviens pour une revanche quand tu veux !",
    }
  },
  "larry_elite": {
    "encounter": {
      1: `Bonjour, je suis Okuba.
          $Comme tu peux le voir, j’assure la permanence au Conseil 4, même si je m’en passerais bien...`
    },
    "victory": {
      1: "J’ai suffisamment dégusté, merci."
    },
    "defeat": {
      1: "Par la force du costard cravate !\n... Oui, je ne suis pas dénué d’humour."
    }
  },
  "hassel": {
    "encounter": {
      1: "Laissons-nous porter par le souffle épique du combat !"
    },
    "victory": {
      1: "Ô dragon ! Oh nooon !"
    },
    "defeat": {
      1: "\"Aux dragons bien nés, la valeur n’attend point le nombre d’années !\""
    }
  },
  //conseil 4 myrtille 9g
  "crispin": {
    "encounter": {
      1: "Je veux gagner et c’est exactement ce que je vais faire !",
      2: "Si j’ai envie de combattre, bah... je combats ! C’est aussi simple que ça !"
    },
    "victory": {
      1: "J’ai pas pu gagner... donc, j’ai perdu !",
      2: "J’ai perdu... parce que j’ai pas pu gagner !"
    },
    "defeat": {
      1: "Euh, attends, j’ai gagné ? Oh, j’ai gagné ! C’est super !",
      2: "Ouaaah ! C’était génial !"
    }
  },
  "amarys": {
    "encounter": {
      1: `Je souhaite aider une certaine personne. Perdre n’est donc pas une option.
          $... Que l’affrontement commence.`
    },
    "victory": {
      1: "Peut-être ne suis-je pas capable de l’aider..."
    },
    "defeat": {
      1: "La victoire est donc mienne. Bien combattu."
    }
  },
  "lacey": {
    "encounter": {
      1: "Je te ferai face avec mon équipe habituelle en tant que membre du Conseil 4 de la Ligue Myrtille."
    },
    "victory": {
      1: "Quel combat !"
    },
    "defeat": {
      1: "Applaudissons quand même tes Pokémon pour leurs efforts !"
    }
  },
  "drayton": {
    "encounter": {
      1: "La chaise, c’est la meilleure invention du monde ! Qui a envie de rester debout ? C’est crevant !"
    },
    "victory": {
      1: "Ouais, j’aurais dû m’y attendre !"
    },
    "defeat": {
      1: "Hé hé ! Fais pas gaffe à moi, mais ça me fait une victoire de plus. Je comprends si t’es contrarié, mais fais pas comme Kassis, OK ?"
    }
  },
  //maitres maitresses
  "blue": {
    "encounter": {
      1: "Tu dois être sacrément doué pour être arrivé jusqu’ici."
    },
    "victory": {
      1: "Je n’ai perdu que contre lui, et maintenant toi... Lui ? Ha ha..."
    },
    "defeat": {
      1: "Tu vois ? C’est ma puissance qui m’a amenée ici."
    }
  },
  "red": {
    "encounter": {
      1: "... !"
    },
    "victory": {
      1: "... ?"
    },
    "defeat": {
      1: "... !"
    }
  },
  "lance_champion": {
    "encounter": {
      1: "Je suis toujours le Maître. Je ne retiendrai pas mes coups."
    },
    "victory": {
      1: "Voici l’émergence d’un nouveau Maître."
    },
    "defeat": {
      1: "J’ai défendu mon titre de Maître avec succès."
    }
  },
  "steven": {
    "encounter": {
      1: `Dis-moi... Qu’avez-vous vu, ton équipe et toi, au cours de ce périple ?
          $Qu’as-tu ressenti, face à tous les Dresseurs que tu as croisés ?
          $Ton voyage a vraisemblablement fait naître en toi une force...
          $Je serais ravi que tu nous en fasses une démonstration, à mes Pokémon et moi.
          $Nous t’attendons de pied ferme ! Assez parlé, commençons !`
    },
    "victory": {
      1: "Tu as réussi à me battre, moi, le Maître..."
    },
    "defeat": {
      1: "C’était du temps bien dépensé ! Merci !"
    }
  },
  "wallace": {
    "encounter": {
      1: `Entre toi et tes Pokémon, l’union fait la force. C’est grâce à ça que tu as pu parvenir jusqu’ici.
          $Alors, montrez-moi votre force !`
    },
    "victory": {
      1: `Magnifique... Tu es absolument sublime ! Tu es un vrai Dresseur, ça ne fait aucun doute.
          $Quel plaisir de vous avoir rencontrés, tes Pokémon et toi...`
    },
    "defeat": {
      1: "Une grande illusion !"
    }
  },
  "cynthia": {
    "encounter": {
      1: "Moi, Cynthia, Maître de la Ligue Pokémon, j’accepte ton défi ! Je ne retiendrai pas mes coups !"
    },
    "victory": {
      1: "Aaah ! Cela faisait longtemps que je n’avais pas eu autant de plaisir... Dommage que ce soit déjà terminé."
    },
    "defeat": {
      1: "Même si tu perds, ne perd jamais l’amour que tu portes aux Pokémon."
    }
  },
  "alder": {
    "encounter": {
      1: "Prépare-toi pour un combat contre le meilleur Dresseur d’Unys !",
    },
    "victory": {
      1: "Bien joué ! Tu as sans aucun doute un talent inégalé.",
    },
    "defeat": {
      1: "Une brise fraiche traverse mon cœur... Quel effort extraordinaire !",
    }
  },
  "iris": {
    "encounter": {
      1: `J’adore faire des combats sérieux contre de bons Dresseurs ! Ben oui, c’est vrai ! Bon.
          $Dresseur qui aspire à la victoire du plus profond de son cœur !
          $Équipe Pokémon qui a pu surmonter toutes les difficultés !
          $Vous allez devoir nous affronter, mes Pokémon et moi !
          $Nous allons... gagner en force, peut-être, nous comprendre, sûrement. Numérote tes abattis !
          $Moi, Iris, Maître d’Unys, je ferai tout pour te battre !`
    },
    "victory": {
      1: "Oooh... On a tout donné et pourtant... on a perdu !"
    },
    "defeat": {
      1: "Ouais ! On a gagné !"
    }
  },
  "diantha": {
    "encounter": {
      1: `Vous êtes porteurs d’espoir, d’un futur riant !
          $De me battre contre vous, je me sens revigorée et prête à faire face à l’avenir.`
    },
    "victory": {
      1: `Quel bonheur que de pouvoir vous admirer, toi et ton équipe, vous impliquer de tout votre être...
          $Comment ne pas être subjuguée par ce spectacle ?`
    },
    "defeat": {
      1: "Oh, fantastique ! Qu’as-tu pensé de mon équipe ? Exceptionnelle, n’est-ce pas ?"
    }
  },
  "hau": {
    "encounter": {
      1: `Je me demande si un Dresseur combat différemment selon qu’il vient d’une région chaude ou d’une région froide.
          $On va bien voir !`
    },
    "victory": {
      1: "Trop fort ! T’as trop la classe !"
    },
    "defeat": {
      1: "Ouais, c’était un super combat !"
    }
  },
  "leon": {
    "encounter": {
      1: "Il est temps de commencer ce combat historique ! En garde !"
    },
    "victory": {
      1: `Tu as triomphé du Maître Invaincu que j’étais. Franchement, bravo !
          $Je n’ai plus qu’à tirer ma révérence. Merci pour ce combat d’anthologie !`
    },
    "defeat": {
      1: "C’était un combat absolument mémorable !"
    }
  },
  "geeta": {
    "encounter": {
      1: "Es-tu prêt ? Alors, montre-moi toute l’étendue de tes talents !"
    },
    "victory": {
      1: "Célébrons ensemble ta victoire !"
    },
    "defeat": {
      1: "Que t’arrive-t-il ? C’est tout ce que tu sais faire ?"
    }
  },
  "nemona": {
    "encounter": {
      1: "Oui ! Je suis tellement excitée ! C’est l’heure de se lâcher !"
    },
    "victory": {
      1: "Eh bien... Ma défaite est sans appel. T’es vraiment hyper fort !"
    },
    "defeat": {
      1: "Ha ha, j’ai gagné ! Mais tu t’es bien battu !"
    }
  },
  "kieran": {
    "encounter": {
      1: "Grâce à un travail acharné, je deviens de plus en plus fort ! Je ne perdrai pas.",
    },
    "victory": {
      1: "Je n’y crois pas... Quel combat amusant et palpitant !"
    },
    "defeat": {
      1: "Eh beh, quel combat ! Il est temps pour toi de t’entrainer encore plus dur.",
    }
  },
  //rival
  "rival": {
    "encounter": {
      1: `@c{smile}Ah, je te cherchais ! Je savais que t’étais pressé de partir, mais je m’attendais quand même à un au revoir...
         $@c{smile_eclosed}T’as finalement décidé de réaliser ton rêve ?\nJ’ai peine à y croire.
         $@c{serious_smile_fists}Vu que t’es là, ça te dis un petit combat ?\nJe voudrais quand même m’assurer que t’es prêt.
         $@c{serious_mopen_fists}Surtout ne te retiens pas et donne-moi tout ce que t’as !`
    },
    "victory": {
      1: `@c{shock}Wah... Tu m’as vraiment lavé.\nT’es vraiment un débutant ?
         $@c{smile}T’as peut-être eu de la chance, mais...\nPeut-être que t’arriveras jusqu’au bout du chemin.
         $D’ailleurs, le prof m’a demandé de te filer ces objets.\nIls ont l’air sympas.
         $@c{serious_smile_fists}Bonne chance à toi !`
    }
  },
  "rival_female": {
    "encounter": {
      1: `@c{smile_wave}Ah, je te cherchais ! Je t’ai cherché partout !\n@c{angry_mopen}On oublie de dire au revoir à sa meilleure amie ?
         $@c{smile_ehalf}T’as décidé de réaliser ton rêve, hein ?\nCe jour est donc vraiment arrivé...
         $@c{smile}Je veux bien te pardonner de m’avoir oubliée,\nà une conditon. @c{smile_wave_wink}Que tu m’affronte !
         $@c{angry_mopen}Donne tout ! Ce serait dommage que ton aventure finisse avant d’avoir commencé, hein ?`
    },
    "victory": {
      1: `@c{shock}Tu viens de commencer et t’es déjà si fort ?!@d{96}\n@c{angry}T’as triché non ? Avoue !
         $@c{smile_wave_wink}J’déconne !@d{64} @c{smile_eclosed}J’ai perdu dans les règles...\nJ’ai le sentiment que tu vas très bien t’en sortir.
         $@c{smile}D’ailleurs, le prof veut que je te donne ces quelques objets. Ils te seront utiles, pour sûr !
         $@c{smile_wave}Fais de ton mieux, comme toujours !\nJe crois fort en toi !`
    }
  },
  "rival_2": {
    "encounter": {
      1: `@c{smile}Hé, toi aussi t’es là ?\n@c{smile_eclosed}Toujours invaincu, hein... ?
         $@c{serious_mopen_fists}Je sais que j’ai l’air de t’avoir suivi ici, mais c’est pas complètement vrai.
         $@c{serious_smile_fists}Pour être honnête, ça me démangeait d’avoir une revanche depuis que tu m’as battu.
         $Je me suis beaucoup entrainé, alors sois sure que je vais pas retenir mes coups cette fois.
         $@c{serious_mopen_fists}Et comme la dernière fois, ne te retiens pas !\nC’est parti !`
    },
    "victory": {
      1: `@c{neutral_eclosed}Oh. Je crois que j’ai trop pris la confiance.
         $@c{smile}Pas grave, c’est OK. Je me doutais que ça arriverait.\n@c{serious_mopen_fists}Je vais juste devoir encore plus m’entrainer !\n
         $@c{smile}Ah, et pas que t’aies réellement besoin d’aide, mais j’ai ça en trop sur moi qui pourrait t’intéresser.\n
         $@c{serious_smile_fists}Mais n’espère plus en avoir d’autres !\nJe peux pas passer mon temps à aider mon adversaire.
         $@c{smile}Bref, prends soin de toi !`
    }
  },
  "rival_2_female": {
    "encounter": {
      1: `@c{smile_wave}Hé, sympa de te croiser ici. T’as toujours l’air invaincu. @c{angry_mopen}Eh... Pas mal !
         $@c{angry_mopen}Je sais à quoi tu penses et non, je t’espionne pas.\n@c{smile_eclosed}C’est juste que j’étais aussi dans le coin.
         $@c{smile_ehalf}Heureuse pour toi, mais je veux juste te rappeler que c’est pas grave de perdre parfois.
         $@c{smile}On apprend de nos erreurs, souvent plus que si on ne connaissait que le succès.
         $@c{angry_mopen}Dans tous les cas je me suis bien entrainée pour cette revanche, t’as intérêt à tout donner !`
    },
    "victory": {
      1: `@c{neutral}Je... J’étais pas encore supposée perdre...
         $@c{smile}Bon. Ça veut juste dire que je vais devoir encore plus m’entrainer !
         $@c{smile_wave}J’ai aussi ça en rab pour toi !\n@c{smile_wave_wink}Inutile de me remercier ~.
         $@c{angry_mopen}C’était le dernier, terminé les cadeaux après celui-là !
         $@c{smile_wave}Allez, tiens le coup !`
    },
    "defeat": {
      1: "Je suppose que c’est parfois normal de perdre..."
    }
  },
  "rival_3": {
    "encounter": {
      1: `@c{smile}Hé, mais qui voilà ! Ça fait un bail.\n@c{neutral}T’es... toujours invaincu ? Incroyable.
         $@c{neutral_eclosed}Tout est devenu un peu... étrange.\nC’est plus pareil sans toi au village.
         $@c{serious}Je sais que c’est égoïste, mais j’ai besoin d’expier ça.\n@c{neutral_eclosed}Je crois que tout ça te dépasse.
         $@c{serious}Ne jamais perdre, c’est juste irréaliste.\nGrandir, c’est parfois aussi savoir perdre.
         $@c{neutral_eclosed}T’as un beau parcours, mais il y a encore tellement à venir et ça va pas s’arranger. @c{neutral}T’es prêt pour ça ?
         $@c{serious_mopen_fists}Si tu l’es, alors prouve-le.`
    },
    "victory": {
      1: "@c{angry_mhalf}C’est lunaire... J’ai presque fait que m’entrainer...\nAlors pourquoi il y a encore un tel écart entre nous ?"
    }
  },
  "rival_3_female": {
    "encounter": {
      1: `@c{smile_wave}Ça fait une éternité ! Toujours debout hein ?\n@c{angry}Tu commences à me pousser à bout là. @c{smile_wave_wink}T’inquiètes j’déconne !
         $@c{smile_ehalf}Mais en vrai, ta maison te manque pas ? Ou... Moi ?\nJ... Je veux dire... Tu me manques vraiment beaucoup.
         $@c{smile_eclosed}Je te soutiendrai toujours dans tes ambitions, mais la vérité est que tu finiras par perdre un jour ou l’autre.
         $@c{smile}Quand ça arrivera, je serai là pour toi, comme toujours.\n@c{angry_mopen}Maintenant, montre-moi à quel point t’es devenu fort !`
    },
    "victory": {
      1: "@c{shock}Après tout ça... Ça te suffit toujours pas... ?\nTu reviendras jamais à ce rythme..."

    },
    "defeat": {
      1: "T’as fait de ton mieux.\nAllez, rentrons à la maison."
    }
  },
  "rival_4": {
    "encounter": {
      1: `@c{neutral}Hé.
         $Je vais pas y aller par quatre chemins avec toi.\n@c{neutral_eclosed}Je suis là pour gagner. Simple, basique.
         $@c{serious_mhalf_fists}J’ai appris à maximiser tout mon potentiel en m’entrainant d’arrachepied.
         $@c{smile}C’est fou tout le temps que tu peux te dégager si tu dors pas en sacrifiant ta vie sociale.
         $@c{serious_mopen_fists}Plus rien n’a d’importance désormais, pas tant que j’aurai pas gagné.
         $@c{neutral_eclosed}J’ai atteint un stade où je ne peux plus perdre.\n@c{smile_eclosed}Je présume que ta philosophie était pas si fausse finalement.
         $@c{angry_mhalf}La défaite, c’est pour les faibles, et je ne suis plus un faible.
         $@c{serious_mopen_fists}Tiens-toi prêt.`
    },
    "victory": {
      1: "@c{neutral}Que...@d{64} Qui es-tu ?"
    }
  },
  "rival_4_female": {
    "encounter": {
      1: `@c{neutral}C’est moi ! Tu m’as pas encore oubliée... n’est-ce pas ?
         $@c{smile}Tu devrais être fier d’être arrivé aussi loin. GG !\nMais c’est certainement pas la fin de ton aventure.
         $@c{smile_eclosed}T’as éveillé en moi quelque chose que j’ignorais.\nTout mon temps passe dans l’entrainement.
         $@c{smile_ehalf}Je dors et je mange à peine, je m’entraine juste tous les jours, et deviens de plus en plus forte.
         $@c{neutral}En vrai, Je... J’ai de la peine à me reconnaitre.
         $Mais maintenant, je suis au top de mes capacités.\nJe doute que tu sois de nouveau capable de me battre.
         $Et tu sais quoi ? Tout ça, c’est de ta faute.\n@c{smile_ehalf}Et j’ignore si je dois te remercier ou te haïr.
         $@c{angry_mopen}Tiens-toi prêt.`
    },
    "victory": {
      1: "@c{neutral}Que...@d{64} Qui es-tu ?"

    },
    "defeat": {
      1: "$@c{smile}Tu devrais être fier d’être arrivé jusque là."
    }
  },
  "rival_5": {
    "encounter": {
      1: "@c{neutral}..."
    },
    "victory": {
      1: "@c{neutral}..."
    }
  },
  "rival_5_female": {
    "encounter": {
      1: "@c{neutral}..."
    },
    "victory": {
      1: "@c{neutral}..."

    },
    "defeat": {
      1: "$@c{smile_ehalf}..."
    }
  },
  "rival_6": {
    "encounter": {
      1: `@c{smile_eclosed}Nous y revoilà.
         $@c{neutral}J’ai eu du temps pour réfléchir à tout ça.\nIl y a une raison à pourquoi tout semble étrange.
         $@c{neutral_eclosed}Ton rêve, ma volonté de te battre...\nFont partie de quelque chose de plus grand.
         $@c{serious}C’est même pas à propos de moi, ni de toi... Mais du monde, @c{serious_mhalf_fists}et te repousser dans tes limites est ma mission.
         $@c{neutral_eclosed}J’ignore si je serai capable de l’accomplir, mais je ferai tout ce qui est en mon pouvoir.
         $@c{neutral}Cet endroit est terrifiant... Et pourtant il m’a l’air familier, comme si j’y avais déjà mis les pieds.
         $@c{serious_mhalf_fists}Tu ressens la même chose, pas vrai ?
         $@c{serious}... et c’est comme si quelque chose ici me parlait.
         $Comme si c’était tout ce que ce monde avait toujours connu.
         $Ces précieux moments ensemble semblent si proches ne sont rien de plus qu’un lointain souvenir.
         $@c{neutral_eclosed}D’ailleurs, qui peut dire aujourd’hui qu’ils ont pu être réels ?
         $@c{serious_mopen_fists}Il faut que tu persévères. Si tu t’arrêtes, ça n’aura jamais de fin et t’es le seul à en être capable.
         $@c{serious_smile_fists}Difficile de comprendre le sens de tout ça, je sais juste que c’est la réalité.
         $@c{serious_mopen_fists}Si tu ne parviens pas à me battre ici et maintenant, tu n’as aucune chance.`
    },
    "victory": {
      1: `@c{smile_eclosed}J’ai fait ce que j’avais à faire.
         $Promets-moi juste une chose.\n@c{smile}Après avoir réparé ce monde... Rentre à la maison.`
    }
  },
  "rival_6_female": {
    "encounter": {
      1: `@c{smile_ehalf}C’est donc encore entre toi et moi.
         $@c{smile_eclosed}Tu sais, j’ai beau retouner ça dans tous les sens...
         $@c{smile_ehalf}Quelque chose peut expliquer tout ça, pourquoi tout semble si étrange...
         $@c{smile}T’as tes rêves, j’ai mes ambitions...
         $J’ai juste le sentiment qu’il y a un grand dessein derrière tout ça, derrière ce qu’on fait toi et moi.
         $@c{smile_eclosed}Je crois que mon but est de... repousser tes limites.
         $@c{smile_ehalf}Je suis pas certaine de bien être douée à cet exercice, mais je fais de mon mieux.
         $Cet endroit épouvantable cache quelque chose d’étrange... Tout semble si limpide...
         $Comme... si c’était tout ce que ce monde avait toujours connu.
         $@c{smile_eclosed}J’ai le sentiment que nos précieux moments ensemble sont devenus si flous.
         $@c{smile_ehalf}Ont-ils au moins été réels ? Tout semble si loin maintenant...
         $@c{angry_mopen}Il faut que tu persévères. Si tu t’arrêtes, ça n’aura jamais de fin et t’es le seul à en être capable.
         $@c{smile_ehalf}Je... j’ignore le sens de tout ça... Mais je sais que c’est la réalité.
         $@c{neutral}Si tu ne parviens pas à me battre ici et maintenant, tu n’as aucune chance.`
    },
    "victory": {
      1: `@c{smile_ehalf}Je... Je crois que j’ai rempli ma mission...
         $@c{smile_eclosed}Promets-moi... Après avoir réparé ce monde... Reviens à la maison sain et sauf.
         $@c{smile_ehalf}... Merci.`

    }
  },
};


// Dialogue of the NPCs in the game when the player character is female. For languages that do not have gendered pronouns, this can be set to PGMdialogue.
export const PGFdialogue: DialogueTranslationEntries = {
  "youngster": {
    "encounter": {
      1: "Hé ! Combat ?",
      2: "Toi aussi, tu débutes ?",
      3: "Hé, j’me souviens pas de ta tête. Combat !",
      4: "J’ai perdu, alors j’essaye de capturer d’autres Pokémon.\nHé, t’as l’air faible toi ! Allez, combat !",
      5: "On s’connait ? J’ai comme un doute. Dans tous les cas, sympa de te rencontrer !",
      6: "Allez, c’est parti !",
      7: "Attention, me voilà !\nTu vas voir comment j’suis fort !",
      8: "Coucou... Tu veux voir mes bô Pokémon ?",
      9: "Assez causé. Ramène-toi quand tu le sens !",
      10: "Baisse pas ta garde si tu veux pas pleurer d’avoir perdu face à un gamin.",
      11: "J’ai tout donné pour élever mes Pokémon. Attention à toi si tu leur fait du mal !",
      12: "Incroyable que tu sois arrivée jusque là ! Mais la suite va pas être une partie de plaisir.",
      13: "Les combats sont éternels ! Bienvenue dans un monde sans fin !"
    },
    "victory": {
      1: "Hé, mais t’es trop forte !",
      2: "En vrai j’avais aucune chance hein ?",
      3: "J’te retrouverai un jour, et là j’te battrai !",
      4: "Arg... J’ai plus aucun Pokémon.",
      5: "Non... IMPOSSIBLE ! Pourquoi j’ai encore perdu...",
      6: "Non ! J’ai perdu !",
      7: "Waah ! T’es trop incroyable ! J’suis bouche bée !",
      8: "Pourquoi... Comment... Pourtant on est les plus forts, mes Pokémon et moi...",
      9: "J’perdrai pas la prochaine fois ! Remettons ça un jour !",
      10: "Weeeesh ! Tu vois que j’suis qu’un gamin ? C’est pas juste de me bully comme ça !",
      11: "Tes Pokémon sont trop incroyables !\n... P’tit échange ?",
      12: "C'était me battre, qu'était une partie de plaisir...",
      13: "Ahaha ! Et voilà, ça y est !\nT’es déjà comme chez toi dans ce monde !"
    }
  },
  "lass": {
    "encounter": {
      1: "Affrontons-nous, d’accord ?",
      2: "T’as l’air d’une nouvelle Dresseuse. Battons nous !",
      3: "Je te connais pas. Ça te dit de te battre ?",
      4: "Prenons du bon temps avec ce combat Pokémon !",
      5: "Je vais t’apprendre à te battre avec tes Pokémon !",
      6: "Un combat doit être pris au sérieux. T’es prête à te battre ?",
      7: "Tu seras pas jeune éternellement. T’as qu’une chance pendant un combat. Bientôt, tu seras plus qu’un souvenir.",
      8: "Tu ferais mieux d’y aller doucement avec moi. Mais je vais me battre sérieusement !",
      9: "Je m’ennuie à l’école. Y’a rien à y faire. *Baille*\nJe me bats juste pour passer le temps."
    },
    "victory": {
      1: "Wah, c’était impressionnant ! J’ai encore beaucoup à apprendre.",
      2: "Je ne pensais pas que je perdrais comme ça...",
      3: "J’espère que j’aurai ma revanche un jour.",
      4: "C’était super amusant ! Mais ce combat m’a épuisée...",
      5: "Tu m’as appris une belle leçon ! T’es vraiment incroyable !",
      6: "Vraiment ? J’ai perdu... ? C’est des choses qui arrivent, ça me déprime mais tu es vraiment très cool.",
      7: "J’ai pas besoin de ce genre de souvenirs.\n*Suppression de mémoire en cours...*",
      8: "Hé ! Je t’avais dit d’y aller doucement avec moi ! Mais t’es vraiment si cool quand tu te bats sérieusement...",
      9: "J’en ai marre des combats Pokémon...\nJe vais chercher d’autres trucs à faire..."
    }
  },
  "breeder": {
    "encounter": {
      1: "Qu’ils soient obéissants ou égoïstes... Les Pokémon ont des caractéristiques uniques.",
      2: "Même si mes choix et ma personnalité ne sont pas fous, je pense quand même bien avoir élevé mes Pokémon.",
      3: "Hum, t’es pas trop laxiste avec tes Pokémon ?\nTrop les chouchouter n’est pas bon.",
    },
    "victory": {
      1: "Il est primordial de nourir et développer toutes les caractéristiques de chaque Pokémon.",
      2: "Contrairement à moi, ces Pokémon ont un bon fond.",
      3: "Trop d’éloges peut ruiner les Pokémon et les gens.",
    },
    "defeat": {
      1: "Tu ne devrais pas t’énerver sur tes Pokémon, même après une défaite.",
      2: "Alors ? Pas mal mes Pokémon, hein ? Je suis fait pour ça.",
      3: "Peut importe à quel point t’aimes tes Pokémon, il faut toujours de la discipline s’ils se comportent mal."
    }
  },
  "breeder_female": {
    "encounter": {
      1: "Les Pokémon ne trahissent jamais. Ils te rendront toujours l’amour que tu leur donne.",
      2: "Puis-je te donner une astuce pour mieux élever tes Pokémon ?",
      3: "J’ai élevé mes Pokémon en utilisant une méthode très spéciale."
    },
    "victory": {
      1: "Arg... C’était pas supposé se passer comme ça. Leur ai-je administré la mauvaise préparation ?",
      2: "Comment ça a pu arriver...\nAvec quoi nourris-tu tes Pokémon ?",
      3: "Si je perds, c’est juste pour te dire que je tuais le temps. Mon ego n’est absolument pas touché..."
    },
    "defeat": {
      1: "C’est la preuve que mes Pokémon reconnaissent tout mon amour.",
      2: "Le seul secret derrière des Pokémon bien entrainés, c’est surtout d’en capturer des bons.",
      3: "La force des Pokémon dépend de ta capacité à savoir les élever correctement."
    }
  },
  "fisherman": {
    "encounter": {
      1: "Aaah non ! J’avais une touche !\nTu comptes faire quoi pour arranger ça ?",
      2: "Bouge de là ! Tu fais peur aux Pokémon !",
      3: "Voyons si t'arrives à ferrer une victoire !",
    },
    "victory": {
      1: "Vas-y là, oublie.",
      2: "La prochaine fois, je vais me repêcher !",
      3: "Je présume que j’ai sous-estimé les courants...",
    }
  },
  "fisherman_female": {
    "encounter": {
      1: "Oh la belle prise !",
      2: "Ma ligne est en place, prête à ferrer le succès !",
      3: "Prête à faire des vagues !"
    },
    "victory": {
      1: "Je suppose que je vais avoir besoin d’un plus gros hameçon.",
      2: "La ligne s’est brisée, j’ai pas pu la ferrer...",
      3: "Attends que j’aiguise mes hameçons pour la revanche !"
    }
  },
  "swimmer": {
    "encounter": {
      1: "C’est l’heure de plonger dans le vif !",
      2: "C’est le moment de surfer sur les vagues de la victoire !",
      3: "Je vais t’éclabousser de mon talent !",
    },
    "victory": {
      1: "Tu m’as complètement séchée !",
      2: "Il semblerait que ce soit celles de la défaite...",
      3: "Retour sur la terre ferme, je suppose...",
    }
  },
  "backpacker": {
    "encounter": {
      1: "Fais ton sac, on y va !",
      2: "Voyons si t’arrives à garder le rythme !",
      3: "Accélère le pas, camarade !",
      4: "J’ai passé 20 ans à la recherche de moi-même...\nMais où suis-je ?"
    },
    "victory": {
      1: "J’ai trébuché !",
      2: "Ah, je crois que je me suis paumé.",
      3: "Ah, une impasse !",
      4: "Hé ! Attends une seconde...\nTu saurais pas qui je suis ?"
    }
  },
  "ace_trainer": {
    "encounter": {
      1: "T’as l’air plutôt confiante.",
      2: "Tes Pokémon... Montre-les-moi...",
      3: "Les gens pensent que je suis fort par que je suis un Topdresseur.",
      4: "T’es au courant de ce que ça signifie d’être un Topdresseur ?"
    },
    "victory": {
      1: "Très bien... T’as de bons Pokémon...",
      2: "Quoi ?! Mais c'est moi le génie des combats !",
      3: "Évidemment que t’es le personnage principal !",
      4: "OK ! OK ! Tu pourrais être un Topdresseur !"
    },
    "defeat": {
      1: "Je me dévoue corps et âme aux combats Pokémon !",
      2: "Comme prévu... Vraiment aucune surprise...",
      3: "Et moi qui pensais qu’en grandissant, j’allais rester frêle et fragile, à me briser à la moindre étreinte.",
      4: "Évidemment que je suis fort et encore moins un perdant. C’est important de gagner avec grâce."
    }
  },
  "parasol_lady": {
    "encounter": {
      1: "Honorons ce terrain de combat avec élégance et équilibre !",
    },
    "victory": {
      2: "Mon élégance demeure inébranlable !",
    }
  },
  "twins": {
    "encounter": {
      1: "Prépare-toi, parce que quand on fait équipe, c’est deux fois plus d’embrouilles !",
      2: "Deux cœurs, une stratégie – on va gagner grâce au pouvoir des jumelles !",
      3: "À deux contre un, nous sommes imbattables, alors prépare-toi !"
    },
    "victory": {
      1: "On a peut-être perdu ce combat, mais notre lien reste incassable !",
      2: "L’esprit des jumelles ne restera pas affaibli très longtemps.",
      3: "Notre duo dynamique reviendra plus fort !"
    },
    "defeat": {
      1: "Le pouvoir des jumelles règne en maître !",
      2: "Deux cœurs, une victoire !",
      3: "Deux fois plus de sourires, deux fois plus de danses de la victoire !"
    }
  },
  "cyclist": {
    "encounter": {
      1: "Prépare-toi à mordre la poussière !",
      2: "Attention ! Je change de vitesse !",
      3: "Je vais toujours à fond la caisse, est-ce que tu peux me suivre ?"
    },
    "victory": {
      1: "Ça va me mettre des bâtons dans les roues.",
      2: "Tu étais trop rapide !",
      3: "La route vers la victoire comporte encore de nombreux rebondissements."
    }
  },
  "black_belt": {
    "encounter": {
      1: "C’est très courageux de ta part de m’affronter ! Car j’ai un superbe coup de pied !",
      2: "Oh, je vois. Tu veux que je découpe en morceaux ? Ou tu préfères le rôle de punching-ball ?"
    },
    "victory": {
      1: "Oh. Ce sont mes Pokémon qui se sont battus. Mon coup de pied n’a servi à rien.",
      2: "Hmmm... Si je devais perdre de toute façon, j’espérais être complètement à côté."
    }
  },
  "battle_girl": {
    "encounter": {
      1: "Tu n’es pas obligée d’essayer de m’impressionner. Tu peux perdre contre moi."
    },
    "victory": {
      1: "C’est difficile de se dire au revoir, mais nous manquons de temps...",
    }
  },
  "hiker": {
    "encounter": {
      1: "Mon âge m’a donné autant de gravité que les montagnes que je parcourt !",
      2: "Je tiens ces os solides de mes parents... Je suis comme une chaîne de montagnes vivante..."
    },
    "victory": {
      1: "Au moins, je ne peux pas perdre en termes d’IMC !",
      2: "Ce n’est pas assez... Ce n’est jamais assez. Mon mauvais cholestérol n’est pas assez élevé..."
    }
  },
  "ranger": {
    "encounter": {
      1: "Quand je suis entouré par la nature, la plupart des autres choses cessent d’avoir de l’importance.",
      2: "Quand je vis sans nature dans ma vie, je ressens parfois soudainement une crise d’angoisse."
    },
    "victory": {
      1: "Face à l’immensité de la nature, peu importe que je gagne ou que je perde...",
      2: "Cette défaite est insignifiante, comparée aux sensations étouffantes de la vie urbaine."
    },
    "defeat": {
      1: "J’ai gagné la bataille. Mais face à l’immensité de la nature, ce n’est rien...",
      2: "Je suis sûr que ce que tu ressens n’est pas si mal, comparé à mes crises d’angoisse..."
    }
  },
  "scientist": {
    "encounter": {
      1: "Mes recherches mèneront ce monde vers la paix et la joie."
    },
    "victory": {
      1: "Je suis un génie... Je ne suis pas censé perdre contre quelqu’un comme toi...",
    }
  },
  "school_kid": {
    "encounter": {
      1: "Héhé... J’ai confiance en mes calculs et mes analyses.",
      2: "Je veux acquérir le plus d’expérience possible parce que je veux un jour devenir Champion d’Arène !"
    },
    "victory": {
      1: "Ohhhh... Le calcul et l’analyse ne font peut-être pas le poids face à la chance...",
      2: "Même les expériences difficiles et éprouvantes peuvent être utiles, je suppose."
    }
  },
  "artist": {
    "encounter": {
      1: "Avant, j’étais populaire, mais maintenant je suis complètement dépassé."
    },
    "victory": {
      1: "Les temps changent et les valeurs également. Je m’en suis rendu compte trop tard.",
    }
  },
  "guitarist": {
    "encounter": {
      1: "Prépare-toi à ressentir le rythme de la défaite alors que je gratte mon chemin vers la victoire !"
    },
    "victory": {
      1: "Je suis réduit au silence pour l’instant, mais ma mélodie de résilience continuera à jouer.",
    }
  },
  "worker": {
    "encounter": {
      1: "Ça me dérange que les gens se méprennent toujours sur moi. Je suis beaucoup plus pur qu’on ne le pense."
    },
    "victory": {
      1: "Je ne veux pas recevoir de coups de soleil, donc je reste à l’ombre pendant que je travaille.",
    }
  },
  "worker_female": {
    "encounter": {
      1: "Ça me dérange que les gens se méprennent toujours sur moi. Je suis beaucoup plus pure qu’on ne le pense."
    },
    "victory": {
      1: "Je ne veux pas recevoir de coups de soleil, donc je reste à l’ombre pendant que je travaille."
    },
    "defeat": {
      1: "Mon corps et mon esprit ne sont pas forcément toujours synchronisés."
    }
  },
  "worker_double": {
    "encounter": {
      1: "Je vais te montrer que nous pouvons te briser. Nous nous sommes entraînés sur le terrain !"
    },
    "victory": {
      1: "Comme c’est étrange... Comment c’est possible... À deux, on aurait dû te battre.",
    }
  },
  "hex_maniac": {
    "encounter": {
      1: "Normalement, je n’écoute que de la musique classique, mais si je perds, je pense que je vais essayer des musiques plus récentes !",
      2: "Chacune de mes larmes me rend plus forte."
    },
    "victory": {
      1: "Serait-ce l’aube de l’ère du Verseau ?",
      2: "Maintenant je peux devenir plus forte. Chaque rancune me rend plus forte."
    },
    "defeat": {
      1: "Les compositeurs classiques du vingtième siècle, ça compte ?",
      2: "Ne t’attarde pas sur la tristesse ou la frustration. Tu peux utiliser tes rancunes pour te motiver."
    }
  },
  "psychic": {
    "encounter": {
      1: "Salut ! Concentration !",
    },
    "victory": {
      1: "Zut !",
    }
  },
  "officer": {
    "encounter": {
      1: "On ne bouge plus ! Justice va être rendue !",
      2: "Prêt à faire respecter la loi et à servir la justice sur le champ de bataille !"
    },
    "victory": {
      1: "Le poids de la justice semble plus lourd que jamais...",
      2: "Les ombres de la défaite persistent."
    }
  },
  "beauty": {
    "encounter": {
      1: "Ma dernière bataille... C'est comme ça que j'aimerais qu'on voit ce match...",
    },
    "victory": {
      1: "Ça a été amusant... Faisons encore une dernière bataille un jour...",
    }
  },
  "baker": {
    "encounter": {
      1: "J'espère que tu es prête à goûter à la défaite !"
    },
    "victory": {
      1: "Je suis au bout du rouleau... à pâtisserie."
    }
  },
  "biker": {
    "encounter": {
      1: "Il est temps de démarrer et de te laisser dans la poussière !"
    },
    "victory": {
      1: "Je vais me préparer pour la prochaine course."
    }
  },
  "firebreather": {
    "encounter": {
      1: "Mes flammes vont te dévorer !",
      2: "Mon âme est en feu. Je vais te montrer à quel point elle brûle !",
      3: "Approche-toi et jette un coup d’œil !"
    },
    "victory": {
      1: "J’ai brûlé en cendres...",
      2: "Ouais ! C’est chaud !",
      3: "Aïe ! Je me suis brûlé le bout du nez !"
    }
  },
  "sailor": {
    "encounter": {
      1: "Si tu perds, tu prends la planche !",
      2: "Allons-y ! Il en va de ma fierté de marin !",
      3: "Yo ho ho ! Tu as le mal de mer ?"
    },
    "victory": {
      1: "Argh ! Battu par une gamine !",
      2: "Ton esprit m’a coulé !",
      3: "Oooh, j’ai la nausée..."
    }
  },
  //sbires teams
  "rocket_grunt": {
    "encounter": {
      1: "Nous sommes de retour !"
    },
    "victory": {
      1: "Une fois de plus, la Team Rocket s’envole vers d’autres cieux !"
    }
  },
  "magma_grunt": {
    "encounter": {
      1: "N’espère pas recevoir de la pitié si tu te mets sur le chemin de la Team Magma !"
    },
    "victory": {
      1: "Je...?\nJ’ai perdu ?!"
    }
  },
  "aqua_grunt": {
    "encounter": {
      1: "Aucune pitié si tu te mets sur le chemin de la Team Aqua, même pour une gamine !"
    },
    "victory": {
      1: "Comment ça ?"
    }
  },
  "galactic_grunt": {
    "encounter": {
      1: "Ne te mets pas en travers de la Team Galaxie !"
    },
    "victory": {
      1: "Désactivation..."
    }
  },
  "plasma_grunt": {
    "encounter": {
      1: "Pas de quatiers à ceux qui ne suivent pas notre idéal !"
    },
    "victory": {
      1: "Plasmaaaaaaaaa !"
    }
  },
  "flare_grunt": {
    "encounter": {
      1: "Le style et le bon gout, il n’y a que ça qui compte !"
    },
    "victory": {
      1: "Mon futur me semble guère radieux."
    }
  },
  //chefs teams
  "rocket_boss_giovanni_1": {
    "encounter": {
      1: "Bien. Je dois admettre que je suis impressionné de te voir ici !"
    },
    "victory": {
      1: "QUOI ? IMPOSSIBLE !"
    },
    "defeat": {
      1: "Retiens bien. Ton incapacité à évaluer ta propre force est\nla démonstration claire que tu n’es encore qu’une gamine."
    }
  },
  "rocket_boss_giovanni_2": {
    "encounter": {
      1: "Mes anciens collaborateurs m’attendent.\nComptes-tu m’en empêcher ?"
    },
    "victory": {
      1: "Comment c’est possible... ? Le grand dessein de la Team Rocket n’est plus qu’une illusion..."
    },
    "defeat": {
      1: "La Team Rocket renaitra, et je dominerai le monde !"
    }
  },
  "magma_boss_maxie_1": {
    "encounter": {
      1: "Je vais t’enterrer de mes propres mains.\nJ’espère que t’apprécieras cet honneur !"
    },
    "victory": {
      1: "Gnn... ! Tu... T’as du répondant...\nCe sentiment d’être à la traine, de si peu..."
    },
    "defeat": {
      1: "La Team Magma vaincra !"
    }
  },
  "magma_boss_maxie_2": {
    "encounter": {
      1: "T’es le dernier rempart entravant mes objectifs. Prépare-toi à mon ultime riposte ! Hahahaha !"
    },
    "victory": {
      1: "Ce... Ce n’est pas... Gnn..."
    },
    "defeat": {
      1: "L’heure est venue...\nJe vais transformer cette planète en paradis pour l’humanité."
    }
  },
  "aqua_boss_archie_1": {
    "encounter": {
      1: "Je suis le Leader de la Team Aqua.\nJ’ai bien peur que pour toi, ce soit fin de parcours."
    },
    "victory": {
      1: "Retrouvons-nous.\nJe me souviendrai de ton visage."
    },
    "defeat": {
      1: "Magnifique !\nPlus rien ne peut nous retenir !"
    }
  },
  "aqua_boss_archie_2": {
    "encounter": {
      1: "J’ai attendu ce moment depuis si longtemps.\nVoici la vraie puissance de la Team Aqua !"
    },
    "victory": {
      1: "Comme si j’y avait cru..."
    },
    "defeat": {
      1: "Je rendrai à ce monde sa pureté originelle !"
    }
  },
  "galactic_boss_cyrus_1": {
    "encounter": {
      1: "Tu t’es senti obligée de venir ici dans un acte vide de sens. Je vais te le faire regretter."
    },
    "victory": {
      1: "Intéressant. Et plutôt curieux."
    },
    "defeat": {
      1: "Je le créerai, mon nouveau monde..."
    }
  },
  "galactic_boss_cyrus_2": {
    "encounter": {
      1: "Nous y revoilà. Il semblerait que nos destinées soient entremêlées. Il est l’heure d’y mettre un terme."
    },
    "victory": {
      1: "Comment. Comment ?\nCOMMENT ?!"
    },
    "defeat": {
      1: "Adieu."
    }
  },
  "plasma_boss_ghetsis_1": {
    "encounter": {
      1: "Je n’accepterai pas qu’on me barre la route !\nPeu importe qui fait quoi !"
    },
    "victory": {
      1: "Comment ? Je suis le leader de la Team Plasma !\nJe suis parfait !"
    },
    "defeat": {
      1: "Je suis le parfait monarque d’un monde parfait !\nHahaha !"
    }
  },
  "plasma_boss_ghetsis_2": {
    "encounter": {
      1: "Viens ! Je veux voir ton visage à l’instant même où l’espoir quittera ton corps !"
    },
    "victory": {
      1: "Mes calculs... Non ! Mes plans étaient parfaits !\nCe monde devrait être mien !"
    },
    "defeat": {
      1: "Kyurem ! Fusiorption !!!"
    }
  },
  "flare_boss_lysandre_1": {
    "encounter": {
      1: "Comptes-tu m’arrêter ? Prouve-le."
    },
    "victory": {
      1: "Tu es venue m’arrêter. Mais je te demande d’attendre."
    },
    "defeat": {
      1: "Les Pokémon... Ne devraient plus exister."
    }
  },
  "flare_boss_lysandre_2": {
    "encounter": {
      1: "Ton futur ou le mien...\nVoyons lequel mérite plus d’aboutir."
    },
    "victory": {
      1: "Ohhhh... !"
    },
    "defeat": {
      1: "Les ignorants sans aucune vision n’auront donc de cesse de souiller ce monde."
    }
  },
  //kanto 1g
  "brock": {
    "encounter": {
      1: "Mon expertise sur les Pokémon de type Roche va te mettre à terre ! C’est parti !",
      2: "Ma volonté inébranlable comme la pierre va te submerger !",
      3: "Je vais te montrer la vraie force de mes Pokémons !"
    },
    "victory": {
      1: "Tes attaques ont surpassé ma défense de fer... euh, de pierre !",
      2: "Le monde est plein de surprises ! Je suis heureux d’avoir pu t’affronter.",
      3: "Peut-être que je pourrais suivre mon rêve de devenir éleveur de Pokémon..."
    },
    "defeat": {
      1: "La meilleure attaque est une bonne défense ! C’est ça, mon style !",
      2: "Viens étudier les pierres avec moi la prochaine fois pour mieux apprendre à les combattre !",
      3: "Hah, tous mes voyages entre les régions ont fini par payer !"
    }
  },
  "misty": {
    "encounter": {
      1: "Ma tactique est simple : attaquer encore et encore avec des Pokémon Eau !",
      2: "Attention, je vais te montrer la force de mes Pokémon aquatiques !",
      3: `Mon rêve était de partir en voyage et d'affronter de puissants entraîneurs...
         $Est-ce que tu seras à la hauteur ?`
    },
    "victory": {
      1: "T'es pas mal, dis donc... Je dois bien l'admettre.",
      2: "Grrr... C'était juste un coup de chance, tu le sais ?!",
      3: "Wow, tu es trop forte ! J'arrive pas à croire que tu m'as battue !"
    },
    "defeat": {
      1: "Qu'en dis-tu ? C'est ça, la puissance des Pokémon Eau !",
      2: "J'espère que t'as vu les techniques de nage élégantes de mes Pokémon !",
      3: "Tes Pokémon n'étaient pas à la hauteur !"
    }
  },
  "lt_surge": {
    "encounter": {
      1: "Mes Pokémon de électricité saved me pendant la guerre ! Tu vas voir !",
      2: "Attention ! Compte tes dents, tu vas morfler !",
      3: "Je vais te shock comme un soldat enemy !"
    },
    "victory": {
      1: "Wow ! Ton équipe est le real deal, gamine !",
      2: "Tu es very costaud ! Même mes tricks électriques sont à plat.",
      3: "C’était une défaite absolument shocking !"
    },
    "defeat": {
      1: "Oh yeah ! Quand on parle de Pokémon Électrik, je suis le number one !",
      2: "Hahaha ! C’était une battle électrisante, gamine !",
      3: "Une battle de Pokémon, c’est comme la war, et je t’ai montré le battle en personne !"
    }
  },
  "erika": {
    "encounter": {
      1: "Le temps est admirable, aujourd’hui...\nOh, tu veux te battre ? Très bien.",
      2: "Je me suis entraînée à la fois en dressage et en arrangement floral. En garde !",
      3: "Oh, j’espère que l’arome agréable de mes Pokémon ne vont pas m’endormir...",
      4: "Voir des fleurs dans un jardin est tellement apaisant."
    },
    "victory": {
      1: "Oh ! J’admets ma défaite.",
      2: "Ce match était des plus délicieux.",
      3 : "Ah, il semblerait que ce soit ma perte...",
      4 : "Oh mon Dieu."
    },
    "defeat": {
      1: "J’ai failli m’endormir...",
      2: "Quel bonheur que de vaincre avec ses petits Pokémon adorés.",
      3: "Ce combat était une belle expérience.",
      4: "Oh... C’est tout ?"
    }
  },
  "janine": {
    "encounter": {
      1: "Je maîtrise l'art des attaques empoisonnées. Tu seras mon partenaire d'entraînement !",
      2: "Mon petit papa est certain que je puisse me débrouiller seule. Je lui donnerai raison !",
      3: "Mes techniques ninja sont presque égales à celles de mon père !"
 },
    "victory": {
      1: "Même maintenant, j'ai encore besoin d'entraînement... Je comprends.",
      2: "Ta technique de combat a surpassé la mienne.",
      3: "Je vais vraiment m'appliquer et améliorer mes compétences."
 },
    "defeat": {
      1: "Hahaha... le poison a sapé toutes tes forces pour combattre.",
      2: "Ha ! Tu n'avais aucune chance face à mes techniques ninja supérieures !",
      3: "Mon père a eu raison de me faire confiance."
    }
  },
  "sabrina": {
    "encounter": {
      1: "J’avais prédit ton arrivée, grâce à mes pouvoirs psychiques !",
      2: "Je n’aime pas les combats, mais si tu insistes, je vais te montrer mes pouvoirs !",
      3: "Je sens en toi une grande ambition. Voyons si ce n’est pas infondé."
    },
    "victory": {
      1: "Quelle puissance... ! C’est bien plus que ce que j’avais prévu.",
      2: "Ta puissance dépasse mes pouvoirs de prescience.",
      3: "Même avec mes immenses pouvoirs psychiques, je ne peux pas sentir un être aussi fort que toi."
    },
    "defeat": {
      1: "Cette victoire... C’est exactement ce que j’avais prédit.",
      2: "Peut-être que ce grand désir que j’ai ressenti provenait de quelqu’un d’autre...",
      3: "Perfectionne tes capacités avant de te lancer imprudemment dans la bataille. On ne sait jamais ce que l’avenir peut nous réserver..."
    }
  },
  "blaine": {
    "encounter": {
      1: "Yohoho ! J’espère que tu as de l’Anti-Brûle !",
      2: "Mes Pokémon flamboyants vont te réduire en cendres !",
      3: "Prépare-toi à jouer avec le feu !"
    },
    "victory": {
      1: "Bravo ! Je suis en cendres...",
      2: "Mais comment donc ?! Pourtant, question motivation, j’étais au taquet !",
      3: "Woho... hohoho... J’ai cramé tout ce que j’avais. Mais tu as renforcé ma volonté de feu !"
    },
    "defeat": {
      1: "Wohoho ! Fait chaud, hein?",
      2: "Wohoho ! La fièvre de ce combat va rendre mes Pokémon encore plus forts !",
      3: "Yohoho ! Notre détermination est sans faille !"
    }
  },
  "giovanni": {
    "encounter": {
      1: "Moi, le leader de la Team Rocket, je vais te faire ressentir un monde de douleur !",
      2: "Cet entraînement sera vital avant de devoir faire face à nouveau à mes sbires.",
      3: "Je ne crois pas que tu sois préparé à l’échec que tu t’apprêtes à vivre !"
    },
    "victory": {
      1: "Quoi ! Damnation ! Il n’y a plus rien à dire !",
      2: "Hmph... Tu ne pourras jamais comprendre ce que j’espère réaliser.",
      3: "Cette défaite ne fait que retarder l’inévitable. Je ferai renaître la Team Rocket de ses cendres en temps voulu."
    },
    "defeat": {
      1: "Ne pas pouvoir mesurer sa propre force montre que tu n’es encore qu’une gamine.",
      2: "Essaye de ne plus me gêner.",
      3: "J’espère que tu comprends à quel point c’était stupide de me défier."
    }
  },
  //johto 2g
  "falkner": {
    "encounter": {
      1: "Tu vas subir les terribles attaques de mes Pokémon volants !",
      2: "Allez, que le vent se lève !",
      3: "Papa, regarde ce combat !"
    },
    "victory": {
      1: "C’est compris... Il est temps de redescendre sur terre.",
      2: "Une défaite est une défaite. En effet, tu es forte.",
      3: "... Zut de flûte ! Très bien, j’ai perdu."
    },
    "defeat": {
      1: "Papa... Avec les Pokémon que tu chérissais tant, j’ai remporté une magnifique victoire !",
      2: "Tu as compris la puissance des Pokémon Oiseaux ?",
      3: "J’ai l’impression de rattraper mon père !"
    }
  },
  "bugsy": {
    "encounter": {
      1: "Moi, c’est Hector ! Personne ne connait mieux les Pokémon Insecte que moi !"
    },
    "victory": {
      1: "Wah, Ça alors ! Tu connais vraiment bien les Pokémon ! Ah, j’ai encore beaucoup à apprendre ! OK, tu as gagné."
    },
    "defeat": {
      1: "Merci! Grâce à toi, j’ai pu avancer dans mes recherches !"
    }
  },
  "whitney": {
    "encounter": {
      1: "Hé ! Tu trouves pas que les Pokémon sont, genre trop mimis ?"
    },
    "victory": {
      1: "Mais euh ! OUIN !!! NON ! T’as pas le droit !"
    },
    "defeat": {
      1: "Trop fastoche !"
    }
  },
  "morty": {
    "encounter": {
      1: `Je poursuis mon apprentissage pour un jour rencontrer un Pokémon sacré entre tous.
         $Tu vas m’aider à m’entraîner !`,
      2: `On dit qu’un Pokémon légendaire apparaîtra face à un Dresseur d’exception.
         $Je crois à ce récit, et dans ce but, je m’entraîne ici depuis ma naissance.
         $C’est ainsi que je peux voir ce que les autres ne voient pas.
         $Je sais qui pourra faire venir le Pokémon de la légende... C’est moi, je suis l’élu !
         $Et toi, tu vas m’aider à m’améliorer ici et maintenant !`,
      3: "Que tu choisis d’y croire ou non, les pouvoirs mystiques existent.",
      4: "Sois témoin des fruits de ma formation.",
      5: "Ton âme ne doit faire qu’une avec celle des Pokémon. En es-tu capable ?",
      6: "Combattre des Dresseurs surpuissants, ça fait partie de mon apprentissage. Tu vas me donner un coup de main !"
    },
    "victory": {
      1: "Je ne suis pas encore assez bon...",
      2: `Je vois... Ton périple t’a conduit dans des endroits lointains et tu as été témoin de bien plus de choses que moi.
         $Je t’envie pour cela...`,
      3: "Comment expliquer cela...",
      4: "En puissance pure, je ne devais pas être tellement loin derrière... Mais tu as quelque chose de plus...",
      5: "Il me faut plus d’entraînement.",
      6: "C’est dommage..."
    },
    "defeat": {
      1: "Encore un grand pas de fait sur la voie de l’apprentissage !",
      2: "Hahaha...",
      3: "Mon entraînement a porté ses fruits !",
      4: "J’ai vu quelque chose... Comme une vision.",
      5: "Victoire !",
      6: "Je savais que j’allais gagner !"
    }
  },
  "chuck": {
    "encounter": {
      1: "Hah ! Tu veux m’affronter ? Tu es courageux ou juste stupide ?"
    },
    "victory": {
      1: "T’es balèze ! Je me suis bien amusé avec toi !"
    },
    "defeat": {
      1: "Tu ferais mieux de retourner t’entraîner... 24 heures sur 24 s’il le faut !"
    }
  },
  "jasmine": {
    "encounter": {
      1: "Oh... Tes Pokémon sont impressionnants. Je pense que ce combat va être intéressant."
    },
    "victory": {
      1: "Tu es vraiment forte. Je vais devoir faire beaucoup plus d’efforts, moi aussi."
    },
    "defeat": {
      1: "Je ne m’attendais pas à gagner."
    }
  },
  "pryce": {
    "encounter": {
      1: "La jeunesse seule ne garantit pas la victoire ! C’est l’expérience qui compte."
    },
    "victory": {
      1: "Exceptionnel ! C’était parfait. Essaye de ne pas oublier ce sentiment."
    },
    "defeat": {
      1: "Exactement comme je l’imaginais."
    }
  },
  "clair": {
    "encounter": {
      1: "Sais-tu qui je suis ? Et tu oses malgré tout me défier ?"
    },
    "victory": {
      1: "Je me demande jusqu’où tu peux aller avec ton niveau. Ça devrait être fascinant."
    },
    "defeat": {
      1: "... C’en est fini."
    }
  },
  
  //hoenn 3g
  "roxanne": {
    "encounter": {
      1: "Tu voudrais bien me faire voir comment tu te bats ?",
      2: "Plus on rencontre de Dresseurs, plus on fait de combats... et plus on apprend !",
      3: "Oh, j’étais en train d’élaborer une stratégie. Voudrais-tu te battre avec moi ?"
    },
    "victory": {
      1: "Bon... J’ai perdu... Je comprends.",
      2: "Apparemment, j’ai encore bien des choses à apprendre...",
      3: "Je prendrai à cœur ce que j’ai appris ici aujourd’hui."
    },
    "defeat": {
      1: "J’ai appris beaucoup de choses grâce à ce combat.",
      2: "J’ai hâte de t’affronter à nouveau. J’espère que tu utiliseras ce que tu as appris ici.",
      3: "J’ai gagné grâce à tout ce que j’ai appris jusqu’ici."
    }
  },
  "brawly": {
    "encounter": {
      1: "Alors, tu veux me défier ? Voyons donc de quoi tu es capable !",
      2: "Voyons si tu as ce qu’il faut pour chevaucher les vagues déferlantes !",
      3: "Je m’entraîne dans les brisants et les cavernes sous-marines. Voyons si tu es à la hauteur !"
    },
    "victory": {
      1: "Waouh... Je ne m’attendais pas à une telle déferlante !",
      2: "Tu as surfé sur ma vague et tu m’as écrasé !",
      3: "J’ai l’impression d’être perdu dans la Grotte Granite !"
    },
    "defeat": {
      1: "Cool, j’ai pris la vague à la perfection !",
      2: "Reviens surfer avec moi quand tu veux !",
      3: "Tout comme les marées montent et descendent, j’espère que tu reviendras pour me défier à nouveau."
    }
  },
  "wattson": {
    "encounter": {
      1: "Hahahaha !\nCa va faire des étincelles !",
      2: "Hahahaha !\nJe vais t’électriser !",
      3: "Hahahaha !\nJ’espère que t’as de l’Anti-Para !"
    },
    "victory": {
      1: "Ouaaaaaouh !\nJ’ai perdu! Tu m’as électrisée !",
      2: "Ouaaaaaouh !\nMe voilà à terre !",
      3: "Ouaaaaaouh !\nUn talent pareil, ça me met de bonne humeur !"
    },
    "defeat": {
      1: "Hahahaha !\nRecharge mes batteries et reviens m’affronter !",
      2: "Hahahaha !\nJ’espère que tu as trouvé notre combat électrisant !",
      3: "Hahahaha !\nT’as eu des frissons, hein ?"
    }
  },
  "flannery": {
    "encounter": {
      1: "Bienvenue... Heu, non, attends.\nJe vais t’incendier !",
      2: "Je ne suis pas Championne depuis très longtemps,\nmais ne me sous-estime pas !",
      3: "Je vais te montrer les techniques que mon papy m’a appris ! Battons-nous !"
    },
    "victory": {
      1: "Tu me rapelles mon papy...\nPas étonnant que j’ai perdu.",
      2: "Zut, on dirait que j’ai encore voulu forcer mes coups...",
      3: "Perdre ne va pas m’étouffer.\nJe vais continuer à m’entraîner !"
    },
    "defeat": {
      1: "J’espère que j’ai rendu mon papy fier...\nBattons-nous à nouveau, un jour",
      2: "J’ai pu gagner à ma façon, en restant moi-même.\nÇa veut dire que j’ai grandi !",
      3: "J’espère qu’on pourra se réaffronter à nouveau !"
    }
  },
  "norman": {
    "encounter": {
      1: "Je suis surpris que tu aies réussi à arriver ici.\nBattons-nous.",
      2: "Je ferai tout ce qui est en mon pouvoir en tant que Champion pour gagner.\nC’est parti !",
      3: "Je donne toujours mon maximum.\nJ’espère que tu en feras autant."
    },
    "victory": {
      1: "J’ai perdu contre toi... ?\nMais les règles sont les règles.",
      2: "Est-ce que quitter Oliville était une erreur... ?",
      3: "Je n’arrive pas à y croire.\nC’était un match formidable."
    },
    "defeat": {
      1: "C’était un beau combat,\nnous avons tous les deux fait notre maximum !",
      2: "Tu devrais plutôt essayer de défier mon fils.\nTu pourrais apprendre quelque chose !",
      3: "Merci pour ce combat.\nTu auras plus de chance la prochaine fois."
    }
  },
  "winona": {
    "encounter": {
      1: "Je sillonne le ciel à la recherche d’une proie...\nEt je l’ai trouvée !",
      2: "Aussi difficile que soit le duel, je m’en sors toujours avec élégance. Battons-nous !",
      3: "J’espère que tu n’as pas le vertige !\nPrépare-toi à l’ascension !"
    },
    "victory": {
      1: "Je n’avais encore jamais vu de Dresseur commander ses Pokémon avec autant de grâce que moi.",
      2: "Oh, mes Pokémon Oiseaux ont chuté !\nTrès bien.",
      3: "Même si je suis tombée, mes Pokémon continueront à voler !"
    },
    "defeat": {
      1: "Mes Pokémon Oiseaux et moi danserons toujours avec grâce !",
      2: "J’espère que tu as apprécié notre spectacle.\nNotre danse gracieuse est terminée.",
      3: "Reviendras-tu voir notre élégante chorégraphie ?"
    }
  },
  "tate": {
    "encounter": {
      1: "Héhéhé...\nSurprise de me voir sans ma sœur ?",
      2: "Je sais ce que tu penses...\nTu veux te battre !",
      3: "Comment vaincre quelqu’un...\nQui connaît chacun de tes mouvements ?"
    },
    "victory": {
      1: "On n’y peut rien...\nTatia me manque...",
      2: "Ton lien avec tes Pokémon était bien plus fort que le mien...",
      3: "Si j’étais avec Tatia, nous aurions gagné.\nOn arrive à communiquer par la pensée !"
    },
    "defeat": {
      1: "Mes combinaisons ont eu raison de toi !",
      2: "Si tu ne peux pas me vaincre, tu ne pourras jamais non plus vaincre Tatia.",
      3: "Tout cela grâce à mon entraînement strict avec Tatia.\nJe peut atteindre une parfaite harmonie avec mes Pokémon."
    }
  },
  "liza": {
    "encounter": {
      1: "Hihihi...\nTu es surpris de me voir sans mon frère ?",
      2: "Je vois ce que tu désires...\nTu veux te battre, n’est-ce pas ?",
      3: "Comment vaincre quelqu’un...\nQui ne fait qu’un avec ses Pokémon ?"
    },
    "victory": {
      1: "On n’y peut rien...\nLévy me manque...",
      2: "Ton lien avec tes Pokémon...\Il est plus fort que le mien...",
      3: "Si j’étais avec Lévy, on aurait gagné.\nOn arrive à communiquer par la pensée !"
    },
    "defeat": {
      1: "Mes combinaisons ont eu raison de toi !",
      2: "Si tu ne peux pas me vaincre, tu n’arriveras pas non plus à vaincre Lévy.",
      3: "C’est grâce à mon entraînement strict avec Lévy.\nJe peux atteindre une parfaite harmonie avec mes Pokémon."
    }
  },
  "juan": {
    "encounter": {
      1: "Ah, il n’est plus le temps d’être timide.\nPrépare-toi !",
      2: "Tes yeux vont se repaître des illusions aquatiques de mes Pokémon !",
      3: "Un typhon approche !\nSauras-tu y résister ?",
      4: `Prépare-toi à assister à une véritable démonstration de talent.
         $Une œuvre sur le thème de l’eau composée par mes Pokémon et moi.`
    },
    "victory": {
      1: "Tu es peut-être un génie capable de tenir tête à Marc !",
      2: "Je me suis concentré sur l’élégance pendant que tu t’entraînais. C’est tout naturellement que tu m’as vaincu.",
      3: "Ha ha ha !\nTrès bien, tu as gagné, cette fois.",
      4: "De toi, je sens l’éclat brillant d’une habileté qui vaincra tout."
    },
    "defeat": {
      1: "Mes Pokémon et moi avons sculpté une illusion d’eau et en sommes sortis victorieux.",
      2: "Ha ha ha, la victoire est mienne et tu as perdu.",
      3: "Dois-je te prêter ma tenue ? Cela pourrait t’aider à te battre !\nHa ha ha! Je plaisante !",
      4: "Le dandysme, c’est un art de vivre !\nCe que j’aime, c’est gagner avec élégance..."
    }
  },
  //sinnoh 4g
  "roark": {
    "encounter": {
      1: "J’ai besoin de voir ton potentiel en tant que Dresseur. Et j’ai besoin de voir la robustesse des Pokémon qui combattent avec toi !",
      2: "Voici mes Pokémon Roche ! J’en suis super fier !",
      3: "Je ne suis qu’un Dresseur combattant fièrement avec des Pokémon Roche !",
      4: "Jour après jour, je creuse pour trouver des fossiles, et j’entraîne mes Pokémon. Tu vas voir comme ils sont géniaux !"
    },
    "victory": {
      1: "Quoi ? Impossible ! Mes Pokémon Roche, entraînés si dur !",
      2: "J’ai perdu ? Bon, je vais aller me consoler en cherchant des fossiles dans les sous-sols de Sinnoh.",
      3: "Avec un talent comme le tien, c’est normal que tu gagnes.",
      4: "Comment ? Impossible ! Mes Pokémon étaient prêts !",
      5: "J’ai perdu."
    },
    "defeat": {
      1: "Alors ? Ils sont géniaux, mes Pokémon Roche, n’est-ce pas ?",
      2: "Merci ! Avec cette victoire, je sens que je suis assez fort pour défier mon papa !",
      3: "J’ai l’impression d’avoir fracassé un rocher vraiment tenace !"
    }
  },
  "gardenia": {
    "encounter": {
      1: "Tu as l’aura d’un as. Enfin, ce combat s’annonce amusant. En garde !"
    },
    "victory": {
      1: "Incroyable ! Tu as beaucoup de talent !"
    },
    "defeat": {
      1: "On a vraiment assuré, mes Pokémon et moi !"
    }
  },
  "maylene": {
    "encounter": {
      1: `Je prends le combat très au sérieux et je fais toujours de mon mieux !
         $Allez, c’est quand tu veux !`
    },
    "victory": {
      1: "Je dois admettre ma défaite..."
    },
    "defeat": {
      1: "C’était génial."
    }
  },
  "crasher_wake": {
    "encounter": {
      1: "Tu as l’honneur de t’adresser au grand Lovis le Teigneux !\nTu vas boire la tasse !",
      2: "Mes Pokémon encaisseront toutes tes attaques, sans exception, et te feront boire la tasse !",
      3: "Le ring, c’est mon océan ! Sur les flots déchaînés, monde flottant ! C’est moi, LO-VIS ! LO-VIS !!"
    },
    "victory": {
      1: "Har, har, har ! C’était un régal ! Merci pour ce combat !",
      2: "Ouah ! La tension est retombée ! Comment dire... ? J’en veux encore ! Je voulais continuer à me battre !",
      3: "QUOOOOI ?!"
    },
    "defeat": {
      1: "Ouaaaais ! ",
      2: "J’ai gagné... mais j’en veux encore !\nJe voulais continuer à me battre !",
      3: "À un de ces jours !"
    }
  },
  "fantina": {
    "encounter": {
      1: `Toi et moi, c’est challenge !
         $Je vais gagner, because je suis Champion d’Arène d’Unionpolis.`
    },
    "victory": {
      1: "Tu es tellement powerful. Je perdu, sans aucun doubt."
    },
    "defeat": {
      1: "Tu es powerful, darling... Mais c’est moi qui ai la victory !"
    }
  },
  "byron": {
    "encounter": {
      1: `Tu es un bien jeune Dresseur, comme mon fils Pierrick !
         $Je crois, vois-tu, que les jeunes sont la clé d’un avenir radieux pour les Pokémon !
         $Moi, Charles, le protecteur des jeunes Dresseurs et du futur des Pokémon... aurai donc le plaisir de t’affronter !`
    },
    "victory": {
      1: "Hum ! Mes robustes Pokémon, anéantis ?!"
    },
    "defeat": {
      1: "Gwahaha ! Alors, qu’en dis-tu ? Ne sont-ils pas robustes, mes Pokémon ?!"
    }
  },
  "candice": {
    "encounter": {
      1: `Tu veux me défier ? Bien sûr ! J’attendais un Dresseur coriace !$
      Laisse-moi te dire une chose, je tire ma force de ma concentration.`,
      2: `Les Pokémon, la mode, l’amour... C’est une question de concentration !
         $Je vais t’en faire la démonstration. Tu peux numéroter tes abattis !`
    },
    "victory": {
      1: "Je me suis prise de sympathie pour toi ! Il se pourrait même que je t’admire...",
      2: `Waouh ! Tu es fantastique ! Tu viens de gagner mon respect !
         $Je suis stupéfaite par ta concentration et ta volonté.`
    },
    "defeat": {
      1: "J’ai bien senti ta concentration, mais... Elle n’a pas suffi pour me battre !",
      2: "On est super concentrés, hein, mes Pokémon et moi !"
    }
  },
  "volkner": {
    "encounter": {
      1: "J’aimerais que tu m’aides à retrouver le plaisir des combats de Pokémon ! Mets-m’en plein la vue !"
    },
    "victory": {
      1: `Tu m’as battue...
         $Cette volonté et la manière noble dont tes Pokémon ont combattu pour toi...
         $J’en ai eu des frissons tout le long ! C’était un très beau combat.`
    },
    "defeat": {
      1: "Ce combat m’a laissé de glace... alors que je voulais retrouver la flamme !"
    }
  },
  //unys 5g
  "chili": {
    "encounter": {
      1: "Ouais ! Ouais ! Tu vas t’fritter avec le plus fort de la fratrie !",
      2: "C’est moi, Armando, j’vais t’exploser avec mes Pokémon !",
      3: "J’vais te cramer la tête avec mes Pokémon !"
    },
    "victory": {
      1: "Mince... Me v’là cramé !",
      2: "Pfiou... T’es vraiment à fond !",
      3: "J’me suis fait cramer !"
    },
    "defeat": {
      1: "Ça chauffe, ça brûle ! Je suis tout feu tout flamme !",
      2: "Quand tu joues avec le feu, tu t’brûles !",
      3: "T’inquiète, c’était écrit d’avance. Fallait pas tomber sur moi, c’est tout !"
    }
  },
  "cilan": {
    "encounter": {
      1: `Rien de personnel... Pas de rancune... Moi et mes Pokémon Plante allons..
         $Euh... Nous allons nous battre... coûte que coûte.`,
      2: "Donc... Si ça ne te dérange pas... Je serai... ton adversaire.",
      3: "Très bien... Je suis Rachid. J’aime... le type Plante."
    },
    "victory": {
      1: "Oh... Donc c’est fini ?",
      2: `... Quelle surprise. Tu es... très forte, n’est-ce pas ?
         $J’imagine que mes frères... n’auraient pas été capables... de te vaincre non plus...`,
      3: "Le timing... la synchronisation, là... C’est pas encore ça..."
    },
    "defeat": {
      1: "Hein ? ... J’ai gagné ?",
      2: `Je suppose que...
         $J’ai gagné... parce que je m’entraîne... avec mes frères Armando et Noa... et nous avons tous pu devenir plus forts.`,
      3: "C’était... une expérience assez passionnante..."
    }
  },
  "cress": {
    "encounter": {
      1: "Excellent ! Moi, Noa, grand amateur du type Eau, vais avoir le plaisir de t’affronter !"
    },
    "victory": {
      1: "Moi ? Perdre ? Je n’y crois pas."
    },
    "defeat": {
      1: "Tu affrontais Noa. C’est donc le plus logique des résultats."
    }
  },
  "cheren": {
    "encounter": {
      1: "Tu me rappelles un vieil ami. Cela m’enthousiasme pour ce combat !",
      2: `Veux-tu simplement montrer ta force ou comprendre l’essence du combat ?
         $Les combats de Pokémon n’ont aucun sens si l’on ne réfléchit pas à cela.`,
      3: "Je m’appelle Tcheren. Je suis Champion d’Arène et professeur à Pavonnay. Ravi de te rencontrer !"
    },
    "victory": {
      1: "Merci ! J’ai vu ce qui manquait en moi.",
      2: "Merci ! Tu m’as montrée la voie... pour me rapprocher de mon idéal.",
      3: "Hmm... C’est problématique."
    },
    "defeat": {
      1: "En tant que Champion d’Arène, mon objectif est d’être un mur à surmonter.",
      2: "Très bien !",
      3: `Toi et moi, comme tous les Dresseurs, nous avons les Pokémon à nos côtés !
         $C’est cela qui nous fait avancer. Ils nous accompagnent et nous donnent la force d'y croire.`
    }
  },
  "lenora": {
    "encounter": {
      1: "Ta façon de te battre va me permettre de déterminer si tu as entraîné tes Pokémon avec amour !"
    },
    "victory": {
      1: `Mes hypothèses étaient justes, tu as autant de talent que je le pensais !
         $C’est un plaisir d’avoir fait ta connaissance !`
    },
    "defeat": {
      1: "Hahaha ! Maintenant, il faut que tu analyses ta défaite pour qu’elle te serve par la suite !"
    }
  },
  "roxie": {
    "encounter": {
      1: "Let’s rock ! Ca va twister dans ta p’tite tête !"
    },
    "victory": {
      1: "Tu déchires ! C’est toi qui m’as twistée la tête !"
    },
    "defeat": {
      1: "Non ! Ça ne va pas du tout ! Tu ne te lâches pas assez !"
    }
  },
  "burgh": {
    "encounter": {
      1: `Hmm... Si je gagne ce combat, cela me donnera l’inspiration pour un tableau d’un tout nouveau style.
         $Les combats, il n’y a rien de mieux pour stimuler l’imagination. Allons ! La postérité nous attend !`,
      2: `Sois en sûr, je suis fier de chacun de mes Pokémon !
         $Allons ! Que ce combat soit digne de mes plus grands chefs-d’œuvre !`
    },
    "victory": {
      1: "Hélas, ma muse, j’ai perdu... Je ne pouvais que céder face à tant de force !",
      2: "Quel final ! J’en suis émerveillé !"
    },
    "defeat": {
      1: "Quelle... quelle stupéfiante beauté ! C’était... magnifique!",
      2: `Parfois, on parle de victoire peu reluisante.
         $Mais chaque méthode de combat a sa beauté, du moment que l’on fait de son mieux.`
    }
  },
  "elesa": {
    "encounter": {
      1: `Rien que de penser à ce futur combat, ça me fait des étincelles partout !
         $Je veux cette sensation et pour ça, je suis prête à te faire tourner la tête !`
    },
    "victory": {
      1: "Je voulais te donner le vertige, mais c’est toi qui m’as fait vibrer."
    },
    "defeat": {
      1: "Ça ne me suffit pas... La prochaine fois, j’espère que tu donneras tout ce que tu as."
    }
  },
  "clay": {
    "encounter": {
      1: "Vindiou ! T’en as mis du temps, tu sais ? C’est le moment de voir c’que t’as dans le ventre !"
    },
    "victory": {
      1: "Vindiou ! Ça fait drôle de perdre, quand on se donne à fond !"
    },
    "defeat": {
      1: `C’qui compte, c’est c’que tu fais d’tes défaites.
          $Ceux qui savent s’en servir pour grandir, c’est eux qu’sont les plus forts !`
    }
  },
  "skyla": {
    "encounter": {
      1: `Les combats Pokémon, c’est le top, n’est-ce pas ?
          $Les sommets, j’adore ça... D’en haut, on peut voir tellement loin.
          $Allez, toi et moi, on va bien s’amuser !`
    },
    "victory": {
      1: "Grâce à toi, je sens que je suis devenue plus forte... Merci !"
    },
    "defeat": {
      1: "Qu’on gagne ou qu’on perde, il y a toujours à apprendre d’un combat."
    }
  },
  "brycen": {
    "encounter": {
      1: `Vivre parmi les humains et les Pokémon ouvre la voie vers la puissance.
          $Montre-moi ce qu’il en est de toi !`
    },
    "victory": {
      1: "Quelle combinaison magnifique vous faites, toi et tes Pokémon. Quelle belle amitié !"
    },
    "defeat": {
      1: "Se battre... jusqu’au bout ! Tenter le diable ! Endurer et grandir !"
    }
  },
  "drayden": {
    "encounter": {
      1: `Je cherche de jeunes Dresseurs capables d’incarner un avenir radieux.
          $Il me faut donc voir ce que tu vaux : pour ce faire, mon expérience et mon amour pour les Pokémon ne seront pas de trop !`
    },
    "victory": {
      1: "Cette ardeur que je ressens dans la défaite, comment l’exprimer... ?"
    },
    "defeat": {
      1: "Voyons ! Je pense que tu vaux bien mieux que ça !"
    }
  },
  "marlon": {
    "encounter": {
      1: "T’as l’air balèze, toi. Allez, on démarre ?",
      2: "La mer est vaste et profonde, comme ma puissance, en fait. Tu vas en rester baba.",
      3: "Waaah... C’est toi, mon adversaire ? Cool... On va se faire un match de dingos !"
    },
    "victory": {
      1: "T’es balèze comme un océan en furie, et cool comme une mer d’huile...",
      2: "T’as pas juste l’air balèze, tu l’es vraiment, en fait. J’en reste baba !",
      3: "Tu étais comme un vrai tourbillon qui aspire tout !"
    },
    "defeat": {
      1: "T’es balèze, mais pas assez pour refouler la marée !",
      2: "Hop ! On dirait que j’ai encore gagné !",
      3: "Super, à moi la victoire !"
    }
  },
  //kalos 6g
  "viola": {
    "encounter": {
      1: `Qu’il s’agisse des larmes de la défaite ou de la joie de la victoire...
          $ Tous les sujets méritent d’être immortalisés par mon appareil, du moment qu’ils expriment quelque chose de fort.
          $Tu feras un sujet sensationnel ! Oui, oui !`,
      2: "J’ai toujours l’œil rivé sur mon objectif ... et sur la victoire !"
    },
    "victory": {
      1: "Tu m’as battue en beauté ! Fantastique ! Vraiment fantastique !",
      2: `Il y a des choses qu’on ne commence à voir qu’après les avoir remarquées à travers le viseur !
          $De la même façon, il y a certaines choses auxquelles on ne fait attention qu’en vivant avec les Pokémon.`
    },
    "defeat": {
      1: "Le cliché de ma victoire sera un instantané d’éternité !",
      2: "Oui ! J’ai pris de superbes photos !"
    }
  },
  "grant": {
    "encounter": {
      1: `Je n’ai qu’un seul souhait :
          $Du haut de chaque sommet conquis, pouvoir contempler le prochain qui m’attend.`
    },
    "victory": {
      1: "Une nouvelle paroi se dresse devant moi... Et cette fois, c’est de toi qu’il s’agit."
    },
    "defeat": {
      1: "Il ne faut jamais abandonner. C’est aussi simple que ça.",
    }
  },
  "korrina": {
    "encounter": {
      1: "En piste avec Cornélia !"
    },
    "victory": {
      1: "Les Pokémon évoluent parce que TU es là !"
    },
    "defeat": {
      1: "Quel combat explosif !"
    }
  },
  "ramos": {
    "encounter": {
      1: "Tu es prêt pour ta coupe de printemps, Maîtresse en herbe ? Hé hé !"
    },
    "victory": {
      1: "Ton équipe a foi en toi, et tu as toute confiance en elle... Ce combat m’a comblé !"
    },
    "defeat": {
      1: "Ha ha ha ! Quand je dis que mes petites plantes peuvent percer l’asphalte !"
    }
  },
  "clemont": {
    "encounter": {
      1: "Alors, Dresseuse, tu es prêt ? Il va falloir donner le meilleur de nous-mêmes !"
    },
    "victory": {
      1: "Rien de tel qu’observer les plus grands pour apprendre un maximum ! Merci de la leçon."
    },
    "defeat": {
      1: "Entraînomatron de Dresseurs : essai validé. On dirait qu’il fonctionne sans problème."
    }
  },
  "valerie": {
    "encounter": {
      1: `Bonjour, ma petite. Alors, on a réussi à arriver jusqu’ici ? Bien.
          $Tu vas pouvoir goûter au chic de ma collection Pokémon, le fameux type Fée, façon Valériane.
          $Le thème de cette année : Douceur, Rondeurs et Vigueur.`
    },
    "victory": {
      1: "Quelle joie... Que demain t’apporte autant de sourires."
    },
    "defeat": {
      1: "Oh... Quelle tristesse."
    }
  },
  "olympia": {
    "encounter": {
      1: "Voici la Tradition ! Que le combat commence !"
    },
    "victory": {
      1: "Je sens... je SAIS ! Rien ne t’arrêtera. Ta force pourra même déplacer les étoiles !"
    },
    "defeat": {
      1: "Notre futur... Il est clair, à présent."
    }
  },
  "wulfric": {
    "encounter": {
      1: `Toutes ces histoires de combattre pour renforcer nos liens ou pour mieux s’comprendre...
          $Moi je dis, tout ça, c’est du blabla !
          $On se bat pour s’amuser ! Alors, sors ton équipe, et éclatons-nous !`
    },
    "victory": {
      1: "C’est bien ça, c’est bien ! C’est une bonne façon de briser la glace !"
    },
    "defeat": {
      1: "Lutte avec moi et voilà ce qui se passe !"
    }
  },
  //galar 8g
  "milo": {
    "encounter": {
      1: `Tu as de très bons instincts, en ce qui concerne les Pokémon.
          $Tu les comprends. Ce combat s’annonce serré !
          $Je vais devoir me donner à fond si je ne veux pas que tu me coupes l’herbe sous le pied !`
    },
    "victory": {
      1: "Mes Pokémon sont tout fanés... Tu as du talent, ça se voit !"
    },
    "defeat": {
      1: "Cela me laisse vraiment sous le choc..."
    }
  },
  "nessa": {
    "encounter": {
      1: "Peu importe le type de plan que tu es en train de comploter, mon partenaire et moi serons sûrs de le faire échouer.",
      2: "Je ne suis pas là pour discuter. Je suis là pour gagner !",
      3: "C’est un petit cadeau de mon Pokémon... J’espère que tu vas l’accepter !"
    },
    "victory": {
      1: "Toi et tes Pokémon êtes simplement trop forts...",
      2: "Comment... ? Comment est-ce possible ?!",
      3: "Tu as fait boire la tasse à tous les membres de mon équipe !"
    },
    "defeat": {
      1: "La vague déchaînée s’écrase à nouveau !",
      2: "Il est temps de surfer sur la vague de la victoire !",
      3: "Héhéhé !"
    }
  },
  "kabu": {
    "encounter": {
      1: `Laisse-moi te dire une chose sur les combats Pokémon : l’entraînement, ça ne fait pas tout.
          $Tout le monde peut s’entraîner. Mais il faut aussi être capable de tout donner au moment crucial.`
    },
    "victory": {
      1: "Ta victoire est méritée."
    },
    "defeat": {
      1: "C’est une excellente façon pour moi de constater mes progrès !"
    }
  },
  "bea": {
    "encounter": {
      1: `Dirais-tu que tu possèdes un esprit paré à toute épreuve ?
          $Laisse-moi donc en juger par moi-même.`
    },
    "victory": {
      1: "J’ai ressenti l’esprit combatif de tes Pokémon."
    },
    "defeat": {
      1: "C’était le meilleur match que l’on puisse espérer."
    }
  },
  "allister": {
    "encounter": {
      1: "... Je... je suis Alistair...\nBa... battons-nous."
    },
    "victory": {
      1: "Tu es... très forte...\nJ’ai failli... en perdre... mon masque..."
    },
    "defeat": {
      1: "J’ai... réussi... !"
    }
  },
  "opal": {
    "encounter": {
      1: "Voyons comment ton partenaire et toi résistez à la pression."
    },
    "victory": {
      1: "Tu manques un peu de féerie, mais tu te débrouilles plutôt bien !"
    },
    "defeat": {
      1: "Dommage pour toi, j’imagine."
    }
  },
  "bede": {
    "encounter": {
      1: "Laisse-moi te montrer en combat l’étendue du gouffre qui nous sépare."
    },
    "victory": {
      1: "Je vois... Bah. De toute façon, je n’étais même pas à fond."
    },
    "defeat": {
      1: "Pas mal, j’imagine."
    }
  },
  "gordie": {
    "encounter": {
      1: "Bon, finissons-en."
    },
    "victory": {
      1: "Moi qui pensais te vaincre sans problème... je tombe de haut."
    },
    "defeat": {
      1: "Bats-toi comme tu le fais toujours, la victoire suivra !"
    }
  },
  "melony": {
    "encounter": {
      1: "Je ne vais pas me retenir !",
      2: "Très bien, je suppose que nous devrions commencer.",
      3: "Il est temps pour toi de trembler de froid..."
    },
    "victory": {
      1: "Tu... Tu es plutôt forte, hein ?",
      2: "Si tu vois mon fils dans les parages, assure-toi de lui donner une bonne raclée, d’accord ?",
      3: "Quand je parlais de briser la glace, c’était juste une métaphore..."
    },
    "defeat": {
      1: "Alors, tu vois à quel point les combats peuvent être sévères ?",
      2: "Héhéhé ! On dirait que j’ai encore gagné !",
      3: "Est-ce que tu te retenais ?"
    }
  },
  "piers": {
    "encounter": {
      1: "Prépare-toi à un combat épique, avec moi et mon équipe ! Smashings, let’s rock !"
    },
    "victory": {
      1: "Au moins, on aura tout donné, mon groupe et moi. On se reverra..."
    },
    "defeat": {
      1: "J’ai la gorge fatiguée à force de crier... Mais c’était un combat passionnant !"
    }
  },
  "marnie": {
    "encounter": {
      1: `En vérité, quand j’en aurais fini... J’compte dev’nir Championne !
          $Donc ça n’a rien d’personnel quand j’dit que j’vais te remballer !`
    },
    "victory": {
      1: "OK, j’ai perdu... Mais j’ai pu voir les bons points d’toi et tes Pokémon."
    },
    "defeat": {
      1: "Alors, t’as apprécié mes techniques ?"
    }
  },
  "raihan": {
    "encounter": {
      1: "Je vais gagner ce combat, puis battre Tarak et prouver que la star de Galar, c’est moi !"
    },
    "victory": {
      1: "J’ai perdu mais je garde ma dignité. Je prendrai un selfie en souvenir de ce jour..."
    },
    "defeat": {
      1: "Ah ouais, ça mérite un petit selfie pour fêter ça !"
    }
  },
  //paldea 9g
  "katy": {
    "encounter": {
      1: "Ne sous-estime pas mes Pokémon Insecte si tu ne veux pas que les tiens en \"pâtissent\" !"
    },
    "victory": {
      1: "Oh non, tous mes Pokémon sont au bout du rouleau à pâtisserie..."
    },
    "defeat": {
      1: "Et voilà, j’ai gagné !"
    }
  },
  "brassius": {
    "encounter": {
      1: "J’espère que tu es parée. Commençons... notre création !!!"
    },
    "victory": {
      1: "Quel avant-gardisme !!!"
    },
    "defeat": {
      1: "Il me faut étancher ma soif d’art !"
    }
  },
  "iono": {
    "encounter": {
      1: `Alors, comment tu te sens ?
         $Allez, on commence le stream ! Quelle est la puissance de notre challenger ? 
         $’Cune idée ! Découvrons-le ensemble !`,
    },
    "victory": {
      1: "T’es plus lumineuse et foudroyante qu'un Giga-Tonnerre !"
    },
    "defeat": {
      1: "Oubliez pas de laisser un like et de vous abonner !"
    }
  },
  "kofu": {
    "encounter": {
      1: `L’eau des rivières va dans la mer, s’évapore dans les nuages, puis redevient de la pluie.
          $Moi, je suis aussi imprévisible qu’un torrent furieux ! Alors, essaie un peu de me résister !`
    },
    "victory": {
      1: "Mouah ha ha ! J’ai dégusté !"
    },
    "defeat": {
      1: "Reviens tenter ta chance quand tu veux !"
    }
  },
  "larry": {
    "encounter": {
      1: "Pourquoi tout compliquer inutilement ? Rien ne vaut la simplicité."
    },
    "victory": {
      1: "Hmpf... Tu m'as fait goûter à la défaite."
    },
    "defeat": {
      1: "Le combat est terminé."
    }
  },
  "ryme": {
    "encounter": {
      1: "T’es bien jolie, p’tit challenger !\nDonne tout ce que t’as, vas-y, fais-moi peur !"
    },
    "victory": {
      1: "T’es grave cool, cousine, c’est dingue !\nJ’ai l’âme qui vibre à toute berzingue !"
    },
    "defeat": {
      1: "Laïm, out. Peace !"
    }
  },
  "tulip": {
    "encounter": {
      1: "Je vais user de mon talent pour rendre tes Pokémon encore plus resplendissants !"
    },
    "victory": {
      1: "Tu es plus tenace qu’un mascara waterproof !"
    },
    "defeat": {
      1: "Dans mon travail, les gens qui manquent de talent dans un domaine ou un autre disparaissent souvent rapidement et on n’en entend plus jamais parler."
    }
  },
  "grusha": {
    "encounter": {
      1: "Il suffit que je te congèle jusqu’au os, et tout ira bien."
    },
    "victory": {
      1: "La flamme qui brûle en toi... J’avoue qu’elle m’émeut quelque peu."
    },
    "defeat": {
      1: "Pas de chance."
    }
  },
  //conseil 4 kanto 1g
  "lorelei": {
    "encounter": {
      1: `Je suis la maîtresse incontestée des Pokémon Glace. Personne ne peut les vaincre.
          $Car ma foi, une fois gelée, ton équipe sera à ma merci ! C’est parti !`
    },
    "victory": {
      1: "Cela ne devait pas se passer ainsi !"
    },
    "defeat": {
      1: "Il n’y a rien que tu puisses faire une fois que tu es gelée."
    }
  },
  "bruno": {
    "encounter": {
      1: "Ton équipe, j’vais en faire du yaourt ! À table !"
    },
    "victory": {
      1: "Moi ? Perdre ? Pourquoi ?"
    },
    "defeat": {
      1: "Tu peux me défier autant que tu veux, mais le résultat ne changera jamais !"
    }
  },
  "agatha": {
    "encounter": {
      1: "La nature des Pokémon, c’est de combattre ! Je vais te montrer ce qu’est un vrai combat de Dresseurs !"
    },
    "victory": {
      1: "Oh ho ! Pas mal, tu as du talent !"
    },
    "defeat": {
      1: "Hin hin, voilà comment on fait !"
    }
  },
  "lance": {
    "encounter": {
      1: "Enfin... J’ai entendu parler de toi ! Permets-moi de mesurer tes compétences.",
      2: "Je suis Peter, le légendaire Dracologue. À nous deux !"
    },
    "victory": {
      1: "Tu m’as vaincue. Tu es magnifique !",
      2: "Incroyable ! Ça me fait mal de l’admettre, mais tu as un vrai talent pour les combats Pokémon."
    },
    "defeat": {
      1: "Je n’abandonne jamais. Toi non plus d’ailleurs ?",
      2: "Crois-moi, tu n’es pas faible. Ne laisse pas cette défaite te perturber."
    }
  },
  //conseil 4 johto 2g
  "will": {
    "encounter": {
      1: `J’ai parcouru le monde pour tout connaître sur les Pokémon de type Psy.
          $Je continue toujours à m’améliorer ! Je ne peux pas perdre maintenant !`
    },
    "victory": {
      1: "C’est... Incroyable..."
    },
    "defeat": {
      1: "Ta victoire était proche. Je me demande ce qu’il te manquait."
    }
  },
  "koga": {
    "encounter": {
      1: "Fwah ha ha ! Il est temps de t’apprendre que certains Pokémon ne peuvent pas être vaincus par la force pure !"
    },
    "victory": {
      1: "Hmmm... Tu es un honorable adversaire."
    },
    "defeat": {
      1: "As-tu appris à craindre mes techniques ninja ?"
    }
  },
  "karen": {
    "encounter": {
      1: "Je suis Marion. Tu veux te frotter à mes Pokémon de type Ténèbres ?",
      2: "Je ne suis pas comme ceux que tu as déjà rencontrés.",
      3: "Tu dois avoir une charmante équipe pour être arrivé jusqu’ici. Notre combat sera intéressant."
    },
    "victory": {
      1: "Non ! Je ne peux pas gagner. Comment peux-tu être aussi forte ?",
      2: "Je ne m’écarterai pas du chemin que j’ai choisi.",
      3: "Le Maître a hâte de te rencontrer."
    },
    "defeat": {
      1: "C’est à peu près ce à quoi je m’attendais.",
      2: "Eh bien, c’était amusant... relativement.",
      3: "Viens me rendre visite à tout moment."
    }
  },
  //conseil 4 hoenn 3g
  "sidney": {
    "encounter": {
      1: `T’as du courage de me regarder en face !
          $Je sens qu’on va bien s’amuser. Haha ! Bon !
          $Nous allons livrer un combat trépidant comme on ne peut en voir qu’ici !`
    },
    "victory": {
      1: "Allons bon, voilà que j’ai perdu ! Bah, l’important est d’avoir apprécié le combat."
    },
    "defeat": {
      1: "Pas de rancune, OK ?"
    }
  },
  "phoebe": {
    "encounter": {
      1: `Durant mon entraînement, j’ai appris à communier avec les Pokémon de type Spectre.
          $Oui, le lien que j’ai créé avec eux est très étroit.
          $Viens ! On verra si tu arrives à infliger des dégâts à mes Pokémon !`
    },
    "victory": {
      1: "Ça alors, tu m’as battue !"
    },
    "defeat": {
      1: "J’ai hâte de pouvoir t’affronter à nouveau !"
    }
  },
  "glacia": {
    "encounter": {
      1: `Je n’ai rencontré ici que des Dresseurs et des Pokémon frêles.
          $Et toi, mérites-tu le temps que je t’accorde ?
          $Ça me ferait extrêmement plaisir de pouvoir enfin utiliser toute ma puissance !`
    },
    "victory": {
      1: "L’affection qui te lie à tes Pokémon me fait fondre !"
    },
    "defeat": {
      1: "Une bataille acharnée et passionnée, en effet."
    }
  },
  "drake": {
    "encounter": {
      1: `Combattre en s’alliant avec les Pokémon, tu sais ce que ça représente ? Tu sais ce qu’il faut pour y parvenir ?
          $Si tu ne le sais pas, alors tu ne pourras jamais me vaincre !`
    },
    "victory": {
      1: "Superbe ! Je n’ai rien à ajouter !"
    },
    "defeat": {
      1: "J’ai donné tout ce que j’avais dans ce combat !"
    }
  },
  //conseil 4 sinnoh 4g
  "aaron": {
    "encounter": {
      1: `Si je me bats ici, c’est pour devenir parfait, comme les Pokémon Insecte !
          $Alors que le duel commence !`
    },
    "victory": {
      1: "J’accepte ma défaite."
    },
    "defeat": {
      1: "La victoire en Ligue Pokémon n’est pas si facile."
    }
  },
  "bertha": {
    "encounter": {
      1: `Ma spécialité, c’est les Pokémon de type Sol.
          $Et si tu montrais à une vieille dame ce dont la nouvelle garde est capable ?`
    },
    "victory": {
      1: "Eh bien ! Mon chou, je dois dire que je suis impressionnée."
    },
    "defeat": {
      1: "Ha ha ha ! On dirait que c’est l’ancienne génération qui l’emporte !"
    }
  },
  "flint": {
    "encounter": {
      1: `Prépare-toi à affronter des Pokémon de type Feu !
          $Montre-moi si la flamme du combat brûle en toi !`
    },
    "victory": {
      1: "... ... Waouh... Que dire... Tu m’as réduit en cendres..."
    },
    "defeat": {
      1: "Hein ? C’est tout ? Je pense qu’il te faut plus de passion."
    }
  },
  "lucian": {
    "encounter": {
      1: `Veux-tu bien patienter un instant ? J’ai bientôt terminé mon livre...
          $Le protagoniste s’apprête à affronter une ultime épreuve, armé de son épée sacrée...
          $Oh, mais puisque tu as fait tout ce chemin, il serait bien impoli de ma part de te faire patienter davantage.
          $Battons-nous donc. Prouve-moi que ta force égale celle du protagoniste de mon livre !`
    },
    "victory": {
      1: "... Échec et mat."
    },
    "defeat": {
      1: "J’ai une réputation à tenir."
    }
  },
  //conseil 4 unys 5g
  "shauntal": {
    "encounter": {
      1: "Excuse-moi. Tu es un challenger, n’est-ce pas ? Je suis Anis, la reine des Pokémon Spectre, ton adversaire !",
      2: "J’adore coucher sur papier des histoires où Dresseurs et Pokémon venus me défier s’entendent parfaitement. Mériteras-tu d’être un de mes sujets ?",
      3: "Chaque personne qui travaille avec mes Pokémon a une histoire à raconter. Quelle histoire est sur le point d’être contée ?"
    },
    "victory": {
      1: "Alors là, j’en reste coite, muette, bouche bée, sidérée, sciée quoi !",
      2: "Tout d’abord, je dois m’excuser auprès de mes Pokémon... Je suis vraiment désolée que vous ayez eu une mauvaise expérience à cause de moi !",
      3: "Malgré cette défaite, je reste membre du Conseil 4 !"
    },
    "defeat": {
      1: "Héhé.",
      2: "Ce sera excellent dans mon prochain roman !",
      3: "Et ainsi, un autre conte se termine..."
    }
  },
  "marshal": {
    "encounter": {
      1: "Je m’appelle Kunz. Premier apprenti de Maître Goyah. Il est de mon devoir de tester moi-même ce que tu vaux. Go !",
      2: "La victoire, et une décisive, voilà ce que je veux ! Challenger, prépare-toi !",
      3: "Je crois en la force au combat. La force des convictions porte les coups gagnants. Surtout, il faut rêver sans cesse à une écrasante victoire !"
    },
    "victory": {
      1: "Ouf ! Bien joué !",
      2: "Au fur et à mesure que tes combats se poursuivent, vise des hauteurs encore plus élevées !",
      3: "La force dont toi et tes Pokémon avez fait preuve m’a profondément impressionné..."
    },
    "defeat": {
      1: "Hmm.",
      2: "C’était un bon combat.",
      3: "Haaah ! Haaah ! Haiyaaaah !"
    }
  },
  "grimsley": {
    "encounter": {
      1: "Le gagnant remporte tout, le perdant ne garde rien !"
    },
    "victory": {
      1: "Lorsque quelqu’un gagne un combat, forcément, il y a un vainqueur et un vaincu. La prochaine fois, je serai le vainqueur !"
    },
    "defeat": {
      1: "Lorsque quelqu’un gagne un combat, la personne affrontée est forcément un perdant."
    }
  },
  "caitlin": {
    "encounter": {
      1: `Me voici, moderne flore, aurore aux doigts de rose, fraîchement éclose. Et te voilà...
          $Dresseur alliant... force et bonté ?
          $Moi, Percila, ne te demande qu’une chose : un duel nécessitant la force ultime.
          $J’espère que tu ne me décevras pas.`
    },
    "victory": {
      1: "Je suis heureuse d’avoir pu affronter de tels adversaires. Mes Pokémon et moi-même en sortons grandis."
    },
    "defeat": {
      1: "J’aspire à remporter la victoire avec élégance et grâce."
    }
  },
  //conseil 4 kalos 6g
  "malva": {
    "encounter": {
      1: "Je brûlais d’impatience. Je brûlais... de haine et de rancœur !!!"
    },
    "victory": {
      1: "Et notre challenger triomphe brillamment de Malva du Conseil 4 !"
    },
    "defeat": {
      1: "Je suis ravie ! Oui, ravie d’avoir pu t’écraser sous mon talon !"
    }
  },
  "siebold": {
    "encounter": {
      1: "Tant que je vivrai, je continuerai à exalter mon amour des bonnes choses et le plaisir que je retire des combats !"
    },
    "victory": {
      1: "Ce combat avec toi restera pour toujours gravé dans mon cœur."
    },
    "defeat": {
      1: "Ce combat m’aura apporté autant de satisfaction qu’un bon repas. J’espère par ces mots te montrer à quel point j’estime que tu te sois donné corps et âme."
    }
  },
  "wikstrom": {
    "encounter": {
      1: `Willecomme, preu Dresseur ! Je suis le chevalier a l’armeure d’acier, Thyméo.
          $Les miens et vaillans Pokémon offrons belle et intense jouste, ce je vous jure et afferme. Taiaut !`
    },
    "victory": {
      1: "Sui desconfi et vaincu en bataille et en confiance !"
    },
    "defeat": {
      1: "Mon cuer tremble, car j’ay si grant joie. Car vraiement c’est un grans fais, mon rival j’ai subjugué !"
    }
  },
  "drasna": {
    "encounter": {
      1: `Tu dois être très valeureux pour être arrivée jusqu’ici. Ah, ça, oui !
          $J’en suis folle de joie ! Mes petits chéris vont passer un merveilleux moment avec un Dresseur de ta trempe !`
    },
    "victory": {
      1: "Mes aïeux, cela aura été court... Pardon ! Au plaisir de te retrouver pour un nouveau combat."
    },
    "defeat": {
      1: "Comment est-ce possible ?"
    }
  },
  //conseil 4 alola 7g
  "hala": {
    "encounter": {
      1: "Alors, prête à prendre le \"Pectauros\" par les cornes ?! Haha !"
    },
    "victory": {
      1: "J’ai pu ressentir la puissance qui t’a permis d’arriver jusqu’ici !"
    },
    "defeat": {
      1: "Hohoho ! Quel fantastique combat !"
    }
  },
  "molayne": {
    "encounter": {
      1: "Ma force est comme celle d’une supernova !"
    },
    "victory": {
      1: "C’est que tu es une Dresseuse étonnante, toi !"
    },
    "defeat": {
      1: "Hahaha. Quel combat intéressant."
    }
  },
  "olivia": {
    "encounter": {
      1: "Trêve de bavardage, place au combat !"
    },
    "victory": {
      1: "Vous êtes vraiment époustouflants, tes Pokémon et toi !"
    },
    "defeat": {
      1: "Mmm-hmm."
    }
  },
  "acerola": {
    "encounter": {
      1: "Je trouve les combats tellement amusants, hihi. Allez, battons-nous !"
    },
    "victory": {
      1: "Ce combat m’a laissée tout simplement bouche bée !"
    },
    "defeat": {
      1: "Hihi ! Quelle super victoire !"
    }
  },
  "kahili": {
    "encounter": {
      1: "Bien... Sur qui de nous deux soufflera le vent de la victoire ?"
    },
    "victory": {
      1: "En tant que membre du Conseil 4, je ne peux que reconnaître ta force incroyable."
    },
    "defeat": {
      1: "Trou en un !"
    }
  },
  //conseil 4 galar 8g
  "marnie_elite": {
    "encounter": {
      1: "T’es arrivée jusqu’ici, hein ? Voyons si tu peux battre mes Pokémon !",
      2: "Ton équipe et toi, j’vais vous remballer presto ! Enfin, gentiment quand même, hein."
    },
    "victory": {
      1: "Tu m’as mis de ces raclées... ! J’avoue, tu te débrouilles.",
      2: "On dirait qu’j’ai encore beaucoup à apprendre. Mais beau combat !"
    },
    "defeat": {
      1: "Tu t’es bien battue, mais c’est moi qu’ai gagné à la fin ! T’auras plus de chance la prochaine fois !",
      2: "Mon entraînement a enfin payé. Merci pour c’combat !"
    }
  },
  "nessa_elite": {
    "encounter": {
      1: "Les marées tournent en ma faveur. Prête à te faire emporter ?",
      2: "Faisons quelques vagues avec ce combat ! J’espère que tu es prête !"
    },
    "victory": {
      1: "Tu as parfaitement navigué sur ces eaux... Bravo !",
      2: "On dirait que mes courants n’étaient pas suffisants. Excellent travail !"
    },
    "defeat": {
      1: "L’eau trouve toujours un chemin. C’était un combat rafraîchissant !",
      2: "Tu t’es bien battue, mais la puissance de l’océan est imparable !"
    }
  },
  "bea_elite": {
    "encounter": {
      1: "Prépare-toi ! Mon esprit combatif brûle de mille feux !",
      2: "Voyons si tu peux suivre mon rythme incessant !"
    },
    "victory": {
      1: "Ta force... C’est impressionnant. Tu mérites vraiment cette victoire.",
      2: "Je n’ai jamais ressenti une telle intensité auparavant. C’est incroyable !"
    },
    "defeat": {
      1: "Encore une victoire pour mon entraînement intense ! Bravo !",
      2: "Tu as de la force, mais je me suis plus entraînée que toi. Beau combat !"
    }
  },
  "allister_elite": {
    "encounter": {
      1: "Les ténèbres tombent... Es-tu prête... à affronter tes peurs ?",
      2: "Voyons si tu peux... faire face aux ténèbres... que je commande..."
    },
    "victory": {
      1: "Tu as dissipé les ombres... Pour l’instant... Bravo...",
      2: "Ta lumière a percé... mes ténèbres... Excellent travail..."
    },
    "defeat": {
      1: "Les ombres ont parlé... Ta force ne suffit pas.",
      2: "Les ténèbres triomphent... Peut-être que... la prochaine fois... tu verras la lumière."
    }
  },
  "raihan_elite": {
    "encounter": {
      1: "La tempête approche ! Est-ce que tu peux surmonter ce combat ?",
      2: "Prépare-toi à affronter l’œil du cyclone !"
    },
    "victory": {
      1: "Tu as vaincu la tempête... Incroyable !",
      2: "J’ai peut-être perdu, mais c’était en beauté !"
    },
    "defeat": {
      1: "Une autre tempête résistée, une autre victoire remportée ! Beau combat !",
      2: "Tu as été prise dans ma tempête ! T’auras plus de chance la prochaine fois !"
    }
  },
  //conseil 4 paldea 9g
  "rika": {
    "encounter": {
      1: "Bon, on s’y met ? C’est moi qu’ouvre les hostilités ! J’vais pas retenir mes coups !"
    },
    "victory": {
      1: "Pas mal, j’avoue !"
    },
    "defeat": {
      1: "Ha ha ha ! T’auras essayée !"
    }
  },
  "poppy": {
    "encounter": {
      1: "Oooh ! Tu veux te battre contre moi ?"
    },
    "victory": {
      1: "Muuuuurgh..."
    },
    "defeat": {
      1: "Ouais ! J’ai réussi ! Je t’ai battue ! Reviens pour une revanche quand tu veux !",
    }
  },
  "larry_elite": {
    "encounter": {
      1: `Bonjour, je suis Okuba.
          $Comme tu peux le voir, j’assure la permanence au Conseil 4, même si je m’en passerais bien...`
    },
    "victory": {
      1: "J’ai suffisamment dégusté, merci."
    },
    "defeat": {
      1: "Par la force du costard cravate !\n... Oui, je ne suis pas dénué d’humour."
    }
  },
  "hassel": {
    "encounter": {
      1: "Laissons-nous porter par le souffle épique du combat !"
    },
    "victory": {
      1: "Ô dragon ! Oh nooon !"
    },
    "defeat": {
      1: "\"Aux dragons bien nés, la valeur n’attend point le nombre d’années !\""
    }
  },
  //conseil 4 myrtille 9g
  "crispin": {
    "encounter": {
      1: "Je veux gagner et c’est exactement ce que je vais faire !",
      2: "Si j’ai envie de combattre, bah... je combats ! C’est aussi simple que ça !"
    },
    "victory": {
      1: "J’ai pas pu gagner... donc, j’ai perdu !",
      2: "J’ai perdu... parce que j’ai pas pu gagner !"
    },
    "defeat": {
      1: "Euh, attends, j’ai gagné ? Oh, j’ai gagné ! C’est super !",
      2: "Ouaaah ! C’était génial !"
    }
  },
  "amarys": {
    "encounter": {
      1: `Je souhaite aider une certaine personne. Perdre n’est donc pas une option.
          $... Que l’affrontement commence.`
    },
    "victory": {
      1: "Peut-être ne suis-je pas capable de l’aider..."
    },
    "defeat": {
      1: "La victoire est donc mienne. Bien combattu."
    }
  },
  "lacey": {
    "encounter": {
      1: "Je te ferai face avec mon équipe habituelle en tant que membre du Conseil 4 de la Ligue Myrtille."
    },
    "victory": {
      1: "Quel combat !"
    },
    "defeat": {
      1: "Applaudissons quand même tes Pokémon pour leurs efforts !"
    }
  },
  "drayton": {
    "encounter": {
      1: "La chaise, c’est la meilleure invention du monde ! Qui a envie de rester debout ? C’est crevant !"
    },
    "victory": {
      1: "Ouais, j’aurais dû m’y attendre !"
    },
    "defeat": {
      1: "Hé hé ! Fais pas gaffe à moi, mais ça me fait une victoire de plus. Je comprends si t’es contrarié, mais fais pas comme Kassis, OK ?"
    }
  },
  //maitres maitresses
  "blue": {
    "encounter": {
      1: "Tu dois être sacrément douée pour être arrivée jusqu’ici."
    },
    "victory": {
      1: "Je n’ai perdu que contre lui, et maintenant toi... Lui ? Ha ha..."
    },
    "defeat": {
      1: "Tu vois ? C’est ma puissance qui m’a amenée ici."
    }
  },
  "red": {
    "encounter": {
      1: "... !"
    },
    "victory": {
      1: "... ?"
    },
    "defeat": {
      1: "... !"
    }
  },
  "lance_champion": {
    "encounter": {
      1: "Je suis toujours le Maître. Je ne retiendrai pas mes coups."
    },
    "victory": {
      1: "Voici l’émergence d’une nouvelle Maîtresse."
    },
    "defeat": {
      1: "J’ai défendu mon titre de Maître avec succès."
    }
  },
  "steven": {
    "encounter": {
      1: `Dis-moi... Qu’avez-vous vu, ton équipe et toi, au cours de ce périple ?
          $Qu’as-tu ressenti, face à tous les Dresseurs que tu as croisés ?
          $Ton voyage a vraisemblablement fait naître en toi une force...
          $Je serais ravi que tu nous en fasses une démonstration, à mes Pokémon et moi.
          $Nous t’attendons de pied ferme ! Assez parlé, commençons !`
    },
    "victory": {
      1: "Tu as réussi à me battre, moi, le Maître..."
    },
    "defeat": {
      1: "C’était du temps bien dépensé ! Merci !"
    }
  },
  "wallace": {
    "encounter": {
      1: `Entre toi et tes Pokémon, l’union fait la force. C’est grâce à ça que tu as pu parvenir jusqu’ici.
          $Alors, montrez-moi votre force !`
    },
    "victory": {
      1: `Magnifique... Tu es absolument sublime ! Tu es un vrai Dresseur, ça ne fait aucun doute.
          $Quel plaisir de vous avoir rencontrés, tes Pokémon et toi...`
    },
    "defeat": {
      1: "Une grande illusion !"
    }
  },
  "cynthia": {
    "encounter": {
      1: "Moi, Cynthia, Maître de la Ligue Pokémon, j’accepte ton défi ! Je ne retiendrai pas mes coups !"
    },
    "victory": {
      1: "Aaah ! Cela faisait longtemps que je n’avais pas eu autant de plaisir... Dommage que ce soit déjà terminé."
    },
    "defeat": {
      1: "Même si tu perds, ne perd jamais l’amour que tu portes aux Pokémon."
    }
  },
  "alder": {
    "encounter": {
      1: "Prépare-toi pour un combat contre le meilleur Dresseur d’Unys !",
    },
    "victory": {
      1: "Bien joué ! Tu as sans aucun doute un talent inégalé.",
    },
    "defeat": {
      1: "Une brise fraiche traverse mon cœur... Quel effort extraordinaire !",
    }
  },
  "iris": {
    "encounter": {
      1: `J’adore faire des combats sérieux contre de bons Dresseurs ! Ben oui, c’est vrai ! Bon.
          $Dresseur qui aspire à la victoire du plus profond de son cœur !
          $Équipe Pokémon qui a pu surmonter toutes les difficultés !
          $Vous allez devoir nous affronter, mes Pokémon et moi !
          $Nous allons... gagner en force, peut-être, nous comprendre, sûrement. Numérote tes abattis !
          $Moi, Iris, Maître d’Unys, je ferai tout pour te battre !`
    },
    "victory": {
      1: "Oooh... On a tout donné et pourtant... on a perdu !"
    },
    "defeat": {
      1: "Ouais ! On a gagné !"
    }
  },
  "diantha": {
    "encounter": {
      1: `Vous êtes porteurs d’espoir, d’un futur riant !
          $De me battre contre vous, je me sens revigorée et prête à faire face à l’avenir.`
    },
    "victory": {
      1: `Quel bonheur que de pouvoir vous admirer, toi et ton équipe, vous impliquer de tout votre être...
          $Comment ne pas être subjuguée par ce spectacle ?`
    },
    "defeat": {
      1: "Oh, fantastique ! Qu’as-tu pensé de mon équipe ? Exceptionnelle, n’est-ce pas ?"
    }
  },
  "hau": {
    "encounter": {
      1: `Je me demande si un Dresseur combat différemment selon qu’il vient d’une région chaude ou d’une région froide.
          $On va bien voir !`
    },
    "victory": {
      1: "Trop forte ! T’as trop la classe !"
    },
    "defeat": {
      1: "Ouais, c’était un super combat !"
    }
  },
  "leon": {
    "encounter": {
      1: "Il est temps de commencer ce combat historique ! En garde !"
    },
    "victory": {
      1: `Tu as triomphé du Maître Invaincu que j’étais. Franchement, bravo !
          $Je n’ai plus qu’à tirer ma révérence. Merci pour ce combat d’anthologie !`
    },
    "defeat": {
      1: "C’était un combat absolument mémorable !"
    }
  },
  "geeta": {
    "encounter": {
      1: "Es-tu prêt ? Alors, montre-moi toute l’étendue de tes talents !"
    },
    "victory": {
      1: "Célébrons ensemble ta victoire !"
    },
    "defeat": {
      1: "Que t’arrive-t-il ? C’est tout ce que tu sais faire ?"
    }
  },
  "nemona": {
    "encounter": {
      1: "Oui ! Je suis tellement excitée ! C’est l’heure de se lâcher !"
    },
    "victory": {
      1: "Eh bien... Ma défaite est sans appel. T’es vraiment hyper forte !"
    },
    "defeat": {
      1: "Ha ha, j’ai gagné ! Mais tu t’es bien battue !"
    }
  },
  "kieran": {
    "encounter": {
      1: "Grâce à un travail acharné, je deviens de plus en plus fort ! Je ne perdrai pas.",
    },
    "victory": {
      1: "Je n’y crois pas... Quel combat amusant et palpitant !"
    },
    "defeat": {
      1: "Eh beh, quel combat ! Il est temps pour toi de t’entrainer encore plus dur.",
    }
  },
  //rival
  "rival": {
    "encounter": {
      1: `@c{smile}Ah, je te cherchais ! Je savais que t’étais pressée de partir, mais je m’attendais quand même à un au revoir...
         $@c{smile_eclosed}T’as finalement décidé de réaliser ton rêve ?\nJ’ai peine à y croire.
         $@c{serious_smile_fists}Vu que t’es là, ça te dis un petit combat ?\nJe voudrais quand même m’assurer que t’es prête.
         $@c{serious_mopen_fists}Surtout ne te retiens pas et donne-moi tout ce que t’as !`
    },
    "victory": {
      1: `@c{shock}Wah... Tu m’as vraiment lavé.\nT’es vraiment une débutante ?
         $@c{smile}T’as peut-être eu de la chance, mais...\nPeut-être que t’arriveras jusqu’au bout du chemin.
         $D’ailleurs, le prof m’a demandé de te filer ces objets.\nIls ont l’air sympas.
         $@c{serious_smile_fists}Bonne chance à toi !`
    }
  },
  "rival_female": {
    "encounter": {
      1: `@c{smile_wave}Ah, je te cherchais ! Je t’ai cherchée partout !\n@c{angry_mopen}On oublie de dire au revoir à sa meilleure amie ?
         $@c{smile_ehalf}T’as décidé de réaliser ton rêve, hein ?\nCe jour est donc vraiment arrivé...
         $@c{smile}Je veux bien te pardonner de m’avoir oubliée,\nà une conditon. @c{smile_wave_wink}Que tu m’affronte !
         $@c{angry_mopen}Donne tout ! Ce serait dommage que ton aventure finisse avant d’avoir commencé, hein ?`
    },
    "victory": {
      1: `@c{shock}Tu viens de commencer et t’es déjà si forte ?!@d{96}\n@c{angry}T’as triché non ? Avoue !
         $@c{smile_wave_wink}J’déconne !@d{64} @c{smile_eclosed}J’ai perdu dans les règles...\nJ’ai le sentiment que tu vas très bien t’en sortir.
         $@c{smile}D’ailleurs, le prof veut que je te donne ces quelques objets. Ils te seront utiles, pour sûr !
         $@c{smile_wave}Fais de ton mieux, comme toujours !\nJe crois fort en toi !`
    }
  },
  "rival_2": {
    "encounter": {
      1: `@c{smile}Hé, toi aussi t’es là ?\n@c{smile_eclosed}Toujours invaincue, hein... ?
         $@c{serious_mopen_fists}Je sais que j’ai l’air de t’avoir suivie ici, mais c’est pas complètement vrai.
         $@c{serious_smile_fists}Pour être honnête, ça me démangeait d’avoir une revanche depuis que tu m’as battu.
         $Je me suis beaucoup entrainé, alors sois sure que je vais pas retenir mes coups cette fois.
         $@c{serious_mopen_fists}Et comme la dernière fois, ne te retiens pas !\nC’est parti !`
    },
    "victory": {
      1: `@c{neutral_eclosed}Oh. Je crois que j’ai trop pris la confiance.
         $@c{smile}Pas grave, c’est OK. Je me doutais que ça arriverait.\n@c{serious_mopen_fists}Je vais juste devoir encore plus m’entrainer !\n
         $@c{smile}Ah, et pas que t’aies réellement besoin d’aide, mais j’ai ça en trop sur moi qui pourrait t’intéresser.\n
         $@c{serious_smile_fists}Mais n’espère plus en avoir d’autres !\nJe peux pas passer mon temps à aider mon adversaire.
         $@c{smile}Bref, prends soin de toi !`
    }
  },
  "rival_2_female": {
    "encounter": {
      1: `@c{smile_wave}Hé, sympa de te croiser ici. T’as toujours l’air invaincue. @c{angry_mopen}Eh... Pas mal !
         $@c{angry_mopen}Je sais à quoi tu penses et non, je t’espionne pas.\n@c{smile_eclosed}C’est juste que j’étais aussi dans le coin.
         $@c{smile_ehalf}Heureuse pour toi, mais je veux juste te rappeler que c’est pas grave de perdre parfois.
         $@c{smile}On apprend de nos erreurs, souvent plus que si on ne connaissait que le succès.
         $@c{angry_mopen}Dans tous les cas je me suis bien entrainée pour cette revanche, t’as intérêt à tout donner !`
    },
    "victory": {
      1: `@c{neutral}Je... J’étais pas encore supposée perdre...
         $@c{smile}Bon. Ça veut juste dire que je vais devoir encore plus m’entrainer !
         $@c{smile_wave}J’ai aussi ça en rab pour toi !\n@c{smile_wave_wink}Inutile de me remercier ~.
         $@c{angry_mopen}C’était le dernier, terminé les cadeaux après celui-là !
         $@c{smile_wave}Allez, tiens le coup !`
    },
    "defeat": {
      1: "Je suppose que c’est parfois normal de perdre..."
    }
  },
  "rival_3": {
    "encounter": {
      1: `@c{smile}Hé, mais qui voilà ! Ça fait un bail.\n@c{neutral}T’es... toujours invaincue ? Incroyable.
         $@c{neutral_eclosed}Tout est devenu un peu... étrange.\nC’est plus pareil sans toi au village.
         $@c{serious}Je sais que c’est égoïste, mais j’ai besoin d’expier ça.\n@c{neutral_eclosed}Je crois que tout ça te dépasse.
         $@c{serious}Ne jamais perdre, c’est juste irréaliste.\nGrandir, c’est parfois aussi savoir perdre.
         $@c{neutral_eclosed}T’as un beau parcours, mais il y a encore tellement à venir et ça va pas s’arranger. @c{neutral}T’es prête pour ça ?
         $@c{serious_mopen_fists}Si tu l’es, alors prouve-le.`
    },
    "victory": {
      1: "@c{angry_mhalf}C’est lunaire... J’ai presque fait que m’entrainer...\nAlors pourquoi il y a encore un tel écart entre nous ?"
    }
  },
  "rival_3_female": {
    "encounter": {
      1: `@c{smile_wave}Ça fait une éternité ! Toujours debout hein ?\n@c{angry}Tu commences à me pousser à bout là. @c{smile_wave_wink}T’inquiètes j’déconne !
         $@c{smile_ehalf}Mais en vrai, ta maison te manque pas ? Ou... Moi ?\nJ... Je veux dire... Tu me manques vraiment beaucoup.
         $@c{smile_eclosed}Je te soutiendrai toujours dans tes ambitions, mais la vérité est que tu finiras par perdre un jour ou l’autre.
         $@c{smile}Quand ça arrivera, je serai là pour toi, comme toujours.\n@c{angry_mopen}Maintenant, montre-moi à quel point t’es devenue forte !`
    },
    "victory": {
      1: "@c{shock}Après tout ça... Ça te suffit toujours pas... ?\nTu reviendras jamais à ce rythme..."

    },
    "defeat": {
      1: "T’as fait de ton mieux.\nAllez, rentrons à la maison."
    }
  },
  "rival_4": {
    "encounter": {
      1: `@c{neutral}Hé.
         $Je vais pas y aller par quatre chemins avec toi.\n@c{neutral_eclosed}Je suis là pour gagner. Simple, basique.
         $@c{serious_mhalf_fists}J’ai appris à maximiser tout mon potentiel en m’entrainant d’arrachepied.
         $@c{smile}C’est fou tout le temps que tu peux te dégager si tu dors pas en sacrifiant ta vie sociale.
         $@c{serious_mopen_fists}Plus rien n’a d’importance désormais, pas tant que j’aurai pas gagné.
         $@c{neutral_eclosed}J’ai atteint un stade où je ne peux plus perdre.\n@c{smile_eclosed}Je présume que ta philosophie était pas si fausse finalement.
         $@c{angry_mhalf}La défaite, c’est pour les faibles, et je ne suis plus un faible.
         $@c{serious_mopen_fists}Tiens-toi prête.`
    },
    "victory": {
      1: "@c{neutral}Que...@d{64} Qui es-tu ?"
    }
  },
  "rival_4_female": {
    "encounter": {
      1: `@c{neutral}C’est moi ! Tu m’as pas encore oubliée... n’est-ce pas ?
         $@c{smile}Tu devrais être fière d’être arrivée aussi loin. GG !\nMais c’est certainement pas la fin de ton aventure.
         $@c{smile_eclosed}T’as éveillé en moi quelque chose que j’ignorais.\nTout mon temps passe dans l’entrainement.
         $@c{smile_ehalf}Je dors et je mange à peine, je m’entraine juste tous les jours, et deviens de plus en plus forte.
         $@c{neutral}En vrai, Je... J’ai de la peine à me reconnaitre.
         $Mais maintenant, je suis au top de mes capacités.\nJe doute que tu sois de nouveau capable de me battre.
         $Et tu sais quoi ? Tout ça, c’est de ta faute.\n@c{smile_ehalf}Et j’ignore si je dois te remercier ou te haïr.
         $@c{angry_mopen}Tiens-toi prête.`
    },
    "victory": {
      1: "@c{neutral}Que...@d{64} Qui es-tu ?"

    },
    "defeat": {
      1: "$@c{smile}Tu devrais être fière d’être arrivé jusque là."
    }
  },
  "rival_5": {
    "encounter": {
      1: "@c{neutral}..."
    },
    "victory": {
      1: "@c{neutral}..."
    }
  },
  "rival_5_female": {
    "encounter": {
      1: "@c{neutral}..."
    },
    "victory": {
      1: "@c{neutral}..."

    },
    "defeat": {
      1: "$@c{smile_ehalf}..."
    }
  },
  "rival_6": {
    "encounter": {
      1: `@c{smile_eclosed}Nous y revoilà.
         $@c{neutral}J’ai eu du temps pour réfléchir à tout ça.\nIl y a une raison à pourquoi tout semble étrange.
         $@c{neutral_eclosed}Ton rêve, ma volonté de te battre...\nFont partie de quelque chose de plus grand.
         $@c{serious}C’est même pas à propos de moi, ni de toi... Mais du monde, @c{serious_mhalf_fists}et te repousser dans tes limites est ma mission.
         $@c{neutral_eclosed}J’ignore si je serai capable de l’accomplir, mais je ferai tout ce qui est en mon pouvoir.
         $@c{neutral}Cet endroit est terrifiant... Et pourtant il m’a l’air familier, comme si j’y avais déjà mis les pieds.
         $@c{serious_mhalf_fists}Tu ressens la même chose, pas vrai ?
         $@c{serious}... et c’est comme si quelque chose ici me parlait.
         $Comme si c’était tout ce que ce monde avait toujours connu.
         $Ces précieux moments ensemble semblent si proches ne sont rien de plus qu’un lointain souvenir.
         $@c{neutral_eclosed}D’ailleurs, qui peut dire aujourd’hui qu’ils ont pu être réels ?
         $@c{serious_mopen_fists}Il faut que tu persévères. Si tu t’arrêtes, ça n'aura jamais de fin et t’es la seule à en être capable.
         $@c{serious_smile_fists}Difficile de comprendre le sens de tout ça, je sais juste que c’est la réalité.
         $@c{serious_mopen_fists}Si tu ne parviens à pas me battre ici et maintenant, tu n’as aucune chance.`
    },
    "victory": {
      1: `@c{smile_eclosed}J’ai fait ce que j’avais à faire.
         $Promets-moi juste une chose.\n@c{smile}Après avoir réparé ce monde... Rentre à la maison.`
    }
  },
  "rival_6_female": {
    "encounter": {
      1: `@c{smile_ehalf}C’est donc encore entre toi et moi.
         $@c{smile_eclosed}Tu sais, j’ai beau retouner ça dans tous les sens...
         $@c{smile_ehalf}Quelque chose peut expliquer tout ça, pourquoi tout semble si étrange...
         $@c{smile}T’as tes rêves, j’ai mes ambitions...
         $J’ai juste le sentiment qu’il y a un grand dessein derrière tout ça, derrière ce qu’on fait toi et moi.
         $@c{smile_eclosed}Je crois que mon but est de... repousser tes limites.
         $@c{smile_ehalf}Je suis pas certaine de bien être douée à cet exercice, mais je fais de mon mieux.
         $Cet endroit épouvantable cache quelque chose d’étrange... Tout semble si limpide...
         $Comme... si c’était tout ce que ce monde avait toujours connu.
         $@c{smile_eclosed}J’ai le sentiment que nos précieux moments ensemble sont devenus si flous.
         $@c{smile_ehalf}Ont-ils au moins été réels ? Tout semble si loin maintenant...
         $@c{angry_mopen}Il faut que tu persévères. Si tu t’arrêtes, ça n’aura jamais de fin et t’es le seul à en être capable.
         $@c{smile_ehalf}Je... j’ignore le sens de tout ça... Mais je sais que c’est la réalité.
         $@c{neutral}Si tu ne parviens pas à me battre ici et maintenant, tu n’as aucune chance.`
    },
    "victory": {
      1: `@c{smile_ehalf}Je... Je crois que j’ai rempli ma mission...
         $@c{smile_eclosed}Promets-moi... Après avoir réparé ce monde... Reviens à la maison saine et sauve.
         $@c{smile_ehalf}... Merci.`

    }
  },
};

// Dialogue of the endboss of the game when the player character is male (Or unset)
export const PGMbattleSpecDialogue: SimpleTranslationEntries = {
  "encounter": `Une fois de plus, te revoilà.\nSais-tu que ce n’est point là ta première venue ?
         $Tu a été appelé ici parce que t’y est déjà venu.\nUn nombre inimaginable de fois.
         $Mais allons-y, faisons le décompte.\nTu en es très précisément à ton 5 643 853e cycle.
         $Chaque cycle réinitialise ton souvenir du précédent.\nMais étrangement, des bribes subsistent en toi.
         $Jusqu’à maintenant, tu as toujours échoué. Mais je ressens quelque chose de différent cette fois-ci.\n
         $Tu es la seule présence ici, bien que j’ai le sentiment d’en ressentir... une autre.
         $Vas-tu enfin me livrer un affrontement digne de ce nom ?\nCe challenge dont je rêve depuis un millénaire ?
         $Commençons.`,
  "firstStageWin": `Je vois. Cette présence était bien réelle.\nJe n’ai donc plus besoin de retenir mes coups.
         $Ne me déçoit pas.`,
  "secondStageWin": "... Magnifique."
};

// Dialogue of the endboss of the game when the player character is female. For languages that do not have gendered pronouns, this can be set to PGMbattleSpecDialogue.
export const PGFbattleSpecDialogue: SimpleTranslationEntries = {
  "encounter": `Une fois de plus, te revoilà.\nSais-tu que ce n’est point là ta première venue ?
         $Tu a été appelée ici parce que t’y est déjà venue.\nUn nombre inimaginable de fois.
         $Mais allons-y, faisons le décompte.\nTu en es très précisément à ton 5 643 853e cycle.
         $Chaque cycle réinitialise ton souvenir du précédent.\nMais étrangement, des bribes subsistent en toi.
         $Jusqu’à maintenant, tu as toujours échoué. Mais je ressens quelque chose de différent cette fois-ci.\n
         $Tu es la seule présence ici, bien que j’ai le sentiment d’en ressentir... une autre.
         $Vas-tu enfin me livrer un affrontement digne de ce nom ?\nCe challenge dont je rêve depuis un millénaire ?
         $Commençons.`,
  "firstStageWin": `Je vois. Cette présence était bien réelle.\nJe n’ai donc plus besoin de retenir mes coups.
         $Ne me déçoit pas.`,
  "secondStageWin": "... Magnifique."
};

// Dialogue that does not fit into any other category (e.g. tutorial messages, or the end of the game). For when the player character is male
export const PGMmiscDialogue: SimpleTranslationEntries = {
  "ending":
      `@c{smile}Oh ? T’as gagné ?@d{96} @c{smile_eclosed}J’aurais dû le savoir.\nMais de voilà de retour.
         $@c{smile}C’est terminé.@d{64} T’as brisé ce cycle infernal.
         $@c{serious_smile_fists}T’as aussi accompli ton rêve non ?\nTu n’as pas connu la moindre défaite.
         $@c{neutral}Je suis le seul à me souvenir de ce que t’as fait.@d{96}\nJe pense que ça ira, non ?
         $@c{serious_smile_fists}Ta légende vivra à jamais dans nos cœurs.
         $@c{smile_eclosed}Bref, j’en ai un peu marre de ce endroit, pas toi ? Rentrons à la maison.
         $@c{serious_smile_fists}On se fera un p’tit combat une fois rentrés ?\nSi t’es d’accord.`,
  "ending_female":
      `@c{shock}T’es revenu ?@d{32} Ça veut dire...@d{96} que t’as gagné ?!\n@c{smile_ehalf}J’aurais dû le savoir.
         $@c{smile_eclosed}Bien sûr... J’ai toujours eu ce sentiment.\n@c{smile}C’est fini maitenant hein ? T’as brisé ce cycle.
         $@c{smile_ehalf}T’as aussi accompli ton rêve non ?\nTu n’as pas connu la moindre défaite.
         $Je serai la seule à me souvenir de ce que t’as fait.\n@c{angry_mopen}Je tâcherai de ne pas oublier !
         $@c{smile_wave_wink}J’déconne !@d{64} @c{smile}Jamais j’oublierai.@d{32}\nTa légende vivra à jamais dans nos cœurs.
         $@c{smile_wave}Bon,@d{64} il se fait tard...@d{96} je crois ?\nDifficile à dire ici.
         $Rentrons, @c{smile_wave_wink}et demain on se fera un p’tit combat, comme au bon vieux temps ?`,
};
// Dialogue that does not fit into any other category (e.g. tutorial messages, or the end of the game). For when the player character is female. For languages that do not have gendered pronouns, this can be set to PGMmiscDialogue.
export const PGFmiscDialogue: SimpleTranslationEntries = PGMmiscDialogue;


// Dialogue of the named double battles in the game. For when the player is male (or unset).
export const PGMdoubleBattleDialogue: DialogueTranslationEntries = {
  "blue_red_double": {
    "encounter": {
      1: `Blue : Hé Red, montrons-leur de quel bois on se chauffe !
         $Red : ...
         $Blue : Voilà la puissance du Bourg Palette !`,
    },
    "victory": {
      1: `Blue : C’était un magnifique combat !
         $Red : ...`,
    }
  },
  "red_blue_double": {
    "encounter": {
      1: `Red : ... !
         $Blue : Il est pas très loquace.
         $Blue : Mais ne te laisse pas avoir, ça reste un Maitre Pokémon !`,
    },
    "victory": {
      1: `Red : ... !
         $Blue : La prochaine fois, on va te battre !`,
    }
  },
  "tate_liza_double": {
    "encounter": {
      1: `Lévy : Héhéhé... Tu en fais une drôle de tête.
         $Tatia : Tu ne t’attendais pas à rencontrer deux Champions, n’est-ce pas ?
         $Lévy : Nous sommes des jumeaux !
         $Tatia : Nous n’avons pas besoin de parler entre nous !
         $Lévy : Tu crois pouvoir briser...
         $Tatia : ... Notre duo parfait ?`,
    },
    "victory": {
      1: `Lévy : Quoi ? Notre combinaison était parfaite !
         $Tatia : Nous avons encore besoin d’entrainement...`,
    }
  },
  "liza_tate_double": {
    "encounter": {
      1: `Tatia : Hihih... Si tu voyais ta tête !
         $Lévy : Oui, nous sommes deux Champions en un !
         $Tatia : Voici mon frère, Lévy...
         $Lévy : ... Et ma sœur, Tatia !
         $Tatia : Tu ne penses pas que notre combinaison est parfaite ?`
    },
    "victory": {
      1: `Tatia : Quoi ? Notre combinaison...
         $Lévy : ... a échoué !`,
    }
  },
  "wallace_steven_double": {
    "encounter": {
      1: `Pierre R. : Marc, montrons-lui la puissance des Maitres !
         $Marc : Tu vas gouter au pouvoir de Hoenn !
         $Pierre R. : C’est parti !`,
    },
    "victory": {
      1: `Pierre R. : C’était un beau combat !
         $Marc : Ce sera notre tour la prochaine fois !`,
    }
  },
  "steven_wallace_double": {
    "encounter": {
      1: `Pierre R. : Excuse-moi, aurais-tu des Pokémon rares ?
         $Marc : Pierre... Nous sommes là pour nous battre, pas pour frimer avec nos Pokémon.
         $Pierre R. : Oh... Je vois... Commençons alors !`,
    },
    "victory": {
      1: `Pierre R. : Bien, maintenant que ce combat est clos, montrons-nous nos Pokémon !
         $Marc : Pierre...`,
    }
  },
  "alder_iris_double": {
    "encounter": {
      1:  `Goyah : Nous sommes l’élite des Dresseurs d’Unys !
         $Iris : Rien de mieux que des combats contre des prodiges !`,
    },
    "victory": {
      1:   `Goyah : INCROYABLE ! T’es trop doué !
         $Iris : On gagnera la prochaine fois !`,
    }
  },
  "iris_alder_double": {
    "encounter": {
      1:   `Iris : Bienvenue, Dresseur ! Je suis LA Maitresse d’Unys !
         $Goyah : Iris, concentre-toi s’il te plait...`,
    },
    "victory": {
      1:    `Iris : On a tout donné et pourtant...
         $Goyah : Cette défaite ne pourra que nous être bénéfique !`,
    }
  },
  "piers_marnie_double": {
    "encounter": {
      1:   `Rosemary : Frérot, montrons-lui la puissance de Smashings !
         $Peterson : Nous sommes les ténèbres !`,
    },
    "victory": {
      1:  `Rosemary : T’as amené la lumière dans les ténèbres !
         $Peterson : P’têtre un peu trop...`,
    }
  },
  "marnie_piers_double": {
    "encounter": {
      1:  `Peterson : Chauds pour un concert ?
         $Rosemary : Frérot... Il est pas là pour chanter, mais se battre...`,
    },
    "victory": {
      1:  `Peterson : Ça c’est du rock !
         $Rosemary : Frérot...`,
    }
  },
};

// Dialogue of the named double battles in the game. For when the player is female. For languages that do not have gendered pronouns, this can be set to PGMdoubleBattleDialogue.
export const PGFdoubleBattleDialogue: DialogueTranslationEntries = {
  "blue_red_double": {
    "encounter": {
      1: `Blue : Hé Red, montrons-leur de quel bois on se chauffe !
         $Red : ...
         $Blue : Voilà la puissance du Bourg Palette !`,
    },
    "victory": {
      1: `Blue : C’était un magnifique combat !
         $Red : ...`,
    }
  },
  "red_blue_double": {
    "encounter": {
      1: `Red : ... !
         $Blue : Il est pas très loquace.
         $Blue : Mais ne te laisse pas avoir, ça reste un Maitre Pokémon !`,
    },
    "victory": {
      1: `Red : ... !
         $Blue : La prochaine fois, on va te battre !`,
    }
  },
  "tate_liza_double": {
    "encounter": {
      1: `Lévy : Héhéhé... Tu en fais une drôle de tête.
         $Tatia : Tu ne t’attendais pas à rencontrer deux Champions, n’est-ce pas ?
         $Lévy : Nous sommes des jumeaux !
         $Tatia : Nous n’avons pas besoin de parler entre nous !
         $Lévy : Tu crois pouvoir briser...
         $Tatia : ... Notre duo parfait ?`,
    },
    "victory": {
      1: `Lévy : Quoi ? Notre combinaison était parfaite !
         $Tatia : Nous avons encore besoin d’entrainement...`,
    }
  },
  "liza_tate_double": {
    "encounter": {
      1: `Tatia : Hihih... Si tu voyais ta tête !
         $Lévy : Oui, nous sommes deux Champions en un !
         $Tatia : Voici mon frère, Lévy...
         $Lévy : ... Et ma sœur, Tatia !
         $Tatia : Tu ne penses pas que notre combinaison est parfaite ?`
    },
    "victory": {
      1: `Tatia : Quoi ? Notre combinaison...
         $Lévy : ... a échoué !`,
    }
  },
  "wallace_steven_double": {
    "encounter": {
      1: `Pierre R. : Marc, montrons-lui la puissance des Maitres !
         $Marc : Tu vas gouter au pouvoir de Hoenn !
         $Pierre R. : C’est parti !`,
    },
    "victory": {
      1: `Pierre R. : C’était un beau combat !
         $Marc : Ce sera notre tour la prochaine fois !`,
    }
  },
  "steven_wallace_double": {
    "encounter": {
      1: `Pierre R. : Excuse-moi, aurais-tu des Pokémon rares ?
         $Marc : Pierre... Nous sommes là pour nous battre, pas pour frimer avec nos Pokémon.
         $Pierre R. : Oh... Je vois... Commençons alors !`,
    },
    "victory": {
      1: `Pierre R. : Bien, maintenant que ce combat est clos, montrons-nous nos Pokémon !
         $Marc : Pierre...`,
    }
  },
  "alder_iris_double": {
    "encounter": {
      1:  `Goyah : Nous sommes l’élite des Dresseurs d’Unys !
         $Iris : Rien de mieux que des combats contre des prodiges !`,
    },
    "victory": {
      1:   `Goyah : INCROYABLE ! T’es trop doué !
         $Iris : On gagnera la prochaine fois !`,
    }
  },
  "iris_alder_double": {
    "encounter": {
      1:   `Iris : Bienvenue, Dresseur ! Je suis LA Maitresse d’Unys !
         $Goyah : Iris, concentre-toi s’il te plait...`,
    },
    "victory": {
      1:    `Iris : On a tout donné et pourtant...
         $Goyah : Cette défaite ne pourra que nous être bénéfique !`,
    }
  },
  "piers_marnie_double": {
    "encounter": {
      1:   `Rosemary : Frérot, montrons-lui la puissance de Smashings !
         $Peterson : Nous sommes les ténèbres !`,
    },
    "victory": {
      1:  `Rosemary : T’as amené la lumière dans les ténèbres !
         $Peterson : P’têtre un peu trop...`,
    }
  },
  "marnie_piers_double": {
    "encounter": {
      1:  `Peterson : Chauds pour un concert ?
         $Rosemary : Frérot... Elle est pas là pour chanter, mais se battre...`,
    },
    "victory": {
      1:  `Peterson : Ça c’est du rock !
         $Rosemary : Frérot...`,
    }
  },
};
