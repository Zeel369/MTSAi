/**
 * MTSAi Design System — Component Library v1.0
 * Components: Accordion · Dialog · Tabs · Command · Toast · Carousel · Tooltip · Alert · Form
 */

(function(DS) {
'use strict';

/* ─────────────────────────────────────────
   ACCORDION
───────────────────────────────────────── */
DS.Accordion = {
  init(root) {
    const container = typeof root === 'string' ? document.querySelector(root) : root;
    if (!container) return;
    container.querySelectorAll('.ds-acc-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => DS.Accordion.toggle(trigger));
    });
  },
  toggle(trigger) {
    const item = trigger.closest('.ds-acc-item');
    const body = item.querySelector('.ds-acc-body');
    const isOpen = item.classList.contains('open');
    // Optional: close siblings in same accordion
    const parent = item.closest('.ds-acc');
    if (parent && parent.dataset.single !== undefined) {
      parent.querySelectorAll('.ds-acc-item.open').forEach(openItem => {
        if (openItem !== item) DS.Accordion.close(openItem);
      });
    }
    isOpen ? DS.Accordion.close(item) : DS.Accordion.open(item);
  },
  open(item) {
    item.classList.add('open');
    item.querySelector('.ds-acc-body').classList.add('open');
    const trigger = item.querySelector('.ds-acc-trigger');
    trigger.setAttribute('aria-expanded', 'true');
  },
  close(item) {
    item.classList.remove('open');
    item.querySelector('.ds-acc-body').classList.remove('open');
    const trigger = item.querySelector('.ds-acc-trigger');
    trigger.setAttribute('aria-expanded', 'false');
  },
  initAll() {
    document.querySelectorAll('.ds-acc').forEach(acc => DS.Accordion.init(acc));
  }
};

/* ─────────────────────────────────────────
   DIALOG / MODAL
───────────────────────────────────────── */
DS.Dialog = {
  active: null,
  init() {
    // Trigger buttons
    document.querySelectorAll('[data-dialog]').forEach(btn => {
      btn.addEventListener('click', () => DS.Dialog.open(btn.dataset.dialog));
    });
    // Close buttons inside dialogs
    document.querySelectorAll('.ds-dialog-close, [data-dialog-close]').forEach(btn => {
      btn.addEventListener('click', () => DS.Dialog.close());
    });
    // Backdrop click
    document.querySelectorAll('.ds-dialog-backdrop').forEach(bd => {
      bd.addEventListener('click', () => DS.Dialog.close());
    });
    // Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && DS.Dialog.active) DS.Dialog.close();
    });
  },
  open(id) {
    const wrap = document.getElementById('dialog-' + id);
    if (!wrap) return;
    DS.Dialog.active = wrap;
    wrap.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Focus first focusable element
    requestAnimationFrame(() => {
      const focusable = wrap.querySelector('input, button:not(.ds-dialog-close), textarea, select, [href]');
      if (focusable) focusable.focus();
    });
  },
  close() {
    if (!DS.Dialog.active) return;
    DS.Dialog.active.classList.remove('open');
    document.body.style.overflow = '';
    DS.Dialog.active = null;
  }
};

/* ─────────────────────────────────────────
   TABS
───────────────────────────────────────── */
DS.Tabs = {
  init(root) {
    const container = typeof root === 'string' ? document.querySelector(root) : root;
    if (!container) return;
    container.querySelectorAll('.ds-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => DS.Tabs.activate(btn));
    });
  },
  activate(btn) {
    const tabList = btn.closest('.ds-tab-list');
    const tabs    = tabList.closest('.ds-tabs');
    if (!tabs) return;
    // Deactivate all
    tabs.querySelectorAll('.ds-tab-btn').forEach(b => b.classList.remove('active'));
    tabs.querySelectorAll('.ds-tab-panel').forEach(p => p.classList.remove('active'));
    // Activate selected
    btn.classList.add('active');
    const panelId = btn.dataset.tab;
    const panel   = tabs.querySelector(`[data-tab-panel="${panelId}"]`);
    if (panel) panel.classList.add('active');
  },
  initAll() {
    document.querySelectorAll('.ds-tabs').forEach(t => DS.Tabs.init(t));
  }
};

/* ─────────────────────────────────────────
   COMMAND PALETTE  (Cmd+K / Ctrl+K)
───────────────────────────────────────── */
DS.Command = {
  el: null, input: null, items: [], selectedIdx: 0, allItems: [],
  init() {
    this.el    = document.getElementById('ds-cmd');
    this.input = document.getElementById('ds-cmd-input');
    if (!this.el) return;
    this.allItems = Array.from(this.el.querySelectorAll('.ds-cmd-item'));
    this.items    = this.allItems;

    // Keyboard shortcut
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); this.toggle(); }
      if (!this.el.classList.contains('open')) return;
      if (e.key === 'Escape')    { e.preventDefault(); this.close(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); this.move(1); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); this.move(-1); }
      if (e.key === 'Enter')     { e.preventDefault(); this.select(); }
    });

    // Input filter
    if (this.input) {
      this.input.addEventListener('input', () => this.filter());
    }

    // Backdrop
    this.el.querySelector('.ds-cmd-backdrop')?.addEventListener('click', () => this.close());
  },
  open() {
    this.el.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (this.input) { this.input.value = ''; this.filter(); this.input.focus(); }
    this.selectedIdx = 0; this.updateSelection();
  },
  close() {
    this.el.classList.remove('open');
    document.body.style.overflow = '';
  },
  toggle() { this.el.classList.contains('open') ? this.close() : this.open(); },
  filter() {
    const q = this.input.value.toLowerCase().trim();
    let visible = 0;
    this.allItems.forEach(item => {
      const text   = item.textContent.toLowerCase();
      const match  = !q || text.includes(q);
      item.style.display = match ? '' : 'none';
      if (match) { visible++; this.items = this.allItems.filter(i => i.style.display !== 'none'); }
    });
    // No results
    let noRes = this.el.querySelector('.ds-cmd-no-results');
    if (!noRes) {
      noRes = Object.assign(document.createElement('div'), { className: 'ds-cmd-no-results' });
      this.el.querySelector('.ds-cmd-box').appendChild(noRes);
    }
    noRes.textContent = visible === 0 ? `No results for "${this.input.value}"` : '';
    noRes.style.display = visible === 0 ? 'block' : 'none';
    this.selectedIdx = 0; this.updateSelection();
  },
  move(dir) {
    const vis = this.allItems.filter(i => i.style.display !== 'none');
    this.selectedIdx = Math.max(0, Math.min(vis.length - 1, this.selectedIdx + dir));
    this.updateSelection();
  },
  updateSelection() {
    const vis = this.allItems.filter(i => i.style.display !== 'none');
    vis.forEach((i, idx) => i.classList.toggle('ds-selected', idx === this.selectedIdx));
    vis[this.selectedIdx]?.scrollIntoView({ block: 'nearest' });
  },
  select() {
    const vis = this.allItems.filter(i => i.style.display !== 'none');
    const item = vis[this.selectedIdx];
    if (item) { const a = item.querySelector('a'); a ? (window.location = a.href) : item.click(); }
    this.close();
  }
};

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
DS.Toast = {
  container: null,
  init() {
    this.container = document.getElementById('ds-toasts');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'ds-toasts';
      document.body.appendChild(this.container);
    }
  },
  show({ title, msg = '', type = 'info', duration = 4000 }) {
    if (!this.container) this.init();
    const icons = { info:'info', success:'check_circle', warning:'warning', error:'error' };
    const toast = document.createElement('div');
    toast.className = `ds-toast ds-toast--${type}`;
    toast.innerHTML = `
      <span class="ds-toast-icon material-symbols-outlined">${icons[type]}</span>
      <div class="ds-toast-body">
        <div class="ds-toast-title">${title}</div>
        ${msg ? `<div class="ds-toast-msg">${msg}</div>` : ''}
      </div>
      <button class="ds-toast-close material-symbols-outlined">close</button>`;
    this.container.appendChild(toast);
    toast.querySelector('.ds-toast-close').addEventListener('click', () => this._dismiss(toast));
    if (duration > 0) setTimeout(() => this._dismiss(toast), duration);
    return toast;
  },
  _dismiss(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('ds-toast-exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  },
  success(title, msg, d) { return this.show({ title, msg, type:'success', duration:d }); },
  error(title, msg, d)   { return this.show({ title, msg, type:'error',   duration:d }); },
  warning(title, msg, d) { return this.show({ title, msg, type:'warning', duration:d }); },
  info(title, msg, d)    { return this.show({ title, msg, type:'info',    duration:d }); }
};

/* ─────────────────────────────────────────
   CAROUSEL  (Embla-pattern)
───────────────────────────────────────── */
DS.Carousel = function(el) {
  if (typeof el === 'string') el = document.querySelector(el);
  if (!el) return;
  const track  = el.querySelector('.ds-carousel-track');
  const slides = el.querySelectorAll('.ds-carousel-slide');
  const dots   = el.querySelectorAll('.ds-carousel-dot');
  const prev   = el.querySelector('.ds-carousel-prev');
  const next   = el.querySelector('.ds-carousel-next');
  let idx = 0, startX = 0, isDrag = false, startScroll = 0;

  function goTo(n) {
    idx = Math.max(0, Math.min(slides.length - 1, n));
    track.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    if (prev) prev.style.opacity = idx === 0 ? '.3' : '1';
    if (next) next.style.opacity = idx === slides.length - 1 ? '.3' : '1';
  }
  if (prev) prev.addEventListener('click', () => goTo(idx - 1));
  if (next) next.addEventListener('click', () => goTo(idx + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

  // Drag / swipe
  track.addEventListener('pointerdown', e => {
    isDrag = true; startX = e.clientX; startScroll = idx;
    track.classList.add('ds-dragging'); track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', e => {
    if (!isDrag) return;
    const diff = startX - e.clientX;
    const w    = el.offsetWidth;
    track.style.transform = `translateX(calc(-${startScroll * 100}% - ${diff}px))`;
  });
  track.addEventListener('pointerup', e => {
    if (!isDrag) return; isDrag = false;
    track.classList.remove('ds-dragging');
    const diff = startX - e.clientX;
    if (Math.abs(diff) > 60) goTo(diff > 0 ? startScroll + 1 : startScroll - 1);
    else goTo(startScroll);
  });

  goTo(0);
  return { goTo, next: () => goTo(idx + 1), prev: () => goTo(idx - 1) };
};

DS.Carousel.initAll = function() {
  document.querySelectorAll('.ds-carousel').forEach(el => new DS.Carousel(el));
};

/* ─────────────────────────────────────────
   ALERT DISMISS
───────────────────────────────────────── */
DS.Alert = {
  init() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.ds-alert-close');
      if (!btn) return;
      const alert = btn.closest('.ds-alert');
      if (!alert) return;
      alert.classList.add('ds-exit');
      alert.addEventListener('animationend', () => alert.remove(), { once: true });
    });
  }
};

/* ─────────────────────────────────────────
   SPOTLIGHT (cursor-tracked glow on cards)
───────────────────────────────────────── */
DS.Spotlight = {
  init() {
    document.querySelectorAll('[data-spotlight]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top)  + 'px');
      });
    });
  }
};

/* ─────────────────────────────────────────
   FORM VALIDATION
───────────────────────────────────────── */
DS.Form = {
  init(formEl, onSuccess) {
    if (typeof formEl === 'string') formEl = document.querySelector(formEl);
    if (!formEl) return;
    formEl.addEventListener('submit', async e => {
      e.preventDefault();
      const valid = DS.Form.validate(formEl);
      if (valid && typeof onSuccess === 'function') onSuccess(formEl);
    });
    // Live validation on blur
    formEl.querySelectorAll('.ds-input, .ds-select, .ds-textarea').forEach(input => {
      input.addEventListener('blur', () => DS.Form.validateField(input));
    });
  },
  validate(form) {
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      if (!DS.Form.validateField(field)) valid = false;
    });
    return valid;
  },
  validateField(field) {
    const value = field.value.trim();
    let msg = '';
    if (field.hasAttribute('required') && !value) msg = 'This field is required.';
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = 'Enter a valid email address.';
    DS.Form.setError(field, msg);
    return !msg;
  },
  setError(field, msg) {
    field.classList.toggle('ds-err', !!msg);
    let errEl = field.parentElement.querySelector('.ds-field-err');
    if (msg) {
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'ds-field-err';
        field.after(errEl);
      }
      errEl.textContent = msg;
    } else if (errEl) {
      errEl.remove();
    }
  }
};

/* ─────────────────────────────────────────
   JOB ACCORDION  (careers page)
───────────────────────────────────────── */
DS.Jobs = {
  init() {
    document.querySelectorAll('.ds-job-header').forEach(header => {
      header.addEventListener('click', () => {
        const job  = header.closest('.ds-job');
        const body = job.querySelector('.ds-job-body');
        const isOpen = job.classList.contains('open');
        // Close others
        document.querySelectorAll('.ds-job.open').forEach(j => {
          j.classList.remove('open');
          j.querySelector('.ds-job-body').classList.remove('open');
        });
        if (!isOpen) { job.classList.add('open'); body.classList.add('open'); }
      });
    });
  }
};

/* ─────────────────────────────────────────
   COUNTER ANIMATION  (shared)
───────────────────────────────────────── */
DS.Counter = {
  format(val, el) {
    const sfx = el.dataset.suffix || '';
    const fmt = el.dataset.format || '';
    if (fmt === 'currency') {
      if (val >= 1e9) return '$' + (val/1e9).toFixed(1)+'B';
      if (val >= 1e6) return '$' + (val/1e6).toFixed(0)+'M';
    }
    if (fmt === 'compact') {
      if (val >= 1e6) return (val/1e6).toFixed(1)+'M'+sfx;
      if (val >= 1e3) return (val/1e3).toFixed(0)+'K'+sfx;
    }
    return val.toLocaleString() + sfx;
  },
  animate(el) {
    const target = parseInt(el.dataset.target || '0');
    const dur    = 2200;
    const start  = performance.now();
    function step(now) {
      const p   = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = DS.Counter.format(Math.round(ease * target), el);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  },
  initAll() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        DS.Counter.animate(e.target); io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-counter]').forEach(el => io.observe(el));
  }
};

/* ─────────────────────────────────────────
   PROGRESS BARS  (shared)
───────────────────────────────────────── */
DS.ProgressBar = {
  initAll() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('go'); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.pb').forEach(el => io.observe(el));
  }
};

/* ─────────────────────────────────────────
   FADE-UP SCROLL ANIMATIONS  (shared)
───────────────────────────────────────── */
DS.FadeUp = {
  initAll() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const delay = parseFloat(e.target.style.transitionDelay || '0') * 1000;
        setTimeout(() => e.target.classList.add('in'), delay);
        io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('.fu').forEach(el => io.observe(el));
  }
};

/* ─────────────────────────────────────────
   NAV  (scroll detect + mobile menu)
───────────────────────────────────────── */
DS.Nav = {
  init() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    // Scroll opacity — authoritative handler (overrides any inline version)
    const onNavScroll = () => {
      nav.style.background = window.scrollY > 60 ? 'rgba(5,5,5,.92)' : 'rgba(5,5,5,.02)';
      nav.style.boxShadow  = window.scrollY > 60 ? '0 1px 0 rgba(255,153,51,.08)' : 'none';
    };
    window.addEventListener('scroll', onNavScroll, { passive:true });
    onNavScroll(); // apply immediately on load

    // Hamburger
    const hbg = document.getElementById('hbg');
    const mob = document.getElementById('mob-menu');
    const hb1 = document.getElementById('hb1');
    const hb2 = document.getElementById('hb2');
    const hb3 = document.getElementById('hb3');
    if (!hbg || !mob) return;

    const openMenu = () => {
      mob.classList.add('open');
      hbg.setAttribute('aria-expanded', 'true');
      hbg.setAttribute('aria-label', 'Close navigation menu');
      if(hb1){hb1.style.transform='rotate(45deg) translateY(7px)';}
      if(hb2){hb2.style.opacity='0';}
      if(hb3){hb3.style.transform='rotate(-45deg) translateY(-7px)';}
    };
    const closeMenu = () => {
      mob.classList.remove('open');
      hbg.setAttribute('aria-expanded', 'false');
      hbg.setAttribute('aria-label', 'Open navigation menu');
      if(hb1){hb1.style.transform='';}
      if(hb2){hb2.style.opacity='';}
      if(hb3){hb3.style.transform='';}
    };
    hbg.addEventListener('click', openMenu);
    document.getElementById('mob-close')?.addEventListener('click', closeMenu);
    document.querySelectorAll('.mob-l').forEach(l => l.addEventListener('click', closeMenu));
  }
};

/* ─────────────────────────────────────────
   SCROLL PROGRESS BAR  (shared)
───────────────────────────────────────── */
DS.ScrollBar = {
  init() {
    const bar = document.getElementById('scroll-bar');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const p = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
      bar.style.width = p + '%';
    }, { passive:true });
  }
};

/* ─────────────────────────────────────────
   BOOT  — init everything on DOMContentLoaded
───────────────────────────────────────── */
/* ─── Popover ─────────────────────────────────────── */
DS.Popover = {
  init() {
    document.querySelectorAll('[data-popover]').forEach(trigger => {
      const targetId = trigger.dataset.popover;
      const popover  = targetId ? document.getElementById(targetId) : trigger.closest('.ds-popover');
      const wrap     = popover || trigger.closest('.ds-popover');
      if (!wrap) return;

      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = wrap.classList.contains('open');
        document.querySelectorAll('.ds-popover.open').forEach(p => p.classList.remove('open'));
        if (!isOpen) wrap.classList.add('open');
      });
    });

    // auto-init triggers inside .ds-popover that have no data-popover
    document.querySelectorAll('.ds-popover > .ds-popover-trigger:not([data-popover])').forEach(trigger => {
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const wrap = trigger.closest('.ds-popover');
        const isOpen = wrap.classList.contains('open');
        document.querySelectorAll('.ds-popover.open').forEach(p => p.classList.remove('open'));
        if (!isOpen) wrap.classList.add('open');
      });
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.ds-popover.open').forEach(p => p.classList.remove('open'));
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape')
        document.querySelectorAll('.ds-popover.open').forEach(p => p.classList.remove('open'));
    });
  }
};

/* ─── Sheet / Drawer ──────────────────────────────── */
DS.Sheet = {
  _lock() { document.body.style.overflow = 'hidden'; },
  _unlock() { document.body.style.overflow = ''; },

  open(panelId) {
    const panel   = document.getElementById(panelId);
    const overlay = document.querySelector(`.ds-sheet-overlay[data-sheet="${panelId}"]`)
                 || document.getElementById(panelId + '-overlay');
    if (!panel) return;
    panel.classList.add('open');
    if (overlay) overlay.classList.add('open');
    this._lock();
    panel.setAttribute('aria-hidden', 'false');
  },

  close(panelId) {
    const panel   = document.getElementById(panelId);
    const overlay = document.querySelector(`.ds-sheet-overlay[data-sheet="${panelId}"]`)
                 || document.getElementById(panelId + '-overlay');
    if (!panel) return;
    panel.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    this._unlock();
    panel.setAttribute('aria-hidden', 'true');
  },

  init() {
    // open triggers: data-sheet-open="panelId"
    document.querySelectorAll('[data-sheet-open]').forEach(btn => {
      btn.addEventListener('click', () => DS.Sheet.open(btn.dataset.sheetOpen));
    });
    // close triggers: data-sheet-close="panelId" or inside panel
    document.querySelectorAll('[data-sheet-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.sheetClose || btn.closest('.ds-sheet-panel')?.id;
        if (id) DS.Sheet.close(id);
      });
    });
    // overlay click closes
    document.querySelectorAll('.ds-sheet-overlay').forEach(overlay => {
      overlay.addEventListener('click', () => {
        const id = overlay.dataset.sheet;
        if (id) DS.Sheet.close(id);
      });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.ds-sheet-panel.open').forEach(p => DS.Sheet.close(p.id));
      }
    });
  }
};

/* ─── Toggle / Switch ────────────────────────────── */
DS.Toggle = {
  init() {
    document.querySelectorAll('[data-toggle-target]').forEach(input => {
      const targetId = input.dataset.toggleTarget;
      const target   = document.getElementById(targetId);
      if (!target) return;
      const apply = () => {
        target.classList.toggle(input.dataset.toggleClass || 'hidden', !input.checked);
      };
      input.addEventListener('change', apply);
      apply();
    });
  }
};

/* ─── Dropdown Menu ──────────────────────────────── */
DS.Dropdown = {
  _close(menu) {
    menu.classList.remove('open');
    const trigger = document.querySelector(`[data-dropdown="${menu.id}"]`)
                 || menu.closest('.ds-dropdown')?.querySelector('.ds-dropdown-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  },

  init() {
    document.querySelectorAll('.ds-dropdown-trigger, [data-dropdown]').forEach(trigger => {
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const wrap = trigger.closest('.ds-dropdown');
        if (!wrap) return;
        const menu = wrap.querySelector('.ds-dropdown-menu');
        if (!menu) return;
        const isOpen = wrap.classList.contains('open');
        // close all
        document.querySelectorAll('.ds-dropdown.open').forEach(d => d.classList.remove('open'));
        if (!isOpen) {
          wrap.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
          // focus first item
          const first = menu.querySelector('.ds-dropdown-item:not(.ds-dropdown-item--disabled)');
          if (first) first.focus();
        }
      });
    });

    // keyboard nav inside menus
    document.addEventListener('keydown', e => {
      const activeMenu = document.querySelector('.ds-dropdown.open .ds-dropdown-menu');
      if (!activeMenu) return;
      const items = [...activeMenu.querySelectorAll('.ds-dropdown-item:not(.ds-dropdown-item--disabled)')];
      const idx   = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); }
      if (e.key === 'Escape')    { document.querySelectorAll('.ds-dropdown.open').forEach(d => d.classList.remove('open')); }
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.ds-dropdown.open').forEach(d => d.classList.remove('open'));
    });
  }
};

/* ─── Data Table ─────────────────────────────────── */
DS.DataTable = {
  _sortTable(table, colIdx, dir) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    const rows = [...tbody.querySelectorAll('tr')];
    rows.sort((a, b) => {
      const aVal = a.cells[colIdx]?.textContent.trim() || '';
      const bVal = b.cells[colIdx]?.textContent.trim() || '';
      const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
      const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));
      if (!isNaN(aNum) && !isNaN(bNum)) return dir === 'asc' ? aNum - bNum : bNum - aNum;
      return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    rows.forEach(r => tbody.appendChild(r));
  },

  initAll() {
    document.querySelectorAll('.ds-dt').forEach(table => {
      table.querySelectorAll('thead th[data-sort]').forEach((th, idx) => {
        th.addEventListener('click', () => {
          const current = th.getAttribute('data-sort');
          const next    = current === 'asc' ? 'desc' : 'asc';
          // reset all
          table.querySelectorAll('thead th[data-sort]').forEach(h => h.setAttribute('data-sort', ''));
          th.setAttribute('data-sort', next);
          DS.DataTable._sortTable(table, idx, next);
        });
      });
    });
  }
};

/* ─── Stagger ────────────────────────────────────── */
DS.Stagger = {
  // Call before DS.FadeUp.initAll() so delays are set
  initAll() {
    document.querySelectorAll('[data-stagger]').forEach(container => {
      const step = parseInt(container.dataset.stagger) || 70;
      const kids = container.querySelectorAll(':scope > *');
      kids.forEach((child, i) => {
        if (!child.classList.contains('fu')) child.classList.add('fu');
        child.style.transitionDelay = (i * step) + 'ms';
      });
    });
  }
};

/* ─── Chapter Navigator ──────────────────────────── */
DS.ChapterNav = {
  init() {
    const nav   = document.getElementById('chapter-nav');
    if (!nav) return;
    const idEl  = nav.querySelector('.chapter-id');
    const nmEl  = nav.querySelector('.chapter-name');
    const secs  = document.querySelectorAll('section[data-chapter]');
    if (!secs.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        if (idEl) idEl.textContent = e.target.dataset.chapter;
        if (nmEl) nmEl.textContent = e.target.dataset.chapterTitle || '';
        nav.classList.add('vis');
      });
    }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });

    secs.forEach(s => io.observe(s));

    // Hide when above first section
    const firstSec = secs[0];
    const hideIo = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      const rect = firstSec.getBoundingClientRect();
      if (rect.top > 0) nav.classList.remove('vis');
    }, { threshold: 0 });
    hideIo.observe(document.getElementById('top-anchor') || document.body.firstElementChild);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  DS.Nav.init();
  DS.ScrollBar.init();
  DS.Accordion.initAll();
  DS.Dialog.init();
  DS.Tabs.initAll();
  DS.Command.init();
  DS.Toast.init();
  DS.Carousel.initAll();
  DS.Alert.init();
  DS.Spotlight.init();
  DS.Counter.initAll();
  DS.ProgressBar.initAll();
  DS.Stagger.initAll();   // must run before FadeUp
  DS.FadeUp.initAll();
  DS.Jobs.init();
  DS.Popover.init();
  DS.Sheet.init();
  DS.Toggle.init();
  DS.Dropdown.init();
  DS.DataTable.initAll();
  DS.ChapterNav.init();
});

})(window.DS = window.DS || {});
