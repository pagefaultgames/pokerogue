import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const tutorial: SimpleTranslationEntries = {
  "intro": `Benvenuto in PokéRogue! Questo gioco si concentra sulle battaglie, con elementi roguelite.
    $Questo gioco non è monetizzato e non siamo proprietari di Pokémon ed assets presenti nel gioco.
    $Il progetto è work-in-progress, ma giocabile al 100%.\nPer segnalare eventuali bug è possibile contattarci al nostro apposito Discord.
    $Se il gioco risulta 'lento', assicurati di aver abilitato l'accelerazione hardware nelle impostazioni del tuo browser`,

  "accessMenu": "Per accedere al menu, premi M o esc.\nDal menu puoi modificare le impostazioni, controllare la wiki ed accedere a varie features.",

  "menu": `Da questo menu puoi accedere alle impostazioni.
    $Esse ti permettono di cambiare velocità di gioco, stile delle finestre ed altre opzioni.
    $Ci sono varie funzionalità: controlla bene e non perderti nulla!`,

  "starterSelect": `Da questa schermata puoi selezionare il tuo starter.\nQuesti sono i membri iniziali della tua squadra.
    $Ogni starter ha un valore. Puoi avere fino a \n6 Pokèmon, avendo a disposizione un massimo di 10 punti.
    $Puoi anche selezionare genere, abilità, e forma a seconda delle\nvarianti che hai catturato o schiuso.
    $Le IVs di una specie sono le migliori rispetto a tutte quelle che hai\ncatturato o schiuso, quindi prova a catturarne il piu possibile!`,

  "pokerus": `Giornalmente 3 starter casuali disponibili avranno il bordo viola.
    $Se possiedi uno di questi starter,\nprova ad aggiungerlo alla squadra. Ricorda di controllarne le info!`,

  "statChange": `I cambiamenti alle statistiche persistono fintanto che i tuoi pokèmon restano in campo.
    $I tuoi pokemon verranno richiamati quando incontrerai un allenatore o al cambiamento di bioma.
    $Puoi anche vedere i cambiamenti alle statistiche in corso tenendo premuto C o Shift`,

  "selectItem": `Dopo ogni battaglia potrai scegliere tra 3 oggetti.\nPotrai prenderne solo uno.
    $Questi spaziano tra consumabili, oggetti tenuti da Pokèmon o con un effetto passivo permanente.
    $La maggior parte degli oggetti non consumabili possono accumulare i loro effetti in diversi modi.
    $Alcuni risulteranno inoltre disponibili solo se possono essere usati, come ad esempio gli oggetti evolutivi.
    $Puoi anche passare un oggetto tenuto da un Pokèmon a un altro attraverso l'opzione 'trasferisci strumento'.
    $Quest'ultima sarà disponibile solo dopo aver assegnato uno strumento ad un Pokèmon.
    $Puoi acquistare consumabili con le monete; progredendo saranno poi disponibili ulteriori oggetti.
    $Assicurati di fare un acquisto prima di selezionare un item casuale, poichè dopo aver fatto ciò passerai subito alla lotta successiva.`,

  "eggGacha": `Da questa schermata puoi riscattare i tuoi vouchers in cambio di\nuova Pokèmon.
    $Le uova vanno schiuse, e saranno sempre più vicine alla schiusura dopo\nogni battaglia. Le uova più rare impiegheranno più battaglie per la schiusura.
    $I Pokémon schiusi non verranno aggiunti alla tua squadra, ma saranno\ninvece aggiunti ai tuoi starters.
    $I Pokémon schiusi hanno (generalmente) IVs migliori rispetto ai\n Pokémon selvatici.
    $Inoltre, alcuni Pokémon possono essere ottenuti solo tramite uova.
    $Ci sono 3 diversi macchinari con differenti\nbonus, scegli quello che preferisci!`,
} as const;
