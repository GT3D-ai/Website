/**
 * In-browser 3D: glTF / GLB (preferred) or Wavefront OBJ + MTL relative to this page.
 * For OBJ, keep the matching .mtl in the same folder. GLB can use Draco mesh compression (decoder loads from Google CDN).
 */
window.DELIVERABLES_MODEL_URL = "models/basic-3d-model-example-3d-view.glb";

/** @deprecated Use DELIVERABLES_MODEL_URL. If MODEL_URL is empty, this is used as fallback. */
window.DELIVERABLES_OBJ_URL = "";

/**
 * Optional Sketchfab embed (used only if DELIVERABLES_MODEL_URL and DELIVERABLES_OBJ_URL are both "").
 */
window.SKETCHFAB_DELIVERABLES_EMBED_SRC = "";

/**
 * Optional .rvt download link (used only if no local/WebGL model and no Sketchfab).
 */
window.DELIVERABLES_RVT_URL = "";
