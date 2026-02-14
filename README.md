# AgriSageAI

AgriSageAI is a full-stack agriculture assistant that helps farmers with crop recommendations, market-aware guidance, and scheme/subsidy discovery through a chatbot interface.

## Architecture

- Frontend: React + TypeScript + Vite (`src/`)
- Backend: FastAPI (`backend/`)
- ML assets: trained model files and datasets (`backend/`, `models/`)

## Key Features

- Crop recommendation workflow from farmer inputs
- Assistant chat API with multilingual support
- Government scheme lookup responses in chatbot format
- Health and prediction APIs for frontend integration

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- FastAPI
- scikit-learn

## Prerequisites

- Node.js and npm
- Python 3.10+ (recommended)

## Setup

### 1. Install frontend dependencies

```sh
npm install
```

### 2. Install backend dependencies

```sh
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 3. Configure backend environment

Create `backend/.env`:

```env
GEMINI_API_KEY=YOUR_GEMINI_KEY
OPENAI_API_KEY=
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Run the App

### Start backend

```sh
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Backend docs: `http://localhost:8000/docs`

### Start frontend

```sh
npm run dev -- --host 0.0.0.0 --port 5173
```

Frontend URL: `http://localhost:5173`

## Backend API Endpoints

- `GET /api/v1/health`
- `POST /api/v1/recommend`
- `POST /api/v1/assistant/chat`
