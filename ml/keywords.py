import pandas as pd
from keybert import KeyBERT
from pathlib import Path

IN = Path("data/processed/reviews_sentiment.csv")
OUT = Path("data/processed/keywords.csv")
TOP_N = 5


def extract(kw, texts, n=TOP_N):
    if not texts:
        return []
    doc = " ".join(texts)
    return kw.extract_keywords(
        doc,
        keyphrase_ngram_range=(1, 2),
        stop_words="english",
        use_mmr=True,
        diversity=0.4,
        top_n=n,
    )


def main():
    df = pd.read_csv(IN)
    print(f"Loaded {len(df)} reviews")

    print("Loading KeyBERT (all-MiniLM-L6-v2)...")
    kw = KeyBERT()

    rows = []
    for op, grp in df.groupby("operator"):
        for label in ("positive", "negative"):
            texts = grp.loc[grp["sentiment_label"] == label, "review_text"].dropna().tolist()
            if not texts:
                continue
            kws = extract(kw, texts)
            for word, score in kws:
                rows.append({"operator": op, "sentiment_group": label, "keyword": word, "score": round(score, 4)})

    kdf = pd.DataFrame(rows)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    kdf.to_csv(OUT, index=False)
    print(f"Saved {len(kdf)} keyword rows → {OUT}\n")

    # summary table: top 3 pos + top 3 neg per operator
    def top3(op, label):
        sub = kdf[(kdf["operator"] == op) & (kdf["sentiment_group"] == label)]
        sub = sub.nlargest(3, "score")
        return ", ".join(sub["keyword"].tolist()) if not sub.empty else "—"

    ops = kdf["operator"].unique()
    print(f"{'Operator':<46}  {'Top-3 positive':<35}  {'Top-3 negative'}")
    print("-" * 115)
    for op in ops:
        short = op[:45]
        pos = top3(op, "positive")
        neg = top3(op, "negative")
        print(f"{short:<46}  {pos:<35}  {neg}")


if __name__ == "__main__":
    main()
