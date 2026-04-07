/* MTSAi — contextual interaction helpers (tabs, toggle+detail, TOC spy, in-view highlights, accordions) */
(function () {
  'use strict';

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initVerticalTabs(tablist) {
    if (!tablist || tablist.dataset.mtsEngagementInit) return;
    tablist.dataset.mtsEngagementInit = '1';
    var tabs = [].slice.call(tablist.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;
    var panels = tabs.map(function (t) {
      var id = t.getAttribute('aria-controls');
      return id ? document.getElementById(id) : null;
    });

    function select(idx) {
      var n = Math.max(0, Math.min(idx, tabs.length - 1));
      tabs.forEach(function (t, i) {
        var on = i === n;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var p = panels[i];
        if (!p) return;
        if (on) {
          p.hidden = false;
          if (p.classList) p.classList.add('is-active');
        } else {
          p.hidden = true;
          if (p.classList) p.classList.remove('is-active');
        }
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        select(i);
        tab.focus();
      });
    });

    tablist.addEventListener('keydown', function (e) {
      var cur = tabs.findIndex(function (t) {
        return t.getAttribute('aria-selected') === 'true';
      });
      var vert = tablist.getAttribute('aria-orientation') === 'vertical';
      if (e.key === 'ArrowDown' || (!vert && e.key === 'ArrowRight')) {
        e.preventDefault();
        var next = Math.min(cur + 1, tabs.length - 1);
        select(next);
        tabs[next].focus();
      } else if (e.key === 'ArrowUp' || (!vert && e.key === 'ArrowLeft')) {
        e.preventDefault();
        var prev = Math.max(cur - 1, 0);
        select(prev);
        tabs[prev].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        select(0);
        tabs[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        select(tabs.length - 1);
        tabs[tabs.length - 1].focus();
      }
    });

    select(0);
  }

  function initToggleDetail(root) {
    if (!root || root.dataset.mtsEngagementInit) return;
    root.dataset.mtsEngagementInit = '1';
    var stack = root.querySelector('[data-toggle-stack]');
    var buttons = stack
      ? [].slice.call(stack.querySelectorAll('button[data-eng-heading]'))
      : [];
    var panel = root.querySelector('[data-toggle-panel]');
    if (!buttons.length || !panel) return;

    var kickerEl = panel.querySelector('[data-eng-panel-kicker]');
    var titleEl = panel.querySelector('[data-eng-panel-heading]');
    var bodyEl = panel.querySelector('[data-eng-panel-body]');

    function apply(btn) {
      if (kickerEl) kickerEl.textContent = btn.getAttribute('data-eng-kicker') || '';
      if (titleEl) titleEl.textContent = btn.getAttribute('data-eng-heading') || '';
      if (bodyEl) bodyEl.textContent = btn.getAttribute('data-eng-body') || '';
      if (btn.id) panel.setAttribute('aria-labelledby', btn.id);
    }

    function select(i) {
      var n = Math.max(0, Math.min(i, buttons.length - 1));
      buttons.forEach(function (b, j) {
        var on = j === n;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      apply(buttons[n]);
    }

    buttons.forEach(function (btn, i) {
      if (!btn.id) btn.id = 'eng-toggle-' + Math.random().toString(36).slice(2, 9);
      btn.type = 'button';
      btn.addEventListener('click', function () {
        select(i);
        btn.focus();
      });
    });

    stack.addEventListener('keydown', function (e) {
      var cur = buttons.findIndex(function (b) {
        return b.getAttribute('aria-pressed') === 'true';
      });
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        var nx = Math.min(cur + 1, buttons.length - 1);
        select(nx);
        buttons[nx].focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var pr = Math.max(cur - 1, 0);
        select(pr);
        buttons[pr].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        select(0);
        buttons[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        select(buttons.length - 1);
        buttons[buttons.length - 1].focus();
      }
    });

    select(0);
  }

  function initTocScrollSpy(aside) {
    if (!aside || aside.dataset.mtsEngagementInit) return;
    aside.dataset.mtsEngagementInit = '1';
    var links = [].slice.call(aside.querySelectorAll('a[href^="#"]'));
    if (!links.length) return;
    var ids = links.map(function (a) {
      return a.getAttribute('href').slice(1);
    });
    var sections = ids
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);
    if (!sections.length) return;

    var rm =
      aside.getAttribute('data-toc-root-margin') || '-18% 0px -65% 0px';
    var activeClass =
      aside.getAttribute('data-toc-active-class') || 'active';

    var byId = {};
    links.forEach(function (a) {
      byId[a.getAttribute('href').slice(1)] = a;
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var id = en.target.id;
          if (byId[id]) {
            links.forEach(function (l) {
              l.classList.remove(activeClass);
            });
            byId[id].classList.add(activeClass);
          }
        });
      },
      { root: null, rootMargin: rm, threshold: 0 }
    );

    sections.forEach(function (s) {
      io.observe(s);
    });
  }

  function initInViewHighlight(root) {
    if (!root || root.dataset.mtsEngagementInit) return;
    root.dataset.mtsEngagementInit = '1';
    var items = [].slice.call(root.querySelectorAll('[data-inview-item]'));
    if (!items.length) return;
    var th = parseFloat(root.getAttribute('data-inview-threshold') || '0.5');
    var cls =
      root.getAttribute('data-inview-active-class') || 'eng-inview-active';

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          items.forEach(function (el) {
            el.classList.remove(cls);
          });
          en.target.classList.add(cls);
        });
      },
      { threshold: th }
    );

    items.forEach(function (el) {
      io.observe(el);
    });
    items[0].classList.add(cls);
  }

  function initExclusiveDetails(root) {
    if (!root || root.dataset.mtsEngagementInit) return;
    root.dataset.mtsEngagementInit = '1';
    var details = [].slice.call(root.querySelectorAll(':scope > details'));
    details.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        details.forEach(function (o) {
          if (o !== d) o.open = false;
        });
      });
    });
  }

  function initPhaseStrip(root) {
    if (!root || root.dataset.mtsEngagementInit) return;
    root.dataset.mtsEngagementInit = '1';
    var buttons = [].slice.call(
      root.querySelectorAll('button[data-phase-title-text]')
    );
    var panel = root.querySelector('[data-phase-panel]');
    if (!buttons.length || !panel) return;

    var titleEl = panel.querySelector('[data-phase-title]');
    var bodyEl = panel.querySelector('[data-phase-body]');
    var metaEl = panel.querySelector('[data-phase-meta]');

    function show(i) {
      var n = Math.max(0, Math.min(i, buttons.length - 1));
      var btn = buttons[n];
      buttons.forEach(function (b, j) {
        var on = j === n;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      if (titleEl)
        titleEl.textContent = btn.getAttribute('data-phase-title-text') || '';
      if (bodyEl)
        bodyEl.textContent = btn.getAttribute('data-phase-body-text') || '';
      if (metaEl)
        metaEl.textContent = btn.getAttribute('data-phase-meta-text') || '';

      var targetSel = btn.getAttribute('data-phase-scroll-target');
      if (targetSel && !reducedMotion()) {
        var el = document.querySelector(targetSel);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    buttons.forEach(function (btn, i) {
      btn.type = 'button';
      btn.addEventListener('click', function () {
        show(i);
        btn.focus();
      });
    });

    root.addEventListener('keydown', function (e) {
      var cur = buttons.findIndex(function (b) {
        return b.getAttribute('aria-pressed') === 'true';
      });
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        var nx = Math.min(cur + 1, buttons.length - 1);
        show(nx);
        buttons[nx].focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        var pr = Math.max(cur - 1, 0);
        show(pr);
        buttons[pr].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        show(0);
        buttons[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        show(buttons.length - 1);
        buttons[buttons.length - 1].focus();
      }
    });

    show(0);
  }

  function openPolicyFoldFromHash() {
    var id = (location.hash || '').replace(/^#/, '');
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.tagName === 'DETAILS' && el.classList.contains('policy-fold')) {
      el.open = true;
    }
  }

  function initPolicyPrintExpand() {
    if (window.__mtsPolicyPrintBound) return;
    window.__mtsPolicyPrintBound = true;
    window.addEventListener('beforeprint', function () {
      document.querySelectorAll('details.policy-fold').forEach(function (d) {
        d.dataset.mtsPrintWasOpen = d.open ? '1' : '';
        d.open = true;
      });
    });
    window.addEventListener('afterprint', function () {
      document.querySelectorAll('details.policy-fold').forEach(function (d) {
        if (d.dataset.mtsPrintWasOpen !== '1') d.open = false;
        delete d.dataset.mtsPrintWasOpen;
      });
    });
  }

  function boot() {
    initPolicyPrintExpand();
    openPolicyFoldFromHash();
    window.addEventListener('hashchange', openPolicyFoldFromHash);

    document
      .querySelectorAll('[data-engagement="vertical-tabs"]')
      .forEach(function (el) {
        var tl = el.matches('[role="tablist"]')
          ? el
          : el.querySelector('[role="tablist"]');
        if (tl) initVerticalTabs(tl);
      });

    document
      .querySelectorAll('[data-engagement="toggle-detail"]')
      .forEach(initToggleDetail);

    document
      .querySelectorAll('[data-engagement="toc-spy"]')
      .forEach(initTocScrollSpy);

    document
      .querySelectorAll('[data-engagement="inview-list"]')
      .forEach(initInViewHighlight);

    document
      .querySelectorAll('[data-engagement="exclusive-details"]')
      .forEach(initExclusiveDetails);

    document
      .querySelectorAll('[data-engagement="phase-strip"]')
      .forEach(initPhaseStrip);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.MTSaiEngagement = {
    initVerticalTabs: initVerticalTabs,
    initToggleDetail: initToggleDetail,
    initTocScrollSpy: initTocScrollSpy,
    initInViewHighlight: initInViewHighlight,
    initExclusiveDetails: initExclusiveDetails,
    initPhaseStrip: initPhaseStrip,
    boot: boot
  };
})();
