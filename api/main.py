from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import operators, reviews

app = FastAPI(title="RivieraInsight API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(operators.router)
app.include_router(reviews.router)
