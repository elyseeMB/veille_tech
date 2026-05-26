package repository

import (
	"net/http"
	"time"
)

var HTTPClient = &http.Client{
	Timeout: 10 * time.Second,
}
