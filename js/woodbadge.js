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
   CONFIG
============================================================ */
// Relative path — works locally (127.0.0.1) and on GitHub Pages.
// Must end with a trailing slash.
const EVIDENCE_PATH = "photos/evidence/";

const DEBUG_PHOTOS = true; // set false to silence photo logging

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

  // Single photo/docs column: matches "SupportingDocuments", "Supporting Docs",
  // "Documents", or a "Photos" column.
  const idx = {
    cluster:    findCol(h => h === "cluster"),
    module:     findCol(h => h === "module"),
    subsection: findCol(h => h.startsWith("subsection") || h.includes("element")),
    content:    findCol(h => h.startsWith("content")),
    docs:       findCol(h =>
                  h.includes("supporting") ||
                  h === "documents" ||
                  h.startsWith("photo")
                ),
  };

  // Diagnostics — remove once photos work
  console.log("COLUMN INDEXES:", idx);
  console.log("HEADERS:", header);

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
      supportingDocuments: idx.docs > -1 ? (row[idx.docs] || "").trim() : "",
    };
  });

  const filtered = out.filter(item => item.cluster && item.module);

  console.log("FIRST ROW DOCS:", filtered[0]?.supportingDocuments || "(empty)");

  return filtered;
}

/* ============================================================
   SUPPORTING DOCUMENTS / PHOTOS
============================================================ */
function parseSupportingDocuments(value) {
  if (!value) return [];

  return value
    .split(";")
    .map(name => name.trim())
    .filter(Boolean)
    .map(entry => {
      // allow "Caption|filename.jpg" OR just "filename.jpg"
      const parts = entry.split("|");
      const hasCaption = parts.length > 1;
      const file = (hasCaption ? parts[1] : parts[0]).trim();
      const caption = hasCaption ? parts[0].trim() : prettify(file);

      // If it's already a full URL, use as-is; otherwise prepend the repo folder.
      const isAbsolute = /^https?:\/\//i.test(file);
      const src = isAbsolute ? file : EVIDENCE_PATH + file;

      return { caption, src };
    });
}

function prettify(filename) {
  return filename
    .replace(/^.*\//, "")          // drop any path
    .replace(/\.[^.]+$/, "")        // drop extension
    .replace(/[-_]/g, " ");         // dashes/underscores → spaces
}

function logPhoto(status, doc, extra = "") {
  if (!DEBUG_PHOTOS) return;
  console.log(
    `%c[PHOTO ${status}]`, "color:#2563eb;font-weight:bold",
    `\n  caption: ${doc.caption}`,
    `\n  resolved src: ${doc.src}`,
    `\n  full URL: ${new URL(doc.src, window.location.href).href}`,
    extra ? `\n  note: ${extra}` : ""
  );
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
      documents: parseSupportingDocuments(item.supportingDocuments),
    });
  });

  container.innerHTML = "";

  Object.entries(grouped).forEach(([clusterId, cluster], index) => {
    const panel = document.createElement("div");
    panel.className = `tab-panel ${index === 0 ? "active" : ""}`;
    panel.id = slugify(clusterId);

    panel.innerHTML = `
      <h3 style="color:var(--accent);">Cluster ${escapeHTML(clusterId)}</h3>
    `;

    Object.entries(cluster.modules).forEach(([moduleTitle, sections], moduleIndex) => {
      const details = document.createElement("details");
      details.className = "detail-block";

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
  const photos = (section.documents && section.documents.length)
    ? `
      <div class="evidence-grid">
        ${section.documents.map(doc => {
          logPhoto("TRY", doc);
          const safeSrc = escapeAttribute(doc.src);
          const safeCap = escapeHTML(doc.caption);
          return `
            <figure class="evidence-card">
              <a href="${safeSrc}" target="_blank" rel="noopener">
                <img src="${safeSrc}" alt="${safeCap}" loading="lazy"
                     onload="window.__photoOK && window.__photoOK(this)"
                     onerror="window.__photoErr && window.__photoErr(this)"
                     data-caption="${safeCap}">
              </a>
              <figcaption>${safeCap}</figcaption>
            </figure>
          `;
        }).join("")}
      </div>
    `
    : "";

  return `
    <div class="field">
      <div class="field-label">${escapeHTML(section.label)}</div>
      <p>${formatContent(section.content)}</p>
      ${photos}
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
  return text.toString().toLowerCase()
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

function escapeAttribute(value) { return escapeHTML(value); }

/* ============================================================
   LIGHTBOX
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

/* ============================================================
   PHOTO LOAD/ERROR HANDLERS (used by inline onload/onerror)
============================================================ */
window.__photoOK = function (img) {
  if (!DEBUG_PHOTOS) return;
  console.log(
    "%c[PHOTO OK]", "color:#16a34a;font-weight:bold",
    `\n  loaded: ${img.currentSrc || img.src}`,
    `\n  natural size: ${img.naturalWidth}x${img.naturalHeight}`,
    `\n  caption: ${img.dataset.caption}`
  );
};

window.__photoErr = function (img) {
  const attempted = new URL(img.getAttribute("src"), window.location.href).href;
  console.error(
    "%c[PHOTO FAILED]", "color:#dc2626;font-weight:bold",
    `\n  caption: ${img.dataset.caption}`,
    `\n  src attribute: ${img.getAttribute("src")}`,
    `\n  full URL browser tried: ${attempted}`,
    `\n  → open that URL in a new tab. 404 = wrong path/filename (check spelling & case).`
  );
  img.closest(".evidence-card")?.style.setProperty("display", "none");
};