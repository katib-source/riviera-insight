# TripAdvisor day-tours scraper for Nice + extended queries.
# Uses SeleniumBase UC mode — DataDome blocks headless Playwright from server IPs.
import csv
import re
import time
import random
from collections import Counter
from pathlib import Path

from bs4 import BeautifulSoup
from seleniumbase import SB
from langdetect import detect, LangDetectException

BASE = "https://www.tripadvisor.com"

# Original Nice day-tours category (already scraped)
CAT_URL = (
    f"{BASE}/Attractions-g187234-Activities-c63-"
    "Nice_French_Riviera_Cote_d_Azur_Provence_Alpes_Cote_d_Azur.html"
)

# 3 additional search queries → mapped to TripAdvisor category pages
QUERIES = [
    (
        "Monaco tours from Nice",
        f"{BASE}/Attractions-g190413-Activities-c63-Monaco.html",
    ),
    (
        "Cannes day trip from Nice",
        f"{BASE}/Attractions-g187176-Activities-c63-"
        "Cannes_French_Riviera_Cote_d_Azur_Provence_Alpes_Cote_d_Azur.html",
    ),
    (
        "Cote d Azur excursions",
        # page 2 of Nice (oa30) — operators not shown on page 1
        f"{BASE}/Attractions-g187234-Activities-c63-oa30-"
        "Nice_French_Riviera_Cote_d_Azur_Provence_Alpes_Cote_d_Azur.html",
    ),
]

OUT = Path("data/raw/tripadvisor_nice.csv")
NEW_TARGET = 10   # new operators to collect
PER_OP = 50       # max reviews per operator
DELAY = 3.0

# Keywords that must appear in the operator name OR any review text.
# "Nice" is in the list but only matched as a whole word to reduce false
# positives from the English adjective ("very nice guide").
_GEO_NAME_PAT = re.compile(
    r"\b(?:Nice|Monaco|Cannes|Eze|Riviera|Antibes|Menton|Mediterranean)\b"
    r"|Côte d'Azur|Cote d.Azur|French Riviera",
    re.IGNORECASE,
)

# Stricter version for review bodies: excludes "Nice" (too common as an
# adjective) and "Mediterranean" (generic).  Used when the operator name
# alone doesn't match.
_GEO_REVIEW_PAT = re.compile(
    r"\b(?:Monaco|Cannes|Eze|Antibes|Menton)\b"
    r"|Côte d'Azur|Cote d.Azur|French Riviera|Riviera",
    re.IGNORECASE,
)


def is_riviera(op_name, reviews):
    """Return True if the operator looks like a French Riviera tour."""
    if _GEO_NAME_PAT.search(op_name):
        return True
    # Require at least 2 reviews to mention a Riviera place name to avoid
    # a single "nice weather" false-positive flipping the decision.
    hits = sum(1 for r in reviews if _GEO_REVIEW_PAT.search(r.get("review_text", "")))
    return hits >= 2


def wait():
    time.sleep(DELAY + random.uniform(0, 1.5))


def get_tour_urls(soup):
    """Extract unique AttractionProductReview URLs (any geo ID)."""
    seen = set()
    urls = []
    for a in soup.find_all("a", href=re.compile(r"/AttractionProductReview-g\d+-")):
        href = a["href"]
        m = re.search(r"-d(\d+)-", href)
        if m and m.group(1) not in seen:
            seen.add(m.group(1))
            urls.append(BASE + href if href.startswith("/") else href)
    return urls


def cat_page_url(base_cat_url, offset):
    """Insert oa{offset} into a category URL for pagination."""
    if offset == 0:
        return base_cat_url
    return re.sub(r"(-c\d+-)", lambda m: f"{m.group(1)}oa{offset}-", base_cat_url, count=1)


def tour_page_url(base_url, offset):
    if offset == 0:
        return base_url
    return re.sub(r"(d\d+)-", lambda m: f"{m.group(1)}-or{offset}-", base_url, count=1)


def op_from_page(soup):
    el = soup.find("span", class_=re.compile(r"avBIb"))
    if el:
        m = re.search(r"provided by (.+)$", el.get_text(strip=True), re.I)
        if m:
            return m.group(1).strip()
    h1 = soup.find("h1")
    return h1.get_text(strip=True)[:80] if h1 else "Unknown"


def parse_cards(soup, op):
    reviews = []
    for card in soup.find_all(attrs={"data-automation": "reviewCard"}):
        r_el = card.find(attrs={"data-automation": "bubbleRatingImage"})
        rating = None
        if r_el:
            m = re.search(r"(\d+(?:\.\d)?)\s+of\s+5", r_el.get_text())
            if m:
                rating = float(m.group(1))

        date = ""
        for span in card.find_all("span"):
            t = span.get_text(strip=True)
            if re.match(
                r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|"
                r"janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\s+20\d\d",
                t, re.I,
            ):
                date = t
                break

        text = ""
        for span in card.find_all("span", class_="yCeTE"):
            if not span.find_parent(attrs={"data-automation": "review-title"}):
                text = span.get_text(strip=True)
                break

        if not text:
            continue

        try:
            lang = detect(text)
        except LangDetectException:
            lang = "und"

        reviews.append({
            "operator": op,
            "rating": rating,
            "date": date,
            "review_text": text,
            "language": lang,
        })
    return reviews


def scrape_tour(sb, url, cap):
    reviews = []
    op = None
    offset = 0

    while len(reviews) < cap:
        paged = tour_page_url(url, offset)
        try:
            if offset == 0:
                sb.uc_open_with_reconnect(paged, reconnect_time=6)
            else:
                sb.open(paged)
            time.sleep(DELAY + random.uniform(0, 1))
        except Exception as e:
            print(f"    nav error: {e}")
            break

        html = sb.get_page_source()
        if "captcha-delivery" in html:
            try:
                sb.uc_open_with_reconnect(paged, reconnect_time=8)
                time.sleep(4)
                html = sb.get_page_source()
            except Exception:
                break
            if "captcha-delivery" in html:
                print("    still blocked, skipping")
                break

        soup = BeautifulSoup(html, "html.parser")
        if op is None:
            op = op_from_page(soup)

        batch = parse_cards(soup, op)
        if not batch:
            break

        reviews.extend(batch)
        offset += len(batch)

        if not soup.find("a", attrs={"aria-label": "Next page"}):
            break

    return reviews


def load_existing():
    """Return (rows, operator_set, text_set) from existing CSV."""
    if not OUT.exists():
        return [], set(), set()
    rows = list(csv.DictReader(open(OUT, encoding="utf-8")))
    ops = {r["operator"] for r in rows}
    texts = {r["review_text"] for r in rows}
    return rows, ops, texts


def collect_tour_urls(sb, cat_url, label, max_pages=3):
    """Load up to max_pages of a category page and return all tour URLs."""
    all_urls = []
    seen_ids = set()

    for page in range(max_pages):
        purl = cat_page_url(cat_url, page * 30)
        print(f"  Category page {page + 1}: {purl[-60:]}")
        try:
            sb.uc_open_with_reconnect(purl, reconnect_time=12)
            time.sleep(4)
        except Exception as e:
            print(f"  nav error: {e}")
            break

        html = sb.get_page_source()
        if "captcha-delivery" in html:
            print(f"  Blocked on '{label}' page {page + 1} — skipping")
            break

        soup = BeautifulSoup(html, "html.parser")
        urls = get_tour_urls(soup)
        new = [u for u in urls if re.search(r"-d(\d+)-", u) and
               re.search(r"-d(\d+)-", u).group(1) not in seen_ids]

        for u in new:
            mid = re.search(r"-d(\d+)-", u)
            if mid:
                seen_ids.add(mid.group(1))
        all_urls.extend(new)

        # stop if no "next page" on the category listing
        if not soup.find("a", attrs={"aria-label": "Next page"}):
            break

    print(f"  {len(all_urls)} unique products found")
    return all_urls


def main():
    all_existing, _, _ = load_existing()
    print(f"Loaded {len(all_existing)} existing rows")

    # ── Step 1: clean existing rows ───────────────────────────────────────
    by_op = {}
    for r in all_existing:
        by_op.setdefault(r["operator"], []).append(r)

    valid_rows, dropped = [], []
    for op, rows in by_op.items():
        if is_riviera(op, rows):
            valid_rows.extend(rows)
        else:
            dropped.append(op)

    if dropped:
        print(f"Dropping {len(dropped)} non-Riviera operator(s):")
        for op in dropped:
            print(f"  ✗ {op[:70]}")

    existing_ops = {r["operator"] for r in valid_rows}
    added_texts = {r["review_text"] for r in valid_rows}
    print(f"Kept: {len(valid_rows)} reviews from {len(existing_ops)} Riviera operators")

    # ── Step 2: scrape 3 queries for new operators ────────────────────────
    new_ops = {}   # op_name → list of reviews

    with SB(uc=True, headless=True, browser="chrome",
            user_data_dir="/tmp/ta_chrome_profile") as sb:
        sb.uc_open_with_reconnect("https://www.google.com", reconnect_time=4)
        time.sleep(2)

        for label, cat_url in QUERIES:
            if len(new_ops) >= NEW_TARGET:
                break
            print(f"\n=== {label} ===")

            tour_urls = collect_tour_urls(sb, cat_url, label)

            for url in tour_urls:
                if len(new_ops) >= NEW_TARGET:
                    break

                short = re.search(r"d\d+-(.{25})", url)
                label2 = short.group(1).replace("_", " ") if short else url[-30:]
                print(f"  [{len(new_ops)}/{NEW_TARGET} new ops] {label2}...")

                try:
                    reviews = scrape_tour(sb, url, PER_OP)
                except Exception as e:
                    print(f"    error: {e}")
                    wait()
                    continue

                if not reviews:
                    wait()
                    continue

                op = reviews[0]["operator"]

                if op in existing_ops or op in new_ops:
                    print(f"    skip — already collected '{op[:45]}'")
                    wait()
                    continue

                if not is_riviera(op, reviews):
                    print(f"    skip — not Riviera '{op[:45]}'")
                    wait()
                    continue

                fresh = [r for r in reviews if r["review_text"] not in added_texts]
                added_texts.update(r["review_text"] for r in fresh)
                new_ops[op] = fresh
                print(f"    + {len(fresh)} reviews  '{op[:45]}'")
                wait()

    # ── Step 3: write clean CSV (full rewrite, not append) ────────────────
    all_new = [r for rows in new_ops.values() for r in rows]
    final_rows = valid_rows + all_new

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["operator", "rating", "date", "review_text", "language"])
        w.writeheader()
        w.writerows(final_rows)

    # ── Final report ──────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"Added {len(all_new)} reviews from {len(new_ops)} new operators")
    print(f"Total written: {len(final_rows)} reviews\n")

    print(f"{'Operator':<52}  {'n':>4}  lang")
    print("-" * 65)
    op_rows = {}
    for r in final_rows:
        op_rows.setdefault(r["operator"], []).append(r)
    for op, rows in sorted(op_rows.items(), key=lambda x: -len(x[1])):
        langs = Counter(r["language"] for r in rows)
        lang_str = "  ".join(f"{l}:{n}" for l, n in langs.most_common(3))
        print(f"{op[:52]:<52}  {len(rows):>4}  {lang_str}")
    print("-" * 65)
    total_langs = Counter(r["language"] for r in final_rows)
    print(f"{'TOTAL':<52}  {len(final_rows):>4}  {dict(total_langs)}")


if __name__ == "__main__":
    main()
