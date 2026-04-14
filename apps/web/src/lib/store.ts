export type ApprovalRequest = {
  requestId: string;
  deviceId: string;
  title: string;
  details1: string;
  details2: string;
  userOpHash: string; // 0x + 32 bytes
  status: "pending" | "approved" | "denied";
  deviceSignature?: string;
  storageRootHash?: string;
  createdAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __0gargosStore: Map<string, ApprovalRequest> | undefined;
}

export function getStore(): Map<string, ApprovalRequest> {
  if (!globalThis.__0gargosStore) globalThis.__0gargosStore = new Map();
  return globalThis.__0gargosStore;
}

export function createId(prefix = "req"): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

