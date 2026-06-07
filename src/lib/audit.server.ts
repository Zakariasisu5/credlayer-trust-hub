// Server-only audit log writer. Never throws — failures shouldn't break the
// caller's primary action. Use logActivity() from server functions to record
// permission changes, credential lifecycle events, verifications, etc.
import { getAdminClient } from "./credlayer.server";

export type ActivityStatus = "success" | "failed" | "denied";

export async function logActivity(input: {
  wallet: string;
  action: string;
  status?: ActivityStatus;
  message?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = getAdminClient();
    await supabase.from("agent_activity_log").insert({
      wallet_address: input.wallet,
      action: input.action,
      status: input.status ?? "success",
      message: input.message ?? "",
      details: (input.details ?? {}) as never,
    });
  } catch (e) {
    console.error("[audit] failed to write activity log:", e);
  }
}
