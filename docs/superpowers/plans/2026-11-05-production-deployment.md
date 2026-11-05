# Production deployment plan

**Goal:** Publish the existing backend privately on GitHub and deploy to the existing Vercel project, preserving data and API contracts.

**Architecture:** Keep App Router handlers, services, repositories, Drizzle migrations, Neon database, and existing Blob store. Change only deployment and security blockers.

**Constraints:** Never seed, reset, migrate, or mutate production data for verification. Keep five-hour Admin JWTs and the accessToken response. Never publish secrets or local OIDC tokens.

- [x] Inspect Git, routes, audit fields, authentication, environment metadata, and local Next.js deployment guides. Baseline build and lint pass.
- [x] Correct Linux Drizzle schema path and redact exception logs; verify build and lint. Pin Blob tooling to the existing patched Zod dependency; production audit has zero high/critical findings.
- [x] Scan working files and every existing Git revision for credentials before staging; review staged inventory.
- [ ] Reuse or create private AmrAbdulfattah/library-system-nextjs; push main without force.
- [ ] Securely configure existing Production secrets; verify existing Blob connection and OIDC. Connect repository and deploy existing project.
- [ ] Verify public reads, login, Swagger assets/spec, unauthenticated rejection, and authenticated validation failures without changing data.
- [ ] Report actual URLs, checks, and remaining risks.

Execution: continue inline as explicitly requested. Current backend is uncommitted work in the provided folder, so preserve and review it in place.
