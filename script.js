const root = document.documentElement;
const toggle = document.getElementById('themeToggle');
const logo = document.getElementById('brandLogo');
const year = document.getElementById('year');

function applyTheme(theme){
  root.dataset.theme = theme;
  if(logo) logo.src = theme === 'day' ? 'assets/header-wordmark-transparent.png' : 'assets/header-wordmark-night-transparent.png';
  if(toggle) toggle.setAttribute('aria-pressed', String(theme === 'night'));
  localStorage.setItem('conari-theme', theme);
}

applyTheme(localStorage.getItem('conari-theme') || 'night');

toggle?.addEventListener('click', () => {
  applyTheme(root.dataset.theme === 'night' ? 'day' : 'night');
});

if(year) year.textContent = new Date().getFullYear();


// Navegación robusta al inicio desde el enlace del pie de página.
document.querySelectorAll('[data-scroll-top]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    history.replaceState(null, '', '#inicio');
  });
});
