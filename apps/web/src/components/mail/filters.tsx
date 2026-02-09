"use client";

import { useState, useEffect } from "react";
import { useMailStore } from "@/lib/store";
import { useGmail } from "@/hooks/use-gmail";
import { Filter, X } from "lucide-react";

export function Filters() {
  const { filters, setFilters, resetFilters, setInboxEmails, setInboxPageToken, setInboxQuery, setCurrentView } = useMailStore();
  const { fetchInbox } = useGmail();
  const [isOpen, setIsOpen] = useState(false);
  const [sender, setSender] = useState(filters.sender || "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom || "");
  const [dateTo, setDateTo] = useState(filters.dateTo || "");
  const [keyword, setKeyword] = useState(filters.keyword || "");
  const [unreadOnly, setUnreadOnly] = useState(filters.unreadOnly || false);

  // Sync local state when store filters change (e.g. agent applies filters)
  useEffect(() => {
    setSender(filters.sender || "");
    setDateFrom(filters.dateFrom || "");
    setDateTo(filters.dateTo || "");
    setKeyword(filters.keyword || "");
    setUnreadOnly(filters.unreadOnly || false);
  }, [filters]);

  const hasActiveFilters =
    filters.sender ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.keyword ||
    filters.unreadOnly;

  const activeFilterTags: { label: string; key: string }[] = [];
  if (filters.sender) activeFilterTags.push({ label: `From: ${filters.sender}`, key: "sender" });
  if (filters.keyword) activeFilterTags.push({ label: `Keyword: ${filters.keyword}`, key: "keyword" });
  if (filters.dateFrom) activeFilterTags.push({ label: `After: ${filters.dateFrom}`, key: "dateFrom" });
  if (filters.dateTo) activeFilterTags.push({ label: `Before: ${filters.dateTo}`, key: "dateTo" });
  if (filters.unreadOnly) activeFilterTags.push({ label: "Unread only", key: "unreadOnly" });

  const removeFilter = async (key: string) => {
    const updated = { ...filters, [key]: key === "unreadOnly" ? false : undefined };
    setFilters(updated);
    const hasAny = updated.sender || updated.dateFrom || updated.dateTo || updated.keyword || updated.unreadOnly;
    if (!hasAny) {
      resetFilters();
      await fetchInbox();
    }
  };

  const applyFilters = async () => {
    const newFilters = { sender, dateFrom, dateTo, keyword, unreadOnly };
    setFilters(newFilters);

    // Gmail after: is INCLUSIVE, before: is EXCLUSIVE
    // Dates must use YYYY/MM/DD format (dashes are ignored by Gmail)
    const toGmailDate = (d: string) => d.replace(/-/g, "/");
    const nextDay = (d: string) => {
      const dt = new Date(d + "T00:00:00");
      dt.setDate(dt.getDate() + 1);
      return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}`;
    };

    const queryParts: string[] = ["in:inbox category:primary"];
    if (sender) queryParts.push(`from:${sender}`);
    if (keyword) queryParts.push(keyword);
    if (unreadOnly) queryParts.push("is:unread");
    if (dateFrom) queryParts.push(`after:${toGmailDate(dateFrom)}`);
    if (dateTo) queryParts.push(`before:${nextDay(dateTo)}`);

    const query = queryParts.join(" ");
    try {
      const res = await fetch(`/api/gmail/messages?q=${encodeURIComponent(query)}&maxResults=100`);
      if (!res.ok) throw new Error("Failed to filter emails");
      const data = await res.json();
      setInboxEmails(data.messages || []);
      setInboxPageToken(data.nextPageToken);
      setInboxQuery(query);
      setCurrentView("inbox");
    } catch (error) {
      console.error("Failed to apply filters:", error);
    }
    setIsOpen(false);
  };

  const clearFilters = async () => {
    setSender("");
    setDateFrom("");
    setDateTo("");
    setKeyword("");
    setUnreadOnly(false);
    resetFilters();
    await fetchInbox();
    setIsOpen(false);
  };

  return (
    <div className="border-b border-zinc-800">
      <div className="flex items-center gap-2 px-4 py-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-800"
        >
          <Filter size={14} />
          Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Active filter badges */}
      {activeFilterTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {activeFilterTags.map((tag) => (
            <span
              key={tag.key}
              className="inline-flex items-center gap-1 text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full px-2.5 py-0.5"
            >
              {tag.label}
              <button
                onClick={() => removeFilter(tag.key)}
                className="hover:text-white transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="px-4 pb-3 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Sender</label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="e.g. john@example.com"
              className="w-full bg-zinc-800 text-sm text-white rounded px-2 py-1.5 border border-zinc-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Keyword</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search in emails"
              className="w-full bg-zinc-800 text-sm text-white rounded px-2 py-1.5 border border-zinc-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">From date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-zinc-800 text-sm text-white rounded px-2 py-1.5 border border-zinc-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">To date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-zinc-800 text-sm text-white rounded px-2 py-1.5 border border-zinc-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="col-span-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-700"
              />
              Unread only
            </label>
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded hover:bg-zinc-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={applyFilters}
                className="text-xs text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
