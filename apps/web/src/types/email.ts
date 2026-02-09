export interface EmailSummary {
  id: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
  labels: string[];
}

export interface EmailDetail {
  id: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  date: string;
  isRead: boolean;
  labels: string[];
}

export interface ComposeData {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  threadId?: string;
}

export interface EmailFilters {
  sender?: string;
  dateFrom?: string;
  dateTo?: string;
  keyword?: string;
  unreadOnly?: boolean;
}

export type MailView = "inbox" | "sent" | "compose" | "detail" | "search";
