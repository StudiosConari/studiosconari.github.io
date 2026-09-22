/* ===========================================================================
   Studios Conari - Pagina de equipo
   Selector de integrantes, parallax del hero, revelados al hacer scroll y
   contadores. El tema (dia/noche) lo sigue manejando script.js.
   =========================================================================== */
(() => {
  'use strict';

  const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  /* --- Revelado al entrar en pantalla ------------------------------------- */
  const porRevelar = [...document.querySelectorAll('.tm-reveal, .tm-cap')];

  if (!('IntersectionObserver' in window) || menosMovimiento.matches) {
    porRevelar.forEach((el) => el.classList.add('is-in'));
  } else {
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('is-in');
        observador.unobserve(entrada.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    porRevelar.forEach((el) => observador.observe(el));
  }

  /* --- Contadores ---------------------------------------------------------
     Cuenta desde cero hasta el valor de data-tm-count cuando la cifra aparece. */
  const cifras = [...document.querySelectorAll('[data-tm-count]')];

  function contar(el) {
    const destino = parseFloat(el.dataset.tmCount);
    const sufijo = el.dataset.tmSuffix || '';
    if (!isFinite(destino)) return;
    if (menosMovimiento.matches) { el.textContent = destino + sufijo; return; }

    const duracion = 1400;
    const inicio = performance.now();
    const paso = (ahora) => {
      const t = Math.min((ahora - inicio) / duracion, 1);
      const suave = 1 - Math.pow(1 - t, 3);            // easing de salida
      el.textContent = Math.round(destino * suave) + sufijo;
      if (t < 1) requestAnimationFrame(paso);
    };
    el.textContent = '0' + sufijo;
    requestAnimationFrame(paso);
  }

  if (cifras.length) {
    if (!('IntersectionObserver' in window)) {
      cifras.forEach(contar);
    } else {
      const obsCifras = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          contar(entrada.target);
          obsCifras.unobserve(entrada.target);
        });
      }, { threshold: 0.6 });
      cifras.forEach((c) => obsCifras.observe(c));
    }
  }

  /* --- Parallax del hero ---------------------------------------------------
     Se escribe --tm-shift en cada capa segun el scroll. Va dentro de
     requestAnimationFrame para no forzar reflow en cada evento. */
  const capas = [...document.querySelectorAll('.tm-hero-layer')];
  const hero = document.querySelector('.tm-hero');

  if (capas.length && hero && !menosMovimiento.matches) {
    let pendiente = false;

    const pintar = () => {
      pendiente = false;
      const y = window.scrollY;
      // Fuera del hero no hace falta seguir calculando
      if (y > hero.offsetHeight) return;
      capas.forEach((capa) => {
        const factor = parseFloat(capa.dataset.tmSpeed || '0.2');
        capa.style.setProperty('--tm-shift', (y * factor).toFixed(1));
      });
    };

    window.addEventListener('scroll', () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(pintar);
    }, { passive: true });

    pintar();
  }

  /* --- Año del pie de pagina ---------------------------------------------- */
  const anio = document.getElementById('year');
  if (anio) anio.textContent = new Date().getFullYear();
})();
