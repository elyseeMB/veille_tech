.PHONY: api-dev
api-dev:
	go run apps/fetcher/main.go & \
	go run apps/gateway/main.go & \
	pnpm -C apps/root/ run dev   