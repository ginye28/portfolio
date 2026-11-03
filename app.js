(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

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
    function replay() {
      panel.removeAttribute('data-sent');
      void panel.offsetWidth;
      panel.setAttribute('data-sent', '');
    }

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
    ...$$('.band-copy > *'),
    ...$$('.try-ctrl > *'),
    ...$$('.panel'),
    ...$$('.facts > div'),
    ...$$('.about-text > p'),
    ...$$('.rec-word, .rec'),
    ...$$('.giant, .log-sub'),
    ...$$('.bars details'),
    ...$$('.hero-copy > *, .hero-shot'),
  ];
  targets.forEach((el) => el.classList.add('reveal'));
  $$('.reveal').forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 6) * 70}ms`);
  });

  const show = (el) => {
    el.classList.add('in');
    setTimeout(() => { el.classList.remove('reveal', 'in'); el.style.removeProperty('--d'); }, 1500);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.reveal').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('in'));
  }

  /* rows of the contact list rise as they arrive */
  $$('.crow').forEach((el) => el.classList.add('reveal'));
  $$('.crow').forEach((el, i) => el.style.setProperty('--d', `${i * 60}ms`));
  if ('IntersectionObserver' in window) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { show(e.target); io2.unobserve(e.target); } });
    }, { threshold: 0.2 });
    $$('.crow').forEach((el) => io2.observe(el));
  } else {
    $$('.crow').forEach((el) => el.classList.add('in'));
  }
})();
