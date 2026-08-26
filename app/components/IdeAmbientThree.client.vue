<script setup lang="ts">
// @ts-expect-error -- The pinned Three.js runtime does not include declarations in this project.
import * as THREE from 'three'

const mount = ref<HTMLDivElement | null>(null)
let cleanup = () => {}

onMounted(async () => {
  await nextTick()
  const mountCandidate = mount.value
  if (!mountCandidate) return
  const mountElement: HTMLDivElement = mountCandidate

  const mobileQuery = window.matchMedia('(max-width: 767px)')
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const isMobile = mobileQuery.matches

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100)
  camera.position.z = isMobile ? 12.5 : 10.8

  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobile,
      powerPreference: 'low-power',
    })
  }
  catch {
    mountElement.dataset.threeUnavailable = 'true'
    return
  }

  renderer.setClearColor(0x000000, 0)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  renderer.domElement.style.pointerEvents = 'none'
  mountElement.appendChild(renderer.domElement)

  const network = new THREE.Group()
  scene.add(network)

  let seed = 511
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  const nodeCount = isMobile ? 64 : 148
  const nodePositions = new Float32Array(nodeCount * 3)
  const nodes: THREE.Vector3[] = []

  for (let index = 0; index < nodeCount; index += 1) {
    const angle = random() * Math.PI * 2
    const radius = Math.pow(random(), 0.62)
    const point = new THREE.Vector3(
      Math.cos(angle) * radius * (isMobile ? 3.8 : 5.8) + (random() - 0.5) * 0.55,
      Math.sin(angle) * radius * (isMobile ? 4.6 : 3.2) + (random() - 0.5) * 0.55,
      (random() - 0.5) * 3.4,
    )

    point.toArray(nodePositions, index * 3)
    nodes.push(point)
  }

  const pointGeometry = new THREE.BufferGeometry()
  pointGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))
  const pointMaterial = new THREE.PointsMaterial({
    color: 0x050505,
    size: isMobile ? 0.055 : 0.045,
    transparent: true,
    opacity: 0.74,
    depthWrite: false,
  })
  network.add(new THREE.Points(pointGeometry, pointMaterial))

  const connectionPositions: number[] = []
  const maximumConnections = isMobile ? 70 : 210
  const distanceLimit = isMobile ? 1.3 : 1.12
  let connectionCount = 0

  for (let first = 0; first < nodes.length && connectionCount < maximumConnections; first += 1) {
    for (let second = first + 1; second < nodes.length && connectionCount < maximumConnections; second += 1) {
      if (nodes[first]!.distanceTo(nodes[second]!) <= distanceLimit) {
        connectionPositions.push(...nodes[first]!.toArray(), ...nodes[second]!.toArray())
        connectionCount += 1
      }
    }
  }

  const connectionGeometry = new THREE.BufferGeometry()
  connectionGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3))
  const connectionMaterial = new THREE.LineBasicMaterial({
    color: 0x050505,
    transparent: true,
    opacity: 0.19,
    depthWrite: false,
  })
  network.add(new THREE.LineSegments(connectionGeometry, connectionMaterial))

  const orbitGeometry = new THREE.TorusKnotGeometry(
    isMobile ? 1.7 : 2.05,
    0.015,
    isMobile ? 88 : 140,
    7,
    2,
    5,
  )
  const orbitMaterial = new THREE.MeshBasicMaterial({
    color: 0x050505,
    wireframe: true,
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
  })
  const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial)
  orbit.rotation.set(0.55, 0.15, -0.4)
  network.add(orbit)

  const planeGeometry = new THREE.PlaneGeometry(
    isMobile ? 7.2 : 11.2,
    isMobile ? 8.7 : 6.2,
    isMobile ? 12 : 22,
    isMobile ? 15 : 12,
  )
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x050505,
    wireframe: true,
    transparent: true,
    opacity: 0.035,
    depthWrite: false,
  })
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.position.z = -2.3
  network.add(plane)

  const pointerTarget = new THREE.Vector2()
  const pointerCurrent = new THREE.Vector2()
  let reduceMotion = motionQuery.matches
  let documentVisible = !document.hidden
  let inViewport = true
  let running = false
  let disposed = false
  let frameId = 0
  let elapsed = 0

  function render() {
    if (!disposed) renderer.render(scene, camera)
  }

  function renderFrame() {
    if (disposed || !running) return

    elapsed += 0.0022
    pointerCurrent.lerp(pointerTarget, 0.035)
    network.rotation.y = Math.sin(elapsed) * 0.11 + pointerCurrent.x
    network.rotation.x = Math.cos(elapsed * 0.7) * 0.035 + pointerCurrent.y
    orbit.rotation.x += 0.0007
    orbit.rotation.z -= 0.00045
    plane.rotation.z = Math.sin(elapsed * 0.6) * 0.012
    render()
    frameId = window.requestAnimationFrame(renderFrame)
  }

  function start() {
    if (disposed || reduceMotion || !documentVisible || !inViewport || running) return
    running = true
    frameId = window.requestAnimationFrame(renderFrame)
  }

  function stop() {
    running = false
    if (frameId) {
      window.cancelAnimationFrame(frameId)
      frameId = 0
    }
  }

  function resize() {
    if (disposed) return
    const rect = mountElement.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width))
    const height = Math.max(1, Math.round(rect.height))

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width <= 767 ? 1.2 : 1.6))
    renderer.setSize(width, height, false)
    if (!running) render()
  }

  function updateTheme(theme = document.documentElement.dataset.theme) {
    const dark = theme === 'dark'
    const color = dark ? 0xffffff : 0x050505

    pointMaterial.color.setHex(color)
    connectionMaterial.color.setHex(color)
    orbitMaterial.color.setHex(color)
    planeMaterial.color.setHex(color)
    connectionMaterial.opacity = dark ? 0.23 : 0.19
    planeMaterial.opacity = dark ? 0.05 : 0.035
    if (!running) render()
  }

  function handlePointerMove(event: PointerEvent) {
    if (reduceMotion) return
    const rect = mountElement.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    pointerTarget.set(
      ((event.clientX - rect.left) / rect.width - 0.5) * 0.28,
      ((event.clientY - rect.top) / rect.height - 0.5) * 0.2,
    )
  }

  function handlePointerLeave() {
    pointerTarget.set(0, 0)
  }

  function handleVisibilityChange() {
    documentVisible = !document.hidden
    if (documentVisible) start()
    else stop()
  }

  function handleMotionChange(event: MediaQueryListEvent) {
    reduceMotion = event.matches
    pointerTarget.set(0, 0)

    if (reduceMotion) {
      stop()
      render()
    }
    else {
      start()
    }
  }

  function handleLegacyThemeChange(event: Event) {
    updateTheme((event as CustomEvent<{ theme?: string }>).detail?.theme)
  }

  const resizeObserver = 'ResizeObserver' in window
    ? new ResizeObserver(resize)
    : null
  const intersectionObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(([entry]) => {
        inViewport = entry?.isIntersecting ?? true
        if (inViewport) start()
        else stop()
      })
    : null
  const themeObserver = new MutationObserver(() => updateTheme())

  if (resizeObserver) resizeObserver.observe(mountElement)
  else window.addEventListener('resize', resize, { passive: true })
  intersectionObserver?.observe(mountElement)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  motionQuery.addEventListener('change', handleMotionChange)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('study-theme-change', handleLegacyThemeChange)

  if (!isMobile) {
    mountElement.addEventListener('pointermove', handlePointerMove, { passive: true })
    mountElement.addEventListener('pointerleave', handlePointerLeave, { passive: true })
  }

  updateTheme()
  resize()
  if (reduceMotion) render()
  else start()

  cleanup = () => {
    disposed = true
    stop()
    resizeObserver?.disconnect()
    intersectionObserver?.disconnect()
    themeObserver.disconnect()
    if (!resizeObserver) window.removeEventListener('resize', resize)
    motionQuery.removeEventListener('change', handleMotionChange)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('study-theme-change', handleLegacyThemeChange)
    mountElement.removeEventListener('pointermove', handlePointerMove)
    mountElement.removeEventListener('pointerleave', handlePointerLeave)

    pointGeometry.dispose()
    connectionGeometry.dispose()
    orbitGeometry.dispose()
    planeGeometry.dispose()
    pointMaterial.dispose()
    connectionMaterial.dispose()
    orbitMaterial.dispose()
    planeMaterial.dispose()
    scene.clear()
    renderer.renderLists.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
    renderer.domElement.remove()
  }
})

onBeforeUnmount(() => cleanup())
</script>

<template>
  <div
    ref="mount"
    class="study-space ide-ambient-three"
    aria-hidden="true"
  />
</template>

<style scoped>
.ide-ambient-three {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.ide-ambient-three :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
