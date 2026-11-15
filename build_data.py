import csv
import json
import re
import os
from collections import defaultdict, Counter

os.makedirs("data", exist_ok=True)

def strip_diacritics(text):
    if not text:
        return ""
    text = re.sub(r'[\u064B-\u065F\u0670\u0640]', '', text)
    text = re.sub(r'[إأآٱا]', 'ا', text)
    text = re.sub(r'ى', 'ي', text)
    text = re.sub(r'ؤ', 'ء', text)
    text = re.sub(r'ئ', 'ء', text)
    return text.strip()

SURAH_NAMES = {
    1: "الفاتحة", 2: "البقرة", 3: "آل عمران", 4: "النساء", 5: "المائدة", 6: "الأنعام",
    7: "الأعراف", 8: "الأنفال", 9: "التوبة", 10: "يونس", 11: "هود", 12: "يوسف",
    13: "الرعد", 14: "إبراهيم", 15: "الحجر", 16: "النحل", 17: "الإسراء", 18: "الكهف",
    19: "مريم", 20: "طه", 21: "الأنبياء", 22: "الحج", 23: "المؤمنون", 24: "النور",
    25: "الفرقان", 26: "الشعراء", 27: "النمل", 28: "القصص", 29: "العنكبوت", 30: "الروم",
    31: "لقمان", 32: "السجدة", 33: "الأحزاب", 34: "سبأ", 35: "فاطر", 36: "يس",
    37: "الصافات", 38: "ص", 39: "الزمر", 40: "غافر", 41: "فصلت", 42: "الشورى",
    43: "الزخرف", 44: "الدخان", 45: "الجاثية", 46: "الأحقاف", 47: "محمد", 48: "الفتح",
    49: "الحجرات", 50: "ق", 51: "الذاريات", 52: "الطور", 53: "النجم", 54: "القمر",
    55: "الرحمن", 56: "الواقعة", 57: "الحديد", 58: "المجادلة", 59: "الحشر", 60: "الممتحنة",
    61: "الصف", 62: "الجمعة", 63: "المنافقون", 64: "التغابن", 65: "الطلاق", 66: "التحريم",
    67: "الملك", 68: "القلم", 69: "الحاقة", 70: "المعارج", 71: "نوح", 72: "الجن",
    73: "المزمل", 74: "المدثر", 75: "القيامة", 76: "الإنسان", 77: "المرسلات", 78: "النبأ",
    79: "النازعات", 80: "عبس", 81: "التكوير", 82: "الانفطار", 83: "المطففين", 84: "الانشقاق",
    85: "البروج", 86: "الطارق", 87: "الأعلى", 88: "الغاشية", 89: "الفجر", 90: "البلد",
    91: "الشمس", 92: "الليل", 93: "الضحى", 94: "الشرح", 95: "التين", 96: "العلق",
    97: "القدر", 98: "البينة", 99: "الزلزلة", 100: "العاديات", 101: "القارعة", 102: "التكاثر",
    103: "العصر", 104: "الهمزة", 105: "الفيل", 106: "قريش", 107: "الماعون", 108: "الكوثر",
    109: "الكافرون", 110: "النصر", 111: "المسد", 112: "الإخلاص", 113: "الفلق", 114: "الناس"
}

verses_words = defaultdict(dict)
stem_index = defaultdict(list)
surah_top_stems = defaultdict(Counter)
all_morph_tags = Counter()
all_phrasal_funcs = Counter()
skipped_rows = 0

print("Processing raw_data/MASAQ.csv with morpho-syntactic & phrasal metadata...")
with open("raw_data/MASAQ.csv", mode="r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            sura = int(row["Sura_No"])
            verse = int(row["Verse_No"])
            word_id = int(row["ID"])
        except (ValueError, TypeError, KeyError):
            skipped_rows += 1
            continue

        word_text = (row.get("Word") or "").strip()
        if not word_text:
            continue

        if word_id not in verses_words[(sura, verse)]:
            verses_words[(sura, verse)][word_id] = word_text

        if row.get("Morph_Type") == "Stem":
            raw_stem = (row.get("Segmented_Word") or "").strip()
            norm_stem = strip_diacritics(raw_stem)
            morph_tag = (row.get("Morph_Tag") or "").strip()
            phrasal_fn = (row.get("Phrasal_Function") or "").strip()
            syntactic_role = (row.get("Syntactic_Role") or "").strip()
            possessive = (row.get("Possessive_Construct") or "").strip()
            case_mood = (row.get("Case_Mood") or "").strip()

            if len(norm_stem) >= 2:
                if morph_tag:
                    all_morph_tags[morph_tag] += 1
                if phrasal_fn:
                    all_phrasal_funcs[phrasal_fn] += 1

                # Track distinctive lexical stems per Surah for co-occurrence edges
                if len(norm_stem) >= 3 and morph_tag.startswith(("NOUN", "VERB", "ADJ")):
                    surah_top_stems[sura][norm_stem] += 1

                stem_index[norm_stem].append({
                    "s": sura,
                    "v": verse,
                    "w": word_text,
                    "stem": raw_stem,
                    "tag": morph_tag,
                    "role": syntactic_role,
                    "pfn": phrasal_fn,
                    "pos": possessive,
                    "cm": case_mood
                })

verses_text = {}
for (sura, verse), w_map in verses_words.items():
    verses_text[f"{sura}:{verse}"] = " ".join(w_map[k] for k in sorted(w_map.keys()))

clean_stems = {}
for norm_stem, occs in stem_index.items():
    seen = set()
    unique_occs = []
    for o in occs:
        key = (o["s"], o["v"], o["w"], o["tag"])
        if key not in seen:
            seen.add(key)
            unique_occs.append(o)
    clean_stems[norm_stem] = unique_occs

# Store top 40 signature lexical stems per Surah for fast in-browser co-occurrence similarity
surah_signatures = {
    str(s): [stem for stem, _ in counter.most_common(40)]
    for s, counter in surah_top_stems.items()
}

output = {
    "surahs": SURAH_NAMES,
    "verses": verses_text,
    "stems": clean_stems,
    "surah_signatures": surah_signatures,
    "meta": {
        "morph_tags": [t for t, _ in all_morph_tags.most_common(30)],
        "phrasal_functions": [p for p, _ in all_phrasal_funcs.most_common(25)]
    }
}

out_path = "data/quran_index.json"
with open(out_path, "w", encoding="utf-8") as out_f:
    json.dump(output, out_f, ensure_ascii=False, separators=(",", ":"))

print(f"Done! Indexed {len(clean_stems)} stems, {len(all_morph_tags)} morph tags, {len(all_phrasal_funcs)} phrasal functions -> {out_path}")