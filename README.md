# BuildNest

Describe a website in plain words and BuildNest builds it with Gemini. You get a live preview,
a chat to keep changing the page, a code editor, and a one-click download.

**Stack:** React 19 + Vite, React Router, Context API, axios | FastAPI (Python), Motor (MongoDB), PyJWT, Google GenAI (`google-genai`)

## Run it

You need Python 3.10+, Node 18+, a MongoDB database (local or Atlas) and a Gemini API key from https://aistudio.google.com

### 1. Server (FastAPI)
```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # fill in MONGODB_URI, JWT_SECRET and GEMINI_API_KEY
uvicorn main:app --reload --port 5050
```
The server runs on http://localhost:5050 (interactive docs at http://localhost:5050/docs and health check at http://localhost:5050/api/health).

### 2. Client
```bash
cd client
npm install
cp .env.example .env     # only needed if your server is not on port 5050
npm run dev
```
Open http://localhost:5173

## How it works

1. Sign up, then describe a page on the landing page or inside a new project.
2. The client calls `POST /api/projects/:id/generate`. The server sends your prompt (and the current page code) to Gemini.
3. Gemini returns one HTML file. The server saves it with the chat messages and sends it back.
4. The client shows it inside a sandboxed `<iframe>`.

## API

| Method | Route | What it does |
| --- | --- | --- |
| POST | `/api/auth/signup` | create an account |
| POST | `/api/auth/login` | log in, returns a token |
| GET | `/api/auth/me` | who is logged in |
| GET | `/api/projects` | list your projects |
| POST | `/api/projects` | create a project |
| GET | `/api/projects/:id` | one project with its chat |
| PUT | `/api/projects/:id` | rename or save edited code |
| DELETE | `/api/projects/:id` | delete a project |
| POST | `/api/projects/:id/generate` | build or change the page with Gemini |

All `/api/projects` routes need the header `Authorization: Bearer <token>`.

## Folder map

```
server/
  main.py              FastAPI app initialization, CORS, lifespan & error handlers
  requirements.txt     Python dependencies
  app/
    core/              config, security (bcrypt & JWT), database (motor), concurrency
    schemas/           Pydantic schemas for auth and projects
    api/               routes (health, auth, projects) and auth dependency
    services/          gemini_service.py (Gemini GenAI async client & parser)
    middleware/        observability (request logging and timing)
  tests/               pytest test suite
client/src
  pages/               Landing, Login, Dashboard, Builder
  components/          Navbar, Logo, ProjectCard, ChatPanel, PreviewPanel, HeroDemo
  context/             AuthContext (user + login/signup/logout)
  api/                 the axios instance
  styles/              one CSS file per page
```

## Deployment

### 1. Frontend (Vercel)
- **Framework Preset:** Vite
- **Root Directory:** `client`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:**
  - `VITE_API_URL`: Your deployed Render backend URL (e.g. `https://buildnest-backend.onrender.com/api`)

### 2. Backend (Render)
- **Environment:** Python
- **Root Directory:** `server`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:**
  - `MONGODB_URI`: Your MongoDB Atlas connection URI
  - `GEMINI_API_KEY`: Your Google Gemini API key
  - `JWT_SECRET`: A secure random JWT secret string
  - `CLIENT_URL`: Your deployed Vercel frontend URL (e.g. `https://buildnest.vercel.app`)

## Good to know

- Generated pages run with `sandbox` and **without** `allow-same-origin`, so AI code can never read your cookies or call your API. The side effect is that generated pages cannot use `localStorage`; the Gemini brief tells it not to.
- Change the model with `GEMINI_MODEL` in `server/.env` (default `gemini-2.5-flash`).
- Every generate call costs API credits. Prompts are capped at 2000 characters; a rate limiter (for example `slowapi`) is a good next step before you deploy.
