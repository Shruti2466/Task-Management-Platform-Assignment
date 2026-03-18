# Task Management Platform

## Overview
A microservices-based Task Management Platform built using .NET Core (`net10.0`), Entity Framework Core (MySQL), and Angular 17. The project demonstrates clean separation of concerns, inter-service HTTP communication, JWT-based authentication with role-based access control, a modern SPA frontend, and comprehensive Docker Compose orchestration.

## Architecture

| Service | Port | Responsibility |
|---|---|---|
| **User Service** | 5001 | User CRUD, JWT auth, roles (Admin / Manager / Engineer) |
| **Task Service** | 5002 | Task CRUD, assignee management, status workflow, activity logs |
| **Reporting Service** | 5003 | Aggregation reports (by user, by status, SLA breaches) via TaskService |
| **Angular Frontend** | 4200 | SPA consuming all three services |

## Setup & Running

### Option 1 — Docker Compose (Recommended)
Requires Docker Desktop installed. This provisions the core services, the Angular frontend, and the MySQL database containers.

```bash
cd TaskManagementPlatform
docker-compose up --build
```

Access the app at `http://localhost:4200`

### Option 2 — Run Locally (without Docker)
Open **4 terminals**:

```bash
# Terminal 1 – User Service
cd UserService && dotnet run

# Terminal 2 – Task Service
cd TaskService && dotnet run

# Terminal 3 – Reporting Service
cd ReportingService && dotnet run

# Terminal 4 – Angular Frontend
cd frontend
npm install
npm start
```

Access the app at `http://localhost:4200`

### Default Seeded Credentials

| Username | Password | Role |
|---|---|---|
| `admin` | `admin` | Admin |
| `manager1` | `manager1` | Manager |
| `engineer1` | `engineer1` | Engineer |

## Running Tests

```bash
cd TaskManagementPlatform
dotnet test --verbosity normal
```

This runs tests across all layers including `TaskService.Tests`, `UserService.Tests`, and `ReportingService.Tests` implementing both unit and integration permutations.

## API Documentation

- **Swagger / OpenAPI**: Available at `http://localhost:{port}/openapi/v1.json` per service (Development mode only).
- **Postman Collection**: Import `TaskManagementPlatform.postman_collection.json` from the repo root. Run the **Login** request first — it automatically saves the token to the `{{token}}` variable used by all other requests.

## Design Decisions

### Microservice Boundaries
Each service owns a distinct domain:
- **UserService** — identity & access management only; no knowledge of tasks.
- **TaskService** — the core operational service; owns the task lifecycle and immutable activity log.
- **ReportingService** — a read-only aggregation service; pulls data from TaskService on-demand via HTTP. This keeps reporting logic decoupled and independently scalable.

### Authentication
JWT is generated with a symmetric HMAC-SHA256 key and includes `NameIdentifier`, `Name`, and `Role` claims. This is a **stub** — not production-grade (no refresh tokens, no key rotation). All three services validate the same token, eliminating the need for a dedicated auth gateway.

### Inter-Service Communication
ReportingService calls TaskService directly over HTTP, forwarding the caller's Bearer token. This is a simple, infrastructure-free approach suitable for the assignment scope. In production, an event bus (e.g. RabbitMQ) or API gateway would be preferred.

### Persistent Database & Migrations
The platform operates on a robust MySQL persistence layer. Entity Framework Core automatically evaluates and provisions iterative migrations ensuring tables are mapped safely at runtime boundaries. 

### Modern Angular Frontend
The SPA utilizes strict TypeScript interfaces throughout (`models.ts`), comprehensive cross-component error handling contexts, loading/spin-states, Reactive Form validations natively bound to the templates, and explicit UI filter dropdowns (Assignees + Dates) tied seamlessly to the `TaskService`.

### Role-Based Access Control
Enforced at the controller level using `[Authorize(Roles = "Admin")]` and `[Authorize(Roles = "Admin,Manager")]` attributes. The JWT `Role` claim drives access checks without any additional middleware.

### Structured Logging
All services use .NET's built-in `ILogger<T>` with structured log messages (e.g. `LogInformation`, `LogError`), compatible with any standard logging sink (e.g. Serilog, Application Insights).


