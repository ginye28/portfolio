(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;

  /* masked headline: lines rise from behind their baseline once fonts are ready */
  const go = () => root.classList.add('go');
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(() => requestAnimationFrame(() => setTimeout(go, 30)));
  } else {
    setTimeout(go, 50);
  }

  /* work index: the active name drives the sticky frame */
  const projs = $$('.proj');
  const shots = $$('.shot');
  const setActive = (el) => {
    projs.forEach((p) => p.classList.toggle('is-active', p === el));
    shots.forEach((s) => s.classList.toggle('is-on', s.dataset.id === el.dataset.shot));
  };
  projs.forEach((p) => {
    p.addEventListener('mouseenter', () => setActive(p));
    p.addEventListener('focus', () => setActive(p));
  });

  /* the live thing: replay recorded results with the defence off and on */
  const panel = $('#panel');
  if (panel) {
    panel.dataset.mode = 'off';
    const caseBtns = $$('.case-btn');
    const modeBtns = $$('.seg-btn');
    const cases = $$('.case', panel);
    const replay = () => {
      panel.removeAttribute('data-sent');
      void panel.offsetWidth;
      panel.setAttribute('data-sent', '');
    };

    caseBtns.forEach((b) => b.addEventListener('click', () => {
      caseBtns.forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
      cases.forEach((c) => c.classList.toggle('is-on', c.dataset.id === b.dataset.case));
      panel.removeAttribute('data-sent');
    }));

    modeBtns.forEach((b) => b.addEventListener('click', () => {
      modeBtns.forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
      panel.dataset.mode = b.dataset.mode;
      if (panel.hasAttribute('data-sent')) replay();
    }));

    $('#send').addEventListener('click', replay);
  }

  /* entrances: heading, then text, then picture, staggered once */
  const targets = [
    ...$$('.work .h2'),
    ...$$('.try-ctrl > *'),
    ...$$('.panel'),
    ...$$('.tile'),
    ...$$('.about .h2-big, .facts > div, .about-text > p'),
    ...$$('.st'),
    ...$$('.h2-log'),
    ...$$('.logtab .grp'),
    ...$$('.crow'),
  ];
  targets.forEach((el) => el.classList.add('reveal'));
  $$('.reveal').forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 70}ms`);
  });

  const show = (el) => {
    el.classList.add('in');
    setTimeout(() => { el.classList.remove('reveal', 'in'); el.style.removeProperty('--d'); }, 1500);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    $$('.reveal').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('in'));
  }
})();
