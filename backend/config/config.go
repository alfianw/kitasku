package config

import (
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

var App *Config

type Config struct {
	AppEnv          string
	Port            string
	DBHost          string
	DBPort          string
	DBUser          string
	DBPassword      string
	DBName          string
	DBSSLMode       string
	JWTSecret       string
	JWTExpiresHours int
	FrontendURL     string
	AllowedOrigins  []string
	UploadDir       string
	MaxUploadMB     int
	PublicBaseURL   string
	AdminUsername   string
	AdminEmail      string
	AdminPassword   string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, using process environment")
	}

	cfg := &Config{
		AppEnv:          env("APP_ENV", "development"),
		Port:            env("PORT", "8080"),
		DBHost:          env("DB_HOST", "localhost"),
		DBPort:          env("DB_PORT", "5433"),
		DBUser:          env("DB_USER", "kitasku"),
		DBPassword:      env("DB_PASSWORD", "kitasku"),
		DBName:          env("DB_NAME", "kitasku"),
		DBSSLMode:       env("DB_SSLMODE", "disable"),
		JWTSecret:       env("JWT_SECRET", "change-me-in-production"),
		JWTExpiresHours: envInt("JWT_EXPIRES_HOURS", 24),
		FrontendURL:     env("FRONTEND_URL", "http://localhost:3000"),
		UploadDir:       env("UPLOAD_DIR", "uploads"),
		MaxUploadMB:     envInt("MAX_UPLOAD_MB", 5),
		PublicBaseURL:   strings.TrimRight(env("PUBLIC_BASE_URL", ""), "/"),
		AdminUsername:   env("ADMIN_USERNAME", "admin"),
		AdminEmail:      env("ADMIN_EMAIL", "admin@kitasku.id"),
		AdminPassword:   env("ADMIN_PASSWORD", "admin123"),
	}

	origins := []string{cfg.FrontendURL}
	if extra := env("ALLOWED_ORIGINS", ""); extra != "" {
		for _, origin := range strings.Split(extra, ",") {
			if trimmed := strings.TrimSpace(origin); trimmed != "" {
				origins = append(origins, trimmed)
			}
		}
	}
	cfg.AllowedOrigins = origins

	if cfg.JWTSecret == "change-me-in-production" {
		log.Println("WARNING: JWT_SECRET is using the default value. Set a strong secret in production.")
	}

	App = cfg
	return cfg
}

func (c *Config) DSN() string {
	return "host=" + c.DBHost +
		" user=" + c.DBUser +
		" password=" + c.DBPassword +
		" dbname=" + c.DBName +
		" port=" + c.DBPort +
		" sslmode=" + c.DBSSLMode +
		" TimeZone=UTC"
}

func (c *Config) MaxUploadBytes() int64 {
	if c.MaxUploadMB <= 0 {
		return 5 * 1024 * 1024
	}
	return int64(c.MaxUploadMB) * 1024 * 1024
}

func env(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}
	return fallback
}

func envInt(key string, fallback int) int {
	value, ok := os.LookupEnv(key)
	if !ok || value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}
