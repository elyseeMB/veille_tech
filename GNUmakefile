.PHONY: build build-gateway build-backfill deploy deploy-fetcher deploy-gateway run-fetcher run-gateway api-dev clean

build:
	cd apps/fetcher && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o bootstrap main.go

build-gateway:
	cd apps/gateway && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o bootstrap main.go

build-backfill:
	cd apps/fetcher && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o backfill ./cmd/backfill/main.go

deploy-fetcher: build
	cd apps/fetcher && \
	powershell Compress-Archive -Force bootstrap bootstrap.zip && \
	aws lambda update-function-code --function-name veille-fetcher --zip-file fileb://bootstrap.zip --region us-east-1

deploy-gateway: build-gateway
	cd apps/gateway && \
	powershell Compress-Archive -Force bootstrap bootstrap.zip && \
	aws lambda update-function-code --function-name veille-gateway --zip-file fileb://bootstrap.zip --region us-east-1

deploy: deploy-fetcher deploy-gateway

run-fetcher:
	cd apps/fetcher && go run main.go

run-gateway:
	cd apps/gateway && go run main.go

api-dev:
	cd apps/fetcher && go run main.go & \
	cd apps/gateway && go run main.go & \
	pnpm -C apps/root/ run dev

clean:
	rm -f apps/fetcher/bootstrap apps/fetcher/bootstrap.zip apps/gateway/bootstrap apps/gateway/bootstrap.zip backfill