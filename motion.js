// Optional enhancement only: page is fully readable and complete without this file.
export function init(root) {
  root = root || document;
  if (root.__aseekMotion) return;
  root.__aseekMotion = true;

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
      for (const t of targets) t.a.setAttribute('data-active', String(t === current));
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

  if (reduce) return;

  // --- reveal on enter ----------------------------------------------------
  const dy = narrow ? 8 : 20;
  const step = narrow ? 45 : 70;

  const prep = (el, delay, kind) => {
    if (kind === 'line') {
      el.style.transformOrigin = 'left center';
      el.style.transform = 'scaleX(0)';
      el.style.transition = 'transform .7s cubic-bezier(.22,.7,.2,1) ' + delay + 'ms';
    } else {
      el.style.opacity = '0';
      el.style.transform = 'translate3d(0,' + dy + 'px,0)';
      el.style.transition =
        'opacity .45s ease ' + delay + 'ms, transform .55s cubic-bezier(.22,.7,.2,1) ' + delay + 'ms';
    }
    el.style.willChange = 'opacity, transform';
  };

  const show = (el, kind) => {
    el.style.opacity = '';
    el.style.transform = kind === 'line' ? 'scaleX(1)' : 'translate3d(0,0,0)';
    setTimeout(() => {
      el.style.willChange = '';
      el.style.transition = '';
      if (kind === 'line') el.style.transform = '';
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

  if (!('IntersectionObserver' in window)) {
    items.forEach((i) => show(i.el, i.kind));
    return;
  }

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
}
