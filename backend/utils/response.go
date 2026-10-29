package utils

import (
	"math"
	"strconv"

	"github.com/gin-gonic/gin"
)

func Pagination(c *gin.Context) (page int, limit int, offset int) {
	page = 1
	limit = 10

	if value, err := strconv.Atoi(c.DefaultQuery("page", "1")); err == nil && value > 0 {
		page = value
	}
	if value, err := strconv.Atoi(c.DefaultQuery("limit", "10")); err == nil && value > 0 {
		limit = value
	}
	if limit > 100 {
		limit = 100
	}

	offset = (page - 1) * limit
	return page, limit, offset
}

func PaginatedResponse(data interface{}, page, limit int, total int64) gin.H {
	totalPages := 0
	if limit > 0 {
		totalPages = int(math.Ceil(float64(total) / float64(limit)))
	}
	return gin.H{
		"data": data,
		"meta": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": totalPages,
		},
	}
}

func ErrorResponse(message string) gin.H {
	return gin.H{"error": message}
}
