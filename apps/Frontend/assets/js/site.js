/* ============================================================
   MTSAi Site JS — IBM Carbon Edition
   Handles: counters, scroll progress, mobile menu,
            nav dropdown, scroll reveal, particles
   ============================================================ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     Scroll Progress Bar
  ---------------------------------------------------------- */
  function initScrollProgress() {
    const bar = document.getElementById('red-scroll-progress') || document.getElementById('scroll-progress');
    if (!bar) return;
    function update() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const total = (document.documentElement.scrollHeight - document.documentElement.clientHeight) || 1;
      bar.style.transform = 'scaleX(' + Math.min(scrollTop / total, 1) + ')';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ----------------------------------------------------------
     Animated Counters
  ---------------------------------------------------------- */
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target) || 0;
    const duration = parseInt(el.dataset.duration, 10) || 1200;
    const suffix = el.dataset.suffix || '';
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * target);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;
    if (prefersReducedMotion) {
      counters.forEach(el => {
        el.textContent = (el.dataset.target || '0') + (el.dataset.suffix || '');
      });
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    counters.forEach(el => observer.observe(el));
  }

  /* ----------------------------------------------------------
     Scroll Reveal
  ---------------------------------------------------------- */
  function initScrollReveal() {
    const selectors = ['.fade-section', '.blur-fade-in', '.blur-fade-left', '.blur-fade-right', '.reveal-group'];
    const elements = document.querySelectorAll(selectors.join(','));
    if (!elements.length) return;
    if (prefersReducedMotion) {
      elements.forEach(el => el.classList.add('revealed', 'visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed', 'visible');
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });
    elements.forEach(el => observer.observe(el));
  }

  /* ----------------------------------------------------------
     Mobile Menu
  ---------------------------------------------------------- */
  function initMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const toggle = document.getElementById('mobile-menu-toggle');
    const close = document.getElementById('mobile-menu-close');
    const backdrop = document.getElementById('mobile-menu-backdrop');
    const panel = document.getElementById('mobile-menu-panel');
    if (!menu || !toggle || !panel) return;

    function open() {
      menu.classList.remove('hidden');
      requestAnimationFrame(() => panel.classList.remove('translate-x-full'));
      document.body.style.overflow = 'hidden';
      toggle.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      panel.classList.add('translate-x-full');
      setTimeout(() => {
        menu.classList.add('hidden');
        document.body.style.overflow = '';
      }, 300);
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', open);
    if (close) close.addEventListener('click', closeMenu);
    if (backdrop) backdrop.addEventListener('click', closeMenu);
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !menu.classList.contains('hidden')) closeMenu();
    });

    // Mobile submenu toggles
    ['mobile-system-toggle', 'mobile-trust-toggle'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const submenuId = id.replace('-toggle', '-submenu');
      const iconId = id.replace('-toggle', '-icon');
      const submenu = document.getElementById(submenuId);
      const icon = document.getElementById(iconId);
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        if (submenu) {
          submenu.classList.toggle('hidden');
          submenu.classList.toggle('flex');
        }
        if (icon) icon.style.transform = expanded ? 'rotate(0deg)' : 'rotate(180deg)';
      });
    });
  }

  /* ----------------------------------------------------------
     Nav Dropdown (desktop)
  ---------------------------------------------------------- */
  function initNavDropdowns() {
    document.querySelectorAll('.trust-dropdown-group').forEach(group => {
      const trigger = group.querySelector('.trust-dropdown-trigger');
      const panel = group.querySelector('.trust-dropdown-panel');
      if (!trigger || !panel) return;

      let hideTimeout;

      function showPanel() {
        clearTimeout(hideTimeout);
        panel.classList.remove('pointer-events-none', 'opacity-0');
        panel.classList.add('pointer-events-auto');
        trigger.setAttribute('aria-expanded', 'true');
      }

      function hidePanel() {
        hideTimeout = setTimeout(() => {
          panel.classList.add('pointer-events-none');
          panel.classList.remove('pointer-events-auto');
          trigger.setAttribute('aria-expanded', 'false');
        }, 150);
      }

      trigger.addEventListener('mouseenter', showPanel);
      trigger.addEventListener('focus', showPanel);
      panel.addEventListener('mouseenter', showPanel);
      group.addEventListener('mouseleave', hidePanel);
      panel.addEventListener('focusout', e => {
        if (!group.contains(e.relatedTarget)) hidePanel();
      });
      trigger.addEventListener('click', () => {
        const isOpen = panel.classList.contains('pointer-events-auto');
        isOpen ? hidePanel() : showPanel();
      });
    });
  }

  /* ----------------------------------------------------------
     Particle System
  ---------------------------------------------------------- */
  function initParticles() {
    if (prefersReducedMotion) return;
    document.querySelectorAll('[data-particles]').forEach(container => {
      const color = container.dataset.particleColor || '#53AA00';
      const count = parseInt(container.dataset.particleCount, 10) || 30;
      const speed = parseFloat(container.dataset.particleSpeed) || 0.3;
      const size = parseFloat(container.dataset.particleSize) || 1.5;
      const opacity = parseFloat(container.dataset.particleOpacity) || 0.3;

      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
      container.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      function resize() {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
      }
      resize();
      window.addEventListener('resize', resize, { passive: true });

      const particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        r: size + Math.random() * size,
      }));

      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = opacity;
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
      }
      draw();
    });
  }

  /* ----------------------------------------------------------
     Parallax (hero images)
  ---------------------------------------------------------- */
  function initParallax() {
    if (prefersReducedMotion) return;
    const imgs = document.querySelectorAll('[data-parallax]');
    if (!imgs.length) return;
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      imgs.forEach(img => {
        const factor = parseFloat(img.dataset.parallax) || 0.1;
        img.style.transform = `translateY(${scrollY * factor}px)`;
      });
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     Stagger grid children
  ---------------------------------------------------------- */
  function initStaggerGrid() {
    document.querySelectorAll('.stagger-grid').forEach(grid => {
      Array.from(grid.children).forEach((child, i) => {
        child.style.transitionDelay = (i * 80) + 'ms';
      });
    });
  }

  /* ----------------------------------------------------------
     Init all
  ---------------------------------------------------------- */
  function init() {
    initScrollProgress();
    initCounters();
    initScrollReveal();
    initMobileMenu();
    initNavDropdowns();
    initParticles();
    initParallax();
    initStaggerGrid();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
