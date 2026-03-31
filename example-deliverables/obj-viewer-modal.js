import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";

var renderer, scene, camera, controls, animationId, resizeObserver, hostEl;
var loopRunning = false;

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

function initDeliverablesObjViewer() {
  dispose();

  var objUrl =
    typeof window.DELIVERABLES_OBJ_URL === "string" ? window.DELIVERABLES_OBJ_URL.trim() : "";
  if (!objUrl) return;

  hostEl = document.getElementById("deliverables-obj-canvas-host");
  var loadingEl = document.getElementById("deliverables-obj-loading");
  if (!hostEl) return;

  if (loadingEl) {
    loadingEl.hidden = false;
    loadingEl.textContent = "Loading 3D model…";
  }

  var resolvedObj = new URL(objUrl, window.location.href).href;
  var dirBase = resolvedObj.substring(0, resolvedObj.lastIndexOf("/") + 1);
  var objFileName = resolvedObj.substring(resolvedObj.lastIndexOf("/") + 1);
  var mtlFileName = objFileName.replace(/\.obj$/i, ".mtl");

  var width = Math.max(hostEl.clientWidth, 320);
  var height = Math.max(hostEl.clientHeight, 240);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.001, 1e7);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  hostEl.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(30, 80, 40);
  scene.add(dirLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;

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
