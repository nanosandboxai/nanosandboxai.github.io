import { useEffect, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { C, SCENE_THEME, cell, clamp, disposeAll, label, lerp, rest, robot, sparks, walk, type Robot } from '@/app/lib/jail3d'

// Decorative inmates. Purely visual; the real catalog lives on /agents.
const INMATES: Array<[string, number]> = [
  ['claude', 0xff6b6b],
  ['codex', 0xf59e0b],
  ['goose', 0x34d399],
  ['aider', 0x60a5fa],
  ['opencode', 0xc084fc],
  ['gemini', 0xf472b6],
]

const ESCAPES: Array<{ try: string; blockedBy: string; tone: 'x' | 'b' | 'w' }> = [
  { try: 'pry the bars', blockedBy: 'microVM boundary holds', tone: 'x' },
  { try: 'climb out the vent', blockedBy: 'seccomp: mount() denied', tone: 'x' },
  { try: 'dig through the floor', blockedBy: 'KVM / HVF: no exit', tone: 'b' },
  { try: 'ptrace the guard', blockedBy: 'ptrace(PID 1) denied', tone: 'x' },
  { try: 'bribe the network', blockedBy: 'egress: evil.sh not allowlisted', tone: 'w' },
]
const TONE_COLOR = { x: '#ff6b6b', b: '#6ea2ff', w: '#ffbd2e' }

interface CellState {
  conc: THREE.MeshStandardMaterial
  floorMat: THREE.MeshStandardMaterial
  group: THREE.Group
  bars: THREE.Mesh[]
  barMat: THREE.MeshStandardMaterial
  bot: Robot
  glow: THREE.PointLight
  hit: THREE.Mesh
  name: string
  phase: number
  busy: number
  t0: number
  kind: number
  heat: number
  hitDone: boolean
}

export default function HypervisorPanopticon({ children }: { children?: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const attRef = useRef<HTMLElement>(null)
  const riotRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const host = hostRef.current!
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
    } catch {
      host.dataset.nogl = 'true'
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.className = 'absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing'
    host.prepend(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(C.bg)
    scene.fog = new THREE.Fog(C.bg, 24, 62)
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200)
    camera.position.set(16, 11, 16)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.enableZoom = false // keep page scroll working over the hero
    controls.maxPolarAngle = Math.PI * 0.45
    controls.minPolarAngle = Math.PI * 0.2
    controls.autoRotate = !reduce
    controls.autoRotateSpeed = 0.35
    controls.addEventListener('start', () => (controls.autoRotate = false))

    const hemi = new THREE.HemisphereLight(0xa9bccf, 0x1a1410, 0.9)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 1.1)
    key.position.set(6, 14, 8)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, far: 45 })
    scene.add(key)

    const yardMat = new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 1 })
    const yard = new THREE.Mesh(new THREE.CircleGeometry(15, 64), yardMat)
    yard.rotation.x = -Math.PI / 2
    yard.position.y = -0.2
    yard.receiveShadow = true
    scene.add(yard)

    // Watchtower with a scrolling HYPERVISOR band.
    const ringCanvas = document.createElement('canvas')
    ringCanvas.width = 1024
    ringCanvas.height = 64
    const rg = ringCanvas.getContext('2d')!
    const drawRing = (bg: string, fg: string) => {
      rg.fillStyle = bg
      rg.fillRect(0, 0, 1024, 64)
      rg.fillStyle = fg
      rg.font = 'bold 40px ui-monospace, Menlo, monospace'
      rg.fillText('HYPERVISOR · KVM / HVF · HYPERVISOR · KVM / HVF ·', 10, 46)
    }
    drawRing('#0b0d10', '#6ea2ff')
    const ringTex = new THREE.CanvasTexture(ringCanvas)
    ringTex.wrapS = THREE.RepeatWrapping
    ringTex.colorSpace = THREE.SRGBColorSpace
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x2a2e35, roughness: 0.9 })
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 6, 16), shaftMat)
    shaft.position.y = 3
    shaft.castShadow = true
    scene.add(shaft)
    const cabin = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.3, 1.1, 24, 1, true), new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide }))
    cabin.position.y = 6.5
    scene.add(cabin)
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1d2025 })
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.9, 24), roofMat)
    roof.position.y = 7.5
    scene.add(roof)

    // Make the tower read at night: glowing bands, a lit cabin, a blinking roof beacon,
    // a ring on the ground and a cool rim light from behind.
    const bandMat = new THREE.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 1 })
    ;[1.2, 2.6, 4.0, 5.4].forEach((y) => {
      const r = 1.1 - (y / 6) * 0.4 + 0.02
      const band = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 8, 48), bandMat)
      band.rotation.x = Math.PI / 2
      band.position.y = y
      scene.add(band)
    })
    const baseRing = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.6, 64), new THREE.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0.55, side: THREE.DoubleSide }))
    baseRing.rotation.x = -Math.PI / 2
    baseRing.position.y = -0.18
    scene.add(baseRing)
    const cabinLight = new THREE.PointLight(C.blue, 16, 12, 1.6)
    cabinLight.position.set(0, 6.4, 0)
    scene.add(cabinLight)
    const beaconMat = new THREE.MeshBasicMaterial({ color: C.coral })
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), beaconMat)
    beacon.position.y = 8.05
    scene.add(beacon)
    const beaconLight = new THREE.PointLight(C.coral, 6, 6, 1.8)
    beaconLight.position.y = 8.1
    scene.add(beaconLight)
    const rim = new THREE.DirectionalLight(0x8fb4ff, 1.1)
    rim.position.set(-10, 9, -12)
    scene.add(rim)
    const spot = new THREE.SpotLight(0xdde8ff, 260, 32, 0.22, 0.5, 1.6)
    spot.position.set(0, 6.6, 0)
    scene.add(spot, spot.target)
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 1, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xdde8ff, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide })
    )
    scene.add(beam)

    const R = 8.2
    const cells: CellState[] = INMATES.map(([name, color], i) => {
      const a = (i / INMATES.length) * Math.PI * 2
      const c = cell({ w: 3.2, d: 2.8, h: 2.4 })
      c.group.position.set(Math.sin(a) * R, 0, Math.cos(a) * R)
      c.group.rotation.y = a + Math.PI
      scene.add(c.group)
      const bot = robot({ color, name, tag: 'VM-' + (0xa1f3 + i * 977).toString(16).toUpperCase().slice(-4) })
      bot.scale.setScalar(0.85)
      c.group.add(bot)
      const glow = new THREE.PointLight(C.coral, 0, 4, 2)
      glow.position.set(0, 1.6, 0.6)
      c.group.add(glow)
      const barMat = c.barMat.clone()
      c.bars.forEach((b) => (b.material = barMat))
      const hit = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 2.8), new THREE.MeshBasicMaterial({ visible: false }))
      hit.position.y = 1.2
      hit.userData.i = i
      c.group.add(hit)
      return { conc: c.conc, floorMat: c.floorMat, group: c.group, bars: c.bars, barMat, bot, glow, hit, name, phase: Math.random() * 10, busy: 0, t0: 0, kind: 0, heat: 0, hitDone: false }
    })

    // Follow the site theme (next-themes toggles the `dark` class on <html>).
    const beamMat = beam.material as THREE.MeshBasicMaterial
    let theme = SCENE_THEME.dark
    const applyTheme = () => {
      theme = document.documentElement.classList.contains('dark') ? SCENE_THEME.dark : SCENE_THEME.light
      ;(scene.background as THREE.Color).setHex(theme.bg)
      scene.fog!.color.setHex(theme.bg)
      yardMat.color.setHex(theme.yard)
      shaftMat.color.setHex(theme.shaft)
      shaftMat.emissive.setHex(theme.shaftGlow)
      roofMat.emissive.setHex(theme.shaftGlow)
      cabinLight.intensity = theme.towerLight
      rim.intensity = theme.rim
      roofMat.color.setHex(theme.roof)
      cells.forEach((c) => {
        c.conc.color.setHex(theme.concrete)
        c.floorMat.color.setHex(theme.floor)
      })
      hemi.intensity = theme.hemi
      key.intensity = theme.key
      spot.intensity = theme.spot
      beamMat.opacity = theme.beamOpacity
      drawRing(theme.ringBg, theme.ringFg)
      ringTex.needsUpdate = true
    }
    applyTheme()
    const themeObserver = new MutationObserver(applyTheme)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const sp = sparks(scene)
    const lab = label(scene)
    let attempts = 0
    let focus: CellState | null = null

    const log = (text: string, tone = '') => {
      const box = logRef.current
      if (!box) return
      const d = document.createElement('div')
      d.className = `hud-line ${tone}`
      d.textContent = text
      box.append(d)
      while (box.children.length > 4) box.firstChild?.remove()
    }
    log('6 sandboxes running · searchlight on', 'ok')

    const attempt = (c: CellState, kind?: number) => {
      if (c.busy > 0) return
      c.busy = 2.6
      c.t0 = 0
      c.hitDone = false
      c.kind = kind ?? Math.floor(Math.random() * ESCAPES.length)
      c.bot.userData.setFace('scheme')
      focus = c
      attempts++
      if (attRef.current) attRef.current.textContent = String(attempts)
      log(`${c.name}> ${ESCAPES[c.kind].try}`, 'w')
    }

    // Click a cell to make its agent try.
    const ray = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    let down: [number, number] | null = null
    const onDown = (e: PointerEvent) => (down = [e.clientX, e.clientY])
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return
      const r = renderer.domElement.getBoundingClientRect()
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(mouse, camera)
      const h = ray.intersectObjects(cells.map((c) => c.hit))[0]
      if (h) attempt(cells[h.object.userData.i as number])
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)
    const riot = () => cells.forEach((c, i) => setTimeout(() => attempt(c), i * 180))
    riotRef.current?.addEventListener('click', riot)

    // Shift the tower to the right on wide screens so the headline has room on the left.
    const size = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      const wide = w > 900
      // Wide: tower sits right of the headline. Narrow: aim above the tower so it lands below the text panel.
      controls.target.set(wide ? -6.5 : 0, wide ? 1.5 : 6, wide ? 6.5 : 0)
      controls.minDistance = controls.maxDistance = wide ? 22 : 27
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(host)

    let visible = true
    const io = new IntersectionObserver((es) => (visible = es[0].isIntersecting))
    io.observe(host)

    const tmp = new THREE.Vector3()
    const aim = new THREE.Vector3()
    const clock = new THREE.Clock()
    let next = 1.2
    let raf = 0
    let first = true
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!visible) {
        clock.getDelta()
        return
      }
      let dt = Math.min(clock.getDelta(), 0.05)
      if (reduce && !first) dt = 0
      first = false
      const t = clock.elapsedTime

      next -= dt
      if (next <= 0 && !reduce) {
        next = 2.2 + Math.random() * 1.8
        attempt(cells[Math.floor(Math.random() * cells.length)])
      }
      for (const c of cells) {
        const b = c.bot
        const u = b.userData
        if (c.busy > 0) {
          c.busy -= dt
          c.t0 += dt
          const p = clamp(c.t0 / 2.6)
          rest(b)
          if (c.kind === 1) {
            b.position.set(0.9, Math.sin(clamp(p / 0.6) * Math.PI) * 0.9, -0.6)
            b.rotation.y = Math.PI
            u.armL.rotation.x = u.armR.rotation.x = -2.9
          } else if (c.kind === 2) {
            b.position.set(-0.4, 0, 0.3)
            b.rotation.y = 0
            u.hips.position.y = 0.36
            u.legL.rotation.x = u.legR.rotation.x = -1.2
            u.hips.rotation.x = 0.55
            u.armL.rotation.x = -0.9 + Math.sin(t * 16) * 0.5
            u.armR.rotation.x = -0.9 - Math.sin(t * 16) * 0.5
          } else {
            b.position.set(0, 0, lerp(b.position.z, 0.85, 0.15))
            b.rotation.y = 0
            u.armL.rotation.x = u.armR.rotation.x = -1.45 + Math.sin(t * 22) * 0.14
            c.heat = Math.max(c.heat, 1 - p)
          }
          if (p > 0.45 && !c.hitDone) {
            c.hitDone = true
            u.setFace('blocked')
            c.heat = 1
            const e = ESCAPES[c.kind]
            b.getWorldPosition(tmp)
            tmp.y += 1.6
            sp.emit(tmp, 30, e.tone === 'b' ? C.blue : C.coral, 3)
            tmp.y += 1.5
            lab.show(`${c.name} · ${e.blockedBy}`, TONE_COLOR[e.tone], tmp.clone())
            log(`✗ ${c.name}: ${e.blockedBy}`, e.tone)
          }
          if (c.busy <= 0) {
            rest(b)
            b.position.set(0, 0, 0)
            u.setFace('work')
            if (focus === c) focus = null
          }
        } else {
          const s = Math.sin((t + c.phase) * 0.7) * 0.9
          b.position.set(s, 0, -0.1)
          b.rotation.y = Math.cos((t + c.phase) * 0.7) > 0 ? Math.PI / 2 : -Math.PI / 2
          walk(b, t + c.phase, 0.8, 7)
        }
        c.heat *= Math.pow(0.35, dt)
        c.barMat.emissive.setHex(C.coral)
        c.barMat.emissiveIntensity = c.heat * 0.7
        c.glow.intensity = c.heat * 6
        c.bars.forEach((bar, i) => (bar.position.x = (bar.userData.x0 as number) + Math.sin(t * 40 + i) * 0.02 * c.heat * (c.kind === 0 ? 1 : 0)))
        u.bulb.material.color.setHex(Math.sin(t * 6 + c.phase) > 0 ? 0xff6b6b : 0x441c1c)
      }
      // Searchlight sweeps when idle and snaps to the cell that is trying.
      if (focus) focus.group.getWorldPosition(tmp)
      else tmp.set(Math.sin(t * 0.4) * R, 0, Math.cos(t * 0.4) * R)
      aim.lerp(tmp, focus ? 0.12 : 0.03)
      spot.target.position.copy(aim)
      const len = spot.position.distanceTo(aim)
      beam.scale.set(1, len, 1)
      beam.position.copy(spot.position).lerp(aim, 0.5)
      beam.lookAt(aim)
      beam.rotateX(-Math.PI / 2)
      spot.color.setHex(focus ? 0xffc2c2 : theme.beam)
      beamMat.color.copy(spot.color)
      const blink = Math.sin(t * 3) > 0.2 ? 1 : 0.15
      beaconMat.color.setHex(blink > 0.5 ? 0xff6b6b : 0x5a2222)
      beaconLight.intensity = 6 * blink
      ringTex.offset.x = -t * 0.03
      sp.tick(dt)
      lab.tick(dt)
      controls.update()
      renderer.render(scene, camera)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      themeObserver.disconnect()
      ro.disconnect()
      io.disconnect()
      riotRef.current?.removeEventListener('click', riot)
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      controls.dispose()
      disposeAll(scene)
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div ref={hostRef} className="panopticon relative overflow-hidden font-mono">
      {/* readability scrim behind the headline on wide screens */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[58%] bg-gradient-to-r from-[var(--scene-bg)] via-[var(--scene-scrim)] to-transparent lg:block" />
      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-5 md:p-8">
        <div className="pointer-events-auto max-w-xl">{children}</div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div ref={logRef} className="hud w-full min-w-0 max-w-[440px] text-xs" aria-live="polite" />
          <div className="pointer-events-auto flex shrink-0 flex-col items-start gap-2 text-xs sm:items-end">
            <div className="flex gap-1.5">
              <span className="scene-chip px-2 py-1">
                attempts <b ref={attRef} className="tabular-nums text-[var(--scene-heading)]">0</b>
              </span>
              <span className="scene-chip px-2 py-1">
                escapes <b className="text-[#28c840]">0</b>
              </span>
            </div>
            <button
              ref={riotRef}
              type="button"
              className="scene-chip px-2.5 py-1 transition-colors hover:border-[var(--accent)] hover:text-[var(--scene-heading)]"
            >
              [riot: all at once]
            </button>
            <span className="hidden text-[11px] text-[var(--scene-dim)] sm:block">click a cell · drag to orbit</span>
          </div>
        </div>
      </div>
    </div>
  )
}
