# CareerOS

CareerOS is a career-management platform for tracking skills, project evidence,
job applications, requirements, match scores, and skill gaps.

The repository contains a Next.js Backend-for-Frontend and an ASP.NET Core API:

```text
browser -> client/ (Next.js, encrypted first-party session)
               -> server/ (ASP.NET Core, bearer-token API)
                         -> PostgreSQL (EF Core + Npgsql)
```

CareerOS and the companion SkillForge application use the same Auth0 tenant.
Each application has its own OIDC client, while both APIs validate access tokens
for the shared API audience. Auth0 single sign-on means signing in to one app can
reuse the provider session in the other app.

## Authentication and data ownership

- The official Auth0 Next.js SDK performs Authorization Code + PKCE login,
  refreshes tokens, and stores its session in an encrypted HTTP-only cookie.
- The ASP.NET Core server validates JWT issuer, audience, lifetime, and signature.
- `POST /api/users/sync` provisions or refreshes the local user from Auth0's
  `/userinfo` endpoint. The stable OIDC `sub` claim is stored as `User.AuthSub`.
- Skills, projects, and job applications are scoped to the local
  user derived from the validated token. A resource owned by another user is
  returned as not found.
- Foreign keys use cascading deletes, so removing a local user removes all of
  that user's CareerOS data.

Deleting the Auth0 identity across CareerOS and SkillForge is a separate account
orchestration feature. The current API guarantees local ownership and cleanup;
it does not use Auth0 Management API credentials to delete the central identity.

## Backend stack

- .NET 10 / ASP.NET Core Controllers
- Entity Framework Core and PostgreSQL (Neon)
- Auth0-compatible OIDC/JWT bearer authentication
- OpenAPI
- Service layer and request/response DTOs
- RFC 7807 Problem Details error responses

## Local setup

### Server

From `server/`:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "YOUR_NPGSQL_CONNECTION_STRING"
dotnet user-secrets set "Oidc:Issuer" "https://YOUR-TENANT.eu.auth0.com"
dotnet user-secrets set "Oidc:Audience" "https://skillbridge-api"
dotnet restore
dotnet ef database update
dotnet run
```

The PostgreSQL connection string must use Npgsql's key/value format rather than
Neon's `postgresql://` URI. Example requests are in `server/server.http`.

### Client

Copy `client/.env.example` to `client/.env.local`, fill in the Auth0 and service
URLs, and generate a 32-byte hexadecimal `AUTH0_SECRET`. Then run:

```powershell
cd client
npm install
npm run dev
```

For the local SSO setup, open `http://careeros.localhost:3000`; using separate
`*.localhost` hostnames prevents the two applications from accidentally sharing
cookies merely because they use the same `localhost` host.

## API

All resource endpoints require a bearer token. Health endpoints are anonymous.

### Account

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/users/sync` | Provision/update the signed-in user |
| GET | `/api/users/me` | Return the local signed-in user |
| DELETE | `/api/users/me` | Delete the local user and owned CareerOS data |

### Skills

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/skills` | List/filter owned skills (`search`, `category`, `level`) |
| GET | `/api/skills/{id}` | Get one skill |
| POST | `/api/skills` | Create a skill |
| PUT | `/api/skills/{id}` | Replace a skill |
| DELETE | `/api/skills/{id}` | Delete a skill |

Skill levels are `Beginner`, `Intermediate`, and `Advanced`.

### Projects

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/projects` | List/filter owned projects (`search`, `skillId`) |
| GET | `/api/projects/{id}` | Get a project and its skills |
| POST | `/api/projects` | Create a project with `skillIds` |
| PUT | `/api/projects/{id}` | Replace a project and its skill links |
| DELETE | `/api/projects/{id}` | Delete a project |
| POST | `/api/projects/{projectId}/skills/{skillId}` | Link an owned skill |
| DELETE | `/api/projects/{projectId}/skills/{skillId}` | Unlink an owned skill |

### Job applications

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/job-applications` | List/filter owned applications (`status`, `search`) |
| GET | `/api/job-applications/{id}` | Get an application and its requirements |
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
| GET | `/api/dashboard` | User-scoped aggregates, match average, and missing skills |
| GET | `/health/live` | Process liveness check |
| GET | `/health/ready` | Readiness check including PostgreSQL |
| GET | `/health` | Readiness alias for hosting providers |
| GET | `/openapi/v1.json` | OpenAPI document in Development |

## Deployment notes

- `server/Dockerfile` builds the .NET service for Render.
- The server validates tokens but has no OIDC client secret; only the Next.js
  client obtains tokens and therefore needs the client secret.
- `User.Id` is a UUID because it crosses identity/service boundaries. Internal
  aggregate keys remain compact database-generated integers; authorization is
  enforced by owner foreign keys rather than by making identifiers unguessable.
- Apply database migrations as a dedicated deployment step before starting or
  scaling the API; the running application never changes the schema itself.
