package repository

import (
	"context"

	"gateway/config"
	"gateway/models"
)

func GetGraph(date string) (*models.GraphResponse, error) {
	rows, err := config.DB.Query(
		context.Background(),
		`SELECT a.id, a.title
		FROM articles a
		WHERE a.published_at::date = $1`,
		date,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var nodes []models.GraphNode
	for rows.Next() {
		var n models.GraphNode
		if err := rows.Scan(&n.ID, &n.Label); err != nil {
			return nil, err
		}
		n.Type = "article"
		nodes = append(nodes, n)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	entityRows, err := config.DB.Query(
		context.Background(),
		`SELECT DISTINCT e.id, e.name
		FROM entities e
		JOIN article_entities ae ON ae.entity_id = e.id
		JOIN articles a ON a.id = ae.article_id
		WHERE a.published_at::date = $1`,
		date,
	)
	if err != nil {
		return nil, err
	}
	defer entityRows.Close()

	for entityRows.Next() {
		var n models.GraphNode
		if err := entityRows.Scan(&n.ID, &n.Label); err != nil {
			return nil, err
		}
		n.Type = "entity"
		nodes = append(nodes, n)
	}
	if err := entityRows.Err(); err != nil {
		return nil, err
	}

	var edges []models.GraphEdge

	linkRows, err := config.DB.Query(
		context.Background(),
		`SELECT ae.article_id, ae.entity_id
		FROM article_entities ae
		JOIN articles a ON a.id = ae.article_id
		WHERE a.published_at::date = $1`,
		date,
	)
	if err != nil {
		return nil, err
	}
	defer linkRows.Close()

	for linkRows.Next() {
		var e models.GraphEdge
		if err := linkRows.Scan(&e.Source, &e.Target); err != nil {
			return nil, err
		}
		e.Similarity = 1.0
		edges = append(edges, e)
	}
	if err := linkRows.Err(); err != nil {
		return nil, err
	}

	edgeRows, err := config.DB.Query(
		context.Background(),
		`SELECT ge.article_a, ge.article_b, ge.similarity
		FROM graph_edges ge
		JOIN articles a ON a.id = ge.article_a
		WHERE a.published_at::date = $1
		AND ge.similarity > 0.85
		ORDER BY ge.similarity DESC`,
		date,
	)
	if err != nil {
		return nil, err
	}
	defer edgeRows.Close()

	for edgeRows.Next() {
		var e models.GraphEdge
		if err := edgeRows.Scan(&e.Source, &e.Target, &e.Similarity); err != nil {
			return nil, err
		}
		edges = append(edges, e)
	}
	if err := edgeRows.Err(); err != nil {
		return nil, err
	}

	return &models.GraphResponse{
		Nodes: nodes,
		Edges: edges,
	}, nil
}
