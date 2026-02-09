"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useMailStore } from "@/lib/store";

export function useMailContext() {
  const { currentView, currentEmail, filters, composeData, inboxEmails } = useMailStore();

  useCopilotReadable({
    description: "The current view the user is looking at in the mail app",
    value: currentView,
  });

  useCopilotReadable({
    description:
      "The currently open email the user is reading. Null if no email is open. Use this for context when user says 'reply to this' or 'forward this'.",
    value: currentEmail
      ? {
          id: currentEmail.id,
          threadId: currentEmail.threadId,
          sender: currentEmail.sender,
          senderEmail: currentEmail.senderEmail,
          to: currentEmail.to,
          subject: currentEmail.subject,
          body: currentEmail.body?.substring(0, 500),
          date: currentEmail.date,
        }
      : null,
  });

  useCopilotReadable({
    description: "Currently active email filters",
    value: filters,
  });

  useCopilotReadable({
    description: "Current compose form data",
    value: composeData,
  });

  useCopilotReadable({
    description:
      "The emails currently visible in the inbox list. Use the 'id' field when calling openEmail. These are REAL Gmail message IDs.",
    value: inboxEmails.slice(0, 20).map((e) => ({
      id: e.id,
      sender: e.sender,
      senderEmail: e.senderEmail,
      subject: e.subject,
      date: e.date,
      isRead: e.isRead,
    })),
  });
}
