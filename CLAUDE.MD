# RivieraInsight

## Context
NLP competitive intelligence tool for French Riviera tourism.
Built for AzurEscape (azurescape.fr) — premium guided tours Nice/Monaco/Cannes.
Portfolio project — Master IA UCA alternance candidate.

## Business goal
Analyze TripAdvisor reviews of competing tour operators to extract:
- Sentiment scores per operator
- Top complaints and top praises per operator
- Seasonal patterns (Grand Prix week vs summer vs off-season)
- Positioning gaps AzurEscape can exploit

## Stack
- Scraping: Playwright (Python), rate limit 3s between requests
- ML: camembert-base via HuggingFace Transformers (sentiment)
- Keywords: KeyBERT (theme extraction)
- API: FastAPI
- Frontend: Next.js 15 + Recharts + Leaflet
- DB: SQLite
- Deploy: Railway (API) + Vercel (frontend)

## Target operators to scrape
1. AzurEscape competitors on TripAdvisor Nice/Monaco
2. Viator listings for French Riviera day tours
3. GetYourGuide Nice/Monaco tours

## Structure
riviera-insight/
├── scraper/
│   ├── tripadvisor.py
│   ├── viator.py
│   └── utils.py
├── ml/
│   ├── sentiment.py      # CamemBERT pipeline
│   ├── keywords.py       # KeyBERT extraction
│   └── pipeline.py       # runs both on scraped data
├── api/
│   ├── main.py           # FastAPI app
│   └── routes/
│       ├── operators.py  # GET /operators + scores
│       └── reviews.py    # GET /reviews + POST /analyze
├── frontend/
│   └── ...               # Next.js dashboard
└── data/
    ├── raw/              # gitignored
    └── processed/        # cleaned CSVs

## Dashboard views
1. Operator comparison table (sentiment + top complaint + top praise)
2. Map of tour starting points (Leaflet)
3. Theme wordcloud per operator
4. Timeline: sentiment over months

## Rules
- Student-natural code: no verbose docstrings, short var names
- No type hints unless necessary
- SQLite only, no Docker, no Redis
- Scraper: realistic user-agent, 3s delay, max 200 reviews per operator
- Never commit data/raw/ folder
- No auth, no user accounts, no payments
- Scope is fixed: do not add features beyond the 4 modules above