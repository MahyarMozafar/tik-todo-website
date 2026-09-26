/* The live demo: a small, working copy of Tik's Today screen.
   Tap a task to tick it, tap + to add one. Nothing is saved; a reload starts over. */
(function () {
  'use strict';

  var app = document.querySelector('[data-demo]');
  if (!app) return;

  var LANG = document.documentElement.lang === 'en' ? 'en' : 'fa';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var MAX_TASKS = 7;   // what fits on the demo screen

  var T = {
    fa: {
      count: function (done, total) { return done + ' از ' + total + ' انجام شد'; },
      allDone: 'همه‌ی کارهای امروز انجام شد!',
      otherTab: 'این بخش در خود اپ است. تیک را دانلود کن و ببین.',
      full: 'این دمو تا 7 کار جا دارد؛ خود اپ هرچقدر بخواهی.',
      add: 'افزودن کار',
      close: 'بستن'
    },
    en: {
      count: function (done, total) { return done + ' of ' + total + ' done'; },
      allDone: 'All done for today!',
      otherTab: 'That part is in the real app. Download Tik to see it.',
      full: 'This demo holds 7 tasks. The real app holds as many as you like.',
      add: 'Add task',
      close: 'Close'
    }
  }[LANG];

  var list = app.querySelector('[data-demo-list]');
  var progress = app.querySelector('[data-demo-progress]');
  var countEl = app.querySelector('[data-demo-count]');
  var pctEl = app.querySelector('[data-demo-pct]');
  var bar = app.querySelector('[data-demo-bar]');
  var fab = app.querySelector('[data-demo-fab]');
  var form = app.querySelector('[data-demo-form]');
  var input = app.querySelector('[data-demo-input]');
  var toastEl = app.querySelector('[data-demo-toast]');
  var canvas = app.querySelector('[data-demo-confetti]');

  function buzz(pattern) { if (window.tik) window.tik.buzz(pattern); }

  var clock = 0;       // grows with every tick, so the newest done task goes first in the done group
  var nextOrder = 0;
  var tasks = [].slice.call(list.children).map(function (li) {
    var done = li.classList.contains('is-done');
    return { el: li, order: nextOrder++, done: done, doneAt: done ? 0 : -1 };
  });

  function sorted() {
    return tasks.slice().sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return a.done ? b.doneAt - a.doneAt : a.order - b.order;
    });
  }

  // Move rows smoothly: remember where each row is, change the order, then
  // slide every row from its old place to the new one (only transform moves).
  function flip(change) {
    var focused = document.activeElement;
    var before = new Map();
    tasks.forEach(function (t) { before.set(t.el, t.el.getBoundingClientRect().top); });
    change();
    if (!reduceMotion.matches) {
      var moved = [];
      tasks.forEach(function (t) {
        if (!before.has(t.el) || !t.el.parentNode) return;
        var dy = before.get(t.el) - t.el.getBoundingClientRect().top;
        if (Math.abs(dy) < 1) return;
        t.el.style.transition = 'none';
        t.el.style.transform = 'translateY(' + dy + 'px)';
        moved.push(t.el);
      });
      if (moved.length) {
        list.getBoundingClientRect();
        moved.forEach(function (el) { el.style.transition = ''; el.style.transform = ''; });
      }
    }
    if (focused && list.contains(focused) && document.activeElement !== focused) focused.focus({ preventScroll: true });
  }

  function reorder() {
    var order = sorted();
    var same = order.every(function (t, i) { return list.children[i] === t.el; });
    if (same) return;
    flip(function () { order.forEach(function (t) { list.appendChild(t.el); }); });
  }

  var wasAllDone = false;
  function update() {
    var total = tasks.length;
    var done = tasks.filter(function (t) { return t.done; }).length;
    var allDone = total > 0 && done === total;
    countEl.textContent = allDone ? T.allDone : T.count(done, total);
    pctEl.textContent = (total ? Math.round(done / total * 100) : 0) + '%';
    bar.style.setProperty('--p', total ? done / total : 0);
    progress.classList.toggle('is-all-done', allDone);
    if (allDone && !wasAllDone) { confetti(); buzz([14, 70, 24]); }
    wasAllDone = allDone;
  }

  var reorderTimer = null;
  function toggle(task) {
    task.done = !task.done;
    task.doneAt = task.done ? ++clock : -1;
    task.el.classList.toggle('is-done', task.done);
    task.el.querySelector('[role="checkbox"]').setAttribute('aria-checked', task.done ? 'true' : 'false');
    buzz(task.done ? 12 : 6);
    update();
    // Like the app: the tick shows first, then the row slides to its new place.
    clearTimeout(reorderTimer);
    reorderTimer = setTimeout(reorder, reduceMotion.matches ? 0 : 420);
  }

  list.addEventListener('click', function (e) {
    var button = e.target.closest('.task__btn');
    if (!button) return;
    var task = tasks.filter(function (t) { return t.el.contains(button); })[0];
    if (task) toggle(task);
  });

  /* ---------- Quick add ---------- */
  function newRow(title) {
    var li = document.createElement('li');
    li.className = 'task is-new';
    li.innerHTML = '<button class="task__btn" type="button" role="checkbox" aria-checked="false">' +
      '<span class="task__check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
      '<span class="task__body"><span class="task__title" dir="auto"></span></span>' +
      '<span class="task__prio" aria-hidden="true"></span></button>';
    li.querySelector('.task__title').textContent = title;
    li.addEventListener('animationend', function () { li.classList.remove('is-new'); });
    return li;
  }

  function addTask(title) {
    var dropped = null;
    if (tasks.length >= MAX_TASKS) {
      // Make room by letting go of the oldest done task (it sits at the very bottom).
      dropped = tasks.filter(function (t) { return t.done; }).sort(function (a, b) { return a.doneAt - b.doneAt; })[0];
      if (!dropped) { toast(T.full); buzz([8, 40, 8]); return false; }
    }
    var task = { el: newRow(title), order: nextOrder++, done: false, doneAt: -1 };
    flip(function () {
      if (dropped) {
        list.removeChild(dropped.el);
        tasks.splice(tasks.indexOf(dropped), 1);
      }
      var firstDone = sorted().filter(function (t) { return t.done; })[0];
      list.insertBefore(task.el, firstDone ? firstDone.el : null);
    });
    tasks.push(task);
    update();
    buzz(10);
    return true;
  }

  function setAdding(on) {
    app.classList.toggle('is-adding', on);
    fab.setAttribute('aria-expanded', on ? 'true' : 'false');
    fab.setAttribute('aria-label', on ? T.close : T.add);
    input.tabIndex = on ? 0 : -1;
    if (on) input.focus({ preventScroll: true });
    else { input.value = ''; input.blur(); }
  }

  fab.addEventListener('click', function () {
    setAdding(!app.classList.contains('is-adding'));
    buzz(8);
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var title = input.value.replace(/\s+/g, ' ').trim();
    if (!title) return;
    if (addTask(title)) input.value = '';
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setAdding(false); fab.focus(); }
  });

  /* ---------- Other tabs and the toast ---------- */
  var toastTimer = null;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-shown'); }, 2600);
  }
  [].slice.call(app.querySelectorAll('[data-demo-tab]')).forEach(function (tab) {
    tab.addEventListener('click', function () { toast(T.otherTab); buzz(6); });
  });

  /* ---------- Confetti, like the app's burst when the day is done ---------- */
  function confetti() {
    if (reduceMotion.matches || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    var W = rect.width, H = rect.height, u = W / 380;
    var colors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55'];
    var parts = [];
    for (var i = 0; i < 90; i++) {
      parts.push({
        x: Math.random() * W,
        y: -Math.random() * H * .45 - 8 * u,
        vx: (Math.random() - .5) * 1.8 * u,
        vy: (1.5 + Math.random() * 2.8) * u,
        a: Math.random() * Math.PI,
        va: (Math.random() - .5) * .28,
        w: (5 + Math.random() * 6) * u,
        h: (3 + Math.random() * 4) * u,
        c: colors[i % colors.length],
        round: Math.random() < .3,
        sway: Math.random() * 6.28
      });
    }
    var begin = null, last = null, length = 2800;
    function frame(now) {
      if (begin === null) { begin = last = now; }
      var t = now - begin;
      var step = Math.min(34, now - last) / 16.7;
      last = now;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = t > length - 700 ? Math.max(0, (length - t) / 700) : 1;
      for (var k = 0; k < parts.length; k++) {
        var p = parts[k];
        p.vy += .045 * u * step;
        p.x += (p.vx + Math.sin(t / 320 + p.sway) * .35 * u) * step;
        p.y += p.vy * step;
        p.a += p.va * step;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.h * .6, 0, 6.2832); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (t < length) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    }
    requestAnimationFrame(frame);
  }

  update();
})();
