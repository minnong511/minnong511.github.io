// Loaded only by the explicit 3D activation button.
import {
  AmbientLight, Box3, BoxGeometry, CatmullRomCurve3, Color, CylinderGeometry,
  DirectionalLight, ExtrudeGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, OrthographicCamera,
  Path, Scene, Shape, SphereGeometry, TubeGeometry, Vector3, WebGLRenderer,
} from 'three'
import type { BufferGeometry } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buildModel, stepState } from './model'
import type { ModelState, Part } from './model'
import { flowPaths, pointOnPath, processFlowPaths, samplePlayback, transitionParts, transitionPose } from './playback'
import type { PlaybackMode, PlaybackProgress, TransitionPart } from './playback'

export interface PlaybackOptions {
  reducedMotion: boolean
  speed: number
  onProgress: (progress: PlaybackProgress) => void
}

export interface SceneRenderer {
  update: (parts: Part[], cutaway: boolean) => void
  view: (direction: 'iso' | 'top' | 'side') => void
  rotate: (direction: number) => void
  zoom: (factor: number) => void
  play: (state: ModelState, mode: PlaybackMode, options: PlaybackOptions) => void
  pause: () => void
  resume: () => void
  speed: (factor: number) => void
  dispose: () => void
}

export function createSceneRenderer(mount: HTMLElement, onFailure: () => void): SceneRenderer {
  const scene = new Scene()
  scene.background = new Color('#101b2c')
  const camera = new OrthographicCamera(-7, 7, 5, -5, 0.1, 150)
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.75))
  renderer.domElement.setAttribute('aria-label', '반도체 구조 3D. 마우스 또는 터치로 회전. 시점과 확대 버튼도 사용할 수 있습니다.')
  renderer.domElement.setAttribute('role', 'img')
  mount.appendChild(renderer.domElement)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 2, 0)
  controls.enableDamping = false
  controls.enablePan = false
  controls.enableZoom = false // Keep wheel scrolling available for the article; use zoom buttons.
  controls.minPolarAngle = 0.015
  controls.maxPolarAngle = Math.PI * 0.9
  scene.add(new AmbientLight('#eef6ff', 2.3))
  const light = new DirectionalLight('#ffffff', 3)
  light.position.set(6, 12, 8)
  scene.add(light)
  const group = new Group()
  scene.add(group)
  let disposed = false
  let frame = 0
  let currentParts: Part[] = []
  let playing = false
  let playback: { state: ModelState, mode: PlaybackMode, options: PlaybackOptions, elapsed: number, stage: number } | null = null
  let lastTime: number | null = null
  let lastDraw = 0
  let lastNotice = -Infinity
  let tracks: { track: TransitionPart, mesh: Mesh, baseZ: number, fromColor: Color, toColor: Color }[] = []
  const effects = new Group()
  scene.add(effects)
  let dots: Mesh<SphereGeometry, MeshBasicMaterial>[] = []
  let scanner: Mesh<BoxGeometry, MeshBasicMaterial> | null = null
  const labelLayer = document.createElement('div')
  labelLayer.className = 'semi-3d-labels'
  labelLayer.setAttribute('aria-hidden', 'true')
  mount.appendChild(labelLayer)
  let labels: { element: HTMLSpanElement, point: Vector3 }[] = []
  function render() {
    if (disposed || frame) return
    frame = requestAnimationFrame((time) => {
      frame = 0
      if (!disposed) {
        if (playing && playback) {
          const interval = playback.options.reducedMotion ? 600 : 1000 / 30
          if (time - lastDraw < interval) { render(); return }
          if (lastTime !== null) playback.elapsed += Math.max(0, time - lastTime) * playback.options.speed
          lastTime = time
          advance(time)
        }
        lastDraw = time
        renderer.render(scene, camera)
        for (const { element, point } of labels) {
          const p = point.clone().project(camera)
          const x = (p.x + 1) * mount.clientWidth / 2
          const y = (1 - p.y) * mount.clientHeight / 2
          element.style.left = `${Math.max(35, Math.min(mount.clientWidth - 35, x))}px`
          element.style.top = `${Math.max(42, Math.min(mount.clientHeight - 18, y))}px`
        }
        if (playing) render()
      }
    })
  }
  controls.addEventListener('change', render)
  function clear() {
    for (const object of [...group.children]) {
      if (object instanceof Mesh) {
        object.geometry.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach(material => material.dispose())
      }
      group.remove(object)
    }
  }
  function clearEffects() {
    for (const child of [...effects.children]) {
      if (child instanceof Mesh) { child.geometry.dispose(); child.material.dispose() }
      effects.remove(child)
    }
    dots = []
    scanner = null
  }
  function pause() {
    playing = false
    lastTime = null
    cancelAnimationFrame(frame)
    frame = 0
  }
  function fit() {
    if (!group.children.length || !mount.clientWidth || !mount.clientHeight) return
    const bounds = new Box3().setFromObject(group)
    const center = bounds.getCenter(new Vector3())
    camera.position.add(center.clone().sub(controls.target))
    controls.target.copy(center)
    camera.lookAt(center)
    camera.updateMatrixWorld()
    const projected = new Box3()
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      projected.expandByPoint(new Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse))
    }
    const aspect = mount.clientWidth / mount.clientHeight
    const halfHeight = Math.max((projected.max.y - projected.min.y) / 2, (projected.max.x - projected.min.x) / (2 * aspect), 1) * 1.35
    camera.left = -halfHeight * aspect
    camera.right = halfHeight * aspect
    camera.top = halfHeight
    camera.bottom = -halfHeight
    camera.updateProjectionMatrix()
    controls.update()
  }
  function build(parts: Part[], cutaway: boolean, fitCamera = true) {
    clear()
    currentParts = parts
    for (const [partIndex, part] of parts.entries()) {
      let geometry: BufferGeometry
      let position = [...part.position]
      const [width, height] = part.size
      let depth = part.size[2]
      if (part.kind === 'wire') {
        const points = (part.points || []).filter(point => !cutaway || point[2] <= 0)
        if (points.length < 2) continue
        geometry = new TubeGeometry(new CatmullRomCurve3(points.map(point => new Vector3(...point))), 14, width, 5, false)
      } else {
        const minZ = part.position[2] - depth / 2
        const maxZ = cutaway ? Math.min(0, part.position[2] + depth / 2) : part.position[2] + depth / 2
        if (minZ >= maxZ) continue
        if (part.kind === 'plate' && part.holes?.length) {
          const shape = new Shape()
          shape.moveTo(-width / 2, -maxZ + part.position[2])
          shape.lineTo(width / 2, -maxZ + part.position[2])
          shape.lineTo(width / 2, depth / 2)
          shape.lineTo(-width / 2, depth / 2)
          shape.closePath()
          // Cutaway holes touch the front edge: make them open notches instead of invalid holes.
          if (cutaway && part.position[2] === 0) {
            const notched = new Shape()
            notched.moveTo(-width / 2, 0)
            for (const hole of part.holes.filter(h => h.z === 0).sort((a, b) => a.x - b.x)) {
              notched.lineTo(hole.x - hole.radius, 0)
              notched.absarc(hole.x, 0, hole.radius, Math.PI, 0, true)
            }
            notched.lineTo(width / 2, 0)
            notched.lineTo(width / 2, depth / 2)
            notched.lineTo(-width / 2, depth / 2)
            notched.closePath()
            for (const hole of part.holes.filter(h => h.z < 0)) {
              const path = new Path()
              path.absarc(hole.x, -hole.z, hole.radius, 0, Math.PI * 2, true)
              notched.holes.push(path)
            }
            geometry = new ExtrudeGeometry(notched, { depth: height, bevelEnabled: false, curveSegments: 16 })
          } else {
            for (const hole of part.holes) {
              const path = new Path()
              path.absarc(hole.x, -hole.z, hole.radius, 0, Math.PI * 2, true)
              shape.holes.push(path)
            }
            geometry = new ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 16 })
          }
          geometry.rotateX(-Math.PI / 2)
          geometry.translate(0, -height / 2, 0)
        } else if (part.kind === 'cylinder') {
          const sliced = cutaway && part.position[2] === 0
          if (!sliced && !part.innerRadius) geometry = new CylinderGeometry(width / 2, width / 2, height, 18)
          else {
            const shape = new Shape()
            const radius = width / 2
            if (sliced) {
              shape.moveTo(-radius, 0)
              shape.absarc(0, 0, radius, Math.PI, 0, true)
              if (part.innerRadius) {
                shape.lineTo(part.innerRadius, 0)
                shape.absarc(0, 0, part.innerRadius, 0, Math.PI, false)
              }
              shape.closePath()
            } else {
              shape.absarc(0, 0, radius, 0, Math.PI * 2, false)
              const hole = new Path()
              hole.absarc(0, 0, part.innerRadius!, 0, Math.PI * 2, true)
              shape.holes.push(hole)
            }
            geometry = new ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 18 })
            geometry.rotateX(-Math.PI / 2)
            geometry.translate(0, -height / 2, 0)
          }
        } else {
          depth = maxZ - minZ
          position = [part.position[0], part.position[1], (maxZ + minZ) / 2]
          // Solid rectangular sections deliberately emphasize the material boundaries.
          geometry = new BoxGeometry(width, height, depth)
        }
      }
      const material = new MeshStandardMaterial({
        color: part.color, roughness: 0.62, metalness: part.label.includes('금속') || part.id.startsWith('tsv') ? 0.35 : 0.08,
        transparent: Boolean(part.opacity), opacity: part.opacity ?? 1, depthWrite: !part.opacity,
        polygonOffset: cutaway, polygonOffsetFactor: 0, polygonOffsetUnits: -partIndex,
      })
      const mesh = new Mesh(geometry, material)
      mesh.name = part.id
      mesh.position.set(position[0]!, position[1]!, position[2]!)
      group.add(mesh)
    }
    labelLayer.replaceChildren()
    const anchors: Record<string, string> = { source: '소스', drain: '드레인', gate: '게이트', gpu: 'GPU', base: '베이스 다이', interposer: '인터포저', 'station-design': '설계', 'station-fab': '제조', 'station-assembly': '조립·검사', 'station-system': '시스템', 'dram-sense': '감지·구동', 'dram-access': '접근 스위치', 'dram-reference': '커패시터' }
    labels = currentParts.filter(part => anchors[part.id]).map((part) => {
      const element = document.createElement('span')
      element.textContent = anchors[part.id]!
      labelLayer.appendChild(element)
      return { element, point: new Vector3(part.position[0], part.position[1] + part.size[1] / 2 + 0.32, cutaway ? 0 : part.position[2] + part.size[2] / 2) }
    })
    if (fitCamera) fit()
    render()
  }
  function update(parts: Part[], cutaway: boolean) {
    pause()
    playback = null
    tracks = []
    clearEffects()
    build(parts, cutaway)
  }
  function prepareStage(state: ModelState) {
    if (!playback) return
    clearEffects()
    if (playback.mode === 'flow' || state.scene === 'industry-chain' || state.scene === 'dram-cell') {
      for (let n = 0; n < 14; n++) {
        const dot = new Mesh(new SphereGeometry(0.075, 8, 6), new MeshBasicMaterial({ color: '#fff2a5', depthTest: false }))
        dot.renderOrder = 20
        dot.visible = false
        effects.add(dot)
        dots.push(dot)
      }
    }
    if (playback.mode === 'flow') {
      // Moving markers replace the static electron markers in the original diagram.
      build(buildModel(state).filter(part => !part.id.startsWith('electron-')), state.cutaway)
      tracks = []
    } else {
      const descriptors = transitionParts(state)
      // Fit to the finished stage, then keep the camera still during construction.
      build(buildModel(state), state.cutaway)
      build(descriptors.map(track => track.part), state.cutaway, false)
      tracks = descriptors.flatMap((track) => {
        const mesh = group.getObjectByName(track.part.id)
        return mesh instanceof Mesh ? [{ track, mesh, baseZ: mesh.position.z, fromColor: new Color(track.from?.color || track.part.color), toColor: new Color(track.part.color) }] : []
      })
      scanner = new Mesh(new BoxGeometry(0.07, 0.025, 4.15), new MeshBasicMaterial({ color: '#fff2a5', transparent: true, opacity: 0.55, depthTest: false }))
      scanner.renderOrder = 15
      effects.add(scanner)
    }
  }
  function advance(time: number) {
    if (!playback) return
    const sample = samplePlayback(playback.state, playback.mode, playback.elapsed)
    const state = stepState(playback.state, sample.step)
    if (sample.step !== playback.stage) {
      playback.stage = sample.step
      prepareStage(state)
      lastNotice = -Infinity
    }
    const progress = playback.options.reducedMotion ? 1 : sample.progress
    if (playback.mode === 'process') {
      for (const { track, mesh, baseZ, fromColor, toColor } of tracks) {
        const pose = transitionPose(track, progress)
        mesh.position.set(pose.position[0], pose.position[1], baseZ)
        mesh.scale.set(...pose.scale)
        mesh.visible = pose.opacity > 0.001
        const material = mesh.material as MeshStandardMaterial
        material.opacity = pose.opacity
        material.transparent = pose.opacity < 1
        material.depthWrite = pose.opacity >= 1
        material.color.lerpColors(fromColor, toColor, pose.blend)
        if (track.part.kind === 'wire') {
          const count = mesh.geometry.index?.count || 0
          const fraction = track.effect === 'grow' ? pose.blend : track.effect === 'remove' ? 1 - pose.blend : 1
          mesh.geometry.setDrawRange(0, Math.floor(count * fraction / 3) * 3)
        }
      }
      if (scanner) {
        scanner.visible = !playback.options.reducedMotion && !sample.finished && (state.scene === 'packaging' && [0, 6].includes(state.step) || state.scene === 'wafer-process' && [3, 8].includes(state.step) && state.lesson === 'patterning')
        scanner.position.set(-3.3 + 6.6 * sample.progress, state.scene === 'packaging' ? state.step === 0 ? 0.79 : 2.9 : 2.35, state.cutaway ? -1 : 0)
        scanner.scale.z = state.cutaway ? 0.5 : 1
      }
    }
    if (dots.length) {
      const phase = playback.options.reducedMotion ? Math.floor(sample.progress * 4) / 4 : sample.progress
      let index = 0
      const paths = playback.mode === 'flow' ? flowPaths(state, phase) : processFlowPaths(state, phase)
      for (const path of paths) {
        for (let n = 0; n < path.count; n++) {
          const dot = dots[index++]!
          const travel = (phase * 2 + n / path.count) % 1
          const point = pointOnPath(path.points, path.reverse ? 1 - travel : travel)
          dot.position.set(...point)
          dot.material.color.set(path.color)
          dot.visible = true
        }
      }
      for (; index < dots.length; index++) dots[index]!.visible = false
    }
    if (time - lastNotice >= 120 || sample.finished) {
      playback.options.onProgress(sample)
      lastNotice = time
    }
    if (sample.finished) {
      playing = false
      lastTime = null
      clearEffects()
    }
  }
  function view(direction: 'iso' | 'top' | 'side') {
    camera.up.set(0, 1, 0)
    if (direction === 'top') camera.position.set(0, 22, 0.01)
    else if (direction === 'side') camera.position.set(0, 2.8, 22)
    else camera.position.set(12, 11, 15)
    camera.zoom = 1
    camera.updateProjectionMatrix()
    controls.update()
    fit()
    render()
  }
  const resize = new ResizeObserver(() => {
    if (disposed) return
    const width = mount.clientWidth
    const height = mount.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height)
    fit()
    render()
  })
  resize.observe(mount)
  function contextLost(event: Event) {
    event.preventDefault()
    if (!disposed) onFailure()
  }
  renderer.domElement.addEventListener('webglcontextlost', contextLost)
  view('iso')
  return {
    update,
    view,
    rotate(direction) {
      const target = controls.target
      const offset = camera.position.clone().sub(target)
      offset.applyAxisAngle(new Vector3(0, 1, 0), direction * Math.PI / 10)
      camera.position.copy(target).add(offset)
      controls.update()
      render()
    },
    zoom(factor) {
      camera.zoom = Math.max(0.6, Math.min(2.5, camera.zoom * factor))
      camera.updateProjectionMatrix()
      render()
    },
    play(state, mode, options) {
      pause()
      playback = { state: { ...state }, mode, options: { ...options }, elapsed: 0, stage: -1 }
      lastNotice = -Infinity
      playing = true
      render()
    },
    pause,
    resume() {
      if (!playback || playing) return
      playing = true
      lastTime = null
      render()
    },
    speed(factor) { if (playback) playback.options.speed = factor },
    dispose() {
      if (disposed) return
      disposed = true
      playing = false
      playback = null
      cancelAnimationFrame(frame)
      resize.disconnect()
      controls.removeEventListener('change', render)
      controls.dispose()
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      clear()
      clearEffects()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
      labelLayer.remove()
    },
  }
}
