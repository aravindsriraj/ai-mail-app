"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { useMailStore } from "@/lib/store";
import { useGmail } from "@/hooks/use-gmail";
import { EmailListItem } from "./email-list-item";
import type { EmailSummary } from "@/types/email";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 20;

interface EmailListProps {
  emails: EmailSummary[];
  title: string;
  emptyMessage?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function EmailList({ emails, title, emptyMessage, onLoadMore, hasMore }: EmailListProps) {
  const { isLoading } = useMailStore();
  const { fetchEmailDetail } = useGmail();
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevEmailIdsRef = useRef<string>("");

  const totalPages = Math.max(1, Math.ceil(emails.length / ITEMS_PER_PAGE));

  // Clamp current page to valid range
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage) {
    setCurrentPage(safePage);
  }

  // Detect when the email list is replaced (filter/refresh) vs appended (load more)
  // by checking if the first few email IDs changed
  const currentFirstIds = emails.slice(0, 3).map((e) => e.id).join(",");
  if (prevEmailIdsRef.current && currentFirstIds !== prevEmailIdsRef.current) {
    // Email list was replaced (filter change, view switch) — reset to page 1
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }
  prevEmailIdsRef.current = currentFirstIds;

  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const pageEmails = emails.slice(startIdx, endIdx);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goToPage = useCallback((page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [totalPages]);

  const handlePrev = useCallback(() => {
    if (safePage > 1) goToPage(safePage - 1);
  }, [safePage, goToPage]);

  const handleNext = useCallback(async () => {
    if (safePage < totalPages) {
      goToPage(safePage + 1);
    } else if (hasMore && onLoadMore) {
      await onLoadMore();
      // After load more, new pages will be available on next render
      // Set to next page — it will be valid after emails update
      setCurrentPage(safePage + 1);
      scrollToTop();
    }
  }, [safePage, totalPages, hasMore, onLoadMore, goToPage, scrollToTop]);

  const handleEmailClick = useCallback(async (email: EmailSummary) => {
    await fetchEmailDetail(email.id);
  }, [fetchEmailDetail]);

  // Build page numbers to display
  const pageNumbers = useMemo((): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  if (isLoading && emails.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {emails.length} message{emails.length !== 1 ? "s" : ""}
            {totalPages > 1 && ` · Page ${safePage} of ${totalPages}`}
          </p>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
            {emptyMessage || "No emails found"}
          </div>
        ) : (
          pageEmails.map((email) => (
            <EmailListItem
              key={email.id}
              email={email}
              onClick={() => handleEmailClick(email)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/50 flex-shrink-0">
          <button
            onClick={handlePrev}
            disabled={safePage === 1}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          {pageNumbers.map((page, idx) =>
            page === "..." ? (
              <span key={`dots-${idx}`} className="px-1.5 text-xs text-zinc-600">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => goToPage(page as number)}
                className={`min-w-[28px] h-7 text-xs rounded transition-colors ${
                  page === safePage
                    ? "bg-blue-600 text-white font-medium"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={handleNext}
            disabled={safePage === totalPages && !hasMore}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-colors"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>

          {hasMore && safePage === totalPages && (
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className="ml-2 text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
