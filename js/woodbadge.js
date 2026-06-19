// js/woodbadge.js

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("woodbadge-content");

  if (!container) {
    console.error("Missing #woodbadge-content container in wood-badge.html");
    return;
  }

  if (!WOODBADGE_SHEET_URL || WOODBADGE_SHEET_URL.includes("PASTE_")) {
    container.innerHTML = `
      <p style="color:red;">
        Google Sheet CSV link is missing. Add it in js/woodbadge-data.js.
      </p>
    `;
    return;
  }

  // Cache-busting: timestamp + no-store so sheet edits show up immediately
  fetch(`${WOODBADGE_SHEET_URL}&_=${Date.now()}`, { cache: "no-store" })
    .then(response => {
      if (!response.ok) {
        throw new Error("Could not fetch Google Sheet data.");
      }
      return response.text();
    })
    .then(csvText => {
      const rows = parseCSV(csvText);
      const data = formatRows(rows);

      if (!data.length) {
        container.innerHTML = `
          <p style="color:red;">
            No rows parsed. Check that the URL returns CSV and that your header row
            contains: cluster, module, subsection, content.
          </p>`;
        return;
      }

      renderWoodBadge(data, container);
    })
    .catch(error => {
      console.error(error);
      container.innerHTML = `
        <p style="color:red;">
          Unable to load Wood Badge content. Please check the Google Sheet link.
        </p>
      `;
    });
});

/* ============================================================
   CSV PARSING
============================================================ */
function parseCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentValue += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (currentValue || currentRow.length) {
        currentRow.push(currentValue.trim());
        rows.push(currentRow);
        currentRow = [];
        currentValue = "";
      }

      if (char === "\r" && nextChar === "\n") {
        i++;
      }
    } else {
      currentValue += char;
    }
  }

  if (currentValue || currentRow.length) {
    currentRow.push(currentValue.trim());
    rows.push(currentRow);
  }

  return rows;
}

/* ============================================================
   ROW FORMATTING — flexible header matching + carry-forward
============================================================ */
function formatRows(rows) {
  const header = rows[0].map(h => h.trim().toLowerCase());
  const body = rows.slice(1);

  const findCol = (test) => header.findIndex(test);

  const idx = {
    cluster:    findCol(h => h === "cluster"),
    module:     findCol(h => h === "module"),
    subsection: findCol(h => h.startsWith("subsection") || h.includes("element")),
    content:    findCol(h => h.startsWith("content")),
  };

  let lastCluster = "";
  let lastModule = "";

  const out = body.map(row => {
    let cluster = idx.cluster > -1 ? (row[idx.cluster] || "").trim() : "";
    let module  = idx.module  > -1 ? (row[idx.module]  || "").trim() : "";

    if (cluster) lastCluster = cluster; else cluster = lastCluster;
    if (module)  lastModule  = module;  else module  = lastModule;

    return {
      cluster,
      clusterTitle: "",
      module,
      subsection: idx.subsection > -1 ? (row[idx.subsection] || "").trim() : "",
      content:    idx.content    > -1 ? (row[idx.content]    || "").trim() : "",
    };
  });

  return out.filter(item => item.cluster && item.module);
}

/* ============================================================
   RENDER CLUSTERS
============================================================ */
function renderWoodBadge(data, container) {
  const grouped = {};

  data.forEach(item => {
    const clusterKey = item.cluster;
    const moduleTitle = item.module;

    if (!grouped[clusterKey]) {
      grouped[clusterKey] = { modules: {} };
    }

    if (!grouped[clusterKey].modules[moduleTitle]) {
      grouped[clusterKey].modules[moduleTitle] = [];
    }

    grouped[clusterKey].modules[moduleTitle].push({
      label: item.subsection,
      content: item.content,
    });
  });

  container.innerHTML = "";

  Object.entries(grouped).forEach(([clusterId, cluster], index) => {
    const panel = document.createElement("div");
    panel.className = `tab-panel ${index === 0 ? "active" : ""}`;
    panel.id = slugify(clusterId);

    panel.innerHTML = `
      <h3 style="color:var(--purple);">Cluster ${escapeHTML(clusterId)}</h3>
    `;

    Object.entries(cluster.modules).forEach(([moduleTitle, sections], moduleIndex) => {
      const details = document.createElement("details");
      details.className = "detail-block";   // no "reveal" — keeps content visible

      if (moduleIndex === 0) {
        details.open = true;
      }

      details.innerHTML = `
        <summary>
          <div>
            <h3>${escapeHTML(moduleTitle)}</h3>
            <div class="sub">Module</div>
          </div>
          <span class="chev">+</span>
        </summary>

        <div class="detail-body">
          <div class="field-grid">
            ${sections.map(section => renderSection(section)).join("")}
          </div>
        </div>
      `;

      panel.appendChild(details);
    });

    container.appendChild(panel);
  });

  renderTabs(Object.keys(grouped));
}

function renderSection(section) {
  return `
    <div class="field">
      <div class="field-label">${escapeHTML(section.label)}</div>
      <p>${formatContent(section.content)}</p>
    </div>
  `;
}

/* ============================================================
   TABS
============================================================ */
function renderTabs(clusterNames) {
  const tabsContainer = document.getElementById("woodbadge-tabs");
  if (!tabsContainer) return;

  tabsContainer.innerHTML = "";

  clusterNames.forEach((clusterName, index) => {
    const button = document.createElement("button");
    button.className = `tab-btn ${index === 0 ? "active" : ""}`;
    button.dataset.target = slugify(clusterName);
    button.textContent = clusterName;

    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));

      button.classList.add("active");

      const targetPanel = document.getElementById(button.dataset.target);
      if (targetPanel) targetPanel.classList.add("active");
    });

    tabsContainer.appendChild(button);
  });
}

/* ============================================================
   HELPERS
============================================================ */
function formatContent(text) {
  if (!text) return "";

  return escapeHTML(text)
    .replace(/\n/g, "<br>")
    .replace(/•/g, "<br>•");
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ============================================================
   LIGHTBOX — works for the hard-coded evidence section
============================================================ */
(function initLightbox() {
  const box = document.getElementById("lightbox");
  if (!box) return;

  const img = document.getElementById("lightboxImg");
  const caption = document.getElementById("lightboxCaption");
  const closeBtn = document.getElementById("lightboxClose");

  function open(src, alt) {
    img.src = src;
    img.alt = alt || "";
    caption.textContent = alt || "";
    box.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function close() {
    box.hidden = true;
    img.src = "";
    document.body.style.overflow = "";
  }

  // Delegated click — catches evidence cards (and doc-card images if present)
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".evidence-card a, .doc-card--img");
    if (!card) return;

    const cardImg = card.querySelector("img");
    if (!cardImg || !cardImg.src) return;

    e.preventDefault();

    const cap =
      card.closest(".evidence-card")?.querySelector("figcaption")?.textContent ||
      card.querySelector(".doc-card__caption")?.textContent ||
      cardImg.alt;

    open(cardImg.src, cap);
  });

  closeBtn?.addEventListener("click", close);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
})();