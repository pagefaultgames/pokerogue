import {DialogueTranslationEntries, SimpleTranslationEntries} from "#app/plugins/i18n";


// Dialogue of the NPCs in the game when the player character is male (or unset)
export const PGMdialogue: DialogueTranslationEntries = {
  "youngster": {
    "encounter": {
      1: "Hey, willst du kämpfen?",
      2: "Bist du auch ein neuer Trainer?",
      3: "Hey, ich habe dich noch nie gesehen. Lass uns kämpfen!",
      4: "Ich habe gerade verloren und suche nach neuen Pokémon.\nWarte! Du siehst schwach aus! Lass uns kämpfen!",
      5: `Haben wir uns schon mal getroffen oder nicht? Ich erinnere mich nicht wirklich
          $Nun, ich denke, es ist trotzdem schön, dich zu treffen!`,
      6: "Okay, lass uns kämpfen!",
      7: "Okay, hier komme ich! Ich zeige dir meine Kraft!",
      8: "Fan fan fan... Ich zeige dir wie fantastisch meine Pokémon sind!",
      9: "Es ist nicht nötig, Zeit mit Begrüßungen zu verschwenden.\nSobald du bereit bist geht es los!",
      10: "Lass deine Deckung nicht fallen, sonst weinst du, wenn dich ein Kind besiegt.",
      11: "Ich habe meine Pokémon mit großer Sorgfalt aufgezogen. Du darfst ihnen nicht wehtun!",
      12: "Schön, dass du es geschafft hast! Von hier an wird es nicht einfacher.",
      13: "Die Kämpfe gehen immer weiter! Willkommen in der Welt ohne Ende!",
    },
    "victory": {
      1: "Wow! Du bist stark!",
      2: "Ich hatte keine Chance, oder?",
      3: "Wenn ich älter bin, werde ich dich besiegen!",
      4: "Ugh. Ich habe keine Pokémon mehr.",
      5: "Das kann nicht sein… DAS KANN NICHT SEIN! Wie konnte ich schon wieder verlieren…",
      6: "Nein! Ich habe verloren!",
      7: "Wow! Du bist unglaublich! Ich bin erstaunt und überrascht!",
      8: "Kann es sein… Wie… Meine Pokémon und ich sind die stärksten, aber…",
      9: "Das nächste Mal werde ich dich besiegen! Lass uns wieder kämpfen!",
      10: "Man! Kannst du nicht sehen, dass ich nur ein Kind bin? Es war nicht fair von dir, so hart zu kämpfen!",
      11: "Deine Pokémon sind unglaublich! Tauschst du mit mir?",
      12: "Ich habe mich ein bisschen mitreißen lassen, worüber habe ich vorhin gesprochen?",
      13: "Ahaha! Da ist es! Genau! Du bist schon jetzt in dieser Welt zu Hause!",
    }
  },
  "lass": {
    "encounter": {
      1: "Lass uns kämpfen, wollen wir?",
      2: "Du siehst wie ein neuer Trainer aus. Lass uns kämpfen!",
      3: "Ich erkenne dich nicht. Wie wäre es mit einem Kampf?",
      4: "Lass uns einen lustigen Pokémon-Kampf haben!",
      5: "Ich zeige dir, wie man Pokémon wirklich einsetzt!",
      6: "Ein ernsthafter Kampf beginnt mit einem ernsten Anfang! Bist du sicher, dass du bereit bist?",
      7: `Du bist nur einmal jung. Und du hast nur eine Chance bei einem bestimmten Kampf.
          $Bald wirst du nur noch eine Erinnerung sein.`,
      8: "Du solltest es leicht mit mir angehen, OK? Aber ich kämpfe ernsthaft!",
      9: "Die Schule ist langweilig. Ich habe nichts zu tun. Gähn. Ich kämpfe nur, um die Zeit totzuschlagen."
    },
    "victory": {
      1: "Das war beeindruckend! Ich habe noch viel zu lernen.",
      2: "Ich dachte nicht, dass du mich so schlagen würdest…",
      3: "Ich hoffe, wir haben eines Tages ein Rematch.",
      4: "Das war ziemlich erstaunlich! Du hast mich total erschöpft…",
      5: "Du hast mir tatsächlich eine Lektion erteilt! Du bist ziemlich erstaunlich!",
      6: "Ernsthaft, ich habe verloren. Das ist, wie, ernsthaft deprimierend, aber du warst ernsthaft cool.",
      7: "Ich brauche keine Erinnerungen wie diese. Löschen der Erinnerung…",
      8: `Hey! Ich habe dir gesagt, du sollst es leicht mit mir angehen!
          $Trotzdem bist du ziemlich cool, wenn du ernsthaft bist.`,
      9: "Ich werde langsam müde vom Kämpfen… Es muss etwas Neues zu tun geben…"
    }
  },
  "breeder": {
    "encounter": {
      1: "Gehorsame Pokémon, eigensinnige Pokémon… Pokémon haben einzigartige Eigenschaften.",
      2: "Auch wenn meine Erziehung und mein Verhalten schlecht sind, habe ich meine Pokémon gut aufgezogen.",
      3: "Hmm, disziplinierst du deine Pokémon? Zu viel Verwöhnen ist nicht gut.",
    },
    "victory": {
      1: "Es ist wichtig, die Eigenschaften jedes Pokémon zu pflegen und zu trainieren.",
      2: "Im Gegensatz zu meinem teuflischen Selbst sind dies einige gute Pokémon.",
      3: "Zu viel Lob kann sowohl Pokémon als auch Menschen verwöhnen.",
    },
    "defeat": {
      1: "Du solltest nicht wütend auf deine Pokémon werden, auch wenn du einen Kampf verlierst.",
      2: "Richtig? Ziemlich gute Pokémon, oder? Ich bin dafür geeignet, Dinge großzuziehen.",
      3: `Egal wie sehr du deine Pokémon liebst,
          $du musst sie trotzdem disziplinieren, wenn sie sich schlecht benehmen.`
    }
  },
  "breeder_female": {
    "encounter": {
      1: "Pokémon verraten dich nie. Sie erwidern die ganze Liebe, die du ihnen gibst.",
      2: "Soll ich dir einen Tipp geben, wie man gute Pokémon trainiert?",
      3: "Ich habe diese sehr speziellen Pokémon mit einer speziellen Methode aufgezogen."
    },
    "victory": {
      1: "Ugh… So sollte das nicht laufen. Habe ich die falsche Mischung verabreicht?",
      2: "Wie konnte das meinen Pokémon passieren… Was fütterst du deine Pokémon?",
      3: `Wenn ich verliere, sagt dir das, dass ich nur die Zeit totgeschlagen habe.
          $Es verletzt mein Ego überhaupt nicht.`
    },
    "defeat": {
      1: "Das beweist, dass meine Pokémon meine Liebe angenommen haben.",
      2: "Der wahre Trick, um gute Pokémon zu trainieren, besteht darin, gute Pokémon zu fangen.",
      3: "Pokémon werden stark oder schwach, je nachdem, wie du sie großziehst."
    }
  },
  "fisherman": {
    "encounter": {
      1: "Aack! Du hast mich einen Biss verlieren lassen!\nWas wirst du dagegen tun?",
      2: "Geh weg! Du erschreckst die Pokémon!",
      3: "Mal sehen, ob du einen Sieg an Land ziehen kannst!",
    },
    "victory": {
      1: "Vergiss es einfach.",
      2: "Nächstes Mal werde ich den Triumph an Land ziehen!",
      3: "Ich glaube, ich habe die Strömungen diesmal unterschätzt.",
    },
  },
  "fisherman_female": {
    "encounter": {
      1: "Woah! Ich habe einen großen Fang gemacht!",
      2: "Die Leine ist drin, bereit, den Erfolg an Land zu ziehen!",
      3: "Bereit, Wellen zu schlagen!"
    },
    "victory": {
      1: "Ich komme mit einem stärkeren Haken zurück.",
      2: "Ich werde das nächste Mal den Sieg an Land ziehen.",
      3: "Ich schärfe nur meine Haken für das Comeback!"
    },
  },
  "swimmer": {
    "encounter": {
      1: "Zeit, einzutauchen!",
      2: "Lass uns die Wellen des Sieges reiten!",
      3: "Bereit, einen Sprung ins Wasser zu machen!",
    },
    "victory": {
      1: "Getränkt in Niederlage!",
      2: "Eine Welle der Niederlage!",
      3: "Zurück ans Ufer, schätze ich.",
    },
  },
  "backpacker": {
    "encounter": {
      1: "Packe deine Sachen, es geht los!",
      2: "Mal sehen, ob du mithalten kannst!",
      3: "Bereit machen, Herausforderer!",
      4: "Ich habe 20 Jahre damit verbracht, mich selbst zu finden… Aber wo bin ich?"
    },
    "victory": {
      1: "Diesmal bin ich gestolpert!",
      2: "Oh, ich glaube, ich bin verloren.",
      3: "Sackgasse!",
      4: "Warte eine Sekunde! Hey! Weißt du nicht, wer ich bin?"
    },
  },
  "ace_trainer": {
    "encounter": {
      1: "Du scheinst ziemlich zuversichtlich zu sein.",
      2: "Deine Pokémon… Zeig sie mir…",
      3: "Weil ich ein Ass-Trainer bin, denken die Leute, ich sei stark.",
      4: "Weißt du, was es braucht, um ein Ass-Trainer zu sein?"
    },
    "victory": {
      1: "Ja… Du hast gute Pokémon…",
      2: "Was?! Aber ich bin ein Kampfgott!",
      3: "Natürlich, du bist der Hauptcharakter!",
      4: "OK! OK! Du könntest ein Ass-Trainer sein!"
    },
    "defeat": {
      1: "Ich widme meinen Körper und meine Seele den Pokémon-Kämpfen!",
      2: "Alles innerhalb meiner Erwartungen… Nichts Überraschendes…",
      3: `Ich dachte, ich würde zu einem zerbrechlichen Menschen heranwachsen, 
          $der aussieht, als würde er zerbrechen, wenn du ihn zu fest drückst.`,
      4: "Natürlich bin ich stark und verliere nicht. Es ist wichtig, dass ich anmutig gewinne."
    }
  },
  "parasol_lady": {
    "encounter": {
      1: "Zeit, das Schlachtfeld mit Eleganz und Anmut zu betreten!",
    },
    "victory": {
      1: "Meine Eleganz bleibt ungebrochen!",
    }
  },
  "twins": {
    "encounter": {
      1: "Mach dich bereit, denn wenn wir zusammenarbeiten, gibt es doppelten Ärger!",
      2: "Zwei Herzen, eine Strategie – mal sehen, ob du mit unserer Zwillingskraft mithalten kannst!",
      3: "Hoffe, du bist bereit für doppelten Ärger, denn wir werden dir einheizen!"
    },
    "victory": {
      1: "Wir haben vielleicht diese Runde verloren, aber unsere Bindung bleibt unzerbrechlich!",
      2: "Unser Zwillingsgeist wird nicht lange getrübt bleiben.",
      3: "Wir werden als dynamisches Duo stärker zurückkommen!"
    },
    "defeat": {
      1: "Zwillingskraft herrscht vor!",
      2: "Zwei Herzen, ein Triumph!",
      3: "Doppelte Freude, doppelter Siegestanz!"
    }
  },
  "cyclist": {
    "encounter": {
      1: "Mach dich bereit, meinen Staub zu schlucken!",
      2: "Mach dich bereit, Herausforderer! Ich werde dich im Staub zurücklassen!",
      3: "Volle Fahrt voraus, mal sehen, ob du mithalten kannst!"
    },
    "victory": {
      1: "Die Speichen stehen still, aber die Entschlossenheit dreht weiter.",
      2: "Abgehängt!",
      3: "Der Weg zum Sieg hat viele Kurven und Wendungen, die es noch zu erkunden gilt."
    },
  },
  "black_belt": {
    "encounter": {
      1: "Ich lobe deinen Mut, mich herauszufordern! Denn ich bin derjenige mit dem stärksten Tritt!",
      2: "Oh, ich verstehe. Möchtest du in Stücke geschnitten werden? Oder bevorzugst du die Rolle des Punchingballs?"
    },
    "victory": {
      1: "Oh. Die Pokémon haben gekämpft. Mein starker Tritt hat überhaupt nicht geholfen.",
      2: "Hmmm… Wenn ich sowieso verlieren würde, wollte ich wenigstens total vermöbelt werden."
    },
  },
  "battle_girl": {
    "encounter": {
      1: "Du musst mich nicht beeindrucken. Du kannst gegen mich verlieren.",
    },
    "victory": {
      1: "Es ist schwer, sich zu verabschieden, aber uns läuft die Zeit davon…",
    },
  },
  "hiker": {
    "encounter": {
      1: "Mein mittelalterlicher Bauch gibt mir so viel Gravitas wie die Berge, die ich besteige!",
      2: "Ich habe diesen kräftigen Körper von meinen Eltern geerbt… Ich bin wie eine lebende Bergkette…",
    },
    "victory": {
      1: "Zumindest kann ich nicht verlieren, wenn es um BMI geht!",
      2: "Es ist nicht genug… Es ist nie genug. Mein schlechtes Cholesterin ist nicht hoch genug…"
    },
  },
  "ranger": {
    "encounter": {
      1: "Wenn ich von der Natur umgeben bin, hören die meisten anderen Dinge auf, wichtig zu sein.",
      2: "Wenn ich ohne die Natur in meinem Leben lebe, fühle ich mich wie ein Fisch ohne Wasser."
    },
    "victory": {
      1: "Es spielt keine Rolle für die Weite der Natur, ob ich gewinne oder verliere…",
      2: "So etwas ist ziemlich trivial im Vergleich zu den erdrückenden Gefühlen des Stadtlebens."
    },
    "defeat": {
      1: "Ich habe den Kampf gewonnen. Aber der Sieg ist nichts im Vergleich zur Weite der Natur…",
      2: "Ich bin sicher, das mein Sieg nur dank der Natur möglich war."
    }
  },
  "scientist": {
    "encounter": {
      1: "Meine Forschung wird diese Welt zu Frieden und Freude führen.",
    },
    "victory": {
      1: "Ich bin ein Genie… Ich sollte nicht gegen jemanden wie dich verlieren…",
    },
  },
  "school_kid": {
    "encounter": {
      1: "…Heehee. Ich bin zuversichtlich in meine Berechnungen und Analysen.",
      2: "Ich sammle so viel Erfahrung wie möglich, weil ich eines Tages ein Arenaleiter sein möchte."
    },
    "victory": {
      1: "Ohhhh… Berechnungen und Analysen sind kein Gegner für den Zufall…",
      2: "Auch schwierige, anstrengende Erfahrungen haben ihren Zweck, denke ich."
    }
  },
  "artist": {
    "encounter": {
      1: "Früher war ich beliebt, aber jetzt bin ich völlig veraltet.",
    },
    "victory": {
      1: "Mit der Zeit ändern sich auch die Werte. Das habe ich zu spät erkannt.",
    },
  },
  "guitarist": {
    "encounter": {
      1: "Mach dich bereit, den Rhythmus der Niederlage zu spüren, während ich meinen Weg zum Sieg spiele!",
    },
    "victory": {
      1: "Für den Moment zum Schweigen gebracht, aber meine Melodie der Widerstandsfähigkeit wird weiterspielen.",
    },
  },
  "worker": {
    "encounter": {
      1: "Es stört mich, dass die Leute mich immer missverstehen. Ich bin garnicht so grob wie alle denken.",
    },
    "victory": {
      1: "Ich will wirklich nicht, dass meine Haut verbrennt, also möchte ich im Schatten arbeiten.",
    },
  },
  "worker_female": {
    "encounter": {
      1: "Es stört mich, dass die Leute mich immer missverstehen. Ich bin garnicht so grob wie alle denken."
    },
    "victory": {
      1: "Ich will wirklich nicht, dass meine Haut verbrennt, also möchte ich im Schatten arbeiten."
    },
    "defeat": {
      1: "Mein Körper und mein Geist sind nicht immer unbedingt synchron."
    }
  },
  "worker_double": {
    "encounter": {
      1: "Ich zeige dir, dass wir dich brechen können. Wir haben auf dem Feld trainiert!",
    },
    "victory": {
      1: "Wie seltsam… Wie konnte das passieren… Ich hätte nicht ausgemuskelt werden sollen.",
    },
  },
  "hex_maniac": {
    "encounter": {
      1: `Ich höre normalerweise nur klassische Musik, aber wenn ich verliere,
          $werde ich ein bisschen New Age ausprobieren!`,
      2: "Ich werde mit jeder Träne stärker, die ich weine."
    },
    "victory": {
      1: "Ist das der Beginn des Zeitalters des Wassermanns? Ich bin bereit für die Veränderung.",
      2: "Jetzt kann ich noch stärker werden. Ich wachse mit jedem Groll."
    },
    "defeat": {
      1: "New Age bezieht sich einfach auf Komponisten der klassischen Musik des 20. Jahrhunderts, richtig?",
      2: `Lass dich nicht von Traurigkeit oder Frustration aufhalten.
          $Du kannst deine Groll nutzen, um dich zu motivieren.`
    }
  },
  "psychic": {
    "encounter": {
      1: "Hallo! Konzentrier dich!",
    },
    "victory": {
      1: "Eeeeek!",
    },
  },
  "officer": {
    "encounter": {
      1: "Bereite dich vor, denn die Gerechtigkeit wird gleich vollstreckt!",
      2: "Bereit, das Gesetz zu verteidigen und die Gerechtigkeit auf dem Schlachtfeld zu wahren!"
    },
    "victory": {
      1: "Die Gerechtigkeit auf meinen Schultern fühlt sich schwerer an denn je…",
      2: "Die Schatten der Niederlage schweben über dem Revier."
    }
  },
  "beauty": {
    "encounter": {
      1: "Mein letzter Kampf überhaupt… So möchte ich, dass wir diesen Kampf sehen…",
    },
    "victory": {
      1: "Es war schön… Lass uns irgendwann wieder einen letzten Kampf haben…",
    },
  },
  "baker": {
    "encounter": {
      1: "Hoffe, du bist bereit, die Niederlage zu schmecken!"
    },
    "victory": {
      1: "Ich werde ein Comeback backen."
    },
  },
  "biker": {
    "encounter": {
      1: "Zeit, aufzudrehen und dich im Staub zurückzulassen!"
    },
    "victory": {
      1: "Ich werde für das nächste Rennen tunen."
    },
  },
  "brock": {
    "encounter": {
      1: "Meine Expertise in Bezug auf Gesteins-Pokémon wird dich besiegen! Komm schon!",
      2: "Meine felsenfeste Entschlossenheit wird dich überwältigen!",
      3: "Ich bin ein harter Fels, der nicht so leicht zu brechen ist!"
    },
    "victory": {
      1: "Die Stärke deiner Pokémon hat meine steinharte Verteidigung überwunden!",
      2: "Die Welt ist riesig! Ich bin froh, dass ich die Chance hatte, gegen dich zu kämpfen.",
      3: "Perhaps I should go back to pursuing my dream as a Pokémon Breeder…"
    },
    "defeat": {
      1: "Der beste Angriff ist eine gute Verteidigung!\nDas ist meine Art, Dinge zu tun!",
      2: "Komm und studiere Felsen mit mir, um besser zu lernen wie man gegen sie kämpft!",
      3: "Meine Reisen durch die Regionen zahlen sich aus!"
    }
  },
  "misty": {
    "encounter": {
      1: "Meine Taktik ist ein Frontalangriff mit Wasser-Pokémon!",
      2: "Hiya! Ich zeige dir die Stärke meiner Wasser-Pokémon!",
      3: `Mein Traum war es, auf eine Reise zu gehen und gegen starke Trainer zu kämpfen… 
          $Wirst du eine ausreichende Herausforderung sein?`
    },
    "victory": {
      1: "Du bist wirklich stark… Ich gebe zu, du hast es drauf…",
      2: "Du weißt, dass du nur Glück hattest, oder?",
      3: "Wow, ich kann nicht glauben, dass du mich besiegt hast!"
    },
    "defeat": {
      1: "War die mächtige Misty zu viel für dich?",
      2: "Ich hoffe, du hast die eleganten Schwimmtechniken meiner Pokémon gesehen!",
      3: "Deine Pokémon waren keine Herausforderung für meine geliebten Pokémon!"
    }
  },
  "lt_surge": {
    "encounter": {
      1: "Meine Elektro-Pokémon haben mich im Krieg gerettet! Ich werde dir zeigen, wie!",
      2: "Du wirst um Gnade winseln, wenn ich dich geschockt habe!",
      3: "Ich werde dich genau so zappen, wie ich es mit all meinen Feinden im Kampf mache!"
    },
    "victory": {
      1: "Whoa! Dein Team ist echt stark!",
      2: "Aaargh, du bist stark! Selbst meine elektrischen Tricks haben gegen dich verloren.",
      3: "Das war ein absolut schockierender Verlust!"
    },
    "defeat": {
      1: "Oh ja! Wenn es um Elektro-Pokémon geht, bin ich weltweit die Nummer eins!",
      2: "Hahaha! Das war ein elektrisierender Kampf!",
      3: "Ein Pokémon-Kampf ist Krieg, und ich habe dir den Nahkampf gezeigt!"
    }
  },
  "erika": {
    "encounter": {
      1: "Ah, das Wetter ist hier so schön…\nOh, ein Kampf? Nun gut.",
      2: "Meine Pokémon-Kampffähigkeiten stehen in Konkurrenz zu meinen Blumenarrangierfähigkeiten.",
      3: "Oh, ich hoffe, der angenehme Duft meiner Pokémon lässt mich nicht wieder einschlafen…",
      4: "Blumen in einem Garten zu sehen ist so beruhigend.",
    },
    "victory": {
      1: "Oh! Ich gestehe meine Niederlage ein.",
      2: "Dieser Kampf war so entspannend.",
      3: "Ah, es scheint, dass ich verloren habe…",
      4: "Na immerhin habe ich noch meine Blumen."
    },
    "defeat": {
      1: "Ich hatte Angst, dass ich einschlafen würde…",
      2: "Es scheint, als hätten meine Pflanzen-Pokémon dich überwältigt.",
      3: "Dieser Kampf war eine so beruhigende Erfahrung.",
      4: "Das war alles?"
    }
  },
  "janine": {
    "encounter": {
      1: "Ich meistere die Kunst der giftigen Angriffe. Ich werde heute mit dir trainieren!",
      2: "Vater vertraut darauf, dass ich mich behaupten kann. Ich werde ihm recht geben!",
      3: "Meine Ninja-Techniken sind nur zweitrangig zu denen meines Vaters! Kannst du mithalten?"
    },
    "victory": {
      1: "Selbst jetzt brauche ich noch Training… Ich verstehe.",
      2: "Dein Kampfstil hat meinen überwältigt.",
      3: "Ich werde mich wirklich anstrengen und meine Fähigkeiten verbessern."
    },
    "defeat": {
      1: "Fufufu… das Gift hat dir all deine Kraft zum Kämpfen geraubt.",
      2: "Ha! Du hattest keine Chance gegen meine überlegenen Ninja-Fähigkeiten!",
      3: "Vaters Vertrauen in mich war nicht unbegründet."
    }
  },
  "sabrina": {
    "encounter": {
      1: "Ich habe deine Ankunft in einer Vision gesehen!",
      2: "Ich mag es nicht zu kämpfen, aber wenn du darauf bestehst, werde ich dir meine Kräfte zeigen!",
      3: "Ich spüre große Ambitionen in dir. Ich werde sehen, ob sie begründet sind."
    },
    "victory": {
      1: "Deine Kraft… Sie übertrifft bei weitem das, was ich vorausgesehen habe…",
      2: "Ich habe es nicht geschafft, deine Stärke genau vorherzusagen.",
      3: "Selbst mit meinen immensen psychischen Kräften kann ich niemanden spüren, der stärker ist als du."
    },
    "defeat": {
      1: "Dieser Sieg… Genau so habe ich ihn in meinen Visionen gesehen!",
      2: "Vielleicht war es jemand anderes, den ich spürte…",
      3: `Verfeinere deine Fähigkeiten, bevor du unüberlegt in den Kampf stürzt.
          $Du weißt nie, was die Zukunft bereithält, wenn du es tust…`
    }
  },
  "blaine": {
    "encounter": {
      1: "Hah! Ich hoffe, du hast Feuerheiler mitgebracht!",
      2: "Meine feurigen Pokémon werden alle Herausforderer verbrennen!",
      3: "Mach dich bereit, mit dem Feuer zu spielen!"
    },
    "victory": {
      1: "Ich habe mich bis auf die Knochen verbrannt! Nicht einmal Asche bleibt!",
      2: "Habe ich die Flammen nicht hoch genug geschürt?",
      3: "Ich bin komplett ausgebrannt… Aber das lässt meine Motivation, mich zu verbessern, noch heißer brennen!"
    },
    "defeat": {
      1: "Mein wütendes Inferno kann nicht gelöscht werden!",
      2: "Meine Pokémon sind durch die Hitze dieses Sieges gestärkt worden!",
      3: "Hah! Meine Leidenschaft brennt heller als deine!"
    }
  },
  "giovanni": {
    "encounter": {
      1: "Ich, der Anführer von Team Rocket, werde dir eine Welt voller Schmerz bereiten!",
      2: "Mein Training hier wird entscheidend sein, bevor ich mich wieder meinen alten Kollegen stelle.",
      3: "Ich denke dass du nicht auf die Ausmaße des Scheiterns vorbereitet bist, die du gleich erleben wirst!"
    },
    "victory": {
      1: "WAS! Ich, verlieren?! Es gibt nichts, was ich dir sagen möchte!",
      2: "Hmm… Du wirst nie verstehen können, was ich zu erreichen versuche.",
      3: "Diese Niederlage ist nur ein kleiner Rückschlag.\nTeam Rocket wird aus der Asche auferstehen."
    },
    "defeat": {
      1: "Das du nicht in der Lage bist, deine eigene Stärke einzuschätzen, zeigt, dass du noch ein Kind bist.",
      2: "Versuche nicht, dich wieder in meine Angelegenheiten einzumischen.",
      3: "Ich hoffe, du verstehst, wie dumm es war, mich herauszufordern."
    }
  },
  "roxanne": {
    "encounter": {
      1: "Wärs du so freundlich und würdest mir zeigen, wie du kämpfst?",
      2: "Man lernt so viel, wenn man gegen viele Trainer kämpft.",
      3: "Oh, du hast mich beim Strategie entwickeln erwischt. Möchtest du kämpfen?"
    },
    "victory": {
      1: "Oh, es scheint, als hätte ich verloren.",
      2: "Es scheint, als hätte ich noch so viel mehr zu lernen, wenn es um den Kämpfe geht.",
      3: "Ich werde mir zu Herzen nehmen, was ich heute gelernt habe."
    },
    "defeat": {
      1: "Ich habe so viele Dinge aus unserem Kampf gelernt. Ich hoffe, du auch.",
      2: `Ich freue mich darauf, wieder gegen dich zu kämpfen.
          $Ich hoffe, du wirst das, was du hier gelernt hast, anwenden.`,
      3: "Ich habe gewonnen, weil ich alles gelernt habe."
    }
  },
  "brawly": {
    "encounter": {
      1: "Oh man, ein Herausforderer!\nLass uns sehen, was du kannst!",
      2: "Du scheinst auf große Auftritte zu stehen.\nLass uns kämpfen",
      3: "Zeit, einen Sturm zu entfachen!\nLos geht's!"
    },
    "victory": {
      1: "Oh wow, du hast mich überrumpelt!",
      2: "Du hast meinen Flow übernommen und mich besiegt!",
      3: "Ich fühle mich als hätte ich mich in der Granithöhle verirrt!"
    },
    "defeat": {
      1: "Haha, ich surfe die große Welle! Fordere mich irgendwann wieder heraus.",
      2: "Surfe mal wieder mit mir!",
      3: "Genau wie die Gezeiten kommen und gehen, hoffe ich, dass du zurückkommst, um mich herauszufordern."
    }
  },
  "wattson": {
    "encounter": {
      1: "Zeit, geschockt zu werden! Wahahahaha!",
      2: "Ich lass die Funken fliegen! Wahahahaha!",
      3: "Ich hoffe, du hast Para-Heiler dabei! Wahahahaha!"
    },
    "victory": {
      1: "Scheint als wäre ich entladen! Wahahahaha!",
      2: "Du hast mich komplett geerdet! Wahahahaha!",
      3: "Danke für den Nervenkitzel! Wahahahaha!"
    },
    "defeat": {
      1: "Lade deine Batterien wieder auf und fordere mich irgendwann wieder heraus! Wahahahaha!",
      2: "Ich hoffe du fandest unseren Kampf elektrisierend! Wahahahaha!",
      3: "Bist du nicht geschockt, dass ich gewonnen habe? Wahahahaha!"
    }
  },
  "flannery": {
    "encounter": {
      1: "Nett dich zu kennenzulernen! Warte, nein… Ich werde dich zermalmen!",
      2: "Ich bin noch nicht lange Arenaleiterin, aber ich werde dich grillen!",
      3: "Es ist Zeit, dir die Kampftechniken zu zeigen, die mein Großvater mir beigebracht hat! Lass uns kämpfen!"
    },
    "victory": {
      1: "Du erinnerst mich an meinen Großvater… Kein Wunder, dass ich verloren habe.",
      2: "Strenge ich mich zu sehr an? Ich sollte mich entspannen, ich darf mich nicht zu sehr aufregen.",
      3: "Zu verlieren wird meine Flamme nicht ersticken. Zeit, das Training wieder zu entfachen!"
    },
    "defeat": {
      1: "Ich hoffe, ich habe meinen Großvater stolz gemacht… Lass uns irgendwann wieder kämpfen.",
      2: "Ich… Ich kann nicht glauben, dass ich gewonnen habe! Meine Art zu kämpfen hat funktioniert!",
      3: "Lass uns bald wieder heiße Moves austauschen!"
    }
  },
  "norman": {
    "encounter": {
      1: "Ich bin überrascht, dass du es bis hierher geschafft hast. Lass uns kämpfen.",
      2: "Ich werde alles in meiner Macht stehende tun, um als Arenaleiter zu gewinnen. Los geht's!",
      3: "Du solltest alles geben! Lasst uns kämpfen!"
    },
    "victory": {
      1: "Ich habe gegen dich verloren…? Das ist eine Überraschung.",
      2: "War der Umzug nach Hoenn die richtige Entscheidung? Ich bin mir nicht sicher.",
      3: "Ich kann es nicht fasen. Das war ein großartiger Kampf."
    },
    "defeat": {
      1: "Wir haben beide unser Bestes gegeben. Ich hoffe, wir können bald wieder kämpfen.",
      2: "Du solltest versuchen, mein Kind herauszufordern. Du könntest etwas lernen!",
      3: "Danke für den tollen Kampf. Viel Glück beim nächsten Mal."
    }
  },
  "winona": {
    "encounter": {
      1: "Ich bin durch die Lüfte geflogen und habe nach Beute gesucht… und du bist mein Ziel!",
      2: "Egal, wie unser Kampf ausgeht, meine Flug-Pokémon und ich werden mit Anmut triumphieren. Auf in den Kampf!",
      3: "Ich hoffe, du hast keine Höhenangst. Lasst uns aufsteigen!"
    },
    "victory": {
      1: "Du bist der erste Trainer, den ich gesehen habe, der mehr Anmut hat als ich. Ausgezeichnet",
      2: "Meine Flug-Pokémon sind abgestürzt! Na gut.",
      3: "Auch wenn ich gefallen sein mag, meine Pokémon werden weiter fliegen!"
    },
    "defeat": {
      1: "Meine Flug-Pokémon und ich werden für immer elegant tanzen!",
      2: "Ich hoffe du hast die Show genossen. Unser anmutiger Tanz ist beendet.",
      3: "Wirst du zurückkommen und unsere elegante Choreographie noch einmal sehen?"
    }
  },
  "tate": {
    "encounter": {
      1: "Hehehe… Bist du überrascht, mich ohne meine Schwester zu sehen?",
      2: "Ich kann sehen, was du denkst… Du willst kämpfen!",
      3: "Wie kannst du jemanden besiegen der deine Gedanken lesen kann?"
    },
    "victory": {
      1: "Ich kann es nicht ändern… Ich vermisse Svenja…",
      2: "Die Bande zwischen dir und deinen Pokémon ist stärker als meine.",
      3: "Zusammen mit Svenja wären wir unschlagbar gewesen. Wir können gegenseitig unsere Sätze beenden!"
    },
    "defeat": {
      1: "Meine Pokémon und ich sind siegreich.",
      2: "Wenn du mich nicht besiegen kannst, wirst du auch niemals Svenja besiegen können.",
      3: "All das verdanke ich meinem strengen Training mit Svenja. Meine Pokémon und ich sind eins."
    }
  },
  "liza": {
    "encounter": {
      1: "Hihihi… Bist du überrascht, mich ohne meinen Bruder zu sehen?",
      2: "Ich kann sehen, wonach du verlangst… Du willst kämpfen, oder?",
      3: "Wie kannst du jemanden besiegen, der eins mit seinen Pokémon ist?"
    },
    "victory": {
      1: "Ich kann es nicht ändern… Ich vermisse Ben…",
      2: "Das Band zwischen dir und deinen Pokémon ist stärker als meins.",
      3: "Zusammen mit Ben wären wir unschlagbar gewesen. Wir können gegenseitig unsere Sätze beenden!"
    },
    "defeat": {
      1: "Meine Pokémon und ich sind siegreich.",
      2: "Wenn du mich nicht besiegen kannst, wirst du auch niemals Ben besiegen können.",
      3: "All das verdanke ich meinem strengen Training mit Ben. Meine Pokémon und ich sind eins."
    }
  },
  "juan": {
    "encounter": {
      1: "Jetzt ist nicht die Zeit, schüchtern zu sein. Lass uns kämpfen!",
      2: "Ahahaha, Du wirst Zeuge meiner Kunstfertigkeit mit Wasser-Pokémon!",
      3: "Ein Taifun nähert sich! Wirst du mich testen können?",
      4: `Bitte, du wirst Zeuge unserer Kunstfertigkeit.
          $Eine großartige Illusion aus Wasser, die von meinen Pokémon und mir geschaffen wurde!`
    },
    "victory": {
      1: "Du bist ein Genie, das Wasilli herausfordern kann!",
      2: `Ich habe mich auf Eleganz konzentriert, während du trainiert hast.
          $Es kein Wunder, dass du gewonnen hast.`,
      3: "Ahahaha! Nun gut, dieses Mal hast du gewonnen.",
      4: "Ich spüre den Glanz deines Könnens, der alles überwinden wird."
    },
    "defeat": {
      1: "Meine Pokémon und ich haben eine Illusion aus Wasser geschaffen und sind siegreich hervorgegangen.",
      2: "Ahahaha, Ich habe gewonnen, und du hast verloren.",
      3: "Soll ich dir mein Outfit leihen? Es könnte dir beim Kampf helfen! Ahahaha, ich scherze!",
      4: "Ich bin der Gewinner! Das heißt, du hast verloren."
    }
  },
  "crasher_wake": {
    "encounter": {
      1: "Aufgepasst! Wellenbrecher Marinus… ist… da!",
      2: "Brechende Wellen! Ich bin Wellenbrecher Marinus!",
      3: "Ich bin die Flutwelle der Macht, die dich wegspült!"
    },
    "victory": {
      1: "Das bringt ein Grinsen in mein Gesicht! Guhahaha! Das war ein Spaß!",
      2: "Hunwah! Es ist vorbei! Wie soll ich das sagen… Ich will mehr! Ich wollte viel mehr kämpfen!",
      3: "WAAAS?!"
    },
    "defeat": {
      1: "Yeeeeah! So muss das sein!",
      2: "Ich habe gewonnen, aber ich will mehr! Ich wollte viel mehr kämpfen!",
      3: "Bis bald! Ich freue mich auf den nächsten Kampf!"
    }
  },
  "falkner": {
    "encounter": {
      1: "Ich werde dir die wahre Kraft der prächtigen Flug-Pokémon zeigen!",
      2: "Winde, bleibt bei mir!",
      3: "Vater! Ich hoffe, du siehst mir beim Kampf von oben zu!"
    },
    "victory": {
      1: "Ich verstehe… Ich werde mich anmutig zurückziehen.",
      2: "Eine Niederlage ist eine Niederlage. Du bist wirklich stark.",
      3: "…Verdammt! Ich habe verloren!"
    },
    "defeat": {
      1: "Vater! Ich habe mit deinen geliebten Flug-Pokémon gewonnen…",
      2: "Flug-Pokémon sind die Besten!",
      3: "Ich habe das Gefühl, dass ich meinem Vater näher komme!"
    }
  },
  "nessa": {
    "encounter": {
      1: `Egal, welchen Plan dein raffinierter Verstand auch schmiedet,
          $mein Partner und ich werden ihn mit Sicherheit zu Fall bringen.`,
      2: "Ich bin nicht hier, um zu plaudern. Ich bin hier, um zu gewinnen!",
      3: "Das ist ein kleines Geschenk von meinen Pokémon… Ich hoffe, du kannst es annehmen!"
    },
    "victory": {
      1: "Du und deine Pokémon sind einfach zu stark…",
      2: "Wie…? Wie kann das sein?",
      3: "Ich wurde total weggespült!"
    },
    "defeat": {
      1: "Die wütenede Welle schlägt wieder zu!",
      2: "Es ist Zeit, die Welle des Sieges zu reiten!",
      3: "Ehehe!"
    }
  },
  "melony": {
    "encounter": {
      1: "Ich halte mich nicht zurück!",
      2: "Okay, ich denke, wir sollten anfangen.",
      3: "Ich werde dich einfrieren!"
    },
    "victory": {
      1: "Du… Du bist ziemlich gut, oder?",
      2: "Wenn du Mac triffst, haue ihn für mich um, ja?",
      3: "Ich denke, du hast 'das Eis brechen' ein wenig zu wörtlich genommen…"
    },
    "defeat": {
      1: "Siehst du jetzt, wie ernst Kämpfe sein können?",
      2: "Hee! Es sieht so aus, als hätte ich wieder gewonnen!",
      3: "Hältst du dich zurück?"
    }
  },
  "marlon": {
    "encounter": {
      1: "Du siehst stark aus! Los geht's!",
      2: "Ich bin stark wie das weite Meer. Du wirst weggespült, das ist sicher.",
      3: "Oh ho, ich treffe auf dich! Das ist abgefahren."
    },
    "victory": {
      1: "Du hast total gerockt! Du ziehst einige krasse Pokémon groß. Du hast das Trainer-Ding drauf!",
      2: "Du siehst nicht nur stark aus, du bist auch stark! Eh, ich wurde auch weggespült!",
      3: "Du bist stark wie eine spektakuläre Welle!"
    },
    "defeat": {
      1: "Du bist stark, aber nicht stark genug, um das Meer zu beeinflussen, 'OK!",
      2: "Hee! Sieht so aus, als hätte ich wieder gewonnen!",
      3: "Süßer, süßer Sieg!"
    }
  },
  "shauntal": {
    "encounter": {
      1: `Entschuldigung. Du bist ein Herausforderer, oder?\nIch bin Anissa, die Geist-Pokémon-Nutzerin
          $der Top Vier. Ich werde dich in die Welt der Bücher entführen.`,
      2: `Ich liebe es, über Trainer und deren Pokémon zu schreiben.
          $Könnte ich dich als Inspiration verwenden?`,
      3: "Jeder, der mit Pokémon arbeitet, hat eine Geschichte zu erzählen. Welche Geschichte wird erzählt?"
    },
    "victory": {
      1: "Wow. Ich bin sprachlos!",
      2: `E-entschuldigung! Zuerst muss ich mich bei meinen Pokémon entschuldigen…
          $Es tut mir wirklich leid, dass ihr wegen mir eine schlechte Erfahrung gemacht habt.`,
      3: "Selbst in Anbetracht dessen, bin ich immer noch eine der Top Vier!"
    },
    "defeat": {
      1: "Eheh.",
      2: "Das war exzellentes Material für meinen nächsten Roman!",
      3: "Und wenn sie nicht gestorben sind, dann leben sie noch heute…",
    }
  },
  "marshal": {
    "encounter": {
      1: `Mein Mentor, Lauro, sieht sieht Potential in dir. Ich werde dich testen,
          $dich an die Grenzen deiner Stärke bringen. Kiai!`,
      2: "Ein Sieg, ein entscheidender Sieg, das ist mein Ziel! Herausforderer, hier komme ich!",
      3: "Ich selber suche die Stärke eines Kämpfers zu entwickeln und jede Schwäche in mir zu brechen!"
    },
    "victory": {
      1: "Puh! Gut gemacht!",
      2: "Während deine Kämpfe weitergehen, strebe nach noch größeren Höhen!",
      3: "Die Stärke, die du und deine Pokémon gezeigt haben, hat mich tief beeindruckt..."
    },
    "defeat": {
      1: "Hmm.",
      2: "Das war ein guter Kampf.",
      3: "Haaah! Haaah! Haiyaaaah!"
    }
  },
  "cheren": {
    "encounter": {
      1: "Du erinnerst mich an einen alten Freund. Das macht mich gespannt auf diesen Pokémon-Kampf!",
      2: `Pokémon-Kämpfe haben keinen Sinn, wenn man nicht darüber nachdenkt, warum man kämpft.
      $Oder besser gesagt, es macht das Kämpfen mit Pokémon sinnlos.`,
      3: "Ich heiße Cheren! Ich bin ein Arenaleiter und Lehrer! Freut mich, dich kennenzulernen."
    },
    "victory": {
      1: "Danke! Ich habe gesehen, was mir gefehlt hat.",
      2: "Danke! Ich habe das Gefühl, ein Stück meines Ideals entdeckt zu haben.",
      3: "Hmm… Das ist problematisch."
    },
    "defeat": {
      1: "Als Arenaleiter will ich eine Hürde für dich sein, die du überwinden musst.",
      2: "In Ordnung!",
      3: `Ich bin so weit gekommen, weil Pokémon an meiner Seite waren.
          $Vielleicht sollten wir darüber nachdenken, warum Pokémon uns helfen,
          $nicht als Pokémon und Trainer, sondern als Beziehung zwischen Lebewesen.`
    }
  },
  "chili": {
    "encounter": {
      1: "Jaaaa! Zeit, mit dem Feuer zu spielen! Ich bin der Stärkste von uns Brüdern!",
      2: "Ta-da! Der Feuer-Typ-Kämpfer Maik --das bin ich-- wird dein Gegner sein!",
      3: "Ich werde dir zeigen, was ich und meine feurigen Pokémon draufhaben!"
    },
    "victory": {
      1: "Du hast mich besiegt. Ich bin... ausgebrannt...",
      2: "Whoa ho! Du brennst vor Energie!",
      3: "Autsch! Du hast mich erwischt!"
    },
    "defeat": {
      1: "Ich brenne! Spiel mit mir, und du wirst dich verbrennen!",
      2: "Wenn du mit Feuer spielst, wirst du verbrannt!",
      3: "Ich meine, komm schon, dein Gegner war ich! Du hattest keine Chance!"
    }
  },
  "cilan": {
    "encounter": {
      1: `Nichts Persönliches... Keine harten Gefühle... Ich und meine Pflanzen-Pokémon werden...
               $Ähm... Wir werden kämpfen, egal was passiert.`,
      2: "Also, ähm, wenn es für dich in Ordnung ist, werde ich, ähm, alles geben, um, äh, dein Gegner zu sein.",
      3: "OK… Also, ähm, ich bin Benny, ich mag Pflanzen-Pokémon."
    },
    "victory": {
      1: "Ähm… Ist es jetzt vorbei?",
      2: `…Was für eine Überraschung. Du bist sehr stark, nicht wahr? 
               $Ich glaube, meine Brüder hätten dich auch nicht besiegen können…`,
      3: "…Hmm. Sieht aus, als wäre mein Timing, ähm, schlecht gewesen?"
    },
    "defeat": {
      1: "Huh? Habe ich gewonnen?",
      2: `Ich denke... Ich habe wohl gewonnen, weil ich mit meinen Brüdern Maik und Colin traniert habe,
          $und wir so alle stärker geworden sind.`,
      3: "Es... es war ein ziemlich aufregendes Erlebnis..."
    }
  },
  "roark": {
    "encounter": {
      1: "Ich muss dein Potenzial als Trainer und die Stärke der Pokémon sehen, die mit dir kämpfen!",
      2: "Los geht's! Dies sind meine Gesteins-Pokémon, mein ganzer Stolz!",
      3: "Gesteins-Pokémon sind einfach die besten!",
      4: "Ich muss dein Potenzial als Trainer und die Stärke der Pokémon sehen, die mit dir kämpfen!",
    },
    "victory": {
      1: "W-was? Das kann nicht sein! Meine total tranierten Pokémon!",
      2: `…Wir haben die Kontrolle verloren. Beim nächsten Mal fordere ich dich
          $zu einem Fossilien-Ausgrabungswettbewerb heraus.`,
      3: "Mit deinem Können ist es nur natürlich, dass du gewinnst.",
      4: "W-was?! Das kann nicht sein! Selbst das war nicht genug?",
      5: "Ich habe es vermasselt."
    },
    "defeat": {
      1: "Siehst du? Ich bin stolz auf meinen steinigen Kampfstil!",
      2: "Danke! Der Kampf hat mir Vertrauen gegeben, dass ich vielleicht meinen Vater besiegen kann!",
      3: "Ich fühle mich, als hätte ich gerade einen wirklich hartnäckigen Felsen durchbrochen!"
    }
  },
  "morty": {
    "encounter": {
      1: `Mit ein bisschen mehr könnte ich eine Zukunft sehen, in der ich das legendäre Pokémon treffe.
         $Du wirst mir helfen, dieses Level zu erreichen!`,
      2: `Es heißt, dass ein regenbogenfarbenes Pokémon vor einem wirklich starken Trainer erscheinen wird.
         $Ich habe an diese Geschichte geglaubt, deshalb habe ich mein ganzes Leben lang heimlich trainiert.
         $Als Ergebnis kann ich jetzt Dinge sehen, die andere nicht sehen.
         $Ich sehe einen Schatten der Person, die das Pokémon erscheinen lassen wird.
         $Ich glaube, diese Person bin ich! Du wirst mir helfen, dieses Level zu erreichen!`,
      3: "Ob du es glaubst oder nicht, mystische Kräfte existieren.",
      4: "Du kannst die Früchte meines Trainings bezeugen.",
      5: "Du musst deine Seele mit der eines Pokémon vereinen. Kannst du das?",
      6: "Sag mal, willst du an meinem Training teilnehmen?"
    },
    "victory": {
      1: "Ich bin noch nicht gut genug...",
      2: `Ich sehe... Deine Reise hat dich an weit entfernte Orte geführt und du hast viel mehr gesehen als ich.
                $Ich beneide dich darum...`,
      3: "Wie ist das möglich...",
      4: `Ich glaube nicht, dass unser Potenzial so unterschiedlich ist.
                $Aber du scheinst etwas mehr zu haben... Sei es drum.`,
      5: "Ich brauche wohl mehr Training.",
      6: "Das ist schade."
    },
    "defeat": {
      1: "Ich habe... einen weiteren Schritt nach vorne gemacht.",
      2: "Fufufu...",
      3: "W-was?! Das kann nicht sein! Selbst das war nicht genug?",
      4: "Ich fühle mich, als hätte ich gerade einen wirklich hartnäckigen Felsen durchbrochen!",
      5: "Ahahahah!",
      6: "Ich wusste, dass ich gewinnen würde!"
    }
  },
  "crispin": {
    "encounter": {
      1: "Ich will gewinnen, also werde ich genau das tun!",
      2: "Ich kämpfe, weil ich kämpfen will! Und weißt du was? So sollte es sein!"
    },
    "victory": {
      1: "Ich wollte gewinnen... aber ich habe verloren!",
      2: "Ich habe verloren... weil ich nicht gewinnen konnte!"
    },
    "defeat": {
      1: "Hey, warte mal. Habe ich gerade gewonnen? Ich glaube, ich habe gewonnen! Das ist befriedigend!",
      2: "Wooo! Das war unglaublich!"
    }
  },
  "amarys": {
    "encounter": {
      1: `Ich möchte jemandem helfen. Daher kann ich es mir nicht leisten, zu verlieren.
                $… Unser Kampf beginnt jetzt.`,
    },
    "victory": {
      1: "Ich bin... nicht genug, wie ich sehe."
    },
    "defeat": {
      1: "Der Sieg gehört mir. Gut gekämpft."
    }
  },
  "lacey": {
    "encounter": {
      1: "Ich werde dir mit meiner gewohnten Team, als Mitglied der Top Vier gegenüberstehen."
    },
    "victory": {
      1: "Das war ein großartiger Kampf!"
    },
    "defeat": {
      1: "Geben wir deinem Pokémon einen kräftigen Applaus für ihre Bemühungen!"
    }
  },
  "drayton": {
    "encounter": {
      1: `Mann, ich liebe Stühle. Liebst du nicht auch Stühle? Was für Lebensretter.
                $Ich verstehe nicht, warum nicht jeder einfach die ganze Zeit sitzt. Stehen ist anstrengend!`,
    },
    "victory": {
      1: "Ich hätte damit rechnen sollen!"
    },
    "defeat": {
      1: `Heh heh! Macht nichts, ich habe hier nur einen Sieg eingefahren.
          $Ich verstehe, wenn du sauer bist, aber geh nicht völlig auf mich los, okay?`
    }
  },
  "ramos": {
    "encounter": {
      1: `Hast du den Garten-Spielplatz genossen, den ich mit all diesen kräftigen Pflanzen angelegt habe?
          $Ihre Stärke ist ein Zeichen meiner Stärke als Gärtner und Arenaleiter! 
          $Bist du sicher, dass du bereit bist, dich dem zu stellen?`,
    },
    "victory": {
      1: "Du glaubst an deine Pokémon... Und sie glauben an dich... Es war ein feiner Kampf, Sprössling."
    },
    "defeat": {
      1: "Hohoho... In der Tat. Schwache kleine Grashalme brechen selbst durch Beton."
    }
  },
  "viola": {
    "encounter": {
      1: `Ob es die Tränen der Frustration nach einer Niederlage sind
          $oder das Aufblühen der Freude nach einem Sieg...
          $Beides sind großartige Motive für meine Kamera! Fantastisch! Das wird einfach fantastisch!
          $Jetzt komm auf mich zu!`,
      2: "Mein Objektiv ist immer auf den Sieg fokussiert - ich lasse mir diesen Moment nicht entgehen!"
    },
    "victory": {
      1: "Du und deine Pokémon haben mir eine ganz neue Tiefenschärfe gezeigt! Einfach fantastisch!",
      2: `Die Welt, die du durch ein Objektiv siehst, und die Welt,
         $die du mit einem Pokémon an deiner Seite siehst...
         $Die gleiche Welt kann völlig anders aussehen, je nach Blickwinkel.`
    },
    "defeat": {
      1: "Das Foto vom Moment meines Sieges wird ein echter Gewinner sein!",
      2: "Ja! Ich habe einige großartige Fotos gemacht!"
    }
  },
  "candice": {
    "encounter": {
      1: `Du willst Frida herausfordern? Klar! Ich habe auf jemanden Starken gewartet!
                $Aber ich sollte dir sagen, ich bin stark, weil ich weiß, wie man sich konzentriert.`,
      2: `Pokémon, Mode, Romantik... Es geht alles um Konzentration!
                $Ich werde dir zeigen, was ich meine. Mach dich bereit zu verlieren!`
    },
    "victory": {
      1: "Ich muss sagen, ich bin von dir angetan! Vielleicht bewundere ich dich sogar ein bisschen.",
      2: `Wow! Du bist großartig! Du hast meinen Respekt verdient!
                $Ich denke, dein Fokus und Wille haben uns völlig umgehauen.`
    },
    "defeat": {
      1: "Ich habe deinen Siegeswillen gespürt, aber ich verliere nicht!",
      2: "Siehst du? Fridas Fokus! Der Fokus meiner Pokémon ist auch großartig!"
    }
  },
  "gardenia": {
    "encounter": {
      1: "Du hast eine Sieger-Aura. Also, das wird Spaß machen. Lass uns kämpfen!"
    },
    "victory": {
      1: "Unglaublich! Du bist sehr gut, nicht wahr?"
    },
    "defeat": {
      1: "Ja! Meine Pokémon und ich sind perfekt abgestimmt!"
    }
  },
  "aaron": {
    "encounter": {
      1: "Okay! Lass mich gegen dich antreten!"
    },
    "victory": {
      1: "Kämpfen ist eine tiefe und komplexe Angelegenheit..."
    },
    "defeat": {
      1: "Ein Sieg über ein Mitglied der Top Vier ist nicht leicht zu erringen."
    }
  },
  "cress": {
    "encounter": {
      1: "Das ist korrekt! Ich und meine geschätzten Wasser-Typen werden deine Gegner im Kampf sein!"
    },
    "victory": {
      1: "Verlieren? Ich? Das glaube ich nicht."
    },
    "defeat": {
      1: "Das ist das passende Ergebnis, wenn ich dein Gegner bin."
    }
  },
  "allister": {
    "encounter": {
      1: "'N-Nio.\nH-hier… g-geht's los…"
    },
    "victory": {
      1: `Ich hätte beinahe meine Maske vor Schock verloren... Das war...
                $Wow. Ich sehe dein Können, wie es wirklich ist.`,
    },
    "defeat": {
      1: "D-das war klasse!"
    }
  },
  "clay": {
    "encounter": {
      1: "Harrumph! Du hast mich warten lassen, oder? Gut, jetzt will ich sehen, was du drauf hast!"
    },
    "victory": {
      1: "Mann oh Mann... Es fühlt sich gut an, alles zu geben und trotzdem besiegt zu werden!"
    },
    "defeat": {
      1: `Was wichtig ist, ist wie du auf eine Niederlage reagierst.
                $Deshalb sind Leute, die Niederlagen als Ansporn nutzen, um besser zu werden, stark.`,
    }
  },
  "kofu": {
    "encounter": {
      1: "Ich werde dir ein ganzes Menü aus Wasser-Pokémon servieren! Aber versuch nicht, sie zu essen!"
    },
    "victory": {
      1: `Vaultin' Veluza! Du bist ein lebhafter Mensch, nicht wahr!
          $Ein bisschen ZU lebhaft, wenn ich das so sagen darf!`
    },
    "defeat": {
      1: "Komm bald wieder zu mir, hörst du?"
    }
  },
  "tulip": {
    "encounter": {
      1: "Erlaube mir, meine Fähigkeiten einzusetzen, um deine niedlichen kleinen Pokémon noch schöner zu machen!"
    },
    "victory": {
      1: "Deine Stärke hat eine Magie, die nicht wegzuwaschen ist."
    },
    "defeat": {
      1: `Weißt du, in meinem Beruf verschwinden Menschen,
          $die in einem Bereich kein Talent haben, oft schnell und werden nie wieder gesehen.`,
    }
  },
  "sidney": {
    "encounter": {
      1: `Mir gefällt der Blick, den du mir zuwirfst. Ich denke, du wirst mir einen guten Kampf liefern.
                $Das ist gut! Sieht wirklich gut aus! In Ordnung!
                $Du und ich, lass uns einen Kampf genießen, der nur hier stattfinden kann!`,
    },
    "victory": {
      1: "Nun, wie gefällt dir das? Ich habe verloren! Eh, es hat Spaß gemacht, also ist es egal."
    },
    "defeat": {
      1: "Wir sind hier nicht nachtragend, okay?"
    }
  },
  "phoebe": {
    "encounter": {
      1: `Während meines Trainings habe ich die Fähigkeit erlangt, mit Geister-Pokémon zu kommunizieren.
                $Ja, die Bindung, die ich zu Pokémon entwickelt habe, ist extrem stark.
                $Also komm, versuche nur, meinen Pokémon Schaden zuzufügen!`,
    },
    "victory": {
      1: "Oh, Mist. Ich habe verloren."
    },
    "defeat": {
      1: "Ich freue mich darauf, dich irgendwann wieder zu bekämpfen!"
    }
  },
  "glacia": {
    "encounter": {
      1: `Alles, was ich gesehen habe, sind Herausforderungen von schwachen Trainern und ihren Pokémon.
                $Und du? Es würde mich überaus freuen, wenn ich gegen dich alles geben könnte!`,
    },
    "victory": {
      1: `Du und deine Pokémon… Wie heiß eure Geister brennen!
                $Die alles verzehrende Hitze überwältigt.
                $Es ist kein Wunder, dass meine eisigen Fähigkeiten dir nichts anhaben konnten.`,
    },
    "defeat": {
      1: "Ein leidenschaftlicher Kampf, in der Tat."
    }
  },
  "drake": {
    "encounter": {
      1: `Um mit Pokémon als Partner zu kämpfen, weißt du, was dafür nötig ist? Weißt du, was gebraucht wird?
                $Wenn nicht, wirst du nie gegen mich gewinnen!`,
    },
    "victory": {
      1: "Hervorragend, muss ich sagen."
    },
    "defeat": {
      1: "Ich habe alles für diesen Kampf gegeben!"
    }
  },
  "wallace": {
    "encounter": {
      1: `Da ist etwas an dir… Eine Veränderung in deinem Auftreten.
          $Ich denke, ich spüre das bei dir. Zeig es mir. Zeig mir die Kraft, die du mit deinen Pokémon hast.
          $Und ich werde dir im Gegenzug eine Vorstellung von
          $Illusionen im Wasser von mir und meinen Pokémon präsentieren!`,
    },
    "victory": {
      1: `Bravo. Ich erkenne jetzt deine Authentizität und Großartigkeit als Pokémon-Trainer.
          $Ich freue mich sehr, dich und deine Pokémon kennengelernt zu haben. Du hast dich als würdig erwiesen.`,
    },
    "defeat": {
      1: "Eine große Illusion!"
    }
  },
  "lorelei": {
    "encounter": {
      1: `Niemand kann mich bei eisigen Pokémon übertreffen! Gefrierende Angriffe sind mächtig!
         $Deine Pokémon werden mir ausgeliefert sein, wenn sie erst einmal eingefroren sind! Hahaha!
         $Bist du bereit?`,
    },
    "victory": {
      1: "Wie kannst du es wagen!"
    },
    "defeat": {
      1: "Es gibt nichts, was du tun kannst, wenn du erst einmal eingefroren bist."
    }
  },
  "will": {
    "encounter": {
      1: `Ich habe auf der ganzen Welt trainiert und meine Psycho-Pokémon stark gemacht.
          $Ich kann nur besser werden! Verlieren ist keine Option!`,
    },
    "victory": {
      1: "Ich... ich kann es nicht... glauben..."
    },
    "defeat": {
      1: "Das war knapp. Ich frage mich, was dir fehlt."
    }
  },
  "malva": {
    "encounter": {
      1: `Ich fühle mich, als könnte mein Herz in Flammen aufgehen.
                $Ich brenne vor Hass auf dich, Wicht!`,
    },
    "victory": {
      1: "Was für Neuigkeiten... Ein neuer Herausforderer hat Pachira besiegt!"
    },
    "defeat": {
      1: "Ich bin begeistert! Ja, begeistert, dass ich dich unter meinen Fußsohlen zerquetschen konnte."
    }
  },
  "hala": {
    "encounter": {
      1: "Der alte Hala ist hier, um dich zum Schreien zu bringen!"
    },
    "victory": {
      1: "Ich konnte die Kraft spüren, die du auf deiner Reise gewonnen hast."
    },
    "defeat": {
      1: "Haha! Was für ein erfreulicher Kampf!"
    }
  },
  "molayne": {
    "encounter": {
      1: `Ich habe die Kapitänsposition meinem Cousin Chrys gegeben,
         $aber ich bin zuversichtlich in meine Fähigkeiten.
         $Meine Stärke ist wie die einer Supernova!`,
    },
    "victory": {
      1: "Ich habe sicherlich einen interessanten Trainer zum Kämpfen gefunden!"
    },
    "defeat": {
      1: "Ahaha. Was für ein interessanter Kampf."
    }
  },
  "rika": {
    "encounter": {
      1: "Ich würde sagen, ich werde es dir leicht machen, aber... das wäre gelogen! Denke schnell!"
    },
    "victory": {
      1: "Nicht schlecht, wirklich!"
    },
    "defeat": {
      1: "Nahahaha! Du bist wirklich etwas Besonderes!"
    }
  },
  "bruno": {
    "encounter": {
      1: "Wir werden dich mit unserer überlegenen Kraft niederschmettern! Hoo hah!"
    },
    "victory": {
      1: "Warum? Wie konnte ich verlieren?"
    },
    "defeat": {
      1: "Du kannst mich herausfordern, so oft du willst, aber das Ergebnis wird sich nie ändern!"
    }
  },
  "bugsy": {
    "encounter": {
      1: `Wow, erstaunlich! Du bist ein Experte für Pokémon!
                $Meine Forschung ist noch nicht abgeschlossen. OK, du gewinnst.`,
    },
    "victory": {
      1: `Wow, erstaunlich! Du bist ein Experte für Pokémon!
          $Meine Forschung ist noch nicht abgeschlossen. OK, du gewinnst.`,
    },
    "defeat": {
      1: "Danke! Dank unseres Kampfes konnte ich auch Fortschritte in meiner Forschung machen!"
    }
  },
  "koga": {
    "encounter": {
      1: "Fwahahahaha! Pokémon sind nicht nur rohe Gewalt - das wirst du bald genug sehen!"
    },
    "victory": {
      1: "Ah! Du hast deinen Wert bewiesen!"
    },
    "defeat": {
      1: "Hast du gelernt, die Techniken der Ninja zu fürchten?"
    }
  },
  "bertha": {
    "encounter": {
      1: "Nun, würdest du dieser alten Dame zeigen, wie viel du gelernt hast?"
    },
    "victory": {
      1: `Nun! Liebes Kind, ich muss sagen, das war sehr beeindruckend.
                $Deine Pokémon haben an dich geglaubt und ihr Bestes gegeben, um dir den Sieg zu sichern.
                $Obwohl ich verloren habe, finde ich mich mit einem dummen Grinsen wieder!`,
    },
    "defeat": {
      1: "Hahahahah! Sieht so aus, als hätte diese alte Dame gewonnen!"
    }
  },
  "lenora": {
    "encounter": {
      1: `Nun denn, Herausforderer, ich werde erforschen,
          $wie du mit den Pokémon kämpfst, die du so liebevoll aufgezogen hast!`,
    },
    "victory": {
      1: `Meine Theorie über dich war korrekt. Du bist mehr als nur talentiert... 
          $Du bist motiviert! Ich salutier' dir!`,
    },
    "defeat": {
      1: "Ah ha ha! Wenn du verlierst, analysiere warum und nutze dieses Wissen im nächsten Kampf!"
    }
  },
  "siebold": {
    "encounter": {
      1: `Solange ich lebe, werde ich danach streben, die ultimative Küche...
          $und die stärksten Gegner im Kampf zu finden!`,
    },
    "victory": {
      1: "Ich werde die Erinnerung an dich und deine Pokémon für immer in meinem Herzen bewahren."
    },
    "defeat": {
      1: `Unser Pokémon-Kampf war wie Nahrung für meine Seele. Er wird mich weiter antreiben.
                $So werde ich dir meinen Respekt erweisen, dass du alles im Kampf gegeben hast!`,
    }
  },
  "roxie": {
    "encounter": {
      1: "Mach dich bereit! Ich werde dir den Verstand aus dem Kopf schlagen!"
    },
    "victory": {
      1: "Wahnsinn! Deine Vernunft ist schon giftiger als meine!"
    },
    "defeat": {
      1: "Hey, komm schon! Sei ernst! Du musst mehr geben!"
    }
  },
  "olivia": {
    "encounter": {
      1: "Hier ist keine Einführung nötig. Zeit, gegen mich, Mayla, zu kämpfen!"
    },
    "victory": {
      1: "Wirklich lieblich... Sowohl du als auch deine Pokémon..."
    },
    "defeat": {
      1: "Mmm-hmm."
    }
  },
  "poppy": {
    "encounter": {
      1: "Oooh! Willst du einen Pokémon-Kampf mit mir führen?"
    },
    "victory": {
      1: "Uagh?! Mmmuuuggghhh..."
    },
    "defeat": {
      1: `Jaaa! Ich hab's geschafft! Ich hab dich besiegt! Du kannst kommen für... Für... Einen Revanchekampf?
                $Komm jederzeit für einen Revanchekampf!`,
    }
  },
  "agatha": {
    "encounter": {
      1: "Pokémon sind zum Kämpfen da! Ich zeige dir, wie ein echter Trainer kämpft!"
    },
    "victory": {
      1: "Oh mein Gott! Du bist etwas Besonderes, Kind!"
    },
    "defeat": {
      1: "Bahaha. So wird ein richtiger Kampf geführt!"
    }
  },
  "flint": {
    "encounter": {
      1: "Hoffentlich bist du aufgewärmt, denn hier kommt der Urknall!"
    },
    "victory": {
      1: "Unglaublich! Deine Moves sind so heiß, dass meine im Vergleich lauwarm wirken!"
    },
    "defeat": {
      1: "Huh? War das alles? Ich denke, du brauchst etwas mehr Leidenschaft."
    }
  },
  "grimsley": {
    "encounter": {
      1: "Der Gewinner nimmt alles, und es bleibt nichts für den Verlierer."
    },
    "victory": {
      1: "Wenn man verliert, verliert man alles... Das nächste, wonach ich suche, wird auch der Sieg sein!"
    },
    "defeat": {
      1: "Wenn jemand gewinnt, verliert derjenige, der gegen diese Person gekämpft hat."
    }
  },
  "caitlin": {
    "encounter": {
      1: `Ich bin es, die erschien, als die Blume sich öffnete. Du, der du gewartet hast…
          $Du siehst aus wie ein Pokémon-Trainer mit verfeinerter Stärke und vertiefter Freundlichkeit.
          $Was ich in meinem Gegner suche, ist überlegene Stärke…
          $Bitte entfessle deine Kraft in vollem Umfang!`,
    },
    "victory": {
      1: "Meine Pokémon und ich haben so viel gelernt! Ich danke dir."
    },
    "defeat": {
      1: "Ich strebe danach, mit Eleganz und Anmut zu siegen."
    }
  },
  "diantha": {
    "encounter": {
      1: `Gegen dich und deine Pokémon zu kämpfen, die alle voller Hoffnung für die Zukunft sind...
         $Ehrlich gesagt, es erfüllt mich mit der Energie, die ich brauche, um jeden neuen Tag anzugehen!
         $Wirklich!`,
    },
    "victory": {
      1: "Den edlen Geist von dir und deinen Pokémon im Kampf zu erleben, hat mein Herz wirklich berührt..."
    },
    "defeat": {
      1: "Oh, fantastisch! Was denkst du? Mein Team war ziemlich cool, oder?"
    }
  },
  "wikstrom": {
    "encounter": {
      1: `Guten Tag, junger Herausforderer! Wahrlich, ich bin die berühmte Klinge aus gehärtetem Stahl,
         $Herzog Thymelot! Lasst den Kampf beginnen! En garde!`,
    },
    "victory": {
      1: "Ruhmreich! Das Vertrauen, das du mit deinen ehrenvollen Pokémon teilst, übertrifft sogar meines!"
    },
    "defeat": {
      1: `Was für eine Magie ist das? Mein Herz, es hämmert unaufhörlich in meiner Brust!
         $Gegen einen so würdigen Gegner zu gewinnen, verleiht meiner Seele Flügel - so fliege ich!`,
    }
  },
  "acerola": {
    "encounter": {
      1: "Kämpfen macht einfach Spaß! Komm schon, ich schaffe das!"
    },
    "victory": {
      1: "Ich bin... sprachlos! Wie hast du das gemacht?!"
    },
    "defeat": {
      1: "Ehaha! Was für ein erstaunlicher Sieg!"
    }
  },
  "larry_elite": {
    "encounter": {
      1: `Hallo... Ich bin's, Aoki.
                $Ich bin auch Mitglied der Top Vier, ja... Leider für mich.`,
    },
    "victory": {
      1: "Nun, das hat uns den Wind aus den Segeln genommen..."
    },
    "defeat": {
      1: "Es ist Zeit für ein Treffen mit dem Boss."
    }
  },
  "lance": {
    "encounter": {
      1: "Ich habe auf dich gewartet. Erlaube mir, deine Fähigkeiten zu testen.",
      2: "Ich dachte, du würdest es so weit schaffen. Lass uns anfangen."
    },
    "victory": {
      1: "Du hast mich besiegt. Du bist großartig!",
      2: "Ich hätte nie erwartet, dass ein anderer Trainer mich schlägt... Ich bin überrascht."
    },
    "defeat": {
      1: "Das war knapp. Willst du es nochmal versuchen?",
      2: "Es ist nicht so, dass du schwach bist. Lass dich davon nicht stören."
    }
  },
  "karen": {
    "encounter": {
      1: "Ich bin Melanie. Möchtest du einen Kampf mit meinen Unlicht-Pokémon?",
      2: "Ich bin anders als die, die du bereits getroffen hast.",
      3: "Du hast ein charmantes Team zusammengestellt. Unser Kampf wird sicher gut."
    },
    "victory": {
      1: "Nein! Ich kann nicht gewinnen. Wie bist du so stark geworden?",
      2: "Ich werde nicht von meinem gewählten Weg abweichen.",
      3: "Der Champion freut sich darauf, dich kennenzulernen."
    },
    "defeat": {
      1: "Das habe ich erwartet.",
      2: "Nun, das war relativ unterhaltsam.",
      3: "Komm mich jederzeit besuchen."
    }
  },
  "milo": {
    "encounter": {
      1: `Es scheint, als würdest du Pokémon wirklich gut verstehen.
               $Das wird ein harter Kampf!
               $Ich muss mein Pokémon Dynamaximieren, wenn ich gewinnen will!`,
    },
    "victory": {
      1: "Die Kraft des Grases ist verwelkt... Was für ein unglaublicher Herausforderer!"
    },
    "defeat": {
      1: "Das wird dich wirklich schockieren und in Ehrfurcht versetzen."
    }
  },
  "lucian": {
    "encounter": {
      1: `Einen Moment, bitte. Das Buch, das ich lese, hat fast seinen spannenden Höhepunkt erreicht...
                $Der Held hat ein mystisches Schwert erlangt und steht vor seiner letzten Prüfung... Ah, egal.
                $Da du es so weit geschafft hast, lege ich das beiseite und kämpfe gegen dich.
                $Lass mich sehen, ob du genauso viel Ruhm erlangen wirst wie der Held meines Buches!`,
    },
    "victory": {
      1: "Ich sehe... Es scheint, als hättest du mich schachmatt gesetzt."
    },
    "defeat": {
      1: "Ich habe einen Ruf zu wahren."
    }
  },
  "drasna": {
    "encounter": {
      1: `Du musst ein starker Trainer sein. Ja, ganz stark...
         $Das sind wunderbare Neuigkeiten! Gegen Gegner wie dich und dein Team zu kämpfen,
         $lässt meine Pokémon wie Unkraut wachsen!`
    },
    "victory": {
      1: "Oh, meine Güte. Das war wirklich ein schneller Kampf... Ich hoffe, du kommst bald wieder!"
    },
    "defeat": {
      1: "Wie kann das sein?"
    }
  },
  "kahili": {
    "encounter": {
      1: "Also, da bist du… Warum sehen wir nicht, wen die Winde heute begünstigen, dich… oder mich?"
    },
    "victory": {
      1: "Es frustriert mich als Mitglied der Top Vier, aber es scheint, dass deine Stärke echt ist."
    },
    "defeat": {
      1: "Das war ein Ass!"
    }
  },
  "hassel": {
    "encounter": {
      1: `Bereite dich darauf vor, aus erster Hand zu erfahren,
          $wie sich der feurige Atem eines erbitterten Kampfes anfühlt!`
    },
    "victory": {
      1: `Das Glück hat mir dieses Mal gelächelt, aber...
          $Angesichts des Verlaufs des Kampfes, wer weiß, ob ich das nächste Mal so viel Glück haben werde.`,
    },
    "defeat": {
      1: "Das war ein Ass!"
    }
  },
  "blue": {
    "encounter": {
      1: "Du musst ziemlich gut sein, um so weit zu kommen."
    },
    "victory": {
      1: "Ich habe nur gegen ihn und jetzt gegen dich verloren… Ihn? Haha..."
    },
    "defeat": {
      1: "Siehst du? Meine Stärke hat mich hierher gebracht."
    }
  },
  "piers": {
    "encounter": {
      1: "Mach dich bereit für einen Moshpit mit mir und meiner Truppe! Spikeford, es ist Zeit zu rocken!"
    },
    "victory": {
      1: "Ich und mein Team haben unser Bestes gegeben. Lass uns irgendwann wieder zu einem Kampf treffen..."
    },
    "defeat": {
      1: "Meine Kehle ist heiser vom Schreien... Aber das war ein aufregender Kampf!"
    }
  },
  "red": {
    "encounter": {
      1: "…!"
    },
    "victory": {
      1: "…?"
    },
    "defeat": {
      1: "…!"
    }
  },
  "jasmine": {
    "encounter": {
      1: "Oh... Deine Pokémon sind beeindruckend. Ich denke, ich werde das genießen."
    },
    "victory": {
      1: "Du bist wirklich stark. Ich muss mich auch viel mehr anstrengen."
    },
    "defeat": {
      1: "Ich habe nie erwartet zu gewinnen."
    }
  },
  "lance_champion": {
    "encounter": {
      1: "Ich bin immer noch der Champion. Ich werde nichts zurückhalten."
    },
    "victory": {
      1: "Dies ist das Aufkommen eines neuen Champions."
    },
    "defeat": {
      1: "Ich habe meinen Titel erfolgreich verteidigt."
    }
  },
  "steven": {
    "encounter": {
      1: `Erzähl mir... Was hast du auf deiner Reise mit deinen Pokémon gesehen?
                $Was hast du gefühlt, als du so viele andere Trainer getroffen hast?
                $Durch dieses reiche Land zu reisen... Hat es etwas in dir geweckt?
                $Ich möchte, dass du mir alles zeigst, was du gelernt hast.
                $Meine Pokémon und ich werden dir im Gegenzug mit allem antworten, was wir wissen!`,
    },
    "victory": {
      1: "Also falle ich, der Champion, in der Niederlage..."
    },
    "defeat": {
      1: "Das war gut verbrachte Zeit! Danke!"
    }
  },
  "cynthia": {
    "encounter": {
      1: "Ich, Cynthia, akzeptiere deine Herausforderung! Es wird keine Pause von mir geben!"
    },
    "victory": {
      1: "Egal wie viel Spaß der Kampf macht, er wird irgendwann enden..."
    },
    "defeat": {
      1: "Selbst wenn du verlierst, verliere niemals deine Liebe zu Pokémon."
    }
  },
  "iris": {
    "encounter": {
      1: `Weißt du was? Ich freue mich wirklich darauf, ernsthafte Kämpfe mit starken Trainern zu führen!
         $Ich meine, komm schon! Die Trainer, die es hierher schaffen, sind Trainer,
         $die den Sieg mit jeder Faser ihres Seins anstreben!
         $Und sie kämpfen Seite an Seite mit Pokémon, die unzählige schwierige Kämpfe durchgemacht haben!
         $Wenn ich mit solchen Leuten kämpfe, werde nicht nur ich stärker, sondern auch meine Pokémon!
         $Und wir werden uns noch besser kennenlernen! OK! Mach dich bereit!
         $Ich bin Iris, die Champion der Pokémon-Liga, und ich werde dich besiegen!`,
    },
    "victory": {
      1: "Aghhhh... Ich habe mein Bestes gegeben, aber wir haben verloren..."
    },
    "defeat": {
      1: "Juhu! Wir haben gewonnen!"
    }
  },
  "hau": {
    "encounter": {
      1: `Ich frage mich, ob ein Trainer anders kämpft,
         $je nachdem, ob er aus einer warmen oder einer kalten Region stammt.
         $Lass es uns testen!`,
    },
    "victory": {
      1: "Das war großartig! Ich denke, ich verstehe dein Vibe jetzt ein bisschen besser!"
    },
    "defeat": {
      1: "Ma-an, das war eine Art Kampf!"
    }
  },
  "geeta": {
    "encounter": {
      1: `Ich habe mich entschieden, erneut meinen Hut in den Ring zu werfen.
                $Komm jetzt... Zeig mir die Früchte deines Trainings.`,
      "victory": {
        1: "Ich freue mich auf Neuigkeiten über all deine Erfolge!"
      },
      "defeat": {
        1: "Was ist los? Das ist doch nicht alles, oder?"
      }
    },
  },
  "nemona": {
    "encounter": {
      1: "Yesss! Ich bin so aufgeregt! Zeit, dass wir uns austoben!"
    },
    "victory": {
      1: "Na gut, das ist ärgerlich, aber ich hatte trotzdem Spaß! Ich werde dich nächstes Mal erwischen!"
    },
    "defeat": {
      1: "Das war ein großartiger Kampf! Definitiv fruchtbar."
    }
  },
  "leon": {
    "encounter": {
      1: "Wir werden eine absolut großartige Zeit haben!"
    },
    "victory": {
      1: `Meine Zeit als Champion ist vorbei...
                $Aber was für eine großartige Zeit war das!
                $Danke für den großartigsten Kampf, den ich je hatte!`,
    },
    "defeat": {
      1: "Das war eine absolut großartige Zeit!"
    }
  },
  "whitney": {
    "encounter": {
      1: "Hey! Findest du nicht auch, dass Pokémon total süß sind?"
    },
    "victory": {
      1: "Waaah! Waaah! Du bist so gemein!"
    },
    "defeat": {
      1: "Und das war's!"
    }
  },
  "chuck": {
    "encounter": {
      1: "Ha! Du willst mich herausfordern? Bist du mutig oder einfach nur unwissend?"
    },
    "victory": {
      1: "Du bist stark! Würdest du mich bitte zu deinem Schüler machen?"
    },
    "defeat": {
      1: "Da. Merkst du, wie viel mächtiger ich bin als du?"
    }
  },
  "katy": {
    "encounter": {
      1: "Lass deine Wachsamkeit nicht nach, es sei denn, du willst von den Füßen gerissen werden!"
    },
    "victory": {
      1: "Alle meine süßen kleinen Pokémon fielen wie Fliegen!"
    },
    "defeat": {
      1: "Iss auf, mein süßes kleines Vivillon!"
    }
  },
  "pryce": {
    "encounter": {
      1: "Jugend allein garantiert keinen Sieg! Erfahrung ist, was zählt."
    },
    "victory": {
      1: "Hervorragend! Das war perfekt. Versuche nicht zu vergessen, was du jetzt fühlst."
    },
    "defeat": {
      1: "Genau wie ich es mir vorgestellt habe."
    }
  },
  "clair": {
    "encounter": {
      1: "Weißt du, wer ich bin? Und du wagst es trotzdem, mich herauszufordern?"
    },
    "victory": {
      1: "Ich frage mich, wie weit du mit deinem Können kommen wirst. Das sollte faszinierend sein."
    },
    "defeat": {
      1: "Das war's."
    }
  },
  "maylene": {
    "encounter": {
      1: `Ich bin gekommen, um dich jetzt herauszufordern, und ich werde nichts zurückhalten.
                    $Bitte bereite dich auf den Kampf vor!`,
    },
    "victory": {
      1: "Ich gestehe die Niederlage ein..."
    },
    "defeat": {
      1: "Das war großartig."
    }
  },
  "fantina": {
    "encounter": {
      1: `Du wirst mich herausfordern, ja? Aber ich werde gewinnen.
                    $Das tut der Arenaleiter von Herzhofen, non?`,
    },
    "victory": {
      1: "Du bist so fantastisch stark. Ich weiß, warum ich verloren habe."
    },
    "defeat": {
      1: "Ich bin so, so, sehr glücklich!"
    }
  },
  "byron": {
    "encounter": {
      1: `Trainer! Du bist jung, genau wie mein Sohn, Veit. 
                    $Mit mehr jungen Trainern, die das Kommando übernehmen, ist die Zukunft der Pokémon hell! 
                    $Also, als Hürde für junge Leute nehme ich deine Herausforderung an!`,
    },
    "victory": {
      1: "Hmm! Meine robusten Pokémon - besiegt!"
    },
    "defeat": {
      1: "Gwahahaha! Wie waren meine robusten Pokémon?!"
    }
  },
  "olympia": {
    "encounter": {
      1: "Ein alter Brauch entscheidet über das Schicksal. Der Kampf beginnt!"
    },
    "victory": {
      1: "Schaffe deinen eigenen Weg. Lass dir nichts in den Weg stellen. Dein Schicksal, deine Zukunft."
    },
    "defeat": {
      1: "Unser Weg ist jetzt klar."
    }
  },
  "volkner": {
    "encounter": {
      1: `Da du so weit gekommen bist, musst du ziemlich stark sein…
                    $Ich hoffe, du bist der Trainer, der mich daran erinnert, wie viel Spaß es macht zu kämpfen!`,
    },
    "victory": {
      1: `Du hast mich besiegt…
                    $Dein Verlangen und die edle Art, wie deine Pokémon für dich gekämpft haben…
                    $Ich habe mich sogar während unseres Kampfes begeistert gefühlt. Das war ein sehr guter Kampf.`,
    },
    "defeat": {
      1: `Es war überhaupt nicht schockierend…
                    $Das ist nicht das, was ich wollte!`,
    }
  },
  "burgh": {
    "encounter": {
      1: `M'hm… Wenn ich diesen Kampf gewinne, habe ich das Gefühl,
         $dass ich ein Bild malen kann, das es so noch nie gegeben hat. 
         $OK! Ich höre meine Kampf-Muse laut und deutlich. Lass uns gleich loslegen!`,
      2: `Natürlich bin ich wirklich stolz auf all meine Pokémon! 
                    $Nun, dann... Lass uns gleich loslegen!`
    },
    "victory": {
      1: "Ist es vorbei? Hat mich meine Muse verlassen?",
      2: "Hmm… Es ist vorbei! Du bist unglaublich!"
    },
    "defeat": {
      1: "Wow… Irgendwie ist es doch schön, nicht wahr?",
      2: `Manchmal höre ich Leute sagen, es war ein hässlicher Sieg. 
                    $Ich denke, wenn du dein Bestes gibst, ist jeder Sieg schön.`
    }
  },
  "elesa": {
    "encounter": {
      1: `C'est fini! Wenn ich mir dessen sicher bin,
         $fühle ich einen elektrischen Stoß durch meinen Körper laufen!
         $Ich möchte dieses Gefühl erleben, also werden meine geliebten Pokémon
         $jetzt deinen Kopf zum Drehen bringen!`,
    },
    "victory": {
      1: "Ich wollte deinen Kopf zum Drehen bringen, aber du hast mich schockiert."
    },
    "defeat": {
      1: "Das war irgendwie unbefriedigend… Wirst du nächstes Mal alles geben?"
    }
  },
  "skyla": {
    "encounter": {
      1: `Es ist endlich Zeit für ein Duell! Das bedeutet den Pokémon-Kampf,
          $der entscheidet, wer an der Spitze steht, richtig? 
          $Ich liebe es, auf dem Gipfel zu stehen! Weil man von hohen Orten aus für immer und ewig sehen kann! 
          $Also, wie wäre es, wenn wir beide Spaß haben?`,
    },
    "victory": {
      1: "Dein Gegner im Kampf zu sein, ist eine neue Kraftquelle für mich. Danke!"
    },
    "defeat": {
      1: "Gewinnen oder verlieren, man lernt immer etwas aus einem Kampf, richtig?"
    }
  },
  "brycen": {
    "encounter": {
      1: `Es gibt auch Stärke darin, mit anderen Menschen und Pokémon zusammen zu sein. 
                    $Ihre Unterstützung zu erhalten, macht dich stärker. Ich werde dir diese Kraft zeigen!`,
    },
    "victory": {
      1: "Die wunderbare Kombination aus dir und deinen Pokémon! Was für eine schöne Freundschaft!"
    },
    "defeat": {
      1: "Extreme Bedingungen testen und trainieren dich wirklich!"
    }
  },
  "drayden": {
    "encounter": {
      1: `Was ich finden möchte, ist ein junger Trainer, der mir eine helle Zukunft zeigen kann. 
         $Lass uns mit allem kämpfen, was wir haben: dein Können, meine Erfahrung und die Liebe,
         $mit der wir unsere Pokémon großgezogen haben!`,
    },
    "victory": {
      1: `Dieses intensive Gefühl, das mich nach einer Niederlage überkommt…
          $Ich weiß nicht, wie ich es beschreiben soll.`,
    },
    "defeat": {
      1: "Harrumph! Ich weiß, dass deine Fähigkeit größer ist als das!"
    }
  },
  "grant": {
    "encounter": {
      1: `Es gibt nur eine Sache, die ich mir wünsche. 
                    $Dass wir, indem wir einander übertreffen, einen Weg zu noch größeren Höhen finden.`,
    },
    "victory": {
      1: "Du bist eine Mauer, die ich nicht überwinden kann!"
    },
    "defeat": {
      1: `Gib nicht auf.
                    $Das ist wirklich alles, was es dazu gibt.
                    $Die wichtigsten Lektionen im Leben sind einfach.`,
    }
  },
  "korrina": {
    "encounter": {
      1: "Zeit für Lady Connies großen Auftritt!"
    },
    "victory": {
      1: "Es ist dein Wesen, das es deinen Pokémon ermöglicht, sich zu entwickeln!"
    },
    "defeat": {
      1: "Was für ein explosiver Kampf!"
    }
  },
  "clemont": {
    "encounter": {
      1: "Oh! Ich bin froh, dass wir uns getroffen haben!"
    },
    "victory": {
      1: "Deine Leidenschaft für den Kampf inspiriert mich!"
    },
    "defeat": {
      1: "Es sieht so aus, als würde meine Trainer-Wachstumsmaschine, Mach 2, wirklich funktionieren!"
    }
  },
  "valerie": {
    "encounter": {
      1: `Oh, wenn das nicht ein junger Trainer ist… Es ist schön, dich so zu treffen. 
         $Dann nehme ich an, du hast dir das Recht auf einen Kampf verdient, als Belohnung für deine Bemühungen. 
         $Die schwer fassbare Fee mag zart wie eine Brise und empfindlich wie eine Blüte erscheinen,
         $aber sie ist stark.`,
    },
    "victory": {
      1: "Ich hoffe, dass du morgen Dinge finden wirst, über die du lächeln kannst…"
    },
    "defeat": {
      1: "Oh mein Gott, wie schade…"
    }
  },
  "wulfric": {
    "encounter": {
      1: `Weißt du was? Wir reden alle groß über das, was man vom Kämpfen und von Bindungen lernt und all das…
                    $Aber eigentlich mache ich es nur, weil es Spaß macht. 
                    $Wen kümmert das Prahlen? Lass uns kämpfen!`,
    },
    "victory": {
      1: "Hervorragend! Ich bin so hart wie ein Eisberg, aber du hast mich komplett durchschlagen!"
    },
    "defeat": {
      1: "Kämpfe mit mir, und das passiert!"
    }
  },
  "kabu": {
    "encounter": {
      1: `Jeder Trainer und jedes Pokémon trainiert hart, um den Sieg zu erringen. 
         $Aber das bedeutet, dass auch dein Gegner hart arbeitet, um zu gewinnen. 
         $Am Ende wird das Match von der Seite entschieden, die ihr wahres Potenzial entfesseln kann.`,
    },
    "victory": {
      1: "Ich bin froh, dass ich heute gegen dich kämpfen konnte!"
    },
    "defeat": {
      1: "Das ist eine großartige Möglichkeit für mich, mein eigenes Wachstum zu spüren!"
    }
  },
  "bea": {
    "encounter": {
      1: `Hast du einen unerschütterlichen Geist, der sich nicht bewegt, egal wie du angegriffen wirst? 
                    $Ich denke, ich werde das einfach mal testen, oder?`,
    },
    "victory": {
      1: "Ich habe den Kampfgeist deiner Pokémon gespürt, als du sie in den Kampf geführt hast."
    },
    "defeat": {
      1: "Das war die beste Art von Match, die man sich je wünschen kann."
    }
  },
  "opal": {
    "encounter": {
      1: "Lass mich sehen, wie du und dein Partner-Pokémon euch verhalten!"
    },
    "victory": {
      1: "Dein Rosa fehlt noch, aber du bist ein ausgezeichneter Trainer mit ausgezeichneten Pokémon."
    },
    "defeat": {
      1: "Schade für dich, denke ich."
    }
  },
  "bede": {
    "encounter": {
      1: "Ich nehme an, ich sollte zweifelsfrei beweisen, wie erbärmlich du bist und wie stark ich bin."
    },
    "victory": {
      1: "Ich verstehe... Nun, das ist in Ordnung. Ich habe mich sowieso nicht wirklich angestrengt."
    },
    "defeat": {
      1: "Nicht schlecht, muss ich sagen."
    }
  },
  "gordie": {
    "encounter": {
      1: "Also, lass uns das hinter uns bringen."
    },
    "victory": {
      1: "Ich möchte einfach in ein Loch kriechen... Nun, ich denke, es wäre eher wie ein Sturz von hier."
    },
    "defeat": {
      1: "Kämpfe wie immer, der Sieg wird folgen!"
    }
  },
  "marnie": {
    "encounter": {
      1: `Die Wahrheit ist, am Ende des Tages... Ich möchte wirklich nur Champion für mich selbst werden!
                    $Also nimm es nicht persönlich, wenn ich dir den Hintern versohle!`
    },
    "victory": {
      1: "OK, ich habe verloren... Aber ich habe viele gute Seiten von dir und deinen Pokémon gesehen!"
    },
    "defeat": {
      1: "Ich hoffe, du hast unsere Kampfstrategien genossen."
    }
  },
  "raihan": {
    "encounter": {
      1: `Ich werde den Champion besiegen, das ganze Turnier gewinnen und der Welt beweisen,
          $wie stark der großartige Roy wirklich ist!`
    },
    "victory": {
      1: `Ich sehe sogar gut aus, wenn ich verliere.
                    $Es ist ein echter Fluch.
                    $Ich denke, es ist Zeit für ein weiteres Selfie!`
    },
    "defeat": {
      1: "Lass uns ein Selfie zur Erinnerung machen."
    }
  },
  "brassius": {
    "encounter": {
      1: "Ich nehme an, du bist bereit? Lassen wir unser gemeinsames Kunstwerk beginnen!"
    },
    "victory": {
      1: "Ahhh... avant-garde!"
    },
    "defeat": {
      1: "Ich werde sofort mit einem neuen Stück beginnen!"
    }
  },
  "iono": {
    "encounter": {
      1: `Hey, Leute! Es ist Zeit für Enigmaras EnigmaTV!!! Naaaa, alles klärchen?
         $Hola, ciao und hallöle! Und schon bist du gefangen in meinem Elektronetz!
         $Wer ich bin, fragst du? Na, Enigmara natürlich! Ich bin hier die Arenaleiterin.`,
    },
    "victory": {
      1: "Du leuchtest ja so hell wie ein tausendfacher Donnerblitz!"
    },
    "defeat": {
      1: "Deine Augen gehören MIR!"
    }
  },
  "larry": {
    "encounter": {
      1: "Wenn alles gesagt und getan ist, ist Einfachheit am stärksten."
    },
    "victory": {
      1: "Eine Portion Niederlage, hm?"
    },
    "defeat": {
      1: "Ich mache Schluss für heute."
    }
  },
  "ryme": {
    "encounter": {
      1: "Komm schon, Baby! Bring mich zum Zittern bis auf die Knochen!"
    },
    "victory": {
      1: "Du bist cool, mein Freund - du bewegst meine SEELE!"
    },
    "defeat": {
      1: "Bis später, Baby!"
    }
  },
  "grusha": {
    "encounter": {
      1: "Alles, was ich tun muss, ist sicherzustellen, dass die Kraft meiner Pokémon dich bis auf die Knochen kühlt!"
    },
    "victory": {
      1: "Deine brennende Leidenschaft... Ich mag sie ehrlich gesagt irgendwie."
    },
    "defeat": {
      1: "Es hat nicht für dich gereicht."
    }
  },
  "marnie_elite": {
    "encounter": {
      1: "Du hast es so weit geschafft, hm? Mal sehen, ob du mit meinen Pokémon umgehen kannst!",
      2: "Ich werde mein Bestes geben, aber denke nicht, dass ich es dir leicht machen werde!"
    },
    "victory": {
      1: "Ich kann nicht glauben, dass ich verloren habe... Aber du hast den Sieg verdient. Gut gemacht!",
      2: "Es sieht so aus, als hätte ich noch viel zu lernen. Toller Kampf trotzdem!"
    },
    "defeat": {
      1: "Du hast gut gekämpft, aber ich habe den Vorteil! Viel Glück beim nächsten Mal!",
      2: "Es scheint, als hätte sich mein Training ausgezahlt. Danke für den Kampf!"
    }
  },
  "nessa_elite": {
    "encounter": {
      1: "Die Gezeiten wenden sich zu meinen Gunsten. Bereit, weggespült zu werden?",
      2: "Lass uns mit diesem Kampf Wellen schlagen! Ich hoffe, du bist vorbereitet!"
    },
    "victory": {
      1: "Du hast diese Gewässer perfekt navigiert... Gut gemacht!",
      2: "Es sieht so aus, als wären meine Strömungen kein Match für dich. Tolle Arbeit!"
    },
    "defeat": {
      1: "Wasser findet immer einen Weg. Das war ein erfrischender Kampf!",
      2: "Du hast gut gekämpft, aber die Macht des Ozeans ist unaufhaltsam!"
    }
  },
  "bea_elite": {
    "encounter": {
      1: "Bereite dich vor! Mein Kampfgeist brennt hell!",
      2: "Mal sehen, ob du mit meinem unaufhaltsamen Tempo mithalten kannst!"
    },
    "victory": {
      1: "Deine Stärke... Sie ist beeindruckend. Du hast diesen Sieg wirklich verdient.",
      2: "Ich habe diese Intensität noch nie zuvor gespürt. Unglaubliche Leistung!"
    },
    "defeat": {
      1: "Ein weiterer Sieg für mein intensives Trainingsprogramm! Gut gemacht!",
      2: "Du hast Stärke, aber ich habe härter trainiert. Toller Kampf!"
    }
  },
  "allister_elite": {
    "encounter": {
      1: "Die Schatten fallen... Bist du bereit, dich deinen Ängsten zu stellen?",
      2: "Mal sehen, ob du mit der Dunkelheit, die ich befehle, umgehen kannst."
    },
    "victory": {
      1: "Du hast die Schatten vertrieben... Für jetzt. Gut gemacht.",
      2: "Dein Licht hat meine Dunkelheit durchdrungen. Tolle Leistung."
    },
    "defeat": {
      1: "Die Schatten haben gesprochen... Deine Stärke reicht nicht aus.",
      2: "Die Dunkelheit triumphiert... Vielleicht wirst du nächstes Mal das Licht sehen."
    }
  },
  "raihan_elite": {
    "encounter": {
      1: "Ein Sturm zieht auf! Mal sehen, ob du diesen Kampf überstehst!",
      2: "Mach dich bereit, dem Auge des Sturms zu begegnen!"
    },
    "victory": {
      1: "Du hast den Sturm bezwungen... Unglaubliche Leistung!",
      2: "Du hast die Winde perfekt geritten... Toller Kampf!"
    },
    "defeat": {
      1: "Ein weiterer Sturm überstanden, ein weiterer Sieg errungen! Gut gekämpft!",
      2: "Du bist in meinen Sturm geraten! Viel Glück beim nächsten Mal!"
    }
  },

  "rival": {
    "encounter": {
      1: `@c{smile}Hey, ich habe dich gesucht! Ich weiß, dass du es nicht erwarten konntest loszugehen,
                    $aber hättest ja wenigstens Tschüss sagen können...
                    $@c{smile_eclosed}Du verfolgst also wirklich deinen Traum?\nIch kann es kaum glauben.
                    $@c{serious_smile_fists}Da wir schon einmal hier sind, wie wäre es mit einem Kampf?\nImmerhin muss ich doch sicherstellen, dass du bereit bist.
                    $@c{serious_mopen_fists}Halte dich nicht zurück, zeig mir alles was du hast!`
    },
    "victory": {
      1: `@c{shock}Wow…Du hast mich komplett überrumpelt.\nBist du wirklich ein Anfänger?
                   $@c{smile}Vielleicht war es einfach etwas Glück, aber…\nWer weiß, vielleicht schaffst du es irgendwann
                   $ja wirklich ganz groß raus zu kommen.
                   $Übrigens, der Professor hat mich gebeten dir diese Items zu geben. Die sehen wirklich cool aus.
                   $@c{serious_smile_fists}Viel Glück da draußen!`
    },
  },
  "rival_female": {
    "encounter": {
      1: `@c{smile_wave}Da bist du! Ich habe schon überall nach dir gesucht!\n@c{angry_mopen}Hast du etwas vergessen
                    $deiner besten Freundin Tschüss zu sagen?
                    $@c{smile_ehalf}Du folgst deinem Traum, oder?\nDas ist wirklich heute…
                    $@c{smile}Naja, ich vergeben dir, dass du mich vergessen hast, aber nur unter einer Bedingung. @c{smile_wave_wink}Du musst gegen mich kämpfen!
                    $@c{angry_mopen}Gib alles! Wir wollen doch nicht, dass dein Abenteuer endet bevor es begonnen hat, richtig?`
    },
    "victory": {
      1: `@c{shock}Du hast gerade erst angefangen und bist schon so stark?!@d{96} @c{angry}Du hast sowas von betrogen, oder?
                    $@c{smile_wave_wink}Ich mach nur Spaß!@d{64} @c{smile_eclosed}Ich habe ehrlich verloren… Ich habe das Gefühl, dass du es dort draußen weit bringen wirst.
                    $@c{smile}Übrigens, der Professor hat mich gebeten dir diese Items zu geben. Ich hoffe sie sind hilfreich!
                    $@c{smile_wave}Gib wie immer dein Bestes! Ich glaube an dich!`
    },
  },
  "rival_2": {
    "encounter": {
      1: `@c{smile}Hey, du auch hier?\n@c{smile_eclosed}Immernoch ungeschlagen, hmm…?
                $@c{serious_mopen_fists}Ich weiß es sieht so aus, als wäre ich dir hierher gefolgt, aber das ist so nicht ganz richtig.
                $@c{serious_smile_fists}Ehrlicherweise kann ich es, seit du mich damals besiegt hast, garnicht erwarten erneut gegen dich zu kämpfen.
                $Ich habe selbst hart traniert. Ich werde dir diesesmal also ein würdigerer Gegner sein!.
                $@c{serious_mopen_fists}Halt dich nicht zurück, genauso wie beim letzten Mal!\nLos gehts!`
    },
    "victory": {
      1: `@c{neutral_eclosed}Oh. Ich war also zu sehr von mir überzeugt.
                $@c{smile}Das ist Ok. Ich hatte mir schon gedacht, dass sowas passiert.\n
                $@c{serious_mopen_fists}Es bedeutet einfach, dass ich mich beim nächsten Mal mehr anstrengen muss!\n
                $@c{smile}Nicht, dass du wirklich Hilfe benötigen würdest, aber ich habe hier noch eins von diesen Dingern herumliegen.
                $Du kannst es haben.\n
                $@c{serious_smile_fists}Erwarte aber nicht, dass ich dir noch mehr gebe!\nIch kann meinen Rivalen doch keine Vorteile verschaffen.
                $@c{smile}Egal, pass auf dich auf!`
    },
  },
  "rival_2_female": {
    "encounter": {
      1: `@c{smile_wave}Oh, wie schön dich hier zu trefen. Sieht so aus als wärst du noch ungeschlagen. @c{angry_mopen}Hmm… Nicht schlecht!
                $@c{angry_mopen}Ich weiß was du denkst, und nein, ich habe dich nicht verfolgt. @c{smile_eclosed}Ich bin einfach in der Gegend gewesen.
                $@c{smile_ehalf}Ich freu mich für dich, aber ich muss dich wissen lassen, dass es auch Ok ist ab und zu mal zu verlieren.
                $@c{smile}Wir lernen oft mehr aus unseren Fehlern, als aus unseren Erfolgen.
                $@c{angry_mopen}Auf jeden Fall habe ich für unseren Rückkampf hart traniert. Also zeig mir was du drauf hast!`
    },
    "victory": {
      1: `@c{neutral}Ich… sollte dieses Mal doch nicht verlieren…
                $@c{smile}Na gut. Das bedeutet ich muss noch härter tranieren!
                $@c{smile_wave}Ich habe noch eins von diesen Dingern!\n@c{smile_wave_wink}Kein Grund mir zu danken~.
                $@c{angry_mopen}Das ist aber das Letzte! Du bekommst ab jett keine Geschenke mehr von mir!
                $@c{smile_wave}Bleib stark!`
    },
    "defeat": {
      1: "Es ist Ok manchmal zu verlieren…"
    }
  },
  "rival_3": {
    "encounter": {
      1: `@c{smile}Hey, schau mal wen wir hier haben! Ist schon eine Weile her.\n@c{neutral}Du bist… immernoch ungeschlagen?
                $@c{neutral_eclosed}Die Dinge waren irgendwie... seltsam.\nEs ist Zuhause einfach nicht das Gleiche ohne dich.
                $@c{serious}Ich weiß es ist selbstsüchtig, aber ich musste das einfach mal loswerden.
                $@c{neutral_eclosed}Denkst du nicht, dass du dich etwas übernommen hast?
                $@c{serious}Es ist nicht realistisch immer zu gewinnen\nWir müssen manchmal verlieren. Um daran zu wachsen.
                $@c{neutral_eclosed}Du hattest einen guten Lauf, aber es liegt noch so viel vor dir. Es wird nicht gerade einfacher. @c{neutral}Bist du bereit dafür?
                $@c{serious_mopen_fists}Falls ja, beweise es mir!`
    },
    "victory": {
      1: `@c{angry_mhalf}Das ist doch Schwachsinn… Ich habe kaum aufgehört zu tranieren…
          $Warum bin ich immernoch so viel schwächer?`
    },
  },
  "rival_3_female": {
    "encounter": {
      1: `@c{smile_wave}Lange nicht gesehen! Immernoch nicht verloren?\n@c{angry}Du fängst mich an zu nerven. @c{smile_wave_wink}Ich mach nur Spaß!
                $@c{smile_ehalf}Aber ehrlich, vermisst du dein Zuhause garnicht? Oder mich?
                $Ich… Ich meine, wir vermissen dich wirklich.
                $@c{smile_eclosed}Ich unterstütze dich bei deinem Traum, aber die Realität ist, du wirst früher oder später verlieren.
                $@c{smile}Und ich bin für dich da falls du es tust, wie immer.\n@c{angry_mopen}Also, zeig mir wie stark du geworden bist!`
    },
    "victory": {
      1: `@c{shock}Nach allem was ich getan habe… war es immernoch nicht genug…?
          $Wenn es so weiter geht hole ich nie auf…`

    },
    "defeat": {
      1: "Du hast dein Bestes gegeben. Lass uns nach Hause gehen."
    }
  },
  "rival_4": {
    "encounter": {
      1: `@c{neutral}Hey.
                $Ich werde jetzt keine Gefälligkeiten mit dir austauschen.\n@c{neutral_eclosed}Ich bin hier um zu gewinnen. Mehr nicht.
                $@c{serious_mhalf_fists}Durch mein Traning habe ich gelernt mein Potenzial zu maximieren.
                $@c{smile}Man hat deutlich mehr Zeit, wenn man auf Schlaf und unnötige soziale Interaktionen verzichtet. 
                $@c{serious_mopen_fists}Das ist alles nicht mehr wichtig, nicht solange ich nicht gewonnen habe.
                $@c{neutral_eclosed}Ich bin an dem Punkt an dem ich nicht mehr verliere.\n@c{smile_eclosed}Ich schätze deine Einstellung war doch nicht so falsch.
                $@c{angry_mhalf}Nur die Schwachen verlieren, und ich bin nicht mehr schwach.
                $@c{serious_mopen_fists}Bereite dich vor zu verlieren.`
    },
    "victory": {
      1: "@c{neutral}Was…@d{64} Was bist du?"
    },
  },
  "rival_4_female": {
    "encounter": {
      1: `@c{neutral}Ich bins! Du hast mich doch nicht vergessen, oder?
                $@c{smile}Du solltest stolz auf dich sein. Du hast es soweit gebracht. Glückwunsch!
                $Aber hier endet deine Reise jetzt.
                $@c{smile_eclosed}Du hast etwas in mir erwachen lassen, etwas von dem ich nicht wusste, dass es da war.
                $Alles was ich jetzt mache ist tranieren. @c{smile_ehalf}Ich esse oder schlafe kaum. 
                $Ich traniere meine Pokémon den ganzen Tag. Und werde immer stärker.
                $@c{neutral}Genau genommen, erkenne ich mich garnicht wieder.
                $Und jetzt habe ich endlich meinen Höhepunkt erreicht.\nNiemand kann mich jetzt noch schlagen.
                $Und weißt du was? Das ist alles wegen dir.\n@c{smile_ehalf}Ich weiß nicht ob ich dir danken, oder dich hassen soll!
                $@c{angry_mopen}Mach dich bereit!`
    },
    "victory": {
      1: "@c{neutral}Was…@d{64} Was bist du?"

    },
    "defeat": {
      1: "$@c{smile}Du solltest stolz darauf sein wie weit du es geschafft hast."
    }
  },
  "rival_5": {
    "encounter": {
      1: "@c{neutral}…"
    },
    "victory": {
      1: "@c{neutral}…"
    },
  },
  "rival_5_female": {
    "encounter": {
      1: "@c{neutral}…"
    },
    "victory": {
      1: "@c{neutral}…"

    },
    "defeat": {
      1: "$@c{smile_ehalf}…"
    }
  },
  "rival_6": {
    "encounter": {
      1: `@c{smile_eclosed}So sehen wir uns wieder.
                $@c{neutral}Ich hatte Zeit über alles nachzudenken.\nÜber den Grund, warum alles so merkwürdig erscheint.
                $@c{neutral_eclosed}Dein Traum, mein Antrieb dich besiegen zu wollen…\nEs ist alles Teil von etwas Größerem.
                $@c{serious}Es geht nicht um dich, oder mich… Es geht um diese Welt.\n@c{serious_mhalf_fists}Es ist mein Schicksal dich an deine Grenzen zu treiben.
                $@c{neutral_eclosed}Ob ich meine Aufgabe erfüllt habe kann ich nicht sagen, aber ich habe alles getan was ich konnte.
                $@c{neutral}Der Ort an dem wir uns befinden ist angsteinflößend… 
                $Trotzdem fühlt es sich so an, als würde mich das nicht stören, als wäre ich bereits schonmal hier gewesen.
                $@c{serious_mhalf_fists}Dir geht es doch genauso, oder?
                $@c{serious}…und irgendwas hier spricht zu mir.\nDas ist alles was die Welt seit langem kennt.
                $Die Zeiten die wir zusammen verbracht haben, die so nah erscheinen, sind nichts als eine ferne Erinnerung.
                $@c{neutral_eclosed}Wer weiß, ob sie jemals real waren?
                $@c{serious_mopen_fists}Du musst weiter gehen, denn wenn du es nicht tust, wird es nie enden. Du bist der Einzige, der das schaffen kann.
                $@c{serious_smile_fists}Ich… Ich weiß nicht was das alles bedeutet, aber ich fühle, dass es wahr ist.
                $@c{serious_mopen_fists}Wenn du mich nicht hier und jetzt besiegen kannst, hast du keine Chance.`
    },
    "victory": {
      1: `@c{smile_eclosed}Es sieht so aus, als wäre meine Arbeit getan.
                $Ich will dass du mir eine Sache versprichst.\n@c{smile}Komm bitte nach Hause nachdem du die Welt gerettet hast.`
    },
  },
  "rival_6_female": {
    "encounter": {
      1: `@c{smile_ehalf}Jetzt sind es wieder nur wir zwei.
                $@c{smile_eclosed}Weißt du, egal wie ich es drehe und wende…
                $@c{smile_ehalf}Irgendwas stört mich an der ganzen Sache, es erscheint mir irgendwie komisch…
                $@c{smile}Du hast deinen Traum, und ich habe diesen Antrieb…
                $Ich kann nicht anders, als zu glauben, dass es einen größeren Zweck gibt.
                $@c{smile_eclosed}Ich denke, ich sollte dich an deine Grenzen treiben.
                $@c{smile_ehalf}Ich bin mir nicht sicher, ob ich meine Aufgabe erfüllt habe, aber ich habe mein Bestes gegeben.
                $Irgendwas an diesem komischen und furchteinflößenden Ort… All das scheint so klar…
                $Es… ist alles was die Welt seit langem kennt.
                $@c{smile_eclosed}Es kommt mir so vor als könnte ich mich kaum an die Erinnerungen erinnern, die wir zusammen hatten.
                $@c{smile_ehalf}Waren sie jemals real? Sie scheinen so weit weg…
                $@c{angry_mopen}Du musst weiter gehen, denn wenn du es nicht tust, wird es nie enden. Du bist der Einzige, der das schaffen kann.
                $@c{smile_ehalf}Ich… Ich weiß nicht was das alles bedeutet, aber ich fühle, dass es wahr ist.
                $@c{neutral}Wenn du mich nicht hier und jetzt besiegen kannst, hast du keine Chance.`
    },
    "victory": {
      1: `@c{smile_ehalf}Ich… Ich denke ich habe meine Aufgabe erfüllt.
                $@c{smile_eclosed}Versprich mir… Nachdem du die Welt geheilt hast… Komm bitte sicher nach Hause. 
                $@c{smile_ehalf}…Danke.`

    },
  },
};

// Dialogue of the NPCs in the game when the player character is female. For languages that do not have gendered pronouns, this can be set to PGMdialogue.
export const PGFdialogue: SimpleTranslationEntries = PGMdialogue;

// Dialogue of the endboss of the game when the player character is male (Or unset)
export const PGMbattleSpecDialogue: SimpleTranslationEntries = {
  "encounter": `Es scheint, als wäre es wieder mal an der Zeit.\nDu weißt, warum du hierher kommen musst, oder?
	       $Dich hat es hierher gezogen, du warst bereits hier.\nUnzählige Male.
	       $Obwohl, vielleicht doch nicht unzählig.\nUm genau zu sein, dies ist der 5.643.853te Zyklus.
           $Du verlierst jeden Zyklus dein Gedächtnis. Trotzdem \nbleibt etwas, ein Teil deines ehemaligen Ichs, erhalten.
           $Bis jetzt hast du es noch nicht vollbracht zu siegen, aber dieses Mal spüre ich eine andere Präsenz in dir.\n
           $Du bist der Einzige hier, aber es kommt mir so vor als wäre da...jemand anderes.
           $Wirst du endlich beweisen, dass du ein würdiger Herausforder bist?\nDie Herausforderung auf die ich seit Jahrtausenden warte?
           $Lass uns beginnen.`,
  "firstStageWin": `Ahh verstehe. Diese Präsenz, die ich gespürt habe, ist wirklich real.\nEs scheint als müsste ich micht nicht länger zurück halten.
                    $Enttäusche mich nicht.`,
  "secondStageWin": "…Herrlich."
};

// Dialogue of the endboss of the game when the player character is female. For languages that do not have gendered pronouns, this can be set to PGMbattleSpecDialogue.
export const PGFbattleSpecDialogue: SimpleTranslationEntries = PGMbattleSpecDialogue;


// Dialogue that does not fit into any other category (e.g. tutorial messages, or the end of the game). For when the player character is male
export const PGMmiscDialogue: SimpleTranslationEntries = {
  "ending":
      `@c{smile}Oh? Du hast gewonnen?@d{96} @c{smile_eclosed}Ich schätze, das hätte ich wissen sollen.
        $Aber, du bist jetzt zurück.
        $@c{smile}Es ist vorbei.@d{64} Du hast die Schleife beendet.
        $@c{serious_smile_fists}Du hast auch deinen Traum erfüllt, nicht wahr?\nDu hast nicht einmal verloren.
        $@c{neutral}Ich bin der Einzige, der sich daran erinnern wird, was du getan hast.@d{96}
        $Ich schätze, das ist in Ordnung, oder?
        $@c{serious_smile_fists}Deine Legende wird immer in unseren Herzen weiterleben.
        $@c{smile_eclosed}Wie auch immer, ich habe genug von diesem Ort, oder nicht? Lass uns nach Hause gehen.
        $@c{serious_smile_fists}Vielleicht können wir, wenn wir zurück sind, noch einen Kampf haben?
        $Wenn du dazu bereit bist.`,
  "ending_female":
      `@c{shock}Du bist zurück?@d{32} Bedeutet das…@d{96} du hast gewonnen?!
       $@c{smile_ehalf}Ich hätte wissen sollen, dass du es in dir hast.
        $@c{smile_eclosed}Natürlich… ich hatte immer dieses Gefühl.
        $@c{smile}Es ist jetzt vorbei, richtig? Du hast die Schleife beendet.
        $@c{smile_ehalf}Du hast auch deinen Traum erfüllt, nicht wahr?
        $Du hast nicht einmal verloren.
        $Ich werde die Einzige sein, die sich daran erinnert, was du getan hast.
        $@c{angry_mopen}Ich werde versuchen, es nicht zu vergessen!
        $@c{smile_wave_wink}Nur ein Scherz!@d{64} @c{smile}Ich würde es nie vergessen.@d{32}
        $Deine Legende wird in unseren Herzen weiterleben.
        $@c{smile_wave}Wie auch immer,@d{64} es wird spät…@d{96} denke ich?\nEs ist schwer zu sagen an diesem Ort.
        $Lass uns nach Hause gehen. 
        $@c{smile_wave_wink}Vielleicht können wir morgen noch einen Kampf haben, der alten Zeiten willen?`,
};


// Dialogue that does not fit into any other category (e.g. tutorial messages, or the end of the game). For when the player character is female. For languages that do not have gendered pronouns, this can be set to PGMmiscDialogue.
export const PGFmiscDialogue: SimpleTranslationEntries = PGMmiscDialogue;


// Dialogue of the named double battles in the game. For when the player is male (or unset).
export const PGMdoubleBattleDialogue: DialogueTranslationEntries = {
  "blue_red_double": {
    "encounter": {
      1: `Blau: Hey Rot, lass uns ihnen zeigen, was wir drauf haben!
                  $Rot: ...
                  $Blau: Das ist die Macht von Alabastia!`,
    },
    "victory": {
      1: `Blau: Das war ein großartiger Kampf!
              $Rot: ...`,
    },
  },
  "red_blue_double": {
    "encounter": {
      1: `Rot: ...!
                  $Blau: Er redet nicht viel...
                    $Blau: Aber lass dich davon nicht täuschen! Er ist schließlich ein Champ!`,
    },
    "victory": {
      1: `Rot: ...!
                $Blau: Das nächste Mal gewinnen wir!`,
    },
  },
  "tate_liza_double": {
    "encounter": {
      1: `Ben: Hehehe...Bist du überrascht?
                  $Svenja: Wir sind zwei Arenaleiter auf einmal!
                  $Ben: Wir sind Zwillinge!
                  $Svenja: Wir müssen nicht reden um uns gegenseitig zu verstehen!
                  $Ben: Die doppelte Kraft...
                  $Svenja: Kannst du ihr standhalten?`,
    },
    "victory": {
      1: `Ben: Was? Unsere Kombination war perfekt!
                  $Svenja: Sieht so aus als müssten wir wohl mehr tranieren...`,
    },
  },
  "liza_tate_double": {
    "encounter": {
      1: `Svenja: Hihihi... Bist du überrascht?
                  $Ben: Ja, wir sind wirklich zwei Arenaleiter auf einmal!
                  $Svenja: Das ist mein Zwillingsbruder Ben!
                  $Ben: Und das meine Zwillingsschwester Svenja!
                  $Svenja: Wir sind die perfekte Kombo!`
    },
    "victory": {
      1: `Svenja: Sind wir...
                  $Ben: ...nicht so stark wie wir dachten?`,
    },
  },
  "wallace_steven_double": {
    "encounter": {
      1: `Troy: Wassili, lass uns ihnen die Kraft von Champions zeigen!
                  $Wassili: Wir zeigen dir die Kraft von Hoenn!
                  $Troy: Los gehts!`,
    },
    "victory": {
      1: `Troy: Das war ein großartiger Kampf!
                  $Wassili: Das nächste Mal gewinnen wir!`,
    },
  },
  "steven_wallace_double": {
    "encounter": {
      1: `Troy: Hast du irgendwelche seltenen Pokémon?
          $Wassili: Troy... Wir sind hier um zu kämpfen und nicht um mit unseren Pokémon zu prahlen...
            $Troy: Oh... Wenn das so ist... Lass uns anfangen!`,
    },
    "victory": {
      1: `Troy: Jetzt da wir mit Kämpfen fertig sind... Lass uns mit unsereren Pokémon prahlen!
            $Wassili: Troy...`,
    },
  },
  "alder_iris_double": {
    "encounter": {
      1: `Lauro: Wir sind die stärksten Trainer aus Einall!
                  $Lilia: Kämpfe gegen starke Trainer machen am meisten Spaß!`,
    },
    "victory": {
      1: `Lauro: Wow! Du bist super stark!
                  $Lilia: Beim nächsten Mal schlagen wir dich!`,
    },
  },
  "iris_alder_double": {
    "encounter": {
      1: `Lilia: Willkommen Herausforderer! Ich bin DER Champion von Einall!
                  $Lauro: Lilia, bist du nicht etwas zu aufgeregt?`,
    },
    "victory": {
      1: `Lilia: Eine solche Niederlage ist nicht einfach zu verkraften...
                  $Lauro: Aber wir wachsen an unseren Niederlagen und werden immer besser!`,
    },
  },
  "marnie_piers_double": {
    "encounter": {
      1: `Mary: Bruder, lass uns ihnen die Kraft von Spikeford zeigen!
                  $Nezz: Wir bringen die Dunkelheit!`,
    },
    "victory": {
      1: `Mary: Du hast Licht in unsere Dunkelheit gebracht!
                  $Piers: Es ist viel zu hell...`,
    },
  },
  "piers_marnie_double": {
    "encounter": {
      1: `Nezz: Bereit für ein Konzert?
                    $Mary: Bruder...Sie sind hier um zu kämpfen, nicht um zu singen...`,
    },
    "victory": {
      1: `Nezz: Das war mal ein großartiges Konzert!
                    $Marnie: Bruder...`,
    },
  },
};

// Dialogue of the named double battles in the game. For when the player is female. For languages that do not have gendered pronouns, this can be set to PGMdoubleBattleDialogue.
export const PGFdoubleBattleDialogue: DialogueTranslationEntries = PGMdoubleBattleDialogue;
