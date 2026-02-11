"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useMailStore } from "@/lib/store";
import { useGmail } from "./use-gmail";

export function useMailActions() {
  const {
    setCurrentView,
    setComposeData,
    setCurrentEmail,
    setSearchResults,
    setInboxEmails,
    setInboxPageToken,
    setInboxQuery,
    setFilters,
    resetComposeData,
  } = useMailStore();

  const { fetchEmailDetail, searchEmails, sendEmail, fetchInbox } = useGmail();

  // Navigate to a specific view
  useCopilotAction({
    name: "navigateTo",
    description:
      "Navigate to a specific view in the mail app. Use this to switch between inbox, sent, compose, or detail views.",
    parameters: [
      {
        name: "view",
        type: "string",
        description: "The view to navigate to: inbox, sent, compose, detail",
        required: true,
      },
    ],
    handler: async ({ view }) => {
      const validViews = ["inbox", "sent", "compose", "detail", "search"];
      if (validViews.includes(view)) {
        setCurrentView(view as any);
        if (view === "compose") {
          resetComposeData();
        }
        if (view === "inbox") {
          await fetchInbox();
        }
      }
      return `Navigated to ${view} view`;
    },
  });

  // Fill the compose form with data
  useCopilotAction({
    name: "fillComposeForm",
    description:
      "Fill the compose email form with the provided data. This visibly fills in the To, Subject, and Body fields. Always use this before sending an email so the user can see what will be sent.",
    parameters: [
      {
        name: "to",
        type: "string",
        description: "Recipient email address",
        required: true,
      },
      {
        name: "subject",
        type: "string",
        description: "Email subject line",
        required: true,
      },
      {
        name: "body",
        type: "string",
        description: "Email body content",
        required: true,
      },
      {
        name: "inReplyTo",
        type: "string",
        description: "Message ID if this is a reply",
        required: false,
      },
      {
        name: "threadId",
        type: "string",
        description: "Thread ID if this is a reply",
        required: false,
      },
    ],
    handler: async ({ to, subject, body, inReplyTo, threadId }) => {
      setCurrentView("compose");
      // Small delay so the view switch renders first
      await new Promise((r) => setTimeout(r, 100));
      setComposeData({ to, subject, body, inReplyTo, threadId });
      return `Compose form filled with: To: ${to}, Subject: ${subject}. The user can review and send.`;
    },
  });

  // Reply to the currently open email — reads all context from store automatically
  useCopilotAction({
    name: "replyToEmail",
    description:
      "Draft a reply to the currently open email. This automatically reads the sender, subject, and thread info from the currently open email. You only need to provide the reply body text.",
    parameters: [
      {
        name: "body",
        type: "string",
        description: "The reply message body text you want to send",
        required: true,
      },
    ],
    handler: async ({ body }) => {
      const { currentEmail } = useMailStore.getState();
      if (!currentEmail) {
        return "No email is currently open. Open an email first, then reply.";
      }
      const replyTo = currentEmail.senderEmail || currentEmail.sender;
      const subject = currentEmail.subject?.startsWith("Re:")
        ? currentEmail.subject
        : `Re: ${currentEmail.subject}`;
      setCurrentView("compose");
      await new Promise((r) => setTimeout(r, 100));
      setComposeData({
        to: replyTo,
        subject,
        body,
        inReplyTo: currentEmail.id,
        threadId: currentEmail.threadId,
      });
      return `Reply draft created. To: ${replyTo}, Subject: ${subject}. The user can review and send.`;
    },
  });

  // Update the current draft body (rewrite, improve, expand, etc.)
  useCopilotAction({
    name: "updateDraft",
    description:
      "Update the body of the currently open compose form / draft. Use this when the user asks to rewrite, improve, expand, shorten, or change the draft message. This keeps the To, Subject, and reply metadata intact and only changes the body text.",
    parameters: [
      {
        name: "body",
        type: "string",
        description: "The new/updated email body text",
        required: true,
      },
    ],
    handler: async ({ body }) => {
      setComposeData({ body });
      return `Draft updated with new body.`;
    },
  });

  // Open a specific email by searching the current inbox list
  useCopilotAction({
    name: "openEmail",
    description:
      "Open an email by searching the current inbox list. Pass a search term like the sender name, subject keyword, or part of the email description. The tool will find the best matching email and open it.",
    parameters: [
      {
        name: "searchTerm",
        type: "string",
        description: "A keyword to match against sender name, sender email, or subject line (e.g. 'uber', 'security alert', 'wint wealth')",
        required: true,
      },
    ],
    handler: async ({ searchTerm }) => {
      console.log("[openEmail] called with searchTerm:", searchTerm);
      const { inboxEmails, searchResults } = useMailStore.getState();
      const allEmails = inboxEmails.length > 0 ? inboxEmails : searchResults;
      const term = (searchTerm || "").toLowerCase();
      console.log("[openEmail] searching", allEmails.length, "emails for term:", term);

      // Find the best match
      const match = allEmails.find(
        (e) =>
          e.sender.toLowerCase().includes(term) ||
          e.senderEmail.toLowerCase().includes(term) ||
          e.subject.toLowerCase().includes(term)
      );

      if (!match) {
        console.log("[openEmail] no match found");
        return `No email found matching "${searchTerm}" in the current inbox list. Try a different search term.`;
      }

      console.log("[openEmail] matched:", match.id, match.sender, match.subject);
      const email = await fetchEmailDetail(match.id);
      if (email) {
        const bodyPreview = (email.body || "").substring(0, 1000);
        return `Opened email: "${email.subject}" from ${email.sender} <${email.senderEmail}>\nDate: ${email.date}\nTo: ${email.to}\n\nBody:\n${bodyPreview}`;
      }
      return `Found a match but failed to load the email detail.`;
    },
  });

  // Display search results in the main UI
  useCopilotAction({
    name: "displaySearchResults",
    description:
      "Display email search results in the main UI. Use this after searching for emails to show the results to the user in the mail interface (not just in the chat).",
    parameters: [
      {
        name: "emails",
        type: "object[]",
        description: "Array of email objects to display",
        required: true,
        attributes: [
          { name: "id", type: "string", description: "Email ID", required: true },
          { name: "threadId", type: "string", description: "Thread ID", required: true },
          { name: "sender", type: "string", description: "Sender name", required: true },
          { name: "senderEmail", type: "string", description: "Sender email", required: true },
          { name: "subject", type: "string", description: "Subject", required: true },
          { name: "snippet", type: "string", description: "Preview text", required: true },
          { name: "date", type: "string", description: "Date string", required: true },
          { name: "isRead", type: "boolean", description: "Read status", required: true },
        ],
      },
    ],
    handler: async ({ emails }) => {
      setSearchResults(
        emails.map((e: any) => ({ ...e, labels: e.labels || [] }))
      );
      setCurrentView("search");
      return `Displaying ${emails.length} search results in the mail UI`;
    },
  });

  // Set inbox filters
  useCopilotAction({
    name: "setFilters",
    description:
      "Apply filters to the inbox view. Use this when the user asks to filter emails by sender, date, keywords, or read/unread status. After setting filters, search for matching emails and display them.",
    parameters: [
      {
        name: "sender",
        type: "string",
        description: "Filter by sender email or name",
        required: false,
      },
      {
        name: "dateFrom",
        type: "string",
        description: "Filter emails from this date (YYYY-MM-DD)",
        required: false,
      },
      {
        name: "dateTo",
        type: "string",
        description: "Filter emails until this date (YYYY-MM-DD)",
        required: false,
      },
      {
        name: "keyword",
        type: "string",
        description: "Filter by keyword in subject or body",
        required: false,
      },
      {
        name: "unreadOnly",
        type: "boolean",
        description: "Show only unread emails",
        required: false,
      },
    ],
    handler: async ({ sender, dateFrom, dateTo, keyword, unreadOnly }) => {
      const filters = { sender, dateFrom, dateTo, keyword, unreadOnly };
      setFilters(filters);

      // Build Gmail search query from filters
      // Gmail after: is INCLUSIVE, before: is EXCLUSIVE
      // Dates must use YYYY/MM/DD format (dashes are ignored by Gmail)
      const toGmailDate = (d: string) => d.replace(/-/g, "/");
      const nextDay = (d: string) => {
        const dt = new Date(d + "T00:00:00");
        dt.setDate(dt.getDate() + 1);
        return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}`;
      };
      const queryParts: string[] = ["in:inbox"];
      if (sender) queryParts.push(`from:${sender}`);
      if (keyword) queryParts.push(keyword);
      if (unreadOnly) queryParts.push("is:unread");
      if (dateFrom) queryParts.push(`after:${toGmailDate(dateFrom)}`);
      if (dateTo) queryParts.push(`before:${nextDay(dateTo)}`);

      const query = queryParts.join(" ");
      try {
        const res = await fetch(
          `/api/gmail/messages?q=${encodeURIComponent(query)}&maxResults=100`
        );
        if (!res.ok) throw new Error("Failed to filter emails");
        const data = await res.json();
        const results = data.messages || [];
        // Update inbox emails with filtered results and stay in inbox view
        setInboxEmails(results);
        setInboxPageToken(data.nextPageToken); // Keep page token for filtered pagination
        setInboxQuery(query); // Store query so Load More continues within same filter
        setCurrentView("inbox");
        const preview = results.slice(0, 5).map((e: any) => (
          `- ${e.sender}: "${e.subject}"`
        )).join("\n");
        return `Found ${results.length} emails. Inbox updated. Top results:\n${preview}\n\nTo open one, call openEmail with a search term like the sender name or subject keyword.`;
      } catch (error) {
        console.error("Failed to filter emails:", error);
        return "Failed to apply filters";
      }
    },
  });

  // Send the currently composed email
  useCopilotAction({
    name: "sendEmail",
    description:
      "Send the currently composed email. Only call this AFTER the user has confirmed they want to send.",
    parameters: [],
    handler: async () => {
      const { composeData } = useMailStore.getState();
      if (!composeData.to || !composeData.subject) {
        return "No email draft found. Use fillComposeForm first.";
      }
      try {
        await sendEmail({
          to: composeData.to,
          subject: composeData.subject,
          body: composeData.body || "",
          inReplyTo: composeData.inReplyTo,
          threadId: composeData.threadId,
        });
        resetComposeData();
        setCurrentView("inbox");
        await fetchInbox();
        return "Email sent successfully!";
      } catch (error: any) {
        return `Failed to send email: ${error.message}`;
      }
    },
  });
}
