/**
 * In-browser 3D: Wavefront OBJ relative to this page. Keep the matching .mtl in the same folder
 * (e.g. models/111-MODEL-SAMPLE.mtl) — the viewer loads it automatically via MTLLoader + OBJLoader.
 * Very large OBJs (100MB+) may be slow or fail in the browser — use a decimated mesh for web.
 */
window.DELIVERABLES_OBJ_URL = "models/111-MODEL-SAMPLE.obj";

/**
 * Optional Sketchfab embed (used only if DELIVERABLES_OBJ_URL is "").
 */
window.SKETCHFAB_DELIVERABLES_EMBED_SRC = "";

/**
 * Optional .rvt download link (used only if OBJ and Sketchfab are both unset).
 */
window.DELIVERABLES_RVT_URL = "";
