let quranData = null;
let cy = null;
let currentMatchesBySurah = {};

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
    const res = await fetch("data/quran_index.json");
    quranData = await res.json();
    status.textContent = `تم تحميل ${Object.keys(quranData.stems).length.toLocaleString()} جذر/كلمة قرآنية`;
    initGraph();
    runSearch("رحم");
  } catch (err) {
    status.textContent = "تعذر تحميل data/quran_index.json — تأكد من تشغيل build_data.py وفتح الصفحة عبر خادم محلي.";
    console.error(err);
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
          width: 72,
          height: 72,
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
          width: 44,
          height: 44,
          "font-size": "11px"
        }
      },
      {
        selector: "edge",
        style: {
          width: 2,
          "line-color": "#cbd5e1",
          "curve-style": "bezier",
          label: "data(label)",
          "font-size": "10px",
          color: "#475569"
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

function runSearch(rawQuery) {
  if (!quranData) return;
  const q = normalizeArabic(rawQuery);
  if (!q) return;

  // Match exact or partial stem
  const matchedOccs = [];
  for (const [stem, occs] of Object.entries(quranData.stems)) {
    if (stem === q || stem.includes(q)) {
      matchedOccs.push(...occs);
    }
  }

  currentMatchesBySurah = {};
  matchedOccs.forEach((occ) => {
    if (!currentMatchesBySurah[occ.s]) currentMatchesBySurah[occ.s] = [];
    currentMatchesBySurah[occ.s].push(occ);
  });

  const surahIds = Object.keys(currentMatchesBySurah).map(Number);
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
        label: `${count}`
      }
    });
  });

  cy.elements().remove();
  cy.add(elements);
  cy.layout({ name: "cose", animate: true, nodeRepulsion: 8000 }).run();
}

function expandSurahNode(surahId) {
  const occs = currentMatchesBySurah[surahId] || [];
  // Remove previously expanded verse nodes to keep canvas clean
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
        label: ""
      }
    });
  });

  cy.add(newNodes);
  cy.layout({ name: "cose", animate: true, nodeRepulsion: 6000 }).run();

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
        <strong>الجذع (Stem):</strong> ${occ.stem} |
        <strong>الوسم الصرفي:</strong> ${occ.tag} |
        <strong>الإعراب:</strong> ${occ.role || "—"}
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

init();