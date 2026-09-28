/* Tik website: everything except the live demo (that lives in demo.js).
   Plain JavaScript, no libraries. Every part checks that its elements exist,
   so the same file works on the home pages, the privacy pages and 404. */
(function () {
  'use strict';

  var root = document.documentElement;
  var LANG = root.lang === 'en' ? 'en' : 'fa';
  // GoatCounter address, for example 'https://tik-mahyar.goatcounter.com/count'.
  // Empty means no stats are sent.
  var GOATCOUNTER = '';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  var T = {
    fa: {
      copied: 'لینک کپی شد',
      ipad: 'آیپد',
      tablet: 'تبلت',
      screens: { today: 'صفحه‌ی امروز', lists: 'لیست‌ها', editor: 'ویرایش کار', settings: 'تنظیمات' },
      platforms: { ios: 'آیفون', android: 'اندروید' },
      themes: { light: 'حالت روشن', dark: 'حالت تیره' },
      langs: { fa: 'به فارسی', en: 'به انگلیسی' },
      colors: { blue: 'آبی', indigo: 'نیلی', purple: 'بنفش', pink: 'صورتی', red: 'قرمز', orange: 'نارنجی', yellow: 'زرد', green: 'سبز', mint: 'نعنایی', teal: 'سبزآبی', graphite: 'خاکستری' }
    },
    en: {
      copied: 'Link copied',
      ipad: 'iPad',
      tablet: 'Tablet',
      screens: { today: 'The Today screen', lists: 'Lists', editor: 'The task editor', settings: 'Settings' },
      platforms: { ios: 'iPhone', android: 'Android' },
      themes: { light: 'light mode', dark: 'dark mode' },
      langs: { fa: 'in Farsi', en: 'in English' },
      colors: { blue: 'Blue', indigo: 'Indigo', purple: 'Purple', pink: 'Pink', red: 'Red', orange: 'Orange', yellow: 'Yellow', green: 'Green', mint: 'Mint', teal: 'Teal', graphite: 'Graphite' }
    }
  }[LANG];

  // The app's 11 accent colors (light and dark), in the same order as in Settings.
  var ACCENTS = [
    ['blue', '#007AFF', '#0A84FF'], ['indigo', '#5856D6', '#5E5CE6'], ['purple', '#AF52DE', '#BF5AF2'],
    ['pink', '#FF2D55', '#FF375F'], ['red', '#FF3B30', '#FF453A'], ['orange', '#FF9500', '#FF9F0A'],
    ['yellow', '#FFCC00', '#FFD60A'], ['green', '#34C759', '#30D158'], ['mint', '#00C7BE', '#63E6E2'],
    ['teal', '#30B0C7', '#40CBE0'], ['graphite', '#8E8E93', '#8E8E93']
  ];

  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $$(selector, scope) { return [].slice.call((scope || document).querySelectorAll(selector)); }
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function store(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (e) {}
  }
  function later(fn) { if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 1500 }); else setTimeout(fn, 200); }

  /* ---------- Small helpers other scripts use ---------- */
  function buzz(pattern) {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(pattern || 10); } catch (e) {}
  }
  function count(name) {
    var gc = window.goatcounter;
    if (gc && typeof gc.count === 'function') gc.count({ path: name, title: name, event: true });
  }
  window.tik = { buzz: buzz, count: count };

  if (GOATCOUNTER) {
    var gcScript = document.createElement('script');
    gcScript.async = true;
    gcScript.src = '/js/vendor/count.js';
    gcScript.setAttribute('data-goatcounter', GOATCOUNTER);
    document.head.appendChild(gcScript);
  }

  document.addEventListener('click', function (e) {
    var counted = e.target.closest('[data-count]');
    if (counted) count(counted.getAttribute('data-count'));

    // Language links remember the choice and keep the part of the page you were on.
    var langLink = e.target.closest('a[data-lang]');
    if (langLink) {
      var to = langLink.getAttribute('data-lang');
      store('tik-lang', to);
      langLink.href = langLink.getAttribute('href').split('#')[0] + location.hash;
      count('switch-to-' + to);
    }
  });

  /* ---------- "English?" bar ---------- */
  var barClose = $('[data-langbar-close]');
  if (barClose) {
    barClose.addEventListener('click', function () {
      store('tik-langbar', 'closed');
      root.classList.remove('show-langbar');
    });
  }

  /* ---------- Top bar line after scrolling ---------- */
  var topbar = $('#topbar');
  if (topbar) {
    var scrolled = null;
    var onScroll = function () {
      var now = window.scrollY > 4;
      if (now !== scrolled) { scrolled = now; topbar.classList.toggle('is-scrolled', now); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Accent colors ---------- */
  function currentAccent() { return root.getAttribute('data-accent') || 'blue'; }
  function renderAccentButtons() {
    var now = currentAccent();
    $$('[data-accent-choice]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-accent-choice') === now ? 'true' : 'false');
    });
  }
  function setAccent(name) {
    root.setAttribute('data-accent', name);
    store('tik-accent', name);
    renderAccentButtons();
    buzz(10);
  }
  function colorButton(cls, accent, withName) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('data-accent-choice', accent[0]);
    b.style.setProperty('--c-l', accent[1]);
    b.style.setProperty('--c-d', accent[2]);
    if (withName) {
      var swatch = document.createElement('span');
      var name = document.createElement('span');
      name.textContent = T.colors[accent[0]];
      b.appendChild(swatch);
      b.appendChild(name);
    } else {
      b.setAttribute('aria-label', T.colors[accent[0]]);
      b.title = T.colors[accent[0]];
    }
    return b;
  }
  var dots = $('[data-color-dots]');
  var grid = $('[data-color-grid]');
  ACCENTS.forEach(function (a) {
    if (dots) dots.appendChild(colorButton('color-dot', a, false));
    if (grid) grid.appendChild(colorButton('color-opt', a, true));
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-accent-choice]');
    if (b) setAccent(b.getAttribute('data-accent-choice'));
  });
  renderAccentButtons();

  /* ---------- Slide-up sheets ----------
     Built on <dialog>. They close with the close button, a tap outside, Esc,
     swiping down on the top part, or the phone's Back button (a history entry). */
  var openSheet = null;
  var SHEET_MS = 440;

  function sheetOpen(id, opener) {
    var d = document.getElementById(id);
    if (!d || openSheet) return;
    openSheet = d;
    d._opener = opener || document.activeElement;
    if (typeof d.showModal === 'function') d.showModal();
    else d.setAttribute('open', '');
    root.classList.add('sheet-open');
    d.getBoundingClientRect();
    requestAnimationFrame(function () { d.classList.add('is-open'); });
    try { history.pushState({ tikSheet: id }, ''); } catch (e) {}
    buzz(8);
  }

  function sheetClose(fromHistory) {
    var d = openSheet;
    if (!d) return;
    if (!fromHistory && history.state && history.state.tikSheet === d.id) {
      history.back();   // the popstate handler finishes closing
      return;
    }
    openSheet = null;
    d.classList.remove('is-open', 'is-dragging');
    d.style.removeProperty('--drag');
    setTimeout(function () {
      if (d.open && typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
      if (!openSheet) root.classList.remove('sheet-open');
      if (d._opener && d._opener.focus) d._opener.focus({ preventScroll: true });
    }, reduceMotion.matches ? 0 : SHEET_MS);
  }

  window.addEventListener('popstate', function () {
    if (openSheet) sheetClose(true);
  });

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-sheet]');
    if (opener) { e.preventDefault(); sheetOpen(opener.getAttribute('data-sheet'), opener); return; }
    if (e.target.closest('[data-sheet-close]')) { sheetClose(false); return; }
    if (openSheet && e.target === openSheet) sheetClose(false);   // tap outside the panel
  });

  $$('.sheet').forEach(function (d) {
    d.addEventListener('cancel', function (e) { e.preventDefault(); sheetClose(false); });

    // Swipe down on the grab handle or the title row to close (phones only).
    var panel = $('.sheet__panel', d);
    var startY = 0, lastY = 0, lastT = 0, speed = 0, dragging = false, pointer = null;
    panel.addEventListener('pointerdown', function (e) {
      if (window.innerWidth >= 720 || !e.target.closest('.sheet__head, .sheet__grab') || e.target.closest('button')) return;
      dragging = true;
      pointer = e.pointerId;
      startY = lastY = e.clientY;
      lastT = e.timeStamp;
      speed = 0;
      d.classList.add('is-dragging');
      if (panel.setPointerCapture) panel.setPointerCapture(pointer);
    });
    panel.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerId !== pointer) return;
      var dt = e.timeStamp - lastT;
      if (dt > 0) speed = (e.clientY - lastY) / dt;
      lastY = e.clientY;
      lastT = e.timeStamp;
      d.style.setProperty('--drag', Math.max(0, lastY - startY) + 'px');
    });
    function end(e) {
      if (!dragging || e.pointerId !== pointer) return;
      dragging = false;
      d.classList.remove('is-dragging');
      if (lastY - startY > 90 || speed > .55) sheetClose(false);
      else d.style.removeProperty('--drag');
    }
    panel.addEventListener('pointerup', end);
    panel.addEventListener('pointercancel', end);
  });

  /* ---------- Bottom tab bar and top links follow the scroll ---------- */
  var tabbar = $('[data-tabbar]');
  var spyTargets = [['demo', '#top'], ['screens', '#screens'], ['features', '#features'], ['download', '#download'], ['download', '#faq']];
  if (tabbar && window.IntersectionObserver) {
    var drop = $('.tabbar__drop', tabbar);
    var current = null;
    var setActive = function (name, instant) {
      if (name === current) return;
      current = name;
      $$('[data-tab]', tabbar).forEach(function (t) {
        var on = t.getAttribute('data-tab') === name;
        t.classList.toggle('is-active', on);
        if (on) t.setAttribute('aria-current', 'location');
        else t.removeAttribute('aria-current');
      });
      $$('.topnav a').forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + name);
      });
      var tab = $('.tab.is-active', tabbar);
      if (!tab) { drop.classList.add('is-hidden'); return; }
      if (instant) drop.style.transition = 'none';
      drop.classList.remove('is-hidden');
      drop.style.setProperty('--dx', tab.offsetLeft + 'px');
      drop.style.setProperty('--dw', tab.offsetWidth + 'px');
      if (instant) { drop.getBoundingClientRect(); drop.style.transition = ''; }
    };
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setActive(en.target.getAttribute('data-spy'));
      });
    }, { rootMargin: '-42% 0px -52% 0px' });
    spyTargets.forEach(function (pair) {
      var el = $(pair[1]);
      if (el) { el.setAttribute('data-spy', pair[0]); spy.observe(el); }
    });
    setActive('demo', true);
    tabbar.addEventListener('click', function (e) { if (e.target.closest('a')) buzz(6); });
    window.addEventListener('resize', function () { var name = current; current = null; setActive(name, true); });
  }

  /* ---------- Screenshots: three switches and a swipe gallery ---------- */
  var device = root.getAttribute('data-device');
  var shotState = {
    theme: darkScheme.matches ? 'dark' : 'light',
    lang: LANG,
    platform: device === 'android' ? 'android' : device === 'iphone' ? 'ios' : (/Mac/i.test(navigator.platform || '') ? 'ios' : 'android')
  };
  var videoSrcFor = null;   // set by the video part below

  function shotAlt(screen) {
    return T.screens[screen] + ' — ' + T.platforms[shotState.platform] + '، ' + T.themes[shotState.theme] + '، ' + T.langs[shotState.lang];
  }
  if (LANG === 'en') {
    shotAlt = function (screen) {
      return T.screens[screen] + ' on ' + T.platforms[shotState.platform] + ', ' + T.themes[shotState.theme] + ', ' + T.langs[shotState.lang];
    };
  }

  function shotCandidates(screen) {
    var p = '/assets/shots/' + shotState.platform + '/';
    var s = shotState;
    return [
      p + s.lang + '-' + s.theme + '-' + screen + '.webp',
      p + s.lang + '-light-' + screen + '.webp',
      p + 'en-' + s.theme + '-' + screen + '.webp',
      p + 'en-light-' + screen + '.webp'
    ];
  }

  // Show a picture, trying the next file if one is missing.
  function showImage(img, candidates, alt, animate) {
    var i = 0;
    var target = candidates[0];
    img.alt = alt;
    if (img.getAttribute('src') === target) return;
    if (!animate) {
      img.onerror = function () {
        i += 1;
        if (i < candidates.length) img.src = candidates[i];
        else img.onerror = null;
      };
      img.src = target;
      return;
    }
    img.classList.add('is-swapping');
    var probe = new Image();
    probe.onload = function () {
      img.onerror = null;
      img.src = probe.src;
      var done = function () { img.classList.remove('is-swapping'); };
      if (img.decode) img.decode().then(done, done);
      else done();
    };
    probe.onerror = function () {
      i += 1;
      if (i < candidates.length) probe.src = candidates[i];
      else img.classList.remove('is-swapping');
    };
    probe.src = target;
  }

  function renderShots(animate) {
    $$('[data-shot]').forEach(function (img) {
      var screen = img.getAttribute('data-shot');
      showImage(img, shotCandidates(screen), shotAlt(screen), animate);
    });
    $$('[data-extra]').forEach(function (img) {
      var name = img.getAttribute('data-extra');
      var src = '/assets/shots/' + shotState.platform + '/' + name + '.webp';
      showImage(img, [src], img.alt, animate);
    });
    var extras = $('.extras');
    if (extras) extras.setAttribute('data-platform', shotState.platform);
    var cap = $('[data-tablet-caption]');
    if (cap) cap.textContent = shotState.platform === 'ios' ? T.ipad : T.tablet;
    $$('.seg[data-switch]').forEach(function (seg) {
      var value = shotState[seg.getAttribute('data-switch')];
      $$('button', seg).forEach(function (b, i) {
        var on = b.getAttribute('data-value') === value;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        if (on) seg.style.setProperty('--i', i);
      });
    });
  }

  if ($('[data-gallery]')) {
    renderShots(false);
    $$('.seg[data-switch]').forEach(function (seg) {
      var kind = seg.getAttribute('data-switch');
      var choose = function (value, focus) {
        if (shotState[kind] === value) return;
        shotState[kind] = value;
        renderShots(true);
        if (kind === 'platform' && videoSrcFor) videoSrcFor();
        buzz(8);
        if (focus) { var b = $('[data-value="' + value + '"]', seg); if (b) b.focus(); }
      };
      seg.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-value]');
        if (b) choose(b.getAttribute('data-value'), false);
      });
      seg.addEventListener('keydown', function (e) {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].indexOf(e.key) < 0) return;
        e.preventDefault();
        var values = $$('button', seg).map(function (b) { return b.getAttribute('data-value'); });
        var other = values[0] === shotState[kind] ? values[1] : values[0];
        choose(other, true);
      });
    });
  }

  // Dots under a swipe row show which card is in the middle.
  function watchDots(row, dotsEl) {
    if (!row || !dotsEl || !window.IntersectionObserver) return;
    var items = [].slice.call(row.children);
    var marks = [].slice.call(dotsEl.children);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting || en.intersectionRatio < .6) return;
        var index = items.indexOf(en.target);
        marks.forEach(function (m, j) { m.classList.toggle('is-active', j === index); });
      });
    }, { root: row, threshold: [.6] });
    items.forEach(function (it) { io.observe(it); });
  }
  watchDots($('[data-gallery]'), $('[data-dots]'));
  watchDots($('[data-videos]'), $('[data-dots-videos]'));

  /* ---------- Swipe rows with a mouse ----------
     Fingers swipe natively. For a mouse: drag the row, use the arrow buttons,
     or click a dot. Positions are measured on screen, so right-to-left works too. */
  function makeSwipeRow(row, dotsEl) {
    if (!row) return;
    var items = [].slice.call(row.children);
    var rtl = getComputedStyle(row).direction === 'rtl';
    var wrap = document.createElement('div');
    wrap.className = 'swipe';
    row.parentNode.insertBefore(wrap, row);
    wrap.appendChild(row);

    var centerIndex = function () {
      var rr = row.getBoundingClientRect();
      var mid = rr.left + rr.width / 2;
      var best = 0, bestDistance = Infinity;
      items.forEach(function (it, i) {
        var r = it.getBoundingClientRect();
        var distance = Math.abs(r.left + r.width / 2 - mid);
        if (distance < bestDistance) { bestDistance = distance; best = i; }
      });
      return best;
    };
    var goTo = function (i) {
      i = Math.max(0, Math.min(items.length - 1, i));
      var rr = row.getBoundingClientRect();
      var r = items[i].getBoundingClientRect();
      row.scrollBy({ left: (r.left + r.width / 2) - (rr.left + rr.width / 2), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    };

    var labels = LANG === 'fa' ? ['تصویر قبلی', 'تصویر بعدی'] : ['Previous', 'Next'];
    var buttons = [0, 1].map(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'swipe__btn swipe__btn--' + (k ? 'next' : 'prev');
      b.setAttribute('aria-label', labels[k]);
      b.innerHTML = '<svg class="i flip" viewBox="0 0 24 24"><path d="' + (k ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6') + '"/></svg>';
      b.addEventListener('click', function () { goTo(centerIndex() + (k ? 1 : -1)); });
      wrap.appendChild(b);
      return b;
    });
    var updateButtons = function () {
      var i = centerIndex();
      buttons[0].disabled = i === 0;
      buttons[1].disabled = i === items.length - 1;
    };
    var settle = null;
    row.addEventListener('scroll', function () { clearTimeout(settle); settle = setTimeout(updateButtons, 80); }, { passive: true });
    updateButtons();

    if (dotsEl) {
      [].slice.call(dotsEl.children).forEach(function (dot, i) {
        dot.addEventListener('click', function () { goTo(i); });
      });
    }

    // Drag with the mouse. A short drag still moves one picture in that direction.
    var startX = 0, lastX = 0, startLeft = 0, startIndex = 0, dragging = false, moved = false;
    row.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || row.scrollWidth <= row.clientWidth) return;
      dragging = true;
      moved = false;
      startX = lastX = e.clientX;
      startLeft = row.scrollLeft;
      startIndex = centerIndex();
    });
    row.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      lastX = e.clientX;
      var dx = lastX - startX;
      if (!moved && Math.abs(dx) < 5) return;
      if (!moved) {
        moved = true;
        row.classList.add('is-dragging');
        if (row.setPointerCapture) row.setPointerCapture(e.pointerId);
      }
      row.scrollLeft = startLeft - dx;
    });
    var endDrag = function () {
      if (!dragging) return;
      dragging = false;
      if (!moved) return;
      var dx = lastX - startX;
      var target = centerIndex();
      if (target === startIndex && Math.abs(dx) > 40) target += (dx < 0 ? 1 : -1) * (rtl ? -1 : 1);
      goTo(target);
      setTimeout(function () { row.classList.remove('is-dragging'); }, reduceMotion.matches ? 0 : 450);
    };
    row.addEventListener('pointerup', endDrag);
    row.addEventListener('pointercancel', endDrag);
    // A drag must not also count as a click (for example on a video's play button).
    row.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
    row.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }
  makeSwipeRow($('[data-gallery]'), $('[data-dots]'));
  makeSwipeRow($('[data-videos]'), $('[data-dots-videos]'));

  /* ---------- Videos ----------
     They load only when they come close, play only while on screen, and wait
     for a tap when the visitor asked for less motion or turned on Data Saver. */
  var videoRow = $('[data-videos]');
  if (videoRow && window.IntersectionObserver) {
    var figs = $$('.vid', videoRow);
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    var autoplay = !reduceMotion.matches && !saveData;
    var near = false;

    var fileFor = function (name) {
      var base = '/assets/video/' + shotState.platform + '-' + name;
      return name === 'language' ? base : base + '-' + LANG;
    };
    var start = function (fig) {
      var v = $('video', fig);
      var src = fileFor(fig.getAttribute('data-video')) + '.mp4';
      if (v.getAttribute('src') !== src) { fig.classList.remove('is-ready'); v.src = src; v.load(); }
      var p = v.play();
      if (p && p.catch) p.catch(function () { fig.classList.add('needs-tap'); });
    };
    var setPosters = function () {
      figs.forEach(function (fig) {
        var poster = fileFor(fig.getAttribute('data-video')) + '.webp';
        $('video', fig).poster = poster;
        $('.shot__frame', fig).style.backgroundImage = 'url("' + poster + '")';
      });
    };
    videoSrcFor = function () {
      if (near) setPosters();
      figs.forEach(function (fig) {
        var v = $('video', fig);
        if (v.getAttribute('src')) {
          var wasPlaying = !v.paused;
          fig.classList.remove('is-ready');
          v.removeAttribute('src');
          v.load();
          if (wasPlaying) start(fig);
        }
      });
    };

    figs.forEach(function (fig) {
      var v = $('video', fig);
      // Show the video only once its first frame is really on screen.
      v.addEventListener('playing', function () {
        var show = function () { fig.classList.add('is-ready'); };
        if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(show);
        else show();
      });
      if (!autoplay) fig.classList.add('needs-tap');
      $('.vid__play', fig).addEventListener('click', function () {
        fig.classList.remove('needs-tap');
        fig._wanted = true;
        start(fig);
      });
    });

    new IntersectionObserver(function (entries) {
      if (entries.some(function (en) { return en.isIntersecting; }) && !near) { near = true; setPosters(); }
    }, { rootMargin: '600px 0px' }).observe(videoRow);

    var playWhenSeen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var fig = en.target;
        var v = $('video', fig);
        if (en.isIntersecting) { if (autoplay || fig._wanted) start(fig); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: .55 });
    figs.forEach(function (fig) { playWhenSeen.observe(fig); });
  }

  /* ---------- Copy link (for in-app browsers) ---------- */
  function fallbackCopy(text) {
    var t = document.createElement('textarea');
    t.value = text;
    t.setAttribute('readonly', '');
    t.style.position = 'fixed';
    t.style.opacity = '0';
    document.body.appendChild(t);
    t.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(t);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy-link]');
    if (!b) return;
    var url = location.href.split('#')[0] + '#download';
    var label = $('span', b);
    var done = function () {
      if (!label) return;
      var old = label.textContent;
      label.textContent = T.copied;
      setTimeout(function () { label.textContent = old; }, 2200);
      buzz(10);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, function () { fallbackCopy(url); done(); });
    else { fallbackCopy(url); done(); }
  });
})();
