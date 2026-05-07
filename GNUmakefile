.PHONY: build build-gateway build-backfill \
        deploy-fetcher deploy-gateway deploy \
        run-fetcher run-gateway \
        sam-build sam-deploy clean \
		dev-back

build:
	cd services/fetcher && \
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 \
	go build -o function/bootstrap ./cmd/fetcher/main.go

build-gateway:
	cd services/gateway && \
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 \
	go build -o function/bootstrap ./cmd/gateway/main.go

build-backfill:
	cd services/fetcher && \
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 \
	go build -o function/backfill ./cmd/backfill/main.go

deploy-fetcher: build
	cd services/fetcher && \
	zip -j function/bootstrap.zip function/bootstrap && \
	aws lambda update-function-code \
		--function-name veille-fetcher \
		--zip-file fileb://function/bootstrap.zip \
		--region us-east-1

deploy-gateway: build-gateway
	cd services/gateway && \
	zip -j function/bootstrap.zip function/bootstrap && \
	aws lambda update-function-code \
		--function-name veille-gateway \
		--zip-file fileb://function/bootstrap.zip \
		--region us-east-1

deploy: deploy-fetcher deploy-gateway

run-fetcher:
	cd services/fetcher && go run ./cmd/fetcher/main.go

run-gateway:
	cd services/gateway && go run ./cmd/gateway/main.go

sam-build:
	cd infra && sam build

sam-deploy:
	cd infra && sam deploy

dev-back: run-fetcher run-gateway 

clean:
	rm -f services/fetcher/function/bootstrap \
	      services/fetcher/function/bootstrap.zip \
	      services/gateway/function/bootstrap \
	      services/gateway/function/bootstrap.zip
