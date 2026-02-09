"use client";

import { useEffect } from "react";
import { useMailStore } from "@/lib/store";
import { useGmail } from "@/hooks/use-gmail";
import { EmailList } from "./email-list";

export function Sent() {
  const { sentEmails, sentPageToken } = useMailStore();
  const { fetchSent, loadMoreSent } = useGmail();

  useEffect(() => {
    fetchSent();
  }, [fetchSent]);

  return (
    <EmailList
      emails={sentEmails}
      title="Sent"
      emptyMessage="No sent emails"
      onLoadMore={loadMoreSent}
      hasMore={!!sentPageToken}
    />
  );
}
