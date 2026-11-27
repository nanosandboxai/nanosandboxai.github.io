// Shared 3D kit for the "agent in jail" sketches. Needs three.js r128 + OrbitControls (global THREE).
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NSJ = (window.NSJ = { reduce });
  const C = (NSJ.C = { coral: 0xff6b6b, steel: 0xa7b0ba, concrete: 0x2a2e35, floor: 0x1c1f24, dark: 0x22262c, green: 0x28c840, amber: 0xffbd2e, blue: 0x6ea2ff, bg: 0x0b0d10 });
  NSJ.lerp = (a, b, p) => a + (b - a) * p;
  NSJ.ease = p => (p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  NSJ.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // Renderer, camera, lights, orbit controls, render loop.
  NSJ.stage = (el, o = {}) => {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    el.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(o.bg ?? C.bg);
    scene.fog = new THREE.Fog(scene.background, o.fogNear ?? 20, o.fogFar ?? 55);
    const camera = new THREE.PerspectiveCamera(o.fov ?? 40, 1, 0.1, 200);
    camera.position.set(...(o.cam || [8, 6, 10]));
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(...(o.target || [0, 1.2, 0]));
    controls.enableDamping = true; controls.enablePan = false;
    controls.minDistance = o.minD ?? 5; controls.maxDistance = o.maxD ?? 32;
    controls.maxPolarAngle = o.maxPolar ?? Math.PI * 0.47;
    controls.autoRotate = !reduce && o.autoRotate !== false; controls.autoRotateSpeed = o.rotSpeed ?? 0.5;
    controls.addEventListener('start', () => (controls.autoRotate = false));
    scene.add(new THREE.HemisphereLight(0xa9bccf, 0x1a1410, o.hemi ?? 0.55));
    const key = new THREE.DirectionalLight(0xffffff, o.keyI ?? 0.85);
    key.position.set(6, 12, 7); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, far: 40 });
    scene.add(key);
    const ticks = [], clock = new THREE.Clock();
    const size = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h, false); renderer.domElement.style.cssText = 'width:100%;height:100%;display:block'; camera.aspect = w / h; camera.updateProjectionMatrix(); };
    size(); addEventListener('resize', size); if ('ResizeObserver' in window) new ResizeObserver(size).observe(el);
    let visible = true, first = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(es => (visible = es[0].isIntersecting)).observe(el);
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) { clock.getDelta(); return; }
      let dt = Math.min(clock.getDelta(), 0.05);
      if (reduce && !first) dt = 0;
      first = false;
      ticks.forEach(f => f(dt, clock.elapsedTime));
      controls.update(); renderer.render(scene, camera);
    })();
    return { scene, camera, renderer, controls, key, onTick: f => ticks.push(f) };
  };

  const box = (w, h, d, m) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.castShadow = true; me.receiveShadow = true; return me; };
  NSJ.box = box;
  NSJ.mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.7, metalness: o.m ?? 0.1, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: o.t ?? false, opacity: o.o ?? 1 });

  // Monitor face: >_ while working, >:) when scheming, x_x when blocked, -_- when sulking.
  NSJ.face = () => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 96;
    const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
    const set = (mode = 'work') => {
      const map = { work: ['>_', '#7dffb0'], scheme: ['>:)', '#ffbd2e'], blocked: ['x_x', '#ff6b6b'], sad: ['-_-', '#8a9099'], alert: ['!!', '#ff6b6b'], dig: ['>_<', '#ffbd2e'] };
      const [txt, col] = map[mode] || [mode, '#7dffb0'];
      g.fillStyle = '#06080a'; g.fillRect(0, 0, 128, 96);
      g.fillStyle = col; g.font = 'bold 38px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 64, 50);
      g.fillStyle = 'rgba(255,255,255,.05)'; for (let y = 0; y < 96; y += 4) g.fillRect(0, y, 128, 1);
      tex.needsUpdate = true;
    };
    set(); return { tex, set };
  };

  // Boxy code-agent robot in a striped prison uniform with a chest tag.
  NSJ.robot = (o = {}) => {
    const color = o.color ?? C.coral, g = new THREE.Group();
    const suit = NSJ.mat(color, { r: 0.5, m: 0.15 }), metal = NSJ.mat(0x30353d, { r: 0.45, m: 0.5 }), stripe = NSJ.mat(0x15171b, { r: 0.8 });
    const face = NSJ.face();
    const hips = new THREE.Group(); hips.position.y = 0.62; g.add(hips);
    const torso = box(0.62, 0.72, 0.4, suit); torso.position.y = 0.42; hips.add(torso);
    [0.18, 0.4, 0.62].forEach(y => { const b = box(0.635, 0.07, 0.415, stripe); b.position.y = y; b.castShadow = false; hips.add(b); });
    const tc = document.createElement('canvas'); tc.width = 160; tc.height = 56; const tg = tc.getContext('2d');
    tg.fillStyle = '#f2f2f2'; tg.fillRect(0, 0, 160, 56); tg.fillStyle = '#111'; tg.font = 'bold 26px ui-monospace, Menlo, monospace'; tg.textAlign = 'center'; tg.fillText(o.tag || 'VM-A1F3', 80, 37);
    const tt = new THREE.CanvasTexture(tc); tt.encoding = THREE.sRGBEncoding;
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.12), new THREE.MeshBasicMaterial({ map: tt })); tag.position.set(0, 0.5, 0.21); hips.add(tag);
    const neck = new THREE.Group(); neck.position.y = 0.8; hips.add(neck);
    const head = box(0.58, 0.46, 0.46, metal); head.position.y = 0.25; neck.add(head);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.35), new THREE.MeshBasicMaterial({ map: face.tex })); screen.position.set(0, 0.25, 0.232); neck.add(screen);
    const ant = box(0.03, 0.22, 0.03, metal); ant.position.set(0.17, 0.58, 0); neck.add(ant);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({ color })); bulb.position.set(0.17, 0.71, 0); neck.add(bulb);
    const nameC = o.name ? (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 32; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.font = 'bold 22px ui-monospace, Menlo, monospace'; x.textAlign = 'center'; x.fillText(o.name, 64, 24); return c; })() : null;
    if (nameC) { const t = new THREE.CanvasTexture(nameC); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); s.scale.set(0.9, 0.22, 1); s.position.y = 2.05; s.renderOrder = 5; g.add(s); }
    const arm = side => { const p = new THREE.Group(); p.position.set(side * 0.41, 0.72, 0); hips.add(p); const u = box(0.16, 0.5, 0.16, suit); u.position.y = -0.25; p.add(u); const h = box(0.18, 0.14, 0.18, metal); h.position.y = -0.55; p.add(h); return p; };
    const leg = side => { const p = new THREE.Group(); p.position.set(side * 0.17, 0, 0); hips.add(p); const l = box(0.2, 0.56, 0.22, stripe); l.position.y = -0.3; p.add(l); const f = box(0.24, 0.1, 0.32, metal); f.position.set(0, -0.58, 0.04); p.add(f); return p; };
    g.userData = { hips, neck, armL: arm(-1), armR: arm(1), legL: leg(-1), legR: leg(1), face, bulb };
    return g;
  };
  NSJ.rest = r => { const u = r.userData; ['armL', 'armR', 'legL', 'legR'].forEach(k => u[k].rotation.set(0, 0, 0)); u.hips.position.y = 0.62; u.hips.rotation.set(0, 0, 0); u.neck.rotation.set(0, 0, 0); };
  NSJ.walk = (r, t, amt = 1, speed = 8) => { const u = r.userData, s = Math.sin(t * speed) * 0.6 * amt; u.legL.rotation.x = s; u.legR.rotation.x = -s; u.armL.rotation.x = -s * 0.8; u.armR.rotation.x = s * 0.8; u.hips.position.y = 0.62 + Math.abs(Math.cos(t * speed)) * 0.04 * amt; };
  NSJ.face2 = (r, x, z) => { r.rotation.y = Math.atan2(x - r.position.x, z - r.position.z); };
  NSJ.move = (r, from, to, p, t) => { r.position.x = NSJ.lerp(from.x, to.x, p); r.position.z = NSJ.lerp(from.z, to.z, p); if (p < 1) { NSJ.face2(r, to.x, to.z); NSJ.walk(r, t); } else NSJ.rest(r); };

  // Prison cell: floor, three concrete walls, a bunk, and a front of steel bars.
  NSJ.cell = (o = {}) => {
    const w = o.w ?? 4, d = o.d ?? 3.4, h = o.h ?? 2.8, g = new THREE.Group();
    const conc = NSJ.mat(C.concrete, { r: 0.95 }), fl = NSJ.mat(C.floor, { r: 0.9 });
    const barMat = NSJ.mat(C.steel, { r: 0.3, m: 0.85 });
    if (o.floor !== false) { const f = box(w, 0.2, d, fl); f.position.y = -0.1; g.add(f); }
    const back = box(w, h, 0.2, conc); back.position.set(0, h / 2, -d / 2); g.add(back);
    [-1, 1].forEach(s => { const sw = box(0.2, h, d, conc); sw.position.set(s * w / 2, h / 2, 0); g.add(sw); });
    if (o.bunk !== false) { const bunk = box(0.9, 0.12, 1.9, NSJ.mat(0x3a3f47)); bunk.position.set(-w / 2 + 0.6, 0.5, -d / 2 + 1.1); g.add(bunk); const mat = box(0.85, 0.1, 1.8, NSJ.mat(0x6b7280)); mat.position.set(-w / 2 + 0.6, 0.61, -d / 2 + 1.1); g.add(mat); [-0.8, 0.8].forEach(z => { const leg = box(0.08, 0.5, 0.08, NSJ.mat(0x3a3f47)); leg.position.set(-w / 2 + 0.6, 0.25, -d / 2 + 1.1 + z); g.add(leg); }); }
    const bars = [], n = Math.round(w / 0.28);
    for (let i = 0; i <= n; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, h, 8), barMat); b.position.set(-w / 2 + (i * w) / n, h / 2, d / 2); b.castShadow = true; b.userData.x0 = b.position.x; g.add(b); bars.push(b); }
    [0.08, h - 0.08, h * 0.45].forEach(y => { const r = box(w, 0.07, 0.07, barMat); r.position.set(0, y, d / 2); g.add(r); });
    return { group: g, bars, barMat, w, d, h };
  };

  // Floating label sprite, e.g. "EPERM · bars hold".
  NSJ.label = (scene, color = '#ff6b6b') => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 96; const g = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: 0 }));
    s.scale.set(3.4, 0.51, 1); s.renderOrder = 10; scene.add(s);
    let life = 0;
    s.show = (text, col = color, pos, dur = 2.2) => {
      g.clearRect(0, 0, 640, 96); g.font = 'bold 34px ui-monospace, Menlo, monospace';
      const tw = g.measureText(text).width + 44, x0 = (640 - tw) / 2;
      g.fillStyle = 'rgba(8,10,12,.88)'; g.fillRect(x0, 14, tw, 68); g.strokeStyle = col; g.lineWidth = 3; g.strokeRect(x0, 14, tw, 68);
      g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 320, 49);
      tex.needsUpdate = true; if (pos) s.position.copy(pos); s.base = s.position.y; life = dur;
    };
    s.tick = dt => { if (life > 0) { life -= dt; s.material.opacity = NSJ.clamp(life * 3) * NSJ.clamp((2.4 - life) * 6); s.position.y = s.base + (2.2 - life) * 0.15; } else s.material.opacity = 0; };
    return s;
  };

  // Spark particles.
  NSJ.sparks = (scene, n = 240) => {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), vel = [], life = new Float32Array(n);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(pts); for (let i = 0; i < n; i++) { vel.push(new THREE.Vector3()); pos[i * 3 + 1] = -99; }
    let k = 0; const tmp = new THREE.Color();
    return {
      emit(p, count = 24, color = C.coral, spread = 3) {
        tmp.set(color);
        for (let j = 0; j < count; j++) { const i = k++ % n; pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; vel[i].set((Math.random() - 0.5) * spread, Math.random() * spread * 0.8, (Math.random() - 0.5) * spread); life[i] = 0.5 + Math.random() * 0.5; col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b; }
      },
      tick(dt) {
        for (let i = 0; i < n; i++) { if (life[i] <= 0) continue; life[i] -= dt; vel[i].y -= 6 * dt; pos[i * 3] += vel[i].x * dt; pos[i * 3 + 1] += vel[i].y * dt; pos[i * 3 + 2] += vel[i].z * dt; if (life[i] <= 0) pos[i * 3 + 1] = -99; }
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      }
    };
  };

  // Looping sequence of timed steps: {d, enter(), tick(p, dt, t)}.
  NSJ.seq = (steps, onStep) => {
    let i = 0, el = 0; steps[0].enter?.(); onStep?.(0);
    return (dt, t) => {
      el += dt; const s = steps[i], p = NSJ.clamp(el / s.d);
      s.tick?.(p, dt, t);
      if (p >= 1) { i = (i + 1) % steps.length; el = 0; steps[i].enter?.(); onStep?.(i); }
    };
  };

  // HUD log in the corner of the stage.
  NSJ.hud = el => {
    const log = el.querySelector('.hud-log');
    return (text, kind = '') => { const d = document.createElement('div'); d.className = kind; d.textContent = text; log.append(d); while (log.children.length > 4) log.firstChild.remove(); };
  };
})();
