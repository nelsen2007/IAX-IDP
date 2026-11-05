import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { z } from "zod";
import { fileURLToPath } from "node:url";
import { createAdminService, AuthError } from "./admin/service.mjs";

export function createApp({ pool, config }) {
  const app = express(),
    service = createAdminService(pool, config);
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy?.length ? config.trustProxy : false);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "https://fonts.googleapis.com"],
          styleSrcAttr: ["'unsafe-inline'"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: config.production ? [] : null,
        },
      },
      strictTransportSecurity: config.production
        ? { maxAge: 31536000, includeSubDomains: true }
        : false,
      referrerPolicy: { policy: "no-referrer" },
    }),
  );
  if (config.production)
    app.use((req, res, next) => {
      if (!req.secure)
        return res.redirect(
          308,
          new URL(req.originalUrl, config.origin).href.replace(
            /^https?:\/\/[^/]+/,
            config.origin,
          ),
        );
      next();
    });
  app.use(["/admin", "/api/admin"], (_req, res, next) => {
    res.set({
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    });
    next();
  });
  app.use(cookieParser());
  app.use(express.json({ limit: "8kb", strict: true }));
  const cookieOptions = {
    httpOnly: true,
    secure: config.production,
    sameSite: "strict",
    path: "/",
  };
  const sessionName = config.production
    ? "__Host-iax_admin_session"
    : "iax_admin_session_dev";
  const preauthName = config.production
    ? "__Host-iax_admin_preauth"
    : "iax_admin_preauth_dev";
  const clearSession = (res) => res.clearCookie(sessionName, cookieOptions);
  const readCsrf = (req) => req.get("X-CSRF-Token") || "";
  const originCheck = (req, _res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.get("Origin") !== config.origin
    )
      throw new AuthError(403, "Origin tidak diizinkan.");
    if (req.get("Sec-Fetch-Site") === "cross-site")
      throw new AuthError(403, "Origin tidak diizinkan.");
    next();
  };
  const validate = (schema) => (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success)
      throw new AuthError(400, "Input tidak valid. Periksa formulir.");
    req.body = result.data;
    next();
  };
  const password = z.string().min(1).max(1024);
  const factor = z.string().regex(/^(?:\d{6}|[a-f0-9]{32})$/);
  const loginSchema = z
    .object({ username: z.string().min(1).max(128), password })
    .strict();
  const verifySchema = z.object({ code: factor }).strict();
  const reauth = z.object({ oldPassword: password, code: factor }).strict();
  const change = z
    .object({
      oldPassword: password,
      newPassword: z.string().min(15).max(1024),
      code: factor,
    })
    .strict();
  const requireAdminAuth = async (req, res, next) => {
    try {
      req.admin = await service.session(req.cookies[sessionName]);
      next();
    } catch (e) {
      if (e.status === 401) clearSession(res);
      throw e;
    }
  };
  const requireCsrfProtection = (req, _res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      readCsrf(req) !== req.admin.csrf
    )
      throw new AuthError(403, "Permintaan tidak valid. Muat ulang halaman.");
    next();
  };
  const api = express.Router();
  api.use(originCheck);
  api.get("/auth/csrf", async (req, res) => {
    const b = await service.bootstrap(req.ip);
    res
      .cookie(preauthName, b.token, { ...cookieOptions, maxAge: 5 * 60 * 1000 })
      .json({ csrf: b.csrf });
  });
  api.post("/auth/login", validate(loginSchema), async (req, res) => {
    const p = await service.login({
      ...req.body,
      token: req.cookies[preauthName],
      csrf: readCsrf(req),
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    res
      .cookie(preauthName, p.token, { ...cookieOptions, maxAge: 5 * 60 * 1000 })
      .json({ csrf: p.csrf, mfaRequired: true });
  });
  api.post("/auth/mfa/verify", validate(verifySchema), async (req, res) => {
    const s = await service.verify({
      ...req.body,
      token: req.cookies[preauthName],
      csrf: readCsrf(req),
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    res
      .clearCookie(preauthName, cookieOptions)
      .cookie(sessionName, s.token, {
        ...cookieOptions,
        maxAge: 8 * 60 * 60 * 1000,
      })
      .json({ csrf: s.csrf, user: s.user });
  });
  api.use(requireAdminAuth, requireCsrfProtection);
  api.get("/auth/me", (req, res) => res.json(req.admin));
  api.post(
    "/auth/logout",
    validate(z.object({}).strict()),
    async (req, res) => {
      await service.logout(req.cookies[sessionName], readCsrf(req), req.ip);
      clearSession(res);
      res.json({ ok: true });
    },
  );
  api.post("/auth/logout-all", validate(reauth), async (req, res) => {
    await service.revokeAll(
      req.cookies[sessionName],
      readCsrf(req),
      req.body,
      req.ip,
    );
    clearSession(res);
    res.json({ ok: true });
  });
  api.post("/auth/change-password", validate(change), async (req, res) => {
    await service.changePassword(
      req.cookies[sessionName],
      readCsrf(req),
      req.body,
      req.ip,
    );
    clearSession(res);
    res.json({ ok: true });
  });
  api.use((_req, _res) => {
    throw new AuthError(404, "Endpoint tidak tersedia.");
  });
  app.use("/api/admin", api);
  app.use("/api", (_req, res) =>
    res.status(404).json({ message: "Endpoint tidak tersedia." }),
  );
  // Only dist is served. Repository files and source maps never enter SPA fallback.
  app.use((req, res, next) => {
    if (
      req.path.split("/").some((s) => s.startsWith(".")) ||
      /\.(?:map|sql|mjs|tsx?|json|bak|env)$/i.test(req.path)
    )
      return res.status(404).end();
    next();
  });
  app.use("/admin", async (req, res, next) => {
    if (req.path === "/login" || req.path === "/login/") return next();
    try {
      await service.session(req.cookies[sessionName]);
      next();
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        clearSession(res);
        return res.redirect("/admin/login");
      }
      throw e;
    }
  });
  const dist = fileURLToPath(new URL("../dist/", import.meta.url));
  app.use(
    express.static(dist, { index: false, dotfiles: "deny", redirect: false }),
  );
  app.get("/{*path}", (req, res) => {
    if (req.path.includes(".") || req.path.startsWith("/assets/"))
      return res.status(404).end();
    res.sendFile("index.html", { root: dist });
  });
  app.use((error, _req, res, _next) => {
    const status =
      error instanceof AuthError
        ? error.status
        : error.type === "entity.too.large"
          ? 413
          : error.type === "entity.parse.failed"
            ? 400
            : 500;
    if (error.retryAfter) res.set("Retry-After", String(error.retryAfter));
    // Never serialize error objects, SQL, request bodies, credentials or tokens.
    if (status === 500) console.error("admin_request_failed");
    res
      .status(status)
      .set("Cache-Control", "no-store")
      .json({
        message:
          status === 500
            ? "Layanan sementara tidak tersedia."
            : error instanceof AuthError
              ? error.message
              : "Permintaan tidak valid.",
      });
  });
  return app;
}
