(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* replay consoles: one per finding, defence off or on */
  $$('.console').forEach((c) => {
    c.dataset.mode = 'off';
    const segs = $$('.seg-btn', c);
    const replay = () => {
      c.removeAttribute('data-sent');
      void c.offsetWidth;
      c.setAttribute('data-sent', '');
    };
    segs.forEach((b) => b.addEventListener('click', () => {
      segs.forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      c.dataset.mode = b.dataset.mode;
      if (c.hasAttribute('data-sent')) replay();
    }));
    $('.send', c).addEventListener('click', replay);
  });

  /* log: filter by status, hide project headings with no visible rows */
  const rows = $$('.logtab tbody tr');
  const fbtns = $$('.f-btn');
  const applyFilter = (f) => {
    let group = null;
    let count = 0;
    const flush = () => { if (group) group.hidden = count === 0; };
    rows.forEach((r) => {
      if (r.classList.contains('grp')) { flush(); group = r; count = 0; return; }
      const show = f === 'all' || r.dataset.s === f;
      r.hidden = !show;
      if (show) count += 1;
    });
    flush();
  };
  fbtns.forEach((b) => b.addEventListener('click', () => {
    fbtns.forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    applyFilter(b.dataset.f);
  }));

  /* table of contents follows the section in view */
  const links = $$('.toc a');
  const sections = links.map((a) => $(a.getAttribute('href')));
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('is-on', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    sections.forEach((s) => s && spy.observe(s));
  }

  /* entrances: each block rises once as it arrives */
  const targets = [
    ...$$('.digest > div'),
    ...$$('.docinfo > div'),
    ...$$('.finding'),
    ...$$('.sys'),
    ...$$('.filter, .logtab'),
    ...$$('.about-text, .traits > div, .tools > div'),
    ...$$('.clinks li'),
  ];
  targets.forEach((el) => el.classList.add('rise'));
  $$('.rise').forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('rise'));
    el.style.transitionDelay = Math.min(sibs.indexOf(el), 4) * 70 + 'ms';
  });
  const show = (el) => {
    el.classList.add('in');
    setTimeout(() => { el.classList.remove('rise', 'in'); el.style.transitionDelay = ''; }, 1200);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    $$('.rise').forEach((el) => io.observe(el));
  } else {
    $$('.rise').forEach((el) => el.classList.add('in'));
  }
})();
