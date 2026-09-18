# CareerOS

Job posting analysis. A Next.js application holds the user session and acts as
the Backend-for-Frontend; an ASP.NET Core service owns the business logic and
the PostgreSQL database.

Companion repository: **SkillForge** (Angular + Express). The two applications
share one identity provider, so signing in to either signs you in to both.

---

## Shape

```
browser ──> Next.js on Vercel             (session cookie, first-party)
              ├── /                       React page
              ├── /auth/*                 OIDC: login, callback, logout
              ├── /api/me                 who is signed in
              ├── /api/jobs          ──>  ASP.NET Core API (Bearer + audience)
              └── /api/peer/skills   ──>  SkillForge API   (Bearer + audience)

ASP.NET Core on Render ──> Neon PostgreSQL (EF Core + Npgsql)
```

The browser only ever talks to the Vercel origin, so the session cookie is
first-party and there is no CORS configuration anywhere. Both outbound calls
happen server to server and carry the user's access token.

### Why the sign-in lives in `client` and not in `server`

The two halves have different jobs, and only one of them logs anyone in.

| | `client` (Next.js) | `server` (ASP.NET Core) |
| --- | --- | --- |
| Signs users in | yes | **no** |
| Answers with data given a token | no | yes |
| Needs a client secret | yes | **no** |
| Needs a session key | yes | **no** |

`server` is a *resource server*. It receives an access token that `client`
obtained and answers one question before doing any work: is this token genuine,
and is it addressed to me? Signatures are verified with the provider's **public**
keys, published openly at `jwks_uri`, so no secret is needed to check one. A
secret is needed only to *obtain* tokens — which `server` never does.

This is why `server/appsettings.json` has no client id and no client secret. It
is not an omission. There is nothing to steal from that configuration.

### Why C# on one side and TypeScript on the other is fine

The boundary between the two services is a **token**, not a shared module. The
Next application sends `Authorization: Bearer …` and reads JSON; what produced
that JSON is invisible to it. Replacing the API with a service in any other
language would not change one line in `client`.

---

## Layout

```
client/lib/config.ts             lazy env validation, discovery, JWKS
client/lib/session.ts            encrypted (JWE) session cookie
client/lib/auth.ts               OIDC flow, refresh, rotation
client/app/auth/*/route.ts       login, callback, logout
client/app/api/*/route.ts        me, jobs, peer skills
client/proxy.ts                  development host guard

server/Program.cs                configuration, JWT bearer, pipeline
server/Models/                   User, JobPosting, Skill
server/Data/AppDbContext.cs      mapping, indexes, timestamps
server/Services/                 OIDC discovery, just-in-time provisioning
server/Dtos/                     the public shape of the API
server/Controllers/              users, jobs, skills, health
server/Dockerfile                Render has no native .NET runtime
```

## Where a user comes from

There is no registration endpoint. People register with the identity provider;
the row in `Users` is created on the **first successful sign-in** and refreshed
on every later one — just-in-time provisioning.

`client` calls `POST /api/users/sync` with the user's access token. `server`
verifies that token, then asks the provider's `/userinfo` endpoint who it
belongs to rather than trusting the caller's word for the e-mail address, and
upserts on `AuthSub`.

`AuthSub` is the `sub` claim: stable for the life of the account and unchanged
by e-mail, username or password changes. That is why it, and not the e-mail
address, is the key.

---

## Running locally

### 0. Hostnames — required

```bash
echo "127.0.0.1 careeros.localhost skillforge.localhost" | sudo tee -a /etc/hosts
```

Chrome, Edge and Firefox resolve any `*.localhost` name to 127.0.0.1 by
themselves. **Node.js does not** — `dns.lookup('skillforge.localhost')` returns
`ENOTFOUND` — and `client` calls the other team's service by hostname, server to
server. Safari does not either.

Open the site at `http://careeros.localhost:3000`, **not** at the `localhost`
line Next prints on startup. Cookies are bound to a host: a sign-in started on
the wrong one leaves its cookie there, the provider returns the browser to the
`BASE_URL` host, the cookie is not sent, and the callback fails on a missing
state. `client/proxy.ts` redirects in development if you forget.

Two hostnames rather than two ports, because cookies are **not** isolated by
port: with both applications on `localhost`, one application's session cookie
would reach the other and the single sign-on demo would appear to work for
entirely the wrong reason.

### 1. Server

```bash
cd server

# Secrets stay out of the repository. The project already has a UserSecretsId.
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=ep-xxx-pooler.c-2.eu-central-1.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=...;SSL Mode=VerifyFull;Channel Binding=Require"
dotnet user-secrets set "Oidc:Issuer"   "https://YOUR-TENANT.eu.auth0.com"
dotnet user-secrets set "Oidc:Audience" "https://skillbridge-api"

dotnet tool install --global dotnet-ef      # once per machine
dotnet ef migrations add AddUsersAndJobPostings
dotnet run                                   # http://localhost:4000
```

> **The connection string is the trap.** Npgsql does **not** parse the
> `postgresql://…` URI Neon shows by default. It needs the key-value form above.
> Copying Neon's string straight into configuration fails with an error that
> does not mention the format at all.

Migrations are applied automatically at startup, so `dotnet ef database update`
is not needed separately. With one instance that is the simplest thing that
works; the day two instances start at once, migrations move to a step that runs
before the service does.

### 2. Client

```bash
cd client
cp .env.example .env.local
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"   # SESSION_SECRET

npm install
npm run dev                                  # http://careeros.localhost:3000
```

---

## Deploying

### server → Render

| Setting | Value |
| --- | --- |
| Language | Docker |
| Dockerfile Path | `./server/Dockerfile` |
| Docker Build Context Directory | `.` *(repository root)* |
| Health Check Path | `/health` |

Render has native runtimes for Node, Python, Ruby, Go, Rust and Elixir — not
for .NET — so the service ships as a container. The Dockerfile is two stages:
the SDK compiles, and only the compiled output reaches the runtime image.

Environment variables:

```
ConnectionStrings__DefaultConnection
Oidc__Issuer
Oidc__Audience
```

The double underscore is how ASP.NET Core spells a configuration section
separator in an environment variable. No code is needed to read them.

Three things in `Program.cs` exist specifically for this platform:

- **No `UseHttpsRedirection`.** Render terminates TLS at its edge and forwards
  plain HTTP inside. A redirect to HTTPS would bounce the caller to the address
  it just came from, and the health probe would see a 307 and restart the
  service in a loop.
- **`UseForwardedHeaders`**, with `KnownNetworks`/`KnownProxies` cleared,
  because Render's proxy is not on the loopback network. Without this the
  application believes every request came over HTTP from an internal address.
- **`ASPNETCORE_URLS` built from `PORT`** in the Dockerfile entrypoint, bound to
  `0.0.0.0`. Binding to localhost inside a container looks exactly like a crash
  from the outside.

### client → Vercel

| Setting | Value |
| --- | --- |
| Root Directory | `client` |
| Framework Preset | Next.js |

Environment: everything from `client/.env.example`, with `BASE_URL` set to the
deployed URL and `SERVER_URL` pointing at the Render service. Then add the
deployed URL to the Auth0 callback, logout and origin lists.

---

## Notes

- Sessions are encrypted cookies, not server state: restarts and extra
  instances sign nobody out.
- Refresh tokens are requested with `offline_access` and rotated. The provider
  generates, stores and revokes them; handling rotation is the only part that
  stays ours.
- `MapInboundClaims = false` keeps the `sub` claim named `sub`. ASP.NET Core
  otherwise rewrites inbound claims to legacy WS-Federation URIs, and the same
  identifier then looks different here than in every other service.
- Controllers return DTOs, never entities. Adding an internal column later
  should not silently publish it.
- Ownership always comes from the token, never from the request body. Job
  postings have no `UserId` field in their input type for exactly this reason.
- A posting belonging to someone else returns 404, not 403 — answering "it
  exists but is not yours" would confirm which ids are real.
