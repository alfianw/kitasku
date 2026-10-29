# Panduan Deployment KITASKU.ID

Folder `deploy/` ini adalah paket **siap deploy (self-contained)** yang berisi seluruh kode produksi **Frontend (Next.js 16 Standalone)**, **Backend (Golang Gin API)**, **Database (PostgreSQL 16)**, serta **Nginx Reverse Proxy**.

---

## Struktur Folder `deploy/`

```text
deploy/
├── backend/              # Source code & Dockerfile Backend Golang (Port 8080)
├── frontend/             # Source code & Dockerfile Frontend Next.js (Port 3000)
├── nginx/
│   └── default.conf      # Konfigurasi Reverse Proxy Nginx (Port 80)
├── .env                  # Konfigurasi environment production aktif
├── .env.example          # Template konfigurasi environment production
├── docker-compose.yml    # Orkestrasi penuh (Database + Backend + Frontend + Nginx)
├── deploy.sh             # Script deploy otomatis untuk Linux / Ubuntu VPS
├── deploy.ps1            # Script deploy otomatis untuk Windows Server / PowerShell
└── README.md             # Dokumentasi panduan deploy ini
```

---

## Opsi 1: Deploy di VPS (Ubuntu / Debian / Cloud Server) dengan Docker *(Direkomendasikan)*

Seluruh aplikasi berjalan dalam satu jaringan Docker dengan Nginx Reverse Proxy di port `80` sehingga Frontend, API Backend (`/api/v1/*`), fitur terjemahan otomatis (`/api/translate`), dan file gambar (`/uploads/*`) berjalan dalam **satu domain yang sama** tanpa kendala CORS.

### Langkah-langkah:
1. **Upload folder `deploy/`** ke server VPS Anda (misalnya ke `/opt/kitasku`).
2. **Edit file `.env`** sesuai domain dan kredensial produksi Anda:
   ```bash
   cd /opt/kitasku
   nano .env
   ```
   Pastikan Anda mengubah:
   - `FRONTEND_URL=https://kitasku.id`
   - `ALLOWED_ORIGINS=https://kitasku.id,https://www.kitasku.id`
   - `DB_PASSWORD=<password-database-kuat>`
   - `JWT_SECRET=<secret-jwt-acak-panjang>`
   - `ADMIN_PASSWORD=<password-admin-dashboard>`
3. **Jalankan script deploy**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
   *(Atau jalankan manual: `docker compose up -d --build`)*

### Akses Layanan:
- **Website Utama**: `http://domain-anda.com`
- **Halaman Layanan**: `http://domain-anda.com/services/e-visa-services`
- **Dashboard Admin CMS**: `http://domain-anda.com/dashbord`
- **Healthcheck API**: `http://domain-anda.com/health`

---

## Opsi 2: Deploy Terpisah (Frontend di Vercel & Backend di VPS / Railway / Render)

1. **Backend (`deploy/backend`)**:
   - Deploy menggunakan `Dockerfile` yang ada di `deploy/backend/Dockerfile` beserta PostgreSQL.
   - Set environment variable di server backend:
     - `FRONTEND_URL=https://kitasku.id`
     - `ALLOWED_ORIGINS=https://kitasku.id,https://www.kitasku.id`
     - `PUBLIC_BASE_URL=https://api.kitasku.id`
2. **Frontend (`deploy/frontend`)**:
   - Hubungkan folder `frontend` ke Vercel.
   - Tambahkan Environment Variable di Vercel:
     - `NEXT_PUBLIC_API_URL=https://api.kitasku.id`
   - Klik **Deploy**.

---

## Perintah Operasional Docker Berguna

- **Melihat log berjalan**:
  ```bash
  docker compose logs -f
  ```
- **Restart layanan setelah update konfigurasi `.env`**:
  ```bash
  docker compose up -d --build
  ```
- **Backup Database PostgreSQL**:
  ```bash
  docker exec -t kitasku-postgres pg_dump -U kitasku kitasku > backup_kitasku.sql
  ```
