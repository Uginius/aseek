// Optional enhancement only: page is fully readable and complete without this file.
// Скрытие блоков живёт в CSS под классом .m-on, который вешает и через 2 с
// безусловно снимает встроенный скрипт в <head>. Здесь только тайминги и показ.
export function init(root) {
  root = root || document;
  if (root.__aseekMotion) return;
  root.__aseekMotion = true;

  const off = typeof window.__aseekReveal === 'function' ? window.__aseekReveal : () => {};
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = window.innerWidth < 760;

  // --- anchor nav: active item ---------------------------------------------
  const links = Array.from(root.querySelectorAll('[data-nav] a[href^="#"]'));
  const targets = links
    .map((a) => ({ a, el: root.querySelector(a.getAttribute('href')) }))
    .filter((t) => t.el);

  if (targets.length) {
    let queued = false;
    const spy = () => {
      queued = false;
      const line = window.scrollY + 140;
      let current = targets[0];
      for (const t of targets) if (t.el.offsetTop <= line) current = t;
      if (window.scrollY < 80) current = null;
      for (const t of targets) {
        if (t === current) t.a.setAttribute('aria-current', 'true');
        else t.a.removeAttribute('aria-current');
      }
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!queued) {
          queued = true;
          requestAnimationFrame(spy);
        }
      },
      { passive: true }
    );
    spy();
  }

  if (reduce) {
    off();
    return;
  }

  // --- reveal on enter ----------------------------------------------------
  // dy вынесен в CSS-переменную --reveal-dy (20px / 8px под 760px)
  const step = narrow ? 45 : 70;

  const prep = (el, delay, kind) => {
    el.style.transition =
      kind === 'line'
        ? 'transform .7s cubic-bezier(.22,.7,.2,1) ' + delay + 'ms'
        : 'opacity .45s ease ' + delay + 'ms, transform .55s cubic-bezier(.22,.7,.2,1) ' + delay + 'ms';
    el.style.willChange = 'opacity, transform';
  };

  const show = (el, kind) => {
    el.classList.add('is-in');
    setTimeout(() => {
      el.style.willChange = '';
      el.style.transition = '';
      if (kind === 'line') el.classList.add('is-done');
    }, 1400);
  };

  const items = [];
  root.querySelectorAll('[data-reveal]').forEach((el) => {
    const kind = el.getAttribute('data-reveal') || 'up';
    const group = el.closest('[data-stagger]');
    let delay = 0;
    if (group) {
      const sibs = Array.from(group.querySelectorAll('[data-reveal]'));
      delay = Math.min(sibs.indexOf(el), 9) * step;
    }
    prep(el, delay, kind);
    items.push({ el, kind });
  });

  const showAll = () => items.forEach((i) => show(i.el, i.kind));

  if (!('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  // подписка отдельно от подготовки: если наблюдатель выбросит исключение,
  // блоки всё равно показываются, не дожидаясь предохранителя в <head>
  try {
    // показ теперь наш: снимаем предохранитель из <head>, иначе он через 2 с
    // проявит всю страницу и появление по прокрутке работать перестанет
    if (typeof window.__aseekKeep === 'function') window.__aseekKeep();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const rec = items.find((i) => i.el === e.target);
          show(e.target, rec ? rec.kind : 'up');
          io.unobserve(e.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    items.forEach((i) => io.observe(i.el));
  } catch (err) {
    off();
    showAll();
  }
}
