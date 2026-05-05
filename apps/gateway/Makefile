build-GatewayFunction:
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o bootstrap ./main.go
	cp bootstrap $(ARTIFACTS_DIR)/