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
    style: [
      {
        selector: "node",
        style: {
          label: "data(label)",
          "text-valign": "center",
          "text-halign": "center",
          color: "#fff",
          "font-size": "13px",
          "text-wrap": "wrap",
          "text-max-width": "90px"
        }
      },
      {
        selector: 'node[type="concept"]',
        style: {
          "background-color": "#c59b27",
          width: 74,
          height: 74,
          "font-size": "16px",
          "font-weight": "bold"
        }
      },
      {
        selector: 'node[type="surah"]',
        style: {
          "background-color": "#1b4d3e",
          width: "data(size)",
          height: "data(size)"
        }
      },
      {
        selector: 'node[type="verse"]',
        style: {
          "background-color": "#2b6cb0",
          width: 46,
          height: 46,
          "font-size": "11px"
        }
      },
      {
        selector: 'edge[edgeType="hierarchy"]',
        style: {
          width: 2,
          "line-color": "#cbd5e1",
          "curve-style": "bezier",
          label: "data(label)",
          "font-size": "10px",
          color: "#475569"
        }
      },
      {
        selector: 'edge[edgeType="cooccur"]',
        style: {
          width: "data(weight)",
          "line-color": "#d97706",
          "line-style": "dashed",
          "curve-style": "unbundled-bezier",
          opacity: 0.65,
          label: "data(label)",
          "font-size": "9px",
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

function computeSurahCooccurrenceEdges(surahIds) {
  if (!quranData.surah_signatures || surahIds.length < 2) return [];
  const edges = [];
  // Compare top signature stems across matched Surahs (limit to top 25 Surahs for clarity)
  const targetSurahs = surahIds.slice(0, 25);

  for (let i = 0; i < targetSurahs.length; i++) {
    for (let j = i + 1; j < targetSurahs.length; j++) {
      const sA = targetSurahs[i];
      const sB = targetSurahs[j];
      const sigA = new Set(quranData.surah_signatures[String(sA)] || []);
      const sigB = new Set(quranData.surah_signatures[String(sB)] || []);
      if (sigA.size === 0 || sigB.size === 0) continue;

      let shared = 0;
      sigA.forEach((w) => {
        if (sigB.has(w)) shared++;
      });

      const jaccard = shared / (sigA.size + sigB.size - shared);
      if (jaccard >= 0.16) {
        edges.push({
          data: {
            id: `co_${sA}_${sB}`,
            source: `s_${sA}`,
            target: `s_${sB}`,
            edgeType: "cooccur",
            weight: Math.min(4, Math.max(1.5, jaccard * 12)),
            label: `${Math.round(jaccard * 100)}%`
          }
        });
      }
    }
  }
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
      if (o.tag.startsWith("NOUN")) nounCount++;
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

  document.getElementById("statusOverlay").textContent =
    `نتائج "${rawQuery}": ${matchedOccs.length} موضع في ${surahIds.length} سورة`;

  const elements = [
    { data: { id: "concept", label: rawQuery, type: "concept" } }
  ];

  surahIds.forEach((sId) => {
    const count = currentMatchesBySurah[sId].length;
    const surahName = quranData.surahs[sId] || `سورة ${sId}`;
    elements.push({
      data: {
        id: `s_${sId}`,
        label: `${surahName}\n(${count})`,
        type: "surah",
        surahId: sId,
        size: Math.min(64, 38 + count * 2)
      }
    });
    elements.push({
      data: {
        id: `e_c_${sId}`,
        source: "concept",
        target: `s_${sId}`,
        edgeType: "hierarchy",
        label: `${count}`
      }
    });
  });

  if (showCooccur) {
    elements.push(...computeSurahCooccurrenceEdges(surahIds));
  }

  cy.elements().remove();
  cy.add(elements);
  cy.layout({ name: "cose", animate: true, nodeRepulsion: 9000 }).run();
}

function expandSurahNode(surahId) {
  const occs = currentMatchesBySurah[surahId] || [];
  cy.nodes('[type="verse"]').remove();

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
  cy.layout({ name: "cose", animate: true, nodeRepulsion: 6500 }).run();

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
  document.getElementById("cooccurToggle").checked = true;
  runSearch(lastQuery);
});

init();