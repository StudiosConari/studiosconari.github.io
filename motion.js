/* ===========================================================================
   Studios Conari - Capa de movimiento compartida
   La usan el landing (index.html, 404.html) y la pagina de equipo.

   Todo se activa por marcas en el HTML, sin saber de que pagina se trata:
     .mo-reveal            aparece al entrar en pantalla (recibe .is-in)
     .mo-progreso i        barra de avance de lectura
     [data-mo-count]       cifra que cuenta desde cero
     [data-mo-hero]        contenedor con particulas y halo de puntero
     [data-mo-speed]       capa con parallax vertical segun el scroll
     .mo-tilt              se inclina siguiendo al puntero

   Expone window.Motion.revelar(nodo) y window.Motion.contar(nodo) para que
   otras paginas disparen los efectos sobre contenido que aparece despues.
   =========================================================================== */
(() => {
  'use strict';

  const menos = window.matchMedia('(prefers-reduced-motion: reduce)');
  const punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)');
  const haySoporte = 'IntersectionObserver' in window;

  /* --- Revelado al entrar en pantalla ------------------------------------- */
  let observador = null;
  if (haySoporte && !menos.matches) {
    observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        observador.unobserve(e.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
  }

  function revelar(raiz = document) {
    const items = [...raiz.querySelectorAll('.mo-reveal, .mo-flota, .mo-cadena')];
    if (!observador) { items.forEach((el) => el.classList.add('is-in')); return; }
    items.forEach((el) => observador.observe(el));
  }

  /* --- Contadores ---------------------------------------------------------- */
  function contarUno(el) {
    const destino = parseFloat(el.dataset.moCount);
    const sufijo = el.dataset.moSuffix || '';
    if (!isFinite(destino)) return;
    if (menos.matches) { el.textContent = destino + sufijo; return; }

    const duracion = 1400;
    const inicio = performance.now();
    const paso = (ahora) => {
      const t = Math.min((ahora - inicio) / duracion, 1);
      const suave = 1 - Math.pow(1 - t, 3);          // easing de salida
      el.textContent = Math.round(destino * suave) + sufijo;
      if (t < 1) requestAnimationFrame(paso);
    };
    el.textContent = '0' + sufijo;
    requestAnimationFrame(paso);
  }

  function contar(raiz = document) {
    const cifras = [...raiz.querySelectorAll('[data-mo-count]')];
    if (!cifras.length) return;
    if (!haySoporte) { cifras.forEach(contarUno); return; }
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        contarUno(e.target);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    cifras.forEach((c) => obs.observe(c));
  }

  /* --- Barra de avance de lectura ------------------------------------------ */
  const barra = document.querySelector('.mo-progreso i');
  if (barra) {
    let pedido = false;
    const pintar = () => {
      pedido = false;
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      const pct = alto > 0 ? (window.scrollY / alto) * 100 : 0;
      barra.style.width = Math.min(100, Math.max(0, pct)).toFixed(2) + '%';
    };
    window.addEventListener('scroll', () => {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(pintar);
    }, { passive: true });
    window.addEventListener('resize', pintar, { passive: true });
    pintar();
  }

  /* --- Parallax de capas del hero ------------------------------------------ */
  const capas = [...document.querySelectorAll('[data-mo-speed]')];
  const hero = document.querySelector('[data-mo-hero]');

  if (capas.length && hero && !menos.matches) {
    let pedido = false;
    const pintar = () => {
      pedido = false;
      const y = window.scrollY;
      if (y > hero.offsetHeight) return;          // fuera del hero no hace falta
      capas.forEach((capa) => {
        const factor = parseFloat(capa.dataset.moSpeed || '0.2');
        capa.style.setProperty('--mo-shift', (y * factor).toFixed(1));
      });
    };
    window.addEventListener('scroll', () => {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(pintar);
    }, { passive: true });
    pintar();
  }

  /* --- Halo del hero que sigue al puntero ---------------------------------- */
  if (hero && !menos.matches && punteroFino.matches) {
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

  /* --- Particulas -----------------------------------------------------------
     Motas doradas que suben con tres profundidades. Se detienen cuando el hero
     sale de pantalla y cuando la pestaña queda oculta. */
  const lienzo = document.querySelector('.mo-particulas');

  if (lienzo && hero && !menos.matches) {
    const ctx = lienzo.getContext('2d', { alpha: true });
    let motas = [], ancho = 0, alto = 0, animando = false, id = 0;

    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = hero.clientWidth;
      alto = hero.clientHeight;
      lienzo.width = Math.round(ancho * dpr);
      lienzo.height = Math.round(alto * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cuantas = Math.min(110, Math.max(28, Math.round((ancho * alto) / 9000)));
      motas = Array.from({ length: cuantas }, () => {
        // z = profundidad. 0 es el fondo (pequeña, tenue, lenta) y 1 el frente.
        const z = Math.random();
        return {
          x: Math.random() * ancho,
          y: Math.random() * alto,
          z,
          r: 0.5 + z * 2.1,
          vy: -(0.05 + z * 0.30),
          vx: (Math.random() - 0.5) * (0.05 + z * 0.16),
          a: 0.14 + z * 0.46,
          f: Math.random() * Math.PI * 2,
          vf: 0.9 + Math.random() * 1.1,
        };
      });
      motas.sort((m, n) => m.z - n.z);   // las del frente se pintan al final
    };

    const pintar = () => {
      ctx.clearRect(0, 0, ancho, alto);
      const t = performance.now() / 1000;
      for (const m of motas) {
        m.y += m.vy;
        m.x += m.vx + Math.sin(t * 0.5 + m.f) * 0.08 * m.z;
        if (m.y < -8) { m.y = alto + 8; m.x = Math.random() * ancho; }
        if (m.x < -8) m.x = ancho + 8;
        if (m.x > ancho + 8) m.x = -8;
        const brillo = m.a * (0.6 + 0.4 * Math.sin(t * m.vf + m.f));
        const halo = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 3.2);
        halo.addColorStop(0, 'rgba(232,196,110,' + brillo.toFixed(3) + ')');
        halo.addColorStop(1, 'rgba(224,183,86,0)');
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();
      }
      id = requestAnimationFrame(pintar);
    };

    const arrancar = () => { if (!animando) { animando = true; id = requestAnimationFrame(pintar); } };
    const parar = () => { if (animando) { animando = false; cancelAnimationFrame(id); } };

    medir();
    window.addEventListener('resize', medir, { passive: true });
    if (haySoporte) {
      new IntersectionObserver((e) => (e[0].isIntersecting ? arrancar() : parar()), { threshold: 0 }).observe(hero);
    } else {
      arrancar();
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? parar() : arrancar()));
  }

  /* --- Inclinacion segun el puntero ---------------------------------------- */
  if (punteroFino.matches && !menos.matches) {
    const GIRO = 7;   // grados maximos
    document.querySelectorAll('.mo-tilt').forEach((el) => {
      let cuadro = null;
      el.addEventListener('pointerenter', () => el.classList.add('is-tilting'));
      el.addEventListener('pointermove', (ev) => {
        if (cuadro) return;
        cuadro = requestAnimationFrame(() => {
          cuadro = null;
          const c = el.getBoundingClientRect();
          if (!c.width || !c.height) return;
          // Acotado: si el puntero queda fuera, o el rect cambia por un scroll
          // en curso, el giro no se dispara.
          const lim = (v) => Math.max(-0.5, Math.min(0.5, v));
          const px = lim((ev.clientX - c.left) / c.width - 0.5);
          const py = lim((ev.clientY - c.top) / c.height - 0.5);
          el.style.setProperty('--mo-ry', (px * GIRO * 2).toFixed(2) + 'deg');
          el.style.setProperty('--mo-rx', (-py * GIRO * 2).toFixed(2) + 'deg');
        });
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('is-tilting');
        el.style.removeProperty('--mo-rx');
        el.style.removeProperty('--mo-ry');
      });
    });
  }

  /* --- Arranque ------------------------------------------------------------ */
  revelar();
  contar();

  // El hero entra siempre: esta sobre el pliegue
  if (hero) requestAnimationFrame(() => hero.classList.add('is-in'));

  /* --- Año del pie de pagina ----------------------------------------------- */
  const anio = document.getElementById('year');
  if (anio) anio.textContent = new Date().getFullYear();

  // Para que otras paginas disparen los efectos sobre contenido que aparece
  // despues, como los paneles de la pagina de equipo.
  window.Motion = { revelar, contar, menosMovimiento: menos, punteroFino };
})();
