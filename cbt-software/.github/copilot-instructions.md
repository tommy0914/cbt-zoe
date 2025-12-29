# Copilot / AI agent instructions for CBT-Software

Purpose: Help AI coding agents be productive quickly by documenting the project's architecture, conventions, developer workflows, and concrete examples.

- Project root: `cbt-software/`
- Backend: `cbt-software/backend/` — an Express + Mongoose API server.
- Frontend admin: `cbt-software/frontend/cbt-admin-frontend/` (separate Node project).

Quick architecture summary
- The backend is a single Express app started from `backend/server.js`. Routes live in `backend/routes/` and data models in `backend/models/` (Mongoose).
- Key route groups:
  - `GET/POST/PUT/DELETE /api/questions` — CRUD for `Question` model (see `backend/routes/questions.js`).
  - `POST /api/questions/upload` — Excel bulk upload (multer in-memory, uses `xlsx` — headers expected: `Question`, `Option A`..`Option D`, `Correct Answer`, `Subject`).
  - `POST /api/tests/submit` — submit answers payload and receive scoring (see `backend/routes/test.js`).
- Database: MongoDB connection string read from `process.env.MONGO_URI`, default `mongodb://localhost:27017/cbt-software` in `server.js`.

Developer workflows
- Start backend locally: from `cbt-software/backend/` run `npm run dev` to use `nodemon server.js` or `npm start` to run `node server.js` (see `backend/package.json` scripts).
- Frontend has its own `package.json` under `frontend/cbt-admin-frontend/` — install and run that project separately.

Project-specific conventions & patterns (use these when editing code)
- Models
  - `Question` schema (`backend/models/Question.js`) fields: `questionText` (String), `options` (String[]), `correctAnswer` (String), `subject` (String, default `General`). Use these exact field names in API payloads and DB queries.

- Routes & middleware
  - `server.js` must register middleware (CORS, body parsers) before `app.use('/api/...', ...)` — check ordering.
  - Route handlers consistently return JSON objects with an error `message` string on failures and use proper HTTP status codes (400, 404, 500). Follow this pattern for new endpoints.
  - Reusable middleware example: `getQuestion(req, res, next)` in `routes/questions.js` fetches a `Question` by ID and attaches it as `res.question`; adopt this pattern for param-based resources.

- File uploads
  - Bulk upload uses `multer` with `memoryStorage()` and 50MB limit. The route reads the uploaded file buffer into `xlsx` and maps Excel column headers to the `Question` model. Keep the headers aligned when producing sample files.

- Scoring contract (tests)
  - Submit body to `/api/tests/submit` as:
    {
      "answers": [ { "questionId": "<id>", "selectedAnswer": "A" }, ... ]
    }
  - The backend fetches only `correctAnswer` for listed IDs and returns `{ score, total, percentage, detailedResults }`.

Notable repo gotchas discovered (copy these when debugging)
- `backend/routes/test.js` appears to have some trailing/duplicated code at the end that may cause a syntax error; run `node server.js` or `npm run dev` and check for parser errors.
- `server.js` contains comments noting that middleware ordering matters — ensure body parser/cors are registered before routes.

Where to look for examples
- CRUD flows and patterns: `backend/routes/questions.js` (create, bulk upload, update via `getQuestion` middleware).
- Scoring logic and expected payload: `backend/routes/test.js`.
- Data model: `backend/models/Question.js`.
- Start scripts & dependencies: `backend/package.json`.

What an AI agent should do first when modifying code
1. Run `npm ci` or `npm install` in `cbt-software/backend/` and `cbt-software/frontend/cbt-admin-frontend/` as needed.
2. Start the backend (`npm run dev`) and check the console for startup and syntax errors — fix failing routes first (often caused by missing middleware ordering or small syntax typos in `routes/`).
3. When adding endpoints, follow the existing response shape (`res.json(...)` on success, `{ message: '...' }` on errors) and reuse `getQuestion`-style middleware when operating on IDs.

When in doubt / ask the maintainer
- If behavior depends on specific Excel column headers or frontend contracts, ask which exact file format or API payload the frontend expects before changing DB schema or upload parsing.

If you want changes to these instructions or want more examples (curl snippets, example Excel CSV), tell me which areas are unclear and I will iterate.
