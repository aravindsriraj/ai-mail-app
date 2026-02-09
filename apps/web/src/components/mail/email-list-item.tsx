"use client";

import { cn, formatDate, truncate } from "@/lib/utils";
import type { EmailSummary } from "@/types/email";

interface EmailListItemProps {
  email: EmailSummary;
  isSelected?: boolean;
  onClick: () => void;
}

export function EmailListItem({ email, isSelected, onClick }: EmailListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 border-b border-zinc-800/50 transition-colors",
        "hover:bg-zinc-800/50",
        isSelected && "bg-zinc-800",
        !email.isRead && "bg-zinc-900/50"
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span
          className={cn(
            "text-sm truncate",
            !email.isRead ? "font-semibold text-white" : "text-zinc-300"
          )}
        >
          {email.sender}
        </span>
        <span className="text-xs text-zinc-500 whitespace-nowrap flex-shrink-0">
          {formatDate(email.date)}
        </span>
      </div>
      <p
        className={cn(
          "text-sm truncate",
          !email.isRead ? "font-medium text-zinc-200" : "text-zinc-400"
        )}
      >
        {email.subject}
      </p>
      <p className="text-xs text-zinc-500 truncate mt-0.5">
        {truncate(email.snippet, 80)}
      </p>
      {!email.isRead && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
      )}
    </button>
  );
}
