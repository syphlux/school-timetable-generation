# Classr

A browser-based school timetable generator. Configure your schedule, topics, and teachers — then let the solver find an optimised timetable automatically.

**Live:** https://classr.syphaxaitouibelli.com

---

## Features

- **Two solvers** — fast greedy heuristic or CP-SAT (OR-Tools) with configurable time limit
- **CP-SAT warm start** — heuristic runs first to seed CP-SAT with a feasible solution, reducing solve time significantly
- **Interactive timetable** — drag & drop sessions, swap, reassign teachers, add/delete sessions manually
- **Filters** — filter by teacher or topic to focus on specific rows
- **Export** — JSON, CSV, or PNG
- **Constraint-aware** — respects room capacity, teacher availability, break times, max sessions per day

---

## Tech stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS v4 + Zustand |
| Backend | FastAPI + Python 3.11 + OR-Tools CP-SAT + Pydantic v2 |
| Infra | AWS ECS Fargate + ALB + ECR, Terraform |
| Logging | Structured JSON → CloudWatch Logs |

---

## Local development

**Prerequisites:** Python 3.11+, Node 20+, Docker (optional)

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173 — API calls are proxied to the backend via Vite.

---

## Deployment

Infrastructure is managed with Terraform and targets AWS ECS Fargate. The frontend is built into the Docker image and served directly by FastAPI as static files — single container, single URL, no CORS.

**First-time setup:**
```bash
cd infra
terraform init
terraform apply

cd ..
bash scripts/deploy.sh
```

**Subsequent deploys:**
```bash
bash scripts/deploy.sh
```

See `infra/main.tf` for the full infrastructure definition and `scripts/deploy.sh` for the build + deploy pipeline.

---

## Project structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + static file serving
│   │   ├── logging_config.py    # Structured JSON logging
│   │   ├── models/              # Pydantic request/response models
│   │   ├── routers/             # /solve/heuristic, /solve/cpsat endpoints
│   │   └── solver/              # Greedy + CP-SAT solvers, preprocessor
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/          # Wizard, timetable view, export toolbar
│       ├── hooks/               # useSolver, useExport
│       ├── store/               # Zustand stores
│       └── types/               # TypeScript interfaces
├── infra/
│   ├── main.tf                  # ECR, ECS, ALB, ACM, IAM
│   ├── variables.tf
│   └── outputs.tf
├── scripts/
│   └── deploy.sh                # Build image, push to ECR, redeploy ECS
└── Dockerfile                   # Multi-stage: Node build + Python serve
```
