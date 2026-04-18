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
     Count-Up From Existing Text (no text changes required)
     Parses existing textContent and animates 0 → that number.
     Preserves non-numeric prefix/suffix characters.
     Trigger: add data-count-up attribute to any numeric element.
  ---------------------------------------------------------- */
  function animateCountUpFromText(el) {
    const original = (el.dataset.countUpOriginal || el.textContent || '').trim();
    // Match first number (allows decimals, commas); capture prefix/suffix around it
    const match = original.match(/^([^\d.,-]*)([\d.,-]+)(.*)$/);
    if (!match) return;
    const [, prefix, numStr, suffix] = match;
    const hasDecimal = /\./.test(numStr);
    const target = parseFloat(numStr.replace(/,/g, '')) || 0;
    const decimals = hasDecimal ? (numStr.split('.')[1] || '').length : 0;
    el.dataset.countUpOriginal = original; // cache so reruns don't break
    const duration = parseInt(el.dataset.countUpDuration, 10) || 1200;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = eased * target;
      const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
      el.textContent = prefix + display + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = original; // snap to exact original at end
    }
    requestAnimationFrame(tick);
  }

  function initCountUpFromText() {
    const els = document.querySelectorAll('[data-count-up]');
    if (!els.length) return;
    if (prefersReducedMotion) return; // leave text as-is
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCountUpFromText(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach(el => observer.observe(el));
  }

  /* ----------------------------------------------------------
     Scroll Reveal — Smart auto-classification
  ---------------------------------------------------------- */
  function classifyReveal(el) {
    // Headlines → blur reveal
    if (el.matches('h1, h2, h3, .mts-section__h2, .mts-hero__headline, .article-headline, .cta-headline, .mts-section__eyebrow'))
      return 'reveal-blur';
    // Cards / grid items → spring
    if (el.matches('.mts-card--feature, .ctrl-card, .engine-cell, .mts-card--approach, .mts-card--kpi, .partner-card, .step-card, .flow-step, .privacy-col, .mts-metric-card'))
      return 'reveal-spring';
    // Images / media → clip
    if (el.matches('img, .mts-photo-strip, figure, .mts-hero__photo, .arch-stack'))
      return 'reveal-clip';
    // Numbers / stats → stat spring
    if (el.matches('.metric-value, .arch-stat-num, .mts-hero__stat-num, .mts-kpi-val, .mts-hero__panel-metric-val, .cta-stat-num'))
      return 'reveal-stat';
    // Badges / tags / trust items → slide left
    if (el.matches('.mts-tag, .trust-item, .ctrl-badge, .mts-footer__trust-badge, .mts-announce-bar__badge'))
      return 'reveal-left';
    // Default: standard fade-up (keep existing behaviour)
    return null;
  }

  function initScrollReveal() {
    const groupSelectors = ['.fade-section', '.blur-fade-in', '.blur-fade-left', '.blur-fade-right', '.reveal-group'];
    const groups = document.querySelectorAll(groupSelectors.join(','));
    const itemSelectors = ['.reveal:not(.reveal-group)', '.scroll-reveal', '.scroll-reveal-blur', '.scroll-reveal-scale'];
    const items = document.querySelectorAll(itemSelectors.join(','));

    if (prefersReducedMotion) {
      groups.forEach(el => el.classList.add('revealed', 'visible'));
      items.forEach(el => el.classList.add('visible', 'is-visible'));
      return;
    }

    // Auto-classify each reveal element
    items.forEach(el => {
      const variant = classifyReveal(el);
      if (variant) el.classList.add(variant);
    });

    const groupObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('revealed', 'visible');
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.1 });
    groups.forEach(el => groupObs.observe(el));

    const itemObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible', 'is-visible');
          itemObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.15 });
    items.forEach(el => itemObs.observe(el));
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

    const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function getFocusable() {
      return Array.from(panel.querySelectorAll(FOCUSABLE)).filter(el => !el.closest('[hidden]') && !el.closest('.hidden'));
    }

    function open() {
      menu.classList.remove('hidden');
      requestAnimationFrame(() => {
        panel.classList.remove('translate-x-full');
        // Move focus into panel after animation frame
        const first = getFocusable()[0];
        if (first) first.focus();
      });
      document.body.style.overflow = 'hidden';
      toggle.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
    }

    function closeMenu() {
      panel.classList.add('translate-x-full');
      setTimeout(() => {
        menu.classList.add('hidden');
        document.body.style.overflow = '';
        menu.setAttribute('aria-hidden', 'true');
      }, 300);
      toggle.setAttribute('aria-expanded', 'false');
      // Return focus to the toggle that opened the menu
      toggle.focus();
    }

    // Focus trap: keep Tab/Shift+Tab inside the panel while open
    menu.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });

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
     Segmented Controls / Tab Bars / Filter Chips
     Handles .active toggling within a group.
  ---------------------------------------------------------- */
  function initSegmentedControls() {
    // Segmented controls
    document.querySelectorAll('.mts-segmented').forEach(group => {
      group.querySelectorAll('.mts-segmented__item').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.mts-segmented__item').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
        });
      });
    });
    // Tab bars
    document.querySelectorAll('.mts-tab-bar').forEach(bar => {
      bar.querySelectorAll('.mts-tab-bar__item').forEach(btn => {
        btn.addEventListener('click', () => {
          bar.querySelectorAll('.mts-tab-bar__item').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    });
    // Filter chips (multi-select by default; add data-single for radio behaviour)
    document.querySelectorAll('.mts-filter-row').forEach(row => {
      const single = row.dataset.single !== undefined;
      row.querySelectorAll('.mts-filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          if (single) {
            row.querySelectorAll('.mts-filter-chip').forEach(c => c.classList.remove('active'));
          }
          chip.classList.toggle('active');
        });
        // Remove button inside chip
        const rm = chip.querySelector('.mts-filter-chip__remove');
        if (rm) rm.addEventListener('click', e => {
          e.stopPropagation();
          chip.remove();
        });
      });
    });
  }

  /* ----------------------------------------------------------
     Tree View
     Expand/collapse nested .mts-tree nodes.
  ---------------------------------------------------------- */
  function initTreeView() {
    document.querySelectorAll('.mts-tree').forEach(tree => {
      tree.querySelectorAll('.mts-tree__item[aria-expanded]').forEach(trigger => {
        const submenuId = trigger.getAttribute('aria-controls');
        const submenu = submenuId
          ? document.getElementById(submenuId)
          : trigger.closest('li').querySelector('ul');
        if (!submenu) return;
        trigger.addEventListener('click', () => {
          const expanded = trigger.getAttribute('aria-expanded') === 'true';
          trigger.setAttribute('aria-expanded', String(!expanded));
          submenu.classList.toggle('open', !expanded);
        });
      });
    });
  }

  /* ----------------------------------------------------------
     Side Nav sub-menus
     Expand/collapse .mts-side-nav__sub panels.
  ---------------------------------------------------------- */
  function initSideNav() {
    document.querySelectorAll('.mts-side-nav__item[aria-expanded]').forEach(trigger => {
      const submenu = trigger.nextElementSibling;
      if (!submenu || !submenu.classList.contains('mts-side-nav__sub')) return;
      trigger.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!expanded));
        submenu.classList.toggle('open', !expanded);
      });
    });
  }

  /* ----------------------------------------------------------
     Combobox / Autocomplete
  ---------------------------------------------------------- */
  function initComboboxes() {
    document.querySelectorAll('.mts-combobox').forEach(box => {
      const input   = box.querySelector('.mts-combobox__input');
      const results = box.querySelector('.mts-combobox__results');
      const clear   = box.querySelector('.mts-combobox__clear');
      if (!input) return;

      function openBox()  { box.classList.add('open'); }
      function closeBox() { box.classList.remove('open'); }

      input.addEventListener('focus', openBox);
      input.addEventListener('input', () => {
        box.classList.toggle('has-value', input.value.length > 0);
        openBox();
      });

      if (clear) clear.addEventListener('click', () => {
        input.value = '';
        box.classList.remove('has-value');
        closeBox();
        input.focus();
      });

      // Close on outside click
      document.addEventListener('click', e => {
        if (!box.contains(e.target)) closeBox();
      });

      // Keyboard navigation within results
      input.addEventListener('keydown', e => {
        if (!results) return;
        const opts = Array.from(results.querySelectorAll('.mts-combobox__option:not(.mts-combobox__option--disabled)'));
        const current = results.querySelector('[aria-selected="true"]');
        let idx = opts.indexOf(current);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          idx = Math.min(idx + 1, opts.length - 1);
          opts.forEach(o => o.removeAttribute('aria-selected'));
          if (opts[idx]) { opts[idx].setAttribute('aria-selected', 'true'); opts[idx].scrollIntoView({ block: 'nearest' }); }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          idx = Math.max(idx - 1, 0);
          opts.forEach(o => o.removeAttribute('aria-selected'));
          if (opts[idx]) { opts[idx].setAttribute('aria-selected', 'true'); opts[idx].scrollIntoView({ block: 'nearest' }); }
        } else if (e.key === 'Enter') {
          if (current) { current.click(); }
        } else if (e.key === 'Escape') {
          closeBox(); input.blur();
        }
      });

      // Select option on click
      if (results) results.querySelectorAll('.mts-combobox__option').forEach(opt => {
        opt.addEventListener('click', () => {
          input.value = opt.dataset.value || opt.textContent.trim();
          box.classList.add('has-value');
          results.querySelectorAll('.mts-combobox__option').forEach(o => o.classList.remove('mts-combobox__option--selected'));
          opt.classList.add('mts-combobox__option--selected');
          closeBox();
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
    });
  }

  /* ----------------------------------------------------------
     Number Stepper
  ---------------------------------------------------------- */
  function initNumberSteppers() {
    document.querySelectorAll('.mts-number-stepper').forEach(stepper => {
      const input = stepper.querySelector('.mts-number-stepper__input');
      const dec   = stepper.querySelector('.mts-number-stepper__btn--dec');
      const inc   = stepper.querySelector('.mts-number-stepper__btn--inc');
      if (!input) return;

      const min  = parseFloat(input.min  ?? -Infinity);
      const max  = parseFloat(input.max  ??  Infinity);
      const step = parseFloat(input.step ?? 1);

      function update(val) {
        val = Math.min(max, Math.max(min, val));
        input.value = val;
        if (dec) dec.disabled = val <= min;
        if (inc) inc.disabled = val >= max;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      if (dec) dec.addEventListener('click', () => update(parseFloat(input.value || 0) - step));
      if (inc) inc.addEventListener('click', () => update(parseFloat(input.value || 0) + step));
      input.addEventListener('change', () => update(parseFloat(input.value || 0)));

      // Init button states
      update(parseFloat(input.value || 0));
    });
  }

  /* ----------------------------------------------------------
     Tag Input
  ---------------------------------------------------------- */
  function initTagInputs() {
    document.querySelectorAll('.mts-tag-input').forEach(container => {
      const textInput = container.querySelector('.mts-tag-input__text');
      if (!textInput) return;

      function addTag(value) {
        value = value.trim();
        if (!value) return;
        const tag = document.createElement('span');
        tag.className = 'mts-tag-input__tag';
        tag.innerHTML = `${value}<button type="button" class="mts-tag-input__tag-remove" aria-label="Remove ${value}">×</button>`;
        tag.querySelector('.mts-tag-input__tag-remove').addEventListener('click', () => tag.remove());
        container.insertBefore(tag, textInput);
        textInput.value = '';
        container.dispatchEvent(new CustomEvent('tag:add', { detail: { value }, bubbles: true }));
      }

      textInput.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ',') && textInput.value.trim()) {
          e.preventDefault();
          addTag(textInput.value);
        } else if (e.key === 'Backspace' && !textInput.value) {
          const tags = container.querySelectorAll('.mts-tag-input__tag');
          if (tags.length) tags[tags.length - 1].remove();
        }
      });

      // Allow clicking the container to focus text input
      container.addEventListener('click', () => textInput.focus());
    });
  }

  /* ----------------------------------------------------------
     Bottom Sheet
  ---------------------------------------------------------- */
  function initBottomSheets() {
    document.querySelectorAll('[data-open-sheet]').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const sheet = document.getElementById(trigger.dataset.openSheet);
        if (sheet) sheet.classList.add('open');
      });
    });
    document.querySelectorAll('.mts-bottom-sheet').forEach(sheet => {
      const backdrop = sheet.querySelector('.mts-bottom-sheet__backdrop');
      function close() { sheet.classList.remove('open'); }
      if (backdrop) backdrop.addEventListener('click', close);
      sheet.querySelectorAll('[data-close-sheet]').forEach(btn => btn.addEventListener('click', close));
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && sheet.classList.contains('open')) close();
      });
    });
  }

  /* ----------------------------------------------------------
     Drawer
  ---------------------------------------------------------- */
  function initDrawers() {
    document.querySelectorAll('[data-open-drawer]').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const drawer = document.getElementById(trigger.dataset.openDrawer);
        if (drawer) { drawer.classList.add('open'); drawer.querySelector('.mts-drawer__panel').focus?.(); }
      });
    });
    document.querySelectorAll('.mts-drawer').forEach(drawer => {
      const backdrop = drawer.querySelector('.mts-drawer__backdrop');
      const close    = drawer.querySelector('.mts-drawer__close');
      function closeDrawer() { drawer.classList.remove('open'); }
      if (backdrop) backdrop.addEventListener('click', closeDrawer);
      if (close)    close.addEventListener('click', closeDrawer);
      drawer.querySelectorAll('[data-close-drawer]').forEach(btn => btn.addEventListener('click', closeDrawer));
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
      });
    });
  }

  /* ----------------------------------------------------------
     Command Palette  (Cmd/Ctrl+K to open)
  ---------------------------------------------------------- */
  function initCommandPalette() {
    const palette = document.querySelector('.mts-command-palette');
    if (!palette) return;

    function openPalette() {
      palette.style.display = 'flex';
      palette.querySelector('.mts-command-palette__input')?.focus();
    }
    function closePalette() {
      palette.style.display = 'none';
    }

    // Keyboard shortcut
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        palette.style.display === 'none' ? openPalette() : closePalette();
      }
      if (e.key === 'Escape' && palette.style.display !== 'none') closePalette();
    });

    // Click backdrop to close
    palette.addEventListener('click', e => {
      if (e.target === palette) closePalette();
    });

    // Trigger buttons
    document.querySelectorAll('[data-open-command-palette]').forEach(btn => {
      btn.addEventListener('click', openPalette);
    });

    // Start hidden
    palette.style.display = 'none';

    // Arrow key navigation
    const input = palette.querySelector('.mts-command-palette__input');
    if (input) input.addEventListener('keydown', e => {
      const items = Array.from(palette.querySelectorAll('.mts-command-palette__item'));
      const current = palette.querySelector('.mts-command-palette__item[aria-selected="true"]');
      let idx = items.indexOf(current);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        idx = Math.min(idx + 1, items.length - 1);
        items.forEach(i => i.removeAttribute('aria-selected'));
        if (items[idx]) { items[idx].setAttribute('aria-selected', 'true'); items[idx].scrollIntoView({ block: 'nearest' }); }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        idx = Math.max(idx - 1, 0);
        items.forEach(i => i.removeAttribute('aria-selected'));
        if (items[idx]) { items[idx].setAttribute('aria-selected', 'true'); items[idx].scrollIntoView({ block: 'nearest' }); }
      } else if (e.key === 'Enter') {
        if (current) current.click();
      }
    });
  }

  /* ----------------------------------------------------------
     Context Menu  (right-click on [data-context-menu])
  ---------------------------------------------------------- */
  function initContextMenus() {
    document.querySelectorAll('[data-context-menu]').forEach(trigger => {
      const menuId = trigger.dataset.contextMenu;
      const menu = document.getElementById(menuId);
      if (!menu) return;

      trigger.addEventListener('contextmenu', e => {
        e.preventDefault();
        // Position at cursor
        const x = Math.min(e.clientX, window.innerWidth - 220);
        const y = Math.min(e.clientY, window.innerHeight - menu.offsetHeight - 10);
        menu.style.left = x + 'px';
        menu.style.top  = y + 'px';
        menu.style.display = 'block';
      });

      document.addEventListener('click', () => { menu.style.display = 'none'; });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') menu.style.display = 'none';
      });
    });
  }

  /* ----------------------------------------------------------
     Accordion (mts-accordion — add to existing accordion.css)
  ---------------------------------------------------------- */
  function initAccordions() {
    document.querySelectorAll('.mts-accordion').forEach(accordion => {
      accordion.querySelectorAll('.mts-accordion__trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
          const item    = trigger.closest('.mts-accordion__item');
          const content = item.querySelector('.mts-accordion__content, .accordion-content');
          const isOpen  = trigger.getAttribute('aria-expanded') === 'true';

          // Close others if data-single set on parent
          if (accordion.dataset.single !== undefined) {
            accordion.querySelectorAll('.mts-accordion__trigger').forEach(t => {
              t.setAttribute('aria-expanded', 'false');
              const c = t.closest('.mts-accordion__item').querySelector('.mts-accordion__content, .accordion-content');
              if (c) { c.classList.remove('is-open'); c.style.maxHeight = '0'; }
            });
          }

          trigger.setAttribute('aria-expanded', String(!isOpen));
          if (content) {
            content.classList.toggle('is-open', !isOpen);
            content.style.maxHeight = isOpen ? '0' : content.scrollHeight + 'px';
          }
        });
      });
    });
  }

  /* ----------------------------------------------------------
     Stepper (multi-step form progression)
  ---------------------------------------------------------- */
  function initSteppers() {
    document.querySelectorAll('[data-stepper]').forEach(form => {
      const steps    = Array.from(form.querySelectorAll('.mts-stepper__step'));
      const panels   = Array.from(form.querySelectorAll('[data-step-panel]'));
      const nextBtns = form.querySelectorAll('[data-step-next]');
      const prevBtns = form.querySelectorAll('[data-step-prev]');
      let current = 0;

      function goTo(n) {
        steps.forEach((s, i) => {
          s.classList.toggle('active',   i === n);
          s.classList.toggle('complete', i < n);
          s.classList.remove('active');
          if (i === n) s.classList.add('active');
        });
        panels.forEach((p, i) => p.style.display = i === n ? '' : 'none');
        current = n;
      }

      nextBtns.forEach(btn => btn.addEventListener('click', () => { if (current < steps.length - 1) goTo(current + 1); }));
      prevBtns.forEach(btn => btn.addEventListener('click', () => { if (current > 0) goTo(current - 1); }));

      if (steps.length) goTo(0);
    });
  }

  /* ----------------------------------------------------------
     OTP / PIN Input  (auto-advance + backspace-retreat)
  ---------------------------------------------------------- */
  function initOTPInputs() {
    document.querySelectorAll('[data-otp]').forEach(container => {
      const cells = Array.from(container.querySelectorAll('.mts-otp__cell'));
      if (!cells.length) return;

      cells.forEach((cell, i) => {
        cell.addEventListener('input', e => {
          // Strip non-numeric if inputmode="numeric"
          if (cell.inputMode === 'numeric') cell.value = cell.value.replace(/\D/g, '').slice(-1);
          cell.classList.toggle('filled', !!cell.value);
          if (cell.value && i < cells.length - 1) cells[i + 1].focus();
          // Fire change on container when all filled
          if (cells.every(c => c.value)) {
            const code = cells.map(c => c.value).join('');
            container.dispatchEvent(new CustomEvent('otp:complete', { detail: { code }, bubbles: true }));
          }
        });

        cell.addEventListener('keydown', e => {
          if (e.key === 'Backspace') {
            if (cell.value) {
              cell.value = '';
              cell.classList.remove('filled');
            } else if (i > 0) {
              cells[i - 1].focus();
              cells[i - 1].value = '';
              cells[i - 1].classList.remove('filled');
            }
          } else if (e.key === 'ArrowLeft'  && i > 0) { e.preventDefault(); cells[i - 1].focus(); }
          else if (e.key === 'ArrowRight' && i < cells.length - 1) { e.preventDefault(); cells[i + 1].focus(); }
        });

        // Handle paste on first cell — spread across cells
        cell.addEventListener('paste', e => {
          e.preventDefault();
          const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
          text.split('').forEach((ch, j) => {
            if (cells[j]) { cells[j].value = ch; cells[j].classList.add('filled'); }
          });
          const next = cells[Math.min(text.length, cells.length - 1)];
          if (next) next.focus();
        });
      });
    });
  }

  /* ----------------------------------------------------------
     Popover menus (button + .mts-popover-menu sibling)
  ---------------------------------------------------------- */
  function initPopoverMenus() {
    document.querySelectorAll('[data-popover-menu]').forEach(trigger => {
      const menuId = trigger.dataset.popoverMenu;
      const menu   = menuId ? document.getElementById(menuId) : trigger.nextElementSibling;
      if (!menu || !menu.classList.contains('mts-popover-menu')) return;

      const parent = trigger.parentElement;
      parent.style.position = parent.style.position || 'relative';

      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = menu.classList.contains('open');
        // Close all open popover menus
        document.querySelectorAll('.mts-popover-menu.open').forEach(m => m.classList.remove('open'));
        if (!isOpen) menu.classList.add('open');
      });

      document.addEventListener('click', () => menu.classList.remove('open'));
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') menu.classList.remove('open');
      });
    });
  }

  /* ----------------------------------------------------------
     Smooth Scroll — Lenis inertia scroll
     Loads Lenis from CDN, falls back silently if unavailable.
     Disabled automatically when prefers-reduced-motion is set.
  ---------------------------------------------------------- */
  function initSmoothScroll() {
    // Native scroll only — Lenis removed (caused unnatural scroll pause).
    // Anchor-link smooth scrolling handled by CSS scroll-behavior: smooth.
  }

  /* ----------------------------------------------------------
     Hero use-case rotator
  ---------------------------------------------------------- */
  function initHeroRotator() {
    if (prefersReducedMotion) return;
    var items = document.querySelectorAll('.hero-usecase');
    if (!items.length) return;
    var current = 0;
    setInterval(function () {
      items[current].classList.remove('hero-usecase--active');
      current = (current + 1) % items.length;
      items[current].classList.add('hero-usecase--active');
    }, 2800);
  }

  /* ----------------------------------------------------------
     DS v2 Completion Pack — Sliders, Multiselect, ActionMenus,
     DataTableSort, RelativeTime
  ---------------------------------------------------------- */

  /* ---- Slider (single + range) ---- */
  function initSliders() {
    var sliders = document.querySelectorAll('.mts-slider');
    if (!sliders.length) return;
    sliders.forEach(function(s) {
      var input = s.querySelector('.mts-slider__input');
      var valEl = s.querySelector('.mts-slider__value');
      if (!input) return;
      function updateValue() {
        var suffix = input.dataset.suffix || '';
        if (valEl) valEl.textContent = input.value + suffix;
      }
      input.addEventListener('input', updateValue);
      updateValue();

      // Range (dual-thumb) — auto-fill the track between two inputs
      if (s.classList.contains('mts-slider--range')) {
        var inputs = s.querySelectorAll('.mts-slider__input');
        var fill = s.querySelector('.mts-slider__track-fill');
        if (inputs.length === 2 && fill) {
          function updateRange() {
            var a = parseFloat(inputs[0].value);
            var b = parseFloat(inputs[1].value);
            var min = parseFloat(inputs[0].min);
            var max = parseFloat(inputs[0].max);
            var lo = Math.min(a, b), hi = Math.max(a, b);
            fill.style.left  = ((lo - min) / (max - min) * 100) + '%';
            fill.style.right = ((max - hi) / (max - min) * 100) + '%';
          }
          inputs.forEach(function(i) { i.addEventListener('input', updateRange); });
          updateRange();
        }
      }
    });
  }

  /* ---- Multiselect ---- */
  function initMultiselect() {
    var widgets = document.querySelectorAll('.mts-multiselect');
    if (!widgets.length) return;
    widgets.forEach(function(w) {
      var input = w.querySelector('.mts-multiselect__input');
      var dropdown = w.querySelector('.mts-multiselect__dropdown');
      if (!input || !dropdown) return;

      // Toggle dropdown on focus
      input.addEventListener('focus', function() { w.setAttribute('aria-expanded', 'true'); });
      input.addEventListener('blur', function() {
        setTimeout(function() { w.setAttribute('aria-expanded', 'false'); }, 150);
      });

      // Remove chip
      w.addEventListener('click', function(e) {
        var btn = e.target.closest('.mts-multiselect__chip-close');
        if (btn) {
          var chip = btn.closest('.mts-multiselect__chip');
          var opt = dropdown.querySelector('[data-value="' + (chip.dataset.value || '') + '"]');
          if (opt) opt.setAttribute('aria-selected', 'false');
          chip.remove();
        }
      });

      // Click option to toggle selection
      dropdown.addEventListener('click', function(e) {
        var opt = e.target.closest('.mts-multiselect__option');
        if (!opt) return;
        var selected = opt.getAttribute('aria-selected') === 'true';
        opt.setAttribute('aria-selected', selected ? 'false' : 'true');
        input.focus();
      });

      // Filter options as user types
      input.addEventListener('input', function() {
        var q = input.value.toLowerCase();
        dropdown.querySelectorAll('.mts-multiselect__option').forEach(function(o) {
          var match = o.textContent.toLowerCase().indexOf(q) !== -1;
          o.style.display = match ? '' : 'none';
        });
      });
    });
  }

  /* ---- Action Menus ---- */
  function initActionMenus() {
    var menus = document.querySelectorAll('.mts-action-menu');
    if (!menus.length) return;
    menus.forEach(function(m) {
      var trigger = m.querySelector('.mts-action-menu__trigger');
      if (!trigger) return;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = trigger.getAttribute('aria-expanded') === 'true';
        // Close all other open menus
        menus.forEach(function(o) {
          if (o !== m) {
            var t = o.querySelector('.mts-action-menu__trigger');
            if (t) t.setAttribute('aria-expanded', 'false');
            o.setAttribute('aria-expanded', 'false');
          }
        });
        trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        m.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      });
    });
    document.addEventListener('click', function(e) {
      menus.forEach(function(m) {
        if (!m.contains(e.target)) {
          var t = m.querySelector('.mts-action-menu__trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
          m.setAttribute('aria-expanded', 'false');
        }
      });
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        menus.forEach(function(m) {
          var t = m.querySelector('.mts-action-menu__trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
          m.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  /* ---- Data Table Sort ---- */
  function initDataTableSort() {
    var tables = document.querySelectorAll('table[data-sortable]');
    if (!tables.length) return;
    tables.forEach(function(table) {
      var headers = table.querySelectorAll('thead th[data-sort]');
      headers.forEach(function(th, idx) {
        th.style.cursor = 'pointer';
        th.setAttribute('tabindex', '0');
        th.setAttribute('role', 'button');
        if (!th.hasAttribute('aria-sort')) th.setAttribute('aria-sort', 'none');
        function sort() {
          var dir = th.getAttribute('aria-sort');
          var nextDir = (dir === 'ascending') ? 'descending' : 'ascending';
          headers.forEach(function(h) { h.setAttribute('aria-sort', 'none'); });
          th.setAttribute('aria-sort', nextDir);
          var tbody = table.querySelector('tbody');
          if (!tbody) return;
          var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
          var type = th.dataset.sort; // 'number' | 'date' | 'text'
          rows.sort(function(a, b) {
            var cellA = a.children[idx] ? a.children[idx].textContent.trim() : '';
            var cellB = b.children[idx] ? b.children[idx].textContent.trim() : '';
            var valA, valB;
            if (type === 'number') { valA = parseFloat(cellA) || 0; valB = parseFloat(cellB) || 0; }
            else if (type === 'date') { valA = new Date(cellA).getTime() || 0; valB = new Date(cellB).getTime() || 0; }
            else { valA = cellA.toLowerCase(); valB = cellB.toLowerCase(); }
            if (valA < valB) return nextDir === 'ascending' ? -1 : 1;
            if (valA > valB) return nextDir === 'ascending' ? 1 : -1;
            return 0;
          });
          rows.forEach(function(r) { tbody.appendChild(r); });
        }
        th.addEventListener('click', sort);
        th.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sort(); }
        });
      });
    });
  }

  /* ---- Relative Time ---- */
  function initRelativeTime() {
    var els = document.querySelectorAll('time[data-relative]');
    if (!els.length) return;
    var rtf = (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat)
      ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      : null;
    function fmt(el) {
      var iso = el.getAttribute('datetime');
      if (!iso) return;
      var then = new Date(iso).getTime();
      var now = Date.now();
      var diff = then - now;
      var abs = Math.abs(diff);
      var out;
      if (rtf) {
        if (abs < 60000)      out = rtf.format(Math.round(diff / 1000), 'second');
        else if (abs < 3.6e6) out = rtf.format(Math.round(diff / 60000), 'minute');
        else if (abs < 8.64e7) out = rtf.format(Math.round(diff / 3.6e6), 'hour');
        else if (abs < 6.048e8) out = rtf.format(Math.round(diff / 8.64e7), 'day');
        else if (abs < 2.628e9) out = rtf.format(Math.round(diff / 6.048e8), 'week');
        else if (abs < 3.154e10) out = rtf.format(Math.round(diff / 2.628e9), 'month');
        else out = rtf.format(Math.round(diff / 3.154e10), 'year');
      } else {
        // Fallback: absolute date string
        out = new Date(iso).toLocaleDateString();
      }
      el.textContent = out;
      if (!el.title) el.title = new Date(iso).toLocaleString();
    }
    els.forEach(fmt);
    // Refresh every minute
    setInterval(function() { els.forEach(fmt); }, 60000);
  }

  /* ----------------------------------------------------------
     DS v2 Tier 2 — Carousel, Time Picker
  ---------------------------------------------------------- */

  /* ---- Carousel ---- */
  function initCarousels() {
    var carousels = document.querySelectorAll('.mts-carousel');
    if (!carousels.length) return;
    carousels.forEach(function(c) {
      var viewport = c.querySelector('.mts-carousel__viewport');
      var slides = c.querySelectorAll('.mts-carousel__slide');
      var prev = c.querySelector('.mts-carousel__nav--prev');
      var next = c.querySelector('.mts-carousel__nav--next');
      var dotsContainer = c.querySelector('.mts-carousel__dots');
      var progress = c.querySelector('.mts-carousel__progress-fill');
      if (!viewport || !slides.length) return;

      // Build dots if container exists and is empty
      if (dotsContainer && !dotsContainer.children.length) {
        slides.forEach(function(_, i) {
          var d = document.createElement('button');
          d.className = 'mts-carousel__dot';
          d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
          if (i === 0) d.setAttribute('aria-current', 'true');
          d.addEventListener('click', function() { scrollToSlide(i); });
          dotsContainer.appendChild(d);
        });
      }
      var dots = c.querySelectorAll('.mts-carousel__dot');

      function getSlideWidth() {
        return slides[0].getBoundingClientRect().width +
               (parseFloat(getComputedStyle(viewport).gap) || 0);
      }

      function scrollToSlide(i) {
        viewport.scrollTo({ left: i * getSlideWidth(), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }

      function updateActive() {
        var sw = getSlideWidth() || 1;
        var i = Math.round(viewport.scrollLeft / sw);
        dots.forEach(function(d, di) {
          if (di === i) d.setAttribute('aria-current', 'true');
          else d.removeAttribute('aria-current');
        });
        if (progress) {
          var pct = (slides.length > 1)
            ? ((i + 1) / slides.length) * 100
            : 100;
          progress.style.width = pct + '%';
        }
        if (prev) prev.disabled = (i === 0);
        if (next) next.disabled = (i >= slides.length - 1);
      }

      if (prev) prev.addEventListener('click', function() {
        viewport.scrollBy({ left: -getSlideWidth(), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
      if (next) next.addEventListener('click', function() {
        viewport.scrollBy({ left: getSlideWidth(), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });

      // Keyboard nav
      c.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft' && prev) { e.preventDefault(); prev.click(); }
        if (e.key === 'ArrowRight' && next) { e.preventDefault(); next.click(); }
      });

      // Scroll-linked active-dot update (throttled via rAF)
      var ticking = false;
      viewport.addEventListener('scroll', function() {
        if (!ticking) {
          requestAnimationFrame(function() { updateActive(); ticking = false; });
          ticking = true;
        }
      }, { passive: true });

      updateActive();

      // Auto-advance (opt-in via data-auto-advance="5000")
      var auto = parseInt(c.dataset.autoAdvance, 10);
      if (auto && auto > 0 && !prefersReducedMotion) {
        setInterval(function() {
          var sw = getSlideWidth();
          var atEnd = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 10;
          if (atEnd) viewport.scrollTo({ left: 0, behavior: 'smooth' });
          else viewport.scrollBy({ left: sw, behavior: 'smooth' });
        }, auto);
      }
    });
  }

  /* ---- Time Picker ---- */
  function initTimePickers() {
    var pickers = document.querySelectorAll('.mts-time-picker');
    if (!pickers.length) return;
    pickers.forEach(function(p) {
      var input = p.querySelector('.mts-time-picker__input');
      var panel = p.querySelector('.mts-time-picker__panel');
      var is12h = p.dataset.mode === '12h';
      if (!input) return;

      // Build hour/minute columns if panel is empty
      if (panel && !panel.children.length) {
        var hourCol = document.createElement('div');
        hourCol.className = 'mts-time-picker__column';
        var hourLabel = document.createElement('div');
        hourLabel.className = 'mts-time-picker__column-label';
        hourLabel.textContent = 'HR';
        hourCol.appendChild(hourLabel);
        var hoursMax = is12h ? 12 : 24;
        var hoursStart = is12h ? 1 : 0;
        for (var h = hoursStart; h < hoursStart + hoursMax; h++) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'mts-time-picker__option';
          b.dataset.hour = h;
          b.textContent = String(h).padStart(2, '0');
          hourCol.appendChild(b);
        }
        panel.appendChild(hourCol);

        var minCol = document.createElement('div');
        minCol.className = 'mts-time-picker__column';
        var minLabel = document.createElement('div');
        minLabel.className = 'mts-time-picker__column-label';
        minLabel.textContent = 'MIN';
        minCol.appendChild(minLabel);
        for (var m = 0; m < 60; m += 5) {
          var bm = document.createElement('button');
          bm.type = 'button';
          bm.className = 'mts-time-picker__option';
          bm.dataset.minute = m;
          bm.textContent = String(m).padStart(2, '0');
          minCol.appendChild(bm);
        }
        panel.appendChild(minCol);

        if (is12h) {
          var ampmCol = document.createElement('div');
          ampmCol.className = 'mts-time-picker__column mts-time-picker__ampm';
          ['AM', 'PM'].forEach(function(x) {
            var ba = document.createElement('button');
            ba.type = 'button';
            ba.className = 'mts-time-picker__option';
            ba.dataset.ampm = x;
            ba.textContent = x;
            ampmCol.appendChild(ba);
          });
          panel.appendChild(ampmCol);
        }
      }

      var state = { hour: '', minute: '', ampm: is12h ? 'AM' : '' };
      function sync() {
        var h = state.hour ? String(state.hour).padStart(2, '0') : '--';
        var m = state.minute !== '' ? String(state.minute).padStart(2, '0') : '--';
        input.value = h + ':' + m + (is12h ? ' ' + state.ampm : '');
      }
      function clearSelected(col) {
        panel.querySelectorAll('.mts-time-picker__column:nth-child(' + col + ') .mts-time-picker__option')
          .forEach(function(o) { o.setAttribute('aria-selected', 'false'); });
      }

      input.addEventListener('click', function() {
        p.setAttribute('aria-expanded', p.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
      });
      input.addEventListener('focus', function() {
        p.setAttribute('aria-expanded', 'true');
      });

      panel && panel.addEventListener('click', function(e) {
        var opt = e.target.closest('.mts-time-picker__option');
        if (!opt) return;
        if (opt.dataset.hour !== undefined) {
          clearSelected(1);
          state.hour = opt.dataset.hour;
        } else if (opt.dataset.minute !== undefined) {
          clearSelected(2);
          state.minute = opt.dataset.minute;
        } else if (opt.dataset.ampm) {
          clearSelected(3);
          state.ampm = opt.dataset.ampm;
        }
        opt.setAttribute('aria-selected', 'true');
        sync();
      });

      document.addEventListener('click', function(e) {
        if (!p.contains(e.target)) p.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ----------------------------------------------------------
     DS v2 Tier 3 — Ratings, Color Picker, Transfer List,
     Speed Dial, Tree Table, Inline Edit, Spotlight Tour
  ---------------------------------------------------------- */

  /* ---- Ratings ---- */
  function initRatings() {
    var ratings = document.querySelectorAll('.mts-rating:not(.mts-rating--readonly)');
    if (!ratings.length) return;
    ratings.forEach(function(r) {
      var stars = r.querySelectorAll('.mts-rating__star');
      stars.forEach(function(s, i) {
        s.addEventListener('click', function() {
          var value = i + 1;
          stars.forEach(function(ss, si) {
            if (si < value) ss.classList.add('is-active', 'mts-rating__star--filled');
            else ss.classList.remove('is-active', 'mts-rating__star--filled');
          });
          r.dataset.value = value;
          r.dispatchEvent(new CustomEvent('rating-change', { detail: { value: value }, bubbles: true }));
        });
      });
    });
  }

  /* ---- Color Pickers ---- */
  function initColorPickers() {
    var pickers = document.querySelectorAll('.mts-color-picker');
    if (!pickers.length) return;
    pickers.forEach(function(p) {
      var swatches = p.querySelectorAll('.mts-color-picker__swatch');
      swatches.forEach(function(s) {
        s.addEventListener('click', function() {
          swatches.forEach(function(ss) { ss.setAttribute('aria-checked', 'false'); });
          s.setAttribute('aria-checked', 'true');
          var color = s.dataset.color || getComputedStyle(s).getPropertyValue('--swatch-color').trim();
          p.dataset.value = color;
          var current = p.querySelector('.mts-color-picker__current-swatch');
          if (current) current.style.setProperty('--current-color', color);
          p.dispatchEvent(new CustomEvent('color-change', { detail: { color: color }, bubbles: true }));
        });
      });
    });
  }

  /* ---- Transfer Lists ---- */
  function initTransferLists() {
    var transfers = document.querySelectorAll('.mts-transfer');
    if (!transfers.length) return;
    transfers.forEach(function(t) {
      var lists = t.querySelectorAll('.mts-transfer__list');
      if (lists.length < 2) return;
      var leftList = lists[0];
      var rightList = lists[1];

      // Click to select items (multi-select)
      t.querySelectorAll('.mts-transfer__item').forEach(function(item) {
        item.addEventListener('click', function() {
          var selected = item.getAttribute('aria-selected') === 'true';
          item.setAttribute('aria-selected', selected ? 'false' : 'true');
          updateCounts();
        });
      });

      // Transfer controls
      t.querySelectorAll('[data-transfer-action]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var action = btn.dataset.transferAction;
          var src, dst;
          if (action === 'right' || action === 'all-right') {
            src = leftList; dst = rightList;
          } else {
            src = rightList; dst = leftList;
          }
          var items = (action.indexOf('all') === 0)
            ? src.querySelectorAll('.mts-transfer__item')
            : src.querySelectorAll('.mts-transfer__item[aria-selected="true"]');
          var dstItems = dst.querySelector('.mts-transfer__items');
          items.forEach(function(i) {
            i.setAttribute('aria-selected', 'false');
            dstItems.appendChild(i);
          });
          updateCounts();
        });
      });

      // Search
      t.querySelectorAll('.mts-transfer__search input').forEach(function(input) {
        input.addEventListener('input', function() {
          var list = input.closest('.mts-transfer__list');
          var q = input.value.toLowerCase();
          list.querySelectorAll('.mts-transfer__item').forEach(function(it) {
            it.style.display = it.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
          });
        });
      });

      function updateCounts() {
        lists.forEach(function(l) {
          var c = l.querySelector('.mts-transfer__count');
          if (c) c.textContent = l.querySelectorAll('.mts-transfer__item').length;
        });
      }
      updateCounts();
    });
  }

  /* ---- Speed Dials ---- */
  function initSpeedDials() {
    var dials = document.querySelectorAll('.mts-speed-dial');
    if (!dials.length) return;
    dials.forEach(function(d) {
      var fab = d.querySelector('.mts-speed-dial__fab');
      if (!fab) return;
      d.setAttribute('aria-expanded', 'false');
      fab.addEventListener('click', function(e) {
        e.stopPropagation();
        var open = d.getAttribute('aria-expanded') === 'true';
        d.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
    document.addEventListener('click', function(e) {
      dials.forEach(function(d) {
        if (!d.contains(e.target)) d.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        dials.forEach(function(d) { d.setAttribute('aria-expanded', 'false'); });
      }
    });
  }

  /* ---- Tree Tables ---- */
  function initTreeTables() {
    var tables = document.querySelectorAll('.mts-tree-table');
    if (!tables.length) return;
    tables.forEach(function(table) {
      // Hide all non-root rows initially
      table.querySelectorAll('tbody tr').forEach(function(tr) {
        var depth = parseInt(tr.dataset.depth, 10) || 0;
        if (depth > 0) tr.setAttribute('data-hidden', 'true');
      });

      // Toggle buttons
      table.querySelectorAll('.mts-tree-table__toggle').forEach(function(btn) {
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', function() {
          var tr = btn.closest('tr');
          var parentId = tr.dataset.id;
          var open = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', open ? 'false' : 'true');
          toggleChildren(table, parentId, !open);
        });
      });
    });
  }
  function toggleChildren(table, parentId, show) {
    table.querySelectorAll('tbody tr[data-parent="' + parentId + '"]').forEach(function(child) {
      if (show) {
        child.removeAttribute('data-hidden');
      } else {
        child.setAttribute('data-hidden', 'true');
        // Also close any open descendants
        var btn = child.querySelector('.mts-tree-table__toggle[aria-expanded="true"]');
        if (btn) {
          btn.setAttribute('aria-expanded', 'false');
          toggleChildren(table, child.dataset.id, false);
        }
      }
    });
  }

  /* ---- Inline Edits ---- */
  function initInlineEdits() {
    var edits = document.querySelectorAll('.mts-inline-edit');
    if (!edits.length) return;
    edits.forEach(function(edit) {
      var view = edit.querySelector('.mts-inline-edit__view');
      var input = edit.querySelector('.mts-inline-edit__input');
      var saveBtn = edit.querySelector('.mts-inline-edit__btn--save');
      var cancelBtn = edit.querySelector('.mts-inline-edit__btn--cancel');
      var valueEl = edit.querySelector('.mts-inline-edit__value');
      if (!view || !input) return;

      function enter() {
        edit.setAttribute('data-editing', 'true');
        input.value = (valueEl && !valueEl.classList.contains('mts-inline-edit__value--empty'))
          ? valueEl.textContent.trim() : '';
        setTimeout(function() { input.focus(); input.select(); }, 0);
      }
      function exit(save) {
        if (save && valueEl) {
          var v = input.value.trim();
          valueEl.textContent = v || (valueEl.dataset.placeholder || '—');
          valueEl.classList.toggle('mts-inline-edit__value--empty', !v);
          edit.dispatchEvent(new CustomEvent('inline-edit-save', { detail: { value: v }, bubbles: true }));
        }
        edit.setAttribute('data-editing', 'false');
      }

      view.addEventListener('click', enter);
      view.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); }
      });
      if (saveBtn) saveBtn.addEventListener('click', function() { exit(true); });
      if (cancelBtn) cancelBtn.addEventListener('click', function() { exit(false); });
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey && input.tagName !== 'TEXTAREA') { e.preventDefault(); exit(true); }
        if (e.key === 'Escape') { e.preventDefault(); exit(false); }
      });
    });
  }

  /* ---- Spotlight Tour ---- (programmatic API)
     Usage:
       MTSAiSpotlight.start([
         { target: '#step1', title: '...', body: '...' },
         { target: '#step2', title: '...', body: '...' }
       ]);
  */
  window.MTSAiSpotlight = (function() {
    var overlay, cutout, popover, titleEl, bodyEl, stepEl, dotsEl, skipBtn, nextBtn;
    var steps = [], idx = 0;

    function build() {
      if (overlay) return;
      overlay = document.createElement('div');
      overlay.className = 'mts-spotlight';
      overlay.innerHTML =
        '<div class="mts-spotlight__backdrop"></div>' +
        '<div class="mts-spotlight__cutout"></div>' +
        '<div class="mts-spotlight__popover">' +
          '<span class="mts-spotlight__step"></span>' +
          '<h3 class="mts-spotlight__title"></h3>' +
          '<p class="mts-spotlight__body"></p>' +
          '<div class="mts-spotlight__actions">' +
            '<div class="mts-spotlight__progress-dots"></div>' +
            '<div class="mts-spotlight__buttons">' +
              '<button class="mts-spotlight__btn mts-spotlight__btn--skip" type="button">Skip</button>' +
              '<button class="mts-spotlight__btn mts-spotlight__btn--next" type="button">Next</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      cutout = overlay.querySelector('.mts-spotlight__cutout');
      popover = overlay.querySelector('.mts-spotlight__popover');
      titleEl = overlay.querySelector('.mts-spotlight__title');
      bodyEl = overlay.querySelector('.mts-spotlight__body');
      stepEl = overlay.querySelector('.mts-spotlight__step');
      dotsEl = overlay.querySelector('.mts-spotlight__progress-dots');
      skipBtn = overlay.querySelector('.mts-spotlight__btn--skip');
      nextBtn = overlay.querySelector('.mts-spotlight__btn--next');
      skipBtn.addEventListener('click', stop);
      nextBtn.addEventListener('click', next);
    }

    function render() {
      var s = steps[idx];
      if (!s) { stop(); return; }
      var target = (typeof s.target === 'string') ? document.querySelector(s.target) : s.target;
      if (!target) { next(); return; }
      var r = target.getBoundingClientRect();
      var pad = 8;
      cutout.style.top = (r.top - pad) + 'px';
      cutout.style.left = (r.left - pad) + 'px';
      cutout.style.width = (r.width + pad * 2) + 'px';
      cutout.style.height = (r.height + pad * 2) + 'px';

      // Popover below target (or above if not enough space)
      var below = (r.bottom + 220 < window.innerHeight);
      popover.style.left = Math.min(Math.max(r.left, 16), window.innerWidth - 380) + 'px';
      if (below) {
        popover.style.top = (r.bottom + 16) + 'px';
        popover.setAttribute('data-arrow', 'top');
      } else {
        popover.style.top = (r.top - 16 - popover.offsetHeight) + 'px';
        popover.setAttribute('data-arrow', 'bottom');
      }

      stepEl.textContent = 'Step ' + (idx + 1) + ' of ' + steps.length;
      titleEl.textContent = s.title || '';
      bodyEl.textContent = s.body || '';
      nextBtn.textContent = (idx === steps.length - 1) ? 'Finish' : 'Next';
      dotsEl.innerHTML = steps.map(function(_, i) {
        return '<span class="mts-spotlight__progress-dot' + (i === idx ? ' is-active' : '') + '"></span>';
      }).join('');

      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    }

    function start(stepsArr) {
      if (!stepsArr || !stepsArr.length) return;
      build();
      steps = stepsArr;
      idx = 0;
      overlay.classList.add('is-active');
      render();
      window.addEventListener('resize', render);
      document.addEventListener('keydown', onKey);
    }
    function next() {
      idx++;
      if (idx >= steps.length) stop(); else render();
    }
    function stop() {
      if (!overlay) return;
      overlay.classList.remove('is-active');
      window.removeEventListener('resize', render);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
      if (e.key === 'Escape') stop();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
    }

    return { start: start, stop: stop, next: next };
  })();

  /* ----------------------------------------------------------
     Init all
  ---------------------------------------------------------- */
  function init() {
    initScrollProgress();
    initSmoothScroll();
    initHeroRotator();
    initCounters();
    initCountUpFromText();
    initSliders();
    initMultiselect();
    initActionMenus();
    initDataTableSort();
    initRelativeTime();
    initCarousels();
    initTimePickers();
    initRatings();
    initColorPickers();
    initTransferLists();
    initSpeedDials();
    initTreeTables();
    initInlineEdits();
    initScrollReveal();
    initMobileMenu();
    initNavDropdowns();
    initParticles();
    initParallax();
    initStaggerGrid();
    initSegmentedControls();
    initTreeView();
    initSideNav();
    initComboboxes();
    initNumberSteppers();
    initTagInputs();
    initBottomSheets();
    initDrawers();
    initCommandPalette();
    initContextMenus();
    initAccordions();
    initSteppers();
    initPopoverMenus();
    initOTPInputs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
