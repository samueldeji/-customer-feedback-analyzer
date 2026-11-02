// customer-feedback-analyzer
// web/public/js/nav.js
// Handles mobile hamburger menu toggle and accessibility states across all pages.

document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!isExpanded));
      mobileNav.classList.toggle('hidden');
    });

    // Close mobile nav when clicking a link
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuBtn.setAttribute('aria-expanded', 'false');
        mobileNav.classList.add('hidden');
      });
    });
  }
});
