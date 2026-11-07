# Veylix AI

**Intelligence That Sees Beyond Threats.**

Veylix AI is a beginner-friendly AI and cybersecurity portfolio web application that helps users assess potentially suspicious **URLs** and **pasted email text**. It returns a risk category — **Low, Medium, High or Inconclusive** — and explains the indicators behind the result.

> Veylix AI is a learning and portfolio project. It is not an enterprise security product, does not guarantee detection, and does not replace professional security tools.

## Project status

**Phase 1 — Planning and project foundation.** No application code yet.

| Phase | Focus | Status |
|---|---|---|
| 1 | Planning, repository setup, dataset research | In progress |
| 2 | Rule-based core (URL + email analysis, no accounts) | Not started |
| 3 | ML baseline (URL and email classifiers) | Not started |
| 4 | Accounts, roles, scan history | Not started |
| 5 | Results UI, reports, privacy pages | Not started |
| 6 | Analyst and Admin basics | Not started |
| 7 | Final quality, threat model, demo | Not started |

## Key design principles

- **Never fetches submitted URLs**: analysis uses the URL text only.
- **Privacy by default**: raw email text is never stored or logged; guest scans are never saved.
- **Explainable results**: documented rules plus faithful model explanations; no LLM-generated verdicts.
- **Honest ML evaluation**: leakage-safe splits and comparison against baselines.
- **Free and open-source** tools only.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide |
| Backend | Python, FastAPI (modular monolith) |
| Database | PostgreSQL, SQLAlchemy, Alembic |
| ML | scikit-learn, Pandas, NumPy, Matplotlib, Jupyter |
| Testing | Pytest, Vitest, Swagger UI |
| Reports | ReportLab or fpdf2, Python csv |

## Repository structure

```
Veylix_AI/
├── Documentation/   # Source documents: PRD v1.2, SRS v1.1, SAD v1.1
├── backend/         # FastAPI application (from Phase 2)
│   ├── app/         # API, services, detection engine, data access
│   ├── shared/      # Feature extraction shared by backend and ML training
│   ├── cli/         # Local commands (e.g., create first Administrator)
│   ├── migrations/  # Alembic database migrations
│   └── tests/       # Pytest tests
├── frontend/        # React + TypeScript single-page app (from Phase 2)
└── ml/              # Offline ML workspace
    ├── notebooks/       # Exploration only
    ├── training/        # Reproducible training scripts
    ├── evaluation/      # Evaluation reports
    ├── datasets/        # Local datasets (not committed to Git)
    ├── dataset_cards/   # Source, licence and limitations of each dataset
    ├── model_cards/     # Intended use, metrics and limitations of each model
    └── models/          # Trained artifacts + metadata (url/, email/)
```

## Documentation

| Document | Status |
|---|---|
| `Documentation/Veylix_AI_Approved_PRD_v1.2.docx` | Approved — final product authority |
| `Documentation/Veylix_AI_SRS_v1.1.docx` | Draft – Pending Review and Approval (working reference) |
| `Documentation/Veylix_AI_SAD_v1.1.docx` | Draft – Pending Review and Approval (working reference) |

## Configuration

Settings are read from environment variables. Copy `.env.example` to `.env` and fill in your own local values. `.env` is ignored by Git and must never be committed.

## Setup

Requires Python 3.13. Run from the project root in PowerShell:

```powershell
python -m venv .venv                                 # one shared environment for backend + ML
.\.venv\Scripts\python -m pip install pip-tools
.\.venv\Scripts\python -m pip install -r backend/requirements.txt   # pinned versions
.\.venv\Scripts\python -m pip install --no-deps -e ./backend        # makes `app` and `shared` importable everywhere
```

Run the tests and the API:

```powershell
.\.venv\Scripts\python -m pytest backend
.\.venv\Scripts\uvicorn app.main:create_app --factory --reload --app-dir backend
```

API docs (development only): http://127.0.0.1:8000/api/v1/docs

Frontend (requires Node.js 22; in a second terminal):

```powershell
cd frontend
npm ci          # installs the exact versions from package-lock.json
npm run dev     # http://localhost:5173 (forwards /api to the backend)
npm test        # frontend safety tests
```

To add or upgrade a dependency: edit `backend/pyproject.toml`, then regenerate the lockfile:

```powershell
.\.venv\Scripts\pip-compile --extra dev --strip-extras --output-file backend/requirements.txt backend/pyproject.toml
```
