# Spatial Recon — API Service

FastAPI service. Central hub connecting the browser capture layer
to the reconstruction pipeline workers.

---

## Endpoints

### Sessions
| Method | Path | Description |
|---|---|---|
| `POST` | `/sessions` | Register a new capture session |
| `GET` | `/sessions/{id}` | Get session details and status |
| `POST` | `/sessions/{id}/upload` | Upload session ZIP, trigger reconstruction |

### Reconstructions
| Method | Path | Description |
|---|---|---|
| `GET` | `/reconstructions/{id}` | Get reconstruction status and output URLs |
| `PATCH` | `/reconstructions/{id}/status` | Worker status update |
| `WS` | `/reconstructions/{id}/ws` | Real-time status feed to browser |

### System
| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |

Interactive docs available at `/docs` when running.

---

## Local Development

### 1. Start infrastructure

```bash
cd infrastructure
docker compose up -d
```

### 2. Create environment file

```bash
cp services/api/.env.example services/api/.env
# Edit .env with your local values
```

### 3. Install dependencies

```bash
cd services/api
pip install -r requirements.txt
```

### 4. Run the service

```bash
# From repo root
PYTHONPATH=. uvicorn services.api.main:app --reload --port 8000
```

API available at `http://localhost:8000`
Docs available at `http://localhost:8000/docs`

---

## Docker

Build and run from repo root:

```bash
# Build
docker build -f services/api/Dockerfile -t spatial-recon-api .

# Run (local infrastructure)
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/spatialrecon \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e S3_ENDPOINT=http://host.docker.internal:9000 \
  -e S3_BUCKET=spatialrecon \
  -e S3_ACCESS_KEY=admin \
  -e S3_SECRET_KEY=password123 \
  -e S3_REGION=us-east-1 \
  spatial-recon-api
```

---

## Railway Deployment (Online)

1. Create a new project at https://railway.app
2. Connect your GitHub repo — `DigiArch424/spatial-recon-game`
3. Railway auto-detects `railway.toml` at the repo root
4. Add environment variables in the Railway dashboard:

```
DATABASE_URL    postgresql://postgres:[pw]@db.[ref].supabase.co:5432/postgres
REDIS_URL       rediss://default:[pw]@[host].upstash.io:6379
S3_ENDPOINT     https://[account].r2.cloudflarestorage.com
S3_BUCKET       spatialrecon
S3_ACCESS_KEY   [key]
S3_SECRET_KEY   [secret]
S3_REGION       auto
ENVIRONMENT     production
```

5. Deploy — Railway builds the Dockerfile and starts the service
6. Your API URL will be `https://[service].railway.app`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `S3_ENDPOINT` | ✅ | S3-compatible endpoint URL |
| `S3_BUCKET` | ✅ | Bucket name (default: spatialrecon) |
| `S3_ACCESS_KEY` | ✅ | S3 access key |
| `S3_SECRET_KEY` | ✅ | S3 secret key |
| `S3_REGION` | ✅ | Region (use `auto` for R2) |
| `ENVIRONMENT` | ✅ | `development` or `production` |
| `API_PORT` | — | Port override (default: 8000) |

---

## Service Structure

```
services/api/
├── main.py           ← FastAPI app, CORS, lifespan
├── config.py         ← All env vars via pydantic-settings
├── database.py       ← Async PostgreSQL engine and session
├── storage.py        ← S3 client and all path helpers
├── queue.py          ← Redis client, job queue, pub/sub
├── Dockerfile        ← Container definition
├── requirements.txt  ← Python dependencies
└── routers/
    ├── sessions.py        ← Session endpoints
    └── reconstructions.py ← Reconstruction endpoints + WebSocket
```
