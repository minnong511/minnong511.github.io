import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { nodes, statusColors } from './simulator'
import type { Simulation } from './simulator'

export function createKubernetesRenderer(host: HTMLElement, select: (name: string) => void, unavailable: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.setClearColor('#101b2c', 1)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(43, 1, .1, 150)
  camera.position.set(12, 17, 20)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0, 1)
  controls.enablePan = false
  controls.minDistance = 16
  controls.maxDistance = 40
  controls.maxPolarAngle = Math.PI / 2.35
  controls.update()
  scene.add(new THREE.AmbientLight('#d8e9ff', 2.5))
  const light = new THREE.DirectionalLight('#ffffff', 3)
  light.position.set(3, 14, 8)
  scene.add(light)
  let group = new THREE.Group()
  scene.add(group)
  let disposed = false
  let frame = 0
  let visible = true
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let down = { x: 0, y: 0 }
  let pickables: THREE.Object3D[] = []
  function render() { if (!disposed && visible) renderer.render(scene, camera) }
  function cleanupGroup(target: THREE.Group) {
    target.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) {
        if ('geometry' in object) object.geometry.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        for (const material of materials) {
          if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose()
          material.dispose()
        }
      }
    })
    target.clear()
  }
  function box(x: number, y: number, z: number, w: number, h: number, d: number, color: string, glow = false) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({
      color, roughness: .65, metalness: .12, emissive: color, emissiveIntensity: glow ? .4 : .03,
    }))
    mesh.position.set(x, y, z)
    group.add(mesh)
    return mesh
  }
  function label(text: string, x: number, y: number, z: number, width = 3.2, color = '#dce8f7') {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 86
    const context = canvas.getContext('2d')!
    context.fillStyle = '#101b2cee'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.font = '500 30px monospace'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = color
    context.fillText(text, 320, 43, 620)
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false }))
    sprite.position.set(x, y, z)
    sprite.scale.set(width, width * 86 / 640, 1)
    group.add(sprite)
  }
  function line(from: THREE.Vector3, to: THREE.Vector3, color: string, strong = false) {
    const geometry = new THREE.BufferGeometry().setFromPoints([from, to])
    group.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: strong ? .85 : .3 })))
  }
  function update(s: Simulation) {
    cancelAnimationFrame(frame)
    scene.remove(group)
    cleanupGroup(group)
    group = new THREE.Group()
    scene.add(group)
    pickables = []
    const cp = ['API Server', 'Deployment Controller', 'ReplicaSet Controller', 'Scheduler', 'etcd']
    box(0, -.3, -4, 16, .35, 3, '#253954')
    label('CONTROL PLANE', 0, 2.3, -5.8, 5, '#a2bbff')
    cp.forEach((name, i) => {
      const x = (i - 2) * 3.05
      const active = s.focus === name || (s.focus === 'deployments' && i === 1) || (s.focus === 'rs' && i === 2)
      box(x, .25, -4, 2.5, .8, 1.5, active ? '#6386d2' : '#3b5275', active)
      label(name === 'Deployment Controller' ? 'Deployment Ctrl' : name === 'ReplicaSet Controller' ? 'ReplicaSet Ctrl' : name, x, 1.05, -4, 2.9)
      line(new THREE.Vector3(x, 0, -3), new THREE.Vector3(x * .8, 0, .4), '#7796d5', active)
    })
    const animated: THREE.Mesh[] = []
    nodes.forEach((node, index) => {
      const x = (index - 1) * 5.4
      box(x, -.25, 2, 4.9, .45, 5, '#223a4c', s.focus === 'Scheduler')
      label(node, x, .25, -.1, 3.3, '#9fbbd0')
      label('kubelet / containerd', x, .2, 4.6, 4, s.focus === 'kubelet' || s.focus === 'containerd' ? '#6ee7ba' : '#b3c4d8')
    })
    label(`${s.activeRS}  |  ${s.image}`, 0, .7, -1.45, 7, s.focus === 'rs' ? '#f6ca75' : '#c0cfdf')
    const nodeCounts: Record<string, number> = {}
    s.pods.forEach(pod => {
      const nodeIndex = pod.node ? nodes.indexOf(pod.node) : -1
      const count = nodeCounts[pod.node || 'pending'] || 0
      nodeCounts[pod.node || 'pending'] = count + 1
      const x = nodeIndex < 0 ? -8.6 : (nodeIndex - 1) * 5.4 + (count % 3 - 1) * 1.42
      const z = nodeIndex < 0 ? 1 + count * 1.5 : 1.25 + Math.floor(count / 3) * 1.7
      const color = statusColors[pod.status]
      const mesh = box(x, .65, z, 1.02, pod.status === 'Terminating' ? .3 : 1.1, 1.02, color, s.selectedPod === pod.name || s.focus === 'pods')
      mesh.userData.podName = pod.name
      pickables.push(mesh)
      label(pod.name.replace('demo-api-', ''), x, 1.55, z, 1.45, color)
      if (s.selectedPod === pod.name || pod.status === 'Pending' || pod.status === 'Terminating') animated.push(mesh)
      if (pod.status === 'Ready') line(new THREE.Vector3(0, 0, 7), new THREE.Vector3(x, .5, z), '#6ee7ba', s.focus === 'endpoints' || s.focus === 'svc')
    })
    box(0, .15, 7, 5.5, .6, 1.3, s.focus === 'svc' || s.focus === 'endpoints' ? '#267b6a' : '#22534f', true)
    label(`Service demo-api  |  Ready ${s.pods.filter(p => p.status === 'Ready').length}`, 0, 1, 7.1, 6, '#8df4cd')
    if (s.pods.some(p => !p.node)) label('Pending / unassigned', -8.6, .5, -.7, 3)
    const start = performance.now()
    function animate(now: number) {
      const progress = motion.matches ? 1 : Math.min(1, (now - start) / 450)
      animated.forEach(mesh => { mesh.scale.setScalar(.8 + .2 * progress) })
      render()
      if (progress < 1 && visible && !disposed) frame = requestAnimationFrame(animate)
    }
    animate(start)
  }
  function resize() {
    const width = Math.max(1, host.clientWidth)
    const height = Math.max(1, host.clientHeight)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.zoom = Math.min(1.7, camera.aspect * 1.15)
    camera.updateProjectionMatrix()
    render()
  }
  function pointerDown(event: PointerEvent) { down = { x: event.clientX, y: event.clientY } }
  function pointerUp(event: PointerEvent) {
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return
    const bounds = renderer.domElement.getBoundingClientRect()
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(pickables)[0]
    if (hit) select(String(hit.object.userData.podName))
  }
  function contextLost(event: Event) { event.preventDefault(); unavailable() }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  const observer = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting)
    if (!visible) cancelAnimationFrame(frame)
    else render()
  })
  observer.observe(host)
  controls.addEventListener('change', render)
  renderer.domElement.addEventListener('pointerdown', pointerDown)
  renderer.domElement.addEventListener('pointerup', pointerUp)
  renderer.domElement.addEventListener('webglcontextlost', contextLost)
  resize()
  return {
    update,
    resetCamera() { camera.position.set(12, 17, 20); controls.target.set(0, 0, 1); controls.update(); render() },
    rotate(direction: number) {
      camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * .2)
      controls.update()
      render()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      observer.disconnect()
      controls.removeEventListener('change', render)
      controls.dispose()
      renderer.domElement.removeEventListener('pointerdown', pointerDown)
      renderer.domElement.removeEventListener('pointerup', pointerUp)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      cleanupGroup(group)
      scene.clear()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    },
  }
}
