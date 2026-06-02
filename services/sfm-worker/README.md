# SFM Worker — Structure-from-Motion Pipeline

Listens to the Redis reconstruction queue, runs COLMAP on captured frames,
and uploads the sparse point cloud and camera poses back to S3.

This is the walking skeleton version — CPU mode, default COLMAP settings.
See the bottom of this file for GPU upgrade path.

---

## What it does

1. Waits for a job on the Redis queue (`queue:reconstruction`)
2. Downloads the session ZIP from S3 and extracts frames
3. Runs COLMAP: feature extraction → sequential matching → sparse reconstruction
4. Uploads `points3D.ply` and `cameras.json` to S3
5. Reports status back to the API at each stage
6. On failure: marks the reconstruction FAILED with the error message

---

## File Structure

```
services/sfm-worker/
├── worker.py         ← Redis consumer loop, job orchestration
├── colmap_runner.py  ← COLMAP subprocess wrapper (4 pipeline steps)
├── storage.py        ← S3 download/upload helpers
├── api.py            ← API status update helper
├── requirements.txt
├── Dockerfile
└── .env.example
```

---

## Local Development

### 1. Start infrastructure

```bash
cd infrastructure
docker compose up -d
```

### 2. Create environment file

```bash
cp services/sfm-worker/.env.example services/sfm-worker/.env
```

### 3. Install COLMAP locally

```bash
# Ubuntu / Debian
sudo apt install colmap

# macOS
brew install colmap
```

### 4. Install Python dependencies

```bash
cd services/sfm-worker
pip3 install -r requirements.txt
```

### 5. Run the worker

```bash
cd services/sfm-worker
python3 worker.py
```

The worker will log `Listening on queue:reconstruction` and wait.
Submit a job by uploading a session through the browser app or directly via the API.

---

## Docker (CPU mode)

Build and run from repo root:

```bash
# Build
docker build -f services/sfm-worker/Dockerfile -t spatial-recon-sfm .

# Run (local infrastructure)
docker run --env-file services/sfm-worker/.env spatial-recon-sfm
```

---

## Deployment — Railway (CPU, walking skeleton)

1. Create a new service in your Railway project
2. Connect the same GitHub repo
3. Set **Root Directory** to `services/sfm-worker`
4. Railway detects the Dockerfile automatically
5. Add environment variables in the Railway dashboard:

```
REDIS_URL     rediss://default:[pw]@[host].upstash.io:6379
S3_ENDPOINT   https://[account].r2.cloudflarestorage.com
S3_BUCKET     spatialrecon
S3_ACCESS_KEY [key]
S3_SECRET_KEY [secret]
S3_REGION     auto
API_URL       https://[api-service].railway.app
USE_GPU       0
```

---

## Deployment — RunPod (GPU mode)

For real reconstruction quality, deploy on a GPU instance.

1. Create a pod at https://runpod.io with an NVIDIA GPU (RTX 3090 or better)
2. Use a custom Docker image — swap the base to `colmap/colmap:latest`
3. Set `USE_GPU=1` in environment variables
4. COLMAP feature extraction and matching run 10-20x faster with GPU

GPU Dockerfile change (top of file only):
```dockerfile
FROM colmap/colmap:latest

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*
```

Run with GPU access:
```bash
docker run --gpus all --env-file .env spatial-recon-sfm
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `REDIS_URL` | ✅ | Redis connection string |
| `S3_ENDPOINT` | ✅ | S3-compatible endpoint |
| `S3_BUCKET` | ✅ | Bucket name |
| `S3_ACCESS_KEY` | ✅ | S3 access key |
| `S3_SECRET_KEY` | ✅ | S3 secret key |
| `S3_REGION` | ✅ | Region (`auto` for R2) |
| `API_URL` | ✅ | FastAPI service URL |
| `USE_GPU` | — | `1` for GPU, `0` for CPU (default) |

---

## Walking Skeleton Limitations

This is a minimal implementation. Known limitations for Phase 1:

- CPU mode only by default — slow on large frame sets
- No quality gates — SFM_COMPLETE even on poor reconstructions
- No retry logic — failures go straight to FAILED
- Sequential matcher only — exhaustive matcher not attempted as fallback
- Only `sparse/0` model used — disconnected sub-models ignored

These are addressed when building Level 05 properly in Phase 3.

---

## What Comes Next

Once this worker is running, the next step in the walking skeleton is a
minimal mesh worker (`services/mesh-worker/`) that takes the sparse point
cloud and produces a rough mesh — closing the phone-to-3D loop in the browser.
