# 📘 Prompt / Panduan Pembuatan Backend (Golang + PostgreSQL)

Dokumen ini berisi spesifikasi teknis dan struktur arsitektur Backend menggunakan **Golang** dan **PostgreSQL** yang siap digunakan sebagai panduan atau rujukan prompt untuk AI dalam membuat kode server API.

---

### 🚀 **Spesifikasi & Arsitektur Backend**

1. **Bahasa / Framework**: Golang (menggunakan **Gin-Gonic** atau **Fiber** untuk REST API).
2. **Database**: PostgreSQL.
3. **ORM / Driver**: **GORM** (atau `pgx` + `sqlx` untuk kueri SQL murni).
4. **Authentikasi**: JWT (JSON Web Token) untuk login Admin CMS.
5. **Konfigurasi**: `.env` (menggunakan `godotenv` atau `viper`).

---

### 🗄️ **1. Skema Database PostgreSQL**

Terdapat 3 tabel utama yang dibutuhkan oleh Frontend:

```sql
-- Tabel Users / Admin
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel News (Berita)
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    cover_image VARCHAR(500),
    author_id INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft' atau 'published'
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Gallery (Galeri)
CREATE TABLE gallery (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    caption TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### 📁 **2. Struktur Folder Proyek Golang**

Gunakan struktur standar Golang (*Clean Architecture* / Modular):

```text
backend-golang/
├── cmd/
│   └── main.go                 # Entrypoint aplikasi
├── config/
│   └── database.go             # Koneksi PostgreSQL & GORM
├── controllers/
│   ├── auth_controller.go      # Handler Auth (Login)
│   ├── news_controller.go      # Handler CRUD News
│   └── gallery_controller.go   # Handler CRUD Gallery
├── middlewares/
│   └── auth_middleware.go      # Verification JWT Middleware
├── models/
│   ├── user.go                 # Struct GORM User
│   ├── news.go                 # Struct GORM News
│   └── gallery.go              # Struct GORM Gallery
├── routes/
│   └── routes.go               # Setup Endpoint API
├── .env                        # Konfigurasi Environment
├── go.mod
└── go.sum
```

---

### 🔌 **3. Daftar Endpoint REST API**

#### **Public Endpoints (Halaman Utama/Publik Next.js)**
* `GET /api/v1/news` — Mengambil semua berita (halaman publik, pagination & filter `status=published`).
* `GET /api/v1/news/:slug` — Mengambil detail berita berdasarkan `slug`.
* `GET /api/v1/gallery` — Mengambil daftar galeri foto.

#### **Auth Endpoints**
* `POST /api/v1/auth/login` — Login Admin CMS dan mendapatkan token JWT.

#### **Protected Endpoints (Dashboard / Admin CMS)** *(Membutuhkan Header `Authorization: Bearer <token>`)*
* **News Management:**
  * `POST /api/v1/admin/news` — Membuat berita baru.
  * `PUT /api/v1/admin/news/:id` — Mengubah data berita.
  * `DELETE /api/v1/admin/news/:id` — Menghapus berita.
* **Gallery Management:**
  * `POST /api/v1/admin/gallery` — Menambah galeri baru.
  * `PUT /api/v1/admin/gallery/:id` — Mengedit item galeri.
  * `DELETE /api/v1/admin/gallery/:id` — Menghapus item galeri.

---

### 💻 **4. Contoh Implementasi Kode Utama**

#### **A. Model (`models/news.go`)**
```go
package models

import "time"

type News struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Title       string     `gorm:"type:varchar(255);not null" json:"title"`
	Slug        string     `gorm:"type:varchar(255);unique;not null" json:"slug"`
	Content     string     `gorm:"type:text;not null" json:"content"`
	CoverImage  string     `gorm:"type:varchar(500)" json:"cover_image"`
	Status      string     `gorm:"type:varchar(20);default:'draft'" json:"status"`
	PublishedAt *time.Time `json:"published_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}
```

#### **B. Routing (`routes/routes.go`)**
```go
package routes

import (
	"backend-golang/controllers"
	"backend-golang/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// CORS Setup agar Frontend Next.js bisa akses API
	r.Use(middlewares.CORSMiddleware())

	api := r.Group("/api/v1")
	{
		// Public Routes
		api.GET("/news", controllers.GetPublicNews)
		api.GET("/news/:slug", controllers.GetNewsBySlug)
		api.GET("/gallery", controllers.GetGallery)

		// Auth Routes
		api.POST("/auth/login", controllers.Login)

		// Admin Routes (Protected)
		admin := api.Group("/admin")
		admin.Use(middlewares.JWTMiddleware())
		{
			admin.POST("/news", controllers.CreateNews)
			admin.PUT("/news/:id", controllers.UpdateNews)
			admin.DELETE("/news/:id", controllers.DeleteNews)

			admin.POST("/gallery", controllers.CreateGallery)
			admin.DELETE("/gallery/:id", controllers.DeleteGallery)
		}
	}

	return r
}
```

---

### 🔄 **5. Menghubungkan Frontend Next.js ke Golang Backend**

Di proyek Next.js Anda (pada file `app/api/cms/route.ts` atau pengambil data di komponen page), ubah panggilan API agar mengarah ke Server Golang:

```typescript
// Contoh di Frontend Next.js saat mengambil data berita
const fetchNews = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/news`);
  const data = await res.json();
  return data;
};
```

Tambahkan di `.env.local` pada Frontend Next.js:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```