"use client";

import { useMailStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Inbox, Send, PenSquare, Search, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import type { MailView } from "@/types/email";

const navItems: { view: MailView; label: string; icon: React.ReactNode }[] = [
  { view: "inbox", label: "Inbox", icon: <Inbox size={18} /> },
  { view: "sent", label: "Sent", icon: <Send size={18} /> },
  { view: "compose", label: "Compose", icon: <PenSquare size={18} /> },
];

export function SidebarNav() {
  const { currentView, setCurrentView, inboxEmails, resetComposeData } =
    useMailStore();

  const unreadCount = inboxEmails.filter((e) => !e.isRead).length;

  return (
    <nav className="w-56 bg-zinc-950 border-r border-zinc-800 flex flex-col p-3 gap-1">
      <div className="px-3 py-4 mb-2">
        <h1 className="text-lg font-semibold text-white tracking-tight">
          AI Mail
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">Powered by CopilotKit</p>
      </div>

      {navItems.map((item) => (
        <button
          key={item.view}
          onClick={() => {
            setCurrentView(item.view);
            if (item.view === "compose") resetComposeData();
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            currentView === item.view
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          )}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          {item.view === "inbox" && unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </button>
      ))}

      {currentView === "search" && (
        <button
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-zinc-800 text-white"
          disabled
        >
          <Search size={18} />
          <span>Search Results</span>
        </button>
      )}

      <div className="mt-auto pt-2 border-t border-zinc-800">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 transition-colors w-full"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </nav>
  );
}
