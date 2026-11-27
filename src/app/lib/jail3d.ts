// Small three.js kit for the "agent in a microVM jail" scenes on the home page.
// Robot prisoner, prison cell, floating labels and spark particles.
import * as THREE from 'three'

export const C = {
  coral: 0xff6b6b,
  steel: 0xa7b0ba,
  concrete: 0x2a2e35,
  floor: 0x1c1f24,
  blue: 0x6ea2ff,
  amber: 0xffbd2e,
  bg: 0x0b0d10,
}

// 3D world colours per site theme. The robots keep their own colours in both.
export const SCENE_THEME = {
  dark: { bg: 0x0b0d10, yard: 0x15181c, concrete: 0x2a2e35, floor: 0x1c1f24, shaft: 0x4a5264, roof: 0x353c48, shaftGlow: 0x0f1a2c, towerLight: 16, rim: 1.1, hemi: 0.9, key: 1.1, beam: 0xdde8ff, beamOpacity: 0.07, spot: 260, ringBg: '#0b0d10', ringFg: '#6ea2ff' },
  light: { bg: 0xe9ecf0, yard: 0xd3d8de, concrete: 0xc2c8cf, floor: 0xaeb4bc, shaft: 0x9aa2ac, roof: 0x6f7782, shaftGlow: 0x000000, towerLight: 3, rim: 0, hemi: 1.6, key: 1.9, beam: 0xffe9a8, beamOpacity: 0.16, spot: 180, ringBg: '#1d2430', ringFg: '#9cc0ff' },
}
export type SceneTheme = (typeof SCENE_THEME)['dark']

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))

export const mat = (color: number, o: { r?: number; m?: number } = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.7, metalness: o.m ?? 0.1 })

export function box(w: number, h: number, d: number, m: THREE.Material) {
  const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
  me.castShadow = true
  me.receiveShadow = true
  return me
}

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export type FaceMode = 'work' | 'scheme' | 'blocked' | 'sad'
const FACES: Record<FaceMode, [string, string]> = {
  work: ['>_', '#7dffb0'],
  scheme: ['>:)', '#ffbd2e'],
  blocked: ['x_x', '#ff6b6b'],
  sad: ['-_-', '#8a9099'],
}

export interface Robot extends THREE.Group {
  userData: {
    hips: THREE.Group
    neck: THREE.Group
    armL: THREE.Group
    armR: THREE.Group
    legL: THREE.Group
    legR: THREE.Group
    bulb: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
    setFace: (m: FaceMode) => void
  }
}

// Boxy code-agent robot in a striped prison suit. Its monitor face shows its mood.
export function robot(o: { color?: number; tag?: string; name?: string } = {}): Robot {
  const color = o.color ?? C.coral
  const g = new THREE.Group() as Robot
  const suit = mat(color, { r: 0.5, m: 0.15 })
  const metal = mat(0x30353d, { r: 0.45, m: 0.5 })
  const stripe = mat(0x15171b, { r: 0.8 })

  const faceCanvas = document.createElement('canvas')
  faceCanvas.width = 128
  faceCanvas.height = 96
  const fg = faceCanvas.getContext('2d')!
  const faceTex = new THREE.CanvasTexture(faceCanvas)
  faceTex.colorSpace = THREE.SRGBColorSpace
  const setFace = (m: FaceMode) => {
    const [txt, col] = FACES[m]
    fg.fillStyle = '#06080a'
    fg.fillRect(0, 0, 128, 96)
    fg.fillStyle = col
    fg.font = 'bold 38px ui-monospace, Menlo, monospace'
    fg.textAlign = 'center'
    fg.textBaseline = 'middle'
    fg.fillText(txt, 64, 50)
    fg.fillStyle = 'rgba(255,255,255,.05)'
    for (let y = 0; y < 96; y += 4) fg.fillRect(0, y, 128, 1)
    faceTex.needsUpdate = true
  }
  setFace('work')

  const hips = new THREE.Group()
  hips.position.y = 0.62
  g.add(hips)
  const torso = box(0.62, 0.72, 0.4, suit)
  torso.position.y = 0.42
  hips.add(torso)
  ;[0.18, 0.4, 0.62].forEach((y) => {
    const b = box(0.635, 0.07, 0.415, stripe)
    b.position.y = y
    b.castShadow = false
    hips.add(b)
  })
  const tagTex = canvasTexture(160, 56, (x) => {
    x.fillStyle = '#f2f2f2'
    x.fillRect(0, 0, 160, 56)
    x.fillStyle = '#111'
    x.font = 'bold 26px ui-monospace, Menlo, monospace'
    x.textAlign = 'center'
    x.fillText(o.tag ?? 'VM-A1F3', 80, 37)
  })
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.12), new THREE.MeshBasicMaterial({ map: tagTex }))
  tag.position.set(0, 0.5, 0.21)
  hips.add(tag)

  const neck = new THREE.Group()
  neck.position.y = 0.8
  hips.add(neck)
  const head = box(0.58, 0.46, 0.46, metal)
  head.position.y = 0.25
  neck.add(head)
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.35), new THREE.MeshBasicMaterial({ map: faceTex }))
  screen.position.set(0, 0.25, 0.232)
  neck.add(screen)
  const ant = box(0.03, 0.22, 0.03, metal)
  ant.position.set(0.17, 0.58, 0)
  neck.add(ant)
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({ color }))
  bulb.position.set(0.17, 0.71, 0)
  neck.add(bulb)

  if (o.name) {
    const nameTex = canvasTexture(160, 40, (x) => {
      x.fillStyle = 'rgba(8,10,12,.78)'
      x.fillRect(10, 4, 140, 32)
      x.fillStyle = '#fff'
      x.font = 'bold 24px ui-monospace, Menlo, monospace'
      x.textAlign = 'center'
      x.fillText(o.name!, 80, 28)
    })
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex, transparent: true, depthTest: false }))
    s.scale.set(1, 0.25, 1)
    s.position.y = 2.05
    s.renderOrder = 5
    g.add(s)
  }

  const arm = (side: number) => {
    const p = new THREE.Group()
    p.position.set(side * 0.41, 0.72, 0)
    hips.add(p)
    const u = box(0.16, 0.5, 0.16, suit)
    u.position.y = -0.25
    p.add(u)
    const h = box(0.18, 0.14, 0.18, metal)
    h.position.y = -0.55
    p.add(h)
    return p
  }
  const leg = (side: number) => {
    const p = new THREE.Group()
    p.position.set(side * 0.17, 0, 0)
    hips.add(p)
    const l = box(0.2, 0.56, 0.22, stripe)
    l.position.y = -0.3
    p.add(l)
    const f = box(0.24, 0.1, 0.32, metal)
    f.position.set(0, -0.58, 0.04)
    p.add(f)
    return p
  }
  g.userData = { hips, neck, armL: arm(-1), armR: arm(1), legL: leg(-1), legR: leg(1), bulb, setFace }
  return g
}

export function rest(r: Robot) {
  const u = r.userData
  for (const k of ['armL', 'armR', 'legL', 'legR'] as const) u[k].rotation.set(0, 0, 0)
  u.hips.position.y = 0.62
  u.hips.rotation.set(0, 0, 0)
  u.neck.rotation.set(0, 0, 0)
}

export function walk(r: Robot, t: number, amt = 1, speed = 8) {
  const u = r.userData
  const s = Math.sin(t * speed) * 0.6 * amt
  u.legL.rotation.x = s
  u.legR.rotation.x = -s
  u.armL.rotation.x = -s * 0.8
  u.armR.rotation.x = s * 0.8
  u.hips.position.y = 0.62 + Math.abs(Math.cos(t * speed)) * 0.04 * amt
}

// Prison cell: floor, three concrete walls, a bunk and a front of steel bars.
export function cell(o: { w?: number; d?: number; h?: number } = {}) {
  const w = o.w ?? 4
  const d = o.d ?? 3.4
  const h = o.h ?? 2.8
  const group = new THREE.Group()
  const conc = mat(C.concrete, { r: 0.95 })
  const floorMat = mat(C.floor, { r: 0.9 })
  const barMat = mat(C.steel, { r: 0.3, m: 0.85 })
  const f = box(w, 0.2, d, floorMat)
  f.position.y = -0.1
  group.add(f)
  const back = box(w, h, 0.2, conc)
  back.position.set(0, h / 2, -d / 2)
  group.add(back)
  ;[-1, 1].forEach((s) => {
    const sw = box(0.2, h, d, conc)
    sw.position.set((s * w) / 2, h / 2, 0)
    group.add(sw)
  })
  const bunk = box(0.8, 0.12, 1.5, mat(0x3a3f47))
  bunk.position.set(-w / 2 + 0.55, 0.45, -d / 2 + 0.9)
  group.add(bunk)
  const bars: THREE.Mesh[] = []
  const n = Math.round(w / 0.28)
  for (let i = 0; i <= n; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, h, 8), barMat)
    b.position.set(-w / 2 + (i * w) / n, h / 2, d / 2)
    b.castShadow = true
    b.userData.x0 = b.position.x
    group.add(b)
    bars.push(b)
  }
  ;[0.08, h - 0.08, h * 0.45].forEach((y) => {
    const r = box(w, 0.07, 0.07, barMat)
    r.position.set(0, y, d / 2)
    group.add(r)
  })
  return { group, bars, barMat, conc, floorMat, w, d, h }
}

// Floating label sprite that fades out, e.g. "seccomp: mount() denied".
export function label(scene: THREE.Scene) {
  const c = document.createElement('canvas')
  c.width = 720
  c.height = 96
  const g = c.getContext('2d')!
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: 0 }))
  sprite.scale.set(4.2, 0.56, 1)
  sprite.renderOrder = 10
  scene.add(sprite)
  let life = 0
  let base = 0
  return {
    show(text: string, color: string, pos: THREE.Vector3, dur = 2.2) {
      g.clearRect(0, 0, 720, 96)
      g.font = 'bold 34px ui-monospace, Menlo, monospace'
      const tw = Math.min(700, g.measureText(text).width + 44)
      const x0 = (720 - tw) / 2
      g.fillStyle = 'rgba(8,10,12,.9)'
      g.fillRect(x0, 14, tw, 68)
      g.strokeStyle = color
      g.lineWidth = 3
      g.strokeRect(x0, 14, tw, 68)
      g.fillStyle = color
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(text, 360, 49)
      tex.needsUpdate = true
      sprite.position.copy(pos)
      base = pos.y
      life = dur
    },
    tick(dt: number) {
      if (life > 0) {
        life -= dt
        sprite.material.opacity = clamp(life * 3) * clamp((2.4 - life) * 6)
        sprite.position.y = base + (2.2 - life) * 0.15
      } else sprite.material.opacity = 0
    },
  }
}

// Additive spark particles.
export function sparks(scene: THREE.Scene, n = 400) {
  const pos = new Float32Array(n * 3)
  const col = new Float32Array(n * 3)
  const life = new Float32Array(n)
  const vel = Array.from({ length: n }, () => new THREE.Vector3())
  for (let i = 0; i < n; i++) pos[i * 3 + 1] = -99
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  )
  scene.add(pts)
  let k = 0
  const tmp = new THREE.Color()
  return {
    emit(p: THREE.Vector3, count = 24, color = C.coral, spread = 3) {
      tmp.set(color)
      for (let j = 0; j < count; j++) {
        const i = k++ % n
        pos[i * 3] = p.x
        pos[i * 3 + 1] = p.y
        pos[i * 3 + 2] = p.z
        vel[i].set((Math.random() - 0.5) * spread, Math.random() * spread * 0.8, (Math.random() - 0.5) * spread)
        life[i] = 0.5 + Math.random() * 0.5
        col[i * 3] = tmp.r
        col[i * 3 + 1] = tmp.g
        col[i * 3 + 2] = tmp.b
      }
    },
    tick(dt: number) {
      for (let i = 0; i < n; i++) {
        if (life[i] <= 0) continue
        life[i] -= dt
        vel[i].y -= 6 * dt
        pos[i * 3] += vel[i].x * dt
        pos[i * 3 + 1] += vel[i].y * dt
        pos[i * 3 + 2] += vel[i].z * dt
        if (life[i] <= 0) pos[i * 3 + 1] = -99
      }
      geo.attributes.position.needsUpdate = true
      geo.attributes.color.needsUpdate = true
    },
  }
}

// Free GPU memory for everything under a root object.
export function disposeAll(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh
    m.geometry?.dispose()
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
    mats.forEach((mm) => {
      const anyMat = mm as THREE.MeshBasicMaterial
      anyMat.map?.dispose()
      mm.dispose()
    })
  })
}
