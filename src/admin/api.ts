export type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  role: "ADMIN" | "CASHIER" | "SALES";
  mfaEnabled: boolean;
  lastLoginAt: string | null;
};
export type AdminSession = {
  user: AdminUser;
  csrf: string;
  expiresAt: string;
  idleTimeoutMinutes: number;
};
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function adminApi<T>(
  path: string,
  options: { body?: unknown; csrf?: string } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(
      path.startsWith("staff") ? "/api/admin/" + path : "/api/admin/auth/" + path,
      {
      method: options.body === undefined ? "GET" : "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        ...(options.body === undefined
          ? {}
          : { "Content-Type": "application/json" }),
        ...(options.csrf ? { "X-CSRF-Token": options.csrf } : {}),
      },
        ...(options.body === undefined
          ? {}
          : { body: JSON.stringify(options.body) }),
      },
    );
  } catch {
    throw new ApiError(
      0,
      "Backend tidak dapat dihubungi. Periksa koneksi dan coba kembali.",
    );
  }
  const result = await response
    .json()
    .catch(() => ({ message: "Backend tidak dapat dihubungi." }));
  if (!response.ok)
    throw new ApiError(response.status, result.message || "Permintaan gagal.");
  return result;
}
