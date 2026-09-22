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

    // Los porcentajes de especialidad vuelven a contar en cada cambio, para
    // que el panel no aparezca con las cifras ya puestas.
    const activo = document.getElementById(id);
    if (activo) activo.querySelectorAll('[data-tm-count]').forEach(contar);

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
  // El hero entra siempre: esta sobre el pliegue y su titulo se revela al cargar
  const heroSeccion = document.querySelector('.tm-hero');
  if (heroSeccion) requestAnimationFrame(() => heroSeccion.classList.add('is-in'));

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

  /* --- Barra de avance de lectura ------------------------------------------ */
  const barra = document.querySelector('.tm-progreso i');
  if (barra) {
    let pedido = false;
    const pintarBarra = () => {
      pedido = false;
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      const pct = alto > 0 ? (window.scrollY / alto) * 100 : 0;
      barra.style.width = Math.min(100, Math.max(0, pct)).toFixed(2) + '%';
    };
    window.addEventListener('scroll', () => {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(pintarBarra);
    }, { passive: true });
    window.addEventListener('resize', pintarBarra, { passive: true });
    pintarBarra();
  }

  /* --- Inclinacion de las tarjetas segun el puntero ------------------------
     Se escribe --tm-rx / --tm-ry en cada tarjeta. Solo con puntero fino: en
     tactil no hay hover y el efecto estorbaria. */
  const punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)');

  if (punteroFino.matches && !menosMovimiento.matches) {
    const GIRO = 7;   // grados maximos
    tarjetas.forEach((tarjeta) => {
      let cuadro = null;
      tarjeta.addEventListener('pointerenter', () => {
        tarjeta.classList.add('is-tilting');
      });
      tarjeta.addEventListener('pointermove', (ev) => {
        if (cuadro) return;
        cuadro = requestAnimationFrame(() => {
          cuadro = null;
          const c = tarjeta.getBoundingClientRect();
          if (!c.width || !c.height) return;
          // Acotado a -0.5..0.5: si el puntero queda fuera del recuadro, o el
          // rect cambia por un scroll en curso, el giro no se dispara.
          const lim = (v) => Math.max(-0.5, Math.min(0.5, v));
          const px = lim((ev.clientX - c.left) / c.width - 0.5);
          const py = lim((ev.clientY - c.top) / c.height - 0.5);
          tarjeta.style.setProperty('--tm-ry', (px * GIRO * 2).toFixed(2) + 'deg');
          tarjeta.style.setProperty('--tm-rx', (-py * GIRO * 2).toFixed(2) + 'deg');
        });
      });
      tarjeta.addEventListener('pointerleave', () => {
        tarjeta.classList.remove('is-tilting');
        tarjeta.style.removeProperty('--tm-rx');
        tarjeta.style.removeProperty('--tm-ry');
      });
    });
  }

  /* --- Halo del hero que sigue al puntero ---------------------------------- */
  if (hero && !menosMovimiento.matches && punteroFino.matches) {
    let cuadro = null;
    hero.addEventListener('pointermove', (ev) => {
      if (cuadro) return;
      cuadro = requestAnimationFrame(() => {
        cuadro = null;
        const c = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', (((ev.clientX - c.left) / c.width) * 100).toFixed(1) + '%');
        hero.style.setProperty('--my', (((ev.clientY - c.top) / c.height) * 100).toFixed(1) + '%');
      });
    }, { passive: true });
  }

  /* --- Particulas del hero -------------------------------------------------
     Motas doradas que suben despacio. Se dibujan en un canvas y se detienen
     cuando el hero sale de pantalla, para no gastar cuadros de balde. */
  const lienzo = document.querySelector('.tm-particulas');

  if (lienzo && hero && !menosMovimiento.matches) {
    const ctx = lienzo.getContext('2d', { alpha: true });
    let motas = [], ancho = 0, alto = 0, dpr = 1, animando = false, id = 0;

    const medir = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = hero.clientWidth;
      alto = hero.clientHeight;
      lienzo.width = Math.round(ancho * dpr);
      lienzo.height = Math.round(alto * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // densidad proporcional al area, con tope para pantallas grandes
      const cuantas = Math.min(110, Math.max(28, Math.round((ancho * alto) / 9000)));
      motas = Array.from({ length: cuantas }, () => {
        // z = profundidad. 0 es el fondo (pequeña, tenue, lenta) y 1 el frente.
        // Las tres bandas dan sensacion de volumen sin necesidad de mas capas.
        const z = Math.random();
        return {
          x: Math.random() * ancho,
          y: Math.random() * alto,
          z,
          r: 0.5 + z * 2.1,
          vy: -(0.05 + z * 0.30),
          vx: (Math.random() - 0.5) * (0.05 + z * 0.16),
          a: 0.14 + z * 0.46,
          f: Math.random() * Math.PI * 2,      // fase del parpadeo
          vf: 0.9 + Math.random() * 1.1,       // velocidad del parpadeo
        };
      });
      // las del frente se dibujan al final, para que queden por encima
      motas.sort((m, n) => m.z - n.z);
    };

    const pintarMotas = () => {
      ctx.clearRect(0, 0, ancho, alto);
      const t = performance.now() / 1000;
      for (const m of motas) {
        m.y += m.vy;
        // deriva lateral suave, para que no suban en linea recta
        m.x += m.vx + Math.sin(t * 0.5 + m.f) * 0.08 * m.z;
        if (m.y < -8) { m.y = alto + 8; m.x = Math.random() * ancho; }
        if (m.x < -8) m.x = ancho + 8;
        if (m.x > ancho + 8) m.x = -8;
        const brillo = m.a * (0.6 + 0.4 * Math.sin(t * m.vf + m.f));
        // halo tenue alrededor de cada mota, para que no se vean como puntos planos
        const halo = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 3.2);
        halo.addColorStop(0, 'rgba(232,196,110,' + brillo.toFixed(3) + ')');
        halo.addColorStop(1, 'rgba(224,183,86,0)');
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();
      }
      id = requestAnimationFrame(pintarMotas);
    };

    const arrancar = () => { if (!animando) { animando = true; id = requestAnimationFrame(pintarMotas); } };
    const parar = () => { if (animando) { animando = false; cancelAnimationFrame(id); } };

    medir();
    window.addEventListener('resize', medir, { passive: true });

    // solo mientras el hero esta a la vista
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((e) => (e[0].isIntersecting ? arrancar() : parar()), { threshold: 0 }).observe(hero);
    } else {
      arrancar();
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? parar() : arrancar()));
  }

  /* --- Parallax de las imagenes del portafolio -----------------------------
     Cada imagen se desplaza dentro de su marco a distinta velocidad que el
     scroll. El escalado extra del CSS evita que asomen los bordes. */
  const piezas = [...document.querySelectorAll('.tm-work img')];

  if (piezas.length && !menosMovimiento.matches) {
    let pedido = false;
    const pintarPiezas = () => {
      pedido = false;
      const centro = window.innerHeight / 2;
      for (const img of piezas) {
        const c = img.getBoundingClientRect();
        if (c.bottom < -100 || c.top > window.innerHeight + 100) continue;
        const d = (c.top + c.height / 2 - centro) / centro;   // -1 .. 1
        img.style.setProperty('--tm-py', (d * -14).toFixed(1) + 'px');
      }
    };
    window.addEventListener('scroll', () => {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(pintarPiezas);
    }, { passive: true });
    pintarPiezas();
  }

  /* --- Año del pie de pagina ---------------------------------------------- */
  const anio = document.getElementById('year');
  if (anio) anio.textContent = new Date().getFullYear();
})();
