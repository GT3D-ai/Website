import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

const OBJ_URL = new URL("models/390-Golden-Gate-No-Awning.obj", window.location.href).href;

function applyMaterials(object) {
  object.traverse(function (child) {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: 0xd2d4d8,
        metalness: 0.12,
        roughness: 0.58,
        side: THREE.DoubleSide,
      });
    } else if (child.isLineSegments || child.isLine) {
      child.material = new THREE.LineBasicMaterial({ color: 0xb8bcc4 });
    }
  });
}

/**
 * @param {HTMLElement} container
 * @returns {() => void}
 */
export function mountObjViewer(container) {
  let cancelled = false;
  container.innerHTML = "";
  const loading = document.createElement("p");
  loading.className = "deliverables-obj-viewer__loading";
  loading.textContent = "Loading model…";
  container.appendChild(loading);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const ambient = new THREE.AmbientLight(0xffffff, 0.72);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(8, 14, 10);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.38);
  rim.position.set(-6, -4, -8);
  scene.add(rim);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.screenSpacePanning = true;

  let animationId = null;
  let resizeObserver = null;

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w < 2 || h < 2) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  resizeObserver = new ResizeObserver(function () {
    resize();
  });
  resizeObserver.observe(container);

  function animate() {
    if (cancelled) return;
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  const loader = new OBJLoader();
  loader.load(
    OBJ_URL,
    function (object) {
      if (cancelled) return;
      loading.remove();
      container.appendChild(renderer.domElement);
      applyMaterials(object);

      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      object.position.sub(center);

      if (box.isEmpty() || (size.x === 0 && size.y === 0 && size.z === 0)) {
        camera.position.set(0, 0, 10);
        camera.lookAt(0, 0, 0);
      } else {
        const maxDim = Math.max(size.x, size.y, size.z, 1);
        const dist = maxDim * 1.45;
        camera.position.set(dist * 0.85, dist * 0.55, dist * 0.95);
        controls.target.set(0, 0, 0);
        controls.update();
      }

      scene.add(object);
      resize();
      animate();
    },
    function (xhr) {
      if (cancelled) return;
      if (xhr.lengthComputable && xhr.total > 0) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        loading.textContent = "Loading model… " + pct + "%";
      }
    },
    function () {
      if (cancelled) return;
      loading.textContent = "Could not load the 3D model. Try again later.";
    }
  );

  return function dispose() {
    cancelled = true;
    if (animationId !== null) cancelAnimationFrame(animationId);
    animationId = null;
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    controls.dispose();
    renderer.dispose();
    scene.traverse(function (obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(function (m) { m.dispose(); });
        else obj.material.dispose();
      }
    });
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
    container.innerHTML = "";
  };
}

export function setupDeliverablesObjDialog() {
  const dialog = document.getElementById("deliverables-viewer-3d");
  const container = document.getElementById("obj-viewer-root");
  if (!dialog || !container) return;

  let disposeViewer = null;

  dialog.addEventListener("close", function () {
    if (disposeViewer) {
      disposeViewer();
      disposeViewer = null;
    }
  });

  document.querySelectorAll('.deliverables-card[data-viewer="3d"]').forEach(function (card) {
    card.addEventListener("click", function () {
      if (disposeViewer) {
        disposeViewer();
        disposeViewer = null;
      }
      dialog.showModal();
      disposeViewer = mountObjViewer(container);
    });
  });
}

setupDeliverablesObjDialog();
