package config

import (
	"log"
	"time"

	"backend-golang/models"
	"backend-golang/utils"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDatabase(cfg *Config) *gorm.DB {
	logLevel := logger.Warn
	if cfg.AppEnv == "development" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("failed to get database instance: %v", err)
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(50)
	sqlDB.SetConnMaxLifetime(time.Hour)

	if err := db.AutoMigrate(&models.User{}, &models.News{}, &models.Gallery{}); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	DB = db
	log.Println("database connected and migrated")
	return db
}

func SeedAdmin(db *gorm.DB, cfg *Config) {
	var count int64
	if err := db.Model(&models.User{}).
		Where("username = ? OR email = ?", cfg.AdminUsername, cfg.AdminEmail).
		Count(&count).Error; err != nil {
		log.Printf("failed to check admin user: %v", err)
		return
	}
	if count > 0 {
		return
	}

	hash, err := utils.HashPassword(cfg.AdminPassword)
	if err != nil {
		log.Printf("failed to hash admin password: %v", err)
		return
	}

	admin := models.User{
		Username:     cfg.AdminUsername,
		Email:        cfg.AdminEmail,
		PasswordHash: hash,
		Role:         "admin",
	}
	if err := db.Create(&admin).Error; err != nil {
		log.Printf("failed to seed admin user: %v", err)
		return
	}

	log.Printf("seeded admin user %q", cfg.AdminUsername)
}
