import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const mount = document.getElementById("study-space");

if (mount) {
  const mobileQuery = window.matchMedia("(max-width: 767px)");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isMobile = mobileQuery.matches;
  const reduceMotion = motionQuery.matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.z = isMobile ? 12.5 : 10.8;

  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobile,
      powerPreference: "low-power"
    });
  } catch (error) {
    mount.hidden = true;
  }

  if (renderer) {
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.pointerEvents = "none";
    mount.appendChild(renderer.domElement);

    const network = new THREE.Group();
    scene.add(network);

    let seed = 511;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const nodeCount = isMobile ? 64 : 148;
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodes = [];

    for (let index = 0; index < nodeCount; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = Math.pow(random(), 0.62);
      const point = new THREE.Vector3(
        Math.cos(angle) * radius * (isMobile ? 3.8 : 5.8) + (random() - 0.5) * 0.55,
        Math.sin(angle) * radius * (isMobile ? 4.6 : 3.2) + (random() - 0.5) * 0.55,
        (random() - 0.5) * 3.4
      );
      nodePositions[index * 3] = point.x;
      nodePositions[index * 3 + 1] = point.y;
      nodePositions[index * 3 + 2] = point.z;
      nodes.push(point);
    }

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
    const pointMaterial = new THREE.PointsMaterial({
      color: 0x050505,
      size: isMobile ? 0.055 : 0.045,
      transparent: true,
      opacity: 0.74,
      depthWrite: false
    });
    network.add(new THREE.Points(pointGeometry, pointMaterial));

    const connectionPositions = [];
    const maximumConnections = isMobile ? 70 : 210;
    const distanceLimit = isMobile ? 1.3 : 1.12;
    let connectionCount = 0;

    for (let first = 0; first < nodes.length && connectionCount < maximumConnections; first += 1) {
      for (let second = first + 1; second < nodes.length && connectionCount < maximumConnections; second += 1) {
        if (nodes[first].distanceTo(nodes[second]) <= distanceLimit) {
          connectionPositions.push(
            nodes[first].x, nodes[first].y, nodes[first].z,
            nodes[second].x, nodes[second].y, nodes[second].z
          );
          connectionCount += 1;
        }
      }
    }

    const connectionGeometry = new THREE.BufferGeometry();
    connectionGeometry.setAttribute("position", new THREE.Float32BufferAttribute(connectionPositions, 3));
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: 0x050505,
      transparent: true,
      opacity: 0.19,
      depthWrite: false
    });
    network.add(new THREE.LineSegments(connectionGeometry, connectionMaterial));

    const orbitGeometry = new THREE.TorusKnotGeometry(isMobile ? 1.7 : 2.05, 0.015, isMobile ? 88 : 140, 7, 2, 5);
    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: 0x050505,
      wireframe: true,
      transparent: true,
      opacity: 0.13,
      depthWrite: false
    });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.set(0.55, 0.15, -0.4);
    network.add(orbit);

    const planeGeometry = new THREE.PlaneGeometry(isMobile ? 7.2 : 11.2, isMobile ? 8.7 : 6.2, isMobile ? 12 : 22, isMobile ? 15 : 12);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x050505,
      wireframe: true,
      transparent: true,
      opacity: 0.035,
      depthWrite: false
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.z = -2.3;
    network.add(plane);

    const pointerTarget = { x: 0, y: 0 };
    const pointerCurrent = { x: 0, y: 0 };

    if (!isMobile && !reduceMotion) {
      mount.addEventListener("pointermove", (event) => {
        const rect = mount.getBoundingClientRect();
        pointerTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.28;
        pointerTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.2;
      }, { passive: true });

      mount.addEventListener("pointerleave", () => {
        pointerTarget.x = 0;
        pointerTarget.y = 0;
      }, { passive: true });
    }

    function updateTheme(theme) {
      const color = theme === "dark" ? 0xffffff : 0x050505;
      pointMaterial.color.setHex(color);
      connectionMaterial.color.setHex(color);
      orbitMaterial.color.setHex(color);
      planeMaterial.color.setHex(color);
      connectionMaterial.opacity = theme === "dark" ? 0.23 : 0.19;
      planeMaterial.opacity = theme === "dark" ? 0.05 : 0.035;
    }

    updateTheme(document.documentElement.dataset.theme || "light");
    window.addEventListener("study-theme-change", (event) => updateTheme(event.detail.theme));

    function resize() {
      const rect = mount.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width <= 767 ? 1.2 : 1.6));
      renderer.setSize(width, height, false);
    }

    resize();
    const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    if (resizeObserver) resizeObserver.observe(mount);
    else window.addEventListener("resize", resize, { passive: true });

    let frameId = 0;
    let elapsed = 0;
    let running = false;

    function renderFrame() {
      if (!reduceMotion) {
        elapsed += 0.0022;
        pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.035;
        pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.035;
        network.rotation.y = Math.sin(elapsed) * 0.11 + pointerCurrent.x;
        network.rotation.x = Math.cos(elapsed * 0.7) * 0.035 + pointerCurrent.y;
        orbit.rotation.x += 0.0007;
        orbit.rotation.z -= 0.00045;
        plane.rotation.z = Math.sin(elapsed * 0.6) * 0.012;
      }

      renderer.render(scene, camera);
      if (!reduceMotion && running) frameId = window.requestAnimationFrame(renderFrame);
    }

    function start() {
      if (reduceMotion || running) return;
      running = true;
      frameId = window.requestAnimationFrame(renderFrame);
    }

    function stop() {
      running = false;
      if (frameId) window.cancelAnimationFrame(frameId);
    }

    if (reduceMotion) renderFrame();
    else start();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });
  }
}
