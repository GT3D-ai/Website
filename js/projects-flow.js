(function () {
  var STORAGE_KEY = "gt3d_projects";
  var SESSION_KEY = "gt3d_upload_project";

  function parseProjects() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveProjects(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  window.GT3DProjects = {
    getProjects: parseProjects,
    saveProjects: saveProjects,
    addProject: function (project) {
      var list = parseProjects();
      if (project.id) {
        var existing = list.find(function (p) {
          return p.id === project.id;
        });
        if (existing) return existing;
      } else {
        project.id = "p-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
      }
      project.createdAt = project.createdAt || new Date().toISOString();
      list.push(project);
      saveProjects(list);
      return project;
    },
    setUploadSession: function (obj) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(obj));
    },
    getUploadSession: function () {
      try {
        var raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    clearUploadSession: function () {
      sessionStorage.removeItem(SESSION_KEY);
    },
  };
})();
