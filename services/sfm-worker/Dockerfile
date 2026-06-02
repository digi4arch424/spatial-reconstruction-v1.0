# =============================================================================
# SPATIAL RECON — SFM Worker
# Installs COLMAP via apt for CPU-only mode (walking skeleton).
# For GPU mode, swap base image to colmap/colmap:latest and set USE_GPU=1.
#
# Build from repo root:
# docker build -f services/sfm-worker/Dockerfile -t spatial-recon-sfm .
# =============================================================================

FROM ubuntu:22.04

# Prevent interactive prompts during apt install
ENV DEBIAN_FRONTEND=noninteractive

# ── System dependencies ───────────────────────────────────────────────────────
# colmap:       COLMAP SfM tool (CPU mode, no CUDA required)
# python3/pip:  Worker runtime
# curl:         Health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    colmap \
    python3 \
    python3-pip \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python dependencies ───────────────────────────────────────────────────────
# Copied before source for Docker layer cache efficiency
COPY services/sfm-worker/requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# ── Worker source ─────────────────────────────────────────────────────────────
COPY services/sfm-worker/ .

# ── Environment defaults ──────────────────────────────────────────────────────
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV USE_GPU=0

# ── Start ─────────────────────────────────────────────────────────────────────
CMD ["python3", "worker.py"]

# =============================================================================
# GPU MODE (RunPod / AWS G5 / any NVIDIA instance)
# Replace the FROM line with:
#   FROM colmap/colmap:latest
# Then add Python install steps and set USE_GPU=1 in your environment.
# Run with: docker run --gpus all ...
# =============================================================================
