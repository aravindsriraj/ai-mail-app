import { google } from "googleapis";
import type { EmailSummary, EmailDetail } from "@/types/email";

function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

function decodeBase64(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function getHeader(headers: any[], name: string): string {
  const header = headers?.find(
    (h: any) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value || "";
}

function extractBody(payload: any): { text: string; html: string } {
  let text = "";
  let html = "";

  if (payload.body?.data) {
    const decoded = decodeBase64(payload.body.data);
    if (payload.mimeType === "text/html") {
      html = decoded;
    } else {
      text = decoded;
    }
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        text = decodeBase64(part.body.data);
      } else if (part.mimeType === "text/html" && part.body?.data) {
        html = decodeBase64(part.body.data);
      } else if (part.parts) {
        const nested = extractBody(part);
        if (nested.text) text = nested.text;
        if (nested.html) html = nested.html;
      }
    }
  }

  return { text, html };
}

function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].replace(/"/g, "").trim(), email: match[2] };
  }
  return { name: from, email: from };
}

export async function listMessages(
  accessToken: string,
  options: {
    label?: string;
    query?: string;
    maxResults?: number;
    pageToken?: string;
  } = {}
): Promise<{ messages: EmailSummary[]; nextPageToken?: string }> {
  const gmail = getGmailClient(accessToken);
  const { label = "INBOX", query, maxResults = 20, pageToken } = options;

  const params: any = {
    userId: "me",
    maxResults,
  };

  if (label && !query) {
    params.labelIds = [label];
  }
  if (query) {
    params.q = query;
  }
  if (pageToken) {
    params.pageToken = pageToken;
  }

  const listRes = await gmail.users.messages.list(params);
  const messageIds = listRes.data.messages || [];
  const nextPageToken = listRes.data.nextPageToken || undefined;

  if (messageIds.length === 0) return { messages: [], nextPageToken: undefined };

  const results = await Promise.all(
    messageIds.map(async (msg: any) => {
      try {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "metadata",
          metadataHeaders: ["From", "Subject", "Date"],
        });

        const headers = detail.data.payload?.headers || [];
        const from = getHeader(headers, "From");
        const { name, email } = parseSender(from);

        return {
          id: detail.data.id!,
          threadId: detail.data.threadId!,
          sender: name,
          senderEmail: email,
          subject: getHeader(headers, "Subject") || "(no subject)",
          snippet: detail.data.snippet || "",
          date: getHeader(headers, "Date"),
          isRead: !detail.data.labelIds?.includes("UNREAD"),
          labels: detail.data.labelIds || [],
        } as EmailSummary;
      } catch {
        return null;
      }
    })
  );
  const messages = results.filter((m): m is EmailSummary => m !== null);

  return { messages, nextPageToken };
}

export async function getMessage(
  accessToken: string,
  messageId: string
): Promise<EmailDetail | null> {
  const gmail = getGmailClient(accessToken);

  let detail;
  try {
    detail = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });
  } catch {
    return null;
  }

  if (!detail?.data) return null;

  const headers = detail.data.payload?.headers || [];
  const from = getHeader(headers, "From");
  const { name, email } = parseSender(from);
  const { text, html } = extractBody(detail.data.payload);

  return {
    id: detail.data.id!,
    threadId: detail.data.threadId!,
    sender: name,
    senderEmail: email,
    to: getHeader(headers, "To"),
    cc: getHeader(headers, "Cc") || undefined,
    subject: getHeader(headers, "Subject") || "(no subject)",
    body: text || html,
    bodyHtml: html || undefined,
    date: getHeader(headers, "Date"),
    isRead: !detail.data.labelIds?.includes("UNREAD"),
    labels: detail.data.labelIds || [],
  };
}

export async function sendMessage(
  accessToken: string,
  options: {
    to: string;
    subject: string;
    body: string;
    inReplyTo?: string;
    threadId?: string;
  }
): Promise<{ id: string; threadId: string }> {
  const gmail = getGmailClient(accessToken);

  const emailLines = [
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
  ];

  if (options.inReplyTo) {
    emailLines.push(`In-Reply-To: ${options.inReplyTo}`);
    emailLines.push(`References: ${options.inReplyTo}`);
  }

  emailLines.push("", options.body);

  const raw = Buffer.from(emailLines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const params: any = {
    userId: "me",
    requestBody: { raw },
  };

  if (options.threadId) {
    params.requestBody.threadId = options.threadId;
  }

  const res = await gmail.users.messages.send(params);

  return {
    id: res.data.id!,
    threadId: res.data.threadId!,
  };
}

export async function modifyMessage(
  accessToken: string,
  messageId: string,
  options: { addLabels?: string[]; removeLabels?: string[] }
): Promise<void> {
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      addLabelIds: options.addLabels,
      removeLabelIds: options.removeLabels,
    },
  });
}

export async function setupPubSubWatch(accessToken: string, topicName: string) {
  const gmail = getGmailClient(accessToken);
  const res = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName,
      labelIds: ["INBOX"],
    },
  });
  return res.data;
}
