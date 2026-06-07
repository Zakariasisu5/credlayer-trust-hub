// Safe clipboard copy that falls back when navigator.clipboard is blocked
// (CSP, insecure context, iframe sandbox, permissions denied).
import { toast } from "sonner";

export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern API (requires secure context + clipboard-write permission)
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function" &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy
  }

  // Legacy fallback using a hidden textarea
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) return true;
  } catch {
    // ignore
  }

  toast.error("Copy blocked by your browser", {
    description: "Please copy the value manually.",
  });
  return false;
}
