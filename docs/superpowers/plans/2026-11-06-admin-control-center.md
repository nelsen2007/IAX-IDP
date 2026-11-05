# Admin Control Center Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver authenticated admin operations with clearly marked business previews.
**Architecture:** Same-origin Express + React/Vite with persistent MySQL sessions and independent admin identities.
**Tech Stack:** React, TypeScript, Express, MySQL, Argon2id, otplib, Zod, Playwright, node:test.
**Spec:** docs/admin-control-center-design.md (approved).

## Global Constraints

- No HTTP admin provisioning, default accounts, or MFA bypass.
- Idle timeout 30 minutes; absolute timeout 8 hours.
- Password minimum 15 characters; encrypted TOTP; one-use hashed recovery codes.
- Existing public frontend retained; business features are DEMO DATA.
- No deployment; no secrets in VITE variables or logs.

## Review Focus

- Parallel MFA requests may issue only one session.
- Disable/reset racing MFA must invalidate the challenge.
- Stale browser state must never authorize an API request.
- Production static fallback must not expose repository files.
- Database failures must fail closed without leaking internals.

### Task 1: Persistent security foundation

Files: database/migrations/003_admin_schema.sql, server/config.mjs, server/db.mjs, server/admin/crypto.mjs, server/admin/service.mjs, scripts/admin.mjs, tests/server/security.test.mjs.
Interfaces: createAdminService(pool, config) exposes bootstrap/login/verify/session/logout/changePassword/revokeAll/provision/manage; crypto exports hashPassword, verifyPassword, encryptSecret, decryptSecret, verifyTotp, tokenHash.
- [x] Write failing node tests for crypto, sessions, MFA replay/concurrency, provisioning and revocation.
- [x] Run node --test tests/server/*.test.mjs and confirm expected RED.
- [x] Implement migration, service transactions, CLI, persistent throttle, audit and retention.
- [x] Run unit/integration tests against isolated MySQL database; confirm GREEN.

### Task 2: HTTP boundary and hardening

Files: server/app.mjs, server/index.mjs, tests/server/http.test.mjs, vite.config.ts, package.json, eslint.config.js.
Interfaces: createApp({pool, config}) returns Express app; /api/admin/auth/{csrf,login,mfa/verify,me,logout,logout-all,change-password}; all other namespace routes deny by default.
- [x] Write failing tests for authentication, Origin/CSRF, role isolation, cookie attributes, headers, secret files and production redirects.
- [x] Run HTTP tests and confirm RED.
- [x] Implement schema validation, middleware, same-origin policy, static serving and fail-closed error handling.
- [x] Run complete server suite and build.

### Task 3: Integrated admin UI

Files: src/admin/*, src/App.tsx, src/components/ui.tsx, tests/admin.spec.ts, tests/prototype.spec.ts, playwright.config.ts.
Interfaces: AdminApp owns /admin/*, fetch uses HttpOnly cookies and in-memory CSRF only; authenticated profile comes from me.
- [x] Write browser tests for guest redirects/no public admin links and real password+MFA navigation.
- [x] Confirm RED against current UI.
- [x] Implement login, protected layout, five routes, filters/drawers/print preview/charts and real account controls.
- [x] Confirm browser tests at mobile/desktop; inspect screenshots.

### Task 4: Release verification and operator documentation

Files: docs/admin-security.md, .env.admin.example, README.md, docs/admin-implementation-progress.md.
- [x] Run lint, typecheck/build, unit/integration/security/browser suites, dependency audit and 21st review.
- [x] Review complete diff and resolve security issues with regression tests.
- [x] Record actual results, configuration, CLI provisioning, recovery/retention and operational limitations.

Execution choice: implement inline in this session; existing design approval authorizes implementation without another approval gate. Work remains in feature branch feat/admin-control-center in the shared project folder.
