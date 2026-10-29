package controllers

import (
	"net/http"
	"strings"

	"backend-golang/config"
	"backend-golang/models"
	"backend-golang/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type galleryRequest struct {
	Title    string `json:"title" binding:"required"`
	ImageURL string `json:"image_url" binding:"required"`
	Caption  string `json:"caption"`
	Category string `json:"category"`
}

func GetGallery(c *gin.Context) {
	page, limit, offset := utils.Pagination(c)

	query := config.DB.Model(&models.Gallery{})
	if category := strings.TrimSpace(c.Query("category")); category != "" {
		query = query.Where("category = ?", category)
	}
	if search := strings.TrimSpace(c.Query("q")); search != "" {
		like := "%" + search + "%"
		query = query.Where("title ILIKE ? OR caption ILIKE ?", like, like)
	}

	var total int64
	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to load gallery"))
		return
	}

	var items []models.Gallery
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to load gallery"))
		return
	}

	c.JSON(http.StatusOK, utils.PaginatedResponse(items, page, limit, total))
}

func GetAdminGallery(c *gin.Context) {
	GetGallery(c)
}

func CreateGallery(c *gin.Context) {
	var req galleryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("title and image_url are required"))
		return
	}

	title := strings.TrimSpace(req.Title)
	imageURL := strings.TrimSpace(req.ImageURL)
	if title == "" || imageURL == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("title and image_url are required"))
		return
	}

	item := models.Gallery{
		Title:    title,
		ImageURL: imageURL,
		Caption:  strings.TrimSpace(req.Caption),
		Category: strings.TrimSpace(req.Category),
	}

	if err := config.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to create gallery item"))
		return
	}

	c.JSON(http.StatusCreated, item)
}

func UpdateGallery(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("invalid gallery id"))
		return
	}

	var item models.Gallery
	if err := config.DB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("gallery item not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to load gallery item"))
		return
	}

	var req galleryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("title and image_url are required"))
		return
	}

	title := strings.TrimSpace(req.Title)
	imageURL := strings.TrimSpace(req.ImageURL)
	if title == "" || imageURL == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("title and image_url are required"))
		return
	}

	item.Title = title
	item.ImageURL = imageURL
	item.Caption = strings.TrimSpace(req.Caption)
	item.Category = strings.TrimSpace(req.Category)

	if err := config.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to update gallery item"))
		return
	}

	c.JSON(http.StatusOK, item)
}

func DeleteGallery(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("invalid gallery id"))
		return
	}

	result := config.DB.Delete(&models.Gallery{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to delete gallery item"))
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, utils.ErrorResponse("gallery item not found"))
		return
	}

	c.Status(http.StatusNoContent)
}
