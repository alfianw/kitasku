package controllers

import (
	"fmt"
	"strconv"
	"strings"

	"backend-golang/config"
	"backend-golang/models"

	"github.com/gin-gonic/gin"
)

func uniqueNewsSlug(base string, excludeID uint) string {
	slug := base
	counter := 2
	for {
		var count int64
		query := config.DB.Model(&models.News{}).Where("slug = ?", slug)
		if excludeID > 0 {
			query = query.Where("id <> ?", excludeID)
		}
		query.Count(&count)
		if count == 0 {
			return slug
		}
		slug = fmt.Sprintf("%s-%d", base, counter)
		counter++
	}
}

func parseID(c *gin.Context) (uint, bool) {
	value, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || value == 0 {
		return 0, false
	}
	return uint(value), true
}

func normalizeStatus(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "published":
		return "published"
	case "", "draft":
		return "draft"
	default:
		return ""
	}
}
