.PHONY: build build-fetcher build-server build-archiver \
        deploy-fetcher deploy-gateway deploy \
        run-fetcher run-server run-archiver run-clustering \
        setup-clustering \
        sam-build sam-deploy clean \
        dev-backend dev-frontend stack-up

DOCKER?= docker
GOW?= gow
DOCKER_COMPOSE= $(DOCKER) compose

build-fetcher:
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 \
	go build -o bin/fetcher ./cmd/fetcher/main.go

build-server:
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 \
	go build -o bin/server ./cmd/server/main.go

build-archiver:
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 \
	go build -o bin/archiver ./cmd/archiver/main.go

build: build-fetcher build-server

deploy-fetcher: build-fetcher
	zip -j bin/fetcher.zip bin/fetcher && \
	aws lambda update-function-code \
		--function-name veille-fetcher \
		--zip-file fileb://bin/fetcher.zip \
		--region us-east-1

deploy-gateway: build-server
	zip -j bin/server.zip bin/server && \
	aws lambda update-function-code \
		--function-name veille-gateway \
		--zip-file fileb://bin/server.zip \
		--region us-east-1

deploy-archiver: build-archiver
	zip -j bin/archiver.zip bin/archiver && \
	aws lambda update-function-code \
		--function-name veille-archiver \
		--zip-file fileb://bin/archiver.zip \
		--region us-east-1

deploy: deploy-fetcher deploy-gateway

setup-clustering:
	cd workers/clustering && pip install -r requirements.txt

run-clustering: setup-clustering
	cd workers/clustering && USE_MOCK=false DATABASE_URL="postgres://veille:veille@localhost:5432/veille_db" python app.py

run-fetcher:
	go run ./cmd/fetcher/main.go

run-server:
	go run ./cmd/server/main.go

run-archiver:
	go run ./cmd/archiver/main.go

sam-build:
	cd iac && sam build

sam-deploy: sam-build
	cd iac && sam deploy --no-confirm-changeset

dev-backend: stack-up
	go run ./cmd/fetcher/main.go & \
	go run ./cmd/server/main.go

dev-frontend:
	cd apps/root && pnpm run dev

stack-up:
	$(DOCKER_COMPOSE) up -d

clean:
	rm -rf bin/
