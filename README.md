# RivieraInsight

Competitive intelligence for French Riviera tour operators

---

## What it does

RivieraInsight scrapes TripAdvisor reviews for day tour operators in the Nice–Monaco–Cannes corridor and runs them through a sentiment and keyword extraction pipeline to surface actionable intelligence. The dashboard shows which operators have the highest complaint rates, what guests repeatedly praise or criticise, and where trust gaps exist. Built as a portfolio project for AzurEscape (azurescape.fr), a premium guided tour operator on the French Riviera.

## Tech stack

- Python 3.11
- SeleniumBase (TripAdvisor scraping, UC mode for DataDome bypass)
- distilbert-base-multilingual-cased-sentiments-student (sentiment scoring)
- KeyBERT + all-MiniLM-L6-v2 (keyword extraction)
- FastAPI (REST API)
- Next.js 16 + Tailwind CSS (dashboard)
- Railway (API hosting)
- Vercel (frontend hosting)

## How to run locally

**1. Scraper**

```bash
cd scraper
pip install seleniumbase pandas
python tripadvisor.py
# writes to data/raw/tripadvisor_nice.csv
```

**2. ML pipeline**

```bash
cd ml
pip install transformers torch keybert sentence-transformers pandas
python sentiment.py
# writes to data/processed/reviews_sentiment.csv
python keywords.py
# writes to data/processed/keywords.csv
```

**3. API**

```bash
pip install fastapi "uvicorn[standard]" pandas
uvicorn api.main:app --reload
# http://localhost:8000
```

**4. Frontend**

```bash
cd frontend
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL if needed
npm install
npm run dev
# http://localhost:3000
```

## Live demo

https://riviera-insight.vercel.app/
# riviera-insight
