"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Small "Copy" button for links. Falls back to a prompt when the clipboard API is unavailable. */
export function CopyButton({ text, label = "Copy", size = "sm" }: { text: string; label?: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { window.prompt("Copy this link", text); }
  };
  return (
    <Button type="button" size={size} variant="secondary" onClick={copy} aria-label={label}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : label}
    </Button>
  );
}

/** Invitation link box: code + copy. */
export function InviteLink({ url, emailed, note }: { url: string; emailed: boolean; note?: string }) {
  return (
    <div className="rounded-md bg-success-soft border border-success/30 p-2.5 text-[12.5px]">
      <div className="text-text-2">{note ?? (emailed ? "An invitation email was sent. You can also share this link:" : "Share this invitation link (email sending is not configured):")}</div>
      <div className="flex items-center gap-2 mt-1">
        <code className="flex-1 truncate text-[11.5px] bg-surface rounded px-2 py-1 border border-border">{url}</code>
        <CopyButton text={url} />
      </div>
    </div>
  );
}
