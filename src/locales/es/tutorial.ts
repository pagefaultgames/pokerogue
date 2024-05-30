import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const tutorial: SimpleTranslationEntries = {
  "intro": `¡Bienvenido/a a PokéRogue! Este es un fangame de Pokémon centrado en el combate con elementos roguelite.
    $Este juego no está monetizado y no reclamamos ningún derecho de propiedad sobre Pokémon ni sobre ninguno de
    $los recursos con copyright utilizados.
    $El juego está en desarrollo, pero es completamente jugable.\nPara reportar bugs, por favor, hazlo en nuestra
    $comunidad de Discord.
    $Si el juego va lento, por favor, asegúrate de que tengas activada la opción 'Aceleración de gráficos' en los
    $ajustes de tu navegador.`,

  "accessMenu": `Para acceder al menú, pulsa M o Escape cuando\ntengas el control.
    $El menú contiene los ajustes y otras funciones.`,

  "menu": `Desde este menú podrás acceder a los ajustes.
    $Podrás cambiar la velocidad del juego, el estilo de la ventana y demás.
    $Hay más opciones, ¡así que pruébalas todas!`,

  "starterSelect": `En esta pantalla, podrás elegir tus iniciales presionando Z\no Espacio. Estos serán tus miembros de equipo al comenzar.
    $Cada inicial tiene un valor. Tu equipo puede contener hasta 6\nmiembros mientras el valor total no pase de 10.
    $También puedes elegir su género, habilidad y forma\ndependiendo de las variantes que hayas conseguido.
    $Los IVs de los iniciales corresponderán al valor más alto de\nlos Pokémon de la misma especie que hayas obtenido.
    $¡Así que intenta conseguir muchos Pokémon de la misma\nespecie!`,

  "pokerus": `Cada día, 3 iniciales aleatorios tendrán un borde morado.
    $Si ves un inicial que tengas con este borde, prueba a\nañadirlo a tu equipo. ¡No olvides revisar sus datos!`,

  "statChange": `Los cambios de estadísticas se mantienen entre combates\nmientras que el Pokémon no vuelva a su Poké Ball.
    $Tus Pokémon vuelven a sus Poké Balls antes de combates contra entrenadores y de entrar a un nuevo bioma.
    $También puedes ver los cambios de estadísticas del Pokémon en campo manteniendo pulsado C o Shift.
    $También puedes ver los movimientos de un Pokémon enemigo manteniendo presionada la V.
    $Esto solo revela los movimientos que has visto usar al Pokémon en esta combate.`,

  "selectItem": `Tras cada combate, tendrás la opción de elegir entre tres objetos aleatorios. Solo podrás escoger uno.
    $Estos objetos pueden ser consumibles, objetos equipables u objetos pasivos permanentes (hasta acabar la partida).
    $La mayoría de los efectos de objetos no consumibles se acumularán de varias maneras.
    $Algunos objetos solo aparecerán si pueden ser utilizados, como las piedras evolutivas.
    $También puedes transferir objetos equipados entre Pokémon, utilizando la opción de transferir.
    $La opción de transferir aparecerá en la parte inferior derecha una vez hayas obtenido un objeto equipable.
    $También puedes comprar objetos consumibles con dinero y su variedad irá aumentando según tu avance.
    $Asegúrate de comprar antes de escoger una recompensa, ya que se avanzará automáticamente al siguiente combate.`,

  "eggGacha": `En esta pantalla podrás canjear tus vales por huevos\nde Pokémon.
    $Los huevos deben eclosionar y estarán más cerca de\nhacerlo tras cada combate.
    $Los huevos más raros tardarán más en eclosionar.
    $Los Pokémon que hayan salido del huevo no se\nañadirán a tu equipo, pero sí a tus iniciales.
    $Los Pokémon salidos de un huevo suelen tener mejores\nIVs que los Pokémon salvajes.
    $Algunos Pokémon solo pueden ser obtenidos de huevos.
    $Hay 3 máquinas diferentes entre las que elegir, cada\nuna con diferentes bonificaciones.
    $¡Así que escoge la que más te interese!`,
} as const;
