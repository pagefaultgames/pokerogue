import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const tutorial: SimpleTranslationEntries = {
  "intro": `Benvenuto in PokéRogue! Questo gioco si concentra sulle battaglie, con elementi roguelite.
    $Questo gioco non è monetizzato e non siamo proprietari di Pokemon e Assets presenti nel gioco.
    $Il gioco è work-in-progress ma giocabile al 100%.\nPer reportare eventuali bugs è possibile discuterne sul nostro Discord.
    $Se il game risulta 'lento', assicurati di aver abilitato l'Accelerazione Hardware nelle impostazioni del tuo Browser`,

  "accessMenu": "Per accedere al menù, press M o Esc.\nDal menù puoi cambiare impostazioni, controllare la wiki e accedere a varie features.",

  "menu": `Da questo menù puoi accedere alle impostazioni.
    $Dalle impostazioni puoi cambiare velocità di gioco, stile di finestra e altre opzioni.
    $Ci sono varie funzionalità, controlla bene e non perderti nulla!`,

  "starterSelect": `Da questa schermata puoi selezionare il tuo starter.\nQuesti sono i membri iniziali del tuo parti.
    $Ogni starter ha un valore. Puoi avere fino a \n6 Pokèmon, avendo a disposizione un massimo di 10 punti.
    $Puoi anche selezionare Sesso, Abilità, e Forma a seconda delle\nvarianti che hai catturato o schiuso.
    $Le IVs di una specie sono le migliori rispetto a tutte quelle che hai\ncatturato o schiuso, quindi prova a catturarne il piu possibile!`,

  "pokerus": `Giornalmente 3 Starter casuali disponibili avranno il bordo viola.
    $Se possiedi uno di questi starter,\nprova ad aggiungerlo al party. Ricorda di controllare le info!`,

  "statChange": `I cambiamenti alle statistiche persistono fintanto che i tuoi pokèmon resteranno in campo.
    $I tuoi pokemon verranno richiamati quando incontrerai un allenatore o al cambiamento di bioma.
    $Puoi anche vedere i cambiamenti alle statistiche in corso tenendo premuto C o Shift`,

  "selectItem": `Dopo ogni battaglia avrai disponibili tre item.\nPotrai prenderne solo uno.
    $Questi spaziano tra consumabili, item tenuti da Pokèmon o con un effetto passivo permanente.
    $La maggior parte degli Item non Consumabili possono stackare in diversi modi.
    $Alcuni Item risulteranno disponibili solo se possono essere usati, come Item Evolutivi.
    $Puoi anche passare un Item tenuto da un Pokèmon ad un altro attraverso l'opzione 'trasferisci strumento'.
    $L'opzione 'trasferisci strumento' sarà disponibile solo dopo aver assegnato uno strumento ad un Pokèmon.
    $Puoi acquistare consumabili con le monete, progredendo saranno poi disponibili ulteriori oggetti.
    $Assicurati di fare un acquisto prima di selezionare un item casuale, poichè passerai subito alla lotta successiva.`,

  "eggGacha": `Da questa schermata, puoi riscattare i tuoi vouchers in cambio di\nuova Pokèmon.
    $Le uova vanno schiuse e saranno sempre più vicine alla schiusura dopo\nogni battaglia. Le uova più rare impiegheranno più battaglie per la schiusura.
    $I Pokémon schiusi non verranno aggiunti alla tua squadra, saranno\naggiunti ai tuoi starters.
    $I Pokémon schiusi generalmente hanno IVs migliori rispetto ai\n Pokémon selvatici.
    $Alcuni Pokémon possono essere ottenuti solo tramite uova.
    $Ci sono 3 diversi macchinari con differenti\nbonus, scegli quello che preferisci!`,
} as const;
