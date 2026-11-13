export type Role =
  | "admin"
  | "supervisor"
  | "detailer"
  | "client"
  | "checkpoint_admin"
  | string;

/** Roles that only exist to read data from the companies linked to them. */
export const COMPANY_SCOPED_USER_ROLES = ["client", "checkpoint_admin"] as const;
export type CompanyScopedUserRole = (typeof COMPANY_SCOPED_USER_ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  detailer: "Detailer",
  client: "Client",
  checkpoint_admin: "Admin Checkpoint",
};

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

/** Routes an admin checkpoint may open: only the services report. */
const CHECKPOINT_PATHS = ["/services-report", "/profile"];

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

  if (role === "checkpoint_admin") {
    return CHECKPOINT_PATHS.some((allowed) => path.startsWith(allowed));
  }

  if (role === "client") {
    return CLIENT_PATHS.some(
      (allowed) => path === allowed || (allowed !== "/" && path.startsWith(allowed)),
    );
  }

  return false;
}

/** Cost values (what we pay the detailer) are hidden from supervisors, clients and checkpoints. */
export function canSeeCosts(role: Role | null): boolean {
  return role !== "supervisor" && role !== "client" && role !== "checkpoint_admin";
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
  if (role === "checkpoint_admin") return "/services-report";
  return "/unauthorized";
}
