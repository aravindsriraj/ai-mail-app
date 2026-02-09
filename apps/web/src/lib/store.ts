import { create } from "zustand";
import type {
  EmailSummary,
  EmailDetail,
  ComposeData,
  EmailFilters,
  MailView,
} from "@/types/email";

interface MailStore {
  // View state
  currentView: MailView;
  setCurrentView: (view: MailView) => void;

  // Email lists
  inboxEmails: EmailSummary[];
  setInboxEmails: (emails: EmailSummary[]) => void;
  appendInboxEmails: (emails: EmailSummary[]) => void;
  inboxPageToken: string | undefined;
  setInboxPageToken: (token: string | undefined) => void;
  inboxQuery: string | undefined;
  setInboxQuery: (query: string | undefined) => void;
  sentEmails: EmailSummary[];
  setSentEmails: (emails: EmailSummary[]) => void;
  appendSentEmails: (emails: EmailSummary[]) => void;
  sentPageToken: string | undefined;
  setSentPageToken: (token: string | undefined) => void;
  searchResults: EmailSummary[];
  setSearchResults: (emails: EmailSummary[]) => void;

  // Current email detail
  currentEmail: EmailDetail | null;
  setCurrentEmail: (email: EmailDetail | null) => void;

  // Compose
  composeData: ComposeData;
  setComposeData: (data: Partial<ComposeData>) => void;
  resetComposeData: () => void;

  // Filters
  filters: EmailFilters;
  setFilters: (filters: EmailFilters) => void;
  resetFilters: () => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Refresh trigger
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const defaultComposeData: ComposeData = {
  to: "",
  subject: "",
  body: "",
};

export const useMailStore = create<MailStore>((set) => ({
  currentView: "inbox",
  setCurrentView: (view) => set({ currentView: view }),

  inboxEmails: [],
  setInboxEmails: (emails) => set({ inboxEmails: emails }),
  appendInboxEmails: (emails) =>
    set((state) => ({ inboxEmails: [...state.inboxEmails, ...emails] })),
  inboxPageToken: undefined,
  setInboxPageToken: (token) => set({ inboxPageToken: token }),
  inboxQuery: undefined,
  setInboxQuery: (query) => set({ inboxQuery: query }),
  sentEmails: [],
  setSentEmails: (emails) => set({ sentEmails: emails }),
  appendSentEmails: (emails) =>
    set((state) => ({ sentEmails: [...state.sentEmails, ...emails] })),
  sentPageToken: undefined,
  setSentPageToken: (token) => set({ sentPageToken: token }),
  searchResults: [],
  setSearchResults: (emails) => set({ searchResults: emails }),

  currentEmail: null,
  setCurrentEmail: (email) => set({ currentEmail: email }),

  composeData: { ...defaultComposeData },
  setComposeData: (data) =>
    set((state) => ({
      composeData: { ...state.composeData, ...data },
    })),
  resetComposeData: () => set({ composeData: { ...defaultComposeData } }),

  filters: {},
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: {} }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  refreshTrigger: 0,
  triggerRefresh: () =>
    set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));
