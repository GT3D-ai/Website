/**
 * Month calendar + blocked-date helpers for scan scheduler and admin.
 */
(function (global) {
  var MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function toISODate(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function parseISODate(s) {
    var p = String(s).split("-");
    if (p.length !== 3) return null;
    var y = +p[0];
    var m = +p[1] - 1;
    var day = +p[2];
    var d = new Date(y, m, day);
    if (d.getFullYear() !== y || d.getMonth() !== m || d.getDate() !== day) return null;
    return d;
  }

  function startOfToday() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function isBeforeDay(a, b) {
    return a.getTime() < b.getTime();
  }

  function fetchBlocked(url) {
    return fetch(url, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("blocked list");
        return r.json();
      })
      .then(function (data) {
        var arr = data && data.blocked;
        if (!Array.isArray(arr)) return new Set();
        return new Set(arr.filter(Boolean));
      })
      .catch(function () {
        return new Set();
      });
  }

  function renderMonthGrid(container, options) {
    var year = options.year;
    var month = options.month;
    var blockedSet = options.blockedSet;
    var mode = options.mode;
    var selectedISO = options.selectedISO;
    var onDayClick = options.onDayClick;

    var first = new Date(year, month, 1);
    var startPad = first.getDay();
    var dim = new Date(year, month + 1, 0).getDate();

    var header = document.createElement("div");
    header.className = "schedule-calendar__header";

    var today = startOfToday();
    var nowMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    var viewMonthStart = new Date(year, month, 1);

    var prev = document.createElement("button");
    prev.type = "button";
    prev.className = "btn btn-outline schedule-calendar__nav";
    prev.setAttribute("aria-label", "Previous month");
    prev.textContent = "←";
    var allowPastMonths = !!options.allowPastMonths;
    prev.disabled =
      !allowPastMonths && viewMonthStart.getTime() <= nowMonthStart.getTime();

    var title = document.createElement("h2");
    title.className = "schedule-calendar__title";
    title.id = options.titleId || "schedule-calendar-title";
    title.textContent = MONTHS[month] + " " + year;

    var next = document.createElement("button");
    next.type = "button";
    next.className = "btn btn-outline schedule-calendar__nav";
    next.setAttribute("aria-label", "Next month");
    next.textContent = "→";

    prev.addEventListener("click", function () {
      if (!prev.disabled) options.onNavigate(-1);
    });
    next.addEventListener("click", function () {
      options.onNavigate(1);
    });

    header.appendChild(prev);
    header.appendChild(title);
    header.appendChild(next);

    var grid = document.createElement("div");
    grid.className = "schedule-calendar__grid";
    grid.setAttribute("role", "grid");
    grid.setAttribute("aria-labelledby", title.id);

    DOW.forEach(function (label) {
      var h = document.createElement("div");
      h.className = "schedule-calendar__dow";
      h.textContent = label;
      h.setAttribute("role", "columnheader");
      grid.appendChild(h);
    });

    for (var i = 0; i < startPad; i++) {
      var empty = document.createElement("div");
      empty.className = "schedule-calendar__cell schedule-calendar__cell--empty";
      empty.setAttribute("role", "presentation");
      grid.appendChild(empty);
    }

    for (var day = 1; day <= dim; day++) {
      var d = new Date(year, month, day);
      var iso = toISODate(d);
      var isPast = isBeforeDay(d, today);
      var isBlocked = blockedSet.has(iso);
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "schedule-calendar__day";
      cell.textContent = String(day);
      cell.setAttribute("role", "gridcell");
      cell.dataset.date = iso;

      if (mode === "scheduler") {
        if (isPast || isBlocked) {
          cell.disabled = true;
          cell.classList.add("schedule-calendar__day--disabled");
          if (isBlocked) cell.classList.add("schedule-calendar__day--blocked");
          cell.setAttribute("aria-label", day + (isBlocked ? ", unavailable" : ", past"));
        } else {
          cell.setAttribute("aria-label", "Select " + iso);
          if (selectedISO === iso) {
            cell.classList.add("schedule-calendar__day--selected");
            cell.setAttribute("aria-selected", "true");
          }
          cell.addEventListener("click", function (ev) {
            onDayClick(ev.currentTarget.dataset.date);
          });
        }
      } else if (mode === "admin") {
        cell.disabled = false;
        if (isBlocked) {
          cell.classList.add("schedule-calendar__day--blocked-admin");
          cell.setAttribute("aria-pressed", "true");
        }
        cell.setAttribute("aria-label", day + (isBlocked ? ", blocked" : ", available"));
        cell.addEventListener("click", function (ev) {
          onDayClick(ev.currentTarget.dataset.date);
        });
      }

      grid.appendChild(cell);
    }

    container.innerHTML = "";
    container.appendChild(header);
    container.appendChild(grid);
  }

  global.GT3DScanCalendar = {
    MONTHS: MONTHS,
    toISODate: toISODate,
    parseISODate: parseISODate,
    startOfToday: startOfToday,
    fetchBlocked: fetchBlocked,
    renderMonthGrid: renderMonthGrid,
  };
})(window);
