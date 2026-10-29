package controllers

import (
	"net/http"
	"unicode/utf8"

	"backend-golang/config"
	"backend-golang/models"
	"backend-golang/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type loginRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("username/email and password are required"))
		return
	}

	identifier := req.Username
	if identifier == "" {
		identifier = req.Email
	}
	if identifier == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("username or email is required"))
		return
	}

	var user models.User
	err := config.DB.Where("username = ? OR email = ?", identifier, identifier).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, utils.ErrorResponse("invalid credentials"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to authenticate"))
		return
	}

	if !utils.CheckPassword(user.PasswordHash, req.Password) {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("invalid credentials"))
		return
	}

	token, err := utils.GenerateToken(config.App.JWTSecret, config.App.JWTExpiresHours, &user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to generate token"))
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":      token,
		"token_type": "Bearer",
		"expires_in": config.App.JWTExpiresHours * 3600,
		"user":       user,
	})
}

type changePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required"`
}

func ChangePassword(c *gin.Context) {
	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("current password and new password are required"))
		return
	}

	userID, exists := c.Get("user_id")
	id, ok := userID.(uint)
	if !exists || !ok || id == 0 {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("invalid session"))
		return
	}

	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, utils.ErrorResponse("account not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to load account"))
		return
	}

	if !utils.CheckPassword(user.PasswordHash, req.CurrentPassword) {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("current password is incorrect"))
		return
	}

	if utf8.RuneCountInString(req.NewPassword) < 8 {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("new password must be at least 8 characters"))
		return
	}
	if req.NewPassword == req.CurrentPassword {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("new password must be different from the current password"))
		return
	}

	hash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to update password"))
		return
	}

	user.PasswordHash = hash
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("failed to update password"))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
}
