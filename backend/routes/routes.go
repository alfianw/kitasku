package routes

import (
	"net/http"

	"backend-golang/config"
	"backend-golang/controllers"
	"backend-golang/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(middlewares.CORSMiddleware())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.Static("/uploads", config.App.UploadDir)

	api := r.Group("/api/v1")
	{
		api.GET("/news", controllers.GetPublicNews)
		api.GET("/news/:slug", controllers.GetNewsBySlug)
		api.GET("/gallery", controllers.GetGallery)

		api.POST("/auth/login", controllers.Login)

		admin := api.Group("/admin")
		admin.Use(middlewares.JWTMiddleware())
		{
			admin.GET("/news", controllers.GetAdminNews)
			admin.POST("/news", controllers.CreateNews)
			admin.PUT("/news/:id", controllers.UpdateNews)
			admin.DELETE("/news/:id", controllers.DeleteNews)

			admin.GET("/gallery", controllers.GetAdminGallery)
			admin.POST("/gallery", controllers.CreateGallery)
			admin.PUT("/gallery/:id", controllers.UpdateGallery)
			admin.DELETE("/gallery/:id", controllers.DeleteGallery)

			admin.POST("/uploads", controllers.UploadImage)
			admin.PUT("/password", controllers.ChangePassword)
		}
	}

	return r
}
