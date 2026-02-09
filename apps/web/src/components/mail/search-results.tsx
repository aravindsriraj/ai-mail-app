"use client";

import { useMailStore } from "@/lib/store";
import { EmailList } from "./email-list";

export function SearchResults() {
  const { searchResults } = useMailStore();

  return (
    <EmailList
      emails={searchResults}
      title="Search Results"
      emptyMessage="No results found"
    />
  );
}
