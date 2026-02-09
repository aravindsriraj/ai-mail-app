"use client";

import { useMailStore } from "@/lib/store";
import { useMailActions } from "@/hooks/use-mail-actions";
import { useMailContext } from "@/hooks/use-mail-context";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { SidebarNav } from "./sidebar-nav";
import { Inbox } from "./inbox";
import { Sent } from "./sent";
import { Compose } from "./compose";
import { EmailDetail } from "./email-detail";
import { SearchResults } from "./search-results";

export function MailApp() {
  const { currentView } = useMailStore();

  // Register CopilotKit frontend actions
  useMailActions();

  // Provide context to CopilotKit
  useMailContext();

  // Real-time email sync
  useRealtimeSync();

  const renderView = () => {
    switch (currentView) {
      case "inbox":
        return <Inbox />;
      case "sent":
        return <Sent />;
      case "compose":
        return <Compose />;
      case "detail":
        return <EmailDetail />;
      case "search":
        return <SearchResults />;
      default:
        return <Inbox />;
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <SidebarNav />
      <main className="flex-1 flex flex-col overflow-hidden border-r border-zinc-800">
        {renderView()}
      </main>
    </div>
  );
}
