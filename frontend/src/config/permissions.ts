/**
 * Grantable permissions for the security admin dashboard.
 * - Client permissions: granted to clients so they can access server APIs.
 * - Server permissions: granted to servers so they can call other servers.
 *
 * Format matches policy.service: "action:resource" (e.g. read:farmer, write:farmer).
 */

export type RecipientType = "client" | "server";

export interface PermissionOption {
  value: string;
  label: string;
  description?: string;
}

/** Permissions we can grant to clients (access to servers). */
export const CLIENT_PERMISSIONS: PermissionOption[] = [
  { value: "read:farmer", label: "Farmer (read)", description: "GET /api/farmer/..." },
  { value: "write:farmer", label: "Farmer (write)", description: "POST/PUT/PATCH /api/farmer/..." },
  { value: "read:data", label: "Data (read)", description: "Read data APIs" },
  { value: "write:data", label: "Data (write)", description: "Write data APIs" },
  { value: "read:*", label: "All (read)", description: "Read access to all resources" },
  { value: "write:*", label: "All (write)", description: "Write access to all resources" },
];

/** Permissions we can grant to servers (access to other servers). */
export const SERVER_PERMISSIONS: PermissionOption[] = [
  { value: "read:farmer", label: "Farmer server (read)", description: "Call GET farmer APIs" },
  { value: "write:farmer", label: "Farmer server (write)", description: "Call POST/PUT farmer APIs" },
  { value: "read:data", label: "Data server (read)", description: "Call read data APIs" },
  { value: "write:data", label: "Data server (write)", description: "Call write data APIs" },
  { value: "read:*", label: "All servers (read)", description: "Read access to all servers" },
  { value: "write:*", label: "All servers (write)", description: "Write access to all servers" },
];

/** All permission values for clients (flat list for validation/display). */
export const ALL_CLIENT_PERMISSION_VALUES = CLIENT_PERMISSIONS.map((p) => p.value);

/** All permission values for servers (flat list). */
export const ALL_SERVER_PERMISSION_VALUES = SERVER_PERMISSIONS.map((p) => p.value);

export function getPermissionsForRecipient(type: RecipientType): PermissionOption[] {
  return type === "client" ? CLIENT_PERMISSIONS : SERVER_PERMISSIONS;
}

export function getPermissionValuesForRecipient(type: RecipientType): string[] {
  return type === "client" ? ALL_CLIENT_PERMISSION_VALUES : ALL_SERVER_PERMISSION_VALUES;
}
