.PHONY: build build-backfill zip run clean api-dev

# Build Lambda fetcher (Linux amd64)
build:
	cd apps/fetcher && \
	set GOOS=linux&& set GOARCH=amd64&& set CGO_ENABLED=0&& \
	go build -o ../../bootstrap main.go

# Build backfill tool
build-backfill:
	cd apps/fetcher && \
	set GOOS=linux&& set GOARCH=amd64&& set CGO_ENABLED=0&& \
	go build -o ../../backfill ./cmd/backfill/main.go

# Zip pour déployer sur Lambda
# zip: build
# 	powershell Compress-Archive -Force bootstrap bootstrap.zip

# Run local (dev)
run-fetcher:
	cd apps/fetcher && go run main.go

run-gateway:
	cd apps/gateway && go run main.go


# Dev mode complet
api-dev:
	cd apps/fetcher && go run main.go & \
	cd apps/gateway && go run main.go & \
	pnpm -C apps/root/ run dev

# Clean
clean:
	del -f bootstrap backfill bootstrap.zip