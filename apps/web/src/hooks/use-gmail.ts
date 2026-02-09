"use client";

import { useCallback } from "react";
import { useMailStore } from "@/lib/store";
import type { EmailSummary, EmailDetail } from "@/types/email";

export function useGmail() {
  const {
    setInboxEmails,
    appendInboxEmails,
    setInboxPageToken,
    inboxPageToken,
    setInboxQuery,
    inboxQuery,
    setSentEmails,
    appendSentEmails,
    setSentPageToken,
    sentPageToken,
    setSearchResults,
    setCurrentEmail,
    setIsLoading,
    setCurrentView,
  } = useMailStore();

  const fetchInbox = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/gmail/messages?label=INBOX&maxResults=100");
      if (!res.ok) throw new Error("Failed to fetch inbox");
      const data = await res.json();
      setInboxEmails(data.messages || []);
      setInboxPageToken(data.nextPageToken);
      setInboxQuery(undefined); // Clear any active filter query
    } catch (error) {
      console.error("Failed to fetch inbox:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setInboxEmails, setInboxPageToken, setInboxQuery, setIsLoading]);

  const loadMoreInbox = useCallback(async () => {
    if (!inboxPageToken) return;
    setIsLoading(true);
    try {
      // Use the active filter query if set, otherwise default inbox
      const baseUrl = inboxQuery
        ? `/api/gmail/messages?q=${encodeURIComponent(inboxQuery)}&maxResults=100`
        : `/api/gmail/messages?label=INBOX&maxResults=100`;
      const res = await fetch(`${baseUrl}&pageToken=${inboxPageToken}`);
      if (!res.ok) throw new Error("Failed to load more");
      const data = await res.json();
      appendInboxEmails(data.messages || []);
      setInboxPageToken(data.nextPageToken);
    } catch (error) {
      console.error("Failed to load more inbox:", error);
    } finally {
      setIsLoading(false);
    }
  }, [inboxPageToken, inboxQuery, appendInboxEmails, setInboxPageToken, setIsLoading]);

  const fetchSent = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/gmail/messages?label=SENT&maxResults=100");
      if (!res.ok) throw new Error("Failed to fetch sent");
      const data = await res.json();
      setSentEmails(data.messages || []);
      setSentPageToken(data.nextPageToken);
    } catch (error) {
      console.error("Failed to fetch sent:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setSentEmails, setSentPageToken, setIsLoading]);

  const loadMoreSent = useCallback(async () => {
    if (!sentPageToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/gmail/messages?label=SENT&maxResults=100&pageToken=${sentPageToken}`
      );
      if (!res.ok) throw new Error("Failed to load more");
      const data = await res.json();
      appendSentEmails(data.messages || []);
      setSentPageToken(data.nextPageToken);
    } catch (error) {
      console.error("Failed to load more sent:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sentPageToken, appendSentEmails, setSentPageToken, setIsLoading]);

  const searchEmails = useCallback(
    async (query: string): Promise<EmailSummary[]> => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/gmail/messages?q=${encodeURIComponent(query)}&maxResults=100`
        );
        if (!res.ok) throw new Error("Failed to search emails");
        const data = await res.json();
        const results = data.messages || [];
        setSearchResults(results);
        setCurrentView("search");
        return results;
      } catch (error) {
        console.error("Failed to search emails:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [setSearchResults, setCurrentView, setIsLoading]
  );

  const fetchEmailDetail = useCallback(
    async (emailId: string): Promise<EmailDetail | null> => {
      if (!emailId) return null;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/gmail/messages/${emailId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error("Email detail error:", errData.error || res.statusText);
          return null;
        }
        const data = await res.json();
        setCurrentEmail(data);
        setCurrentView("detail");
        return data;
      } catch (error) {
        console.error("Failed to fetch email detail:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [setCurrentEmail, setCurrentView, setIsLoading]
  );

  const sendEmail = useCallback(
    async (options: {
      to: string;
      subject: string;
      body: string;
      inReplyTo?: string;
      threadId?: string;
    }) => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/gmail/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(options),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to send email");
        }
        return await res.json();
      } catch (error) {
        console.error("Failed to send email:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading]
  );

  return {
    fetchInbox,
    loadMoreInbox,
    fetchSent,
    loadMoreSent,
    searchEmails,
    fetchEmailDetail,
    sendEmail,
  };
}
