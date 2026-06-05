import re
import pandas as pd
from pathlib import Path

BASE = Path(__file__).parent.parent / "data" / "processed"
reviews = pd.read_csv(BASE / "reviews_sentiment.csv")
keywords = pd.read_csv(BASE / "keywords.csv")

MIN_REVIEWS = 10

op_counts = reviews.groupby("operator").size()
valid_ops = set(op_counts[op_counts >= MIN_REVIEWS].index)

_TRUST_PAT = re.compile(r"scam|fraud|cancel|refund|unprofessional", re.IGNORECASE)
_SG_PAT    = re.compile(r"small group", re.IGNORECASE)


def compute_insights():
    valid = reviews[reviews["operator"].isin(valid_ops)].copy()
    kw_valid = keywords[keywords["operator"].isin(valid_ops)]

    # 1. worst_operator — highest neg%
    neg_pcts = (
        valid.groupby("operator")
        .apply(lambda g: (g["sentiment_label"] == "negative").mean() * 100, include_groups=False)
        .sort_values(ascending=False)
    )
    worst_op = neg_pcts.index[0]
    worst_neg = round(float(neg_pcts.iloc[0]), 1)
    worst_kw_row = (
        kw_valid[(kw_valid["operator"] == worst_op) & (kw_valid["sentiment_group"] == "negative")]
        .nlargest(1, "score")
    )
    worst_kw = worst_kw_row["keyword"].iloc[0] if not worst_kw_row.empty else None

    # 2. best_operator — highest pos%, tiebreak by review count
    pos_pcts = (
        valid.groupby("operator")
        .apply(lambda g: (g["sentiment_label"] == "positive").mean() * 100, include_groups=False)
    )
    counts = valid.groupby("operator").size()
    best_op = (
        pd.DataFrame({"pos": pos_pcts, "n": counts})
        .sort_values(["pos", "n"], ascending=[False, False])
        .index[0]
    )
    best_pos = round(float(pos_pcts[best_op]), 1)
    best_kw_row = (
        kw_valid[(kw_valid["operator"] == best_op) & (kw_valid["sentiment_group"] == "positive")]
        .nlargest(1, "score")
    )
    best_kw = best_kw_row["keyword"].iloc[0] if not best_kw_row.empty else None

    # 3. trust_flag — any negative keyword matching the trust pattern
    flagged = kw_valid[
        (kw_valid["sentiment_group"] == "negative") &
        kw_valid["keyword"].str.contains(_TRUST_PAT.pattern, case=False, regex=True, na=False)
    ].nlargest(1, "score")
    trust_flag = None
    if not flagged.empty:
        row = flagged.iloc[0]
        trust_flag = {"operator": row["operator"], "keyword_matched": row["keyword"]}

    # 4. small_group_advantage
    sg_ops    = [op for op in valid_ops if _SG_PAT.search(op)]
    other_ops = [op for op in valid_ops if not _SG_PAT.search(op)]

    def _avg(ops):
        sub = valid[valid["operator"].isin(ops)]
        return round(float(sub["sentiment_score"].mean()), 3) if not sub.empty else 0.0

    sg_avg    = _avg(sg_ops)
    other_avg = _avg(other_ops)

    # 5. top_complaint_theme — negative keyword with highest score across valid ops
    neg_kws = kw_valid[kw_valid["sentiment_group"] == "negative"]
    top_complaint_theme = None
    if not neg_kws.empty:
        op_count = neg_kws.groupby("keyword").size().rename("op_count")
        agg = neg_kws.groupby("keyword")["score"].max().rename("max_score")
        combined = pd.concat([op_count, agg], axis=1).sort_values(
            ["op_count", "max_score"], ascending=[False, False]
        )
        top_kw = combined.index[0]
        top_complaint_theme = {
            "keyword": top_kw,
            "count": int(combined.loc[top_kw, "op_count"]),
        }

    return {
        "worst_operator":        {"name": worst_op,  "neg_pct": worst_neg, "top_negative_keyword": worst_kw},
        "best_operator":         {"name": best_op,   "pos_pct": best_pos,  "top_positive_keyword": best_kw},
        "trust_flag":            trust_flag,
        "small_group_advantage": {"small_group_avg": sg_avg, "others_avg": other_avg, "delta": round(sg_avg - other_avg, 3)},
        "top_complaint_theme":   top_complaint_theme,
    }
