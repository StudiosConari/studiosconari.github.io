/* ===========================================================================
   Studios Conari - Pagina de equipo
   Selector de integrantes, parallax del hero, revelados al hacer scroll y
   contadores. El tema (dia/noche) lo sigue manejando script.js.
   =========================================================================== */
(() => {
  'use strict';

  
  /* --- Selector de integrantes -------------------------------------------
     Patron de pestañas: las tarjetas son los botones y cada panel es el
     contenido de una persona. Se navega con clic, con flechas y con Inicio/Fin. */
  const tarjetas = [...document.querySelectorAll('.tm-card')];
  const paneles = [...document.querySelectorAll('.tm-panel')];

  function mostrar(id, moverFoco, escribirHash) {
    tarjetas.forEach((t) => {
      const activa = t.dataset.tmFor === id;
      t.setAttribute('aria-selected', String(activa));
      // Solo la tarjeta activa es alcanzable con Tab; dentro se usan las flechas
      t.tabIndex = activa ? 0 : -1;
      if (activa && moverFoco) t.focus();
    });

    paneles.forEach((p) => {
      const activo = p.id === id;
      p.classList.toggle('is-active', activo);
      p.hidden = !activo;
    });


    // Deja el integrante en la URL para poder compartir el enlace directo.
    // Solo al elegir: si se escribiera tambien al cargar, la siguiente visita
    // llegaria con el hash puesto y el navegador saltaria a mitad del panel.
    if (!escribirHash) return;
    try {
      history.replaceState(null, '', '#' + id);
    } catch (e) { /* file:// no permite replaceState */ }
  }

  tarjetas.forEach((tarjeta) => {
    tarjeta.addEventListener('click', () => mostrar(tarjeta.dataset.tmFor, false, true));

    tarjeta.addEventListener('keydown', (ev) => {
      const i = tarjetas.indexOf(tarjeta);
      let destino = null;
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') destino = (i + 1) % tarjetas.length;
      else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') destino = (i - 1 + tarjetas.length) % tarjetas.length;
      else if (ev.key === 'Home') destino = 0;
      else if (ev.key === 'End') destino = tarjetas.length - 1;
      if (destino === null) return;
      ev.preventDefault();
      mostrar(tarjetas[destino].dataset.tmFor, true, true);
    });
  });

  if (tarjetas.length) {
    // Si el enlace trae un integrante, se abre ese; si no, el primero
    const pedido = decodeURIComponent(location.hash.slice(1));
    const existe = paneles.some((p) => p.id === pedido);
    mostrar(existe ? pedido : tarjetas[0].dataset.tmFor, false, false);

    // Al llegar con un enlace directo el navegador deja la vista a media
    // altura del panel. Se recoloca en el selector, para que se vea tanto la
    // eleccion como el contenido abierto.
    if (existe) {
      const seccion = document.getElementById('integrantes');
      if (seccion) {
        requestAnimationFrame(() => {
          seccion.scrollIntoView({ behavior: 'auto', block: 'start' });
        });
      }
    }
  }

})();
