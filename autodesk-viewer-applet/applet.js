/**
 * Autodesk Viewer (APS) — requires access token + translated model URN.
 * Raster URLs use a plain <img> preview (Viewer does not load arbitrary image URLs).
 */
(function () {
  var container = document.getElementById("viewerContainer");
  var addressEl = document.getElementById("address");
  var tokenEndpointEl = document.getElementById("tokenEndpoint");
  var accessTokenEl = document.getElementById("accessToken");
  var loadBtn = document.getElementById("loadBtn");
  var statusEl = document.getElementById("status");
  var rasterWrap = document.getElementById("rasterWrap");
  var rasterImg = document.getElementById("rasterPreview");
  var viewerWrapper = document.getElementById("viewerWrapper");

  var viewer = null;
  var viewerInitializing = false;

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg || "";
  }

  function isRasterUrl(str) {
    if (!str || !/^https?:\/\//i.test(str)) return false;
    try {
      var path = str.split("?")[0].toLowerCase();
      return /\.(jpe?g|png|gif|webp|svg)$/i.test(path);
    } catch (e) {
      return false;
    }
  }

  function normalizeUrn(raw) {
    var s = raw.trim();
    if (s.toLowerCase().startsWith("urn:")) {
      return s.slice(4);
    }
    return s;
  }

  function getAccessToken(callback) {
    var endpoint = tokenEndpointEl.value.trim();
    if (endpoint) {
      fetch(endpoint, { method: "GET", credentials: "omit", mode: "cors" })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status + " " + r.statusText);
          return r.json();
        })
        .then(function (data) {
          if (!data.access_token) throw new Error("Response missing access_token");
          var exp = typeof data.expires_in === "number" ? data.expires_in : 3600;
          callback(data.access_token, exp);
        })
        .catch(function (err) {
          setStatus("Token request failed: " + (err && err.message ? err.message : String(err)));
          console.error(err);
          callback("", 0);
        });
      return;
    }
    var token = accessTokenEl.value.trim();
    if (token) {
      callback(token, 3600);
      return;
    }
    setStatus("Provide a token endpoint URL or paste an access token.");
    callback("", 0);
  }

  function showRaster(url) {
    viewerWrapper.style.display = "none";
    rasterWrap.hidden = false;
    rasterImg.alt = "Image loaded from URL";
    rasterImg.removeAttribute("src");
    rasterImg.onload = function () {
      setStatus("Raster preview loaded.");
    };
    rasterImg.onerror = function () {
      setStatus("Image failed to load (invalid URL, CORS, or network).");
    };
    rasterImg.src = url;
  }

  function initViewer() {
    return new Promise(function (resolve, reject) {
      if (viewer) {
        resolve(viewer);
        return;
      }
      if (viewerInitializing) {
        reject(new Error("Viewer is already initializing."));
        return;
      }
      if (typeof Autodesk === "undefined" || !Autodesk.Viewing) {
        reject(new Error("Autodesk Viewer script failed to load."));
        return;
      }
      viewerInitializing = true;
      Autodesk.Viewing.Initializer(
        {
          env: "AutodeskProduction",
          api: "derivativeV2",
          getAccessToken: getAccessToken,
        },
        function () {
          try {
            var v = new Autodesk.Viewing.GuiViewer3D(container, { extensions: [] });
            var started = v.start();
            if (!started) {
              viewerInitializing = false;
              reject(new Error("GuiViewer3D failed to start."));
              return;
            }
            viewer = v;
            viewerInitializing = false;
            resolve(viewer);
          } catch (e) {
            viewerInitializing = false;
            reject(e);
          }
        },
        function (err) {
          viewerInitializing = false;
          reject(err || new Error("Initializer failed."));
        }
      );
    });
  }

  function loadUrn(urnRaw) {
    var urn = normalizeUrn(urnRaw);
    if (!urn) {
      setStatus("URN is empty.");
      return;
    }

    function onDocumentLoadSuccess(doc) {
      var defaultModel = doc.getRoot().getDefaultGeometry();
      viewer
        .loadDocumentNode(doc, defaultModel)
        .then(function () {
          setStatus("Model loaded.");
        })
        .catch(function (err) {
          setStatus("loadDocumentNode failed: " + (err && err.message ? err.message : String(err)));
        });
    }

    function onDocumentLoadFailure(code, message) {
      setStatus("Document load failed: " + (message || code));
    }

    Autodesk.Viewing.Document.load("urn:" + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
  }

  loadBtn.addEventListener("click", function () {
    var addr = addressEl.value.trim();
    setStatus("");
    if (!addr) {
      setStatus("Enter a URL or URN.");
      return;
    }

    if (isRasterUrl(addr)) {
      showRaster(addr);
      return;
    }

    if (!tokenEndpointEl.value.trim() && !accessTokenEl.value.trim()) {
      setStatus("For a model URN, provide a token endpoint URL or paste an access token.");
      return;
    }

    rasterWrap.hidden = true;
    viewerWrapper.style.display = "block";

    initViewer()
      .then(function () {
        setStatus("Loading model…");
        loadUrn(addr);
      })
      .catch(function (err) {
        setStatus(err && err.message ? err.message : String(err));
        console.error(err);
      });
  });
})();
