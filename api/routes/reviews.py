from fastapi import APIRouter
from ..data import reviews, valid_ops

router = APIRouter()

_COLS = ["operator", "rating", "date", "review_text", "language",
         "sentiment_label", "sentiment_score"]


@router.get("/reviews")
def get_reviews():
    valid = reviews[reviews["operator"].isin(valid_ops)]
    return valid[_COLS].to_dict(orient="records")
