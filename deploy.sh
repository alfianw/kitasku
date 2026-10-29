#!/usr/bin/env bash
set -euo pipefail

echo "========================================================"
echo "  KITASKU.ID - Production Auto-Deploy (Hostinger VPS)"
echo "========================================================"

# 1. Pastikan Docker sudah terinstal di Ubuntu VPS
if ! command -v docker &> /dev/null; then
  echo "[INFO] Docker belum ditemukan. Menginstal Docker secara otomatis..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
  echo "[INFO] Docker berhasil diinstal!"
fi

# 2. Pastikan file .env tersedia
if [ ! -f .env ]; then
  echo "[INFO] Menyalin .env dari .env.example..."
  cp .env.example .env
fi

echo "[1/3] Membangun image Docker (Frontend Next.js & Backend Golang)..."
docker compose build --pull

echo "[2/3] Menjalankan seluruh layanan (PostgreSQL, Backend, Frontend, Nginx)..."
docker compose up -d --remove-orphans

echo "[3/3] Memeriksa status container..."
docker compose ps

echo ""
echo "========================================================"
echo "  Deployment Selesai!"
echo "  - Website Utama   : http://187.124.139.200"
echo "  - Dashboard Admin : http://187.124.139.200/dashbord"
echo "  - API Healthcheck : http://187.124.139.200/health"
echo "========================================================"
