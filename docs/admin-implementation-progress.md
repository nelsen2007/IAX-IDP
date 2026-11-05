# Implementation ledger — admin control center

Approved spec: docs/admin-control-center-design.md.
Plan: docs/superpowers/plans/2026-11-06-admin-control-center.md.
Branch: feat/admin-control-center.

Preflight: Task 1 service feeds Task 2 HTTP boundary; Task 2 auth JSON feeds Task 3 UI; same-origin cookie/CSRF contracts shared. No conflicting interfaces found.
Ruling: use the existing shared checkout on a new feature branch to keep changes available in the user's workspace; no worktree or additional approval required for the authorized reversible implementation.
Ruling: execute inline; design is approved and no further product decisions are open.

Task 1: complete — migration003 applied locally; separate admin users/sessions/challenges/recovery/audit/rate store; developer-only lifecycle CLI. Security test suite uses isolated temporary MySQL schemas.
Task 2: complete — same-origin API, validation, Origin/CSRF, persisted rate limits, auth middleware, no-store/security headers, production dist serving and HTTPS/proxy policy.
Task 3: complete — login/MFA, protected lazy admin app, five menus, dashboard, filters, drawers, report charts, SPK print example, real account controls, responsive layout. No default admin created.
Task 4: complete — operator documentation, automated validation, screenshot inspection, independent security review.

Final review: independent read-only review by admin_security_review. Two concrete findings resolved:
- Fixed runtime SQL timezone mismatch: new regression observed SYSTEM instead of +00:00 (RED); pool initializes UTC for every connection (GREEN).
- Fixed username-only 15-minute quota DoS: new regression rejected valid login after capped cooldown (RED); shared account backoff now caps at 30 seconds without hard account lockout (GREEN). Source quotas retained.
- Added concurrent password-reset/MFA test after reviewer identified coverage gap; both disable and password-reset races prove no session remains authorized.

Final validation on 6 November 2026:
- npm run lint: PASS, including frontend/backend/CLI and all tests.
- npm run typecheck: PASS.
- npm run build: PASS; admin JS/CSS separate lazy chunks, no source maps.
- npm run test:security: 29/29 PASS, real MySQL with separate random test databases.
- npm test: 15/15 PASS in final repeat (34.1s), including admin page no-store regression.
- npm run db:setup: PASS, migration003 applied, earlier migrations unchanged.
- npm run db:check: PASS after updating expected schema table count 15→22; original public-data integrity/rollback checks retained.
- npm audit: 0 vulnerabilities. minimatch override11 resolves lint-tooling advisory; lint and tests verified against override.
- 21st search/get used as layout reference; existing project primitives preserved. 21st review: 263 findings, all info except one autofocus warning; no automated fixes applied. Explicit focus on the MFA step is intentional after submitting the password; colors follow approved admin/status palette. Token consolidation remains optional polish.
- Visual inspection: admin desktop/mobile, secure login, and SPK print-mode screenshot reviewed. SPK print mode hides admin chrome and retains example watermark.
- Found and fixed Vite overwriting admin page Cache-Control with no-cache. Browser regression observed no-cache (RED); development middleware now preserves no-store through Vite HTML response processing. Production Express headers were already no-store.

Deferred minors: consolidate repeated CSS colors into shared tokens to reduce informational 21st review findings; no functional/security behavior depends on that cleanup.
Ruling: permit style-src-attr unsafe-inline for existing public Framer Motion and React chart styles; inline scripts remain forbidden. Cost if wrong: a future untrusted style injection would have less CSP containment; React escaping and no raw HTML remain mandatory.
Ruling: no external breached-password provider configured; local common-password denylist only. Cost if wrong: a rare breached passphrase can be provisioned; MFA, rate limits, operator policy and a future vetted breach-check integration are required defenses.
Ruling: retain branch and local changes for user review; do not merge, push, or deploy. Operational dependencies (TLS/private DB/least-privilege grants/retention scheduler/monitoring/key backup) remain explicit in docs/admin-security.md.

Local handoff smoke: existing Vite on5173 + backend on127.0.0.1:3001. `/admin/login` returns200 with Cache-Control:no-store and X-Robots-Tag:noindex,nofollow; unauthenticated `/api/admin/auth/me` returns401. No developer account was provisioned by implementation or server startup.
