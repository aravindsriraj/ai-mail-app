"use client";

import { useMailStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Reply, Forward } from "lucide-react";

export function EmailDetail() {
  const { currentEmail, setCurrentView, setComposeData } = useMailStore();

  if (!currentEmail) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        Select an email to read
      </div>
    );
  }

  const initial = (currentEmail.sender?.[0] || "?").toUpperCase();

  const handleReply = () => {
    setComposeData({
      to: currentEmail.senderEmail,
      subject: currentEmail.subject.startsWith("Re:")
        ? currentEmail.subject
        : `Re: ${currentEmail.subject}`,
      body: `\n\n---\nOn ${currentEmail.date}, ${currentEmail.sender} wrote:\n${currentEmail.body}`,
      inReplyTo: currentEmail.id,
      threadId: currentEmail.threadId,
    });
    setCurrentView("compose");
  };

  const handleForward = () => {
    setComposeData({
      to: "",
      subject: currentEmail.subject.startsWith("Fwd:")
        ? currentEmail.subject
        : `Fwd: ${currentEmail.subject}`,
      body: `\n\n--- Forwarded message ---\nFrom: ${currentEmail.sender} <${currentEmail.senderEmail}>\nDate: ${currentEmail.date}\nSubject: ${currentEmail.subject}\n\n${currentEmail.body}`,
    });
    setCurrentView("compose");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 flex-shrink-0">
        <button
          onClick={() => setCurrentView("inbox")}
          className="text-zinc-400 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* Scrollable email content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-5">
          {/* Subject */}
          <h1 className="text-lg font-semibold text-white leading-snug mb-5">
            {currentEmail.subject}
          </h1>

          {/* Sender info */}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <span className="text-sm font-semibold text-white">
                    {currentEmail.sender}
                  </span>
                  <span className="text-xs text-zinc-500 ml-2">
                    &lt;{currentEmail.senderEmail}&gt;
                  </span>
                </div>
                <span className="text-xs text-zinc-500 flex-shrink-0 whitespace-nowrap">
                  {formatDate(currentEmail.date)}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                To: {currentEmail.to}
                {currentEmail.cc && (
                  <span className="ml-2">Cc: {currentEmail.cc}</span>
                )}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-800 mb-5" />

          {/* Body */}
          {currentEmail.bodyHtml ? (
            <div
              className="prose prose-invert max-w-none
                prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-sm prose-p:my-2
                prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white prose-strong:font-semibold
                prose-headings:text-white prose-headings:font-semibold
                prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
                prose-li:text-zinc-300 prose-li:text-sm
                prose-img:rounded-lg prose-img:max-w-full
                prose-blockquote:border-zinc-700 prose-blockquote:text-zinc-400
                prose-hr:border-zinc-800
                prose-table:text-sm prose-td:text-zinc-300 prose-th:text-zinc-200
                [&_*]:max-w-full [&_img]:h-auto
                text-sm text-zinc-300 leading-relaxed"
              style={{ colorScheme: "dark" }}
              dangerouslySetInnerHTML={{
                __html: currentEmail.bodyHtml.replace(
                  /<body/i,
                  '<body style="color:#d4d4d8 !important;background:transparent !important"'
                ) + `<style>
                  * { color: #d4d4d8 !important; }
                  a { color: #60a5fa !important; }
                  h1, h2, h3, h4, h5, h6, b, strong { color: #ffffff !important; }
                  table, td, th, tr, div, span, p, li, ul, ol, font { color: #d4d4d8 !important; background-color: transparent !important; }
                  img { max-width: 100%; height: auto; }
                </style>`,
              }}
            />
          ) : (
            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {currentEmail.body}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-6 pt-5 border-t border-zinc-800">
            <button
              onClick={handleReply}
              className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Reply size={15} />
              Reply
            </button>
            <button
              onClick={handleForward}
              className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Forward size={15} />
              Forward
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
