package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"backend-golang/config"
	"backend-golang/utils"

	"github.com/gin-gonic/gin"
)

var allowedImageTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
}

func UploadImage(c *gin.Context) {
	cfg := config.App
	maxBytes := cfg.MaxUploadBytes()
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes+1024*1024)

	file, err := c.FormFile("file")
	if err != nil {
		if strings.Contains(err.Error(), "request body too large") {
			c.JSON(http.StatusRequestEntityTooLarge, utils.ErrorResponse(fmt.Sprintf("image is too large, max %d MB", cfg.MaxUploadMB)))
			return
		}
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("image file is required"))
		return
	}

	if file.Size <= 0 {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("image file is empty"))
		return
	}
	if file.Size > maxBytes {
		c.JSON(http.StatusRequestEntityTooLarge, utils.ErrorResponse(fmt.Sprintf("image is too large, max %d MB", cfg.MaxUploadMB)))
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("failed to read image file"))
		return
	}
	header := make([]byte, 512)
	n, readErr := io.ReadFull(src, header)
	_ = src.Close()
	if readErr != nil && !errors.Is(readErr, io.ErrUnexpectedEOF) && !errors.Is(readErr, io.EOF) {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("failed to read image file"))
		return
	}

	contentType := http.DetectContentType(header[:n])
	ext, ok := allowedImageTypes[contentType]
	if !ok {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("unsupported image format, use JPG, PNG, WEBP, or GIF"))
		return
	}

	filename, err := uniqueFilename(ext)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to prepare image upload"))
		return
	}

	if err := os.MkdirAll(cfg.UploadDir, 0o755); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to prepare upload directory"))
		return
	}

	destination := filepath.Join(cfg.UploadDir, filename)
	if err := c.SaveUploadedFile(file, destination); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to save image"))
		return
	}

	path := "/uploads/" + filename
	c.JSON(http.StatusCreated, gin.H{
		"url":          absoluteUploadURL(c, cfg, path),
		"path":         path,
		"filename":     filename,
		"size":         file.Size,
		"content_type": contentType,
	})
}

func uniqueFilename(ext string) (string, error) {
	buffer := make([]byte, 8)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return fmt.Sprintf("%s-%s%s", time.Now().UTC().Format("20060102-150405"), hex.EncodeToString(buffer), ext), nil
}

func absoluteUploadURL(c *gin.Context, cfg *config.Config, path string) string {
	if cfg.PublicBaseURL != "" {
		return cfg.PublicBaseURL + path
	}

	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	if forwarded := strings.TrimSpace(c.GetHeader("X-Forwarded-Proto")); forwarded != "" {
		scheme = strings.TrimSpace(strings.Split(forwarded, ",")[0])
	}

	return scheme + "://" + c.Request.Host + path
}
