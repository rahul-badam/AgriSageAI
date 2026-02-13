# AgriSageAI Backend (FastAPI)

## Core APIs

- `GET /api/v1/health`
- `POST /api/v1/recommend`
  - Input: `location`, `acres`, `farmer_input`
  - Output: inferred NPK/features + top crops + market prediction

- `POST /api/v1/assistant/chat`
  - Multilingual NLP layer (English/Hindi/Telugu)
  - Links user query to relevant government schemes/subsidies
  - Returns conversational reply + ranked scheme cards for frontend chatbot

## Assistant Chat Request

```json
{
  "message": "what subsidy can I get for rice",
  "language": "en",
  "location": "Warangal, Telangana",
  "acres": 3,
  "crop": "rice"
}
```

## Assistant Chat Response

```json
{
  "success": true,
  "language": "en",
  "intent": "scheme_lookup",
  "reply": "...",
  "schemes": [
    {
      "id": "pmfby",
      "name": "PMFBY",
      "description": "...",
      "benefit": "...",
      "eligibility_hint": "...",
      "eligible": true,
      "score": 4.5,
      "link": "https://pmfby.gov.in/"
    }
  ]
}
```

## Environment

Create `backend/.env`:

```env
GEMINI_API_KEY=YOUR_GEMINI_KEY
OPENAI_API_KEY=
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger: `http://localhost:8000/docs`
