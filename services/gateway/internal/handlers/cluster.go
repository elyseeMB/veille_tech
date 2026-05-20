package handlers

import (
	"gateway/internal/models"
	"gateway/internal/repository"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetClusters() gin.HandlerFunc {
	return func(c *gin.Context) {
		clusters, sourcesMap, err := repository.GetRecentClusters()
		if err != nil {
			log.Printf("Erreur GetRecentClusters: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de charger les clusters"})
			return
		}

		dtos := []models.ClusterDTO{}
		for _, cl := range clusters {
			dtos = append(dtos, models.ToClusterDTO(cl, sourcesMap[cl.ID], nil, nil))
		}
		c.JSON(http.StatusOK, dtos)
	}
}

func GetClusterByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		cluster, sources, articles, videos, err := repository.GetClusterWithItems(id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Cluster introuvable"})
			return
		}

		articleDTOs := []models.ArticleDTO{}
		for _, a := range articles {
			articleDTOs = append(articleDTOs, models.ToArticleDTO(a))
		}

		videoIDs := []models.VideoDTO{}
		for _, a := range videos {
			videoIDs = append(videoIDs, models.ToVideoDTO(a))
		}

		c.JSON(http.StatusOK, models.ToClusterDTO(cluster, sources, articleDTOs, videoIDs))
	}
}
