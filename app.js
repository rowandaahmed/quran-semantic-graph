let quranData = null;
let cy = null;
let currentMatchesBySurah = {};
let lastQuery = "رحم";
let currentLang = "ar";
let selectedSurahId = null;
let selectedVerseOcc = null;

const I18N = {
  ar: {
    dir: "rtl",
    title: "مستكشف المعاني والأنماط الصرفية",
    searchPlaceholder: "ابحث عن جذر أو معنى (مثال: رحم، علم، صبر، نور، قلب)...",
    searchBtn: "استكشاف",
    examples: "أمثلة:",
    filtersTitle: "تصفية النتائج (Filters)",
    morphLabel: "الوسم الصرفي (Morph_Tag):",
    allTags: "الكل (All Tags)",
    phrasalLabel: "الوظيفة التركيبية (Phrasal_Function):",
    allFunctions: "الكل (All Functions)",
    cooccurLabel: "إظهار روابط التقارب المعجمي (أقوى 3 روابط للسورة)",
    resetBtn: "إعادة ضبط المرشحات",
    surahListTitle: "قائمة السور المطابقة",
    zoomIn: "تكبير",
    zoomOut: "تصغير",
    fitGraph: "احتواء الشبكة",
    legendConcept: "الجذر / المعنى",
    legendSurah: "السورة",
    legendVerse: "الآية",
    legendCooccur: "تقارب معجمي",
    loading: "جاري تحميل بيانات MASAQ...",
    statsTitle: "التوزيع الصرفي والنحوي في المدونة",
    inspectorTitle: "تفاصيل الآيات والسياق",
    inspectorHint: "اختر <strong>سورة</strong> من القائمة أو من الشبكة لعرض جميع آياتها وسياقها.",
    statRatioTitle: "نسبة الاسمية / الفعلية",
    statRatioVal: (n, v) => `${n}% اسم | ${v}% فعل`,
    statTopTag: "أبرز وسم صرفي",
    statTopPfn: "أبرز وظيفة تركيبية",
    statTotal: "إجمالي الشواهد",
    statTotalUnit: (c) => `${c} موضع`,
    statusSummary: (q, m, s) => `نتائج "${q}": ${m} موضع في ${s} سورة`,
    surahPrefix: (id, name) => `${id}. سورة ${name}`,
    verseNode: (v) => `آية ${v}`,
    prevContext: (name, v) => `السياق السابق — ${name} (${v})`,
    currHeader: (name, v) => `سورة ${name} — الآية ${v}`,
    nextContext: (name, v) => `السياق اللاحق — ${name} (${v})`,
    wordLabel: "الكلمة",
    stemLabel: "الجذع (Stem)",
    roleLabel: "الإعراب (Syntactic_Role)",
    posLabel: "الإضافة",
    pfnLabel: "الوظيفة التركيبية",
    cmLabel: "الحالة الإعرابية"
  },
  tr: {
    dir: "ltr",
    title: "Kur'an Anlamsal ve Morfolojik Ağ Gezgini",
    searchPlaceholder: "Kök veya kelime arayın (örn: رحم، علم، صبر، نور، قلب)...",
    searchBtn: "Keşfet",
    examples: "Örnekler:",
    filtersTitle: "Sonuçları Filtrele",
    morphLabel: "Morfolojik Etiket (Morph_Tag):",
    allTags: "Tümü (All Tags)",
    phrasalLabel: "Sözdizimsel İşlev (Phrasal_Function):",
    allFunctions: "Tümü (All Functions)",
    cooccurLabel: "Sureler arası sözlüksel yakınlık bağlarını göster",
    resetBtn: "Filtreleri Sıfırla",
    surahListTitle: "Eşleşen Sureler",
    zoomIn: "Yakınlaştır",
    zoomOut: "Uzaklaştır",
    fitGraph: "Ağı Sığdır",
    legendConcept: "Kök / Kavram",
    legendSurah: "Sure",
    legendVerse: "Ayet",
    legendCooccur: "Sözlüksel yakınlık",
    loading: "MASAQ verileri yükleniyor...",
    statsTitle: "Derlem Morfolojik Dağılımı",
    inspectorTitle: "Ayet Bağlamı ve Dilbilgisi",
    inspectorHint: "Ayetlerini ve bağlamını görmek için listeden veya ağdan bir <strong>Sure</strong> seçin.",
    statRatioTitle: "İsim / Fiil Oranı",
    statRatioVal: (n, v) => `%${n} İsim | %${v} Fiil`,
    statTopTag: "En Sık Morfolojik Etiket",
    statTopPfn: "En Sık Sözdizimsel İşlev",
    statTotal: "Toplam Geçiş",
    statTotalUnit: (c) => `${c} geçiş`,
    statusSummary: (q, m, s) => `"${q}" sonuçları: ${s} surede ${m} geçiş`,
    surahPrefix: (id, name) => `${id}. ${name} Suresi`,
    verseNode: (v) => `Ayet ${v}`,
    prevContext: (name, v) => `Önceki Ayet — ${name} (${v})`,
    currHeader: (name, v) => `${name} Suresi — Ayet ${v}`,
    nextContext: (name, v) => `Sonraki Ayet — ${name} (${v})`,
    wordLabel: "Kelime",
    stemLabel: "Gövde (Stem)",
    roleLabel: "Sözdizimsel Rol",
    posLabel: "İsim Tamlaması",
    pfnLabel: "Öbek İşlevi",
    cmLabel: "İrab / Hal"
  },
  en: {
    dir: "ltr",
    title: "Quranic Semantic & Morphological Explorer",
    searchPlaceholder: "Search Arabic stem or root (e.g., رحم، علم، صبر، نور، قلب)...",
    searchBtn: "Explore",
    examples: "Examples:",
    filtersTitle: "Filter Results",
    morphLabel: "Morphological Tag (Morph_Tag):",
    allTags: "All Tags",
    phrasalLabel: "Phrasal Function (Phrasal_Function):",
    allFunctions: "All Functions",
    cooccurLabel: "Show Surah lexical co-occurrence edges (top links)",
    resetBtn: "Reset Filters",
    surahListTitle: "Matched Surahs",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    fitGraph: "Fit Graph",
    legendConcept: "Root / Concept",
    legendSurah: "Surah",
    legendVerse: "Verse",
    legendCooccur: "Lexical similarity",
    loading: "Loading MASAQ corpus data...",
    statsTitle: "Corpus Morpho-Syntactic Stats",
    inspectorTitle: "Verse Context & Morphology",
    inspectorHint: "Select a <strong>Surah</strong> from the list or graph to inspect its verses and context.",
    statRatioTitle: "Nominal / Verbal Ratio",
    statRatioVal: (n, v) => `${n}% Noun | ${v}% Verb`,
    statTopTag: "Top Morph Tag",
    statTopPfn: "Top Phrasal Function",
    statTotal: "Total Occurrences",
    statTotalUnit: (c) => `${c} matches`,
    statusSummary: (q, m, s) => `"${q}" results: ${m} matches across ${s} Surahs`,
    surahPrefix: (id, name) => `${id}. Surah ${name}`,
    verseNode: (v) => `Verse ${v}`,
    prevContext: (name, v) => `Previous Context — ${name} (${v})`,
    currHeader: (name, v) => `Surah ${name} — Verse ${v}`,
    nextContext: (name, v) => `Next Context — ${name} (${v})`,
    wordLabel: "Token",
    stemLabel: "Stem",
    roleLabel: "Syntactic Role",
    posLabel: "Construct",
    pfnLabel: "Phrasal Function",
    cmLabel: "Case / Mood"
  }
};

const SURAH_NAMES_TR = {
  1:"Fatiha",2:"Bakara",3:"Al-i İmran",4:"Nisa",5:"Maide",6:"En'am",7:"A'raf",8:"Enfal",9:"Tevbe",10:"Yunus",
  11:"Hud",12:"Yusuf",13:"Ra'd",14:"İbrahim",15:"Hicr",16:"Nahl",17:"İsra",18:"Kehf",19:"Meryem",20:"Taha",
  21:"Enbiya",22:"Hac",23:"Mü'minun",24:"Nur",25:"Furkan",26:"Şuara",27:"Neml",28:"Kasas",29:"Ankebut",30:"Rum",
  31:"Lokman",32:"Secde",33:"Ahzab",34:"Sebe",35:"Fatır",36:"Yasin",37:"Saffat",38:"Sad",39:"Zümer",40:"Mü'min",
  41:"Fussilet",42:"Şura",43:"Zuhruf",44:"Duhan",45:"Casiye",46:"Ahkaf",47:"Muhammed",48:"Fetih",49:"Hucurat",50:"Kaf",
  51:"Zariyat",52:"Tur",53:"Necm",54:"Kamer",55:"Rahman",56:"Vakıa",57:"Hadid",58:"Mücadele",59:"Haşr",60:"Mümtehine",
  61:"Saf",62:"Cuma",63:"Münafikun",64:"Tegabun",65:"Talak",66:"Tahrim",67:"Mülk",68:"Kalem",69:"Hakka",70:"Mearic",
  71:"Nuh",72:"Cin",73:"Müzzemmil",74:"Müddessir",75:"Kıyamet",76:"İnsan",77:"Mürselat",78:"Nebe",79:"Naziat",80:"Abese",
  81:"Tekvir",82:"İnfitar",83:"Mutaffifin",84:"İnşikak",85:"Buruc",86:"Tarık",87:"A'la",88:"Gaşiye",89:"Fecr",90:"Beled",
  91:"Şems",92:"Leyl",93:"Duha",94:"İnşirah",95:"Tin",96:"Alak",97:"Kadir",98:"Beyyine",99:"Zilzal",100:"Adiyat",
  101:"Karia",102:"Tekasür",103:"Asr",104:"Hümeze",105:"Fil",106:"Kureyş",107:"Maun",108:"Kevser",109:"Kafirun",110:"Nasr",
  111:"Tebbet",112:"İhlas",113:"Felak",114:"Nas"
};

const SURAH_NAMES_EN = {
  1:"Al-Fatihah",2:"Al-Baqarah",3:"Ali 'Imran",4:"An-Nisa",5:"Al-Ma'idah",6:"Al-An'am",7:"Al-A'raf",8:"Al-Anfal",9:"At-Tawbah",10:"Yunus",
  11:"Hud",12:"Yusuf",13:"Ar-Ra'd",14:"Ibrahim",15:"Al-Hijr",16:"An-Nahl",17:"Al-Isra",18:"Al-Kahf",19:"Maryam",20:"Taha",
  21:"Al-Anbya",22:"Al-Hajj",23:"Al-Mu'minun",24:"An-Nur",25:"Al-Furqan",26:"Ash-Shu'ara",27:"An-Naml",28:"Al-Qasas",29:"Al-'Ankabut",30:"Ar-Rum",
  31:"Luqman",32:"As-Sajdah",33:"Al-Ahzab",34:"Saba",35:"Fatir",36:"Ya-Sin",37:"As-Saffat",38:"Sad",39:"Az-Zumar",40:"Ghafir",
  41:"Fussilat",42:"Ash-Shura",43:"Az-Zukhruf",44:"Ad-Dukhan",45:"Al-Jathiyah",46:"Al-Ahqaf",47:"Muhammad",48:"Al-Fath",49:"Al-Hujurat",50:"Qaf",
  51:"Adh-Dhariyat",52:"At-Tur",53:"An-Najm",54:"Al-Qamar",55:"Ar-Rahman",56:"Al-Waqi'ah",57:"Al-Hadid",58:"Al-Mujadila",59:"Al-Hashr",60:"Al-Mumtahanah",
  61:"As-Saf",62:"Al-Jumu'ah",63:"Al-Munafiqun",64:"At-Taghabun",65:"At-Talaq",66:"At-Tahrim",67:"Al-Mulk",68:"Al-Qalam",69:"Al-Haqqah",70:"Al-Ma'arij",
  71:"Nuh",72:"Al-Jinn",73:"Al-Muzzammil",74:"Al-Muddaththir",75:"Al-Qiyamah",76:"Al-Insan",77:"Al-Mursalat",78:"An-Naba",79:"An-Nazi'at",80:"'Abasa",
  81:"At-Takwir",82:"Al-Infitar",83:"Al-Mutaffifin",84:"Al-Inshiqaq",85:"Al-Buruj",86:"At-Tariq",87:"Al-A'la",88:"Al-Ghashiyah",89:"Al-Fajr",90:"Al-Balad",
  91:"Ash-Shams",92:"Al-Layl",93:"Ad-Duhaa",94:"Ash-Sharh",95:"At-Tin",96:"Al-'Alaq",97:"Al-Qadr",98:"Al-Bayyinah",99:"Az-Zalzalah",100:"Al-'Adiyat",
  101:"Al-Qari'ah",102:"At-Takathur",103:"Al-'Asr",104:"Al-Humazah",105:"Al-Fil",106:"Quraysh",107:"Al-Ma'un",108:"Al-Kawthar",109:"Al-Kafirun",110:"An-Nasr",
  111:"Al-Masad",112:"Al-Ikhlas",113:"Al-Falaq",114:"An-Nas"
};

function getSurahName(sId) {
  if (currentLang === "tr") return SURAH_NAMES_TR[sId] || `Sure ${sId}`;
  if (currentLang === "en") return SURAH_NAMES_EN[sId] || `Surah ${sId}`;
  return (quranData && quranData.surahs[sId]) || `سورة ${sId}`;
}

function setLanguage(lang) {
  currentLang = lang;
  const dict = I18N[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = dict.dir;

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.innerHTML = dict[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.placeholder = dict[key];
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (dict[key]) el.title = dict[key];
  });

  if (quranData) {
    runSearch(lastQuery);
    if (selectedSurahId && currentMatchesBySurah[selectedSurahId]) {
      expandSurahNode(selectedSurahId);
      if (selectedVerseOcc) {
        showVerseContext(selectedSurahId, selectedVerseOcc.v, selectedVerseOcc);
      }
    }
  }
}

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
    status.textContent = "Error loading data/quran_index.json";
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
    minZoom: 0.15,
    maxZoom: 4,
    wheelSensitivity: 0.25,
    userZoomingEnabled: true,
    userPanningEnabled: true,
    style: [
      {
        selector: "node",
        style: {
          label: "data(label)",
          "font-family": "Amiri, Segoe UI, Tahoma, sans-serif",
          "font-weight": "bold",
          "text-valign": "center",
          "text-halign": "center",
          color: "#ffffff",
          "text-wrap": "wrap",
          "text-max-width": "54px"
        }
      },
      {
        selector: 'node[type="concept"]',
        style: {
          "background-color": "#c59b27",
          width: 72,
          height: 72,
          "font-size": "18px"
        }
      },
      {
        selector: 'node[type="surah"]',
        style: {
          "background-color": "#1b4d3e",
          width: "data(size)",
          height: "data(size)",
          "font-size": "11px"
        }
      },
      {
        selector: 'node[type="verse"]',
        style: {
          "background-color": "#2b6cb0",
          width: 44,
          height: 44,
          "font-size": "10.5px"
        }
      },
      {
        selector: 'edge[edgeType="hierarchy"]',
        style: {
          width: 1.8,
          "line-color": "#94a3b8",
          "curve-style": "bezier",
          label: "data(label)",
          "font-size": "11px",
          color: "#334155"
        }
      },
      {
        selector: 'edge[edgeType="cooccur"]',
        style: {
          width: 1.5,
          "line-color": "#d97706",
          "line-style": "dashed",
          "curve-style": "bezier",
          opacity: 0.45,
          label: "data(label)",
          "font-size": "10px",
          color: "#b45309"
        }
      },
      {
        selector: "node.dimmed",
        style: {
          "background-color": "#7c9a8e",
          color: "#ffffff",
          opacity: 0.88
        }
      },
      {
        selector: "edge.dimmed",
        style: {
          opacity: 0.28
        }
      },
      {
        selector: "node.focused-surah",
        style: {
          "border-width": 4,
          "border-color": "#c59b27"
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

  document.getElementById("zoomInBtn").addEventListener("click", () => {
    cy.zoom({ level: cy.zoom() * 1.25, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  });
  document.getElementById("zoomOutBtn").addEventListener("click", () => {
    cy.zoom({ level: cy.zoom() * 0.8, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  });
  document.getElementById("fitGraphBtn").addEventListener("click", () => {
    cy.elements().removeClass("dimmed");
    cy.fit(undefined, 24);
  });
}

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
  const dict = I18N[currentLang];
  const container = document.getElementById("corpusStatsContent");
  if (!occs.length) {
    container.innerHTML = `<div class="stat-box"><div class="stat-title">${dict.statTotal}</div><div class="stat-val">0</div></div>`;
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
      if (["PV", "IV", "CV"].includes(o.tag) || o.tag.startsWith("VERB")) verbCount++;
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
      <div class="stat-title">${dict.statRatioTitle}</div>
      <div class="stat-val">${dict.statRatioVal(nounPct, verbPct)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-title">${dict.statTopTag}</div>
      <div class="stat-val">${topTag ? `${topTag[0]} (${topTag[1]})` : "—"}</div>
    </div>
    <div class="stat-box">
      <div class="stat-title">${dict.statTopPfn}</div>
      <div class="stat-val">${topPfn ? `${topPfn[0]} (${topPfn[1]})` : "—"}</div>
    </div>
    <div class="stat-box">
      <div class="stat-title">${dict.statTotal}</div>
      <div class="stat-val">${dict.statTotalUnit(occs.length)}</div>
    </div>
  `;
}

function renderSurahColumnList(surahIds) {
  const dict = I18N[currentLang];
  const listEl = document.getElementById("surahColumnList");
  const badgeEl = document.getElementById("surahCountBadge");
  badgeEl.textContent = surahIds.length;
  listEl.innerHTML = "";

  surahIds.forEach((sId) => {
    const count = currentMatchesBySurah[sId].length;
    const surahName = getSurahName(sId);
    const btn = document.createElement("button");
    btn.className = "surah-row-btn";
    btn.dataset.surahId = sId;
    btn.innerHTML = `
      <span>${dict.surahPrefix(sId, surahName)}</span>
      <span class="surah-row-badge">${count}</span>
    `;
    btn.addEventListener("click", () => expandSurahNode(sId));
    listEl.appendChild(btn);
  });
}

function runSearch(rawQuery) {
  if (!quranData) return;
  const dict = I18N[currentLang];
  lastQuery = rawQuery;
  window._lastExpandedSurah = null;
  window._lastExpandedPos = null;

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
    dict.statusSummary(rawQuery, matchedOccs.length, surahIds.length);

  const elements = [
    { data: { id: "concept", label: rawQuery, type: "concept" } }
  ];

  surahIds.forEach((sId) => {
    const count = currentMatchesBySurah[sId].length;
    const surahName = getSurahName(sId);
    elements.push({
      data: {
        id: `s_${sId}`,
        label: `${surahName}\n(${count})`,
        type: "surah",
        surahId: sId,
        size: Math.min(72, 52 + count * 1.4)
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
  cy.layout({
    name: "cose",
    animate: true,
    fit: true,
    padding: 30,
    nodeRepulsion: 7500,
    idealEdgeLength: 90
  }).run();
}

function expandSurahNode(surahId) {
  const dict = I18N[currentLang];
  selectedSurahId = surahId;
  const occs = currentMatchesBySurah[surahId] || [];

  cy.nodes('[type="verse"]').remove();
  cy.elements().removeClass("dimmed focused-surah");

  if (window._lastExpandedSurah && window._lastExpandedPos) {
    const prevNode = cy.getElementById(`s_${window._lastExpandedSurah}`);
    if (prevNode.length) {
      prevNode.position(window._lastExpandedPos);
    }
  }

  document.querySelectorAll(".surah-row-btn").forEach((b) => {
    b.classList.toggle("active", Number(b.dataset.surahId) === surahId);
  });

  const verseGroups = [];
  const byVerse = new Map();
  occs.forEach((occ) => {
    if (!byVerse.has(occ.v)) {
      const group = { v: occ.v, items: [] };
      byVerse.set(occ.v, group);
      verseGroups.push(group);
    }
    byVerse.get(occ.v).items.push(occ);
  });

  const surahNode = cy.getElementById(`s_${surahId}`);
  if (!surahNode.length) return;

  window._lastExpandedSurah = surahId;
  window._lastExpandedPos = { ...surahNode.position() };

  const mainNodes = cy.nodes('[type="concept"], [type="surah"]').not(surahNode);
  const bb = mainNodes.boundingBox();
  const isRtl = currentLang === "ar";

  const sideX = isRtl ? bb.x2 + 160 : bb.x1 - 160;
  const centerY = (bb.y1 + bb.y2) / 2;

  surahNode.position({ x: sideX, y: centerY });
  surahNode.addClass("focused-surah");

  mainNodes.not("#concept").addClass("dimmed");
  cy.edges().not(`#e_c_${surahId}`).addClass("dimmed");

  const cols = verseGroups.length > 24 ? 6 : verseGroups.length > 10 ? 4 : 3;
  const colSpacing = 62;
  const rowSpacing = 56;
  const totalRows = Math.ceil(verseGroups.length / cols);
  const startY = centerY - ((totalRows - 1) * rowSpacing) / 2;
  const dirSign = isRtl ? 1 : -1;

  const newNodes = [];
  verseGroups.forEach((group, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const vNodeId = `v_${surahId}_${group.v}`;
    const badgeLabel =
      group.items.length > 1
        ? `${dict.verseNode(group.v)}\n(×${group.items.length})`
        : dict.verseNode(group.v);

    newNodes.push({
      data: {
        id: vNodeId,
        label: badgeLabel,
        type: "verse",
        surahId: surahId,
        verseId: group.v,
        occ: group.items[0],
        allOccs: group.items
      },
      position: {
        x: sideX + dirSign * (110 + c * colSpacing),
        y: startY + r * rowSpacing
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

  const focusGroup = surahNode
    .union(cy.nodes('[type="verse"]'))
    .union(cy.getElementById("concept"));

  cy.animate({
    fit: { eles: focusGroup, padding: 55 },
    duration: 420
  });

  if (verseGroups.length > 0) {
    showVerseContext(surahId, verseGroups[0].v, verseGroups[0].items[0], verseGroups);
  }
}

function showVerseContext(surahId, verseId, occ, verseGroups = null) {
  const dict = I18N[currentLang];
  selectedSurahId = surahId;
  selectedVerseOcc = occ;

  if (!verseGroups) {
    const occs = currentMatchesBySurah[surahId] || [];
    const byVerse = new Map();
    verseGroups = [];
    occs.forEach((o) => {
      if (!byVerse.has(o.v)) {
        const g = { v: o.v, items: [] };
        byVerse.set(o.v, g);
        verseGroups.push(g);
      }
      byVerse.get(o.v).items.push(o);
    });
  }

  const container = document.getElementById("inspectorContent");
  const surahName = getSurahName(surahId);
  const prevText = quranData.verses[`${surahId}:${verseId - 1}`];
  const currText = quranData.verses[`${surahId}:${verseId}`] || "";
  const nextText = quranData.verses[`${surahId}:${verseId + 1}`];

  const activeGroup = verseGroups.find((g) => g.v === verseId);
  const wordsToHighlight = activeGroup ? [...new Set(activeGroup.items.map((i) => i.w))] : [occ.w];
  let highlighted = currText;
  wordsToHighlight.forEach((w) => {
    highlighted = highlighted.split(w).join(`<span class="highlight">${w}</span>`);
  });

  let pillsHtml = `<div class="verse-pill-bar">`;
  verseGroups.forEach((g) => {
    const activeCls = g.v === verseId ? "active" : "";
    const mult = g.items.length > 1 ? ` ×${g.items.length}` : "";
    pillsHtml += `<button class="verse-jump-pill ${activeCls}" data-v="${g.v}">${g.v}${mult}</button>`;
  });
  pillsHtml += `</div>`;

  let html = pillsHtml;

  if (prevText) {
    html += `
      <div class="verse-card context">
        <div class="verse-header"><span>${dict.prevContext(surahName, verseId - 1)}</span></div>
        <div class="ayah-text">${prevText}</div>
      </div>`;
  }

  const itemsList = activeGroup ? activeGroup.items : [occ];
  const metaRowsHtml = itemsList
    .map(
      (item) => `
      <div class="morph-meta">
        <div><strong>${dict.wordLabel}:</strong> ${item.w} | <strong>${dict.stemLabel}:</strong> ${item.stem} <span class="tag-pill">${item.tag || "—"}</span></div>
        <div><strong>${dict.roleLabel}:</strong> ${item.role || "—"} | <strong>${dict.posLabel}:</strong> ${item.pos || "—"}</div>
        <div><strong>${dict.pfnLabel}:</strong> ${item.pfn || "—"} | <strong>${dict.cmLabel}:</strong> ${item.cm || "—"}</div>
      </div>`
    )
    .join("");

  html += `
    <div class="verse-card">
      <div class="verse-header">
        <span>${dict.currHeader(surahName, verseId)}</span>
        <span>${itemsList.length}×</span>
      </div>
      <div class="ayah-text">${highlighted}</div>
      ${metaRowsHtml}
    </div>`;

  if (nextText) {
    html += `
      <div class="verse-card context">
        <div class="verse-header"><span>${dict.nextContext(surahName, verseId + 1)}</span></div>
        <div class="ayah-text">${nextText}</div>
      </div>`;
  }

  container.innerHTML = html;

  container.querySelectorAll(".verse-jump-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetV = Number(btn.dataset.v);
      const targetGroup = verseGroups.find((g) => g.v === targetV);
      if (targetGroup) {
        showVerseContext(surahId, targetV, targetGroup.items[0], verseGroups);
      }
    });
  });
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
});

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

let fingerprintData = null;
let currentAppMode = "explorer";
let currentFpSubMode = "surah";
let renderedBarsMeta = [];
let currentCanvasItems = [];
let currentIsWholeQuran = false;
let hoverMouseX = null;
let lockedBarIndex = null;

const CATEGORY_COLORS = {
  nominal: "#1b4d3e",    // أخضر زمردي
  verbal: "#2563eb",     // أزرق
  directive: "#d97706",  // ذهبي
  warning: "#dc2626"     // أحمر ياقوتي
};

const CATEGORY_LABELS = {
  nominal: "ثناء وتقرير (اسمي)",
  verbal: "حركة وسرد (فعلي)",
  directive: "دعاء / أمر / تشريع",
  warning: "نفي / شرط / إنذار"
};

async function loadFingerprintData() {
  if (fingerprintData) return fingerprintData;
  const res = await fetch(`./data/quran_fingerprints.json?v=${Date.now()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  fingerprintData = await res.json();

  const select = document.getElementById("fpSurahSelect");
  select.innerHTML = "";
  for (let i = 1; i <= 114; i++) {
    const s = fingerprintData.surahs[String(i)];
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${i}. ${s.name} (${s.num_verses} آية)`;
    select.appendChild(opt);
  }
  select.value = "1";
  return fingerprintData;
}

function updateInspectorCard(it, isLocked = false) {
  if (!it) return;
  const hint = document.getElementById("inspectorHint");
  if (hint) hint.style.display = "none";
  const badge = isLocked
    ? `<span style="background:#c59b27; color:#102a22; padding:2px 8px; border-radius:6px; font-size:0.75rem; font-weight:700;">مُثبّت بالنقر</span>`
    : "";
  document.getElementById("inspectorContent").innerHTML = `
    <div class="verse-card" style="border-right: 4px solid ${CATEGORY_COLORS[it.category]};">
      <div class="verse-header" style="display:flex; justify-content:space-between; align-items:center;">
        <span class="verse-ref">${it.title}</span>
        ${badge}
      </div>
      <div style="font-size:0.82rem; color:#475569; margin:4px 0;">
        <strong>الطول:</strong> ${it.lengthLabel} | <strong>المحتوى:</strong> ${CATEGORY_LABELS[it.category]}
      </div>
      <div class="verse-text" style="margin-top:8px; font-size:1.08rem;">${it.text}</div>
    </div>
  `;
}

function drawBarsOnCanvas(items, isWholeQuran = false) {
  currentCanvasItems = items;
  currentIsWholeQuran = isWholeQuran;

  const canvas = document.getElementById("voiceprintCanvas");
  if (!canvas) return -1;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(600, rect.width || 800);
  const height = Math.max(360, rect.height || 440);

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#fdfcfb";
  ctx.fillRect(0, 0, width, height);

  const midY = height / 2;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(28, midY);
  ctx.lineTo(width - 28, midY);
  ctx.stroke();

  const count = items.length;
  const padX = 36;
  const usableW = width - padX * 2;
  const baseStep = usableW / Math.max(count, 1);
  const maxVal = Math.max(...items.map((d) => Number(d.lengthVal) || 1), 1);
  const maxDensity = Math.max(...items.map((d) => Number(d.densityVal) || 0.001), 0.001);
  const maxHalfH = height * 0.40;

  const useLens = hoverMouseX !== null && count > 25;
  const lensRadius = 95;
  const lensStrength = 3.2;

  const weights = items.map((_, idx) => {
    if (!useLens) return 1;
    const baseX = width - padX - (idx + 0.5) * baseStep;
    const dist = Math.abs(baseX - hoverMouseX);
    if (dist >= lensRadius) return 1;
    const factor = 0.5 * (1 + Math.cos((Math.PI * dist) / lensRadius));
    return 1 + lensStrength * factor;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const scaleUnit = usableW / Math.max(totalWeight, 1);

  renderedBarsMeta = [];
  let cursorRight = width - padX;
  let closestIdx = -1;
  let minCursorDist = Infinity;

  items.forEach((item, idx) => {
    const slotW = weights[idx] * scaleUnit;
    const x = cursorRight - slotW / 2;
    cursorRight -= slotW;

    if (hoverMouseX !== null) {
      const d = Math.abs(x - hoverMouseX);
      if (d < minCursorDist) {
        minCursorDist = d;
        closestIdx = idx;
      }
    }

    const boost = useLens ? (weights[idx] - 1) / lensStrength : 0;
    const val = Number(item.lengthVal) || 1;
    const normLen = Math.pow(val / maxVal, 0.72);
    const halfH = Math.min(height * 0.46, Math.max(12, normLen * maxHalfH * (1 + 0.16 * boost)));

    const normThick = (Number(item.densityVal) || 0.001) / maxDensity;
    const baseThick = Math.min(baseStep * 0.72, isWholeQuran ? 4.5 : 14);
    const lineW = Math.max(1.6, baseThick * (0.35 + 0.65 * normThick)) + boost * 3.2;

    renderedBarsMeta.push({
      idx,
      x,
      halfH,
      lineW,
      boost,
      hitHalfW: Math.max(slotW / 2, 4),
      item
    });
  });

  renderedBarsMeta.forEach((bar) => {
    const isActive = bar.idx === closestIdx || bar.idx === lockedBarIndex;

    if (isActive) {
      ctx.strokeStyle = "rgba(197, 155, 39, 0.28)";
      ctx.lineWidth = bar.lineW + 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(bar.x, midY - bar.halfH - 4);
      ctx.lineTo(bar.x, midY + bar.halfH + 4);
      ctx.stroke();
    }

    ctx.strokeStyle = CATEGORY_COLORS[bar.item.category] || "#1b4d3e";
    ctx.globalAlpha = hoverMouseX !== null && bar.boost < 0.05 && !isActive ? 0.55 : 1.0;
    ctx.lineWidth = isActive ? bar.lineW + 1.5 : bar.lineW;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(bar.x, midY - bar.halfH);
    ctx.lineTo(bar.x, midY + bar.halfH);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  });

  if (useLens) {
    ctx.save();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeRect(
      Math.max(24, hoverMouseX - lensRadius),
      14,
      Math.min(width - 48, lensRadius * 2),
      height - 28
    );
    ctx.restore();
  }

  return closestIdx;
}

function renderSurahFingerprint(surahId) {
  if (!fingerprintData) return;
  const profile = fingerprintData.surahs[String(surahId)];
  if (!profile) return;

  hoverMouseX = null;
  lockedBarIndex = null;

  const items = profile.verses.map((v) => ({
    title: `${profile.name} — الآية ${v.v}`,
    lengthVal: v.chars || v.words || 1,
    lengthLabel: `${v.chars || 0} حرفاً (${v.words} كلمات)`,
    category: v.category || "nominal",
    densityVal: v.density || 0.05,
    text: v.text || ""
  }));

  drawBarsOnCanvas(items, false);

  const stemsBadges = profile.distinctive_stems
    .map((s) => `<span class="fp-stem-chip">${s.stem} (${s.count})</span>`)
    .join(" ");

  document.getElementById("fpSummaryMetrics").innerHTML = `
    <div class="stat-box">
      <div class="stat-title">عدد خطوط البصمة (الآيات)</div>
      <div class="stat-val">${profile.num_verses} آية | ${profile.total_words} كلمة</div>
    </div>
    <div class="stat-box">
      <div class="stat-title">التوازن الصرفي (اسم / فعل)</div>
      <div class="stat-val">${Math.round(profile.noun_ratio * 100)}% اسم | ${Math.round(profile.verb_ratio * 100)}% فعل</div>
    </div>
    <div class="stat-box">
      <div class="stat-title">أول تحول أسلوبي</div>
      <div class="stat-val">${profile.shift_verse ? `الآية ${profile.shift_verse}` : "ثبات أسلوبي"}</div>
    </div>
    <div class="stat-box">
      <div class="stat-title">أقرب سورة بنيوياً</div>
      <div class="stat-val">${profile.closest_surah.name} (${Math.round(profile.closest_surah.similarity * 100)}%)</div>
    </div>
    <div class="stat-box" style="grid-column: 1 / -1;">
      <div class="stat-title">الألفاظ الأكثر تفرداً (TF-IDF)</div>
      <div style="margin-top:4px;">${stemsBadges}</div>
    </div>
  `;

  document.getElementById("statusOverlay").textContent =
    `بصمة ${profile.name} (${profile.num_verses} خطاً) — مرّري الفأرة على أي خط لمعاينة الآية`;
}

function renderWholeQuranFingerprint() {
  if (!fingerprintData) return;

  hoverMouseX = null;
  lockedBarIndex = null;

  const items = [];
  for (let s = 1; s <= 114; s++) {
    const prof = fingerprintData.surahs[String(s)];
    const totalChars = prof.verses.reduce((acc, v) => acc + (v.chars || v.words || 1), 0);
    const cat = prof.verb_ratio > prof.noun_ratio ? "verbal" : "nominal";
    items.push({
      title: `${s}. ${prof.name}`,
      lengthVal: totalChars,
      lengthLabel: `${prof.num_verses} آية | ${totalChars} حرفاً`,
      category: cat,
      densityVal: prof.distinctive_stems[0]?.score || 0.1,
      text: `أقرب توأم بنيوي: ${prof.closest_surah.name} (${Math.round(prof.closest_surah.similarity * 100)}%)`
    });
  }

  drawBarsOnCanvas(items, true);

  const stats = fingerprintData.macro_stats;
  document.getElementById("fpSummaryMetrics").innerHTML = `
    <div class="stat-box">
      <div class="stat-title">معامل الترابط المتتالي</div>
      <div class="stat-val">${stats.mean_sequential_similarity}</div>
    </div>
    <div class="stat-box">
      <div class="stat-title">الدلالة الإحصائية (p-value)</div>
      <div class="stat-val">${stats.permutation_p_value} (${stats.trials} تجربة)</div>
    </div>
  `;

  document.getElementById("statusOverlay").textContent =
    `البصمة الكلية للقرآن (114 خطاً) — معامل الترابط المتتالي: ${stats.mean_sequential_similarity} | p-value = ${stats.permutation_p_value}`;
}

const vpCanvas = document.getElementById("voiceprintCanvas");
if (vpCanvas) {
  vpCanvas.addEventListener("mousemove", (e) => {
    if (!currentCanvasItems.length) return;
    const rect = vpCanvas.getBoundingClientRect();
    hoverMouseX = e.clientX - rect.left;
    const closestIdx = drawBarsOnCanvas(currentCanvasItems, currentIsWholeQuran);

    if (closestIdx >= 0 && renderedBarsMeta[closestIdx]) {
      vpCanvas.style.cursor = "pointer";
      if (lockedBarIndex === null) {
        updateInspectorCard(renderedBarsMeta[closestIdx].item, false);
      }
    } else {
      vpCanvas.style.cursor = "default";
    }
  });

  vpCanvas.addEventListener("click", () => {
    if (hoverMouseX === null || !renderedBarsMeta.length) return;
    let best = null;
    let minD = Infinity;
    renderedBarsMeta.forEach((b) => {
      const d = Math.abs(b.x - hoverMouseX);
      if (d < minD) {
        minD = d;
        best = b;
      }
    });
    if (best) {
      lockedBarIndex = lockedBarIndex === best.idx ? null : best.idx;
      drawBarsOnCanvas(currentCanvasItems, currentIsWholeQuran);
      updateInspectorCard(best.item, lockedBarIndex !== null);
    }
  });

  vpCanvas.addEventListener("mouseleave", () => {
    hoverMouseX = null;
    if (currentCanvasItems.length) {
      drawBarsOnCanvas(currentCanvasItems, currentIsWholeQuran);
    }
  });
}

async function switchAppMode(mode) {
  currentAppMode = mode;
  document.querySelectorAll(".mode-tab-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === mode);
  });

  const fpSidebar = document.getElementById("fingerprintSidebar");
  const explorerGroups = document.querySelectorAll(".explorer-only");
  const explorerLegend = document.getElementById("explorerLegend");
  const fpLegend = document.getElementById("fingerprintLegend");
  const cyDiv = document.getElementById("cy");
  const zoomCtrls = document.getElementById("explorerZoomControls");

  if (mode === "fingerprint") {
    explorerGroups.forEach((el) => (el.style.display = "none"));
    fpSidebar.style.display = "block";
    if (explorerLegend) explorerLegend.style.display = "none";
    if (fpLegend) fpLegend.style.display = "flex";
    if (cyDiv) cyDiv.style.display = "none";
    if (zoomCtrls) zoomCtrls.style.display = "none";
    if (vpCanvas) vpCanvas.style.display = "block";

    await loadFingerprintData();
    if (currentFpSubMode === "surah") {
      renderSurahFingerprint(Number(document.getElementById("fpSurahSelect").value || 1));
    } else {
      renderWholeQuranFingerprint();
    }
  } else {
    fpSidebar.style.display = "none";
    explorerGroups.forEach((el) => (el.style.display = ""));
    if (explorerLegend) explorerLegend.style.display = "flex";
    if (fpLegend) fpLegend.style.display = "none";
    if (vpCanvas) vpCanvas.style.display = "none";
    if (cyDiv) cyDiv.style.display = "block";
    if (zoomCtrls) zoomCtrls.style.display = "flex";
    cy.resize();
    runSearch(lastQuery);
  }
}

document.querySelectorAll(".mode-tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchAppMode(btn.dataset.mode));
});

document.getElementById("fpSurahSelect").addEventListener("change", (e) => {
  renderSurahFingerprint(Number(e.target.value));
});

document.getElementById("fpSurahModeBtn").addEventListener("click", () => {
  currentFpSubMode = "surah";
  document.getElementById("fpSurahModeBtn").classList.add("active");
  document.getElementById("fpQuranModeBtn").classList.remove("active");
  document.getElementById("fpSurahSelectorBox").style.display = "block";
  renderSurahFingerprint(Number(document.getElementById("fpSurahSelect").value || 1));
});

document.getElementById("fpQuranModeBtn").addEventListener("click", () => {
  currentFpSubMode = "quran";
  document.getElementById("fpQuranModeBtn").classList.add("active");
  document.getElementById("fpSurahModeBtn").classList.remove("active");
  document.getElementById("fpSurahSelectorBox").style.display = "none";
  renderWholeQuranFingerprint();
});

init();