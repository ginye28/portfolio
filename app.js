(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = matchMedia('(max-width: 640px)');

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* hero: lines rise from behind their baseline once fonts are ready */
  const go = () => root.classList.add('go');
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(() => requestAnimationFrame(() => setTimeout(go, 30)));
  } else {
    setTimeout(go, 50);
  }

  /* folders: one open at a time */
  const folders = $$('.folder');
  const syncFolders = () => folders.forEach((f) => { $('.fbody', f).inert = !f.classList.contains('open'); });
  $$('.fbtn').forEach((btn) => btn.addEventListener('click', () => {
    const f = btn.closest('.folder');
    const willOpen = !f.classList.contains('open');
    folders.forEach((x) => { x.classList.remove('open'); $('.fbtn', x).setAttribute('aria-expanded', 'false'); });
    if (willOpen) { f.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    syncFolders();
  }));
  syncFolders();

  /* ledger: stamps land when their row arrives */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const s = e.target;
        const i = $$('.stamp', s.closest('.lgroup')).indexOf(s);
        setTimeout(() => s.classList.add('in'), i * 120);
        io.unobserve(s);
      });
    }, { threshold: 0.9 });
    $$('.stamp').forEach((s) => io.observe(s));
  } else {
    $$('.stamp').forEach((s) => s.classList.add('in'));
  }

  /* the wipe: a pinned stage; scroll or drag the handle to move the defence in */
  const wipe = $('#try');
  let stageState = null;

  const buildStage = () => {
    const data = $$('.case', wipe).map((a) => {
      const side = (m) => {
        const r = $('.res-' + m, a);
        const v = $('.verdict', r);
        const num = $('b', v).textContent;
        return { num, word: v.textContent.replace(num, '').trim(), out: $('pre', r).textContent.trim(), why: $('.why', r).textContent.trim() };
      };
      return { short: a.dataset.short, title: $('.case-h', a).textContent.trim(), req: $('.req', a).textContent.trim(), off: side('off'), on: side('on') };
    });

    const track = el('div', 'wipe-track');
    const stage = el('div', 'stage');
    const head = el('div', 'stage-head');
    head.appendChild(el('h2', 'h2', '막힌 장면'));
    const steps = el('div', 'steps');
    steps.setAttribute('role', 'group');
    steps.setAttribute('aria-label', '시험 장면 고르기');
    const stepBtns = data.map((d, i) => {
      const b = el('button', 'step-btn', d.short);
      b.type = 'button';
      b.addEventListener('click', () => {
        const total = track.offsetHeight - innerHeight;
        window.scrollTo({ top: track.offsetTop + ((i + 0.85) / data.length) * total });
      });
      steps.appendChild(b);
      return b;
    });
    head.appendChild(steps);

    const before = el('div', 'lay lay-before');
    const after = el('div', 'lay lay-after');
    after.setAttribute('aria-hidden', 'true');
    const divider = el('div', 'divider');
    const handle = el('button', 'handle', '↔');
    handle.type = 'button';
    handle.setAttribute('role', 'slider');
    handle.setAttribute('aria-label', '방어 전과 후를 가르는 손잡이');
    handle.setAttribute('aria-valuemin', '0');
    handle.setAttribute('aria-valuemax', '100');
    divider.appendChild(handle);
    const hint = el('p', 'stage-hint', '스크롤하거나 가운데 손잡이를 끌어 보세요');

    const live = el('p', 'sr');
    stage.append(before, after, divider, head, hint, live);
    track.appendChild(stage);
    wipe.appendChild(track);
    wipe.classList.add('built');

    const fill = (layer, side, d) => {
      layer.textContent = '';
      const big = el('div', 'lay-big');
      const num = el('b');
      num.dataset.t = side.num;
      const word = el('span');
      word.dataset.t = side.word;
      big.append(num, word);
      const info = el('div', 'lay-info');
      const pre = el('pre');
      pre.textContent = d.req + '\n' + side.out;
      info.append(el('p', null, d.title), pre, el('p', null, side.why));
      layer.append(big, info);
    };

    let cur = -1;
    let override = null;
    let dragging = false;

    const render = (x) => {
      stage.style.setProperty('--x', x + '%');
      handle.setAttribute('aria-valuenow', String(Math.round(100 - x)));
      return x;
    };

    const update = () => {
      const r = track.getBoundingClientRect();
      const total = track.offsetHeight - innerHeight;
      const p = clamp(-r.top / total, 0, 1);
      const n = data.length;
      const f = Math.min(p * n, n - 0.0001);
      const i = Math.floor(f);
      const t = f - i;
      if (i !== cur) {
        cur = i;
        override = null;
        fill(before, data[i].off, data[i]);
        fill(after, data[i].on, data[i]);
        live.textContent = data[i].title + '. 방어 전: ' + data[i].off.num + ' ' + data[i].off.word + '. 방어 후: ' + data[i].on.num + ' ' + data[i].on.word + '.';
        stepBtns.forEach((b, k) => { b.classList.toggle('is-on', k === i); b.setAttribute('aria-pressed', String(k === i)); });
      }
      let x = t < 0.2 ? 100 : t > 0.7 ? 0 : 100 - ((t - 0.2) / 0.5) * 100;
      if (override !== null) x = override;
      render(x);
      stageState = { i, x, d: data[i], inside: r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5 };
    };

    const pointerToX = (e) => {
      const r = stage.getBoundingClientRect();
      return clamp(phone.matches ? ((e.clientY - r.top) / r.height) * 100 : ((e.clientX - r.left) / r.width) * 100, 0, 100);
    };
    handle.addEventListener('pointerdown', (e) => { dragging = true; handle.setPointerCapture(e.pointerId); e.preventDefault(); });
    handle.addEventListener('pointermove', (e) => { if (!dragging) return; override = pointerToX(e); update(); hud(); });
    const stop = () => { dragging = false; };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
    handle.addEventListener('keydown', (e) => {
      const back = ['ArrowLeft', 'ArrowUp'].includes(e.key);
      const fwd = ['ArrowRight', 'ArrowDown'].includes(e.key);
      if (!back && !fwd && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      const base = override !== null ? override : stageState ? stageState.x : 100;
      override = e.key === 'Home' ? 100 : e.key === 'End' ? 0 : clamp(base + (back ? 8 : -8), 0, 100);
      update(); hud();
    });

    return { update, clearOverride: () => { if (!dragging) override = null; } };
  };

  /* the readout */
  const hudEl = $('#hud');
  const hudDepth = $('#hud-depth');
  const hudWhere = $('#hud-where');
  const hudStatus = $('#hud-status');
  const chapters = [
    ['#try', '막힌 장면'],
    ['#work', '배포한 프로젝트'],
    ['#log', '트러블슈팅 기록'],
    ['#about', '소개'],
    ['#contact', '연락'],
  ].map(([sel, name]) => [$(sel), name]);

  const hud = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    hudDepth.textContent = Math.round(clamp(scrollY / max, 0, 1) * 100) + '%';
    hudEl.classList.toggle('on', scrollY > innerHeight * 0.5);
    let where = '—';
    let status = '—';
    for (const [node, name] of chapters) {
      if (!node) continue;
      const r = node.getBoundingClientRect();
      if (r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5) {
        where = name;
        if (node.id === 'try' && stageState) {
          where = name + ' · ' + stageState.d.short;
          const s = stageState.x < 50 ? stageState.d.on : stageState.d.off;
          status = s.num + ' ' + s.word;
        }
      }
    }
    hudWhere.textContent = where;
    hudStatus.textContent = status;
  };

  let wipeCtl = null;
  if (wipe && !reduced) wipeCtl = buildStage();

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (wipeCtl) { wipeCtl.clearOverride(); wipeCtl.update(); }
      hud();
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  if (wipeCtl) wipeCtl.update();
  hud();
})();
