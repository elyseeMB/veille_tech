package v1

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mbous/veille_tech/pkg/coredata"
	"github.com/mbous/veille_tech/pkg/db"
	"github.com/mbous/veille_tech/pkg/db/repository"
)

func GetClusters(conn *db.PostgresConnection) gin.HandlerFunc {
	return func(c *gin.Context) {
		clusters, sourcesMap, err := repository.GetRecentClusters(conn)
		if err != nil {
			log.Printf("Erreur GetRecentClusters: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de charger les clusters"})
			return
		}

		dtos := []coredata.ClusterDTO{}
		for _, cl := range clusters {
			dtos = append(dtos, coredata.ToClusterDTO(cl, sourcesMap[cl.ID], nil, nil))
		}
		c.JSON(http.StatusOK, dtos)
	}
}

func GetClusterByID(conn *db.PostgresConnection) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		cluster, sources, articles, videos, err := repository.GetClusterWithItems(conn, id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Cluster introuvable"})
			return
		}

		articleDTOs := []coredata.ArticleDTO{}
		for _, a := range articles {
			articleDTOs = append(articleDTOs, coredata.ToArticleDTO(a))
		}

		videoDTOs := []coredata.VideoDTO{}
		for _, v := range videos {
			videoDTOs = append(videoDTOs, coredata.ToVideoDTO(v))
		}

		c.JSON(http.StatusOK, coredata.ToClusterDTO(cluster, sources, articleDTOs, videoDTOs))
	}
}
