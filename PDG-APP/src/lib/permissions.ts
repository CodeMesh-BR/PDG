export type Role = "admin" | "supervisor" | "detailer" | "client" | string;

/** Routes a supervisor is allowed to open. Everything else is off-limits. */
const SUPERVISOR_PATHS = [
  "/",
  "/services-report",
  "/start-service",
  "/profile",
];

/** Routes a client is allowed to open: their own dashboard and report. */
const CLIENT_PATHS = [
  "/",
  "/client-report",
  "/profile",
];

export function getStoredRole(): Role {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem("role") || "").toLowerCase();
}

export function canAccessPath(path: string, role: Role | null): boolean {
  if (!role) return false;

  if (role === "admin") return true;

  if (role === "supervisor") {
    return SUPERVISOR_PATHS.some(
      (allowed) => path === allowed || (allowed !== "/" && path.startsWith(allowed)),
    );
  }

  if (role === "detailer") {
    return path.startsWith("/start-service") || path.startsWith("/profile");
  }

  if (role === "client") {
    return CLIENT_PATHS.some(
      (allowed) => path === allowed || (allowed !== "/" && path.startsWith(allowed)),
    );
  }

  return false;
}

/** Cost values (what we pay the detailer) are hidden from supervisors and clients. */
export function canSeeCosts(role: Role | null): boolean {
  return role !== "supervisor" && role !== "client";
}

/** Only the admin edits/deletes service entries created by other users. */
export function canManageAllServiceLogs(role: Role | null): boolean {
  return role === "admin";
}

/** Where to send a user that landed on a page they cannot access. */
export function fallbackPathFor(role: Role | null): string {
  if (role === "detailer") return "/start-service";
  if (role === "supervisor") return "/";
  if (role === "client") return "/";
  return "/unauthorized";
}
