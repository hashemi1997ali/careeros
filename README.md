# CareerOS

CareerOS is a career-management platform for tracking skills, project evidence,
job applications, job requirements, and skill gaps.

## Repository structure

```text
careeros/
├── client/   # Next.js frontend
└── server/   # ASP.NET Core Web API
```

## Backend stack

- .NET 10 / ASP.NET Core Controllers
- Entity Framework Core
- PostgreSQL (Neon)
- OpenAPI
- Service layer and request/response DTOs
- RFC 7807 Problem Details error responses

## Local backend setup

From `server/`:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "YOUR_POSTGRES_CONNECTION_STRING"
dotnet restore
dotnet ef database update
dotnet run
```

The default development address is defined in
`server/Properties/launchSettings.json`. Example requests are available in
`server/server.http`.

## API

### Skills

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/skills` | List/filter skills (`search`, `category`, `level`) |
| GET | `/api/skills/{id}` | Get one skill |
| POST | `/api/skills` | Create a skill |
| PUT | `/api/skills/{id}` | Replace a skill |
| DELETE | `/api/skills/{id}` | Delete a skill |

Skill levels are `Beginner`, `Intermediate`, and `Advanced`.

### Projects

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/projects` | List/filter projects (`search`, `skillId`) |
| GET | `/api/projects/{id}` | Get a project and its skills |
| POST | `/api/projects` | Create a project with `skillIds` |
| PUT | `/api/projects/{id}` | Replace a project and its skill links |
| DELETE | `/api/projects/{id}` | Delete a project |
| POST | `/api/projects/{projectId}/skills/{skillId}` | Link a skill |
| DELETE | `/api/projects/{projectId}/skills/{skillId}` | Unlink a skill |

### Job applications

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/job-applications` | List/filter applications (`status`, `search`) |
| GET | `/api/job-applications/{id}` | Get one application and requirements |
| POST | `/api/job-applications` | Create an application |
| PUT | `/api/job-applications/{id}` | Replace an application and requirements |
| PATCH | `/api/job-applications/{id}/status` | Update pipeline status |
| GET | `/api/job-applications/{id}/match` | Calculate weighted match and skill gaps |
| DELETE | `/api/job-applications/{id}` | Delete an application |

Application statuses are `Saved`, `Applied`, `HrInterview`,
`TechnicalInterview`, `Offer`, `Rejected`, and `Withdrawn`.

### Dashboard and operations

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/dashboard` | Aggregates, average match, and missing skills |
| GET | `/api/health` | API health response |
| GET | `/openapi/v1.json` | OpenAPI document in Development |

The current core API is intentionally authentication-independent. Auth0/OIDC
and per-user ownership can be added as the next backend phase without changing
the resource contracts used by the frontend.
