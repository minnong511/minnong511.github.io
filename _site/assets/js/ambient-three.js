import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const mount = document.getElementById("study-space");

if (mount && !document.body.classList.contains("photo-immersive") && !document.body.classList.contains("writer-page")) {
  const isMobile = window.matchMedia("(max-width: 760px)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = isMobile ? 7.5 : 6.4;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile, powerPreference: "low-power" });
  } catch (error) {
    mount.hidden = true;
  }

  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.15 : 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.position.set(isMobile ? 0.7 : 2.4, isMobile ? -0.5 : 0.1, 0);
    scene.add(group);

    const nodeCount = isMobile ? 46 : 100;
    const positions = new Float32Array(nodeCount * 3);
    const points = [];

    for (let index = 0; index < nodeCount; index += 1) {
      const radius = 1.2 + Math.random() * 3.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const point = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
      positions[index * 3] = point.x;
      positions[index * 3 + 1] = point.y;
      positions[index * 3 + 2] = point.z;
      points.push(point);
    }

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pointMaterial = new THREE.PointsMaterial({
      color: 0x78f2c1,
      size: isMobile ? 0.035 : 0.028,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const pointCloud = new THREE.Points(pointGeometry, pointMaterial);
    group.add(pointCloud);

    const linePositions = [];
    const connectionLimit = isMobile ? 34 : 90;
    let connections = 0;

    for (let first = 0; first < points.length && connections < connectionLimit; first += 1) {
      for (let second = first + 1; second < points.length && connections < connectionLimit; second += 1) {
        if (points[first].distanceTo(points[second]) < 0.78) {
          linePositions.push(
            points[first].x, points[first].y, points[first].z,
            points[second].x, points[second].y, points[second].z
          );
          connections += 1;
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x78a8ff,
      transparent: true,
      opacity: 0.11,
      depthWrite: false
    });
    group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

    const wireGeometry = new THREE.IcosahedronGeometry(isMobile ? 1.25 : 1.55, 1);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x78f2c1,
      wireframe: true,
      transparent: true,
      opacity: 0.045,
      depthWrite: false
    });
    const wireShape = new THREE.Mesh(wireGeometry, wireMaterial);
    group.add(wireShape);

    const pointerTarget = { x: 0, y: 0 };
    const pointerCurrent = { x: 0, y: 0 };

    if (!isMobile && !reduceMotion) {
      window.addEventListener("pointermove", (event) => {
        pointerTarget.x = (event.clientX / window.innerWidth - 0.5) * 0.24;
        pointerTarget.y = (event.clientY / window.innerHeight - 0.5) * 0.18;
      }, { passive: true });
    }

    function updateColors(theme) {
      const light = theme === "light";
      pointMaterial.color.setHex(light ? 0x0c9b6d : 0x78f2c1);
      pointMaterial.opacity = light ? 0.28 : 0.48;
      lineMaterial.color.setHex(light ? 0x4268c9 : 0x78a8ff);
      lineMaterial.opacity = light ? 0.08 : 0.11;
      wireMaterial.color.setHex(light ? 0x0c9b6d : 0x78f2c1);
    }

    updateColors(document.documentElement.dataset.theme);
    window.addEventListener("study-theme-change", (event) => updateColors(event.detail.theme));

    let frameId;
    let elapsed = 0;

    function render() {
      if (!reduceMotion) {
        elapsed += 0.003;
        pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.03;
        pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.03;
        group.rotation.y = elapsed + pointerCurrent.x;
        group.rotation.x = Math.sin(elapsed * 0.72) * 0.08 + pointerCurrent.y;
        wireShape.rotation.x -= 0.0014;
        wireShape.rotation.z += 0.001;
      }

      renderer.render(scene, camera);
      if (!reduceMotion) frameId = window.requestAnimationFrame(render);
    }

    render();

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth <= 760 ? 1.15 : 1.5));
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (reduceMotion) return;
      if (document.hidden) {
        window.cancelAnimationFrame(frameId);
      } else {
        frameId = window.requestAnimationFrame(render);
      }
    });
  }
}
