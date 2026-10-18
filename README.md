# NxtBuild

Describe a website in plain words and NxtBuild builds it with Gemini. You get a live preview,
a chat to keep changing the page, a code editor, and a one-click download.

**Stack:** React 19 + Vite, React Router, Context API, axios | Express 5, MongoDB (Mongoose), JWT, Gemini (`@google/genai`)

## Run it

You need Node 18+, a MongoDB database (local or Atlas) and a Gemini API key from https://aistudio.google.com

### 1. Server
```bash
cd server
npm install
cp .env.example .env     # then fill in MONGODB_URI, JWT_SECRET and GEMINI_API_KEY
npm run dev
```
The server runs on http://localhost:5050 (check http://localhost:5050/api/health).

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
server/src
  config/        database connection
  models/        User and Project schemas
  controllers/   the logic for each route
  routes/        which URL goes to which controller
  middleware/    protect (login check) and error handling
  services/      gemini.service.js, the only file that talks to Gemini
client/src
  pages/         Landing, Login, Dashboard, Builder
  components/    Navbar, Logo, ProjectCard, ChatPanel, PreviewPanel, HeroDemo
  context/       AuthContext (user + login/signup/logout)
  api/           the axios instance
  styles/        one CSS file per page
```

## Good to know

- Generated pages run with `sandbox` and **without** `allow-same-origin`, so AI code can never read your cookies or call your API. The side effect is that generated pages cannot use `localStorage`; the Gemini brief tells it not to.
- Change the model with `GEMINI_MODEL` in `server/.env` (default `gemini-2.5-flash`).
- Every generate call costs API credits. Prompts are capped at 2000 characters; a rate limiter (for example `express-rate-limit`) is a good next step before you deploy.
