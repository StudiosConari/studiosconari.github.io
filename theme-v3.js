(() => {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const label = document.getElementById('themeLabel');
  const year = document.getElementById('year');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const storedTheme = localStorage.getItem('studios-conari-theme');

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    const night = theme === 'night';
    if (toggle) toggle.setAttribute('aria-pressed', String(night));
    if (label) label.textContent = night ? 'Modo nocturno' : 'Modo diurno';
  };

  applyTheme(storedTheme || (prefersLight ? 'day' : 'night'));

  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'night' ? 'day' : 'night';
      applyTheme(next);
      localStorage.setItem('studios-conari-theme', next);
    });
  }

  if (year) year.textContent = String(new Date().getFullYear());

  const revealItems = [...document.querySelectorAll('.reveal')];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
})();
