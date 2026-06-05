from fastapi import APIRouter, HTTPException
from ..data import reviews, keywords, valid_ops, compute_insights

router = APIRouter()


def _op_stats(grp):
    n   = len(grp)
    avg = round(float(grp["sentiment_score"].mean()), 3)
    pos = round((grp["sentiment_label"] == "positive").mean() * 100, 1)
    neg = round((grp["sentiment_label"] == "negative").mean() * 100, 1)
    return {"avg_score": avg, "pos_pct": pos, "neg_pct": neg, "review_count": n}


@router.get("/operators")
def get_operators():
    out = []
    for op, grp in reviews.groupby("operator"):
        if op not in valid_ops:
            continue
        row = {"name": op}
        row.update(_op_stats(grp))
        out.append(row)
    out.sort(key=lambda x: x["avg_score"], reverse=True)
    return out


@router.get("/operators/{name}/keywords")
def get_keywords(name: str):
    if name not in valid_ops:
        raise HTTPException(status_code=404, detail="Operator not found or below minimum review threshold")
    sub = keywords[keywords["operator"] == name]
    if sub.empty:
        raise HTTPException(status_code=404, detail="No keywords for operator")
    result = {}
    for label in ("positive", "negative"):
        rows = sub[sub["sentiment_group"] == label].nlargest(5, "score")
        result[label] = [
            {"keyword": r["keyword"], "score": round(r["score"], 4)}
            for _, r in rows.iterrows()
        ]
    return result


@router.get("/insights")
def get_insights():
    return compute_insights()
