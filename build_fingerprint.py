import json
import math
import random
import re
from collections import Counter, defaultdict

STOP_STEMS = {
    "ان", "إن", "أن", "لا", "ما", "من", "في", "على", "علي", "إلى", "الي",
    "عن", "مع", "هو", "هي", "هم", "هن", "انت", "أنتم", "نحن", "انا", "أنا",
    "الذي", "التي", "الذين", "هذا", "هذه", "ذلك", "تلك", "كان", "كانت", "كانوا",
    "قال", "قالوا", "يا", "ايها", "أيها", "قد", "لم", "لن", "اذا", "إذا", "اذ", "إذ",
    "او", "أو", "ثم", "بل", "حتى", "كل", "بعض", "غير", "بين", "عند", "بعد", "قبل"
}

VERB_TAGS = {"PV", "IV", "CV"}
NOUN_TAGS = {"NOUN_CONCRETE", "NOUN_ABSTRACT", "NOUN_PROP", "NOUN_ACTIVE_PART", "NOUN_PASSIVE_PART", "GERUND", "ADJ"}

def strip_diacritics(text):
    return re.sub(r"[\u064B-\u065F\u0670\s]", "", text or "")

def load_index(path="data/quran_index.json"):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def cosine_sim(v1, v2):
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    return dot / (norm1 * norm2) if norm1 and norm2 else 0.0

def classify_pos(tag_str):
    t = (tag_str or "").upper().strip()
    if t in VERB_TAGS or t.startswith("VERB"):
        return "verb"
    if t in NOUN_TAGS or t.startswith("NOUN"):
        return "noun"
    return "other"

def is_content_stem(stem, tag_str=""):
    if not stem or len(stem.strip()) < 2:
        return False
    if stem.strip() in STOP_STEMS:
        return False
    t = (tag_str or "").upper().strip()
    if t in {"PREP", "PRON", "REL_PRON", "DEM_PRON", "NEG_PART", "CONJ", "PART"}:
        return False
    return True

def build_all_fingerprints():
    data = load_index()
    surah_names = data["surahs"]
    verses_map = data["verses"]

    surah_occs = defaultdict(list)
    stem_surah_freq = defaultdict(set)
    surah_stem_counts = defaultdict(Counter)

    for stem, occs in data["stems"].items():
        for occ in occs:
            s = occ["s"]
            surah_occs[s].append(occ)
            if is_content_stem(stem, occ.get("tag")):
                stem_surah_freq[stem].add(s)
                surah_stem_counts[s][stem] += 1

    for s in surah_occs:
        surah_occs[s].sort(key=lambda x: x["v"])

    total_surahs = 114
    surah_profiles = {}
    feature_vectors = {}

    for s in range(1, total_surahs + 1):
        s_str = str(s)
        s_verses = sorted(
            [(int(k.split(":")[1]), txt) for k, txt in verses_map.items() if k.startswith(f"{s}:")],
            key=lambda x: x[0]
        )
        verse_lengths = [len(txt.split()) for _, txt in s_verses]
        num_verses = len(s_verses)
        total_words = sum(verse_lengths)
        avg_verse_len = round(total_words / max(num_verses, 1), 2)

        occs = surah_occs[s]
        pos_counts = Counter(classify_pos(o.get("tag")) for o in occs)
        total_tokens = max(len(occs), 1)

        noun_ratio = round(pos_counts["noun"] / total_tokens, 3)
        verb_ratio = round(pos_counts["verb"] / total_tokens, 3)

        tfidf_scores = []
        stem_tfidf_map = {}
        for stem, count in surah_stem_counts[s].items():
            tf = count / total_tokens
            idf = math.log((total_surahs + 1) / (len(stem_surah_freq[stem]) + 1)) + 1.0
            score = round(tf * idf, 4)
            tfidf_scores.append((stem, score, count))
            stem_tfidf_map[stem] = score
        tfidf_scores.sort(key=lambda x: x[1], reverse=True)
        top_distinctive_stems = [
            {"stem": st, "score": sc, "count": cnt} for st, sc, cnt in tfidf_scores[:8]
        ]

        verse_nodes = []
        shift_verse = None
        prev_cat = None

        for v_num, v_txt in s_verses:
            v_occs = [o for o in occs if o["v"] == v_num]
            v_tags = {(o.get("tag") or "").upper().strip() for o in v_occs}
            v_verbs = sum(1 for o in v_occs if classify_pos(o.get("tag")) == "verb")

            if "CV" in v_tags:
                category = "directive"   # ذهبي: فعل أمر / دعاء (مثل اهدنا)
            elif "NEG_PART" in v_tags or any(w in v_txt for w in ["لَا ", "وَلَا ", "غَيْرِ", "الضَّالِّينَ", "عَذَاب"]):
                category = "warning"     # أحمر ياقوتي: نفي / إنذار / عاقبة
            elif v_verbs > 0:
                category = "verbal"      # أزرق: فعل ماضٍ أو مضارع (مثل نعبد ونستعين)
            else:
                category = "nominal"     # أخضر زمردي: جملة اسمية / ثناء وتقرير

            if prev_cat and prev_cat != category and shift_verse is None:
                shift_verse = v_num
            prev_cat = category

            v_content_stems = [o["stem"] for o in v_occs if is_content_stem(o.get("stem"), o.get("tag"))]
            density = round(
                sum(stem_tfidf_map.get(st, 0.0) for st in v_content_stems) / max(len(v_content_stems), 1),
                4
            )
            char_count = len(strip_diacritics(v_txt))

            verse_nodes.append({
                "v": v_num,
                "words": len(v_txt.split()),
                "chars": char_count,
                "category": category,
                "density": density,
                "text": v_txt
            })

        vec = [
            num_verses / 286.0,
            avg_verse_len / 50.0,
            noun_ratio,
            verb_ratio,
            (shift_verse / max(num_verses, 1)) if shift_verse else 0.5,
            len(surah_stem_counts[s]) / max(total_tokens, 1)
        ]
        feature_vectors[s] = vec

        surah_profiles[s_str] = {
            "id": s,
            "name": surah_names.get(s_str, f"سورة {s}"),
            "num_verses": num_verses,
            "total_words": total_words,
            "avg_verse_len": avg_verse_len,
            "verse_lengths": verse_lengths,
            "noun_ratio": noun_ratio,
            "verb_ratio": verb_ratio,
            "shift_verse": shift_verse,
            "distinctive_stems": top_distinctive_stems,
            "verses": verse_nodes
        }

    sequential_similarities = []
    macro_edges = []

    for s in range(1, total_surahs + 1):
        if s < total_surahs:
            sim_next = round(cosine_sim(feature_vectors[s], feature_vectors[s + 1]), 3)
            sequential_similarities.append(sim_next)
            macro_edges.append({
                "source": f"fp_s_{s}",
                "target": f"fp_s_{s+1}",
                "type": "sequence",
                "weight": sim_next
            })

        best_match = None
        best_sim = -1.0
        for other in range(1, total_surahs + 1):
            if s == other:
                continue
            sim = cosine_sim(feature_vectors[s], feature_vectors[other])
            if sim > best_sim:
                best_sim = sim
                best_match = other

        surah_profiles[str(s)]["closest_surah"] = {
            "id": best_match,
            "name": surah_names.get(str(best_match), ""),
            "similarity": round(best_sim, 3)
        }

    real_mean_seq_sim = sum(sequential_similarities) / len(sequential_similarities)
    surah_ids = list(range(1, total_surahs + 1))
    random.seed(42)
    higher_count = 0
    trials = 1000
    for _ in range(trials):
        shuffled = surah_ids[:]
        random.shuffle(shuffled)
        rand_sims = [
            cosine_sim(feature_vectors[shuffled[i]], feature_vectors[shuffled[i + 1]])
            for i in range(total_surahs - 1)
        ]
        if (sum(rand_sims) / len(rand_sims)) >= real_mean_seq_sim:
            higher_count += 1

    p_value = round(higher_count / trials, 4)

    output = {
        "macro_stats": {
            "total_surahs": total_surahs,
            "mean_sequential_similarity": round(real_mean_seq_sim, 4),
            "permutation_p_value": p_value,
            "trials": trials
        },
        "surahs": surah_profiles,
        "macro_edges": macro_edges
    }

    with open("data/quran_fingerprints.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    f1 = surah_profiles["1"]
    print(f"الفاتحة الآن: {round(f1['noun_ratio']*100)}% اسم | {round(f1['verb_ratio']*100)}% فعل | أول تحول: آية {f1['shift_verse']}")

if __name__ == "__main__":
    build_all_fingerprints()
