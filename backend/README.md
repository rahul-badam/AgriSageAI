# AgriSageAI Backend (FastAPI)

## Core APIs

- `GET /api/v1/health`
- `POST /api/v1/recommend`
  - Input: `location`, `acres`, `farmer_input`
  - Output: inferred NPK/features + top crops + market prediction + explainability
  - Explainability:
    - `shap_tree_explainer` when SHAP/model stack is available
    - `surrogate_zscore` fallback when SHAP cannot run

- `POST /api/v1/assistant/chat`
  - Multilingual NLP layer (English/Hindi/Telugu)
  - Links user query to relevant government schemes/subsidies
  - Uses a RAG-style policy retrieval layer with ChromaDB (or in-memory fallback)
  - Returns conversational reply + ranked scheme cards + evidence chunks

Note: if `chromadb` is unavailable in runtime, the service automatically falls back to an in-memory vector retriever and keeps the same response format.

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
  "rag_backend": "chromadb",
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
  ],
  "evidence": [
    {
      "scheme_id": "pmfby",
      "title": "PMFBY Crop Insurance",
      "snippet": "...",
      "source": "https://pmfby.gov.in/",
      "score": 0.84
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
