let quranData = null;
let cy = null;
let currentMatchesBySurah = {};
let lastQuery = "رحم";

function normalizeArabic(text) {
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[إأآٱا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "ء")
    .replace(/ئ/g, "ء")
    .trim();
}

async function init() {
  const status = document.getElementById("statusOverlay");
  try {
    const res = await fetch("./data/quran_index.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    quranData = await res.json();
    populateFilterDropdowns();
    initGraph();
    runSearch("رحم");
  } catch (err) {
    status.textContent = "تعذر تحميل data/quran_index.json — افتح الصفحة عبر خادم محلي أو GitHub Pages.";
    console.error(err);
  }
}

function populateFilterDropdowns() {
  const morphSelect = document.getElementById("morphFilter");
  const phrasalSelect = document.getElementById("phrasalFilter");

  if (quranData.meta && quranData.meta.morph_tags) {
    quranData.meta.morph_tags.forEach((tag) => {
      const opt = document.createElement("option");
      opt.value = tag;
      opt.textContent = tag;
      morphSelect.appendChild(opt);
    });
  }

  if (quranData.meta && quranData.meta.phrasal_functions) {
    quranData.meta.phrasal_functions.forEach((fn) => {
      const opt = document.createElement("option");
      opt.value = fn;
      opt.textContent = fn;
      phrasalSelect.appendChild(opt);
    });
  }
}


function initGraph() {
  cy = cytoscape({
    container: document.getElementById("cy"),
    minZoom: 0.5,
    maxZoom: 3,
    style: [
      {
        selector: "node",
        style: {
          label: "data(label)",
          "font-family": "Amiri, Segoe UI, Tahoma, sans-serif",
          "font-weight": "bold",
          "text-wrap": "wrap",
          "text-max-width": "130px"
        }
      },
      {
        selector: 'node[type="concept"]',
        style: {
          "background-color": "#c59b27",
          "border-width": 4,
          "border-color": "#fef08a",
          width: 100,
          height: 100,
          "text-valign": "center",
          "text-halign": "center",
          color: "#ffffff",
          "font-size": "26px"
        }
      },
      {
        selector: 'node[type="surah"]',
        style: {
          "background-color": "#1b4d3e",
          "border-width": 2,
          "border-color": "#ffffff",
          shape: "round-rectangle",
          width: "data(width)",
          height: 46,
          "text-valign": "center",
          "text-halign": "center",
          color: "#ffffff",
          "font-size": "18px",
          padding: "8px"
        }
      },
      {
        selector: 'node[type="verse"]',
        style: {
          "background-color": "#2b6cb0",
          "border-width": 2,
          "border-color": "#dbeafe",
          shape: "round-rectangle",
          width: 84,
          height: 38,
          "text-valign": "center",
          "text-halign": "center",
          color: "#ffffff",
          "font-size": "16px"
        }
      },
      {
        selector: 'edge[edgeType="hierarchy"]',
        style: {
          width: 1.5,
          "line-color": "#cbd5e1",
          "curve-style": "straight",
          label: "data(label)",
          "font-size": "13px",
          color: "#334155"
        }
      },
      {
        selector: 'edge[edgeType="cooccur"]',
        style: {
          width: 2,
          "line-color": "#d97706",
          "line-style": "dashed",
          "curve-style": "bezier",
          opacity: 0.5,
          label: "data(label)",
          "font-size": "12px",
          color: "#b45309"
        }
      }
    ]
  });

  cy.on("tap", "node", (evt) => {
    const node = evt.target;
    const type = node.data("type");
    if (type === "surah") {
      expandSurahNode(node.data("surahId"));
    } else if (type === "verse") {
      showVerseContext(node.data("surahId"), node.data("verseId"), node.data("occ"));
    }
  });
}

// Clean co-occurrence: keep only top 2 strongest links per Surah (>= 0.24 Jaccard) to avoid clutter
function computeSurahCooccurrenceEdges(surahIds) {
  if (!quranData.surah_signatures || surahIds.length < 2) return [];
  const edges = [];
  const addedPairs = new Set();
  const targetSurahs = surahIds.slice(0, 18);

  targetSurahs.forEach((sA) => {
    const sigA = new Set(quranData.surah_signatures[String(sA)] || []);
    if (!sigA.size) return;

    const candidates = [];
    targetSurahs.forEach((sB) => {
      if (sA === sB) return;
      const sigB = new Set(quranData.surah_signatures[String(sB)] || []);
      if (!sigB.size) return;

      let shared = 0;
      sigA.forEach((w) => {
        if (sigB.has(w)) shared++;
      });
      const jaccard = shared / (sigA.size + sigB.size - shared);
      if (jaccard >= 0.24) {
        candidates.push({ sB, jaccard });
      }
    });

    candidates
      .sort((a, b) => b.jaccard - a.jaccard)
      .slice(0, 2)
      .forEach(({ sB, jaccard }) => {
        const pairKey = sA < sB ? `${sA}_${sB}` : `${sB}_${sA}`;
        if (!addedPairs.has(pairKey)) {
          addedPairs.add(pairKey);
          edges.push({
            data: {
              id: `co_${pairKey}`,
              source: `s_${sA}`,
              target: `s_${sB}`,
              edgeType: "cooccur",
              label: `${Math.round(jaccard * 100)}%`
            }
          });
        }
      });
  });

  return edges;
}

function updateCorpusStats(occs) {
  const container = document.getElementById("corpusStatsContent");
  if (!occs.length) {
    container.innerHTML = `<div class="stat-box"><div class="stat-title">النتائج</div><div class="stat-val">0</div></div>`;
    return;
  }

  const tagCounts = {};
  const pfnCounts = {};
  let nounCount = 0;
  let verbCount = 0;

  occs.forEach((o) => {
    if (o.tag) {
      tagCounts[o.tag] = (tagCounts[o.tag] || 0) + 1;
      if (o.tag.startsWith("NOUN") || o.tag === "GERUND") nounCount++;
      if (o.tag.startsWith("VERB")) verbCount++;
    }
    if (o.pfn) {
      pfnCounts[o.pfn] = (pfnCounts[o.pfn] || 0) + 1;
    }
  });

  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];
  const topPfn = Object.entries(pfnCounts).sort((a, b) => b[1] - a[1])[0];
  const nounPct = Math.round((nounCount / occs.length) * 100);
  const verbPct = Math.round((verbCount / occs.length) * 100);

  container.innerHTML = `
    <div class="stat-box">
      <div class="stat-title">نسبة الاسمية / الفعلية</div>
      <div class="stat-val">${nounPct}% اسم | ${verbPct}% فعل</div>
    </div>
    <div class="stat-box">
      <div class="stat-title">أبرز وسم صرفي</div>
      <div class="stat-val">${topTag ? `${topTag[0]} (${topTag[1]})` : "—"}</div>
    </div>
    <div class="stat-box">
      <div class="stat-title">أبرز وظيفة تركيبية</div>
      <div class="stat-val">${topPfn ? `${topPfn[0]} (${topPfn[1]})` : "—"}</div>
    </div>
    <div class="stat-box">
      <div class="stat-title">إجمالي الشواهد</div>
      <div class="stat-val">${occs.length} موضع</div>
    </div>
  `;
}

function renderSurahColumnList(surahIds) {
  const listEl = document.getElementById("surahColumnList");
  const badgeEl = document.getElementById("surahCountBadge");
  badgeEl.textContent = surahIds.length;
  listEl.innerHTML = "";

  surahIds.forEach((sId) => {
    const count = currentMatchesBySurah[sId].length;
    const surahName = quranData.surahs[sId] || `سورة ${sId}`;
    const btn = document.createElement("button");
    btn.className = "surah-row-btn";
    btn.dataset.surahId = sId;
    btn.innerHTML = `
      <span>${sId}. سورة ${surahName}</span>
      <span class="surah-row-badge">${count}</span>
    `;
    btn.addEventListener("click", () => expandSurahNode(sId));
    listEl.appendChild(btn);
  });
}

function applyConcentricLayout() {
  cy.layout({
    name: "concentric",
    animate: true,
    animationDuration: 300,
    fit: true,
    padding: 12,
    avoidOverlap: true,
    minNodeSpacing: 8,
    equidistant: false,
    concentric: (node) => {
      const t = node.data("type");
      if (t === "concept") return 10;
      if (t === "surah") {
        // Pack Surahs into 2 tight inner rings based on frequency
        const label = node.data("label") || "";
        const match = label.match(/\((\d+)\)/);
        const count = match ? parseInt(match[1], 10) : 1;
        return count >= 5 ? 6 : 4;
      }
      return 2; // verse nodes on outer ring
    },
    levelWidth: () => 2
  }).run();
}


function runSearch(rawQuery) {
  if (!quranData) return;
  lastQuery = rawQuery;
  const q = normalizeArabic(rawQuery);
  if (!q) return;

  const selectedMorph = document.getElementById("morphFilter").value;
  const selectedPhrasal = document.getElementById("phrasalFilter").value;
  const showCooccur = document.getElementById("cooccurToggle").checked;

  const matchedOccs = [];
  for (const [stem, occs] of Object.entries(quranData.stems)) {
    if (stem === q || stem.includes(q)) {
      occs.forEach((o) => {
        const morphOk = selectedMorph === "ALL" || o.tag === selectedMorph;
        const phrasalOk = selectedPhrasal === "ALL" || o.pfn === selectedPhrasal;
        if (morphOk && phrasalOk) {
          matchedOccs.push(o);
        }
      });
    }
  }

  updateCorpusStats(matchedOccs);

  currentMatchesBySurah = {};
  matchedOccs.forEach((occ) => {
    if (!currentMatchesBySurah[occ.s]) currentMatchesBySurah[occ.s] = [];
    currentMatchesBySurah[occ.s].push(occ);
  });

  const surahIds = Object.keys(currentMatchesBySurah)
    .map(Number)
    .sort((a, b) => currentMatchesBySurah[b].length - currentMatchesBySurah[a].length);

  renderSurahColumnList(surahIds);

  document.getElementById("statusOverlay").textContent =
    `نتائج "${rawQuery}": ${matchedOccs.length} موضع في ${surahIds.length} سورة`;

  const elements = [
    { data: { id: "concept", label: rawQuery, type: "concept" } }
  ];

  surahIds.forEach((sId) => {
    const count = currentMatchesBySurah[sId].length;
    const surahName = quranData.surahs[sId] || `سورة ${sId}`;
    const labelText = `${surahName} (${count})`;
    elements.push({
      data: {
        id: `s_${sId}`,
        label: labelText,
        type: "surah",
        surahId: sId,
        width: Math.max(105, labelText.length * 10 + 24)
      }
    });
    elements.push({
      data: {
        id: `e_c_${sId}`,
        source: "concept",
        target: `s_${sId}`,
        edgeType: "hierarchy",
        label: ""
      }
    });
  });

  if (showCooccur) {
    elements.push(...computeSurahCooccurrenceEdges(surahIds));
  }

  cy.elements().remove();
  cy.add(elements);
  applyConcentricLayout();
}

function expandSurahNode(surahId) {
  const occs = currentMatchesBySurah[surahId] || [];
  cy.nodes('[type="verse"]').remove();

  // Highlight active Surah button in right column
  document.querySelectorAll(".surah-row-btn").forEach((b) => {
    b.classList.toggle("active", Number(b.dataset.surahId) === surahId);
  });

  const newNodes = [];
  occs.forEach((occ, idx) => {
    const vNodeId = `v_${surahId}_${occ.v}_${idx}`;
    newNodes.push({
      data: {
        id: vNodeId,
        label: `آية ${occ.v}`,
        type: "verse",
        surahId: surahId,
        verseId: occ.v,
        occ: occ
      }
    });
    newNodes.push({
      data: {
        id: `e_${surahId}_${vNodeId}`,
        source: `s_${surahId}`,
        target: vNodeId,
        edgeType: "hierarchy",
        label: ""
      }
    });
  });

  cy.add(newNodes);
  applyConcentricLayout();

  if (occs.length > 0) {
    showVerseContext(surahId, occs[0].v, occs[0]);
  }
}

function showVerseContext(surahId, verseId, occ) {
  const container = document.getElementById("inspectorContent");
  const surahName = quranData.surahs[surahId];
  const prevText = quranData.verses[`${surahId}:${verseId - 1}`];
  const currText = quranData.verses[`${surahId}:${verseId}`] || "";
  const nextText = quranData.verses[`${surahId}:${verseId + 1}`];

  const highlighted = currText.replace(occ.w, `<span class="highlight">${occ.w}</span>`);

  let html = "";
  if (prevText) {
    html += `
      <div class="verse-card context">
        <div class="verse-header"><span>السياق السابق — ${surahName} (${verseId - 1})</span></div>
        <div class="ayah-text">${prevText}</div>
      </div>`;
  }

  html += `
    <div class="verse-card">
      <div class="verse-header">
        <span>سورة ${surahName} — الآية ${verseId}</span>
        <span>الكلمة: ${occ.w}</span>
      </div>
      <div class="ayah-text">${highlighted}</div>
      <div class="morph-meta">
        <div><strong>الجذع (Stem):</strong> ${occ.stem} <span class="tag-pill">${occ.tag || "—"}</span></div>
        <div><strong>الإعراب (Syntactic_Role):</strong> ${occ.role || "—"} | <strong>الإضافة:</strong> ${occ.pos || "—"}</div>
        <div><strong>الوظيفة التركيبية (Phrasal_Function):</strong> ${occ.pfn || "—"} | <strong>الحالة الإعرابية:</strong> ${occ.cm || "—"}</div>
      </div>
    </div>`;

  if (nextText) {
    html += `
      <div class="verse-card context">
        <div class="verse-header"><span>السياق اللاحق — ${surahName} (${verseId + 1})</span></div>
        <div class="ayah-text">${nextText}</div>
      </div>`;
  }

  container.innerHTML = html;
}

document.getElementById("searchBtn").addEventListener("click", () => {
  runSearch(document.getElementById("searchInput").value);
});
document.getElementById("searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch(e.target.value);
});
document.querySelectorAll(".chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    const q = btn.getAttribute("data-q");
    document.getElementById("searchInput").value = q;
    runSearch(q);
  });
});

document.getElementById("morphFilter").addEventListener("change", () => runSearch(lastQuery));
document.getElementById("phrasalFilter").addEventListener("change", () => runSearch(lastQuery));
document.getElementById("cooccurToggle").addEventListener("change", () => runSearch(lastQuery));
document.getElementById("resetFiltersBtn").addEventListener("click", () => {
  document.getElementById("morphFilter").value = "ALL";
  document.getElementById("phrasalFilter").value = "ALL";
  document.getElementById("cooccurToggle").checked = false;
  runSearch(lastQuery);
});

init();