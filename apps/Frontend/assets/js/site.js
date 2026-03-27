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
    // Group observer — adds .visible to parent, CSS cascades to .reveal children
    const groupSelectors = ['.fade-section', '.blur-fade-in', '.blur-fade-left', '.blur-fade-right', '.reveal-group'];
    const groups = document.querySelectorAll(groupSelectors.join(','));

    // Individual element observer — .reveal / .scroll-reveal / .scroll-reveal-blur / .scroll-reveal-scale
    const itemSelectors = ['.reveal:not(.reveal-group)', '.scroll-reveal', '.scroll-reveal-blur', '.scroll-reveal-scale'];
    const items = document.querySelectorAll(itemSelectors.join(','));

    if (prefersReducedMotion) {
      groups.forEach(el => el.classList.add('revealed', 'visible'));
      items.forEach(el => el.classList.add('visible', 'is-visible'));
      return;
    }

    const groupObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('revealed', 'visible');
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });
    groups.forEach(el => groupObs.observe(el));

    const itemObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible', 'is-visible');
          itemObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -80px 0px', threshold: 0.08 });
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
