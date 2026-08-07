# Veille Tech

> Personal platform for collecting, processing, organizing and exploring technology content from multiple sources.

**Live:** https://veille.safecoffi.app

Veille Tech is a personal technology-watch platform designed to automatically collect content from sources such as RSS feeds and YouTube, enrich it using AI, generate semantic embeddings, cluster related content and expose the resulting data through a web application.

The project combines a React frontend, a Go backend, Python workers for NLP/ML processing, PostgreSQL with vector capabilities, Docker for local infrastructure and AWS serverless services for production.

---

## Features

* Collect technology content from RSS feeds
* Collect YouTube content
* Automatically enrich content with AI-generated metadata
* Extract topics and keywords
* Generate semantic embeddings
* Store and query vector data with PostgreSQL
* Automatically group related content using clustering
* Detect outliers/noise during clustering
* Generate names and descriptions for clusters
* Expose the data through a Go HTTP API
* Provide a responsive React web application
* Progressive Web App support
* Run the backend locally or through AWS Lambda
* Automate ingestion and clustering with scheduled AWS functions
* Manage infrastructure through AWS SAM
* Run the complete development stack with Docker

---

## Architecture

The project is organized as a monorepo containing the frontend, Go services, Python workers, infrastructure and shared backend packages.

```text
                                    ┌──────────────────┐
                                    │   RSS / YouTube  │
                                    └────────┬─────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │      Fetcher     │
                                    │       Go         │
                                    └────────┬─────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │    PostgreSQL    │
                                    │    + pgvector    │
                                    └────────┬─────────┘
                                             │
                                             ▼
                              ┌──────────────────────────┐
                              │     Python Workers       │
                              │                          │
                              │  Scraping                │
                              │  Chunking                │
                              │  Metadata extraction     │
                              │  Embeddings              │
                              │  Clustering              │
                              │  Cluster naming          │
                              └────────────┬─────────────┘
                                           │
                                           ▼
                                    ┌──────────────────┐
                                    │    PostgreSQL    │
                                    │  articles/clusters│
                                    └────────┬─────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │    Go Gateway    │
                                    │      Gin         │
                                    └────────┬─────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │ React / Vite PWA │
                                    └──────────────────┘
```

---

## Project structure

```text
.
├── .devcontainer/              # Development container configuration
├── .github/
│   └── workflows/              # CI/CD workflows
│       ├── ci.yaml
│       ├── deploy.yaml
│       └── secrets.yaml
│
├── apps/
│   └── root/                   # React frontend
│
├── cfg/                        # Configuration files
│
├── cmd/
│   ├── fetcher/                # Content ingestion service
│   ├── server/                 # HTTP API
│   └── archiver/               # Archiving service
│
├── compose/
│   └── postgres/               # PostgreSQL Docker configuration
│
├── data/
│   └── migrations/             # PostgreSQL migrations
│
├── iac/                        # AWS SAM infrastructure
│
├── internal/
│   └── tools/                  # Internal development tools
│
├── lambdas/
│   ├── fetcher/                # Lambda packaging/build
│   ├── server/                 # Lambda packaging/build
│   └── archiver/               # Lambda packaging/build
│
├── pkg/
│   ├── awsconfig/              # AWS configuration
│   ├── cfg/                    # Application configuration
│   ├── coredata/               # Core domain/data structures
│   ├── daemon/                 # Background process utilities
│   ├── db/                     # Database layer
│   ├── server/                 # HTTP server/router logic
│   └── veille/                 # Technology-watch domain logic
│
├── workers/
│   ├── audio_handler/          # Audio processing utilities
│   ├── clustering/             # NLP / embeddings / clustering pipeline
│   └── scatter/                # Scatter/visualization processing
│
├── docker-compose.yml          # Local infrastructure
├── GNUmakefile                 # Development/build/deployment commands
├── go.mod                      # Go dependencies
├── package.json                # Root JS tooling
├── pnpm-workspace.yaml         # pnpm workspace configuration
├── turbo.json                  # Turborepo configuration
└── .env.example                # Environment variables template
```

---

# Data pipeline

The main processing pipeline is designed to progressively transform raw content into structured and semantically grouped information.

```text
Source
  │
  ▼
Ingestion
  │
  ▼
Raw content
  │
  ▼
Scraping
  │
  ▼
Text extraction
  │
  ▼
Chunking
  │
  ▼
Metadata extraction
  │
  ├── Topic
  └── Keywords
  │
  ▼
Embedding generation
  │
  ▼
Vector representation
  │
  ▼
HDBSCAN clustering
  │
  ├── Cluster
  └── Noise / Outlier
  │
  ▼
Cluster analysis
  │
  ▼
AI-generated name + description
  │
  ▼
Persisted knowledge
```

## 1. Content ingestion

The Go `fetcher` is responsible for retrieving new content from configured sources.

It can run:

* locally as a Go process;
* as an AWS Lambda function.

The same application entry point supports both execution environments.

---

## 2. Content processing

The Python clustering worker processes content that has not yet been enriched.

The processing pipeline includes:

* scraping;
* text extraction;
* chunking;
* metadata extraction;
* embedding generation;
* clustering;
* outlier detection;
* cluster naming.

The worker is designed to run locally as well as inside AWS Lambda using a container image.

---

## 3. Semantic embeddings

Content is transformed into vector representations.

The embedding input is enriched with information such as:

```text
Title
Tags / keywords
Content
```

The resulting vectors are stored in PostgreSQL and can be used for semantic processing.

---

## 4. Clustering

The clustering pipeline uses dimensionality reduction and density-based clustering.

The main components include:

* NumPy
* UMAP
* HDBSCAN
* PostgreSQL vector storage

HDBSCAN allows the system to identify both meaningful groups and content that does not clearly belong to a cluster.

```text
                  Embeddings
                      │
                      ▼
                    UMAP
                      │
                      ▼
                   HDBSCAN
                      │
             ┌────────┴────────┐
             ▼                 ▼
          Clusters           Noise
             │
             ▼
        Cluster analysis
```

---

## 5. AI-generated clusters

Once related content has been grouped, the system generates a human-readable representation of each cluster.

A cluster can therefore evolve from:

```text
Cluster #17
```

into something meaningful such as:

```text
Web Performance & Browser APIs
```

with an automatically generated description.

---

# Backend

The backend is written in Go.

It is split into several executable applications:

### Fetcher

```text
cmd/fetcher
```

Responsible for content ingestion.

### Server

```text
cmd/server
```

Provides the HTTP API used by the frontend.

The HTTP layer is based on Gin and can also be executed behind AWS API Gateway and Lambda.

### Archiver

```text
cmd/archiver
```

Responsible for archival operations.

---

# Frontend

The frontend lives in:

```text
apps/root
```

It is built with:

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* TanStack Query
* Zustand
* Framer Motion
* D3
* PWA tooling

The frontend communicates with the Go API and provides the interface for browsing and exploring the collected technology content.

The application is also configured as a Progressive Web App.

---

# Database

The project uses PostgreSQL as its primary database.

Vector processing is supported through PostgreSQL's vector capabilities.

Database migrations are stored under:

```text
data/migrations/
```

Example:

```text
data/migrations/
└── 000003_cluster_items.up.sql
```

Local PostgreSQL infrastructure is available through Docker.

---

# Local development

## Requirements

Install the following tools:

* Git
* Go
* Node.js
* pnpm
* Python
* Docker
* Docker Compose
* Make
* AWS CLI — only required for AWS deployment
* AWS SAM CLI — only required for SAM deployment

The JavaScript workspace currently uses pnpm and Turborepo.

---

## Clone the repository

```bash
git clone https://github.com/elyseeMB/veille_tech.git
cd veille_tech
```

---

## Install frontend dependencies

```bash
pnpm install
```

---

## Environment variables

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

The repository currently documents:

```env
DATABASE_URL=
YOUTUBE_API_KEY=
```

Additional worker/AWS configuration may be required depending on which component is being executed.

Never commit real credentials or API keys.

---

# Start local infrastructure

The project provides a Docker Compose stack for local development.

```bash
make stack-up
```

or:

```bash
docker compose up -d
```

---

# Run the frontend

```bash
make dev-frontend
```

or:

```bash
cd apps/root
pnpm run dev
```

---

# Run the backend

The backend can be started with:

```bash
make dev-backend
```

This starts the local infrastructure and launches the fetcher and server.

Individual services can also be started separately.

### Fetcher

```bash
make run-fetcher
```

### Server

```bash
make run-server
```

### Archiver

```bash
make run-archiver
```

The available development/build commands are centralized in the repository `GNUmakefile`.

---

# Run the clustering worker

Install its Python dependencies:

```bash
make setup-clustering
```

Then:

```bash
make run-clustering
```

The clustering worker can also be executed directly:

```bash
cd workers/clustering
pip install -r requirements.txt
python app.py
```

---

# Build

## Frontend / JavaScript workspace

```bash
pnpm build
```

The root project uses Turborepo to orchestrate workspace builds.

## Go services

Build all main Go binaries:

```bash
make build
```

Individual binaries:

```bash
make build-fetcher
make build-server
make build-archiver
```

The production builds target Linux `amd64` with CGO disabled.

---

# Code quality

The root workspace provides linting and formatting commands.

### Lint

```bash
pnpm lint
```

### Format

```bash
pnpm format
```

### Check formatting

```bash
pnpm format:check
```

The project currently uses Oxlint and Oxfmt for JavaScript/TypeScript code quality.

---

# AWS architecture

Production infrastructure is defined using AWS SAM.

The main serverless components are:

```text
AWS
│
├── API Gateway
│      │
│      ▼
│   Gateway Lambda
│
├── Scheduled Fetcher Lambda
│
└── Scheduled Clustering Lambda
```

The SAM template defines:

* `veille-fetcher`
* `veille-gateway`
* `veille-clustering`

The fetcher uses AWS Systems Manager Parameter Store for sensitive configuration such as the database URL and YouTube API key.

---

## Fetcher scheduling

The production fetcher is scheduled according to several EventBridge schedules.

### Weekdays

Every 30 minutes during the configured daytime window.

### Weekends

Every hour during the configured daytime window.

### Night

Runs at configured four-hour intervals.

These schedules are defined directly in `iac/template.yaml`.

---

## Clustering scheduling

The clustering worker runs twice per day:

```text
06:00
18:00
```

The worker is deployed as a container-based Lambda with:

```text
Memory: 2048 MB
Timeout: 900 seconds
Architecture: x86_64
```

The production worker also receives its AI and Cloudflare configuration through AWS Systems Manager Parameter Store.

---

# AWS deployment

The repository includes SAM commands for building and deploying the infrastructure.

### Build SAM application

```bash
make sam-build
```

### Deploy

```bash
make sam-deploy
```

These commands execute the SAM build/deployment process from the `iac` directory.

---

# Direct Lambda deployment

The Makefile also provides direct Lambda deployment commands.

For example:

```bash
make deploy-fetcher
make deploy-gateway
make deploy-archiver
```

The binaries are built for Linux, compressed and uploaded to the corresponding AWS Lambda function.

---

# CI/CD

GitHub Actions are located in:

```text
.github/workflows/
```

Current workflows include:

```text
ci.yaml
deploy.yaml
secrets.yaml
```

They are responsible for repository automation such as validation and deployment.

---

# Infrastructure

Infrastructure-related configuration is located in:

```text
iac/
```

The main AWS SAM template is:

```text
iac/template.yaml
```

The infrastructure currently defines API Gateway, Lambda functions, scheduled executions, IAM policies and configuration access through AWS Systems Manager Parameter Store.

---

# Technology stack

## Frontend

| Technology     | Role                |
| -------------- | ------------------- |
| React          | UI                  |
| TypeScript     | Type safety         |
| Vite           | Build tooling       |
| Tailwind CSS   | Styling             |
| React Router   | Routing             |
| TanStack Query | Server state        |
| Zustand        | Client state        |
| Framer Motion  | Animations          |
| D3             | Data visualization  |
| Vite PWA       | Progressive Web App |

## Backend

| Technology | Role                  |
| ---------- | --------------------- |
| Go         | Backend/services      |
| Gin        | HTTP server           |
| PostgreSQL | Primary database      |
| pgvector   | Vector storage/search |

## Data / AI

| Technology | Role                            |
| ---------- | ------------------------------- |
| Python     | Data processing                 |
| UMAP       | Dimensionality reduction        |
| HDBSCAN    | Clustering                      |
| Embeddings | Semantic representation         |
| LLM        | Metadata and cluster generation |

## Infrastructure

| Technology              | Role                       |
| ----------------------- | -------------------------- |
| Docker                  | Local services/workers     |
| Docker Compose          | Local infrastructure       |
| AWS Lambda              | Serverless compute         |
| API Gateway             | HTTP API                   |
| AWS SAM                 | Infrastructure/deployment  |
| AWS SSM Parameter Store | Secrets/configuration      |
| GitHub Actions          | CI/CD                      |
| pnpm                    | JavaScript package manager |
| Turborepo               | Monorepo orchestration     |

---

# Development commands

| Command               | Description                           |
| --------------------- | ------------------------------------- |
| `pnpm install`        | Install JS dependencies               |
| `pnpm dev`            | Start workspace development           |
| `pnpm build`          | Build workspace                       |
| `pnpm lint`           | Lint JS/TS                            |
| `pnpm format`         | Format JS/TS                          |
| `pnpm format:check`   | Check formatting                      |
| `make stack-up`       | Start Docker infrastructure           |
| `make dev-backend`    | Start backend development environment |
| `make dev-frontend`   | Start frontend                        |
| `make run-fetcher`    | Run fetcher                           |
| `make run-server`     | Run API server                        |
| `make run-archiver`   | Run archiver                          |
| `make run-clustering` | Run clustering worker                 |
| `make build`          | Build Go services                     |
| `make sam-build`      | Build AWS SAM stack                   |
| `make sam-deploy`     | Deploy AWS SAM stack                  |
| `make clean`          | Remove generated binaries             |

---

# Design principles

The project follows a few main principles:

### Separation of concerns

Different technologies are used according to their strengths:

```text
React → User interface
Go    → API + ingestion
Python → NLP / ML processing
PostgreSQL → Persistent data + vectors
AWS   → Serverless execution
```

### Local-first development

The main infrastructure can be reproduced locally using Docker Compose.

### Serverless production workloads

Periodic ingestion and computationally expensive processing can run independently as AWS Lambda workloads.

---

# Repository

Source code:

https://github.com/elyseeMB/veille_tech

Live application:

https://veille.safecoffi.app

---

## License

The repository currently declares the `ISC` license in its root `package.json`.
