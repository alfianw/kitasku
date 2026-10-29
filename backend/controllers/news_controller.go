package controllers

import (
	"net/http"
	"strings"
	"time"

	"backend-golang/config"
	"backend-golang/models"
	"backend-golang/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type newsRequest struct {
	Title       string     `json:"title" binding:"required"`
	Slug        string     `json:"slug"`
	Excerpt     string     `json:"excerpt"`
	Content     string     `json:"content" binding:"required"`
	CoverImage  string     `json:"cover_image"`
	Status      string     `json:"status"`
	PublishedAt *time.Time `json:"published_at"`
}

func GetPublicNews(c *gin.Context) {
	page, limit, offset := utils.Pagination(c)

	query := config.DB.Model(&models.News{}).Where("status = ?", "published")
	if search := strings.TrimSpace(c.Query("q")); search != "" {
		like := "%" + search + "%"
		query = query.Where("title ILIKE ? OR content ILIKE ?", like, like)
	}

	var total int64
	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to load news"))
		return
	}

	var items []models.News
	if err := query.Preload("Author").
		Order("COALESCE(published_at, created_at) DESC").
		Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to load news"))
		return
	}

	c.JSON(http.StatusOK, utils.PaginatedResponse(items, page, limit, total))
}

func GetNewsBySlug(c *gin.Context) {
	var news models.News
	err := config.DB.Preload("Author").
		Where("slug = ? AND status = ?", c.Param("slug"), "published").
		First(&news).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("news not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to load news"))
		return
	}

	c.JSON(http.StatusOK, news)
}

func GetAdminNews(c *gin.Context) {
	page, limit, offset := utils.Pagination(c)

	query := config.DB.Model(&models.News{})
	if status := strings.ToLower(strings.TrimSpace(c.Query("status"))); status == "draft" || status == "published" {
		query = query.Where("status = ?", status)
	}
	if search := strings.TrimSpace(c.Query("q")); search != "" {
		like := "%" + search + "%"
		query = query.Where("title ILIKE ? OR content ILIKE ?", like, like)
	}

	var total int64
	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to load news"))
		return
	}

	var items []models.News
	if err := query.Preload("Author").
		Order("updated_at DESC").
		Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to load news"))
		return
	}

	c.JSON(http.StatusOK, utils.PaginatedResponse(items, page, limit, total))
}

func CreateNews(c *gin.Context) {
	var req newsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("title and content are required"))
		return
	}

	status := normalizeStatus(req.Status)
	if status == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("status must be draft or published"))
		return
	}

	title := strings.TrimSpace(req.Title)
	if title == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("title is required"))
		return
	}
	content := strings.TrimSpace(req.Content)
	if content == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("content is required"))
		return
	}

	slugBase := utils.Slugify(req.Slug)
	if strings.TrimSpace(req.Slug) == "" {
		slugBase = utils.Slugify(title)
	}

	news := models.News{
		Title:      title,
		Slug:       uniqueNewsSlug(slugBase, 0),
		Excerpt:    strings.TrimSpace(req.Excerpt),
		Content:    content,
		CoverImage: strings.TrimSpace(req.CoverImage),
		Status:     status,
	}
	if status == "published" {
		publishedAt := req.PublishedAt
		if publishedAt == nil {
			now := time.Now().UTC()
			publishedAt = &now
		}
		news.PublishedAt = publishedAt
	}

	if userID, ok := c.Get("user_id"); ok {
		if id, ok := userID.(uint); ok && id > 0 {
			news.AuthorID = &id
		}
	}

	if err := config.DB.Create(&news).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to create news"))
		return
	}

	config.DB.Preload("Author").First(&news, news.ID)
	c.JSON(http.StatusCreated, news)
}

func UpdateNews(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("invalid news id"))
		return
	}

	var news models.News
	if err := config.DB.First(&news, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("news not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to load news"))
		return
	}

	var req newsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("title and content are required"))
		return
	}

	status := normalizeStatus(req.Status)
	if status == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("status must be draft or published"))
		return
	}

	title := strings.TrimSpace(req.Title)
	content := strings.TrimSpace(req.Content)
	if title == "" || content == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("title and content are required"))
		return
	}

	news.Title = title
	news.Excerpt = strings.TrimSpace(req.Excerpt)
	news.Content = content
	news.CoverImage = strings.TrimSpace(req.CoverImage)
	news.Status = status

	if strings.TrimSpace(req.Slug) != "" {
		news.Slug = uniqueNewsSlug(utils.Slugify(req.Slug), news.ID)
	} else if strings.TrimSpace(news.Slug) == "" {
		news.Slug = uniqueNewsSlug(utils.Slugify(title), news.ID)
	}

	if status == "published" && news.PublishedAt == nil {
		publishedAt := req.PublishedAt
		if publishedAt == nil {
			now := time.Now().UTC()
			news.PublishedAt = &now
		} else {
			news.PublishedAt = publishedAt
		}
	}
	if status == "draft" {
		news.PublishedAt = nil
	}

	if err := config.DB.Save(&news).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to update news"))
		return
	}

	config.DB.Preload("Author").First(&news, news.ID)
	c.JSON(http.StatusOK, news)
}

func DeleteNews(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("invalid news id"))
		return
	}

	result := config.DB.Delete(&models.News{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to delete news"))
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, utils.ErrorResponse("news not found"))
		return
	}

	c.Status(http.StatusNoContent)
}
