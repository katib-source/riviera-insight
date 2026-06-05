import pandas as pd
from transformers import pipeline
from pathlib import Path

RAW = Path("data/raw/tripadvisor_nice.csv")
OUT = Path("data/processed/reviews_sentiment.csv")
MODEL = "lxyuan/distilbert-base-multilingual-cased-sentiments-student"
BATCH = 16


def rating_label(r):
    if r >= 4:
        return "positive"
    if r == 3:
        return "neutral"
    return "negative"


def main():
    df = pd.read_csv(RAW)
    print(f"Loaded {len(df)} reviews from {RAW}")

    # Primary signal: star rating (deterministic, no ambiguity)
    df["sentiment_label"] = df["rating"].apply(rating_label)

    # Secondary signal: NLP confidence score (kept for downstream analysis)
    print(f"Loading model {MODEL}...")
    pipe = pipeline(
        "text-classification",
        model=MODEL,
        truncation=True,
        max_length=512,
        device=-1,
    )
    texts = df["review_text"].fillna("").tolist()
    print(f"Running inference on {len(texts)} reviews (batch={BATCH})...")
    results = pipe(texts, batch_size=BATCH)

    df["nlp_label"]  = [r["label"].lower() for r in results]
    df["nlp_score"]  = [round(r["score"], 4) for r in results]

    # sentiment_score = nlp_score for backward compat with API / keywords pipeline
    df["sentiment_score"] = df["nlp_score"]

    # Disagreement flag — useful for auditing the false-negative problem
    df["nlp_agrees"] = df["sentiment_label"] == df["nlp_label"]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT, index=False)
    print(f"Saved → {OUT}\n")

    # Summary table
    print(f"{'Operator':<48} {'n':>4}  {'avgR':>5}  {'pos%':>5}  {'neg%':>5}  {'neu%':>5}  {'nlp_agree%':>10}")
    print("-" * 90)
    for op, g in df.groupby("operator"):
        n   = len(g)
        avg = g["rating"].mean()
        pos = (g["sentiment_label"] == "positive").mean() * 100
        neg = (g["sentiment_label"] == "negative").mean() * 100
        neu = (g["sentiment_label"] == "neutral").mean() * 100
        agr = g["nlp_agrees"].mean() * 100
        print(f"{op[:48]:<48} {n:>4}  {avg:>5.2f}  {pos:>4.0f}%  {neg:>4.0f}%  {neu:>4.0f}%  {agr:>9.0f}%")
    print("-" * 90)
    n   = len(df)
    avg = df["rating"].mean()
    pos = (df["sentiment_label"] == "positive").mean() * 100
    neg = (df["sentiment_label"] == "negative").mean() * 100
    neu = (df["sentiment_label"] == "neutral").mean() * 100
    agr = df["nlp_agrees"].mean() * 100
    print(f"{'TOTAL':<48} {n:>4}  {avg:>5.2f}  {pos:>4.0f}%  {neg:>4.0f}%  {neu:>4.0f}%  {agr:>9.0f}%")


if __name__ == "__main__":
    main()
