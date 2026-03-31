import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";

var renderer, scene, camera, controls, animationId, resizeObserver, hostEl;
var loopRunning = false;

function getModelUrl() {
  var primary =
    typeof window.DELIVERABLES_MODEL_URL === "string" ? window.DELIVERABLES_MODEL_URL.trim() : "";
  if (primary) return primary;
  return typeof window.DELIVERABLES_OBJ_URL === "string" ? window.DELIVERABLES_OBJ_URL.trim() : "";
}

function dispose() {
  loopRunning = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (resizeObserver && hostEl) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (controls) {
    controls.dispose();
    controls = null;
  }
  if (renderer) {
    renderer.dispose();
    if (hostEl && renderer.domElement.parentNode === hostEl) {
      hostEl.removeChild(renderer.domElement);
    }
    renderer = null;
  }
  scene = null;
  camera = null;
  hostEl = null;
}

function fitCameraToObject(object, cam, ctrl) {
  var box = new THREE.Box3().setFromObject(object);
  var center = box.getCenter(new THREE.Vector3());
  var size = box.getSize(new THREE.Vector3());
  var maxDim = Math.max(size.x, size.y, size.z, 1e-6);
  var dist = maxDim * 1.6;
  cam.position.set(center.x + dist * 0.65, center.y + dist * 0.35, center.z + dist * 0.65);
  cam.near = maxDim / 5000;
  cam.far = maxDim * 500;
  cam.updateProjectionMatrix();
  cam.lookAt(center);
  if (ctrl) {
    ctrl.target.copy(center);
    ctrl.update();
  }
}

function startLoop() {
  if (loopRunning) return;
  loopRunning = true;
  function tick() {
    animationId = requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
  }
  tick();
}

function loadGltf(resolvedUrl, loadingEl) {
  var dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
  var loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  loader.load(
    resolvedUrl,
    function (gltf) {
      scene.add(gltf.scene);
      fitCameraToObject(gltf.scene, camera, controls);
      if (loadingEl) loadingEl.hidden = true;
      dracoLoader.dispose();
      startLoop();
    },
    undefined,
    function (err) {
      console.error(err);
      dracoLoader.dispose();
      if (loadingEl) {
        loadingEl.textContent = "Could not load 3D model.";
        loadingEl.hidden = false;
      }
    }
  );
}

function loadObjWithoutMtl(dirBase, objFileName, loadingEl) {
  var objLoader = new OBJLoader();
  objLoader.setPath(dirBase);
  objLoader.load(
    objFileName,
    function (object) {
      object.traverse(function (child) {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.08,
            roughness: 0.82,
          });
        }
      });
      scene.add(object);
      fitCameraToObject(object, camera, controls);
      if (loadingEl) loadingEl.hidden = true;
      startLoop();
    },
    undefined,
    function (err) {
      console.error(err);
      if (loadingEl) {
        loadingEl.textContent = "Could not load 3D model.";
        loadingEl.hidden = false;
      }
    }
  );
}

function loadObjWithMtl(resolvedUrl, loadingEl) {
  var dirBase = resolvedUrl.substring(0, resolvedUrl.lastIndexOf("/") + 1);
  var objFileName = resolvedUrl.substring(resolvedUrl.lastIndexOf("/") + 1);
  var mtlFileName = objFileName.replace(/\.obj$/i, ".mtl");

  var mtlLoader = new MTLLoader();
  mtlLoader.setPath(dirBase);
  mtlLoader.load(
    mtlFileName,
    function (materials) {
      materials.preload();
      var objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath(dirBase);
      objLoader.load(
        objFileName,
        function (object) {
          scene.add(object);
          fitCameraToObject(object, camera, controls);
          if (loadingEl) loadingEl.hidden = true;
          startLoop();
        },
        undefined,
        function () {
          loadObjWithoutMtl(dirBase, objFileName, loadingEl);
        }
      );
    },
    undefined,
    function () {
      loadObjWithoutMtl(dirBase, objFileName, loadingEl);
    }
  );
}

function initDeliverablesObjViewer() {
  dispose();

  var modelUrl = getModelUrl();
  if (!modelUrl) return;

  hostEl = document.getElementById("deliverables-obj-canvas-host");
  var loadingEl = document.getElementById("deliverables-obj-loading");
  if (!hostEl) return;

  if (loadingEl) {
    loadingEl.hidden = false;
    loadingEl.textContent = "Loading 3D model…";
  }

  var resolved = new URL(modelUrl, window.location.href).href;
  var isGltf = /\.glb$/i.test(resolved) || /\.gltf$/i.test(resolved);

  var width = Math.max(hostEl.clientWidth, 320);
  var height = Math.max(hostEl.clientHeight, 240);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.001, 1e7);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  hostEl.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(30, 80, 40);
  scene.add(dirLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;

  if (isGltf) {
    loadGltf(resolved, loadingEl);
  } else {
    loadObjWithMtl(resolved, loadingEl);
  }

  resizeObserver = new ResizeObserver(function () {
    if (!renderer || !hostEl || !camera) return;
    var w = Math.max(hostEl.clientWidth, 1);
    var h = Math.max(hostEl.clientHeight, 1);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  resizeObserver.observe(hostEl);
}

window.__deliverablesInitObjViewer = function () {
  initDeliverablesObjViewer();
};
window.__deliverablesDisposeObjViewer = dispose;
