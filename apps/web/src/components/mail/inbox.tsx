"use client";

import { useEffect, useRef } from "react";
import { useMailStore } from "@/lib/store";
import { useGmail } from "@/hooks/use-gmail";
import { EmailList } from "./email-list";
import { Filters } from "./filters";

export function Inbox() {
  const { inboxEmails, inboxPageToken, filters, refreshTrigger } = useMailStore();
  const { fetchInbox, loadMoreInbox } = useGmail();
  const initialLoadDone = useRef(false);

  const hasActiveFilters =
    filters.sender || filters.dateFrom || filters.dateTo || filters.keyword || filters.unreadOnly;

  useEffect(() => {
    // Only fetch on initial mount, not on every refresh trigger
    // (refresh triggers from SSE would wipe out load-more emails)
    if (!initialLoadDone.current) {
      fetchInbox();
      initialLoadDone.current = true;
    }
  }, [fetchInbox]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Filters />
      <EmailList
        emails={inboxEmails}
        title="Inbox"
        emptyMessage={
          hasActiveFilters
            ? "No emails match your filters"
            : "Your inbox is empty"
        }
        onLoadMore={loadMoreInbox}
        hasMore={!!inboxPageToken}
      />
    </div>
  );
}
