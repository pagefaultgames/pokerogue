import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const tutorial: SimpleTranslationEntries = {
    "intro": `Benvenuto in PokéRogue! Questo gioco è incentrato sulle lotte, con elementi roguelite.
    $PokéRogue non è monetizzato e non siamo proprietari di Pokemon e Assets presenti nel gioco.
    $Il gioco è totalmente funzionante ma in continuo aggiornamento.
    $Per riportare eventuali bugs è possibile discuterne sul nostro Discord.
    $Se il gioco risulta 'lento', assicurati di aver abilitato l'Accelerazione Hardware nelle impostazioni del tuo Browser`,
    
    "accessMenu": `Per accedere al menù, press M o Esc.\nDal menù puoi cambiare impostazioni, controllare la wiki e accedere a varie features.`,
    
    "menu": `Da questo menù puoi accedere alle impostazioni.
    $Qui puoi cambiare velocità di gioco, cornice e altre opzioni.
    $Ci sono varie funzionalità, controlla bene e non perderti nulla!`,

    "starterSelect": `Da questa schermata puoi selezionare il tuo starter, \nscegliendo tra quelli sbloccati.
    $Ogni starter ha un valore numerico. Puoi avere fino a \n6 Pokèmon, avendo a disposizione un massimo di 10 punti.
    $Puoi anche selezionare sesso, abilità e forma a seconda delle\nvarianti che hai catturato o schiuso.
    $Le IVs di una specie sono le migliori rispetto a tutte quelle \nche hai catturato o schiuso.
    $Prova a catturarne il piu possibile!`,

    "pokerus": `Ogni giorno ci saranno 3 Pokémon con Pokérus, \ndelineati da un bordo viola.
    $Se possiedi uno di questi starter, prova ad aggiungerlo \nal party. Ricorda di controllare le info!`,

    "statChange": `I cambiamenti alle statistiche persistono fintanto che i tuoi pokèmon resteranno in campo.
    $I tuoi pokemon verranno richiamati quando incontrerai un allenatore o al cambiamento di bioma.
    $Puoi anche vedere i cambiamenti alle statistiche in corso tenendo premuto C o Shift`,

    "selectItem": `Dopo ogni lotta puoi scegliere solo 1 oggetto tra 3 disponibili.
    $Sono presenti varie tipologie di strumento, i principali sono \nconsumabili, assegnabili o con effetto passivo permanente.
    $La maggior parte degli oggetti non consumabili possono essere accumulati.
    $Alcuni oggetti saranno disponibili nel momento che \npotranno essere utilizzati, ad esempio gli item evolutivi.
    $Puoi anche trasferire un oggetto assegnato attraverso l'opzione 'trasferisci strumento'.
    $L'opzione 'trasferisci strumento' sarà disponibile solo dopo aver assegnato uno strumento ad un Pokèmon.
    $Con le monete potrai acquistare dei consumabili, progredendo saranno poi disponibili ulteriori oggetti.
    $Assicurati di fare un acquisto prima di selezionare un oggetto, poichè passerai subito alla lotta successiva.`,

    "eggGacha": `Da questa schermata, puoi riscattare i tuoi vouchers \nin cambio di uova Pokèmon.
    $Le uova vanno schiuse e saranno sempre più vicine alla \nschiusura dopo ogni lotta. 
    $Le uova più rare impiegheranno più lotte per la schiusura.
    $I Pokémon schiusi non verranno aggiunti alla tua squadra\n ma saranno disponibili nei tuoi starters.
    $I Pokémon schiusi generalmente hanno IVs migliori rispetto ai\n Pokémon selvatici.
    $Alcuni Pokémon possono essere ottenuti solo tramite uova.
    $Ci sono 3 diversi macchinari con differenti\nbonus, scegli quello che preferisci!`,
} as const;